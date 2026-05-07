import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from '../../../i18n/init.js';
import { color, space, radius, type as type_ } from '../../../lib/design-system/tokens.js';

interface Props {
  step: number;
  total: number;
  onNext: (n: number, body: { displayName: string; dob: string }) => Promise<void>;
  submitting: boolean;
}

export function Card2NameDob({ step, total, onNext, submitting }: Props) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [dob, setDob] = useState(''); // ISO YYYY-MM-DD
  const valid = name.trim().length >= 2 && /^\d{4}-\d{2}-\d{2}$/.test(dob);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.eyebrow}>STEP {step} of {total}</Text>
      <Text style={styles.title}>{t('v1.onboarding.card2.title')}</Text>
      <Text style={styles.body}>{t('v1.onboarding.card2.body')}</Text>
      <View style={styles.field}>
        <Text style={styles.label}>{t('v1.onboarding.card2.title')}</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Your name"
          placeholderTextColor={color.ink.soft}
          style={styles.input}
        />
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>YYYY-MM-DD</Text>
        <TextInput
          value={dob}
          onChangeText={setDob}
          placeholder="2000-01-15"
          placeholderTextColor={color.ink.soft}
          style={styles.input}
          autoCapitalize="none"
        />
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={() => valid && !submitting && onNext(step, { displayName: name.trim(), dob })}
        disabled={!valid || submitting}
        style={[styles.continueBtn, (!valid || submitting) && styles.continueBtnDisabled]}
      >
        <Text style={styles.continueLabel}>{t('v1.common.continue')}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: space.s7, backgroundColor: color.parchment.default },
  eyebrow: { ...type_.eyebrow, color: color.ink.soft, marginBottom: space.s4 },
  title: { ...type_.h2, color: color.ink.default, marginBottom: space.s3 },
  body: { ...type_.bodyLg, color: color.ink.soft, marginBottom: space.s7 },
  field: { marginBottom: space.s5 },
  label: { ...type_.label, color: color.ink.soft, marginBottom: space.s2 },
  input: { ...type_.body, color: color.ink.default, backgroundColor: color.parchment.raised, borderRadius: radius.sm, borderWidth: 1, borderColor: color.hairline.default, paddingHorizontal: space.s4, paddingVertical: space.s3, minHeight: 44 },
  continueBtn: { backgroundColor: color.ink.default, paddingVertical: space.s4, borderRadius: radius.lg, alignItems: 'center', marginTop: space.s7 },
  continueBtnDisabled: { opacity: 0.4 },
  continueLabel: { ...type_.label, color: color.parchment.raised },
});
