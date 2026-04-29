import { describe, expect, test } from 'vitest';
import {
  CONTESTED_REFS,
  MOVABLE_FEASTS,
  createCalendarResolver,
  resolveCalendar,
  type FixedEntry,
} from './calendar-resolver.js';
import { liturgicalYear } from './liturgical.js';

/**
 * Synthetic stand-in for the BLE-30 §4 365-entry fixed-date table.
 *
 * We deliberately do NOT transcribe the editorial calendar (BLE-97 acceptance:
 * "do NOT transcribe"). Instead we generate one entry per MM-DD slot with:
 *   - week = floor((dayIndex 0-based)/7)+1, capped at 52
 *   - theme + ref derived deterministically so the resolver's behavior is
 *     observable in test output without needing 365 hand-crafted lines.
 *   - real BLE-30 §3 anchors (Aug 17, Oct 31, Nov 10, Dec 24/25/28/31)
 *     embedded so step 4 (Dec anchors) is exercised against realistic refs.
 *
 * The shape of this fixture matches the contract callers will load from
 * BLE-30 in production (e.g., a JSON export of the editorial calendar).
 */
function buildSyntheticFixedTable(): FixedEntry[] {
  const monthLengths = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const themes = [
    'hope',
    'identity',
    'love',
    'wisdom',
    'faithfulness',
    'friendship',
    'love',
    'community',
    'joy',
    'love',
    'suffering',
    'identity',
    'community',
    'wisdom',
    'love',
    'friendship',
    'marriage',
    'community',
    'joy',
    'hope',
    'wisdom',
    'identity',
    'love',
    'community',
    'wisdom',
    'faithfulness',
    'marriage',
    'love',
    'love',
    'community',
    'wisdom',
    'friendship',
    'identity',
    'love',
    'marriage',
    'wisdom',
    'love',
    'identity',
    'wisdom',
    'community',
    'identity',
    'wisdom',
    'community',
    'suffering',
    'joy',
    'wisdom',
    'marriage',
    'hope', // W48
    'faithfulness', // W49
    'love', // W50
    'hope', // W51
    'joy', // W52
  ];

  const anchors: Record<string, { theme: string; ref: string; pastoral?: boolean }> = {
    '01-01': { theme: 'hope', ref: 'Yeremia 29:11' },
    '02-14': { theme: 'love', ref: '1 Yohanes 4:7-8', pastoral: true },
    '08-17': { theme: 'community', ref: 'Yeremia 29:7' },
    '10-31': { theme: 'suffering', ref: 'Mazmur 51:1-2' },
    '11-10': { theme: 'joy', ref: 'Yohanes 15:13' },
    '12-24': { theme: 'joy', ref: 'Lukas 2:10-11' },
    '12-25': { theme: 'joy', ref: 'Lukas 2:13-14' },
    '12-28': { theme: 'joy', ref: 'Matius 2:13-15', pastoral: true },
    '12-31': { theme: 'joy', ref: 'Mazmur 90:12' },
  };

  const entries: FixedEntry[] = [];
  let day = 0;
  for (let m = 0; m < 12; m += 1) {
    for (let d = 1; d <= monthLengths[m]!; d += 1) {
      const week = Math.min(52, Math.floor(day / 7) + 1);
      const mmdd = `${(m + 1).toString().padStart(2, '0')}-${d
        .toString()
        .padStart(2, '0')}`;
      const anchor = anchors[mmdd];
      if (anchor) {
        entries.push({
          mmdd,
          week,
          theme: anchor.theme,
          ref: anchor.ref,
          ...(anchor.pastoral ? { pastoralSubtitleRequired: true } : {}),
        });
      } else {
        entries.push({
          mmdd,
          week,
          theme: themes[(week - 1) % themes.length]!,
          ref: `TestBook ${week}:${(day % 7) + 1}`,
        });
      }
      day += 1;
    }
  }
  return entries;
}

const TABLE = buildSyntheticFixedTable();

describe('resolveCalendar — movable feast overrides', () => {
  for (const year of [2026, 2027, 2030]) {
    test(`${year} stamps every BLE-30 §5 movable feast at the computed date`, () => {
      const map = resolveCalendar({ year, fixedTable: TABLE });
      const lit = liturgicalYear(year);
      for (const feast of MOVABLE_FEASTS) {
        const iso = lit[feast.key];
        const entry = map.get(iso);
        expect(entry).toBeDefined();
        expect(entry).toMatchObject({
          date: iso,
          ref: feast.ref,
          theme: feast.theme,
          source: 'movable',
          movableKey: feast.key,
        });
        if (feast.isFeatureDay) {
          expect(entry?.isFeatureDay).toBe(true);
        }
      }
    });
  }
});

describe('resolveCalendar — Advent shift', () => {
  test('2026 advent W1 lands on 2026-11-29 (Sunday closest to Nov 30)', () => {
    const map = resolveCalendar({ year: 2026, fixedTable: TABLE });
    const advW1 = map.get('2026-11-29');
    expect(advW1?.source).toBe('advent-shift');
    expect(advW1?.week).toBe(48);
    expect(new Date(advW1!.date + 'T00:00:00Z').getUTCDay()).toBe(0);
  });

  test('2027 advent W1 lands on 2027-11-28 (Sunday)', () => {
    const map = resolveCalendar({ year: 2027, fixedTable: TABLE });
    expect(map.get('2027-11-28')?.source).toBe('advent-shift');
    expect(new Date('2027-11-28T00:00:00Z').getUTCDay()).toBe(0);
  });

  test('2030 advent W1 lands on 2030-12-01 (Sunday)', () => {
    const map = resolveCalendar({ year: 2030, fixedTable: TABLE });
    expect(map.get('2030-12-01')?.source).toBe('advent-shift');
    expect(new Date('2030-12-01T00:00:00Z').getUTCDay()).toBe(0);
  });

  test('shift produces 28 contiguous advent-shift entries from advW1', () => {
    for (const year of [2026, 2027, 2030]) {
      const map = resolveCalendar({ year, fixedTable: TABLE });
      const advW1Iso = liturgicalYear(year).adventW1;
      const start = new Date(`${advW1Iso}T00:00:00Z`);
      const advent: string[] = [];
      for (let i = 0; i < 28; i += 1) {
        const d = new Date(start.getTime());
        d.setUTCDate(d.getUTCDate() + i);
        const iso = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
        const entry = map.get(iso);
        // Dec 24/25/28 fall inside the shifted window for some years and get
        // re-anchored by step 4. Allow either source on those days.
        const isAnchorDay =
          iso.endsWith('-12-24') ||
          iso.endsWith('-12-25') ||
          iso.endsWith('-12-28');
        if (isAnchorDay) {
          expect(['advent-shift', 'advent-anchor']).toContain(entry?.source);
        } else {
          expect(entry?.source).toBe('advent-shift');
          advent.push(iso);
        }
      }
      expect(advent.length).toBeGreaterThanOrEqual(25); // at least 28 - 3 anchor overlaps
    }
  });
});

describe('resolveCalendar — Dec anchors preserved after Advent shift', () => {
  for (const year of [2026, 2027, 2030]) {
    test(`${year} Dec 24 / 25 / 28 / 31 stay on their fixed dates with §4 refs`, () => {
      const map = resolveCalendar({ year, fixedTable: TABLE });
      expect(map.get(`${year}-12-24`)).toMatchObject({
        ref: 'Lukas 2:10-11',
        source: 'advent-anchor',
      });
      expect(map.get(`${year}-12-25`)).toMatchObject({
        ref: 'Lukas 2:13-14',
        source: 'advent-anchor',
      });
      expect(map.get(`${year}-12-28`)).toMatchObject({
        ref: 'Matius 2:13-15',
        source: 'advent-anchor',
        pastoralSubtitleRequired: true,
      });
      expect(map.get(`${year}-12-31`)).toMatchObject({
        ref: 'Mazmur 90:12',
        source: 'advent-anchor',
      });
    });
  }
});

describe('resolveCalendar — non-Advent fixed entries pass through', () => {
  test('Aug 17 community anchor preserved in 2026', () => {
    const map = resolveCalendar({ year: 2026, fixedTable: TABLE });
    expect(map.get('2026-08-17')).toMatchObject({
      ref: 'Yeremia 29:7',
      theme: 'community',
      source: 'fixed',
    });
  });

  test('Feb 14 love anchor preserved in 2027 with pastoral flag', () => {
    const map = resolveCalendar({ year: 2027, fixedTable: TABLE });
    expect(map.get('2027-02-14')).toMatchObject({
      ref: '1 Yohanes 4:7-8',
      theme: 'love',
      source: 'fixed',
      pastoralSubtitleRequired: true,
    });
  });
});

describe('resolveCalendar — contested-verse defensive substitution', () => {
  test('contested ref in fixed table is replaced with prior-week same-theme entry', () => {
    // Pick any non-Advent love-themed entry from the synthetic table and
    // taint it with a §6 contested ref so substitution is forced.
    const victim = TABLE.find((e) => e.theme === 'love' && e.week > 1 && e.week < 48);
    expect(victim).toBeDefined();
    const tainted: FixedEntry[] = TABLE.map((e) =>
      e.mmdd === victim!.mmdd ? { ...e, ref: 'Maleakhi 2:16' } : e,
    );

    const map = resolveCalendar({ year: 2026, fixedTable: tainted });
    const iso = `2026-${victim!.mmdd}`;
    const resolved = map.get(iso);
    expect(resolved?.ref).not.toBe('Maleakhi 2:16');
    expect(resolved?.source).toBe('contested-substitute');
    expect(resolved?.originalRef).toBe('Maleakhi 2:16');
    expect(resolved?.theme).toBe('love');
  });

  test('non-contested refs are not substituted', () => {
    const map = resolveCalendar({ year: 2026, fixedTable: TABLE });
    for (const entry of map.values()) {
      expect(entry.source).not.toBe('contested-substitute');
    }
  });

  test('CONTESTED_REFS exposes the BLE-30 §6 list', () => {
    expect(CONTESTED_REFS.has('Efesus 5:22-24')).toBe(true);
    expect(CONTESTED_REFS.has('1 Korintus 7:9')).toBe(true);
    expect(CONTESTED_REFS.has('2 Korintus 6:14')).toBe(true);
    // Sanity: 1 Korintus 13:4-5 is the love anchor — must NOT be on the list.
    expect(CONTESTED_REFS.has('1 Korintus 13:4-5')).toBe(false);
  });
});

describe('resolveCalendar — invariants per BLE-97 acceptance', () => {
  for (const year of [2026, 2027, 2030]) {
    test(`${year} resolved snapshot is stable for key dates`, () => {
      const map = resolveCalendar({ year, fixedTable: TABLE });
      const lit = liturgicalYear(year);

      const summary = {
        year,
        adventW1: lit.adventW1,
        adventW1Source: map.get(lit.adventW1)?.source,
        paskah: lit.paskah,
        paskahRef: map.get(lit.paskah)?.ref,
        paskahFeature: map.get(lit.paskah)?.isFeatureDay ?? false,
        rabuAbu: lit.rabuAbu,
        rabuAbuRef: map.get(lit.rabuAbu)?.ref,
        kenaikan: lit.kenaikan,
        kenaikanRef: map.get(lit.kenaikan)?.ref,
        pentakosta: lit.pentakosta,
        pentakostaRef: map.get(lit.pentakosta)?.ref,
        pentakostaFeature: map.get(lit.pentakosta)?.isFeatureDay ?? false,
        dec24Ref: map.get(`${year}-12-24`)?.ref,
        dec25Ref: map.get(`${year}-12-25`)?.ref,
        dec28Ref: map.get(`${year}-12-28`)?.ref,
        dec31Ref: map.get(`${year}-12-31`)?.ref,
      };
      expect(summary).toMatchSnapshot();
    });
  }
});

describe('createCalendarResolver — per-year cache', () => {
  test('returns the same Map instance for repeated calls with same year', () => {
    const resolve = createCalendarResolver(TABLE);
    const a = resolve(2026);
    const b = resolve(2026);
    expect(a).toBe(b);
  });

  test('different years produce different Maps', () => {
    const resolve = createCalendarResolver(TABLE);
    expect(resolve(2026)).not.toBe(resolve(2027));
    expect(resolve(2026).get('2026-04-05')?.ref).toBe('Matius 28:5-7');
    expect(resolve(2027).get('2027-03-28')?.ref).toBe('Matius 28:5-7');
  });
});
