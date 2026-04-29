import { describe, expect, test } from 'vitest';
import { adventW1Sunday, easterSunday, liturgicalYear } from './liturgical.js';

const iso = (d: Date) =>
  `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(
    d.getUTCDate(),
  ).padStart(2, '0')}`;

// Canonical Western (Gregorian) Easter dates from
// https://en.wikipedia.org/wiki/List_of_dates_for_Easter
const EASTER: Record<number, string> = {
  2026: '2026-04-05',
  2027: '2027-03-28',
  2030: '2030-04-21',
  2038: '2038-04-25',
};

// First Sunday of Advent, same source.
const ADVENT_W1: Record<number, string> = {
  2026: '2026-11-29',
  2027: '2027-11-28',
  2030: '2030-12-01',
  2038: '2038-11-28',
};

describe('easterSunday', () => {
  for (const [year, expected] of Object.entries(EASTER)) {
    test(`Easter ${year} = ${expected}`, () => {
      expect(iso(easterSunday(Number(year)))).toBe(expected);
    });
  }
});

describe('adventW1Sunday', () => {
  for (const [year, expected] of Object.entries(ADVENT_W1)) {
    test(`Advent W1 ${year} = ${expected}`, () => {
      expect(iso(adventW1Sunday(Number(year)))).toBe(expected);
    });
  }

  test('always falls Nov 27 - Dec 3 inclusive', () => {
    for (let y = 2020; y <= 2100; y++) {
      const d = adventW1Sunday(y);
      expect(d.getUTCDay()).toBe(0); // Sunday
      const month = d.getUTCMonth() + 1;
      const day = d.getUTCDate();
      const inWindow =
        (month === 11 && day >= 27) || (month === 12 && day <= 3);
      expect(inWindow).toBe(true);
    }
  });
});

describe('liturgicalYear derivations', () => {
  test('2026 full set', () => {
    expect(liturgicalYear(2026)).toEqual({
      rabuAbu: '2026-02-18',
      mingguPalma: '2026-03-29',
      kamisPutih: '2026-04-02',
      jumatAgung: '2026-04-03',
      sabtuSunyi: '2026-04-04',
      paskah: '2026-04-05',
      seninPaskah: '2026-04-06',
      kenaikan: '2026-05-14',
      pentakosta: '2026-05-24',
      trinitatis: '2026-05-31',
      adventW1: '2026-11-29',
    });
  });

  test('2027 full set', () => {
    expect(liturgicalYear(2027)).toEqual({
      rabuAbu: '2027-02-10',
      mingguPalma: '2027-03-21',
      kamisPutih: '2027-03-25',
      jumatAgung: '2027-03-26',
      sabtuSunyi: '2027-03-27',
      paskah: '2027-03-28',
      seninPaskah: '2027-03-29',
      kenaikan: '2027-05-06',
      pentakosta: '2027-05-16',
      trinitatis: '2027-05-23',
      adventW1: '2027-11-28',
    });
  });

  test('2030 full set', () => {
    expect(liturgicalYear(2030)).toEqual({
      rabuAbu: '2030-03-06',
      mingguPalma: '2030-04-14',
      kamisPutih: '2030-04-18',
      jumatAgung: '2030-04-19',
      sabtuSunyi: '2030-04-20',
      paskah: '2030-04-21',
      seninPaskah: '2030-04-22',
      kenaikan: '2030-05-30',
      pentakosta: '2030-06-09',
      trinitatis: '2030-06-16',
      adventW1: '2030-12-01',
    });
  });

  test('2038 full set', () => {
    expect(liturgicalYear(2038)).toEqual({
      rabuAbu: '2038-03-10',
      mingguPalma: '2038-04-18',
      kamisPutih: '2038-04-22',
      jumatAgung: '2038-04-23',
      sabtuSunyi: '2038-04-24',
      paskah: '2038-04-25',
      seninPaskah: '2038-04-26',
      kenaikan: '2038-06-03',
      pentakosta: '2038-06-13',
      trinitatis: '2038-06-20',
      adventW1: '2038-11-28',
    });
  });

  test('output keys exactly match LiturgicalYear shape', () => {
    const keys = Object.keys(liturgicalYear(2026)).sort();
    expect(keys).toEqual(
      [
        'adventW1',
        'jumatAgung',
        'kamisPutih',
        'kenaikan',
        'mingguPalma',
        'paskah',
        'pentakosta',
        'rabuAbu',
        'sabtuSunyi',
        'seninPaskah',
        'trinitatis',
      ].sort(),
    );
  });

  test('every value is an ISO YYYY-MM-DD string', () => {
    const result = liturgicalYear(2026);
    for (const value of Object.values(result)) {
      expect(value).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});
