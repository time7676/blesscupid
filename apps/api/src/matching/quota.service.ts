/**
 * QuotaService — daily decision + favorite quota gating per
 * SubscriptionTier. BLE 2026-05-06 update: quota model replaces the
 * earlier "3 per day batch" framing.
 *
 * Tiers (from `SubscriptionTier` enum):
 *   free  → 10 decisions / 1 favorite per UTC day
 *   light → 50 / 5
 *   open  → 150 / 10
 *   deep  → unlimited
 *
 * UTC midnight reset matches `MatchDecision.day` ISO string. Bali
 * users see the reset around 08:00 WITA which is acceptable for v1;
 * v1.1 may align to local-timezone day if user feedback demands.
 */

import { Injectable, ForbiddenException } from '@nestjs/common';
import type { SubscriptionTier } from '@prisma/client';
import { dayKey } from '@blesscupid/matching';
import { PrismaService } from '../prisma/prisma.service.js';

export interface DailyQuota {
  decisions: number; // null = unlimited
  favorites: number; // null = unlimited
  isUnlimited: boolean;
}

const QUOTAS: Record<SubscriptionTier, DailyQuota> = {
  free: { decisions: 10, favorites: 1, isUnlimited: false },
  light: { decisions: 50, favorites: 5, isUnlimited: false },
  open: { decisions: 150, favorites: 10, isUnlimited: false },
  deep: { decisions: 9999, favorites: 9999, isUnlimited: true },
};

export interface QuotaSnapshot {
  tier: SubscriptionTier;
  decisionsLimit: number;
  decisionsUsed: number;
  decisionsRemaining: number;
  favoritesLimit: number;
  favoritesUsed: number;
  favoritesRemaining: number;
  isUnlimited: boolean;
  resetAtIso: string;
}

@Injectable()
export class QuotaService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Read the user's effective tier from the active subscription row,
   * defaulting to `free` when no active sub exists. `grace_period`
   * counts as active so users in dunning don't lose access mid-day.
   */
  async getTier(userId: string): Promise<SubscriptionTier> {
    const sub = await this.prisma.userSubscription.findFirst({
      where: { userId, status: { in: ['active', 'grace_period'] } },
      orderBy: { expiresAt: 'desc' },
      select: { tier: true },
    });
    return sub?.tier ?? 'free';
  }

  async getSnapshot(userId: string): Promise<QuotaSnapshot> {
    const [tier, today] = [await this.getTier(userId), dayKey()];
    const limits = QUOTAS[tier];
    const [decisionsUsed, favoritesUsed] = await Promise.all([
      this.prisma.matchDecision.count({
        where: { userId, day: today },
      }),
      this.prisma.matchDecision.count({
        where: { userId, day: today, decision: 'favorite' },
      }),
    ]);
    const tomorrow = new Date();
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    tomorrow.setUTCHours(0, 0, 0, 0);
    return {
      tier,
      decisionsLimit: limits.decisions,
      decisionsUsed,
      decisionsRemaining: Math.max(0, limits.decisions - decisionsUsed),
      favoritesLimit: limits.favorites,
      favoritesUsed,
      favoritesRemaining: Math.max(0, limits.favorites - favoritesUsed),
      isUnlimited: limits.isUnlimited,
      resetAtIso: tomorrow.toISOString(),
    };
  }

  /**
   * Throws ForbiddenException with a structured code when the user
   * has hit their cap. Mobile maps the code to a paywall sheet.
   */
  async assertCanDecide(
    userId: string,
    decision: 'pass' | 'like' | 'favorite',
  ): Promise<void> {
    const snap = await this.getSnapshot(userId);
    if (snap.isUnlimited) return;
    if (snap.decisionsRemaining <= 0) {
      throw new ForbiddenException({
        code: 'quota_decisions_exhausted',
        tier: snap.tier,
        limit: snap.decisionsLimit,
        resetAtIso: snap.resetAtIso,
      });
    }
    if (decision === 'favorite' && snap.favoritesRemaining <= 0) {
      throw new ForbiddenException({
        code: 'quota_favorites_exhausted',
        tier: snap.tier,
        limit: snap.favoritesLimit,
        resetAtIso: snap.resetAtIso,
      });
    }
  }
}
