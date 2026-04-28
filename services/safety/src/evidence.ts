import type { EvidenceFreeze } from '@blesscupid/shared';
import type { Clock } from './clock.js';
import type { SafetyRepository } from './repository.js';

export interface EvidenceDeps {
  repo: SafetyRepository;
  clock: Clock;
}

/**
 * True if any active freeze covers `chatThreadId`. The chat service MUST
 * call this before redacting, deleting, or hard-purging a thread's messages.
 */
export async function isThreadFrozen(
  deps: EvidenceDeps,
  chatThreadId: string,
): Promise<boolean> {
  return deps.repo.hasActiveFreeze(chatThreadId, deps.clock.now().toISOString());
}

export interface FreezeExpiryReport {
  expired: number;
  freezeIds: string[];
}

/** Worker hook: removes freezes whose `expiresAt` is in the past. */
export async function expireOldFreezes(deps: EvidenceDeps): Promise<FreezeExpiryReport> {
  const expired = await deps.repo.listExpiredFreezes(deps.clock.now().toISOString());
  const ids: string[] = [];
  for (const f of expired) {
    await deps.repo.deleteFreeze(f.id);
    ids.push(f.id);
  }
  return { expired: ids.length, freezeIds: ids };
}

export type { EvidenceFreeze };
