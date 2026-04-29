import { View, Text, Button } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../../navigation/types.js';
import { copy } from '../../i18n/copy.js';
import { isDatingOutOfScope, type OrientationDeclaration } from '../../lib/dating-scope.js';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'OnboardingProfileBasics'>;

// TODO(BLE-7d): name/gender/city form. POST /onboarding/profile.
// HCoC §4.2 hand-off: once the orientation form is built, call
// `routeAfterOrientation` with the user's declared gender + interest. The
// helper navigates to `OnboardingDatingOutOfScope` when out-of-scope, or
// `OnboardingFirstPhoto` when in-scope.
export function routeAfterOrientation(
  nav: Props['navigation'],
  declaration: OrientationDeclaration,
): void {
  if (isDatingOutOfScope(declaration)) {
    nav.navigate('OnboardingDatingOutOfScope');
    return;
  }
  nav.navigate('OnboardingFirstPhoto');
}

export function OnboardingProfileBasicsScreen({ navigation }: Props) {
  return (
    <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
      <Text style={{ fontSize: 22, fontWeight: '600', marginBottom: 24 }}>{copy.profile.basics.title}</Text>
      <Button title="Continue" onPress={() => navigation.navigate('OnboardingFirstPhoto')} />
    </View>
  );
}
