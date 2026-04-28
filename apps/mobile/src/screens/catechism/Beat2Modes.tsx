import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { palette, spacing } from '../../theme/tokens.js';
import { useLocale } from '../../i18n/locale-store.js';
import { catechismCopy, type Mode } from '../../i18n/catechism.js';
import { useCatechism } from '../../lib/catechism-store.js';
import { Button, Eyebrow, ModeCard, Screen, SubText, Title, TopBar } from '../../components/catechism/index.js';
import type { CatechismStackParamList } from '../../navigation/types.js';

type Props = NativeStackScreenProps<CatechismStackParamList, 'CatechismBeat2Modes'>;

const MODES: Mode[] = ['friendship', 'community', 'marriage'];

export function CatechismBeat2Modes({ navigation }: Props) {
  const { locale } = useLocale();
  const t = catechismCopy[locale].beat2;
  const { selectedModes, toggleMode } = useCatechism();

  const canContinue = selectedModes.size >= 1;

  return (
    <Screen
      topBar={<TopBar step={2} onBack={() => navigation.goBack()} showLangPill />}
      stickyFooter={
        <Button label={t.cta} onPress={() => navigation.navigate('CatechismBeat3Preview')} disabled={!canContinue} />
      }
    >
      <Eyebrow>{t.eyebrow}</Eyebrow>
      <Title>{t.title}</Title>
      <SubText>{t.sub}</SubText>

      <View style={styles.stack}>
        {MODES.map((m) => {
          const card = t.modes[m];
          return (
            <ModeCard
              key={m}
              title={card.title}
              desc={card.desc}
              citation={card.citation || undefined}
              pressed={selectedModes.has(m)}
              onPress={() => toggleMode(m)}
            />
          );
        })}
      </View>

      <Text style={styles.footer}>{t.footer}</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stack: { gap: spacing.s4 },
  footer: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: palette.stone500,
    textAlign: 'center',
    marginTop: spacing.s6,
    marginBottom: spacing.s7,
  },
});
