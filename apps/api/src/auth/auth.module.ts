/**
 * AuthModule — wires every piece of the v1 auth flow.
 *
 * Controllers
 *   - AuthController             (signup/login email + OAuth, refresh, logout)
 *   - AuthExtensionController    (email verify, password reset)
 *
 * Services
 *   - AuthService                orchestrates signup/login + consent + reject-gate
 *   - TokenService               JWT access + opaque refresh w/ rotation
 *   - PasswordService            argon2id + zxcvbn-ts
 *   - PasswordResetService       OTP via SendGrid + Redis lockout/cooldown
 *   - EmailVerifyService         OTP via SendGrid + Redis lockout/cooldown
 *   - EmailService               SendGrid wrapper w/ 3s timeout, 2 retries
 *   - AppleOAuthVerifier         JWKS verify w/ jose
 *   - GoogleOAuthVerifier        JWK verify w/ jose
 *
 * Guards
 *   - JwtAuthGuard               (re-exported for protected routes elsewhere)
 *
 * `@Global()` so JwtModule + TokenService remain available app-wide
 * (guards in other modules reuse them).
 */

import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller.js';
import { AuthExtensionController } from './auth-extension.controller.js';
import { AuthService } from './auth.service.js';
import { TokenService } from './token.service.js';
import { PasswordService } from './password.service.js';
import { PasswordResetService } from './password-reset.service.js';
import { EmailVerifyService } from './email-verify.service.js';
import { EmailService } from './email/email.service.js';
import { JwtAuthGuard } from './jwt.guard.js';
import { AppleOAuthVerifier } from './oauth/apple.verifier.js';
import { GoogleOAuthVerifier } from './oauth/google.verifier.js';

@Global()
@Module({
  imports: [JwtModule.register({})],
  controllers: [AuthController, AuthExtensionController],
  providers: [
    AuthService,
    TokenService,
    PasswordService,
    PasswordResetService,
    EmailVerifyService,
    EmailService,
    JwtAuthGuard,
    AppleOAuthVerifier,
    GoogleOAuthVerifier,
  ],
  exports: [
    AuthService,
    TokenService,
    PasswordService,
    JwtAuthGuard,
    JwtModule,
  ],
})
export class AuthModule {}
