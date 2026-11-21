// Firestore security rules tests. Run with: npm run test:rules (starts the Firestore emulator).
import { test, before, after, beforeEach } from 'node:test';
import fs from 'node:fs';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';

let env;
before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-sarva',
    firestore: { rules: fs.readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8088 },
  });
});
after(async () => env && env.cleanup());
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'schemes/pm-kisan'), { name: 'PM-KISAN', state: 'ALL' });
    await setDoc(doc(db, 'users/alice'), { name: 'Alice' });
    await setDoc(doc(db, 'documents/d1'), { userId: 'alice', type: 'Aadhaar' });
    await setDoc(doc(db, 'medicines/m1'), { userId: 'alice', name: 'Metformin' });
    await setDoc(doc(db, 'eligibility_cache/alice'), { eligible: [] });
    await setDoc(doc(db, 'phone_verifications/alice_+919876543210'), { uid: 'alice', phone: '+919876543210' });
  });
});

const alice = () => env.authenticatedContext('alice').firestore();
const bob = () => env.authenticatedContext('bob').firestore();
const anon = () => env.unauthenticatedContext().firestore();

test('a user can read and write their own profile', async () => {
  await assertSucceeds(getDoc(doc(alice(), 'users/alice')));
  await assertSucceeds(setDoc(doc(alice(), 'users/alice'), { name: 'Alice A' }));
});

test("a user cannot read or write someone else's profile", async () => {
  await assertFails(getDoc(doc(bob(), 'users/alice')));
  await assertFails(setDoc(doc(bob(), 'users/alice'), { name: 'hacked' }));
});

test('documents: owner can create, read, query, update and delete', async () => {
  await assertSucceeds(setDoc(doc(alice(), 'documents/d2'), { userId: 'alice', type: 'PAN' }));
  await assertSucceeds(getDoc(doc(alice(), 'documents/d1')));
  await assertSucceeds(getDocs(query(collection(alice(), 'documents'), where('userId', '==', 'alice'))));
  await assertSucceeds(updateDoc(doc(alice(), 'documents/d1'), { type: 'Voter ID' }));
  await assertSucceeds(deleteDoc(doc(alice(), 'documents/d1')));
});

test("documents: others cannot read, query, change, delete or create one in the owner's name", async () => {
  await assertFails(getDoc(doc(bob(), 'documents/d1')));
  await assertFails(getDocs(query(collection(bob(), 'documents'), where('userId', '==', 'alice'))));
  await assertFails(updateDoc(doc(bob(), 'documents/d1'), { type: 'x' }));
  await assertFails(deleteDoc(doc(bob(), 'documents/d1')));
  await assertFails(setDoc(doc(bob(), 'documents/d3'), { userId: 'alice', type: 'fake' }));
});

test('documents: the owner cannot hand a document to someone else', async () => {
  await assertFails(updateDoc(doc(alice(), 'documents/d1'), { userId: 'bob' }));
});

test('medicines follow the same ownership rules', async () => {
  await assertSucceeds(getDoc(doc(alice(), 'medicines/m1')));
  await assertFails(getDoc(doc(bob(), 'medicines/m1')));
  await assertFails(setDoc(doc(bob(), 'medicines/m2'), { userId: 'alice', name: 'x' }));
});

test('per-user derived data is private', async () => {
  await assertSucceeds(getDoc(doc(alice(), 'eligibility_cache/alice')));
  await assertFails(getDoc(doc(bob(), 'eligibility_cache/alice')));
  await assertSucceeds(setDoc(doc(alice(), 'dependency_map/alice'), { items: [] }));
  await assertFails(setDoc(doc(bob(), 'dependency_map/alice'), { items: [] }));
});

test('schemes: signed-in users can read, nobody can write from the app, anonymous cannot read', async () => {
  await assertSucceeds(getDoc(doc(bob(), 'schemes/pm-kisan')));
  await assertFails(setDoc(doc(bob(), 'schemes/pm-kisan'), { name: 'free money' }));
  await assertFails(setDoc(doc(alice(), 'schemes/new'), { name: 'new' }));
  await assertFails(getDoc(doc(anon(), 'schemes/pm-kisan')));
});

test('anonymous users and unknown collections are locked out', async () => {
  await assertFails(getDoc(doc(anon(), 'users/alice')));
  await assertFails(setDoc(doc(alice(), 'random/x'), { a: 1 }));
});

test('a document can be marked verified only with a server-recorded phone verification', async () => {
  await assertFails(setDoc(doc(alice(), 'documents/v1'), { userId: 'alice', type: 'PAN', verified: true }));
  await assertFails(setDoc(doc(alice(), 'documents/v2'), { userId: 'alice', type: 'PAN', verified: true, verifiedPhone: '+919111111111' }));
  await assertSucceeds(setDoc(doc(alice(), 'documents/v3'), { userId: 'alice', type: 'PAN', verified: true, verifiedPhone: '+919876543210' }));
  await assertFails(updateDoc(doc(alice(), 'documents/d1'), { verified: true }));
  await assertSucceeds(updateDoc(doc(alice(), 'documents/d1'), { verified: true, verifiedPhone: '+919876543210' }));
});

test("one user cannot borrow another user's phone verification", async () => {
  await assertFails(setDoc(doc(bob(), 'documents/b1'), { userId: 'bob', type: 'PAN', verified: true, verifiedPhone: '+919876543210' }));
});

test('phone verifications are readable by their owner and never writable from the app', async () => {
  await assertSucceeds(getDoc(doc(alice(), 'phone_verifications/alice_+919876543210')));
  await assertFails(getDoc(doc(bob(), 'phone_verifications/alice_+919876543210')));
  await assertFails(setDoc(doc(bob(), 'phone_verifications/bob_+919000000000'), { uid: 'bob', phone: '+919000000000' }));
});
