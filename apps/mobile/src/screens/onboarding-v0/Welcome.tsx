import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Button,
  Screen,
  color,
  fontFamily,
  fontSize,
  letterSpacingFor,
  lineHeight,
  space,
  tracking,
  type as typeTokens,
} from '../../lib/design-system/index.js';
import type { OnboardingStackParamList } from '../../navigation/types.js';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'V0Welcome'>;

export function V0WelcomeScreen({ navigation }: Props) {
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.eyebrow}>WELCOME</Text>
        <Text style={styles.headline}>
          {'A different kind of\n'}
          <Text style={styles.headlineEm}>dating.</Text>
        </Text>
        <Text style={styles.lede}>
          BlessCupid holds three profiles for you each day, chosen with care. There is no infinite
          scroll, no streaks, no urgency. Just the time to listen well.
        </Text>
        <View style={styles.bullets}>
          <Bullet text="Faith-first matching, not selfie-first." />
          <Bullet text="Every message is moderated before it lands." />
          <Bullet text="Three profiles a day. The rest can wait." />
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <Button label="Begin" full onPress={() => navigation.navigate('V0Tradition')} />
        <Text style={styles.smallprint}>
          We use a few short questions to understand your rhythm of faith. Skip any that don't fit.
        </Text>
      </View>
    </Screen>
  );
}

function Bullet({ text }: { text: string }) {
  return (
    <View style={styles.bulletRow}>
      <View style={styles.bulletPip} />
      <Text style={styles.bulletText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingTop: space.s8,
    paddingHorizontal: space.s7,
    paddingBottom: space.s7,
  },
  eyebrow: {
    ...typeTokens.eyebrow,
    color: color.ink.soft,
  },
  headline: {
    ...typeTokens.hero,
    color: color.ink.default,
    marginTop: space.s4,
  },
  headlineEm: {
    fontFamily: fontFamily.serifMediumItalic,
    color: color.indigo.default,
  },
  lede: {
    ...typeTokens.bodyLg,
    color: color.ink.soft,
    marginTop: space.s6,
  },
  bullets: {
    marginTop: space.s7,
    gap: space.s3,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.s3,
  },
  bulletPip: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: color.gold.default,
    marginTop: 9,
  },
  bulletText: {
    flex: 1,
    fontFamily: fontFamily.sans,
    fontSize: fontSize.body,
    lineHeight: lineHeight.body,
    color: color.ink.default,
  },
  footer: {
    paddingHorizontal: space.s6,
    paddingBottom: space.s7,
    paddingTop: space.s4,
    gap: space.s4,
  },
  smallprint: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.caption,
    color: color.ink.soft,
    lineHeight: lineHeight.body,
    letterSpacing: letterSpacingFor(tracking.normal, fontSize.caption),
  },
});
