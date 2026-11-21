// Maps rows of the "Indian Government Schemes Dataset" (SmartDuke Technologies, CC BY 4.0,
// sourced from myscheme.gov.in) to the scheme shape the Sarva eligibility engine uses.

const STATE_NAMES = [
  'Andaman and Nicobar Islands', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chandigarh',
  'Chhattisgarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jammu and Kashmir', 'Jharkhand', 'Karnataka', 'Kerala', 'Ladakh', 'Lakshadweep',
  'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Puducherry',
  'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
];
const CASTES = ['SC', 'ST', 'OBC', 'General', 'EWS'];

export const slugify = (s) => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** Parses '["SC","ST"]', "['SC', 'ST']", 'SC, ST' or '' into a clean array. */
export function parseList(value) {
  if (value == null) return [];
  const text = String(value).trim();
  if (!text || ['null', 'none', 'nan', '[]'].includes(text.toLowerCase())) return [];
  try {
    const parsed = JSON.parse(text.replace(/'/g, '"'));
    if (Array.isArray(parsed)) return parsed.map((x) => String(x).trim()).filter(Boolean);
  } catch { /* not JSON */ }
  return text.replace(/^\[|\]$/g, '').split(/[,;|]/).map((x) => x.replace(/["']/g, '').trim()).filter(Boolean);
}

export function parseIntOrNull(value) {
  if (value == null) return null;
  const n = Number(String(value).replace(/[,₹\s]/g, ''));
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
}

export const parseBool = (value) => ['true', '1', 'yes', 'y'].includes(String(value ?? '').trim().toLowerCase());

/** Matches a state name loosely ("Tamilnadu", "tamil nadu", "TN state") to its official name. */
export function canonicalState(name) {
  const key = String(name || '').toLowerCase().replace(/[^a-z]/g, '');
  if (!key) return null;
  if (['all', 'allindia', 'india', 'central', 'centre', 'national'].includes(key)) return 'ALL';
  if (key === 'nctofdelhi' || key === 'newdelhi') return 'Delhi';
  if (key === 'pondicherry') return 'Puducherry';
  if (key === 'orissa') return 'Odisha';
  return STATE_NAMES.find((s) => s.toLowerCase().replace(/[^a-z]/g, '') === key) || null;
}

const shorten = (text, max) => {
  const t = String(text || '').replace(/\s+/g, ' ').trim();
  return t.length <= max ? t : t.slice(0, max - 1).replace(/\s+\S*$/, '') + '…';
};

/** Returns a scheme object, or null for rows without a name or slug. */
export function mapRow(row) {
  const name = String(row.name || '').trim();
  const id = slugify(String(row.slug || name));
  if (!name || !id) return null;

  const listedStates = parseList(row.eligibility_state).map(canonicalState).filter(Boolean);
  const ownerState = canonicalState(row.state);
  let states = [...new Set(listedStates)];
  if (!states.length) states = [ownerState && ownerState !== 'ALL' ? ownerState : 'ALL'];
  if (states.includes('ALL')) states = ['ALL'];

  const gender = String(row.eligibility_gender || '').trim().toLowerCase();
  const castes = parseList(row.eligibility_caste)
    .map((c) => CASTES.find((k) => k.toLowerCase() === c.toLowerCase()))
    .filter(Boolean);
  let minAge = parseIntOrNull(row.eligibility_age_min);
  let maxAge = parseIntOrNull(row.eligibility_age_max);
  if (minAge && maxAge && minAge > maxAge) [minAge, maxAge] = [maxAge, minAge];

  const criteria = {};
  if (minAge) criteria.minAge = minAge;
  if (maxAge && maxAge < 120) criteria.maxAge = maxAge;
  const maxIncome = parseIntOrNull(row.eligibility_income_max);
  if (maxIncome) criteria.maxIncome = maxIncome;
  if (['male', 'female'].includes(gender)) criteria.gender = gender;
  // A list with every category is no restriction at all.
  if (castes.length && !['SC', 'ST', 'OBC', 'General'].every((c) => castes.includes(c))) criteria.castes = [...new Set(castes)];
  const residence = String(row.eligibility_residence || '').trim().toLowerCase();
  if (['rural', 'urban'].includes(residence)) criteria.residence = residence;
  if (parseBool(row.eligibility_disability)) criteria.disability = true;
  if (parseBool(row.eligibility_bpl)) criteria.bpl = true;
  criteria.states = states;

  const official = String(row.official_url || '').trim();
  const apply = String(row.apply_url || '').trim();
  return {
    id,
    name,
    description: shorten(row.description || row.benefits, 280),
    category: shorten(row.category, 80),
    ministry: shorten(row.ministry, 120),
    state: states.length === 1 ? states[0] : states.join(', '),
    officialUrl: /^https?:\/\//.test(official) ? official : '',
    applyUrl: /^https?:\/\//.test(apply) ? apply : '',
    eligibilityCriteria: criteria,
  };
}

/** Groups mapped schemes into the all-India list and one list per state. */
export function groupByState(schemes) {
  const allIndia = [];
  const byState = {};
  const seen = new Set();
  for (const s of schemes) {
    if (!s || seen.has(s.id)) continue;
    seen.add(s.id);
    const states = s.eligibilityCriteria.states;
    if (states.includes('ALL')) allIndia.push(s);
    else for (const st of states) (byState[st] ||= []).push(s);
  }
  return { allIndia, byState };
}
