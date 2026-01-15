// Este script sube los negocios generados por seed-businesses.js a Firestore
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const businesses = require('./businesses_seed.json');

initializeApp({
  credential: applicationDefault(),
  projectId: 'satisfaccionclientes-36acf',
});

const db = getFirestore();

async function upload() {
  for (const business of businesses) {
    await db.collection('businesses').doc(business.id).set(business);
    console.log('Subido:', business.name);
  }
  console.log('Todos los negocios subidos.');
}

upload();
