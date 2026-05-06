/**
 * Bio — onboarding step 6 of 6.
 *
 * Captures a 1-2 sentence faith bio. Submits to POST /v1/onboarding/bio,
 * which runs the OpenAI moderation pipeline before storing. On block,
 * the user sees the rejection reason and can revise. On approve, calls
 * POST /v1/onboarding/complete to flip the server-side onboardingCompleted
 * flag, then refreshes the auth-store via getMe so the RootStack swaps
 * to AppShell.
 *
 * The prior version of this screen called `navigation.popToTop()` which
 * sent the user back to the AgeGate (the OnboardingStack initialRoute)
 * and produced an unbreakable loop. Per BLE eng-review 2026-05-06 the
 * completion flag is now server-side; mobile no longer pops anywhere.
 */

import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
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
  radius,
  space,
} from '../../lib/design-system/index.js';
import { ApiError, completeOnboarding, getMe, saveBio } from '../../lib/api.js';
import { useAuth } from '../../lib/auth-store.js';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'OnboardingBio'>;

const HELPER =
  'A real first sentence beats a generic one. Try: what does Sunday look like for you, or what verse keeps coming back this season?';
const PLACEHOLDER = 'Up to 280 characters. Pastor reviews any copy that gets flagged.';

export function OnboardingBioScreen(_: Props) {
  const accessToken = useAuth((s) => s.accessToken);
  const setOnboardingComplete = useAuth((s) => s.setOnboardingComplete);
  const [bio, setBio] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingReview, setPendingReview] = useState(false);

  async function onDone() {
    const trimmed = bio.trim();
    if (!trimmed) {
      setError('Write one or two sentences.');
      return;
    }
    if (trimmed.length > 500) {
      setError('Keep it under 500 characters.');
      return;
    }
    if (!accessToken) {
      setError('Sign in expired. Please sign in again.');
      return;
    }
    setError(null);
    setPendingReview(false);
    setBusy(true);
    try {
      const bioResult = await saveBio(accessToken, { bio: trimmed });
      if (!bioResult.bioApproved) {
        // Server queued the bio for human review. Don't complete onboarding
        // yet; show the user a non-blocking note. They can still continue
        // because the bio holds, but they'll know review is pending.
        setPendingReview(true);
        // Continue to AppShell so the user isn't stranded; their profile
        // will surface the bio once reviewed.
      }
      await completeOnboarding(accessToken);
      // Re-hydrate from /me so the auth-store reflects the server-side
      // flag rather than the client-only fallback.
      try {
        const me = await getMe(accessToken);
        await setOnboardingComplete(me.onboardingCompleted);
      } catch {
        // Best-effort: if /me fails, optimistically set the local flag.
        // The next cold start will reconcile via hydrate().
        await setOnboardingComplete(true);
      }
    } catch (err) {
      if (err instanceof ApiError && err.code === 'bio_rejected') {
        setError('That copy did not pass review. Try a softer first line.');
      } else {
        const code = err instanceof ApiError ? err.code : 'bio_save_failed';
        setError(code);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenHeader eyebrow="Onboarding" title="Your first words" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.lede}>
          One or two sentences. Why are you here, what does your week of faith look like?
          You can update this later from your profile.
        </Text>

        <FormInput
          label="Bio"
          required
          multiline
          value={bio}
          onChangeText={setBio}
          placeholder={PLACEHOLDER}
          maxLength={500}
          helper={HELPER}
        />

        {pendingReview ? (
          <View style={styles.noticePill}>
            <Text style={styles.noticeText}>
              Held for a quick review. You can keep going. The bio shows on your profile
              once reviewed.
            </Text>
          </View>
        ) : null}

        {error ? (
          <View style={styles.errorPill}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {busy ? <ActivityIndicator style={styles.busy} /> : null}

        <Button variant="primary" full label="Done" onPress={onDone} disabled={busy} />
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
  noticePill: {
    backgroundColor: color.sandstone.warm,
    paddingHorizontal: space.s4,
    paddingVertical: space.s3,
    borderRadius: radius.lg,
    marginBottom: space.s4,
  },
  noticeText: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.body,
    color: color.ink.soft,
  },
  busy: { marginBottom: space.s4 },
});
