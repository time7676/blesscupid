// BLE-98 verse service: read cache → upstream → write cache.
//
// Hard rule per BLE-30 / BLE-84: verse text is fetched at render only, never
// persisted into the calendar table or the client. The cache is transient
// (7-day TTL) and lives behind the API; clients never read it directly.

import { Injectable, Optional } from '@nestjs/common';
import { AdapterError, fetchTranslation } from './adapters.js';
import { attributionFor, type Translation } from './attribution.js';
import { VerseCacheService } from './cache.service.js';

export type VerseResponse = {
  ref: string;
  translation: Translation;
  effective: Translation;
  text: string;
  attribution: string;
  cached: boolean;
  fallback: boolean;
};

export class VerseUpstreamError extends Error {
  constructor(
    public readonly source: string,
    public readonly status: number | null,
  ) {
    super(`upstream unavailable: ${source}`);
    this.name = 'VerseUpstreamError';
  }
}

export class VerseNotFoundError extends Error {
  constructor(
    public readonly ref: string,
    public readonly translation: Translation,
  ) {
    super(`verse unavailable: ${ref}`);
    this.name = 'VerseNotFoundError';
  }
}

type Fetcher = (
  ref: string,
  translation: Translation,
) => Promise<{ text: string; effective: Translation } | null>;

@Injectable()
export class VerseService {
  // Allow tests to swap the adapter without monkey-patching globals.
  private readonly fetcher: Fetcher;

  constructor(
    private readonly cache: VerseCacheService,
    @Optional() fetcher?: Fetcher,
  ) {
    this.fetcher = fetcher ?? fetchTranslation;
  }

  async getVerse(ref: string, translation: Translation): Promise<VerseResponse> {
    const cached = await this.cache.read(ref, translation);
    if (cached) {
      return {
        ref,
        translation,
        effective: cached.translation,
        text: cached.text,
        attribution: cached.attribution,
        cached: true,
        fallback: cached.translation !== translation,
      };
    }

    let fetched: { text: string; effective: Translation } | null;
    try {
      fetched = await this.fetcher(ref, translation);
    } catch (err) {
      if (err instanceof AdapterError) {
        throw new VerseUpstreamError(err.source, err.status);
      }
      throw new VerseUpstreamError('unknown', null);
    }

    if (!fetched) {
      throw new VerseNotFoundError(ref, translation);
    }

    const attribution = attributionFor(fetched.effective);
    await this.cache.write({
      ref,
      translation, // store under the requested key so future reads hit instantly
      text: fetched.text,
      attribution,
    });

    return {
      ref,
      translation,
      effective: fetched.effective,
      text: fetched.text,
      attribution,
      cached: false,
      fallback: fetched.effective !== translation,
    };
  }
}
