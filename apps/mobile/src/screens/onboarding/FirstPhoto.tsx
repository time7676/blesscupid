import { useState } from 'react';
import { View, Text, Button, Image, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../../navigation/types.js';
import { copy } from '../../i18n/copy.js';
import { useAuth } from '../../lib/auth-store.js';
import {
  ApiError,
  finalizePhoto,
  putToS3,
  requestPhotoUpload,
  type PhotoContentType,
} from '../../lib/api.js';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'OnboardingFirstPhoto'>;

const REJECTION_KEYS = new Set([
  'no_face_detected',
  'face_too_small',
  'multiple_faces',
  'low_confidence',
]);

function pickContentType(uri: string): PhotoContentType {
  const ext = uri.split('.').pop()?.toLowerCase();
  if (ext === 'png') return 'image/png';
  if (ext === 'heic' || ext === 'heif') return 'image/heic';
  return 'image/jpeg';
}

function rejectionMessage(reasons: string[], unsafeLabels: string[]): string {
  if (unsafeLabels.length > 0) return copy.photo.rejection.unsafe;
  const first = reasons.find((r) => REJECTION_KEYS.has(r));
  if (first) {
    return copy.photo.rejection[first as keyof typeof copy.photo.rejection];
  }
  return copy.photo.rejection.unsafe;
}

export function OnboardingFirstPhotoScreen({ navigation }: Props) {
  const accessToken = useAuth((s) => s.accessToken);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pickAndUpload() {
    if (!accessToken) {
      setError('Not signed in.');
      return;
    }
    setError(null);

    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setError('Photo library permission is required.');
      return;
    }

    const pick = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.9,
      aspect: [1, 1],
    });
    if (pick.canceled || !pick.assets?.[0]) return;
    const asset = pick.assets[0];
    setPreviewUri(asset.uri);
    setBusy(true);

    try {
      const contentType = pickContentType(asset.uri);
      const upload = await requestPhotoUpload(accessToken, { position: 0, contentType });

      const blob = await (await fetch(asset.uri)).blob();
      await putToS3(upload.uploadUrl, blob, contentType);

      await finalizePhoto(accessToken, upload.photoId);
      navigation.navigate('OnboardingBio');
    } catch (err) {
      if (err instanceof ApiError && err.code === 'photo_rejected') {
        const reasons = (err.body?.reasons as string[] | undefined) ?? [];
        const unsafeLabels = (err.body?.unsafeLabels as string[] | undefined) ?? [];
        setError(rejectionMessage(reasons, unsafeLabels));
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Upload failed.');
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
      <Text style={{ fontSize: 22, fontWeight: '600', marginBottom: 12 }}>
        {copy.photo.requirements.title}
      </Text>
      <Text style={{ marginBottom: 24 }}>{copy.photo.requirements.body}</Text>
      {previewUri ? (
        <Image
          source={{ uri: previewUri }}
          style={{ width: 240, height: 240, alignSelf: 'center', marginBottom: 16, borderRadius: 8 }}
        />
      ) : null}
      {busy ? <ActivityIndicator style={{ marginBottom: 16 }} /> : null}
      {error ? (
        <Text style={{ color: '#b00020', marginBottom: 16 }}>{error}</Text>
      ) : null}
      <Button title="Choose photo" onPress={pickAndUpload} disabled={busy} />
      {__DEV__ && (
        <View style={{ marginTop: 12 }}>
          <Button
            title="Dev: skip photo"
            color="#92400e"
            onPress={() => navigation.navigate('OnboardingBio')}
          />
        </View>
      )}
    </View>
  );
}
