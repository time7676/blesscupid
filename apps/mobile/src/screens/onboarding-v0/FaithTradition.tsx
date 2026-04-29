import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Button,
  RadioCard,
  Screen,
  StepRail,
  color,
  fontFamily,
  space,
  type as typeTokens,
} from '../../lib/design-system/index.js';
import type { OnboardingStackParamList } from '../../navigation/types.js';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'V0Tradition'>;

// v0 placeholders only — Pastor week-4 owns the final question + sub copy.
const OPTIONS = [
  {
    key: 'catholic',
    label: 'Catholic',
    sub: 'Mass, sacraments, the church year carries the rhythm.',
  },
  {
    key: 'protestant',
    label: 'Protestant',
    sub: 'Baptist, evangelical, Reformed, Pentecostal, non-denominational.',
  },
  {
    key: 'orthodox',
    label: 'Orthodox',
    sub: 'Eastern, Oriental, or another orthodox tradition.',
  },
  {
    key: 'still-finding',
    label: "I'm still finding my way",
    sub: 'Faith matters, but the practice is a work in progress.',
  },
] as const;

export function V0FaithTraditionScreen({ navigation }: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <Screen>
      <StepRail current={1} total={4} eyebrow="A little about your faith" />
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.question}>
          {'Where does your\nfaith '}
          <Text style={styles.questionEm}>begin?</Text>
        </Text>
        <Text style={styles.helper}>
          No wrong answer. We use this to suggest people whose tradition feels close to yours.
        </Text>
        <View style={styles.options}>
          {OPTIONS.map((opt) => (
            <RadioCard
              key={opt.key}
              label={opt.label}
              sub={opt.sub}
              selected={selected === opt.key}
              onPress={() => setSelected(opt.key)}
            />
          ))}
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <Button
          label="Skip for now"
          variant="ghost"
          onPress={() => navigation.navigate('V0Statement', { tradition: 'unspecified' })}
        />
        <Button
          label="Continue"
          disabled={!selected}
          onPress={() =>
            selected
              ? navigation.navigate('V0Statement', { tradition: selected })
              : undefined
          }
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: space.s7,
    paddingTop: space.s5,
    paddingBottom: space.s6,
  },
  question: {
    ...typeTokens.hero,
    color: color.ink.default,
  },
  questionEm: {
    fontFamily: fontFamily.serifMediumItalic,
    color: color.indigo.default,
  },
  helper: {
    ...typeTokens.body,
    color: color.ink.soft,
    paddingTop: space.s4,
  },
  options: {
    paddingTop: space.s7,
    gap: space.s3,
  },
  footer: {
    paddingHorizontal: space.s6,
    paddingBottom: space.s7,
    paddingTop: space.s3,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: space.s4,
  },
});
