import { Pressable, StyleSheet, Text, View } from 'react-native';
import { palette, radius, spacing } from '../../theme/tokens.js';
import { useLocale } from '../../i18n/locale-store.js';
import { catechismCopy } from '../../i18n/catechism.js';
import { ProgressDots } from './ProgressDots.js';

interface Props {
  step: number; // 1..8; 0 hides progress
  total?: number;
  onBack?: () => void;
  showLangPill?: boolean;
}

export function TopBar({ step, total = 8, onBack, showLangPill = false }: Props) {
  const { locale, toggle } = useLocale();
  const t = catechismCopy[locale].shared;

  return (
    <View style={styles.row}>
      {onBack ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.backLabel}
          onPress={onBack}
          style={styles.iconBtn}
          hitSlop={8}
        >
          <Text style={styles.chev}>‹</Text>
        </Pressable>
      ) : (
        <View style={styles.iconBtn} />
      )}

      {step > 0 ? (
        <ProgressDots current={step} total={total} accessibilityLabel={t.progressAria(step, total)} />
      ) : (
        <View style={styles.flex} />
      )}

      {showLangPill ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Language: ${locale === 'id' ? t.langPillId : t.langPillEn}`}
          onPress={() => {
            void toggle();
          }}
          style={styles.langPill}
        >
          <Text style={[styles.langText, locale === 'id' && styles.langActive]}>{t.langPillId}</Text>
          <Text style={[styles.langText, locale === 'en' && styles.langActive]}>{t.langPillEn}</Text>
        </Pressable>
      ) : (
        <View style={styles.iconBtn} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.s7,
    paddingTop: spacing.s4,
    paddingBottom: spacing.s3,
    minHeight: 56,
    gap: spacing.s4,
  },
  iconBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
  },
  chev: { fontSize: 28, color: palette.cobalt900, lineHeight: 30 },
  flex: { flex: 1 },
  langPill: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: palette.stone300,
    borderRadius: radius.pill,
    overflow: 'hidden',
    backgroundColor: palette.cream50,
  },
  langText: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    color: palette.stone700,
  },
  langActive: {
    backgroundColor: palette.cobalt600,
    color: palette.cream50,
  },
});
