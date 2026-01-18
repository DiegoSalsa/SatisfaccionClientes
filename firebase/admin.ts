import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let app: App | null = null;
let firestoreDb: Firestore | null = null;

function getApp(): App {
  if (!app) {
    if (getApps().length) {
      app = getApps()[0];
    } else {
      if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY no está configurada');
      }
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      app = initializeApp({
        credential: cert(serviceAccount),
      });
    }
  }
  return app;
}

export const db = {
  collection: (path: string) => {
    if (!firestoreDb) {
      firestoreDb = getFirestore(getApp());
    }
    return firestoreDb.collection(path);
  },
};
