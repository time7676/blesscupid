/**
 * BLE-129 — QuietHoursService tests.
 *
 * Exercises the predicate against a fake Prisma so we avoid spinning up
 * Postgres. Real `isQuietHours` runs end-to-end so we cover timezone
 * handling, suppression policy, and the deferral helper.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { HOLY_CODE_DEFAULT_WINDOW } from '@blesscupid/shared';
import { QuietHoursService } from './quiet-hours.service.js';

interface FakeUserRow {
  id: string;
  timezone: string | null;
  quietHours: unknown;
}

class FakePrisma {
  rows = new Map<string, FakeUserRow>();
  user = {
    findUnique: async ({ where, select }: { where: { id: string }; select?: Record<string, true> }) => {
      const row = this.rows.get(where.id);
      if (!row) return null;
      if (!select) return row;
      const out: Record<string, unknown> = {};
      for (const k of Object.keys(select)) out[k] = (row as unknown as Record<string, unknown>)[k];
      return out;
    },
    update: async ({ where, data }: { where: { id: string }; data: Partial<FakeUserRow> }) => {
      const row = this.rows.get(where.id);
      if (!row) throw new Error('not found');
      Object.assign(row, data);
      return row;
    },
  };
}

const sundayLocalToUtc = (timezone: string, hour: number, minute: number): Date => {
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
  throw new Error(`unreachable: ${timezone} ${hour}:${minute}`);
};

describe('QuietHoursService', () => {
  let prisma: FakePrisma;
  let service: QuietHoursService;

  beforeEach(() => {
    prisma = new FakePrisma();
    service = new QuietHoursService(prisma as never);
  });

  it('predicate returns false when user has no timezone (legacy)', async () => {
    prisma.rows.set('u1', { id: 'u1', timezone: null, quietHours: null });
    const predicate = service.predicate(() => sundayLocalToUtc('America/New_York', 10, 0));
    expect(await predicate('u1')).toBe(false);
  });

  it('predicate returns true during default Sunday window', async () => {
    prisma.rows.set('u1', {
      id: 'u1',
      timezone: 'America/New_York',
      quietHours: [HOLY_CODE_DEFAULT_WINDOW],
    });
    const predicate = service.predicate(() => sundayLocalToUtc('America/New_York', 10, 0));
    expect(await predicate('u1')).toBe(true);
  });

  it('predicate honors per-user timezone — same UTC moment, different verdicts', async () => {
    prisma.rows.set('ny', { id: 'ny', timezone: 'America/New_York', quietHours: [HOLY_CODE_DEFAULT_WINDOW] });
    prisma.rows.set('tk', { id: 'tk', timezone: 'Asia/Tokyo', quietHours: [HOLY_CODE_DEFAULT_WINDOW] });
    // Sunday 13:00 UTC = Sunday 09:00 EDT (NY quiet) = Sunday 22:00 JST (Tokyo not quiet).
    const sundayMorningNy = sundayLocalToUtc('America/New_York', 9, 0);
    const predicate = service.predicate(() => sundayMorningNy);
    expect(await predicate('ny')).toBe(true);
    expect(await predicate('tk')).toBe(false);
  });

  it('predicate returns false on DB error (does not silently drop pushes)', async () => {
    prisma.user.findUnique = async () => {
      throw new Error('connection refused');
    };
    const predicate = service.predicate(() => new Date());
    expect(await predicate('whoever')).toBe(false);
  });

  it('setConfig validates and persists', async () => {
    prisma.rows.set('u1', { id: 'u1', timezone: null, quietHours: null });
    const result = await service.setConfig('u1', {
      timezone: 'Asia/Makassar',
      windows: [HOLY_CODE_DEFAULT_WINDOW],
    });
    expect(result.timezone).toBe('Asia/Makassar');
    expect(prisma.rows.get('u1')!.timezone).toBe('Asia/Makassar');
  });

  it('setConfig rejects bogus IANA timezone', async () => {
    prisma.rows.set('u1', { id: 'u1', timezone: null, quietHours: null });
    await expect(
      service.setConfig('u1', { timezone: 'Mars/Olympus', windows: [HOLY_CODE_DEFAULT_WINDOW] }),
    ).rejects.toThrow();
  });

  it('nextDeliveryAt returns end of current window', () => {
    const config = { timezone: 'America/New_York', windows: [HOLY_CODE_DEFAULT_WINDOW] };
    const sun930 = sundayLocalToUtc('America/New_York', 9, 30);
    const next = service.nextDeliveryAt(config, sun930);
    expect(next).not.toBeNull();
    // Window ends at 11:30 local; next moment outside is 11:30.
    const sun1130 = sundayLocalToUtc('America/New_York', 11, 30);
    expect(next!.getTime()).toBe(sun1130.getTime());
  });

  it('nextDeliveryAt returns null when not currently quiet', () => {
    const config = { timezone: 'America/New_York', windows: [HOLY_CODE_DEFAULT_WINDOW] };
    const monday = new Date(Date.UTC(2026, 3, 27, 14, 0));
    expect(service.nextDeliveryAt(config, monday)).toBeNull();
  });
});
