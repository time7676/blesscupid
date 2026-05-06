/**
 * EmailVerifyService — post-signup email verification OTP (auth-required).
 *
 * Why a separate service: `PasswordReset` table is reset-specific. Email
 * verification stores the hashed OTP in Redis only — no DB row needed.
 * On confirm we set `User.consentedAt` (idempotent) so the verification has
 * a durable footprint, since the v1 schema does not currently expose a
 * dedicated `emailVerifiedAt` column. (Schema bump tracked separately.)
 *
 * Brute-force protection mirrors PasswordResetService:
 *   - 5 wrong attempts ⇒ 15-min lockout
 *   - Resend 60s cooldown + 3/hour ceiling
 */

import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import crypto from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service.js';
import { RedisService } from '../redis/redis.service.js';
import { EmailService } from './email/email.service.js';

const OTP_TTL_S = 15 * 60;
const LOCKOUT_TTL_S = 15 * 60;
const RESEND_COOLDOWN_S = 60;
const RESEND_HOURLY_LIMIT = 3;
const MAX_ATTEMPTS = 5;

const otpKey = (uid: string) => `email_verify:otp:${uid}`;
const attemptsKey = (uid: string) => `email_verify:attempts:${uid}`;
const lockoutKey = (uid: string) => `email_verify:lockout:${uid}`;
const resendCooldownKey = (uid: string) => `email_verify:resend:cooldown:${uid}`;
const resendHourlyKey = (uid: string) => `email_verify:resend:hourly:${uid}`;

@Injectable()
export class EmailVerifyService {
  private readonly logger = new Logger(EmailVerifyService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly email: EmailService,
  ) {}

  /** Issue + dispatch a fresh OTP for the authenticated user. */
  async request(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.deletedAt) {
      throw new UnauthorizedException({ code: 'user_unknown' });
    }
    const client = this.redis.getClient();
    if (await client.exists(resendCooldownKey(userId))) {
      // Silent — UI handles cooldown countdown locally.
      return;
    }
    const used = Number((await client.get(resendHourlyKey(userId))) ?? 0);
    if (used >= RESEND_HOURLY_LIMIT) {
      throw new UnauthorizedException({ code: 'resend_limit_reached' });
    }

    const code = generateOtp();
    await client.set(otpKey(userId), hashOtp(code), 'EX', OTP_TTL_S);
    await client.del(attemptsKey(userId));
    await this.email.sendEmailVerifyOtp(user.email, code);

    await client.set(resendCooldownKey(userId), '1', 'EX', RESEND_COOLDOWN_S);
    if (used === 0) {
      await client.set(resendHourlyKey(userId), '1', 'EX', 3600);
    } else {
      await client.incr(resendHourlyKey(userId));
    }
  }

  /**
   * Confirm OTP. On success marks `consentedAt` if not already set.
   * 5 wrong attempts ⇒ 15-min lockout.
   */
  async confirm(userId: string, code: string): Promise<void> {
    const client = this.redis.getClient();
    if (await client.exists(lockoutKey(userId))) {
      throw new UnauthorizedException({ code: 'verify_locked_out' });
    }
    const stored = await client.get(otpKey(userId));
    if (!stored) {
      throw new UnauthorizedException({ code: 'verify_expired' });
    }
    const codeHash = hashOtp(code);
    if (!constantTimeEqual(stored, codeHash)) {
      const attempts = await client.incr(attemptsKey(userId));
      // Mirror OTP TTL so the counter doesn't outlive the OTP itself.
      if (attempts === 1) {
        await client.expire(attemptsKey(userId), OTP_TTL_S);
      }
      if (attempts >= MAX_ATTEMPTS) {
        await client.set(lockoutKey(userId), '1', 'EX', LOCKOUT_TTL_S);
        await client.del(otpKey(userId));
        throw new UnauthorizedException({ code: 'verify_locked_out' });
      }
      throw new UnauthorizedException({ code: 'verify_code_invalid' });
    }

    await client.del(otpKey(userId), attemptsKey(userId));

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException({ code: 'user_unknown' });
    if (!user.consentedAt) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { consentedAt: new Date() },
      });
    }
  }
}

function generateOtp(): string {
  const n = crypto.randomInt(0, 1_000_000);
  return n.toString().padStart(6, '0');
}

function hashOtp(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

function constantTimeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, 'hex');
  const bb = Buffer.from(b, 'hex');
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}
