// Prisma seeder for the curated 84-verse pool.
//
// Idempotent. Writes one VerseCache row per (ref × translation) for both
// `tb` (LAI TB Indonesian) and a public-domain English variant stored under
// `bsb` (Berean Standard Bible) — using `bsb` as the translation key keeps
// the existing `tb | tb2 | niv` upstream-fetcher path untouched. Verses
// stored here have a 365-day expiry so the warmer never tries to refresh
// them from upstream.
//
// Translation key choice: VerseCache.translation is a free-form string in
// the schema — the Translation enum only constrains the upstream fetcher.
// We use `bsb` so future NIV upstream fetches can coexist without colliding
// with the seeded English text.

import type { PrismaClient } from '@prisma/client';
import { LAI_TB_ATTRIBUTION, VERSE_POOL } from './verse-pool.js';

export const SEEDED_EN_TRANSLATION = 'bsb';
export const SEEDED_ID_TRANSLATION = 'tb';

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

export interface SeedVerseStats {
  enUpserted: number;
  idUpserted: number;
}

export async function seedVerses(prisma: PrismaClient): Promise<SeedVerseStats> {
  const expiresAt = new Date(Date.now() + ONE_YEAR_MS);
  let enUpserted = 0;
  let idUpserted = 0;

  for (const v of VERSE_POOL) {
    await prisma.verseCache.upsert({
      where: { ref_translation: { ref: v.ref, translation: SEEDED_EN_TRANSLATION } },
      create: {
        ref: v.ref,
        translation: SEEDED_EN_TRANSLATION,
        text: v.text_en,
        attribution: v.attribution,
        expiresAt,
      },
      update: {
        text: v.text_en,
        attribution: v.attribution,
        expiresAt,
      },
    });
    enUpserted += 1;

    await prisma.verseCache.upsert({
      where: { ref_translation: { ref: v.ref, translation: SEEDED_ID_TRANSLATION } },
      create: {
        ref: v.ref,
        translation: SEEDED_ID_TRANSLATION,
        text: v.text_id,
        attribution: LAI_TB_ATTRIBUTION,
        expiresAt,
      },
      update: {
        text: v.text_id,
        attribution: LAI_TB_ATTRIBUTION,
        expiresAt,
      },
    });
    idUpserted += 1;
  }

  return { enUpserted, idUpserted };
}
