import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/firebase/admin';
import { sendNewReviewNotification } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { businessId, rating, comment } = await request.json();

    if (!businessId || !rating) {
      return NextResponse.json(
        { error: 'businessId y rating son requeridos' },
        { status: 400 }
      );
    }

    // Obtener datos del negocio
    const businessDoc = await db.collection('businesses').doc(businessId).get();
    
    if (!businessDoc.exists) {
      return NextResponse.json(
        { error: 'Negocio no encontrado' },
        { status: 404 }
      );
    }

    const business = businessDoc.data();
    
    if (!business?.email) {
      return NextResponse.json(
        { error: 'El negocio no tiene email configurado' },
        { status: 400 }
      );
    }

    // Construir URL del dashboard
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://satisfaccion-clientes-alpha.vercel.app';
    const dashboardUrl = `${baseUrl}/dashboard/${business.private_token}`;

    // Enviar email
    const result = await sendNewReviewNotification({
      businessEmail: business.email,
      businessName: business.name,
      rating,
      comment: comment || undefined,
      dashboardUrl,
    });

    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      console.error('Error enviando email:', result.error);
      return NextResponse.json(
        { error: 'Error enviando notificación' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error en notify-review:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
