'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    fbq: (...args: unknown[]) => void;
  }
}

interface MetaPixelPurchaseProps {
  value: number;
  currency?: string;
  contentName?: string;
}

export function MetaPixelPurchase({ value, currency = 'CLP', contentName = 'ValoraLocal Pro' }: MetaPixelPurchaseProps) {
  useEffect(() => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'Purchase', {
        value: value,
        currency: currency,
        content_name: contentName,
      });
    }
  }, [value, currency, contentName]);

  return null;
}

// Función para disparar eventos manualmente
export function trackMetaEvent(eventName: string, params?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', eventName, params);
  }
}

// Eventos comunes
export const MetaEvents = {
  // Cuando inician checkout
  initiateCheckout: (value: number, currency = 'CLP') => {
    trackMetaEvent('InitiateCheckout', { value, currency });
  },
  
  // Cuando completan la compra
  purchase: (value: number, currency = 'CLP', contentName = 'ValoraLocal Pro') => {
    trackMetaEvent('Purchase', { value, currency, content_name: contentName });
  },
  
  // Cuando ven la página de precios
  viewContent: (contentName: string) => {
    trackMetaEvent('ViewContent', { content_name: contentName });
  },
  
  // Lead (cuando dejan su email)
  lead: (email?: string) => {
    trackMetaEvent('Lead', email ? { email } : undefined);
  },
};
