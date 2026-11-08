import test from 'node:test';
import assert from 'node:assert/strict';
import {
  deliverDrrmVoucherWebhook,
  isVoucherGrantStatus,
  resolveDrrmWebhookUrl
} from './drrmWebhook.js';

function createMockDb() {
  const queries = [];
  return {
    queries,
    async query(sql, params) {
      queries.push({ sql: sql.trim(), params });
      return { rows: [], rowCount: 1 };
    }
  };
}

test('1. Successful callback sends exact contract payload and headers and records status as sent', async () => {
  const mockDb = createMockDb();
  const capturedRequests = [];

  const mockFetch = async (url, init) => {
    capturedRequests.push({ url, init, body: JSON.parse(init.body) });
    return {
      status: 200,
      ok: true,
      async json() {
        return { success: true };
      }
    };
  };

  const sampleRecord = {
    id: 15,
    reference_no: '143f8c9a-a955-4ccc-a56b-0a555ffb0b33',
    voucher_no: 'MV-2026-0015',
    status: 'Approved & Voucher Issued',
    granted_at: '2026-11-08T06:45:00.000Z',
    webhook_event_id: '7262c6f2-b973-43ac-bca2-9554f381dd4a',
    webhook_delivery_status: 'pending'
  };

  const result = await deliverDrrmVoucherWebhook(sampleRecord, {
    dbPool: mockDb,
    fetchImpl: mockFetch,
    env: {
      DRRM_VOUCHER_WEBHOOK_URL: 'https://drrm-mock.example.com',
      DRRM_VOUCHER_WEBHOOK_API_KEY: 'test-secret-key-123'
    }
  });

  assert.equal(result.triggered, true);
  assert.equal(result.status, 'sent');
  assert.equal(result.httpStatus, 200);
  assert.equal(capturedRequests.length, 1);

  const req = capturedRequests[0];
  assert.equal(req.url, 'https://drrm-mock.example.com/api/v1/aics/voucher-status');
  assert.equal(req.init.method, 'POST');
  assert.equal(req.init.headers['Content-Type'], 'application/json');
  assert.equal(req.init.headers['X-API-Key'], 'test-secret-key-123');

  assert.deepEqual(req.body, {
    event_id: '7262c6f2-b973-43ac-bca2-9554f381dd4a',
    event_type: 'medical_voucher.granted',
    reference_no: '143f8c9a-a955-4ccc-a56b-0a555ffb0b33',
    appointment_id: 15,
    voucher_no: 'MV-2026-0015',
    status: 'Granted',
    granted_at: '2026-11-08T06:45:00.000Z'
  });
});

test('2. Non-grant statuses (scheduled or without voucher) do not trigger callback', async () => {
  let called = false;
  const mockFetch = async () => {
    called = true;
    return { status: 200, async json() { return { success: true }; } };
  };

  assert.equal(isVoucherGrantStatus('Pending Schedule'), false);
  assert.equal(isVoucherGrantStatus('Interview Scheduled'), false);
  assert.equal(isVoucherGrantStatus('Approved'), false);
  assert.equal(isVoucherGrantStatus('Approved & Voucher Issued'), true);

  const scheduledOnly = await deliverDrrmVoucherWebhook(
    {
      id: 16,
      reference_no: 'DRRM-2026-8842',
      voucher_no: null,
      status: 'Interview Scheduled'
    },
    { fetchImpl: mockFetch, env: { DRRM_VOUCHER_WEBHOOK_URL: 'https://drrm-mock.example.com' } }
  );

  assert.equal(scheduledOnly.triggered, false);
  assert.equal(called, false);
});

test('3. Duplicate trigger is ignored when already sent, and manual resend reuses exact event_id and reference_no', async () => {
  const calls = [];
  const mockFetch = async (url, init) => {
    calls.push(JSON.parse(init.body));
    return { status: 200, async json() { return { success: true }; } };
  };

  const alreadySentRecord = {
    id: 15,
    reference_no: '143f8c9a-a955-4ccc-a56b-0a555ffb0b33',
    voucher_no: 'MV-2026-0015',
    status: 'Approved & Voucher Issued',
    granted_at: '2026-11-08T06:45:00.000Z',
    webhook_event_id: '7262c6f2-b973-43ac-bca2-9554f381dd4a',
    webhook_delivery_status: 'sent'
  };

  const dupResult = await deliverDrrmVoucherWebhook(alreadySentRecord, {
    fetchImpl: mockFetch,
    env: { DRRM_VOUCHER_WEBHOOK_URL: 'https://drrm-mock.example.com' }
  });

  assert.equal(dupResult.triggered, false);
  assert.equal(dupResult.reason, 'duplicate_trigger_ignored');
  assert.equal(calls.length, 0);

  const resendResult = await deliverDrrmVoucherWebhook(alreadySentRecord, {
    fetchImpl: mockFetch,
    forceResend: true,
    env: { DRRM_VOUCHER_WEBHOOK_URL: 'https://drrm-mock.example.com' }
  });

  assert.equal(resendResult.triggered, true);
  assert.equal(resendResult.status, 'sent');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].event_id, '7262c6f2-b973-43ac-bca2-9554f381dd4a');
  assert.equal(calls[0].reference_no, '143f8c9a-a955-4ccc-a56b-0a555ffb0b33');
  assert.equal(calls[0].voucher_no, 'MV-2026-0015');
});

test('4. Timeout aborts request and records failed status while preserving same event_id across bounded retry', async () => {
  const mockDb = createMockDb();
  const attemptedBodies = [];

  const slowFetch = async (url, init) => {
    attemptedBodies.push(JSON.parse(init.body));
    return new Promise((resolve, reject) => {
      init.signal.addEventListener('abort', () => {
        const abortErr = new Error('The operation was aborted');
        abortErr.name = 'AbortError';
        reject(abortErr);
      });
    });
  };

  const record = {
    id: 20,
    reference_no: 'DRRM-TIMEOUT-01',
    voucher_no: 'MV-2026-0020',
    status: 'Approved & Voucher Issued',
    granted_at: '2026-11-08T06:45:00.000Z'
  };

  const result = await deliverDrrmVoucherWebhook(record, {
    dbPool: mockDb,
    fetchImpl: slowFetch,
    timeoutMs: 30,
    maxRetries: 1,
    retryDelayMs: 10,
    env: {
      DRRM_VOUCHER_WEBHOOK_URL: 'https://drrm-mock.example.com/api/v1/aics/voucher-status',
      DRRM_VOUCHER_WEBHOOK_API_KEY: 'valid-key'
    }
  });

  assert.equal(result.triggered, true);
  assert.equal(result.status, 'failed');
  assert.equal(result.attempts, 2);
  assert.match(result.error, /timed out/i);
  assert.equal(attemptedBodies.length, 2);
  assert.equal(attemptedBodies[0].event_id, attemptedBodies[1].event_id);
  assert.equal(attemptedBodies[0].reference_no, 'DRRM-TIMEOUT-01');
});

test('5. Invalid API key (HTTP 401) records failed status immediately without retrying', async () => {
  let callCount = 0;
  const mockFetch = async () => {
    callCount++;
    return {
      status: 401,
      ok: false,
      statusText: 'Unauthorized',
      async json() {
        return { success: false, error: 'Invalid API key' };
      }
    };
  };

  const result = await deliverDrrmVoucherWebhook(
    {
      id: 21,
      reference_no: 'DRRM-AUTH-FAIL-01',
      voucher_no: 'MV-2026-0021',
      status: 'Approved & Voucher Issued',
      granted_at: '2026-11-08T06:45:00.000Z'
    },
    {
      fetchImpl: mockFetch,
      maxRetries: 2,
      env: {
        DRRM_VOUCHER_WEBHOOK_URL: 'https://drrm-mock.example.com/api/v1/aics/voucher-status',
        DRRM_VOUCHER_WEBHOOK_API_KEY: 'wrong-key'
      }
    }
  );

  assert.equal(result.triggered, true);
  assert.equal(result.status, 'failed');
  assert.equal(result.httpStatus, 401);
  assert.equal(callCount, 1);
});

test('6. Unavailable receiver and unconfigured URL keep voucher grant intact (pending / failed)', async () => {
  const unconfiguredResult = await deliverDrrmVoucherWebhook(
    {
      id: 22,
      reference_no: 'DRRM-PENDING-01',
      voucher_no: 'MV-2026-0022',
      status: 'Approved & Voucher Issued',
      granted_at: '2026-11-08T06:45:00.000Z'
    },
    {
      env: {
        DRRM_VOUCHER_WEBHOOK_URL: '',
        DRRM_VOUCHER_WEBHOOK_API_KEY: ''
      }
    }
  );

  assert.equal(unconfiguredResult.triggered, false);
  assert.equal(unconfiguredResult.status, 'pending');
  assert.equal(unconfiguredResult.reason, 'webhook_url_not_configured');

  const downFetch = async () => {
    throw new Error('connect ECONNREFUSED 127.0.0.1:8080');
  };

  const downResult = await deliverDrrmVoucherWebhook(
    {
      id: 23,
      reference_no: 'DRRM-DOWN-01',
      voucher_no: 'MV-2026-0023',
      status: 'Approved & Voucher Issued',
      granted_at: '2026-11-08T06:45:00.000Z'
    },
    {
      fetchImpl: downFetch,
      maxRetries: 1,
      retryDelayMs: 5,
      env: {
        DRRM_VOUCHER_WEBHOOK_URL: 'https://drrm-mock.example.com',
        DRRM_VOUCHER_WEBHOOK_API_KEY: 'key'
      }
    }
  );

  assert.equal(downResult.triggered, true);
  assert.equal(downResult.status, 'failed');
  assert.equal(downResult.attempts, 2);
  assert.match(downResult.error, /ECONNREFUSED/);
  assert.equal(resolveDrrmWebhookUrl('https://drrm-mock.example.com'), 'https://drrm-mock.example.com/api/v1/aics/voucher-status');
});
