import { useCallback, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { tokens } from '../../lib/tokens';
import { requestUploadUrl, ApiError } from '../../lib/api';
import { track } from '../../lib/analytics';

export type UploadError =
  | { kind: 'too_large' }
  | { kind: 'unsupported_format' }
  | { kind: 'permission_denied' }
  | { kind: 'network' };

export type PhotoUploadDropzoneProps = {
  onUpload: (assetId: string) => void;
  onError: (err: UploadError) => void;
  maxBytes?: number;
  acceptedFormats?: string[];
  modestyHints?: string[];
};

const DEFAULT_MAX = 10 * 1024 * 1024;
const DEFAULT_FORMATS = ['image/jpeg', 'image/png', 'image/heic'];

export function PhotoUploadDropzone({
  onUpload,
  onError,
  maxBytes = DEFAULT_MAX,
  acceptedFormats = DEFAULT_FORMATS,
  modestyHints,
}: PhotoUploadDropzoneProps) {
  const [busy, setBusy] = useState(false);

  const pick = useCallback(
    async (source: 'gallery' | 'camera') => {
      try {
        const perm =
          source === 'gallery'
            ? await ImagePicker.requestMediaLibraryPermissionsAsync()
            : await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          onError({ kind: 'permission_denied' });
          return;
        }
        const r =
          source === 'gallery'
            ? await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 1,
                allowsEditing: false,
                base64: false,
              })
            : await ImagePicker.launchCameraAsync({
                quality: 1,
                allowsEditing: false,
                base64: false,
              });
        if (r.canceled) return;
        const asset = r.assets[0];
        const ext = asset.uri.split('.').pop()?.toLowerCase();
        const contentType =
          ext === 'heic'
            ? 'image/heic'
            : ext === 'png'
            ? 'image/png'
            : 'image/jpeg';
        if (!acceptedFormats.includes(contentType)) {
          onError({ kind: 'unsupported_format' });
          return;
        }
        if ((asset.fileSize ?? 0) > maxBytes) {
          onError({ kind: 'too_large' });
          return;
        }
        setBusy(true);
        const { uploadUrl, assetId } = await requestUploadUrl({
          kind: 'photo',
          contentType: contentType as 'image/jpeg' | 'image/png' | 'image/heic',
        });
        const blob = await fetch(asset.uri).then((res) => res.blob());
        const put = await fetch(uploadUrl, {
          method: 'PUT',
          headers: { 'content-type': contentType },
          body: blob,
        });
        if (!put.ok) throw new ApiError(put.status, '');
        track('onboarding_photo_uploaded', {
          formatHint: contentType,
          byteSize: asset.fileSize ?? 0,
        });
        onUpload(assetId);
      } catch (e) {
        onError({ kind: 'network' });
      } finally {
        setBusy(false);
      }
    },
    [acceptedFormats, maxBytes, onError, onUpload],
  );

  return (
    <View>
      <View
        style={{
          borderWidth: 1,
          borderStyle: 'dashed',
          borderColor: tokens.color.border.subtle,
          borderRadius: tokens.radius.lg,
          padding: tokens.space[8],
          alignItems: 'center',
          backgroundColor: tokens.color.bg.raised,
          gap: tokens.space[5],
        }}
      >
        <Text
          accessibilityRole="text"
          style={{
            fontFamily: tokens.font.body,
            fontSize: tokens.size.body.md,
            color: tokens.color.text.secondary,
            textAlign: 'center',
          }}
        >
          Foto wajah jelas, tanpa filter berat. Maks 10MB.
        </Text>
        {modestyHints?.length ? (
          <View>
            {modestyHints.map((h, i) => (
              <Text
                key={i}
                style={{
                  fontFamily: tokens.font.body,
                  fontSize: tokens.size.body.sm,
                  color: tokens.color.text.tertiary,
                  textAlign: 'center',
                }}
              >
                • {h}
              </Text>
            ))}
          </View>
        ) : null}
        <View style={{ flexDirection: 'row', gap: tokens.space[4] }}>
          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={() => pick('gallery')}
            style={{
              minHeight: 44,
              paddingHorizontal: tokens.space[6],
              paddingVertical: tokens.space[3],
              borderRadius: tokens.radius.pill,
              backgroundColor: tokens.color.text.brand,
              opacity: busy ? 0.5 : 1,
            }}
          >
            <Text
              style={{
                fontFamily: tokens.font.body,
                color: tokens.color.text.inverse,
                fontWeight: '600',
                fontSize: tokens.size.body.md,
              }}
            >
              Galeri
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={() => pick('camera')}
            style={{
              minHeight: 44,
              paddingHorizontal: tokens.space[6],
              paddingVertical: tokens.space[3],
              borderRadius: tokens.radius.pill,
              borderWidth: 1,
              borderColor: tokens.color.border.strong,
              opacity: busy ? 0.5 : 1,
            }}
          >
            <Text
              style={{
                fontFamily: tokens.font.body,
                color: tokens.color.text.primary,
                fontWeight: '600',
                fontSize: tokens.size.body.md,
              }}
            >
              Kamera
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
