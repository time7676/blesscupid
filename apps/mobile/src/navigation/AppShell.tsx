/**
 * AppShell — bottom-tabs surface, v2.0.
 *
 * Three tabs: Today / Conversations / You. Settings + sub-screens render
 * as full-screen overlays above the tab bar without leaving the shell.
 *
 * Overlays:
 *   profile        ProfileDetail (legacy from Conversations row tap)
 *   thread         Thread chat
 *   settings       Settings sub-route from You
 *   upgrade        Subscription tier comparison
 *   safety         Safety center
 *
 * Modals (overlay state = 'none' but modal Visible toggles):
 *   match          MatchSheet — fires when mutual Bless commits
 *   signOutConfirm Confirm sign-out
 *   deleteConfirm  Confirm hard-delete account
 */

import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, SlideInRight, SlideOutRight } from 'react-native-reanimated';
import { TodayScreen } from '../screens/app/Today.js';
import { ConversationsScreen } from '../screens/app/Conversations.js';
import { YouScreen } from '../screens/app/You.js';
import { ProfileDetailScreen } from '../screens/app/ProfileDetail.js';
import { ThreadScreen } from '../screens/app/Thread.js';
import { EditProfileScreen } from '../screens/app/settings/EditProfile.js';
import { EditPhotosScreen } from '../screens/app/settings/EditPhotos.js';
import { IncomingBlessesScreen } from '../screens/app/settings/IncomingBlesses.js';
import {
  PreferencesScreen,
  NotificationsScreen,
  PrivacyScreen,
  BlockedListScreen,
  PauseProfileScreen,
  AccountScreen,
  HelpSupportScreen,
  AboutLegalScreen,
  SafetyCenterScreen,
  UpgradeScreen,
} from '../screens/app/settings/SettingsScreens.js';
import { ConfirmSheet } from '../screens/app/modals/ConfirmSheet.js';
import { ToastProvider } from '../lib/design-system/index.js';
import { OfflineBanner } from '../lib/design-system/index.js';
import type { NavTabKey } from '../lib/design-system/index.js';
import { useAuth } from '../lib/auth-store.js';
import {
  apiFetch,
  createConversationFromMatch,
  getMe,
  getIncomingBlesses,
  type MeResponse,
} from '../lib/api.js';
import { notifyIncomingBless } from '../lib/notifications.js';

type SettingsRoute =
  | 'editProfile'
  | 'editPhotos'
  | 'preferences'
  | 'notifications'
  | 'privacy'
  | 'blocked'
  | 'pause'
  | 'account'
  | 'help'
  | 'about'
  | 'safety'
  | 'upgrade'
  | 'incomingBlesses';

type Overlay =
  | { kind: 'none' }
  | { kind: 'profile'; matchId: string }
  | { kind: 'thread'; threadId: string }
  | { kind: 'settings'; route: SettingsRoute };

function normalizeTab(key: NavTabKey): 'today' | 'conversations' | 'you' {
  if (key === 'people' || key === 'threads' || key === 'conversations') return 'conversations';
  if (key === 'you') return 'you';
  return 'today';
}

export function AppShell() {
  const [activeTab, setActiveTab] = useState<'today' | 'conversations' | 'you'>('today');
  const [overlay, setOverlay] = useState<Overlay>({ kind: 'none' });
  const [signOutVisible, setSignOutVisible] = useState(false);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const isOffline = false;

  const accessToken = useAuth((s) => s.accessToken);
  const signOut = useAuth((s) => s.signOut);
  const [me, setMe] = useState<MeResponse | null>(null);
  const [incomingBlessCount, setIncomingBlessCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!accessToken) return;
      try {
        const res = await getMe(accessToken);
        if (!cancelled) setMe(res);
      } catch {
        // non-fatal — YouScreen falls back to defaults
      }
      try {
        const blesses = await getIncomingBlesses(accessToken);
        if (!cancelled) setIncomingBlessCount(blesses.count);
      } catch {
        // non-fatal
      }
    }
    void load();
    // Poll every 60s while app is open. Real-time push lands in v1.1 via
    // expo-notifications + socket.io. Polling is a tolerable bridge for
    // pre-alpha — backend cost is negligible at <100 testers.
    const interval = setInterval(() => {
      if (!accessToken) return;
      getIncomingBlesses(accessToken)
        .then((res) => {
          if (cancelled) return;
          setIncomingBlessCount((prev) => {
            // New Bless arrived since last poll → fire local notification.
            if (res.count > prev && prev > 0) {
              const newest = res.items[0];
              if (newest) void notifyIncomingBless(newest.userId);
            }
            return res.count;
          });
        })
        .catch(() => undefined);
    }, 60_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [accessToken]);

  function handleNavigate(key: NavTabKey) {
    setOverlay({ kind: 'none' });
    setActiveTab(normalizeTab(key));
  }

  function openSettings(route: SettingsRoute) {
    setOverlay({ kind: 'settings', route });
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

  async function beginConversationFromProfile() {
    if (overlay.kind !== 'profile' || !accessToken) return;
    const matchId = overlay.matchId;
    try {
      const res = await createConversationFromMatch(accessToken, matchId);
      setOverlay({ kind: 'thread', threadId: res.threadId });
      setActiveTab('conversations');
    } catch {
      // fall back to synthetic id so the user isn't stuck
      const id = `th-${matchId}`;
      setOverlay({ kind: 'thread', threadId: id });
      setActiveTab('conversations');
    }
  }

  function handleSignOut() {
    setSignOutVisible(false);
    void signOut();
  }

  async function handleDelete() {
    setDeleteVisible(false);
    if (accessToken) {
      try {
        await apiFetch('/v1/me', { method: 'DELETE', token: accessToken });
      } catch {
        // non-fatal in pre-alpha
      }
    }
    void signOut();
  }

  return (
    <ToastProvider>
      <View style={styles.root}>
        {activeTab === 'today' && (
          <Animated.View key="tab-today" entering={FadeIn.duration(200)} style={{ flex: 1 }}>
            <TodayScreen onNavigate={handleNavigate} />
          </Animated.View>
        )}
        {activeTab === 'conversations' && (
          <Animated.View key="tab-conv" entering={FadeIn.duration(200)} style={{ flex: 1 }}>
            <ConversationsScreen
              onNavigate={handleNavigate}
              onOpenThread={openThread}
              onOpenProfile={openProfile}
              onOpenIncomingBlesses={() => openSettings('incomingBlesses')}
            />
          </Animated.View>
        )}
        {activeTab === 'you' && (
          <Animated.View key="tab-you" entering={FadeIn.duration(200)} style={{ flex: 1 }}>
            <YouScreen
            name={me?.profile?.displayName ?? 'Friend'}
            city={me?.profile?.city ?? undefined}
            tier="free"
            incomingBlessCount={incomingBlessCount}
            onIncomingBlesses={() => openSettings('incomingBlesses')}
            onNavigate={handleNavigate}
            onEditProfile={() => openSettings('editProfile')}
            onFaithReplies={() => openSettings('preferences')}
            onNotifications={() => openSettings('notifications')}
            onPrivacy={() => openSettings('privacy')}
            onBlocked={() => openSettings('blocked')}
            onUpgrade={() => openSettings('upgrade')}
            onSignOut={() => setSignOutVisible(true)}
          />
          </Animated.View>
        )}

        {overlay.kind === 'profile' ? (
          <Animated.View
            entering={SlideInRight.duration(320)}
            exiting={SlideOutRight.duration(200)}
            style={styles.overlay}
          >
            <ProfileDetailScreen
              matchId={overlay.matchId}
              onClose={closeOverlay}
              onPass={closeOverlay}
              onBegin={beginConversationFromProfile}
            />
          </Animated.View>
        ) : null}

        {overlay.kind === 'thread' ? (
          <Animated.View
            entering={SlideInRight.duration(320)}
            exiting={SlideOutRight.duration(200)}
            style={styles.overlay}
          >
            <ThreadScreen threadId={overlay.threadId} onClose={closeOverlay} />
          </Animated.View>
        ) : null}

        {overlay.kind === 'settings' ? (
          <Animated.View
            entering={SlideInRight.duration(320)}
            exiting={SlideOutRight.duration(200)}
            style={styles.overlay}
          >
            <SettingsRouter
              route={overlay.route}
              onBack={closeOverlay}
              onConfirmDelete={() => setDeleteVisible(true)}
              onSubscribe={() => {
                /* Apple IAP / Stripe — v1.1 */
              }}
              onOpenRoute={(r) => setOverlay({ kind: 'settings', route: r })}
            />
          </Animated.View>
        ) : null}

        <ConfirmSheet
          visible={signOutVisible}
          eyebrow="Sign out"
          title="Sign out of BlessCupid?"
          body="You can sign back in any time. Your matches and conversations are saved."
          confirmLabel="Sign out"
          cancelLabel="Cancel"
          destructive
          onCancel={() => setSignOutVisible(false)}
          onConfirm={handleSignOut}
        />

        <ConfirmSheet
          visible={deleteVisible}
          eyebrow="Delete account"
          title="Delete your account?"
          body="This cannot be undone. Your profile, photos, and conversations will be permanently removed."
          confirmLabel="Delete forever"
          cancelLabel="Keep account"
          destructive
          onCancel={() => setDeleteVisible(false)}
          onConfirm={handleDelete}
        />

        <OfflineBanner visible={isOffline} />
      </View>
    </ToastProvider>
  );
}

function SettingsRouter({
  route,
  onBack,
  onConfirmDelete,
  onSubscribe,
  onOpenRoute,
}: {
  route: SettingsRoute;
  onBack: () => void;
  onConfirmDelete: () => void;
  onSubscribe: () => void;
  onOpenRoute: (r: SettingsRoute) => void;
}) {
  switch (route) {
    case 'editProfile':
      return (
        <EditProfileScreen onBack={onBack} onEditPhotos={() => onOpenRoute('editPhotos')} />
      );
    case 'editPhotos':
      return <EditPhotosScreen onBack={onBack} />;
    case 'preferences':
      return <PreferencesScreen onBack={onBack} />;
    case 'notifications':
      return <NotificationsScreen onBack={onBack} />;
    case 'privacy':
      return <PrivacyScreen onBack={onBack} />;
    case 'blocked':
      return <BlockedListScreen onBack={onBack} />;
    case 'pause':
      return <PauseProfileScreen onBack={onBack} />;
    case 'account':
      return <AccountScreen onBack={onBack} onConfirmDelete={onConfirmDelete} />;
    case 'help':
      return <HelpSupportScreen onBack={onBack} />;
    case 'about':
      return <AboutLegalScreen onBack={onBack} />;
    case 'safety':
      return <SafetyCenterScreen onBack={onBack} />;
    case 'upgrade':
      return <UpgradeScreen onBack={onBack} onSubscribe={onSubscribe} />;
    case 'incomingBlesses':
      return <IncomingBlessesScreen onBack={onBack} onUpgrade={() => onOpenRoute('upgrade')} />;
  }
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
