import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { useReducedMotion } from 'react-native-reanimated';
import { tokens } from '../../lib/tokens';
import { useOnboardingActor } from './_layout';
import { track } from '../../lib/analytics';
import { t } from '../../lib/i18n';

/** 01 Welcome */
export default function WelcomeScreen() {
  const router = useRouter();
  const actor = useOnboardingActor();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    track('onboarding_started', {});
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'space-between' }}>
      <View
        accessibilityRole="header"
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: tokens.space[7],
          opacity: reduceMotion ? 1 : 1, // animation handled by Reanimated entering prop in real impl
        }}
      >
        <Text
          style={{
            fontFamily: tokens.font.display,
            fontSize: tokens.size.display.xl,
            lineHeight: tokens.lineHeight.display.xl,
            color: tokens.color.text.brand,
            textAlign: 'center',
          }}
        >
          {t('welcome.title')}
        </Text>
        <Text
          style={{
            marginTop: tokens.space[5],
            fontFamily: tokens.font.body,
            fontSize: tokens.size.body.lg,
            color: tokens.color.text.secondary,
            textAlign: 'center',
          }}
        >
          {t('welcome.tagline')}
        </Text>
      </View>
      <View
        style={{
          paddingHorizontal: tokens.space[7],
          paddingBottom: tokens.space[9],
          gap: tokens.space[5],
        }}
      >
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            actor.send({ type: 'BEGIN' });
            router.push('/onboarding/auth/entry');
          }}
          style={{
            minHeight: 56,
            backgroundColor: tokens.color.text.brand,
            borderRadius: tokens.radius.pill,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            style={{
              fontFamily: tokens.font.body,
              fontSize: tokens.size.heading.sm,
              fontWeight: '600',
              color: tokens.color.text.inverse,
            }}
          >
            {t('welcome.cta')}
          </Text>
        </Pressable>
        <Link
          href="/onboarding/auth/entry"
          style={{
            fontFamily: tokens.font.body,
            fontSize: tokens.size.body.md,
            color: tokens.color.text.tertiary,
            textAlign: 'center',
          }}
        >
          {t('welcome.signin')}
        </Link>
      </View>
    </View>
  );
}
