/**
 * PasswordResetService — real OTP-based password reset.
 *
 * Flow:
 *   1. POST /auth/password-reset/request { email }
 *      → ALWAYS returns ok:true (enumeration prevention).
 *      → Internally: if a non-deleted User matches, generate 6-digit OTP,
 *        hash via SHA-256, persist a `PasswordReset` row, dispatch via
 *        SendGrid. No-op for unknown emails — silent.
 *
 *   2. POST /auth/password-reset/confirm { email, code, newPassword }
 *      → Find latest pending PasswordReset for user. If lockout key set in
 *        Redis, reject. Compare otpHash; on success rotate password
 *        (argon2id) + revoke all existing Sessions + issue a new token pair.
 *      → 5 wrong attempts ⇒ mark expired + 15-min Redis lockout.
 *
 *   3. POST /auth/password-reset/resend { email }
 *      → Same enumeration-safe shape. Rate-limited 60s cooldown + max 3/hour
 *        per user via Redis counters.
 *
 * Storage:
 *   PasswordReset (Prisma)        → row-of-truth: otpHash, status, attempts,
 *                                    expiresAt, usedAt
 *   Redis key `otp_lockout:{userId}`            → 15-min lockout marker
 *   Redis key `otp_resend:cooldown:{userId}`    → 60s send cooldown
 *   Redis key `otp_resend:hourly:{userId}`      → 3/hour send budget
 */

import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import crypto from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service.js';
import { RedisService } from '../redis/redis.service.js';
import { EmailService } from './email/email.service.js';
import { PasswordService } from './password.service.js';
import { TokenService } from './token.service.js';
import type { TokenPair } from './token.service.js';

const OTP_TTL_S = 15 * 60; // 15 min
const LOCKOUT_TTL_S = 15 * 60;
const RESEND_COOLDOWN_S = 60;
const RESEND_HOURLY_LIMIT = 3;
const MAX_ATTEMPTS = 5;

const lockoutKey = (uid: string) => `otp_lockout:${uid}`;
const resendCooldownKey = (uid: string) => `otp_resend:cooldown:${uid}`;
const resendHourlyKey = (uid: string) => `otp_resend:hourly:${uid}`;

@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly email: EmailService,
    private readonly passwords: PasswordService,
    private readonly tokens: TokenService,
  ) {}

  /**
   * Request an OTP. Always returns the same shape regardless of whether the
   * email exists — enumeration prevention.
   */
  async request(emailRaw: string): Promise<void> {
    const email = normalizeEmail(emailRaw);
    const user = await this.prisma.user.findFirst({
      where: { email, deletedAt: null },
    });
    if (!user) {
      // Silent no-op: pretend we sent.
      this.logger.debug(`password-reset request for unknown email`);
      return;
    }
    await this.issueAndSend(user.id, user.email);
  }

  /**
   * Confirm OTP + new password. Issues a new session pair on success.
   * Throws UnauthorizedException with sanitized error codes on any failure.
   */
  async confirm(
    emailRaw: string,
    code: string,
    newPassword: string,
  ): Promise<{ userId: string } & TokenPair> {
    const email = normalizeEmail(emailRaw);
    const user = await this.prisma.user.findFirst({
      where: { email, deletedAt: null },
    });
    if (!user) throw new UnauthorizedException({ code: 'reset_invalid' });

    const client = this.redis.getClient();
    if (await client.exists(lockoutKey(user.id))) {
      throw new UnauthorizedException({ code: 'reset_locked_out' });
    }

    // Strict: validate password BEFORE consuming OTP attempt budget so a user
    // with a weak password isn't penalized with a wrong-OTP attempt.
    const policy = await this.passwords.validate(newPassword);
    if (!policy.valid) {
      throw new UnauthorizedException({
        code: 'password_weak',
        score: policy.score,
        suggestions: policy.suggestions,
      });
    }

    const reset = await this.prisma.passwordReset.findFirst({
      where: { userId: user.id, status: 'pending' },
      orderBy: { createdAt: 'desc' },
    });
    if (!reset) throw new UnauthorizedException({ code: 'reset_invalid' });

    if (reset.expiresAt.getTime() <= Date.now()) {
      await this.prisma.passwordReset.update({
        where: { id: reset.id },
        data: { status: 'expired' },
      });
      throw new UnauthorizedException({ code: 'reset_expired' });
    }

    const codeHash = hashOtp(code);
    if (!constantTimeEqual(reset.otpHash, codeHash)) {
      const attempts = reset.attempts + 1;
      const updates: { attempts: number; status?: 'expired' } = { attempts };
      if (attempts >= MAX_ATTEMPTS) {
        updates.status = 'expired';
        await client.set(lockoutKey(user.id), '1', 'EX', LOCKOUT_TTL_S);
      }
      await this.prisma.passwordReset.update({
        where: { id: reset.id },
        data: updates,
      });
      throw new UnauthorizedException({
        code: attempts >= MAX_ATTEMPTS ? 'reset_locked_out' : 'reset_code_invalid',
      });
    }

    // OTP correct + password valid → rotate.
    const passwordHash = await this.passwords.hash(newPassword);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      }),
      this.prisma.passwordReset.update({
        where: { id: reset.id },
        data: { status: 'used', usedAt: new Date() },
      }),
    ]);
    await this.tokens.revokeAllForUser(user.id);

    const pair = await this.tokens.issuePair(user.id);
    return { userId: user.id, ...pair };
  }

  /**
   * Resend OTP. Same enumeration-safe behavior as `request()`.
   * Rate-limited 60s cooldown + 3/hour ceiling per user.
   */
  async resend(emailRaw: string): Promise<void> {
    const email = normalizeEmail(emailRaw);
    const user = await this.prisma.user.findFirst({
      where: { email, deletedAt: null },
    });
    if (!user) return; // silent no-op

    const client = this.redis.getClient();
    if (await client.exists(resendCooldownKey(user.id))) {
      // Silent: pretend we resent. Mobile UI shows cooldown anyway.
      return;
    }
    const hourlyKey = resendHourlyKey(user.id);
    const used = Number((await client.get(hourlyKey)) ?? 0);
    if (used >= RESEND_HOURLY_LIMIT) {
      return; // silent ceiling
    }

    await this.issueAndSend(user.id, user.email);
    await client.set(resendCooldownKey(user.id), '1', 'EX', RESEND_COOLDOWN_S);
    if (used === 0) {
      await client.set(hourlyKey, '1', 'EX', 3600);
    } else {
      await client.incr(hourlyKey);
    }
  }

  // ---------------------------------------------------------------------
  // Internals
  // ---------------------------------------------------------------------

  private async issueAndSend(userId: string, email: string): Promise<void> {
    // Invalidate any pending rows so latest is the only valid candidate.
    await this.prisma.passwordReset.updateMany({
      where: { userId, status: 'pending' },
      data: { status: 'expired' },
    });

    const code = generateOtp();
    await this.prisma.passwordReset.create({
      data: {
        userId,
        otpHash: hashOtp(code),
        expiresAt: new Date(Date.now() + OTP_TTL_S * 1000),
      },
    });
    await this.email.sendPasswordResetOtp(email, code);
  }
}

// =====================================================================
// Helpers
// =====================================================================

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function generateOtp(): string {
  // 6-digit numeric OTP. crypto.randomInt is uniform.
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
