import { create } from 'zustand';
import type { Mode, Denomination, Ministry, MarriageTimeline } from '../i18n/catechism.js';

/**
 * Catechism onboarding state.
 *
 * Mode is a Set per BLE-29 §4 rev 2 (multi-select).
 * Marriage timeline only required if `marriage` ∈ selectedModes.
 */
interface CatechismState {
  selectedModes: Set<Mode>;
  ackChecked: boolean;
  denomination: Denomination | null;
  homeChurch: string | null;
  ministries: Set<Ministry>;
  marriageTimeline: MarriageTimeline | null;
  photoUri: string | null;

  toggleMode: (m: Mode) => void;
  setAck: (checked: boolean) => void;
  setDenomination: (d: Denomination) => void;
  setHomeChurch: (name: string | null) => void;
  toggleMinistry: (m: Ministry) => void;
  setMarriageTimeline: (t: MarriageTimeline) => void;
  setPhotoUri: (uri: string | null) => void;
  reset: () => void;
}

const initial = {
  selectedModes: new Set<Mode>(),
  ackChecked: false,
  denomination: null,
  homeChurch: null,
  ministries: new Set<Ministry>(),
  marriageTimeline: null,
  photoUri: null,
};

export const useCatechism = create<CatechismState>((set) => ({
  ...initial,
  toggleMode: (m) =>
    set((s) => {
      const next = new Set(s.selectedModes);
      if (next.has(m)) next.delete(m);
      else next.add(m);
      return { selectedModes: next };
    }),
  setAck: (checked) => set({ ackChecked: checked }),
  setDenomination: (d) => set({ denomination: d }),
  setHomeChurch: (name) => set({ homeChurch: name }),
  toggleMinistry: (m) =>
    set((s) => {
      const next = new Set(s.ministries);
      if (next.has(m)) next.delete(m);
      else next.add(m);
      return { ministries: next };
    }),
  setMarriageTimeline: (t) => set({ marriageTimeline: t }),
  setPhotoUri: (uri) => set({ photoUri: uri }),
  reset: () => set({ ...initial, selectedModes: new Set(), ministries: new Set() }),
}));

export function shouldRenderMarriageTimeline(modes: Set<Mode>): boolean {
  return modes.has('marriage');
}
