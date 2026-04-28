// Native sign-in helpers. Each returns the provider id_token to send to the API.
import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
import { useEffect, useState } from 'react';

declare const process: { env: Record<string, string | undefined> };

export class OAuthCancelledError extends Error {
  constructor() {
    super('oauth_cancelled');
  }
}

export async function signInWithApple(): Promise<{ idToken: string }> {
  const available = await AppleAuthentication.isAvailableAsync();
  if (!available) throw new Error('apple_signin_unavailable');
  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
    if (!credential.identityToken) throw new Error('apple_no_identity_token');
    return { idToken: credential.identityToken };
  } catch (err: unknown) {
    if (
      err instanceof Error &&
      'code' in err &&
      (err as { code?: string }).code === 'ERR_REQUEST_CANCELED'
    ) {
      throw new OAuthCancelledError();
    }
    throw err;
  }
}

export const APPLE_AVAILABLE = Platform.OS === 'ios';

interface GoogleHookResult {
  promptAsync: () => Promise<{ idToken: string }>;
  ready: boolean;
}

// Wraps expo-auth-session's Google provider hook. Resolves to an id_token.
export function useGoogleSignIn(): GoogleHookResult {
  const [request, response, promptInternal] = Google.useIdTokenAuthRequest({
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    clientId:
      process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ??
      process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
  });

  const [resolver, setResolver] = useState<{
    resolve: (v: { idToken: string }) => void;
    reject: (e: Error) => void;
  } | null>(null);

  useEffect(() => {
    if (!response || !resolver) return;
    if (response.type === 'success') {
      const idToken =
        (response.params as { id_token?: string }).id_token ??
        (response.authentication as AuthSession.TokenResponse | null)?.idToken;
      if (idToken) {
        resolver.resolve({ idToken });
      } else {
        resolver.reject(new Error('google_no_id_token'));
      }
    } else if (response.type === 'cancel' || response.type === 'dismiss') {
      resolver.reject(new OAuthCancelledError());
    } else if (response.type === 'error') {
      resolver.reject(response.error ?? new Error('google_signin_error'));
    }
    setResolver(null);
  }, [response, resolver]);

  return {
    ready: !!request,
    promptAsync: () =>
      new Promise<{ idToken: string }>((resolve, reject) => {
        setResolver({ resolve, reject });
        void promptInternal();
      }),
  };
}
