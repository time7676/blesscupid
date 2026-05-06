/**
 * DailyStackCronService — nightly job that pre-computes a DailyStack for
 * every onboarded, non-suspended, non-deleted user. Runs at 04:00 UTC
 * (≈ 12:00 WITA Bali) so users opening the app at sunrise see an
 * already-computed stack with zero compute lag.
 *
 * Lane B per BLE eng-review 2026-05-06.
 *
 * Operational notes:
 * - The cron writes a DailyStack row per user, idempotent via the
 *   (userId, day) unique constraint. Re-runs replace the same day's row.
 * - Errors per-user are logged + swallowed; one bad row never blocks
 *   the cohort. Sentry/observability captures aggregate failure rate.
 * - Disable in dev/test via DAILY_STACK_CRON_ENABLED=0 in .env so local
 *   pnpm dev doesn't churn quietly.
 */

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { dayKey } from '@blesscupid/matching';
import { PrismaService } from '../prisma/prisma.service.js';
import { MatchingService } from './matching.service.js';

@Injectable()
export class DailyStackCronService {
  private readonly logger = new Logger(DailyStackCronService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly matching: MatchingService,
  ) {}

  // Runs at 04:00 UTC = 12:00 WITA. CronExpression doesn't expose a 4am
  // helper, so we use the explicit string. Adjust to local TZ via the
  // ScheduleModule.forRoot timeZone option when the cohort moves off UTC.
  @Cron('0 4 * * *')
  async runNightly() {
    if (process.env.DAILY_STACK_CRON_ENABLED === '0') {
      this.logger.log('cron disabled via DAILY_STACK_CRON_ENABLED=0');
      return;
    }

    const day = dayKey();
    this.logger.log(`computing daily stacks for ${day}`);

    const users = await this.prisma.user.findMany({
      where: {
        onboardingCompleted: true,
        isSuspended: false,
        deletedAt: null,
      },
      select: { id: true },
    });

    let ok = 0;
    let fail = 0;
    for (const u of users) {
      try {
        await this.matching.computeStack(u.id, day);
        ok += 1;
      } catch (err) {
        fail += 1;
        this.logger.error(
          `daily-stack compute failed for user=${u.id}: ${(err as Error).message}`,
        );
      }
    }

    this.logger.log(
      `daily stack cron done: total=${users.length} ok=${ok} fail=${fail}`,
    );
  }
}
