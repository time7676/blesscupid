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
import { QuotaService } from './quota.service.js';

const DecisionSchema = z.object({
  candidateUserId: z.string().uuid(),
  decision: z.enum(['pass', 'like', 'favorite']),
});

@Controller('matches')
@UseGuards(JwtAuthGuard)
export class MatchingController {
  constructor(
    private readonly matching: MatchingService,
    private readonly quota: QuotaService,
  ) {}

  @Get('today')
  async today(@Req() req: AuthedRequest) {
    const stack = await this.matching.getOrComputeStack(req.user.userId);
    return { stack };
  }

  @Get('quota')
  async getQuota(@Req() req: AuthedRequest) {
    return this.quota.getSnapshot(req.user.userId);
  }

  @Post('decision')
  @HttpCode(200)
  async decide(
    @Req() req: AuthedRequest,
    @Body(ZodValidate(DecisionSchema)) body: z.infer<typeof DecisionSchema>,
  ) {
    // Quota gate. Throws ForbiddenException with structured code
    // (quota_decisions_exhausted | quota_favorites_exhausted) which
    // mobile maps to a paywall sheet.
    await this.quota.assertCanDecide(req.user.userId, body.decision);
    return this.matching.recordDecision(
      req.user.userId,
      body.candidateUserId,
      body.decision,
    );
  }
}
