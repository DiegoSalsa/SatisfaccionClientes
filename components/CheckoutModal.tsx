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
                  <svg className="h-5" viewBox="0 0 156 64" fill="none">
                    <path d="M60.463 45.022c0 3.627-2.59 6.105-6.325 6.105-3.735 0-6.325-2.478-6.325-6.105 0-3.628 2.59-6.106 6.325-6.106 3.735 0 6.325 2.478 6.325 6.106zm-16.65 0c0 5.855 4.325 10.18 10.325 10.18s10.325-4.325 10.325-10.18c0-5.856-4.325-10.181-10.325-10.181s-10.325 4.325-10.325 10.18z" fill="#00bcff"/>
                    <path d="M78.138 38.916c-3.735 0-6.325 2.478-6.325 6.106 0 3.627 2.59 6.105 6.325 6.105 3.735 0 6.325-2.478 6.325-6.105 0-3.628-2.59-6.106-6.325-6.106zm0-4.075c6 0 10.325 4.325 10.325 10.18 0 5.856-4.325 10.181-10.325 10.181s-10.325-4.325-10.325-10.18c0-5.856 4.325-10.181 10.325-10.181z" fill="#00bcff"/>
                    <path d="M105.462 35.29v19.462h-4V44.571c0-3.178-1.853-5.655-5.138-5.655-3.286 0-5.139 2.477-5.139 5.655v10.18h-4V35.29h4v2.028c1.403-1.803 3.481-2.477 5.589-2.477 4.775 0 8.688 3.402 8.688 9.058z" fill="#00bcff"/>
                    <path d="M123.912 45.022c0-3.628-2.59-6.106-6.325-6.106-3.736 0-6.325 2.478-6.325 6.106 0 3.627 2.59 6.105 6.325 6.105 3.735 0 6.325-2.478 6.325-6.105zm-16.65 9.73V27.187h4v10.631c1.628-2.027 4.1-2.977 6.775-2.977 5.55 0 9.875 4.325 9.875 10.18 0 5.856-4.325 10.181-9.875 10.181-2.675 0-5.147-.95-6.775-2.978v2.528h-4z" fill="#00bcff"/>
                    <path d="M143.587 38.916c-3.735 0-6.325 2.478-6.325 6.106 0 3.627 2.59 6.105 6.325 6.105 3.736 0 6.325-2.478 6.325-6.105 0-3.628-2.59-6.106-6.325-6.106zm0-4.075c6 0 10.325 4.325 10.325 10.18 0 5.856-4.325 10.181-10.325 10.181-6.001 0-10.325-4.325-10.325-10.18 0-5.856 4.324-10.181 10.325-10.181z" fill="#00bcff"/>
                    <path d="M34.088 18.744c-4.18-4.744-10.427-7.744-17.394-7.744C7.466 11 0 18.466 0 27.694c0 5.28 2.448 9.986 6.271 13.059a8.263 8.263 0 01-.271-2.059c0-4.598 3.735-8.333 8.333-8.333 1.94 0 3.725.665 5.14 1.779l11.054-11.054a16.54 16.54 0 013.561-2.342z" fill="#00bcff"/>
                    <path d="M16.694 55.389c9.228 0 16.694-7.466 16.694-16.695 0-4.18-1.536-8.003-4.074-10.937L18.26 38.81a8.294 8.294 0 01-3.927.995c-4.598 0-8.333-3.735-8.333-8.333 0-1.472.383-2.855 1.054-4.054C2.877 30.49 0 35.196 0 40.694 0 49.923 7.466 57.389 16.694 57.389v-2z" fill="#2D3277"/>
                  </svg>
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
