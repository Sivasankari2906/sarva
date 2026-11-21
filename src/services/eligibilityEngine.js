import { isAfter, isBefore, addDays } from 'date-fns';

// Core eligibility calculation engine
export const calculateEligibility = (userProfile, documents, medicines, schemes) => {
  const eligible = [];
  const ineligible = [];
  
  schemes.forEach(scheme => {
    if (isEligibleForScheme(userProfile, documents, scheme)) {
      eligible.push(scheme.id);
    } else {
      ineligible.push(scheme.id);
    }
  });
  
  return { eligible, ineligible, lastCalculated: new Date() };
};

// Check if user meets scheme criteria
const isEligibleForScheme = (profile, documents, scheme) => {
  // A scheme without criteria should not break eligibility for every other scheme.
  const criteria = scheme.eligibilityCriteria || {};
  
  // Age check
  if (criteria.minAge && profile.age < criteria.minAge) return false;
  if (criteria.maxAge && profile.age > criteria.maxAge) return false;
  
  // Income check
  if (criteria.maxIncome && profile.income > criteria.maxIncome) return false;
  
  // State check ("ALL" means every state)
  if (criteria.states && criteria.states.length && !criteria.states.includes('ALL') && !criteria.states.includes(profile.state)) return false;

  // Gender check ("all" or missing means anyone)
  if (criteria.gender && criteria.gender !== 'all' && (profile.gender || '').toLowerCase() !== criteria.gender) return false;

  // Caste / community check. EWS is part of the General category.
  if (criteria.castes && criteria.castes.length) {
    const community = profile.community === 'EWS' ? ['EWS', 'General'] : [profile.community];
    if (!community.some((c) => criteria.castes.includes(c))) return false;
  }

  // Schemes that need a disability or a BPL card
  if (criteria.disability && !profile.hasDisability) return false;
  if (criteria.bpl && !profile.isBPL) return false;
  
  // Occupation check
  if (criteria.occupations && !criteria.occupations.includes(profile.occupation)) return false;
  
  // Required documents check
  if (criteria.requiredDocs) {
    const validDocs = documents.filter(doc => 
      doc.status === 'valid' && 
      (!doc.expiryDate || isAfter(new Date(doc.expiryDate), new Date()))
    );
    const validDocTypes = validDocs.map(d => d.type);
    
    for (const reqDoc of criteria.requiredDocs) {
      if (!validDocTypes.includes(reqDoc)) return false;
    }
  }
  
  return true;
};

// Generate dependency map: what expires → what schemes you lose
export const generateDependencyMap = (userProfile, documents, medicines, schemes, eligibleSchemeIds) => {
  const expiringItems = [];
  const today = new Date();
  const warningWindow = addDays(today, 90); // 90-day warning
  
  // Check expiring documents
  documents.forEach(doc => {
    if (doc.expiryDate) {
      const expiry = new Date(doc.expiryDate);
      if (isAfter(expiry, today) && isBefore(expiry, warningWindow)) {
        const affectedSchemes = findAffectedSchemes(doc, schemes, eligibleSchemeIds);
        if (affectedSchemes.length > 0) {
          expiringItems.push({
            itemId: doc.id,
            itemName: doc.name,
            type: 'document',
            expiryDate: doc.expiryDate,
            daysUntilExpiry: Math.ceil((expiry - today) / (1000 * 60 * 60 * 24)),
            affectedSchemes
          });
        }
      }
    }
  });
  
  // Check expiring medicines
  medicines.forEach(med => {
    if (med.expiryDate) {
      const expiry = new Date(med.expiryDate);
      if (isAfter(expiry, today) && isBefore(expiry, warningWindow)) {
        expiringItems.push({
          itemId: med.id,
          itemName: med.name,
          type: 'medicine',
          expiryDate: med.expiryDate,
          daysUntilExpiry: Math.ceil((expiry - today) / (1000 * 60 * 60 * 24)),
          affectedSchemes: [] // Can be extended for medicine-dependent schemes
        });
      }
    }
  });
  
  return expiringItems.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
};

// Find which schemes will be lost if this document expires
const findAffectedSchemes = (document, schemes, eligibleSchemeIds) => {
  return schemes
    .filter(scheme => 
      eligibleSchemeIds.includes(scheme.id) &&
      scheme.eligibilityCriteria?.requiredDocs?.includes(document.type)
    )
    .map(scheme => ({ id: scheme.id, name: scheme.name }));
};

// Calculate impact score for prioritization
export const calculateImpactScore = (expiringItem) => {
  const urgency = Math.max(0, 100 - expiringItem.daysUntilExpiry);
  const impact = expiringItem.affectedSchemes.length * 20;
  return urgency + impact;
};
