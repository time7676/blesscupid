import { View, Text, Button } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../../navigation/types.js';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Signup'>;

// TODO(BLE-7b): Apple/Google Sign-In + email signup form. Wire to POST /auth/signup/email.
export function SignupScreen({ navigation }: Props) {
  return (
    <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
      <Text style={{ fontSize: 28, fontWeight: '600', marginBottom: 24 }}>BlessCupid</Text>
      <Text style={{ marginBottom: 24 }}>Signup screen — placeholder.</Text>
      <Button title="Continue" onPress={() => navigation.navigate('OnboardingAgeGate')} />
      <View style={{ height: 12 }} />
      <Button title="Have an account? Log in" onPress={() => navigation.navigate('Login')} />
    </View>
  );
}
