/**
 * Conversations — merged inbox surface, v1.2.
 *
 * Replaces the prior People + Threads tabs (collapsed in BottomNav). Two
 * sections, one screen, one scroll:
 *
 *   Pending  — mutual matches who haven't replied yet (sandstone band).
 *   Active   — live threads, sorted by last message recency.
 *
 * No "X unread!" red-dot anxiety. Unread is signaled by ink weight
 * (default ink vs ink.soft). Per Holy Code §HCoC anti-pattern list.
 *
 * Tap row → Thread (verse-anchored chat).
 */

import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  getThreads,
  getIncomingBlesses,
  type ThreadSummary,
  type IncomingBlessRow,
  ApiError,
} from '../../lib/api.js';
import { useAuth } from '../../lib/auth-store.js';
import {
  BottomNav,
  EmptyState,
  GoldRule,
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
import { portraitSource } from '../../lib/brand/assets.js';

export type ConversationKind = 'pending' | 'active';

export type ConversationRow = {
  id: string;
  kind: ConversationKind;
  name: string;
  /** First-message preview (pending) or last-message preview (active). */
  preview: string;
  /** Friendly relative timestamp e.g. "2h", "Yesterday", "Mon". */
  ago: string;
  portrait: number;
  unread?: boolean;
  /** Match userId — used by avatar-tap to open profile detail. */
  partnerUserId: string;
};

function ago(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / (1000 * 60));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return d.toLocaleDateString(undefined, { weekday: 'short' });
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function summaryToRow(s: ThreadSummary, idx: number): ConversationRow {
  return {
    id: s.threadId,
    kind: s.status,
    name: s.partnerDisplayName,
    preview: s.lastMessagePreview ?? '',
    ago: ago(s.lastMessageAt),
    portrait: idx,
    unread: s.unread,
    partnerUserId: s.partnerUserId,
  };
}

export type ConversationsScreenProps = {
  onNavigate?: (tab: NavTabKey) => void;
  onOpenThread?: (id: string) => void;
  /** Tap on avatar opens partner's profile detail. */
  onOpenProfile?: (matchId: string) => void;
  /** Tap on the bottom "Recently Blessed you" card opens the IncomingBlesses screen. */
  onOpenIncomingBlesses?: () => void;
};

export function ConversationsScreen({
  onNavigate,
  onOpenThread,
  onOpenProfile,
  onOpenIncomingBlesses,
}: ConversationsScreenProps) {
  const accessToken = useAuth((s) => s.accessToken);
  const [pending, setPending] = useState<ConversationRow[] | null>(null);
  const [active, setActive] = useState<ConversationRow[] | null>(null);
  const [recentBlesses, setRecentBlesses] = useState<IncomingBlessRow[]>([]);
  const [blessTier, setBlessTier] = useState<'free' | 'plus' | 'plus_trial'>('free');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!accessToken) return;
      try {
        const res = await getThreads(accessToken);
        if (!cancelled) {
          setPending(res.pending.map((s, i) => summaryToRow(s, i)));
          setActive(res.active.map((s, i) => summaryToRow(s, i)));
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.code : 'threads_load_failed');
          setPending([]);
          setActive([]);
        }
      }
      try {
        const blesses = await getIncomingBlesses(accessToken);
        if (!cancelled) {
          setRecentBlesses(blesses.items.slice(0, 3));
          setBlessTier(blesses.tier);
        }
      } catch {
        // non-fatal
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  const loading = pending === null || active === null;
  const empty = !loading && (pending?.length ?? 0) === 0 && (active?.length ?? 0) === 0;

  return (
    <View style={styles.root}>
      <ScreenHeader eyebrow="Conversations" title="People you've met" />

      {loading ? (
        <View style={styles.emptyWrap}>
          <ActivityIndicator color={color.cobalt[500]} />
        </View>
      ) : empty ? (
        <View style={styles.emptyWrap}>
          <EmptyState
            eyebrow="Nothing waiting"
            title="No conversations yet"
            body="Once you begin one from Today, it lands here. Stay slow. Stay kind."
          />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {(pending ?? []).length > 0 ? (
            <Section
              eyebrow="Sent, awaiting reply"
              hint="They haven't read it yet. No nudging."
              tone="pending"
            >
              {(pending ?? []).map((c) => (
                <ConversationItem
                  key={c.id}
                  row={c}
                  onPress={() => onOpenThread?.(c.id)}
                  onAvatarPress={() => onOpenProfile?.(c.partnerUserId)}
                />
              ))}
            </Section>
          ) : null}

          {(active ?? []).length > 0 ? (
            <Section eyebrow="Talking" tone="active">
              {(active ?? []).map((c) => (
                <ConversationItem
                  key={c.id}
                  row={c}
                  onPress={() => onOpenThread?.(c.id)}
                  onAvatarPress={() => onOpenProfile?.(c.partnerUserId)}
                />
              ))}
            </Section>
          ) : null}

          {recentBlesses.length > 0 ? (
            <View style={styles.blessesPreview}>
              <Pressable
                onPress={onOpenIncomingBlesses}
                accessibilityRole="button"
                accessibilityLabel="See people who Blessed you"
                style={({ pressed }) => [styles.blessesCard, pressed && { opacity: 0.85 }]}
              >
                <View style={styles.blessesHead}>
                  <Text style={styles.blessesEyebrow}>Recently Blessed you</Text>
                  <GoldRule width={20} style={styles.goldRule} />
                </View>
                <View style={styles.blessesAvatars}>
                  {recentBlesses.map((b, i) => (
                    <View
                      key={b.userId}
                      style={[
                        styles.blessAvatar,
                        { marginLeft: i === 0 ? 0 : -10, zIndex: 3 - i },
                      ]}
                    >
                      <Text style={styles.blessInitial}>
                        {blessTier === 'free' ? '?' : b.displayName.charAt(0)}
                      </Text>
                    </View>
                  ))}
                </View>
                <Text style={styles.blessesBody}>
                  {blessTier === 'free'
                    ? `${recentBlesses.length} ${recentBlesses.length === 1 ? 'person has' : 'people have'} Blessed you · Bless+ to see who`
                    : `${recentBlesses.map((b) => b.displayName).join(' · ')}`}
                </Text>
                <Text style={styles.blessesArrow}>See all →</Text>
              </Pressable>
            </View>
          ) : null}
        </ScrollView>
      )}
      {error ? (
        <Text style={{ color: color.warning[700], textAlign: 'center', padding: space.s3 }}>
          {error}
        </Text>
      ) : null}

      <BottomNav active="conversations" onSelect={onNavigate ?? (() => {})} />
    </View>
  );
}

type SectionProps = {
  eyebrow: string;
  hint?: string;
  tone: 'pending' | 'active';
  children: React.ReactNode;
};

function Section({ eyebrow, hint, tone, children }: SectionProps) {
  return (
    <View
      style={[
        styles.section,
        tone === 'pending' ? styles.sectionPending : null,
      ]}
    >
      <View style={styles.sectionHead}>
        <Text style={styles.sectionEyebrow}>{eyebrow}</Text>
        <GoldRule width={28} style={styles.goldRule} />
      </View>
      {hint ? <Text style={styles.sectionHint}>{hint}</Text> : null}
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

type ItemProps = {
  row: ConversationRow;
  onPress?: () => void;
  onAvatarPress?: () => void;
};

function ConversationItem({ row, onPress, onAvatarPress }: ItemProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${row.name}: ${row.preview}`}
      style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
    >
      <Pressable
        onPress={onAvatarPress}
        accessibilityRole="button"
        accessibilityLabel={`Open ${row.name}'s profile`}
        hitSlop={6}
      >
        <Image source={portraitSource(row.portrait)} style={styles.avatar} resizeMode="cover" />
      </Pressable>
      <View style={styles.itemBody}>
        <View style={styles.itemHead}>
          <Text style={[styles.name, row.unread && styles.nameUnread]} numberOfLines={1}>
            {row.name}
          </Text>
          <Text style={styles.ago}>{row.ago}</Text>
        </View>
        <Text
          style={[styles.preview, row.unread && styles.previewUnread]}
          numberOfLines={2}
        >
          {row.preview}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.parchment.default },
  scroll: { flex: 1 },
  content: { paddingBottom: space.s8 },
  emptyWrap: {
    flex: 1,
    paddingHorizontal: space.s6,
    alignItems: 'center',
    justifyContent: 'center',
  },

  section: {
    paddingHorizontal: space.s6,
    paddingTop: space.s5,
    paddingBottom: space.s5,
  },
  sectionPending: {
    backgroundColor: color.sandstone.warm,
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
  sectionHint: {
    marginTop: space.s2,
    fontFamily: fontFamily.serifItalic,
    fontSize: fontSize.body,
    color: color.ink.soft,
  },
  sectionBody: {
    marginTop: space.s4,
    gap: space.s3,
  },

  item: {
    flexDirection: 'row',
    gap: space.s4,
    padding: space.s4,
    backgroundColor: color.parchment.raised,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: color.hairline.soft,
  },
  itemPressed: { opacity: 0.85 },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: radius.pill,
    backgroundColor: color.sandstone.default,
  },
  itemBody: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  itemHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: space.s3,
  },
  name: {
    fontFamily: fontFamily.serifMedium,
    fontSize: 18,
    color: color.ink.soft,
    flexShrink: 1,
  },
  nameUnread: {
    color: color.ink.default,
  },
  ago: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.caption,
    color: color.ink.soft,
    flexShrink: 0,
  },
  preview: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.body,
    lineHeight: 20,
    color: color.ink.soft,
  },
  previewUnread: {
    color: color.ink.default,
    fontFamily: fontFamily.sansMedium,
  },

  blessesPreview: {
    paddingHorizontal: space.s6,
    paddingTop: space.s4,
    paddingBottom: space.s5,
  },
  blessesCard: {
    backgroundColor: color.sandstone.warm,
    borderRadius: radius.xl,
    padding: space.s5,
    borderWidth: 1.5,
    borderColor: color.gold.default,
    gap: space.s2,
  },
  blessesHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.s3,
  },
  blessesEyebrow: {
    fontFamily: fontFamily.sansSemibold,
    fontSize: fontSize.eyebrow,
    letterSpacing: letterSpacingFor(tracking.eyebrow, fontSize.eyebrow),
    textTransform: 'uppercase',
    color: color.cobalt[700],
  },
  blessesAvatars: {
    flexDirection: 'row',
    marginTop: space.s2,
  },
  blessAvatar: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: color.sandstone.default,
    borderWidth: 2,
    borderColor: color.parchment.raised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blessInitial: {
    fontFamily: fontFamily.serifMedium,
    fontSize: 16,
    color: color.cobalt[700],
    opacity: 0.6,
  },
  blessesBody: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.body,
    color: color.ink.default,
    lineHeight: 20,
    marginTop: space.s2,
  },
  blessesArrow: {
    fontFamily: fontFamily.sansSemibold,
    fontSize: fontSize.label,
    color: color.cobalt[700],
    marginTop: space.s1,
  },
});
