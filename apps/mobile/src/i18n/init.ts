// BlessCupid v1 i18n bootstrap.
//
// Wraps i18next + react-i18next. v1 keys live under `v1.*` namespace
// (legacy questionnaire/covenant keys at top-level remain Pastor-approved
// and untouched). Use `t('v1.today.actions.bless')` for new code.

import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

import enResources from './en.json';
import idResources from './id.json';

export type AppLocale = 'en' | 'id';

const FALLBACK_LOCALE: AppLocale = 'en';

function detectDeviceLocale(): AppLocale {
  const locales = Localization.getLocales();
  const first = locales[0]?.languageCode ?? FALLBACK_LOCALE;
  return first === 'id' ? 'id' : 'en';
}

export async function initI18n(initial?: AppLocale): Promise<void> {
  if (i18next.isInitialized) return;
  await i18next
    .use(initReactI18next)
    .init({
      resources: {
        en: { translation: enResources },
        id: { translation: idResources },
      },
      lng: initial ?? detectDeviceLocale(),
      fallbackLng: FALLBACK_LOCALE,
      interpolation: { escapeValue: false },
      compatibilityJSON: 'v4',
      returnEmptyString: false,
    });
}

export async function changeLanguage(locale: AppLocale): Promise<void> {
  await i18next.changeLanguage(locale);
}

export function currentLocale(): AppLocale {
  return (i18next.language as AppLocale) ?? FALLBACK_LOCALE;
}

export { default as i18next } from 'i18next';
export { useTranslation, Trans } from 'react-i18next';
