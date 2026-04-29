// BLE-124 — privacy contract unit tests for the v1 onboarding questionnaire.
//
// These tests are the boundary lint between mobile/API client payloads and
// the storage layer. Source predicates: BLE-41 onboarding-questionnaire +
// Holy Code §1.4, §4.2, §4.3.
import { describe, expect, it } from 'vitest';
import {
  COVENANT_VERSION,
  Q3RedirectSchema,
  QUESTIONNAIRE_LIMITS,
  QuestionnaireSubmitSchema,
  WelcomedTagsUpdateSchema,
} from './onboarding.js';

describe('COVENANT_VERSION (BLE-124)', () => {
  it('is bumped to v1 (Pastor-signed text from BLE-41)', () => {
    expect(COVENANT_VERSION).toBe('v1');
  });
});

describe('QuestionnaireSubmitSchema — Q3 privacy contract (§4.2)', () => {
  it('accepts seeking=same_sex without persisting any match preference (no preference field exists)', () => {
    const parsed = QuestionnaireSubmitSchema.safeParse({
      intent: 'dating',
      seeking: 'same_sex',
      tradition: 'catholic',
      marriageOpen: 'yes',
      welcomedTags: [],
      welcomedTagVisibility: {},
      practiceTags: [],
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      // Lint anchor — there is no "matchPreference" or "datingFilter" field
      // for same-sex matching to write into. The redirect handler is the
      // only path that mutates account state.
      expect(parsed.data).not.toHaveProperty('matchPreference');
      expect(parsed.data).not.toHaveProperty('datingFilter');
    }
  });

  it('rejects dating intent without seeking', () => {
    const parsed = QuestionnaireSubmitSchema.safeParse({
      intent: 'dating',
      tradition: 'catholic',
      marriageOpen: 'yes',
      welcomedTags: [],
      welcomedTagVisibility: {},
      practiceTags: [],
    });
    expect(parsed.success).toBe(false);
  });

  it('rejects dating intent without marriageOpen', () => {
    const parsed = QuestionnaireSubmitSchema.safeParse({
      intent: 'dating',
      seeking: 'woman',
      tradition: 'catholic',
      welcomedTags: [],
      welcomedTagVisibility: {},
      practiceTags: [],
    });
    expect(parsed.success).toBe(false);
  });

  it('accepts non-dating intent without seeking/marriageOpen', () => {
    const parsed = QuestionnaireSubmitSchema.safeParse({
      intent: 'friendship',
      tradition: 'protestant_evangelical',
      welcomedTags: [],
      welcomedTagVisibility: {},
      practiceTags: [],
    });
    expect(parsed.success).toBe(true);
  });
});

describe('QuestionnaireSubmitSchema — Q7 welcomed-tag privacy default (§4.3)', () => {
  it('defaults welcomedTagVisibility to {} (privacy-by-default)', () => {
    const parsed = QuestionnaireSubmitSchema.safeParse({
      intent: 'community',
      tradition: 'orthodox',
      welcomedTags: ['previously_married'],
      practiceTags: [],
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.welcomedTagVisibility).toEqual({});
    }
  });

  it('rejects visibility=true for a tag absent from the selected set', () => {
    const parsed = QuestionnaireSubmitSchema.safeParse({
      intent: 'community',
      tradition: 'orthodox',
      welcomedTags: ['widowed'],
      welcomedTagVisibility: { previously_married: true },
      practiceTags: [],
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      const issue = parsed.error.issues.find(
        (i) => i.message === 'visibility_for_unselected_tag',
      );
      expect(issue).toBeDefined();
    }
  });

  it('allows visibility=true only for explicitly selected tags', () => {
    const parsed = QuestionnaireSubmitSchema.safeParse({
      intent: 'community',
      tradition: 'orthodox',
      welcomedTags: ['widowed', 'church_hurt'],
      welcomedTagVisibility: { widowed: true, church_hurt: false },
      practiceTags: [],
    });
    expect(parsed.success).toBe(true);
  });
});

describe('QuestionnaireSubmitSchema — Q4 tradition_other gate', () => {
  it('rejects other_christian without traditionOther free-text', () => {
    const parsed = QuestionnaireSubmitSchema.safeParse({
      intent: 'community',
      tradition: 'other_christian',
      welcomedTags: [],
      welcomedTagVisibility: {},
      practiceTags: [],
    });
    expect(parsed.success).toBe(false);
  });

  it('accepts other_christian with traditionOther free-text', () => {
    const parsed = QuestionnaireSubmitSchema.safeParse({
      intent: 'community',
      tradition: 'other_christian',
      traditionOther: 'Mar Thoma',
      welcomedTags: [],
      welcomedTagVisibility: {},
      practiceTags: [],
    });
    expect(parsed.success).toBe(true);
  });
});

describe('QuestionnaireSubmitSchema — Q8 practice tags (no scoring impact)', () => {
  it('accepts a user whose only practice tag is still_finding_a_community', () => {
    const parsed = QuestionnaireSubmitSchema.safeParse({
      intent: 'dating',
      seeking: 'man',
      tradition: 'protestant_pentecostal',
      marriageOpen: 'yes',
      welcomedTags: [],
      welcomedTagVisibility: {},
      practiceTags: ['still_finding_a_community'],
    });
    expect(parsed.success).toBe(true);
  });
});

describe('QuestionnaireSubmitSchema — Q9 bio-seed limits', () => {
  it('respects BIO_SEED_MAX (280) limit', () => {
    expect(QUESTIONNAIRE_LIMITS.bioSeedMax).toBe(280);
    const tooLong = 'a'.repeat(QUESTIONNAIRE_LIMITS.bioSeedMax + 1);
    const parsed = QuestionnaireSubmitSchema.safeParse({
      intent: 'community',
      tradition: 'catholic',
      welcomedTags: [],
      welcomedTagVisibility: {},
      practiceTags: [],
      bioSeed: tooLong,
    });
    expect(parsed.success).toBe(false);
  });
});

describe('Q3RedirectSchema (BLE-124 §4.2)', () => {
  it('accepts accept_reroute', () => {
    expect(Q3RedirectSchema.safeParse({ outcome: 'accept_reroute' }).success).toBe(true);
  });
  it('accepts closed_by_user', () => {
    expect(Q3RedirectSchema.safeParse({ outcome: 'closed_by_user' }).success).toBe(true);
  });
  it('rejects any other outcome', () => {
    expect(Q3RedirectSchema.safeParse({ outcome: 'something_else' }).success).toBe(false);
  });
});

describe('WelcomedTagsUpdateSchema (BLE-124 §4.3 settings UI)', () => {
  it('rejects visibility=true for tag not in the updated welcomedTags set', () => {
    const parsed = WelcomedTagsUpdateSchema.safeParse({
      welcomedTags: ['single_parent'],
      welcomedTagVisibility: { previously_married: true },
    });
    expect(parsed.success).toBe(false);
  });

  it('allows partial updates (welcomedTags only)', () => {
    const parsed = WelcomedTagsUpdateSchema.safeParse({
      welcomedTags: ['widowed'],
    });
    expect(parsed.success).toBe(true);
  });
});
