/**
 * Firebase JS SDK init for Expo Go (no native modules required).
 *
 * Config is sourced from EXPO_PUBLIC_FIREBASE_* environment variables so the
 * same bundle can target dev / staging / prod by swapping `.env`. Read at
 * module-eval time — Metro restart required to pick up changes.
 *
 * `EXPO_PUBLIC_*` keys are inlined into the client bundle by Expo. Treat the
 * web API key as public (Firebase rules + App Check enforce auth on the
 * server side, not the key).
 */
import { initializeApp, type FirebaseApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

function readConfig(): FirebaseOptions | null {
  const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
  const authDomain = process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;
  const storageBucket = process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET;
  const messagingSenderId = process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
  const appId = process.env.EXPO_PUBLIC_FIREBASE_APP_ID;

  if (!apiKey || !projectId || !appId) return null;

  return {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
  };
}

let cachedApp: FirebaseApp | null = null;

export function getFirebaseApp(): FirebaseApp | null {
  if (cachedApp) return cachedApp;
  const cfg = readConfig();
  if (!cfg) {
    if (__DEV__) {
      console.warn(
        '[firebase] config missing — set EXPO_PUBLIC_FIREBASE_* env vars to enable.',
      );
    }
    return null;
  }
  cachedApp = initializeApp(cfg);
  return cachedApp;
}

export function getFirebaseAuth(): Auth | null {
  const app = getFirebaseApp();
  return app ? getAuth(app) : null;
}

export function getFirebaseFirestore(): Firestore | null {
  const app = getFirebaseApp();
  return app ? getFirestore(app) : null;
}

export function getFirebaseStorage(): FirebaseStorage | null {
  const app = getFirebaseApp();
  return app ? getStorage(app) : null;
}

export function isFirebaseConfigured(): boolean {
  return readConfig() !== null;
}
