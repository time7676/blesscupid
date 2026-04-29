import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  border,
  color,
  fontFamily,
  fontSize,
  radius,
  space,
} from '../tokens.js';
import {
  ApiError,
  putToS3,
  requestPhotoUpload,
  type PhotoContentType,
} from '../../api.js';
import { track } from '../../observability/analytics.js';

export type UploadError =
  | { kind: 'too_large' }
  | { kind: 'unsupported_format' }
  | { kind: 'permission_denied' }
  | { kind: 'network' };

export type PhotoUploadDropzoneProps = {
  token: string;
  position: number;
  onUpload: (photoId: string) => void;
  onError: (err: UploadError) => void;
  maxBytes?: number;
  acceptedFormats?: PhotoContentType[];
  modestyHints?: string[];
};

const DEFAULT_MAX = 10 * 1024 * 1024;
const DEFAULT_FORMATS: PhotoContentType[] = ['image/jpeg', 'image/png', 'image/heic'];

function pickContentType(uri: string): PhotoContentType {
  const ext = uri.split('.').pop()?.toLowerCase();
  if (ext === 'png') return 'image/png';
  if (ext === 'heic' || ext === 'heif') return 'image/heic';
  return 'image/jpeg';
}

export function PhotoUploadDropzone({
  token,
  position,
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
        if (!asset) return;
        const contentType = pickContentType(asset.uri);
        if (!acceptedFormats.includes(contentType)) {
          onError({ kind: 'unsupported_format' });
          return;
        }
        if ((asset.fileSize ?? 0) > maxBytes) {
          onError({ kind: 'too_large' });
          return;
        }
        setBusy(true);
        const upload = await requestPhotoUpload(token, { position, contentType });
        const blob = await fetch(asset.uri).then((res) => res.blob());
        await putToS3(upload.uploadUrl, blob, contentType);
        track('onboarding_photo_uploaded', {
          formatHint: contentType,
          byteSize: asset.fileSize ?? 0,
          position,
        });
        onUpload(upload.photoId);
      } catch (err) {
        if (err instanceof ApiError) {
          onError({ kind: 'network' });
          return;
        }
        onError({ kind: 'network' });
      } finally {
        setBusy(false);
      }
    },
    [acceptedFormats, maxBytes, onError, onUpload, position, token],
  );

  return (
    <View>
      <View style={styles.dropzone}>
        <Text accessibilityRole="text" style={styles.lede}>
          Foto wajah jelas, tanpa filter berat. Maks 10MB.
        </Text>
        {modestyHints?.length ? (
          <View>
            {modestyHints.map((h, i) => (
              <Text key={i} style={styles.hint}>
                • {h}
              </Text>
            ))}
          </View>
        ) : null}
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={() => pick('gallery')}
            style={[styles.primary, busy ? styles.disabled : null]}
          >
            <Text style={styles.primaryLabel}>Galeri</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={() => pick('camera')}
            style={[styles.secondary, busy ? styles.disabled : null]}
          >
            <Text style={styles.secondaryLabel}>Kamera</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dropzone: {
    borderWidth: border.thin,
    borderStyle: 'dashed',
    borderColor: color.hairline.default,
    borderRadius: radius.lg,
    padding: space.s7,
    alignItems: 'center',
    backgroundColor: color.sandstone.default,
    gap: space.s4,
  },
  lede: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.body,
    color: color.ink.soft,
    textAlign: 'center',
  },
  hint: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.caption,
    color: color.ink.soft,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: space.s3,
  },
  primary: {
    minHeight: 44,
    paddingHorizontal: space.s5,
    paddingVertical: space.s2,
    borderRadius: radius.pill,
    // v1.1 — buttons are ink, never blue
    backgroundColor: color.ink.default,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryLabel: {
    fontFamily: fontFamily.sansSemibold,
    fontSize: fontSize.body,
    color: color.parchment.default,
  },
  secondary: {
    minHeight: 44,
    paddingHorizontal: space.s5,
    paddingVertical: space.s2,
    borderRadius: radius.pill,
    borderWidth: border.thin,
    borderColor: color.hairline.strong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryLabel: {
    fontFamily: fontFamily.sansSemibold,
    fontSize: fontSize.body,
    color: color.ink.default,
  },
  disabled: {
    opacity: 0.5,
  },
});
