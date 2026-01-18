import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/firebase/admin';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const subscriptionId = searchParams.get('subscription_id');

  if (!subscriptionId) {
    return NextResponse.json({ found: false, error: 'No subscription ID' }, { status: 400 });
  }

  try {
    // Buscar el negocio por mp_subscription_id
    const businessSnapshot = await db
      .collection('businesses')
      .where('subscription.mp_subscription_id', '==', subscriptionId)
      .limit(1)
      .get();

    if (businessSnapshot.empty) {
      return NextResponse.json({ found: false });
    }

    const business = businessSnapshot.docs[0].data();

    return NextResponse.json({
      found: true,
      private_token: business.private_token,
      business_name: business.name,
    });
  } catch (error) {
    console.error('Error checking business:', error);
    return NextResponse.json({ found: false, error: 'Server error' }, { status: 500 });
  }
}
