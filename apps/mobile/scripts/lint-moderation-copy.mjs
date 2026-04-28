#!/usr/bin/env node
// BLE-128 / BLE-63 — Moderation copy lint.
// Source: BLE-42 Playbook Appendix B. Build-fail on banned phrase, missing rule_id/appeal_url,
// or stale `pastor_reviewed_at` frontmatter (>60d). Warn at >30d.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '..', '..', '..');
const DEFAULT_DIR = resolve(HERE, '..', 'src', 'copy', 'moderation');
const DEFAULT_CONFIG = resolve(HERE, 'moderation-copy-lint.config.json');

const TIERS = ['t1', 't2', 't3', 't4'];

// JS RegExp does not support inline `(?i)` flags. Translate `(?i)` → `i` flag
// so the YAML/JSON pattern set in BLE-42 Appendix B can be used verbatim.
function compilePattern(pattern) {
  let flags = '';
  let body = pattern;
  const m = body.match(/^\(\?([imsux]+)\)/);
  if (m) {
    flags = m[1].replace(/[^imsu]/g, '');
    body = body.slice(m[0].length);
  }
  return new RegExp(body, flags);
}

export function loadConfig(path = DEFAULT_CONFIG) {
  const raw = JSON.parse(readFileSync(path, 'utf8'));
  return {
    bannedPhrases: raw.banned_phrases.map((p) => ({
      regex: compilePattern(p.pattern),
      rule: p.rule,
      suggest: p.suggest,
      pattern: p.pattern,
    })),
    t2Required: raw.required_in_t2_plus_templates ?? [],
    t3Required: raw.required_in_t3_plus_templates ?? [],
    warnAfterDays: raw.freshness?.warn_after_days ?? 30,
    failAfterDays: raw.freshness?.fail_after_days ?? 60,
  };
}

export function parseFrontmatter(source) {
  if (!source.startsWith('---\n') && !source.startsWith('---\r\n')) {
    return { frontmatter: {}, body: source };
  }
  const end = source.indexOf('\n---', 4);
  if (end === -1) return { frontmatter: {}, body: source };
  const yaml = source.slice(4, end);
  const body = source.slice(end + 4).replace(/^\r?\n/, '');
  const frontmatter = {};
  for (const line of yaml.split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const m = line.match(/^([a-zA-Z0-9_]+)\s*:\s*(.*)$/);
    if (!m) continue;
    const key = m[1];
    let value = m[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    frontmatter[key] = value;
  }
  return { frontmatter, body };
}

function walk(dir, exclude = []) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (exclude.some((ex) => full === ex || full.startsWith(ex + '/'))) continue;
    const st = statSync(full);
    if (st.isDirectory()) out.push(...walk(full, exclude));
    else if (st.isFile() && full.endsWith('.md')) out.push(full);
  }
  return out;
}

function tierRank(tier) {
  const idx = TIERS.indexOf(String(tier).toLowerCase());
  return idx === -1 ? 0 : idx + 1;
}

function daysBetween(isoDate, now) {
  const d = new Date(isoDate + 'T00:00:00Z');
  if (Number.isNaN(d.getTime())) return Number.POSITIVE_INFINITY;
  return Math.floor((now.getTime() - d.getTime()) / 86_400_000);
}

export function lintFile(filePath, config, now = new Date()) {
  const errors = [];
  const warnings = [];
  const source = readFileSync(filePath, 'utf8');
  const { frontmatter, body } = parseFrontmatter(source);

  for (const bp of config.bannedPhrases) {
    if (bp.regex.test(body)) {
      errors.push(
        `banned phrase /${bp.pattern}/ — ${bp.rule}. Replace with: ${bp.suggest}`,
      );
    }
  }

  const tier = (frontmatter.tier || '').toLowerCase();
  if (tier && !TIERS.includes(tier)) {
    errors.push(`unknown tier "${frontmatter.tier}" (expected one of ${TIERS.join(', ')})`);
  }
  const rank = tierRank(tier);
  if (rank >= 2) {
    for (const tok of config.t2Required) {
      if (!body.includes(tok)) errors.push(`T${rank} template missing required token ${tok}`);
    }
  }
  if (rank >= 3) {
    for (const tok of config.t3Required) {
      if (!body.includes(tok)) errors.push(`T${rank} template missing required token ${tok}`);
    }
  }

  const reviewed = frontmatter.pastor_reviewed_at;
  if (!reviewed) {
    errors.push('missing required frontmatter `pastor_reviewed_at: YYYY-MM-DD`');
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(reviewed)) {
    errors.push(`malformed pastor_reviewed_at "${reviewed}" — expected YYYY-MM-DD`);
  } else {
    const age = daysBetween(reviewed, now);
    if (age > config.failAfterDays) {
      errors.push(
        `pastor_reviewed_at is ${age} days old (>${config.failAfterDays}). Pastor must re-review.`,
      );
    } else if (age > config.warnAfterDays) {
      warnings.push(
        `pastor_reviewed_at is ${age} days old (>${config.warnAfterDays}). Schedule Pastor re-review.`,
      );
    }
  }

  return { file: filePath, errors, warnings };
}

export function lintDirectory(dir, config, { exclude = [], now = new Date() } = {}) {
  const files = walk(dir, exclude);
  return files.map((f) => lintFile(f, config, now));
}

function formatReport(results, rootForRel = REPO_ROOT) {
  let errorCount = 0;
  let warnCount = 0;
  const lines = [];
  for (const r of results) {
    if (!r.errors.length && !r.warnings.length) continue;
    lines.push(relative(rootForRel, r.file));
    for (const e of r.errors) {
      lines.push(`  ✘ ${e}`);
      errorCount++;
    }
    for (const w of r.warnings) {
      lines.push(`  ⚠ ${w}`);
      warnCount++;
    }
  }
  return { text: lines.join('\n'), errorCount, warnCount };
}

function main(argv) {
  const args = argv.slice(2);
  let dir = DEFAULT_DIR;
  let configPath = DEFAULT_CONFIG;
  let excludeFixtures = true;
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--config') configPath = resolve(args[++i]);
    else if (a === '--include-fixtures') excludeFixtures = false;
    else if (!a.startsWith('--')) dir = resolve(a);
  }
  const config = loadConfig(configPath);
  const exclude = excludeFixtures ? [join(dir, '__fixtures__')] : [];
  let results;
  try {
    results = lintDirectory(dir, config, { exclude });
  } catch (err) {
    if (err && err.code === 'ENOENT') {
      console.error(`moderation-copy-lint: directory not found: ${dir}`);
      process.exit(2);
    }
    throw err;
  }
  const { text, errorCount, warnCount } = formatReport(results);
  if (text) console.error(text);
  console.error(
    `moderation-copy-lint: ${results.length} file(s), ${errorCount} error(s), ${warnCount} warning(s)`,
  );
  if (errorCount > 0) process.exit(1);
  process.exit(0);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main(process.argv);
}
