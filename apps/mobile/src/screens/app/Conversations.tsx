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

import {
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
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
};

// Mock conversations — replaced by API on integration (BLE-7h threads).
const MOCK_CONVERSATIONS: ConversationRow[] = [
  {
    id: 'th-naomi',
    kind: 'pending',
    name: 'Naomi',
    preview: 'Phil 4:6 lands on a long Monday. Sent you a hello, slow as the verse.',
    ago: '2h',
    portrait: 0,
    unread: false,
  },
  {
    id: 'th-ruth',
    kind: 'active',
    name: 'Ruth',
    preview: 'I love that, the kind of Sunday that ends in dishes and a long table.',
    ago: 'Yesterday',
    portrait: 2,
    unread: true,
  },
  {
    id: 'th-esther',
    kind: 'active',
    name: 'Esther',
    preview: 'Same. The returning part is the loudest part for me too.',
    ago: 'Mon',
    portrait: 4,
    unread: false,
  },
];

export type ConversationsScreenProps = {
  onNavigate?: (tab: NavTabKey) => void;
  onOpenThread?: (id: string) => void;
};

export function ConversationsScreen({ onNavigate, onOpenThread }: ConversationsScreenProps) {
  const pending = MOCK_CONVERSATIONS.filter((c) => c.kind === 'pending');
  const active = MOCK_CONVERSATIONS.filter((c) => c.kind === 'active');
  const empty = pending.length === 0 && active.length === 0;

  return (
    <View style={styles.root}>
      <ScreenHeader eyebrow="Conversations" title="People you've met" />

      {empty ? (
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
          {pending.length > 0 ? (
            <Section
              eyebrow="Sent, awaiting reply"
              hint="They haven't read it yet. No nudging."
              tone="pending"
            >
              {pending.map((c) => (
                <ConversationItem
                  key={c.id}
                  row={c}
                  onPress={() => onOpenThread?.(c.id)}
                />
              ))}
            </Section>
          ) : null}

          {active.length > 0 ? (
            <Section eyebrow="Talking" tone="active">
              {active.map((c) => (
                <ConversationItem
                  key={c.id}
                  row={c}
                  onPress={() => onOpenThread?.(c.id)}
                />
              ))}
            </Section>
          ) : null}
        </ScrollView>
      )}

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
};

function ConversationItem({ row, onPress }: ItemProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${row.name}: ${row.preview}`}
      style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
    >
      <Image source={portraitSource(row.portrait)} style={styles.avatar} resizeMode="cover" />
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
});
