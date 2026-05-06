/**
 * MatchingController — public surface for v1-restart.
 *
 *   GET    /v1/matches/today                      → today's deck (privacy-safe cards)
 *   GET    /v1/matches/quota                      → quota status
 *   GET    /v1/matches/incoming                   → users who liked viewer (Bless+)
 *   POST   /v1/matches/decision                   → record swipe decision
 *   DELETE /v1/matches/decision/:candidateUserId  → swipe-back (Bless+, 120s)
 *
 * All routes JWT-gated. Decision endpoints throttled at 60/min.
 */

import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { z } from 'zod';
import { JwtAuthGuard, type AuthedRequest } from '../auth/jwt.guard.js';
import { ZodValidate } from '../common/zod.pipe.js';
import { MatchingService } from './matching.service.js';

const DecisionSchema = z.object({
  candidateUserId: z.string().uuid(),
  decision: z.enum(['pass', 'like', 'super_like']),
});

@Controller({ path: 'matches', version: '1' })
@UseGuards(JwtAuthGuard)
export class MatchingController {
  constructor(private readonly matching: MatchingService) {}

  @Get('today')
  async today(@Req() req: AuthedRequest) {
    const stack = await this.matching.getCandidates(req.user.userId);
    return { stack };
  }

  @Get('quota')
  async quota(@Req() req: AuthedRequest) {
    return this.matching.getQuotaStatus(req.user.userId);
  }

  @Get('incoming')
  async incoming(@Req() req: AuthedRequest) {
    const tier = await this.matching.getTier(req.user.userId);
    if (tier !== 'blessplus') {
      throw new ForbiddenException({ code: 'requires_blessplus' });
    }
    const items = await this.matching.incomingLikes(req.user.userId);
    return { items };
  }

  @Post('decision')
  @HttpCode(200)
  @Throttle({ decision: { limit: 60, ttl: 60_000 } })
  async decide(
    @Req() req: AuthedRequest,
    @Body(ZodValidate(DecisionSchema)) body: z.infer<typeof DecisionSchema>,
  ) {
    return this.matching.recordDecision({
      userId: req.user.userId,
      candidateUserId: body.candidateUserId,
      decision: body.decision,
    });
  }

  @Delete('decision/:candidateUserId')
  @HttpCode(200)
  @Throttle({ decision: { limit: 60, ttl: 60_000 } })
  async undo(
    @Req() req: AuthedRequest,
    @Param('candidateUserId') candidateUserId: string,
  ) {
    return this.matching.undoDecision(req.user.userId, candidateUserId);
  }
}
