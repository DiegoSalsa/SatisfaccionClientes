'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface BusinessInfo {
  private_token: string;
  business_name: string;
}

function ConfirmacionContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'pending' | 'error'>('loading');
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo | null>(null);
  const [checkingBusiness, setCheckingBusiness] = useState(false);
  
  const preapproval_id = searchParams.get('preapproval_id');
  const external_reference = searchParams.get('external_reference');
  const statusParam = searchParams.get('status');

  // Función para verificar si el negocio ya fue creado
  const checkBusiness = useCallback(async () => {
    if (!preapproval_id || businessInfo) return;
    
    try {
      const response = await fetch(`/api/check-business?subscription_id=${preapproval_id}`);
      const data = await response.json();
      
      if (data.found) {
        setBusinessInfo({
          private_token: data.private_token,
          business_name: data.business_name,
        });
      }
    } catch (error) {
      console.error('Error checking business:', error);
    }
  }, [preapproval_id, businessInfo]);

  useEffect(() => {
    // Determinar el estado basado en los parámetros de MercadoPago
    if (statusParam === 'authorized' || statusParam === 'active') {
      setStatus('success');
    } else if (statusParam === 'pending') {
      setStatus('pending');
    } else if (preapproval_id) {
      // Si hay preapproval_id pero no status claro, asumir éxito
      setStatus('success');
    } else {
      setStatus('error');
    }
  }, [statusParam, preapproval_id]);

  // Polling para verificar si el negocio ya fue creado
  useEffect(() => {
    if (status !== 'success' || !preapproval_id || businessInfo) return;

    // Verificar inmediatamente
    checkBusiness();

    // Luego verificar cada 3 segundos durante 2 minutos máximo
    const interval = setInterval(() => {
      if (!businessInfo) {
        checkBusiness();
      }
    }, 3000);

    // Detener después de 2 minutos
    const timeout = setTimeout(() => {
      clearInterval(interval);
      setCheckingBusiness(false);
    }, 120000);

    setCheckingBusiness(true);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [status, preapproval_id, businessInfo, checkBusiness]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 text-center">
        {status === 'loading' && (
          <>
            <div className="w-16 h-16 mx-auto mb-4 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              Procesando tu suscripción...
            </h1>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              ¡Suscripción exitosa!
            </h1>
            
            {businessInfo ? (
              <>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Tu cuenta <strong className="text-gray-900 dark:text-white">{businessInfo.business_name}</strong> ha sido activada correctamente.
                </p>
                
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
                  <p className="text-sm text-green-800 dark:text-green-300 mb-2">
                    <strong>🎉 Tu dashboard está listo:</strong>
                  </p>
                  <code className="text-xs bg-green-100 dark:bg-green-900/40 px-2 py-1 rounded block overflow-x-auto">
                    {typeof window !== 'undefined' ? window.location.origin : ''}/dashboard/{businessInfo.private_token}
                  </code>
                </div>

                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  También recibirás estas credenciales por email.
                </p>

                <Link
                  href={`/dashboard/${businessInfo.private_token}`}
                  className="inline-block w-full bg-green-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-green-700 transition-colors mb-3"
                >
                  Ir a mi Dashboard
                </Link>
                <Link
                  href="/"
                  className="inline-block w-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold py-3 px-6 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  Volver al inicio
                </Link>
              </>
            ) : (
              <>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Tu cuenta está siendo activada. En unos segundos verás el enlace a tu dashboard aquí.
                </p>
                
                {checkingBusiness && (
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">Activando tu cuenta...</span>
                  </div>
                )}

                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    <strong>ID de suscripción:</strong><br />
                    <code className="text-xs">{preapproval_id || external_reference}</code>
                  </p>
                </div>
                
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  También recibirás tus credenciales por email.
                </p>
                
                <Link
                  href="/"
                  className="inline-block w-full bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Volver al inicio
                </Link>
              </>
            )}
          </>
        )}

        {status === 'pending' && (
          <>
            <div className="w-16 h-16 mx-auto mb-4 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Pago pendiente
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Tu suscripción está pendiente de confirmación. Una vez que se procese el pago, recibirás un email con tus credenciales.
            </p>
            <Link
              href="/"
              className="inline-block w-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white font-semibold py-3 px-6 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Volver al inicio
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Algo salió mal
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              No pudimos procesar tu suscripción. Por favor intenta nuevamente o contáctanos si el problema persiste.
            </p>
            <Link
              href="/#pricing"
              className="inline-block w-full bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Intentar de nuevo
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function ConfirmacionSuscripcion() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center p-4">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ConfirmacionContent />
    </Suspense>
  );
}
