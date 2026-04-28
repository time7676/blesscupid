import { orderedUserPair, type Block } from '@blesscupid/shared';
import type { Clock } from './clock.js';
import type { SafetyRepository } from './repository.js';

export interface BlockDeps {
  repo: SafetyRepository;
  clock: Clock;
}

/** Block is bidirectional and idempotent: re-blocking is a no-op. */
export async function createBlock(
  deps: BlockDeps,
  initiatedByUserId: string,
  blockedUserId: string,
): Promise<Block> {
  if (initiatedByUserId === blockedUserId) {
    throw new Error('cannot block self');
  }
  const [userAId, userBId] = orderedUserPair(initiatedByUserId, blockedUserId);
  const existing = await deps.repo.hasBlock(userAId, userBId);
  if (existing) {
    return {
      userAId,
      userBId,
      initiatedByUserId,
      createdAt: deps.clock.now().toISOString(),
    };
  }
  const block: Block = {
    userAId,
    userBId,
    initiatedByUserId,
    createdAt: deps.clock.now().toISOString(),
  };
  await deps.repo.insertBlock(block);
  return block;
}

/** Unblock is symmetric: either party can unblock. */
export async function removeBlock(
  deps: BlockDeps,
  userId: string,
  otherUserId: string,
): Promise<boolean> {
  if (userId === otherUserId) return false;
  const [a, b] = orderedUserPair(userId, otherUserId);
  return deps.repo.deleteBlock(a, b);
}

/** Returns true if either user has blocked the other. */
export async function isBlocked(
  deps: BlockDeps,
  userAId: string,
  userBId: string,
): Promise<boolean> {
  if (userAId === userBId) return false;
  const [a, b] = orderedUserPair(userAId, userBId);
  return deps.repo.hasBlock(a, b);
}

/**
 * Returns the user IDs that should be filtered out of `viewerId`'s feed and
 * conversation lists. Both directions of a block are returned.
 */
export async function listBlockedUserIdsFor(
  deps: BlockDeps,
  viewerId: string,
): Promise<string[]> {
  const blocks = await deps.repo.listBlocksForUser(viewerId);
  return blocks.map((b) => (b.userAId === viewerId ? b.userBId : b.userAId));
}
