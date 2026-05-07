// BLE-98 service tests:
// - Attribution strings returned verbatim (BLE-30 §1).
// - Adapter TB2→TB fallback.
// - VerseService cache hit/miss + write paths.
// - Upstream / not-found error mapping.

import { describe, expect, test, beforeEach, afterEach, vi } from 'vitest';
import { ATTRIBUTION, attributionFor } from './attribution.js';
import { fetchTranslation } from './adapters.js';
import {
  VerseNotFoundError,
  VerseService,
  VerseUpstreamError,
} from './verse.service.js';
import { AdapterError } from './adapters.js';
import type { CachedVerse, VerseCacheService } from './cache.service.js';
import type { Translation } from './attribution.js';

describe('attribution (BLE-30 §1 verbatim)', () => {
  test('combined string matches spec exactly', () => {
    expect(ATTRIBUTION.combined).toBe(
      'TB2 © Lembaga Alkitab Indonesia. NIV © Biblica, Inc.',
    );
  });

  test('TB-only fallback string matches spec exactly', () => {
    expect(ATTRIBUTION.tbOnly).toBe('TB © Lembaga Alkitab Indonesia.');
  });

  test('per-effective-translation dispatch', () => {
    expect(attributionFor('tb')).toBe('TB © Lembaga Alkitab Indonesia.');
    expect(attributionFor('tb2')).toBe('TB2 © Lembaga Alkitab Indonesia.');
    expect(attributionFor('niv')).toBe('NIV © Biblica, Inc.');
  });
});

describe('adapter TB2→TB fallback (BLE-98 acceptance)', () => {
  const realFetch = globalThis.fetch;
  let calls: string[] = [];

  function mockFetch(handler: (url: string) => Response | Promise<Response>) {
    calls = [];
    globalThis.fetch = (async (input: Parameters<typeof fetch>[0]) => {
      const url = String(input);
      calls.push(url);
      return handler(url);
    }) as typeof fetch;
  }

  beforeEach(() => {
    calls = [];
  });

  afterEach(() => {
    globalThis.fetch = realFetch;
  });

  test('TB2 miss falls through to TB; effective=tb', async () => {
    mockFetch((url) => {
      if (url.includes('version=tb2')) return new Response('', { status: 404 });
      if (url.includes('version=tb')) {
        return new Response(JSON.stringify({ text: 'Karena begitu besar...' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response('unexpected', { status: 500 });
    });
    const result = await fetchTranslation('Yohanes 3:16', 'tb2');
    expect(result).not.toBeNull();
    expect(result!.effective).toBe('tb');
    expect(result!.text).toContain('Karena begitu besar');
    expect(calls.length).toBe(2);
    expect(calls[0]).toContain('version=tb2');
    expect(calls[1]).toContain('version=tb');
  });

  test('TB2 hit short-circuits; no TB call', async () => {
    mockFetch(() =>
      new Response(JSON.stringify({ text: 'TB2 verse text' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    const result = await fetchTranslation('Yohanes 3:16', 'tb2');
    expect(result!.effective).toBe('tb2');
    expect(calls.length).toBe(1);
  });

  test('all-fail returns null (caller maps to 404)', async () => {
    mockFetch(() => new Response('', { status: 404 }));
    expect(await fetchTranslation('Bogus 99:99', 'tb2')).toBeNull();
  });
});

// Minimal in-memory cache fake to exercise the service without Prisma.
class FakeCache implements Pick<VerseCacheService, 'read' | 'write' | 'purgeExpired'> {
  store = new Map<string, CachedVerse>();
  reads = 0;
  writes = 0;

  async read(ref: string, translation: Translation): Promise<CachedVerse | null> {
    this.reads += 1;
    const hit = this.store.get(`${ref}|${translation}`);
    if (!hit) return null;
    if (hit.expiresAt.getTime() <= Date.now()) return null;
    return hit;
  }

  async write(entry: {
    ref: string;
    translation: Translation;
    text: string;
    attribution: string;
  }): Promise<void> {
    this.writes += 1;
    const now = new Date();
    this.store.set(`${entry.ref}|${entry.translation}`, {
      ...entry,
      createdAt: now,
      expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
    });
  }

  async purgeExpired(): Promise<number> {
    let n = 0;
    for (const [k, v] of this.store) {
      if (v.expiresAt.getTime() <= Date.now()) {
        this.store.delete(k);
        n += 1;
      }
    }
    return n;
  }
}

describe('VerseService', () => {
  test('cache hit short-circuits upstream and returns cached=true', async () => {
    const cache = new FakeCache();
    await cache.write({
      ref: 'Yohanes 3:16',
      translation: 'tb2',
      text: 'cached text',
      attribution: attributionFor('tb2'),
    });
    const fetcher = vi.fn();
    const svc = new VerseService(cache as unknown as VerseCacheService, ({} as any), fetcher);
    const out = await svc.getVerse('Yohanes 3:16', 'tb2');
    expect(out.cached).toBe(true);
    expect(out.fallback).toBe(false);
    expect(out.text).toBe('cached text');
    expect(fetcher).not.toHaveBeenCalled();
  });

  test('cache miss fetches, writes, and returns cached=false', async () => {
    const cache = new FakeCache();
    const fetcher = vi
      .fn()
      .mockResolvedValue({ text: 'fresh', effective: 'tb2' as Translation });
    const svc = new VerseService(cache as unknown as VerseCacheService, ({} as any), fetcher);
    const out = await svc.getVerse('Yohanes 3:16', 'tb2');
    expect(out.cached).toBe(false);
    expect(out.fallback).toBe(false);
    expect(out.text).toBe('fresh');
    expect(out.attribution).toBe(attributionFor('tb2'));
    expect(cache.writes).toBe(1);
  });

  test('fallback path marks fallback=true on first fetch; subsequent read hits cache under requested key', async () => {
    const cache = new FakeCache();
    const fetcher = vi
      .fn()
      .mockResolvedValue({ text: 'TB text', effective: 'tb' as Translation });
    const svc = new VerseService(cache as unknown as VerseCacheService, ({} as any), fetcher);
    const out = await svc.getVerse('Yohanes 3:16', 'tb2');
    expect(out.effective).toBe('tb');
    expect(out.fallback).toBe(true);
    expect(out.text).toBe('TB text');
    // Cache row is keyed by the requested translation (tb2). Subsequent
    // reads hit cache with the requested key as the effective marker —
    // parity with BLE-98's original behaviour.
    const second = await svc.getVerse('Yohanes 3:16', 'tb2');
    expect(second.cached).toBe(true);
    expect(second.effective).toBe('tb2');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  test('upstream null → VerseNotFoundError (404 mapping)', async () => {
    const cache = new FakeCache();
    const fetcher = vi.fn().mockResolvedValue(null);
    const svc = new VerseService(cache as unknown as VerseCacheService, ({} as any), fetcher);
    await expect(svc.getVerse('Bogus 99:99', 'tb2')).rejects.toBeInstanceOf(
      VerseNotFoundError,
    );
  });

  test('AdapterError → VerseUpstreamError (502 mapping)', async () => {
    const cache = new FakeCache();
    const fetcher = vi.fn().mockRejectedValue(
      new AdapterError('sabda', 503, 'Sabda 503'),
    );
    const svc = new VerseService(cache as unknown as VerseCacheService, ({} as any), fetcher);
    await expect(svc.getVerse('Yohanes 3:16', 'tb2')).rejects.toBeInstanceOf(
      VerseUpstreamError,
    );
  });
});
