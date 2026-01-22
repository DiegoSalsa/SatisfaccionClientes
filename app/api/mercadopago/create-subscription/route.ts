import { NextRequest, NextResponse } from 'next/server';
import { PLANES, PlanId } from '@/lib/mercadopago';
import { db } from '@/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { planId, email, businessName, referralCode } = body as {
      planId: PlanId;
      email: string;
      businessName: string;
      referralCode?: string;
    };

    // Validar plan
    const plan = PLANES[planId];
    if (!plan) {
      return NextResponse.json(
        { error: 'Plan no válido' },
        { status: 400 }
      );
    }

    // Validar código de referido si se proporciona
    let validReferralCode: string | null = null;
    if (referralCode && referralCode.trim()) {
      const referrerSnapshot = await db
        .collection('businesses')
        .where('referral_code', '==', referralCode.toUpperCase().trim())
        .get();
      
      if (!referrerSnapshot.empty) {
        const referrerData = referrerSnapshot.docs[0].data();
        // Solo aceptar si no ha llegado al límite de 10 referidos
        if ((referrerData.referral_count || 0) < 20) {
          validReferralCode = referralCode.toUpperCase().trim();
        }
      }
    }

    // Crear la suscripción usando la API REST de MercadoPago
    const response = await fetch('https://api.mercadopago.com/preapproval', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reason: `${plan.nombre} - ${businessName}`,
        auto_recurring: {
          frequency: plan.frecuencia,
          frequency_type: plan.tipo_frecuencia,
          transaction_amount: plan.precio,
          currency_id: 'CLP',
        },
        back_url: `${process.env.NEXT_PUBLIC_BASE_URL}/suscripcion/confirmacion`,
        payer_email: email,
        external_reference: `${planId}_${Date.now()}`,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error de MercadoPago:', errorData);
      return NextResponse.json(
        { error: 'Error al crear la suscripción en MercadoPago', details: errorData },
        { status: 500 }
      );
    }

    const subscription = await response.json();

    // Guardar en Firestore la suscripción pendiente
    if (subscription.id) {
      await db.collection('pending_subscriptions').doc(subscription.id).set({
        mp_subscription_id: subscription.id,
        plan_id: planId,
        email,
        business_name: businessName,
        referral_code: validReferralCode, // Código de referido validado
        status: 'pending',
        created_at: new Date(),
        init_point: subscription.init_point,
        external_reference: subscription.external_reference,
      });
    }

    return NextResponse.json({
      success: true,
      init_point: subscription.init_point,
      subscription_id: subscription.id,
    });
  } catch (error) {
    console.error('Error creando suscripción:', error);
    return NextResponse.json(
      { error: 'Error al crear la suscripción', details: String(error) },
      { status: 500 }
    );
  }
}
