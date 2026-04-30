import { useEffect, useRef } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { tokens } from '../../lib/tokens';
import { useOnboardingActor } from './_layout';
import { VerseCard } from '../../components/onboarding/VerseCard';
import { completeOnboarding } from '../../lib/api';
import { clearDraft } from '../../state/persistence';
import { track } from '../../lib/analytics';
import { t } from '../../lib/i18n';

/** 08 Done — verse hero + CTA into app home */
export default function DoneScreen() {
  const router = useRouter();
  const actor = useOnboardingActor();
  const startedAt = useRef(Date.now());

  useEffect(() => {
    (async () => {
      try {
        await completeOnboarding(actor.getSnapshot().context);
        await clearDraft();
      } catch {
        // best-effort; server retry handled by api wrapper
      }
    })();
  }, [actor]);

  const startExplore = () => {
    track('onboarding_completed', {
      totalDurationMs: Date.now() - startedAt.current,
      modeCount: actor.getSnapshot().context.selectedModes.length,
    });
    actor.send({ type: 'START_EXPLORE' });
    router.replace('/(tabs)');
  };

  return (
    <View style={{ flex: 1, justifyContent: 'space-between' }}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: tokens.space[7],
          paddingTop: tokens.space[10],
          paddingBottom: tokens.space[8],
          gap: tokens.space[7],
        }}
      >
        <Text
          accessibilityRole="header"
          style={{
            fontFamily: tokens.font.display,
            fontSize: tokens.size.display.xl,
            lineHeight: tokens.lineHeight.display.xl,
            color: tokens.color.text.primary,
          }}
        >
          {t('done.title')}
        </Text>
        <VerseCard
          variant="hero"
          text="Sebab Aku ini mengetahui rancangan-rancangan-Ku tentang kamu, demikianlah firman TUHAN, yaitu rancangan damai sejahtera dan bukan rancangan kecelakaan, untuk memberikan kepadamu hari depan yang penuh harapan."
          reference="Yeremia 29:11 (TB)"
        />
      </ScrollView>
      <View
        style={{
          paddingHorizontal: tokens.space[7],
          paddingBottom: tokens.space[9],
          gap: tokens.space[5],
        }}
      >
        <Pressable
          accessibilityRole="button"
          onPress={startExplore}
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
            {t('done.cta')}
          </Text>
        </Pressable>
        {/* Anti-dark-pattern: skip is a tertiary visible link, never hidden */}
        <Link
          href="/(tabs)"
          style={{
            fontFamily: tokens.font.body,
            fontSize: tokens.size.body.md,
            color: tokens.color.text.tertiary,
            textAlign: 'center',
          }}
        >
          {t('done.skip')}
        </Link>
      </View>
    </View>
  );
}
