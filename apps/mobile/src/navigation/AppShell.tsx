/**
 * AppShell — bottom-tabs surface, v1.2.
 *
 * Three tabs: Today / Conversations / You. Conversations replaces the
 * v1.0 People + Threads pair, which dual-tabbed the same mental model.
 *
 * Two transient overlays render above the tabs without leaving the shell:
 *   `profileDetail`  — full-screen ProfileDetail for one match
 *   `thread`         — full-screen Thread chat
 *
 * Both push and pop with explicit handlers — no react-navigation, no
 * stack inside a stack. AppShell is the only place we need transient
 * push within the tab bar.
 *
 * Legacy `people` / `threads` keys are routed to Conversations so
 * persisted nav state from v1.0 doesn't dead-end.
 */

import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { TodayScreen } from '../screens/app/Today.js';
import { ConversationsScreen } from '../screens/app/Conversations.js';
import { YouScreen } from '../screens/app/You.js';
import { ProfileDetailScreen } from '../screens/app/ProfileDetail.js';
import { ThreadScreen } from '../screens/app/Thread.js';
import { ToastProvider } from '../lib/design-system/index.js';
import { OfflineBanner } from '../lib/design-system/index.js';
import type { NavTabKey } from '../lib/design-system/index.js';

type Overlay =
  | { kind: 'none' }
  | { kind: 'profile'; matchId: string }
  | { kind: 'thread'; threadId: string };

function normalizeTab(key: NavTabKey): 'today' | 'conversations' | 'you' {
  // Legacy keys from before the People/Threads merge. Land them on
  // Conversations rather than rendering nothing.
  if (key === 'people' || key === 'threads' || key === 'conversations') return 'conversations';
  if (key === 'you') return 'you';
  return 'today';
}

export function AppShell() {
  const [activeTab, setActiveTab] = useState<'today' | 'conversations' | 'you'>('today');
  const [overlay, setOverlay] = useState<Overlay>({ kind: 'none' });
  // TODO: wire to NetInfo for real offline detection (Phase 9).
  const isOffline = false;

  function handleNavigate(key: NavTabKey) {
    setOverlay({ kind: 'none' });
    setActiveTab(normalizeTab(key));
  }

  function openProfile(matchId: string) {
    setOverlay({ kind: 'profile', matchId });
  }

  function openThread(threadId: string) {
    setOverlay({ kind: 'thread', threadId });
  }

  function closeOverlay() {
    setOverlay({ kind: 'none' });
  }

  function beginConversationFromProfile() {
    // For v1.2 we synthesise a thread id from the match. The full
    // verse-anchored composer sheet ships in a follow-up; tapping
    // "Begin a conversation" opens the Thread directly so the flow
    // is end-to-end visible during demos.
    if (overlay.kind === 'profile') {
      const id = `th-${overlay.matchId}`;
      setOverlay({ kind: 'thread', threadId: id });
      setActiveTab('conversations');
    }
  }

  return (
    <ToastProvider>
      <View style={styles.root}>
        {activeTab === 'today' && (
          <TodayScreen onNavigate={handleNavigate} onMatchPress={openProfile} />
        )}
        {activeTab === 'conversations' && (
          <ConversationsScreen onNavigate={handleNavigate} onOpenThread={openThread} />
        )}
        {activeTab === 'you' && <YouScreen onNavigate={handleNavigate} />}

        {overlay.kind === 'profile' ? (
          <View style={styles.overlay}>
            <ProfileDetailScreen
              matchId={overlay.matchId}
              onClose={closeOverlay}
              onPass={closeOverlay}
              onBegin={beginConversationFromProfile}
            />
          </View>
        ) : null}

        {overlay.kind === 'thread' ? (
          <View style={styles.overlay}>
            <ThreadScreen threadId={overlay.threadId} onClose={closeOverlay} />
          </View>
        ) : null}

        <OfflineBanner visible={isOffline} />
      </View>
    </ToastProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
