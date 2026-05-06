import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/types.js';
import { ApiError, loginEmail, signupOAuth } from '../../lib/api.js';
import { useAuth } from '../../lib/auth-store.js';
import {
  APPLE_AVAILABLE,
  OAuthCancelledError,
  signInWithApple,
  useGoogleSignIn,
} from '../../lib/oauth.js';
import {
  Button,
  FormInput,
  ScreenHeader,
  color,
  fontFamily,
  fontSize,
  space,
} from '../../lib/design-system/index.js';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const setSession = useAuth((s) => s.setSession);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const google = useGoogleSignIn();

  // Post-auth navigation is handled by the RootStack at App.tsx — once
  // setSession() flips userId to non-null, the navigator swaps from
  // AuthStack to OnboardingStack and mounts the right entry screen. We
  // deliberately don't call navigation.reset here; doing so on the soon-
  // to-unmount AuthStack throws "route not registered" for onboarding
  // route names.
  async function onSubmit() {
    setBusy(true);
    setError(null);
    try {
      const tokens = await loginEmail({ email: email.trim(), password });
      await setSession(tokens);
    } catch (err) {
      const code = err instanceof ApiError ? err.code : 'login_failed';
      setError(code);
    } finally {
      setBusy(false);
    }
  }

  // Login via OAuth: server returns tokens for an existing oauth-linked
  // account. New OAuth users must use the Signup flow (covenant + DOB).
  async function onOAuth(provider: 'apple' | 'google') {
    setBusy(true);
    setError(null);
    try {
      const { idToken } =
        provider === 'apple' ? await signInWithApple() : await google.promptAsync();
      const placeholderDob = new Date().toISOString().slice(0, 10);
      const tokens = await signupOAuth({ provider, idToken, dob: placeholderDob });
      await setSession(tokens);
    } catch (err) {
      if (err instanceof OAuthCancelledError) return;
      if (err instanceof ApiError && err.code === 'age_gate_failed') {
        setError('No account linked to that provider. Use Sign up to create one.');
        return;
      }
      const code = err instanceof ApiError ? err.code : `${provider}_signin_failed`;
      setError(code);
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.fill}
    >
      <ScreenHeader eyebrow="Authentication" title="Welcome back" onBack={() => navigation.goBack()} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {error && (
          <View style={styles.errorPill}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <FormInput
          label="Email"
          placeholder="your@email.com"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <View style={styles.gap} />
        <FormInput
          label="Password"
          placeholder="••••••••"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <View style={styles.gap} />
        <Button
          variant="primary"
          full
          label={busy ? 'Signing in…' : 'Sign in'}
          disabled={busy}
          onPress={onSubmit}
        />

        {/* OAuth gated behind EXPO_PUBLIC_OAUTH_ENABLED. See Signup.tsx
            for rationale. v1 = email only. */}
        {process.env.EXPO_PUBLIC_OAUTH_ENABLED === '1' ? (
          <>
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {APPLE_AVAILABLE && (
              <Button
                variant="secondary"
                full
                label="Continue with Apple"
                disabled={busy}
                onPress={() => onOAuth('apple')}
              />
            )}
            <View style={styles.gap} />
            <Button
              variant="secondary"
              full
              label="Continue with Google"
              disabled={busy || !google.ready}
              onPress={() => onOAuth('google')}
            />
          </>
        ) : null}

        <Pressable style={styles.linkRow} onPress={() => navigation.navigate('Signup')}>
          <Text style={styles.linkText}>New here? Create an account</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: color.parchment.default },
  scroll: { padding: 24, paddingBottom: 48 },
  errorPill: {
    backgroundColor: color.warning[100],
    padding: space.s3,
    borderRadius: 8,
    marginBottom: space.s3,
  },
  errorText: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.caption,
    color: color.warning[700],
  },
  gap: { height: space.s3 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: space.s3, gap: 8 },
  dividerLine: { flex: 1, height: 1, backgroundColor: color.hairline.default },
  dividerText: { fontFamily: fontFamily.sans, fontSize: fontSize.caption, color: color.ink.soft },
  linkRow: { padding: space.s3, alignItems: 'center' },
  linkText: { fontFamily: fontFamily.sansMedium, fontSize: fontSize.body, color: color.ink.default },
});
