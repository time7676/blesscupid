import { Body, Controller, Get, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import {
  CovenantAcceptSchema,
  FaithQuestionnaireSchema,
  ProfileBasicsSchema,
  BioSchema,
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

  @Post('faith')
  @HttpCode(200)
  async faith(
    @Req() req: AuthedRequest,
    @Body(ZodValidate(FaithQuestionnaireSchema)) input: unknown,
  ) {
    return this.onboarding.saveFaith(req.user.userId, input as never);
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
}
