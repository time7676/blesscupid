/**
 * ProfileBasics — onboarding step 4 of 6.
 *
 * Captures the user's nickname (public displayName), legal name (private,
 * for safety/abuse-report routing), gender, and city. Per BLE eng-review
 * 2026-05-06, the nickname/legalName split is the PII redaction boundary
 * the launch claim depends on: every other user only sees `displayName`.
 *
 * Submits to POST /v1/onboarding/profile, which writes legalName to
 * the User table and the rest to the Profile table. On success, advances
 * to FirstPhoto.
 *
 * countryCode is fixed to 'ID' (Indonesia) for the v1 Bali single-city
 * cold-start cohort. v1.1 will surface a country picker when expansion
 * to PH + SG opens.
 */

import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../../navigation/types.js';
import {
  Button,
  FormInput,
  ScreenHeader,
  color,
  fontFamily,
  fontSize,
  letterSpacingFor,
  radius,
  space,
  tracking,
} from '../../lib/design-system/index.js';
import { ApiError, saveProfileBasics } from '../../lib/api.js';
import { useAuth } from '../../lib/auth-store.js';
import { isDatingOutOfScope, type OrientationDeclaration } from '../../lib/dating-scope.js';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'OnboardingProfileBasics'>;

// HCoC §4.2 hand-off retained from prior stub. When the orientation form
// is built (separate ticket), call this helper to route same-sex declarations
// to the explicit out-of-scope screen instead of the standard photo step.
export function routeAfterOrientation(
  nav: Props['navigation'],
  declaration: OrientationDeclaration,
): void {
  if (isDatingOutOfScope(declaration)) {
    nav.navigate('OnboardingDatingOutOfScope');
    return;
  }
  nav.navigate('OnboardingFirstPhoto');
}

const NICKNAME_HELPER = 'This is what other people see. Pick something you would be okay being called by a stranger.';
const LEGAL_HELPER = 'Stays private. Only Pastor and the safety team see it, only when a report is filed.';
const COUNTRY_CODE_DEFAULT = 'ID';

export function OnboardingProfileBasicsScreen({ navigation }: Props) {
  const accessToken = useAuth((s) => s.accessToken);
  const [nickname, setNickname] = useState('');
  const [legalName, setLegalName] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | null>(null);
  const [city, setCity] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function validate(): string | null {
    if (!nickname.trim()) return 'Pick a nickname.';
    if (nickname.trim().length > 40) return 'Nickname must be 40 characters or fewer.';
    if (!legalName.trim()) return 'Tell us your legal name. It stays private.';
    if (legalName.trim().length > 80) return 'Legal name must be 80 characters or fewer.';
    if (!gender) return 'Pick the option that fits.';
    if (!city.trim()) return 'Tell us your city.';
    if (city.trim().length > 80) return 'City must be 80 characters or fewer.';
    return null;
  }

  async function onContinue() {
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    if (!accessToken) {
      setError('Sign in expired. Please sign in again.');
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await saveProfileBasics(accessToken, {
        displayName: nickname.trim(),
        legalName: legalName.trim(),
        gender: gender as 'male' | 'female',
        city: city.trim(),
        countryCode: COUNTRY_CODE_DEFAULT,
      });
      navigation.navigate('OnboardingFirstPhoto');
    } catch (err) {
      const code = err instanceof ApiError ? err.code : 'profile_save_failed';
      setError(code);
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenHeader
        eyebrow="Onboarding"
        title="Tell us a little about you"
        onBack={() => navigation.goBack()}
      />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.lede}>
          Three quick fields. Nickname is what other people see. Legal name stays private,
          for safety only.
        </Text>

        <FormInput
          label="Nickname"
          required
          value={nickname}
          onChangeText={setNickname}
          maxLength={40}
          placeholder="Naomi"
          autoCapitalize="words"
          autoCorrect={false}
          helper={NICKNAME_HELPER}
        />

        <FormInput
          label="Legal name"
          required
          value={legalName}
          onChangeText={setLegalName}
          maxLength={80}
          placeholder="Naomi Marisol Sanchez"
          autoCapitalize="words"
          autoCorrect={false}
          helper={LEGAL_HELPER}
        />

        <View style={styles.genderField}>
          <Text style={styles.genderLabel}>
            I am
            <Text style={styles.req}> *</Text>
          </Text>
          <View style={styles.genderRow}>
            <Pressable
              onPress={() => setGender('female')}
              style={[styles.genderBtn, gender === 'female' && styles.genderBtnActive]}
              accessibilityRole="radio"
              accessibilityState={{ selected: gender === 'female' }}
              accessibilityLabel="Woman"
            >
              <Text style={[styles.genderBtnText, gender === 'female' && styles.genderBtnTextActive]}>
                A woman
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setGender('male')}
              style={[styles.genderBtn, gender === 'male' && styles.genderBtnActive]}
              accessibilityRole="radio"
              accessibilityState={{ selected: gender === 'male' }}
              accessibilityLabel="Man"
            >
              <Text style={[styles.genderBtnText, gender === 'male' && styles.genderBtnTextActive]}>
                A man
              </Text>
            </Pressable>
          </View>
        </View>

        <FormInput
          label="City"
          required
          value={city}
          onChangeText={setCity}
          maxLength={80}
          placeholder="Denpasar"
          autoCapitalize="words"
          autoCorrect={false}
        />

        {error ? (
          <View style={styles.errorPill}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {busy ? <ActivityIndicator style={styles.busy} /> : null}

        <Button
          variant="primary"
          full
          label="Continue"
          onPress={onContinue}
          disabled={busy}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.parchment.default },
  scroll: {
    paddingHorizontal: space.s6,
    paddingTop: space.s4,
    paddingBottom: space.s8,
  },
  lede: {
    fontFamily: fontFamily.serifItalic,
    fontSize: fontSize.bodyLg,
    lineHeight: 22,
    color: color.ink.soft,
    marginBottom: space.s6,
  },
  genderField: {
    marginBottom: space.s6,
  },
  genderLabel: {
    fontFamily: fontFamily.sansMedium,
    fontSize: fontSize.label,
    color: color.ink.default,
    letterSpacing: letterSpacingFor(tracking.label, fontSize.label),
    marginBottom: 6,
  },
  req: { color: color.gold.default },
  genderRow: {
    flexDirection: 'row',
    gap: space.s3,
  },
  genderBtn: {
    flex: 1,
    paddingVertical: space.s4,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: color.hairline.default,
    backgroundColor: color.parchment.raised,
    alignItems: 'center',
  },
  genderBtnActive: {
    borderColor: color.cobalt[500],
    backgroundColor: color.cobalt[100],
  },
  genderBtnText: {
    fontFamily: fontFamily.serifMedium,
    fontSize: fontSize.bodyLg,
    color: color.ink.default,
  },
  genderBtnTextActive: {
    color: color.cobalt[700],
  },
  errorPill: {
    backgroundColor: color.warning[100],
    paddingHorizontal: space.s4,
    paddingVertical: space.s3,
    borderRadius: radius.lg,
    marginBottom: space.s4,
  },
  errorText: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.body,
    color: color.warning[700],
  },
  busy: {
    marginBottom: space.s4,
  },
});
