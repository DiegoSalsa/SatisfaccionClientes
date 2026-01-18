import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/firebase/admin';
import { PLANES } from '@/lib/mercadopago';
import crypto from 'crypto';
import { generateReferralCode, REFERRAL_CONFIG } from '@/lib/referralCodes';

// Generar tokens únicos
function generateToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // MercadoPago envía diferentes tipos de notificaciones
    const { type, data, action } = body;

    console.log('Webhook recibido:', { type, action, data });

    // Notificación de suscripción
    if (type === 'subscription_preapproval' || type === 'subscription_authorized_payment') {
      const subscriptionId = data?.id;
      
      if (!subscriptionId) {
        return NextResponse.json({ received: true });
      }

      // Obtener detalles de la suscripción desde MercadoPago
      const mpResponse = await fetch(
        `https://api.mercadopago.com/preapproval/${subscriptionId}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
          },
        }
      );

      if (!mpResponse.ok) {
        console.error('Error obteniendo suscripción de MP');
        return NextResponse.json({ received: true });
      }

      const subscription = await mpResponse.json();
      
      // Si la suscripción está autorizada/activa
      if (subscription.status === 'authorized' || subscription.status === 'active') {
        // Buscar la suscripción pendiente
        const pendingDoc = await db
          .collection('pending_subscriptions')
          .doc(subscriptionId)
          .get();

        if (pendingDoc.exists) {
          const pendingData = pendingDoc.data();
          
          // IMPORTANTE: Verificar si ya se procesó esta suscripción
          if (pendingData?.status === 'completed') {
            console.log('Suscripción ya procesada, ignorando webhook duplicado:', subscriptionId);
            return NextResponse.json({ received: true });
          }

          // Verificar si ya existe un negocio con esta suscripción
          const existingBusiness = await db
            .collection('businesses')
            .where('subscription.mp_subscription_id', '==', subscriptionId)
            .get();

          if (!existingBusiness.empty) {
            console.log('Negocio ya existe para esta suscripción, ignorando:', subscriptionId);
            // Marcar como completado si no lo está
            await pendingDoc.ref.update({ status: 'completed' });
            return NextResponse.json({ received: true });
          }

          // Marcar como "processing" para evitar duplicados concurrentes
          await pendingDoc.ref.update({ status: 'processing', processing_started_at: new Date() });
          
          // Determinar el plan
          const planId = pendingData?.plan_id || 'pro_mensual';
          const plan = PLANES[planId as keyof typeof PLANES];

          // Crear el negocio en Firestore
          const slug = generateSlug(pendingData?.business_name || 'negocio');
          const privateToken = generateToken();
          const adminToken = generateToken();

          // Verificar que el slug no exista
          const existingSlug = await db
            .collection('businesses')
            .where('slug', '==', slug)
            .get();

          const finalSlug = existingSlug.empty 
            ? slug 
            : `${slug}-${Date.now()}`;

          // Generar código de referido único para este negocio
          let referralCode = generateReferralCode();
          let codeExists = true;
          let attempts = 0;
          while (codeExists && attempts < 10) {
            const existingCode = await db
              .collection('businesses')
              .where('referral_code', '==', referralCode)
              .get();
            if (existingCode.empty) {
              codeExists = false;
            } else {
              referralCode = generateReferralCode();
              attempts++;
            }
          }

          // Crear el negocio
          const businessRef = await db.collection('businesses').add({
            name: pendingData?.business_name,
            slug: finalSlug,
            email: pendingData?.email,
            private_token: privateToken,
            admin_token: adminToken,
            created_at: new Date(),
            // Sistema de referidos
            referral_code: referralCode,
            referred_by: pendingData?.referral_code || null, // Código de quien lo refirió
            referral_count: 0, // Cuántos ha referido
            referral_balance: 0, // Saldo acumulado en CLP
            subscription: {
              plan: planId,
              status: 'active',
              mp_subscription_id: subscriptionId,
              mp_payer_id: subscription.payer_id,
              start_date: new Date(),
              next_billing_date: new Date(subscription.next_payment_date),
              amount: plan.precio,
            },
          });

          // Si fue referido por alguien, acreditar la recompensa al referidor
          if (pendingData?.referral_code) {
            const referrerSnapshot = await db
              .collection('businesses')
              .where('referral_code', '==', pendingData.referral_code)
              .get();

            if (!referrerSnapshot.empty) {
              const referrerDoc = referrerSnapshot.docs[0];
              const referrerData = referrerDoc.data();
              
              // Solo acreditar si no ha llegado al límite de 10 referidos
              if ((referrerData.referral_count || 0) < REFERRAL_CONFIG.MAX_REFERRALS) {
                await referrerDoc.ref.update({
                  referral_count: (referrerData.referral_count || 0) + 1,
                  referral_balance: (referrerData.referral_balance || 0) + REFERRAL_CONFIG.REWARD_AMOUNT,
                });

                // Registrar la transacción de referido
                await db.collection('referral_transactions').add({
                  referrer_id: referrerDoc.id,
                  referred_id: businessRef.id,
                  referred_name: pendingData?.business_name,
                  amount: REFERRAL_CONFIG.REWARD_AMOUNT,
                  status: 'credited',
                  created_at: new Date(),
                });

                console.log('Referido acreditado:', {
                  referrer: referrerDoc.id,
                  referred: businessRef.id,
                  amount: REFERRAL_CONFIG.REWARD_AMOUNT,
                });
              }
            }
          }

          // Actualizar suscripción pendiente
          await pendingDoc.ref.update({
            status: 'completed',
            business_id: businessRef.id,
            completed_at: new Date(),
          });

          // Enviar email con credenciales (TODO: implementar)
          console.log('Negocio creado:', {
            id: businessRef.id,
            slug: finalSlug,
            privateToken,
            referralCode,
          });
        }
      }

      // Si la suscripción fue cancelada
      if (subscription.status === 'cancelled' || subscription.status === 'paused') {
        // Buscar el negocio y actualizar su estado
        const businessSnapshot = await db
          .collection('businesses')
          .where('subscription.mp_subscription_id', '==', subscriptionId)
          .get();

        if (!businessSnapshot.empty) {
          const businessDoc = businessSnapshot.docs[0];
          await businessDoc.ref.update({
            'subscription.status': subscription.status,
            'subscription.cancelled_at': new Date(),
          });
        }
      }
    }

    // Notificación de pago
    if (type === 'payment') {
      const paymentId = data?.id;
      
      if (paymentId) {
        // Obtener detalles del pago
        const paymentResponse = await fetch(
          `https://api.mercadopago.com/v1/payments/${paymentId}`,
          {
            headers: {
              Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
            },
          }
        );

        if (paymentResponse.ok) {
          const payment = await paymentResponse.json();
          
          // Guardar registro del pago
          await db.collection('payments').add({
            mp_payment_id: paymentId,
            mp_subscription_id: payment.metadata?.preapproval_id,
            status: payment.status,
            amount: payment.transaction_amount,
            currency: payment.currency_id,
            payer_email: payment.payer?.email,
            created_at: new Date(),
            mp_created_at: payment.date_created,
          });

          // Si el pago fue aprobado, actualizar fecha del próximo pago
          if (payment.status === 'approved' && payment.metadata?.preapproval_id) {
            const businessSnapshot = await db
              .collection('businesses')
              .where('subscription.mp_subscription_id', '==', payment.metadata.preapproval_id)
              .get();

            if (!businessSnapshot.empty) {
              const businessDoc = businessSnapshot.docs[0];
              const currentData = businessDoc.data();
              const plan = PLANES[currentData.subscription?.plan as keyof typeof PLANES];
              
              // Calcular próxima fecha de pago
              const nextDate = new Date();
              nextDate.setMonth(nextDate.getMonth() + (plan?.frecuencia || 1));

              await businessDoc.ref.update({
                'subscription.status': 'active',
                'subscription.last_payment_date': new Date(),
                'subscription.next_billing_date': nextDate,
              });
            }
          }
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error en webhook:', error);
    return NextResponse.json({ received: true });
  }
}

// MercadoPago también hace GET para verificar el webhook
export async function GET() {
  return NextResponse.json({ status: 'ok' });
}
