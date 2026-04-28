import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { OnboardingStep } from '@blesscupid/shared';
import type { OnboardingStackParamList } from '../navigation/types.js';
import { ApiError, getOnboardingState } from '../lib/api.js';
import { useAuth } from '../lib/auth-store.js';
import { routeForNextStep } from '../lib/onboarding-route.js';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Profile'>;

export function ProfileScreen({ navigation }: Props) {
  const { userId, accessToken, signOut } = useAuth();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      if (!accessToken) {
        if (!cancelled) setChecking(false);
        return;
      }
      try {
        const state = await getOnboardingState(accessToken);
        if (cancelled) return;
        if (state.nextStep !== OnboardingStep.done) {
          navigation.reset({
            index: 0,
            routes: [{ name: routeForNextStep(state.nextStep) }],
          });
          return;
        }
        setChecking(false);
      } catch (err) {
        if (cancelled) return;
        // If the token is invalid, sign out so the auth gate kicks in. Otherwise
        // fall through and let the user see Profile rather than soft-locking.
        if (err instanceof ApiError && err.status === 401) {
          await signOut();
          navigation.reset({ index: 0, routes: [{ name: 'Signup' }] });
          return;
        }
        setChecking(false);
      }
    }
    check();
    return () => {
      cancelled = true;
    };
  }, [accessToken, navigation, signOut]);

  async function onSignOut() {
    await signOut();
    navigation.reset({ index: 0, routes: [{ name: 'Signup' }] });
  }

  if (checking) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.body}>
        <Text style={styles.title}>You're in.</Text>
        <Text style={styles.subtitle}>
          Faith questionnaire, profile photos, and the daily stack land in upcoming
          releases. This blank profile confirms auth wiring works end-to-end.
        </Text>
        <Text style={styles.userId}>User: {userId ?? '(none)'}</Text>
      </View>
      <Pressable style={styles.signOut} onPress={onSignOut}>
        <Text style={styles.signOutText}>Sign out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 24,
    paddingTop: 80,
    justifyContent: 'space-between',
  },
  center: { alignItems: 'center', justifyContent: 'center' },
  body: {},
  title: { fontSize: 28, fontWeight: '700', color: '#1a1a1a' },
  subtitle: { marginTop: 12, color: '#555', lineHeight: 22 },
  userId: { marginTop: 24, color: '#888', fontFamily: 'Courier' },
  signOut: { padding: 16, alignItems: 'center', marginBottom: 24 },
  signOutText: { color: '#1a1a1a', fontWeight: '600' },
});
