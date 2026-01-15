// Script para listar todos los negocios
// Uso: node scripts/list-businesses.mjs

import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({
  credential: applicationDefault(),
  projectId: 'satisfaccionclientes-36acf',
});

const db = getFirestore();

async function listBusinesses() {
  const snapshot = await db.collection('businesses').get();
  
  console.log('📋 Lista de negocios:\n');
  console.log('ID\t\t\tNombre\t\t\tSlug\t\t\tToken Privado');
  console.log('─'.repeat(120));
  
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    console.log(`${data.id}\t\t${data.name}\t\t${data.slug}\t\t${data.private_token}`);
  });
  
  console.log(`\n✅ Total: ${snapshot.size} negocios`);
}

listBusinesses();
