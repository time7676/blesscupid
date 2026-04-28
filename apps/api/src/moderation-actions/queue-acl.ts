// BLE-63 / Appendix A.5 — queue access control.
//
// Pure logic. The HTTP layer wraps this in NestJS guards / 403 responses;
// service-layer callers use it before any read or write to a queue row.
//
// `ceo_p0` is the only restricted queue: read+write CEO + Pastor only.

import type { ModerationQueue, UserRole } from '@prisma/client';

export type QueueAccess = 'allow' | 'deny';

export function canAccessQueue(role: UserRole, queue: ModerationQueue): QueueAccess {
  if (queue === 'ceo_p0') {
    return role === 'ceo' || role === 'pastor' ? 'allow' : 'deny';
  }
  // mod_triage / mod_appeals / pastor_precedent — same gate as BLE-10.
  return role === 'ceo' || role === 'pastor' ? 'allow' : 'deny';
}

export class QueueAccessDeniedError extends Error {
  constructor(public readonly queue: ModerationQueue) {
    super(`access denied to queue ${queue}`);
    this.name = 'QueueAccessDeniedError';
  }
}

/**
 * Appeal routing constraint (A.1): an appeal cannot be assigned to the
 * reviewer who took the original action.
 */
export function isAppealReviewerEligible(
  candidateUserId: string,
  originalActorUserId: string,
): boolean {
  return candidateUserId !== originalActorUserId;
}
