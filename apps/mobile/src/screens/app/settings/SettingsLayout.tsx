import { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  color,
  fontFamily,
  fontSize,
  letterSpacingFor,
  space,
  tracking,
} from '../../../lib/design-system/index.js';

export type SettingsLayoutProps = {
  eyebrow: string;
  title: string;
  onBack: () => void;
  children: ReactNode;
  footer?: ReactNode;
};

/**
 * Common settings sub-screen scaffold:
 *   ← Back · eyebrow · title · scroll content · sticky footer
 */
export function SettingsLayout({ eyebrow, title, onBack, children, footer }: SettingsLayoutProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, { paddingTop: insets.top + space.s5 }]}>
      <Pressable onPress={onBack} style={styles.back} hitSlop={12} accessibilityLabel="Back">
        <Text style={styles.backLabel}>← Back</Text>
      </Pressable>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.title}>{title}</Text>
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + space.s6 }]}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
      {footer ? <View style={[styles.footer, { paddingBottom: insets.bottom + space.s4 }]}>{footer}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.parchment.default } as ViewStyle,
  back: { paddingHorizontal: space.s6, paddingVertical: space.s2 },
  backLabel: { fontFamily: fontFamily.sansMedium, fontSize: fontSize.label, color: color.ink.soft },
  header: { paddingHorizontal: space.s6, paddingTop: space.s4, paddingBottom: space.s5 },
  eyebrow: {
    fontFamily: fontFamily.sansSemibold,
    fontSize: 11,
    letterSpacing: letterSpacingFor(tracking.eyebrow, 11),
    textTransform: 'uppercase',
    color: color.cobalt[700],
    marginBottom: space.s2,
  },
  title: {
    fontFamily: fontFamily.serif,
    fontSize: fontSize.h2,
    letterSpacing: letterSpacingFor(tracking.tight, fontSize.h2),
    color: color.ink.default,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: space.s6 },
  footer: {
    paddingHorizontal: space.s6,
    paddingTop: space.s4,
    backgroundColor: color.parchment.raised,
    borderTopWidth: 1,
    borderTopColor: color.hairline.soft,
  },
});
