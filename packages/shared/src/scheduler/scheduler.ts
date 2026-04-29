/**
 * BLE-101 — Push-notification scheduler.
 *
 * Pure scheduling algorithm specified in BLE-84 plan §6. Consumes the resolved
 * calendar from BLE-97 (`createCalendarResolver`) and the BLE-102 friendship-
 * only suppression rule (§9). No I/O, no clock — outputs deterministic
 * notification slots so the job runner can fire them idempotently.
 *
 * Inputs:
 *   - userPrefs: { userId, tz?, sundayMode?, mode }
 *   - resolver: per-year cached resolver from BLE-97
 *   - anchorDate (or window): user-local civil date(s) in `YYYY-MM-DD`.
 *
 * Output per anchor:
 *   - variant: 'feature' | 'sunday-preview' | 'sunday-defer' | 'default'
 *   - fireLocalDate / fireLocalTime / fireTz / fireUtc
 *   - resolved entry + substitution metadata
 *
 * Idempotency: for any (userId, anchorDate, prefs) the output is identical on
 * re-run. The job runner can dedupe by `(userId, anchorDate)` and fire-time.
 */

import type { ResolvedEntry } from '../liturgical/calendar-resolver.js';
import { __internals as verseInternals } from '../verse-of-day/select.js';
import type {
  ProfileMode,
  SubstitutionReason,
} from '../verse-of-day/types.js';

const { fnv1a } = verseInternals;

export const DEFAULT_TZ = 'Asia/Jakarta';
export const DEFAULT_SUNDAY_MODE: SundayMode = 'preview';
export const FEATURE_LOCAL_TIME = '05:30';
export const SUNDAY_PREVIEW_LOCAL_TIME = '18:00';
export const DEFER_FIRE_LOCAL_TIME = '06:00';

export type SundayMode = 'preview' | 'defer';

export type UserSchedulePrefs = {
  userId: string;
  /** IANA tz id. Defaults to `Asia/Jakarta` (WIB, UTC+7, no DST). */
  tz?: string;
  /** §6 — sundayMode. Default `preview` per acceptance. */
  sundayMode?: SundayMode;
  /** §9 — friendship-only suppresses marriage cards via BLE-102 logic. */
  mode: ProfileMode;
};

export type ScheduleVariant =
  | 'feature'
  | 'sunday-preview'
  | 'sunday-defer'
  | 'default';

export type ScheduledNotification = {
  /** Civil date in user tz the entry anchors on. */
  anchorDate: string;
  variant: ScheduleVariant;
  /** Civil date the push actually fires (may shift for Sunday handling). */
  fireLocalDate: string;
  /** `HH:MM` 24h civil time in user tz. */
  fireLocalTime: string;
  fireTz: string;
  /** ISO UTC instant equivalent of (fireLocalDate, fireLocalTime, fireTz). */
  fireUtc: string;
  ref: string;
  theme: string;
  week: number;
  isFeatureDay: boolean;
  source: ResolvedEntry['source'];
  movableKey?: ResolvedEntry['movableKey'];
  /** True when BLE-102 suppression substituted entry for friendship-only. */
  substituted: boolean;
  originalRef?: string;
  substitutionReason?: SubstitutionReason;
};

export type ScheduleOneInput = {
  userPrefs: UserSchedulePrefs;
  /** Civil date in user tz, `YYYY-MM-DD`. */
  anchorDate: string;
  resolver: (year: number) => Map<string, ResolvedEntry>;
};

export type ScheduleRangeInput = {
  userPrefs: UserSchedulePrefs;
  /** Inclusive start date in user tz, `YYYY-MM-DD`. */
  startDate: string;
  /** Window length in days (>=1). */
  days: number;
  resolver: (year: number) => Map<string, ResolvedEntry>;
};

/**
 * Schedule one notification for a single anchor date. Returns null when the
 * resolver has no entry for that date (calendar gap) or when friendship-only
 * suppression cannot find a substitute (hard guardrail per §9).
 */
export function scheduleVerseNotification(
  input: ScheduleOneInput,
): ScheduledNotification | null {
  const { userPrefs, anchorDate, resolver } = input;
  const tz = userPrefs.tz ?? DEFAULT_TZ;
  const sundayMode = userPrefs.sundayMode ?? DEFAULT_SUNDAY_MODE;

  const baseEntry = lookupEntry(anchorDate, resolver);
  if (!baseEntry) return null;

  const suppressed = applyFriendshipOnlySuppression({
    entry: baseEntry,
    userPrefs,
    anchorDate,
    resolver,
  });
  if (!suppressed) return null;

  const { entry, substituted, originalRef, substitutionReason } = suppressed;

  const slot = pickFireSlot({
    anchorDate,
    entry,
    userPrefs,
    sundayMode,
  });

  return {
    anchorDate,
    variant: slot.variant,
    fireLocalDate: slot.fireLocalDate,
    fireLocalTime: slot.fireLocalTime,
    fireTz: tz,
    fireUtc: utcInstantForLocal(slot.fireLocalDate, slot.fireLocalTime, tz),
    ref: entry.ref,
    theme: entry.theme,
    week: entry.week,
    isFeatureDay: entry.isFeatureDay === true,
    source: entry.source,
    ...(entry.movableKey ? { movableKey: entry.movableKey } : {}),
    substituted,
    ...(originalRef ? { originalRef } : {}),
    ...(substitutionReason ? { substitutionReason } : {}),
  };
}

/**
 * Schedule notifications across a `[startDate, startDate+days)` window.
 * Returns notifications sorted by `fireUtc` ascending. Fire time can land
 * outside the window (e.g. Sunday-preview fires Saturday 18:00 — included),
 * but `anchorDate` is always within the window.
 */
export function scheduleVerseRange(
  input: ScheduleRangeInput,
): ScheduledNotification[] {
  if (input.days <= 0) return [];
  const out: ScheduledNotification[] = [];
  for (let i = 0; i < input.days; i += 1) {
    const anchorDate = addLocalDays(input.startDate, i);
    const n = scheduleVerseNotification({
      userPrefs: input.userPrefs,
      anchorDate,
      resolver: input.resolver,
    });
    if (n) out.push(n);
  }
  out.sort((a, b) => (a.fireUtc < b.fireUtc ? -1 : a.fireUtc > b.fireUtc ? 1 : 0));
  return out;
}

// --- internals -----------------------------------------------------------

function lookupEntry(
  isoDate: string,
  resolver: (year: number) => Map<string, ResolvedEntry>,
): ResolvedEntry | null {
  const year = Number(isoDate.slice(0, 4));
  return resolver(year).get(isoDate) ?? null;
}

type SuppressionResult = {
  entry: ResolvedEntry;
  substituted: boolean;
  originalRef?: string;
  substitutionReason?: SubstitutionReason;
};

/**
 * Implements BLE-84 §9 friendship-only suppression directly against the
 * `ResolvedEntry` shape. Same algorithm as BLE-102 `selectVerseOfDay`,
 * adapted because the calendar pipeline upstream of the scheduler emits
 * `ResolvedEntry` (BLE-97) rather than the BLE-102 `VerseEntry` shape.
 *
 * Hard guardrail: if both substitution paths fail we return null so the
 * caller treats it as "no card today" — never serve a marriage card to a
 * friendship-only user.
 */
function applyFriendshipOnlySuppression(args: {
  entry: ResolvedEntry;
  userPrefs: UserSchedulePrefs;
  anchorDate: string;
  resolver: (year: number) => Map<string, ResolvedEntry>;
}): SuppressionResult | null {
  const { entry, userPrefs, anchorDate, resolver } = args;
  if (!(userPrefs.mode === 'friendship-only' && entry.theme === 'marriage')) {
    return { entry, substituted: false };
  }

  const yearMap = resolver(Number(anchorDate.slice(0, 4)));

  // Same-week non-marriage. Movable rows have week=0 — same-week lookup is
  // moot for those; fall straight to the recent-fallback path.
  if (entry.week > 0) {
    const sameWeek: ResolvedEntry[] = [];
    for (const e of yearMap.values()) {
      if (e.week === entry.week && e.theme !== 'marriage') sameWeek.push(e);
    }
    sameWeek.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
    if (sameWeek.length > 0) {
      const idx = fnv1a(`${userPrefs.userId}|${anchorDate}`) % sameWeek.length;
      const sub = sameWeek[idx]!;
      return {
        entry: sub,
        substituted: true,
        originalRef: entry.ref,
        substitutionReason: 'same-week-non-marriage',
      };
    }
  }

  // Recent joy/love fallback (last 14 days, prior-year-aware).
  const fallback = recentJoyLoveFallback(anchorDate, userPrefs.userId, resolver);
  if (!fallback) return null;
  return {
    entry: fallback,
    substituted: true,
    originalRef: entry.ref,
    substitutionReason: 'recent-joy-love-fallback',
  };
}

function recentJoyLoveFallback(
  anchorDate: string,
  userId: string,
  resolver: (year: number) => Map<string, ResolvedEntry>,
): ResolvedEntry | null {
  const candidates: ResolvedEntry[] = [];
  for (let i = 1; i <= 14; i += 1) {
    const iso = addLocalDays(anchorDate, -i);
    const e = resolver(Number(iso.slice(0, 4))).get(iso);
    if (!e) continue;
    if (e.theme === 'joy' || e.theme === 'love') candidates.push(e);
  }
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  const newestDate = candidates[0]!.date;
  const tied = candidates.filter((e) => e.date === newestDate);
  const idx = fnv1a(`${userId}|${anchorDate}`) % tied.length;
  return tied[idx]!;
}

type FireSlot = {
  variant: ScheduleVariant;
  fireLocalDate: string;
  fireLocalTime: string;
};

function pickFireSlot(args: {
  anchorDate: string;
  entry: ResolvedEntry;
  userPrefs: UserSchedulePrefs;
  sundayMode: SundayMode;
}): FireSlot {
  const { anchorDate, entry, userPrefs, sundayMode } = args;

  // Hari Raya feature variant: 05:30 WIB on the anchor day itself.
  // Spec carve-out: feature day on a Sunday (Easter, Pentecost) does NOT get
  // shifted to Saturday-preview or Monday-defer — feature variant wins.
  if (entry.isFeatureDay) {
    return {
      variant: 'feature',
      fireLocalDate: anchorDate,
      fireLocalTime: FEATURE_LOCAL_TIME,
    };
  }

  if (weekdayUtc(anchorDate) === 0) {
    if (sundayMode === 'defer') {
      return {
        variant: 'sunday-defer',
        fireLocalDate: addLocalDays(anchorDate, 1),
        fireLocalTime: DEFER_FIRE_LOCAL_TIME,
      };
    }
    return {
      variant: 'sunday-preview',
      fireLocalDate: addLocalDays(anchorDate, -1),
      fireLocalTime: SUNDAY_PREVIEW_LOCAL_TIME,
    };
  }

  return {
    variant: 'default',
    fireLocalDate: anchorDate,
    fireLocalTime: defaultMorningTime(userPrefs.userId),
  };
}

/**
 * §6 acceptance: `06:00 + (hash(userId) mod 60)` minutes. Returns `HH:MM` in
 * `06:00..06:59`. Hash is FNV-1a (BLE-102 internal) so the same `userId`
 * produces the same minute across the verse-selection and scheduling paths.
 */
export function defaultMorningTime(userId: string): string {
  const minute = fnv1a(userId) % 60;
  return `06:${minute < 10 ? `0${minute}` : minute}`;
}

// --- date helpers ---------------------------------------------------------

function addLocalDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + 1;
  const day = d.getUTCDate();
  return `${y}-${m < 10 ? `0${m}` : m}-${day < 10 ? `0${day}` : day}`;
}

function weekdayUtc(iso: string): number {
  return new Date(`${iso}T00:00:00Z`).getUTCDay();
}

/**
 * Compute the UTC ISO instant for civil `(localDate, localTime)` in `tz`.
 *
 * Uses `Intl.DateTimeFormat` to read the wall-clock representation of a UTC
 * candidate in `tz`, then corrects by the observed offset. Works for any
 * IANA zone the runtime supports — including DST-bearing zones like
 * `America/Los_Angeles`.
 */
export function utcInstantForLocal(
  localDate: string,
  localTime: string,
  tz: string,
): string {
  const [yStr, mStr, dStr] = localDate.split('-');
  const [hStr, minStr] = localTime.split(':');
  const y = Number(yStr);
  const mo = Number(mStr);
  const d = Number(dStr);
  const h = Number(hStr);
  const min = Number(minStr);

  const guess = Date.UTC(y, mo - 1, d, h, min, 0, 0);
  const tzWall = readWallClockInTz(new Date(guess), tz);
  const tzWallAsUtc = Date.UTC(
    tzWall.year,
    tzWall.month - 1,
    tzWall.day,
    tzWall.hour,
    tzWall.minute,
    0,
    0,
  );
  const offsetMs = tzWallAsUtc - guess;
  return new Date(guess - offsetMs).toISOString();
}

type WallClock = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

function readWallClockInTz(at: Date, tz: string): WallClock {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = fmt.formatToParts(at);
  const get = (type: Intl.DateTimeFormatPartTypes): number => {
    const p = parts.find((x) => x.type === type);
    if (!p) throw new Error(`Intl part missing: ${type}`);
    return Number(p.value);
  };
  let hour = get('hour');
  // Some Intl impls return `24` for midnight. Normalize.
  if (hour === 24) hour = 0;
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour,
    minute: get('minute'),
  };
}
