import { Resend } from 'resend';

// Lazy initialization de Resend
let resendInstance: Resend | null = null;

function getResend(): Resend {
  if (!resendInstance) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY no está configurada');
    }
    resendInstance = new Resend(process.env.RESEND_API_KEY);
  }
  return resendInstance;
}

// Email de origen - dominio verificado
const FROM_EMAIL = 'ValoraLocal <noreply@valoralocal.cl>';

interface WelcomeEmailData {
  businessName: string;
  email: string;
  surveyUrl: string;
  dashboardUrl: string;
  referralCode: string;
}

interface ReferralNotificationData {
  referrerEmail: string;
  referrerName: string;
  referredBusinessName: string;
  newBalance: number;
  referralCount: number;
}

// Email de bienvenida con credenciales
export async function sendWelcomeEmail(data: WelcomeEmailData) {
  try {
    const { businessName, email, surveyUrl, dashboardUrl, referralCode } = data;
    const resend = getResend();

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `¡Bienvenido a ValoraLocal, ${businessName}! 🎉`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%); padding: 40px 30px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">¡Bienvenido a ValoraLocal!</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px;">${businessName}</p>
      </div>
      
      <!-- Content -->
      <div style="padding: 40px 30px;">
        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
          Tu cuenta está lista. Aquí tienes tus enlaces de acceso:
        </p>
        
        <!-- Survey Link -->
        <div style="background: #F0F9FF; border-radius: 12px; padding: 20px; margin-bottom: 16px;">
          <p style="color: #0369A1; font-size: 14px; font-weight: 600; margin: 0 0 8px;">📋 Tu enlace de encuesta</p>
          <p style="color: #1E40AF; font-size: 13px; margin: 0; word-break: break-all;">
            Comparte este enlace con tus clientes:
          </p>
          <a href="${surveyUrl}" style="display: block; color: #2563EB; font-size: 14px; margin-top: 8px; word-break: break-all;">${surveyUrl}</a>
        </div>
        
        <!-- Dashboard Link -->
        <div style="background: #F5F3FF; border-radius: 12px; padding: 20px; margin-bottom: 16px;">
          <p style="color: #6D28D9; font-size: 14px; font-weight: 600; margin: 0 0 8px;">📊 Tu dashboard privado</p>
          <p style="color: #5B21B6; font-size: 13px; margin: 0;">
            Accede a tus métricas y opiniones:
          </p>
          <a href="${dashboardUrl}" style="display: block; color: #7C3AED; font-size: 14px; margin-top: 8px; word-break: break-all;">${dashboardUrl}</a>
        </div>
        
        <!-- Referral Code -->
        <div style="background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%); border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: center;">
          <p style="color: #92400E; font-size: 14px; font-weight: 600; margin: 0 0 8px;">🎁 Tu código de referido</p>
          <p style="color: #78350F; font-size: 28px; font-weight: 700; margin: 0; letter-spacing: 2px;">${referralCode}</p>
          <p style="color: #A16207; font-size: 12px; margin: 8px 0 0;">
            Gana $2.000 CLP por cada negocio que se suscriba con tu código
          </p>
        </div>
        
        <!-- CTA Button -->
        <a href="${dashboardUrl}" style="display: block; background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%); color: white; text-decoration: none; text-align: center; padding: 16px 24px; border-radius: 12px; font-weight: 600; font-size: 16px;">
          Ir a mi Dashboard →
        </a>
        
        <p style="color: #9CA3AF; font-size: 13px; text-align: center; margin: 24px 0 0;">
          ⚠️ Guarda este correo, contiene tus enlaces de acceso únicos.
        </p>
      </div>
      
      <!-- Footer -->
      <div style="background: #F9FAFB; padding: 24px 30px; text-align: center; border-top: 1px solid #E5E7EB;">
        <p style="color: #6B7280; font-size: 12px; margin: 0;">
          © 2026 ValoraLocal · Simplificando la opinión de tus clientes
        </p>
      </div>
    </div>
  </div>
</body>
</html>
      `,
    });

    console.log('Email de bienvenida enviado:', result);
    return { success: true, id: result.data?.id };
  } catch (error) {
    console.error('Error enviando email de bienvenida:', error);
    return { success: false, error };
  }
}

// Email de notificación de referido
export async function sendReferralNotification(data: ReferralNotificationData) {
  try {
    const { referrerEmail, referrerName, referredBusinessName, newBalance, referralCount } = data;
    const resend = getResend();

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: referrerEmail,
      subject: `🎉 ¡Nuevo referido! ${referredBusinessName} usó tu código`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #F59E0B 0%, #EF4444 100%); padding: 40px 30px; text-align: center;">
        <div style="font-size: 48px; margin-bottom: 10px;">🎉</div>
        <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">¡Tienes un nuevo referido!</h1>
      </div>
      
      <!-- Content -->
      <div style="padding: 40px 30px;">
        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
          Hola <strong>${referrerName}</strong>,
        </p>
        
        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
          <strong>${referredBusinessName}</strong> se ha suscrito a ValoraLocal usando tu código de referido.
        </p>
        
        <!-- Reward Box -->
        <div style="background: linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%); border-radius: 12px; padding: 24px; margin-bottom: 24px; text-align: center;">
          <p style="color: #065F46; font-size: 14px; margin: 0 0 8px;">Se han agregado a tu saldo</p>
          <p style="color: #047857; font-size: 36px; font-weight: 700; margin: 0;">+$2.000 CLP</p>
        </div>
        
        <!-- Stats -->
        <div style="display: flex; gap: 16px; margin-bottom: 24px;">
          <div style="flex: 1; background: #F9FAFB; border-radius: 12px; padding: 16px; text-align: center;">
            <p style="color: #6B7280; font-size: 12px; margin: 0 0 4px;">Total referidos</p>
            <p style="color: #111827; font-size: 24px; font-weight: 700; margin: 0;">${referralCount}/10</p>
          </div>
          <div style="flex: 1; background: #F9FAFB; border-radius: 12px; padding: 16px; text-align: center;">
            <p style="color: #6B7280; font-size: 12px; margin: 0 0 4px;">Saldo acumulado</p>
            <p style="color: #059669; font-size: 24px; font-weight: 700; margin: 0;">$${newBalance.toLocaleString('es-CL')}</p>
          </div>
        </div>
        
        <p style="color: #6B7280; font-size: 14px; line-height: 1.6; margin: 0; padding: 16px; background: #F9FAFB; border-radius: 8px;">
          💡 <strong>¿Cómo cobrar?</strong> Solicita tu pago enviando un email a 
          <a href="mailto:pagos@valoralocal.cl" style="color: #3B82F6;">pagos@valoralocal.cl</a> 
          con tu código de referido y datos de transferencia.
        </p>
      </div>
      
      <!-- Footer -->
      <div style="background: #F9FAFB; padding: 24px 30px; text-align: center; border-top: 1px solid #E5E7EB;">
        <p style="color: #6B7280; font-size: 12px; margin: 0;">
          © 2026 ValoraLocal · Gracias por recomendar nuestro servicio
        </p>
      </div>
    </div>
  </div>
</body>
</html>
      `,
    });

    console.log('Email de notificación de referido enviado:', result);
    return { success: true, id: result.data?.id };
  } catch (error) {
    console.error('Error enviando notificación de referido:', error);
    return { success: false, error };
  }
}

// Email de notificación de nueva reseña
interface NewReviewEmailData {
  businessEmail: string;
  businessName: string;
  rating: number;
  comment?: string;
  dashboardUrl: string;
}

export async function sendNewReviewNotification(data: NewReviewEmailData) {
  try {
    const { businessEmail, businessName, rating, comment, dashboardUrl } = data;
    const resend = getResend();

    const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);
    const isNegative = rating <= 2;
    const headerColor = isNegative 
      ? 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)'
      : rating <= 3 
        ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'
        : 'linear-gradient(135deg, #10B981 0%, #059669 100%)';
    
    const emoji = isNegative ? '⚠️' : rating <= 3 ? '📝' : '🌟';
    const title = isNegative 
      ? '¡Atención! Nueva reseña que requiere seguimiento'
      : rating <= 3 
        ? 'Nueva reseña recibida'
        : '¡Excelente! Nueva reseña positiva';

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: businessEmail,
      subject: `${emoji} ${businessName}: Nueva reseña de ${rating} estrella${rating !== 1 ? 's' : ''}`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
      <!-- Header -->
      <div style="background: ${headerColor}; padding: 40px 30px; text-align: center;">
        <div style="font-size: 48px; margin-bottom: 10px;">${emoji}</div>
        <h1 style="color: white; margin: 0; font-size: 22px; font-weight: 700;">${title}</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 14px;">${businessName}</p>
      </div>
      
      <!-- Content -->
      <div style="padding: 40px 30px;">
        <!-- Rating Stars -->
        <div style="text-align: center; margin-bottom: 24px;">
          <p style="color: #6B7280; font-size: 14px; margin: 0 0 8px;">Calificación recibida</p>
          <p style="font-size: 36px; margin: 0; color: #FBBF24; letter-spacing: 4px;">${stars}</p>
          <p style="color: #374151; font-size: 24px; font-weight: 700; margin: 8px 0 0;">${rating}/5</p>
        </div>
        
        ${comment ? `
        <!-- Comment -->
        <div style="background: #F9FAFB; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <p style="color: #6B7280; font-size: 12px; font-weight: 600; margin: 0 0 8px; text-transform: uppercase;">Comentario del cliente</p>
          <p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0; font-style: italic;">"${comment}"</p>
        </div>
        ` : ''}
        
        ${isNegative ? `
        <!-- Alert for negative reviews -->
        <div style="background: #FEF2F2; border: 1px solid #FECACA; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
          <p style="color: #991B1B; font-size: 14px; margin: 0; line-height: 1.5;">
            <strong>💡 Consejo:</strong> Las reseñas negativas son oportunidades para mejorar. 
            Considera contactar al cliente si dejó su email para resolver cualquier problema.
          </p>
        </div>
        ` : ''}
        
        <!-- CTA Button -->
        <a href="${dashboardUrl}" style="display: block; background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%); color: white; text-decoration: none; text-align: center; padding: 16px 24px; border-radius: 12px; font-weight: 600; font-size: 16px;">
          Ver en Dashboard →
        </a>
      </div>
      
      <!-- Footer -->
      <div style="background: #F9FAFB; padding: 24px 30px; text-align: center; border-top: 1px solid #E5E7EB;">
        <p style="color: #6B7280; font-size: 12px; margin: 0;">
          © 2026 ValoraLocal · Notificación automática de nueva reseña
        </p>
      </div>
    </div>
  </div>
</body>
</html>
      `,
    });

    console.log('Email de nueva reseña enviado:', result);
    return { success: true, id: result.data?.id };
  } catch (error) {
    console.error('Error enviando notificación de nueva reseña:', error);
    return { success: false, error };
  }
}

// Email interno: nuevo lead desde landing
export async function sendLeadNotification(leadEmail: string) {
  try {
    const resend = getResend();

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: 'contacto.valoralocal@gmail.com',
      subject: `🎯 Nuevo lead interesado: ${leadEmail}`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 12px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <h2 style="color: #3B82F6; margin: 0 0 20px;">🎯 Nuevo Lead</h2>
    <p style="color: #374151; margin: 0 0 16px;">Alguien dejó su email en la landing:</p>
    <div style="background: #F3F4F6; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
      <p style="margin: 0; font-size: 18px; font-weight: bold; color: #1F2937;">${leadEmail}</p>
    </div>
    <p style="color: #6B7280; font-size: 14px; margin: 0;">Contacta a este lead lo antes posible.</p>
  </div>
</body>
</html>
      `,
    });

    console.log('Notificación de lead enviada:', result);
    return { success: true, id: result.data?.id };
  } catch (error) {
    console.error('Error enviando notificación de lead:', error);
    return { success: false, error };
  }
}

// Email interno: nueva suscripción
interface NewSubscriptionData {
  businessName: string;
  email: string;
  plan: string;
  amount: number;
  referralCode?: string | null;
}

export async function sendNewSubscriptionNotification(data: NewSubscriptionData) {
  try {
    const resend = getResend();
    const { businessName, email, plan, amount, referralCode } = data;

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: 'contacto.valoralocal@gmail.com',
      subject: `💰 ¡Nueva suscripción! ${businessName}`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <div style="background: linear-gradient(135deg, #10B981, #059669); padding: 24px; text-align: center;">
      <h2 style="color: white; margin: 0;">💰 ¡Nueva Suscripción!</h2>
    </div>
    <div style="padding: 30px;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #E5E7EB; color: #6B7280;">Negocio</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #E5E7EB; font-weight: bold; color: #1F2937; text-align: right;">${businessName}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #E5E7EB; color: #6B7280;">Email</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #E5E7EB; color: #1F2937; text-align: right;">${email}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #E5E7EB; color: #6B7280;">Plan</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #E5E7EB; color: #1F2937; text-align: right;">${plan}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #E5E7EB; color: #6B7280;">Monto</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #E5E7EB; font-weight: bold; color: #059669; text-align: right;">$${amount.toLocaleString('es-CL')} CLP</td>
        </tr>
        ${referralCode ? `
        <tr>
          <td style="padding: 12px 0; color: #6B7280;">Código referido</td>
          <td style="padding: 12px 0; color: #F59E0B; font-weight: bold; text-align: right;">${referralCode}</td>
        </tr>
        ` : ''}
      </table>
    </div>
  </div>
</body>
</html>
      `,
    });

    console.log('Notificación de nueva suscripción enviada:', result);
    return { success: true, id: result.data?.id };
  } catch (error) {
    console.error('Error enviando notificación de suscripción:', error);
    return { success: false, error };
  }
}
