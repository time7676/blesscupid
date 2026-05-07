import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaModerationStore } from '../moderation/prisma-moderation-store.js';

/**
 * Blocks are **bidirectional** by acceptance: once A blocks B, neither party
 * can see or contact the other. We materialize both directions as rows so
 * every read path can do a single primary-key lookup against `Block` keyed
 * on the viewer side, without a UNION.
 */
@Injectable()
export class BlocksService {
  constructor(private readonly store: PrismaModerationStore) {}

  async block(blockerUserId: string, blockedUserId: string) {
    if (blockerUserId === blockedUserId) {
      throw new BadRequestException({ code: 'cannot_block_self' });
    }
    const createdAt = new Date().toISOString();
    await this.store.block({ blockerUserId, blockedUserId, createdAt });
    await this.store.block({
      blockerUserId: blockedUserId,
      blockedUserId: blockerUserId,
      createdAt,
    });
    return { ok: true };
  }

  async unblock(blockerUserId: string, blockedUserId: string) {
    await this.store.unblock(blockerUserId, blockedUserId);
    await this.store.unblock(blockedUserId, blockerUserId);
    return { ok: true };
  }

  /**
   * True if either party has blocked the other. Use this in match-feed,
   * chat fanout, profile-view, and notification delivery paths.
   */
  async isBlockedEitherWay(userAId: string, userBId: string): Promise<boolean> {
    if (userAId === userBId) return false;
    if (await this.store.isBlocked(userAId, userBId)) return true;
    return this.store.isBlocked(userBId, userAId);
  }
}
