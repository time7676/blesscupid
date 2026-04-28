import { Pressable, StyleSheet, Text, View } from 'react-native';
import { palette, radius } from '../../theme/tokens.js';

interface Props {
  label: string;
  pressed: boolean;
  onPress: () => void;
}

export function Chip({ label, pressed, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: pressed }}
      onPress={onPress}
      style={[styles.chip, pressed && styles.chipPressed]}
    >
      {pressed ? (
        <View style={styles.dot}>
          <Text style={styles.dotMark}>✓</Text>
        </View>
      ) : null}
      <Text style={[styles.label, pressed && styles.labelPressed]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 40,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: palette.stone300,
    backgroundColor: palette.white,
  },
  chipPressed: {
    backgroundColor: palette.cobalt50,
    borderColor: palette.cobalt600,
  },
  label: {
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '500',
    color: palette.stone700,
  },
  labelPressed: {
    color: palette.cobalt700,
    fontWeight: '600',
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: palette.cobalt600,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotMark: {
    color: palette.white,
    fontSize: 9,
    lineHeight: 10,
    fontWeight: '700',
  },
});
