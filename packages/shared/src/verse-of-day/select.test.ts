// BLE-102 tests: verse-of-day profile-mode filter.

import { describe, expect, test } from 'vitest';
import { selectVerseOfDay, __internals } from './select.js';
import type { VerseEntry, VerseTheme } from './types.js';

const THEME_CYCLE: VerseTheme[] = [
  'marriage',
  'love',
  'joy',
  'faith',
  'hope',
  'peace',
  'wisdom',
  'service',
  'community',
  'identity',
];

function isoDate(year: number, dayIndex: number): string {
  const d = new Date(Date.UTC(year, 0, 1));
  d.setUTCDate(d.getUTCDate() + dayIndex);
  return d.toISOString().slice(0, 10);
}

function isoWeek(date: string): number {
  // Cheap deterministic ISO-ish week for fixtures: ceil(dayOfYear / 7).
  // Real calendar uses true ISO weeks; tests don't care which scheme as long
  // as it's stable and groups 7 consecutive days.
  const d = new Date(`${date}T00:00:00Z`);
  const start = Date.UTC(d.getUTCFullYear(), 0, 1);
  const diff = (d.getTime() - start) / 86_400_000;
  return Math.floor(diff / 7) + 1;
}

// Calendar fixture: 365 days, themes cycle daily so each ISO week contains a
// mix (marriage included). Guarantees same-week substitutes always exist.
function buildMixedCalendar(year = 2026): VerseEntry[] {
  return Array.from({ length: 365 }, (_, i) => {
    const date = isoDate(year, i);
    return {
      date,
      weekNumber: isoWeek(date),
      theme: THEME_CYCLE[i % THEME_CYCLE.length]!,
      ref: `Fixture ${i + 1}`,
    };
  });
}

// All-marriage week (week 5) inside an otherwise mixed calendar; the prior
// 14 days include joy and love entries so the fallback path can fire.
function buildAllMarriageWeekCalendar(year = 2026): VerseEntry[] {
  const cal = buildMixedCalendar(year);
  const targetWeek = 5;
  return cal.map((e) => (e.weekNumber === targetWeek ? { ...e, theme: 'marriage' } : e));
}

describe('selectVerseOfDay', () => {
  test('non-friendship-only modes pass through unmodified', () => {
    const cal = buildMixedCalendar();
    const marriageDay = cal.find((e) => e.theme === 'marriage')!;
    for (const mode of ['dating', 'commonsphere'] as const) {
      const out = selectVerseOfDay({
        date: marriageDay.date,
        userId: 'u-1',
        mode,
        calendar: cal,
      });
      expect(out?.entry.theme).toBe('marriage');
      expect(out?.substituted).toBe(false);
    }
  });

  test('friendship-only on non-marriage day passes through', () => {
    const cal = buildMixedCalendar();
    const joyDay = cal.find((e) => e.theme === 'joy')!;
    const out = selectVerseOfDay({
      date: joyDay.date,
      userId: 'u-1',
      mode: 'friendship-only',
      calendar: cal,
    });
    expect(out?.entry.theme).toBe('joy');
    expect(out?.substituted).toBe(false);
  });

  test('friendship-only swaps marriage for same-week non-marriage', () => {
    const cal = buildMixedCalendar();
    const marriageDay = cal.find((e) => e.theme === 'marriage')!;
    const out = selectVerseOfDay({
      date: marriageDay.date,
      userId: 'u-1',
      mode: 'friendship-only',
      calendar: cal,
    });
    expect(out?.substituted).toBe(true);
    expect(out?.reason).toBe('same-week-non-marriage');
    expect(out?.entry.theme).not.toBe('marriage');
    expect(out?.entry.weekNumber).toBe(marriageDay.weekNumber);
    expect(out?.originalEntry).toEqual(marriageDay);
  });

  test('determinism: same user + same date → same substitute', () => {
    const cal = buildMixedCalendar();
    const marriageDay = cal.find((e) => e.theme === 'marriage')!;
    const a = selectVerseOfDay({
      date: marriageDay.date,
      userId: 'u-deterministic',
      mode: 'friendship-only',
      calendar: cal,
    });
    const b = selectVerseOfDay({
      date: marriageDay.date,
      userId: 'u-deterministic',
      mode: 'friendship-only',
      calendar: cal,
    });
    expect(a?.entry.ref).toBe(b?.entry.ref);
  });

  test('different users diverge across substitutions', () => {
    const cal = buildMixedCalendar();
    const marriageDays = cal.filter((e) => e.theme === 'marriage');
    const refsA = marriageDays.map(
      (m) =>
        selectVerseOfDay({
          date: m.date,
          userId: 'user-A',
          mode: 'friendship-only',
          calendar: cal,
        })?.entry.ref,
    );
    const refsB = marriageDays.map(
      (m) =>
        selectVerseOfDay({
          date: m.date,
          userId: 'user-B',
          mode: 'friendship-only',
          calendar: cal,
        })?.entry.ref,
    );
    // At least one day should differ between users (otherwise hash is broken).
    const diverged = refsA.some((r, i) => r !== refsB[i]);
    expect(diverged).toBe(true);
  });

  test('whole-week marriage falls back to recent joy/love', () => {
    const cal = buildAllMarriageWeekCalendar();
    const allMarriageDay = cal.find(
      (e) => e.weekNumber === 5 && e.theme === 'marriage',
    )!;
    const out = selectVerseOfDay({
      date: allMarriageDay.date,
      userId: 'u-1',
      mode: 'friendship-only',
      calendar: cal,
    });
    expect(out).not.toBeNull();
    expect(out!.substituted).toBe(true);
    expect(out!.reason).toBe('recent-joy-love-fallback');
    expect(['joy', 'love']).toContain(out!.entry.theme);
  });

  test('365-day simulation: friendship-only never sees a marriage card', () => {
    const cal = buildMixedCalendar();
    const userId = 'sim-friendship-only';
    const themes: VerseTheme[] = [];
    for (const entry of cal) {
      const out = selectVerseOfDay({
        date: entry.date,
        userId,
        mode: 'friendship-only',
        calendar: cal,
      });
      // Every day must yield a card (mixed calendar guarantees substitutes).
      expect(out).not.toBeNull();
      themes.push(out!.entry.theme);
    }
    expect(themes.length).toBe(365);
    expect(themes.includes('marriage')).toBe(false);
  });
});

describe('hash internals', () => {
  test('fnv1a is stable and well-distributed enough for short ids', () => {
    const a = __internals.fnv1a('user-A|2026-01-01');
    const b = __internals.fnv1a('user-A|2026-01-01');
    expect(a).toBe(b);
    expect(__internals.fnv1a('user-A|2026-01-02')).not.toBe(a);
  });
});
