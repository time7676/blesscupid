// BLE-100: variant + state fixtures for VerseOfDayCard.
// Doubles as Storybook input once Storybook lands in apps/mobile.

import type { Translation, VerseResponse } from '../lib/verse/index.js';
import type { VerseOfDayCardProps } from './VerseOfDayCard.js';

const okFetcher =
  (text: string, attribution: string, effective: Translation = 'tb2') =>
  async (ref: string, translation: Translation): Promise<VerseResponse> => ({
    ref,
    translation,
    effective,
    text,
    attribution,
    cached: false,
    fallback: effective !== translation,
  });

const failFetcher = async (): Promise<VerseResponse> => {
  throw new Error('verse-fetch-failed');
};

const slowFetcher =
  (delayMs: number, fetcher: VerseOfDayCardProps['fetcher']) =>
  async (ref: string, translation: Translation): Promise<VerseResponse> => {
    await new Promise((r) => setTimeout(r, delayMs));
    return fetcher!(ref, translation);
  };

export const verseCardFixtures = {
  default: {
    entry: {
      ref: '1 Korintus 13:4-5',
      theme: 'love' as const,
    },
    fetcher: okFetcher(
      'Kasih itu sabar; kasih itu murah hati; ia tidak cemburu. Ia tidak memegahkan diri dan tidak sombong.',
      'TB2 © Lembaga Alkitab Indonesia. NIV © Biblica, Inc.',
    ),
  },

  pastoralSubtitle: {
    entry: {
      ref: '1 Korintus 13:4-5',
      theme: 'love' as const,
      pastoralSubtitle: 'Cinta untuk hari ini lebih besar dari romansa.',
    },
    fetcher: okFetcher(
      'Kasih itu sabar; kasih itu murah hati; ia tidak cemburu. Ia tidak memegahkan diri dan tidak sombong.',
      'TB2 © Lembaga Alkitab Indonesia. NIV © Biblica, Inc.',
    ),
  },

  feature: {
    entry: {
      ref: 'Lukas 2:11',
      theme: 'joy' as const,
    },
    variant: 'feature' as const,
    fetcher: okFetcher(
      'Hari ini telah lahir bagimu Juruselamat, yaitu Kristus, Tuhan, di kota Daud.',
      'TB2 © Lembaga Alkitab Indonesia. NIV © Biblica, Inc.',
    ),
  },

  loading: {
    entry: { ref: 'Yohanes 3:16', theme: 'hope' as const },
    fetcher: slowFetcher(
      100000,
      okFetcher('placeholder', 'TB2 © Lembaga Alkitab Indonesia.'),
    ),
  },

  fallbackTb: {
    entry: { ref: '1 Korintus 13:4-5', theme: 'love' as const },
    fetcher: okFetcher(
      'Kasih itu sabar; kasih itu murah hati; ia tidak cemburu.',
      'TB © Lembaga Alkitab Indonesia. NIV © Biblica, Inc.',
      'tb',
    ),
  },

  allFail: {
    entry: { ref: 'Mazmur 23:1', theme: 'peace' as const },
    fetcher: failFetcher,
  },
} satisfies Record<string, Partial<VerseOfDayCardProps> & Pick<VerseOfDayCardProps, 'entry'>>;
