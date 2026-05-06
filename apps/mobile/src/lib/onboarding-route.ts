import { OnboardingStep } from '@blesscupid/shared';
import type { OnboardingStackParamList } from '../navigation/types.js';

export type OnboardingRouteName = keyof OnboardingStackParamList;

export function routeForNextStep(step: OnboardingStep): OnboardingRouteName {
  switch (step) {
    case OnboardingStep.ageGate:
      return 'OnboardingAgeGate';
    case OnboardingStep.covenant:
      return 'OnboardingCovenant';
    case OnboardingStep.faithQuestionnaire:
      return 'OnboardingFaith';
    case OnboardingStep.profileBasics:
      return 'OnboardingProfileBasics';
    case OnboardingStep.firstPhoto:
      return 'OnboardingFirstPhoto';
    case OnboardingStep.bio:
      return 'OnboardingBio';
    case OnboardingStep.done:
      // Done lands on celebratory final screen; root nav swaps to AppShell
      // automatically once onboardingComplete = true in auth-store.
      return 'OnboardingDone';
  }
}
