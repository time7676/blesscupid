import { StyleSheet, Text, View } from 'react-native';
import { palette, radius, spacing } from '../../theme/tokens.js';

interface Props {
  eyebrow?: string;
  verse: string;
  reference: string;
}

/**
 * VerseCard — locked chrome (BLE-106 constraint 3):
 * gold-100 fill, 3px gold-300 left rule, Source Serif 4 verse, italic gold-700 ref.
 * Reused by Beat 4 catechism pull-quote AND Beat 8 VOTD card.
 */
export function VerseCard({ eyebrow, verse, reference }: Props) {
  return (
    <View
      style={styles.card}
      accessible
      accessibilityRole="text"
      accessibilityLabel={`${verse} ${reference}`}
    >
      <View style={styles.rule} />
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text style={styles.verse}>{verse}</Text>
      <Text style={styles.ref}>{reference}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.gold100,
    borderRadius: radius.lg,
    paddingTop: spacing.s6,
    paddingBottom: spacing.s6,
    paddingLeft: spacing.s7,
    paddingRight: spacing.s6,
    position: 'relative',
    overflow: 'hidden',
  },
  rule: {
    position: 'absolute',
    left: 0,
    top: 12,
    bottom: 12,
    width: 3,
    backgroundColor: palette.gold300,
    borderRadius: 2,
  },
  eyebrow: {
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: palette.gold700,
    marginBottom: 10,
  },
  verse: {
    fontFamily: 'Source Serif 4',
    fontWeight: '500',
    fontSize: 19,
    lineHeight: 30,
    color: palette.cobalt900,
    marginBottom: 12,
  },
  ref: {
    fontFamily: 'Source Serif 4',
    fontStyle: 'italic',
    fontSize: 13,
    color: palette.gold700,
  },
});
