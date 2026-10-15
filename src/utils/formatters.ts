// ---------------------------------------------------------------------------
// Dates — everything is a *local* calendar day (YYYY-MM-DD). Using toISOString()
// would give the UTC day, which is wrong for a few hours every day outside UTC.
// ---------------------------------------------------------------------------

export function toLocalISODate(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Local calendar day `days` from now (calendar arithmetic, safe across DST / Ramadan clock shifts). */
export function addDaysISO(days: number, from: Date = new Date()): string {
  return toLocalISODate(new Date(from.getFullYear(), from.getMonth(), from.getDate() + days));
}

/** Normalises a YYYY-MM-DD or full ISO timestamp to a local YYYY-MM-DD key. */
function toDateKey(value: string): string | null {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? null : toLocalISODate(parsed);
}

export function formatDate(dateString: string): string {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString.includes('T') ? dateString : `${dateString}T00:00:00`);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function isOverdue(dateString: string): boolean {
  const key = toDateKey(dateString);
  return key !== null && key < toLocalISODate();
}

export function isDueToday(dateString: string): boolean {
  const key = toDateKey(dateString);
  return key !== null && key === toLocalISODate();
}

// ---------------------------------------------------------------------------
// Money
// ---------------------------------------------------------------------------

// Currencies that are written after the amount ("1 200,00 DH").
const SUFFIX_SYMBOLS = new Set(['DH', 'MAD', 'DA', 'DT', 'FCFA']);

export function formatCurrency(amount: number, symbol: string = '$'): string {
  const value = typeof amount === 'number' && isFinite(amount) ? amount : 0;
  const suffix = SUFFIX_SYMBOLS.has(symbol.trim().toUpperCase());
  const body = Math.abs(value).toLocaleString(suffix ? 'fr-FR' : 'en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const sign = value < 0 ? '-' : '';
  return suffix ? `${sign}${body} ${symbol}` : `${sign}${symbol}${body}`;
}

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function safeDiv(numerator: number, denominator: number): number {
  if (!denominator || isNaN(denominator) || denominator === 0) return 0;
  if (!numerator || isNaN(numerator)) return 0;
  return (numerator / denominator) * 100;
}

// ---------------------------------------------------------------------------
// Phone / WhatsApp / email
// ---------------------------------------------------------------------------

/**
 * Sanitizes phone numbers by stripping non-digit characters.
 * Retains leading plus sign if present for international numbers.
 */
export function sanitizePhone(phone: string): string {
  if (!phone) return '';
  const trimmed = phone.trim();
  const hasPlus = trimmed.startsWith('+');
  const digitsOnly = trimmed.replace(/\D/g, '');
  return hasPlus ? `+${digitsOnly}` : digitsOnly;
}

/**
 * Converts whatever the user typed into the digits-only international form WhatsApp expects.
 *   "06 12 34 56 78"      (cc 212) -> 212612345678
 *   "+212 (0)6 12 34 56 78"        -> 212612345678
 *   "00212612345678"               -> 212612345678
 *   "612345678"           (cc 212) -> 212612345678
 * Returns null when the result cannot be a real number.
 */
export function toInternationalDigits(phone: string, defaultCountryCode: string = '212'): string | null {
  if (!phone) return null;
  const cc = (defaultCountryCode || '').replace(/\D/g, '');
  const raw = phone.trim();
  const hasPlus = raw.startsWith('+');
  let digits = raw.replace(/\D/g, '');
  if (!digits) return null;

  if (hasPlus) {
    // already international
  } else if (digits.startsWith('00')) {
    digits = digits.slice(2);
  } else if (digits.startsWith('0')) {
    digits = cc + digits.slice(1);
  } else if (cc && !(digits.startsWith(cc) && digits.length >= cc.length + 8)) {
    digits = cc + digits;
  }

  // "+212 (0)6…" — drop the national trunk zero that people leave inside international numbers.
  if (cc && digits.startsWith(cc + '0')) {
    digits = cc + digits.slice(cc.length + 1);
  }

  return digits.length >= 8 && digits.length <= 15 ? digits : null;
}

export function getWhatsAppUrl(phone: string, text: string, defaultCountryCode: string = '212'): string | null {
  const international = toInternationalDigits(phone, defaultCountryCode);
  if (!international) return null;
  return `https://wa.me/${international}?text=${encodeURIComponent(text)}`;
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((email || '').trim());
}

export function getMailtoUrl(email: string, subject: string, body: string): string | null {
  if (!isValidEmail(email)) return null;
  return `mailto:${email.trim()}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

// ---------------------------------------------------------------------------
// Quote numbering
// ---------------------------------------------------------------------------

/** Next free `LC-YYYY-NNN`, one above the highest number already used this year (never reuses a deleted number). */
export function nextQuoteNumber(existingNumbers: string[], now: Date = new Date()): string {
  const year = now.getFullYear();
  const re = new RegExp(`^LC-${year}-(\\d+)$`);
  let max = 0;
  for (const n of existingNumbers) {
    const m = re.exec(n.trim());
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  let candidate = max + 1;
  const taken = new Set(existingNumbers.map((n) => n.trim()));
  let label = `LC-${year}-${String(candidate).padStart(3, '0')}`;
  while (taken.has(label)) {
    candidate += 1;
    label = `LC-${year}-${String(candidate).padStart(3, '0')}`;
  }
  return label;
}
