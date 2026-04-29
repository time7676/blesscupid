import { StyleSheet, Text, View } from 'react-native';
import { color, fontFamily, fontSize, letterSpacingFor, space, tracking } from '../tokens.js';

/**
 * OfflineBanner — sticky strip shown when network is down.
 * Sits at the bottom of the screen, above BottomNav. Sandstone bg + amber
 * eyebrow + body text. Holy Code §HCoC: never red.
 *
 * Wire to NetInfo at the screen-shell level; this is just the visual.
 */

export type OfflineBannerProps = {
  visible: boolean;
  message?: string;
};

export function OfflineBanner({
  visible,
  message = 'No connection. Reconnecting…',
}: OfflineBannerProps) {
  if (!visible) return null;
  return (
    <View style={styles.bar} accessibilityRole="alert" accessibilityLiveRegion="polite">
      <Text style={styles.eyebrow}>Offline</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    paddingHorizontal: space.s5,
    paddingVertical: space.s3,
    backgroundColor: color.warning[100],
    borderTopWidth: 1,
    borderTopColor: color.warning[500],
  },
  eyebrow: {
    fontFamily: fontFamily.sansSemibold,
    fontSize: fontSize.eyebrow,
    letterSpacing: letterSpacingFor(tracking.eyebrow, fontSize.eyebrow),
    textTransform: 'uppercase',
    color: color.warning[700],
    marginBottom: 2,
  },
  message: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.caption,
    color: color.ink.default,
  },
});
