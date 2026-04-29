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
import { checkAgeGate, MINIMUM_AGE } from '@blesscupid/shared';
import type { OnboardingStackParamList } from '../../navigation/types.js';
import {
  ApiError,
  getOnboardingState,
  signupEmail,
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
import {
  Button,
  FormInput,
  ScreenHeader,
  color,
  fontFamily,
  fontSize,
  space,
} from '../../lib/design-system/index.js';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Signup'>;

export function SignupScreen({ navigation }: Props) {
  const setSession = useAuth((s) => s.setSession);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [dob, setDob] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const google = useGoogleSignIn();

  function precheck(): boolean {
    const gate = checkAgeGate(dob);
    if (!gate.ok) {
      setError(`You must be at least ${MINIMUM_AGE} to sign up.`);
      return false;
    }
    return true;
  }

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
    setError(null);
    if (!precheck()) return;
    setBusy(true);
    try {
      const tokens = await signupEmail({ email: email.trim(), password, dob });
      await setSession(tokens);
      await routeAfterAuth(tokens.accessToken);
    } catch (err) {
      const code = err instanceof ApiError ? err.code : 'signup_failed';
      setError(code);
    } finally {
      setBusy(false);
    }
  }

  async function onOAuth(provider: 'apple' | 'google') {
    setError(null);
    if (!precheck()) return;
    setBusy(true);
    try {
      const { idToken } =
        provider === 'apple' ? await signInWithApple() : await google.promptAsync();
      const tokens = await signupOAuth({ provider, idToken, dob });
      await setSession(tokens);
      await routeAfterAuth(tokens.accessToken);
    } catch (err) {
      if (err instanceof OAuthCancelledError) return;
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
      <ScreenHeader eyebrow="Authentication" title="Create your account" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
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
          placeholder="At least 10 characters"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <View style={styles.gap} />
        <FormInput
          label="Date of birth"
          placeholder="YYYY-MM-DD"
          autoCapitalize="none"
          value={dob}
          onChangeText={setDob}
        />

        <Text style={styles.hint}>
          On the next screen you'll review and accept the BlessCupid Holy Code of Conduct.
        </Text>

        <Button
          variant="primary"
          label={busy ? 'Creating…' : 'Create account'}
          disabled={busy}
          onPress={onSubmit}
        />

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        {APPLE_AVAILABLE && (
          <Button
            variant="secondary"
            label="Continue with Apple"
            disabled={busy}
            onPress={() => onOAuth('apple')}
          />
        )}
        <View style={styles.gap} />
        <Button
          variant="secondary"
          label="Continue with Google"
          disabled={busy || !google.ready}
          onPress={() => onOAuth('google')}
        />

        <Pressable style={styles.linkRow} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.linkText}>Already have an account? Sign in</Text>
        </Pressable>

        {__DEV__ && (
          <Pressable
            style={styles.devSkipBtn}
            disabled={busy}
            onPress={async () => {
              setBusy(true);
              try {
                await setSession({
                  userId: 'dev-test-user',
                  accessToken: 'dev-test-access-token',
                  refreshToken: 'dev-test-refresh-token',
                  expiresIn: 3600,
                } as Parameters<typeof setSession>[0]);
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'OnboardingCovenant' }],
                });
              } finally {
                setBusy(false);
              }
            }}
          >
            <Text style={styles.devSkipText}>Dev: skip login</Text>
          </Pressable>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: color.parchment.default },
  scroll: { padding: 24, paddingBottom: 48 },
  gap: { height: space.s3 },
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
  hint: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.label,
    color: color.ink.soft,
    marginVertical: space.s3,
    lineHeight: 18,
  },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: space.s3, gap: 8 },
  dividerLine: { flex: 1, height: 1, backgroundColor: color.hairline.default },
  dividerText: { fontFamily: fontFamily.sans, fontSize: fontSize.caption, color: color.ink.soft },
  linkRow: { padding: space.s3, alignItems: 'center' },
  linkText: { fontFamily: fontFamily.sansMedium, fontSize: fontSize.body, color: color.ink.default },
  devSkipBtn: {
    marginTop: space.s3,
    padding: space.s3,
    borderRadius: 10,
    backgroundColor: color.gold.default,
    alignItems: 'center',
  },
  devSkipText: { fontFamily: fontFamily.sansMedium, fontSize: fontSize.body, color: color.ink.default },
});
