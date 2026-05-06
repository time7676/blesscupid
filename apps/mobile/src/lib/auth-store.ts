import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { ApiError, getMe, type AuthTokens } from './api.js';

const ACCESS_KEY = 'bc.access';
const REFRESH_KEY = 'bc.refresh';
const USER_KEY = 'bc.user';
// Onboarding completion flag — persisted client-side until BLE-7f wires the
// backend step tracker. Bio "Done" flips this true, which causes the
// RootStack in App.tsx to swap from OnboardingNavigator to AppShell.
// Once /me returns onboarding state, replace the SecureStore read in
// `hydrate` with a server lookup and drop the local setter.
const ONBOARDING_DONE_KEY = 'bc.onboarding_complete';

interface AuthState {
  hydrated: boolean;
  userId: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  onboardingComplete: boolean;
  hydrate: () => Promise<void>;
  setSession: (t: AuthTokens) => Promise<void>;
  setOnboardingComplete: (done: boolean) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  hydrated: false,
  userId: null,
  accessToken: null,
  refreshToken: null,
  onboardingComplete: false,
  hydrate: async () => {
    const [userId, accessToken, refreshToken, onboardingFlag] = await Promise.all([
      SecureStore.getItemAsync(USER_KEY),
      SecureStore.getItemAsync(ACCESS_KEY),
      SecureStore.getItemAsync(REFRESH_KEY),
      SecureStore.getItemAsync(ONBOARDING_DONE_KEY),
    ]);
    // Optimistic hydrate from SecureStore so the UI can paint immediately,
    // then reconcile against the server flag via /me. On reinstall the
    // SecureStore is empty but /me still knows; on token-revoked the /me
    // call 401s and we silently keep the cached value.
    set({
      hydrated: true,
      userId,
      accessToken,
      refreshToken,
      onboardingComplete: onboardingFlag === '1',
    });
    if (accessToken) {
      try {
        const me = await getMe(accessToken);
        if (me.onboardingCompleted !== (onboardingFlag === '1')) {
          if (me.onboardingCompleted) {
            await SecureStore.setItemAsync(ONBOARDING_DONE_KEY, '1');
          } else {
            await SecureStore.deleteItemAsync(ONBOARDING_DONE_KEY);
          }
          set({ onboardingComplete: me.onboardingCompleted });
        }
      } catch (e) {
        // Token invalid/revoked (401) — purge stale session so the app
        // routes to Login instead of looping 401s. Common after API URL
        // swap (e.g. LAN dev -> production VPS) or JWT secret rotation.
        if (e instanceof ApiError && e.status === 401) {
          await Promise.all([
            SecureStore.deleteItemAsync(USER_KEY),
            SecureStore.deleteItemAsync(ACCESS_KEY),
            SecureStore.deleteItemAsync(REFRESH_KEY),
            SecureStore.deleteItemAsync(ONBOARDING_DONE_KEY),
          ]);
          set({
            userId: null,
            accessToken: null,
            refreshToken: null,
            onboardingComplete: false,
          });
        }
        // Otherwise (network down, 5xx): keep optimistic cache and let
        // next boot reconcile.
      }
    }
  },
  setSession: async (t) => {
    await Promise.all([
      SecureStore.setItemAsync(USER_KEY, t.userId),
      SecureStore.setItemAsync(ACCESS_KEY, t.accessToken),
      SecureStore.setItemAsync(REFRESH_KEY, t.refreshToken),
    ]);
    set({ userId: t.userId, accessToken: t.accessToken, refreshToken: t.refreshToken });
  },
  setOnboardingComplete: async (done) => {
    if (done) {
      await SecureStore.setItemAsync(ONBOARDING_DONE_KEY, '1');
    } else {
      await SecureStore.deleteItemAsync(ONBOARDING_DONE_KEY);
    }
    set({ onboardingComplete: done });
  },
  signOut: async () => {
    await Promise.all([
      SecureStore.deleteItemAsync(USER_KEY),
      SecureStore.deleteItemAsync(ACCESS_KEY),
      SecureStore.deleteItemAsync(REFRESH_KEY),
      SecureStore.deleteItemAsync(ONBOARDING_DONE_KEY),
    ]);
    set({
      userId: null,
      accessToken: null,
      refreshToken: null,
      onboardingComplete: false,
    });
  },
}));
