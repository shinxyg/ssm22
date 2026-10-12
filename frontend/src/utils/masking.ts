// Utility helper for Data Masking & Audit Logging across GovServe Admin Portal

export function maskPhoneNumber(phone?: string, enabled = true): string {
  if (!phone || phone === 'N/A') return 'N/A';
  if (!enabled) return phone;

  const clean = phone.replace(/\D/g, '');
  if (clean.length === 11) {
    // 09155582122 -> 0915-***-2122
    return `${clean.slice(0, 4)}-***-${clean.slice(7)}`;
  }
  if (clean.length >= 7) {
    return `${clean.slice(0, 3)}****${clean.slice(-3)}`;
  }
  return '****';
}

export function maskEmail(email?: string, enabled = true): string {
  if (!email || email === 'N/A') return 'N/A';
  if (!enabled) return email;

  const parts = email.split('@');
  if (parts.length !== 2) return '****@***';
  const name = parts[0];
  const domain = parts[1];

  if (name.length <= 2) {
    return `${name[0]}*@${domain}`;
  }
  return `${name[0]}***${name.slice(-2)}@${domain}`;
}

export function maskIdNumber(id?: string, enabled = true): string {
  if (!id || id === 'N/A') return 'N/A';
  if (!enabled) return id;

  const segments = id.split('-');
  if (segments.length >= 3) {
    return `${segments[0]}-${segments[1]}-${'*'.repeat(4)}-${segments[segments.length - 1]}`;
  }
  if (id.length > 8) {
    return `${id.slice(0, 4)}****${id.slice(-4)}`;
  }
  return `${id.slice(0, 2)}****`;
}

export function maskAddressHouseStreet(houseNo?: string, street?: string, enabled = true): { houseNo: string; street: string } {
  if (!enabled) {
    return { houseNo: houseNo || 'N/A', street: street || 'N/A' };
  }
  return {
    houseNo: houseNo ? '***' : 'N/A',
    street: street ? '**' : 'N/A'
  };
}

export function maskName(fullName?: string, enabled = true): string {
  if (!fullName || fullName === 'N/A') return 'N/A';
  if (!enabled) return fullName;

  const words = fullName.trim().split(/\s+/);
  return words
    .map(w => {
      if (w.length <= 2) return `${w[0]}*`;
      return `${w[0]}${'*'.repeat(w.length - 2)}${w[w.length - 1]}`;
    })
    .join(' ');
}

export function maskAccountNo(acc?: string, enabled = true): string {
  if (!acc || acc === 'N/A') return 'N/A';
  if (!enabled) return acc;

  const clean = acc.replace(/\s+/g, '');
  if (clean.length >= 10) {
    return `${clean.slice(0, 4)}-***-${clean.slice(-4)}`;
  }
  return `****-${clean.slice(-4)}`;
}

export function maskDateOfBirth(dob?: string, enabled = true): string {
  if (!dob || dob === 'N/A') return 'N/A';
  if (!enabled) return dob;

  if (dob.includes('-')) {
    const parts = dob.split('-');
    return `****-${parts[1] || '01'}-${parts[2] || '01'}`;
  }
  return '****-**-**';
}

// Log Data Unmask / Privacy Reveal events into Backend Activity Log DB
export async function logDataUnmaskEvent(
  module: string,
  details: string,
  referenceNo?: string,
  staffName = 'System Admin'
) {
  try {
    await fetch('http://localhost:5000/api/activity-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        staff_name: staffName,
        action: 'Data Unmasking / Privacy Reveal',
        module,
        details,
        reference_no: referenceNo || null
      })
    });
  } catch (err) {
    console.error('Failed to log data unmasking audit record:', err);
  }
}
