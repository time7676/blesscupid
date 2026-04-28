import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/lib/auth-store';

export default function ProfileScreen() {
  const { userId, signOut } = useAuth();

  async function onSignOut() {
    await signOut();
    router.replace('/');
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.body}>
        <Text style={styles.title}>You're in.</Text>
        <Text style={styles.subtitle}>
          Profile setup, the faith questionnaire, and the daily stack land in
          upcoming releases. This blank screen confirms auth wiring works end-to-end.
        </Text>
        <Text style={styles.userId}>User: {userId ?? '(none)'}</Text>
      </View>
      <Pressable style={styles.signOut} onPress={onSignOut}>
        <Text style={styles.signOutText}>Sign out</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 24, justifyContent: 'space-between' },
  body: { marginTop: 24 },
  title: { fontSize: 28, fontWeight: '700', color: '#1a1a1a' },
  subtitle: { marginTop: 12, color: '#555', lineHeight: 22 },
  userId: { marginTop: 24, color: '#888', fontFamily: 'Courier' },
  signOut: { padding: 16, alignItems: 'center' },
  signOutText: { color: '#1a1a1a', fontWeight: '600' },
});
