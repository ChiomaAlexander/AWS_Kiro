/**
 * firebase.js — Firebase initialization, Authentication, and Cloud Firestore helpers.
 *
 * Configures Firebase App, Analytics, Auth, and Firestore for VolunteerMatch.
 *
 * @module firebase
 */

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
} from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
export const firebaseConfig = {
  apiKey: "AIzaSyCmbyzc7h2m5ruQEUoyq0gCk1OOje0iusY",
  authDomain: "aws-kiro.firebaseapp.com",
  projectId: "aws-kiro",
  storageBucket: "aws-kiro.firebasestorage.app",
  messagingSenderId: "972941614500",
  appId: "1:972941614500:web:f429785d45f01de552b531",
  measurementId: "G-VDYC5N2TZK"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Analytics safely (skip in non-browser/test environments like jsdom)
let analytics = null;
try {
  if (
    typeof window !== "undefined" &&
    typeof document !== "undefined" &&
    !window.navigator?.userAgent?.includes("jsdom")
  ) {
    analytics = getAnalytics(app);
  }
} catch {
  // Analytics is optional and may fail in offline or test environments
}

// Initialize Firebase Authentication and Cloud Firestore
export const firebaseAuth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
export { analytics };

/**
 * Determine whether we are running in a test environment (Vitest / jsdom).
 * In unit tests we avoid making live network calls to Firebase.
 * @returns {boolean}
 */
function isTestEnv() {
  return (
    typeof window === "undefined" ||
    Boolean(window.navigator?.userAgent?.includes("jsdom"))
  );
}

/**
 * Strip sensitive local-only fields (such as passwordHash) before saving a user to Firestore.
 * @param {object} user
 * @returns {object}
 */
function sanitizeUserForFirestore(user) {
  if (!user || typeof user !== "object") return user;
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

// ── Firebase Authentication Helpers ──────────────────────────────────────────

/**
 * Register a user with Firebase Authentication (Email/Password) and store their profile in Firestore.
 *
 * @param {{ email: string, password: string, displayName?: string, userProfile?: object }} params
 * @returns {Promise<{ ok: boolean, uid?: string, firebaseUser?: object, error?: string }>}
 */
export async function registerWithFirebase({ email, password, displayName, userProfile }) {
  if (isTestEnv()) return { ok: true, skipped: true };
  try {
    const credential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
    if (displayName) {
      await updateProfile(credential.user, { displayName });
    }
    if (userProfile) {
      const profileToSave = sanitizeUserForFirestore({
        ...userProfile,
        firebaseUid: credential.user.uid,
      });
      await setDoc(doc(db, "users", String(userProfile.id || credential.user.uid)), profileToSave, {
        merge: true,
      });
    }
    return { ok: true, uid: credential.user.uid, firebaseUser: credential.user };
  } catch (err) {
    return { ok: false, error: err?.message || "Firebase registration failed." };
  }
}

/**
 * Sign in a user with Firebase Authentication (Email/Password).
 *
 * @param {{ email: string, password: string }} params
 * @returns {Promise<{ ok: boolean, uid?: string, firebaseUser?: object, error?: string }>}
 */
export async function loginWithFirebase({ email, password }) {
  if (isTestEnv()) return { ok: true, skipped: true };
  try {
    const credential = await signInWithEmailAndPassword(firebaseAuth, email, password);
    return { ok: true, uid: credential.user.uid, firebaseUser: credential.user };
  } catch (err) {
    return { ok: false, error: err?.message || "Firebase sign-in failed." };
  }
}

/**
 * Sign in with Google Popup via Firebase Authentication.
 *
 * @returns {Promise<{ ok: boolean, firebaseUser?: object, error?: string }>}
 */
export async function signInWithGoogleFirebase() {
  if (isTestEnv()) return { ok: false, error: "Google Sign-In is not available in test environment." };
  try {
    const result = await signInWithPopup(firebaseAuth, googleProvider);
    return { ok: true, firebaseUser: result.user };
  } catch (err) {
    return { ok: false, error: err?.message || "Google sign-in failed." };
  }
}

/**
 * Sign out from Firebase Authentication.
 * @returns {Promise<void>}
 */
export async function logoutFromFirebase() {
  if (isTestEnv()) return;
  try {
    await signOut(firebaseAuth);
  } catch {
    // Ignore sign-out errors when offline
  }
}

/**
 * Listen to Firebase Auth state changes.
 * @param {Function} callback
 * @returns {Function} Unsubscribe function
 */
export function onFirebaseAuthChange(callback) {
  if (isTestEnv()) return () => {};
  try {
    return onAuthStateChanged(firebaseAuth, callback);
  } catch {
    return () => {};
  }
}

// ── Cloud Firestore Helpers ──────────────────────────────────────────────────

/**
 * Save or update a single document in a Firestore collection.
 *
 * @param {string} collectionName
 * @param {string} docId
 * @param {object} data
 * @returns {Promise<boolean>}
 */
export async function saveDocumentToFirestore(collectionName, docId, data) {
  if (isTestEnv() || !collectionName || !docId || !data) return false;
  try {
    const payload =
      collectionName === "users" ? sanitizeUserForFirestore(data) : data;
    await setDoc(doc(db, collectionName, String(docId)), payload, { merge: true });
    return true;
  } catch {
    return false;
  }
}

/**
 * Fetch a single document from a Firestore collection by ID.
 *
 * @param {string} collectionName
 * @param {string} docId
 * @returns {Promise<object|null>}
 */
export async function getDocumentFromFirestore(collectionName, docId) {
  if (isTestEnv() || !collectionName || !docId) return null;
  try {
    const snap = await getDoc(doc(db, collectionName, String(docId)));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  } catch {
    return null;
  }
}

/**
 * Delete a single document from a Firestore collection by ID.
 *
 * @param {string} collectionName
 * @param {string} docId
 * @returns {Promise<boolean>}
 */
export async function deleteDocumentFromFirestore(collectionName, docId) {
  if (isTestEnv() || !collectionName || !docId) return false;
  try {
    await deleteDoc(doc(db, collectionName, String(docId)));
    return true;
  } catch {
    return false;
  }
}

/**
 * Sync an array collection (e.g. 'users', 'posts', 'opportunities') to Firestore.
 * Each item with an `id` is written to `{collectionName}/{item.id}`.
 *
 * @param {string} collectionName
 * @param {Array<object>} items
 * @returns {Promise<void>}
 */
export async function syncCollectionToFirestore(collectionName, items) {
  if (isTestEnv() || !Array.isArray(items)) return;
  try {
    const writes = items
      .filter(item => item && item.id)
      .map(item => saveDocumentToFirestore(collectionName, item.id, item));
    await Promise.allSettled(writes);
  } catch {
    // Fail silently if offline or restricted by security rules
  }
}

/**
 * Fetch all documents from a Firestore collection.
 *
 * @param {string} collectionName
 * @returns {Promise<Array<object>|null>}
 */
export async function fetchCollectionFromFirestore(collectionName) {
  if (isTestEnv() || !collectionName) return null;
  try {
    const snap = await getDocs(collection(db, collectionName));
    if (snap.empty) return [];
    const results = [];
    snap.forEach(docSnap => {
      results.push({ id: docSnap.id, ...docSnap.data() });
    });
    return results;
  } catch {
    return null;
  }
}

/**
 * Subscribe to real-time updates on a Firestore collection.
 *
 * @param {string} collectionName
 * @param {Function} onNext - Called with array of documents on each snapshot
 * @returns {Function} Unsubscribe function
 */
export function subscribeToFirestoreCollection(collectionName, onNext) {
  if (isTestEnv() || !collectionName) return () => {};
  try {
    return onSnapshot(
      collection(db, collectionName),
      snapshot => {
        const docs = [];
        snapshot.forEach(docSnap => {
          docs.push({ id: docSnap.id, ...docSnap.data() });
        });
        onNext(docs);
      },
      () => {
        // Ignore snapshot permission/network errors in offline mode
      }
    );
  } catch {
    return () => {};
  }
}

export {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  updateProfile,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
};
