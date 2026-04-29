import { describe, it, expect } from 'vitest';
import {
  HOLY_CODE_DEFAULT_WINDOW,
  QuietHoursConfigSchema,
  QuietHoursWindowSchema,
  defaultQuietHoursConfig,
  isQuietHours,
  type QuietHoursConfig,
} from './quiet-hours.js';

const sundayMorning = (timezone: string, hour: number, minute: number): { config: QuietHoursConfig; now: Date } => {
  const config = defaultQuietHoursConfig(timezone);
  const now = sundayLocalToUtc(timezone, hour, minute);
  return { config, now };
};

/**
 * Build a UTC Date that, when rendered in `timezone`, lands on the upcoming
 * Sunday at the given local hour/minute. We seed from a known Sunday in UTC
 * (2026-04-26 is a Sunday) and then shift by `Intl` rounds.
 */
function sundayLocalToUtc(timezone: string, hour: number, minute: number): Date {
  // Iterate ±36h in 1-minute steps from a known Sunday until the local wall
  // clock matches. Brute force keeps the helper independent of timezone math.
  const seed = new Date(Date.UTC(2026, 3, 26, 12, 0, 0));
  for (let offset = -36 * 60; offset <= 36 * 60; offset++) {
    const candidate = new Date(seed.getTime() + offset * 60 * 1000);
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(candidate);
    let weekday = '';
    let h = 0;
    let m = 0;
    for (const p of parts) {
      if (p.type === 'weekday') weekday = p.value;
      else if (p.type === 'hour') h = p.value === '24' ? 0 : Number(p.value);
      else if (p.type === 'minute') m = Number(p.value);
    }
    if (weekday === 'Sun' && h === hour && m === minute) return candidate;
  }
  throw new Error(`Could not resolve Sunday ${hour}:${minute} in ${timezone}`);
}

describe('quiet hours predicate', () => {
  it('Holy Code default = Sunday 09:00–11:30', () => {
    expect(HOLY_CODE_DEFAULT_WINDOW).toEqual({
      dayOfWeek: 0,
      startMinutes: 540,
      endMinutes: 690,
    });
  });

  it('inside default window in NY → quiet', () => {
    const { config, now } = sundayMorning('America/New_York', 10, 0);
    expect(isQuietHours(config, now)).toBe(true);
  });

  it('start of window inclusive → quiet', () => {
    const { config, now } = sundayMorning('America/New_York', 9, 0);
    expect(isQuietHours(config, now)).toBe(true);
  });

  it('end of window exclusive → not quiet', () => {
    const { config, now } = sundayMorning('America/New_York', 11, 30);
    expect(isQuietHours(config, now)).toBe(false);
  });

  it('before window → not quiet', () => {
    const { config, now } = sundayMorning('America/New_York', 8, 59);
    expect(isQuietHours(config, now)).toBe(false);
  });

  it('different timezones honor local Sunday', () => {
    const tokyo = sundayMorning('Asia/Tokyo', 10, 0);
    const ny = sundayMorning('America/New_York', 10, 0);
    const denpasar = sundayMorning('Asia/Makassar', 10, 0);
    expect(isQuietHours(tokyo.config, tokyo.now)).toBe(true);
    expect(isQuietHours(ny.config, ny.now)).toBe(true);
    expect(isQuietHours(denpasar.config, denpasar.now)).toBe(true);
  });

  it('Sunday morning in NY is NOT quiet for a Tokyo user (different local day)', () => {
    const tokyoConfig = defaultQuietHoursConfig('Asia/Tokyo');
    // 2026-04-26 14:00 UTC is Sunday 23:00 in Tokyo, still Sunday but evening
    const sundayEveningTokyo = new Date(Date.UTC(2026, 3, 26, 14, 0));
    expect(isQuietHours(tokyoConfig, sundayEveningTokyo)).toBe(false);

    // 2026-04-26 13:00 UTC = Sunday 09:00 EDT (NY). Tokyo local is Sunday 22:00.
    const nySundayMorning = sundayLocalToUtc('America/New_York', 9, 0);
    expect(isQuietHours(tokyoConfig, nySundayMorning)).toBe(false);
  });

  it('non-Sunday → not quiet', () => {
    const config = defaultQuietHoursConfig('America/New_York');
    // 2026-04-27 14:00 UTC = Monday 10:00 EDT
    const monday = new Date(Date.UTC(2026, 3, 27, 14, 0));
    expect(isQuietHours(config, monday)).toBe(false);
  });

  it('empty windows = never quiet (Pastor-approved opt out)', () => {
    const config: QuietHoursConfig = { timezone: 'America/New_York', windows: [] };
    const sun = sundayLocalToUtc('America/New_York', 10, 0);
    expect(isQuietHours(config, sun)).toBe(false);
  });

  it('user override: weekday morning window', () => {
    const config: QuietHoursConfig = {
      timezone: 'America/New_York',
      windows: [{ dayOfWeek: 3, startMinutes: 7 * 60, endMinutes: 8 * 60 }],
    };
    // Wednesday 2026-04-29 11:30 UTC = 07:30 EDT
    const weekdayMorning = new Date(Date.UTC(2026, 3, 29, 11, 30));
    expect(isQuietHours(config, weekdayMorning)).toBe(true);
  });

  it('schema rejects end <= start', () => {
    expect(() => QuietHoursWindowSchema.parse({ dayOfWeek: 0, startMinutes: 600, endMinutes: 600 })).toThrow();
    expect(() => QuietHoursWindowSchema.parse({ dayOfWeek: 0, startMinutes: 700, endMinutes: 600 })).toThrow();
  });

  it('schema rejects invalid timezone', () => {
    expect(() =>
      QuietHoursConfigSchema.parse({ timezone: 'Mars/Olympus', windows: [HOLY_CODE_DEFAULT_WINDOW] }),
    ).toThrow();
  });

  it('schema accepts valid IANA timezone', () => {
    const ok = QuietHoursConfigSchema.parse({
      timezone: 'Asia/Makassar',
      windows: [HOLY_CODE_DEFAULT_WINDOW],
    });
    expect(ok.timezone).toBe('Asia/Makassar');
  });
});
