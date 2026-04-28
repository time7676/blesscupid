import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';

// PostHog server-side analytics. Lazy-imported so SDK is optional at install time.
// Privacy defaults: never capture raw email or phone — hash to a stable distinctId before calling.

type PostHogLike = {
  capture: (input: { distinctId: string; event: string; properties?: Record<string, unknown> }) => void;
  identify: (input: { distinctId: string; properties?: Record<string, unknown> }) => void;
  shutdown: () => Promise<void>;
};

@Injectable()
export class AnalyticsService implements OnModuleInit, OnModuleDestroy {
  private client: PostHogLike | null = null;

  async onModuleInit(): Promise<void> {
    const apiKey = process.env.POSTHOG_API_KEY;
    if (!apiKey) {
      // eslint-disable-next-line no-console
      console.log('[observability] POSTHOG_API_KEY not set — analytics disabled');
      return;
    }
    try {
      const mod = (await import('posthog-node').catch(() => null)) as
        | { PostHog?: new (key: string, opts?: Record<string, unknown>) => PostHogLike }
        | null;
      if (!mod?.PostHog) {
        // eslint-disable-next-line no-console
        console.warn('[observability] posthog-node not installed — run `pnpm add posthog-node` in apps/api');
        return;
      }
      this.client = new mod.PostHog(apiKey, {
        host: process.env.POSTHOG_HOST ?? 'https://us.i.posthog.com',
        flushAt: 20,
        flushInterval: 10_000,
      });
      // eslint-disable-next-line no-console
      console.log('[observability] PostHog initialised');
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[observability] PostHog init failed', err);
    }
  }

  capture(distinctId: string, event: string, properties?: Record<string, unknown>): void {
    if (!this.client) return;
    this.client.capture({ distinctId, event, properties });
  }

  identify(distinctId: string, properties?: Record<string, unknown>): void {
    if (!this.client) return;
    this.client.identify({ distinctId, properties });
  }

  async onModuleDestroy(): Promise<void> {
    if (!this.client) return;
    await this.client.shutdown();
  }
}
