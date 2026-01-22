// Script para actualizar saldos de referidos al nuevo monto ($3.000 por referido)
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(
  readFileSync('./serviceAccountKey.json', 'utf8')
);

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function updateReferralBalances() {
  const NEW_AMOUNT = 3000; // Nuevo monto por referido
  
  const businessesSnapshot = await db.collection('businesses').get();
  
  let updated = 0;
  
  for (const doc of businessesSnapshot.docs) {
    const data = doc.data();
    const referralCount = data.referral_count || 0;
    
    if (referralCount > 0) {
      const newBalance = referralCount * NEW_AMOUNT;
      const oldBalance = data.referral_balance || 0;
      
      if (oldBalance !== newBalance) {
        await doc.ref.update({
          referral_balance: newBalance
        });
        
        console.log(`${data.name}: ${referralCount} referidos - $${oldBalance.toLocaleString()} → $${newBalance.toLocaleString()}`);
        updated++;
      }
    }
  }
  
  console.log(`\n✅ Actualizados ${updated} negocios`);
}

updateReferralBalances();
