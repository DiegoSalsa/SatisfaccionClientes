// Script para generar códigos de referido a negocios existentes que no tengan uno
// Ejecutar con: npx ts-node --project tsconfig.json scripts/add-referral-codes.ts

import { db } from '../firebase/admin';
import { generateReferralCode } from '../lib/referralCodes';

async function addReferralCodesToExistingBusinesses() {
  try {
    console.log('🔍 Buscando negocios sin código de referido...');
    
    const businessesSnapshot = await db.collection('businesses').get();
    
    let updated = 0;
    let skipped = 0;
    const usedCodes = new Set<string>();
    
    // Primero recolectar códigos existentes
    for (const doc of businessesSnapshot.docs) {
      const data = doc.data();
      if (data.referral_code) {
        usedCodes.add(data.referral_code);
      }
    }
    
    // Luego asignar códigos a los que no tienen
    for (const doc of businessesSnapshot.docs) {
      const data = doc.data();
      
      if (data.referral_code) {
        console.log(`✅ ${data.name} ya tiene código: ${data.referral_code}`);
        skipped++;
        continue;
      }
      
      // Generar código único
      let newCode = generateReferralCode();
      let attempts = 0;
      while (usedCodes.has(newCode) && attempts < 20) {
        newCode = generateReferralCode();
        attempts++;
      }
      
      usedCodes.add(newCode);
      
      // Actualizar el negocio
      await doc.ref.update({
        referral_code: newCode,
        referral_count: data.referral_count || 0,
        referral_balance: data.referral_balance || 0,
      });
      
      console.log(`🎉 ${data.name} → nuevo código: ${newCode}`);
      updated++;
    }
    
    console.log('\n📊 Resumen:');
    console.log(`   - Actualizados: ${updated}`);
    console.log(`   - Ya tenían código: ${skipped}`);
    console.log(`   - Total: ${businessesSnapshot.size}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

addReferralCodesToExistingBusinesses();
