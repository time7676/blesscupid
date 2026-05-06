// Haptic feedback wrapper — expo-haptics on iOS + Android.
// Source-of-truth haptic map: docs/design/system-v1/swipe-experience.html §06.
// All calls are best-effort; failures swallowed so unsupported devices/sims
// don't crash the swipe flow.

import * as Haptics from 'expo-haptics';

export type HapticKind =
  | 'press' // light impact — card press-down, button tap
  | 'threshold' // medium impact — gesture crosses commit threshold
  | 'commit' // success notification — pass/bless commit
  | 'super' // heavy impact then success — super-bless commit
  | 'match' // success notification — match found (chained 200ms post-commit)
  | 'empty' // warning notification — deck empty
  | 'interlude'; // light impact — verse-interlude dismiss (NOT affirmative)

async function safe(fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
  } catch {
    // Some Android emulators / iOS sims have no haptics — swallow.
  }
}

export async function haptic(kind: HapticKind): Promise<void> {
  switch (kind) {
    case 'press':
    case 'interlude':
      await safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
      return;
    case 'threshold':
      await safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
      return;
    case 'commit':
    case 'match':
      await safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
      return;
    case 'super':
      await safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy));
      await safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
      return;
    case 'empty':
      await safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning));
      return;
  }
}
