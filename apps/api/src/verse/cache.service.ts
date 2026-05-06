// BLE-98 verse cache (7-day TTL) backed by Postgres via Prisma.
// Source-of-truth for verse text remains upstream (Sabda / Biblica).

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { Translation } from './attribution.js';

const TTL_MS = 7 * 24 * 60 * 60 * 1000;

export type CachedVerse = {
  ref: string;
  translation: Translation;
  text: string;
  attribution: string;
  createdAt: Date;
  expiresAt: Date;
};

@Injectable()
export class VerseCacheService {
  constructor(private readonly prisma: PrismaService) {}

  async read(ref: string, translation: Translation): Promise<CachedVerse | null> {
    const row = await this.prisma.verseCache.findUnique({
      where: { ref_translation: { ref, translation } },
    });
    if (!row) return null;
    if (row.expiresAt.getTime() <= Date.now()) return null;
    return {
      ref: row.ref,
      translation: row.translation as Translation,
      text: row.text,
      attribution: row.attribution,
      createdAt: row.createdAt,
      expiresAt: row.expiresAt,
    };
  }

  async write(entry: {
    ref: string;
    translation: Translation;
    text: string;
    attribution: string;
  }): Promise<void> {
    const expiresAt = new Date(Date.now() + TTL_MS);
    await this.prisma.verseCache.upsert({
      where: {
        ref_translation: { ref: entry.ref, translation: entry.translation },
      },
      create: {
        ref: entry.ref,
        translation: entry.translation,
        text: entry.text,
        attribution: entry.attribution,
        expiresAt,
      },
      update: {
        text: entry.text,
        attribution: entry.attribution,
        expiresAt,
      },
    });
  }

  async purgeExpired(): Promise<number> {
    const { count } = await this.prisma.verseCache.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    return count;
  }
}
