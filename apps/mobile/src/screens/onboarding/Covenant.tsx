import { useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { COVENANT_VERSION } from '@blesscupid/shared';
import type { OnboardingStackParamList } from '../../navigation/types.js';
import { copy } from '../../i18n/copy.js';
import { ApiError, acceptCovenant } from '../../lib/api.js';
import { useAuth } from '../../lib/auth-store.js';
import {
  Button,
  ScreenHeader,
  color,
  fontFamily,
  fontSize,
  space,
} from '../../lib/design-system/index.js';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'OnboardingCovenant'>;

const SCROLL_THRESHOLD = 24;

export function OnboardingCovenantScreen({ navigation }: Props) {
  const accessToken = useAuth((s) => s.accessToken);
  const [reachedBottom, setReachedBottom] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const layoutHeightRef = useRef(0);
  const contentHeightRef = useRef(0);

  function maybeAutoUnlock() {
    if (
      !reachedBottom &&
      layoutHeightRef.current > 0 &&
      contentHeightRef.current > 0 &&
      contentHeightRef.current <= layoutHeightRef.current + SCROLL_THRESHOLD
    ) {
      setReachedBottom(true);
    }
  }

  function onScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    if (reachedBottom) return;
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    const distanceFromBottom =
      contentSize.height - layoutMeasurement.height - contentOffset.y;
    if (distanceFromBottom <= SCROLL_THRESHOLD) setReachedBottom(true);
  }

  async function onAccept() {
    setError(null);
    if (__DEV__) {
      navigation.navigate('OnboardingFaith');
      return;
    }
    if (!accessToken) {
      setError('Session expired. Please sign in again.');
      return;
    }
    setBusy(true);
    try {
      await acceptCovenant(accessToken, {
        version: COVENANT_VERSION,
        acceptedAt: new Date().toISOString(),
      });
      navigation.navigate('OnboardingFaith');
    } catch (err) {
      const code = err instanceof ApiError ? err.code : 'covenant_failed';
      setError(code);
    } finally {
      setBusy(false);
    }
  }

  const acceptDisabled = (!__DEV__ && !reachedBottom) || busy;

  return (
    <View style={styles.container}>
      <ScreenHeader
        eyebrow="Covenant"
        title={copy.covenant.title}
        onBack={() => navigation.goBack()}
        variant="display"
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        onScroll={onScroll}
        scrollEventThrottle={32}
        onLayout={(e) => {
          layoutHeightRef.current = e.nativeEvent.layout.height;
          maybeAutoUnlock();
        }}
        onContentSizeChange={(_w, h) => {
          contentHeightRef.current = h;
          maybeAutoUnlock();
        }}
      >
        <Text style={styles.body}>{copy.covenant.intro}</Text>
        <Text style={[styles.body, styles.spacer]}>{copy.covenant.body}</Text>
        <Text style={[styles.acknowledgment, styles.spacer]}>
          {copy.covenant.acknowledgment}
        </Text>
        <Text style={[styles.body, styles.spacer]}>{copy.covenant.sameSexNote}</Text>
      </ScrollView>

      {error && (
        <View style={styles.errorPill}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {!reachedBottom && (
        <Text style={styles.hint}>Scroll to the end to continue.</Text>
      )}

      <Button
        variant="primary"
        full
        onPress={onAccept}
        disabled={acceptDisabled}
        label={busy ? 'Saving…' : copy.covenant.acceptCta}
      />
      <View style={styles.secondarySpacer} />
      <Button
        variant="secondary"
        full
        onPress={() => navigation.goBack()}
        disabled={busy}
        label={copy.covenant.declineCta}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: space.s6,
    paddingBottom: space.s6,
    backgroundColor: color.parchment.default,
  },
  scroll: { flex: 1, marginTop: space.s4, marginBottom: space.s3 },
  scrollContent: { paddingBottom: space.s4 },
  body: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.body,
    lineHeight: Math.round(fontSize.body * 1.55),
    color: color.ink.soft,
  },
  acknowledgment: {
    fontFamily: fontFamily.sansMedium,
    fontSize: fontSize.body,
    lineHeight: Math.round(fontSize.body * 1.55),
    color: color.ink.default,
    fontStyle: 'italic',
  },
  spacer: { marginTop: space.s4 },
  hint: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.caption,
    color: color.ink.soft,
    marginBottom: space.s2,
    textAlign: 'center',
  },
  errorPill: {
    backgroundColor: color.warning[100],
    borderRadius: 12,
    paddingHorizontal: space.s4,
    paddingVertical: space.s3,
    marginBottom: space.s3,
  },
  errorText: {
    fontFamily: fontFamily.sansMedium,
    fontSize: fontSize.caption,
    color: color.warning[700],
  },
  secondarySpacer: { height: space.s2 },
});
