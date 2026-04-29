// BLE-168 nightly warmer.
//
// Runs at 03:00 UTC: reads next-7-days planned reading refs from the
// `verse_calendar` table (BLE-99 owns the schema; tolerated as empty when
// the table does not exist), warms each ref × {tb2, tb, niv} through
// VerseService.getVerse() so cache writes go through the existing pipeline
// (TB2→TB fallback included), then purges expired rows.
//
// Ported from supabase/functions/verse-prefetch (retired scaffold c8eafa69)
// — same behaviour without Deno / Supabase JS / pg_cron.

import { Injectable, Logger, Optional } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service.js';
import type { Translation } from './attribution.js';
import { VerseCacheService } from './cache.service.js';
import {
  VerseNotFoundError,
  VerseService,
  VerseUpstreamError,
} from './verse.service.js';

const TRANSLATIONS: readonly Translation[] = ['tb2', 'tb', 'niv'] as const;
const HORIZON_DAYS = 7;

export type CalendarRow = { reading_date: string; ref: string };
export type CalendarLoader = () => Promise<CalendarRow[]>;

export type WarmStats = {
  refs: number;
  ok: number;
  miss: number;
  err: number;
  purged: number;
};

export const VERSE_WARMER_CRON = '0 3 * * *';

@Injectable()
export class VerseWarmerService {
  private readonly logger = new Logger(VerseWarmerService.name);
  private readonly loader: CalendarLoader;

  constructor(
    private readonly prisma: PrismaService,
    private readonly verse: VerseService,
    private readonly cache: VerseCacheService,
    @Optional() loader?: CalendarLoader,
  ) {
    this.loader = loader ?? (() => this.loadCalendarFromDb());
  }

  // 03:00 UTC daily.
  @Cron(VERSE_WARMER_CRON, {
    name: 'verse-warmer-nightly',
    timeZone: 'UTC',
  })
  async runNightly(): Promise<void> {
    const stats = await this.warmAndPurge();
    this.logger.log(
      `verse-warmer: refs=${stats.refs} ok=${stats.ok} miss=${stats.miss} err=${stats.err} purged=${stats.purged}`,
    );
  }

  async warmAndPurge(): Promise<WarmStats> {
    const plan = await this.loader();
    let ok = 0;
    let miss = 0;
    let err = 0;

    for (const row of plan) {
      for (const t of TRANSLATIONS) {
        const result = await this.warmOne(row.ref, t);
        if (result === 'ok') ok += 1;
        else if (result === 'miss') miss += 1;
        else err += 1;
      }
    }

    const purged = await this.cache.purgeExpired().catch((e) => {
      this.logger.warn(`purgeExpired failed: ${(e as Error).message}`);
      return 0;
    });

    return { refs: plan.length, ok, miss, err, purged };
  }

  private async warmOne(
    ref: string,
    translation: Translation,
  ): Promise<'ok' | 'miss' | 'err'> {
    try {
      await this.verse.getVerse(ref, translation);
      return 'ok';
    } catch (e) {
      if (e instanceof VerseNotFoundError) return 'miss';
      if (e instanceof VerseUpstreamError) return 'err';
      this.logger.warn(
        `warmOne unexpected error ref=${ref} t=${translation}: ${(e as Error).message}`,
      );
      return 'err';
    }
  }

  private async loadCalendarFromDb(): Promise<CalendarRow[]> {
    const today = new Date();
    const horizon = new Date(today.getTime() + HORIZON_DAYS * 24 * 60 * 60 * 1000);
    const todayStr = today.toISOString().slice(0, 10);
    const horizonStr = horizon.toISOString().slice(0, 10);
    try {
      const rows = await this.prisma.$queryRaw<CalendarRow[]>`
        SELECT reading_date::text AS reading_date, ref
        FROM verse_calendar
        WHERE reading_date >= ${todayStr}::date
          AND reading_date < ${horizonStr}::date
      `;
      return rows ?? [];
    } catch (e) {
      // BLE-99 owns the schema. Treat "table does not exist" as empty plan
      // (parity with the legacy Supabase function that swallowed PG 42P01).
      const msg = e instanceof Error ? e.message : String(e);
      if (
        msg.includes('42P01') ||
        msg.toLowerCase().includes('does not exist')
      ) {
        this.logger.debug('verse_calendar table missing, treating as empty');
        return [];
      }
      throw e;
    }
  }
}
