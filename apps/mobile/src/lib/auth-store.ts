import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import type { AuthTokens } from './api';

const ACCESS_KEY = 'bc.access';
const REFRESH_KEY = 'bc.refresh';
const USER_KEY = 'bc.user';

interface AuthState {
  hydrated: boolean;
  userId: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  hydrate: () => Promise<void>;
  setSession: (t: AuthTokens) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  hydrated: false,
  userId: null,
  accessToken: null,
  refreshToken: null,
  hydrate: async () => {
    const [userId, accessToken, refreshToken] = await Promise.all([
      SecureStore.getItemAsync(USER_KEY),
      SecureStore.getItemAsync(ACCESS_KEY),
      SecureStore.getItemAsync(REFRESH_KEY),
    ]);
    set({ hydrated: true, userId, accessToken, refreshToken });
  },
  setSession: async (t) => {
    await Promise.all([
      SecureStore.setItemAsync(USER_KEY, t.userId),
      SecureStore.setItemAsync(ACCESS_KEY, t.accessToken),
      SecureStore.setItemAsync(REFRESH_KEY, t.refreshToken),
    ]);
    set({ userId: t.userId, accessToken: t.accessToken, refreshToken: t.refreshToken });
  },
  signOut: async () => {
    await Promise.all([
      SecureStore.deleteItemAsync(USER_KEY),
      SecureStore.deleteItemAsync(ACCESS_KEY),
      SecureStore.deleteItemAsync(REFRESH_KEY),
    ]);
    set({ userId: null, accessToken: null, refreshToken: null });
  },
}));
