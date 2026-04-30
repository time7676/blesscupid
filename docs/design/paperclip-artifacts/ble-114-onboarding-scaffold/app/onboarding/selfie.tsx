import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { tokens } from '../../lib/tokens';
import { useOnboardingActor } from './_layout';
import {
  CameraLivenessFrame,
  type LivenessError,
} from '../../components/onboarding/CameraLivenessFrame';
import { Toast } from '../../components/onboarding/Toast';
import { track } from '../../lib/analytics';
import { t } from '../../lib/i18n';

/** 06 Selfie liveness */
export default function SelfieScreen() {
  const router = useRouter();
  const actor = useOnboardingActor();
  const [toast, setToast] = useState<string | null>(null);

  const onError = (e: LivenessError) => {
    switch (e.kind) {
      case 'permission_denied':
        setToast(t('selfie.error.permission'));
        break;
      case 'low_light':
        setToast(t('selfie.error.lowlight'));
        break;
      case 'face_not_found':
        setToast(t('selfie.error.noface'));
        break;
      case 'budget_cap_exceeded':
        setToast(t('selfie.error.budget'));
        break;
      case 'vendor_failure':
        setToast('Coba lagi. Cahaya cukup, hadap kamera.');
        break;
    }
    track('onboarding_selfie_liveness_result', {
      verdict: 'retry',
      vendor: 'aws-rekognition',
    });
  };

  return (
    <View style={{ flex: 1 }}>
      {toast ? <Toast variant="critical" message={toast} /> : null}
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: tokens.space[7],
          paddingTop: tokens.space[6],
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
          {t('selfie.title')}
        </Text>
        <Text
          style={{
            fontFamily: tokens.font.body,
            fontSize: tokens.size.body.md,
            color: tokens.color.text.secondary,
          }}
        >
          {t('selfie.helper')}
        </Text>
        <CameraLivenessFrame
          onComplete={(verificationId) => {
            actor.send({ type: 'LIVENESS_OK', selfieLivenessId: verificationId });
            track('onboarding_selfie_liveness_result', {
              verdict: 'pass',
              vendor: 'aws-rekognition',
            });
            router.push('/onboarding/faith-profile');
          }}
          onError={onError}
        />
      </ScrollView>
    </View>
  );
}
