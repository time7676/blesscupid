import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef } from 'react';
import type { Actor } from 'xstate';
import { onboardingMachine, type OnboardingContext } from './onboardingMachine';
import { patchDraft } from '../lib/api';

const STORAGE_KEY = '@blesscupid/onboarding-draft-v1';
const SYNC_DEBOUNCE_MS = 500;

type Snapshot = {
  value: string;
  context: OnboardingContext;
  ts: string;
};

export async function loadDraft(): Promise<Snapshot | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Snapshot;
  } catch {
    return null;
  }
}

export async function saveDraft(snap: Snapshot): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(snap));
  } catch {
    // best-effort; failed write resyncs on next advance
  }
}

export async function clearDraft(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

type ActorOf = Actor<typeof onboardingMachine>;

/**
 * Subscribe to the onboarding actor and:
 *   1. Mirror state to AsyncStorage on every transition (offline kill/resume).
 *   2. Debounced PATCH /onboarding/draft to server (resume across devices, TTL 30d).
 */
export function useOnboardingPersistence(actor: ActorOf): void {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const sub = actor.subscribe((state) => {
      const value = String(state.value);
      const ctx = state.context;
      const snap: Snapshot = {
        value,
        context: ctx,
        ts: new Date().toISOString(),
      };

      // local mirror (sync)
      void saveDraft(snap);

      // server sync (debounced)
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        void patchDraft({ state: value, context: ctx }).catch(() => {
          // server retry handled by api wrapper; AsyncStorage is the source of truth offline
        });
      }, SYNC_DEBOUNCE_MS);

      if (value === 'completed') {
        void clearDraft();
      }
    });
    return () => sub.unsubscribe();
  }, [actor]);
}
