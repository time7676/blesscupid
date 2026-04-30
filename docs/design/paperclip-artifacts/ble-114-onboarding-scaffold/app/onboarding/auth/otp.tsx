import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
// import RNOtpVerify from 'react-native-otp-verify';
// — wired post-prebuild. See vendor-poc/otp-autofill.md.
import { tokens } from '../../../lib/tokens';
import { useOnboardingActor } from '../_layout';
import { OTPInput } from '../../../components/onboarding/OTPInput';
import { Toast } from '../../../components/onboarding/Toast';
import { isOtpComplete } from '../../../lib/validation';
import { ApiError, requestOtp, verifyOtp, setSessionToken } from '../../../lib/api';
import { track } from '../../../lib/analytics';
import { t } from '../../../lib/i18n';

const COOLDOWN_S = 60;

/** 02b OTP verify */
export default function AuthOtpScreen() {
  const router = useRouter();
  const actor = useOnboardingActor();
  const ctx = actor.getSnapshot().context;
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(COOLDOWN_S);
  const [attempts, setAttempts] = useState(1);
  const otpTokenRef = useRef<string | null>(null);

  useEffect(() => {
    const id = setInterval(() => {
      setCooldown((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [attempts]);

  // Android SMS Retriever wiring (commented until prebuild lands)
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    // RNOtpVerify.getOtp().then(() =>
    //   RNOtpVerify.addListener((message) => {
    //     const m = message?.match(/(\d{6})/);
    //     if (m) setCode(m[1]);
    //   }),
    // );
    // return () => RNOtpVerify.removeListener();
  }, []);

  const verify = async (next: string) => {
    setError(null);
    if (!isOtpComplete(next)) return;
    if (!otpTokenRef.current) {
      // first attempt — token from initial request lives in api session;
      // for simplicity scaffold re-requests if missing. Real impl threads
      // otpToken from the entry screen via context or query param.
      try {
        const r = await requestOtp({
          method: ctx.authMethod ?? 'phone',
          identifier: ctx.authIdentifier ?? '',
        });
        otpTokenRef.current = r.otpToken;
      } catch {
        setError(t('otp.error.wrong'));
        return;
      }
    }
    try {
      const r = await verifyOtp({
        otpToken: otpTokenRef.current!,
        code: next,
      });
      setSessionToken(r.sessionToken);
      actor.send({ type: 'OTP_VERIFIED' });
      router.replace('/onboarding/modes');
    } catch (e) {
      setError(t('otp.error.wrong'));
      setCode('');
    }
  };

  const resend = async () => {
    if (cooldown > 0) return;
    try {
      await requestOtp({
        method: ctx.authMethod ?? 'phone',
        identifier: ctx.authIdentifier ?? '',
      });
      setAttempts((n) => n + 1);
      setCooldown(COOLDOWN_S);
      track('onboarding_otp_resent', { attemptCount: attempts + 1 });
    } catch (e) {
      if (e instanceof ApiError && e.isRateLimited()) {
        setToast(t('otp.error.rate'));
      }
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {toast ? <Toast variant="warning" message={toast} /> : null}
      <View
        style={{
          flex: 1,
          paddingHorizontal: tokens.space[7],
          paddingTop: tokens.space[7],
          gap: tokens.space[6],
        }}
      >
        <Text
          accessibilityRole="header"
          style={{
            fontFamily: tokens.font.display,
            fontSize: tokens.size.display.lg,
            lineHeight: tokens.lineHeight.display.lg,
            color: tokens.color.text.primary,
          }}
        >
          {t('otp.title')}
        </Text>
        <Text
          style={{
            fontFamily: tokens.font.body,
            fontSize: tokens.size.body.md,
            color: tokens.color.text.secondary,
          }}
        >
          {t('otp.helper', ctx.authIdentifier ?? '')}
        </Text>
        <OTPInput
          value={code}
          onChange={setCode}
          onComplete={verify}
          error={error ?? undefined}
          autoFocus
        />
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: cooldown > 0 }}
          onPress={resend}
          style={{
            alignSelf: 'center',
            minHeight: 44,
            paddingHorizontal: tokens.space[5],
            justifyContent: 'center',
          }}
        >
          <Text
            style={{
              fontFamily: tokens.font.body,
              fontSize: tokens.size.body.md,
              color:
                cooldown > 0
                  ? tokens.color.text.tertiary
                  : tokens.color.text.brand,
              fontWeight: '600',
            }}
          >
            {cooldown > 0 ? t('otp.resend.cooldown', cooldown) : t('otp.resend')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
