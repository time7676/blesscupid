// BLE-100: <VerseOfDayCard>. Implements BLE-84 plan §1–§5.
//
// Variants:
//   default            — cream surface, gold left-rule on verse block.
//   feature            — Hari Raya (Natal/Paskah/Pentakosta). Gold ornament
//                        rule top + bottom, larger reference, "Hari Raya"
//                        pill replaces theme tag.
//   pastoral-subtitle  — slot below reference, italic, hidden when null.
//
// Translation toggle: TB2 / TB / NIV. `duration-fast` (80ms) opacity
// crossfade only. Touch wrapper extends to 44pt invisibly.
//
// Tokens come from lib/design/tokens — no inline values. Theme tag colors +
// icons resolved via lib/design/theme-map. Phosphor icons aren't installed
// yet; we render the unicode glyph fallback. Swap to <Heart/>, <Sun/> etc.
// once `phosphor-react-native` lands.

import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import type { VerseTheme } from '@blesscupid/shared';
import {
  fetchVerse,
  VerseError,
  type Translation,
  type VerseResponse,
} from '../lib/verse/index.js';
import {
  a11y,
  border,
  color,
  font,
  motion,
  radius,
  space,
} from '../lib/design/tokens.js';
import { styleForTheme } from '../lib/design/theme-map.js';
import { buildYouVersionUrl } from '../lib/youversion/index.js';

export type VerseOfDayCardVariant = 'default' | 'feature';

export type VerseOfDayCardEntry = {
  ref: string;
  theme: VerseTheme;
  // Optional pastoral framing (single line, italic, ellipsis at 2 lines).
  // Hidden until the copy library ships per BLE-84 §10.
  pastoralSubtitle?: string | null;
};

export type VerseOfDayCardProps = {
  entry: VerseOfDayCardEntry;
  variant?: VerseOfDayCardVariant;
  initialTranslation?: Translation;
  // Override the fetcher (for tests + Storybook). Default uses BLE-98 client.
  fetcher?: (ref: string, translation: Translation) => Promise<VerseResponse>;
  style?: StyleProp<ViewStyle>;
};

const TRANSLATIONS: Translation[] = ['tb2', 'tb', 'niv'];

const DEFAULT_ATTRIBUTION_TB2 =
  'TB2 © Lembaga Alkitab Indonesia. NIV © Biblica, Inc.';
const DEFAULT_ATTRIBUTION_TB =
  'TB © Lembaga Alkitab Indonesia. NIV © Biblica, Inc.';

type LoadState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'ok'; data: VerseResponse }
  | { kind: 'fallback-translation'; data: VerseResponse } // TB2→TB auto
  | { kind: 'all-fail' };

export function VerseOfDayCard({
  entry,
  variant = 'default',
  initialTranslation = 'tb2',
  fetcher = fetchVerse,
  style,
}: VerseOfDayCardProps) {
  const [translation, setTranslation] = useState<Translation>(initialTranslation);
  const [state, setState] = useState<LoadState>({ kind: 'idle' });
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let cancelled = false;
    setState({ kind: 'loading' });
    Animated.timing(opacity, {
      toValue: 0,
      duration: motion.duration.fast,
      useNativeDriver: true,
    }).start();

    fetcher(entry.ref, translation)
      .then(async (data) => {
        if (cancelled) return;
        const next: LoadState =
          data.effective !== translation
            ? { kind: 'fallback-translation', data }
            : { kind: 'ok', data };
        setState(next);
      })
      .catch(async (err) => {
        if (cancelled) return;
        // BLE-84 §4: TB2 failure → TB fallback. If `fetcher` already maps
        // that server-side it surfaces as `fallback-translation` above. If
        // the network/server is down entirely we land here.
        if (translation === 'tb2' && err instanceof VerseError) {
          try {
            const tbData = await fetcher(entry.ref, 'tb');
            if (cancelled) return;
            setState({ kind: 'fallback-translation', data: tbData });
            return;
          } catch {
            /* fall through */
          }
        }
        setState({ kind: 'all-fail' });
      })
      .finally(() => {
        if (cancelled) return;
        Animated.timing(opacity, {
          toValue: 1,
          duration: motion.duration.fast,
          useNativeDriver: true,
        }).start();
      });

    return () => {
      cancelled = true;
    };
  }, [entry.ref, translation, fetcher, opacity]);

  const isFeature = variant === 'feature';
  const themeStyle = styleForTheme(entry.theme);

  const containerStyle: StyleProp<ViewStyle> = [
    styles.card,
    isFeature ? styles.cardFeature : styles.cardDefault,
    style,
  ];

  const referenceText = formatReferenceWithTranslation(entry.ref, state);
  const attribution = attributionFor(state);

  return (
    <View style={containerStyle} accessibilityRole="summary">
      {isFeature && <FeatureOrnamentRule position="top" />}

      {isFeature ? (
        <HariRayaPill />
      ) : (
        <ThemeTag
          glyph={themeStyle.glyph}
          label={themeStyle.label}
          bg={themeStyle.tagBg}
          textColor={themeStyle.tagText}
        />
      )}

      <Text
        style={[styles.reference, isFeature && styles.referenceFeature]}
        accessibilityRole="header"
      >
        {referenceText}
      </Text>

      {entry.pastoralSubtitle ? (
        <Text style={styles.pastoralSubtitle} numberOfLines={2}>
          {entry.pastoralSubtitle}
        </Text>
      ) : null}

      <View style={styles.verseBlock}>
        <View style={styles.verseRule} />
        <View style={styles.verseTextWrap}>
          <Animated.View style={{ opacity }}>
            <VerseBody state={state} ref={entry.ref} />
          </Animated.View>
        </View>
      </View>

      <TranslationToggle
        value={translation}
        onChange={setTranslation}
        effective={
          state.kind === 'fallback-translation' ? state.data.effective : null
        }
      />

      <Text style={styles.attribution}>{attribution}</Text>

      <YouVersionLink ref={entry.ref} translation={translation} />

      {isFeature && <FeatureOrnamentRule position="bottom" />}
    </View>
  );
}

function YouVersionLink({ ref, translation }: { ref: string; translation: Translation }) {
  const handlePress = () => {
    const url = buildYouVersionUrl(ref, translation);
    Linking.openURL(url).catch(() => {
      /* ignore — user can try again or no browser */
    });
  };

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="link"
      accessibilityLabel="Buka di aplikasi Alkitab"
      hitSlop={{ top: 6, bottom: 6, left: 12, right: 12 }}
      style={styles.youVersionHit}
    >
      <Text style={styles.youVersionLabel}>Buka di aplikasi Alkitab</Text>
    </Pressable>
  );
}

function VerseBody({
  state,
  ref,
}: {
  state: LoadState;
  ref: string;
}) {
  if (state.kind === 'loading' || state.kind === 'idle') {
    return <View style={styles.verseSkeleton} accessibilityLabel="Memuat ayat" />;
  }
  if (state.kind === 'all-fail') {
    return (
      <Text style={styles.verseFallback}>
        Buka Alkitab Anda untuk membaca: {ref}
      </Text>
    );
  }
  // ok or fallback-translation — both render the served text.
  return (
    <>
      <Text style={styles.verseText}>{state.data.text}</Text>
      {state.kind === 'fallback-translation' ? (
        <Text style={styles.verseFallbackNote}>
          Menampilkan {labelFor(state.data.effective)} (
          {labelFor(initialRequestedFromState(state))} tidak tersedia).
        </Text>
      ) : null}
    </>
  );
}

function ThemeTag({
  glyph,
  label,
  bg,
  textColor,
}: {
  glyph: string;
  label: string;
  bg: string;
  textColor: string;
}) {
  return (
    <View style={[styles.tag, { backgroundColor: bg }]}>
      <Text style={[styles.tagGlyph, { color: textColor }]}>{glyph}</Text>
      <Text style={[styles.tagLabel, { color: textColor }]}>{label}</Text>
    </View>
  );
}

function HariRayaPill() {
  return (
    <View style={[styles.tag, styles.hariRayaTag]}>
      <View style={styles.hariRayaDot} />
      <Text style={[styles.tagLabel, styles.hariRayaLabel]}>HARI RAYA</Text>
    </View>
  );
}

function FeatureOrnamentRule({ position }: { position: 'top' | 'bottom' }) {
  return (
    <View
      style={[
        styles.ornamentRule,
        position === 'top' ? styles.ornamentTop : styles.ornamentBottom,
      ]}
    >
      <View style={styles.ornamentDot} />
    </View>
  );
}

function TranslationToggle({
  value,
  onChange,
  effective,
}: {
  value: Translation;
  onChange: (t: Translation) => void;
  effective: Translation | null;
}) {
  return (
    <View style={styles.toggleRow}>
      {TRANSLATIONS.map((t) => {
        const active = value === t;
        // Floor of 44pt for the tap target; visible chip is 32pt.
        return (
          <Pressable
            key={t}
            onPress={() => onChange(t)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`Terjemahan ${labelFor(t)}`}
            hitSlop={{
              top: (a11y.touchTargetMin - 32) / 2,
              bottom: (a11y.touchTargetMin - 32) / 2,
              left: 0,
              right: 0,
            }}
            style={styles.toggleHit}
          >
            <View
              style={[
                styles.toggleSegment,
                active && styles.toggleSegmentActive,
              ]}
            >
              <Text
                style={[
                  styles.toggleLabel,
                  active && styles.toggleLabelActive,
                ]}
              >
                {labelFor(t)}
              </Text>
            </View>
          </Pressable>
        );
      })}
      {effective ? <View accessibilityLabel="Fallback aktif" /> : null}
    </View>
  );
}

function labelFor(t: Translation): string {
  if (t === 'tb2') return 'TB2';
  if (t === 'tb') return 'TB';
  return 'NIV';
}

function formatReferenceWithTranslation(ref: string, state: LoadState): string {
  const trans = effectiveTranslation(state);
  return trans ? `${ref} (${labelFor(trans)})` : ref;
}

function effectiveTranslation(state: LoadState): Translation | null {
  if (state.kind === 'ok' || state.kind === 'fallback-translation') {
    return state.data.effective;
  }
  return null;
}

function initialRequestedFromState(
  state: Extract<LoadState, { kind: 'fallback-translation' }>,
): Translation {
  // The user requested `translation`; the server served `effective`. We
  // surface the requested one so the note reads "TB2 not available."
  return state.data.translation;
}

function attributionFor(state: LoadState): string {
  if (state.kind === 'ok' || state.kind === 'fallback-translation') {
    return state.data.attribution || defaultAttribution(state.data.effective);
  }
  return DEFAULT_ATTRIBUTION_TB2;
}

function defaultAttribution(effective: Translation): string {
  return effective === 'tb' ? DEFAULT_ATTRIBUTION_TB : DEFAULT_ATTRIBUTION_TB2;
}

const CARD_HORIZONTAL_PAD = space.s6;
const CARD_HORIZONTAL_PAD_SMALL = space.s3;

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xxl,
    paddingHorizontal: CARD_HORIZONTAL_PAD,
    paddingTop: space.s6,
    paddingBottom: space.s6,
    backgroundColor: color.parchment.raised,
    borderWidth: border.thin,
    borderColor: color.hairline.soft,
  },
  cardDefault: {},
  cardFeature: {
    backgroundColor: color.sandstone.warm,
    paddingTop: space.s7,
    paddingBottom: space.s7,
  },

  ornamentRule: {
    height: border.thin,
    backgroundColor: color.gold.default,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ornamentTop: { marginBottom: space.s4 },
  ornamentBottom: { marginTop: space.s4 },
  ornamentDot: {
    position: 'absolute',
    top: -3,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: color.gold.default,
  },

  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: space.s3,
    paddingVertical: space.s1,
    borderRadius: radius.pill,
    marginBottom: space.s3,
    gap: space.s2,
  },
  tagGlyph: {
    fontSize: font.size.label,
    lineHeight: font.size.label + 2,
  },
  tagLabel: {
    fontSize: font.size.eyebrow,
    fontWeight: font.weight.semibold,
    letterSpacing: font.tracking.eyebrow,
    textTransform: 'uppercase',
  },
  hariRayaTag: {
    backgroundColor: color.gold.halo,
  },
  hariRayaDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: color.gold.default,
  },
  hariRayaLabel: {
    color: color.ink.default,
  },

  reference: {
    fontFamily: font.family.sans,
    fontSize: font.size.h3,
    lineHeight: font.lineHeight.h3,
    fontWeight: font.weight.semibold,
    color: color.ink.default,
    marginBottom: space.s4,
  },
  referenceFeature: {
    fontFamily: font.family.serif,
    fontSize: font.size.hero,
    lineHeight: font.lineHeight.hero,
    fontWeight: font.weight.regular,
    color: color.ink.default,
  },

  pastoralSubtitle: {
    fontFamily: font.family.sans,
    fontSize: font.size.label,
    lineHeight: font.lineHeight.tight,
    fontStyle: 'italic',
    color: color.ink.soft,
    marginBottom: space.s3,
  },

  verseBlock: {
    flexDirection: 'row',
    marginBottom: space.s5,
  },
  verseRule: {
    width: border.thick,
    backgroundColor: color.gold.default,
    borderRadius: border.thin,
  },
  verseTextWrap: {
    flex: 1,
    paddingLeft: space.s4,
  },
  verseText: {
    fontFamily: font.family.serif,
    fontSize: 17,
    lineHeight: font.lineHeight.scripture,
    fontWeight: font.weight.regular,
    color: color.ink.default,
    maxWidth: 36 * 16,
  },
  verseSkeleton: {
    height: font.lineHeight.scripture * 3,
    backgroundColor: color.sandstone.default,
    borderRadius: radius.sm,
    opacity: 0.6,
  },
  verseFallback: {
    fontFamily: font.family.sans,
    fontSize: font.size.bodyLg,
    lineHeight: font.lineHeight.body,
    color: color.ink.soft,
  },
  verseFallbackNote: {
    fontFamily: font.family.sans,
    fontSize: font.size.label,
    lineHeight: font.lineHeight.tight,
    fontStyle: 'italic',
    color: color.ink.soft,
    marginTop: space.s2,
  },

  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    borderWidth: border.thin,
    borderColor: color.hairline.default,
    overflow: 'hidden',
    marginBottom: space.s4,
  },
  toggleHit: {
    minHeight: a11y.touchTargetMin,
    justifyContent: 'center',
  },
  toggleSegment: {
    height: 32,
    paddingHorizontal: space.s4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  toggleSegmentActive: {
    backgroundColor: color.ink.default,
  },
  toggleLabel: {
    fontFamily: font.family.sans,
    fontSize: font.size.label,
    fontWeight: font.weight.medium,
    color: color.ink.soft,
    letterSpacing: font.tracking.label,
  },
  toggleLabelActive: {
    color: color.inverse,
  },

  attribution: {
    fontFamily: font.family.sans,
    fontSize: font.size.eyebrow,
    lineHeight: font.size.eyebrow + 5,
    color: color.ink.soft,
  },

  youVersionHit: {
    alignSelf: 'flex-start',
    marginTop: space.s2,
  },
  youVersionLabel: {
    fontFamily: font.family.sans,
    fontSize: font.size.eyebrow,
    fontWeight: font.weight.medium,
    color: color.gold.default,
    letterSpacing: font.tracking.label,
    textDecorationLine: 'underline',
  },
});

export const __testing = {
  CARD_HORIZONTAL_PAD,
  CARD_HORIZONTAL_PAD_SMALL,
  styles,
  TRANSLATIONS,
  DEFAULT_ATTRIBUTION_TB2,
  DEFAULT_ATTRIBUTION_TB,
  labelFor,
  attributionFor,
  formatReferenceWithTranslation,
};
