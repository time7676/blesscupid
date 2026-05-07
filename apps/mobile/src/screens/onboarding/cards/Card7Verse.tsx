import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from '../../../i18n/init.js';
import { color, space, radius, type as type_ } from '../../../lib/design-system/tokens.js';
import { fetchVerseSuggestions } from '../../../lib/api-onboarding.js';

interface VerseChoice {
  ref: string;
  text: string;
  attribution: string;
}

interface Props {
  step: number;
  total: number;
  onNext: (n: number, body: { verseRef: string; q7: string }) => Promise<void>;
  submitting: boolean;
}

export function Card7Verse({ step, total, onNext, submitting }: Props) {
  const { t } = useTranslation();
  const [verses, setVerses] = useState<VerseChoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const list = await fetchVerseSuggestions();
        if (active) setVerses(list);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={color.ink.default} /></View>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>STEP {step} of {total}</Text>
      <Text style={styles.title}>{t('v1.onboarding.card7.title')}</Text>
      <Text style={styles.body}>{t('v1.onboarding.card7.body')}</Text>
      <FlatList
        data={verses}
        keyExtractor={(v) => v.ref}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const isSelected = selected === item.ref;
          return (
            <Pressable onPress={() => setSelected(item.ref)} style={[styles.verseCard, isSelected && styles.verseCardSelected]}>
              <Text style={styles.verseEyebrow}>{item.ref}</Text>
              <Text style={styles.verseText}>{item.text}</Text>
              <Text style={styles.verseAttr}>{item.attribution}</Text>
            </Pressable>
          );
        }}
      />
      <Pressable
        onPress={() => selected && !submitting && onNext(step, { verseRef: selected, q7: selected })}
        disabled={!selected || submitting}
        style={[styles.continueBtn, (!selected || submitting) && styles.continueBtnDisabled]}
      >
        <Text style={styles.continueLabel}>{t('v1.common.continue')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: space.s7, backgroundColor: color.parchment.default },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: color.parchment.default },
  eyebrow: { ...type_.eyebrow, color: color.ink.soft, marginBottom: space.s4 },
  title: { ...type_.h2, color: color.ink.default, marginBottom: space.s3 },
  body: { ...type_.bodyLg, color: color.ink.soft, marginBottom: space.s5 },
  list: { gap: space.s4, paddingBottom: space.s5 },
  verseCard: { padding: space.s5, backgroundColor: color.sandstone.warm, borderRadius: radius.xl, borderWidth: 1, borderColor: color.hairline.default },
  verseCardSelected: { borderColor: color.gold.default, borderWidth: 2 },
  verseEyebrow: { ...type_.eyebrow, color: color.gold.default, marginBottom: space.s2 },
  verseText: { ...type_.bodyLg, color: color.ink.default, fontStyle: 'italic' as const, marginBottom: space.s2 },
  verseAttr: { ...type_.caption, color: color.ink.soft },
  continueBtn: { backgroundColor: color.ink.default, paddingVertical: space.s4, borderRadius: radius.lg, alignItems: 'center', marginTop: space.s4 },
  continueBtnDisabled: { opacity: 0.4 },
  continueLabel: { ...type_.label, color: color.parchment.raised },
});
