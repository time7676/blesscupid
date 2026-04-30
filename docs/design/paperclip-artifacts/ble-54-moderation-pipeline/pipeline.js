/*
 * BlessCupid moderation pipeline.
 * Source of truth: BLE-31 Report-Triage Doctrine v1.1.
 * Loads rules.json + copy-bundle.json. Evaluates a report and returns a
 * triage decision: tier, action, queue, copy, appeal, internal note, side effects.
 *
 * Universal escalation triggers (minor / self-harm / violence / press / brigade)
 * short-circuit category outcomes.
 *
 * Brigade detection: 3+ reports against the same target inside a 1h window
 * suppress auto-actions and route to human-review.
 *
 * Auto-mute: BLE-55 amendment — mute fires only on the first
 * human-review-confirmed action against a member, never on raw report count.
 */

(function (global) {
  'use strict';

  const APPEAL_EMAIL = 'care@blesscupid.app';
  /*
   * Appeal window: 14 days. BLE-31 §1–§5 templates all author "within 14 days".
   * Issue scope (BLE-56) wrote "7-day appeal window" but conflicts with doctrine
   * — Pastor ruled 14 days authoritative on 2026-04-29. Doctrine wins ("do not
   * paraphrase templates"). Pastoral reason: 14 days gives a meaningful window
   * for the §10 Voice 03 "door of restoration" frame; 7 days reads corporate.
   */
  const APPEAL_WINDOW_DAYS = 14;
  const BRIGADE_WINDOW_MS = 60 * 60 * 1000;
  const BRIGADE_THRESHOLD = 3;

  function nowMs(report) {
    return report && report.timestamp ? +new Date(report.timestamp) : Date.now();
  }

  function detectBrigade(report, history) {
    if (!report || !report.target_id || !Array.isArray(history)) return false;
    const cutoff = nowMs(report) - BRIGADE_WINDOW_MS;
    const distinctReporters = new Set();
    for (const prior of history) {
      if (!prior || prior.target_id !== report.target_id) continue;
      if (+new Date(prior.timestamp) < cutoff) continue;
      if (prior.reporter_id) distinctReporters.add(prior.reporter_id);
    }
    if (report.reporter_id) distinctReporters.add(report.reporter_id);
    return distinctReporters.size >= BRIGADE_THRESHOLD;
  }

  function matchUniversalTrigger(report, rules) {
    if (!rules || !rules.universal_escalation_triggers) return null;
    const sigs = new Set(report.signals || []);
    for (const trigger of rules.universal_escalation_triggers) {
      if (trigger.id === 'brigade') continue;
      for (const m of trigger.match || []) {
        if (sigs.has(m)) return trigger;
      }
    }
    return null;
  }

  function findCategory(rules, categoryId) {
    return (rules.categories || []).find((c) => c.id === categoryId) || null;
  }

  function findMatrixRow(category, pattern) {
    if (!category || !category.matrix) return null;
    return category.matrix.find((row) => row.pattern === pattern) || null;
  }

  function appealPayload(action, ruleResult) {
    if (!action) return null;
    if (action === 'non-action') return null;
    if (ruleResult && ruleResult.legal_hold) return null;
    return {
      email: APPEAL_EMAIL,
      window_days: APPEAL_WINDOW_DAYS,
      opens_at: new Date().toISOString(),
    };
  }

  function copyFor(bundle, categoryId, action) {
    if (!bundle || !categoryId || !action) return null;
    const cat = bundle[categoryId];
    if (!cat) return null;
    const entry = cat[action];
    if (!entry) return null;
    return {
      en: entry.en,
      id: entry.id,
      scripture: entry.scripture || null,
      internal_note: entry.internal_note || null,
    };
  }

  function evaluate(report, ctx) {
    const rules = ctx.rules;
    const bundle = ctx.bundle;
    const history = ctx.history || [];

    const decision = {
      report_id: report.id,
      target_id: report.target_id,
      category_id: report.category_id,
      pattern: report.pattern || null,
      tier: null,
      action: null,
      queue: null,
      copy: null,
      appeal: null,
      side_effects: [],
      flags: [],
      reasoning: [],
      cohort_tags: report.cohort_tags || [],
    };

    const universal = matchUniversalTrigger(report, rules);
    if (universal) {
      decision.tier = universal.force_tier;
      decision.action = null;
      decision.queue = universal.force_tier === 'escalate-CEO' ? 'pastor-ceo' : 'human-review';
      decision.flags.push('universal:' + universal.id);
      if (universal.side_effect) decision.side_effects.push(universal.side_effect);
      if (universal.legal) decision.side_effects.push.apply(decision.side_effects, universal.legal);
      decision.reasoning.push(
        'Universal escalation trigger "' + universal.id + '" short-circuits category outcome.'
      );
      decision.appeal = null;
      return decision;
    }

    const brigade = detectBrigade(report, history);
    if (brigade) {
      decision.tier = 'human-review';
      decision.queue = 'human-review';
      decision.flags.push('brigade');
      decision.side_effects.push('suppress_auto_actions_against_target');
      decision.reasoning.push(
        BRIGADE_THRESHOLD + '+ reports against target in ' + (BRIGADE_WINDOW_MS / 60000) + 'm — auto-actions suppressed.'
      );
      return decision;
    }

    const category = findCategory(rules, report.category_id);
    if (!category) {
      decision.tier = 'human-review';
      decision.queue = 'human-review';
      decision.flags.push('unknown-category');
      decision.reasoning.push('Unknown category — defaulting to human-review per §Operational Note 1.');
      return decision;
    }

    const row = findMatrixRow(category, report.pattern);
    if (!row) {
      decision.tier = 'human-review';
      decision.queue = 'human-review';
      decision.flags.push('unmatched-pattern');
      decision.reasoning.push('Pattern not in tier matrix — defaulting to human-review (ambiguity).');
      return decision;
    }

    decision.tier = row.tier;
    decision.action = row.action;
    decision.queue =
      row.tier === 'escalate-CEO' ? 'pastor-ceo' : row.tier === 'human-review' ? 'human-review' : 'auto-log';

    if (row.side_effect) decision.side_effects.push(row.side_effect);
    if (row.legal) decision.side_effects.push(row.legal);
    if (row.route_to) decision.flags.push('route:' + row.route_to);
    if (row.guard) decision.flags.push('guard:' + row.guard);
    if (row.next_tier_on_repeat) decision.flags.push('escalates_on_repeat:' + row.next_tier_on_repeat);
    if (row.seeker_teacher_prompt) {
      decision.seeker_teacher_prompt = true;
      decision.flags.push('prompt:seeker_or_teacher');
    }

    decision.copy = copyFor(bundle, category.id, row.action);
    decision.appeal = appealPayload(row.action, { legal_hold: row.legal === 'NCMEC' });
    decision.reasoning.push(
      'Matched ' + category.id + '/' + row.pattern + ' → tier=' + row.tier + ', action=' + row.action + '.'
    );

    return decision;
  }

  /*
   * Apply Pastor's seeker/teacher choice to a decision that carries
   * seeker_teacher_prompt (BLE-31 §6 deny_creedal_floor guard).
   *   - 'seeker' → non-action; flag for soft pastoral DM follow-up.
   *   - 'teacher' → keep action='removal' per §6 doctrinal removal template.
   * Mutates and returns the decision.
   */
  function applySeekerTeacherChoice(decision, choice) {
    if (!decision || !decision.seeker_teacher_prompt) return decision;
    if (choice === 'seeker') {
      decision.action = 'non-action';
      decision.appeal = null;
      decision.flags.push('seeker_pastoral_dm_pending');
      decision.reasoning.push('Pastor classified as seeker — non-action; soft pastoral DM follow-up pending.');
    } else if (choice === 'teacher') {
      decision.flags.push('teacher_confirmed');
      decision.reasoning.push('Pastor classified as teacher — proceed with §6 doctrinal removal.');
    }
    return decision;
  }

  /*
   * Auto-mute applies on the FIRST human-review-confirmed action against a member.
   * Caller supplies the target's prior confirmed action count.
   */
  function shouldAutoMute(decision, priorConfirmedActionsAgainstTarget) {
    if (!decision || !decision.action) return false;
    if (decision.action === 'non-action') return false;
    if (decision.tier !== 'human-review') return false;
    return (priorConfirmedActionsAgainstTarget || 0) === 0;
  }

  function maskCohortTagsForViewer(decision, viewerRole) {
    const allowed = ['CEO', 'Pastor'];
    const tags = (decision.cohort_tags || []).slice();
    if (allowed.indexOf(viewerRole) !== -1) {
      return { tags, masked: false };
    }
    const masked = tags.map((t) => (t === 'convert-privacy' ? null : t)).filter((t) => t !== null);
    const wasMasked = tags.indexOf('convert-privacy') !== -1;
    return { tags: masked, masked: wasMasked };
  }

  /*
   * renderAction composes the user-facing surface for a decision.
   *
   * For Voice 03 ban surfaces (action === 'ban'), renders:
   *   - $ban_canonical_heading from the bundle (BLE-31 §10 amendment v1.2 #3)
   *   - scripture cite line with $ban_scripture_disclaimer suffix when
   *     scripture.voice_03_disclaimer_required === true (BLE-31 §10.6)
   *
   * Pass `bundle` via ctx so we can read the bundle-level $ban_canonical_heading
   * and $ban_scripture_disclaimer. Older callers without ctx still work; they
   * just don't get the canonical Voice 03 framing.
   */
  function renderAction(decision, locale, ctx) {
    if (!decision || !decision.copy) return null;
    const lang = locale === 'id' ? 'id' : 'en';
    const bundle = ctx && ctx.bundle ? ctx.bundle : null;
    const isBan = decision.action === 'ban';
    const scripture = decision.copy.scripture || null;

    let citeLine = null;
    if (scripture) {
      const baseCite = scripture.ref + ' · ' + scripture.tx;
      if (isBan && scripture.voice_03_disclaimer_required && bundle && bundle.$ban_scripture_disclaimer) {
        const disc = bundle.$ban_scripture_disclaimer[lang] || bundle.$ban_scripture_disclaimer.en;
        citeLine = baseCite + ' · ' + disc;
      } else {
        citeLine = baseCite;
      }
    }

    let canonicalHeading = null;
    if (isBan && bundle && bundle.$ban_canonical_heading) {
      canonicalHeading = bundle.$ban_canonical_heading[lang] || bundle.$ban_canonical_heading.en;
    }

    return {
      canonical_heading: canonicalHeading,
      body: decision.copy[lang],
      scripture: scripture,
      scripture_cite: citeLine,
      appeal: decision.appeal
        ? lang === 'id'
          ? 'Banding: ' + decision.appeal.email + ' dalam ' + decision.appeal.window_days + ' hari.'
          : 'Appeals: ' + decision.appeal.email + ' within ' + decision.appeal.window_days + ' days.'
        : null,
      internal_note: decision.copy.internal_note,
    };
  }

  const api = {
    evaluate,
    detectBrigade,
    matchUniversalTrigger,
    applySeekerTeacherChoice,
    shouldAutoMute,
    maskCohortTagsForViewer,
    renderAction,
    APPEAL_EMAIL,
    APPEAL_WINDOW_DAYS,
    BRIGADE_WINDOW_MS,
    BRIGADE_THRESHOLD,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    global.BlessCupidPipeline = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
