import en from './en.json' with { type: 'json' };

/**
 * Copy keys are stable. Values are Pastor-signed (BLE-124).
 * Source of truth: docs/copy/PLACEHOLDERS.md +
 *   /BLE/issues/BLE-41#document-user-covenant
 *   /BLE/issues/BLE-41#document-onboarding-questionnaire
 */
export const copy = en;
