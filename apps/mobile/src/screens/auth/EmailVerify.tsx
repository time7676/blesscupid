import { useEffect, useRef, useState } from 'react';
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

const OTP_LENGTH = 6;

export type EmailVerifyScreenProps = {
  email: string;
  onVerified: () => void;
  onCancel?: () => void;
};

export function EmailVerifyScreen({ email, onVerified, onCancel }: EmailVerifyScreenProps) {
  const insets = useSafeAreaInsets();
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(30);
  const refs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const code = digits.join('');
  const isComplete = code.length === OTP_LENGTH;

  function setDigitAt(i: number, ch: string) {
    const sanitized = ch.replace(/\D/g, '').slice(0, 1);
    setDigits((prev) => {
      const next = [...prev];
      next[i] = sanitized;
      return next;
    });
    if (sanitized && i < OTP_LENGTH - 1) {
      refs.current[i + 1]?.focus();
    }
  }

  async function submit() {
    if (!isComplete || busy) return;
    setBusy(true);
    setError(null);
    try {
      await apiFetch('/auth/email/verify', {
        method: 'POST',
        body: JSON.stringify({ email, code }),
      });
      onVerified();
    } catch (err) {
      setError(err instanceof ApiError ? err.code : 'verify_failed');
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    if (resendCooldown > 0) return;
    setError(null);
    try {
      await apiFetch('/auth/email/resend', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setResendCooldown(30);
    } catch {
      setError('resend_failed');
    }
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top + space.s5 }]}>
      {onCancel ? (
        <Pressable onPress={onCancel} style={styles.back} hitSlop={12} accessibilityLabel="Back">
          <Text style={styles.backLabel}>← Back</Text>
        </Pressable>
      ) : null}

      <View style={styles.body}>
        <Text style={styles.eyebrow}>Verify email</Text>
        <Text style={styles.title}>Check your inbox.</Text>
        <Text style={styles.lede}>
          We sent a 6-digit code to <Text style={styles.emailEm}>{email}</Text>.
        </Text>

        <View style={styles.otpRow}>
          {digits.map((d, i) => (
            <TextInput
              key={i}
              ref={(el) => {
                refs.current[i] = el;
              }}
              value={d}
              onChangeText={(ch) => setDigitAt(i, ch)}
              onKeyPress={(e) => {
                if (e.nativeEvent.key === 'Backspace' && !d && i > 0) {
                  refs.current[i - 1]?.focus();
                }
              }}
              keyboardType="number-pad"
              maxLength={1}
              style={[styles.otpBox, d && styles.otpBoxFilled]}
              accessibilityLabel={`Digit ${i + 1}`}
              autoFocus={i === 0}
            />
          ))}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          onPress={resend}
          disabled={resendCooldown > 0}
          style={styles.resend}
          accessibilityRole="button"
        >
          <Text style={[styles.resendLabel, resendCooldown > 0 && { opacity: 0.4 }]}>
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
          </Text>
        </Pressable>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + space.s4 }]}>
        <Pressable
          accessibilityRole="button"
          disabled={!isComplete || busy}
          onPress={submit}
          style={({ pressed }) => [
            styles.cta,
            (!isComplete || busy) && { opacity: 0.5 },
            pressed && { opacity: 0.85 },
          ]}
        >
          <Text style={styles.ctaLabel}>{busy ? 'Verifying…' : 'Verify'}</Text>
        </Pressable>
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
  emailEm: { color: color.ink.default, fontWeight: '600' },
  otpRow: { flexDirection: 'row', gap: space.s2, justifyContent: 'space-between' },
  otpBox: {
    width: 44,
    height: 56,
    borderWidth: 1,
    borderColor: color.hairline.default,
    borderRadius: radius.sm,
    backgroundColor: color.parchment.raised,
    textAlign: 'center',
    fontFamily: fontFamily.serifMedium,
    fontSize: 22,
    color: color.ink.default,
  },
  otpBoxFilled: {
    borderColor: color.cobalt[500],
    borderWidth: 1.5,
  },
  error: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.caption,
    color: color.warning[700],
    marginTop: space.s3,
  },
  resend: {
    marginTop: space.s5,
    alignSelf: 'center',
  },
  resendLabel: {
    fontFamily: fontFamily.sansMedium,
    fontSize: fontSize.label,
    color: color.ink.soft,
    borderBottomWidth: 1,
    borderBottomColor: color.gold.default,
    paddingBottom: 2,
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
