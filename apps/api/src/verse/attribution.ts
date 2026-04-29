// BLE-30 §1: attribution strings — must be returned verbatim.
// Combined render = TB2 + NIV. TB-only variant when TB2 unavailable.

export const ATTRIBUTION = {
  combined: 'TB2 © Lembaga Alkitab Indonesia. NIV © Biblica, Inc.',
  tbOnly: 'TB © Lembaga Alkitab Indonesia.',
  tb2Only: 'TB2 © Lembaga Alkitab Indonesia.',
  nivOnly: 'NIV © Biblica, Inc.',
} as const;

export type Translation = 'tb' | 'tb2' | 'niv';

export function attributionFor(t: Translation): string {
  switch (t) {
    case 'tb':
      return ATTRIBUTION.tbOnly;
    case 'tb2':
      return ATTRIBUTION.tb2Only;
    case 'niv':
      return ATTRIBUTION.nivOnly;
  }
}
