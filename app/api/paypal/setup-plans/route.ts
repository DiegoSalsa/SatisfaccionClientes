import { NextResponse } from 'next/server';

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET!;
const PAYPAL_MODE = process.env.PAYPAL_MODE || 'sandbox';

const PAYPAL_API = PAYPAL_MODE === 'sandbox' 
  ? 'https://api-m.sandbox.paypal.com' 
  : 'https://api-m.paypal.com';

async function getAccessToken() {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
  
  const response = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  
  const data = await response.json();
  return data.access_token;
}

// Este endpoint se ejecuta UNA VEZ para crear los productos y planes en PayPal
// Después de ejecutarlo, guardar los IDs en variables de entorno
export async function POST() {
  try {
    const accessToken = await getAccessToken();
    
    // 1. Crear el Producto
    const productResponse = await fetch(`${PAYPAL_API}/v1/catalogs/products`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'ValoraLocal Pro',
        description: 'Suscripción a ValoraLocal - Sistema de encuestas de satisfacción',
        type: 'SERVICE',
        category: 'SOFTWARE',
      }),
    });
    
    const product = await productResponse.json();
    console.log('Product created:', product);
    
    if (!product.id) {
      return NextResponse.json({ error: 'Error creating product', details: product }, { status: 500 });
    }
    
    // 2. Crear Plan Mensual
    const monthlyPlanResponse = await fetch(`${PAYPAL_API}/v1/billing/plans`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        product_id: product.id,
        name: 'ValoraLocal Pro Mensual',
        description: 'Suscripción mensual a ValoraLocal',
        status: 'ACTIVE',
        billing_cycles: [
          {
            frequency: {
              interval_unit: 'MONTH',
              interval_count: 1,
            },
            tenure_type: 'REGULAR',
            sequence: 1,
            total_cycles: 0, // 0 = infinito
            pricing_scheme: {
              fixed_price: {
                value: '9.99',
                currency_code: 'USD',
              },
            },
          },
        ],
        payment_preferences: {
          auto_bill_outstanding: true,
          setup_fee: {
            value: '0',
            currency_code: 'USD',
          },
          setup_fee_failure_action: 'CONTINUE',
          payment_failure_threshold: 3,
        },
      }),
    });
    
    const monthlyPlan = await monthlyPlanResponse.json();
    console.log('Monthly plan created:', monthlyPlan);
    
    // 3. Crear Plan Anual
    const annualPlanResponse = await fetch(`${PAYPAL_API}/v1/billing/plans`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        product_id: product.id,
        name: 'ValoraLocal Pro Anual',
        description: 'Suscripción anual a ValoraLocal (ahorra 17%)',
        status: 'ACTIVE',
        billing_cycles: [
          {
            frequency: {
              interval_unit: 'YEAR',
              interval_count: 1,
            },
            tenure_type: 'REGULAR',
            sequence: 1,
            total_cycles: 0,
            pricing_scheme: {
              fixed_price: {
                value: '99.99',
                currency_code: 'USD',
              },
            },
          },
        ],
        payment_preferences: {
          auto_bill_outstanding: true,
          setup_fee: {
            value: '0',
            currency_code: 'USD',
          },
          setup_fee_failure_action: 'CONTINUE',
          payment_failure_threshold: 3,
        },
      }),
    });
    
    const annualPlan = await annualPlanResponse.json();
    console.log('Annual plan created:', annualPlan);
    
    return NextResponse.json({
      success: true,
      product_id: product.id,
      monthly_plan_id: monthlyPlan.id,
      annual_plan_id: annualPlan.id,
      message: 'Guarda estos IDs en las variables de entorno de Vercel',
    });
  } catch (error) {
    console.error('Error setting up PayPal plans:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
