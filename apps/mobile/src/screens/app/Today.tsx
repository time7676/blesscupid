/**
 * Today — app shell home screen, v1.2 swipe-pager redesign.
 *
 * Composition (top → bottom, all above-fold or single page):
 *   ScreenHeader (eyebrow date + greeting + bell)
 *   VerseCard.compact (Pastor-locked daily verse)
 *   "Three for today" eyebrow + page indicator (1/3)
 *   IntroductionCard pager (horizontal, paging-enabled, snap-to-width)
 *   BottomNav (active=today)
 *
 * The prior version stacked all three matches vertically inside a single
 * scroll, which produced an "infinite" feeling for users — see issue
 * surfaced 2026-05-06. The redesign holds the slow-cinema brand promise:
 * one face, one breath, swipe to the next, decide on detail.
 *
 * Horizontal swipe is NAVIGATION, not yes/no judgment. The decision
 * (Begin a conversation / Pass quietly) lives on Profile detail. This
 * is the core anti-Tinder posture documented in PRODUCT.md §Strategic.
 */

import { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  BottomNav,
  EmptyState,
  GoldRule,
  IntroductionCard,
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
import { BrandGlyph } from '../../lib/brand/BrandGlyph.js';
import { portraitSource, verseCardBackgrounds } from '../../lib/brand/assets.js';

// Mock matches — replaced by API on integration (BLE-7g matching service).
type TodayMatch = {
  id: string;
  name: string;
  age: number;
  place: string;
  tradition: string;
  stage: string;
  echo: string;
  portrait: number;
};

const TODAY_MATCHES: TodayMatch[] = [
  {
    id: 'naomi',
    name: 'Naomi',
    age: 27,
    place: 'Manila',
    tradition: 'Catholic',
    stage: 'lifelong',
    echo: '“I keep coming back to slow Sundays and a long table.”',
    portrait: 0,
  },
  {
    id: 'ruth',
    name: 'Ruth',
    age: 30,
    place: 'Singapore',
    tradition: 'Pentecostal',
    stage: 'came later',
    echo: '“Faith found me in my late twenties. Still figuring out what that means at brunch.”',
    portrait: 2,
  },
  {
    id: 'esther',
    name: 'Esther',
    age: 26,
    place: 'Jakarta',
    tradition: 'Reformed',
    stage: 'returning',
    echo: '“Back in church after a long quiet. Looking for honest company.”',
    portrait: 4,
  },
];

const TODAY_VERSE = {
  text: '"Be anxious for nothing, but in everything by prayer…"',
  reference: 'Phil 4:6',
};

function dateString(): { eyebrow: string; greeting: string } {
  const d = new Date();
  const weekday = d.toLocaleDateString(undefined, { weekday: 'long' });
  const day = d.getDate();
  return {
    eyebrow: `Today · ${weekday} ${day}`,
    greeting: d.getHours() < 12 ? 'Good morning' : d.getHours() < 18 ? 'Good afternoon' : 'Good evening',
  };
}

function verseArtworkForNow() {
  const hour = new Date().getHours();
  if (hour < 11) return verseCardBackgrounds.morning;
  if (hour < 17) return verseCardBackgrounds.midday;
  return verseCardBackgrounds.evening;
}

export type TodayScreenProps = {
  name?: string;
  onNavigate?: (tab: NavTabKey) => void;
  onMatchPress?: (matchId: string) => void;
};

export function TodayScreen({ name = 'Friend', onNavigate, onMatchPress }: TodayScreenProps) {
  const { eyebrow, greeting } = dateString();
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<FlatList<TodayMatch>>(null);
  const screenWidth = Dimensions.get('window').width;

  // FlatList paging fires on any scroll; we use offset / width to derive
  // the snapped page rather than the gesture velocity, so a partial drag
  // that springs back doesn't change the indicator.
  function onScrollEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const x = e.nativeEvent.contentOffset.x;
    const next = Math.round(x / screenWidth);
    if (next !== activeIndex) setActiveIndex(next);
  }

  const matches = TODAY_MATCHES;
  const empty = matches.length === 0;

  return (
    <View style={styles.root}>
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
            <BrandGlyph name="bell" size={18} />
          </Pressable>
        }
      />

      <View style={styles.versePad}>
        <VerseCard
          variant="compact"
          illustration={
            <Image source={verseArtworkForNow()} style={styles.verseArtwork} resizeMode="cover" />
          }
          text={TODAY_VERSE.text}
          reference={TODAY_VERSE.reference}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionEyebrow}>Three for today</Text>
        <GoldRule width={28} style={styles.goldRule} />
        {!empty ? (
          <Text style={styles.pageIndex}>
            {activeIndex + 1} / {matches.length}
          </Text>
        ) : null}
      </View>

      {empty ? (
        <View style={styles.emptyWrap}>
          <EmptyState
            eyebrow="Quiet morning"
            title="You've met everyone for today"
            body="Come back tomorrow at sunrise. We send three at a time on purpose."
          />
        </View>
      ) : (
        <View style={styles.pagerWrap}>
          <FlatList
            ref={listRef}
            data={matches}
            keyExtractor={(m) => m.id}
            horizontal
            pagingEnabled
            snapToInterval={screenWidth}
            snapToAlignment="start"
            decelerationRate="fast"
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={onScrollEnd}
            renderItem={({ item }) => (
              <IntroductionCard
                width={screenWidth}
                name={item.name}
                age={item.age}
                place={item.place}
                tradition={item.tradition}
                stage={item.stage}
                echo={item.echo}
                portrait={portraitSource(item.portrait)}
                onPress={() => onMatchPress?.(item.id)}
              />
            )}
          />

          <View style={styles.dots}>
            {matches.map((m, i) => (
              <View
                key={m.id}
                style={[styles.dot, i === activeIndex ? styles.dotActive : null]}
              />
            ))}
          </View>
        </View>
      )}

      <BottomNav active="today" onSelect={onNavigate ?? (() => {})} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: color.parchment.default,
  },
  bellBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: color.hairline.default,
    alignItems: 'center',
    justifyContent: 'center',
  },

  versePad: {
    paddingHorizontal: space.s6,
    marginTop: space.s4,
  },
  verseArtwork: {
    width: '100%',
    height: 80,
    borderRadius: radius.md,
  },

  section: {
    paddingHorizontal: space.s6,
    marginTop: space.s6,
    marginBottom: space.s3,
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
  pageIndex: {
    marginLeft: 'auto',
    fontFamily: fontFamily.sans,
    fontSize: fontSize.caption,
    color: color.ink.soft,
    fontVariant: ['tabular-nums'],
  },

  pagerWrap: {
    flex: 1,
  },

  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: space.s3,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: color.hairline.default,
  },
  dotActive: {
    backgroundColor: color.cobalt[500],
    width: 18,
  },

  emptyWrap: {
    flex: 1,
    paddingHorizontal: space.s6,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
