/**
 * AuthService — orchestrates email + OAuth signup/login.
 *
 * Spec compliance (plan §"Auth flow" + §"Final pre-implementation hardening"):
 *   - Password policy: argon2id + zxcvbn-ts ≥ 3 (delegated to PasswordService)
 *   - Age gate: ≥ 18 today (UTC midnight comparison via shared `checkAgeGate`)
 *   - Onboarding-rejection email-hash gate: hard 403 on `seeking_same_sex`
 *     or `banned_user` re-signup attempts. Generic error to avoid info leak.
 *   - Consent capture on signup: consentedAt + consentVersion + consentLocale
 *     + consentIpHash (sha-256 of ip + secret).
 *   - OAuth signup bypasses email-verify when provider asserts emailVerified.
 *
 * Endpoints orchestrated here are wired in `auth.controller.ts`.
 */

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import crypto from 'node:crypto';
import {
  checkAgeGate,
  type LoginEmailInput,
  type OAuthSignupInput,
  type SignupEmailInput,
} from '@blesscupid/shared';
import { Locale } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { TokenService } from './token.service.js';
import { PasswordService } from './password.service.js';
import { AppleOAuthVerifier } from './oauth/apple.verifier.js';
import { GoogleOAuthVerifier } from './oauth/google.verifier.js';

const CONSENT_VERSION = 'v1.0';

export interface AuthRequestMeta {
  ip?: string;
  userAgent?: string;
}

export type SignupEmailWithLocale = SignupEmailInput & { locale?: Locale };
export type OAuthSignupWithLocale = OAuthSignupInput & { locale?: Locale };

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokenService,
    private readonly passwords: PasswordService,
    private readonly apple: AppleOAuthVerifier,
    private readonly google: GoogleOAuthVerifier,
  ) {}

  // -------------------------------------------------------------------
  // Email
  // -------------------------------------------------------------------

  async signupEmail(input: SignupEmailWithLocale, meta: AuthRequestMeta = {}) {
    const email = normalizeEmail(input.email);

    const gate = checkAgeGate(input.dob);
    if (!gate.ok) {
      throw new BadRequestException({ code: 'age_gate_failed', reason: gate.reason });
    }

    await this.assertNotPreviouslyRejected(email);

    const policy = await this.passwords.validate(input.password);
    if (!policy.valid) {
      throw new BadRequestException({
        code: 'password_weak',
        score: policy.score,
        suggestions: policy.suggestions,
      });
    }

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException({ code: 'email_taken' });

    const passwordHash = await this.passwords.hash(input.password);
    const locale = input.locale ?? Locale.en;

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        dob: new Date(input.dob),
        ageVerifiedAdult: true,
        localePreference: locale,
        consentedAt: new Date(),
        consentVersion: CONSENT_VERSION,
        consentLocale: locale,
        consentIpHash: hashIp(meta.ip),
      },
    });

    const pair = await this.tokens.issuePair(user.id, {
      userAgent: meta.userAgent,
      ipHash: hashIp(meta.ip),
    });
    return { userId: user.id, ...pair };
  }

  async loginEmail(input: LoginEmailInput, meta: AuthRequestMeta = {}) {
    const email = normalizeEmail(input.email);
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || user.deletedAt || !user.passwordHash) {
      throw new UnauthorizedException({ code: 'bad_credentials' });
    }
    if (user.isSuspended) {
      throw new UnauthorizedException({ code: 'account_suspended' });
    }

    const ok = await this.passwords.verify(user.passwordHash, input.password);
    if (!ok) throw new UnauthorizedException({ code: 'bad_credentials' });

    const pair = await this.tokens.issuePair(user.id, {
      userAgent: meta.userAgent,
      ipHash: hashIp(meta.ip),
    });
    return { userId: user.id, ...pair };
  }

  // -------------------------------------------------------------------
  // OAuth
  // -------------------------------------------------------------------

  async signupOAuth(input: OAuthSignupWithLocale, meta: AuthRequestMeta = {}) {
    const gate = checkAgeGate(input.dob);
    if (!gate.ok) {
      throw new BadRequestException({ code: 'age_gate_failed', reason: gate.reason });
    }

    const verifier = input.provider === 'apple' ? this.apple : this.google;
    const claims = await verifier.verify(input.idToken);
    if (!claims.email) throw new BadRequestException({ code: 'oauth_no_email' });

    const email = normalizeEmail(claims.email);
    await this.assertNotPreviouslyRejected(email);

    // If this provider+sub is already linked, treat as login.
    const existingLink = await this.prisma.oAuthAccount.findUnique({
      where: {
        provider_providerSub: {
          provider: input.provider,
          providerSub: claims.sub,
        },
      },
    });
    if (existingLink) {
      const pair = await this.tokens.issuePair(existingLink.userId, {
        userAgent: meta.userAgent,
        ipHash: hashIp(meta.ip),
      });
      return { userId: existingLink.userId, ...pair };
    }

    const locale = input.locale ?? Locale.en;
    const ipHash = hashIp(meta.ip);

    const user = await this.prisma.user.upsert({
      where: { email },
      update: {
        oauthAccounts: {
          create: { provider: input.provider, providerSub: claims.sub },
        },
      },
      create: {
        email,
        dob: new Date(input.dob),
        ageVerifiedAdult: true,
        localePreference: locale,
        consentedAt: new Date(),
        consentVersion: CONSENT_VERSION,
        consentLocale: locale,
        consentIpHash: ipHash,
        oauthAccounts: {
          create: { provider: input.provider, providerSub: claims.sub },
        },
      },
    });

    const pair = await this.tokens.issuePair(user.id, {
      userAgent: meta.userAgent,
      ipHash,
    });
    // emailVerifiedByProvider mirrors the OAuth claim — mobile uses this to
    // skip the in-app EmailVerify (A6) screen when true.
    return {
      userId: user.id,
      emailVerifiedByProvider: claims.emailVerified ?? false,
      ...pair,
    };
  }

  async loginOAuth(
    input: { provider: 'apple' | 'google'; idToken: string },
    meta: AuthRequestMeta = {},
  ) {
    const verifier = input.provider === 'apple' ? this.apple : this.google;
    const claims = await verifier.verify(input.idToken);

    const link = await this.prisma.oAuthAccount.findUnique({
      where: {
        provider_providerSub: {
          provider: input.provider,
          providerSub: claims.sub,
        },
      },
      include: { user: true },
    });
    if (!link || link.user.deletedAt) {
      throw new UnauthorizedException({ code: 'oauth_no_account' });
    }
    if (link.user.isSuspended) {
      throw new UnauthorizedException({ code: 'account_suspended' });
    }

    const pair = await this.tokens.issuePair(link.userId, {
      userAgent: meta.userAgent,
      ipHash: hashIp(meta.ip),
    });
    return {
      userId: link.userId,
      emailVerifiedByProvider: claims.emailVerified ?? false,
      ...pair,
    };
  }

  // -------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------

  /**
   * Generic 403 if the email previously hit a hard onboarding rejection
   * (Q3 same-sex reroute, banned user). Reason intentionally NOT echoed
   * back to the client — info leak avoidance.
   */
  private async assertNotPreviouslyRejected(email: string): Promise<void> {
    const emailHash = sha256Hex(email);
    const blocking = await this.prisma.onboardingRejection.findFirst({
      where: {
        emailHash,
        reason: { in: ['seeking_same_sex', 'banned_user'] },
      },
    });
    if (blocking) {
      throw new ForbiddenException({
        code: 'signup_blocked',
        message: 'Cannot create account with this email.',
      });
    }
  }
}

// =====================================================================
// Module helpers
// =====================================================================

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function sha256Hex(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

function hashIp(ip?: string): string | undefined {
  if (!ip) return undefined;
  const secret = process.env['IP_HASH_SECRET'] ?? 'blesscupid-ip-hash-secret';
  return crypto
    .createHmac('sha256', secret)
    .update(ip)
    .digest('hex');
}
