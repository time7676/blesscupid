// BlessCupid v1 verse service.
//
// Two layers:
//   1. Cache adapter (BLE-98): read VerseCache → upstream Sabda/Biblica → write
//      cache. Used by `getVerse(ref, translation)`.
//   2. Pool + de-dup (v1-restart): the 84-verse curated pool drives anchor
//      pick (mutual match), daily pick (status composer), and theme browse.
//      Per-user de-dup uses UserVerseHistory with a 90-day rolling window,
//      separated by `usedFor` enum (chat_anchor | status). All callers go
//      through the single `pickAvailable` helper to keep dedup logic DRY.

import { Injectable, Optional } from '@nestjs/common';
import type { VerseUsedFor, Locale as PrismaLocale } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { AdapterError, fetchTranslation } from './adapters.js';
import { attributionFor, type Translation } from './attribution.js';
import { VerseCacheService } from './cache.service.js';
import {
  buildSuggestions,
  type Suggestion,
  type WhimsicalAnswers,
} from './suggestion-templates.js';
import {
  VERSE_BY_REF,
  VERSE_POOL,
  VERSE_THEMES,
  localizeVerse,
  poolByTheme,
  type LocalizedVerse,
  type PoolVerse,
  type VerseTheme,
} from './verse-pool.js';

export type VerseResponse = {
  ref: string;
  translation: Translation;
  effective: Translation;
  text: string;
  attribution: string;
  cached: boolean;
  fallback: boolean;
};

export class VerseUpstreamError extends Error {
  constructor(
    public readonly source: string,
    public readonly status: number | null,
  ) {
    super(`upstream unavailable: ${source}`);
    this.name = 'VerseUpstreamError';
  }
}

export class VerseNotFoundError extends Error {
  constructor(
    public readonly ref: string,
    public readonly translation: Translation,
  ) {
    super(`verse unavailable: ${ref}`);
    this.name = 'VerseNotFoundError';
  }
}

type Fetcher = (
  ref: string,
  translation: Translation,
) => Promise<{ text: string; effective: Translation } | null>;

const DEDUP_WINDOW_MS = 90 * 24 * 60 * 60 * 1000;

@Injectable()
export class VerseService {
  // Allow tests to swap the adapter without monkey-patching globals.
  private readonly fetcher: Fetcher;
  private readonly prisma: PrismaService;

  constructor(
    private readonly cache: VerseCacheService,
    fetcherOrPrisma?: Fetcher | PrismaService,
    @Optional() maybePrisma?: PrismaService,
  ) {
    // Backward-compat shim: legacy tests construct with
    // `new VerseService(cache, fetcher)`; production DI passes
    // `(cache, prisma)` and the fetcher defaults to the real adapter.
    // Distinguish a plain Fetcher fn from PrismaService (an object).
    if (typeof fetcherOrPrisma === 'function') {
      this.fetcher = fetcherOrPrisma;
      this.prisma = (maybePrisma ?? null) as unknown as PrismaService;
    } else {
      this.fetcher = fetchTranslation;
      this.prisma = (fetcherOrPrisma ?? maybePrisma ?? null) as unknown as PrismaService;
    }
  }

  // ─── upstream-backed cache adapter (BLE-98 surface) ─────────────────────
  // Used by /verse?ref=&translation= for cache-on-demand reads. Untouched
  // from the original implementation; the new pool-based methods below
  // call this only for refs not already in the seeded pool.

  async getVerse(ref: string, translation: Translation): Promise<VerseResponse> {
    const cached = await this.cache.read(ref, translation);
    if (cached) {
      return {
        ref,
        translation,
        effective: cached.translation,
        text: cached.text,
        attribution: cached.attribution,
        cached: true,
        fallback: cached.translation !== translation,
      };
    }

    let fetched: { text: string; effective: Translation } | null;
    try {
      fetched = await this.fetcher(ref, translation);
    } catch (err) {
      if (err instanceof AdapterError) {
        throw new VerseUpstreamError(err.source, err.status);
      }
      throw new VerseUpstreamError('unknown', null);
    }

    if (!fetched) {
      throw new VerseNotFoundError(ref, translation);
    }

    const attribution = attributionFor(fetched.effective);
    await this.cache.write({
      ref,
      translation, // store under requested key so future reads hit instantly
      text: fetched.text,
      attribution,
    });

    return {
      ref,
      translation,
      effective: fetched.effective,
      text: fetched.text,
      attribution,
      cached: false,
      fallback: fetched.effective !== translation,
    };
  }

  /**
   * Backward-compat alias used by some controllers — same as `getVerse`.
   * Kept so existing call sites don't have to change.
   */
  async getVerseByRef(ref: string, translation: Translation): Promise<VerseResponse> {
    return this.getVerse(ref, translation);
  }

  // ─── pool + de-dup helpers (v1-restart) ─────────────────────────────────

  /**
   * Single source of truth for de-duped verse picking. Pulls a candidate
   * pool (filtered by theme if provided), removes refs the user has already
   * seen for this `usedFor` cone within the last 90 days, removes any
   * caller-supplied `excludeRefs`, then returns a weighted-random pick.
   *
   * If the eligible pool is empty (saturated 90-day window), falls back to
   * the user's least-recently-used verse for this `usedFor` cone — never
   * returns null. The 84-verse pool is treated as the universe; refs not
   * in the pool are ignored at fallback time.
   */
  async pickAvailable(args: {
    userId: string;
    themeTag?: VerseTheme;
    usedFor: VerseUsedFor;
    excludeRefs?: readonly string[];
    rng?: () => number;
  }): Promise<PoolVerse> {
    const { userId, themeTag, usedFor } = args;
    const rng = args.rng ?? Math.random;
    const exclude = new Set<string>(args.excludeRefs ?? []);

    const basePool = themeTag ? poolByTheme(themeTag) : [...VERSE_POOL];
    if (basePool.length === 0) {
      throw new Error(`pickAvailable: empty base pool for theme=${themeTag ?? 'all'}`);
    }

    const sinceCutoff = new Date(Date.now() - DEDUP_WINDOW_MS);
    const usedRefRows = await this.prisma.userVerseHistory.findMany({
      where: {
        userId,
        usedFor,
        createdAt: { gt: sinceCutoff },
      },
      select: { verseRef: true },
    });
    for (const row of usedRefRows) exclude.add(row.verseRef);

    const eligible = basePool.filter((v) => !exclude.has(v.ref));
    if (eligible.length > 0) {
      return weightedPick(eligible, rng);
    }

    // Saturated: pick least-recently-used from the same cone, restricted to
    // the requested theme (if any) and to the seeded pool.
    const lruRows = await this.prisma.userVerseHistory.findMany({
      where: { userId, usedFor },
      orderBy: { createdAt: 'asc' },
      select: { verseRef: true, createdAt: true },
    });
    for (const row of lruRows) {
      const v = VERSE_BY_REF.get(row.verseRef);
      if (!v) continue;
      if (themeTag && v.themeTag !== themeTag) continue;
      return v;
    }

    // Last-resort: random pick from the base pool. Should be unreachable
    // unless history references refs not in the seeded pool.
    return weightedPick(basePool, rng);
  }

  /**
   * Pick a chat-anchor verse for a freshly-formed thread. Excludes refs
   * recently used for chat_anchor by EITHER party (90-day window). Caller
   * (matching service) is responsible for writing the ThreadAnchor row +
   * two UserVerseHistory rows in the same transaction.
   */
  async pickAnchorFor(userAId: string, userBId: string): Promise<PoolVerse> {
    const sinceCutoff = new Date(Date.now() - DEDUP_WINDOW_MS);
    const otherHistory = await this.prisma.userVerseHistory.findMany({
      where: {
        userId: { in: [userAId, userBId] },
        usedFor: 'chat_anchor',
        createdAt: { gt: sinceCutoff },
      },
      select: { verseRef: true },
    });
    const excludeRefs = otherHistory.map((r) => r.verseRef);
    return this.pickAvailable({
      userId: userAId,
      usedFor: 'chat_anchor',
      excludeRefs,
    });
  }

  /**
   * Daily-pick for the status composer / Today screen. Same pool, separate
   * de-dup cone (`status`). Optional theme.
   */
  async dailyPick(userId: string, themeTag?: VerseTheme): Promise<PoolVerse> {
    return this.pickAvailable({ userId, usedFor: 'status', themeTag });
  }

  /**
   * Generate up to 3 opener templates for the chat composer. Reads the
   * thread's anchor (verseRef) + both users' Profile.whimsicalAnswers, then
   * renders static localized templates. NO LLM call.
   */
  async suggestionsForThread(
    threadId: string,
    viewerId: string,
  ): Promise<Suggestion[]> {
    const anchor = await this.prisma.threadAnchor.findUnique({
      where: { threadId },
      select: { verseRef: true },
    });

    // Resolve theme: prefer pool lookup, fall back to "faith" so we always
    // return three suggestions even if the anchor verse is hand-curated and
    // not in the seeded pool.
    const anchorTheme: VerseTheme = anchor
      ? (VERSE_BY_REF.get(anchor.verseRef)?.themeTag ?? 'faith')
      : 'faith';

    // Resolve the two participants and their whimsical answers via Thread.match.
    const thread = await this.prisma.thread.findUnique({
      where: { id: threadId },
      select: { match: { select: { userAId: true, userBId: true } } },
    });
    if (!thread) {
      // Thread missing — degrade gracefully to generic openers.
      const viewerLocale = await this.resolveLocale(viewerId);
      return buildSuggestions({
        anchorTheme,
        locale: viewerLocale,
      });
    }

    const { userAId, userBId } = thread.match;
    const otherId = userAId === viewerId ? userBId : userAId;

    const [viewer, other] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: viewerId },
        select: {
          localePreference: true,
          profile: { select: { whimsicalAnswers: true } },
        },
      }),
      this.prisma.user.findUnique({
        where: { id: otherId },
        select: {
          profile: { select: { whimsicalAnswers: true } },
        },
      }),
    ]);

    const locale: 'en' | 'id' = viewer?.localePreference === 'id' ? 'id' : 'en';

    return buildSuggestions({
      anchorTheme,
      viewerAnswers: coerceWhimsy(viewer?.profile?.whimsicalAnswers),
      candidateAnswers: coerceWhimsy(other?.profile?.whimsicalAnswers),
      locale,
    });
  }

  // ─── localized read helpers (controllers) ───────────────────────────────

  listThemes(locale: 'en' | 'id'): { tag: VerseTheme; label: string }[] {
    return VERSE_THEMES.map((tag) => ({ tag, label: localizeThemeLabel(tag, locale) }));
  }

  listByTheme(theme: VerseTheme, locale: 'en' | 'id'): LocalizedVerse[] {
    return poolByTheme(theme).map((v) => localizeVerse(v, locale));
  }

  /** Lookup a single pool verse by ref, localized. Returns null if not seeded. */
  poolLookup(ref: string, locale: 'en' | 'id'): LocalizedVerse | null {
    const v = VERSE_BY_REF.get(ref);
    return v ? localizeVerse(v, locale) : null;
  }

  // ─── private ────────────────────────────────────────────────────────────

  private async resolveLocale(userId: string): Promise<'en' | 'id'> {
    const u = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { localePreference: true },
    });
    return u?.localePreference === ('id' as PrismaLocale) ? 'id' : 'en';
  }
}

// ─── helpers ──────────────────────────────────────────────────────────────

function weightedPick<T>(items: readonly T[], rng: () => number): T {
  // Uniform pick today; named "weighted" to leave room for per-theme or
  // per-recency weighting later without changing the call site.
  const idx = Math.floor(rng() * items.length);
  return items[Math.min(idx, items.length - 1)] as T;
}

function coerceWhimsy(value: unknown): WhimsicalAnswers | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const out: WhimsicalAnswers = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean' || v == null) {
      out[k] = v as WhimsicalAnswers[string];
    }
  }
  return out;
}

const THEME_LABELS_EN: Record<VerseTheme, string> = {
  peace: 'Peace',
  joy: 'Joy',
  strength: 'Strength',
  love: 'Love',
  wisdom: 'Wisdom',
  comfort: 'Comfort',
  praise: 'Praise',
  purpose: 'Purpose',
  forgiveness: 'Forgiveness',
  gratitude: 'Gratitude',
  hope: 'Hope',
  faith: 'Faith',
};

const THEME_LABELS_ID: Record<VerseTheme, string> = {
  peace: 'Damai Sejahtera',
  joy: 'Sukacita',
  strength: 'Kekuatan',
  love: 'Kasih',
  wisdom: 'Hikmat',
  comfort: 'Penghiburan',
  praise: 'Pujian',
  purpose: 'Panggilan',
  forgiveness: 'Pengampunan',
  gratitude: 'Syukur',
  hope: 'Pengharapan',
  faith: 'Iman',
};

function localizeThemeLabel(tag: VerseTheme, locale: 'en' | 'id'): string {
  return locale === 'id' ? THEME_LABELS_ID[tag] : THEME_LABELS_EN[tag];
}
