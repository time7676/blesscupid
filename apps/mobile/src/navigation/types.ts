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
  // v0 design-system onboarding (BLE-155). Demonstrates the BLE-92 token +
  // component layer end-to-end. No backend wire-up — the v0 flow's "Begin"
  // button hands off to the live Signup screen.
  V0Welcome: undefined;
  V0Tradition: undefined;
  V0Statement: { tradition: string };
  V0DailyPreview: { tradition: string; statement: string };
  V0Done: undefined;
  DevDesignTokens: undefined;
};
