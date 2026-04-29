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
  // Sentry SDK is intentionally not bundled into the Expo Go build — Metro
  // statically traces dynamic imports and pulls in @sentry/* transitive deps
  // that aren't part of this workspace install. Re-enable in a custom dev
  // client by restoring the dynamic `await import('@sentry/react-native')`.
  void dsn;
  // eslint-disable-next-line no-console
  console.log('[obs] Sentry disabled in this bundle');
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
