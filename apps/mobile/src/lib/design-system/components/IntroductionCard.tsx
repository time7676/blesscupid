/**
 * IntroductionCard — full-bleed person card used on the Today swipe pager.
 *
 * Per BLE v1.2 Today redesign. One person per page; horizontal swipe
 * navigates between today's three introductions. Swipe is NAVIGATION,
 * not judgment. The decision (Begin / Pass) lives on Profile detail.
 *
 * Composition (top → bottom):
 *   Portrait (full-width hero)
 *   Name + age + city (serif)
 *   Tradition + walk chips
 *   Echo line (one-line bio teaser)
 *   "Read full profile" affordance (tap target = whole card)
 */

import type { ImageSourcePropType } from 'react-native';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { color, fontFamily, fontSize, radius, space } from '../tokens.js';

export type IntroductionCardProps = {
  width: number;
  name: string;
  age: number;
  place: string;
  tradition: string;
  stage: string;
  echo?: string;
  portrait: ImageSourcePropType;
  onPress?: () => void;
};

export function IntroductionCard({
  width,
  name,
  age,
  place,
  tradition,
  stage,
  echo,
  portrait,
  onPress,
}: IntroductionCardProps) {
  return (
    <View style={[styles.page, { width }]}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${name}, ${age}, ${place}. Read full profile.`}
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      >
        <Image source={portrait} style={styles.portrait} resizeMode="cover" />
        <View style={styles.body}>
          <Text style={styles.name}>
            {name}
            {', '}
            <Text style={styles.age}>{age}</Text>
          </Text>
          <Text style={styles.place}>{place}</Text>

          <View style={styles.chips}>
            <View style={styles.chipTradition}>
              <Text style={styles.chipTraditionText}>{tradition}</Text>
            </View>
            <View style={styles.chipStage}>
              <Text style={styles.chipStageText}>{stage}</Text>
            </View>
          </View>

          {echo ? <Text style={styles.echo}>{echo}</Text> : null}

          <Text style={styles.readMore}>Read full profile</Text>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  // Pager page wraps the card with horizontal padding so the card has
  // edge breathing room without losing the snap-to-width pager invariant.
  page: {
    paddingHorizontal: space.s5,
    paddingBottom: space.s4,
  },
  card: {
    flex: 1,
    backgroundColor: color.parchment.raised,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: color.hairline.soft,
    overflow: 'hidden',
  },
  cardPressed: {
    opacity: 0.92,
  },
  portrait: {
    width: '100%',
    // Portrait gets 55% of the available card height. `aspectRatio` was
    // tempting, but in a vertically-constrained pager page it pushed the
    // body off-screen on iPhone-narrow devices. Flex shares are stable
    // across all heights.
    flexBasis: '55%',
    flexShrink: 1,
    backgroundColor: color.sandstone.warm,
  },
  body: {
    paddingHorizontal: space.s6,
    paddingTop: space.s5,
    paddingBottom: space.s6,
    flexBasis: '45%',
    flexGrow: 1,
    gap: space.s2,
  },
  name: {
    fontFamily: fontFamily.serifMedium,
    fontSize: 28,
    color: color.ink.default,
    lineHeight: 32,
  },
  age: {
    fontFamily: fontFamily.serifItalic,
  },
  place: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.body,
    color: color.ink.soft,
  },
  chips: {
    marginTop: space.s2,
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
    backgroundColor: color.sandstone.default,
  },
  chipStageText: {
    fontFamily: fontFamily.sans,
    fontSize: 11,
    color: color.ink.soft,
  },
  echo: {
    marginTop: space.s2,
    fontFamily: fontFamily.serifItalic,
    fontSize: 16,
    lineHeight: 22,
    color: color.ink.default,
  },
  readMore: {
    marginTop: 'auto',
    fontFamily: fontFamily.sansSemibold,
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: color.cobalt[500],
  },
});
