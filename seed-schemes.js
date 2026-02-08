// Run this in Firebase Console to seed sample schemes
// Go to Firestore Database > Start Collection > schemes

const sampleSchemes = [
  {
    id: 'pm-kisan',
    name: 'PM-KISAN',
    description: 'Income support to farmer families',
    state: 'ALL',
    category: 'Agriculture',
    eligibilityCriteria: {
      occupations: ['Farmer'],
      maxIncome: 200000,
      requiredDocs: ['Aadhaar', 'Ration Card']
    }
  },
  {
    id: 'ayushman-bharat',
    name: 'Ayushman Bharat',
    description: 'Health insurance for economically vulnerable families',
    state: 'ALL',
    category: 'Health',
    eligibilityCriteria: {
      maxIncome: 500000,
      requiredDocs: ['Aadhaar', 'Ration Card']
    }
  },
  {
    id: 'scholarship-sc-st',
    name: 'SC/ST Scholarship',
    description: 'Educational scholarship for SC/ST students',
    state: 'ALL',
    category: 'Education',
    eligibilityCriteria: {
      minAge: 16,
      maxAge: 30,
      occupations: ['Student'],
      requiredDocs: ['Aadhaar', 'Caste Certificate', 'Income Certificate']
    }
  },
  {
    id: 'pension-senior',
    name: 'Senior Citizen Pension',
    description: 'Monthly pension for senior citizens',
    state: 'ALL',
    category: 'Social Welfare',
    eligibilityCriteria: {
      minAge: 60,
      maxIncome: 300000,
      requiredDocs: ['Aadhaar', 'Income Certificate']
    }
  },
  {
    id: 'karnataka-ration',
    name: 'Karnataka Ration Card Scheme',
    description: 'Subsidized food grains',
    state: 'Karnataka',
    category: 'Food Security',
    eligibilityCriteria: {
      states: ['Karnataka'],
      maxIncome: 400000,
      requiredDocs: ['Aadhaar', 'Ration Card']
    }
  },
  {
    id: 'maharashtra-farmer',
    name: 'Maharashtra Farmer Support',
    description: 'Financial assistance to farmers',
    state: 'Maharashtra',
    category: 'Agriculture',
    eligibilityCriteria: {
      states: ['Maharashtra'],
      occupations: ['Farmer'],
      requiredDocs: ['Aadhaar', 'Ration Card']
    }
  }
];

// Instructions:
// 1. Go to Firebase Console > Firestore Database
// 2. Create collection 'schemes'
// 3. Add each scheme as a document with the ID specified
// 4. Copy the data from sampleSchemes array above

console.log('Copy these schemes to Firestore:');
console.log(JSON.stringify(sampleSchemes, null, 2));
