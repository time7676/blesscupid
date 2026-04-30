import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { tokens } from '../../lib/tokens';
import { useOnboardingActor } from './_layout';
import { PhotoUploadDropzone, type UploadError } from '../../components/onboarding/PhotoUploadDropzone';
import { Toast } from '../../components/onboarding/Toast';
import { t } from '../../lib/i18n';

/** 05 Photo upload */
export default function PhotoScreen() {
  const router = useRouter();
  const actor = useOnboardingActor();
  const [toast, setToast] = useState<string | null>(null);

  const onError = (e: UploadError) => {
    switch (e.kind) {
      case 'too_large':
        setToast(t('photo.error.size'));
        break;
      case 'unsupported_format':
        setToast(t('photo.error.format'));
        break;
      case 'permission_denied':
        setToast('Izinkan akses foto untuk melanjutkan.');
        break;
      case 'network':
        setToast('Sambungan terputus. Coba lagi.');
        break;
    }
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
          {t('photo.title')}
        </Text>
        <Text
          style={{
            fontFamily: tokens.font.body,
            fontSize: tokens.size.body.md,
            color: tokens.color.text.secondary,
          }}
        >
          {t('photo.helper')}
        </Text>
        <PhotoUploadDropzone
          onUpload={(assetId) => {
            actor.send({ type: 'PHOTO_OK', photoUploadId: assetId });
            router.push('/onboarding/selfie');
          }}
          onError={onError}
          modestyHints={[
            'Wajah jelas, tidak terhalang.',
            'Tanpa foto badan saja.',
            'Tanpa filter berat.',
          ]}
        />
      </ScrollView>
    </View>
  );
}
