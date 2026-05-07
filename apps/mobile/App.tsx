// BlessCupid v1 mobile root.
//
// Routing gate (one child stack at a time):
//   no userId             → Auth flow (Welcome / Login / Signup / Forgot / Verify)
//   userId + !onboarded   → OnboardingFlow (8-card)
//   userId + onboarded    → AppShell (Today / Matches / Chats / You)

import * as React from 'react';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { LoginScreen } from './src/screens/auth/Login.js';
import { SignupScreen } from './src/screens/auth/Signup.js';
import { WelcomeScreen } from './src/screens/auth/Welcome.js';
import { ForgotPasswordScreen } from './src/screens/auth/ForgotPassword.js';
import { EmailVerifyScreen } from './src/screens/auth/EmailVerify.js';
import { OnboardingFlow } from './src/screens/onboarding/OnboardingFlow.js';
import { useAuth } from './src/lib/auth-store.js';
import { useLocale } from './src/i18n/locale-store.js';
import { initI18n } from './src/i18n/init.js';
import { initObservability } from './src/lib/observability/index.js';
import { getFirebaseApp } from './src/lib/firebase.js';
import {
  registerForPushNotifications,
  onForegroundNotification,
  onNotificationTap,
} from './src/lib/notifications.js';
import { color, useDesignSystemFonts } from './src/lib/design-system/index.js';
import { AppShell } from './src/navigation/AppShell.js';
import type {
  AuthStackParamList,
  RootStackParamList,
} from './src/navigation/types.js';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Welcome" component={WelcomeScreen} />
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Signup" component={SignupScreen} />
      <AuthStack.Screen name="ForgotPassword">
        {({ navigation }) => (
          <ForgotPasswordScreen
            onBack={() => navigation.goBack()}
            onDone={() => navigation.navigate('Login')}
          />
        )}
      </AuthStack.Screen>
      <AuthStack.Screen name="EmailVerify">
        {({ navigation, route }) => (
          <EmailVerifyScreen
            email={route.params?.email ?? ''}
            onVerified={() => navigation.navigate('Welcome')}
            onCancel={() => navigation.goBack()}
          />
        )}
      </AuthStack.Screen>
    </AuthStack.Navigator>
  );
}

function RootApp() {
  const { hydrated, userId, hydrate, onboardingComplete, accessToken, signOut } = useAuth();
  const { status: fontStatus } = useDesignSystemFonts();
  const hydrateLocale = useLocale((s) => s.hydrate);

  useEffect(() => {
    void initI18n();
    hydrate();
    void hydrateLocale();
    void initObservability();
    getFirebaseApp();
  }, [hydrate, hydrateLocale]);

  useEffect(() => {
    if (!accessToken) return;
    void registerForPushNotifications(accessToken, '0.2.0');
  }, [accessToken]);

  useEffect(() => {
    const offFg = onForegroundNotification((payload) => {
      if (__DEV__) console.log('[notif fg]', payload.type);
    });
    const offTap = onNotificationTap((payload) => {
      if (__DEV__) console.log('[notif tap]', payload.type);
    });
    return () => {
      offFg();
      offTap();
    };
  }, []);

  const fontsBlocking = fontStatus === 'loading';

  if (!hydrated || fontsBlocking) {
    return (
      <View style={splashStyles.root}>
        <ActivityIndicator color={color.ink.default} />
        {fontStatus === 'loading' ? <Text style={splashStyles.label}>Loading…</Text> : null}
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <RootStack.Navigator screenOptions={{ headerShown: false }}>
            {userId ? (
              onboardingComplete ? (
                <RootStack.Screen name="AppShell" component={AppShell} />
              ) : (
                <RootStack.Screen name="Onboarding">
                  {() => <OnboardingFlow onComplete={() => signOut()} />}
                </RootStack.Screen>
              )
            ) : (
              <RootStack.Screen name="Auth" component={AuthNavigator} />
            )}
          </RootStack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default function App() {
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
