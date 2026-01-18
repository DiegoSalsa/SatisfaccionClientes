import admin from 'firebase-admin';
import { readFileSync } from 'fs';

const sa = JSON.parse(readFileSync('serviceAccountKey.json', 'utf8'));
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

async function fix() {
  console.log('Buscando ValoraLocal Prueba...');
  
  // Buscar por slug exacto
  const vpSnap = await db.collection('businesses').where('slug', '==', 'ValoraLocal-Prueba').get();
  if (!vpSnap.empty) {
    const doc = vpSnap.docs[0];
    const data = doc.data();
    console.log('Encontrado! count:', data.referral_count, 'balance:', data.referral_balance);
    await doc.ref.update({ referral_count: 1, referral_balance: 2000 });
    console.log('Corregido a 1 referido, 2000 CLP');
  } else {
    console.log('No encontrado por slug, buscando por nombre...');
    const all = await db.collection('businesses').get();
    for (const d of all.docs) {
      const data = d.data();
      if (data.name === 'ValoraLocal Prueba') {
        console.log('Encontrado! count:', data.referral_count, 'balance:', data.referral_balance);
        await d.ref.update({ referral_count: 1, referral_balance: 2000 });
        console.log('Corregido a 1 referido, 2000 CLP');
      }
    }
  }
  
  console.log('Buscando negocios duplicados...');
  // Eliminar TODOS los duplicados (los que tienen timestamp en el slug)
  const all = await db.collection('businesses').get();
  for (const d of all.docs) {
    const data = d.data();
    // Si el slug tiene un timestamp largo al final, es un duplicado
    if (data.slug && data.slug.includes('negocio-prueba-de-referidos-') && data.slug.length > 30) {
      console.log('Eliminando duplicado:', data.slug);
      await d.ref.delete();
    }
  }
  
  console.log('Listo!');
}

fix();
