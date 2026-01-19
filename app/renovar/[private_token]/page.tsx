'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/client';
import { CheckoutModal } from '@/components/CheckoutModal';

export default function RenovarPage() {
  const params = useParams();
  const router = useRouter();
  const privateToken = params.private_token as string;
  
  const [loading, setLoading] = useState(true);
  const [business, setBusiness] = useState<any>(null);
  const [error, setError] = useState('');
  const [checkoutPlan, setCheckoutPlan] = useState<'pro_mensual' | 'pro_anual' | null>(null);

  useEffect(() => {
    const fetchBusiness = async () => {
      try {
        const q = query(
          collection(db, 'businesses'),
          where('private_token', '==', privateToken)
        );
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
          setError('Negocio no encontrado');
          setLoading(false);
          return;
        }

        const businessData = snapshot.docs[0].data();
        setBusiness({
          id: snapshot.docs[0].id,
          ...businessData,
          expires_at: businessData.expires_at?.toDate(),
        });
      } catch (err) {
        setError('Error al cargar datos');
      } finally {
        setLoading(false);
      }
    };

    if (privateToken) {
      fetchBusiness();
    }
  }, [privateToken]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-zinc-900 dark:to-black flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-zinc-900 dark:to-black flex items-center justify-center p-4">
        <div className="bg-white dark:bg-zinc-800 rounded-2xl p-8 max-w-md text-center shadow-xl">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {error || 'Negocio no encontrado'}
          </h1>
          <p className="text-gray-600 dark:text-zinc-400 mb-6">
            El enlace puede haber expirado o ser incorrecto.
          </p>
          <a
            href="/"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
          >
            Ir al inicio
          </a>
        </div>
      </div>
    );
  }

  const isExpired = business.expires_at && business.expires_at < new Date();
  const daysLeft = business.expires_at 
    ? Math.ceil((business.expires_at.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-zinc-900 dark:to-black p-4">
      <div className="max-w-2xl mx-auto pt-12">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Renovar Suscripción
          </h1>
          <p className="text-gray-600 dark:text-zinc-400">
            {business.name}
          </p>
        </div>

        {/* Status Card */}
        <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm text-gray-500 dark:text-zinc-400">Estado actual</p>
              <p className={`text-lg font-semibold ${isExpired ? 'text-red-600' : 'text-green-600'}`}>
                {isExpired ? 'Expirado' : 'Activo'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 dark:text-zinc-400">
                {isExpired ? 'Expiró el' : 'Expira el'}
              </p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {business.expires_at?.toLocaleDateString('es-CL', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>

          {!isExpired && daysLeft <= 7 && (
            <div className={`rounded-xl p-4 ${
              daysLeft <= 1 ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' :
              daysLeft <= 3 ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800' :
              'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
            }`}>
              <p className={`text-sm font-medium ${
                daysLeft <= 1 ? 'text-red-700 dark:text-red-400' :
                daysLeft <= 3 ? 'text-amber-700 dark:text-amber-400' :
                'text-blue-700 dark:text-blue-400'
              }`}>
                ⚠️ {daysLeft === 1 ? '¡Tu suscripción expira mañana!' : `Quedan ${daysLeft} días para que expire tu suscripción`}
              </p>
            </div>
          )}

          {isExpired && (
            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800">
              <p className="text-sm font-medium text-red-700 dark:text-red-400">
                ⚠️ Tu suscripción ha expirado. Renueva ahora para seguir recibiendo feedback de tus clientes.
              </p>
            </div>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Plan Mensual */}
          <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl p-6 border-2 border-transparent hover:border-blue-500 transition-colors">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Pro Mensual</h3>
            <div className="mb-4">
              <span className="text-4xl font-bold text-gray-900 dark:text-white">$9.990</span>
              <span className="text-gray-500 dark:text-zinc-400"> CLP/mes</span>
            </div>
            <ul className="space-y-2 mb-6 text-sm text-gray-600 dark:text-zinc-400">
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                30 días adicionales
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Encuestas ilimitadas
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Dashboard completo
              </li>
            </ul>
            <button
              onClick={() => setCheckoutPlan('pro_mensual')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition-colors"
            >
              Renovar Mensual
            </button>
          </div>

          {/* Plan Anual */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-xl p-6 text-white relative overflow-hidden">
            <div className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full">
              AHORRA 17%
            </div>
            <h3 className="text-xl font-bold mb-2">Pro Anual</h3>
            <div className="mb-4">
              <span className="text-4xl font-bold">$99.990</span>
              <span className="text-blue-200"> CLP/año</span>
            </div>
            <ul className="space-y-2 mb-6 text-sm text-blue-100">
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                365 días adicionales
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Encuestas ilimitadas
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                2 meses gratis
              </li>
            </ul>
            <button
              onClick={() => setCheckoutPlan('pro_anual')}
              className="w-full bg-white text-blue-600 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-colors"
            >
              Renovar Anual
            </button>
          </div>
        </div>

        {/* Back link */}
        <div className="text-center">
          <a
            href={`/dashboard/${privateToken}`}
            className="text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200 text-sm"
          >
            ← Volver al dashboard
          </a>
        </div>
      </div>

      {/* Checkout Modal - reuse existing but for renewal */}
      {checkoutPlan && (
        <CheckoutModal
          isOpen={!!checkoutPlan}
          onClose={() => setCheckoutPlan(null)}
          planId={checkoutPlan}
          planName={checkoutPlan === 'pro_anual' ? 'Pro Anual (Renovación)' : 'Pro Mensual (Renovación)'}
          planPrice={checkoutPlan === 'pro_anual' ? '$99.990 CLP/año' : '$9.990 CLP/mes'}
        />
      )}
    </div>
  );
}
