/**
 * AuthController — public auth endpoints, all under `/v1/auth`.
 *
 *   POST /v1/auth/signup/email   { email, password, dob, locale? } -> 201 { userId, accessToken, refreshToken, expiresIn }
 *   POST /v1/auth/login/email    { email, password }                -> 200 { userId, accessToken, refreshToken, expiresIn }
 *   POST /v1/auth/signup/oauth   { provider, idToken, dob, locale? }-> 201 { userId, accessToken, refreshToken, expiresIn, emailVerifiedByProvider }
 *   POST /v1/auth/login/oauth    { provider, idToken }              -> 200 { userId, accessToken, refreshToken, expiresIn, emailVerifiedByProvider }
 *   POST /v1/auth/refresh        { refreshToken }                   -> 200 { accessToken, refreshToken, expiresIn }
 *   POST /v1/auth/logout         (auth-required, body optional)     -> 204
 *
 * Throttling: every public route is constrained by the `auth` throttler
 * profile (`5/min` per IP) configured in `app.module.ts`.
 *
 * Auth-required routes (logout) require a valid `Authorization: Bearer`.
 */

import {
  Body,
  Controller,
  HttpCode,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  LoginEmailSchema,
  OAuthLoginSchema,
  OAuthSignupSchema,
  RefreshTokenSchema,
  SignupEmailSchema,
} from '@blesscupid/shared';
import type { Request } from 'express';
import { AuthService } from './auth.service.js';
import { TokenService } from './token.service.js';
import { ZodValidate } from '../common/zod.pipe.js';
import { JwtAuthGuard, type AuthedRequest } from './jwt.guard.js';

const AUTH_THROTTLE = { auth: { limit: 5, ttl: 60_000 } };

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly tokens: TokenService,
  ) {}

  @Post('signup/email')
  @HttpCode(201)
  @Throttle(AUTH_THROTTLE)
  async signupEmail(
    @Body(ZodValidate(SignupEmailSchema)) input: unknown,
    @Req() req: Request,
  ) {
    return this.auth.signupEmail(input as never, requestMeta(req));
  }

  @Post('login/email')
  @HttpCode(200)
  @Throttle(AUTH_THROTTLE)
  async loginEmail(
    @Body(ZodValidate(LoginEmailSchema)) input: unknown,
    @Req() req: Request,
  ) {
    return this.auth.loginEmail(input as never, requestMeta(req));
  }

  @Post('signup/oauth')
  @HttpCode(201)
  @Throttle(AUTH_THROTTLE)
  async signupOAuth(
    @Body(ZodValidate(OAuthSignupSchema)) input: unknown,
    @Req() req: Request,
  ) {
    return this.auth.signupOAuth(input as never, requestMeta(req));
  }

  @Post('login/oauth')
  @HttpCode(200)
  @Throttle(AUTH_THROTTLE)
  async loginOAuth(
    @Body(ZodValidate(OAuthLoginSchema)) input: unknown,
    @Req() req: Request,
  ) {
    return this.auth.loginOAuth(input as never, requestMeta(req));
  }

  @Post('refresh')
  @HttpCode(200)
  @Throttle(AUTH_THROTTLE)
  async refresh(
    @Body(ZodValidate(RefreshTokenSchema)) input: { refreshToken: string },
    @Req() req: Request,
  ) {
    return this.tokens.refresh(input.refreshToken, requestMeta(req));
  }

  /**
   * Logout. Body optional; if `refreshToken` is provided we revoke just
   * that session. Without a body we no-op the access token (it remains
   * valid until natural expiry — short TTL acceptable).
   */
  @Post('logout')
  @HttpCode(204)
  @UseGuards(JwtAuthGuard)
  async logout(
    @Req() req: AuthedRequest,
    @Body() body: { refreshToken?: string } = {},
  ) {
    if (body.refreshToken) {
      await this.tokens.revokeByRefreshToken(body.refreshToken);
    }
    void req;
    return;
  }
}

/**
 * Pulls IP + UA off the express Request so `AuthService` can hash and
 * persist them onto Session + User.consentIpHash without leaking the
 * raw express type into the service layer.
 */
function requestMeta(req: Request): { ip?: string; userAgent?: string } {
  const xff = (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim();
  const ip = xff || req.ip || req.socket?.remoteAddress;
  const userAgent = req.headers['user-agent'];
  return { ip, userAgent };
}
