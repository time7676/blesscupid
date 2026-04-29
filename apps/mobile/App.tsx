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
import { LoginScreen } from './src/screens/auth/Login.js';
import { SignupScreen } from './src/screens/auth/Signup.js';
import { ProfileScreen } from './src/screens/Profile.js';
import { V0WelcomeScreen } from './src/screens/onboarding-v0/Welcome.js';
import { V0FaithTraditionScreen } from './src/screens/onboarding-v0/FaithTradition.js';
import { V0FaithStatementScreen } from './src/screens/onboarding-v0/FaithStatement.js';
import { V0DailyIntentionPreviewScreen } from './src/screens/onboarding-v0/DailyIntentionPreview.js';
import { V0DoneScreen } from './src/screens/onboarding-v0/Done.js';
import { DevDesignTokensScreen } from './src/screens/__dev__/DesignTokens.js';
import { useAuth } from './src/lib/auth-store.js';
import { initObservability } from './src/lib/observability/index.js';
import { color, useDesignSystemFonts } from './src/lib/design-system/index.js';
import type { OnboardingStackParamList } from './src/navigation/types.js';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export default function App() {
  const { hydrated, userId, hydrate } = useAuth();
  const { status: fontStatus } = useDesignSystemFonts();

  useEffect(() => {
    hydrate();
    void initObservability();
  }, [hydrate]);

  // Bundled font assets resolve from disk in airplane mode; an `error` here
  // means the bundle itself is broken. We render the system-font fallback so
  // the flow still boots — the type pairing degrades but the layout holds.
  const fontsBlocking = fontStatus === 'loading';

  if (!hydrated || fontsBlocking) {
    return (
      <View style={splashStyles.root}>
        <ActivityIndicator color={color.ink.default} />
        {fontStatus === 'loading' ? <Text style={splashStyles.label}>Loading…</Text> : null}
      </View>
    );
  }

  const initialRoute: keyof OnboardingStackParamList = userId ? 'Profile' : 'V0Welcome';

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
          <Stack.Screen name="V0Welcome" component={V0WelcomeScreen} />
          <Stack.Screen name="V0Tradition" component={V0FaithTraditionScreen} />
          <Stack.Screen name="V0Statement" component={V0FaithStatementScreen} />
          <Stack.Screen name="V0DailyPreview" component={V0DailyIntentionPreviewScreen} />
          <Stack.Screen name="V0Done" component={V0DoneScreen} />
          <Stack.Screen name="DevDesignTokens" component={DevDesignTokensScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="OnboardingAgeGate" component={OnboardingAgeGateScreen} />
          <Stack.Screen name="OnboardingCovenant" component={OnboardingCovenantScreen} />
          <Stack.Screen name="OnboardingFaith" component={OnboardingFaithScreen} />
          <Stack.Screen name="OnboardingProfileBasics" component={OnboardingProfileBasicsScreen} />
          <Stack.Screen name="OnboardingFirstPhoto" component={OnboardingFirstPhotoScreen} />
          <Stack.Screen name="OnboardingBio" component={OnboardingBioScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
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
