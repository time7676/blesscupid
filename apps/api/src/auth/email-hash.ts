import { createHash } from 'node:crypto';

/**
 * Deterministic SHA-256 of a normalized email address.
 *
 * Used by audit-only paths that must NOT retain raw email PII (e.g.,
 * `OnboardingRejection.emailHash` after a Q3 same-sex hard-reject —
 * see plan `~/.claude/plans/i-think-we-need-misty-eclipse.md` §"Q3
 * hard-reject = HARD-DELETE User row immediately"). Keep normalization
 * cheap and idempotent: trim + lowercase. Hex digest.
 */
export function hashEmail(email: string): string {
  const normalized = email.normalize('NFKC').trim().toLowerCase();
  return createHash('sha256').update(normalized).digest('hex');
}
