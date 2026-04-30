/**
 * GatedFeatureSheet — Bless+ paywall for "See who viewed your profile" and
 * future Bless+ exclusives. Mid-screen sheet, dismissible.
 *
 * Uses Sheet variant 'center'. Pattern reused for Heart-of-Week, advanced
 * filters, read-receipts.
 */

import { Image, StyleSheet, Text, View } from 'react-native';
import {
  Button,
  Sheet,
  SheetEyebrow,
  color,
  fontFamily,
  fontSize,
  radius,
  space,
} from '../../../lib/design-system/index.js';
import { portraitSource } from '../../../lib/brand/assets.js';

export type GatedFeatureSheetProps = {
  visible: boolean;
  onDismiss: () => void;
  /** "Drawn to you" is the default copy; pass a different headline for other gated features. */
  headline?: string;
  body?: string;
  /** Tier metric — e.g. "6 people viewed your profile this week." */
  metric?: string;
  /** Primary action — defaults to "Unlock — 14 days free". */
  ctaLabel?: string;
  onUnlock?: () => void;
};

export function GatedFeatureSheet({
  visible,
  onDismiss,
  headline = "See who's drawn to you.",
  metric = 'Six people viewed your profile this week. Bless+ shows you who they are — so you can make the next move with intention, not guesswork.',
  ctaLabel = 'Unlock \u2014 14 days free',
  onUnlock,
}: GatedFeatureSheetProps) {
  return (
    <Sheet visible={visible} onDismiss={onDismiss} variant="center">
      <SheetEyebrow>Bless+ feature</SheetEyebrow>
      <Text style={styles.headline}>{headline}</Text>

      <View style={styles.avatarRow}>
        {[0, 2, 4, 1, 5].map((idx) => (
          <Image key={idx} source={portraitSource(idx)} style={styles.avatar} resizeMode="cover" />
        ))}
        <View style={styles.avatarMore}>
          <Text style={styles.avatarMoreText}>+1</Text>
        </View>
      </View>

      <Text style={styles.body}>{metric}</Text>

      <View style={styles.actions}>
        <Button
          variant="primary"
          label={ctaLabel}
          onPress={() => {
            onUnlock?.();
            onDismiss();
          }}
        />
        <Button variant="ghost" label="Not now" onPress={onDismiss} />
      </View>

      <Text style={styles.fineprint}>$8.99/month after. Cancel anytime in You.</Text>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  headline: {
    fontFamily: fontFamily.serif,
    fontSize: 24,
    lineHeight: 28,
    color: color.ink.default,
  },
  avatarRow: {
    marginTop: space.s5,
    flexDirection: 'row',
    gap: space.s2,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: color.hairline.default,
    opacity: 0.5,
    overflow: 'hidden',
  },
  avatarMore: {
    width: 52,
    height: 52,
    borderRadius: radius.pill,
    backgroundColor: color.sandstone.default,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarMoreText: {
    fontFamily: fontFamily.sansSemibold,
    fontSize: fontSize.label,
    color: color.ink.soft,
  },
  body: {
    marginTop: space.s4,
    fontFamily: fontFamily.sans,
    fontSize: fontSize.body,
    lineHeight: Math.round(fontSize.body * 1.55),
    color: color.ink.soft,
  },
  actions: {
    marginTop: space.s5,
    gap: space.s2,
  },
  fineprint: {
    marginTop: space.s2,
    textAlign: 'center',
    fontFamily: fontFamily.sans,
    fontSize: fontSize.caption,
    color: color.ink.soft,
  },
});
