import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from '../../../i18n/init.js';
import { color, space, radius, type as type_ } from '../../../lib/design-system/tokens.js';

type Gender = 'male' | 'female';
type Tradition = 'catholic' | 'protestant' | 'orthodox' | 'nondenom';

export interface Card4Body {
  gender: Gender;
  seeking: Gender;
  tradition: Tradition;
}

interface Props {
  step: number;
  total: number;
  onNext: (n: number, body: Card4Body) => Promise<void>;
  submitting: boolean;
}

const GENDER_OPTIONS: ReadonlyArray<{ value: Gender; labelKey: string }> = [
  { value: 'male', labelKey: 'v1.onboarding.options.male' },
  { value: 'female', labelKey: 'v1.onboarding.options.female' },
];
const TRADITION_OPTIONS: ReadonlyArray<{ value: Tradition; labelKey: string }> = [
  { value: 'catholic', labelKey: 'v1.onboarding.options.catholic' },
  { value: 'protestant', labelKey: 'v1.onboarding.options.protestant' },
  { value: 'orthodox', labelKey: 'v1.onboarding.options.orthodox' },
  { value: 'nondenom', labelKey: 'v1.onboarding.options.nondenom' },
];

export function Card4Identity({ step, total, onNext, submitting }: Props) {
  const { t } = useTranslation();
  const [gender, setGender] = useState<Gender | null>(null);
  const [seeking, setSeeking] = useState<Gender | null>(null);
  const [tradition, setTradition] = useState<Tradition | null>(null);
  const valid = gender && seeking && tradition;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.eyebrow}>STEP {step} of {total}</Text>
      <Text style={styles.title}>{t('v1.onboarding.card4.title')}</Text>
      <Text style={styles.body}>{t('v1.onboarding.card4.body')}</Text>

      <Text style={styles.section}>I am</Text>
      <View style={styles.row}>
        {GENDER_OPTIONS.map((opt) => (
          <Chip key={opt.value} selected={gender === opt.value} label={t(opt.labelKey)} onPress={() => setGender(opt.value)} />
        ))}
      </View>

      <Text style={styles.section}>Looking for</Text>
      <View style={styles.row}>
        {GENDER_OPTIONS.map((opt) => (
          <Chip key={opt.value} selected={seeking === opt.value} label={t(opt.labelKey)} onPress={() => setSeeking(opt.value)} />
        ))}
      </View>

      <Text style={styles.section}>Tradition</Text>
      <View style={styles.row}>
        {TRADITION_OPTIONS.map((opt) => (
          <Chip key={opt.value} selected={tradition === opt.value} label={t(opt.labelKey)} onPress={() => setTradition(opt.value)} />
        ))}
      </View>

      <Pressable
        onPress={() => valid && !submitting && onNext(step, { gender: gender!, seeking: seeking!, tradition: tradition! })}
        disabled={!valid || submitting}
        style={[styles.continueBtn, (!valid || submitting) && styles.continueBtnDisabled]}
      >
        <Text style={styles.continueLabel}>{t('v1.common.continue')}</Text>
      </Pressable>
    </ScrollView>
  );
}

function Chip({ selected, label, onPress }: { selected: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, selected && styles.chipSelected]}>
      <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: space.s7, backgroundColor: color.parchment.default },
  eyebrow: { ...type_.eyebrow, color: color.ink.soft, marginBottom: space.s4 },
  title: { ...type_.h2, color: color.ink.default, marginBottom: space.s3 },
  body: { ...type_.bodyLg, color: color.ink.soft, marginBottom: space.s5 },
  section: { ...type_.label, color: color.ink.soft, marginTop: space.s5, marginBottom: space.s3 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: space.s3 },
  chip: { paddingHorizontal: space.s4, paddingVertical: space.s3, borderRadius: radius.pill, backgroundColor: color.sandstone.warm, borderWidth: 1, borderColor: color.hairline.default },
  chipSelected: { borderColor: color.gold.default, borderWidth: 2 },
  chipLabel: { ...type_.label, color: color.ink.default },
  chipLabelSelected: { fontWeight: '600' as const },
  continueBtn: { backgroundColor: color.ink.default, paddingVertical: space.s4, borderRadius: radius.lg, alignItems: 'center', marginTop: space.s8 },
  continueBtnDisabled: { opacity: 0.4 },
  continueLabel: { ...type_.label, color: color.parchment.raised },
});
