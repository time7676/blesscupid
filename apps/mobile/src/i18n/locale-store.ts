import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

export type Locale = 'id' | 'en';

const LOCALE_KEY = 'bc.locale';
const DEFAULT_LOCALE: Locale = 'id';

interface LocaleState {
  locale: Locale;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setLocale: (l: Locale) => Promise<void>;
  toggle: () => Promise<void>;
}

export const useLocale = create<LocaleState>((set, get) => ({
  locale: DEFAULT_LOCALE,
  hydrated: false,
  hydrate: async () => {
    const stored = await SecureStore.getItemAsync(LOCALE_KEY);
    const locale: Locale = stored === 'en' ? 'en' : 'id';
    set({ locale, hydrated: true });
  },
  setLocale: async (locale) => {
    await SecureStore.setItemAsync(LOCALE_KEY, locale);
    set({ locale });
  },
  toggle: async () => {
    const next: Locale = get().locale === 'id' ? 'en' : 'id';
    await SecureStore.setItemAsync(LOCALE_KEY, next);
    set({ locale: next });
  },
}));
