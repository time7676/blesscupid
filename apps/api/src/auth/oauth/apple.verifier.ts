import { Injectable } from '@nestjs/common';
import type { OAuthClaims } from './types.js';

/**
 * Apple Sign-In id_token verifier.
 * TODO(BLE-7b): replace stub with real verification using Apple JWKs
 *   (https://appleid.apple.com/auth/keys), aud=APPLE_CLIENT_ID, iss=https://appleid.apple.com.
 */
@Injectable()
export class AppleOAuthVerifier {
  async verify(_idToken: string): Promise<OAuthClaims> {
    throw new Error('AppleOAuthVerifier: not implemented (BLE-7b)');
  }
}
