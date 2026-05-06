/**
 * MatchingController — public surface for Lane B.
 *
 *   GET  /matches/today       → today's 3 introductions
 *   POST /matches/decision    → record pass / like / favorite
 *
 * All routes JWT-gated. Per BLE eng-review 2026-05-06, the response of
 * /matches/today never includes legalName, email, phone, exact coords —
 * matching.service.hydrateStack strips PII at the source.
 */

import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { z } from 'zod';
import { JwtAuthGuard, type AuthedRequest } from '../auth/jwt.guard.js';
import { ZodValidate } from '../common/zod.pipe.js';
import { MatchingService } from './matching.service.js';

const DecisionSchema = z.object({
  candidateUserId: z.string().uuid(),
  decision: z.enum(['pass', 'like', 'favorite']),
});

@Controller('matches')
@UseGuards(JwtAuthGuard)
export class MatchingController {
  constructor(private readonly matching: MatchingService) {}

  @Get('today')
  async today(@Req() req: AuthedRequest) {
    const stack = await this.matching.getOrComputeStack(req.user.userId);
    return { stack };
  }

  @Post('decision')
  @HttpCode(200)
  async decide(
    @Req() req: AuthedRequest,
    @Body(ZodValidate(DecisionSchema)) body: z.infer<typeof DecisionSchema>,
  ) {
    if (body.decision === 'favorite') {
      const already = await this.matching.hasFavoritedToday(req.user.userId);
      if (already) {
        throw new BadRequestException({
          code: 'favorite_quota_exhausted',
          message: 'You have already favorited someone today.',
        });
      }
    }
    return this.matching.recordDecision(
      req.user.userId,
      body.candidateUserId,
      body.decision,
    );
  }
}
