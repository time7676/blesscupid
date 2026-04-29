import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { color, fontFamily, fontSize, letterSpacingFor, space, tracking } from '../tokens.js';

/**
 * ScreenHeader — top-of-screen pattern.
 *  [back?] [eyebrow + title] [trailing? (lang pill, bell, gear)]
 *
 * Use on Today (no back, with bell), settings sub-pages (back + title),
 * Faith Q-screens (back + step pill).
 */

export type ScreenHeaderProps = {
  title?: string;
  /** Small uppercase text above the title (e.g. "Account", "Today · Tuesday 29"). */
  eyebrow?: string;
  /** Render a back chevron and call this on press. Hidden if undefined. */
  onBack?: () => void;
  /** Custom node for the trailing slot (lang pill, bell, gear, avatar). */
  trailing?: ReactNode;
  /** Variant — `compact` (eyebrow + small title) or `display` (large serif). */
  variant?: 'compact' | 'display';
};

export function ScreenHeader({
  title,
  eyebrow,
  onBack,
  trailing,
  variant = 'compact',
}: ScreenHeaderProps) {
  return (
    <View style={styles.row}>
      {onBack ? (
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={12}
          style={styles.back}
        >
          <Text style={styles.backGlyph}>‹</Text>
        </Pressable>
      ) : (
        <View style={styles.backSpacer} />
      )}

      <View style={styles.body}>
        {eyebrow !== undefined && <Text style={styles.eyebrow}>{eyebrow}</Text>}
        {title !== undefined && (
          <Text
            style={[
              variant === 'display' ? styles.titleDisplay : styles.titleCompact,
            ]}
            numberOfLines={2}
          >
            {title}
          </Text>
        )}
      </View>

      <View style={styles.trailing}>{trailing}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: space.s6,
    paddingTop: space.s5,
    paddingBottom: space.s2,
    gap: space.s3,
  },
  back: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  backSpacer: { width: 0 },
  backGlyph: {
    fontFamily: fontFamily.sans,
    fontSize: 22,
    color: color.ink.soft,
    lineHeight: 22,
  },
  body: { flex: 1, minWidth: 0 },
  eyebrow: {
    fontFamily: fontFamily.sansSemibold,
    fontSize: fontSize.eyebrow,
    letterSpacing: letterSpacingFor(tracking.eyebrow, fontSize.eyebrow),
    textTransform: 'uppercase',
    color: color.ink.soft,
  },
  titleCompact: {
    marginTop: 4,
    fontFamily: fontFamily.serifMedium,
    fontSize: fontSize.h3,
    color: color.ink.default,
  },
  titleDisplay: {
    marginTop: 6,
    fontFamily: fontFamily.serif,
    fontSize: fontSize.h2,
    lineHeight: Math.round(fontSize.h2 * 1.18),
    color: color.ink.default,
  },
  trailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.s2,
  },
});
