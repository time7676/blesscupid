import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../../navigation/types.js';
import {
  ApiError,
  getOnboardingState,
  loginEmail,
  signupOAuth,
} from '../../lib/api.js';
import { useAuth } from '../../lib/auth-store.js';
import {
  APPLE_AVAILABLE,
  OAuthCancelledError,
  signInWithApple,
  useGoogleSignIn,
} from '../../lib/oauth.js';
import { routeForNextStep } from '../../lib/onboarding-route.js';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const setSession = useAuth((s) => s.setSession);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const google = useGoogleSignIn();

  async function routeAfterAuth(accessToken: string) {
    try {
      const state = await getOnboardingState(accessToken);
      const target = routeForNextStep(state.nextStep);
      navigation.reset({ index: 0, routes: [{ name: target }] });
    } catch {
      navigation.reset({ index: 0, routes: [{ name: 'OnboardingCovenant' }] });
    }
  }

  async function onSubmit() {
    setBusy(true);
    try {
      const tokens = await loginEmail({ email: email.trim(), password });
      await setSession(tokens);
      await routeAfterAuth(tokens.accessToken);
    } catch (err) {
      const code = err instanceof ApiError ? err.code : 'login_failed';
      Alert.alert('Sign-in failed', code);
    } finally {
      setBusy(false);
    }
  }

  // Login via OAuth: server returns tokens for an existing oauth-linked
  // account. New OAuth users must use the Signup flow (covenant + DOB).
  async function onOAuth(provider: 'apple' | 'google') {
    setBusy(true);
    try {
      const { idToken } =
        provider === 'apple' ? await signInWithApple() : await google.promptAsync();
      const placeholderDob = new Date().toISOString().slice(0, 10);
      const tokens = await signupOAuth({ provider, idToken, dob: placeholderDob });
      await setSession(tokens);
      await routeAfterAuth(tokens.accessToken);
    } catch (err) {
      if (err instanceof OAuthCancelledError) return;
      if (err instanceof ApiError && err.code === 'age_gate_failed') {
        Alert.alert(
          'New account?',
          'No account is linked to that provider yet. Use Sign up to create one.',
        );
        return;
      }
      const code = err instanceof ApiError ? err.code : `${provider}_signin_failed`;
      Alert.alert('Sign-in failed', code);
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.fill}
    >
      <View style={styles.container}>
        <Text style={styles.brand}>BlessCupid</Text>
        <Text style={styles.title}>Welcome back</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <Pressable
          style={[styles.primary, busy && styles.disabled]}
          disabled={busy}
          onPress={onSubmit}
        >
          <Text style={styles.primaryText}>{busy ? 'Signing in…' : 'Sign in'}</Text>
        </Pressable>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        {APPLE_AVAILABLE && (
          <Pressable
            style={[styles.providerBtn, styles.appleBtn, busy && styles.disabled]}
            disabled={busy}
            onPress={() => onOAuth('apple')}
          >
            <Text style={styles.appleBtnText}>Continue with Apple</Text>
          </Pressable>
        )}
        <Pressable
          style={[styles.providerBtn, styles.googleBtn, (busy || !google.ready) && styles.disabled]}
          disabled={busy || !google.ready}
          onPress={() => onOAuth('google')}
        >
          <Text style={styles.googleBtnText}>Continue with Google</Text>
        </Pressable>

        <Pressable style={styles.linkRow} onPress={() => navigation.navigate('Signup')}>
          <Text style={styles.linkText}>New here? Create an account</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, padding: 24, paddingTop: 80 },
  brand: { fontSize: 28, fontWeight: '700', color: '#1a1a1a', marginBottom: 4 },
  title: { fontSize: 18, color: '#555', marginBottom: 24 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    fontSize: 16,
  },
  primary: {
    marginTop: 8,
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  disabled: { opacity: 0.5 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 16, gap: 8 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#e0e0e0' },
  dividerText: { color: '#888' },
  providerBtn: {
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  appleBtn: { backgroundColor: '#000' },
  appleBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  googleBtn: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#dadce0' },
  googleBtnText: { color: '#1f1f1f', fontWeight: '600', fontSize: 16 },
  linkRow: { padding: 16, alignItems: 'center' },
  linkText: { color: '#1a1a1a', fontWeight: '600' },
});
