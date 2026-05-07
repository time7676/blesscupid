import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from '../../../i18n/init.js';
import { color, space, radius, type as type_ } from '../../../lib/design-system/tokens.js';

interface Props {
  onContinue: () => void;
}

export function OnboardingDone({ onContinue }: Props) {
  const { t } = useTranslation();

  // 4s auto-advance per DESIGN.md (skill: don't trap the user)
  useEffect(() => {
    const id = setTimeout(onContinue, 4000);
    return () => clearTimeout(id);
  }, [onContinue]);

  return (
    <View style={styles.container}>
      <Text style={styles.headline}>{t('v1.onboarding.done.headline')}</Text>
      <Text style={styles.body}>{t('v1.onboarding.done.body')}</Text>
      <Pressable onPress={onContinue} style={styles.btn}>
        <Text style={styles.btnLabel}>{t('v1.onboarding.done.openToday')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.s7, backgroundColor: color.parchment.raised, gap: space.s5 },
  headline: { ...type_.hero, color: color.ink.default, textAlign: 'center' as const },
  body: { ...type_.bodyLg, color: color.ink.soft, textAlign: 'center' as const },
  btn: { backgroundColor: color.ink.default, paddingVertical: space.s4, paddingHorizontal: space.s7, borderRadius: radius.lg, marginTop: space.s5 },
  btnLabel: { ...type_.label, color: color.parchment.raised },
});
