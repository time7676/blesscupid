/**
 * AuthExtensionController — auxiliary auth endpoints used by mobile.
 * Pre-alpha stubs that return success so the UX flows render without 404s.
 * Real implementation (email send via SendGrid + token tables) lands v1.1.
 */

import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidate } from '../common/zod.pipe.js';

const EmailRequestSchema = z.object({
  email: z.string().email(),
});

const EmailVerifySchema = z.object({
  email: z.string().email(),
  code: z.string().min(4).max(8),
});

const PasswordResetConfirmSchema = z.object({
  token: z.string().min(8),
  newPassword: z.string().min(8),
});

@Controller('auth')
export class AuthExtensionController {
  /** POST /auth/email/verify — accept any 6-digit in pre-alpha. */
  @Post('email/verify')
  @HttpCode(200)
  async verifyEmail(@Body(ZodValidate(EmailVerifySchema)) input: z.infer<typeof EmailVerifySchema>) {
    // Pre-alpha: accept anything. v1.1 wires real OTP table.
    void input;
    return { ok: true };
  }

  /** POST /auth/email/resend — accept request, log, no-op delivery. */
  @Post('email/resend')
  @HttpCode(200)
  async resendEmail(@Body(ZodValidate(EmailRequestSchema)) input: z.infer<typeof EmailRequestSchema>) {
    void input;
    return { ok: true };
  }

  /** POST /auth/password-reset/request — never reveal whether email exists. */
  @Post('password-reset/request')
  @HttpCode(200)
  async passwordResetRequest(
    @Body(ZodValidate(EmailRequestSchema)) input: z.infer<typeof EmailRequestSchema>,
  ) {
    void input;
    return { ok: true };
  }

  /** POST /auth/password-reset/confirm — pre-alpha stub. */
  @Post('password-reset/confirm')
  @HttpCode(200)
  async passwordResetConfirm(
    @Body(ZodValidate(PasswordResetConfirmSchema)) input: z.infer<typeof PasswordResetConfirmSchema>,
  ) {
    void input;
    return { ok: true };
  }
}
