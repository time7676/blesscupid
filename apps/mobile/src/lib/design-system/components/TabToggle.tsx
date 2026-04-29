import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  color,
  fontFamily,
  fontSize,
  radius,
  space,
} from '../tokens.js';

export type TabToggleProps<T extends string> = {
  options: { value: T; label: string }[];
  value: T;
  onChange: (next: T) => void;
};

export function TabToggle<T extends string>({
  options,
  value,
  onChange,
}: TabToggleProps<T>) {
  return (
    <View accessibilityRole="tablist" style={styles.track}>
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(opt.value)}
            style={[styles.tab, selected ? styles.tabSelected : null]}
          >
            <Text style={[styles.label, selected ? styles.labelSelected : null]}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: color.sandstone.default,
    borderRadius: radius.pill,
    padding: space.s1,
    gap: space.s1,
  },
  tab: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: 'transparent',
  },
  tabSelected: {
    backgroundColor: color.parchment.raised,
  },
  label: {
    fontFamily: fontFamily.sansMedium,
    fontSize: fontSize.bodyLg,
    color: color.ink.soft,
  },
  labelSelected: {
    fontFamily: fontFamily.sansSemibold,
    // v1.1 — amber accent, not blue
    color: color.warning[700],
  },
});
