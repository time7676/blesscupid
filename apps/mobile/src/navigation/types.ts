import type { NavigatorScreenParams } from '@react-navigation/native';

export type CatechismStackParamList = {
  CatechismBeat1Tagline: undefined;
  CatechismBeat2Modes: undefined;
  CatechismBeat3Preview: undefined;
  CatechismBeat4Full: undefined;
  CatechismBeat5Photo: undefined;
  CatechismBeat6Faith: undefined;
  CatechismBeat7Timeline: undefined;
  CatechismBeat8Welcome: { firstName?: string } | undefined;
};

export type OnboardingStackParamList = {
  Signup: undefined;
  Login: undefined;
  Profile: undefined;
  OnboardingAgeGate: undefined;
  OnboardingCovenant: undefined;
  OnboardingFaith: undefined;
  OnboardingProfileBasics: undefined;
  OnboardingFirstPhoto: undefined;
  OnboardingBio: undefined;
  OnboardingDatingOutOfScope: undefined;
  Catechism: NavigatorScreenParams<CatechismStackParamList>;
};
