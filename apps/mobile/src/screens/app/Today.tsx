/**
 * Today — app shell home screen.
 *
 * Composition (top → bottom):
 *   ScreenHeader (eyebrow date + greeting + bell affordance)
 *   VerseCard.compact (Pastor-locked daily verse)
 *   "Three for today" section (3 profile cards, painterly portraits)
 *   Profile-views metric card (gated reveal — Bless+ paywall on tap)
 *   BottomNav (active=today)
 *
 * Per system-v1 prototypes §B1. Monetization pattern: show metric first,
 * ask for upgrade second. No banners, no shame copy.
 */

import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  BottomNav,
  GoldRule,
  ScreenHeader,
  VerseCard,
  color,
  fontFamily,
  fontSize,
  letterSpacingFor,
  radius,
  space,
  tracking,
  type NavTabKey,
} from '../../lib/design-system/index.js';
import { GatedFeatureSheet } from './modals/GatedFeatureSheet.js';

// Procedural painterly portrait gradients — placeholder for moderated photos.
// Mirrors --portrait-1..6 in docs/design/system-v1/tokens.css. RN doesn't
// render CSS gradients natively, so we approximate with backgroundColor + a
// subtle inner shadow until we wire `expo-linear-gradient`.
const PORTRAIT_BG = [
  '#E5C97D', // portrait-1 — sandstone-warm + gold
  '#D6E0F4', // portrait-2 — cobalt mist
  '#C7E0CC', // portrait-3 — sage + sandstone
  '#FCEBD2', // portrait-4 — amber tint + parchment
  '#EFE4D2', // portrait-5 — sandstone deep
  '#E5EFE6', // portrait-6 — success + parchment
];

// Mock matches — replaced by API on integration.
const TODAY_MATCHES = [
  { name: 'Naomi', age: 27, place: 'Manila', tradition: 'Catholic', stage: 'lifelong', portrait: 0 },
  { name: 'Ruth', age: 30, place: 'Singapore', tradition: 'Pentecostal', stage: 'came later', portrait: 2 },
  { name: 'Esther', age: 26, place: 'Jakarta', tradition: 'Reformed', stage: 'returning', portrait: 4 },
];

// Mock verse — replaced by /v1/verse on integration (BLE-22).
const TODAY_VERSE = {
  text: '"Be anxious for nothing, but in everything by prayer…"',
  reference: 'Phil 4:6',
};

// Aggregate profile-views metric — gated by Bless+.
const PROFILE_VIEWS_THIS_WEEK = 6;

function dateString(): { eyebrow: string; greeting: string } {
  const d = new Date();
  const weekday = d.toLocaleDateString(undefined, { weekday: 'long' });
  const day = d.getDate();
  return {
    eyebrow: `Today \u00b7 ${weekday} ${day}`,
    // Time-of-day greeting; copy proposed for Pastor review.
    greeting: d.getHours() < 12 ? 'Good morning' : d.getHours() < 18 ? 'Good afternoon' : 'Good evening',
  };
}

export type TodayScreenProps = {
  /** Display name from session. */
  name?: string;
  /** Plan tier — determines whether the profile-views card is gated. */
  tier?: 'free' | 'plus';
  /** BottomNav handler — wired to navigation in Phase 6. */
  onNavigate?: (tab: NavTabKey) => void;
  /** Tap a profile card → ProfileDetail. */
  onMatchPress?: (name: string) => void;
};

export function TodayScreen({
  name = 'Friend',
  tier = 'free',
  onNavigate,
  onMatchPress,
}: TodayScreenProps) {
  const [paywallOpen, setPaywallOpen] = useState(false);
  const { eyebrow, greeting } = dateString();

  function handleViewsPress() {
    if (tier === 'free') setPaywallOpen(true);
    // tier === 'plus' navigates to ProfileViews list (wired in Phase 7).
  }

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          eyebrow={eyebrow}
          title={`${greeting}, ${name}`}
          variant="display"
          trailing={
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Notifications"
              hitSlop={12}
              style={styles.bellBtn}
            >
              <Text style={styles.bellGlyph}>{'\u2661'}</Text>
            </Pressable>
          }
        />

        <View style={styles.versePad}>
          <VerseCard
            variant="compact"
            text={TODAY_VERSE.text}
            reference={TODAY_VERSE.reference}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionEyebrow}>Three for today</Text>
          <GoldRule width={28} style={styles.goldRule} />
        </View>

        <View style={styles.matches}>
          {TODAY_MATCHES.map((m) => (
            <Pressable
              key={m.name}
              onPress={() => onMatchPress?.(m.name)}
              style={({ pressed }) => [styles.match, pressed && styles.matchPressed]}
              accessibilityRole="button"
              accessibilityLabel={`${m.name}, ${m.age}, ${m.place}`}
            >
              <View
                style={[
                  styles.portrait,
                  { backgroundColor: PORTRAIT_BG[m.portrait] },
                ]}
              />
              <View style={styles.matchBody}>
                <Text style={styles.matchName}>
                  {m.name},{' '}
                  <Text style={styles.matchAge}>{m.age}</Text>
                </Text>
                <Text style={styles.matchPlace}>{m.place}</Text>
                <View style={styles.chips}>
                  <View style={styles.chipTradition}>
                    <Text style={styles.chipTraditionText}>{m.tradition}</Text>
                  </View>
                  <View style={styles.chipStage}>
                    <Text style={styles.chipStageText}>{m.stage}</Text>
                  </View>
                </View>
              </View>
            </Pressable>
          ))}
        </View>

        {/* Profile-views metric card — gated reveal */}
        <Pressable
          onPress={handleViewsPress}
          style={({ pressed }) => [styles.viewsCard, pressed && styles.matchPressed]}
          accessibilityRole="button"
          accessibilityLabel={`${PROFILE_VIEWS_THIS_WEEK} people viewed your profile this week. Tap to unlock.`}
        >
          <View style={styles.viewsAvatars}>
            {[0, 2, 4].map((i, idx) => (
              <View
                key={i}
                style={[
                  styles.viewsAvatar,
                  {
                    backgroundColor: PORTRAIT_BG[i],
                    left: idx * 16,
                  },
                ]}
              />
            ))}
          </View>
          <View style={styles.viewsBody}>
            <Text style={styles.viewsEyebrow}>This week</Text>
            <Text style={styles.viewsTitle}>
              <Text style={styles.viewsCount}>{PROFILE_VIEWS_THIS_WEEK}</Text>
              {' people viewed your profile'}
            </Text>
          </View>
          <View style={styles.viewsCta}>
            <Text style={styles.viewsCtaText}>{tier === 'free' ? 'See who' : 'View'}</Text>
          </View>
        </Pressable>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <BottomNav active="today" onSelect={onNavigate ?? (() => {})} />

      <GatedFeatureSheet visible={paywallOpen} onDismiss={() => setPaywallOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: color.parchment.default,
  },
  scroll: { flex: 1 },
  content: { paddingBottom: space.s4 },
  bellBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: color.hairline.default,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellGlyph: {
    fontFamily: fontFamily.sans,
    fontSize: 14,
    color: color.ink.soft,
  },

  versePad: {
    paddingHorizontal: space.s6,
    marginTop: space.s4,
  },

  section: {
    paddingHorizontal: space.s6,
    marginTop: space.s7,
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

  matches: {
    paddingHorizontal: space.s6,
    marginTop: space.s4,
    gap: space.s3,
  },
  match: {
    flexDirection: 'row',
    backgroundColor: color.parchment.raised,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: color.hairline.soft,
    overflow: 'hidden',
  },
  matchPressed: { opacity: 0.7 },
  portrait: {
    width: 88,
    alignSelf: 'stretch',
  },
  matchBody: {
    flex: 1,
    paddingVertical: space.s4,
    paddingRight: space.s4,
    paddingLeft: space.s4,
  },
  matchName: {
    fontFamily: fontFamily.serifMedium,
    fontSize: 19,
    color: color.ink.default,
  },
  matchAge: {
    fontFamily: fontFamily.serifItalic,
    fontWeight: '400',
  },
  matchPlace: {
    marginTop: 2,
    fontFamily: fontFamily.sans,
    fontSize: fontSize.caption,
    color: color.ink.soft,
  },
  chips: {
    marginTop: space.s2,
    flexDirection: 'row',
    gap: 6,
  },
  chipTradition: {
    paddingHorizontal: space.s2,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: color.warning[100],
  },
  chipTraditionText: {
    fontFamily: fontFamily.sansMedium,
    fontSize: 10.5,
    color: color.warning[700],
  },
  chipStage: {
    paddingHorizontal: space.s2,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: color.sandstone.default,
  },
  chipStageText: {
    fontFamily: fontFamily.sans,
    fontSize: 10.5,
    color: color.ink.soft,
  },

  viewsCard: {
    marginHorizontal: space.s6,
    marginTop: space.s5,
    paddingHorizontal: space.s4,
    paddingVertical: space.s3,
    backgroundColor: color.parchment.raised,
    borderWidth: 1,
    borderColor: color.hairline.soft,
    borderRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.s3,
  },
  viewsAvatars: {
    width: 64,
    height: 30,
    flexShrink: 0,
    position: 'relative',
  },
  viewsAvatar: {
    position: 'absolute',
    top: 0,
    width: 30,
    height: 30,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: color.parchment.raised,
    opacity: 0.6, // RN can't blur — opacity stand-in.
  },
  viewsBody: { flex: 1, minWidth: 0 },
  viewsEyebrow: {
    fontFamily: fontFamily.sansSemibold,
    fontSize: 10,
    letterSpacing: letterSpacingFor(tracking.eyebrow, 10),
    textTransform: 'uppercase',
    color: color.warning[700],
  },
  viewsTitle: {
    marginTop: 2,
    fontFamily: fontFamily.serifMedium,
    fontSize: 17,
    color: color.ink.default,
  },
  viewsCount: { fontFamily: fontFamily.serifMediumItalic },
  viewsCta: {
    paddingHorizontal: space.s3,
    paddingVertical: space.s1,
    borderRadius: radius.pill,
    backgroundColor: color.ink.default,
  },
  viewsCtaText: {
    fontFamily: fontFamily.sansSemibold,
    fontSize: 11,
    color: color.parchment.default,
    letterSpacing: 0.4,
  },

  bottomSpacer: { height: space.s8 },
});
