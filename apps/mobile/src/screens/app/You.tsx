/**
 * You — account surface (formerly Profile.tsx).
 *
 * Composition (top → bottom):
 *   ScreenHeader (eyebrow "You" + display title)
 *   Avatar + name + tradition + walk-stage line
 *   Plan-tier row (Free / Bless+ trial / Bless+) — single source of truth
 *   Settings list (ListItem rows): Edit profile / Faith replies / Notifications / Privacy / Blocked / Sign out
 *   BottomNav (active=you)
 *
 * Per system-v1 prototypes §B2.
 */

import { Image, StyleSheet, Text, View } from 'react-native';
import {
  BottomNav,
  ListItem,
  ScreenHeader,
  color,
  fontFamily,
  fontSize,
  letterSpacingFor,
  radius,
  space,
  tracking,
  type NavTabKey,
} from '../../lib/design-system/index.js';
import { BrandGlyph } from '../../lib/brand/BrandGlyph.js';
import { brandLogos, portraitSource } from '../../lib/brand/assets.js';

export type Tier = 'free' | 'plusTrial' | 'plus';

const TIER_COPY: Record<Tier, { label: string; helper: string; cta: string }> = {
  free: {
    label: 'Free',
    helper: 'upgrade for daily reveals + Heart-of-Week',
    cta: 'Upgrade',
  },
  plusTrial: {
    label: 'Bless+ \u00b7 trial',
    helper: '12 days remaining',
    cta: 'Manage',
  },
  plus: {
    label: 'Bless+',
    helper: 'renews monthly',
    cta: 'Manage',
  },
};

export type YouScreenProps = {
  name?: string;
  age?: number;
  city?: string;
  tradition?: string;
  walkStage?: string;
  tier?: Tier;
  onUpgrade?: () => void;
  onSignOut?: () => void;
  onEditProfile?: () => void;
  onFaithReplies?: () => void;
  onNotifications?: () => void;
  onPrivacy?: () => void;
  onBlocked?: () => void;
  onIncomingBlesses?: () => void;
  /** Number of people who have Blessed you. Drives badge on the row. */
  incomingBlessCount?: number;
  onNavigate?: (tab: NavTabKey) => void;
};

export function YouScreen({
  name = 'Friend',
  age,
  city,
  tradition,
  walkStage,
  tier = 'free',
  onUpgrade,
  onSignOut,
  onEditProfile,
  onFaithReplies,
  onNotifications,
  onPrivacy,
  onBlocked,
  onIncomingBlesses,
  incomingBlessCount = 0,
  onNavigate,
}: YouScreenProps) {
  const tierCopy = TIER_COPY[tier];
  const subtitle = [city, tradition, walkStage].filter(Boolean).join(' \u00b7 ');

  return (
    <View style={styles.root}>
      <View style={styles.scroll}>
        <ScreenHeader eyebrow="You" />

        <View style={styles.identity}>
          <Image source={portraitSource(1)} style={styles.avatar} resizeMode="cover" />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.name}>
              {name}
              {age !== undefined && (
                <>
                  ,{' '}
                  <Text style={styles.nameAge}>{age}</Text>
                </>
              )}
            </Text>
            {subtitle.length > 0 && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
        </View>

        {/* Plan-tier row — single source of truth */}
        <View style={styles.tierWrap}>
          <View style={styles.tierRow}>
            <Image source={brandLogos.logoMark} style={styles.tierIcon} resizeMode="contain" />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.tierEyebrow}>Account</Text>
              <Text style={styles.tierLabel}>
                {tierCopy.label}{' '}
                <Text style={styles.tierHelper}>{`\u00b7 ${tierCopy.helper}`}</Text>
              </Text>
            </View>
            <View style={styles.tierCta}>
              <Text style={styles.tierCtaText} onPress={onUpgrade}>
                {tierCopy.cta}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.list}>
          {incomingBlessCount > 0 ? (
            <ListItem
              label={`${incomingBlessCount} ${incomingBlessCount === 1 ? 'person has' : 'people have'} Blessed you`}
              helper={tier === 'free' ? 'Bless+ to see who' : 'Tap to view'}
              glyph={<BrandGlyph name="blessPlusCrown" size={18} />}
              onPress={onIncomingBlesses}
            />
          ) : null}
          <ListItem
            label="Edit profile"
            helper="Photo, name, city, intent"
            glyph={<BrandGlyph name="editPencil" size={18} />}
            onPress={onEditProfile}
          />
          <ListItem
            label="Faith replies"
            helper="Re-take the questionnaire"
            glyph={<BrandGlyph name="verseOfDayHeader" size={18} />}
            onPress={onFaithReplies}
          />
          <ListItem
            label="Notifications"
            helper="Daily delivery time"
            glyph={<BrandGlyph name="bell" size={18} />}
            onPress={onNotifications}
          />
          <ListItem
            label="Privacy"
            helper="Who sees what"
            glyph={<BrandGlyph name="shield" size={18} />}
            onPress={onPrivacy}
          />
          <ListItem
            label="Blocked accounts"
            helper="Empty"
            glyph={<BrandGlyph name="block" size={18} />}
            onPress={onBlocked}
          />
          <ListItem
            label="Sign out"
            destructive
            glyph={<BrandGlyph name="signOut" size={18} />}
            onPress={onSignOut}
          />
        </View>
      </View>

      <BottomNav active="you" onSelect={onNavigate ?? (() => {})} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: color.parchment.default,
  },
  scroll: { flex: 1 },

  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.s6,
    marginTop: space.s4,
    gap: space.s4,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: color.hairline.default,
    overflow: 'hidden',
  },
  name: {
    fontFamily: fontFamily.serifMedium,
    fontSize: fontSize.h3,
    color: color.ink.default,
  },
  nameAge: { fontFamily: fontFamily.serifItalic, fontWeight: '400' },
  subtitle: {
    marginTop: 4,
    fontFamily: fontFamily.sans,
    fontSize: fontSize.caption,
    color: color.ink.soft,
  },

  tierWrap: { paddingHorizontal: space.s6, marginTop: space.s5 },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.s3,
    paddingHorizontal: space.s4,
    paddingVertical: space.s3,
    backgroundColor: color.parchment.raised,
    borderWidth: 1,
    borderColor: color.hairline.soft,
    borderRadius: radius.lg,
  },
  tierIcon: {
    width: 36,
    height: 36,
  },
  tierEyebrow: {
    fontFamily: fontFamily.sansSemibold,
    fontSize: 10,
    letterSpacing: letterSpacingFor(tracking.eyebrow, 10),
    textTransform: 'uppercase',
    color: color.warning[700],
  },
  tierLabel: {
    marginTop: 1,
    fontFamily: fontFamily.sansSemibold,
    fontSize: fontSize.body,
    color: color.ink.default,
  },
  tierHelper: {
    fontFamily: fontFamily.sans,
    color: color.ink.soft,
    fontWeight: '400',
  },
  tierCta: {
    paddingHorizontal: space.s3,
    paddingVertical: space.s1,
    borderRadius: radius.pill,
    backgroundColor: color.ink.default,
  },
  tierCtaText: {
    fontFamily: fontFamily.sansSemibold,
    fontSize: fontSize.label,
    color: color.parchment.default,
  },

  list: {
    paddingHorizontal: space.s2,
    marginTop: space.s5,
  },
});
