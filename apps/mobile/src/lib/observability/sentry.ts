// Mobile Sentry init. Lazy-imported so the app still runs without the SDK installed.
// Uses EXPO_PUBLIC_SENTRY_DSN (Expo public env). Init is a no-op when unset.

declare const process: { env: Record<string, string | undefined> };

type SentryRN = {
  init: (opts: Record<string, unknown>) => void;
  captureException: (err: unknown) => void;
  captureMessage: (msg: string) => void;
  ReactNavigationInstrumentation: new () => unknown;
};

let sentry: SentryRN | null = null;

export async function initMobileSentry(): Promise<void> {
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  if (!dsn) {
    // eslint-disable-next-line no-console
    console.log('[obs] EXPO_PUBLIC_SENTRY_DSN not set — error reporting disabled');
    return;
  }
  try {
    const mod = (await import('@sentry/react-native').catch(() => null)) as
      | (SentryRN & { default?: SentryRN })
      | null;
    if (!mod) {
      // eslint-disable-next-line no-console
      console.warn('[obs] @sentry/react-native not installed');
      return;
    }
    const sdk = (mod.default ?? mod) as SentryRN;
    sdk.init({
      dsn,
      environment: process.env.EXPO_PUBLIC_ENV ?? 'production',
      tracesSampleRate: 0.1,
      attachStacktrace: true,
      enableAutoSessionTracking: true,
    });
    sentry = sdk;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[obs] Sentry init failed', err);
  }
}

export function captureException(err: unknown): void {
  if (sentry) {
    sentry.captureException(err);
    return;
  }
  // eslint-disable-next-line no-console
  console.error('[obs] captureException', err);
}

export function captureMessage(msg: string): void {
  if (sentry) {
    sentry.captureMessage(msg);
    return;
  }
  // eslint-disable-next-line no-console
  console.warn('[obs] captureMessage', msg);
}
