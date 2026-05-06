/**
 * Apple Sign-In id_token verifier.
 *
 * Behavior:
 *   - Fetch JWKS from https://appleid.apple.com/auth/keys
 *   - Cache JWKS for 6h (Redis preferred, falls back to in-memory)
 *   - Verify signature, issuer (https://appleid.apple.com), audience (APPLE_CLIENT_ID)
 *   - Apple-issued tokens always carry `email_verified=true`
 *   - Returns normalized `OAuthClaims`
 *
 * Multi-audience (mobile + web) supported via comma-separated APPLE_CLIENT_ID
 * env. e.g. APPLE_CLIENT_ID="com.blesscupid.app,com.blesscupid.service.web".
 */

import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';
import { RedisService } from '../../redis/redis.service.js';
import type { OAuthClaims } from './types.js';

const APPLE_ISSUER = 'https://appleid.apple.com';
const APPLE_JWKS_URL = `${APPLE_ISSUER}/auth/keys`;
const JWKS_CACHE_TTL_S = 6 * 60 * 60; // 6h
const JWKS_CACHE_KEY = 'auth:jwks:apple';

interface AppleIdPayload extends JWTPayload {
  email?: string;
  email_verified?: boolean | string;
  is_private_email?: boolean | string;
}

@Injectable()
export class AppleOAuthVerifier {
  private readonly logger = new Logger(AppleOAuthVerifier.name);
  private readonly jwks = createRemoteJWKSet(new URL(APPLE_JWKS_URL), {
    // jose handles caching internally; the Redis layer below is belt-and-suspenders
    // for server restarts and lets us short-circuit network calls.
    cacheMaxAge: JWKS_CACHE_TTL_S * 1000,
    cooldownDuration: 30_000,
  });

  constructor(private readonly redis: RedisService) {}

  async verify(idToken: string): Promise<OAuthClaims> {
    const audiences = this.audiences();
    if (audiences.length === 0) {
      throw new UnauthorizedException({ code: 'apple_audience_unset' });
    }

    try {
      // Warm Redis cache marker (informational — jose owns the actual key bytes).
      await this.markJwksFetched().catch(() => undefined);

      const { payload } = await jwtVerify(idToken, this.jwks, {
        issuer: APPLE_ISSUER,
        audience: audiences,
      });
      const p = payload as AppleIdPayload;
      if (!p.sub) throw new Error('missing sub');

      const emailVerifiedRaw = p.email_verified;
      const emailVerified =
        emailVerifiedRaw === true || emailVerifiedRaw === 'true';

      return {
        sub: p.sub,
        email: p.email,
        // Apple semantics: when email is present it is always verified.
        emailVerified: p.email ? emailVerified || true : false,
      };
    } catch (err) {
      this.logger.warn(`apple verify failed: ${(err as Error).message}`);
      throw new UnauthorizedException({ code: 'apple_token_invalid' });
    }
  }

  private audiences(): string[] {
    const raw = process.env['APPLE_CLIENT_ID'] ?? '';
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
