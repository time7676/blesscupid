import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { palette, radius, spacing } from '../../theme/tokens.js';

interface Props {
  title: string;
  desc: string;
  /** Optional parenthetical scripture citation (Advisory A from BLE-106). */
  citation?: string;
  pressed: boolean;
  onPress: () => void;
  icon?: ReactNode;
}

/**
 * Mode card — multi-select toggle (BLE-29 §4 rev 2).
 * 96pt min-height, equal-weight three-card row.
 * `accessibilityState.selected` mirrors aria-pressed.
 */
export function ModeCard({ title, desc, citation, pressed, onPress, icon }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: pressed }}
      onPress={onPress}
      style={[styles.card, pressed && styles.cardPressed]}
    >
      <View style={[styles.iconWrap, pressed && styles.iconWrapPressed]}>{icon ?? null}</View>
      <View style={styles.body}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.desc}>
          {desc}
          {citation ? <Text style={styles.citation}>{` ${citation}`}</Text> : null}
        </Text>
      </View>
      <View style={[styles.check, pressed && styles.checkPressed]}>
        {pressed ? <Text style={styles.checkMark}>✓</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: 14,
    backgroundColor: palette.white,
    borderWidth: 1.5,
    borderColor: palette.cream300,
    borderRadius: radius.xl,
    paddingVertical: spacing.s6,
    paddingHorizontal: spacing.s5,
    minHeight: 96,
    alignItems: 'center',
  },
  cardPressed: {
    borderColor: palette.cobalt600,
    backgroundColor: palette.cobalt50,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: palette.gold100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapPressed: { backgroundColor: palette.gold100 },
  body: { flex: 1 },
  title: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '600',
    color: palette.cobalt900,
    marginBottom: 4,
  },
  desc: {
    fontFamily: 'Inter',
    fontSize: 13,
    lineHeight: 18,
    color: palette.stone700,
  },
  citation: {
    fontFamily: 'Source Serif 4',
    fontStyle: 'italic',
    fontSize: 12,
    color: palette.gold700,
  },
  check: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: palette.stone300,
    backgroundColor: palette.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkPressed: {
    backgroundColor: palette.cobalt600,
    borderColor: palette.cobalt600,
  },
  checkMark: {
    color: palette.white,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 14,
  },
});
