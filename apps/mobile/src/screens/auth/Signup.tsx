import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { checkAgeGate, MINIMUM_AGE } from '@blesscupid/shared';
import type { AuthStackParamList } from '../../navigation/types.js';
import { ApiError, signupEmail, signupOAuth } from '../../lib/api.js';
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
  radius,
  space,
} from '../../lib/design-system/index.js';
import { optOutAnalytics } from '../../lib/observability/analytics.js';

type Props = NativeStackScreenProps<AuthStackParamList, 'Signup'>;

export function SignupScreen({ navigation }: Props) {
  const setSession = useAuth((s) => s.setSession);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [dob, setDob] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // UU PDP Pasal 20 — explicit consent state, default false. Service
  // consent is required (gates the Create account button); analytics
  // consent is optional and can be withdrawn later in Settings.
  const [consentService, setConsentService] = useState(false);
  const [consentAnalytics, setConsentAnalytics] = useState(false);
  const google = useGoogleSignIn();

  function precheck(): boolean {
    const gate = checkAgeGate(dob);
    if (!gate.ok) {
      setError(`You must be at least ${MINIMUM_AGE} to sign up.`);
      return false;
    }
    if (!consentService) {
      setError('Please consent to the Privacy Policy and Terms to continue.');
      return false;
    }
    if (!consentAnalytics) {
      // Honor opt-out before any signup event fires.
      optOutAnalytics();
    }
    return true;
  }

  // Post-auth nav handled by the RootStack at App.tsx — see the same note
  // in Login.tsx. Don't reset here; doing so on the soon-to-unmount
  // AuthStack throws "route not registered" for onboarding route names.
  async function onSubmit() {
    setError(null);
    if (!precheck()) return;
    setBusy(true);
    try {
      const tokens = await signupEmail({ email: email.trim(), password, dob });
      await setSession(tokens);
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

        {/* UU PDP Pasal 20 ayat 2 — explicit consent. Must be unchecked
            by default, never inferred from continued use. The two
            consent toggles cover: (1) operational data processing
            required to make the app work, and (2) optional analytics. */}
        <Pressable
          onPress={() => setConsentService(!consentService)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: consentService }}
          style={styles.consentRow}
        >
          <View style={[styles.checkbox, consentService && styles.checkboxChecked]}>
            {consentService ? <Text style={styles.checkmark}>✓</Text> : null}
          </View>
          <Text style={styles.consentText}>
            I consent to the processing of my data to provide the BlessCupid service
            (matching, messaging, moderation), per the{' '}
            <Text
              style={styles.link}
              onPress={() => Linking.openURL('https://blesscupid.com/privacy')}
            >
              Privacy Policy
            </Text>
            {' '}and{' '}
            <Text
              style={styles.link}
              onPress={() => Linking.openURL('https://blesscupid.com/terms')}
            >
              Terms of Service
            </Text>
            . Required.
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setConsentAnalytics(!consentAnalytics)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: consentAnalytics }}
          style={styles.consentRow}
        >
          <View style={[styles.checkbox, consentAnalytics && styles.checkboxChecked]}>
            {consentAnalytics ? <Text style={styles.checkmark}>✓</Text> : null}
          </View>
          <Text style={styles.consentText}>
            I consent to product analytics to help BlessCupid improve. You can
            withdraw this consent any time in Settings → Privacy. Optional.
          </Text>
        </Pressable>

        <Button
          variant="primary"
          full
          label={busy ? 'Creating…' : 'Create account'}
          disabled={busy}
          onPress={onSubmit}
        />

        {/* OAuth gated behind EXPO_PUBLIC_OAUTH_ENABLED. v1 launches with
            email-only signup to keep the surface area small + skip Apple/
            Google review surprises. Re-enable for v1.1 by setting the env
            var to "1" in apps/mobile/.env. */}
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
                // Dev shortcut: set a fake session so RootStack swaps from
                // AuthStack → OnboardingStack. The OnboardingStack mounts
                // at its first declared screen; no manual reset needed.
                await setSession({
                  userId: 'dev-test-user',
                  accessToken: 'dev-test-access-token',
                  refreshToken: 'dev-test-refresh-token',
                  expiresIn: 3600,
                } as Parameters<typeof setSession>[0]);
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
  // UU PDP consent UI
  consentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.s3,
    marginBottom: space.s3,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: color.hairline.strong,
    backgroundColor: color.parchment.raised,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: color.cobalt[500],
    borderColor: color.cobalt[500],
  },
  checkmark: {
    color: color.parchment.default,
    fontSize: 14,
    fontFamily: fontFamily.sansSemibold,
    lineHeight: 16,
  },
  consentText: {
    flex: 1,
    fontFamily: fontFamily.sans,
    fontSize: fontSize.caption,
    color: color.ink.soft,
    lineHeight: 18,
  },
  link: {
    color: color.cobalt[500],
    textDecorationLine: 'underline',
  },
});
