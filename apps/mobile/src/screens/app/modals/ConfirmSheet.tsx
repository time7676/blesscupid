import { Modal, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import {
  color,
  fontFamily,
  fontSize,
  letterSpacingFor,
  radius,
  space,
  tracking,
} from '../../../lib/design-system/index.js';

export type ConfirmSheetProps = {
  visible: boolean;
  eyebrow?: string;
  title: string;
  body?: string;
  cancelLabel?: string;
  confirmLabel: string;
  destructive?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmSheet({
  visible,
  eyebrow,
  title,
  body,
  cancelLabel = 'Cancel',
  confirmLabel,
  destructive = false,
  onCancel,
  onConfirm,
}: ConfirmSheetProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.root}>
        <Pressable style={styles.scrim} onPress={onCancel} accessibilityLabel="Dismiss" />
        <View style={styles.sheet}>
          {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
          <Text style={styles.title}>{title}</Text>
          {body ? <Text style={styles.body}>{body}</Text> : null}
          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={cancelLabel}
              onPress={onCancel}
              style={({ pressed }) => [styles.btn, styles.btnCancel, pressed && { opacity: 0.85 }]}
            >
              <Text style={styles.btnCancelLabel}>{cancelLabel}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={confirmLabel}
              onPress={onConfirm}
              style={({ pressed }) => [
                styles.btn,
                destructive ? styles.btnDestructive : styles.btnConfirm,
                pressed && { opacity: 0.85 },
              ]}
            >
              <Text
                style={
                  destructive ? styles.btnDestructiveLabel : styles.btnConfirmLabel
                }
              >
                {confirmLabel}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 } as ViewStyle,
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(20,24,31,0.42)',
  } as ViewStyle,
  sheet: {
    position: 'absolute',
    left: space.s4,
    right: space.s4,
    top: '40%',
    backgroundColor: color.parchment.raised,
    borderRadius: radius.xl,
    paddingHorizontal: space.s5,
    paddingVertical: space.s6,
    shadowColor: '#14181F',
    shadowOpacity: 0.18,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  } as ViewStyle,
  eyebrow: {
    fontFamily: fontFamily.sansSemibold,
    fontSize: 11,
    letterSpacing: letterSpacingFor(tracking.eyebrow, 11),
    textTransform: 'uppercase',
    color: color.warning[700],
    marginBottom: space.s2,
  },
  title: {
    fontFamily: fontFamily.serifMedium,
    fontSize: fontSize.h3,
    color: color.ink.default,
    marginBottom: space.s2,
  },
  body: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.body,
    color: color.ink.soft,
    lineHeight: 22,
    marginBottom: space.s5,
  },
  actions: {
    flexDirection: 'row',
    gap: space.s3,
  },
  btn: {
    flex: 1,
    paddingVertical: space.s3,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  btnCancel: {
    backgroundColor: color.parchment.raised,
    borderWidth: 1,
    borderColor: color.hairline.default,
  },
  btnCancelLabel: {
    fontFamily: fontFamily.sansMedium,
    fontSize: fontSize.label,
    color: color.ink.default,
  },
  btnConfirm: {
    backgroundColor: color.cobalt[500],
  },
  btnConfirmLabel: {
    fontFamily: fontFamily.sansSemibold,
    fontSize: fontSize.label,
    color: color.parchment.raised,
  },
  btnDestructive: {
    backgroundColor: color.parchment.raised,
    borderWidth: 1.5,
    borderColor: color.warning[500],
  },
  btnDestructiveLabel: {
    fontFamily: fontFamily.sansSemibold,
    fontSize: fontSize.label,
    color: color.warning[700],
  },
});
