import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/firebase/admin';

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET!;
const PAYPAL_WEBHOOK_ID = process.env.PAYPAL_WEBHOOK_ID!;
const PAYPAL_MODE = process.env.PAYPAL_MODE || 'sandbox';

const PAYPAL_API = PAYPAL_MODE === 'sandbox' 
  ? 'https://api-m.sandbox.paypal.com' 
  : 'https://api-m.paypal.com';

async function verifyWebhookSignature(
  webhookId: string,
  eventBody: string,
  headers: Headers
): Promise<boolean> {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
  
  const verifyPayload = {
    auth_algo: headers.get('paypal-auth-algo'),
    cert_url: headers.get('paypal-cert-url'),
    transmission_id: headers.get('paypal-transmission-id'),
    transmission_sig: headers.get('paypal-transmission-sig'),
    transmission_time: headers.get('paypal-transmission-time'),
    webhook_id: webhookId,
    webhook_event: JSON.parse(eventBody),
  };
  
  const response = await fetch(`${PAYPAL_API}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(verifyPayload),
  });
  
  const result = await response.json();
  return result.verification_status === 'SUCCESS';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const event = JSON.parse(body);
    
    // Verificar firma del webhook en producción
    if (PAYPAL_MODE === 'live' && PAYPAL_WEBHOOK_ID) {
      const isValid = await verifyWebhookSignature(
        PAYPAL_WEBHOOK_ID,
        body,
        request.headers
      );
      
      if (!isValid) {
        console.error('Invalid webhook signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }
    
    const eventType = event.event_type;
    const resource = event.resource;
    
    console.log('PayPal Webhook Event:', eventType, resource.id);
    
    switch (eventType) {
      // Pago de suscripción completado (renovación automática)
      case 'PAYMENT.SALE.COMPLETED': {
        const subscriptionId = resource.billing_agreement_id;
        
        if (!subscriptionId) {
          console.log('No subscription ID in payment event');
          break;
        }
        
        // Buscar negocio con esta suscripción
        const businessQuery = await db.collection('businesses')
          .where('paypal_subscription_id', '==', subscriptionId)
          .get();
        
        if (!businessQuery.empty) {
          const businessDoc = businessQuery.docs[0];
          const businessData = businessDoc.data();
          
          // Extender fecha de expiración
          const currentExpiry = businessData.expires_at?.toDate() || new Date();
          const now = new Date();
          const baseDate = currentExpiry > now ? currentExpiry : now;
          
          let newExpiry: Date;
          if (businessData.plan === 'pro_anual') {
            newExpiry = new Date(baseDate.getTime() + 365 * 24 * 60 * 60 * 1000);
          } else {
            newExpiry = new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000);
          }
          
          await businessDoc.ref.update({
            expires_at: newExpiry,
            status: 'active',
            last_payment_at: new Date(),
          });
          
          console.log(`Extended subscription for ${businessData.name} until ${newExpiry}`);
        }
        break;
      }
      
      // Suscripción suspendida (pago fallido)
      case 'BILLING.SUBSCRIPTION.SUSPENDED': {
        const subscriptionId = resource.id;
        
        const businessQuery = await db.collection('businesses')
          .where('paypal_subscription_id', '==', subscriptionId)
          .get();
        
        if (!businessQuery.empty) {
          await businessQuery.docs[0].ref.update({
            status: 'suspended',
            suspended_at: new Date(),
          });
          
          console.log(`Subscription suspended for business: ${subscriptionId}`);
        }
        break;
      }
      
      // Suscripción cancelada
      case 'BILLING.SUBSCRIPTION.CANCELLED': {
        const subscriptionId = resource.id;
        
        const businessQuery = await db.collection('businesses')
          .where('paypal_subscription_id', '==', subscriptionId)
          .get();
        
        if (!businessQuery.empty) {
          await businessQuery.docs[0].ref.update({
            status: 'cancelled',
            cancelled_at: new Date(),
          });
          
          console.log(`Subscription cancelled for business: ${subscriptionId}`);
        }
        break;
      }
      
      // Suscripción reactivada
      case 'BILLING.SUBSCRIPTION.ACTIVATED': 
      case 'BILLING.SUBSCRIPTION.RE-ACTIVATED': {
        const subscriptionId = resource.id;
        
        const businessQuery = await db.collection('businesses')
          .where('paypal_subscription_id', '==', subscriptionId)
          .get();
        
        if (!businessQuery.empty) {
          const businessDoc = businessQuery.docs[0];
          const businessData = businessDoc.data();
          
          // Reactivar y extender si ya expiró
          const now = new Date();
          let newExpiry = businessData.expires_at?.toDate();
          
          if (!newExpiry || newExpiry < now) {
            newExpiry = businessData.plan === 'pro_anual'
              ? new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)
              : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
          }
          
          await businessDoc.ref.update({
            status: 'active',
            expires_at: newExpiry,
            reactivated_at: new Date(),
          });
          
          console.log(`Subscription reactivated for business: ${subscriptionId}`);
        }
        break;
      }
      
      // Pago de suscripción fallido
      case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED': {
        const subscriptionId = resource.id;
        
        const businessQuery = await db.collection('businesses')
          .where('paypal_subscription_id', '==', subscriptionId)
          .get();
        
        if (!businessQuery.empty) {
          await businessQuery.docs[0].ref.update({
            last_payment_failed_at: new Date(),
          });
          
          console.log(`Payment failed for subscription: ${subscriptionId}`);
        }
        break;
      }
      
      default:
        console.log('Unhandled event type:', eventType);
    }
    
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
