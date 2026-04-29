import { randomBytes } from 'node:crypto';

/**
 * BLE-132 — stable, support-friendly id surfaced in the 403 body of a
 * sealed transcript. Format: `{4HEX}-{YYYY-MM-DD-HH-MM}` in UTC, e.g.
 * `A8F2-2026-04-29-09-47`. Random prefix prevents two relationships
 * sealed in the same minute from colliding in a support ticket.
 */
export function generateSealAuditId(at: Date = new Date()): string {
  const prefix = randomBytes(2).toString('hex').toUpperCase();
  const yyyy = at.getUTCFullYear().toString().padStart(4, '0');
  const mm = (at.getUTCMonth() + 1).toString().padStart(2, '0');
  const dd = at.getUTCDate().toString().padStart(2, '0');
  const hh = at.getUTCHours().toString().padStart(2, '0');
  const mi = at.getUTCMinutes().toString().padStart(2, '0');
  return `${prefix}-${yyyy}-${mm}-${dd}-${hh}-${mi}`;
}
