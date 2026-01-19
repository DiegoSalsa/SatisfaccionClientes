import { NextRequest, NextResponse } from 'next/server';

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

export async function POST(request: NextRequest) {
  try {
    const { planId, businessName, email, referralCode } = await request.json();
    
    // Definir precios según plan (en USD para PayPal)
    let amount: string;
    let description: string;
    
    switch (planId) {
      case 'pro_mensual':
        amount = '9.99'; // ~$9.990 CLP
        description = 'ValoraLocal Pro Mensual';
        break;
      case 'pro_anual':
        amount = '99.99'; // ~$99.990 CLP
        description = 'ValoraLocal Pro Anual';
        break;
      default:
        return NextResponse.json({ error: 'Plan no válido' }, { status: 400 });
    }
    
    const accessToken = await getAccessToken();
    
    const response = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: 'USD',
            value: amount,
          },
          description: description,
          custom_id: JSON.stringify({ planId, businessName, email, referralCode }),
        }],
        application_context: {
          brand_name: 'ValoraLocal',
          landing_page: 'NO_PREFERENCE',
          user_action: 'PAY_NOW',
          return_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://valoralocal.cl'}/api/paypal/capture`,
          cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://valoralocal.cl'}/?cancelled=true`,
        },
      }),
    });
    
    const order = await response.json();
    
    if (order.error) {
      console.error('PayPal error:', order);
      return NextResponse.json({ error: 'Error al crear orden' }, { status: 500 });
    }
    
    return NextResponse.json({ orderID: order.id });
  } catch (error) {
    console.error('Error creating PayPal order:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
