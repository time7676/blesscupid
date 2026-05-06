// Verse HTTP surface.
//
// Routes:
//   GET /verse?ref=&translation=          — legacy BLE-98 cache-on-demand read
//   GET /v1/verses/themes                 — 12 themes localized
//   GET /v1/verses/by-theme?theme=peace   — 7 verses for a theme, localized
//   GET /v1/verses/by-ref/:ref            — single verse (cache-backed)
//   GET /v1/verses/daily-pick             — suggested verse-of-day for viewer
//
// Theme + by-theme + by-ref are unauthenticated reads (verse text is public
// content; auth is irrelevant). daily-pick is auth-required because it
// touches per-user UserVerseHistory.

import {
  BadGatewayException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { z } from 'zod';
import { ZodValidate } from '../common/zod.pipe.js';
import { localizeVerse, VERSE_BY_REF, VERSE_THEMES, type VerseTheme } from './verse-pool.js';
import {
  VerseNotFoundError,
  VerseService,
  VerseUpstreamError,
} from './verse.service.js';

// ─── legacy /verse ────────────────────────────────────────────────────────

const VerseQuerySchema = z.object({
  ref: z.string().trim().min(1).max(80),
  translation: z.enum(['tb', 'tb2', 'niv', 'bsb']),
});

@Controller('verse')
export class VerseController {
  constructor(private readonly verse: VerseService) {}

  @Get()
  async getVerse(
    @Query(ZodValidate(VerseQuerySchema)) query: z.infer<typeof VerseQuerySchema>,
  ) {
    try {
      // Pool-seeded verses (e.g. bsb) hit VerseCache directly via getVerse.
      return await this.verse.getVerse(query.ref, query.translation as 'tb' | 'tb2' | 'niv');
    } catch (err) {
      if (err instanceof VerseNotFoundError) {
        throw new NotFoundException({
          code: 'verse_not_found',
          ref: err.ref,
          translation: err.translation,
        });
      }
      if (err instanceof VerseUpstreamError) {
        throw new BadGatewayException({
          code: 'upstream_unavailable',
          source: err.source,
          status: err.status,
        });
      }
      throw err;
    }
  }
}

// ─── /v1/verses ───────────────────────────────────────────────────────────

const ThemeQuerySchema = z.object({
  theme: z.enum(VERSE_THEMES),
  locale: z.enum(['en', 'id']).optional(),
});

const LocaleQuerySchema = z.object({
  locale: z.enum(['en', 'id']).optional(),
});

const RefParamSchema = z.object({
  ref: z.string().trim().min(1).max(80),
});

const RefQuerySchema = z.object({
  translation: z.enum(['en', 'id', 'tb', 'tb2', 'niv', 'bsb']).optional(),
});

const DailyPickQuerySchema = z.object({
  theme: z.enum(VERSE_THEMES).optional(),
});

interface AuthedRequest extends Request {
  user?: { id?: string; sub?: string; localePreference?: 'en' | 'id' };
}

function viewerLocale(req: AuthedRequest, fallback?: 'en' | 'id'): 'en' | 'id' {
  if (fallback === 'id' || fallback === 'en') return fallback;
  const pref = req.user?.localePreference;
  return pref === 'id' ? 'id' : 'en';
}

function viewerId(req: AuthedRequest): string {
  const id = req.user?.id ?? req.user?.sub;
  if (!id) throw new UnauthorizedException({ code: 'auth_required' });
  return id;
}

@Controller('v1/verses')
export class VerseV1Controller {
  constructor(private readonly verse: VerseService) {}

  @Get('themes')
  listThemes(
    @Query(ZodValidate(LocaleQuerySchema)) query: z.infer<typeof LocaleQuerySchema>,
    @Req() req: AuthedRequest,
  ) {
    const locale = viewerLocale(req, query.locale);
    return { locale, themes: this.verse.listThemes(locale) };
  }

  @Get('by-theme')
  listByTheme(
    @Query(ZodValidate(ThemeQuerySchema)) query: z.infer<typeof ThemeQuerySchema>,
    @Req() req: AuthedRequest,
  ) {
    const locale = viewerLocale(req, query.locale);
    const verses = this.verse.listByTheme(query.theme as VerseTheme, locale);
    return { locale, theme: query.theme, verses };
  }

  @Get('daily-pick')
  async dailyPick(
    @Query(ZodValidate(DailyPickQuerySchema)) query: z.infer<typeof DailyPickQuerySchema>,
    @Req() req: AuthedRequest,
  ) {
    const userId = viewerId(req);
    const locale = viewerLocale(req);
    const picked = await this.verse.dailyPick(userId, query.theme as VerseTheme | undefined);
    return { locale, verse: localizeVerse(picked, locale) };
  }

  @Get('by-ref/:ref')
  async byRef(
    @Param(ZodValidate(RefParamSchema)) params: z.infer<typeof RefParamSchema>,
    @Query(ZodValidate(RefQuerySchema)) query: z.infer<typeof RefQuerySchema>,
    @Req() req: AuthedRequest,
  ) {
    const locale = viewerLocale(
      req,
      query.translation === 'en' || query.translation === 'id' ? query.translation : undefined,
    );

    // Pool-fast-path: avoid DB hit for the 84 curated refs.
    const pool = VERSE_BY_REF.get(params.ref);
    if (pool) {
      return { locale, verse: localizeVerse(pool, locale), source: 'pool' as const };
    }

    // Fall through to cache-on-demand. Map locale → translation key.
    const translation = mapTranslation(query.translation, locale);
    try {
      const r = await this.verse.getVerseByRef(params.ref, translation);
      return {
        locale,
        verse: { ref: r.ref, themeTag: null, text: r.text, attribution: r.attribution },
        source: r.cached ? ('cache' as const) : ('upstream' as const),
      };
    } catch (err) {
      if (err instanceof VerseNotFoundError) {
        throw new NotFoundException({ code: 'verse_not_found', ref: err.ref });
      }
      if (err instanceof VerseUpstreamError) {
        throw new BadGatewayException({
          code: 'upstream_unavailable',
          source: err.source,
          status: err.status,
        });
      }
      throw err;
    }
  }
}

function mapTranslation(
  raw: string | undefined,
  locale: 'en' | 'id',
): 'tb' | 'tb2' | 'niv' {
  if (raw === 'tb' || raw === 'tb2' || raw === 'niv') return raw;
  // 'bsb' or 'en' → niv (only public English upstream we have)
  if (raw === 'en' || raw === 'bsb') return 'niv';
  if (raw === 'id') return 'tb';
  return locale === 'id' ? 'tb' : 'niv';
}
