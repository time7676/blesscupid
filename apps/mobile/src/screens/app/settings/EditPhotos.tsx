import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import Svg, { Path } from 'react-native-svg';
import {
  color,
  fontFamily,
  fontSize,
  letterSpacingFor,
  radius,
  space,
  tracking,
} from '../../../lib/design-system/index.js';
import { SettingsLayout } from './SettingsLayout.js';
import { useAuth } from '../../../lib/auth-store.js';
import {
  ApiError,
  deleteMyPhoto,
  finalizePhoto,
  getMyPhotos,
  putToS3,
  requestPhotoUpload,
  type MyPhoto,
  type PhotoContentType,
} from '../../../lib/api.js';

const MAX_SLOTS = 8;
// AsyncStorage stores ONLY the client-only overlay (which photoId is primary,
// which photoIds are highlighted). Photos themselves come from the server.
const OVERLAY_STORAGE_KEY = 'edit-photos-overlay-v2';

type Slot = {
  photoId: string;
  /** Pre-signed GET URL for rendering. */
  remoteUrl: string;
  /** Local URI shown immediately during upload, before remote URL is ready. */
  localUri?: string;
  status: 'approved' | 'processing' | 'uploaded' | 'pending_upload' | 'rejected';
};

type Overlay = {
  primaryPhotoId: string | null;
  highlightedPhotoIds: string[];
};

const EMPTY_OVERLAY: Overlay = { primaryPhotoId: null, highlightedPhotoIds: [] };

function StarIcon({ filled = false, size = 16 }: { filled?: boolean; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color.gold.default : 'none'}>
      <Path
        d="M12 3l2.5 6 6.5.5-5 4.5 1.5 6.5L12 17l-5.5 3.5L8 14 3 9.5 9.5 9z"
        stroke={color.gold.default}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function mimeFromUri(uri: string): PhotoContentType {
  const lower = uri.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.heic') || lower.endsWith('.heif')) return 'image/heic';
  return 'image/jpeg';
}

function slotsFromPhotos(photos: MyPhoto[]): (Slot | null)[] {
  const slots: (Slot | null)[] = Array(MAX_SLOTS).fill(null);
  // Order by `position` first, then collapse holes left-to-right.
  const sorted = [...photos].sort((a, b) =>
    a.position - b.position || a.createdAt.localeCompare(b.createdAt),
  );
  for (let i = 0; i < Math.min(MAX_SLOTS, sorted.length); i++) {
    const p = sorted[i]!;
    slots[i] = {
      photoId: p.photoId,
      remoteUrl: p.url,
      status: p.status,
    };
  }
  return slots;
}

export type EditPhotosScreenProps = {
  onBack: () => void;
};

export function EditPhotosScreen({ onBack }: EditPhotosScreenProps) {
  const accessToken = useAuth((s) => s.accessToken);

  const [slots, setSlots] = useState<(Slot | null)[]>(Array(MAX_SLOTS).fill(null));
  const [overlay, setOverlay] = useState<Overlay>(EMPTY_OVERLAY);
  const [loading, setLoading] = useState(true);
  const [busySlot, setBusySlot] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Hydrate from server + local overlay on mount.
  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!accessToken) {
        setLoading(false);
        return;
      }
      try {
        const [photosRes, overlayRaw] = await Promise.all([
          getMyPhotos(accessToken),
          AsyncStorage.getItem(OVERLAY_STORAGE_KEY),
        ]);
        if (cancelled) return;
        setSlots(slotsFromPhotos(photosRes.items));
        if (overlayRaw) {
          try {
            setOverlay(JSON.parse(overlayRaw) as Overlay);
          } catch {
            setOverlay(EMPTY_OVERLAY);
          }
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof ApiError ? e.code : 'photos_load_failed');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  function persistOverlay(next: Overlay) {
    setOverlay(next);
    void AsyncStorage.setItem(OVERLAY_STORAGE_KEY, JSON.stringify(next));
  }

  async function pickPhoto(slotIndex: number) {
    if (!accessToken) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== 'granted') {
      Alert.alert('Library access needed', 'Allow photo library access in Settings to add photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.9,
    });
    if (result.canceled || result.assets.length === 0) return;
    const uri = result.assets[0]!.uri;
    const contentType = mimeFromUri(uri);

    // Optimistic UI: show local URI immediately while upload runs.
    const optimistic: Slot = {
      photoId: `pending-${Date.now()}`,
      remoteUrl: '',
      localUri: uri,
      status: 'pending_upload',
    };
    setSlots((prev) => {
      const next = [...prev];
      next[slotIndex] = optimistic;
      return next;
    });
    setBusySlot(slotIndex);
    setError(null);

    try {
      // 1) Request presigned URL.
      const presign = await requestPhotoUpload(accessToken, {
        position: slotIndex,
        contentType,
      });

      // 2) PUT bytes to R2.
      const blob = await (await fetch(uri)).blob();
      await putToS3(presign.uploadUrl, blob, contentType);

      // 3) Finalize → moderation pass.
      const finalized = await finalizePhoto(accessToken, presign.photoId);

      // 4) Refetch photos so we get the canonical signed URL + status.
      const photosRes = await getMyPhotos(accessToken);
      const realSlot = photosRes.items.find((p) => p.photoId === presign.photoId);
      setSlots((prev) => {
        const next = [...prev];
        next[slotIndex] = realSlot
          ? {
              photoId: realSlot.photoId,
              remoteUrl: realSlot.url,
              status: realSlot.status,
            }
          : {
              photoId: presign.photoId,
              remoteUrl: '',
              localUri: uri,
              status: finalized.status === 'approved' ? 'approved' : 'processing',
            };
        return next;
      });
    } catch (e) {
      // Revert optimistic slot on failure.
      setSlots((prev) => {
        const next = [...prev];
        next[slotIndex] = null;
        return next;
      });
      if (e instanceof ApiError && e.code === 'photo_rejected') {
        const reasons = (e.body as { reasons?: string[]; unsafeLabels?: string[] })?.reasons ?? [];
        const labels = (e.body as { unsafeLabels?: string[] })?.unsafeLabels ?? [];
        const detail =
          labels.length > 0
            ? labels.join(', ')
            : reasons.length > 0
              ? reasons.join(', ')
              : 'No clear face detected.';
        Alert.alert('Photo not accepted', detail);
        setError('photo_rejected');
      } else if (e instanceof ApiError) {
        Alert.alert('Upload failed', e.code);
        setError(e.code);
      } else {
        Alert.alert('Upload failed', 'Check your connection and try again.');
        setError('upload_failed');
      }
    } finally {
      setBusySlot(null);
    }
  }

  async function removePhoto(slotIndex: number) {
    if (!accessToken) return;
    const slot = slots[slotIndex];
    if (!slot) return;
    setBusySlot(slotIndex);
    setError(null);
    try {
      // Skip server delete for ad-hoc pending uploads (no real photoId).
      if (!slot.photoId.startsWith('pending-')) {
        await deleteMyPhoto(accessToken, slot.photoId);
      }
      setSlots((prev) => {
        const next = [...prev];
        next[slotIndex] = null;
        return next;
      });
      // Cleanup overlay state for the removed photoId.
      const nextOverlay: Overlay = {
        primaryPhotoId: overlay.primaryPhotoId === slot.photoId ? null : overlay.primaryPhotoId,
        highlightedPhotoIds: overlay.highlightedPhotoIds.filter((id) => id !== slot.photoId),
      };
      if (nextOverlay !== overlay) persistOverlay(nextOverlay);
    } catch (e) {
      Alert.alert('Could not remove photo', e instanceof ApiError ? e.code : 'try again');
    } finally {
      setBusySlot(null);
    }
  }

  function setPrimary(slotIndex: number) {
    const slot = slots[slotIndex];
    if (!slot) return;
    persistOverlay({ ...overlay, primaryPhotoId: slot.photoId });
  }

  function toggleHighlight(slotIndex: number) {
    const slot = slots[slotIndex];
    if (!slot) return;
    const has = overlay.highlightedPhotoIds.includes(slot.photoId);
    const next = has
      ? overlay.highlightedPhotoIds.filter((id) => id !== slot.photoId)
      : [...overlay.highlightedPhotoIds, slot.photoId].slice(0, 2);
    persistOverlay({ ...overlay, highlightedPhotoIds: next });
  }

  function showSlotMenu(slotIndex: number) {
    const slot = slots[slotIndex];
    if (!slot) return;
    const isPrimary = overlay.primaryPhotoId === slot.photoId;
    const isHighlighted = overlay.highlightedPhotoIds.includes(slot.photoId);
    Alert.alert(
      `Slot ${slotIndex + 1}`,
      slot.status === 'rejected'
        ? 'This photo was not approved. Remove and try another.'
        : undefined,
      [
        {
          text: isPrimary ? 'Already primary' : 'Set as primary',
          onPress: () => {
            if (!isPrimary) setPrimary(slotIndex);
          },
        },
        {
          text: isHighlighted ? 'Remove highlight' : 'Highlight',
          onPress: () => toggleHighlight(slotIndex),
        },
        {
          text: 'Remove photo',
          style: 'destructive',
          onPress: () => void removePhoto(slotIndex),
        },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true },
    );
  }

  const filledCount = slots.filter((s) => s !== null).length;
  const highlightCount = overlay.highlightedPhotoIds.length;

  return (
    <SettingsLayout
      eyebrow="Photos"
      title={`${filledCount} of ${MAX_SLOTS}`}
      onBack={onBack}
    >
      <Text style={styles.body}>
        Up to 8 photos. The primary photo is what people see first on your card. Highlight up to 2
        for a gold-rule pin (visible to viewers).
      </Text>
      <Text style={styles.helper}>
        Tap an empty slot to add. Tap a filled slot for primary / highlight / remove.
      </Text>

      <View style={styles.grid}>
        {slots.map((slot, i) => {
          const busy = busySlot === i;
          const isPrimary = !!(slot && overlay.primaryPhotoId === slot.photoId);
          const isHighlighted = !!(slot && overlay.highlightedPhotoIds.includes(slot.photoId));
          const sourceUri = slot?.remoteUrl || slot?.localUri || '';
          return (
            <Pressable
              key={i}
              onPress={() => (slot ? showSlotMenu(i) : pickPhoto(i))}
              disabled={busy}
              style={[styles.slot, !slot && styles.slotEmpty]}
              accessibilityRole="button"
              accessibilityLabel={
                slot ? `Photo slot ${i + 1} options` : `Add photo to slot ${i + 1}`
              }
            >
              {slot ? (
                <>
                  {sourceUri ? (
                    <Image source={{ uri: sourceUri }} style={styles.slotImage} resizeMode="cover" />
                  ) : (
                    <View style={[styles.slotImage, styles.placeholderImage]} />
                  )}
                  {isPrimary ? (
                    <View style={styles.primaryBadge}>
                      <Text style={styles.primaryBadgeText}>Primary</Text>
                    </View>
                  ) : null}
                  {isHighlighted ? (
                    <View style={styles.highlightBadge}>
                      <StarIcon filled />
                    </View>
                  ) : null}
                  {(slot.status === 'pending_upload' ||
                    slot.status === 'processing' ||
                    busy) ? (
                    <View style={styles.overlayMask}>
                      <ActivityIndicator color={color.parchment.raised} />
                    </View>
                  ) : null}
                </>
              ) : (
                <Text style={styles.plus}>+</Text>
              )}
            </Pressable>
          );
        })}
      </View>

      <View style={styles.statsRow}>
        <Text style={styles.statsLabel}>{filledCount} photos</Text>
        <Text style={styles.statsLabel}>·</Text>
        <Text style={styles.statsLabel}>
          {highlightCount} highlighted
        </Text>
      </View>

      {loading ? <Text style={styles.helper}>Loading…</Text> : null}
      {error && error !== 'photo_rejected' ? (
        <Text style={styles.errorText}>Trouble: {error}</Text>
      ) : null}
    </SettingsLayout>
  );
}

const SLOT_GAP = space.s2;

const styles = StyleSheet.create({
  body: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.body,
    color: color.ink.default,
    lineHeight: 22,
    marginBottom: space.s3,
  },
  helper: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.caption,
    color: color.ink.soft,
    marginBottom: space.s4,
  },
  errorText: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.caption,
    color: color.warning[700],
    marginBottom: space.s4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SLOT_GAP,
    marginBottom: space.s5,
  },
  slot: {
    flexBasis: '32%',
    aspectRatio: 4 / 5,
    borderRadius: radius.lg,
    backgroundColor: color.sandstone.warm,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  } as ViewStyle,
  slotEmpty: {
    borderWidth: 1.5,
    borderColor: color.hairline.default,
    borderStyle: 'dashed',
    backgroundColor: color.parchment.raised,
  },
  slotImage: { width: '100%', height: '100%' },
  placeholderImage: { backgroundColor: color.sandstone.warm },
  plus: {
    fontFamily: fontFamily.serifMedium,
    fontSize: 36,
    color: color.ink.soft,
  },
  primaryBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    paddingHorizontal: space.s2,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: color.cobalt[500],
  },
  primaryBadgeText: {
    fontFamily: fontFamily.sansSemibold,
    fontSize: 10,
    color: color.parchment.raised,
    letterSpacing: letterSpacingFor(tracking.eyebrow, 10),
    textTransform: 'uppercase',
  },
  highlightBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 26,
    height: 26,
    borderRadius: radius.pill,
    backgroundColor: color.parchment.raised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayMask: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: space.s2,
    marginBottom: space.s5,
  },
  statsLabel: {
    fontFamily: fontFamily.sansSemibold,
    fontSize: 11,
    letterSpacing: letterSpacingFor(tracking.eyebrow, 11),
    textTransform: 'uppercase',
    color: color.ink.soft,
  },
});
