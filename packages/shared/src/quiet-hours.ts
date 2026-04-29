/**
 * Quiet hours predicate (BLE-129).
 *
 * Holy Code §7.4: Sundays 09:00–11:30 in user's local timezone are quiet —
 * push notifications are suppressed so users can be present at worship.
 * Users may override the window via settings (BLE-7).
 *
 * This module is pure and shared so the matching engine push (BLE-8) and
 * realtime chat push (BLE-19) honor the same rule.
 */
import { z } from 'zod';

/** Day of week — 0 = Sunday, 6 = Saturday (matches `Date#getDay()`). */
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/**
 * A single quiet-hours window. `startMinutes`/`endMinutes` are minutes from
 * local midnight (0–1439). End must be greater than start; windows do not
 * cross midnight in v1 (Holy Code §7.4 is a Sunday-morning window).
 */
export interface QuietHoursWindow {
  dayOfWeek: DayOfWeek;
  startMinutes: number;
  endMinutes: number;
}

/** Per-user quiet-hours config. Stored on the User row. */
export interface QuietHoursConfig {
  /** IANA timezone, e.g. `Asia/Makassar`. Required. */
  timezone: string;
  /** Active quiet windows. Empty array = user has opted out (allowed if Pastor approves; default is non-empty). */
  windows: QuietHoursWindow[];
}

/** Holy Code §7.4 default: Sunday 09:00–11:30, user's local time. */
export const HOLY_CODE_DEFAULT_WINDOW: QuietHoursWindow = {
  dayOfWeek: 0,
  startMinutes: 9 * 60,
  endMinutes: 11 * 60 + 30,
};

export const QuietHoursWindowSchema = z
  .object({
    dayOfWeek: z.number().int().min(0).max(6),
    startMinutes: z.number().int().min(0).max(1439),
    endMinutes: z.number().int().min(0).max(1439),
  })
  .refine((w) => w.endMinutes > w.startMinutes, {
    message: 'endMinutes must be greater than startMinutes (windows cannot cross midnight)',
  });

export const QuietHoursConfigSchema = z.object({
  timezone: z
    .string()
    .min(1)
    .refine(isValidIanaTimezone, {
      message: 'timezone must be a valid IANA name (e.g. America/New_York)',
    }),
  windows: z.array(QuietHoursWindowSchema).max(7),
});

/**
 * Build the default config for a new user given their IANA timezone.
 * Returns the Holy Code §7.4 Sunday-morning window as the single default.
 */
export function defaultQuietHoursConfig(timezone: string): QuietHoursConfig {
  return {
    timezone,
    windows: [HOLY_CODE_DEFAULT_WINDOW],
  };
}

/**
 * True if `now` falls inside any of the user's quiet-hours windows, evaluated
 * in the user's IANA timezone.
 *
 * Pure — no I/O. The API service and matching engine both call this with an
 * already-loaded {@link QuietHoursConfig}.
 */
export function isQuietHours(config: QuietHoursConfig, now: Date): boolean {
  if (!config.windows.length) return false;
  const local = wallClockInZone(now, config.timezone);
  for (const window of config.windows) {
    if (local.dayOfWeek !== window.dayOfWeek) continue;
    if (local.minuteOfDay >= window.startMinutes && local.minuteOfDay < window.endMinutes) {
      return true;
    }
  }
  return false;
}

/** Predicate signature used by the matching engine + chat push. */
export type QuietHoursPredicate = (userId: string) => Promise<boolean>;

interface LocalWallClock {
  dayOfWeek: DayOfWeek;
  minuteOfDay: number;
}

const WEEKDAY_TO_INDEX: Record<string, DayOfWeek> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

function wallClockInZone(date: Date, timezone: string): LocalWallClock {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  let weekday = '';
  let hour = 0;
  let minute = 0;
  for (const part of formatter.formatToParts(date)) {
    if (part.type === 'weekday') weekday = part.value;
    else if (part.type === 'hour') hour = part.value === '24' ? 0 : Number(part.value);
    else if (part.type === 'minute') minute = Number(part.value);
  }
  const dayOfWeek = WEEKDAY_TO_INDEX[weekday];
  if (dayOfWeek === undefined) {
    throw new Error(`Unrecognized weekday "${weekday}" from Intl.DateTimeFormat for ${timezone}`);
  }
  return { dayOfWeek, minuteOfDay: hour * 60 + minute };
}

function isValidIanaTimezone(name: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: name });
    return true;
  } catch {
    return false;
  }
}
