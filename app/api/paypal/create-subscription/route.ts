import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/firebase/admin';

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
    
    // Seleccionar el plan de PayPal según el planId
    let paypalPlanId: string;
    
    if (planId === 'pro_mensual') {
      paypalPlanId = process.env.PAYPAL_MONTHLY_PLAN_ID!;
    } else if (planId === 'pro_anual') {
      paypalPlanId = process.env.PAYPAL_ANNUAL_PLAN_ID!;
    } else {
      return NextResponse.json({ error: 'Plan no válido' }, { status: 400 });
    }
    
    if (!paypalPlanId) {
      return NextResponse.json({ error: 'PayPal plan not configured' }, { status: 500 });
    }

    // Validar código de referido si se proporciona
    let validReferralCode: string | null = null;
    if (referralCode && referralCode.trim()) {
      const referrerSnapshot = await db
        .collection('businesses')
        .where('own_referral_code', '==', referralCode.toUpperCase().trim())
        .get();
      
      if (!referrerSnapshot.empty) {
        const referrerData = referrerSnapshot.docs[0].data();
        if ((referrerData.referral_count || 0) < 10) {
          validReferralCode = referralCode.toUpperCase().trim();
        }
      }
    }
    
    const accessToken = await getAccessToken();
    
    // Crear la suscripción en PayPal
    const response = await fetch(`${PAYPAL_API}/v1/billing/subscriptions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        plan_id: paypalPlanId,
        subscriber: {
          name: {
            given_name: businessName,
          },
          email_address: email,
        },
        application_context: {
          brand_name: 'ValoraLocal',
          locale: 'es-CL',
          shipping_preference: 'NO_SHIPPING',
          user_action: 'SUBSCRIBE_NOW',
          return_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://valoralocal.cl'}/api/paypal/subscription-success`,
          cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://valoralocal.cl'}/?cancelled=true`,
        },
        custom_id: JSON.stringify({ planId, businessName, email, referralCode: validReferralCode }),
      }),
    });
    
    const subscription = await response.json();
    
    if (subscription.error) {
      console.error('PayPal subscription error:', subscription);
      return NextResponse.json({ error: 'Error al crear suscripción' }, { status: 500 });
    }
    
    // Guardar suscripción pendiente en Firestore
    await db.collection('pending_subscriptions').doc(subscription.id).set({
      paypal_subscription_id: subscription.id,
      plan_id: planId,
      email,
      business_name: businessName,
      referral_code: validReferralCode,
      payment_method: 'paypal',
      status: 'pending',
      created_at: new Date(),
    });
    
    // Encontrar el link de aprobación
    const approveLink = subscription.links?.find((link: any) => link.rel === 'approve');
    
    return NextResponse.json({
      subscriptionID: subscription.id,
      approveUrl: approveLink?.href,
    });
  } catch (error) {
    console.error('Error creating PayPal subscription:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
