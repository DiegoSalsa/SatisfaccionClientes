import { NextResponse } from 'next/server';
import { db } from '@/firebase/admin';
import { sendExpirationReminder } from '@/lib/email';

// Esta ruta se ejecutará diariamente via Vercel Cron
export async function GET(request: Request) {
  try {
    // Verificar cron secret para seguridad
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const results = {
      reminders7days: 0,
      reminders3days: 0,
      reminders1day: 0,
      expired: 0,
    };

    // Buscar negocios que expiran en 7 días
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const in7DaysStart = new Date(in7Days);
    in7DaysStart.setHours(0, 0, 0, 0);
    const in7DaysEnd = new Date(in7Days);
    in7DaysEnd.setHours(23, 59, 59, 999);

    const expiring7Days = await db.collection('businesses')
      .where('status', '==', 'active')
      .where('expires_at', '>=', in7DaysStart)
      .where('expires_at', '<=', in7DaysEnd)
      .get();

    for (const doc of expiring7Days.docs) {
      const business = doc.data();
      if (!business.reminder_7days_sent) {
        await sendExpirationReminder({
          email: business.email,
          businessName: business.name,
          daysLeft: 7,
          expiresAt: business.expires_at.toDate(),
          renewUrl: `https://valoralocal.cl/renovar/${business.private_token}`,
        });
        await doc.ref.update({ reminder_7days_sent: true });
        results.reminders7days++;
      }
    }

    // Buscar negocios que expiran en 3 días
    const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const in3DaysStart = new Date(in3Days);
    in3DaysStart.setHours(0, 0, 0, 0);
    const in3DaysEnd = new Date(in3Days);
    in3DaysEnd.setHours(23, 59, 59, 999);

    const expiring3Days = await db.collection('businesses')
      .where('status', '==', 'active')
      .where('expires_at', '>=', in3DaysStart)
      .where('expires_at', '<=', in3DaysEnd)
      .get();

    for (const doc of expiring3Days.docs) {
      const business = doc.data();
      if (!business.reminder_3days_sent) {
        await sendExpirationReminder({
          email: business.email,
          businessName: business.name,
          daysLeft: 3,
          expiresAt: business.expires_at.toDate(),
          renewUrl: `https://valoralocal.cl/renovar/${business.private_token}`,
        });
        await doc.ref.update({ reminder_3days_sent: true });
        results.reminders3days++;
      }
    }

    // Buscar negocios que expiran mañana
    const tomorrow = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);
    const tomorrowStart = new Date(tomorrow);
    tomorrowStart.setHours(0, 0, 0, 0);
    const tomorrowEnd = new Date(tomorrow);
    tomorrowEnd.setHours(23, 59, 59, 999);

    const expiringTomorrow = await db.collection('businesses')
      .where('status', '==', 'active')
      .where('expires_at', '>=', tomorrowStart)
      .where('expires_at', '<=', tomorrowEnd)
      .get();

    for (const doc of expiringTomorrow.docs) {
      const business = doc.data();
      if (!business.reminder_1day_sent) {
        await sendExpirationReminder({
          email: business.email,
          businessName: business.name,
          daysLeft: 1,
          expiresAt: business.expires_at.toDate(),
          renewUrl: `https://valoralocal.cl/renovar/${business.private_token}`,
        });
        await doc.ref.update({ reminder_1day_sent: true });
        results.reminders1day++;
      }
    }

    // Marcar negocios expirados como inactivos
    const expiredBusinesses = await db.collection('businesses')
      .where('status', '==', 'active')
      .where('expires_at', '<', now)
      .get();

    for (const doc of expiredBusinesses.docs) {
      await doc.ref.update({ status: 'expired' });
      results.expired++;
    }

    console.log('Cron results:', results);
    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error('Error in expiration check cron:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
