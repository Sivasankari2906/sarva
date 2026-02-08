# 🏗️ SARVA - COMPLETE ARCHITECTURE DOCUMENTATION

## 📊 SYSTEM ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER LAYER                               │
│  React SPA (Dashboard, Profile, Documents, Medicines, Schemes)  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ useAuth Hook │  │useEligibility│  │ Components   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                     BUSINESS LOGIC LAYER                         │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Eligibility Engine (eligibilityEngine.js)             │    │
│  │  • calculateEligibility()                              │    │
│  │  • generateDependencyMap()                             │    │
│  │  • calculateImpactScore()                              │    │
│  └────────────────────────────────────────────────────────┘    │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATA ACCESS LAYER                           │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Firestore Service (firestoreService.js)               │    │
│  │  • User CRUD                                           │    │
│  │  • Document CRUD                                       │    │
│  │  • Medicine CRUD                                       │    │
│  │  • Scheme Queries                                      │    │
│  └────────────────────────────────────────────────────────┘    │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FIREBASE BACKEND                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Firebase Auth│  │  Firestore   │  │   Hosting    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🗄️ FIRESTORE DATA MODEL (DETAILED)

### Collection: `users/{userId}`
```javascript
{
  email: "user@example.com",
  age: 25,
  income: 300000,
  occupation: "Student",
  state: "Karnataka",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Collection: `documents/{docId}`
```javascript
{
  userId: "user123",
  type: "Aadhaar",
  name: "XXXX-XXXX-1234",
  issueDate: "2020-01-15",
  expiryDate: "2030-01-15", // null for non-expiring docs
  status: "valid",
  metadata: {},
  createdAt: Timestamp
}
```

### Collection: `medicines/{medId}`
```javascript
{
  userId: "user123",
  name: "Metformin",
  expiryDate: "2024-12-31",
  refillDate: "2024-06-15",
  continuityRequired: true, // for chronic conditions
  status: "active",
  createdAt: Timestamp
}
```

### Collection: `schemes/{schemeId}`
```javascript
{
  name: "PM-KISAN",
  description: "Income support to farmer families",
  state: "ALL", // or specific state
  category: "Agriculture",
  eligibilityCriteria: {
    minAge: 18,
    maxAge: null,
    maxIncome: 200000,
    occupations: ["Farmer"],
    states: ["ALL"],
    requiredDocs: ["Aadhaar", "Ration Card"]
  }
}
```

### Collection: `eligibility_cache/{userId}`
```javascript
{
  eligible: ["scheme1", "scheme2"],
  ineligible: ["scheme3"],
  lastCalculated: Timestamp
}
```

### Collection: `dependency_map/{userId}`
```javascript
{
  items: [
    {
      itemId: "doc123",
      itemName: "Aadhaar Card",
      type: "document",
      expiryDate: "2025-03-15",
      daysUntilExpiry: 45,
      affectedSchemes: [
        { id: "scheme1", name: "PM-KISAN" },
        { id: "scheme2", name: "Ayushman Bharat" }
      ]
    }
  ],
  updatedAt: Timestamp
}
```

---

## 🧮 ELIGIBILITY ENGINE LOGIC

### Algorithm Flow:
```
1. User Profile + Documents + Medicines → Input
2. Fetch all schemes for user's state
3. For each scheme:
   a. Check age criteria
   b. Check income criteria
   c. Check occupation criteria
   d. Check required documents (valid & not expired)
   e. Mark as eligible/ineligible
4. Generate dependency map:
   a. Find all items expiring in next 90 days
   b. For each expiring item, find affected schemes
   c. Calculate impact score (urgency + affected schemes count)
5. Cache results in Firestore
```

### Key Functions:

**calculateEligibility(profile, documents, medicines, schemes)**
- Returns: `{ eligible: [schemeIds], ineligible: [schemeIds] }`

**generateDependencyMap(profile, documents, medicines, schemes, eligibleSchemes)**
- Returns: Array of expiring items with affected schemes
- Sorted by urgency (days until expiry)

**calculateImpactScore(expiringItem)**
- Formula: `urgency + (affectedSchemes.length * 20)`
- Used for prioritization in UI

---

## 🎨 REACT COMPONENT STRUCTURE

```
src/
├── App.js                    # Main router
├── index.js                  # Entry point
├── index.css                 # Global styles
├── components/
│   └── Header.js             # Navigation header
├── pages/
│   ├── Login.js              # Auth page
│   ├── Dashboard.js          # Main dashboard with alerts
│   ├── Profile.js            # User profile management
│   ├── Documents.js          # Document CRUD
│   ├── Medicines.js          # Medicine CRUD
│   └── Schemes.js            # Scheme eligibility view
├── hooks/
│   ├── useAuth.js            # Firebase auth state
│   └── useEligibility.js     # Eligibility data management
├── services/
│   ├── firebase.js           # Firebase config
│   ├── firestoreService.js   # Firestore operations
│   └── eligibilityEngine.js  # Core business logic
└── utils/                    # (Future: date helpers, formatters)
```

---

## 🔐 FIRESTORE SECURITY RULES

Key principles:
1. Users can only access their own data
2. Schemes are read-only for all authenticated users
3. No unauthenticated access
4. User-specific collections use userId as document ID

---

## 🚀 SETUP INSTRUCTIONS

### 1. Install Dependencies
```bash
cd Sarva
npm install
```

### 2. Firebase Setup
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase project
firebase init
# Select: Firestore, Hosting
# Use existing project or create new
```

### 3. Configure Environment
```bash
# Copy .env.example to .env
cp .env.example .env

# Add your Firebase config from Firebase Console
# Project Settings > General > Your apps > Web app
```

### 4. Seed Sample Schemes
```
1. Go to Firebase Console > Firestore Database
2. Create collection 'schemes'
3. Add documents from seed-schemes.js
```

### 5. Deploy Firestore Rules
```bash
firebase deploy --only firestore:rules
```

### 6. Run Development Server
```bash
npm start
# Opens at http://localhost:3000
```

### 7. Build & Deploy
```bash
npm run build
firebase deploy --only hosting
```

---

## 📈 SCALABILITY CONSIDERATIONS

### 1. State/City Expansion
- Add new schemes with state-specific criteria
- Use `state: "ALL"` for national schemes
- Query optimization: `where('state', 'in', [userState, 'ALL'])`

### 2. Offline Support
- Already enabled via `enableIndexedDbPersistence()`
- Firestore caches data locally
- Works offline, syncs when online

### 3. Performance Optimization
- Eligibility calculation happens client-side (no backend calls)
- Cache results in `eligibility_cache` collection
- Recalculate only when profile/documents change

### 4. Future Enhancements
- Cloud Functions for scheduled eligibility checks
- Push notifications for expiry alerts
- Batch processing for multiple users
- Analytics dashboard for scheme utilization

---

## 💡 TECHNICAL NOVELTY POINTS

### 1. **Cross-Domain Dependency Mapping**
Unlike traditional reminder apps, Sarva links document expiry to scheme eligibility loss in real-time. When a document expires, users immediately see which government benefits they'll lose.

### 2. **Predictive Entitlement Loss**
The "What You'll Lose Next" feature provides a 90-day forward-looking view of cascading eligibility changes, helping users prioritize renewals based on impact.

### 3. **Continuity-Aware Medicine Tracking**
Tracks not just expiry but refill continuity for chronic conditions, which affects eligibility for health-related schemes.

### 4. **Rule-Based Eligibility Engine**
Client-side calculation eliminates backend overhead while maintaining accuracy. No ML required—pure logic-based matching.

### 5. **Temporal Impact Analysis**
Calculates impact scores combining urgency (days until expiry) and breadth (number of affected schemes), enabling smart prioritization.

---

## 🎯 DEMO FLOW

1. **Sign Up** → Create account
2. **Complete Profile** → Age, income, occupation, state
3. **Add Documents** → Aadhaar, Ration Card, etc.
4. **View Dashboard** → See eligible schemes
5. **Check Alerts** → "What You'll Lose Next" section
6. **Add Medicines** → Track expiry & refills
7. **Explore Schemes** → See all available schemes

---

## 🐛 TROUBLESHOOTING

**Issue: Firebase not connecting**
- Check .env file has correct credentials
- Verify Firebase project is active

**Issue: Schemes not showing**
- Ensure schemes collection is seeded
- Check Firestore rules are deployed

**Issue: Offline not working**
- Clear browser cache
- Check IndexedDB is enabled

---

## 📝 NEXT STEPS

1. Run `npm install` to install dependencies
2. Set up Firebase project and add credentials to .env
3. Seed sample schemes in Firestore
4. Run `npm start` to test locally
5. Deploy to Firebase Hosting for production

---

**Built with ❤️ for hackathons, internships, and MVPs**
