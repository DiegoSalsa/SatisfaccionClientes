// Script para actualizar un negocio existente
// Uso: node scripts/update-business.mjs <business_id> "<nuevo_nombre>" "<nuevo_slug>"
// Ejemplo: node scripts/update-business.mjs business_1 "Restaurante El Buen Sabor" "restaurante-el-buen-sabor"

import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({
  credential: applicationDefault(),
  projectId: 'satisfaccionclientes-36acf',
});

const db = getFirestore();

async function updateBusiness(businessId, newName, newSlug) {
  if (!businessId) {
    console.error('❌ Debes proporcionar el ID del negocio');
    console.log('Uso: node scripts/update-business.mjs <business_id> "<nuevo_nombre>" "<nuevo_slug>"');
    process.exit(1);
  }

  const docRef = db.collection('businesses').doc(businessId);
  const doc = await docRef.get();

  if (!doc.exists) {
    console.error(`❌ No se encontró el negocio con ID: ${businessId}`);
    process.exit(1);
  }

  const updates = {};
  if (newName) updates.name = newName;
  if (newSlug) updates.slug = newSlug;

  if (Object.keys(updates).length === 0) {
    console.log('⚠️ No hay cambios que aplicar');
    process.exit(0);
  }

  await docRef.update(updates);
  
  console.log('✅ Negocio actualizado:');
  console.log(`   ID: ${businessId}`);
  if (newName) console.log(`   Nuevo nombre: ${newName}`);
  if (newSlug) console.log(`   Nuevo slug: ${newSlug}`);
  console.log(`   URL encuesta: /encuesta/${newSlug || doc.data().slug}`);
}

const [,, businessId, newName, newSlug] = process.argv;
updateBusiness(businessId, newName, newSlug);
