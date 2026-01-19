export default function JsonLd() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "ValoraLocal",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "description": "Sistema de encuestas de satisfacción del cliente para negocios locales en Chile. Crea encuestas QR, recibe feedback en tiempo real y mejora tu servicio.",
    "url": "https://valoralocal.cl",
    "author": {
      "@type": "Organization",
      "name": "ValoraLocal",
      "url": "https://valoralocal.cl"
    },
    "offers": [
      {
        "@type": "Offer",
        "name": "Plan Pro Mensual",
        "price": "9990",
        "priceCurrency": "CLP",
        "priceValidUntil": "2026-12-31",
        "availability": "https://schema.org/InStock"
      },
      {
        "@type": "Offer",
        "name": "Plan Pro Anual",
        "price": "99990",
        "priceCurrency": "CLP",
        "priceValidUntil": "2026-12-31",
        "availability": "https://schema.org/InStock"
      }
    ],
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "5",
      "ratingCount": "1",
      "bestRating": "5",
      "worstRating": "1"
    }
  };

  const organizationData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "ValoraLocal",
    "url": "https://valoralocal.cl",
    "logo": "https://valoralocal.cl/logo.png",
    "description": "Plataforma de encuestas de satisfacción para negocios locales en Chile",
    "email": "contacto.valoralocal@gmail.com",
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "CL"
    },
    "sameAs": []
  };

  const faqData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "¿Cómo funciona ValoraLocal?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Tu negocio recibe un QR único. Tus clientes lo escanean, responden 3 preguntas simples, y tú ves los resultados en tiempo real en tu dashboard."
        }
      },
      {
        "@type": "Question",
        "name": "¿Necesito conocimientos técnicos?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "No, solo necesitas imprimir el QR y mostrarlo a tus clientes. El sistema se encarga del resto."
        }
      },
      {
        "@type": "Question",
        "name": "¿Puedo personalizar el QR?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Sí, puedes subir el logo de tu negocio y el QR se generará automáticamente con él."
        }
      },
      {
        "@type": "Question",
        "name": "¿Cómo exporto mis datos?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Desde el dashboard puedes exportar todas las respuestas a Excel con un solo clic."
        }
      },
      {
        "@type": "Question",
        "name": "¿Hay límite de respuestas?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "No, puedes recibir respuestas ilimitadas sin costo adicional."
        }
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqData) }}
      />
    </>
  );
}
