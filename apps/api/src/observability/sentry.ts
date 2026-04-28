// Sentry init for the API. Lazy-imported so the SDK is optional at install time.
// When SENTRY_DSN is unset, init is a no-op and captureException falls back to console.error.

type SentryLike = {
  init: (opts: Record<string, unknown>) => void;
  captureException: (err: unknown, ctx?: Record<string, unknown>) => void;
  captureMessage: (msg: string, ctx?: Record<string, unknown>) => void;
  flush: (timeoutMs?: number) => Promise<boolean>;
};

let sentry: SentryLike | null = null;

export async function initSentry(): Promise<void> {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    // eslint-disable-next-line no-console
    console.log('[observability] SENTRY_DSN not set — error reporting disabled');
    return;
  }
  try {
    const mod = (await import('@sentry/node').catch(() => null)) as
      | { default?: SentryLike } & SentryLike
      | null;
    if (!mod) {
      // eslint-disable-next-line no-console
      console.warn('[observability] @sentry/node not installed — run `pnpm add @sentry/node` in apps/api');
      return;
    }
    const sdk = (mod.default ?? mod) as SentryLike;
    sdk.init({
      dsn,
      environment: process.env.NODE_ENV ?? 'production',
      release: process.env.GIT_SHA ?? process.env.npm_package_version,
      tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? '0.1'),
      profilesSampleRate: Number(process.env.SENTRY_PROFILES_SAMPLE_RATE ?? '0'),
    });
    sentry = sdk;
    // eslint-disable-next-line no-console
    console.log('[observability] Sentry initialised');
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[observability] Sentry init failed', err);
  }
}

export function captureException(err: unknown, ctx?: Record<string, unknown>): void {
  if (sentry) {
    sentry.captureException(err, ctx);
    return;
  }
  // eslint-disable-next-line no-console
  console.error('[observability] captureException', err, ctx ?? {});
}

export function captureMessage(msg: string, ctx?: Record<string, unknown>): void {
  if (sentry) {
    sentry.captureMessage(msg, ctx);
    return;
  }
  // eslint-disable-next-line no-console
  console.warn('[observability] captureMessage', msg, ctx ?? {});
}

export async function flushSentry(timeoutMs = 2000): Promise<void> {
  if (!sentry) return;
  await sentry.flush(timeoutMs);
}
