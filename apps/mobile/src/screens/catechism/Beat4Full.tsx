import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { elevation, palette, radius, spacing } from '../../theme/tokens.js';
import { useLocale } from '../../i18n/locale-store.js';
import { catechismCopy } from '../../i18n/catechism.js';
import { useCatechism } from '../../lib/catechism-store.js';
import { Button, Eyebrow, Screen, Title, TopBar, VerseCard } from '../../components/catechism/index.js';
import type { CatechismStackParamList } from '../../navigation/types.js';

type Props = NativeStackScreenProps<CatechismStackParamList, 'CatechismBeat4Full'>;

export function CatechismBeat4Full({ navigation }: Props) {
  const { locale } = useLocale();
  const t = catechismCopy[locale].beat4;
  const { setAck } = useCatechism();

  return (
    <Screen
      topBar={<TopBar step={3} onBack={() => navigation.goBack()} showLangPill />}
      stickyFooter={
        <>
          <Button
            label={t.primaryCta}
            onPress={() => {
              setAck(true);
              navigation.navigate('CatechismBeat5Photo');
            }}
          />
          <Button label={t.backCta} variant="text" onPress={() => navigation.goBack()} />
        </>
      }
    >
      <Eyebrow>{t.eyebrow}</Eyebrow>
      <Title>{t.title}</Title>

      <View style={styles.statement}>
        <Text style={styles.lede}>{t.lede}</Text>
        <Text style={styles.body}>{t.body}</Text>

        <View style={styles.verseWrap}>
          <VerseCard verse={t.verseQuote} reference={t.verseRef} />
        </View>

        <Text style={styles.close}>{t.closing}</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  statement: {
    backgroundColor: palette.white,
    borderRadius: radius.xl,
    padding: spacing.s7,
    ...elevation.level1,
  },
  lede: {
    fontFamily: 'Source Serif 4',
    fontSize: 18,
    lineHeight: 28,
    fontWeight: '500',
    color: palette.cobalt900,
    marginBottom: 14,
  },
  body: {
    fontFamily: 'Inter',
    fontSize: 14,
    lineHeight: 22,
    color: palette.stone900,
    marginBottom: 14,
  },
  verseWrap: {
    marginVertical: spacing.s5,
  },
  close: {
    fontFamily: 'Source Serif 4',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 24,
    color: palette.cobalt900,
  },
});
