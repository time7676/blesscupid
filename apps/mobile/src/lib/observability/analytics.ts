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
  // PostHog SDK is intentionally not bundled into the Expo Go build — Metro
  // statically traces dynamic imports and pulls in @posthog/core which isn't
  // part of this workspace install. Re-enable in a custom dev client.
  void apiKey;
  // eslint-disable-next-line no-console
  console.log('[obs] PostHog disabled in this bundle');
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
