import {
  ACCOUNT_HARD_DELETE_DAYS,
  type AccountDeletionRequest,
} from '@blesscupid/shared';
import type { Clock } from './clock.js';
import type { IdGen } from './id.js';
import type { SafetyRepository } from './repository.js';

export interface DeletionDeps {
  repo: SafetyRepository;
  clock: Clock;
  ids: IdGen;
}

/**
 * The PII purge action a worker should perform for a single user.
 * The safety service does NOT touch user/auth/profile tables itself —
 * it returns this directive so the calling worker can execute the purge
 * inside its own transaction.
 */
export interface HardDeleteDirective {
  request: AccountDeletionRequest;
  /** Threads under active EvidenceFreeze whose message bodies must NOT be purged. */
  preservedChatThreadIds: string[];
}

/**
 * Stage 1 — soft delete. Idempotent per user. CCPA "expedited" callers
 * shorten the hold to zero; default is `ACCOUNT_HARD_DELETE_DAYS`.
 */
export async function requestAccountDeletion(
  deps: DeletionDeps,
  userId: string,
  options: { expedited?: boolean } = {},
): Promise<AccountDeletionRequest> {
  const existing = await deps.repo.getDeletionRequestForUser(userId);
  if (existing && existing.status !== 'cancelled') {
    return existing;
  }
  const now = deps.clock.now();
  const expedited = options.expedited ?? false;
  const req: AccountDeletionRequest = {
    id: deps.ids.next(),
    userId,
    status: 'soft_deleted',
    expedited,
    requestedAt: now.toISOString(),
    softDeletedAt: now.toISOString(),
    hardDeleteScheduledAt: addDaysIso(now, expedited ? 0 : ACCOUNT_HARD_DELETE_DAYS),
    hardDeletedAt: null,
    cancelledAt: null,
  };
  await deps.repo.insertDeletionRequest(req);
  return req;
}

/**
 * Cancel a pending deletion within the hold window. Returns false if the
 * request is already hard-deleted or cancelled.
 */
export async function cancelAccountDeletion(
  deps: DeletionDeps,
  userId: string,
): Promise<boolean> {
  const req = await deps.repo.getDeletionRequestForUser(userId);
  if (!req) return false;
  if (req.status === 'hard_deleted' || req.status === 'cancelled') return false;
  await deps.repo.updateDeletionStatus(req.id, 'cancelled', {
    cancelledAt: deps.clock.now().toISOString(),
  });
  return true;
}

/**
 * Stage 2 — hard delete pass. Returns the directives the calling worker
 * should execute; updates each request to `hard_deleted` once recorded.
 */
export async function planHardDeletePass(
  deps: DeletionDeps,
  resolveFrozenThreads: (userId: string) => Promise<string[]>,
): Promise<HardDeleteDirective[]> {
  const due = await deps.repo.listPendingHardDeletes(deps.clock.now().toISOString());
  const directives: HardDeleteDirective[] = [];
  for (const req of due) {
    const preserved = await resolveFrozenThreads(req.userId);
    directives.push({ request: req, preservedChatThreadIds: preserved });
  }
  return directives;
}

/** Mark a deletion request as fully hard-deleted after the worker finished. */
export async function markHardDeleted(
  deps: DeletionDeps,
  requestId: string,
): Promise<void> {
  await deps.repo.updateDeletionStatus(requestId, 'hard_deleted', {
    hardDeletedAt: deps.clock.now().toISOString(),
  });
}

function addDaysIso(now: Date, days: number): string {
  return new Date(now.getTime() + days * 86_400_000).toISOString();
}
