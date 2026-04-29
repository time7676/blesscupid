import { View, Text, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../../navigation/types.js';
import { copy } from '../../i18n/copy.js';
import { ScreenHeader, Button, color, fontFamily, fontSize, space } from '../../lib/design-system/index.js';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'OnboardingAgeGate'>;

// TODO(BLE-7b): real DOB picker. Server enforces age (POST /auth/signup/email validates).
export function OnboardingAgeGateScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <ScreenHeader eyebrow="Onboarding" title={copy.ageGate.title} onBack={() => navigation.goBack()} />
      <View style={styles.content}>
        <Text style={styles.body}>{copy.ageGate.body}</Text>
        <Button
          variant="primary"
          label="Continue"
          onPress={() => navigation.navigate('OnboardingCovenant')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: color.parchment.default },
  content: { flex: 1, padding: space.s4, justifyContent: 'center' },
  body: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.bodyLg,
    color: color.ink.default,
    marginBottom: space.s4,
    lineHeight: 24,
  },
});
