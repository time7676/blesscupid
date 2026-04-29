// BLE-102 verse-of-day selection with profile-mode filter.
//
// Pipeline contract:
//   selectVerseOfDay({ date, userId, mode, calendar })
//
// Suppression rule (BLE-84 §9):
//   mode === 'friendship-only' AND entry.theme === 'marriage'
//     → pick a non-marriage entry from the same theme-week, deterministic by userId.
//     → if the whole week is marriage, fall back to the most recent joy/love
//       entry within the last 14 days (deterministic tie-break by userId).
// Other modes (`dating`, `commonsphere`) bypass suppression.
//
// Determinism: stable userId-keyed hash, not jitter. Same user + same date
// always lands on the same substitute so the card doesn't churn between renders.

import type {
  ProfileMode,
  SelectedVerse,
  SubstitutionReason,
  VerseEntry,
} from './types.js';

const FALLBACK_WINDOW_DAYS = 14;
const FALLBACK_THEMES: ReadonlyArray<VerseEntry['theme']> = ['joy', 'love'];

// FNV-1a 32-bit. Pure, dependency-free, stable across JS engines and RN/Hermes.
function fnv1a(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

// Deterministic index into a list, keyed by userId + date so different days
// can rotate but a given (user, day) is fixed.
function pickIndex(userId: string, date: string, length: number): number {
  if (length <= 0) throw new Error('pickIndex: empty list');
  return fnv1a(`${userId}|${date}`) % length;
}

function diffDaysUtc(a: string, b: string): number {
  const da = Date.UTC(
    Number(a.slice(0, 4)),
    Number(a.slice(5, 7)) - 1,
    Number(a.slice(8, 10)),
  );
  const db = Date.UTC(
    Number(b.slice(0, 4)),
    Number(b.slice(5, 7)) - 1,
    Number(b.slice(8, 10)),
  );
  return Math.round((da - db) / 86_400_000);
}

export type SelectVerseInput = {
  date: string; // ISO YYYY-MM-DD
  userId: string;
  mode: ProfileMode;
  calendar: ReadonlyArray<VerseEntry>;
};

export function selectVerseOfDay(input: SelectVerseInput): SelectedVerse | null {
  const { date, userId, mode, calendar } = input;
  const entry = calendar.find((e) => e.date === date) ?? null;
  if (!entry) return null;

  const needsSuppression =
    mode === 'friendship-only' && entry.theme === 'marriage';
  if (!needsSuppression) {
    return { entry, substituted: false };
  }

  const substitute = findSubstitute(entry, userId, calendar);
  if (!substitute) {
    // Hard guardrail: never serve a marriage card to a friendship-only user.
    // If both substitution paths fail, the caller should treat this as
    // "no card today" rather than fall through to the original.
    return null;
  }

  return {
    entry: substitute.entry,
    substituted: true,
    reason: substitute.reason,
    originalEntry: entry,
  };
}

function findSubstitute(
  marriageEntry: VerseEntry,
  userId: string,
  calendar: ReadonlyArray<VerseEntry>,
): { entry: VerseEntry; reason: SubstitutionReason } | null {
  const sameWeek = calendar
    .filter(
      (e) =>
        e.weekNumber === marriageEntry.weekNumber && e.theme !== 'marriage',
    )
    // Stable order so pickIndex reads the same slot each time regardless of
    // calendar iteration quirks.
    .slice()
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  if (sameWeek.length > 0) {
    const idx = pickIndex(userId, marriageEntry.date, sameWeek.length);
    return { entry: sameWeek[idx]!, reason: 'same-week-non-marriage' };
  }

  const recent = calendar
    .filter(
      (e) =>
        FALLBACK_THEMES.includes(e.theme) &&
        e.date < marriageEntry.date &&
        diffDaysUtc(marriageEntry.date, e.date) <= FALLBACK_WINDOW_DAYS,
    )
    // Most recent first, then deterministic tie-break by userId.
    .slice()
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  if (recent.length === 0) return null;

  // All entries on the same most-recent date are tied; pick deterministically.
  const newestDate = recent[0]!.date;
  const tied = recent.filter((e) => e.date === newestDate);
  const idx = pickIndex(userId, marriageEntry.date, tied.length);
  return { entry: tied[idx]!, reason: 'recent-joy-love-fallback' };
}

// Re-export the hash so test harnesses and BLE-103 (logging) can audit.
export const __internals = { fnv1a, pickIndex };
