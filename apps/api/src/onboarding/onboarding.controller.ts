import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { OnboardingService } from './onboarding.service.js';
import { STEP_SCHEMAS, isValidStepNumber } from './onboarding.schemas.js';
import { JwtAuthGuard, type AuthedRequest } from '../auth/jwt.guard.js';

/**
 * 8-card onboarding controller. All routes auth-required.
 *
 * Path layout (no NestJS global prefix is set — `/v1` is added by the
 * front-door reverse proxy in production; mobile clients hit
 * `/v1/onboarding/...`).
 *
 * Plan: `~/.claude/plans/i-think-we-need-misty-eclipse.md` §"8-card
 * onboarding".
 */
@Controller({ path: 'onboarding', version: '1' })
@UseGuards(JwtAuthGuard)
export class OnboardingController {
  constructor(private readonly onboarding: OnboardingService) {}

  @Get('state')
  async state(@Req() req: AuthedRequest) {
    return this.onboarding.getState(req.user.userId);
  }

  /**
   * POST /onboarding/step/:n — save card N body, advance state machine.
   *
   * Validates the body against `STEP_SCHEMAS[n]`, then dispatches to the
   * matching writer. Out-of-order step submissions return 409
   * `onboarding_step_out_of_order`. Card 4 with same-sex selection
   * returns 409 `q3_redirect_required`; client must follow up with
   * POST /onboarding/q3-reject after the explanation sheet.
   */
  @Post('step/:n')
  @HttpCode(200)
  async saveStep(
    @Req() req: AuthedRequest,
    @Param('n') nRaw: string,
    @Body() body: unknown,
  ) {
    const n = Number(nRaw);
    if (!isValidStepNumber(n)) {
      throw new BadRequestException({ code: 'invalid_step', step: nRaw });
    }
    const schema = STEP_SCHEMAS[n];
    if (!schema) {
      throw new BadRequestException({ code: 'invalid_step', step: n });
    }
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        code: 'validation_failed',
        issues: parsed.error.issues.map((i) => ({ path: i.path, message: i.message })),
      });
    }
    return this.onboarding.saveStep(req.user.userId, n, parsed.data, req);
  }

  /**
   * POST /onboarding/q3-reject — client confirms the same-sex hard-exit
   * sheet. Hard-deletes the User row + writes an OnboardingRejection
   * audit row keyed by emailHash. Cascade drops Profile, Sessions,
   * OAuthAccounts. After this returns, mobile must clear local auth
   * state and route back to the signup landing.
   */
  @Post('q3-reject')
  @HttpCode(200)
  async q3Reject(@Req() req: AuthedRequest) {
    return this.onboarding.q3Reject(req.user.userId);
  }

  /**
   * POST /onboarding/complete — mark User.onboardingCompleted = true.
   * Asserts step 8 saved + photo[0] not in 'rejected' status + covenant
   * signed. Idempotent.
   */
  @Post('complete')
  @HttpCode(200)
  async complete(@Req() req: AuthedRequest) {
    return this.onboarding.complete(req.user.userId);
  }
}
