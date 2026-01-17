import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

let app: App;

if (!getApps().length) {
  // En producción, usar variables de entorno
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    app = initializeApp({
      credential: cert(serviceAccount),
    });
  } else {
    // En desarrollo, usar el archivo serviceAccountKey.json
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const serviceAccount = require('../serviceAccountKey.json');
    app = initializeApp({
      credential: cert(serviceAccount),
    });
  }
} else {
  app = getApps()[0];
}

export const db = getFirestore(app);
export { app };
