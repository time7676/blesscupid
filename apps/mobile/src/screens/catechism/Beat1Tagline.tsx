import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { palette, spacing } from '../../theme/tokens.js';
import { useLocale } from '../../i18n/locale-store.js';
import { catechismCopy } from '../../i18n/catechism.js';
import { Button, MorningHero, Screen, TopBar } from '../../components/catechism/index.js';
import type { CatechismStackParamList } from '../../navigation/types.js';

type Props = NativeStackScreenProps<CatechismStackParamList, 'CatechismBeat1Tagline'>;

export function CatechismBeat1Tagline({ navigation }: Props) {
  const { locale } = useLocale();
  const t = catechismCopy[locale].beat1;

  return (
    <Screen
      topBar={<TopBar step={0} showLangPill />}
      hero={<MorningHero showWordmark wordmark={t.wordmark} />}
      stickyFooter={
        <>
          <Button label={t.primaryCta} onPress={() => navigation.navigate('CatechismBeat2Modes')} />
          <Button
            label={t.signInCta}
            variant="text"
            onPress={() => navigation.getParent()?.navigate('Login')}
          />
          <Text style={styles.legal}>{t.legal}</Text>
        </>
      }
    >
      <View style={styles.lines}>
        {/*
          Constraint 9: three lines, identical Source Serif 4, 22/30, weight 500, cobalt-900.
          Line 3 must NOT visually de-rank.
          Advisory C: line-1 highlight via gold-100 background ONLY (no bold/color shift).
        */}
        <Text style={styles.line}>
          <Text style={styles.highlight}>{t.line1Em}</Text>
          {t.line1Post}
        </Text>
        <Text style={styles.line}>{t.line2}</Text>
        <Text style={styles.line}>{t.line3}</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  lines: {
    paddingTop: spacing.s8,
    gap: 18,
    marginBottom: spacing.s8,
  },
  line: {
    fontFamily: 'Source Serif 4',
    fontSize: 22,
    lineHeight: 30,
    fontWeight: '500',
    color: palette.cobalt900,
  },
  highlight: {
    backgroundColor: palette.gold100,
  },
  legal: {
    fontFamily: 'Inter',
    fontSize: 12,
    lineHeight: 18,
    color: palette.stone500,
    textAlign: 'center',
    marginTop: spacing.s5,
  },
});
