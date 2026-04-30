import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { tokens } from '../../lib/tokens';
import { useOnboardingActor } from './_layout';
import { ModeCard } from '../../components/onboarding/ModeCard';
import { track } from '../../lib/analytics';
import type { Mode } from '../../state/onboardingMachine';
import { t } from '../../lib/i18n';

const MODES: { mode: Mode; titleKey: string; descKey: string }[] = [
  { mode: 'pacaran', titleKey: 'modes.pacaran.title', descKey: 'modes.pacaran.desc' },
  {
    mode: 'persahabatan',
    titleKey: 'modes.persahabatan.title',
    descKey: 'modes.persahabatan.desc',
  },
  {
    mode: 'komunitas',
    titleKey: 'modes.komunitas.title',
    descKey: 'modes.komunitas.desc',
  },
];

/** 03 Mode pick */
export default function ModesScreen() {
  const router = useRouter();
  const actor = useOnboardingActor();
  const [selected, setSelected] = useState<Mode[]>(
    actor.getSnapshot().context.selectedModes,
  );

  const toggle = (m: Mode) => {
    setSelected((prev) => {
      const next = prev.includes(m)
        ? prev.filter((x) => x !== m)
        : prev.length < 3
        ? [...prev, m]
        : prev;
      actor.send({ type: 'MODES_CHANGED', modes: next });
      return next;
    });
  };

  const advance = () => {
    if (selected.length === 0) return;
    track('onboarding_modes_selected', { modes: selected });
    actor.send({ type: 'LANJUT' });
    router.push('/onboarding/faith-statement');
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
        {t('modes.title')}
      </Text>
      <Text
        style={{
          fontFamily: tokens.font.body,
          fontSize: tokens.size.body.md,
          color: tokens.color.text.secondary,
        }}
      >
        {t('modes.helper')}
      </Text>
      <View style={{ gap: tokens.space[4] }}>
        {MODES.map((m) => (
          <ModeCard
            key={m.mode}
            mode={m.mode}
            title={t(m.titleKey as never)}
            description={t(m.descKey as never)}
            icon={null}
            selected={selected.includes(m.mode)}
            onToggle={() => toggle(m.mode)}
            testID={`mode.${m.mode}`}
          />
        ))}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: selected.length === 0 }}
        disabled={selected.length === 0}
        onPress={advance}
        style={{
          minHeight: 56,
          backgroundColor: tokens.color.text.brand,
          borderRadius: tokens.radius.pill,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: selected.length === 0 ? 0.4 : 1,
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
          {t('modes.cta')}
        </Text>
      </Pressable>
    </ScrollView>
  );
}
