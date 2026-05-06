/**
 * Today — swipe deck v2.0 (Cathedral Light, locked 2026-05-06).
 *
 * User lands on Today and sees a stack of profile cards. Three actions:
 *   • Pass     ← left swipe / left button (small)
 *   • Bless    → right swipe / mid button (large, hand icon, ceremony)
 *   • Super    ↑ up swipe / right button (small, gold star)
 *
 * Tap a card to open ProfileDetailSheet. Long-press to peek deliberately.
 * Verse interlude every 5 commits (pacing brake, Cathedral Light §HCoC).
 *
 * API mapping:
 *   pass → 'pass' · bless → 'like' · super → 'favorite'
 *
 * Source-of-truth visual: docs/design/system-v1/swipe-flow.html
 */

import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path } from 'react-native-svg';
import {
  ActionDeck,
  BottomNav,
  ScreenHeader,
  SwipeDeck,
  ProfileDetailSheet,
  color,
  fontFamily,
  fontSize,
  letterSpacingFor,
  radius,
  space,
  tracking,
  type DeckProfileCard,
  type NavTabKey,
  type SwipeAction,
  type SwipeDeckHandle,
} from '../../lib/design-system/index.js';
import { MatchSheet } from './modals/MatchSheet.js';
import { notifyMatch } from '../../lib/notifications.js';
import { BrandGlyph } from '../../lib/brand/BrandGlyph.js';
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

function dateString(): { eyebrow: string; greeting: string } {
  const d = new Date();
  const weekday = d.toLocaleDateString(undefined, { weekday: 'long' });
  const day = d.getDate();
  return {
    eyebrow: `Today · ${weekday} ${day}`,
    greeting: d.getHours() < 12 ? 'Good morning' : d.getHours() < 18 ? 'Good afternoon' : 'Good evening',
  };
}

function toDeckProfile(c: MatchTodayCard): DeckProfileCard {
  return {
    kind: 'profile',
    id: c.userId,
    displayName: c.displayName,
    age: c.age,
    city: c.city,
    tradition: c.tradition,
    walkStage: c.walkStage,
    bio: c.bio,
    photoStorageKey: c.photoStorageKey,
  };
}

function actionToDecision(action: SwipeAction): MatchDecision {
  if (action === 'pass') return 'pass';
  if (action === 'bless') return 'like';
  return 'favorite';
}

export type TodayScreenProps = {
  name?: string;
  onNavigate?: (tab: NavTabKey) => void;
};

export function TodayScreen({ name = 'Friend', onNavigate }: TodayScreenProps) {
  const accessToken = useAuth((s) => s.accessToken);
  const { eyebrow, greeting } = dateString();
  const [profiles, setProfiles] = useState<DeckProfileCard[] | null>(null);
  const [quota, setQuota] = useState<MatchQuotaResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [peeking, setPeeking] = useState<DeckProfileCard | null>(null);
  const [matched, setMatched] = useState<DeckProfileCard | null>(null);
  const [undosUsedToday, setUndosUsedToday] = useState(0);
  const deckRef = useRef<SwipeDeckHandle>(null);

  const FREE_UNDO_LIMIT = 1;
  const todayKey = new Date().toISOString().slice(0, 10);
  const UNDO_STORAGE_KEY = `today-undos-${todayKey}`;

  useEffect(() => {
    AsyncStorage.getItem(UNDO_STORAGE_KEY)
      .then((raw) => setUndosUsedToday(raw ? parseInt(raw, 10) || 0 : 0))
      .catch(() => undefined);
  }, [UNDO_STORAGE_KEY]);

  function handleUndo() {
    if (undosUsedToday >= FREE_UNDO_LIMIT) return;
    if (!deckRef.current?.canUndo()) return;
    const restored = deckRef.current.undo();
    if (!restored) return;
    const newCount = undosUsedToday + 1;
    setUndosUsedToday(newCount);
    void AsyncStorage.setItem(UNDO_STORAGE_KEY, String(newCount));
    // TODO v1.1: backend DELETE /matches/decision/:candidateId to roll back.
  }

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
          setProfiles(stackRes.stack.map(toDeckProfile));
          setQuota(quotaRes);
          Events.dailyStackViewed({ stackSize: stackRes.stack.length, activeIndex: 0 });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.code : 'matches_load_failed');
          setProfiles([]);
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  async function recordDecision(card: DeckProfileCard, action: SwipeAction) {
    const decision = actionToDecision(action);
    if (!accessToken) return;
    try {
      const res = await sendMatchDecision(accessToken, card.id, decision);
      Events.matchDecision({ decision });
      // If server returns a match flag, fire the ceremony modal + push.
      if (res.match && (action === 'bless' || action === 'super')) {
        setMatched(card);
        void notifyMatch(card.id, card.displayName);
      }
      try {
        const fresh = await getMatchQuota(accessToken);
        setQuota(fresh);
      } catch {
        // non-fatal
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.code);
      } else {
        setError('decision_failed');
      }
    }
  }

  function handlePeek(card: DeckProfileCard) {
    setPeeking(card);
  }

  function handleSheetAction(action: 'pass' | 'bless') {
    setPeeking(null);
    // Defer to allow sheet dismiss animation to complete (~240ms).
    setTimeout(() => {
      deckRef.current?.commit(action);
    }, 240);
  }

  // Only surface the quota when the user is approaching their limit. Free
  // tier = show pill at ≤3 left OR ≤30%. Above that, the count is noise that
  // breaks the contemplative tone.
  const quotaApproachingLimit =
    !!quota &&
    !quota.isUnlimited &&
    (quota.decisionsRemaining <= 3 ||
      quota.decisionsRemaining / Math.max(quota.decisionsLimit, 1) <= 0.3);

  return (
    <View style={styles.root}>
      <ScreenHeader
        eyebrow={eyebrow}
        title={`${greeting}, ${name}`}
        variant="display"
        trailing={
          <View style={styles.trailing}>
            {quotaApproachingLimit && quota ? (
              <View style={styles.quotaChip} accessibilityLabel={`${quota.decisionsRemaining} swipes left today`}>
                <Text style={styles.quotaChipText}>{quota.decisionsRemaining} left</Text>
              </View>
            ) : null}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Notifications"
              hitSlop={12}
              style={styles.bellBtn}
            >
              <BrandGlyph name="bell" size={18} />
            </Pressable>
          </View>
        }
      />

      <View style={styles.deckWrap}>
        {profiles === null ? (
          <View style={styles.center}>
            <ActivityIndicator color={color.cobalt[500]} />
          </View>
        ) : profiles.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyTitle}>No new people for today.</Text>
            <View style={styles.goldRule} />
            <Text style={styles.emptyBody}>Come back tomorrow at 9:00 am.</Text>
          </View>
        ) : (
          <SwipeDeck
            ref={deckRef}
            profiles={profiles}
            onCommit={recordDecision}
            onPeek={handlePeek}
            onEmpty={() => Events.matchDecision({ decision: 'pass' })}
          />
        )}
      </View>

      {error ? (
        <View style={styles.errorPill}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {profiles && profiles.length > 0 ? (
        <View style={styles.deckActions}>
          <Pressable
            onPress={handleUndo}
            disabled={undosUsedToday >= FREE_UNDO_LIMIT}
            accessibilityRole="button"
            accessibilityLabel="Undo last swipe"
            hitSlop={12}
            style={({ pressed }) => [
              styles.undoBtn,
              undosUsedToday >= FREE_UNDO_LIMIT && { opacity: 0.3 },
              pressed && { opacity: 0.6 },
            ]}
          >
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path
                d="M9 14l-5-5 5-5M4 9h11a5 5 0 0 1 5 5v0a5 5 0 0 1-5 5H10"
                stroke={color.ink.soft}
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
            <Text style={styles.undoLabel}>
              {undosUsedToday >= FREE_UNDO_LIMIT ? 'Used' : 'Undo'}
            </Text>
          </Pressable>
          <ActionDeck
            onPass={() => deckRef.current?.commit('pass')}
            onBless={() => deckRef.current?.commit('bless')}
            onSuper={() => deckRef.current?.commit('super')}
          />
        </View>
      ) : null}

      <ProfileDetailSheet
        card={peeking}
        onDismiss={() => setPeeking(null)}
        onAction={handleSheetAction}
      />

      <MatchSheet
        visible={matched !== null}
        matchName={matched?.displayName ?? ''}
        onSendFirstVerse={() => setMatched(null)}
        onWalkAway={() => setMatched(null)}
      />

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
  trailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.s2,
  },
  quotaChip: {
    paddingHorizontal: space.s3,
    paddingVertical: space.s1,
    backgroundColor: color.warning[100],
    borderRadius: radius.pill,
  },
  quotaChipText: {
    fontFamily: fontFamily.sansSemibold,
    fontSize: 10,
    letterSpacing: letterSpacingFor(tracking.eyebrow, 10),
    textTransform: 'uppercase',
    color: color.warning[700],
  },
  deckWrap: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.s7 },
  emptyTitle: {
    fontFamily: fontFamily.serif,
    fontSize: fontSize.h2,
    color: color.ink.default,
    textAlign: 'center',
    letterSpacing: letterSpacingFor(tracking.tight, fontSize.h2),
  },
  emptyBody: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.bodyLg,
    color: color.ink.soft,
    textAlign: 'center',
    lineHeight: 24,
  },
  goldRule: {
    width: 56,
    height: 1.5,
    backgroundColor: color.gold.default,
    marginVertical: space.s5,
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
  deckActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.s5,
  },
  undoBtn: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: color.hairline.default,
    backgroundColor: color.parchment.raised,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  undoLabel: {
    fontFamily: fontFamily.sansSemibold,
    fontSize: 9,
    color: color.ink.soft,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
});
