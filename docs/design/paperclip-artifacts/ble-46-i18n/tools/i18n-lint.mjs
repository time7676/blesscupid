#!/usr/bin/env node
// Locale lint: parity, ICU validity, empty values.
// Usage: node tools/i18n-lint.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCALES_DIR = path.join(__dirname, '..', 'locales');
const PRIMARY = 'id';
const FALLBACK = 'en';

function flatten(obj, prefix = '') {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      Object.assign(out, flatten(v, key));
    } else {
      out[key] = v;
    }
  }
  return out;
}

function load(locale) {
  const file = path.join(LOCALES_DIR, `${locale}.json`);
  return flatten(JSON.parse(fs.readFileSync(file, 'utf8')));
}

function checkICU(value) {
  // Cheap ICU plural check: matches `{var, plural, ...}` with balanced braces.
  // Real check would use intl-messageformat. Good enough for CI without deps.
  const pluralMatches = value.match(/\{[^}]+,\s*plural\s*,/g) ?? [];
  for (const m of pluralMatches) {
    if (!value.includes('other {')) {
      return `plural form missing required 'other' branch: ${m}`;
    }
  }
  // Brace balance check.
  let depth = 0;
  for (const ch of value) {
    if (ch === '{') depth++;
    if (ch === '}') depth--;
    if (depth < 0) return 'unbalanced braces';
  }
  if (depth !== 0) return 'unbalanced braces';
  return null;
}

function variablesIn(value) {
  const set = new Set();
  for (const m of value.matchAll(/\{(\w+)/g)) {
    set.add(m[1]);
  }
  return set;
}

const primary = load(PRIMARY);
const fallback = load(FALLBACK);
const errors = [];
const warnings = [];

const allKeys = new Set([...Object.keys(primary), ...Object.keys(fallback)]);

for (const key of allKeys) {
  const inP = key in primary;
  const inF = key in fallback;
  if (!inP) {
    errors.push(`MISSING in ${PRIMARY}: ${key}`);
    continue;
  }
  if (!inF) {
    errors.push(`MISSING in ${FALLBACK}: ${key}`);
    continue;
  }
  const pVal = primary[key];
  const fVal = fallback[key];

  if (typeof pVal !== 'string' || typeof fVal !== 'string') {
    errors.push(`NON-STRING value: ${key}`);
    continue;
  }
  if (pVal.trim() === '') errors.push(`EMPTY in ${PRIMARY}: ${key}`);
  if (fVal.trim() === '') errors.push(`EMPTY in ${FALLBACK}: ${key}`);

  const icuP = checkICU(pVal);
  if (icuP) errors.push(`ICU ${PRIMARY} ${key}: ${icuP}`);
  const icuF = checkICU(fVal);
  if (icuF) errors.push(`ICU ${FALLBACK} ${key}: ${icuF}`);

  const vP = variablesIn(pVal);
  const vF = variablesIn(fVal);
  for (const v of vP) {
    if (!vF.has(v)) warnings.push(`VAR ${key}: '{${v}}' in ${PRIMARY} missing in ${FALLBACK}`);
  }
  for (const v of vF) {
    if (!vP.has(v)) warnings.push(`VAR ${key}: '{${v}}' in ${FALLBACK} missing in ${PRIMARY}`);
  }
}

if (warnings.length) {
  console.warn(`\n[i18n-lint] ${warnings.length} warnings:`);
  for (const w of warnings) console.warn('  ⚠ ' + w);
}

if (errors.length) {
  console.error(`\n[i18n-lint] ${errors.length} errors:`);
  for (const e of errors) console.error('  ✗ ' + e);
  process.exit(1);
}

console.log(`\n[i18n-lint] OK — ${Object.keys(primary).length} keys, locales in parity.`);
