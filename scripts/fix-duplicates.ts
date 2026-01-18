import admin from 'firebase-admin';
import { readFileSync } from 'fs';

const sa = JSON.parse(readFileSync('serviceAccountKey.json', 'utf8'));
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

async function fix() {
  console.log('Buscando ValoraLocal Prueba...');
  
  const all = await db.collection('businesses').get();
  for (const d of all.docs) {
    const data = d.data();
    if (data.name === 'ValoraLocal Prueba') {
      console.log('Encontrado! count:', data.referral_count, 'balance:', data.referral_balance);
      await d.ref.update({ referral_count: 1, referral_balance: 2000 });
      console.log('Corregido a 1 referido, 2000 CLP');
    }
  }
  
  console.log('Buscando negocio duplicado...');
  const dup = await db.collection('businesses').where('slug', '==', 'negocio-prueba-de-referidos-1768760898781').get();
  if (!dup.empty) {
    await dup.docs[0].ref.delete();
    console.log('Negocio duplicado eliminado');
  } else {
    console.log('No se encontró duplicado');
  }
  
  console.log('Listo!');
}

fix();
