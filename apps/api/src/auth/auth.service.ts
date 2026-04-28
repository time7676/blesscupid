import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import argon2 from 'argon2';
import {
  checkAgeGate,
  type LoginEmailInput,
  type OAuthSignupInput,
  type SignupEmailInput,
} from '@blesscupid/shared';
import { PrismaService } from '../prisma/prisma.service.js';
import { TokenService } from './token.service.js';
import { AppleOAuthVerifier } from './oauth/apple.verifier.js';
import { GoogleOAuthVerifier } from './oauth/google.verifier.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokenService,
    private readonly apple: AppleOAuthVerifier,
    private readonly google: GoogleOAuthVerifier,
  ) {}

  async signupEmail(input: SignupEmailInput) {
    const gate = checkAgeGate(input.dob);
    if (!gate.ok) {
      throw new BadRequestException({ code: 'age_gate_failed', reason: gate.reason });
    }

    const existing = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw new ConflictException({ code: 'email_taken' });

    const passwordHash = await argon2.hash(input.password, { type: argon2.argon2id });

    const user = await this.prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        dob: new Date(input.dob),
        ageVerifiedAdult: true,
      },
    });

    const tokens = await this.tokens.issuePair(user.id);
    return { userId: user.id, ...tokens };
  }

  async loginEmail(input: LoginEmailInput) {
    const user = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (!user || !user.passwordHash) throw new UnauthorizedException({ code: 'bad_credentials' });
    if (user.isSuspended) throw new UnauthorizedException({ code: 'account_suspended' });

    const ok = await argon2.verify(user.passwordHash, input.password);
    if (!ok) throw new UnauthorizedException({ code: 'bad_credentials' });

    const tokens = await this.tokens.issuePair(user.id);
    return { userId: user.id, ...tokens };
  }

  async signupOAuth(input: OAuthSignupInput) {
    const gate = checkAgeGate(input.dob);
    if (!gate.ok) {
      throw new BadRequestException({ code: 'age_gate_failed', reason: gate.reason });
    }

    const verifier = input.provider === 'apple' ? this.apple : this.google;
    const claims = await verifier.verify(input.idToken);
    if (!claims.email) throw new BadRequestException({ code: 'oauth_no_email' });

    const existingLink = await this.prisma.oAuthAccount.findUnique({
      where: {
        provider_providerSub: { provider: input.provider, providerSub: claims.sub },
      },
      include: { user: true },
    });

    if (existingLink) {
      const tokens = await this.tokens.issuePair(existingLink.userId);
      return { userId: existingLink.userId, ...tokens };
    }

    const user = await this.prisma.user.upsert({
      where: { email: claims.email },
      update: {
        oauthAccounts: {
          create: { provider: input.provider, providerSub: claims.sub },
        },
      },
      create: {
        email: claims.email,
        dob: new Date(input.dob),
        ageVerifiedAdult: true,
        emailVerified: claims.emailVerified ?? false,
        oauthAccounts: {
          create: { provider: input.provider, providerSub: claims.sub },
        },
      },
    });

    const tokens = await this.tokens.issuePair(user.id);
    return { userId: user.id, ...tokens };
  }
}
