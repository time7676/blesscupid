/**
 * Inline server-side i18n for notification copy.
 *
 * Plan calls for i18next; we don't yet have it as a dep, so this module
 * is the single source of localized notification strings until the
 * shared I18nModule lands. Mirrors the {{var}} interpolation idiom so
 * future migration is mechanical.
 *
 * Pastor-reviewed copy will replace these once `docs/copy/PLACEHOLDERS.md`
 * is signed off — see Holy Code of Conduct guardrails.
 */

import { Locale } from '@prisma/client';

export type NotifLocale = Locale; // 'en' | 'id'

interface NotifTemplate {
  title: string;
  body: string;
}

type Templates = Record<NotifLocale, NotifTemplate>;

export const NOTIF_COPY = {
  match: {
    en: { title: 'A new match', body: 'You and {{name}} both said yes. Open to start with a verse.' },
    id: { title: 'Pertemuan baru', body: 'Kamu dan {{name}} saling menyapa. Buka untuk mulai dengan ayat.' },
  } satisfies Templates,
  message: {
    en: { title: '{{name}} wrote you', body: '{{preview}}' },
    id: { title: '{{name}} menulis untukmu', body: '{{preview}}' },
  } satisfies Templates,
  verification_approved: {
    en: { title: 'Verified', body: 'Your photo verification is approved.' },
    id: { title: 'Terverifikasi', body: 'Foto verifikasimu sudah disetujui.' },
  } satisfies Templates,
  verification_rejected: {
    en: { title: 'Verification update', body: 'Your photo verification needs another try. Tap to retake.' },
    id: { title: 'Verifikasi perlu diulang', body: 'Foto verifikasimu perlu diambil ulang. Ketuk untuk coba lagi.' },
  } satisfies Templates,
} as const;

/**
 * Renders a template with `{{var}}` substitutions. Strings keep their
 * curly placeholders if the var is missing — fail-loud beats silent
 * truncation when copy is wrong.
 */
export function renderTemplate(
  tpl: NotifTemplate,
  vars: Record<string, string>,
): { title: string; body: string } {
  const fill = (s: string): string =>
    s.replace(/\{\{(\w+)\}\}/g, (_m, k: string) => vars[k] ?? `{{${k}}}`);
  return { title: fill(tpl.title), body: fill(tpl.body) };
}

/**
 * Push body length cap. APNs alert.body is bounded by the 4 KB payload
 * budget; we cap at 100 chars (plan §"100-char truncation") to keep
 * the lockscreen preview tight + leave room for data fields.
 */
export const PUSH_BODY_MAX = 100;

export function truncateBody(body: string): string {
  if (body.length <= PUSH_BODY_MAX) return body;
  return body.slice(0, PUSH_BODY_MAX - 1).trimEnd() + '…';
}
