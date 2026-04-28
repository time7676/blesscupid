// Mobile PostHog analytics. Lazy-imported. Privacy defaults: pass a hashed/opaque distinctId only.

declare const process: { env: Record<string, string | undefined> };

type PostHogRN = {
  capture: (event: string, properties?: Record<string, unknown>) => void;
  identify: (distinctId: string, properties?: Record<string, unknown>) => void;
  optOut: () => void;
  optIn: () => void;
  reset: () => void;
};

let client: PostHogRN | null = null;

export async function initAnalytics(): Promise<void> {
  const apiKey = process.env.EXPO_PUBLIC_POSTHOG_KEY;
  if (!apiKey) {
    // eslint-disable-next-line no-console
    console.log('[obs] EXPO_PUBLIC_POSTHOG_KEY not set — analytics disabled');
    return;
  }
  try {
    const mod = (await import('posthog-react-native').catch(() => null)) as
      | { PostHog: new (key: string, opts?: Record<string, unknown>) => PostHogRN }
      | null;
    if (!mod) {
      // eslint-disable-next-line no-console
      console.warn('[obs] posthog-react-native not installed');
      return;
    }
    client = new mod.PostHog(apiKey, {
      host: process.env.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com',
      enableSessionReplay: false,
      captureAppLifecycleEvents: true,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[obs] PostHog init failed', err);
  }
}

export function track(event: string, properties?: Record<string, unknown>): void {
  client?.capture(event, properties);
}

export function identify(distinctId: string, properties?: Record<string, unknown>): void {
  client?.identify(distinctId, properties);
}

export function optOutAnalytics(): void {
  client?.optOut();
}

export function resetAnalytics(): void {
  client?.reset();
}
