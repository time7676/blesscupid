import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { tokens } from '../../lib/tokens';
import { useOnboardingActor } from './_layout';
import { RadioCard } from '../../components/onboarding/RadioCard';
import { shouldRenderMarriageTimeline } from '../../state/selectors';
import { track } from '../../lib/analytics';
import type { MarriageTimeline } from '../../state/onboardingMachine';
import { t } from '../../lib/i18n';

const OPTS: { value: MarriageTimeline; labelKey: string }[] = [
  { value: 'within_1y', labelKey: 'timeline.opt.within_1y' },
  { value: '1_to_3y', labelKey: 'timeline.opt.1_to_3y' },
  { value: 'over_3y', labelKey: 'timeline.opt.over_3y' },
  { value: 'unsure', labelKey: 'timeline.opt.unsure' },
];

/** 07a Marriage timeline — only when 'pacaran' ∈ selectedModes */
export default function MarriageTimelineScreen() {
  const router = useRouter();
  const actor = useOnboardingActor();
  const ctx = actor.getSnapshot().context;
  const [value, setValue] = useState<MarriageTimeline | null>(
    ctx.marriageTimeline ?? null,
  );

  // Defensive: if user landed here without Pacaran selected (deep link?),
  // bounce to done.
  useEffect(() => {
    if (!shouldRenderMarriageTimeline(ctx)) {
      router.replace('/onboarding/done');
    }
  }, [ctx, router]);

  const advance = () => {
    if (!value) return;
    actor.send({ type: 'MARRIAGE_TIMELINE_CHANGED', value });
    actor.send({ type: 'LANJUT' });
    track('onboarding_marriage_timeline_selected', { value });
    router.replace('/onboarding/done');
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
        {t('timeline.title')}
      </Text>
      <Text
        style={{
          fontFamily: tokens.font.body,
          fontSize: tokens.size.body.md,
          color: tokens.color.text.secondary,
        }}
      >
        {t('timeline.helper')}
      </Text>
      <View style={{ gap: tokens.space[4] }} accessibilityRole="radiogroup">
        {OPTS.map((opt) => (
          <RadioCard
            key={opt.value}
            value={opt.value}
            label={t(opt.labelKey as never)}
            selected={value === opt.value}
            onSelect={() => setValue(opt.value)}
          />
        ))}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: !value }}
        disabled={!value}
        onPress={advance}
        style={{
          minHeight: 56,
          backgroundColor: tokens.color.text.brand,
          borderRadius: tokens.radius.pill,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: value ? 1 : 0.4,
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
          {t('timeline.cta')}
        </Text>
      </Pressable>
    </ScrollView>
  );
}
