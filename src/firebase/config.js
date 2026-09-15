import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Ambil konfigurasi dari Environment Variables Vercel
const envConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Pastikan aplikasi dikonfigurasi menggunakan variabel asli
const isConfigured = Boolean(envConfig.apiKey && envConfig.projectId);

let app;
let auth;
let db;
let storage;
let isRealFirebase = false;

try {
  if (isConfigured) {
    // Jalankan Firebase Asli menggunakan kredensial produksi Anda
    app = getApps().length === 0 ? initializeApp(envConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    isRealFirebase = true;
  } else {
    throw new Error("Firebase configuration credentials are missing.");
  }
} catch (error) {
  console.error("Firebase initialization failed:", error.message || error);
  isRealFirebase = false;
}

export { app, auth, db, storage, isRealFirebase, envConfig as configSource };
