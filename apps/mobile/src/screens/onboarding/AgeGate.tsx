import { View, Text, Button } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../../navigation/types.js';
import { copy } from '../../i18n/copy.js';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'OnboardingAgeGate'>;

// TODO(BLE-7b): real DOB picker. Server enforces age (POST /auth/signup/email validates).
export function OnboardingAgeGateScreen({ navigation }: Props) {
  return (
    <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
      <Text style={{ fontSize: 24, fontWeight: '600', marginBottom: 12 }}>{copy.ageGate.title}</Text>
      <Text style={{ marginBottom: 24 }}>{copy.ageGate.body}</Text>
      <Button title="Continue" onPress={() => navigation.navigate('OnboardingCovenant')} />
    </View>
  );
}
