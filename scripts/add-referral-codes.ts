// Script para generar códigos de referido a negocios existentes que no tengan uno
// Ejecutar con: npx tsx scripts/add-referral-codes.ts

import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Inicializar Firebase Admin
const serviceAccount = JSON.parse(
  readFileSync(join(__dirname, '..', 'serviceAccountKey.json'), 'utf8')
);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

// Generador de códigos estéticos
const PALABRAS = [
  'LUNA', 'SOL', 'MAR', 'RIO', 'LAGO', 'CIELO', 'NUBE', 'FLOR', 'ROSA', 'ARBOL',
  'LEON', 'TIGRE', 'AGUILA', 'LOBO', 'OSO', 'PUMA', 'HALCON', 'ZORRO',
  'AZUL', 'ROJO', 'VERDE', 'DORADO', 'PLATA', 'CORAL', 'JADE', 'PERLA',
  'FUEGO', 'TIERRA', 'AIRE', 'RAYO', 'TRUENO', 'VIENTO', 'BRISA', 'AURORA',
  'NORTE', 'SUR', 'CUMBRE', 'COSTA', 'VALLE', 'MONTE', 'BAHIA', 'DELTA',
  'EXITO', 'ELITE', 'PRIME', 'STAR', 'ROYAL', 'SMART', 'NEXUS', 'CIMA',
  'CAFE', 'RESTO', 'SHOP', 'CLUB', 'PLAZA', 'CENTRO', 'LOCAL', 'TIENDA'
];

function generateReferralCode(): string {
  const palabra = PALABRAS[Math.floor(Math.random() * PALABRAS.length)];
  const numero = Math.floor(1000 + Math.random() * 9000);
  return `${palabra}-${numero}`;
}

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
