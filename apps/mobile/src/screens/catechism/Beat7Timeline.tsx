import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { palette, spacing } from '../../theme/tokens.js';
import { useLocale } from '../../i18n/locale-store.js';
import { catechismCopy, type MarriageTimeline } from '../../i18n/catechism.js';
import { useCatechism } from '../../lib/catechism-store.js';
import {
  Button,
  Eyebrow,
  RadioCard,
  Screen,
  SubText,
  Title,
  TopBar,
} from '../../components/catechism/index.js';
import type { CatechismStackParamList } from '../../navigation/types.js';

type Props = NativeStackScreenProps<CatechismStackParamList, 'CatechismBeat7Timeline'>;

const TIMELINES: MarriageTimeline[] = ['within_1y', '1_3y', '3y_plus', 'unsure'];

export function CatechismBeat7Timeline({ navigation }: Props) {
  const { locale } = useLocale();
  const t = catechismCopy[locale].beat7;
  const { marriageTimeline, setMarriageTimeline } = useCatechism();

  return (
    <Screen
      topBar={<TopBar step={7} onBack={() => navigation.goBack()} showLangPill />}
      stickyFooter={
        <Button
          label={t.cta}
          disabled={!marriageTimeline}
          onPress={() => navigation.navigate('CatechismBeat8Welcome')}
        />
      }
    >
      <Eyebrow>{t.eyebrow}</Eyebrow>
      <Title>{t.title}</Title>
      <SubText>{t.sub}</SubText>

      <View style={styles.stack}>
        {TIMELINES.map((tl) => {
          const opt = t.timelines[tl];
          return (
            <RadioCard
              key={tl}
              label={opt.label}
              sub={opt.sub}
              checked={marriageTimeline === tl}
              onPress={() => setMarriageTimeline(tl)}
            />
          );
        })}
      </View>

      <Text style={styles.quietNote}>{t.quietNote}</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stack: { gap: spacing.s4 },
  quietNote: {
    fontFamily: 'Source Serif 4',
    fontStyle: 'italic',
    fontSize: 13,
    lineHeight: 19,
    color: palette.stone500,
    textAlign: 'center',
    marginTop: spacing.s5,
    marginHorizontal: spacing.s4,
  },
});
