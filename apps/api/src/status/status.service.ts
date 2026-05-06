import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { VerseService } from '../verse/verse.service.js';
import { VERSE_BY_REF, localizeVerse } from '../verse/verse-pool.js';
import type { Locale, VerseUsedFor } from '@prisma/client';

export interface StatusVerseDto {
  verseRef: string;
  verseText: string;
  attribution: string;
  setAt: string;
  expiresAt: string | null;
}

@Injectable()
export class StatusService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly verse: VerseService,
  ) {}

  /**
   * Set or replace the user's active StatusVerse.
   * - Validates verseRef is in the curated 84-pool (no free-text moderation surface).
   * - Localizes text/attribution from pool per user's locale preference.
   * - Writes UserVerseHistory(usedFor='status') row for de-dup tracking.
   * - Replaces any prior StatusVerse (no expiresAt by default = sticky).
   */
  async set(
    userId: string,
    verseRef: string,
    locale: Locale = 'en',
  ): Promise<StatusVerseDto> {
    const poolVerse = VERSE_BY_REF.get(verseRef);
    if (!poolVerse) {
      throw new NotFoundException({
        error: 'verse_not_in_pool',
        message: 'Verse must be selected from the curated pool.',
      });
    }

    const localized = localizeVerse(poolVerse, locale);

    return this.prisma.$transaction(async (tx) => {
      const status = await tx.statusVerse.upsert({
        where: { userId },
        create: {
          userId,
          verseRef: poolVerse.ref,
          verseText: localized.text,
          attribution: localized.attribution,
          setAt: new Date(),
          expiresAt: null,
        },
        update: {
          verseRef: poolVerse.ref,
          verseText: localized.text,
          attribution: localized.attribution,
          setAt: new Date(),
          expiresAt: null,
        },
      });

      await tx.userVerseHistory.create({
        data: {
          userId,
          verseRef: poolVerse.ref,
          usedFor: 'status' as VerseUsedFor,
        },
      });

      return {
        verseRef: status.verseRef,
        verseText: status.verseText,
        attribution: status.attribution,
        setAt: status.setAt.toISOString(),
        expiresAt: status.expiresAt?.toISOString() ?? null,
      };
    });
  }

  async getMine(userId: string): Promise<StatusVerseDto | null> {
    const row = await this.prisma.statusVerse.findUnique({ where: { userId } });
    if (!row) return null;
    return {
      verseRef: row.verseRef,
      verseText: row.verseText,
      attribution: row.attribution,
      setAt: row.setAt.toISOString(),
      expiresAt: row.expiresAt?.toISOString() ?? null,
    };
  }

  async clear(userId: string): Promise<void> {
    await this.prisma.statusVerse.deleteMany({ where: { userId } });
  }

  /**
   * Get another user's StatusVerse (used by ProfileDetailSheet, swipe card halo).
   * No privacy guard — Status is intentionally public to anyone who can see the profile.
   */
  async getForUser(userId: string): Promise<StatusVerseDto | null> {
    return this.getMine(userId);
  }

  /**
   * Suggest verses for the StatusComposer picker.
   * Returns verses from the pool, optionally filtered by theme,
   * de-duped against this user's recent status history (90d window via UserVerseHistory).
   */
  async suggestVerses(
    userId: string,
    locale: Locale,
    themeTag?: string,
  ): Promise<{ verses: Array<{ ref: string; text: string; attribution: string; themeTag: string }> }> {
    return this.verse.dailyPick(userId, locale, themeTag);
  }
}
