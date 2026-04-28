import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { checkAgeGate, MINIMUM_AGE } from '@blesscupid/shared';
import { signupEmail, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';

export default function SignUpScreen() {
  const setSession = useAuth((s) => s.setSession);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [dob, setDob] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit() {
    if (!accepted) {
      Alert.alert('Covenant', 'You must accept the Holy Code of Conduct to continue.');
      return;
    }
    const gate = checkAgeGate(dob);
    if (!gate.ok) {
      Alert.alert('Age check', `Must be ${MINIMUM_AGE}+ to sign up.`);
      return;
    }
    setBusy(true);
    try {
      const tokens = await signupEmail({ email: email.trim(), password, dob });
      await setSession(tokens);
      router.replace('/profile');
    } catch (err) {
      const msg = err instanceof ApiError ? err.code : 'Signup failed';
      Alert.alert('Signup failed', msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.fill}
      >
        <Text style={styles.title}>Create account</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Password (min 10 chars)"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <TextInput
          style={styles.input}
          placeholder="Date of birth (YYYY-MM-DD)"
          autoCapitalize="none"
          value={dob}
          onChangeText={setDob}
        />

        <Pressable style={styles.checkboxRow} onPress={() => setAccepted((v) => !v)}>
          <View style={[styles.checkbox, accepted && styles.checkboxOn]} />
          {/* PASTOR_COPY_REQUIRED: covenant acceptance copy pending Pastor review. */}
          <Text style={styles.checkboxText}>
            I accept the BlessCupid Holy Code of Conduct.
          </Text>
        </Pressable>

        <Pressable
          style={[styles.primary, busy && styles.disabled]}
          disabled={busy}
          onPress={onSubmit}
        >
          <Text style={styles.primaryText}>{busy ? 'Creating…' : 'Create account'}</Text>
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 24 },
  fill: { flex: 1 },
  title: { fontSize: 28, fontWeight: '700', marginTop: 16, marginBottom: 24, color: '#1a1a1a' },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    fontSize: 16,
  },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 16, gap: 10 },
  checkbox: { width: 22, height: 22, borderWidth: 1, borderColor: '#1a1a1a', borderRadius: 4 },
  checkboxOn: { backgroundColor: '#1a1a1a' },
  checkboxText: { flex: 1, color: '#1a1a1a' },
  primary: {
    marginTop: 12,
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  disabled: { opacity: 0.5 },
});
