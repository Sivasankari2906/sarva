import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { mapRow, parseList, canonicalState, groupByState, safeGovUrl } from './schemes-mapping.mjs';

const row = (o) => ({ slug: 'x', name: 'X', description: 'd', state: 'Central', eligibility_state: '["All"]', ...o });

test('lists in different formats are parsed', () => {
  assert.deepEqual(parseList('["SC","ST"]'), ['SC', 'ST']);
  assert.deepEqual(parseList("['SC', 'OBC']"), ['SC', 'OBC']);
  assert.deepEqual(parseList('SC, ST'), ['SC', 'ST']);
  assert.deepEqual(parseList(''), []);
  assert.deepEqual(parseList('null'), []);
});

test('state names are matched loosely', () => {
  assert.equal(canonicalState('Tamilnadu'), 'Tamil Nadu');
  assert.equal(canonicalState('tamil nadu'), 'Tamil Nadu');
  assert.equal(canonicalState('All'), 'ALL');
  assert.equal(canonicalState('Orissa'), 'Odisha');
  assert.equal(canonicalState('Atlantis'), null);
});

test('a central scheme with criteria maps to the engine format', () => {
  const s = mapRow(row({ slug: 'pm-kisan', name: 'PM-KISAN', eligibility_age_min: '18', eligibility_age_max: '', eligibility_income_max: '200000', eligibility_gender: 'all', eligibility_caste: '[]', eligibility_residence: 'rural', eligibility_bpl: 'False', official_url: 'https://www.myscheme.gov.in/schemes/pm-kisan' }));
  assert.equal(s.id, 'pm-kisan');
  assert.deepEqual(s.eligibilityCriteria, { minAge: 18, maxIncome: 200000, residence: 'rural', states: ['ALL'] });
  assert.equal(s.officialUrl, 'https://www.myscheme.gov.in/schemes/pm-kisan');
});

test('state schemes, gender, caste, disability and BPL are kept', () => {
  const s = mapRow(row({ slug: 'tn-girl', name: 'TN Girl Scheme', state: 'Tamil Nadu', eligibility_state: "['Tamil Nadu']", eligibility_gender: 'female', eligibility_caste: '["SC","ST"]', eligibility_disability: 'true', eligibility_bpl: '1' }));
  assert.deepEqual(s.eligibilityCriteria, { gender: 'female', castes: ['SC', 'ST'], disability: true, bpl: true, states: ['Tamil Nadu'] });
});

test('a caste list naming every category is treated as no restriction', () => {
  const s = mapRow(row({ eligibility_caste: '["SC","ST","OBC","General"]' }));
  assert.equal(s.eligibilityCriteria.castes, undefined);
});

test('rows without a name are skipped and bad URLs are dropped', () => {
  assert.equal(mapRow(row({ name: '', slug: '' })), null);
  assert.equal(mapRow(row({ official_url: 'javascript:alert(1)' })).officialUrl, '');
});

test('schemes are grouped by state without duplicates', () => {
  const a = mapRow(row({ slug: 'a', name: 'A' }));
  const b = mapRow(row({ slug: 'b', name: 'B', eligibility_state: '["Kerala","Karnataka"]' }));
  const { allIndia, byState } = groupByState([a, a, b]);
  assert.equal(allIndia.length, 1);
  assert.deepEqual(Object.keys(byState).sort(), ['Karnataka', 'Kerala']);
});

test('the build script writes a manifest, all-India and per-state files', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'schemes-'));
  const csv = path.join(dir, 'Schemes.csv');
  fs.writeFileSync(csv, [
    'slug,name,description,state,eligibility_state,eligibility_gender,eligibility_caste,eligibility_age_min,eligibility_income_max,official_url',
    'pm-kisan,PM-KISAN,"Income support, paid in 3 instalments",Central,"[""All""]",all,[],18,200000,https://www.myscheme.gov.in/schemes/pm-kisan',
    'tn-x,TN Scheme,"Multi-line\ndescription",Tamil Nadu,"[""Tamil Nadu""]",female,"[""SC""]",,,',
  ].join('\n'));
  const out = path.join(dir, 'out');
  execFileSync('node', [path.join(path.dirname(new URL(import.meta.url).pathname), 'build-schemes.mjs'), csv, out]);
  const manifest = JSON.parse(fs.readFileSync(path.join(out, 'manifest.json')));
  assert.equal(manifest.rows, 2);
  assert.equal(manifest.states['Tamil Nadu'], 'tamil-nadu');
  assert.equal(JSON.parse(fs.readFileSync(path.join(out, 'all-india.json')))[0].name, 'PM-KISAN');
  assert.equal(JSON.parse(fs.readFileSync(path.join(out, 'states', 'tamil-nadu.json')))[0].eligibilityCriteria.gender, 'female');
});

test('only official government links are kept', () => {
  assert.equal(safeGovUrl('https://www.myscheme.gov.in/schemes/pm-kisan'), 'https://www.myscheme.gov.in/schemes/pm-kisan');
  assert.equal(safeGovUrl('https://pmkisan.gov.in/'), 'https://pmkisan.gov.in/');
  assert.equal(safeGovUrl('https://tn.nic.in/scheme'), 'https://tn.nic.in/scheme');
  assert.equal(safeGovUrl('https://www.myscheme.gov.in@evil.example/'), '', 'user-info trick');
  assert.equal(safeGovUrl('https://evil.example/myscheme.gov.in'), '');
  assert.equal(safeGovUrl('https://fakegov.in/'), '');
  assert.equal(safeGovUrl('javascript:alert(1)'), '');
});

test('the build script refuses to wipe an unrelated folder', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'schemes-guard-'));
  fs.writeFileSync(path.join(dir, 'important.txt'), 'keep me');
  const csv = path.join(os.tmpdir(), 'one-row.csv');
  fs.writeFileSync(csv, 'slug,name\na,A\n');
  let failed = false;
  try { execFileSync('node', [path.join(path.dirname(new URL(import.meta.url).pathname), 'build-schemes.mjs'), csv, dir], { stdio: 'pipe' }); } catch { failed = true; }
  assert.ok(failed);
  assert.ok(fs.existsSync(path.join(dir, 'important.txt')));
});
