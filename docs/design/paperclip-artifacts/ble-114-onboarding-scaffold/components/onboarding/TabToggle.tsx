import { Pressable, Text, View } from 'react-native';
import { tokens } from '../../lib/tokens';

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
    <View
      accessibilityRole="tablist"
      style={{
        flexDirection: 'row',
        backgroundColor: tokens.color.bg.raised,
        borderRadius: tokens.radius.pill,
        padding: 4,
        gap: 4,
      }}
    >
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(opt.value)}
            style={{
              flex: 1,
              minHeight: 44,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: tokens.radius.pill,
              backgroundColor: selected
                ? tokens.color.bg.surface
                : 'transparent',
            }}
          >
            <Text
              style={{
                fontFamily: tokens.font.body,
                fontSize: tokens.size.heading.sm,
                color: selected
                  ? tokens.color.text.brand
                  : tokens.color.text.secondary,
                fontWeight: selected ? '600' : '500',
              }}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
