/**
 * Phone normalization (Postel principle: be liberal in what you accept).
 * Default country = ID (+62). Strips spaces, dashes, parens. Accepts:
 *   "0812-345-6789" → "+6281234567890"
 *   "812 345 6789"  → "+6281234567890"
 *   "+62 812 ..."   → "+6281234567890"
 */
export function normalizePhoneId(raw: string): string | null {
  if (!raw) return null;
  let s = raw.replace(/[\s\-()]/g, '');
  if (s.startsWith('00')) s = '+' + s.slice(2);
  if (s.startsWith('+62')) {
    return /^\+62\d{8,12}$/.test(s) ? s : null;
  }
  if (s.startsWith('0')) s = s.slice(1);
  s = s.replace(/^62/, '');
  if (!/^\d{8,12}$/.test(s)) return null;
  return `+62${s}`;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const isEmail = (v: string) => EMAIL_RE.test(v.trim());

export const isOtpComplete = (v: string, length = 6) =>
  /^\d+$/.test(v) && v.length === length;

export const charsRemaining = (v: string, max: number) => max - (v?.length ?? 0);
