// Font loader for the BlessCupid v0 type pairing.
// Cormorant Garamond (display) + Inter (UI/body), with system-font fallback
// per tokens.md §2.1. Hook returns a tri-state so callers can render a
// fallback splash while glyphs warm up — and ship something safe in airplane
// mode where bundled font assets still resolve from disk.

import {
  useFonts,
  CormorantGaramond_400Regular,
  CormorantGaramond_400Regular_Italic,
  CormorantGaramond_500Medium,
  CormorantGaramond_500Medium_Italic,
  CormorantGaramond_600SemiBold,
} from '@expo-google-fonts/cormorant-garamond';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';

export type FontStatus = 'loading' | 'ready' | 'error';

export function useDesignSystemFonts(): { status: FontStatus; error: Error | null } {
  const [loaded, error] = useFonts({
    CormorantGaramond_400Regular,
    CormorantGaramond_400Regular_Italic,
    CormorantGaramond_500Medium,
    CormorantGaramond_500Medium_Italic,
    CormorantGaramond_600SemiBold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  if (error) return { status: 'error', error };
  if (!loaded) return { status: 'loading', error: null };
  return { status: 'ready', error: null };
}
