import { useState } from 'react';
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

export type ReportCategory =
  | 'inappropriate'
  | 'harassment'
  | 'fake_profile'
  | 'underage'
  | 'spam'
  | 'other';

const CATEGORIES: { key: ReportCategory; label: string }[] = [
  { key: 'inappropriate', label: 'Inappropriate content' },
  { key: 'harassment', label: 'Harassment or threats' },
  { key: 'fake_profile', label: 'Fake profile' },
  { key: 'underage', label: 'Underage user' },
  { key: 'spam', label: 'Spam or scam' },
  { key: 'other', label: 'Something else' },
];

export type ReportSheetProps = {
  visible: boolean;
  subjectName: string;
  onCancel: () => void;
  onSubmit: (category: ReportCategory, alsoBlock: boolean) => void;
};

export function ReportSheet({ visible, subjectName, onCancel, onSubmit }: ReportSheetProps) {
  const [selected, setSelected] = useState<ReportCategory | null>(null);
  const [alsoBlock, setAlsoBlock] = useState(true);

  function handleSubmit() {
    if (!selected) return;
    onSubmit(selected, alsoBlock);
    setSelected(null);
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <View style={styles.root}>
        <Pressable style={styles.scrim} onPress={onCancel} accessibilityLabel="Dismiss" />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.eyebrow}>Report {subjectName}</Text>
          <Text style={styles.title}>What happened?</Text>
          <Text style={styles.body}>Pick the closest reason. Our team reviews every report within 24h.</Text>

          <View style={styles.options}>
            {CATEGORIES.map((c) => {
              const isSelected = selected === c.key;
              return (
                <Pressable
                  key={c.key}
                  onPress={() => setSelected(c.key)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                  style={[styles.option, isSelected && styles.optionSelected]}
                >
                  <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                    {c.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            onPress={() => setAlsoBlock((v) => !v)}
            style={styles.checkboxRow}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: alsoBlock }}
          >
            <View style={[styles.checkbox, alsoBlock && styles.checkboxOn]}>
              {alsoBlock ? <Text style={styles.checkmark}>✓</Text> : null}
            </View>
            <Text style={styles.checkboxLabel}>Also block {subjectName}</Text>
          </Pressable>

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              onPress={onCancel}
              style={({ pressed }) => [styles.btn, styles.btnCancel, pressed && { opacity: 0.85 }]}
            >
              <Text style={styles.btnCancelLabel}>Cancel</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={handleSubmit}
              disabled={!selected}
              style={({ pressed }) => [
                styles.btn,
                styles.btnSubmit,
                !selected && { opacity: 0.4 },
                pressed && { opacity: 0.85 },
              ]}
            >
              <Text style={styles.btnSubmitLabel}>Submit report</Text>
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
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: color.parchment.raised,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    paddingHorizontal: space.s6,
    paddingTop: space.s2,
    paddingBottom: space.s7,
    shadowColor: '#14181F',
    shadowOpacity: 0.18,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  } as ViewStyle,
  handle: {
    width: 36,
    height: 4,
    backgroundColor: color.hairline.strong,
    borderRadius: radius.pill,
    alignSelf: 'center',
    marginBottom: space.s4,
  },
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
    fontSize: fontSize.caption,
    color: color.ink.soft,
    lineHeight: 19,
    marginBottom: space.s4,
  },
  options: {
    gap: space.s2,
    marginBottom: space.s4,
  },
  option: {
    paddingHorizontal: space.s4,
    paddingVertical: space.s3,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.hairline.default,
    backgroundColor: color.parchment.raised,
  },
  optionSelected: {
    borderColor: color.cobalt[500],
    borderWidth: 1.5,
    backgroundColor: color.cobalt[100],
  },
  optionLabel: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.body,
    color: color.ink.default,
  },
  optionLabelSelected: {
    color: color.cobalt[700],
    fontFamily: fontFamily.sansSemibold,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.s3,
    marginBottom: space.s5,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: color.hairline.default,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.parchment.raised,
  },
  checkboxOn: {
    backgroundColor: color.cobalt[500],
    borderColor: color.cobalt[500],
  },
  checkmark: {
    color: color.parchment.raised,
    fontWeight: '700',
    fontSize: 12,
  },
  checkboxLabel: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.body,
    color: color.ink.default,
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
  btnSubmit: {
    backgroundColor: color.parchment.raised,
    borderWidth: 1.5,
    borderColor: color.warning[500],
  },
  btnSubmitLabel: {
    fontFamily: fontFamily.sansSemibold,
    fontSize: fontSize.label,
    color: color.warning[700],
  },
});
