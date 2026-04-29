import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CoinService } from '../coin/coin.service.js';

export type Action =
  | 'swipe'
  | 'superLike'
  | 'rewind'
  | 'boost'
  | 'messageBeforeMatch'
  | 'seeWhoLikedYou'
  | 'advancedFilter'
  | 'incognito'
  | 'readReceipt';

const TIER_LIMITS: Record<string, Record<Action, number | boolean>> = {
  free: {
    swipe: 50,
    superLike: 1,
    rewind: 0,
    boost: 0,
    messageBeforeMatch: 0,
    seeWhoLikedYou: 0,
    advancedFilter: 0,
    incognito: 0,
    readReceipt: 0,
  },
  light: {
    swipe: 150,
    superLike: 5,
    rewind: 0,
    boost: 0,
    messageBeforeMatch: 0,
    seeWhoLikedYou: 0,
    advancedFilter: 1,
    incognito: 0,
    readReceipt: 0,
  },
  open: {
    swipe: 99999,
    superLike: 10,
    rewind: 1,
    boost: 0,
    messageBeforeMatch: 2,
    seeWhoLikedYou: 1,
    advancedFilter: 1,
    incognito: 0,
    readReceipt: 0,
  },
  deep: {
    swipe: 99999,
    superLike: 99999,
    rewind: 3,
    boost: 1,
    messageBeforeMatch: 99999,
    seeWhoLikedYou: 1,
    advancedFilter: 1,
    incognito: 1,
    readReceipt: 1,
  },
};

const COIN_COSTS: Record<string, number> = {
  superLike: 25,
  rewind: 20,
  boost: 50,
  messageBeforeMatch: 30,
  incognito: 40,
};

@Injectable()
export class EntitlementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly coinService: CoinService,
  ) {}

  async can(userId: string, action: Action): Promise<{ allowed: boolean; remaining?: number; coinCost?: number }> {
    const tier = await this.getUserTier(userId);
    const tierConfig = TIER_LIMITS[tier] ?? TIER_LIMITS['free'];
    const limit = tierConfig![action];

    if (typeof limit === 'boolean') {
      return { allowed: limit };
    }

    if (limit === 0) {
      const coinCost = COIN_COSTS[action];
      if (coinCost) {
        const { balance } = await this.coinService.getBalance(userId);
        return { allowed: balance >= coinCost, coinCost, remaining: balance };
      }
      return { allowed: false };
    }

    // For swipe-like limits, return remaining count
    return { allowed: true, remaining: limit as number };
  }

  async spend(userId: string, action: Action): Promise<{ success: boolean; newBalance?: number; tier: string }> {
    const tier = await this.getUserTier(userId);
    const tierConfig = TIER_LIMITS[tier] ?? TIER_LIMITS['free'];
    const limit = tierConfig![action];

    if (typeof limit === 'boolean') {
      return { success: limit, tier };
    }

    if (limit === 0) {
      const coinCost = COIN_COSTS[action];
      if (!coinCost) return { success: false, tier };

      const result = await this.coinService.spend(userId, coinCost, action);
      return { success: true, newBalance: result.newBalance, tier };
    }

    return { success: true, tier };
  }

  async getUserTier(userId: string): Promise<keyof typeof TIER_LIMITS> {
    const sub = await this.prisma.userSubscription.findFirst({
      where: {
        userId,
        status: { in: ['active', 'grace_period'] },
      },
      orderBy: { expiresAt: 'desc' },
    });

    return (sub?.tier as keyof typeof TIER_LIMITS) ?? 'free';
  }
}
