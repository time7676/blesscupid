import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { tokens } from '../../lib/tokens';
import { useOnboardingActor } from './_layout';
import { Checkbox } from '../../components/onboarding/Checkbox';
import { track } from '../../lib/analytics';
import { t } from '../../lib/i18n';

const COVENANT_BODY = [
  'Saya berdoa dan mencari pasangan dengan hati yang jujur dan kudus.',
  'Saya menghormati setiap orang sebagai gambar Allah — tidak ada konten kasar, vulgar, atau menyakiti.',
  'Saya tidak akan mengirim foto atau pesan yang tidak senonoh.',
  'Saya melaporkan jika melihat sesuatu yang salah, untuk melindungi sesama.',
];

/** 04 Faith statement / covenant */
export default function FaithStatementScreen() {
  const router = useRouter();
  const actor = useOnboardingActor();
  // Anti-dark-pattern: never default to true.
  const [agreed, setAgreed] = useState(false);
  const enteredAt = useRef(Date.now());

  useEffect(() => {
    enteredAt.current = Date.now();
  }, []);

  const advance = () => {
    if (!agreed) return;
    const now = new Date().toISOString();
    actor.send({ type: 'AGREE', agreedAt: now });
    track('onboarding_faith_statement_agreed', {
      readDurationMs: Date.now() - enteredAt.current,
    });
    actor.send({ type: 'LANJUT' });
    router.push('/onboarding/photo');
  };

  return (
    <ScrollView
      contentContainerStyle={{
        paddingHorizontal: tokens.space[7],
        paddingTop: tokens.space[6],
        paddingBottom: tokens.space[8],
        gap: tokens.space[6],
      }}
    >
      <Text
        accessibilityRole="header"
        style={{
          fontFamily: tokens.font.display,
          fontSize: tokens.size.display.lg,
          lineHeight: tokens.lineHeight.display.lg,
          color: tokens.color.text.primary,
        }}
      >
        {t('covenant.title')}
      </Text>
      <View
        accessibilityLiveRegion="polite"
        style={{
          backgroundColor: tokens.color.bg.surface,
          borderRadius: tokens.radius.lg,
          padding: tokens.space[6],
          gap: tokens.space[4],
          borderLeftWidth: 2,
          borderLeftColor: tokens.color.gold[300],
        }}
      >
        {COVENANT_BODY.map((line, i) => (
          <Text
            key={i}
            style={{
              fontFamily: tokens.font.display,
              fontSize: tokens.size.body.lg,
              lineHeight: tokens.lineHeight.body.lg,
              color: tokens.color.text.scripture,
            }}
          >
            {line}
          </Text>
        ))}
      </View>
      <Checkbox
        checked={agreed}
        onChange={setAgreed}
        label={t('covenant.checkbox')}
        testID="covenant.checkbox"
      />
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: !agreed }}
        disabled={!agreed}
        onPress={advance}
        style={{
          minHeight: 56,
          backgroundColor: tokens.color.text.brand,
          borderRadius: tokens.radius.pill,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: agreed ? 1 : 0.4,
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
          {t('covenant.cta')}
        </Text>
      </Pressable>
    </ScrollView>
  );
}
