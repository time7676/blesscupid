// Shared 4-chip whimsy card for onboarding cards 1/3/5/7.
//
// Garden Hours direction: Cormorant H2 title, Inter body, sandstone-warm
// pill chips, gold border on tap, ink Continue button. No illustrations
// in v1 stub — placeholder Eyebrow shows the chip key for now; designers
// can drop in `assets/onboarding/{key}.svg` later.

import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from '../../../i18n/init.js';
import { color, space, radius, type as type_ } from '../../../lib/design-system/tokens.js';

export interface WhimsicalCardProps<T extends string> {
  step: number;
  total: number;
  titleKey: string;
  bodyKey: string;
  options: ReadonlyArray<{ value: T; labelKey: string }>;
  fieldName: string; // e.g., 'q1', 'q3', 'q5'
  onNext: (n: number, body: Record<string, T>) => Promise<void>;
  submitting: boolean;
}

export function WhimsicalCard<T extends string>({
  step,
  total,
  titleKey,
  bodyKey,
  options,
  fieldName,
  onNext,
  submitting,
}: WhimsicalCardProps<T>) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<T | null>(null);

  const handleContinue = async () => {
    if (!selected || submitting) return;
    await onNext(step, { [fieldName]: selected } as Record<string, T>);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.eyebrow}>STEP {step} of {total}</Text>
      <Text style={styles.title}>{t(titleKey)}</Text>
      <Text style={styles.body}>{t(bodyKey)}</Text>
      <View style={styles.chips}>
        {options.map((opt) => {
          const isSelected = selected === opt.value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => setSelected(opt.value)}
              style={[styles.chip, isSelected && styles.chipSelected]}
            >
              <Text style={[styles.chipLabel, isSelected && styles.chipLabelSelected]}>
                {t(opt.labelKey)}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={handleContinue}
        disabled={!selected || submitting}
        style={[styles.continueBtn, (!selected || submitting) && styles.continueBtnDisabled]}
      >
        <Text style={styles.continueLabel}>{t('v1.common.continue')}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: space.s7, justifyContent: 'space-between', backgroundColor: color.parchment.default },
  eyebrow: { ...type_.eyebrow, color: color.ink.soft, marginBottom: space.s4 },
  title: { ...type_.h2, color: color.ink.default, marginBottom: space.s3 },
  body: { ...type_.bodyLg, color: color.ink.soft, marginBottom: space.s7 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.s4, justifyContent: 'center' },
  chip: { paddingHorizontal: space.s5, paddingVertical: space.s4, borderRadius: radius.pill, backgroundColor: color.sandstone.warm, borderWidth: 1, borderColor: color.hairline.default, minWidth: 140, alignItems: 'center' },
  chipSelected: { borderColor: color.gold.default, borderWidth: 2 },
  chipLabel: { ...type_.label, color: color.ink.default },
  chipLabelSelected: { color: color.ink.charcoal, fontWeight: '600' as const },
  continueBtn: { backgroundColor: color.ink.default, paddingVertical: space.s4, borderRadius: radius.lg, alignItems: 'center', marginTop: space.s7 },
  continueBtnDisabled: { opacity: 0.4 },
  continueLabel: { ...type_.label, color: color.parchment.raised },
});
