/**
 * ProfileDetail — single-person full read with explicit decision CTAs.
 *
 * Shape:
 *   Hero portrait (full bleed, dawn gradient if no asset)
 *   Name + age + city (serif H2)
 *   Faith band (sandstone) — tradition + walk + a one-line scripture echo
 *   Pastor-curated story prompts with the user's answer (Hinge-style, but
 *     the prompts are picked by the Pastor, not free-form)
 *   Photos (1–6) inline
 *   Footer: Report + Block, always visible
 *
 * Sticky bottom action bar:
 *   [ Pass quietly ]  [ Begin a conversation ]
 *
 * Per PRODUCT.md §Strategic. The decision happens here, with words, never
 * by horizontal swipe-to-judge. "Pass quietly" is the explicit anti-Tinder
 * affordance: no notification to the other side, no streak break, no shame.
 */

import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Button,
  GoldRule,
  ScreenHeader,
  color,
  fontFamily,
  fontSize,
  letterSpacingFor,
  radius,
  space,
  tracking,
} from '../../lib/design-system/index.js';
import { portraitSource } from '../../lib/brand/assets.js';

export type StoryPrompt = {
  prompt: string;
  answer: string;
};

export type ProfileDetailData = {
  id: string;
  name: string;
  age: number;
  place: string;
  tradition: string;
  walk: string;
  verseEcho?: string;
  prompts: StoryPrompt[];
  photoIndices: number[];
};

const MOCK_PROFILE: ProfileDetailData = {
  id: 'naomi',
  name: 'Naomi',
  age: 27,
  place: 'Manila',
  tradition: 'Catholic',
  walk: 'lifelong',
  verseEcho: '"Be still, and know that I am God." Psalm 46:10 keeps me from the noise.',
  prompts: [
    {
      prompt: 'A Sunday I would happily repeat',
      answer:
        '8am Mass with my lola, then a long, slow lunch with whoever shows up. The dishes are part of the Sunday.',
    },
    {
      prompt: 'Where I am in my faith right now',
      answer:
        'Lifelong Catholic, returning to the sacrament of confession after a long quiet. Curious, not performative.',
    },
    {
      prompt: 'What I am looking for here',
      answer:
        'A friendship that could grow into a marriage. No rush, but I am not on the app to scroll.',
    },
  ],
  photoIndices: [0, 3, 5],
};

export type ProfileDetailScreenProps = {
  matchId?: string;
  data?: ProfileDetailData;
  onClose?: () => void;
  onPass?: () => void;
  onBegin?: () => void;
};

export function ProfileDetailScreen({
  data = MOCK_PROFILE,
  onClose,
  onPass,
  onBegin,
}: ProfileDetailScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <ScreenHeader eyebrow="Today" title={data.name} onBack={onClose} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: 96 + Math.max(insets.bottom, space.s5) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Image
            source={portraitSource(data.photoIndices[0] ?? 0)}
            style={styles.heroImage}
            resizeMode="cover"
          />
        </View>

        <View style={styles.identityBlock}>
          <Text style={styles.name}>
            {data.name}
            {', '}
            <Text style={styles.age}>{data.age}</Text>
          </Text>
          <Text style={styles.place}>{data.place}</Text>
        </View>

        <View style={styles.faithBand}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionEyebrow}>On faith</Text>
            <GoldRule width={28} style={styles.goldRule} />
          </View>
          <View style={styles.faithRow}>
            <View style={styles.chipTradition}>
              <Text style={styles.chipTraditionText}>{data.tradition}</Text>
            </View>
            <View style={styles.chipStage}>
              <Text style={styles.chipStageText}>{data.walk}</Text>
            </View>
          </View>
          {data.verseEcho ? (
            <Text style={styles.verseEcho}>{data.verseEcho}</Text>
          ) : null}
        </View>

        {data.prompts.map((p, i) => (
          <View key={`${p.prompt}-${i}`} style={styles.promptCard}>
            <Text style={styles.promptLabel}>{p.prompt}</Text>
            <Text style={styles.promptAnswer}>{p.answer}</Text>
            {i < data.prompts.length - 1 && data.photoIndices[i + 1] !== undefined ? (
              <Image
                source={portraitSource(data.photoIndices[i + 1] ?? 0)}
                style={styles.promptPhoto}
                resizeMode="cover"
              />
            ) : null}
          </View>
        ))}

        <View style={styles.safetyRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Report ${data.name}`}
            style={styles.safetyBtn}
          >
            <Text style={styles.safetyText}>Report</Text>
          </Pressable>
          <Text style={styles.safetyDivider}>·</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Block ${data.name}`}
            style={styles.safetyBtn}
          >
            <Text style={styles.safetyText}>Block</Text>
          </Pressable>
        </View>
      </ScrollView>

      <View
        style={[
          styles.actionBar,
          { paddingBottom: Math.max(insets.bottom, space.s5) },
        ]}
      >
        <View style={styles.actionRow}>
          <View style={{ flex: 1 }}>
            <Button variant="secondary" full label="Pass quietly" onPress={onPass} />
          </View>
          <View style={{ flex: 1 }}>
            <Button variant="primary" full label="Begin a conversation" onPress={onBegin} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.parchment.default },
  scroll: { flex: 1 },
  content: { paddingBottom: space.s8 },

  hero: {
    width: '100%',
    aspectRatio: 0.86,
    backgroundColor: color.sandstone.warm,
    overflow: 'hidden',
  },
  heroImage: { width: '100%', height: '100%' },

  identityBlock: {
    paddingHorizontal: space.s6,
    paddingTop: space.s5,
    paddingBottom: space.s4,
  },
  name: {
    fontFamily: fontFamily.serifMedium,
    fontSize: 28,
    lineHeight: 32,
    color: color.ink.default,
  },
  age: { fontFamily: fontFamily.serifItalic },
  place: {
    marginTop: 4,
    fontFamily: fontFamily.sans,
    fontSize: fontSize.bodyLg,
    color: color.ink.soft,
  },

  faithBand: {
    backgroundColor: color.sandstone.default,
    paddingHorizontal: space.s6,
    paddingVertical: space.s5,
    gap: space.s3,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.s3,
  },
  sectionEyebrow: {
    fontFamily: fontFamily.sansSemibold,
    fontSize: fontSize.eyebrow,
    letterSpacing: letterSpacingFor(tracking.eyebrow, fontSize.eyebrow),
    textTransform: 'uppercase',
    color: color.ink.soft,
  },
  goldRule: { marginLeft: 0 },
  faithRow: {
    flexDirection: 'row',
    gap: space.s2,
    flexWrap: 'wrap',
  },
  chipTradition: {
    paddingHorizontal: space.s3,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: color.warning[100],
  },
  chipTraditionText: {
    fontFamily: fontFamily.sansMedium,
    fontSize: 11,
    color: color.warning[700],
  },
  chipStage: {
    paddingHorizontal: space.s3,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: color.parchment.raised,
    borderWidth: 1,
    borderColor: color.hairline.soft,
  },
  chipStageText: {
    fontFamily: fontFamily.sans,
    fontSize: 11,
    color: color.ink.soft,
  },
  verseEcho: {
    marginTop: space.s2,
    fontFamily: fontFamily.serifItalic,
    fontSize: fontSize.bodyLg,
    lineHeight: 24,
    color: color.ink.default,
  },

  promptCard: {
    marginHorizontal: space.s6,
    marginTop: space.s5,
    paddingHorizontal: space.s5,
    paddingVertical: space.s5,
    backgroundColor: color.parchment.raised,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: color.hairline.soft,
    gap: space.s3,
  },
  promptLabel: {
    fontFamily: fontFamily.sansSemibold,
    fontSize: fontSize.eyebrow,
    letterSpacing: letterSpacingFor(tracking.eyebrow, fontSize.eyebrow),
    textTransform: 'uppercase',
    color: color.cobalt[700],
  },
  promptAnswer: {
    fontFamily: fontFamily.serif,
    fontSize: 19,
    lineHeight: 28,
    color: color.ink.default,
  },
  promptPhoto: {
    marginTop: space.s3,
    width: '100%',
    aspectRatio: 1,
    borderRadius: radius.lg,
    backgroundColor: color.sandstone.warm,
  },

  safetyRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: space.s4,
    marginTop: space.s7,
    marginBottom: space.s4,
  },
  safetyBtn: { padding: space.s2 },
  safetyText: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.caption,
    color: color.ink.soft,
    textDecorationLine: 'underline',
  },
  safetyDivider: { color: color.ink.soft },

  actionBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: space.s5,
    paddingTop: space.s4,
    backgroundColor: color.parchment.raised,
    borderTopWidth: 1,
    borderTopColor: color.hairline.default,
  },
  actionRow: {
    flexDirection: 'row',
    gap: space.s3,
  },
});
