import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  color,
  fontFamily,
  fontSize,
  letterSpacingFor,
  radius,
  space,
  tracking,
} from '../../lib/design-system/index.js';

export type OnboardingDoneScreenProps = {
  name?: string;
  onContinue: () => void;
};

export function OnboardingDoneScreen({ name = 'friend', onContinue }: OnboardingDoneScreenProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, { paddingTop: insets.top + space.s8, paddingBottom: insets.bottom + space.s6 }]}>
      <View style={styles.body}>
        <Text style={styles.eyebrow}>Welcome</Text>
        <Text style={styles.preface}>You're</Text>
        <Text style={styles.title}>in.</Text>
        <View style={styles.goldRule} />
        <Text style={styles.lede}>
          Tomorrow at 9:00 am, you'll see your first introductions. Until then, take a breath.
        </Text>
        <Text style={styles.verseEyebrow}>A verse for the road</Text>
        <Text style={styles.verse}>
          "Be still, and know that I am God."
        </Text>
        <Text style={styles.verseRef}>Psalm 46:10 · NIV</Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open Today"
        onPress={onContinue}
        style={({ pressed }) => [styles.cta, pressed && { opacity: 0.85 }]}
      >
        <Text style={styles.ctaLabel}>Open Today</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: color.parchment.default,
    paddingHorizontal: space.s7,
  } as ViewStyle,
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: {
    fontFamily: fontFamily.sansSemibold,
    fontSize: 11,
    letterSpacing: letterSpacingFor(tracking.eyebrow, 11),
    textTransform: 'uppercase',
    color: color.cobalt[700],
    marginBottom: space.s4,
  },
  preface: {
    fontFamily: fontFamily.serif,
    fontSize: fontSize.h2,
    color: color.ink.default,
  },
  title: {
    fontFamily: fontFamily.serifItalic,
    fontSize: fontSize.hero,
    color: color.cobalt[700],
    letterSpacing: letterSpacingFor(tracking.tight, fontSize.hero),
  },
  goldRule: {
    width: 56,
    height: 1.5,
    backgroundColor: color.gold.default,
    marginVertical: space.s6,
  },
  lede: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.bodyLg,
    lineHeight: 24,
    color: color.ink.soft,
    textAlign: 'center',
    marginBottom: space.s8,
  },
  verseEyebrow: {
    fontFamily: fontFamily.sansSemibold,
    fontSize: 11,
    letterSpacing: letterSpacingFor(tracking.eyebrow, 11),
    textTransform: 'uppercase',
    color: color.cobalt[700],
    marginBottom: space.s2,
  },
  verse: {
    fontFamily: fontFamily.serifItalic,
    fontSize: fontSize.h3,
    lineHeight: 30,
    color: color.ink.charcoal,
    textAlign: 'center',
    marginBottom: space.s2,
  },
  verseRef: {
    fontFamily: fontFamily.sansSemibold,
    fontSize: 11,
    letterSpacing: letterSpacingFor(tracking.eyebrow, 11),
    textTransform: 'uppercase',
    color: color.cobalt[700],
  },
  cta: {
    backgroundColor: color.cobalt[500],
    borderRadius: radius.lg,
    paddingVertical: space.s4,
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
  },
  ctaLabel: {
    fontFamily: fontFamily.sansSemibold,
    fontSize: 15,
    color: color.parchment.raised,
    letterSpacing: 0.4,
  },
});
