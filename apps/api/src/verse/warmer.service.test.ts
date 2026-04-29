// BLE-168 warmer tests:
// - Empty calendar table → no-op success.
// - 7 refs × 3 translations → 21 cache writes via getVerse pipeline.
// - getVerse error on one ref → aggregated counts (parity with legacy
//   'ok' | 'miss' | 'err').

import { describe, expect, test, vi } from 'vitest';
import {
  VerseNotFoundError,
  VerseService,
  VerseUpstreamError,
} from './verse.service.js';
import { VerseCacheService } from './cache.service.js';
import {
  type CalendarLoader,
  type CalendarRow,
  VerseWarmerService,
} from './warmer.service.js';
import type { Translation } from './attribution.js';

// PrismaService is unused when a CalendarLoader is injected — pass an empty
// shim. The warmer never touches `prisma` directly under test.
const prismaShim = {} as never;

class FakeVerseService {
  // mimic VerseService.getVerse signature; tests override per case.
  getVerse = vi.fn();
}

class FakeCache {
  purgeExpired = vi.fn().mockResolvedValue(0);
}

function buildPlan(days: number): CalendarRow[] {
  const rows: CalendarRow[] = [];
  const today = new Date();
  for (let i = 0; i < days; i += 1) {
    const d = new Date(today.getTime() + i * 24 * 60 * 60 * 1000);
    rows.push({ reading_date: d.toISOString().slice(0, 10), ref: `Yohanes 3:${16 + i}` });
  }
  return rows;
}

function makeWarmer(opts: {
  loader: CalendarLoader;
  verse: FakeVerseService;
  cache: FakeCache;
}): VerseWarmerService {
  return new VerseWarmerService(
    prismaShim,
    opts.verse as unknown as VerseService,
    opts.cache as unknown as VerseCacheService,
    opts.loader,
  );
}

describe('VerseWarmerService', () => {
  test('empty calendar → no warm calls, purge runs, zeroed stats', async () => {
    const verse = new FakeVerseService();
    const cache = new FakeCache();
    cache.purgeExpired.mockResolvedValueOnce(3);

    const warmer = makeWarmer({
      loader: async () => [],
      verse,
      cache,
    });

    const stats = await warmer.warmAndPurge();

    expect(verse.getVerse).not.toHaveBeenCalled();
    expect(cache.purgeExpired).toHaveBeenCalledTimes(1);
    expect(stats).toEqual({ refs: 0, ok: 0, miss: 0, err: 0, purged: 3 });
  });

  test('7 refs × 3 translations → 21 successful warms', async () => {
    const verse = new FakeVerseService();
    const cache = new FakeCache();

    // Successful response shape returned by VerseService.getVerse.
    verse.getVerse.mockImplementation(async (ref: string, t: Translation) => ({
      ref,
      translation: t,
      effective: t,
      text: 'text',
      attribution: 'attr',
      cached: false,
      fallback: false,
    }));

    const plan = buildPlan(7);
    const warmer = makeWarmer({
      loader: async () => plan,
      verse,
      cache,
    });

    const stats = await warmer.warmAndPurge();

    expect(verse.getVerse).toHaveBeenCalledTimes(21);
    // Each ref must be warmed for tb2, tb, niv.
    const seenTranslations = new Set(
      verse.getVerse.mock.calls.map(([, t]: [string, Translation]) => t),
    );
    expect(seenTranslations).toEqual(new Set(['tb2', 'tb', 'niv']));
    expect(stats).toEqual({ refs: 7, ok: 21, miss: 0, err: 0, purged: 0 });
    expect(cache.purgeExpired).toHaveBeenCalledTimes(1);
  });

  test('partial errors continue and aggregate counts (ok/miss/err)', async () => {
    const verse = new FakeVerseService();
    const cache = new FakeCache();

    verse.getVerse.mockImplementation(async (ref: string, t: Translation) => {
      // ref 0 → all ok; ref 1 → tb2 throws upstream; ref 2 → niv 404.
      if (ref === 'Bad 1:1' && t === 'tb2') {
        throw new VerseUpstreamError('sabda', 503);
      }
      if (ref === 'Miss 1:1' && t === 'niv') {
        throw new VerseNotFoundError(ref, t);
      }
      return {
        ref,
        translation: t,
        effective: t,
        text: 'text',
        attribution: 'attr',
        cached: false,
        fallback: false,
      };
    });

    const plan: CalendarRow[] = [
      { reading_date: '2026-01-01', ref: 'Good 1:1' },
      { reading_date: '2026-01-02', ref: 'Bad 1:1' },
      { reading_date: '2026-01-03', ref: 'Miss 1:1' },
    ];
    const warmer = makeWarmer({
      loader: async () => plan,
      verse,
      cache,
    });

    const stats = await warmer.warmAndPurge();

    // 3 refs × 3 translations = 9 calls; 1 err, 1 miss, 7 ok.
    expect(verse.getVerse).toHaveBeenCalledTimes(9);
    expect(stats).toEqual({ refs: 3, ok: 7, miss: 1, err: 1, purged: 0 });
  });

  test('purgeExpired failure does not abort warm; purged falls back to 0', async () => {
    const verse = new FakeVerseService();
    const cache = new FakeCache();
    cache.purgeExpired.mockRejectedValueOnce(new Error('db down'));
    verse.getVerse.mockResolvedValue({
      ref: 'r',
      translation: 'tb2',
      effective: 'tb2',
      text: 't',
      attribution: 'a',
      cached: false,
      fallback: false,
    });

    const warmer = makeWarmer({
      loader: async () => [{ reading_date: '2026-01-01', ref: 'r' }],
      verse,
      cache,
    });

    const stats = await warmer.warmAndPurge();
    expect(stats).toEqual({ refs: 1, ok: 3, miss: 0, err: 0, purged: 0 });
  });
});
