import { View, Text, Button } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../../navigation/types.js';
import { copy } from '../../i18n/copy.js';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'OnboardingFaith'>;

// TODO(BLE-7c): faith questionnaire form (denomination, attendance, baptized,
// marriageIntent, spiritualGifts). POST /onboarding/faith.
export function OnboardingFaithScreen({ navigation }: Props) {
  return (
    <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
      <Text style={{ fontSize: 22, fontWeight: '600', marginBottom: 24 }}>
        {copy.faith.denomination.title}
      </Text>
      <Button title="Continue" onPress={() => navigation.navigate('OnboardingProfileBasics')} />
    </View>
  );
}
