import { StyleSheet, View, type ViewStyle } from 'react-native';
import { color, space } from '../tokens.js';

/**
 * Divider — hairline rule. Used between list groups, between content blocks.
 * For inline list separators inside ListItem, use ListItem's own borderTop.
 */
export type DividerProps = {
  /** `default` (12% ink) or `soft` (6% ink). Defaults to default. */
  tone?: 'default' | 'soft' | 'strong';
  /** Vertical spacing (margin-block) around the rule. */
  inset?: keyof typeof space;
  /** When true, render an inset of `--space-s4` on each horizontal side. */
  indent?: boolean;
  style?: ViewStyle;
};

export function Divider({
  tone = 'default',
  inset = 's4',
  indent = false,
  style,
}: DividerProps) {
  const toneColor =
    tone === 'soft'
      ? color.hairline.soft
      : tone === 'strong'
        ? color.hairline.strong
        : color.hairline.default;
  return (
    <View
      style={[
        {
          height: 1,
          backgroundColor: toneColor,
          marginVertical: space[inset],
          marginHorizontal: indent ? space.s4 : 0,
        },
        style,
      ]}
    />
  );
}

/**
 * GoldRule — short ornamental gold line, used as a hairline accent on hero
 * sections and splash. Distinct from Divider semantically: this is decoration,
 * Divider is structure.
 */
export function GoldRule({ width = 56, style }: { width?: number; style?: ViewStyle }) {
  return (
    <View
      style={[
        {
          width,
          height: 1,
          backgroundColor: color.gold.default,
          alignSelf: 'center',
        },
        style,
      ]}
    />
  );
}

const _styles = StyleSheet.create({});
