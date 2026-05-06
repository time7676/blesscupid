/**
 * Normalized claims returned by every OAuth verifier.
 * Real provider verification (Apple JWKS / Google JWK) lives in the
 * sibling `apple.verifier.ts` and `google.verifier.ts`.
 */
export interface OAuthClaims {
  /** Provider's unique stable user id (`sub` claim). */
  sub: string;
  /** Email asserted by the provider (Apple may omit on subsequent logins). */
  email?: string;
  /**
   * True when the provider asserts the email is verified.
   * Apple always returns true; Google returns the `email_verified` claim.
   * Used to bypass the in-app email verification step.
   */
  emailVerified?: boolean;
}
