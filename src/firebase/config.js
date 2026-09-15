import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Helper to get active configuration
export function getFirebaseConfig() {
  const customConfig = localStorage.getItem('gp4_custom_firebase_config');
  if (customConfig) {
    try {
      const parsed = JSON.parse(customConfig);
      if (parsed.apiKey && parsed.projectId) {
        return { config: parsed, source: 'custom' };
      }
    } catch (e) {
      console.warn('Failed to parse custom Firebase config:', e);
    }
  }

  const envConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };

  const isConfigured = 
    Boolean(envConfig.apiKey) && 
    envConfig.apiKey !== 'your_firebase_api_key_here' && 
    envConfig.apiKey !== 'AIzaSyDemoKeyGreenPanorama4Portal' &&
    Boolean(envConfig.projectId);

  return { config: envConfig, source: isConfigured ? 'env' : 'demo' };
}

const { config: activeConfig, source: configSource } = getFirebaseConfig();

let app;
let auth;
let db;
let storage;
let isRealFirebase = false;

try {
  if (activeConfig.apiKey && activeConfig.apiKey.startsWith('AIza') && configSource !== 'demo') {
    app = getApps().length === 0 ? initializeApp(activeConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    isRealFirebase = true;
  } else {
    // If not yet configured with valid keys, still initialize app structure safely
    app = getApps().length === 0 ? initializeApp(activeConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    isRealFirebase = false;
  }
} catch (error) {
  console.warn('Firebase initialization note:', error?.message || error);
}

export { app, auth, db, storage, isRealFirebase, configSource };
