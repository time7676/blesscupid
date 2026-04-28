import { OnboardingStep, ONBOARDING_ORDER } from './onboarding.js';

export interface OnboardingStateSnapshot {
  ageVerifiedAdult: boolean;
  covenantSigned: boolean;
  faithComplete: boolean;
  profileComplete: boolean;
  hasPhoto: boolean;
  bioApproved: boolean;
}

/**
 * Server-authoritative resolver: given an onboarding state snapshot, return the
 * next step the client should route the user to. `done` once every gate passes.
 *
 * Mobile MUST call `GET /onboarding/state` after signup/login and route to
 * `nextStep(state)` instead of going straight to Profile. This guarantees a new
 * user signs the covenant, completes the faith questionnaire, and uploads a
 * face photo before reaching the rest of the app.
 */
export function nextStep(state: OnboardingStateSnapshot): OnboardingStep {
  if (!state.ageVerifiedAdult) return OnboardingStep.ageGate;
  if (!state.covenantSigned) return OnboardingStep.covenant;
  if (!state.faithComplete) return OnboardingStep.faithQuestionnaire;
  if (!state.profileComplete) return OnboardingStep.profileBasics;
  if (!state.hasPhoto) return OnboardingStep.firstPhoto;
  if (!state.bioApproved) return OnboardingStep.bio;
  return OnboardingStep.done;
}

/** Position in the canonical onboarding ordering (0 = first, ONBOARDING_ORDER.length-1 = done). */
export function stepIndex(step: OnboardingStep): number {
  const idx = ONBOARDING_ORDER.indexOf(step);
  return idx === -1 ? 0 : idx;
}

export function isOnboardingComplete(state: OnboardingStateSnapshot): boolean {
  return nextStep(state) === OnboardingStep.done;
}
