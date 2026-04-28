import { describe, it, expect } from 'vitest';
import { OnboardingStep } from './onboarding.js';
import {
  isOnboardingComplete,
  nextStep,
  stepIndex,
  type OnboardingStateSnapshot,
} from './onboarding-flow.js';

const empty: OnboardingStateSnapshot = {
  ageVerifiedAdult: false,
  covenantSigned: false,
  faithComplete: false,
  profileComplete: false,
  hasPhoto: false,
  bioApproved: false,
};

describe('nextStep', () => {
  it('returns ageGate when DOB not verified', () => {
    expect(nextStep(empty)).toBe(OnboardingStep.ageGate);
  });

  it('returns covenant once age-gated but covenant unsigned', () => {
    expect(nextStep({ ...empty, ageVerifiedAdult: true })).toBe(OnboardingStep.covenant);
  });

  it('returns faith once covenant signed', () => {
    expect(
      nextStep({ ...empty, ageVerifiedAdult: true, covenantSigned: true }),
    ).toBe(OnboardingStep.faithQuestionnaire);
  });

  it('returns profile basics once faith complete', () => {
    expect(
      nextStep({
        ...empty,
        ageVerifiedAdult: true,
        covenantSigned: true,
        faithComplete: true,
      }),
    ).toBe(OnboardingStep.profileBasics);
  });

  it('returns first photo once basics complete', () => {
    expect(
      nextStep({
        ...empty,
        ageVerifiedAdult: true,
        covenantSigned: true,
        faithComplete: true,
        profileComplete: true,
      }),
    ).toBe(OnboardingStep.firstPhoto);
  });

  it('returns bio once a photo is approved', () => {
    expect(
      nextStep({
        ...empty,
        ageVerifiedAdult: true,
        covenantSigned: true,
        faithComplete: true,
        profileComplete: true,
        hasPhoto: true,
      }),
    ).toBe(OnboardingStep.bio);
  });

  it('returns done only when every gate passes', () => {
    const full: OnboardingStateSnapshot = {
      ageVerifiedAdult: true,
      covenantSigned: true,
      faithComplete: true,
      profileComplete: true,
      hasPhoto: true,
      bioApproved: true,
    };
    expect(nextStep(full)).toBe(OnboardingStep.done);
    expect(isOnboardingComplete(full)).toBe(true);
  });

  it('does not skip the covenant when faith is somehow saved before covenant', () => {
    // Defensive: covenant cannot be bypassed even if a future bug lets faith
    // save first. Order is enforced here, not just by client navigation.
    const skewed: OnboardingStateSnapshot = {
      ...empty,
      ageVerifiedAdult: true,
      covenantSigned: false,
      faithComplete: true,
    };
    expect(nextStep(skewed)).toBe(OnboardingStep.covenant);
  });
});

describe('stepIndex', () => {
  it('places ageGate first and done last', () => {
    expect(stepIndex(OnboardingStep.ageGate)).toBe(0);
    expect(stepIndex(OnboardingStep.done)).toBeGreaterThan(0);
  });
});
