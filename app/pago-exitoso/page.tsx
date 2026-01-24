'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { MetaEvents } from '@/components/MetaPixel';
import Link from 'next/link';

function PagoExitosoContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const token = searchParams.get('token');
  const amount = searchParams.get('amount');
  const method = searchParams.get('method');

  useEffect(() => {
    // Disparar evento de compra para Meta Pixel
    if (amount) {
      MetaEvents.purchase(Number(amount), 'CLP', 'ValoraLocal Pro');
    }
    
    // Redirigir al dashboard después de 3 segundos
    if (token) {
      const timeout = setTimeout(() => {
        router.push(`/dashboard/${token}`);
      }, 3000);
      
      return () => clearTimeout(timeout);
    }
  }, [amount, token, router]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-8 text-center">
        <div className="w-20 h-20 mx-auto mb-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
          <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          ¡Pago exitoso!
        </h1>
        
        <p className="text-gray-600 dark:text-zinc-400 mb-6">
          Tu suscripción a ValoraLocal Pro ha sido activada correctamente.
          {method === 'paypal' && ' Pago procesado con PayPal.'}
        </p>
        
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-zinc-500 mb-6">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          Redirigiendo a tu dashboard...
        </div>
        
        {token && (
          <Link
            href={`/dashboard/${token}`}
            className="inline-block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
          >
            Ir al dashboard ahora
          </Link>
        )}
      </div>
    </div>
  );
}

export default function PagoExitosoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <PagoExitosoContent />
    </Suspense>
  );
}
