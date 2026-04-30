// Locale-aware date/number/currency/relative-time formatters.
// Hermes 0.74+ ships full Intl. No moment / dayjs needed.

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

const LOCALE_TAGS: Record<string, string> = {
  id: 'id-ID',
  en: 'en-US',
};

function tag(locale: string): string {
  return LOCALE_TAGS[locale] ?? LOCALE_TAGS.id;
}

export function useLocaleFormatters() {
  const { i18n } = useTranslation();
  const locale = tag(i18n.resolvedLanguage ?? 'id');

  return useMemo(() => {
    const date = new Intl.DateTimeFormat(locale, { dateStyle: 'medium' });
    const dateLong = new Intl.DateTimeFormat(locale, { dateStyle: 'long' });
    const time = new Intl.DateTimeFormat(locale, { timeStyle: 'short' });
    const datetime = new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
    const number = new Intl.NumberFormat(locale);
    const currencyIDR = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    });
    const percent = new Intl.NumberFormat(locale, { style: 'percent' });
    const relative = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

    return {
      date: (d: Date | number) => date.format(d),
      dateLong: (d: Date | number) => dateLong.format(d),
      time: (d: Date | number) => time.format(d),
      datetime: (d: Date | number) => datetime.format(d),
      number: (n: number) => number.format(n),
      idr: (n: number) => currencyIDR.format(n),
      percent: (n: number) => percent.format(n),
      // ago: how long ago a timestamp was, in nearest unit
      ago: (whenMs: number, nowMs: number = Date.now()) => {
        const diffSec = Math.round((whenMs - nowMs) / 1000);
        const abs = Math.abs(diffSec);
        if (abs < 60) return relative.format(diffSec, 'second');
        if (abs < 3600) return relative.format(Math.round(diffSec / 60), 'minute');
        if (abs < 86400) return relative.format(Math.round(diffSec / 3600), 'hour');
        if (abs < 2592000) return relative.format(Math.round(diffSec / 86400), 'day');
        if (abs < 31536000) return relative.format(Math.round(diffSec / 2592000), 'month');
        return relative.format(Math.round(diffSec / 31536000), 'year');
      },
    };
  }, [locale]);
}
