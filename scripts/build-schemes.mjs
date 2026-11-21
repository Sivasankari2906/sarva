#!/usr/bin/env node
// Builds public/schemes/ from the dataset CSV:
//   node scripts/build-schemes.mjs path/to/Schemes.csv
// Download Schemes.csv from https://huggingface.co/datasets/Sumna/indian-government-schemes-2025
// (accept the dataset terms first). Data: SmartDuke Technologies, CC BY 4.0, from myscheme.gov.in.
import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'csv-parse/sync';
import { mapRow, groupByState, slugify } from './schemes-mapping.mjs';

const csvPath = process.argv[2];
if (!csvPath || !fs.existsSync(csvPath)) {
  console.error('Usage: node scripts/build-schemes.mjs path/to/Schemes.csv');
  process.exit(1);
}
const outDir = process.argv[3] || path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'public', 'schemes');

const rows = parse(fs.readFileSync(csvPath), { columns: true, skip_empty_lines: true, relax_quotes: true, relax_column_count: true, bom: true });
const mapped = rows.map(mapRow).filter(Boolean);
const { allIndia, byState } = groupByState(mapped);

// Only replace a folder that is empty or was written by this script before.
if (fs.existsSync(outDir) && fs.readdirSync(outDir).length && !fs.existsSync(path.join(outDir, 'manifest.json'))) {
  console.error(`Refusing to overwrite ${outDir}: it is not empty and has no manifest.json from a previous build.`);
  process.exit(1);
}
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(path.join(outDir, 'states'), { recursive: true });
fs.writeFileSync(path.join(outDir, 'all-india.json'), JSON.stringify(allIndia));
const states = {};
for (const [state, list] of Object.entries(byState).sort()) {
  const slug = slugify(state);
  states[state] = slug;
  fs.writeFileSync(path.join(outDir, 'states', `${slug}.json`), JSON.stringify(list));
}
fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify({
  source: 'Indian Government Schemes Dataset 2026, SmartDuke Technologies (schemefit.com), from myscheme.gov.in',
  license: 'CC BY 4.0',
  url: 'https://huggingface.co/datasets/Sumna/indian-government-schemes-2025',
  generatedAt: new Date().toISOString(),
  rows: rows.length,
  schemes: allIndia.length + Object.values(byState).reduce((n, l) => n + l.length, 0),
  allIndia: allIndia.length,
  states,
}, null, 2));
console.log(`Read ${rows.length} rows -> ${allIndia.length} all-India schemes, ${Object.keys(byState).length} states (${Object.values(byState).reduce((n, l) => n + l.length, 0)} state entries)`);
