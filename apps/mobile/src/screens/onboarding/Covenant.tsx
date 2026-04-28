import { View, Text, Button, ScrollView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../../navigation/types.js';
import { copy } from '../../i18n/copy.js';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'OnboardingCovenant'>;

// TODO(BLE-7c): wire POST /onboarding/covenant. Block continue until pastor copy ships (BLE-7f).
export function OnboardingCovenantScreen({ navigation }: Props) {
  return (
    <View style={{ flex: 1, padding: 24 }}>
      <Text style={{ fontSize: 24, fontWeight: '600', marginVertical: 24 }}>{copy.covenant.title}</Text>
      <ScrollView style={{ flex: 1, marginBottom: 16 }}>
        <Text>{copy.covenant.body}</Text>
      </ScrollView>
      <Button title={copy.covenant.acceptCta} onPress={() => navigation.navigate('OnboardingFaith')} />
      <View style={{ height: 12 }} />
      <Button title={copy.covenant.declineCta} onPress={() => navigation.goBack()} />
    </View>
  );
}
