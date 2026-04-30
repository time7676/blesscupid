/**
 * Onboarding analytics emitter. PII redacted at the call-site shape — never
 * pass identifiers, ayat text, faith journey, or photo IDs through `track()`.
 *
 * A lint rule (TODO: eslint-plugin-no-pii) should enforce that `track()`'s
 * second arg is a literal object whose values are primitives or enum strings.
 */

import type { Mode, MarriageTimeline } from '../state/onboardingMachine';

export type OnboardingEventName =
  | 'onboarding_started'
  | 'onboarding_step_view'
  | 'onboarding_step_advanced'
  | 'onboarding_step_back'
  | 'onboarding_auth_method_selected'
  | 'onboarding_otp_resent'
  | 'onboarding_modes_selected'
  | 'onboarding_faith_statement_agreed'
  | 'onboarding_photo_uploaded'
  | 'onboarding_selfie_liveness_result'
  | 'onboarding_marriage_timeline_selected'
  | 'onboarding_completed'
  | 'onboarding_abandoned';

type EventProps = {
  onboarding_started: Record<string, never>;
  onboarding_step_view: { step: string };
  onboarding_step_advanced: { from: string; to: string; durationMs: number };
  onboarding_step_back: { from: string; to: string };
  onboarding_auth_method_selected: { method: 'phone' | 'email' };
  onboarding_otp_resent: { attemptCount: number };
  onboarding_modes_selected: { modes: Mode[] };
  onboarding_faith_statement_agreed: { readDurationMs: number };
  onboarding_photo_uploaded: { formatHint: string; byteSize: number };
  onboarding_selfie_liveness_result: {
    verdict: 'pass' | 'retry' | 'fail';
    vendor: string;
  };
  onboarding_marriage_timeline_selected: { value: MarriageTimeline };
  onboarding_completed: { totalDurationMs: number; modeCount: number };
  onboarding_abandoned: { lastStep: string; durationMs: number };
};

export function track<K extends OnboardingEventName>(
  event: K,
  props: EventProps[K],
): void {
  if (process.env.EXPO_PUBLIC_ANALYTICS_DISABLED === 'true') return;
  // PostHog binding lives in the host app; this scaffold only declares the shape.
  // Replace with: posthog.capture(event, props);
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log('[analytics]', event, props);
  }
}
