import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/lib/auth-store';

// PASTOR_COPY_REQUIRED: welcome-screen tagline pending Pastor review.
const TAGLINE = 'Faith first. Marriage minded.';

export default function WelcomeScreen() {
  const { hydrated, userId } = useAuth();

  useEffect(() => {
    if (hydrated && userId) router.replace('/profile');
  }, [hydrated, userId]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.brandBlock}>
        <Text style={styles.brand}>BlessCupid</Text>
        <Text style={styles.tagline}>{TAGLINE}</Text>
      </View>
      <View style={styles.actions}>
        <Link href="/sign-up" asChild>
          <Pressable style={styles.primary}>
            <Text style={styles.primaryText}>Create account</Text>
          </Pressable>
        </Link>
        <Link href="/sign-in" asChild>
          <Pressable style={styles.secondary}>
            <Text style={styles.secondaryText}>Sign in</Text>
          </Pressable>
        </Link>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 24, justifyContent: 'space-between' },
  brandBlock: { marginTop: 80, alignItems: 'center' },
  brand: { fontSize: 36, fontWeight: '700', color: '#1a1a1a' },
  tagline: { marginTop: 8, fontSize: 16, color: '#555' },
  actions: { gap: 12, paddingBottom: 24 },
  primary: { backgroundColor: '#1a1a1a', padding: 16, borderRadius: 12, alignItems: 'center' },
  primaryText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  secondary: { padding: 16, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#1a1a1a' },
  secondaryText: { color: '#1a1a1a', fontWeight: '600', fontSize: 16 },
});
