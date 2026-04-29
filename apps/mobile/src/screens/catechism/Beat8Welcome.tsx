import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { palette, spacing } from '../../theme/tokens.js';
import { useLocale } from '../../i18n/locale-store.js';
import { catechismCopy } from '../../i18n/catechism.js';
import {
  Button,
  MorningHero,
  Screen,
  TopBar,
  VerseCard,
} from '../../components/catechism/index.js';
import type { CatechismStackParamList } from '../../navigation/types.js';

type Props = NativeStackScreenProps<CatechismStackParamList, 'CatechismBeat8Welcome'>;

export function CatechismBeat8Welcome({ navigation, route }: Props) {
  const { locale } = useLocale();
  const t = catechismCopy[locale].beat8;
  const firstName = route.params?.firstName ?? 'Maria';

  return (
    <Screen
      topBar={<TopBar step={0} showLangPill />}
      hero={
        <MorningHero height={224}>
          <View style={styles.heroBody}>
            <Text style={styles.eyebrow}>{t.eyebrow}</Text>
            <Text style={styles.greet}>{t.greet(firstName)}</Text>
            <Text style={styles.greetSub}>{t.greetSub}</Text>
          </View>
        </MorningHero>
      }
      stickyFooter={
        <>
          <Button label={t.primaryCta} onPress={() => navigation.getParent()?.navigate('Profile')} />
          <Button
            label={t.profileCta}
            variant="text"
            onPress={() => navigation.getParent()?.navigate('Profile')}
          />
        </>
      }
    >
      <View style={styles.body}>
        <VerseCard eyebrow={t.votdEyebrow} verse={t.verseQuote} reference={t.verseRef} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroBody: {
    alignSelf: 'flex-start',
    width: '100%',
    paddingTop: spacing.s8,
  },
  eyebrow: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: palette.gold700,
    marginBottom: 8,
  },
  greet: {
    fontFamily: 'Source Serif 4',
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '500',
    color: palette.cobalt900,
    marginBottom: 8,
  },
  greetSub: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: palette.stone700,
  },
  body: {
    paddingTop: spacing.s6,
  },
});
