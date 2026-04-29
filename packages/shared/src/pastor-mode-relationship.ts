// BLE-131 — Pastor-mode relationship/invitation pure logic.
//
// This module contains ONLY pure functions describing the 1:1 audited-side
// rule. The NestJS service layer wraps these in a serializable transaction
// and pairs the application check with a partial unique index on the DB.
//
// Doctrinal anchor: Yohanes 10 — one shepherd's voice at a time on the
// audited side. Pastor side has no such cap (a shepherd may walk beside
// many disciples).

export const PASTOR_MODE_RELATIONSHIP_VERSION = '2026-04-29';

// === Status enum mirror ==================================================
//
// Mirrors the Prisma enum `PastorModeRelationshipStatus`. Re-declared here
// so the shared package has zero runtime dependency on @prisma/client.
// Keep in sync with apps/api/prisma/schema.prisma.

export const PASTOR_MODE_RELATIONSHIP_STATUS = {
  pending: 'pending',
  active: 'active',
  ended_by_audited: 'ended_by_audited',
  ended_by_pastor: 'ended_by_pastor',
  declined_by_audited: 'declined_by_audited',
  expired: 'expired',
} as const;

export type PastorModeRelationshipStatus =
  (typeof PASTOR_MODE_RELATIONSHIP_STATUS)[keyof typeof PASTOR_MODE_RELATIONSHIP_STATUS];

export const ACTIVE_PASTOR_MODE_STATUSES = [
  PASTOR_MODE_RELATIONSHIP_STATUS.active,
] as const satisfies readonly PastorModeRelationshipStatus[];

export const CLOSED_PASTOR_MODE_STATUSES = [
  PASTOR_MODE_RELATIONSHIP_STATUS.ended_by_audited,
  PASTOR_MODE_RELATIONSHIP_STATUS.ended_by_pastor,
  PASTOR_MODE_RELATIONSHIP_STATUS.declined_by_audited,
  PASTOR_MODE_RELATIONSHIP_STATUS.expired,
] as const satisfies readonly PastorModeRelationshipStatus[];

export function isActiveStatus(s: PastorModeRelationshipStatus): boolean {
  return (ACTIVE_PASTOR_MODE_STATUSES as readonly string[]).includes(s);
}

export function isClosedStatus(s: PastorModeRelationshipStatus): boolean {
  return (CLOSED_PASTOR_MODE_STATUSES as readonly string[]).includes(s);
}

// === Acceptance gate (Surface 2) =========================================
//
// Called when the audited user taps "Terima undangan" on a pending invite.
// Returns either { acceptable: true } or a structured rejection that the
// controller surfaces as 409 + the gate copy on Surface 2.

export const PASTOR_MODE_INVITE_GATE_REASONS = {
  already_paired: 'already_paired',
  invite_not_pending: 'invite_not_pending',
  not_invitee: 'not_invitee',
  invite_self: 'invite_self',
  invite_expired: 'invite_expired',
  age_gate_not_passed: 'age_gate_not_passed',
} as const;

export type PastorModeInviteGateReason =
  (typeof PASTOR_MODE_INVITE_GATE_REASONS)[keyof typeof PASTOR_MODE_INVITE_GATE_REASONS];

export type PastorModeInviteGateInput = {
  // Status of the invitation row the user is accepting.
  inviteStatus: PastorModeRelationshipStatus;
  // Whether the audited user already has another relationship in `active`.
  hasActiveRelationship: boolean;
  // Whether `acceptingUserId === invitation.auditedUserId`. We don't take
  // the ids — the caller resolves that boolean to keep this module pure.
  acceptingUserIsInvitee: boolean;
  // Whether the invite was sent by a different user than the acceptor.
  // Catches a self-invite scenario the API otherwise can't enforce here.
  pastorIsDifferentUser: boolean;
  // Result of BLE-136 18+ KYC gate for the audited user. Pastor-mode is
  // an 18+ surface; under-18 users must not be able to accept.
  ageGatePassed: boolean;
  // Optional invite expiry — null = no expiry. If set and < now, gate fails.
  inviteExpiresAt?: Date | null;
  // Reference time. Defaults to now() — accept an arg for testability.
  now?: Date;
};

export type PastorModeInviteGateResult =
  | { acceptable: true }
  | { acceptable: false; reason: PastorModeInviteGateReason };

export function evaluatePastorInviteAcceptance(
  input: PastorModeInviteGateInput,
): PastorModeInviteGateResult {
  if (!input.acceptingUserIsInvitee) {
    return { acceptable: false, reason: PASTOR_MODE_INVITE_GATE_REASONS.not_invitee };
  }
  if (!input.pastorIsDifferentUser) {
    return { acceptable: false, reason: PASTOR_MODE_INVITE_GATE_REASONS.invite_self };
  }
  if (input.inviteStatus !== PASTOR_MODE_RELATIONSHIP_STATUS.pending) {
    return { acceptable: false, reason: PASTOR_MODE_INVITE_GATE_REASONS.invite_not_pending };
  }
  if (
    input.inviteExpiresAt &&
    input.inviteExpiresAt.getTime() <= (input.now ?? new Date()).getTime()
  ) {
    return { acceptable: false, reason: PASTOR_MODE_INVITE_GATE_REASONS.invite_expired };
  }
  if (!input.ageGatePassed) {
    return { acceptable: false, reason: PASTOR_MODE_INVITE_GATE_REASONS.age_gate_not_passed };
  }
  // The 1:1 audited-side rule. The whole point of BLE-131.
  if (input.hasActiveRelationship) {
    return { acceptable: false, reason: PASTOR_MODE_INVITE_GATE_REASONS.already_paired };
  }
  return { acceptable: true };
}

// === Revoke (Surface 5) ==================================================
//
// Helper to tell the audited side which terminal status applies to a given
// actor. Pastor uses ended_by_pastor; audited uses ended_by_audited. Keeps
// the BLE-133 symmetry-of-display rule out of the service layer's body.

export type PastorModeRevocationActor = 'audited' | 'pastor';

export function revocationStatusForActor(
  actor: PastorModeRevocationActor,
): Extract<PastorModeRelationshipStatus, 'ended_by_audited' | 'ended_by_pastor'> {
  return actor === 'audited'
    ? PASTOR_MODE_RELATIONSHIP_STATUS.ended_by_audited
    : PASTOR_MODE_RELATIONSHIP_STATUS.ended_by_pastor;
}

// === BLE-132 hook ========================================================
//
// 24h transcript-seal window for the pastor's admin view. Set at the moment
// the audited user revokes; the worker that locks pastor visibility reads
// the value off `PastorModeRelationship.pastorSealDueAt`.

export const PASTOR_MODE_TRANSCRIPT_SEAL_MS = 24 * 60 * 60 * 1000;

export function pastorSealDueAt(endedAt: Date): Date {
  return new Date(endedAt.getTime() + PASTOR_MODE_TRANSCRIPT_SEAL_MS);
}

// === Copy contract (Surface 2 / Surface 6) ===============================
//
// User-facing strings. Copy IDs are stable; the literal Bahasa Indonesia
// text is sourced from the Pastor-approved BLE-131 issue body. The mobile
// i18n loader maps these IDs to localized strings.
//
// NOTE: do not hand-edit these literals without a Pastor sign-off pass.
// They mirror the doctrinal language reviewed in BLE-87e / BLE-127.

export const PASTOR_MODE_COPY = {
  // Surface 2 gate when invitee already has another active pastor.
  invite_gate_already_paired_id: 'pastor_mode.invite_gate.already_paired',
  // {{pastorName}} interpolated client-side.
  invite_gate_already_paired_template:
    'Anda sedang berjalan bersama Pastor {{pastorName}}. Akhiri perjalanan itu dulu untuk menerima undangan baru.',

  // Surface 6 — read-only history section title for closed walks.
  history_section_title_id: 'pastor_mode.history.section_title',
  history_section_title: 'Perjalanan yang sudah selesai',

  // Surface 6 row — duration label, no resurrection CTA.
  history_row_duration_id: 'pastor_mode.history.row_duration',
  history_row_duration_template: '{{days}} hari · sudah selesai',

  // Surface 6 — sub-label rendered when the audited user taps a closed row.
  // Anti-resurrection: explicitly states no one-tap resume; new walk
  // requires fresh two-party consent.
  history_no_resume_id: 'pastor_mode.history.no_resume',
  history_no_resume:
    'Tidak ada cara mengaktifkan ulang perjalanan ini. Undangan baru harus dimulai dari awal oleh kedua belah pihak.',
} as const;

export type PastorModeCopyId = (typeof PASTOR_MODE_COPY)[
  | 'invite_gate_already_paired_id'
  | 'history_section_title_id'
  | 'history_row_duration_id'
  | 'history_no_resume_id'];

// Render helper for the {{pastorName}} interpolation. Kept in shared so
// server + mobile share the same substitution rules. Nothing fancy: no
// HTML, no escaping — server returns plain Indonesian, the React Native
// view renders as Text.
export function renderInviteAlreadyPairedCopy(pastorName: string): string {
  return PASTOR_MODE_COPY.invite_gate_already_paired_template.replace(
    '{{pastorName}}',
    pastorName.trim(),
  );
}

export function renderHistoryRowDuration(days: number): string {
  const safe = Math.max(0, Math.floor(days));
  return PASTOR_MODE_COPY.history_row_duration_template.replace('{{days}}', String(safe));
}

// === Duration helper for history rows ====================================

export function relationshipDurationDays(
  acceptedAt: Date | null | undefined,
  endedAt: Date | null | undefined,
): number {
  if (!acceptedAt || !endedAt) return 0;
  const ms = endedAt.getTime() - acceptedAt.getTime();
  if (ms <= 0) return 0;
  return Math.floor(ms / (24 * 60 * 60 * 1000));
}
