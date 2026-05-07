import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import {
  ProfileDetailSheet,
  type DeckProfileCard,
  color,
  fontFamily,
  fontSize,
  radius,
  space,
} from '../../../lib/design-system/index.js';
import { apiFetch, ApiError, getMe } from '../../../lib/api.js';
import { useAuth } from '../../../lib/auth-store.js';
import { SettingsLayout } from './SettingsLayout.js';

export type EditProfileScreenProps = {
  onBack: () => void;
  onEditPhotos?: () => void;
};

function EyeIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"
        stroke={color.cobalt[700]}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <Circle cx={12} cy={12} r={3} stroke={color.cobalt[700]} strokeWidth={1.5} />
    </Svg>
  );
}

export function EditProfileScreen({ onBack, onEditPhotos }: EditProfileScreenProps) {
  const accessToken = useAuth((s) => s.accessToken);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [city, setCity] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [previewing, setPreviewing] = useState(false);

  // Hydrate from /me on mount so user sees current values.
  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!accessToken) return;
      try {
        const me = await getMe(accessToken);
        if (cancelled || !me.profile) return;
        setDisplayName(me.profile.displayName ?? '');
        setBio(me.profile.bio ?? '');
        setCity(me.profile.city ?? '');
      } catch {
        // non-fatal
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  async function save() {
    if (!accessToken || busy) return;
    setBusy(true);
    setError(null);
    try {
      await apiFetch('/v1/me/profile', {
        method: 'PATCH',
        token: accessToken,
        body: JSON.stringify({ displayName, bio, city }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof ApiError ? err.code : 'save_failed');
    } finally {
      setBusy(false);
    }
  }

  // Build a DeckProfileCard from form values for the preview sheet.
  const previewCard: DeckProfileCard = {
    kind: 'profile',
    id: 'me-preview',
    displayName: displayName || 'You',
    age: 32,
    city: city || 'Your city',
    tradition: 'Catholic',
    walkStage: 'Lifelong',
    bio: bio || 'Tap "Edit" to add a bio.',
    photoStorageKey: null,
  };

  return (
    <>
      <SettingsLayout
        eyebrow="Edit profile"
        title="Your profile"
        onBack={onBack}
        footer={
          <Pressable
            accessibilityRole="button"
            onPress={save}
            disabled={busy}
            style={({ pressed }) => [styles.cta, pressed && { opacity: 0.85 }]}
          >
            <Text style={styles.ctaLabel}>{busy ? 'Saving…' : saved ? 'Saved ✓' : 'Save'}</Text>
          </Pressable>
        }
      >
        <View style={styles.actionRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Preview my profile as others see it"
            onPress={() => setPreviewing(true)}
            style={({ pressed }) => [styles.previewBtn, pressed && { opacity: 0.85 }]}
          >
            <EyeIcon />
            <Text style={styles.previewLabel}>Preview</Text>
          </Pressable>
          {onEditPhotos ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Manage photos"
              onPress={onEditPhotos}
              style={({ pressed }) => [styles.previewBtn, pressed && { opacity: 0.85 }]}
            >
              <Text style={styles.previewLabel}>Manage photos →</Text>
            </Pressable>
          ) : null}
        </View>

        <Field
          label="Display name"
          helper="Your first name. Visible to people you match with."
          value={displayName}
          onChange={setDisplayName}
        />
        <Field
          label="City"
          helper="The metro you currently live in."
          value={city}
          onChange={setCity}
        />
        <Field
          label="Bio"
          helper="Up to 280 characters. Pastor-moderated."
          value={bio}
          onChange={setBio}
          multiline
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </SettingsLayout>

      <ProfileDetailSheet
        card={previewing ? previewCard : null}
        onDismiss={() => setPreviewing(false)}
        onAction={() => setPreviewing(false)}
      />
    </>
  );
}

function Field({
  label,
  helper,
  value,
  onChange,
  multiline = false,
}: {
  label: string;
  helper?: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        multiline={multiline}
        style={[styles.input, multiline && styles.inputMulti]}
        placeholderTextColor={color.ink.soft}
        accessibilityLabel={label}
      />
      {helper ? <Text style={styles.fieldHelper}>{helper}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { marginBottom: space.s5 },
  fieldLabel: {
    fontFamily: fontFamily.sansMedium,
    fontSize: fontSize.label,
    color: color.ink.default,
    letterSpacing: 0.4,
    marginBottom: space.s2,
  },
  fieldHelper: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.caption,
    color: color.ink.soft,
    marginTop: space.s1,
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
  inputMulti: { minHeight: 96, textAlignVertical: 'top' },
  error: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.caption,
    color: color.warning[700],
    marginTop: space.s2,
  },
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
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.s3,
    marginBottom: space.s5,
  },
  previewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.s3,
    paddingVertical: space.s4,
    paddingHorizontal: space.s5,
    backgroundColor: color.cobalt[100],
    borderRadius: radius.lg,
  },
  previewLabel: {
    fontFamily: fontFamily.sansSemibold,
    fontSize: fontSize.label,
    color: color.cobalt[700],
    letterSpacing: 0.4,
  },
});
