# 📐 SARVA - VISUAL DIAGRAMS

## 🏗️ SYSTEM ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────────┐
│                           USER INTERFACE                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │Dashboard │  │ Profile  │  │Documents │  │ Schemes  │           │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘           │
└───────┼─────────────┼─────────────┼─────────────┼──────────────────┘
        │             │             │             │
        └─────────────┴─────────────┴─────────────┘
                      │
        ┌─────────────▼─────────────┐
        │   React Router (BrowserRouter)   │
        └─────────────┬─────────────┘
                      │
        ┌─────────────▼─────────────┐
        │   Custom Hooks Layer      │
        │  • useAuth()              │
        │  • useEligibility()       │
        └─────────────┬─────────────┘
                      │
        ┌─────────────▼─────────────┐
        │   Business Logic Layer    │
        │  • eligibilityEngine.js   │
        │  • firestoreService.js    │
        └─────────────┬─────────────┘
                      │
        ┌─────────────▼─────────────┐
        │   Firebase SDK            │
        │  • Auth                   │
        │  • Firestore              │
        └─────────────┬─────────────┘
                      │
        ┌─────────────▼─────────────┐
        │   Firebase Backend        │
        │  • Authentication         │
        │  • Firestore Database     │
        │  • Hosting (CDN)          │
        └───────────────────────────┘
```

---

## 🔄 DATA FLOW: Adding a Document

```
User clicks "Add Document"
         │
         ▼
┌────────────────────┐
│  Documents.js      │
│  handleSubmit()    │
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│ firestoreService   │
│ addDocument()      │
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│ Firestore Write    │
│ documents/{docId}  │
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│ useEligibility     │
│ detects change     │
└────────┬───────────┘
         │
         ▼
┌────────────────────────────────┐
│ eligibilityEngine              │
│ calculateEligibility()         │
│ • Check age, income, docs      │
│ • Match with scheme criteria   │
│ • Return eligible schemes      │
└────────┬───────────────────────┘
         │
         ▼
┌────────────────────────────────┐
│ eligibilityEngine              │
│ generateDependencyMap()        │
│ • Find expiring items          │
│ • Match with schemes           │
│ • Calculate impact scores      │
└────────┬───────────────────────┘
         │
         ▼
┌────────────────────┐
│ React State Update │
│ • eligibility      │
│ • dependencies     │
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│ UI Re-renders      │
│ • Dashboard alerts │
│ • Schemes list     │
│ • Timeline         │
└────────────────────┘
```

---

## 🗄️ FIRESTORE SCHEMA DIAGRAM

```
Firestore Database
│
├── users/
│   └── {userId}
│       ├── email: string
│       ├── age: number
│       ├── income: number
│       ├── occupation: string
│       ├── state: string
│       └── createdAt: timestamp
│
├── documents/
│   └── {docId}
│       ├── userId: string ──────┐
│       ├── type: string         │ (Foreign Key)
│       ├── name: string         │
│       ├── issueDate: string    │
│       ├── expiryDate: string   │
│       └── status: string       │
│                                │
├── medicines/                   │
│   └── {medId}                  │
│       ├── userId: string ──────┤
│       ├── name: string         │
│       ├── expiryDate: string   │
│       ├── refillDate: string   │
│       └── continuityRequired   │
│                                │
├── schemes/                     │
│   └── {schemeId}               │
│       ├── name: string         │
│       ├── state: string        │
│       ├── category: string     │
│       └── eligibilityCriteria  │
│           ├── minAge           │
│           ├── maxIncome        │
│           ├── occupations[]    │
│           └── requiredDocs[]   │
│                                │
├── eligibility_cache/           │
│   └── {userId} ────────────────┤
│       ├── eligible: array      │
│       ├── ineligible: array    │
│       └── lastCalculated       │
│                                │
└── dependency_map/              │
    └── {userId} ────────────────┘
        ├── items: array
        │   ├── itemId
        │   ├── itemName
        │   ├── type
        │   ├── expiryDate
        │   ├── daysUntilExpiry
        │   └── affectedSchemes[]
        └── updatedAt
```

---

## 🧮 ELIGIBILITY CALCULATION FLOW

```
START: User Profile + Documents + Schemes
│
├─► For each scheme in schemes:
│   │
│   ├─► Check Age Criteria
│   │   ├─► minAge ≤ user.age ≤ maxAge?
│   │   └─► NO → Mark INELIGIBLE → NEXT SCHEME
│   │
│   ├─► Check Income Criteria
│   │   ├─► user.income ≤ maxIncome?
│   │   └─► NO → Mark INELIGIBLE → NEXT SCHEME
│   │
│   ├─► Check Occupation Criteria
│   │   ├─► user.occupation in allowedOccupations?
│   │   └─► NO → Mark INELIGIBLE → NEXT SCHEME
│   │
│   ├─► Check State Criteria
│   │   ├─► scheme.state == user.state OR "ALL"?
│   │   └─► NO → Mark INELIGIBLE → NEXT SCHEME
│   │
│   ├─► Check Required Documents
│   │   ├─► For each requiredDoc:
│   │   │   ├─► User has this doc type?
│   │   │   ├─► Doc is valid (not expired)?
│   │   │   └─► NO → Mark INELIGIBLE → NEXT SCHEME
│   │   │
│   │   └─► All required docs present & valid?
│   │       └─► YES → Mark ELIGIBLE
│   │
│   └─► NEXT SCHEME
│
└─► RETURN: { eligible: [...], ineligible: [...] }
```

---

## ⚠️ DEPENDENCY MAP GENERATION

```
START: Documents + Medicines + Eligible Schemes
│
├─► Define Warning Window (90 days from today)
│
├─► For each document:
│   │
│   ├─► Has expiry date?
│   │   └─► NO → SKIP
│   │
│   ├─► Expiry within warning window?
│   │   └─► NO → SKIP
│   │
│   ├─► Find Affected Schemes:
│   │   ├─► For each eligible scheme:
│   │   │   ├─► Scheme requires this doc type?
│   │   │   └─► YES → Add to affectedSchemes[]
│   │   │
│   │   └─► affectedSchemes.length > 0?
│   │       └─► YES → Add to expiringItems[]
│   │
│   └─► NEXT DOCUMENT
│
├─► For each medicine:
│   │
│   ├─► Has expiry date?
│   │   └─► NO → SKIP
│   │
│   ├─► Expiry within warning window?
│   │   └─► NO → SKIP
│   │
│   └─► Add to expiringItems[]
│
├─► Sort expiringItems by daysUntilExpiry (ascending)
│
└─► RETURN: expiringItems[]
```

---

## 🎯 IMPACT SCORE CALCULATION

```
Input: Expiring Item
│
├─► Calculate Urgency Score
│   │
│   └─► urgency = 100 - daysUntilExpiry
│       │
│       ├─► 30 days left → urgency = 70
│       ├─► 60 days left → urgency = 40
│       └─► 90 days left → urgency = 10
│
├─► Calculate Impact Score
│   │
│   └─► impact = affectedSchemes.length × 20
│       │
│       ├─► 1 scheme → impact = 20
│       ├─► 3 schemes → impact = 60
│       └─► 5 schemes → impact = 100
│
├─► Calculate Total Score
│   │
│   └─► totalScore = urgency + impact
│
└─► RETURN: totalScore

Example:
  Document: Aadhaar
  Days left: 30
  Affected schemes: 5
  
  urgency = 100 - 30 = 70
  impact = 5 × 20 = 100
  totalScore = 70 + 100 = 170 (HIGH PRIORITY!)
```

---

## 🔐 SECURITY MODEL

```
┌─────────────────────────────────────────┐
│         Firebase Authentication         │
│  • Email/Password                       │
│  • Returns: userId (UID)                │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│         Firestore Security Rules        │
│                                         │
│  Rule: Users can only access their own │
│        data where userId == auth.uid   │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ documents/{docId}                 │ │
│  │ allow read: if userId == auth.uid │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ schemes/{schemeId}                │ │
│  │ allow read: if authenticated      │ │
│  │ allow write: if false (admin only)│ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│         Data Isolation                  │
│                                         │
│  User A (uid: abc123)                  │
│  ├─ Can read: documents where          │
│  │   userId == "abc123"                │
│  └─ Cannot read: documents where       │
│      userId == "xyz789"                 │
│                                         │
│  User B (uid: xyz789)                  │
│  ├─ Can read: documents where          │
│  │   userId == "xyz789"                │
│  └─ Cannot read: documents where       │
│      userId == "abc123"                 │
└─────────────────────────────────────────┘
```

---

## 📱 UI COMPONENT HIERARCHY

```
App.js
│
├── BrowserRouter
│   │
│   ├── Header.js (if authenticated)
│   │   ├── Logo
│   │   ├── Navigation Links
│   │   └── Logout Button
│   │
│   └── Routes
│       │
│       ├── /login → Login.js
│       │   ├── Email Input
│       │   ├── Password Input
│       │   └── Sign Up Toggle
│       │
│       ├── / → Dashboard.js
│       │   ├── Critical Alerts Card
│       │   │   └── Expiring Items (< 30 days)
│       │   ├── Stats Grid
│       │   │   ├── Documents Count
│       │   │   ├── Medicines Count
│       │   │   ├── Eligible Schemes Count
│       │   │   └── Expiring Items Count
│       │   ├── Eligible Schemes Card
│       │   │   └── Scheme List
│       │   └── Expiry Timeline Card
│       │       └── Sorted Expiring Items
│       │
│       ├── /profile → Profile.js
│       │   └── Profile Form
│       │       ├── Age Input
│       │       ├── Income Input
│       │       ├── Occupation Select
│       │       └── State Select
│       │
│       ├── /documents → Documents.js
│       │   ├── Add Document Button
│       │   ├── Document Form (conditional)
│       │   │   ├── Type Select
│       │   │   ├── Name Input
│       │   │   ├── Issue Date
│       │   │   └── Expiry Date
│       │   └── Documents List
│       │       └── Document Item
│       │           ├── Type & Name
│       │           ├── Expiry Date
│       │           └── Delete Button
│       │
│       ├── /medicines → Medicines.js
│       │   ├── Add Medicine Button
│       │   ├── Medicine Form (conditional)
│       │   │   ├── Name Input
│       │   │   ├── Expiry Date
│       │   │   ├── Refill Date
│       │   │   └── Continuity Checkbox
│       │   └── Medicines List
│       │       └── Medicine Item
│       │           ├── Name & Badge
│       │           └── Dates
│       │
│       └── /schemes → Schemes.js
│           ├── Eligible Schemes Card
│           │   └── Scheme List (green)
│           └── Ineligible Schemes Card
│               └── Scheme List (gray)
```

---

## 🔄 REAL-TIME UPDATE FLOW

```
User adds document in Browser Tab 1
         │
         ▼
┌────────────────────┐
│ Firestore Write    │
└────────┬───────────┘
         │
         ├──────────────────────────┐
         │                          │
         ▼                          ▼
┌────────────────────┐    ┌────────────────────┐
│ Browser Tab 1      │    │ Browser Tab 2      │
│ (same user)        │    │ (same user)        │
└────────┬───────────┘    └────────┬───────────┘
         │                          │
         ▼                          ▼
┌────────────────────┐    ┌────────────────────┐
│ onSnapshot()       │    │ onSnapshot()       │
│ listener fires     │    │ listener fires     │
└────────┬───────────┘    └────────┬───────────┘
         │                          │
         ▼                          ▼
┌────────────────────┐    ┌────────────────────┐
│ useEligibility     │    │ useEligibility     │
│ recalculates       │    │ recalculates       │
└────────┬───────────┘    └────────┬───────────┘
         │                          │
         ▼                          ▼
┌────────────────────┐    ┌────────────────────┐
│ UI updates         │    │ UI updates         │
│ automatically      │    │ automatically      │
└────────────────────┘    └────────────────────┘

Result: Both tabs show updated data in real-time!
```

---

**Visual reference for architecture and data flow** 📊
