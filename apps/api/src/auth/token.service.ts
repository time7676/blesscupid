/**
 * TokenService — JWT access tokens + opaque refresh tokens.
 *
 * Access token: signed JWT, 15-min default TTL (`JWT_ACCESS_TTL_S`).
 * Refresh token: 384-bit random string, SHA-256 hashed in `Session.refreshTokenHash`.
 * Refresh TTL: 30 days default (`JWT_REFRESH_TTL_S`).
 *
 * Refresh-token rotation: every successful `refresh()` revokes the consumed
 * Session row and issues a fresh pair. Reuse of a revoked token returns 401.
 *
 * Timezone safety: all `expiresAt` writes/reads are UTC `Date` (Postgres
 * `timestamptz`); comparisons go through `Date.now()` so DST is irrelevant.
 */

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import crypto from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service.js';

const accessTtl = Number(process.env['JWT_ACCESS_TTL_S'] ?? 900);
const refreshTtl = Number(process.env['JWT_REFRESH_TTL_S'] ?? 60 * 60 * 24 * 30);

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async issuePair(
    userId: string,
    meta?: { userAgent?: string; ipHash?: string },
  ): Promise<TokenPair> {
    const accessSecret = process.env['JWT_ACCESS_SECRET'];
    if (!accessSecret) throw new Error('JWT_ACCESS_SECRET unset');

    const accessToken = await this.jwt.signAsync(
      { sub: userId },
      { secret: accessSecret, expiresIn: accessTtl },
    );

    const refreshToken = crypto.randomBytes(48).toString('base64url');
    const refreshHash = this.hashRefresh(refreshToken);

    await this.prisma.session.create({
      data: {
        userId,
        refreshTokenHash: refreshHash,
        expiresAt: new Date(Date.now() + refreshTtl * 1000),
        userAgent: meta?.userAgent,
        ipHash: meta?.ipHash,
      },
    });

    return { accessToken, refreshToken, expiresIn: accessTtl };
  }

  /**
   * Rotate a refresh token. Revokes the consumed Session and returns a fresh
   * pair. Throws 401 if the token is unknown, revoked, or expired.
   */
  async refresh(
    refreshToken: string,
    meta?: { userAgent?: string; ipHash?: string },
  ): Promise<TokenPair> {
    const hash = this.hashRefresh(refreshToken);
    const session = await this.prisma.session.findUnique({
      where: { refreshTokenHash: hash },
    });
    if (!session) throw new UnauthorizedException({ code: 'refresh_invalid' });
    if (session.revokedAt) {
      // Reuse of a previously-revoked token → likely token theft. Revoke all
      // other sessions for this user defensively.
      await this.prisma.session.updateMany({
        where: { userId: session.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException({ code: 'refresh_reused' });
    }
    if (session.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException({ code: 'refresh_expired' });
    }

    await this.prisma.session.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });

    return this.issuePair(session.userId, meta);
  }

  /** Revoke the session that owns this refresh token. */
  async revokeByRefreshToken(refreshToken: string): Promise<void> {
    const hash = this.hashRefresh(refreshToken);
    await this.prisma.session.updateMany({
      where: { refreshTokenHash: hash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /** Revoke every active session for a user (used on password reset). */
  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private hashRefresh(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
