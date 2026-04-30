import { Pressable, Text, View } from 'react-native';
import type { ReactNode } from 'react';
import { tokens } from '../../lib/tokens';

export type ModeCardProps = {
  mode: 'pacaran' | 'persahabatan' | 'komunitas';
  title: string;
  description: string;
  icon: ReactNode;
  selected: boolean;
  onToggle: () => void;
  testID?: string;
};

export function ModeCard({
  title,
  description,
  icon,
  selected,
  onToggle,
  testID,
}: ModeCardProps) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={title}
      accessibilityHint={description}
      onPress={onToggle}
      style={{
        minHeight: 96,
        flexDirection: 'row',
        alignItems: 'center',
        gap: tokens.space[5],
        paddingHorizontal: tokens.space[6],
        paddingVertical: tokens.space[5],
        borderRadius: tokens.radius.lg,
        borderWidth: selected ? 2 : 1,
        borderColor: selected
          ? tokens.color.border.focus
          : tokens.color.border.subtle,
        backgroundColor: selected
          ? tokens.color.bg.raised
          : tokens.color.bg.surface,
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: tokens.font.display,
            fontSize: tokens.size.heading.md,
            color: tokens.color.text.primary,
            marginBottom: tokens.space[2],
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            fontFamily: tokens.font.body,
            fontSize: tokens.size.body.md,
            color: tokens.color.text.secondary,
            lineHeight: tokens.lineHeight.body.md,
          }}
        >
          {description}
        </Text>
      </View>
      {selected ? (
        <View
          style={{
            width: 24,
            height: 24,
            borderRadius: tokens.radius.pill,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: tokens.color.text.brand,
          }}
        >
          <Text style={{ color: tokens.color.text.inverse, fontSize: 14 }}>✓</Text>
        </View>
      ) : null}
    </Pressable>
  );
}
