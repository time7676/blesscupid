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
    // BLE eng-review 2026-05-06 — Lane E. Re-enabled. The earlier comment
    // about Metro static tracing was for a custom dev-client build issue
    // that was resolved in Expo SDK 54. posthog-react-native is in deps.
    const mod = await import('posthog-react-native');
    const PostHog = (mod as { default?: typeof mod.PostHog }).default ?? mod.PostHog;
    client = new PostHog(apiKey, {
      host: process.env.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://app.posthog.com',
      // Default to no flushAtMs override: SDK auto-flushes on background.
    }) as unknown as PostHogRN;
    // eslint-disable-next-line no-console
    console.log('[obs] PostHog initialised');
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[obs] PostHog init failed:', (err as Error).message);
    client = null;
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

// BLE eng-review 2026-05-06 — Lane E. Eight core funnel events. Keep
// names stable; PostHog dashboards key on them. Property shape is
// PII-free (no names, no emails, no message contents).
export const Events = {
  signupStarted: () => track('signup_started'),
  signupCompleted: (props: { method: 'email' | 'apple' | 'google' }) =>
    track('signup_completed', props),
  onboardingCompleted: () => track('onboarding_completed'),
  dailyStackViewed: (props: { stackSize: number; activeIndex: number }) =>
    track('daily_stack_viewed', props),
  profileOpened: (props: { source: 'today' | 'conversations' }) =>
    track('profile_opened', props),
  matchDecision: (props: { decision: 'pass' | 'like' | 'super_like' }) =>
    track('match_decision', props),
  conversationBegan: () => track('conversation_began'),
  messageSent: (props: { threadAge: 'first' | 'reply' }) =>
    track('message_sent', props),
  day7Return: () => track('day7_return'),
  accountBlocked: () => track('account_blocked'),
};
