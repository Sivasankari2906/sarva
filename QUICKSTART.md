# 🚀 SARVA - QUICK START GUIDE

## ✅ Step-by-Step Setup (15 minutes)

### 1️⃣ Install Dependencies
```bash
cd Sarva
npm install
```

### 2️⃣ Create Firebase Project
1. Go to https://console.firebase.google.com
2. Click "Add Project"
3. Name it "Sarva" (or any name)
4. Disable Google Analytics (optional)
5. Click "Create Project"

### 3️⃣ Enable Firebase Services

**Enable Authentication:**
1. In Firebase Console, go to "Authentication"
2. Click "Get Started"
3. Enable "Email/Password" sign-in method

**Enable Firestore:**
1. Go to "Firestore Database"
2. Click "Create Database"
3. Start in "Test Mode" (we'll add rules later)
4. Choose a location (closest to you)

### 4️⃣ Get Firebase Config
1. Go to Project Settings (gear icon)
2. Scroll to "Your apps" section
3. Click Web icon (</>)
4. Register app (name: "Sarva Web")
5. Copy the firebaseConfig object

### 5️⃣ Configure Environment
```bash
# Create .env file
cp .env.example .env
```

Edit `.env` and paste your Firebase config:
```
REACT_APP_FIREBASE_API_KEY=AIzaSy...
REACT_APP_FIREBASE_AUTH_DOMAIN=sarva-xxx.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=sarva-xxx
REACT_APP_FIREBASE_STORAGE_BUCKET=sarva-xxx.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abc123
```

### 6️⃣ Seed Sample Schemes
1. Go to Firebase Console > Firestore Database
2. Click "Start Collection"
3. Collection ID: `schemes`
4. Add these 3 sample schemes:

**Document 1:**
- Document ID: `pm-kisan`
- Fields:
  ```
  name: "PM-KISAN"
  description: "Income support to farmer families"
  state: "ALL"
  category: "Agriculture"
  eligibilityCriteria: (map)
    - occupations: (array) ["Farmer"]
    - maxIncome: (number) 200000
    - requiredDocs: (array) ["Aadhaar", "Ration Card"]
  ```

**Document 2:**
- Document ID: `ayushman-bharat`
- Fields:
  ```
  name: "Ayushman Bharat"
  description: "Health insurance scheme"
  state: "ALL"
  category: "Health"
  eligibilityCriteria: (map)
    - maxIncome: (number) 500000
    - requiredDocs: (array) ["Aadhaar", "Ration Card"]
  ```

**Document 3:**
- Document ID: `pension-senior`
- Fields:
  ```
  name: "Senior Citizen Pension"
  description: "Monthly pension for seniors"
  state: "ALL"
  category: "Social Welfare"
  eligibilityCriteria: (map)
    - minAge: (number) 60
    - maxIncome: (number) 300000
    - requiredDocs: (array) ["Aadhaar", "Income Certificate"]
  ```

### 7️⃣ Deploy Firestore Rules
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize (select Firestore and Hosting)
firebase init

# Deploy rules
firebase deploy --only firestore:rules
```

### 8️⃣ Run Development Server
```bash
npm start
```

Opens at http://localhost:3000

---

## 🎯 Test the Application

### Test Flow:
1. **Sign Up**: Create account with email/password
2. **Complete Profile**:
   - Age: 25
   - Income: 150000
   - Occupation: Farmer
   - State: Karnataka
3. **Add Documents**:
   - Aadhaar (expiry: 1 year from now)
   - Ration Card (expiry: 6 months from now)
4. **View Dashboard**: Should show PM-KISAN as eligible
5. **Check Alerts**: Should show Ration Card expiring in 6 months
6. **Add Medicine**: Test medicine tracking

---

## 🐛 Common Issues

**Issue: "Firebase not defined"**
- Solution: Check .env file exists and has correct values
- Restart dev server after editing .env

**Issue: "Permission denied" in Firestore**
- Solution: Deploy firestore.rules using `firebase deploy --only firestore:rules`

**Issue: No schemes showing**
- Solution: Manually add schemes in Firebase Console (step 6)

**Issue: npm install fails**
- Solution: Delete node_modules and package-lock.json, run `npm install` again

---

## 📦 Project Structure

```
Sarva/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   └── Header.js
│   ├── pages/
│   │   ├── Login.js
│   │   ├── Dashboard.js
│   │   ├── Profile.js
│   │   ├── Documents.js
│   │   ├── Medicines.js
│   │   └── Schemes.js
│   ├── hooks/
│   │   ├── useAuth.js
│   │   └── useEligibility.js
│   ├── services/
│   │   ├── firebase.js
│   │   ├── firestoreService.js
│   │   └── eligibilityEngine.js
│   ├── App.js
│   ├── index.js
│   └── index.css
├── .env
├── .gitignore
├── package.json
├── firestore.rules
├── firebase.json
├── README.md
└── ARCHITECTURE.md
```

---

## 🚀 Deploy to Production

```bash
# Build production bundle
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting
```

Your app will be live at: `https://your-project-id.web.app`

---

## 💡 Key Features to Demo

1. **Dependency Mapping**: Show how expiring Aadhaar affects multiple schemes
2. **Impact Prioritization**: Demonstrate "What You'll Lose Next" section
3. **Real-time Eligibility**: Change profile and see schemes update instantly
4. **Offline Support**: Disconnect internet, app still works
5. **Medicine Continuity**: Add chronic medicine and show tracking

---

## 📚 Next Steps

1. ✅ Complete basic setup (above)
2. 🎨 Customize UI/styling
3. 📊 Add more schemes for your state
4. 🔔 Implement push notifications (optional)
5. 📱 Make responsive for mobile
6. 🧪 Add unit tests
7. 🚀 Deploy to production

---

## 🆘 Need Help?

- Check ARCHITECTURE.md for detailed documentation
- Review Firebase Console for data structure
- Test with sample data first
- Use browser DevTools Console for errors

---

**Ready to build? Run `npm install` and follow steps above!** 🎉

## Security rules and the scheme catalogue

`firestore.rules` lets each signed-in user read and write only their own profile, documents, medicines and derived data. Any signed-in user can read the scheme catalogue, and nobody can change it from the app. Deploy the rules with:

```bash
firebase deploy --only firestore:rules
```

Because the app cannot write to `schemes`, add or edit schemes in the Firebase console, or with the Admin SDK.

## Local testing with the Firebase emulators

```bash
firebase emulators:start --only auth,firestore --project demo-sarva
REACT_APP_USE_EMULATOR=true REACT_APP_FIREBASE_API_KEY=fake REACT_APP_FIREBASE_PROJECT_ID=demo-sarva npm start
```

With `REACT_APP_USE_EMULATOR=true` the app talks to the local Auth (port 9099) and Firestore (port 8088) emulators instead of a real project, so test data never reaches production.

## SMS verification codes

Document verification sends a real SMS code when the app is built with `REACT_APP_OTP_SERVER_URL` pointing at the OTP server in `server/` (see `server/README.md`). Without it, documents are saved as Not Verified; the app never shows a code on screen. A document can only be marked verified when the server has recorded the phone verification (enforced by `firestore.rules`).

## Scheme catalogue (4,693 schemes)

The full catalogue comes from the [Indian Government Schemes Dataset](https://huggingface.co/datasets/Sumna/indian-government-schemes-2025) by SmartDuke Technologies (schemefit.com), licensed CC BY 4.0 and sourced from myscheme.gov.in. Its eligibility fields were parsed automatically, so results are estimates; the app says so and links to the official page.

1. Accept the dataset terms on Hugging Face and download `Schemes.csv`.
2. Build the static files: `npm run build:schemes -- path/to/Schemes.csv` (writes `public/schemes/`).
3. Deploy as usual. The app loads `public/schemes/` and falls back to the Firestore `schemes` collection if the files are missing.

## Tests

```bash
npm run test:unit      # eligibility engine (Jest)
npm run test:import    # scheme importer
npm run test:rules     # Firestore security rules (starts the emulator)
cd server && npm test  # OTP server
```
