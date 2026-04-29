import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  border,
  color,
  fontFamily,
  fontSize,
  lineHeight,
  radius,
  space,
} from '../tokens.js';

export type RadioCardProps = {
  label: string;
  sub?: string;
  selected: boolean;
  disabled?: boolean;
  onPress: () => void;
};

export function RadioCard({ label, sub, selected, disabled = false, onPress }: RadioCardProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="radio"
      accessibilityState={{ selected, disabled }}
    >
      {({ pressed }) => {
        const optionStyle = [
          styles.option,
          selected ? styles.optionSelected : null,
          pressed && !selected ? styles.optionPressed : null,
          disabled ? styles.optionDisabled : null,
        ];
        const markerStyle = [styles.marker, selected ? styles.markerSelected : null];
        return (
          <View style={optionStyle}>
            <View style={markerStyle}>
              {selected ? <View style={styles.markerDot} /> : null}
            </View>
            <View style={styles.body}>
              <Text style={styles.label}>{label}</Text>
              {sub ? <Text style={styles.sub}>{sub}</Text> : null}
            </View>
          </View>
        );
      }}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  option: {
    backgroundColor: color.sandstone.default,
    borderWidth: border.thin,
    borderColor: 'transparent',
    borderRadius: radius.sm,
    paddingVertical: 18,
    paddingHorizontal: space.s5,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  optionSelected: {
    borderColor: color.gold.default,
    backgroundColor: color.sandstone.warm,
  },
  optionPressed: {
    backgroundColor: color.sandstone.deep,
  },
  optionDisabled: {
    opacity: 0.5,
  },
  marker: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: border.medium,
    borderColor: color.ink.soft,
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerSelected: {
    borderColor: color.gold.default,
    // Halo via additional border-color/backgroundColor combo since RN
    // outer ring is approximated by the option's gold border.
    backgroundColor: color.gold.halo,
  },
  markerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: color.gold.default,
  },
  body: {
    flex: 1,
  },
  label: {
    fontFamily: fontFamily.serifMedium,
    fontSize: 19,
    lineHeight: Math.round(19 * 1.25),
    color: color.ink.default,
    marginBottom: space.s1,
  },
  sub: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.caption,
    lineHeight: lineHeight.body,
    color: color.ink.soft,
  },
});
