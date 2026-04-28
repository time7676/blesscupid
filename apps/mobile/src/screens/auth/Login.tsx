import { View, Text, Button } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../../navigation/types.js';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Login'>;

// TODO(BLE-7b): real login form, OAuth handlers, secure-store for refresh token.
export function LoginScreen({ navigation }: Props) {
  return (
    <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
      <Text style={{ fontSize: 24, fontWeight: '600', marginBottom: 24 }}>Welcome back</Text>
      <Button title="Back to signup" onPress={() => navigation.navigate('Signup')} />
    </View>
  );
}
