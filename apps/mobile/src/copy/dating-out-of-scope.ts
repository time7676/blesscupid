/**
 * BLE-63 / Moderation Playbook v1, §4.2 — out-of-scope copy.
 *
 * Pastor-owned content. Copy text below is the canonical wording from the
 * signed-off Moderation Playbook (BLE-42 / 2026-04-28, CEO sign-off the
 * same day). Engineer wires the surface that displays it; Pastor edits the
 * source text in place via PR with `pastor` reviewer and updates
 * `pastorReviewedAt` to today.
 *
 * Trigger conditions per HCoC §4.2: shown to a user whose declared gender
 * + interest combination falls outside v1's man↔woman matching scope.
 *
 * Tone constraints (HCoC §5.1, Playbook §5):
 *   - No condemnation.
 *   - No scripture-throwing.
 *   - No waitlist promise.
 *   - Honest, brief, respectful.
 */

export interface DatingOutOfScopeCopy {
  /** Single block of body text shown to the user. Pastor-owned. */
  readonly body: string;
  /** ISO date of last Pastor sign-off. Bumped on every edit. */
  readonly pastorReviewedAt: string;
  /** HCoC clause this copy is grounded in. Surfaced in the analytics event. */
  readonly hcocSection: '4.2';
}

export const datingOutOfScope: DatingOutOfScopeCopy = {
  body:
    "v1 of BlessCupid only matches men with women. We're not the right fit for what you're looking for, and we don't want to waste your time.",
  pastorReviewedAt: '2026-04-28',
  hcocSection: '4.2',
};
