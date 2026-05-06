import { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { color, fontFamily, fontSize, letterSpacingFor, radius, space, tracking } from '../tokens.js';
import { INTERLUDE_EVERY_N_SWIPES } from '../motion.js';
import { haptic } from '../haptics.js';
import { SwipeCard, type SwipeAction } from './SwipeCard.js';

// A card in the deck is either a profile or a verse interlude.
export type DeckProfileCard = {
  kind: 'profile';
  id: string;
  displayName: string;
  age: number;
  city: string;
  tradition: string | null;
  walkStage: string | null;
  bio: string | null;
  photoStorageKey: string | null;
};

export type DeckVerseCard = {
  kind: 'verse';
  id: string;
  verse: string;
  reference: string;
};

export type DeckCard = DeckProfileCard | DeckVerseCard;

const SAMPLE_VERSES: Omit<DeckVerseCard, 'kind' | 'id'>[] = [
  { verse: '"Above all, love each other deeply, because love covers over a multitude of sins."', reference: '1 Peter 4:8 · NIV' },
  { verse: '"Let all that you do be done in love."', reference: '1 Corinthians 16:14 · ESV' },
  { verse: '"Be still, and know that I am God."', reference: 'Psalm 46:10 · NIV' },
  { verse: '"The Lord your God is with you, the Mighty Warrior who saves."', reference: 'Zephaniah 3:17 · NIV' },
  { verse: '"Two are better than one, because they have a good return for their labor."', reference: 'Ecclesiastes 4:9 · NIV' },
];

export type SwipeDeckHandle = {
  commit: (action: SwipeAction) => void;
  /** Restore the most recently committed card back to the top of the stack. */
  undo: () => DeckCard | null;
  /** Whether there's a card to undo. */
  canUndo: () => boolean;
};

export type SwipeDeckProps = {
  profiles: DeckProfileCard[];
  /** Called every time a profile card is committed (not interludes). */
  onCommit: (card: DeckProfileCard, action: SwipeAction) => void;
  /** Called when user taps top card OR long-presses. Profile cards only. */
  onPeek?: (card: DeckProfileCard) => void;
  /** Called when last card committed. */
  onEmpty?: () => void;
  /** Override interlude cadence. Default 5. */
  interludeEvery?: number;
};

/**
 * SwipeDeck — manages a 3-card visible stack with restock + verse interludes.
 *
 * State model:
 *   stack[0] = top (interactive) · stack[1] = behind1 · stack[2] = behind2
 *   queue = remaining profiles to feed in
 *   streak = consecutive profile commits since last interlude
 *
 * Source-of-truth: docs/design/system-v1/swipe-flow.html
 */
export const SwipeDeck = forwardRef<SwipeDeckHandle, SwipeDeckProps>(function SwipeDeck(
  { profiles, onCommit, onPeek, onEmpty, interludeEvery = INTERLUDE_EVERY_N_SWIPES },
  ref,
) {
  // Initial stack: first 3 profiles. Queue: rest.
  const initial = useMemo(() => {
    const ps: DeckCard[] = profiles.map((p) => ({ ...p }));
    return { stack: ps.slice(0, 3), queue: ps.slice(3) };
  }, [profiles]);

  const [stack, setStack] = useState<DeckCard[]>(initial.stack);
  const [queue, setQueue] = useState<DeckCard[]>(initial.queue);
  const streakRef = useRef(0);
  const verseSeqRef = useRef(0);
  // History of recently committed (card, action) pairs — supports undo.
  // Only profile commits are pushed here; interlude dismissals are not undoable.
  const historyRef = useRef<Array<{ card: DeckCard; action: SwipeAction }>>([]);

  const buildVerse = useCallback((): DeckVerseCard => {
    const seq = verseSeqRef.current;
    verseSeqRef.current = seq + 1;
    const v = SAMPLE_VERSES[seq % SAMPLE_VERSES.length] ?? SAMPLE_VERSES[0]!;
    return { kind: 'verse', id: `verse-${seq}`, verse: v.verse, reference: v.reference };
  }, []);

  const handleCommit = useCallback(
    (action: SwipeAction) => {
      const top = stack[0] ?? null;
      if (!top) return;

      // Build next stack: drop top, promote behind, pull from queue (with interlude logic).
      const remaining = stack.slice(1);
      let newQueue = queue;
      let nextCard: DeckCard | null = null;

      if (top.kind === 'profile') {
        onCommit(top, action);
        // Push to history so it can be undone. Cap at last 10.
        historyRef.current.push({ card: top, action });
        if (historyRef.current.length > 10) historyRef.current.shift();
        streakRef.current += 1;

        if (streakRef.current >= interludeEvery) {
          nextCard = buildVerse();
          streakRef.current = 0;
        } else if (newQueue.length > 0) {
          nextCard = newQueue[0] ?? null;
          newQueue = newQueue.slice(1);
        }
      } else {
        // Interlude dismissed — light haptic only, no streak increment, no commit.
        void haptic('interlude');
        if (newQueue.length > 0) {
          nextCard = newQueue[0] ?? null;
          newQueue = newQueue.slice(1);
        }
      }

      const newStack = nextCard ? [...remaining, nextCard] : remaining;
      setStack(newStack);
      setQueue(newQueue);

      if (newStack.length === 0) {
        void haptic('empty');
        onEmpty?.();
      }
    },
    [stack, queue, onCommit, interludeEvery, buildVerse, onEmpty],
  );

  const handlePeek = useCallback(() => {
    const top = stack[0] ?? null;
    if (!top || top.kind !== 'profile') return;
    onPeek?.(top);
  }, [stack, onPeek]);

  const handleUndo = useCallback((): DeckCard | null => {
    const last = historyRef.current.pop();
    if (!last) return null;
    void haptic('press');
    // Restore the committed card to top of stack. If stack is full
    // (happens when restocked), drop the bottom card back into queue head.
    setStack((prev) => {
      const next = [last.card, ...prev];
      if (next.length > 3) {
        const overflow = next[next.length - 1]!;
        setQueue((q) => [overflow, ...q]);
        return next.slice(0, 3);
      }
      return next;
    });
    // Roll back streak counter so interlude pacing stays correct.
    if (streakRef.current > 0) streakRef.current -= 1;
    return last.card;
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      commit: (action: SwipeAction) => handleCommit(action),
      undo: () => handleUndo(),
      canUndo: () => historyRef.current.length > 0,
    }),
    [handleCommit, handleUndo],
  );

  if (stack.length === 0) {
    return <EmptyState />;
  }

  // Render stack in REVERSE so top renders last (highest in z order via SwipeCard's zIndex).
  return (
    <View style={styles.deck}>
      {stack
        .slice(0, 3)
        .map((card, idx) => ({ card, idx }))
        .reverse()
        .map(({ card, idx }) => (
          <SwipeCard
            key={card.id}
            isTop={idx === 0}
            stackIndex={idx as 0 | 1 | 2}
            onCommit={idx === 0 ? handleCommit : undefined}
            onPeek={idx === 0 ? handlePeek : undefined}
            showOverlays={card.kind === 'profile'}
          >
            {card.kind === 'profile' ? <ProfileCardBody card={card} /> : <VerseCardBody card={card} />}
          </SwipeCard>
        ))}
    </View>
  );
});

function ProfileCardBody({ card }: { card: DeckProfileCard }) {
  return (
    <View style={styles.profileBody}>
      <View style={styles.photo}>
        <Text style={styles.photoInitial}>{card.displayName.charAt(0)}</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.name}>
          {card.displayName}, {card.age}
        </Text>
        <Text style={styles.meta}>
          {card.city}
          {card.tradition ? ` · ${card.tradition}` : ''}
          {card.walkStage ? ` · ${card.walkStage}` : ''}
        </Text>
        {card.bio ? (
          <Text style={styles.bio} numberOfLines={3}>
            {card.bio}
          </Text>
        ) : null}
        <Text style={styles.tapHint}>Tap for more</Text>
      </View>
    </View>
  );
}

function VerseCardBody({ card }: { card: DeckVerseCard }) {
  return (
    <View style={styles.verseBody}>
      <Text style={styles.verseEyebrow}>A breath</Text>
      <View style={styles.goldRule} />
      <Text style={styles.verseText}>{card.verse}</Text>
      <Text style={styles.verseRef}>{card.reference}</Text>
      <View style={styles.goldRule} />
      <Text style={styles.verseHint}>Swipe to continue</Text>
    </View>
  );
}

function EmptyState() {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>That's everyone for today.</Text>
      <View style={styles.goldRule} />
      <Text style={styles.emptyText}>We'll have new people tomorrow at 9:00 am.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  deck: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: space.s4,
  } as ViewStyle,
  profileBody: { flex: 1 } as ViewStyle,
  photo: {
    height: '60%',
    backgroundColor: color.sandstone.warm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoInitial: {
    fontFamily: fontFamily.serif,
    fontSize: 96,
    color: color.cobalt[700],
    opacity: 0.4,
  },
  body: { padding: space.s5 } as ViewStyle,
  name: {
    fontFamily: fontFamily.serifMedium,
    fontSize: fontSize.h2,
    color: color.ink.default,
    letterSpacing: letterSpacingFor(tracking.tight, fontSize.h2),
  },
  meta: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.label,
    color: color.ink.soft,
    marginTop: space.s1,
  },
  bio: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.body,
    color: color.ink.default,
    marginTop: space.s3,
    lineHeight: 20,
  },
  tapHint: {
    fontFamily: fontFamily.sansSemibold,
    fontSize: 11,
    color: color.ink.soft,
    letterSpacing: letterSpacingFor(tracking.eyebrow, 11),
    textTransform: 'uppercase',
    marginTop: space.s4,
    opacity: 0.5,
  },
  verseBody: {
    flex: 1,
    backgroundColor: color.sandstone.warm,
    paddingHorizontal: space.s7,
    paddingVertical: space.s8,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  verseEyebrow: {
    fontFamily: fontFamily.sansSemibold,
    fontSize: 11,
    letterSpacing: letterSpacingFor(tracking.eyebrow, 11),
    textTransform: 'uppercase',
    color: color.cobalt[700],
    marginBottom: space.s4,
  },
  verseText: {
    fontFamily: fontFamily.serifItalic,
    fontSize: fontSize.h3,
    color: color.ink.charcoal,
    textAlign: 'center',
    lineHeight: 30,
    marginBottom: space.s6,
  },
  verseRef: {
    fontFamily: fontFamily.sansSemibold,
    fontSize: 11,
    letterSpacing: letterSpacingFor(tracking.eyebrow, 11),
    textTransform: 'uppercase',
    color: color.cobalt[700],
    marginBottom: space.s7,
    textAlign: 'center',
  },
  verseHint: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.caption,
    color: color.ink.soft,
    letterSpacing: letterSpacingFor(0.16, fontSize.caption),
    textTransform: 'uppercase',
    marginTop: space.s4,
    opacity: 0.7,
  },
  goldRule: {
    width: 56,
    height: 1.5,
    backgroundColor: color.gold.default,
    marginVertical: space.s5,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.s7,
  } as ViewStyle,
  emptyTitle: {
    fontFamily: fontFamily.serif,
    fontSize: fontSize.h2,
    color: color.ink.default,
    textAlign: 'center',
    letterSpacing: letterSpacingFor(tracking.tight, fontSize.h2),
  },
  emptyText: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.bodyLg,
    color: color.ink.soft,
    textAlign: 'center',
    lineHeight: 24,
  },
});
