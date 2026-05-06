import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  color,
  fontFamily,
  fontSize,
  letterSpacingFor,
  radius,
  space,
  tracking,
} from '../../lib/design-system/index.js';
import { apiFetch, ApiError } from '../../lib/api.js';

export type ForgotPasswordScreenProps = {
  onBack: () => void;
  onDone: () => void;
};

export function ForgotPasswordScreen({ onBack, onDone }: ForgotPasswordScreenProps) {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!email.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      await apiFetch('/auth/password-reset/request', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim() }),
      });
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.code : 'request_failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top + space.s5 }]}>
      <Pressable onPress={onBack} style={styles.back} hitSlop={12} accessibilityLabel="Back">
        <Text style={styles.backLabel}>← Back</Text>
      </Pressable>

      <View style={styles.body}>
        <Text style={styles.eyebrow}>Reset password</Text>
        <Text style={styles.title}>We'll send you a link.</Text>
        <Text style={styles.lede}>
          Enter the email tied to your account. We'll email you a single-use reset link.
        </Text>

        {sent ? (
          <View style={styles.sentCard}>
            <Text style={styles.sentTitle}>Check your inbox.</Text>
            <Text style={styles.sentBody}>
              If {email} is registered with us, you'll have a reset link within a minute.
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.label}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
              placeholderTextColor={color.ink.soft}
              accessibilityLabel="Email"
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </>
        )}
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + space.s4 }]}>
        {sent ? (
          <Pressable
            accessibilityRole="button"
            onPress={onDone}
            style={({ pressed }) => [styles.cta, pressed && { opacity: 0.85 }]}
          >
            <Text style={styles.ctaLabel}>Back to sign in</Text>
          </Pressable>
        ) : (
          <Pressable
            accessibilityRole="button"
            disabled={!email.trim() || busy}
            onPress={submit}
            style={({ pressed }) => [
              styles.cta,
              (!email.trim() || busy) && { opacity: 0.5 },
              pressed && { opacity: 0.85 },
            ]}
          >
            <Text style={styles.ctaLabel}>{busy ? 'Sending…' : 'Send reset email'}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.parchment.default, paddingHorizontal: space.s6 } as ViewStyle,
  back: { paddingVertical: space.s2 },
  backLabel: { fontFamily: fontFamily.sansMedium, fontSize: fontSize.label, color: color.ink.soft },
  body: { flex: 1, paddingTop: space.s6 },
  eyebrow: {
    fontFamily: fontFamily.sansSemibold,
    fontSize: 11,
    letterSpacing: letterSpacingFor(tracking.eyebrow, 11),
    textTransform: 'uppercase',
    color: color.cobalt[700],
    marginBottom: space.s2,
  },
  title: {
    fontFamily: fontFamily.serif,
    fontSize: fontSize.h2,
    letterSpacing: letterSpacingFor(tracking.tight, fontSize.h2),
    color: color.ink.default,
    marginBottom: space.s3,
  },
  lede: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.bodyLg,
    lineHeight: 24,
    color: color.ink.soft,
    marginBottom: space.s7,
  },
  label: {
    fontFamily: fontFamily.sansMedium,
    fontSize: fontSize.label,
    color: color.ink.default,
    letterSpacing: 0.4,
    marginBottom: space.s2,
  },
  input: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.bodyLg,
    color: color.ink.default,
    borderWidth: 1,
    borderColor: color.hairline.default,
    borderRadius: radius.sm,
    paddingHorizontal: space.s4,
    paddingVertical: space.s3,
    backgroundColor: color.parchment.raised,
    minHeight: 48,
  },
  error: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.caption,
    color: color.warning[700],
    marginTop: space.s2,
  },
  sentCard: {
    backgroundColor: color.success[100] ?? color.sandstone.warm,
    borderRadius: radius.lg,
    padding: space.s5,
  },
  sentTitle: {
    fontFamily: fontFamily.serifMedium,
    fontSize: fontSize.h3,
    color: color.ink.default,
    marginBottom: space.s2,
  },
  sentBody: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.body,
    color: color.ink.soft,
    lineHeight: 22,
  },
  footer: { paddingTop: space.s4 },
  cta: {
    backgroundColor: color.cobalt[500],
    borderRadius: radius.lg,
    paddingVertical: space.s4,
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
  },
  ctaLabel: {
    fontFamily: fontFamily.sansSemibold,
    fontSize: 15,
    color: color.parchment.raised,
    letterSpacing: 0.4,
  },
});
