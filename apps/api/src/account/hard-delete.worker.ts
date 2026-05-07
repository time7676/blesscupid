import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  AccountDeletionService,
  HARD_DELETE_DAYS,
} from './account-deletion.service.js';

const BATCH_SIZE = 100;

/**
 * BLE-10 / v1-restart — hourly hard-delete sweep.
 *
 * Finds users whose `deletedAt` is older than the 30-day restore window and
 * calls `prisma.user.delete()` per row; cascade fkey rules in schema.prisma
 * fan out the purge across all dependent tables.
 *
 * No more AccountDeletionRequest bookkeeping; `User.deletedAt` is the only
 * piece of state.
 */
@Injectable()
export class HardDeleteWorker {
  private readonly logger = new Logger(HardDeleteWorker.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly deletion: AccountDeletionService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async runHourly(): Promise<void> {
    await this.runOnce();
  }

  /** Returns the list of user ids that were hard-deleted this pass. */
  async runOnce(): Promise<string[]> {
    const cutoff = new Date(Date.now() - HARD_DELETE_DAYS * 86_400_000);
    const due = await this.prisma.user.findMany({
      where: { deletedAt: { lt: cutoff, not: null } },
      select: { id: true },
      take: BATCH_SIZE,
    });
    const purged: string[] = [];
    for (const { id } of due) {
      try {
        await this.deletion.permanentlyDelete(id);
        purged.push(id);
      } catch (err) {
        this.logger.error(
          `hard-delete failed for user=${id}: ${(err as Error).message}`,
        );
      }
    }
    if (purged.length > 0) {
      this.logger.log(`hard-delete pass purged ${purged.length} user(s)`);
    }
    return purged;
  }
}
