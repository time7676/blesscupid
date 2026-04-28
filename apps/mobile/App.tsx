import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OnboardingAgeGateScreen } from './src/screens/onboarding/AgeGate.js';
import { OnboardingCovenantScreen } from './src/screens/onboarding/Covenant.js';
import { OnboardingFaithScreen } from './src/screens/onboarding/Faith.js';
import { OnboardingProfileBasicsScreen } from './src/screens/onboarding/ProfileBasics.js';
import { OnboardingFirstPhotoScreen } from './src/screens/onboarding/FirstPhoto.js';
import { OnboardingBioScreen } from './src/screens/onboarding/Bio.js';
import { DatingOutOfScopeScreen } from './src/screens/onboarding/DatingOutOfScope.js';
import { LoginScreen } from './src/screens/auth/Login.js';
import { SignupScreen } from './src/screens/auth/Signup.js';
import { ProfileScreen } from './src/screens/Profile.js';
import { useAuth } from './src/lib/auth-store.js';
import { useLocale } from './src/i18n/locale-store.js';
import { initObservability } from './src/lib/observability/index.js';
import { CatechismNavigator } from './src/navigation/CatechismNavigator.js';
import type { OnboardingStackParamList } from './src/navigation/types.js';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export default function App() {
  const { hydrated, userId, hydrate } = useAuth();
  const hydrateLocale = useLocale((s) => s.hydrate);

  useEffect(() => {
    hydrate();
    void hydrateLocale();
    void initObservability();
  }, [hydrate, hydrateLocale]);

  if (!hydrated) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator />
      </View>
    );
  }

  const initialRoute: keyof OnboardingStackParamList = userId ? 'Profile' : 'Signup';

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="OnboardingAgeGate" component={OnboardingAgeGateScreen} />
        <Stack.Screen name="OnboardingCovenant" component={OnboardingCovenantScreen} />
        <Stack.Screen name="OnboardingFaith" component={OnboardingFaithScreen} />
        <Stack.Screen name="OnboardingProfileBasics" component={OnboardingProfileBasicsScreen} />
        <Stack.Screen name="OnboardingFirstPhoto" component={OnboardingFirstPhotoScreen} />
        <Stack.Screen name="OnboardingBio" component={OnboardingBioScreen} />
        <Stack.Screen name="OnboardingDatingOutOfScope" component={DatingOutOfScopeScreen} />
        <Stack.Screen name="Catechism" component={CatechismNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
