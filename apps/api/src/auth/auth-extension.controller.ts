/**
 * AuthExtensionController — auxiliary auth endpoints under `/v1/auth/*`.
 *
 *   POST /v1/auth/email/verify-request          (auth-required)
 *     → 200. Sends OTP to the authenticated user's email.
 *
 *   POST /v1/auth/email/verify-confirm  { code }  (auth-required)
 *     → 200. Marks `User.consentedAt` (idempotent). 5 wrong attempts → 15-min lockout.
 *
 *   POST /v1/auth/password-reset/request  { email }
 *     → ALWAYS 200 { ok: true, hint: "If an account exists, a code was sent." }
 *       (enumeration prevention). Internally enqueues SendGrid only when the
 *       email matches a non-deleted user.
 *
 *   POST /v1/auth/password-reset/confirm  { email, code, newPassword }
 *     → 200 issues a fresh session pair and revokes all prior sessions.
 *
 *   POST /v1/auth/password-reset/resend  { email }
 *     → 200 enumeration-safe. Rate-limited 60s + 3/hour per user.
 *
 * Replaces the old return-200-always stub. Real OTP via PasswordResetService
 * + EmailVerifyService.
 */

import {
  Body,
  Controller,
  HttpCode,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  EmailVerifyConfirmSchema,
  PasswordResetConfirmSchema,
  PasswordResetRequestSchema,
} from '@blesscupid/shared';
import { ZodValidate } from '../common/zod.pipe.js';
import { CurrentUser } from './current-user.decorator.js';
import { JwtAuthGuard } from './jwt.guard.js';
import { PasswordResetService } from './password-reset.service.js';
import { EmailVerifyService } from './email-verify.service.js';

const AUTH_THROTTLE = { auth: { limit: 5, ttl: 60_000 } };
const ENUMERATION_SAFE_HINT = {
  ok: true as const,
  hint: 'If an account exists, a code was sent.',
};

@Controller('auth')
export class AuthExtensionController {
  constructor(
    private readonly resets: PasswordResetService,
    private readonly emailVerify: EmailVerifyService,
  ) {}

  // ---------- email verification (auth-required) ----------

  @Post('email/verify-request')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @Throttle(AUTH_THROTTLE)
  async emailVerifyRequest(@CurrentUser() userId: string) {
    await this.emailVerify.request(userId);
    return { ok: true };
  }

  @Post('email/verify-confirm')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @Throttle(AUTH_THROTTLE)
  async emailVerifyConfirm(
    @CurrentUser() userId: string,
    @Body(ZodValidate(EmailVerifyConfirmSchema)) input: { code: string },
  ) {
    await this.emailVerify.confirm(userId, input.code);
    return { ok: true };
  }

  // ---------- password reset (public, enumeration-safe) ----------

  @Post('password-reset/request')
  @HttpCode(200)
  @Throttle(AUTH_THROTTLE)
  async passwordResetRequest(
    @Body(ZodValidate(PasswordResetRequestSchema)) input: { email: string },
  ) {
    // Fire-and-forget shape: even if the inner send fails, we return ok.
    // Real failures are logged + observable via Sentry (EmailService).
    try {
      await this.resets.request(input.email);
    } catch {
      /* enumeration safe — never leak service errors */
    }
    return ENUMERATION_SAFE_HINT;
  }

  @Post('password-reset/confirm')
  @HttpCode(200)
  @Throttle(AUTH_THROTTLE)
  async passwordResetConfirm(
    @Body(ZodValidate(PasswordResetConfirmSchema))
    input: { email: string; code: string; newPassword: string },
  ) {
    return this.resets.confirm(input.email, input.code, input.newPassword);
  }

  @Post('password-reset/resend')
  @HttpCode(200)
  @Throttle(AUTH_THROTTLE)
  async passwordResetResend(
    @Body(ZodValidate(PasswordResetRequestSchema)) input: { email: string },
  ) {
    try {
      await this.resets.resend(input.email);
    } catch {
      /* enumeration safe */
    }
    return ENUMERATION_SAFE_HINT;
  }
}
