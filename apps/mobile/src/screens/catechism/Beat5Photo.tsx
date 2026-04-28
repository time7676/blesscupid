import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { palette, radius, spacing } from '../../theme/tokens.js';
import { useLocale } from '../../i18n/locale-store.js';
import { catechismCopy } from '../../i18n/catechism.js';
import { useCatechism } from '../../lib/catechism-store.js';
import { Button, Eyebrow, Screen, SubText, Title, TopBar } from '../../components/catechism/index.js';
import type { CatechismStackParamList } from '../../navigation/types.js';

type Props = NativeStackScreenProps<CatechismStackParamList, 'CatechismBeat5Photo'>;

export function CatechismBeat5Photo({ navigation }: Props) {
  const { locale } = useLocale();
  const t = catechismCopy[locale].beat5;
  const { photoUri, setPhotoUri } = useCatechism();

  const onPickPhoto = () => {
    // Photo picker integration lives in BLE-114 vendor-poc/heic + expo-image-picker.
    // Stub: caller swaps in real picker; we mark a placeholder URI to unlock CTA.
    setPhotoUri('placeholder://selected');
  };

  return (
    <Screen
      topBar={<TopBar step={5} onBack={() => navigation.goBack()} showLangPill />}
      stickyFooter={
        <Button
          label={t.cta}
          disabled={!photoUri}
          onPress={() => navigation.navigate('CatechismBeat6Faith')}
        />
      }
    >
      <Eyebrow>{t.eyebrow}</Eyebrow>
      <Title>{t.title}</Title>
      <SubText>{t.sub}</SubText>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t.photoLabel}
        onPress={onPickPhoto}
        style={styles.zone}
      >
        <View style={styles.circle}>
          <Text style={styles.circleIcon}>◉</Text>
        </View>
        <Text style={styles.zoneLabel}>{t.photoLabel}</Text>
        <Text style={styles.zoneSub}>{t.photoSub}</Text>
      </Pressable>

      <View style={styles.hints}>
        <Hint kind="ok" text={t.hintOk1} />
        <Hint kind="ok" text={t.hintOk2} />
        <Hint kind="avoid" text={t.hintAvoid} />
        <Text style={styles.ribbon}>{t.ribbon}</Text>
      </View>
    </Screen>
  );
}

interface HintProps {
  kind: 'ok' | 'avoid';
  text: string;
}

function Hint({ kind, text }: HintProps) {
  return (
    <View style={styles.hint}>
      <View style={[styles.hintDot, kind === 'ok' ? styles.hintOk : styles.hintAvoid]}>
        <Text style={[styles.hintDotMark, kind === 'avoid' && styles.hintAvoidMark]}>
          {kind === 'ok' ? '✓' : '×'}
        </Text>
      </View>
      <Text style={styles.hintText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  zone: {
    aspectRatio: 1,
    maxHeight: 320,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: palette.stone300,
    borderRadius: radius.xl,
    backgroundColor: palette.cream100,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginVertical: spacing.s2,
    marginBottom: spacing.s5,
  },
  circle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: palette.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#142428',
    shadowOpacity: 0.06,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  circleIcon: {
    color: palette.cobalt600,
    fontSize: 24,
    lineHeight: 24,
  },
  zoneLabel: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '500',
    color: palette.stone700,
  },
  zoneSub: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: palette.stone500,
  },
  hints: { gap: 8, marginBottom: spacing.s7 },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: palette.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.cream300,
  },
  hintDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintOk: { backgroundColor: palette.sage500 },
  hintAvoid: { backgroundColor: palette.stone300 },
  hintDotMark: {
    color: palette.white,
    fontSize: 11,
    lineHeight: 11,
    fontWeight: '700',
  },
  hintAvoidMark: { color: palette.stone700 },
  hintText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: palette.stone900,
    flex: 1,
  },
  ribbon: {
    fontFamily: 'Source Serif 4',
    fontStyle: 'italic',
    fontSize: 13,
    lineHeight: 18,
    color: palette.stone700,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderLeftWidth: 2,
    borderLeftColor: palette.gold300,
    backgroundColor: palette.gold100,
    borderTopRightRadius: radius.md,
    borderBottomRightRadius: radius.md,
  },
});
