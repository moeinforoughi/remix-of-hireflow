// Persian (Farsi) display helpers. Underlying values stay numeric/ISO — only the
// rendered string is localized.

const FA_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

export function toFaDigits(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  return String(value).replace(/[0-9]/g, (d) => FA_DIGITS[Number(d)]);
}

export function formatFaNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '';
  return toFaDigits(value.toLocaleString('en-US'));
}

export function formatFaDate(input: string | Date | null | undefined): string {
  if (!input) return '';
  try {
    const d = typeof input === 'string' ? new Date(input) : input;
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(d);
  } catch {
    return '';
  }
}

export function formatFaDateTime(input: string | Date | null | undefined): string {
  if (!input) return '';
  try {
    const d = typeof input === 'string' ? new Date(input) : input;
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return '';
  }
}

export function formatFaCurrency(value: number | null | undefined, currency = 'IRR'): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '';
  const formatted = value.toLocaleString('en-US');
  return `${toFaDigits(formatted)} ${currency === 'IRR' ? 'ریال' : currency}`;
}
