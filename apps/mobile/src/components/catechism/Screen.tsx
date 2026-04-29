import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { palette, spacing } from '../../theme/tokens.js';

interface Props {
  topBar?: ReactNode;
  hero?: ReactNode;
  children: ReactNode;
  stickyFooter?: ReactNode;
  scrollContentStyle?: StyleProp<ViewStyle>;
  background?: 'canvas' | 'transparent';
}

/**
 * Catechism screen shell.
 * - cream-50 ground (constraint 1)
 * - top bar + hero outside scroll, sticky CTA bottom
 * - sticky CTA uses canvas-tinted gradient via solid bg + scrim handled by caller
 */
export function Screen({
  topBar,
  hero,
  children,
  stickyFooter,
  scrollContentStyle,
  background = 'canvas',
}: Props) {
  return (
    <SafeAreaView style={[styles.flex, background === 'canvas' ? styles.canvas : styles.transparent]} edges={['top', 'bottom']}>
      {topBar ?? null}
      {hero ?? null}
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.content, scrollContentStyle]}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
      {stickyFooter ? <View style={styles.footer}>{stickyFooter}</View> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  canvas: { backgroundColor: palette.cream50 },
  transparent: { backgroundColor: 'transparent' },
  content: {
    paddingHorizontal: spacing.s7,
    paddingBottom: spacing.s11,
  },
  footer: {
    paddingHorizontal: spacing.s7,
    paddingTop: spacing.s5,
    paddingBottom: spacing.s7,
    backgroundColor: palette.cream50,
    gap: spacing.s4,
  },
});
