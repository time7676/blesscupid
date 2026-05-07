import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useTranslation } from '../../../i18n/init.js';
import { color, space, radius, type as type_ } from '../../../lib/design-system/tokens.js';

interface Props {
  step: number;
  total: number;
  onNext: (n: number, body: {
    photoStorageKey: string;
    bio?: string;
    covenantAccepted: true;
  }) => Promise<void>;
  submitting: boolean;
}

export function Card8Photo({ step, total, onNext, submitting }: Props) {
  const { t } = useTranslation();
  const [photoKey, setPhotoKey] = useState('');
  const [bio, setBio] = useState('');
  const [covenantAccepted, setCovenantAccepted] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const valid = photoKey.length > 0 && covenantAccepted && ageConfirmed;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.eyebrow}>STEP {step} of {total}</Text>
      <Text style={styles.title}>{t('v1.onboarding.card8.title')}</Text>
      <Text style={styles.body}>{t('v1.onboarding.card8.body')}</Text>

      <Pressable style={styles.photoSlot} onPress={() => setPhotoKey('placeholder/photo-key')}>
        <Text style={styles.photoSlotLabel}>{photoKey ? '✓ Photo selected' : '+ Add photo'}</Text>
      </Pressable>

      <Text style={styles.label}>About you</Text>
      <TextInput
        value={bio}
        onChangeText={setBio}
        multiline
        numberOfLines={3}
        maxLength={140}
        placeholder="One sentence about you (optional)"
        placeholderTextColor={color.ink.soft}
        style={styles.bioInput}
      />
      <Text style={styles.counter}>{bio.length}/140</Text>

      <View style={styles.switchRow}>
        <Switch value={covenantAccepted} onValueChange={setCovenantAccepted} />
        <Text style={styles.switchLabel}>I accept the Holy Code</Text>
      </View>
      <View style={styles.switchRow}>
        <Switch value={ageConfirmed} onValueChange={setAgeConfirmed} />
        <Text style={styles.switchLabel}>I am 18 or older</Text>
      </View>

      <Pressable
        onPress={() => valid && !submitting && onNext(step, {
          photoStorageKey: photoKey,
          ...(bio.trim() ? { bio: bio.trim() } : {}),
          covenantAccepted: true,
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
  photoSlot: { height: 200, borderRadius: radius.xl, borderWidth: 2, borderStyle: 'dashed' as const, borderColor: color.hairline.strong, alignItems: 'center', justifyContent: 'center', backgroundColor: color.parchment.raised, marginBottom: space.s5 },
  photoSlotLabel: { ...type_.label, color: color.ink.soft },
  label: { ...type_.label, color: color.ink.soft, marginBottom: space.s2 },
  bioInput: { ...type_.body, color: color.ink.default, backgroundColor: color.parchment.raised, borderRadius: radius.sm, borderWidth: 1, borderColor: color.hairline.default, padding: space.s4, minHeight: 80, textAlignVertical: 'top' as const },
  counter: { ...type_.caption, color: color.ink.soft, alignSelf: 'flex-end' as const, marginTop: space.s1 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: space.s3, marginTop: space.s5 },
  switchLabel: { ...type_.body, color: color.ink.default },
  continueBtn: { backgroundColor: color.ink.default, paddingVertical: space.s4, borderRadius: radius.lg, alignItems: 'center', marginTop: space.s7 },
  continueBtnDisabled: { opacity: 0.4 },
  continueLabel: { ...type_.label, color: color.parchment.raised },
});
