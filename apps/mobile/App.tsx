import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OnboardingAgeGateScreen } from './src/screens/onboarding/AgeGate.js';
import { OnboardingCovenantScreen } from './src/screens/onboarding/Covenant.js';
import { OnboardingFaithScreen } from './src/screens/onboarding/Faith.js';
import { OnboardingProfileBasicsScreen } from './src/screens/onboarding/ProfileBasics.js';
import { OnboardingFirstPhotoScreen } from './src/screens/onboarding/FirstPhoto.js';
import { OnboardingBioScreen } from './src/screens/onboarding/Bio.js';
import { LoginScreen } from './src/screens/auth/Login.js';
import { SignupScreen } from './src/screens/auth/Signup.js';
import type { OnboardingStackParamList } from './src/navigation/types.js';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Signup" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="OnboardingAgeGate" component={OnboardingAgeGateScreen} />
        <Stack.Screen name="OnboardingCovenant" component={OnboardingCovenantScreen} />
        <Stack.Screen name="OnboardingFaith" component={OnboardingFaithScreen} />
        <Stack.Screen name="OnboardingProfileBasics" component={OnboardingProfileBasicsScreen} />
        <Stack.Screen name="OnboardingFirstPhoto" component={OnboardingFirstPhotoScreen} />
        <Stack.Screen name="OnboardingBio" component={OnboardingBioScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
