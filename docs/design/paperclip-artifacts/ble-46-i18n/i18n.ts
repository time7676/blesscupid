// BlessCupid i18n runtime.
// Drop into apps/mobile/src/i18n/index.ts (or wherever the Expo app lives).
//
// deps:
//   yarn add i18next react-i18next i18next-icu intl-messageformat \
//     expo-localization @react-native-async-storage/async-storage

import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import ICU from 'i18next-icu';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import id from './locales/id.json';
import en from './locales/en.json';

export const SUPPORTED_LOCALES = ['id', 'en'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'id';
export const FALLBACK_LOCALE: Locale = 'en';

const STORAGE_KEY = 'app:locale';

async function resolveInitialLocale(): Promise<Locale> {
  const stored = await AsyncStorage.getItem(STORAGE_KEY);
  if (stored && (SUPPORTED_LOCALES as readonly string[]).includes(stored)) {
    return stored as Locale;
  }
  const device = Localization.getLocales()[0]?.languageCode;
  if (device && (SUPPORTED_LOCALES as readonly string[]).includes(device)) {
    return device as Locale;
  }
  return DEFAULT_LOCALE;
}

export async function initI18n() {
  const lng = await resolveInitialLocale();

  await i18next
    .use(ICU)
    .use(initReactI18next)
    .init({
      lng,
      fallbackLng: FALLBACK_LOCALE,
      supportedLngs: SUPPORTED_LOCALES as unknown as string[],
      defaultNS: 'common',
      ns: ['common', 'auth', 'match', 'profile', 'safety', 'faith', 'errors'],
      resources: {
        id: id as Record<string, Record<string, unknown>>,
        en: en as Record<string, Record<string, unknown>>,
      },
      interpolation: {
        escapeValue: false, // React already escapes
      },
      returnEmptyString: false, // empty string in `id` should fall through to `en`
      compatibilityJSON: 'v4', // CLDR plural rules
      react: {
        useSuspense: false,
      },
    });

  return i18next;
}

export async function setLocale(next: Locale) {
  if (!(SUPPORTED_LOCALES as readonly string[]).includes(next)) {
    throw new Error(`Unsupported locale: ${next}`);
  }
  await AsyncStorage.setItem(STORAGE_KEY, next);
  await i18next.changeLanguage(next);
}

export function getLocale(): Locale {
  return (i18next.resolvedLanguage ?? DEFAULT_LOCALE) as Locale;
}

export default i18next;
