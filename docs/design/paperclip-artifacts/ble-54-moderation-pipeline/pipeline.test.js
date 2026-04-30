/*
 * Unit tests for moderation pipeline.
 * Run: node pipeline.test.js
 * No framework dependency. Bare assertions.
 */

const fs = require('fs');
const path = require('path');
const pipeline = require('./pipeline');

const rules = JSON.parse(fs.readFileSync(path.join(__dirname, 'rules.json'), 'utf8'));
const bundle = JSON.parse(fs.readFileSync(path.join(__dirname, 'copy-bundle.json'), 'utf8'));

let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    passed += 1;
    console.log('  ok  ' + name);
  } catch (err) {
    failed += 1;
    failures.push({ name, err });
    console.log('  FAIL ' + name + ' — ' + err.message);
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'assertion failed');
}

function assertEqual(actual, expected, msg) {
  if (actual !== expected) {
    throw new Error((msg || 'expected') + ' — got ' + JSON.stringify(actual) + ', expected ' + JSON.stringify(expected));
  }
}

function ts(offsetMin) {
  return new Date(Date.now() + offsetMin * 60000).toISOString();
}

console.log('\nBLE-54 moderation pipeline tests\n');

console.log('— Tier matrix lookup —');

test('harassment slur → auto/ban with NIV scripture', () => {
  const d = pipeline.evaluate(
    { id: 'r1', category_id: 'harassment', pattern: 'slur_protected_class', target_id: 't1', reporter_id: 'u1' },
    { rules, bundle }
  );
  assertEqual(d.tier, 'auto');
  assertEqual(d.action, 'ban');
  assertEqual(d.queue, 'auto-log');
  assert(d.copy && d.copy.en && d.copy.en.indexOf('permanently ended') !== -1, 'EN copy missing ban phrase ("permanently ended" per BLE-31 §1 + §10 amendment v1.2)');
  assert(d.copy.id && d.copy.id.indexOf('kami hentikan secara permanen') !== -1, 'ID copy missing ban phrase ("kami hentikan secara permanen" per BLE-31 §10.4 forbidden-vocab "blokir")');
  assert(d.copy.scripture && d.copy.scripture.ref === 'James 3:9-10', 'Scripture should be James 3:9-10');
  assert(d.copy.scripture.voice_03_disclaimer_required === true, 'Voice 03 ban scripture must flag pastoral disclaimer required (BLE-31 §10.6)');
});

test('sexual mutual_opted_in → non-action (no appeal)', () => {
  const d = pipeline.evaluate(
    { id: 'r2', category_id: 'sexual', pattern: 'mutual_opted_in', target_id: 't2', reporter_id: 'u2' },
    { rules, bundle }
  );
  assertEqual(d.action, 'non-action');
  assertEqual(d.appeal, null, 'non-action should not emit appeal');
});

test('financial direct_money_or_crypto → auto/removal with appeal', () => {
  const d = pipeline.evaluate(
    {
      id: 'r3',
      category_id: 'financial',
      pattern: 'direct_money_or_crypto_or_giftcard_ask',
      target_id: 't3',
      reporter_id: 'u3',
    },
    { rules, bundle }
  );
  assertEqual(d.tier, 'auto');
  assertEqual(d.action, 'removal');
  assert(d.appeal && d.appeal.email === 'care@blesscupid.app', 'appeal email mismatch');
  assertEqual(d.appeal.window_days, 14);
});

test('doctrinal tertiary_disagreement → non-action with non-action copy', () => {
  const d = pipeline.evaluate(
    { id: 'r4', category_id: 'doctrinal', pattern: 'tertiary_disagreement', target_id: 't4', reporter_id: 'u4' },
    { rules, bundle }
  );
  assertEqual(d.action, 'non-action');
  assert(d.copy && d.copy.en.indexOf("don't moderate tertiary doctrine") !== -1, 'non-action EN copy missing');
});

console.log('\n— Universal escalation triggers —');

test('minor signal short-circuits sexual category', () => {
  const d = pipeline.evaluate(
    {
      id: 'r5',
      category_id: 'sexual',
      pattern: 'mutual_opted_in',
      target_id: 't5',
      reporter_id: 'u5',
      signals: ['minor_in_media'],
    },
    { rules, bundle }
  );
  assertEqual(d.tier, 'escalate-CEO');
  assertEqual(d.queue, 'pastor-ceo');
  assert(d.flags.indexOf('universal:minor') !== -1, 'flag universal:minor missing');
  assert(d.side_effects.indexOf('NCMEC report when sexual') !== -1, 'NCMEC side-effect missing');
});

test('self-harm signal short-circuits any category', () => {
  const d = pipeline.evaluate(
    {
      id: 'r6',
      category_id: 'harassment',
      pattern: 'single_hostile_ambiguous',
      target_id: 't6',
      reporter_id: 'u6',
      signals: ['suicide_keyword'],
    },
    { rules, bundle }
  );
  assertEqual(d.tier, 'escalate-CEO');
  assert(d.side_effects.indexOf('emit_crisis_resources_to_target') !== -1, 'crisis resource side-effect missing');
});

test('violence signal forces escalate-CEO + panic_exit_offered', () => {
  const d = pipeline.evaluate(
    {
      id: 'r7',
      category_id: 'harassment',
      pattern: 'single_hostile_ambiguous',
      target_id: 't7',
      reporter_id: 'u7',
      signals: ['kill_threat'],
    },
    { rules, bundle }
  );
  assertEqual(d.tier, 'escalate-CEO');
  assert(d.side_effects.indexOf('panic_exit_offered') !== -1, 'panic_exit_offered missing');
});

test('press signal forces escalate-CEO', () => {
  const d = pipeline.evaluate(
    {
      id: 'r8',
      category_id: 'doctrinal',
      pattern: 'tertiary_disagreement',
      target_id: 't8',
      reporter_id: 'u8',
      signals: ['journalist_handle'],
    },
    { rules, bundle }
  );
  assertEqual(d.tier, 'escalate-CEO');
});

console.log('\n— Brigade detection —');

test('brigade: 3 distinct reporters within 1h trigger suppression', () => {
  const target = 'tBrigade';
  const history = [
    { target_id: target, reporter_id: 'A', timestamp: ts(-50) },
    { target_id: target, reporter_id: 'B', timestamp: ts(-30) },
  ];
  const fresh = {
    id: 'r9',
    category_id: 'harassment',
    pattern: 'slur_protected_class',
    target_id: target,
    reporter_id: 'C',
    timestamp: ts(0),
  };
  const d = pipeline.evaluate(fresh, { rules, bundle, history });
  assertEqual(d.tier, 'human-review');
  assert(d.flags.indexOf('brigade') !== -1, 'brigade flag missing');
  assert(d.side_effects.indexOf('suppress_auto_actions_against_target') !== -1, 'suppression side-effect missing');
  assertEqual(d.action, null, 'auto-action should be suppressed');
});

test('brigade: same reporter 3x does NOT trigger brigade (distinct reporters required)', () => {
  const target = 'tNoBrigade';
  const history = [
    { target_id: target, reporter_id: 'X', timestamp: ts(-40) },
    { target_id: target, reporter_id: 'X', timestamp: ts(-20) },
  ];
  const fresh = {
    id: 'r10',
    category_id: 'harassment',
    pattern: 'slur_protected_class',
    target_id: target,
    reporter_id: 'X',
    timestamp: ts(0),
  };
  const d = pipeline.evaluate(fresh, { rules, bundle, history });
  assertEqual(d.tier, 'auto', 'single reporter spam should NOT short-circuit auto tier');
  assert(d.flags.indexOf('brigade') === -1, 'brigade should not fire');
});

test('brigade: reports outside 1h window do NOT count', () => {
  const target = 'tStale';
  const history = [
    { target_id: target, reporter_id: 'A', timestamp: ts(-90) },
    { target_id: target, reporter_id: 'B', timestamp: ts(-80) },
  ];
  const fresh = {
    id: 'r11',
    category_id: 'harassment',
    pattern: 'slur_protected_class',
    target_id: target,
    reporter_id: 'C',
    timestamp: ts(0),
  };
  const d = pipeline.evaluate(fresh, { rules, bundle, history });
  assert(d.flags.indexOf('brigade') === -1, 'old reports should not trigger brigade');
});

test('brigade: reports against different targets do NOT count', () => {
  const history = [
    { target_id: 'someoneElse', reporter_id: 'A', timestamp: ts(-30) },
    { target_id: 'someoneElse', reporter_id: 'B', timestamp: ts(-20) },
  ];
  const fresh = {
    id: 'r12',
    category_id: 'harassment',
    pattern: 'slur_protected_class',
    target_id: 'realTarget',
    reporter_id: 'C',
    timestamp: ts(0),
  };
  const d = pipeline.evaluate(fresh, { rules, bundle, history });
  assert(d.flags.indexOf('brigade') === -1, 'brigade should be target-scoped');
});

console.log('\n— Auto-mute (BLE-55 amendment 1) —');

test('auto-mute fires on first human-review-confirmed action only', () => {
  const decision = { tier: 'human-review', action: 'warning' };
  assertEqual(pipeline.shouldAutoMute(decision, 0), true);
  assertEqual(pipeline.shouldAutoMute(decision, 1), false);
});

test('auto-mute does NOT fire on raw report count or auto tier', () => {
  assertEqual(pipeline.shouldAutoMute({ tier: 'auto', action: 'ban' }, 0), false);
  assertEqual(pipeline.shouldAutoMute({ tier: 'human-review', action: 'non-action' }, 0), false);
});

console.log('\n— Convert-privacy masking —');

test('convert-privacy tag visible to CEO', () => {
  const out = pipeline.maskCohortTagsForViewer(
    { cohort_tags: ['convert-privacy', 'divorced'] },
    'CEO'
  );
  assertEqual(out.tags.indexOf('convert-privacy') !== -1, true);
  assertEqual(out.masked, false);
});

test('convert-privacy tag visible to Pastor', () => {
  const out = pipeline.maskCohortTagsForViewer(
    { cohort_tags: ['convert-privacy'] },
    'Pastor'
  );
  assertEqual(out.tags.indexOf('convert-privacy') !== -1, true);
});

test('convert-privacy tag MASKED for default Moderator role', () => {
  const out = pipeline.maskCohortTagsForViewer(
    { cohort_tags: ['convert-privacy', 'divorced'] },
    'Moderator'
  );
  assertEqual(out.tags.indexOf('convert-privacy'), -1);
  assertEqual(out.tags.indexOf('divorced') !== -1, true);
  assertEqual(out.masked, true);
});

console.log('\n— Bilingual copy bundle integrity —');

test('every category × action in tier matrix has bilingual copy', () => {
  for (const cat of rules.categories) {
    const seenActions = new Set();
    for (const row of cat.matrix) {
      seenActions.add(row.action);
    }
    seenActions.delete('non-action');
    for (const action of seenActions) {
      const entry = (bundle[cat.id] || {})[action];
      assert(entry, 'missing copy bundle for ' + cat.id + '/' + action);
      assert(entry.en && entry.en.length > 0, 'missing EN copy for ' + cat.id + '/' + action);
      assert(entry.id && entry.id.length > 0, 'missing ID copy for ' + cat.id + '/' + action);
    }
  }
});

test('renderAction emits bilingual appeal sentence', () => {
  const d = pipeline.evaluate(
    {
      id: 'r99',
      category_id: 'financial',
      pattern: 'direct_money_or_crypto_or_giftcard_ask',
      target_id: 't99',
      reporter_id: 'u99',
    },
    { rules, bundle }
  );
  const en = pipeline.renderAction(d, 'en', { bundle });
  const id = pipeline.renderAction(d, 'id', { bundle });
  assert(en.appeal.indexOf('Appeals: care@blesscupid.app') === 0, 'EN appeal sentence wrong');
  assert(id.appeal.indexOf('Banding: care@blesscupid.app') === 0, 'ID appeal sentence wrong');
  assert(en.appeal.indexOf('14 days') !== -1, 'EN appeal window must be 14 days');
  assert(id.appeal.indexOf('14 hari') !== -1, 'ID appeal window must be 14 hari');
});

console.log('\n— BLE-31 §10 Voice 03 ban surface —');

test('ban surface emits canonical heading "door of restoration" in both locales', () => {
  const d = pipeline.evaluate(
    { id: 'rB1', category_id: 'harassment', pattern: 'slur_protected_class', target_id: 'tB1', reporter_id: 'uB1' },
    { rules, bundle }
  );
  const en = pipeline.renderAction(d, 'en', { bundle });
  const id = pipeline.renderAction(d, 'id', { bundle });
  assertEqual(en.canonical_heading, 'The door of restoration remains open.');
  assertEqual(id.canonical_heading, 'Pintu pemulihan tetap terbuka.');
});

test('ban surface scripture cite includes pastoral disclaimer (§10.6)', () => {
  const d = pipeline.evaluate(
    { id: 'rB2', category_id: 'harassment', pattern: 'slur_protected_class', target_id: 'tB2', reporter_id: 'uB2' },
    { rules, bundle }
  );
  const en = pipeline.renderAction(d, 'en', { bundle });
  const id = pipeline.renderAction(d, 'id', { bundle });
  assert(en.scripture_cite.indexOf('pastoral note, not a verdict') !== -1, 'EN cite missing §10.6 disclaimer');
  assert(id.scripture_cite.indexOf('catatan pastoral, bukan vonis') !== -1, 'ID cite missing §10.6 disclaimer');
  assert(en.scripture_cite.indexOf('James 3:9-10') !== -1, 'cite must include ref');
  assert(en.scripture_cite.indexOf('NIV') !== -1, 'cite must include translation tag');
});

test('non-ban surface omits canonical heading and disclaimer', () => {
  const d = pipeline.evaluate(
    { id: 'rB3', category_id: 'harassment', pattern: 'repeat_after_stop_2', target_id: 'tB3', reporter_id: 'uB3' },
    { rules, bundle }
  );
  const en = pipeline.renderAction(d, 'en', { bundle });
  assertEqual(en.canonical_heading, null, 'removal surface must not emit ban heading');
  assert(
    !en.scripture_cite || en.scripture_cite.indexOf('pastoral note') === -1,
    'removal cite must not carry §10.6 ban disclaimer'
  );
});

test('forbidden vocab "blokir" / "permanently banned" absent from all ban copy (BLE-31 §10.4)', () => {
  for (const cat of rules.categories) {
    const ban = (bundle[cat.id] || {}).ban;
    if (!ban) continue;
    if (cat.id === 'sexual') continue;
    if (cat.id === 'off-platform') continue;
    assert(
      ban.en.indexOf('permanently banned') === -1,
      cat.id + '.ban.en must not say "permanently banned" (BLE-31 §10.4 + amendment v1.2 #3)'
    );
    assert(
      ban.id.indexOf('diblokir') === -1,
      cat.id + '.ban.id must not contain "diblokir" (BLE-31 §10.4 forbidden vocab)'
    );
  }
});

test('every ban template has voice_03_disclaimer_required flag set on scripture (or explicit omit reason)', () => {
  for (const cat of rules.categories) {
    const ban = (bundle[cat.id] || {}).ban;
    if (!ban || !ban.scripture) continue;
    if (cat.id === 'sexual') continue;
    const hasFlag = typeof ban.scripture.voice_03_disclaimer_required === 'boolean';
    assert(hasFlag, cat.id + '.ban.scripture must declare voice_03_disclaimer_required (BLE-31 §10.6)');
  }
});

console.log('\n— Doctrinal deny_creedal_floor seeker/teacher routing (BLE-56 hand-back §4) —');

test('deny_creedal_floor routes to pastor-ceo queue with escalate-CEO tier', () => {
  const d = pipeline.evaluate(
    { id: 'rD1', category_id: 'doctrinal', pattern: 'deny_creedal_floor', target_id: 'tD1', reporter_id: 'uD1' },
    { rules, bundle }
  );
  assertEqual(d.tier, 'escalate-CEO', 'Pastor ruled deny_creedal_floor escalates to CEO/Pastor');
  assertEqual(d.queue, 'pastor-ceo', 'queue must land in pastor-ceo, not human-review');
  assertEqual(d.action, 'removal', 'default action remains §6 doctrinal removal until Pastor classifies');
});

test('deny_creedal_floor surfaces seeker_teacher_prompt flag', () => {
  const d = pipeline.evaluate(
    { id: 'rD2', category_id: 'doctrinal', pattern: 'deny_creedal_floor', target_id: 'tD2', reporter_id: 'uD2' },
    { rules, bundle }
  );
  assertEqual(d.seeker_teacher_prompt, true);
  assert(d.flags.indexOf('prompt:seeker_or_teacher') !== -1, 'must flag prompt:seeker_or_teacher');
  assert(d.flags.indexOf('guard:verify_intent_seeker_vs_teacher') !== -1, 'must preserve guard flag');
});

test('applySeekerTeacherChoice("seeker") → non-action + pastoral DM flag', () => {
  const d = pipeline.evaluate(
    { id: 'rD3', category_id: 'doctrinal', pattern: 'deny_creedal_floor', target_id: 'tD3', reporter_id: 'uD3' },
    { rules, bundle }
  );
  pipeline.applySeekerTeacherChoice(d, 'seeker');
  assertEqual(d.action, 'non-action', 'seeker classification → non-action');
  assertEqual(d.appeal, null, 'non-action emits no appeal');
  assert(d.flags.indexOf('seeker_pastoral_dm_pending') !== -1, 'pastoral DM follow-up flag missing');
});

test('applySeekerTeacherChoice("teacher") → keep removal action', () => {
  const d = pipeline.evaluate(
    { id: 'rD4', category_id: 'doctrinal', pattern: 'deny_creedal_floor', target_id: 'tD4', reporter_id: 'uD4' },
    { rules, bundle }
  );
  pipeline.applySeekerTeacherChoice(d, 'teacher');
  assertEqual(d.action, 'removal', 'teacher classification → §6 doctrinal removal');
  assert(d.flags.indexOf('teacher_confirmed') !== -1, 'teacher_confirmed flag missing');
});

test('applySeekerTeacherChoice is no-op on decisions without seeker_teacher_prompt', () => {
  const d = pipeline.evaluate(
    { id: 'rD5', category_id: 'doctrinal', pattern: 'tertiary_disagreement', target_id: 'tD5', reporter_id: 'uD5' },
    { rules, bundle }
  );
  const before = d.action;
  pipeline.applySeekerTeacherChoice(d, 'seeker');
  assertEqual(d.action, before, 'must not mutate decisions that did not request the prompt');
});

console.log('\n— Result —');
console.log('  passed: ' + passed);
console.log('  failed: ' + failed);

if (failed > 0) {
  for (const f of failures) console.log('FAILURE ' + f.name + ': ' + f.err.stack);
  process.exit(1);
}
process.exit(0);
