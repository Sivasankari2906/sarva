// Mock data for testing without Firebase
import { addDays, subDays, format } from 'date-fns';

export const mockSchemes = [
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

export const generateMockProfile = () => ({
  age: 45,
  income: 150000,
  occupation: 'Farmer',
  state: 'Karnataka',
  createdAt: new Date()
});

export const generateMockDocuments = () => [
  {
    id: 'doc1',
    type: 'Aadhaar',
    name: 'XXXX-XXXX-1234',
    issueDate: format(subDays(new Date(), 1825), 'yyyy-MM-dd'),
    expiryDate: format(addDays(new Date(), 365), 'yyyy-MM-dd'),
    status: 'valid'
  },
  {
    id: 'doc2',
    type: 'Ration Card',
    name: 'KA-BLR-123456',
    issueDate: format(subDays(new Date(), 730), 'yyyy-MM-dd'),
    expiryDate: format(addDays(new Date(), 45), 'yyyy-MM-dd'),
    status: 'valid'
  },
  {
    id: 'doc3',
    type: 'Income Certificate',
    name: 'IC-2024-789',
    issueDate: format(subDays(new Date(), 180), 'yyyy-MM-dd'),
    expiryDate: format(addDays(new Date(), 185), 'yyyy-MM-dd'),
    status: 'valid'
  },
  {
    id: 'doc4',
    type: 'PAN',
    name: 'ABCDE1234F',
    issueDate: format(subDays(new Date(), 3650), 'yyyy-MM-dd'),
    expiryDate: null,
    status: 'valid'
  }
];

export const generateMockMedicines = () => [
  {
    id: 'med1',
    name: 'Metformin 500mg',
    expiryDate: format(addDays(new Date(), 120), 'yyyy-MM-dd'),
    refillDate: format(addDays(new Date(), 15), 'yyyy-MM-dd'),
    continuityRequired: true,
    status: 'active'
  },
  {
    id: 'med2',
    name: 'Paracetamol 650mg',
    expiryDate: format(addDays(new Date(), 240), 'yyyy-MM-dd'),
    refillDate: null,
    continuityRequired: false,
    status: 'active'
  }
];

export const seedMockData = async (userId, firestoreService) => {
  try {
    // Seed profile
    const profile = generateMockProfile();
    await firestoreService.saveUserProfile(userId, profile);

    // Seed documents
    const documents = generateMockDocuments();
    for (const doc of documents) {
      await firestoreService.addDocument(userId, doc);
    }

    // Seed medicines
    const medicines = generateMockMedicines();
    for (const med of medicines) {
      await firestoreService.addMedicine(userId, med);
    }

    return { success: true, message: 'Mock data seeded successfully!' };
  } catch (error) {
    console.error('Error seeding mock data:', error);
    return { success: false, message: error.message };
  }
};
