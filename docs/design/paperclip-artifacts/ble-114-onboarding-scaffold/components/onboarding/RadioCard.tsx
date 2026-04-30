import { Pressable, Text, View } from 'react-native';
import { tokens } from '../../lib/tokens';

export type RadioCardProps<T extends string> = {
  value: T;
  label: string;
  helper?: string;
  selected: boolean;
  onSelect: () => void;
};

export function RadioCard<T extends string>({
  label,
  helper,
  selected,
  onSelect,
}: RadioCardProps<T>) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      accessibilityHint={helper}
      onPress={onSelect}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 56,
        paddingHorizontal: tokens.space[5],
        paddingVertical: tokens.space[4],
        borderWidth: selected ? 2 : 1,
        borderColor: selected
          ? tokens.color.border.focus
          : tokens.color.border.subtle,
        borderRadius: tokens.radius.md,
        backgroundColor: selected
          ? tokens.color.bg.raised
          : tokens.color.bg.surface,
      }}
    >
      <View
        style={{
          width: 20,
          height: 20,
          borderRadius: tokens.radius.pill,
          borderWidth: 2,
          borderColor: selected
            ? tokens.color.border.focus
            : tokens.color.border.strong,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: tokens.space[4],
        }}
      >
        {selected ? (
          <View
            style={{
              width: 10,
              height: 10,
              borderRadius: tokens.radius.pill,
              backgroundColor: tokens.color.border.focus,
            }}
          />
        ) : null}
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: tokens.font.body,
            fontSize: tokens.size.body.lg,
            color: tokens.color.text.primary,
          }}
        >
          {label}
        </Text>
        {helper ? (
          <Text
            style={{
              fontFamily: tokens.font.body,
              fontSize: tokens.size.body.sm,
              color: tokens.color.text.tertiary,
              marginTop: tokens.space[1],
            }}
          >
            {helper}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}
