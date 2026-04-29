import { ReactNode } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import {
  color,
  elevation,
  fontFamily,
  fontSize,
  letterSpacingFor,
  radius,
  space,
  tracking,
} from '../tokens.js';

/**
 * Sheet — modal primitive used by every overlay in the app.
 *
 * Variants (per system-v1 §C, four canonical patterns):
 *  - 'top'    notification banner / toast (slides from top, no scrim)
 *  - 'center' gated-feature paywall card (centered, scrim, dismissible)
 *  - 'full'   one-time offer (full sheet from bottom, scrim)
 *  - 'pastor' Q3 redirect (centered, heavy scrim, NOT dismissible by tap-out)
 *
 * Animation: relies on RN Modal's built-in fade. For a more bespoke transition
 * we can swap to `react-native-reanimated` later — keep the API stable.
 */

export type SheetVariant = 'top' | 'center' | 'full' | 'pastor';

export type SheetProps = {
  visible: boolean;
  onDismiss: () => void;
  variant?: SheetVariant;
  /** Eyebrow text above the title (uppercase, amber). */
  eyebrow?: string;
  /** Optional close affordance — set to false on `pastor` variant. */
  dismissible?: boolean;
  children: ReactNode;
  /** Optional extra style on the sheet body. */
  style?: ViewStyle;
};

export function Sheet({
  visible,
  onDismiss,
  variant = 'center',
  dismissible = variant !== 'pastor',
  children,
  style,
}: SheetProps) {
  const animationType = variant === 'top' ? 'slide' : 'fade';
  const showScrim = variant !== 'top';

  return (
    <Modal
      visible={visible}
      transparent
      animationType={animationType}
      onRequestClose={dismissible ? onDismiss : undefined}
    >
      <View style={styles.root} pointerEvents="box-none">
        {showScrim && (
          <Pressable
            style={styles.scrim}
            onPress={dismissible ? onDismiss : undefined}
            accessibilityRole="button"
            accessibilityLabel="Dismiss"
          />
        )}
        <View
          style={[
            styles.sheet,
            variantStyles[variant],
            style,
          ]}
          accessibilityViewIsModal
        >
          {children}
        </View>
      </View>
    </Modal>
  );
}

/**
 * SheetEyebrow — small uppercase amber-tint label, used as the leading line
 * inside any sheet variant. Matches the prototype "BLESS+ FEATURE" / "A NOTE
 * FROM US" pattern.
 */
export function SheetEyebrow({ children }: { children: ReactNode }) {
  return <Text style={styles.eyebrow}>{children}</Text>;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(20, 24, 31, 0.42)',
  },
  sheet: {
    backgroundColor: color.parchment.raised,
    ...elevation.modal,
  },
  eyebrow: {
    fontFamily: fontFamily.sansSemibold,
    fontSize: fontSize.eyebrow,
    letterSpacing: letterSpacingFor(tracking.eyebrow, fontSize.eyebrow),
    textTransform: 'uppercase',
    color: color.warning[700],
    marginBottom: space.s3,
  },
});

const variantStyles: Record<SheetVariant, ViewStyle> = {
  top: {
    position: 'absolute',
    top: space.s3,
    left: space.s3,
    right: space.s3,
    borderRadius: radius.xl,
    paddingHorizontal: space.s4,
    paddingVertical: space.s3,
  },
  center: {
    position: 'absolute',
    left: space.s4,
    right: space.s4,
    top: '50%',
    transform: [{ translateY: -180 }],
    borderRadius: radius.xl,
    paddingHorizontal: space.s5,
    paddingVertical: space.s6,
  },
  full: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: space.s8,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    paddingHorizontal: space.s6,
    paddingTop: space.s7,
    paddingBottom: space.s6,
  },
  pastor: {
    position: 'absolute',
    left: space.s4,
    right: space.s4,
    top: '50%',
    transform: [{ translateY: -200 }],
    borderRadius: radius.xl,
    paddingHorizontal: space.s5,
    paddingVertical: space.s6,
  },
};
