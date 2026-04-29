/**
 * BLE-96 — Liturgical-year date computation. Pure, no I/O.
 *
 * Western (Gregorian) Easter via Anonymous Gregorian algorithm
 * (Meeus/Jones/Butcher), the modern equivalent of the Gauss
 * algorithm spec'd in BLE-84 §7.
 *
 * All outputs are ISO date strings (YYYY-MM-DD) in UTC.
 */

export type LiturgicalYear = {
  rabuAbu: string;        // Ash Wednesday, Easter - 46d
  mingguPalma: string;    // Palm Sunday, Easter - 7d
  kamisPutih: string;     // Maundy Thursday, Easter - 3d
  jumatAgung: string;     // Good Friday, Easter - 2d
  sabtuSunyi: string;     // Holy Saturday, Easter - 1d
  paskah: string;         // Easter Sunday
  seninPaskah: string;    // Easter Monday, Easter + 1d
  kenaikan: string;       // Ascension, Easter + 39d
  pentakosta: string;     // Pentecost, Easter + 49d
  trinitatis: string;     // Trinity Sunday, Easter + 56d
  adventW1: string;       // First Sunday of Advent of the same year
};

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function toISO(d: Date): string {
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}

function addDays(d: Date, days: number): Date {
  const r = new Date(d.getTime());
  r.setUTCDate(r.getUTCDate() + days);
  return r;
}

/**
 * Western Easter Sunday for the given Gregorian year.
 * Returns a UTC Date at 00:00.
 */
export function easterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const L = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * L) / 451);
  const month = Math.floor((h + L - 7 * m + 114) / 31); // 3=March, 4=April
  const day = ((h + L - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day));
}

/**
 * First Sunday of Advent: the Sunday on or after Nov 27 of the given year.
 * Always falls between Nov 27 and Dec 3 inclusive.
 */
export function adventW1Sunday(year: number): Date {
  const nov27 = new Date(Date.UTC(year, 10, 27));
  const dow = nov27.getUTCDay(); // 0 = Sunday
  const offset = dow === 0 ? 0 : 7 - dow;
  return addDays(nov27, offset);
}

/**
 * Compute every named liturgical date for the given Gregorian year.
 */
export function liturgicalYear(year: number): LiturgicalYear {
  const paskah = easterSunday(year);
  return {
    rabuAbu: toISO(addDays(paskah, -46)),
    mingguPalma: toISO(addDays(paskah, -7)),
    kamisPutih: toISO(addDays(paskah, -3)),
    jumatAgung: toISO(addDays(paskah, -2)),
    sabtuSunyi: toISO(addDays(paskah, -1)),
    paskah: toISO(paskah),
    seninPaskah: toISO(addDays(paskah, 1)),
    kenaikan: toISO(addDays(paskah, 39)),
    pentakosta: toISO(addDays(paskah, 49)),
    trinitatis: toISO(addDays(paskah, 56)),
    adventW1: toISO(adventW1Sunday(year)),
  };
}
