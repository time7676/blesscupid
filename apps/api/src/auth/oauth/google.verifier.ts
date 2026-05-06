/**
 * Google Sign-In id_token verifier.
 *
 * Behavior:
 *   - Fetch JWK set from https://www.googleapis.com/oauth2/v3/certs
 *   - Cache 6h (in-memory via jose + Redis marker)
 *   - Verify signature
 *   - Verify issuer ∈ { https://accounts.google.com, accounts.google.com }
 *   - Verify audience ∈ GOOGLE_CLIENT_ID (comma-separated for ios/android/web)
 *   - REJECT if email_verified !== true (the user-provided one is unverified)
 *   - Returns normalized `OAuthClaims`
 */

import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';
import { RedisService } from '../../redis/redis.service.js';
import type { OAuthClaims } from './types.js';

const GOOGLE_ISSUERS = ['https://accounts.google.com', 'accounts.google.com'];
const GOOGLE_JWKS_URL = 'https://www.googleapis.com/oauth2/v3/certs';
const JWKS_CACHE_TTL_S = 6 * 60 * 60;
const JWKS_CACHE_KEY = 'auth:jwks:google';

interface GoogleIdPayload extends JWTPayload {
  email?: string;
  email_verified?: boolean | string;
  hd?: string;
}

@Injectable()
export class GoogleOAuthVerifier {
  private readonly logger = new Logger(GoogleOAuthVerifier.name);
  private readonly jwks = createRemoteJWKSet(new URL(GOOGLE_JWKS_URL), {
    cacheMaxAge: JWKS_CACHE_TTL_S * 1000,
    cooldownDuration: 30_000,
  });

  constructor(private readonly redis: RedisService) {}

  async verify(idToken: string): Promise<OAuthClaims> {
    const audiences = this.audiences();
    if (audiences.length === 0) {
      throw new UnauthorizedException({ code: 'google_audience_unset' });
    }

    try {
      await this.markJwksFetched().catch(() => undefined);
      const { payload } = await jwtVerify(idToken, this.jwks, {
        issuer: GOOGLE_ISSUERS,
        audience: audiences,
      });
      const p = payload as GoogleIdPayload;
      if (!p.sub) throw new Error('missing sub');

      const emailVerifiedRaw = p.email_verified;
      const emailVerified =
        emailVerifiedRaw === true || emailVerifiedRaw === 'true';

      // Hard reject unverified Google accounts — preserves the
      // "OAuth bypasses EmailVerify" invariant from the plan.
      if (!emailVerified) {
        throw new Error('google email_verified !== true');
      }

      return {
        sub: p.sub,
        email: p.email,
        emailVerified: true,
      };
    } catch (err) {
      this.logger.warn(`google verify failed: ${(err as Error).message}`);
      throw new UnauthorizedException({ code: 'google_token_invalid' });
    }
  }

  private audiences(): string[] {
    const raw = process.env['GOOGLE_CLIENT_ID'] ?? '';
    return raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }

  private async markJwksFetched(): Promise<void> {
    const client = this.redis.getClient();
    const exists = await client.exists(JWKS_CACHE_KEY);
    if (!exists) {
      await client.set(JWKS_CACHE_KEY, String(Date.now()), 'EX', JWKS_CACHE_TTL_S);
    }
  }
}
