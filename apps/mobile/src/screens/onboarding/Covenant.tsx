import { useRef, useState } from 'react';
import {
  Alert,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
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

type Props = NativeStackScreenProps<OnboardingStackParamList, 'OnboardingCovenant'>;

const SCROLL_THRESHOLD = 24;

export function OnboardingCovenantScreen({ navigation }: Props) {
  const accessToken = useAuth((s) => s.accessToken);
  const [reachedBottom, setReachedBottom] = useState(false);
  const [busy, setBusy] = useState(false);
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
    // Dev bypass: skip the API call so the screen advances even without a
    // real backend session. Re-enables the original guard in production.
    if (__DEV__) {
      navigation.navigate('OnboardingFaith');
      return;
    }
    if (!accessToken) {
      Alert.alert('Session expired', 'Please sign in again.');
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
      Alert.alert('Could not save covenant', code);
    } finally {
      setBusy(false);
    }
  }

  // In __DEV__ skip the scroll-to-bottom gate so the Accept button is always
  // tappable for screen-flow testing.
  const acceptDisabled = (!__DEV__ && !reachedBottom) || busy;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{copy.covenant.title}</Text>
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
        {/* BLE-124 — Pastor v1 covenant. Order: intro → seven clauses →
            acknowledgment → same-sex redirect note. Verbatim from
            /BLE/issues/BLE-41#document-user-covenant. */}
        <Text style={styles.body}>{copy.covenant.intro}</Text>
        <Text style={[styles.body, styles.spacer]}>{copy.covenant.body}</Text>
        <Text style={[styles.acknowledgment, styles.spacer]}>
          {copy.covenant.acknowledgment}
        </Text>
        <Text style={[styles.body, styles.spacer]}>{copy.covenant.sameSexNote}</Text>
      </ScrollView>

      {!reachedBottom && (
        <Text style={styles.hint}>Scroll to the end to continue.</Text>
      )}

      <Pressable
        style={[styles.primary, acceptDisabled && styles.disabled]}
        disabled={acceptDisabled}
        onPress={onAccept}
      >
        <Text style={styles.primaryText}>
          {busy ? 'Saving…' : copy.covenant.acceptCta}
        </Text>
      </Pressable>
      <Pressable
        style={styles.secondary}
        disabled={busy}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.secondaryText}>{copy.covenant.declineCta}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 60, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: '600', marginBottom: 16, color: '#1a1a1a' },
  scroll: { flex: 1, marginBottom: 12 },
  scrollContent: { paddingBottom: 16 },
  body: { fontSize: 16, lineHeight: 24, color: '#333' },
  acknowledgment: { fontSize: 16, lineHeight: 24, color: '#1a1a1a', fontStyle: 'italic' },
  spacer: { marginTop: 16 },
  hint: { color: '#888', marginBottom: 8 },
  primary: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  primaryText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  disabled: { opacity: 0.4 },
  secondary: { padding: 14, alignItems: 'center' },
  secondaryText: { color: '#1a1a1a', fontWeight: '500' },
});
