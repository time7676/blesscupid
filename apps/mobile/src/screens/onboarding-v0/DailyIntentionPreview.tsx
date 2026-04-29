import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  BottomNav,
  Button,
  Screen,
  StepRail,
  color,
  fontFamily,
  fontSize,
  letterSpacingFor,
  lineHeight,
  radius,
  space,
  tracking,
  type as typeTokens,
} from '../../lib/design-system/index.js';
import type { OnboardingStackParamList } from '../../navigation/types.js';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'V0DailyPreview'>;

// v0 placeholder verse — Pastor week-4 owns the live verse calendar.
const PLACEHOLDER_VERSE = '"Be still, and know that I am God."';
const PLACEHOLDER_CITE = 'Psalm 46:10 · NIV';

export function V0DailyIntentionPreviewScreen({ navigation }: Props) {
  return (
    <Screen edges={['top', 'left', 'right']}>
      <StepRail current={3} total={4} eyebrow="A taste of the daily rhythm" />
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.eyebrow}>HERE'S WHAT TODAY WILL LOOK LIKE</Text>
        <Text style={styles.headline}>
          {'Three profiles a day,\n'}
          <Text style={styles.headlineEm}>chosen with care.</Text>
        </Text>
        <View style={styles.card}>
          <View style={styles.badgeRail}>
            <View style={styles.pip} />
            <Text style={styles.pipLabel}>Daily intention</Text>
          </View>
          <Text style={styles.intentionHeadline}>
            We hold three profiles for you each morning. There is no rush.
          </Text>
          <Text style={styles.intentionBody}>
            Take a breath before you decide. The list does not refresh on swipe — only with
            tomorrow's parchment.
          </Text>
          <View style={styles.divider} />
          <Text style={styles.verseLabel}>Today's verse</Text>
          <Text style={styles.verse}>{PLACEHOLDER_VERSE}</Text>
          <Text style={styles.verseCite}>{PLACEHOLDER_CITE}</Text>
        </View>
        <Text style={styles.note}>
          The card you see at sign-in is rendered with the same tokens — gold pip, communion serif,
          parchment-raised surface. No streaks or counters anywhere.
        </Text>
      </ScrollView>
      <View style={styles.footer}>
        <Button label="Back" variant="ghost" onPress={() => navigation.goBack()} />
        <Button label="Continue" onPress={() => navigation.navigate('V0Done')} />
      </View>
      <BottomNav active="today" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: space.s7,
    paddingTop: space.s5,
    paddingBottom: space.s6,
  },
  eyebrow: {
    ...typeTokens.eyebrow,
    color: color.ink.soft,
  },
  headline: {
    ...typeTokens.h2,
    color: color.ink.default,
    marginTop: space.s3,
  },
  headlineEm: {
    fontFamily: fontFamily.serifMediumItalic,
    color: color.indigo.default,
  },
  card: {
    marginTop: space.s7,
    backgroundColor: color.parchment.raised,
    borderRadius: radius.md,
    paddingVertical: space.s6,
    paddingHorizontal: space.s5,
    borderWidth: 1,
    borderColor: color.hairline.soft,
  },
  badgeRail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.s2,
  },
  pip: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: color.gold.default,
  },
  pipLabel: {
    fontFamily: fontFamily.sansSemibold,
    fontSize: fontSize.eyebrow,
    color: color.ink.soft,
    letterSpacing: letterSpacingFor(tracking.eyebrow, fontSize.eyebrow),
    textTransform: 'uppercase',
  },
  intentionHeadline: {
    ...typeTokens.h3,
    color: color.ink.default,
    marginTop: space.s4,
  },
  intentionBody: {
    ...typeTokens.body,
    color: color.ink.soft,
    marginTop: space.s3,
  },
  divider: {
    height: 1,
    backgroundColor: color.hairline.soft,
    marginVertical: space.s5,
  },
  verseLabel: {
    fontFamily: fontFamily.sansSemibold,
    fontSize: fontSize.eyebrow,
    color: color.ink.soft,
    letterSpacing: letterSpacingFor(tracking.eyebrow, fontSize.eyebrow),
    textTransform: 'uppercase',
  },
  verse: {
    fontFamily: fontFamily.serifItalic,
    fontSize: 22,
    lineHeight: Math.round(22 * 1.35),
    color: color.indigo.default,
    marginTop: space.s2,
  },
  verseCite: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.caption,
    color: color.ink.soft,
    marginTop: space.s2,
    letterSpacing: letterSpacingFor(tracking.label, fontSize.caption),
  },
  note: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.caption,
    color: color.ink.soft,
    lineHeight: lineHeight.body,
    marginTop: space.s5,
  },
  footer: {
    paddingHorizontal: space.s6,
    paddingTop: space.s3,
    paddingBottom: space.s4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: space.s4,
  },
});
