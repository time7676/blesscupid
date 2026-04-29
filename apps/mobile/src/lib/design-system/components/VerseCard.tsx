import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  color,
  fontFamily,
  fontSize,
  lineHeight,
  space,
} from '../tokens.js';

export type VerseCardProps = {
  variant: 'hero' | 'compact';
  text: string;
  reference: string;
  illustration?: ReactNode;
};

// Style locked per BLE-22 scripture block spec:
//   - text/scripture (cobalt-900 → canonical indigo) — never italic
//   - body-lg serif on hero, body serif on compact
//   - 2px gold-soft left rule
export function VerseCard({ variant, text, reference, illustration }: VerseCardProps) {
  const isHero = variant === 'hero';
  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={`${text} — ${reference}`}
      style={[styles.frame, isHero ? styles.frameHero : styles.frameCompact]}
    >
      {illustration ? <View style={styles.illustration}>{illustration}</View> : null}
      <Text style={[styles.verse, isHero ? styles.verseHero : styles.verseCompact]}>
        {text}
      </Text>
      <Text style={styles.reference}>{reference}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    borderLeftWidth: 2,
    borderLeftColor: color.gold.soft,
    paddingLeft: space.s4,
  },
  frameHero: {
    paddingVertical: space.s5,
  },
  frameCompact: {
    paddingVertical: space.s3,
  },
  illustration: {
    marginBottom: space.s3,
  },
  verse: {
    fontFamily: fontFamily.serif,
    color: color.indigo.default,
    fontStyle: 'normal',
  },
  verseHero: {
    fontSize: fontSize.bodyLg,
    lineHeight: lineHeight.bodyLg,
  },
  verseCompact: {
    fontSize: fontSize.body,
    lineHeight: lineHeight.body,
  },
  reference: {
    marginTop: space.s2,
    fontFamily: fontFamily.sans,
    fontSize: fontSize.caption,
    color: color.ink.soft,
  },
});
