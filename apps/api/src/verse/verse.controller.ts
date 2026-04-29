// BLE-98 GET /verse?ref=<ref>&translation=<tb|tb2|niv>
//
// Acceptance:
// - Reads cache first (7-day TTL).
// - Misses fetch from upstream adapter; TB2 falls back to TB transparently.
// - Returns attribution verbatim per BLE-30 §1.
// - Upstream failure → 502; verse genuinely missing → 404 (BLE-84 §4).

import { BadGatewayException, Controller, Get, NotFoundException, Query } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidate } from '../common/zod.pipe.js';
import { VerseNotFoundError, VerseService, VerseUpstreamError } from './verse.service.js';

const VerseQuerySchema = z.object({
  ref: z.string().trim().min(1).max(80),
  translation: z.enum(['tb', 'tb2', 'niv']),
});

@Controller('verse')
export class VerseController {
  constructor(private readonly verse: VerseService) {}

  @Get()
  async getVerse(
    @Query(ZodValidate(VerseQuerySchema)) query: z.infer<typeof VerseQuerySchema>,
  ) {
    try {
      return await this.verse.getVerse(query.ref, query.translation);
    } catch (err) {
      if (err instanceof VerseNotFoundError) {
        throw new NotFoundException({
          code: 'verse_not_found',
          ref: err.ref,
          translation: err.translation,
        });
      }
      if (err instanceof VerseUpstreamError) {
        throw new BadGatewayException({
          code: 'upstream_unavailable',
          source: err.source,
          status: err.status,
        });
      }
      throw err;
    }
  }
}
