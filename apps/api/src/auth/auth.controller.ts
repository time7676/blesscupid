import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  LoginEmailSchema,
  OAuthSignupSchema,
  SignupEmailSchema,
} from '@blesscupid/shared';
import { AuthService } from './auth.service.js';
import { ZodValidate } from '../common/zod.pipe.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('signup/email')
  @HttpCode(201)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async signupEmail(@Body(ZodValidate(SignupEmailSchema)) input: unknown) {
    return this.auth.signupEmail(input as never);
  }

  @Post('login/email')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async loginEmail(@Body(ZodValidate(LoginEmailSchema)) input: unknown) {
    return this.auth.loginEmail(input as never);
  }

  @Post('signup/oauth')
  @HttpCode(201)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async signupOAuth(@Body(ZodValidate(OAuthSignupSchema)) input: unknown) {
    return this.auth.signupOAuth(input as never);
  }
}
