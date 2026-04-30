/**
 * OneTimeOfferSheet — founding-member promo, full-sheet modal.
 *
 * Triggered manually (e.g. day 7 / day 30 milestone). Always dismissible.
 * No countdown timer, no shame copy — per v1.1 monetization posture.
 */

import { Image, StyleSheet, Text, View } from 'react-native';
import {
  Button,
  GoldRule,
  Sheet,
  color,
  fontFamily,
  fontSize,
  letterSpacingFor,
  radius,
  space,
  tracking,
} from '../../../lib/design-system/index.js';
import { brandLogos, heroArt } from '../../../lib/brand/assets.js';

const DEFAULT_BENEFITS = [
  'See who is drawn to you',
  'One Heart-of-the-Week \u2014 past the queue',
  'Skip the moderation line as a verified member',
];

export type OneTimeOfferSheetProps = {
  visible: boolean;
  onDismiss: () => void;
  ribbon?: string;
  headline?: string;
  body?: string;
  benefits?: string[];
  ctaLabel?: string;
  fineprint?: string;
  onAccept?: () => void;
};

export function OneTimeOfferSheet({
  visible,
  onDismiss,
  ribbon = 'Founding member',
  headline = 'Three months of Bless+, on us.',
  body = 'You signed up in our first month. As a thank-you, the next ninety days are free.',
  benefits = DEFAULT_BENEFITS,
  ctaLabel = 'Start free \u2014 90 days',
  fineprint = '$8.99/month after the trial. Cancel anytime in You.',
  onAccept,
}: OneTimeOfferSheetProps) {
  return (
    <Sheet visible={visible} onDismiss={onDismiss} variant="full">
      <View style={styles.hero}>
        <Image source={heroArt.oneTimeOfferBand} style={styles.heroArtwork} resizeMode="cover" />
        <View style={styles.ribbon}>
          <Text style={styles.ribbonText}>{ribbon}</Text>
        </View>
        <View style={styles.heroSpacer} />
        <GoldRule width={56} />
      </View>

      <Text style={styles.headline}>
        {headline.split('Bless+').map((part, i, arr) =>
          i < arr.length - 1 ? (
            <Text key={i}>
              {part}
              <Text style={styles.headlineAccent}>Bless+</Text>
            </Text>
          ) : (
            <Text key={i}>{part}</Text>
          ),
        )}
      </Text>

      <Text style={styles.body}>{body}</Text>

      <View style={styles.benefits}>
        {benefits.map((b) => (
          <View key={b} style={styles.benefitRow}>
            <View style={styles.bullet} />
            <Text style={styles.benefitText}>{b}</Text>
          </View>
        ))}
      </View>

      <View style={styles.spacer} />

      <Button
        variant="primary"
        label={ctaLabel}
        onPress={() => {
          onAccept?.();
          onDismiss();
        }}
      />
      <View style={{ height: space.s2 }} />
      <Button variant="ghost" label="Maybe later" onPress={onDismiss} />
      <Image source={brandLogos.blessPlusWordmark} style={styles.wordmark} resizeMode="contain" />
      <Text style={styles.fineprint}>{fineprint}</Text>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  hero: {
    height: 140,
    marginHorizontal: -space.s6, // pull through the sheet padding
    marginTop: -space.s7,
    marginBottom: space.s5,
    backgroundColor: color.sandstone.warm,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    alignItems: 'center',
    paddingTop: space.s5,
    paddingBottom: space.s4,
    overflow: 'hidden',
    position: 'relative',
  },
  heroArtwork: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.95,
  },
  ribbon: {
    paddingHorizontal: space.s4,
    paddingVertical: space.s1,
    backgroundColor: color.ink.default,
    borderRadius: radius.pill,
  },
  ribbonText: {
    fontFamily: fontFamily.sansSemibold,
    fontSize: 10,
    letterSpacing: letterSpacingFor(tracking.eyebrow, 10),
    textTransform: 'uppercase',
    color: color.parchment.default,
  },
  heroSpacer: { flex: 1 },
  headline: {
    fontFamily: fontFamily.serif,
    fontSize: 30,
    lineHeight: 33,
    letterSpacing: -0.4,
    color: color.ink.default,
  },
  headlineAccent: {
    fontFamily: fontFamily.serifItalic,
    color: color.warning[700],
  },
  body: {
    marginTop: space.s3,
    fontFamily: fontFamily.sans,
    fontSize: fontSize.body,
    lineHeight: Math.round(fontSize.body * 1.55),
    color: color.ink.soft,
  },
  benefits: {
    marginTop: space.s5,
    gap: space.s3,
  },
  benefitRow: {
    flexDirection: 'row',
    gap: space.s3,
    alignItems: 'flex-start',
  },
  bullet: {
    marginTop: 6,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: color.warning[500],
  },
  benefitText: {
    flex: 1,
    fontFamily: fontFamily.sans,
    fontSize: fontSize.body,
    lineHeight: Math.round(fontSize.body * 1.5),
    color: color.ink.default,
  },
  spacer: { flex: 1 },
  wordmark: {
    width: 146,
    height: 36,
    alignSelf: 'center',
    marginTop: space.s3,
  },
  fineprint: {
    marginTop: space.s2,
    textAlign: 'center',
    fontFamily: fontFamily.sans,
    fontSize: fontSize.caption,
    color: color.ink.soft,
  },
});
