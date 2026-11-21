import { calculateEligibility, generateDependencyMap } from './eligibilityEngine';

const profile = { age: 35, income: 150000, state: 'Tamil Nadu', occupation: 'Farmer', gender: 'Female', community: 'SC' };
const scheme = (id, eligibilityCriteria) => ({ id, name: id, eligibilityCriteria });
const run = (schemes, p = profile, docs = []) => calculateEligibility(p, docs, [], schemes);

test('age, income and state limits', () => {
  const r = run([
    scheme('adult', { minAge: 18 }),
    scheme('youth', { maxAge: 30 }),
    scheme('low-income', { maxIncome: 100000 }),
    scheme('tn-only', { states: ['Tamil Nadu'] }),
    scheme('kerala-only', { states: ['Kerala'] }),
    scheme('all-india', { states: ['ALL'] }),
  ]);
  expect(r.eligible.sort()).toEqual(['adult', 'all-india', 'tn-only']);
  expect(r.ineligible.sort()).toEqual(['kerala-only', 'low-income', 'youth']);
});

test('gender and caste rules; EWS counts as General', () => {
  const r = run([scheme('women', { gender: 'female' }), scheme('men', { gender: 'male' }), scheme('sc-st', { castes: ['SC', 'ST'] }), scheme('obc', { castes: ['OBC'] })]);
  expect(r.eligible.sort()).toEqual(['sc-st', 'women']);
  const ews = run([scheme('general', { castes: ['General'] })], { ...profile, community: 'EWS' });
  expect(ews.eligible).toEqual(['general']);
});

test('disability and BPL schemes need the profile flags', () => {
  const schemes = [scheme('pwd', { disability: true }), scheme('bpl', { bpl: true })];
  expect(run(schemes).eligible).toEqual([]);
  expect(run(schemes, { ...profile, hasDisability: true, isBPL: true }).eligible.sort()).toEqual(['bpl', 'pwd']);
});

test('required documents must be valid and unexpired', () => {
  const s = [scheme('needs-aadhaar', { requiredDocs: ['Aadhaar'] })];
  expect(run(s, profile, []).eligible).toEqual([]);
  expect(run(s, profile, [{ type: 'Aadhaar', status: 'valid', expiryDate: '2000-01-01' }]).eligible).toEqual([]);
  expect(run(s, profile, [{ type: 'Aadhaar', status: 'valid' }]).eligible).toEqual(['needs-aadhaar']);
});

test('a scheme with no criteria does not break the others', () => {
  const r = run([{ id: 'broken', name: 'broken' }, scheme('adult', { minAge: 18 })]);
  expect(r.eligible.sort()).toEqual(['adult', 'broken']);
});

test('dependency map lists a document expiring soon and the schemes it affects', () => {
  const soon = new Date(Date.now() + 20 * 86400000).toISOString().slice(0, 10);
  const docs = [{ id: 'd1', type: 'Ration Card', status: 'valid', expiryDate: soon }];
  const schemes = [scheme('ration', { requiredDocs: ['Ration Card'] }), { id: 'no-criteria', name: 'x' }];
  const items = generateDependencyMap(profile, docs, [], schemes, ['ration']);
  expect(items.length).toBe(1);
  expect(items[0].affectedSchemes.map((s) => s.id)).toEqual(['ration']);
});
