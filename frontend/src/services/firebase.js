import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyC0LnyAK7DxKddv5M_BAfWnykOX92KdRVM',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'paisatrack-c5df0.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'paisatrack-c5df0',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'paisatrack-c5df0.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '32669407573',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:32669407573:web:ac37ffaa4c0ebcb3eaf7dc',
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.appId
);

let app = null;
let auth = null;
let db = null;

if (isFirebaseConfigured) {
  try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (err) {
    console.error('PaisaTrack: Firebase initialization failed:', err);
  }
} else {
  console.warn(
    'PaisaTrack: Firebase environment variables are missing or incomplete.\n' +
    'Please configure VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID, ' +
    'VITE_FIREBASE_STORAGE_BUCKET, VITE_FIREBASE_MESSAGING_SENDER_ID, and VITE_FIREBASE_APP_ID in GitHub Repository Secrets / Variables or local .env.'
  );
}

export { app, auth, db };
export default app;


