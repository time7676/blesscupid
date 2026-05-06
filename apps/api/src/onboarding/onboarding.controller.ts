import { Body, Controller, Get, HttpCode, Patch, Post, Req, UseGuards } from '@nestjs/common';
import {
  CovenantAcceptSchema,
  FaithQuestionnaireSchema,
  ProfileBasicsSchema,
  BioSchema,
  Q3RedirectSchema,
  QuestionnaireSubmitSchema,
  WelcomedTagsUpdateSchema,
} from '@blesscupid/shared';
import { OnboardingService } from './onboarding.service.js';
import { ZodValidate } from '../common/zod.pipe.js';
import { JwtAuthGuard, type AuthedRequest } from '../auth/jwt.guard.js';

@Controller('onboarding')
@UseGuards(JwtAuthGuard)
export class OnboardingController {
  constructor(private readonly onboarding: OnboardingService) {}

  @Get('state')
  async state(@Req() req: AuthedRequest) {
    return this.onboarding.getState(req.user.userId);
  }

  @Post('covenant')
  @HttpCode(200)
  async covenant(
    @Req() req: AuthedRequest,
    @Body(ZodValidate(CovenantAcceptSchema)) input: unknown,
  ) {
    return this.onboarding.acceptCovenant(req.user.userId, input as never, req);
  }

  // Legacy faith questionnaire (BLE-7). Kept for back-compat.
  @Post('faith')
  @HttpCode(200)
  async faith(
    @Req() req: AuthedRequest,
    @Body(ZodValidate(FaithQuestionnaireSchema)) input: unknown,
  ) {
    return this.onboarding.saveFaith(req.user.userId, input as never);
  }

  // BLE-124 — v1 questionnaire submit (Q2-Q9). Privacy contract:
  //   Q3 same-sex never persists a same-sex match preference (redirect-only).
  //   Q7 welcomed-tag visibility defaults false; schema rejects visibility=true
  //   for unselected tags.
  //   Q9 bio seed runs full text moderation stack.
  @Post('questionnaire')
  @HttpCode(200)
  async questionnaire(
    @Req() req: AuthedRequest,
    @Body(ZodValidate(QuestionnaireSubmitSchema)) input: unknown,
  ) {
    return this.onboarding.saveQuestionnaire(req.user.userId, input as never);
  }

  // BLE-124 — Q3 redirect outcome.
  @Post('q3-redirect')
  @HttpCode(200)
  async q3Redirect(
    @Req() req: AuthedRequest,
    @Body(ZodValidate(Q3RedirectSchema)) input: unknown,
  ) {
    return this.onboarding.acceptQ3Redirect(req.user.userId, input as never);
  }

  // BLE-124 — settings UI per-tag visibility update.
  @Patch('welcomed-tags')
  @HttpCode(200)
  async welcomedTags(
    @Req() req: AuthedRequest,
    @Body(ZodValidate(WelcomedTagsUpdateSchema)) input: unknown,
  ) {
    return this.onboarding.updateWelcomedTags(req.user.userId, input as never);
  }

  @Post('profile')
  @HttpCode(200)
  async profile(
    @Req() req: AuthedRequest,
    @Body(ZodValidate(ProfileBasicsSchema)) input: unknown,
  ) {
    return this.onboarding.saveProfileBasics(req.user.userId, input as never);
  }

  @Post('bio')
  @HttpCode(200)
  async bio(@Req() req: AuthedRequest, @Body(ZodValidate(BioSchema)) input: unknown) {
    return this.onboarding.saveBio(req.user.userId, input as never);
  }

  // BLE eng-review 2026-05-06 — server-side onboarding completion.
  // Replaces the prior client-only SecureStore flag (Bio.tsx flipped it
  // locally, so reinstall would force a redo). Mobile calls this after
  // the Bio step. Idempotent: replay returns the same response.
  @Post('complete')
  @HttpCode(200)
  async complete(@Req() req: AuthedRequest) {
    return this.onboarding.markOnboardingComplete(req.user.userId);
  }
}
