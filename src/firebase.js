// Firebase SDK setup and configuration
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Firebase configuration object using environment variables
// These values should be set in your .env file (see .env.example)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Check if Firebase is properly configured
if (!firebaseConfig.apiKey || firebaseConfig.apiKey === 'AIzaSyDummyKeyForDevelopment123456789') {
  console.warn('⚠️ Firebase is not properly configured. Please add your Firebase credentials to .env file.');
  console.warn('📖 See FIREBASE_SETUP.md for instructions.');
}

// Initialize Firebase app with the config above
const app = initializeApp(firebaseConfig);

// Initialize and export Firebase Authentication
// This auth instance will be used throughout the app for authentication operations
export const auth = getAuth(app);
export default app;
