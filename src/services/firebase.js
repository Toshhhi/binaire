import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword as firebaseSignIn, 
  createUserWithEmailAndPassword as firebaseSignUp, 
  signOut as firebaseSignOut, 
  onAuthStateChanged as firebaseAuthStateChanged
} from 'firebase/auth';

// Retrieve credentials
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Check if credentials are provided
const isFirebaseConfigured = !!firebaseConfig.apiKey && firebaseConfig.apiKey !== 'your_api_key_here';

let auth;
let isMock = false;

if (isFirebaseConfigured) {
  try {
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    console.log('Firebase Authentication initialized successfully.');
  } catch (error) {
    console.error('Firebase initialization failed, falling back to Mock Auth:', error);
    isMock = true;
  }
} else {
  console.warn('Firebase configuration missing in .env. Running in Simulated Auth mode.');
  isMock = true;
}

// --- MOCK AUTHENTICATION SYSTEM ---
const MOCK_USERS_KEY = 'netflix_mock_users';
const CURRENT_USER_KEY = 'netflix_current_user';

const getMockUsers = () => JSON.parse(localStorage.getItem(MOCK_USERS_KEY) || '[]');
const saveMockUsers = (users) => localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users));

const mockAuth = {
  currentUser: JSON.parse(localStorage.getItem(CURRENT_USER_KEY) || 'null'),
  
  listeners: new Set(),
  
  notifyListeners(user) {
    mockAuth.currentUser = user;
    this.listeners.forEach(callback => callback(user));
  }
};

// --- AUTH API GATEWAY ---

export const signup = async (email, password) => {
  if (isMock) {
    await new Promise(resolve => setTimeout(resolve, 600)); // Simulate delay
    const users = getMockUsers();
    
    if (users.find(u => u.email === email)) {
      throw new Error('auth/email-already-in-use');
    }
    
    const newUser = { uid: `mock-${Date.now()}`, email, displayName: email.split('@')[0] };
    users.push({ ...newUser, password });
    saveMockUsers(users);
    
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));
    mockAuth.notifyListeners(newUser);
    return { user: newUser };
  } else {
    return firebaseSignUp(auth, email, password);
  }
};

export const login = async (email, password) => {
  if (isMock) {
    await new Promise(resolve => setTimeout(resolve, 600)); // Simulate delay
    const users = getMockUsers();
    const userMatch = users.find(u => u.email === email && u.password === password);
    
    if (!userMatch) {
      throw new Error('auth/invalid-credential');
    }
    
    const loggedUser = { uid: userMatch.uid, email: userMatch.email, displayName: userMatch.displayName };
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(loggedUser));
    mockAuth.notifyListeners(loggedUser);
    return { user: loggedUser };
  } else {
    return firebaseSignIn(auth, email, password);
  }
};

export const logout = async () => {
  if (isMock) {
    localStorage.removeItem(CURRENT_USER_KEY);
    mockAuth.notifyListeners(null);
    return true;
  } else {
    return firebaseSignOut(auth);
  }
};

export const subscribeToAuthChanges = (callback) => {
  if (isMock) {
    mockAuth.listeners.add(callback);
    // Trigger initial status
    callback(mockAuth.currentUser);
    return () => {
      mockAuth.listeners.delete(callback);
    };
  } else {
    return firebaseAuthStateChanged(auth, callback);
  }
};

export { auth, isMock };
export default auth;
