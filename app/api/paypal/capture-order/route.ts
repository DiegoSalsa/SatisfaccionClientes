import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/firebase/admin';
import { sendWelcomeEmail, sendNewSubscriptionNotification } from '@/lib/email';

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

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function generateToken(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15) +
         Date.now().toString(36);
}

export async function POST(request: NextRequest) {
  try {
    const { orderID } = await request.json();
    
    const accessToken = await getAccessToken();
    
    // Capturar el pago
    const response = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderID}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
    
    const captureData = await response.json();
    
    if (captureData.status !== 'COMPLETED') {
      console.error('PayPal capture failed:', captureData);
      return NextResponse.json({ error: 'Pago no completado' }, { status: 400 });
    }
    
    // Extraer datos del custom_id
    const customId = captureData.purchase_units[0].payments.captures[0].custom_id;
    const { planId, businessName, email, referralCode } = JSON.parse(customId);
    
    // Calcular fecha de expiración
    const now = new Date();
    let expiresAt: Date;
    
    if (planId === 'pro_anual') {
      expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    } else {
      expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    }
    
    // Generar slug único
    let baseSlug = generateSlug(businessName);
    let slug = baseSlug;
    let counter = 1;
    
    while (true) {
      const existing = await db.collection('businesses').where('slug', '==', slug).get();
      if (existing.empty) break;
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    
    const privateToken = generateToken();
    
    // Crear negocio
    const businessData = {
      name: businessName,
      slug,
      private_token: privateToken,
      email,
      plan: planId,
      payment_method: 'paypal',
      paypal_order_id: orderID,
      created_at: new Date(),
      expires_at: expiresAt,
      status: 'active',
      referral_code: referralCode || null,
      own_referral_code: generateToken().substring(0, 8).toUpperCase(),
      referral_balance: 0,
      referral_count: 0,
    };
    
    await db.collection('businesses').add(businessData);
    
    // Procesar código de referido si existe
    if (referralCode) {
      const referrerQuery = await db.collection('businesses')
        .where('own_referral_code', '==', referralCode.toUpperCase())
        .get();
      
      if (!referrerQuery.empty) {
        const referrerDoc = referrerQuery.docs[0];
        const referrerData = referrerDoc.data();
        
        if (referrerData.referral_count < 20) {
          await referrerDoc.ref.update({
            referral_balance: (referrerData.referral_balance || 0) + 3000,
            referral_count: (referrerData.referral_count || 0) + 1,
          });
        }
      }
    }
    
    // Enviar emails
    try {
      await sendWelcomeEmail({
        businessName,
        email,
        surveyUrl: `https://valoralocal.cl/encuesta/${slug}`,
        dashboardUrl: `https://valoralocal.cl/dashboard/${privateToken}`,
        referralCode: businessData.own_referral_code,
      });
      
      await sendNewSubscriptionNotification({
        businessName,
        email,
        plan: planId === 'pro_anual' ? 'Pro Anual' : 'Pro Mensual',
        amount: planId === 'pro_anual' ? 99990 : 9990,
        referralCode: referralCode || null,
      });
    } catch (emailError) {
      console.error('Error sending emails:', emailError);
    }
    
    return NextResponse.json({
      success: true,
      dashboardUrl: `/dashboard/${privateToken}`,
    });
  } catch (error) {
    console.error('Error capturing PayPal order:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
