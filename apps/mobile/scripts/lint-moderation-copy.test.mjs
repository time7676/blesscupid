// BLE-128 — moderation copy lint tests.
// Validate Appendix B contracts against the fixtures under
// apps/mobile/src/copy/moderation/__fixtures__.

import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { lintFile, lintDirectory, loadConfig, parseFrontmatter } from './lint-moderation-copy.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURES = resolve(HERE, '..', 'src', 'copy', 'moderation', '__fixtures__');
const PROD = resolve(HERE, '..', 'src', 'copy', 'moderation');

// Fixed reference time so freshness fixtures behave deterministically.
// 35 days after 2026-04-10 → warn fixture; 70 days after 2026-03-06 → fail fixture.
const NOW = new Date('2026-05-15T00:00:00Z');
const config = loadConfig();

test('parseFrontmatter extracts simple key/values', () => {
  const src = `---\ntier: t2\npastor_reviewed_at: 2026-04-28\n---\nbody\n`;
  const { frontmatter, body } = parseFrontmatter(src);
  assert.equal(frontmatter.tier, 't2');
  assert.equal(frontmatter.pastor_reviewed_at, '2026-04-28');
  assert.equal(body.trim(), 'body');
});

test('banned-phrase fixture fails', () => {
  const r = lintFile(join(FIXTURES, 'banned-phrase-violation.md'), config, NOW);
  assert.ok(
    r.errors.some((e) => /banned phrase/.test(e) && /you\\s\+violated/.test(e)),
    `expected banned-phrase error, got: ${JSON.stringify(r.errors)}`,
  );
});

test('T2 missing {{rule_id}} fails', () => {
  const r = lintFile(join(FIXTURES, 'missing-rule-id.md'), config, NOW);
  assert.ok(
    r.errors.some((e) => /missing required token \{\{rule_id\}\}/.test(e)),
    `expected rule_id error, got: ${JSON.stringify(r.errors)}`,
  );
});

test('T3 missing {{appeal_url}} fails', () => {
  const r = lintFile(join(FIXTURES, 'missing-appeal-url.md'), config, NOW);
  assert.ok(
    r.errors.some((e) => /missing required token \{\{appeal_url\}\}/.test(e)),
    `expected appeal_url error, got: ${JSON.stringify(r.errors)}`,
  );
});

test('freshness >30d <=60d warns and does not error', () => {
  const r = lintFile(join(FIXTURES, 'freshness-warn.md'), config, NOW);
  assert.equal(r.errors.length, 0, `unexpected errors: ${JSON.stringify(r.errors)}`);
  assert.ok(
    r.warnings.some((w) => /pastor_reviewed_at is 35 days old/.test(w)),
    `expected 35d warning, got: ${JSON.stringify(r.warnings)}`,
  );
});

test('freshness >60d errors', () => {
  const r = lintFile(join(FIXTURES, 'freshness-fail.md'), config, NOW);
  assert.ok(
    r.errors.some((e) => /pastor_reviewed_at is 70 days old/.test(e)),
    `expected 70d error, got: ${JSON.stringify(r.errors)}`,
  );
});

test('clean T3 fixture passes', () => {
  const r = lintFile(join(FIXTURES, 'clean-t3.md'), config, NOW);
  assert.equal(r.errors.length, 0, `unexpected errors: ${JSON.stringify(r.errors)}`);
});

test('production templates have zero errors at reference time', () => {
  // Anchor "now" to one day after templates' pastor_reviewed_at so freshness passes.
  const referenceNow = new Date('2026-04-29T00:00:00Z');
  const results = lintDirectory(PROD, config, {
    exclude: [join(PROD, '__fixtures__')],
    now: referenceNow,
  });
  const allErrors = results.flatMap((r) => r.errors.map((e) => `${r.file}: ${e}`));
  assert.deepEqual(allErrors, [], `production templates have errors: ${allErrors.join('\n')}`);
});
