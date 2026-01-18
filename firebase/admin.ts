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
        console.error('FIREBASE_SERVICE_ACCOUNT_KEY no está definida');
        throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY no está configurada');
      }
      
      let serviceAccount;
      try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      } catch (parseError) {
        console.error('Error parseando FIREBASE_SERVICE_ACCOUNT_KEY:', parseError);
        console.error('Valor (primeros 100 chars):', process.env.FIREBASE_SERVICE_ACCOUNT_KEY?.substring(0, 100));
        throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY no es un JSON válido');
      }
      
      try {
        app = initializeApp({
          credential: cert(serviceAccount),
        });
      } catch (initError) {
        console.error('Error inicializando Firebase Admin:', initError);
        throw initError;
      }
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
