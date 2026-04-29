import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

export interface MatchCandidate {
  userId: string;
  score: number;
}

@Injectable()
export class MatchingPriorityService {
  private readonly TIER_PRIORITY = {
    deep: 2,
    open: 1,
    light: 0,
    free: 0,
  };

  constructor(private readonly prisma: PrismaService) {}

  async getPriorityBoost(userId: string): Promise<number> {
    const sub = await this.prisma.userSubscription.findFirst({
      where: {
        userId,
        status: { in: ['active', 'grace_period'] },
      },
      orderBy: { expiresAt: 'desc' },
    });

    const tier = sub?.tier ?? 'free';
    return this.TIER_PRIORITY[tier as keyof typeof this.TIER_PRIORITY] ?? 0;
  }

  async sortCandidates(
    viewerId: string,
    candidates: MatchCandidate[],
  ): Promise<MatchCandidate[]> {
    const viewerBoost = await this.getPriorityBoost(viewerId);

    const boosted = await Promise.all(
      candidates.map(async (c) => {
        const candidateBoost = await this.getPriorityBoost(c.userId);
        return {
          ...c,
          // Priority boost is only visible to the candidate's own rank in others' feeds
          // Here we apply the candidate's own algorithmic priority to their score
          finalScore: c.score + candidateBoost * 0.5,
        };
      }),
    );

    return boosted.sort((a, b) => b.finalScore - a.finalScore);
  }
}
