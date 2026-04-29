import { StyleSheet, Text, View, Pressable } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { elevation, palette, radius, spacing } from '../../theme/tokens.js';
import { useLocale } from '../../i18n/locale-store.js';
import { catechismCopy } from '../../i18n/catechism.js';
import { useCatechism } from '../../lib/catechism-store.js';
import { Ack, Button, Eyebrow, Screen, Title, TopBar } from '../../components/catechism/index.js';
import type { CatechismStackParamList } from '../../navigation/types.js';

type Props = NativeStackScreenProps<CatechismStackParamList, 'CatechismBeat3Preview'>;

export function CatechismBeat3Preview({ navigation }: Props) {
  const { locale } = useLocale();
  const t = catechismCopy[locale].beat3;
  const { ackChecked, setAck } = useCatechism();

  return (
    <Screen
      topBar={<TopBar step={3} onBack={() => navigation.goBack()} showLangPill />}
      stickyFooter={
        <>
          <Button
            label={t.primaryCta}
            disabled={!ackChecked}
            onPress={() => navigation.navigate('CatechismBeat5Photo')}
          />
          <Button
            label={t.ghostCta}
            variant="ghost"
            onPress={() => navigation.navigate('CatechismBeat4Full')}
          />
        </>
      }
    >
      <Eyebrow>{t.eyebrow}</Eyebrow>
      <Title>{t.title}</Title>

      {/*
        Constraint 5: collapsed preview MUST show all three doctrinal heads
        ABOVE the expand control AND ack-checkbox.
        Reading order: intro → 3 doctrines → optional expand → ack → CTA.
      */}
      <View style={styles.doctrine}>
        <Text style={styles.intro}>{t.intro}</Text>

        <View>
          {t.doctrines.map((d, i) => (
            <View key={d.num} style={[styles.item, i === 0 && styles.itemFirst]}>
              <Text style={styles.num}>{d.num}</Text>
              <View style={styles.itemBody}>
                <Text style={styles.head}>{d.head}</Text>
                <Text style={styles.line}>{d.line}</Text>
              </View>
            </View>
          ))}
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate('CatechismBeat4Full')}
          style={styles.expand}
        >
          <Text style={styles.expandLabel}>{t.expandCta}</Text>
          <Text style={styles.expandChev}>⌄</Text>
        </Pressable>
      </View>

      <Ack
        checked={ackChecked}
        onChange={setAck}
        label={t.ackLabel}
        helper={
          <Text style={styles.helper}>
            {t.ackHelperPre}
            <Text style={styles.helperBold}>{t.ackHelperBold}</Text>
            {'.'}
          </Text>
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  doctrine: {
    backgroundColor: palette.white,
    borderRadius: radius.xl,
    padding: spacing.s6,
    paddingBottom: 4,
    marginBottom: spacing.s5,
    ...elevation.level1,
  },
  intro: {
    fontFamily: 'Source Serif 4',
    fontSize: 17,
    lineHeight: 26,
    fontWeight: '500',
    color: palette.cobalt900,
    marginBottom: spacing.s5,
  },
  item: {
    flexDirection: 'row',
    gap: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: palette.cream200,
  },
  itemFirst: { borderTopWidth: 0, paddingTop: 4 },
  num: {
    fontFamily: 'Source Serif 4',
    fontSize: 18,
    fontWeight: '500',
    color: palette.gold700,
    width: 28,
    lineHeight: 22,
  },
  itemBody: { flex: 1 },
  head: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 15,
    color: palette.cobalt900,
    marginBottom: 2,
  },
  line: {
    fontFamily: 'Inter',
    fontSize: 14,
    lineHeight: 21,
    color: palette.stone900,
  },
  expand: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 44,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: palette.cream200,
    marginTop: 4,
  },
  expandLabel: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    color: palette.cobalt700,
  },
  expandChev: {
    color: palette.cobalt700,
    fontSize: 14,
    lineHeight: 14,
  },
  helper: {
    fontFamily: 'Inter',
    fontSize: 12,
    lineHeight: 18,
    color: palette.stone500,
  },
  helperBold: {
    fontWeight: '600',
    color: palette.stone700,
  },
});
