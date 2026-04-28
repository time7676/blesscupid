import { View, Text, Button } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../../navigation/types.js';
import { copy } from '../../i18n/copy.js';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'OnboardingBio'>;

// TODO(BLE-7e): bio textarea. POST /onboarding/bio. Show review or block message based on response.
export function OnboardingBioScreen({ navigation }: Props) {
  return (
    <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
      <Text style={{ fontSize: 22, fontWeight: '600', marginBottom: 12 }}>{copy.profile.bio.title}</Text>
      <Text style={{ marginBottom: 24 }}>{copy.profile.bio.helper}</Text>
      <Button title="Done" onPress={() => navigation.popToTop()} />
    </View>
  );
}
