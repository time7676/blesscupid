import * as React from 'react';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { OnboardingAgeGateScreen } from './src/screens/onboarding/AgeGate.js';
import { OnboardingCovenantScreen } from './src/screens/onboarding/Covenant.js';
import { OnboardingFaithScreen } from './src/screens/onboarding/Faith.js';
import { OnboardingProfileBasicsScreen } from './src/screens/onboarding/ProfileBasics.js';
import { OnboardingFirstPhotoScreen } from './src/screens/onboarding/FirstPhoto.js';
import { OnboardingBioScreen } from './src/screens/onboarding/Bio.js';
import { DatingOutOfScopeScreen } from './src/screens/onboarding/DatingOutOfScope.js';
import { LoginScreen } from './src/screens/auth/Login.js';
import { SignupScreen } from './src/screens/auth/Signup.js';
import { WelcomeScreen } from './src/screens/auth/Welcome.js';
import { V0WelcomeScreen } from './src/screens/onboarding-v0/Welcome.js';
import { V0FaithTraditionScreen } from './src/screens/onboarding-v0/FaithTradition.js';
import { V0FaithStatementScreen } from './src/screens/onboarding-v0/FaithStatement.js';
import { V0DailyIntentionPreviewScreen } from './src/screens/onboarding-v0/DailyIntentionPreview.js';
import { V0DoneScreen } from './src/screens/onboarding-v0/Done.js';
import { DevDesignTokensScreen } from './src/screens/__dev__/DesignTokens.js';
import { useAuth } from './src/lib/auth-store.js';
import { useLocale } from './src/i18n/locale-store.js';
import { initObservability } from './src/lib/observability/index.js';
import { getFirebaseApp } from './src/lib/firebase.js';
import { color, useDesignSystemFonts } from './src/lib/design-system/index.js';
import { CatechismNavigator } from './src/navigation/CatechismNavigator.js';
import { AppShell } from './src/navigation/AppShell.js';
import type {
  AuthStackParamList,
  OnboardingStackParamList,
  RootStackParamList,
} from './src/navigation/types.js';

// Storybook RN gate. EXPO_PUBLIC_ONBOARDING_STORYBOOK_ENABLED=1 swaps the app
// shell for the on-device Storybook UI so designers/QA can flip through every
// onboarding component variant without booting the full nav stack. The flag is
// read at module-eval time on purpose — toggling it requires a Metro restart,
// which keeps the production bundle free of Storybook even when minified.
const STORYBOOK_ENABLED =
  process.env.EXPO_PUBLIC_ONBOARDING_STORYBOOK_ENABLED === '1' ||
  process.env.EXPO_PUBLIC_ONBOARDING_STORYBOOK_ENABLED === 'true';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const OnboardingStack = createNativeStackNavigator<OnboardingStackParamList>();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Welcome" component={WelcomeScreen} />
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Signup" component={SignupScreen} />
    </AuthStack.Navigator>
  );
}

function OnboardingNavigator() {
  return (
    <OnboardingStack.Navigator screenOptions={{ headerShown: false }}>
      <OnboardingStack.Screen name="V0Welcome" component={V0WelcomeScreen} />
      <OnboardingStack.Screen name="V0Tradition" component={V0FaithTraditionScreen} />
      <OnboardingStack.Screen name="V0Statement" component={V0FaithStatementScreen} />
      <OnboardingStack.Screen name="V0DailyPreview" component={V0DailyIntentionPreviewScreen} />
      <OnboardingStack.Screen name="V0Done" component={V0DoneScreen} />
      <OnboardingStack.Screen name="DevDesignTokens" component={DevDesignTokensScreen} />
      <OnboardingStack.Screen name="Signup" component={SignupScreen} />
      <OnboardingStack.Screen name="Login" component={LoginScreen} />
      <OnboardingStack.Screen name="OnboardingAgeGate" component={OnboardingAgeGateScreen} />
      <OnboardingStack.Screen name="OnboardingCovenant" component={OnboardingCovenantScreen} />
      <OnboardingStack.Screen name="OnboardingFaith" component={OnboardingFaithScreen} />
      <OnboardingStack.Screen name="OnboardingProfileBasics" component={OnboardingProfileBasicsScreen} />
      <OnboardingStack.Screen name="OnboardingFirstPhoto" component={OnboardingFirstPhotoScreen} />
      <OnboardingStack.Screen name="OnboardingBio" component={OnboardingBioScreen} />
      <OnboardingStack.Screen name="OnboardingDatingOutOfScope" component={DatingOutOfScopeScreen} />
      <OnboardingStack.Screen name="Catechism" component={CatechismNavigator} />
    </OnboardingStack.Navigator>
  );
}

function RootApp() {
  const { hydrated, userId, hydrate } = useAuth();
  const { status: fontStatus } = useDesignSystemFonts();
  const hydrateLocale = useLocale((s) => s.hydrate);

  useEffect(() => {
    hydrate();
    void hydrateLocale();
    void initObservability();
    // Best-effort Firebase boot — null when EXPO_PUBLIC_FIREBASE_* not set.
    getFirebaseApp();
  }, [hydrate, hydrateLocale]);

  const fontsBlocking = fontStatus === 'loading';

  if (!hydrated || fontsBlocking) {
    return (
      <View style={splashStyles.root}>
        <ActivityIndicator color={color.ink.default} />
        {fontStatus === 'loading' ? <Text style={splashStyles.label}>Loading…</Text> : null}
      </View>
    );
  }

  // Phase 6 routing gate. We render exactly ONE child stack at a time so
  // login/logout swap the navigation tree at the root. Without this, the
  // AuthStack stays mounted after sign-in and `navigation.reset` calls
  // targeting Onboarding routes silently fail (route name not registered
  // in the active stack).
  //
  //   no userId          → Auth flow (animated Welcome)
  //   userId + !done     → Onboarding flow (kept intact)
  //   userId + done      → AppShell (Today / People / Threads / You)
  // TODO: wire onboarding completion flag when backend step tracker lands.
  const hasCompletedOnboarding = false;

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <RootStack.Navigator screenOptions={{ headerShown: false }}>
          {userId ? (
            hasCompletedOnboarding ? (
              <RootStack.Screen name="AppShell" component={AppShell} />
            ) : (
              <RootStack.Screen name="Onboarding" component={OnboardingNavigator} />
            )
          ) : (
            <RootStack.Screen name="Auth" component={AuthNavigator} />
          )}
        </RootStack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

// Lazy-require Storybook so the bundler only pulls it when the gate flag is on.
function loadStorybook(): React.ComponentType {
  throw new Error(
    'Storybook not available in this bundle. Run `pnpm storybook` for the design-system playground.',
  );
}

export default function App() {
  if (STORYBOOK_ENABLED) {
    const Storybook = loadStorybook();
    return <Storybook />;
  }
  return <RootApp />;
}

const splashStyles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: color.parchment.default,
    gap: 12,
  },
  label: {
    color: color.ink.soft,
    fontSize: 12,
  },
});
