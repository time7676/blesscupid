import { useCallback, useEffect, useState } from 'react';
import { Linking, Text, View } from 'react-native';
import { Camera } from 'expo-camera';
import { tokens } from '../../lib/tokens';
// import { FaceLivenessDetector } from '@aws-amplify/ui-react-native-liveness';
// — uncommented once Expo prebuild + Amplify are wired (see vendor-poc/liveness.md).
import { startLiveness, finalizeLiveness, ApiError } from '../../lib/api';

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

export function CameraLivenessFrame({
  onComplete,
  onError,
}: CameraLivenessFrameProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        setPermissionGranted(false);
        onError({
          kind: 'permission_denied',
          settingsLink: 'app-settings:',
        });
        return;
      }
      setPermissionGranted(true);
      try {
        const r = await startLiveness();
        setSessionId(r.sessionId);
      } catch (e) {
        if (e instanceof ApiError && e.isBudgetCap()) {
          onError({ kind: 'budget_cap_exceeded' });
          return;
        }
        onError({ kind: 'vendor_failure', retryable: true });
      }
    })();
  }, [onError]);

  const handleAnalysisComplete = useCallback(async () => {
    if (!sessionId) return;
    try {
      const r = await finalizeLiveness(sessionId);
      if (r.verdict === 'pass') onComplete(r.verificationId);
      else onError({ kind: 'vendor_failure', retryable: true });
    } catch {
      onError({ kind: 'vendor_failure', retryable: true });
    }
  }, [sessionId, onComplete, onError]);

  if (permissionGranted === false) {
    return (
      <View
        style={{
          padding: tokens.space[7],
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text
          style={{
            fontFamily: tokens.font.body,
            fontSize: tokens.size.body.md,
            color: tokens.color.text.secondary,
            textAlign: 'center',
            marginBottom: tokens.space[5],
          }}
          accessibilityLiveRegion="polite"
        >
          Izinkan kamera untuk melanjutkan.
        </Text>
        <Text
          accessibilityRole="button"
          onPress={() => Linking.openSettings()}
          style={{
            fontFamily: tokens.font.body,
            fontSize: tokens.size.body.md,
            color: tokens.color.text.brand,
            fontWeight: '600',
          }}
        >
          Buka pengaturan
        </Text>
      </View>
    );
  }

  if (!sessionId) {
    return (
      <View
        style={{
          padding: tokens.space[7],
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text
          style={{
            fontFamily: tokens.font.body,
            color: tokens.color.text.tertiary,
          }}
        >
          Memulai...
        </Text>
      </View>
    );
  }

  // Stub render until AWS Amplify Liveness wires up post-prebuild.
  // Replace with:
  //
  // return (
  //   <FaceLivenessDetector
  //     sessionId={sessionId}
  //     region="ap-southeast-1"
  //     onAnalysisComplete={handleAnalysisComplete}
  //     onError={(e) => onError({ kind: 'vendor_failure', retryable: !e.fatal })}
  //     disableInstructionScreen={false}
  //   />
  // );
  return (
    <View
      accessibilityRole="image"
      accessibilityLabel="Bingkai kamera verifikasi"
      style={{
        aspectRatio: 3 / 4,
        borderWidth: 2,
        borderColor: tokens.color.border.focus,
        borderRadius: tokens.radius['2xl'],
        backgroundColor: tokens.color.bg.sunken,
        margin: tokens.space[6],
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        style={{
          fontFamily: tokens.font.body,
          color: tokens.color.text.tertiary,
        }}
      >
        [Liveness vendor mounts here]
      </Text>
      <Text
        accessibilityRole="button"
        onPress={handleAnalysisComplete}
        style={{
          marginTop: tokens.space[5],
          fontFamily: tokens.font.body,
          color: tokens.color.text.brand,
          fontWeight: '600',
        }}
      >
        (dev) Simulate pass
      </Text>
    </View>
  );
}
