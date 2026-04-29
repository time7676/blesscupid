// BLE-98 verse adapters: Sabda.org (TB/TB2), Biblica/Bible Gateway (NIV).
//
// Adapter contract: pass a normalized passage ref (e.g. "Yohanes 3:16",
// "John 3:16") and the target translation; return plain text or null when
// the upstream genuinely lacks the verse (NOT on transport errors — those
// throw so the route can return a fallback note).
//
// Real upstream URLs are environment-driven so they can be swapped without
// redeploying the route. Defaults are documented; configure in env:
//   SABDA_API_BASE   default: https://api.alkitab.mobi/v1/passage
//   BIBLICA_API_BASE default: https://api.biblegateway.com/3/bible/passage
//   BIBLICA_API_KEY  required when fetching NIV

import type { Translation } from './attribution.js';

function sabdaBase(): string {
  return process.env.SABDA_API_BASE ?? 'https://api.alkitab.mobi/v1/passage';
}
function biblicaBase(): string {
  return process.env.BIBLICA_API_BASE ?? 'https://api.biblegateway.com/3/bible/passage';
}
function biblicaKey(): string {
  return process.env.BIBLICA_API_KEY ?? '';
}

const FETCH_TIMEOUT_MS = 5000;

export class AdapterError extends Error {
  constructor(
    public readonly source: string,
    public readonly status: number | null,
    message: string,
  ) {
    super(message);
    this.name = 'AdapterError';
  }
}

async function fetchWithTimeout(url: string, init?: RequestInit): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

// Sabda adapter handles TB and TB2. TB2 may legitimately 404 for verses that
// only exist in TB; the route uses that signal to fall back to TB.
export async function fetchSabda(
  ref: string,
  translation: 'tb' | 'tb2',
): Promise<string | null> {
  const url = `${sabdaBase()}?passage=${encodeURIComponent(ref)}&version=${translation}`;
  const res = await fetchWithTimeout(url, {
    headers: { Accept: 'application/json' },
  });

  if (res.status === 404) return null;
  if (!res.ok) {
    throw new AdapterError('sabda', res.status, `Sabda ${res.status}`);
  }

  const body = (await res.json()) as { text?: string; passage?: string };
  const text = (body.text ?? body.passage ?? '').trim();
  return text.length > 0 ? text : null;
}

export async function fetchBiblicaNiv(ref: string): Promise<string | null> {
  const key = biblicaKey();
  if (!key) {
    throw new AdapterError('biblica', null, 'BIBLICA_API_KEY not configured');
  }
  const url = `${biblicaBase()}/${encodeURIComponent(ref)}/NIV`;
  const res = await fetchWithTimeout(url, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${key}`,
    },
  });

  if (res.status === 404) return null;
  if (!res.ok) {
    throw new AdapterError('biblica', res.status, `Biblica ${res.status}`);
  }

  const body = (await res.json()) as { data?: { content?: string } };
  const text = (body.data?.content ?? '').trim();
  return text.length > 0 ? text : null;
}

// Public dispatch: fetch one translation. Implements TB2→TB fallback.
export async function fetchTranslation(
  ref: string,
  translation: Translation,
): Promise<{ text: string; effective: Translation } | null> {
  if (translation === 'tb' || translation === 'tb2') {
    const direct = await fetchSabda(ref, translation);
    if (direct) return { text: direct, effective: translation };
    if (translation === 'tb2') {
      const tb = await fetchSabda(ref, 'tb');
      if (tb) return { text: tb, effective: 'tb' };
    }
    return null;
  }
  const niv = await fetchBiblicaNiv(ref);
  return niv ? { text: niv, effective: 'niv' } : null;
}
