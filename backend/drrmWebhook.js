import crypto from 'crypto';

export const DRRM_DEFAULT_RECEIVER_PATH = '/api/v1/aics/voucher-status';
export const DRRM_WEBHOOK_TIMEOUT_MS = 10000;

/**
 * Determines whether a status represents an actual medical voucher grant.
 * Scheduling or plain approval without voucher issuance does NOT trigger the webhook.
 */
export function isVoucherGrantStatus(status) {
  if (!status || typeof status !== 'string') return false;
  const normalized = status.trim().toUpperCase();
  return (
    normalized === 'APPROVED & VOUCHER ISSUED' ||
    normalized === 'GRANTED' ||
    normalized === 'VOUCHER GRANTED' ||
    normalized === 'VOUCHER ISSUED'
  );
}

/**
 * Resolves the target DRRM webhook URL from environment configuration.
 * If only a base origin is provided (e.g. https://drrm.example.com), appends /api/v1/aics/voucher-status.
 */
export function resolveDrrmWebhookUrl(rawUrl) {
  const trimmed = typeof rawUrl === 'string' ? rawUrl.trim() : '';
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    if (!parsed.pathname || parsed.pathname === '/') {
      parsed.pathname = DRRM_DEFAULT_RECEIVER_PATH;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * Builds the exact JSON payload required by the DRRM receiver contract.
 */
export function buildDrrmVoucherWebhookPayload(record) {
  const grantedAtIso =
    record.granted_at instanceof Date
      ? record.granted_at.toISOString()
      : typeof record.granted_at === 'string' && record.granted_at.trim() !== ''
      ? new Date(record.granted_at).toISOString()
      : new Date().toISOString();

  return {
    event_id: record.webhook_event_id,
    event_type: 'medical_voucher.granted',
    reference_no: String(record.reference_no),
    appointment_id: Number(record.id),
    voucher_no: String(record.voucher_no),
    status: 'Granted',
    granted_at: grantedAtIso
  };
}

/**
 * Sends the outbound medical_voucher.granted webhook to DRRM with a 10-second timeout,
 * idempotent event_id persistence, and bounded retries.
 */
export async function deliverDrrmVoucherWebhook(record, options = {}) {
  const {
    dbPool = null,
    fetchImpl = globalThis.fetch,
    env = process.env,
    timeoutMs = DRRM_WEBHOOK_TIMEOUT_MS,
    maxRetries = 1,
    retryDelayMs = 200,
    forceResend = false
  } = options;

  if (!record || !record.reference_no) {
    return { triggered: false, status: 'skipped', reason: 'missing_reference_no' };
  }

  const hasVoucher = Boolean(record.voucher_no && String(record.voucher_no).trim() !== '');
  if (!hasVoucher || !isVoucherGrantStatus(record.status)) {
    return { triggered: false, status: 'skipped', reason: 'voucher_not_granted' };
  }

  if (record.webhook_delivery_status === 'sent' && !forceResend) {
    return {
      triggered: false,
      status: 'sent',
      reason: 'duplicate_trigger_ignored',
      event_id: record.webhook_event_id,
      reference_no: record.reference_no
    };
  }

  const eventId = record.webhook_event_id || crypto.randomUUID();
  const grantedAtIso = record.granted_at
    ? new Date(record.granted_at).toISOString()
    : new Date().toISOString();

  const enrichedRecord = {
    ...record,
    webhook_event_id: eventId,
    granted_at: grantedAtIso
  };

  // Persist event_id, granted_at, and initial 'pending' state before attempting outbound call
  if (dbPool) {
    try {
      await dbPool.query(
        `
          UPDATE drrm_appointments
          SET
            webhook_event_id = COALESCE(webhook_event_id, $1),
            granted_at = COALESCE(granted_at, $2),
            webhook_delivery_status = COALESCE(webhook_delivery_status, 'pending')
          WHERE id = $3;
        `,
        [eventId, grantedAtIso, record.id]
      );
    } catch (dbErr) {
      console.warn('Warning saving initial DRRM webhook state:', dbErr.message);
    }
  }

  const payload = buildDrrmVoucherWebhookPayload(enrichedRecord);
  const webhookUrl = resolveDrrmWebhookUrl(env?.DRRM_VOUCHER_WEBHOOK_URL);
  const apiKey = typeof env?.DRRM_VOUCHER_WEBHOOK_API_KEY === 'string'
    ? env.DRRM_VOUCHER_WEBHOOK_API_KEY.trim()
    : '';

  if (!webhookUrl) {
    if (dbPool) {
      try {
        await dbPool.query(
          `
            UPDATE drrm_appointments
            SET
              webhook_delivery_status = 'pending',
              webhook_last_error = $1
            WHERE id = $2;
          `,
          ['DRRM_VOUCHER_WEBHOOK_URL not configured', record.id]
        );
      } catch {}
    }
    return {
      triggered: false,
      status: 'pending',
      reason: 'webhook_url_not_configured',
      event_id: eventId,
      payload
    };
  }

  const totalAttempts = Math.max(1, 1 + Number(maxRetries || 0));
  let lastError = null;
  let lastHttpStatus = null;
  let attemptsMade = 0;

  for (let attempt = 1; attempt <= totalAttempts; attempt++) {
    attemptsMade = attempt;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetchImpl(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      lastHttpStatus = response.status;
      let bodyData = null;
      try {
        bodyData = await response.json();
      } catch {
        bodyData = null;
      }

      if (response.status === 200 && bodyData && bodyData.success === true) {
        if (dbPool) {
          try {
            await dbPool.query(
              `
                UPDATE drrm_appointments
                SET
                  webhook_delivery_status = 'sent',
                  webhook_attempts = COALESCE(webhook_attempts, 0) + $1,
                  webhook_last_attempt_at = NOW(),
                  webhook_last_error = NULL
                WHERE id = $2;
              `,
              [attemptsMade, record.id]
            );
          } catch {}
        }

        return {
          triggered: true,
          status: 'sent',
          httpStatus: 200,
          attempts: attemptsMade,
          event_id: eventId,
          payload
        };
      }

      lastError = `HTTP ${response.status}: ${
        bodyData ? JSON.stringify(bodyData) : response.statusText || 'Unexpected response'
      }`;

      // Do not retry on authentication / invalid API key errors (401 / 403) or 4xx client errors
      if (response.status >= 400 && response.status < 500) {
        break;
      }
    } catch (err) {
      if (err && (err.name === 'AbortError' || err.name === 'TimeoutError')) {
        lastError = `Request timed out after ${timeoutMs}ms`;
      } else {
        lastError = err?.message || 'Network or receiver unavailable error';
      }
    } finally {
      clearTimeout(timer);
    }

    if (attempt < totalAttempts && retryDelayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
    }
  }

  if (dbPool) {
    try {
      await dbPool.query(
        `
          UPDATE drrm_appointments
          SET
            webhook_delivery_status = 'failed',
            webhook_attempts = COALESCE(webhook_attempts, 0) + $1,
            webhook_last_attempt_at = NOW(),
            webhook_last_error = $2
          WHERE id = $3;
        `,
        [attemptsMade, lastError, record.id]
      );
    } catch {}
  }

  return {
    triggered: true,
    status: 'failed',
    httpStatus: lastHttpStatus,
    attempts: attemptsMade,
    error: lastError,
    event_id: eventId,
    payload
  };
}
