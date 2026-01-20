'use client';

import { useState } from 'react';

type PlanId = 'pro_mensual' | 'pro_anual' | 'test_plan';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  planId: PlanId;
  planName: string;
  planPrice: string;
}

export function CheckoutModal({ isOpen, onClose, planId, planName, planPrice }: CheckoutModalProps) {
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'mercadopago' | 'paypal'>('mercadopago');

  if (!isOpen) return null;

  const validateForm = () => {
    if (!businessName.trim()) {
      setError('Ingresa el nombre de tu negocio');
      return false;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Ingresa un email válido');
      return false;
    }
    setError('');
    return true;
  };

  const handleMercadoPago = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/mercadopago/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          email,
          businessName,
          referralCode: referralCode.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear la suscripción');
      }

      if (data.init_point) {
        window.location.href = data.init_point;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setLoading(false);
    }
  };

  const handlePayPal = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    setError('');

    try {
      // Anual = pago único, Mensual = suscripción recurrente
      const endpoint = planId === 'pro_anual' 
        ? '/api/paypal/create-order' 
        : '/api/paypal/create-subscription';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          email,
          businessName,
          referralCode: referralCode.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al procesar el pago');
      }

      // Redirigir a PayPal
      if (data.approveUrl) {
        window.location.href = data.approveUrl;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setLoading(false);
    }
  };

  // Precio en USD para mostrar
  const usdPrice = planId === 'pro_anual' ? '$99.99 USD' : '$9.99 USD/mes';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            {planName}
          </h3>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
            {planPrice}
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
              Nombre de tu negocio
            </label>
            <input
              type="text"
              required
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Ej: Restaurante El Buen Sabor"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white placeholder-gray-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
              Email de contacto
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white placeholder-gray-400"
            />
            <p className="text-xs text-gray-500 dark:text-zinc-500 mt-1">
              Aquí recibirás tus credenciales de acceso
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
              Código de referido <span className="text-gray-400 dark:text-zinc-500 font-normal">(opcional)</span>
            </label>
            <input
              type="text"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
              placeholder="Ej: CAFE1234"
              maxLength={15}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white placeholder-gray-400 uppercase tracking-wider"
            />
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm p-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Método de pago */}
          <div className="pt-2">
            <p className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-3">
              Método de pago
            </p>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                type="button"
                onClick={() => setPaymentMethod('mercadopago')}
                className={`p-3 rounded-xl border-2 transition-all ${
                  paymentMethod === 'mercadopago'
                    ? 'border-[#00bcff] bg-[#00bcff]/10'
                    : 'border-gray-200 dark:border-zinc-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-6 h-6" viewBox="0 0 48 48" fill="none">
                    <circle cx="24" cy="24" r="24" fill="#00bcff"/>
                    <path d="M34.5 20.5c0-5.5-4.5-10-10-10s-10 4.5-10 10c0 3.5 1.8 6.5 4.5 8.3v8.7l5.5-3.5 5.5 3.5v-8.7c2.7-1.8 4.5-4.8 4.5-8.3z" fill="white"/>
                  </svg>
                  <span className="text-sm font-semibold text-gray-700 dark:text-white">Mercado Pago</span>
                </div>
              </button>
              
              <button
                type="button"
                onClick={() => setPaymentMethod('paypal')}
                className={`p-3 rounded-xl border-2 transition-all ${
                  paymentMethod === 'paypal'
                    ? 'border-[#0070ba] bg-[#0070ba]/10'
                    : 'border-gray-200 dark:border-zinc-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#0070ba">
                    <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 0 1 .923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.471z"/>
                  </svg>
                  <span className="text-sm font-medium text-gray-700 dark:text-zinc-300">PayPal</span>
                </div>
              </button>
            </div>

            {paymentMethod === 'mercadopago' ? (
              <button
                onClick={handleMercadoPago}
                disabled={loading}
                className="w-full bg-[#00bcff] hover:bg-[#00a8e8] disabled:bg-[#00bcff]/50 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                    Pagar {planPrice}
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handlePayPal}
                disabled={loading}
                className="w-full bg-[#0070ba] hover:bg-[#003087] disabled:bg-[#0070ba]/50 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 0 1 .923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.471z"/>
                    </svg>
                    Suscribirse con PayPal ({usdPrice})
                  </>
                )}
              </button>
            )}
          </div>

          <p className="text-xs text-center text-gray-500 dark:text-zinc-500">
            {paymentMethod === 'mercadopago' 
              ? 'Serás redirigido a MercadoPago para completar el pago'
              : 'Pago seguro procesado por PayPal'
            }
          </p>
        </div>
      </div>
    </div>
  );
}
