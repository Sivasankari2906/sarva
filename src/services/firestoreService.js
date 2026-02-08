import { collection, doc, setDoc, getDoc, getDocs, query, where, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';

// User Profile
export const saveUserProfile = async (userId, profile) => {
  await setDoc(doc(db, 'users', userId), { ...profile, updatedAt: new Date() }, { merge: true });
};

export const getUserProfile = async (userId) => {
  const docSnap = await getDoc(doc(db, 'users', userId));
  return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
};

// Documents
export const addDocument = async (userId, document) => {
  const docRef = doc(collection(db, 'documents'));
  await setDoc(docRef, { ...document, userId, createdAt: new Date() });
  return docRef.id;
};

export const getUserDocuments = async (userId) => {
  const q = query(collection(db, 'documents'), where('userId', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const updateDocument = async (docId, updates) => {
  await updateDoc(doc(db, 'documents', docId), updates);
};

export const deleteDocument = async (docId) => {
  await deleteDoc(doc(db, 'documents', docId));
};

// Medicines
export const addMedicine = async (userId, medicine) => {
  const docRef = doc(collection(db, 'medicines'));
  await setDoc(docRef, { ...medicine, userId, createdAt: new Date() });
  return docRef.id;
};

export const getUserMedicines = async (userId) => {
  const q = query(collection(db, 'medicines'), where('userId', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Schemes (admin-managed, read-only for users)
export const getAllSchemes = async () => {
  const snapshot = await getDocs(collection(db, 'schemes'));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getSchemesByState = async (state) => {
  const q = query(collection(db, 'schemes'), where('state', 'in', [state, 'ALL']));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Eligibility Cache
export const saveEligibilityCache = async (userId, eligibilityData) => {
  await setDoc(doc(db, 'eligibility_cache', userId), eligibilityData);
};

export const getEligibilityCache = async (userId) => {
  const docSnap = await getDoc(doc(db, 'eligibility_cache', userId));
  return docSnap.exists() ? docSnap.data() : null;
};

// Dependency Map
export const saveDependencyMap = async (userId, dependencyData) => {
  await setDoc(doc(db, 'dependency_map', userId), { items: dependencyData, updatedAt: new Date() });
};

export const getDependencyMap = async (userId) => {
  const docSnap = await getDoc(doc(db, 'dependency_map', userId));
  return docSnap.exists() ? docSnap.data().items : [];
};

// Real-time listeners
export const subscribeToUserData = (userId, callback) => {
  return onSnapshot(doc(db, 'users', userId), (doc) => {
    callback(doc.exists() ? { id: doc.id, ...doc.data() } : null);
  });
};
