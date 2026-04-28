import { View, Text, Button } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../../navigation/types.js';
import { copy } from '../../i18n/copy.js';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'OnboardingFirstPhoto'>;

// TODO(BLE-7d): expo-image-picker → POST /photos/upload-url → PUT to S3 →
// POST /photos/{id}/finalize → handle face-detection rejection per copy keys.
export function OnboardingFirstPhotoScreen({ navigation }: Props) {
  return (
    <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
      <Text style={{ fontSize: 22, fontWeight: '600', marginBottom: 12 }}>{copy.photo.requirements.title}</Text>
      <Text style={{ marginBottom: 24 }}>{copy.photo.requirements.body}</Text>
      <Button title="Continue" onPress={() => navigation.navigate('OnboardingBio')} />
    </View>
  );
}
