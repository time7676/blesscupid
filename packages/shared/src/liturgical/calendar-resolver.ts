/**
 * BLE-97 — Calendar override resolver.
 *
 * Applies BLE-30 §5 movable-feast overrides and the BLE-30 §3 / §5 Advent-week
 * shift onto the BLE-30 §4 fixed-date table for an active liturgical year.
 *
 * Output: `Map<isoDate, ResolvedEntry>` per year. Caller wraps with
 * `createCalendarResolver` for per-year caching.
 *
 * Spec: BLE-84 plan §6 + §7. Easter dates come from the BLE-96 utility
 * (`liturgicalYear`) — no transcription of the §4 calendar.
 */

import { liturgicalYear, type LiturgicalYear } from './liturgical.js';

/**
 * Single row from the BLE-30 §4 fixed-date table. Verse text is never stored
 * (per §1) — only reference, theme, week-of-year, and pastoral flags.
 */
export type FixedEntry = {
  /** Month-day slot in `MM-DD` form. Feb 29 entries are skipped on non-leap years. */
  mmdd: string;
  /** BLE-30 §4 week number (1..52). Used by Advent shift + contested substitution. */
  week: number;
  theme: string;
  ref: string;
  /** §7 — surface a one-line subtitle on the card. */
  pastoralSubtitleRequired?: boolean;
};

/**
 * BLE-30 §5 movable-feast spec. Date is computed per liturgical year via
 * `liturgicalYear(year)[key]`.
 */
export type MovableFeastSpec = {
  key: keyof Omit<LiturgicalYear, 'adventW1'>;
  theme: string;
  ref: string;
  /** §3 + plan §6 — `feature` card variant + 05:30 WIB push. */
  isFeatureDay?: boolean;
};

export type ResolveSource =
  | 'fixed'
  | 'movable'
  | 'advent-shift'
  | 'advent-anchor'
  | 'contested-substitute';

export type ResolvedEntry = {
  /** ISO YYYY-MM-DD (UTC). */
  date: string;
  week: number;
  theme: string;
  ref: string;
  source: ResolveSource;
  pastoralSubtitleRequired?: boolean;
  isFeatureDay?: boolean;
  movableKey?: MovableFeastSpec['key'];
  /** Set when `source === 'contested-substitute'` — the original §4 ref this row replaced. */
  originalRef?: string;
};

/**
 * BLE-30 §5 movable-feast table. Refs from the editorial calendar.
 * Themes match BLE-30 §2.
 */
export const MOVABLE_FEASTS: ReadonlyArray<MovableFeastSpec> = [
  { key: 'rabuAbu', theme: 'suffering', ref: 'Yoel 2:12-13' },
  { key: 'mingguPalma', theme: 'hope', ref: 'Matius 21:9' },
  { key: 'kamisPutih', theme: 'love', ref: 'Yohanes 13:34-35' },
  { key: 'jumatAgung', theme: 'suffering', ref: 'Yesaya 53:5' },
  { key: 'sabtuSunyi', theme: 'suffering', ref: 'Ratapan 3:25-26' },
  { key: 'paskah', theme: 'joy', ref: 'Matius 28:5-7', isFeatureDay: true },
  { key: 'seninPaskah', theme: 'joy', ref: '1 Korintus 15:54-57' },
  { key: 'kenaikan', theme: 'identity', ref: 'Kisah Para Rasul 1:8-11' },
  { key: 'pentakosta', theme: 'community', ref: 'Kisah Para Rasul 2:1-4', isFeatureDay: true },
  { key: 'trinitatis', theme: 'identity', ref: 'Matius 28:19' },
];

/**
 * BLE-30 §6 contested-verse exclusion list. Multi-ref bullets are split into
 * exact-match entries since the BLE-30 §4 table holds one ref per row.
 *
 * Defensive only — content review should have removed these from §4.
 */
export const CONTESTED_REFS: ReadonlySet<string> = new Set<string>([
  'Maleakhi 2:16',
  'Efesus 5:22-24',
  '1 Timotius 2:11-15',
  '1 Korintus 14:34-35',
  'Imamat 18:22',
  'Imamat 20:13',
  'Roma 1:26-27',
  '1 Korintus 6:9',
  'Matius 19:9',
  'Markus 10:11-12',
  'Ibrani 10:26-27',
  'Matius 5:28',
  'Amsal 12:4',
  'Amsal 14:1',
  'Amsal 21:9',
  'Amsal 21:19',
  'Titus 2:4-5',
  '2 Korintus 6:14',
  'Mazmur 37:4',
  'Markus 11:24',
  'Yohanes 14:14',
  '1 Korintus 7:9',
  'Pengkhotbah 4:11',
]);

/** BLE-30 §3 — Christmas / Holy Innocents / year-end anchors that survive Advent shift. */
const ADVENT_ANCHOR_MMDDS = ['12-24', '12-25', '12-28', '12-31'] as const;
/** BLE-30 §4 — the four Advent weeks shifted by Advent W1 Sunday each year. */
const ADVENT_WEEK_NUMBERS: ReadonlySet<number> = new Set([48, 49, 50, 51]);

export type ResolveInput = {
  year: number;
  fixedTable: ReadonlyArray<FixedEntry>;
  /** Defaults to `CONTESTED_REFS`. Override for tests or future Pastor revisions. */
  contestedRefs?: ReadonlySet<string>;
  /** Defaults to `MOVABLE_FEASTS`. Override for tests. */
  movableFeasts?: ReadonlyArray<MovableFeastSpec>;
};

export function resolveCalendar(input: ResolveInput): Map<string, ResolvedEntry> {
  const {
    year,
    fixedTable,
    contestedRefs = CONTESTED_REFS,
    movableFeasts = MOVABLE_FEASTS,
  } = input;
  const lit = liturgicalYear(year);
  const map = new Map<string, ResolvedEntry>();

  // 1. Stamp non-Advent fixed entries at their MM-DD slot.
  //    Advent W48–W51 entries are deliberately deferred to step 3 since
  //    their ISO date depends on the current year's Advent W1 Sunday.
  for (const e of fixedTable) {
    if (ADVENT_WEEK_NUMBERS.has(e.week)) continue;
    const iso = mmddToIso(year, e.mmdd);
    if (!iso) continue;
    map.set(iso, {
      date: iso,
      week: e.week,
      theme: e.theme,
      ref: e.ref,
      source: 'fixed',
      ...(e.pastoralSubtitleRequired
        ? { pastoralSubtitleRequired: true }
        : {}),
    });
  }

  // 2. Stamp movable feasts at their computed ISO dates. Overwrites any §4
  //    fixed entry that landed on the same day (per BLE-84 §7 step 2).
  for (const m of movableFeasts) {
    const iso = lit[m.key];
    map.set(iso, {
      date: iso,
      // Movable feasts aren't part of §4's W1..W52 numbering. Use 0 to
      // signal "movable, week-number not meaningful" — callers that need
      // theme rotation derive theme from the entry directly.
      week: 0,
      theme: m.theme,
      ref: m.ref,
      source: 'movable',
      movableKey: m.key,
      ...(m.isFeatureDay ? { isFeatureDay: true } : {}),
    });
  }

  // 3. Advent shift: lay W48..W51 entries (in week+mmdd order) consecutively
  //    starting from this year's Advent W1 Sunday.
  const adventEntries = fixedTable
    .filter((e) => ADVENT_WEEK_NUMBERS.has(e.week))
    .slice()
    .sort((a, b) => {
      if (a.week !== b.week) return a.week - b.week;
      return a.mmdd < b.mmdd ? -1 : a.mmdd > b.mmdd ? 1 : 0;
    });

  const advW1 = parseIso(lit.adventW1);
  for (let i = 0; i < adventEntries.length; i += 1) {
    const e = adventEntries[i]!;
    const iso = formatIso(addUtcDays(advW1, i));
    map.set(iso, {
      date: iso,
      week: e.week,
      theme: e.theme,
      ref: e.ref,
      source: 'advent-shift',
      ...(e.pastoralSubtitleRequired
        ? { pastoralSubtitleRequired: true }
        : {}),
    });
  }

  // 4. Re-stamp Dec 24 / 25 / 28 / 31 anchors. The Advent shift can run as
  //    late as Dec 28 (advW1 = Dec 1, i=27 → Dec 28), so anchors may have
  //    been overwritten in step 3. Movable feasts never land in late Dec —
  //    Easter is bounded Mar 22..Apr 25 — so movable rows are safe to leave.
  for (const mmdd of ADVENT_ANCHOR_MMDDS) {
    const fixed = fixedTable.find((e) => e.mmdd === mmdd);
    if (!fixed) continue;
    const iso = mmddToIso(year, mmdd);
    if (!iso) continue;
    map.set(iso, {
      date: iso,
      week: fixed.week,
      theme: fixed.theme,
      ref: fixed.ref,
      source: 'advent-anchor',
      ...(fixed.pastoralSubtitleRequired
        ? { pastoralSubtitleRequired: true }
        : {}),
    });
  }

  // 5. Contested-verse defensive substitution (BLE-30 §6 / plan §7 step 4).
  //    On a hit, substitute with prior-week same-theme entry from §4.
  //    If no prior-week match (W1 entries, or theme spans only this week),
  //    fall back to the closest earlier same-theme §4 entry.
  for (const [iso, entry] of map) {
    if (!contestedRefs.has(entry.ref)) continue;
    const sub = findPriorThemeSubstitute(entry, fixedTable, contestedRefs);
    if (!sub) continue;
    const next: ResolvedEntry = {
      date: entry.date,
      week: entry.week,
      theme: entry.theme,
      ref: sub.ref,
      source: 'contested-substitute',
      originalRef: entry.ref,
    };
    if (sub.pastoralSubtitleRequired) next.pastoralSubtitleRequired = true;
    if (entry.isFeatureDay) next.isFeatureDay = true;
    if (entry.movableKey) next.movableKey = entry.movableKey;
    map.set(iso, next);
  }

  return map;
}

/**
 * Per-year cached resolver. Holds the input fixed table by closure so the
 * cache key can stay simple (year only). Callers should hold one resolver
 * instance for the lifetime of the table.
 */
export function createCalendarResolver(
  fixedTable: ReadonlyArray<FixedEntry>,
  options?: {
    contestedRefs?: ReadonlySet<string>;
    movableFeasts?: ReadonlyArray<MovableFeastSpec>;
  },
): (year: number) => Map<string, ResolvedEntry> {
  const cache = new Map<number, Map<string, ResolvedEntry>>();
  return (year: number) => {
    const cached = cache.get(year);
    if (cached) return cached;
    const resolved = resolveCalendar({
      year,
      fixedTable,
      contestedRefs: options?.contestedRefs,
      movableFeasts: options?.movableFeasts,
    });
    cache.set(year, resolved);
    return resolved;
  };
}

// --- helpers -------------------------------------------------------------

function mmddToIso(year: number, mmdd: string): string | null {
  const parts = mmdd.split('-');
  if (parts.length !== 2) return null;
  const m = Number(parts[0]);
  const d = Number(parts[1]);
  if (!Number.isInteger(m) || !Number.isInteger(d)) return null;
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  const dt = new Date(Date.UTC(year, m - 1, d));
  if (dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null;
  return formatIso(dt);
}

function parseIso(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`);
}

function addUtcDays(d: Date, days: number): Date {
  const r = new Date(d.getTime());
  r.setUTCDate(r.getUTCDate() + days);
  return r;
}

function formatIso(d: Date): string {
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + 1;
  const day = d.getUTCDate();
  return `${y}-${m < 10 ? `0${m}` : m}-${day < 10 ? `0${day}` : day}`;
}

function findPriorThemeSubstitute(
  entry: ResolvedEntry,
  fixedTable: ReadonlyArray<FixedEntry>,
  contestedRefs: ReadonlySet<string>,
): FixedEntry | null {
  // Movable rows have week=0; fall through to whole-table same-theme search.
  if (entry.week > 1) {
    const priorWeek = fixedTable.filter(
      (e) =>
        e.week === entry.week - 1 &&
        e.theme === entry.theme &&
        !contestedRefs.has(e.ref),
    );
    if (priorWeek.length > 0) {
      return priorWeek
        .slice()
        .sort((a, b) => (a.mmdd < b.mmdd ? -1 : a.mmdd > b.mmdd ? 1 : 0))[0]!;
    }
  }
  // Fallback: closest earlier (by week then mmdd) same-theme, non-contested.
  const candidates = fixedTable.filter(
    (e) => e.theme === entry.theme && !contestedRefs.has(e.ref),
  );
  if (candidates.length === 0) return null;
  return candidates
    .slice()
    .sort((a, b) => {
      if (a.week !== b.week) return a.week - b.week;
      return a.mmdd < b.mmdd ? -1 : a.mmdd > b.mmdd ? 1 : 0;
    })[0]!;
}
