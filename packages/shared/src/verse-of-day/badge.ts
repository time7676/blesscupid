// BLE-102: badge label for the verse-of-day card (mockup variant 4).
// Returns null when no substitution happened so the card omits the badge.

import type { SelectedVerse } from './types.js';

export function substitutionBadge(
  selected: SelectedVerse,
): { label: string; tone: 'info' } | null {
  if (!selected.substituted) return null;
  switch (selected.reason) {
    case 'same-week-non-marriage':
      return { label: 'Friendship reflection', tone: 'info' };
    case 'recent-joy-love-fallback':
      return { label: 'Joy reflection', tone: 'info' };
    default:
      return null;
  }
}
