import { useCallback, useEffect, useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  border,
  color,
  fontFamily,
  fontSize,
  radius,
  space,
} from '../tokens.js';

export type LivenessError =
  | { kind: 'permission_denied'; settingsLink: string }
  | { kind: 'low_light' }
  | { kind: 'face_not_found' }
  | { kind: 'budget_cap_exceeded' }
  | { kind: 'vendor_failure'; retryable: boolean };

export type CameraLivenessFrameProps = {
  onComplete: (verificationId: string) => void;
  onError: (err: LivenessError) => void;
  prompts?: string[];
};

// Stub liveness session helpers — wired to AWS Rekognition Face Liveness in a
// follow-up. See ADR-0001 / BLE-7d. Until then the component runs through
// the permission gate and exposes a manual "simulate pass" affordance for
// integration testing.
async function startLivenessSession(): Promise<{ sessionId: string }> {
  return { sessionId: `dev-${Date.now()}` };
}

async function finalizeLivenessSession(
  _sessionId: string,
): Promise<{ verdict: 'pass' | 'fail'; verificationId: string }> {
  return { verdict: 'pass', verificationId: `dev-${Date.now()}` };
}

export function CameraLivenessFrame({ onComplete, onError }: CameraLivenessFrameProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await ImagePicker.requestCameraPermissionsAsync();
      if (cancelled) return;
      if (!result.granted) {
        setPermissionGranted(false);
        onError({ kind: 'permission_denied', settingsLink: 'app-settings:' });
        return;
      }
      setPermissionGranted(true);
      try {
        const r = await startLivenessSession();
        if (!cancelled) setSessionId(r.sessionId);
      } catch {
        if (!cancelled) onError({ kind: 'vendor_failure', retryable: true });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [onError]);

  const handleAnalysisComplete = useCallback(async () => {
    if (!sessionId) return;
    try {
      const r = await finalizeLivenessSession(sessionId);
      if (r.verdict === 'pass') onComplete(r.verificationId);
      else onError({ kind: 'vendor_failure', retryable: true });
    } catch {
      onError({ kind: 'vendor_failure', retryable: true });
    }
  }, [sessionId, onComplete, onError]);

  if (permissionGranted === false) {
    return (
      <View style={styles.notice}>
        <Text style={styles.noticeText} accessibilityLiveRegion="polite">
          Izinkan kamera untuk melanjutkan.
        </Text>
        <Text
          accessibilityRole="button"
          onPress={() => Linking.openSettings()}
          style={styles.action}
        >
          Buka pengaturan
        </Text>
      </View>
    );
  }

  if (!sessionId) {
    return (
      <View style={styles.notice}>
        <Text style={styles.placeholder}>Memulai...</Text>
      </View>
    );
  }

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel="Bingkai kamera verifikasi"
      style={styles.frame}
    >
      <Text style={styles.placeholder}>[Liveness vendor mounts here]</Text>
      <Text accessibilityRole="button" onPress={handleAnalysisComplete} style={styles.action}>
        (dev) Simulate pass
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  notice: {
    padding: space.s6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noticeText: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.body,
    color: color.ink.soft,
    textAlign: 'center',
    marginBottom: space.s4,
  },
  frame: {
    aspectRatio: 3 / 4,
    borderWidth: border.thick,
    borderColor: color.indigo.default,
    borderRadius: radius.lg,
    backgroundColor: color.sandstone.deep,
    margin: space.s5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.body,
    color: color.ink.soft,
  },
  action: {
    marginTop: space.s4,
    fontFamily: fontFamily.sansSemibold,
    fontSize: fontSize.body,
    color: color.indigo.default,
  },
});
