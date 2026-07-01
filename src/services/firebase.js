import { initializeApp } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const {
  VITE_FIREBASE_API_KEY,
  VITE_FIREBASE_AUTH_DOMAIN,
  VITE_FIREBASE_PROJECT_ID,
  VITE_FIREBASE_STORAGE_BUCKET,
  VITE_FIREBASE_MESSAGING_SENDER_ID,
  VITE_FIREBASE_APP_ID,
} = import.meta.env;

export const isFirebaseConfigured = Boolean(
  VITE_FIREBASE_API_KEY &&
    VITE_FIREBASE_AUTH_DOMAIN &&
    VITE_FIREBASE_PROJECT_ID &&
    VITE_FIREBASE_APP_ID,
);

let auth = null;
let db = null;

if (isFirebaseConfigured) {
  try {
    const firebaseConfig = {
      apiKey: VITE_FIREBASE_API_KEY,
      authDomain: VITE_FIREBASE_AUTH_DOMAIN,
      projectId: VITE_FIREBASE_PROJECT_ID,
      storageBucket: VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: VITE_FIREBASE_APP_ID,
    };
    initializeApp(firebaseConfig);
    auth = getAuth();
    db = getFirestore();
  } catch (error) {
    console.error('Firebase initialization failed:', error);
  }
} else {
  console.warn('Firebase not configured. Set env vars in .env');
}

export const signup = async (email, password) => {
  if (!auth) throw new Error('Firebase not initialized');
  const result = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(result.user, { displayName: email.split('@')[0] });
  return result;
};

export const login = async (email, password) => {
  if (!auth) throw new Error('Firebase not initialized');
  return await signInWithEmailAndPassword(auth, email, password);
};

export const logout = async () => {
  if (!auth) throw new Error('Firebase not initialized');
  return await signOut(auth);
};

export const subscribeToAuthChanges = (callback) => {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
};

export { auth, db };
export default { signup, login, logout, subscribeToAuthChanges, auth, db };