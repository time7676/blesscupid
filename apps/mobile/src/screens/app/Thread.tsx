/**
 * Thread — verse-anchored conversation surface, v1.2.
 *
 * Shape:
 *   ScreenHeader  Back · name · (report/block always visible inline below)
 *   VerseAnchor  Sticky mini-VerseCard at top — sandstone-warm + gold rule.
 *                Tap collapses; tap again expands.
 *   Messages    Two-side bubbles. Sandstone warm = me; parchment raised = them.
 *   Composer    Pill input. No GIFs, no stickers, no voice notes at v1.
 *
 * No timestamps on every line. Tap a bubble to reveal its time. Per
 * PRODUCT.md: "the phone is not a slot machine."
 *
 * After 6 reciprocal exchanges, the inline "Plan to meet for coffee?"
 * suggestion appears between messages — wired in a follow-up; this
 * screen exposes the data shape.
 */

import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  GoldRule,
  ScreenHeader,
  color,
  fontFamily,
  fontSize,
  letterSpacingFor,
  radius,
  space,
  tracking,
} from '../../lib/design-system/index.js';

export type ThreadMessage = {
  id: string;
  from: 'me' | 'them';
  text: string;
  /** ISO timestamp; only revealed on tap. */
  at: string;
};

export type ThreadAnchor = {
  verseText: string;
  verseRef: string;
};

const MOCK_ANCHOR: ThreadAnchor = {
  verseText: '"Be anxious for nothing, but in everything by prayer…"',
  verseRef: 'Phil 4:6',
};

const MOCK_MESSAGES: ThreadMessage[] = [
  {
    id: 'm1',
    from: 'me',
    text:
      'Phil 4:6 lands on a long Monday. Sent you a hello, slow as the verse. What does anxious-for-nothing look like at your desk?',
    at: '2026-05-06T08:14:00Z',
  },
  {
    id: 'm2',
    from: 'them',
    text:
      'Quiet first cup, then a list, then prayer between meetings. Today the list won, so the prayer was the meeting.',
    at: '2026-05-06T09:02:00Z',
  },
  {
    id: 'm3',
    from: 'me',
    text:
      'That is honest. The list wins for me on Mondays too. Tell me one thing on yours that you are praying about.',
    at: '2026-05-06T09:08:00Z',
  },
];

export type ThreadScreenProps = {
  threadId?: string;
  name?: string;
  anchor?: ThreadAnchor;
  messages?: ThreadMessage[];
  onClose?: () => void;
  onSend?: (text: string) => void;
};

export function ThreadScreen({
  name = 'Naomi',
  anchor = MOCK_ANCHOR,
  messages = MOCK_MESSAGES,
  onClose,
  onSend,
}: ThreadScreenProps) {
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState('');
  const [anchorOpen, setAnchorOpen] = useState(true);
  const [revealedAt, setRevealedAt] = useState<string | null>(null);

  function handleSend() {
    const text = draft.trim();
    if (!text) return;
    onSend?.(text);
    setDraft('');
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <ScreenHeader eyebrow="Conversation" title={name} onBack={onClose} />

      <View style={styles.safetyRow}>
        <Pressable accessibilityRole="button" accessibilityLabel={`Report ${name}`}>
          <Text style={styles.safetyText}>Report</Text>
        </Pressable>
        <Text style={styles.safetyDivider}>·</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={`Block ${name}`}>
          <Text style={styles.safetyText}>Block</Text>
        </Pressable>
      </View>

      <Pressable
        onPress={() => setAnchorOpen((v) => !v)}
        style={styles.anchorWrap}
        accessibilityRole="button"
        accessibilityLabel={
          anchorOpen ? "Collapse today's verse anchor" : "Expand today's verse anchor"
        }
      >
        <View style={styles.anchorHead}>
          <Text style={styles.anchorEyebrow}>Today's anchor</Text>
          <GoldRule width={20} style={styles.goldRule} />
          <Text style={styles.anchorRef}>{anchor.verseRef}</Text>
        </View>
        {anchorOpen ? (
          <Text style={styles.anchorVerse}>{anchor.verseText}</Text>
        ) : null}
      </Pressable>

      <ScrollView
        style={styles.messages}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((m) => (
          <Pressable
            key={m.id}
            onPress={() => setRevealedAt(revealedAt === m.id ? null : m.id)}
            style={[
              styles.bubbleRow,
              m.from === 'me' ? styles.bubbleRowMe : styles.bubbleRowThem,
            ]}
          >
            <View
              style={[
                styles.bubble,
                m.from === 'me' ? styles.bubbleMe : styles.bubbleThem,
              ]}
            >
              <Text
                style={[
                  styles.bubbleText,
                  m.from === 'me' ? styles.bubbleTextMe : styles.bubbleTextThem,
                ]}
              >
                {m.text}
              </Text>
            </View>
            {revealedAt === m.id ? (
              <Text style={styles.bubbleTime}>{formatTime(m.at)}</Text>
            ) : null}
          </Pressable>
        ))}
      </ScrollView>

      <View
        style={[
          styles.composer,
          { paddingBottom: Math.max(insets.bottom, space.s4) },
        ]}
      >
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Write a slow line."
          placeholderTextColor={color.ink.soft}
          style={styles.input}
          multiline
        />
        <Pressable
          onPress={handleSend}
          disabled={!draft.trim()}
          style={[styles.sendBtn, !draft.trim() && styles.sendBtnDisabled]}
          accessibilityRole="button"
          accessibilityLabel="Send message"
        >
          <Text style={styles.sendBtnText}>Send</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.parchment.default },

  safetyRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: space.s2,
    paddingHorizontal: space.s6,
    paddingBottom: space.s2,
  },
  safetyText: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.caption,
    color: color.ink.soft,
    textDecorationLine: 'underline',
  },
  safetyDivider: { color: color.ink.soft },

  anchorWrap: {
    marginHorizontal: space.s6,
    marginBottom: space.s4,
    paddingHorizontal: space.s5,
    paddingVertical: space.s4,
    backgroundColor: color.sandstone.warm,
    borderRadius: radius.xl,
  },
  anchorHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.s2,
  },
  anchorEyebrow: {
    fontFamily: fontFamily.sansSemibold,
    fontSize: fontSize.eyebrow,
    letterSpacing: letterSpacingFor(tracking.eyebrow, fontSize.eyebrow),
    textTransform: 'uppercase',
    color: color.warning[700],
  },
  goldRule: { marginHorizontal: 0 },
  anchorRef: {
    marginLeft: 'auto',
    fontFamily: fontFamily.sansMedium,
    fontSize: fontSize.caption,
    color: color.ink.soft,
  },
  anchorVerse: {
    marginTop: space.s2,
    fontFamily: fontFamily.serifItalic,
    fontSize: fontSize.bodyLg,
    lineHeight: 24,
    color: color.ink.default,
  },

  messages: { flex: 1 },
  messagesContent: {
    paddingHorizontal: space.s6,
    paddingBottom: space.s5,
    gap: space.s3,
  },
  bubbleRow: { maxWidth: '88%' },
  bubbleRowMe: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  bubbleRowThem: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  bubble: {
    paddingHorizontal: space.s4,
    paddingVertical: space.s3,
    borderRadius: radius.xl,
  },
  bubbleMe: {
    backgroundColor: color.sandstone.warm,
    borderBottomRightRadius: radius.sm,
  },
  bubbleThem: {
    backgroundColor: color.parchment.raised,
    borderWidth: 1,
    borderColor: color.hairline.soft,
    borderBottomLeftRadius: radius.sm,
  },
  bubbleText: {
    fontFamily: fontFamily.serif,
    fontSize: fontSize.bodyLg,
    lineHeight: 24,
  },
  bubbleTextMe: { color: color.ink.default },
  bubbleTextThem: { color: color.ink.default },
  bubbleTime: {
    marginTop: 4,
    fontFamily: fontFamily.sans,
    fontSize: fontSize.caption,
    color: color.ink.soft,
  },

  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: space.s3,
    paddingHorizontal: space.s5,
    paddingTop: space.s3,
    backgroundColor: color.parchment.raised,
    borderTopWidth: 1,
    borderTopColor: color.hairline.default,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    paddingHorizontal: space.s4,
    paddingVertical: space.s3,
    backgroundColor: color.parchment.default,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: color.hairline.default,
    fontFamily: fontFamily.sans,
    fontSize: fontSize.bodyLg,
    color: color.ink.default,
  },
  sendBtn: {
    paddingHorizontal: space.s4,
    paddingVertical: space.s3,
    backgroundColor: color.cobalt[500],
    borderRadius: radius.pill,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: color.hairline.default,
  },
  sendBtnText: {
    fontFamily: fontFamily.sansSemibold,
    fontSize: fontSize.label,
    letterSpacing: 0.4,
    color: color.parchment.default,
  },
});
