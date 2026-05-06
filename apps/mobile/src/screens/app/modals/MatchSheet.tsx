import { Modal, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import {
  color,
  fontFamily,
  fontSize,
  letterSpacingFor,
  radius,
  space,
  tracking,
} from '../../../lib/design-system/index.js';

export type MatchSheetProps = {
  visible: boolean;
  matchName: string;
  verse?: { text: string; reference: string };
  onSendFirstVerse: () => void;
  onWalkAway: () => void;
};

export function MatchSheet({
  visible,
  matchName,
  verse = {
    text: '"Above all, love each other deeply, because love covers over a multitude of sins."',
    reference: '1 Peter 4:8 · NIV',
  },
  onSendFirstVerse,
  onWalkAway,
}: MatchSheetProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onWalkAway}>
      <View style={styles.root}>
        <View style={styles.body}>
          <Text style={styles.eyebrow}>A connection</Text>
          <Text style={styles.preface}>You and</Text>
          <Text style={styles.name}>{matchName}</Text>
          <View style={styles.goldRule} />
          <Text style={styles.verse}>{verse.text}</Text>
          <Text style={styles.ref}>{verse.reference}</Text>
          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Send the first verse"
              onPress={onSendFirstVerse}
              style={({ pressed }) => [styles.cta, pressed && { opacity: 0.85 }]}
            >
              <Text style={styles.ctaLabel}>Send the first verse</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Walk away"
              onPress={onWalkAway}
              style={styles.ghost}
            >
              <Text style={styles.ghostLabel}>Walk away</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: color.parchment.raised,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.s7,
  } as ViewStyle,
  body: {
    alignItems: 'center',
    maxWidth: 360,
  },
  eyebrow: {
    fontFamily: fontFamily.sansSemibold,
    fontSize: 11,
    letterSpacing: letterSpacingFor(tracking.eyebrow, 11),
    textTransform: 'uppercase',
    color: color.cobalt[700],
    marginBottom: space.s3,
  },
  preface: {
    fontFamily: fontFamily.serif,
    fontSize: fontSize.h3,
    color: color.ink.default,
  },
  name: {
    fontFamily: fontFamily.serifItalic,
    fontSize: fontSize.hero,
    color: color.cobalt[700],
    letterSpacing: letterSpacingFor(tracking.tight, fontSize.hero),
    marginTop: space.s1,
  },
  goldRule: {
    width: 56,
    height: 1.5,
    backgroundColor: color.gold.default,
    marginVertical: space.s5,
  },
  verse: {
    fontFamily: fontFamily.serifItalic,
    fontSize: fontSize.bodyLg,
    lineHeight: 24,
    color: color.ink.charcoal,
    textAlign: 'center',
    marginBottom: space.s4,
  },
  ref: {
    fontFamily: fontFamily.sansSemibold,
    fontSize: 11,
    letterSpacing: letterSpacingFor(tracking.eyebrow, 11),
    textTransform: 'uppercase',
    color: color.cobalt[700],
  },
  actions: {
    marginTop: space.s8,
    alignSelf: 'stretch',
    gap: space.s3,
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
  ghost: {
    alignItems: 'center',
    paddingVertical: space.s3,
  },
  ghostLabel: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.label,
    color: color.ink.soft,
    borderBottomWidth: 1.5,
    borderBottomColor: color.gold.default,
    paddingBottom: 2,
  },
});
