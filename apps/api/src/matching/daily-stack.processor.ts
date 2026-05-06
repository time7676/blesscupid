/**
 * DailyStackProcessor — BullMQ worker that pre-computes the swipe deck for
 * every active user.
 *
 * Cron: 04:00 UTC nightly (per-user timezone-adjusted variant lands v1.1).
 *
 * Cost shape:
 *   - city-bucket pre-filter (50km Haversine window) inside
 *     MatchingService.computeAndCacheDeck — keeps cost O(N × bucket-size).
 *   - anti-Pareto exposure cap (penalize candidates already shown to >50
 *     viewers today) lives in the same compute path.
 *
 * Errors per-user are logged + swallowed; one bad row never blocks the
 * cohort. Disable in dev/test via DAILY_STACK_CRON_ENABLED=0.
 */

import { Injectable, Logger } from '@nestjs/common';
import { Process, Processor } from '@nestjs/bullmq';
import { Cron } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bullmq';
import type { Job, Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service.js';
import { MatchingService } from './matching.service.js';

export const DAILY_STACK_QUEUE = 'daily-stack-precompute';

interface JobData {
  userId: string;
  triggeredAt: string;
}

@Injectable()
@Processor(DAILY_STACK_QUEUE)
export class DailyStackProcessor {
  private readonly logger = new Logger(DailyStackProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly matching: MatchingService,
    @InjectQueue(DAILY_STACK_QUEUE) private readonly queue: Queue<JobData>,
  ) {}

  /**
   * Cron — runs at 04:00 UTC daily and enqueues one job per active user.
   * The fan-out lets BullMQ rate-limit + retry per-user without blocking
   * the rest of the cohort.
   */
  @Cron('0 4 * * *')
  async scheduleNightly(): Promise<void> {
    if (process.env.DAILY_STACK_CRON_ENABLED === '0') {
      this.logger.log('cron disabled via DAILY_STACK_CRON_ENABLED=0');
      return;
    }
    const users = await this.prisma.user.findMany({
      where: {
        onboardingCompleted: true,
        isSuspended: false,
        deletedAt: null,
      },
      select: { id: true },
    });
    const triggeredAt = new Date().toISOString();
    this.logger.log(`enqueuing ${users.length} daily-stack jobs`);
    for (const u of users) {
      await this.queue.add(
        'compute',
        { userId: u.id, triggeredAt },
        {
          jobId: `daily-stack:${u.id}:${triggeredAt.slice(0, 10)}`,
          removeOnComplete: 1000,
          removeOnFail: 500,
          attempts: 2,
          backoff: { type: 'exponential', delay: 5000 },
        },
      );
    }
  }

  @Process('compute')
  async handle(job: Job<JobData>): Promise<void> {
    const { userId } = job.data;
    try {
      const ids = await this.matching.computeAndCacheDeck(userId, 30);
      this.logger.log(`deck ready for user=${userId} size=${ids.length}`);
    } catch (err) {
      this.logger.error(
        `daily-stack compute failed for user=${userId}: ${(err as Error).message}`,
      );
      throw err;
    }
  }
}
