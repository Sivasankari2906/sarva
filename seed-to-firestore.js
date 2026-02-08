// Run this script to seed schemes to Firestore
// Usage: node seed-to-firestore.js

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc } = require('firebase/firestore');

// Replace with your Firebase config
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

const schemes = [
  {
    id: 'pm-kisan',
    name: 'PM-KISAN',
    description: 'Income support of ₹6,000 per year to farmer families',
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
    name: 'Ayushman Bharat (PM-JAY)',
    description: 'Health insurance coverage of ₹5 lakh per family per year',
    state: 'ALL',
    category: 'Health',
    eligibilityCriteria: {
      maxIncome: 500000,
      requiredDocs: ['Aadhaar', 'Ration Card']
    }
  },
  {
    id: 'pension-senior',
    name: 'Senior Citizen Pension',
    description: 'Monthly pension of ₹1,000 for senior citizens',
    state: 'ALL',
    category: 'Social Welfare',
    eligibilityCriteria: {
      minAge: 60,
      maxIncome: 300000,
      requiredDocs: ['Aadhaar', 'Income Certificate']
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
    id: 'ujjwala-yojana',
    name: 'Ujjwala Yojana',
    description: 'Free LPG connection to women from BPL households',
    state: 'ALL',
    category: 'Social Welfare',
    eligibilityCriteria: {
      maxIncome: 100000,
      requiredDocs: ['Aadhaar', 'Ration Card']
    }
  },
  {
    id: 'karnataka-anna-bhagya',
    name: 'Karnataka Anna Bhagya',
    description: 'Free rice for BPL families in Karnataka',
    state: 'Karnataka',
    category: 'Food Security',
    eligibilityCriteria: {
      states: ['Karnataka'],
      maxIncome: 150000,
      requiredDocs: ['Aadhaar', 'Ration Card']
    }
  }
];

async function seedSchemes() {
  try {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    console.log('Seeding schemes to Firestore...');

    for (const scheme of schemes) {
      await setDoc(doc(db, 'schemes', scheme.id), scheme);
      console.log(`✓ Added: ${scheme.name}`);
    }

    console.log('\n✅ All schemes seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding schemes:', error);
    process.exit(1);
  }
}

seedSchemes();
