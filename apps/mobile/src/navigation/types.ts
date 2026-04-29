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

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Signup: undefined;
};

export type OnboardingStackParamList = {
  Signup: undefined;
  Login: undefined;
  OnboardingAgeGate: undefined;
  OnboardingCovenant: undefined;
  OnboardingFaith: undefined;
  OnboardingProfileBasics: undefined;
  OnboardingFirstPhoto: undefined;
  OnboardingBio: undefined;
  OnboardingDatingOutOfScope: undefined;
  // Legacy completion sink — stack-resets to ProfileLegacy at root.
  Profile: undefined;
  // v0 design-system onboarding (BLE-155). Demonstrates the BLE-92 token +
  // component layer end-to-end. No backend wire-up — the v0 flow's "Begin"
  // button hands off to the live Signup screen.
  V0Welcome: undefined;
  V0Tradition: undefined;
  V0Statement: { tradition: string };
  V0DailyPreview: { tradition: string; statement: string };
  V0Done: undefined;
  DevDesignTokens: undefined;
  Catechism: NavigatorScreenParams<CatechismStackParamList>;
};

/**
 * AppShell — bottom-tabs surface for authenticated, onboarded users.
 * Phase 6: replaces the old monolithic Profile screen.
 */
export type AppShellTabParamList = {
  Today: undefined;
  People: undefined;
  Threads: undefined;
  You: undefined;
};

/**
 * Root — single entry decision gate.
 *   no auth → AuthStack (Welcome / Login / Signup)
 *   auth + not done → OnboardingStack
 *   auth + done → AppShell
 */
export type RootStackParamList = {
  Auth: { screen?: 'Welcome' | 'Login' | 'Signup' };
  Onboarding: NavigatorScreenParams<OnboardingStackParamList>;
  AppShell: NavigatorScreenParams<AppShellTabParamList>;
};
