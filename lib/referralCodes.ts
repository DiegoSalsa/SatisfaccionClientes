// Generador de códigos de referido estéticos
// Formato: PALABRA-NÚMERO (ej: LUNA-4521, CAFE-8734)

const PALABRAS = [
  // Naturaleza
  'LUNA', 'SOL', 'MAR', 'RIO', 'LAGO', 'CIELO', 'NUBE', 'FLOR', 'ROSA', 'ARBOL',
  // Animales
  'LEON', 'TIGRE', 'AGUILA', 'LOBO', 'OSO', 'PUMA', 'HALCON', 'ZORRO',
  // Colores
  'AZUL', 'ROJO', 'VERDE', 'DORADO', 'PLATA', 'CORAL', 'JADE', 'PERLA',
  // Elementos
  'FUEGO', 'TIERRA', 'AIRE', 'RAYO', 'TRUENO', 'VIENTO', 'BRISA', 'AURORA',
  // Lugares
  'NORTE', 'SUR', 'CUMBRE', 'COSTA', 'VALLE', 'MONTE', 'BAHIA', 'DELTA',
  // Conceptos positivos
  'EXITO', 'ELITE', 'PRIME', 'STAR', 'ROYAL', 'SMART', 'NEXUS', 'CIMA',
  // Negocios
  'CAFE', 'RESTO', 'SHOP', 'CLUB', 'PLAZA', 'CENTRO', 'LOCAL', 'TIENDA'
];

export function generateReferralCode(): string {
  const palabra = PALABRAS[Math.floor(Math.random() * PALABRAS.length)];
  const numero = Math.floor(1000 + Math.random() * 9000); // 4 dígitos: 1000-9999
  return `${palabra}-${numero}`;
}

export function isValidReferralCodeFormat(code: string): boolean {
  // Formato: PALABRA-1234
  const pattern = /^[A-Z]{3,8}-\d{4}$/;
  return pattern.test(code.toUpperCase());
}

// Constantes del sistema de referidos
export const REFERRAL_CONFIG = {
  REWARD_AMOUNT: 2000, // $2000 CLP por referido
  MAX_REFERRALS: 10,   // Máximo 10 referidos por negocio
  CURRENCY: 'CLP'
};
