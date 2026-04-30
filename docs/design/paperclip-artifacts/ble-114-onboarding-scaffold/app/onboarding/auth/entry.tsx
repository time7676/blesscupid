import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { tokens } from '../../../lib/tokens';
import { useOnboardingActor } from '../_layout';
import { TabToggle } from '../../../components/onboarding/TabToggle';
import { PhoneInput } from '../../../components/onboarding/PhoneInput';
import { Toast } from '../../../components/onboarding/Toast';
import { isEmail, normalizePhoneId } from '../../../lib/validation';
import { requestOtp, ApiError } from '../../../lib/api';
import { track } from '../../../lib/analytics';
import { t } from '../../../lib/i18n';

/** 02a Auth entry */
export default function AuthEntryScreen() {
  const router = useRouter();
  const actor = useOnboardingActor();
  const [method, setMethod] = useState<'phone' | 'email'>('phone');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError(null);
    let identifier: string | null = null;
    if (method === 'phone') {
      identifier = normalizePhoneId(phone);
      if (!identifier) {
        setError(t('auth.phone.error.invalid'));
        return;
      }
    } else {
      if (!isEmail(email)) {
        setError(t('auth.email.error.invalid'));
        return;
      }
      identifier = email.trim().toLowerCase();
    }
    try {
      setBusy(true);
      await requestOtp({ method, identifier });
      actor.send({ type: 'AUTH_METHOD_SELECTED', method });
      actor.send({ type: 'KIRIM_KODE', identifier });
      track('onboarding_auth_method_selected', { method });
      router.push('/onboarding/auth/otp');
    } catch (e) {
      if (e instanceof ApiError && e.isRateLimited()) {
        setToast(t('otp.error.rate'));
      } else {
        setToast('Sambungan terputus. Coba lagi.');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {toast ? <Toast variant="warning" message={toast} /> : null}
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: tokens.space[7],
          paddingTop: tokens.space[7],
          paddingBottom: tokens.space[8],
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
          {t('auth.title')}
        </Text>
        <TabToggle
          options={[
            { value: 'phone', label: t('auth.tab.phone') },
            { value: 'email', label: t('auth.tab.email') },
          ]}
          value={method}
          onChange={setMethod}
        />
        {method === 'phone' ? (
          <PhoneInput
            value={phone}
            onChange={setPhone}
            error={error ?? undefined}
            autoFocus
            testID="auth.phone"
          />
        ) : (
          <View>
            <TextInput
              accessibilityLabel="Email"
              value={email}
              onChangeText={setEmail}
              placeholder={t('auth.email.placeholder')}
              placeholderTextColor={tokens.color.text.tertiary}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              autoFocus
              style={{
                minHeight: 56,
                paddingHorizontal: tokens.space[5],
                borderWidth: 1,
                borderColor: error
                  ? tokens.color.state.critical
                  : tokens.color.border.subtle,
                borderRadius: tokens.radius.md,
                backgroundColor: tokens.color.bg.surface,
                fontFamily: tokens.font.body,
                fontSize: tokens.size.body.lg,
                color: tokens.color.text.primary,
              }}
            />
            {error ? (
              <Text
                accessibilityLiveRegion="polite"
                style={{
                  marginTop: tokens.space[3],
                  fontFamily: tokens.font.body,
                  fontSize: tokens.size.body.sm,
                  color: tokens.color.state.critical,
                }}
              >
                {error}
              </Text>
            ) : null}
          </View>
        )}
        <Text
          style={{
            fontFamily: tokens.font.body,
            fontSize: tokens.size.body.sm,
            color: tokens.color.text.tertiary,
          }}
        >
          {t('auth.consent')}
        </Text>
        <Pressable
          accessibilityRole="button"
          disabled={busy}
          onPress={submit}
          style={{
            minHeight: 56,
            backgroundColor: tokens.color.text.brand,
            borderRadius: tokens.radius.pill,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: busy ? 0.5 : 1,
          }}
        >
          <Text
            style={{
              fontFamily: tokens.font.body,
              fontSize: tokens.size.heading.sm,
              fontWeight: '600',
              color: tokens.color.text.inverse,
            }}
          >
            {t('auth.cta.send')}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
