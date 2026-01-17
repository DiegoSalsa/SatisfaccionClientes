import { MercadoPagoConfig } from 'mercadopago';

if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
  throw new Error('MERCADOPAGO_ACCESS_TOKEN no está configurado');
}

export const mercadopago = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
});

// Planes de suscripción
export const PLANES = {
  pro_mensual: {
    id: 'pro_mensual',
    nombre: 'Pro Mensual',
    precio: 9990,
    frecuencia: 1,
    tipo_frecuencia: 'months' as const,
    descripcion: 'Plan Pro - Cobro mensual',
  },
  pro_anual: {
    id: 'pro_anual',
    nombre: 'Pro Anual',
    precio: 99990,
    frecuencia: 12,
    tipo_frecuencia: 'months' as const,
    descripcion: 'Plan Pro - Cobro anual (ahorra 17%)',
  },
} as const;

export type PlanId = keyof typeof PLANES;
