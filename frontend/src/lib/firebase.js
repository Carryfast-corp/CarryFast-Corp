import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};

const hasFirebaseConfig = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.appId,
);

export const firebaseApp = hasFirebaseConfig ? (getApps().length ? getApp() : initializeApp(firebaseConfig)) : null;

export const firebaseAuth = firebaseApp ? getAuth(firebaseApp) : null;

// Always use the default Firestore database. Do not pass a second
// argument here unless you deliberately created a named database
// in the Firebase console and mean to target it.
export const firestoreDb = firebaseApp ? getFirestore(firebaseApp) : null;

export const firebaseStorage = firebaseApp ? getStorage(firebaseApp) : null;

try {
  if (typeof window !== "undefined") {
    window.__CFC_FIREBASE_READY__ = {
      hasFirebaseConfig,
      firebaseApp: !!firebaseApp,
      firestoreDb: !!firestoreDb,
      firebaseStorage: !!firebaseStorage,
      projectId: firebaseConfig.projectId || null,
    };
  }
} catch (e) {
  // Browser-only diagnostic helper; ignore outside the browser.
}

if (firebaseAuth) {
  setPersistence(firebaseAuth, browserLocalPersistence).catch(() => {});
}

export const ADMIN_URL =
  process.env.REACT_APP_ADMIN_URL || "/cfc-admin-control-room";

export default {
  firebaseApp,
  firebaseAuth,
  firestoreDb,
  firebaseStorage,
  ADMIN_URL,
};