import { Injectable } from '@nestjs/common';
import type { OAuthClaims } from './types.js';

/**
 * Google Sign-In id_token verifier.
 * TODO(BLE-7b): use google-auth-library OAuth2Client.verifyIdToken with GOOGLE_CLIENT_ID.
 */
@Injectable()
export class GoogleOAuthVerifier {
  async verify(_idToken: string): Promise<OAuthClaims> {
    throw new Error('GoogleOAuthVerifier: not implemented (BLE-7b)');
  }
}
