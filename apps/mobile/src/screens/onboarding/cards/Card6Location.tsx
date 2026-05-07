import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from '../../../i18n/init.js';
import { color, space, radius, type as type_ } from '../../../lib/design-system/tokens.js';

interface Props {
  step: number;
  total: number;
  onNext: (n: number, body: {
    lat?: number; lng?: number;
    city: string; countryCode: string;
    homeChurchName?: string;
  }) => Promise<void>;
  submitting: boolean;
}

export function Card6Location({ step, total, onNext, submitting }: Props) {
  const { t } = useTranslation();
  const [city, setCity] = useState('');
  const [countryCode, setCountryCode] = useState('ID'); // default Indonesia (primary market)
  const [homeChurch, setHomeChurch] = useState('');
  const valid = city.trim().length >= 2 && /^[A-Z]{2}$/.test(countryCode);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.eyebrow}>STEP {step} of {total}</Text>
      <Text style={styles.title}>{t('v1.onboarding.card6.title')}</Text>
      <Text style={styles.body}>{t('v1.onboarding.card6.body')}</Text>

      <Text style={styles.label}>City</Text>
      <TextInput value={city} onChangeText={setCity} placeholder="Denpasar" placeholderTextColor={color.ink.soft} style={styles.input} />

      <Text style={styles.label}>Country (ISO 2-char)</Text>
      <TextInput value={countryCode} onChangeText={(v) => setCountryCode(v.toUpperCase().slice(0, 2))} placeholder="ID" placeholderTextColor={color.ink.soft} style={styles.input} autoCapitalize="characters" />

      <Text style={styles.label}>{t('v1.you.editProfile')} — Home church (optional)</Text>
      <TextInput value={homeChurch} onChangeText={setHomeChurch} placeholder="St Mary's Catholic Church" placeholderTextColor={color.ink.soft} style={styles.input} />

      <Pressable
        onPress={() => valid && !submitting && onNext(step, {
          city: city.trim(),
          countryCode,
          ...(homeChurch.trim() ? { homeChurchName: homeChurch.trim() } : {}),
        })}
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
  body: { ...type_.bodyLg, color: color.ink.soft, marginBottom: space.s5 },
  label: { ...type_.label, color: color.ink.soft, marginTop: space.s4, marginBottom: space.s2 },
  input: { ...type_.body, color: color.ink.default, backgroundColor: color.parchment.raised, borderRadius: radius.sm, borderWidth: 1, borderColor: color.hairline.default, paddingHorizontal: space.s4, paddingVertical: space.s3, minHeight: 44 },
  continueBtn: { backgroundColor: color.ink.default, paddingVertical: space.s4, borderRadius: radius.lg, alignItems: 'center', marginTop: space.s7 },
  continueBtnDisabled: { opacity: 0.4 },
  continueLabel: { ...type_.label, color: color.parchment.raised },
});
