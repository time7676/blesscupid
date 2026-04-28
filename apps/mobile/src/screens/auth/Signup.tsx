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
import { checkAgeGate, MINIMUM_AGE } from '@blesscupid/shared';
import type { OnboardingStackParamList } from '../../navigation/types.js';
import { ApiError, signupEmail, signupOAuth } from '../../lib/api.js';
import { useAuth } from '../../lib/auth-store.js';
import {
  APPLE_AVAILABLE,
  OAuthCancelledError,
  signInWithApple,
  useGoogleSignIn,
} from '../../lib/oauth.js';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Signup'>;

export function SignupScreen({ navigation }: Props) {
  const setSession = useAuth((s) => s.setSession);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [dob, setDob] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const google = useGoogleSignIn();

  function precheck(): boolean {
    if (!accepted) {
      Alert.alert('Covenant', 'You must accept the Holy Code of Conduct to continue.');
      return false;
    }
    const gate = checkAgeGate(dob);
    if (!gate.ok) {
      Alert.alert('Age check', `You must be at least ${MINIMUM_AGE} to sign up.`);
      return false;
    }
    return true;
  }

  async function onSubmit() {
    if (!precheck()) return;
    setBusy(true);
    try {
      const tokens = await signupEmail({ email: email.trim(), password, dob });
      await setSession(tokens);
      navigation.reset({ index: 0, routes: [{ name: 'Profile' }] });
    } catch (err) {
      const code = err instanceof ApiError ? err.code : 'signup_failed';
      Alert.alert('Signup failed', code);
    } finally {
      setBusy(false);
    }
  }

  async function onOAuth(provider: 'apple' | 'google') {
    if (!precheck()) return;
    setBusy(true);
    try {
      const { idToken } =
        provider === 'apple' ? await signInWithApple() : await google.promptAsync();
      const tokens = await signupOAuth({ provider, idToken, dob });
      await setSession(tokens);
      navigation.reset({ index: 0, routes: [{ name: 'Profile' }] });
    } catch (err) {
      if (err instanceof OAuthCancelledError) return;
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
        <Text style={styles.title}>Create your account</Text>

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
          placeholder="Password (min 10 characters)"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <TextInput
          style={styles.input}
          placeholder="Date of birth (YYYY-MM-DD)"
          autoCapitalize="none"
          value={dob}
          onChangeText={setDob}
        />

        <Pressable style={styles.checkboxRow} onPress={() => setAccepted((v) => !v)}>
          <View style={[styles.checkbox, accepted && styles.checkboxOn]} />
          {/* PASTOR_COPY_REQUIRED: covenant acceptance copy pending Pastor review (BLE-7f). */}
          <Text style={styles.checkboxText}>
            I accept the BlessCupid Holy Code of Conduct.
          </Text>
        </Pressable>

        <Pressable
          style={[styles.primary, busy && styles.disabled]}
          disabled={busy}
          onPress={onSubmit}
        >
          <Text style={styles.primaryText}>{busy ? 'Creating…' : 'Create account'}</Text>
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

        <Pressable style={styles.linkRow} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.linkText}>Already have an account? Sign in</Text>
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
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 16, gap: 10 },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 1,
    borderColor: '#1a1a1a',
    borderRadius: 4,
  },
  checkboxOn: { backgroundColor: '#1a1a1a' },
  checkboxText: { flex: 1, color: '#1a1a1a' },
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
