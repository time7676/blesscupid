/**
 * Today — single-profile decision screen, v1.3.
 *
 * Per founder direction 2026-05-06: the user lands on Today and sees ONE
 * profile. They cannot scroll past it — they must decide. Three actions:
 *
 *   • Pass quietly  (left)   — silent skip, no notification to the other side
 *   • Begin (Like)  (right)  — sends Begin intent (verse-anchor enforced
 *                              at chat start)
 *   • Favorite      (center) — scarce 1/day priority signal
 *
 * After any decision, the next card slides in. After the day's stack is
 * exhausted, the empty state shows + the user is told to come back
 * tomorrow at sunrise.
 *
 * Composition:
 *   ScreenHeader (date eyebrow + greeting)
 *   VerseCard (Pastor-locked daily verse, the conversation anchor)
 *   IntroductionCard (current candidate)
 *   ActionRow (Pass | Favorite | Begin)
 *   BottomNav
 *
 * No horizontal swipe pager between candidates. Swipe-as-navigation
 * conflicts with swipe-as-judgment in user expectation; we collapse to
 * explicit buttons. v1.1 may add gesture support once Reanimated 4
 * worklets are validated on physical devices.
 */

import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  BottomNav,
  Button,
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
import {
  ApiError,
  getMatchesToday,
  getMatchQuota,
  sendMatchDecision,
  type MatchQuotaResponse,
  type MatchTodayCard,
  type MatchDecision,
} from '../../lib/api.js';
import { useAuth } from '../../lib/auth-store.js';
import { Events } from '../../lib/observability/analytics.js';

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
  const accessToken = useAuth((s) => s.accessToken);
  const { eyebrow, greeting } = dateString();
  const [stack, setStack] = useState<MatchTodayCard[] | null>(null);
  const [quota, setQuota] = useState<MatchQuotaResponse | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [busy, setBusy] = useState<MatchDecision | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paywallReason, setPaywallReason] = useState<'decisions' | 'favorites' | null>(null);
  const screenWidth = Dimensions.get('window').width;

  // Helpers derived from quota — favorite quota is server-side enforced
  // but mirrored here so the button can disable optimistically.
  const favoriteSpent = quota?.favoritesRemaining === 0;
  const decisionsExhausted = quota?.decisionsRemaining === 0 && !quota?.isUnlimited;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!accessToken) return;
      try {
        const [stackRes, quotaRes] = await Promise.all([
          getMatchesToday(accessToken),
          getMatchQuota(accessToken),
        ]);
        if (!cancelled) {
          setStack(stackRes.stack);
          setQuota(quotaRes);
          Events.dailyStackViewed({ stackSize: stackRes.stack.length, activeIndex: 0 });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.code : 'matches_load_failed');
          setStack([]);
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  const current = stack && activeIndex < stack.length ? stack[activeIndex] : null;
  const exhausted = stack !== null && activeIndex >= stack.length;

  async function decide(decision: MatchDecision) {
    if (!accessToken || !current || busy) return;
    setBusy(decision);
    setError(null);
    try {
      await sendMatchDecision(accessToken, current.userId, decision);
      Events.matchDecision({ decision });
      // Refresh quota so the badge + button states stay in sync. Cheap
      // round-trip; in v1.1 the decision response itself can return
      // updated quota and we drop this extra call.
      try {
        const fresh = await getMatchQuota(accessToken);
        setQuota(fresh);
      } catch {
        // non-fatal
      }
      setActiveIndex((i) => i + 1);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 'quota_decisions_exhausted') {
          setPaywallReason('decisions');
        } else if (err.code === 'quota_favorites_exhausted') {
          setPaywallReason('favorites');
        } else {
          setError(err.code);
        }
      } else {
        setError('decision_failed');
      }
    } finally {
      setBusy(null);
    }
  }

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
        <Text style={styles.sectionEyebrow}>One at a time</Text>
        <GoldRule width={28} style={styles.goldRule} />
        {quota ? (
          <Text style={styles.pageIndex}>
            {quota.isUnlimited
              ? 'Unlimited'
              : `${quota.decisionsUsed} / ${quota.decisionsLimit} today`}
          </Text>
        ) : null}
      </View>

      {stack === null ? (
        <View style={styles.center}>
          <ActivityIndicator color={color.cobalt[500]} />
        </View>
      ) : decisionsExhausted ? (
        <View style={styles.emptyWrap}>
          <EmptyState
            eyebrow="Quota reached"
            title="You've used today's decisions"
            body="Free tier resets at midnight UTC. Upgrade to Bless+ for more decisions."
          />
        </View>
      ) : exhausted ? (
        <View style={styles.emptyWrap}>
          <EmptyState
            eyebrow="No more for now"
            title="You've reviewed every match in the queue"
            body="New introductions arrive overnight. Come back tomorrow."
          />
        </View>
      ) : current ? (
        <View style={styles.cardWrap}>
          <IntroductionCard
            width={screenWidth}
            name={current.displayName}
            age={current.age}
            place={current.city}
            tradition={current.tradition ?? '—'}
            stage={current.walkStage ?? '—'}
            echo={current.bio ?? undefined}
            // Photos are returned as opaque storage keys; until the
            // signed-URL CDN flow lands we fall back to the deterministic
            // brand portrait gradient set so each card feels distinct.
            portrait={portraitSource(activeIndex)}
            onPress={() => onMatchPress?.(current.userId)}
          />
        </View>
      ) : null}

      {error ? (
        <View style={styles.errorPill}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {current && !exhausted ? (
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Pass quietly"
            disabled={Boolean(busy)}
            onPress={() => decide('pass')}
            style={({ pressed }) => [
              styles.actionBtn,
              styles.actionPass,
              pressed && styles.actionPressed,
              busy === 'pass' && styles.actionBusy,
            ]}
          >
            <Text style={styles.actionPassText}>Pass quietly</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Favorite"
            disabled={Boolean(busy) || favoriteSpent}
            onPress={() => decide('favorite')}
            style={({ pressed }) => [
              styles.actionBtn,
              styles.actionFavorite,
              pressed && styles.actionPressed,
              (favoriteSpent || busy === 'favorite') && styles.actionBusy,
            ]}
          >
            <Text style={styles.actionFavoriteText}>
              {favoriteSpent ? 'Favorite used' : '★ Favorite'}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Begin a conversation"
            disabled={Boolean(busy)}
            onPress={() => decide('like')}
            style={({ pressed }) => [
              styles.actionBtn,
              styles.actionLike,
              pressed && styles.actionPressed,
              busy === 'like' && styles.actionBusy,
            ]}
          >
            <Text style={styles.actionLikeText}>Begin</Text>
          </Pressable>
        </View>
      ) : null}

      <BottomNav active="today" onSelect={onNavigate ?? (() => {})} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.parchment.default },
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

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardWrap: {
    flex: 1,
  },
  emptyWrap: {
    flex: 1,
    paddingHorizontal: space.s6,
    alignItems: 'center',
    justifyContent: 'center',
  },

  actions: {
    flexDirection: 'row',
    paddingHorizontal: space.s5,
    paddingTop: space.s3,
    paddingBottom: space.s3,
    gap: space.s3,
    backgroundColor: color.parchment.raised,
    borderTopWidth: 1,
    borderTopColor: color.hairline.default,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: space.s4,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  actionPass: {
    backgroundColor: color.parchment.default,
    borderWidth: 1,
    borderColor: color.hairline.default,
  },
  actionFavorite: {
    backgroundColor: color.warning[100],
  },
  actionLike: {
    backgroundColor: color.cobalt[500],
  },
  actionPressed: { opacity: 0.85 },
  actionBusy: { opacity: 0.6 },
  actionPassText: {
    fontFamily: fontFamily.sansMedium,
    fontSize: fontSize.label,
    color: color.ink.soft,
  },
  actionFavoriteText: {
    fontFamily: fontFamily.sansSemibold,
    fontSize: fontSize.label,
    color: color.warning[700],
    letterSpacing: 0.4,
  },
  actionLikeText: {
    fontFamily: fontFamily.sansSemibold,
    fontSize: fontSize.label,
    color: color.parchment.default,
    letterSpacing: 0.4,
  },

  errorPill: {
    marginHorizontal: space.s5,
    marginBottom: space.s3,
    paddingHorizontal: space.s4,
    paddingVertical: space.s3,
    backgroundColor: color.warning[100],
    borderRadius: radius.lg,
  },
  errorText: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.caption,
    color: color.warning[700],
  },
});
