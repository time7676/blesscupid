import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { color, fontFamily, fontSize, radius, space } from '../tokens.js';

/**
 * ListItem — settings/account row primitive.
 * Used by You tab list, Settings sub-screens, and threaded message previews.
 *
 * Composition: [glyph?] [label + helper] [trailing? (chevron / pill / value)]
 */
export type ListItemProps = {
  label: string;
  helper?: string;
  /** Single-character/icon node on the leading edge (optional). */
  glyph?: ReactNode;
  /** Custom trailing node (pill, value text, etc). Defaults to `›` chevron. */
  trailing?: ReactNode;
  /** Show the chevron — defaults to true unless `trailing` is supplied. */
  showChevron?: boolean;
  /** Render variant: `inline` (no border) or `card` (parchment-raised + hairline). */
  variant?: 'inline' | 'card';
  onPress?: () => void;
  disabled?: boolean;
  /** Render a subtle danger tone (Sign out, Delete account). */
  destructive?: boolean;
};

export function ListItem({
  label,
  helper,
  glyph,
  trailing,
  showChevron,
  variant = 'inline',
  onPress,
  disabled,
  destructive,
}: ListItemProps) {
  const Container: any = onPress ? Pressable : View;
  const showChev = showChevron ?? (trailing === undefined);

  return (
    <Container
      onPress={disabled ? undefined : onPress}
      style={({ pressed }: { pressed: boolean }) => [
        styles.row,
        variant === 'card' && styles.card,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityLabel={label}
      accessibilityHint={helper}
    >
      {glyph !== undefined && <View style={styles.glyph}>{glyph}</View>}
      <View style={styles.body}>
        <Text
          style={[
            styles.label,
            destructive && styles.labelDestructive,
            disabled && styles.labelDisabled,
          ]}
        >
          {label}
        </Text>
        {helper !== undefined && <Text style={styles.helper}>{helper}</Text>}
      </View>
      {trailing !== undefined ? (
        <View style={styles.trailing}>{trailing}</View>
      ) : showChev ? (
        <Text style={styles.chevron}>›</Text>
      ) : null}
    </Container>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.s4,
    paddingVertical: space.s4,
    paddingHorizontal: space.s4,
    borderTopWidth: 1,
    borderTopColor: color.hairline.soft,
  },
  card: {
    borderTopWidth: 0,
    backgroundColor: color.parchment.raised,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: color.hairline.soft,
  },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.45 },
  glyph: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, minWidth: 0 },
  label: {
    fontFamily: fontFamily.sansMedium,
    fontSize: fontSize.bodyLg,
    color: color.ink.default,
  },
  labelDestructive: { color: color.warning[700] },
  labelDisabled: { color: color.ink.soft },
  helper: {
    marginTop: 2,
    fontFamily: fontFamily.sans,
    fontSize: fontSize.caption,
    color: color.ink.soft,
  },
  trailing: { marginLeft: space.s2 },
  chevron: {
    fontFamily: fontFamily.sans,
    fontSize: 18,
    color: color.ink.soft,
    marginLeft: space.s2,
  },
});
