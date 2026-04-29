// BLE-98 client: fetches verse text from the API at render time.
// Hard rule: never persist into device storage; always re-fetch (server cache
// is the durable layer per BLE-30 / BLE-84).

import { ApiError, apiFetch } from '../api.js';

export type Translation = 'tb' | 'tb2' | 'niv';

export type VerseResponse = {
  ref: string;
  translation: Translation;
  effective: Translation;
  text: string;
  attribution: string;
  cached: boolean;
  fallback: boolean;
};

export class VerseError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'VerseError';
  }
}

export async function fetchVerse(
  ref: string,
  translation: Translation,
): Promise<VerseResponse> {
  const params = new URLSearchParams({ ref, translation });
  try {
    return await apiFetch<VerseResponse>(`/verse?${params.toString()}`, {
      method: 'GET',
    });
  } catch (err) {
    if (err instanceof ApiError) {
      throw new VerseError(err.message, err.status, err.code);
    }
    throw err;
  }
}
