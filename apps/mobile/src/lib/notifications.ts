/**
 * Push-notification scaffold (expo-notifications).
 *
 * Pre-alpha: registers permission + retrieves Expo push token + posts to
 * `/me/push-token` so server can deliver match + message notifications.
 *
 * Server-side push is wired post-pre-alpha (needs APNs cert + FCM key).
 * For now this lets the device opt-in early so the token is on file.
 *
 *   await registerForPushNotifications(token, version);
 *
 * Real-time architecture roadmap (v1.1):
 *   - Server fires expo-server-sdk on match commit + new message.
 *   - Mobile subscribes via Notifications.addNotificationReceivedListener.
 *   - When match push arrives → set pendingMatchId + open MatchSheet.
 *   - When new-message push arrives → update Conversations badge + Thread cache.
 *   - Falls back to polling (already implemented in AppShell + Thread).
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { registerPushToken } from './api.js';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotifications(
  authToken: string,
  appVersion: string,
): Promise<string | null> {
  // Permission request — user can deny. Don't block the app on denial.
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    return null;
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData.data;
    await registerPushToken(authToken, {
      token,
      platform: Platform.OS === 'ios' ? 'ios' : 'android',
      appVersion,
    });
    return token;
  } catch {
    // Sims + Expo Go often fail token retrieval. Non-fatal.
    return null;
  }
}

export type NotificationPayload =
  | { type: 'match'; matchUserId: string; matchName: string }
  | { type: 'message'; threadId: string; preview: string; partnerName: string }
  | { type: 'incoming_bless'; matchUserId: string };

/**
 * Subscribe to incoming foreground notifications. Returns an unsubscribe fn.
 */
export function onForegroundNotification(
  handler: (payload: NotificationPayload) => void,
): () => void {
  const subscription = Notifications.addNotificationReceivedListener((notification) => {
    const data = notification.request.content.data as unknown as NotificationPayload;
    if (data && typeof data === 'object' && 'type' in data) {
      handler(data);
    }
  });
  return () => subscription.remove();
}

/**
 * Subscribe to taps on a notification (background or foreground).
 */
export function onNotificationTap(
  handler: (payload: NotificationPayload) => void,
): () => void {
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data as unknown as NotificationPayload;
    if (data && typeof data === 'object' && 'type' in data) {
      handler(data);
    }
  });
  return () => subscription.remove();
}

// =============================================================
//  Local triggers — pre-alpha bridge until server push lands.
//  Schedule local notification immediately so user sees iOS banner
//  even when app is foreground or background. Server-side push via
//  expo-server-sdk replaces these in v1.1 (memory: realtime memo).
// =============================================================

async function fire(
  title: string,
  body: string,
  data: NotificationPayload,
): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data as unknown as Record<string, unknown>,
        sound: 'default',
      },
      trigger: null, // immediate
    });
  } catch {
    // Sims / Expo Go may reject local schedules. Non-fatal.
  }
}

export async function notifyMatch(matchUserId: string, matchName: string): Promise<void> {
  await fire(
    'A connection.',
    `You and ${matchName} have crossed paths.`,
    { type: 'match', matchUserId, matchName },
  );
}

export async function notifyMessage(
  threadId: string,
  partnerName: string,
  preview: string,
): Promise<void> {
  await fire(partnerName, preview, { type: 'message', threadId, preview, partnerName });
}

export async function notifyIncomingBless(matchUserId: string): Promise<void> {
  await fire(
    'Someone walked toward you.',
    'Open Bless+ to see who.',
    { type: 'incoming_bless', matchUserId },
  );
}

/** Returns whether the user has granted permission. Cheap to call. */
export async function notificationsGranted(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}
