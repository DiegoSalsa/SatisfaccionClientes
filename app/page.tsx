"use client";
import { useState } from "react";
import { ThemeToggle } from "@/components/ThemeProvider";

export default function Home() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
      setEmail("");
    }
  };

  const faqs = [
    {
      question: "¿Cómo obtengo mi enlace de encuesta?",
      answer: "Al registrarte, recibirás automáticamente tu enlace único de encuesta (ej: /encuesta/tu-negocio) y tu enlace privado al dashboard."
    },
    {
      question: "¿Es gratis usar Satisfacción?",
      answer: "Sí, ofrecemos un plan gratuito con todas las funciones básicas. Los planes de pago incluyen características avanzadas como exportación ilimitada y soporte prioritario."
    },
    {
      question: "¿Puedo personalizar el QR con mi logo?",
      answer: "¡Sí! En el dashboard puedes generar un código QR con tu logo en el centro, listo para imprimir o compartir digitalmente."
    },
    {
      question: "¿Los datos de mis clientes están seguros?",
      answer: "Absolutamente. Usamos Firebase con encriptación de datos. Solo tú tienes acceso a las opiniones de tu negocio mediante tu enlace privado."
    },
    {
      question: "¿Puedo exportar los datos?",
      answer: "Sí, puedes exportar todas las opiniones a Excel o CSV con un solo clic, incluyendo filtros por fecha, comuna, edad y rating."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-black dark:via-zinc-900 dark:to-black transition-colors">
      {/* Theme Toggle */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      {/* Navigation */}
      <header className="px-6 py-6 sticky top-0 bg-white/80 dark:bg-black/80 backdrop-blur-md z-40 border-b border-gray-100 dark:border-zinc-800">
        <nav className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-3xl">⭐</span>
            <span className="text-xl font-bold text-gray-800 dark:text-white">Satisfacción</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm">
            <a href="#features" className="text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white transition-colors">Características</a>
            <a href="#pricing" className="text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white transition-colors">Precios</a>
            <a href="#faq" className="text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white transition-colors">FAQ</a>
            <a href="#contact" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full font-medium transition-colors">
              Comenzar
            </a>
          </div>
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center mb-16">
            <div className="inline-block bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
              🚀 +60 negocios ya confían en nosotros
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
              Conoce lo que piensan<br />
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                tus clientes
              </span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-zinc-300 max-w-2xl mx-auto mb-10">
              Sistema de encuestas de satisfacción simple y efectivo. 
              Recoge opiniones, mejora tu servicio, haz crecer tu negocio.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <a 
                href="#contact" 
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all hover:scale-105 shadow-lg shadow-blue-600/25"
              >
                Comenzar Gratis
              </a>
              <a 
                href="/encuesta/negocio-1" 
                className="bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 text-gray-800 dark:text-white px-8 py-4 rounded-full font-semibold text-lg transition-all border border-gray-200 dark:border-zinc-700"
              >
                Ver Demo →
              </a>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="bg-white dark:bg-zinc-900 border-y border-gray-100 dark:border-zinc-800">
          <div className="max-w-6xl mx-auto px-6 py-16">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-blue-600 dark:text-blue-400 mb-2">60+</div>
                <div className="text-gray-600 dark:text-zinc-400">Negocios activos</div>
              </div>
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-purple-600 dark:text-purple-400 mb-2">10K+</div>
                <div className="text-gray-600 dark:text-zinc-400">Opiniones recolectadas</div>
              </div>
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-green-600 dark:text-green-400 mb-2">4.8</div>
                <div className="text-gray-600 dark:text-zinc-400">Rating promedio</div>
              </div>
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-orange-600 dark:text-orange-400 mb-2">30s</div>
                <div className="text-gray-600 dark:text-zinc-400">Tiempo de encuesta</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Todo lo que necesitas
            </h2>
            <p className="text-gray-600 dark:text-zinc-400 max-w-2xl mx-auto">
              Herramientas poderosas para entender a tus clientes y mejorar tu negocio
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-800 hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/50 rounded-xl flex items-center justify-center text-2xl mb-4">
                📱
              </div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Encuesta en 30 segundos</h3>
              <p className="text-gray-600 dark:text-zinc-400">
                Sin registros ni complicaciones. El cliente solo califica y comenta.
              </p>
            </div>
            
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-800 hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/50 rounded-xl flex items-center justify-center text-2xl mb-4">
                📊
              </div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Gráficos de tendencia</h3>
              <p className="text-gray-600 dark:text-zinc-400">
                Visualiza la evolución de satisfacción por semana y distribución por edad.
              </p>
            </div>
            
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-800 hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="w-14 h-14 bg-green-100 dark:bg-green-900/50 rounded-xl flex items-center justify-center text-2xl mb-4">
                📥
              </div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Exportar Excel/CSV</h3>
              <p className="text-gray-600 dark:text-zinc-400">
                Descarga todos los datos filtrados para análisis externo con un clic.
              </p>
            </div>
            
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-800 hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="w-14 h-14 bg-orange-100 dark:bg-orange-900/50 rounded-xl flex items-center justify-center text-2xl mb-4">
                🔍
              </div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Filtros avanzados</h3>
              <p className="text-gray-600 dark:text-zinc-400">
                Filtra por fecha, comuna, rango de edad y calificación específica.
              </p>
            </div>
            
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-800 hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="w-14 h-14 bg-pink-100 dark:bg-pink-900/50 rounded-xl flex items-center justify-center text-2xl mb-4">
                📷
              </div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">QR con tu logo</h3>
              <p className="text-gray-600 dark:text-zinc-400">
                Genera códigos QR personalizados con el logo de tu negocio al centro.
              </p>
            </div>
            
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-800 hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="w-14 h-14 bg-red-100 dark:bg-red-900/50 rounded-xl flex items-center justify-center text-2xl mb-4">
                🛡️
              </div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Anti-spam</h3>
              <p className="text-gray-600 dark:text-zinc-400">
                Rate limiting inteligente para evitar opiniones duplicadas o spam.
              </p>
            </div>
          </div>
        </section>

        {/* Dashboard Preview */}
        <section className="bg-gradient-to-b from-transparent to-blue-50 dark:to-zinc-900/50 py-20">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Dashboard intuitivo
              </h2>
              <p className="text-gray-600 dark:text-zinc-400">
                Todo lo que necesitas saber de tu negocio en un solo lugar
              </p>
            </div>
            
            {/* Mock Dashboard */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-zinc-700 overflow-hidden">
              {/* Header mock */}
              <div className="bg-gray-50 dark:bg-zinc-800 px-6 py-4 border-b border-gray-200 dark:border-zinc-700 flex items-center gap-3">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                <div className="flex-1 text-center">
                  <span className="text-sm text-gray-500 dark:text-zinc-400">dashboard.satisfaccion.cl</span>
                </div>
              </div>
              
              {/* Content mock */}
              <div className="p-8">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-xl">🏪</div>
                  <div>
                    <div className="font-bold text-gray-800 dark:text-white">Tu Negocio</div>
                    <div className="text-sm text-gray-500 dark:text-zinc-400">Dashboard de satisfacción</div>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-3 gap-4 mb-8">
                  <div className="bg-gray-50 dark:bg-zinc-800 rounded-xl p-4">
                    <div className="text-sm text-gray-500 dark:text-zinc-400 mb-1">Promedio</div>
                    <div className="text-3xl font-bold text-gray-800 dark:text-white">4.7 <span className="text-yellow-400">★</span></div>
                  </div>
                  <div className="bg-gray-50 dark:bg-zinc-800 rounded-xl p-4">
                    <div className="text-sm text-gray-500 dark:text-zinc-400 mb-1">Total opiniones</div>
                    <div className="text-3xl font-bold text-gray-800 dark:text-white">248</div>
                  </div>
                  <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl p-4 text-white">
                    <div className="text-sm text-blue-100 mb-1">Tu enlace</div>
                    <div className="text-sm font-mono bg-white/20 rounded px-2 py-1">/encuesta/tu-negocio</div>
                  </div>
                </div>
                
                {/* Chart mock */}
                <div className="bg-gray-50 dark:bg-zinc-800 rounded-xl p-4">
                  <div className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-4">📈 Tendencia semanal</div>
                  <div className="flex items-end justify-between h-32 gap-2">
                    {[65, 45, 80, 55, 90, 70, 85].map((h, i) => (
                      <div key={i} className="flex-1 bg-blue-500 rounded-t-md transition-all hover:bg-blue-600" style={{ height: `${h}%` }}></div>
                    ))}
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-gray-400">
                    <span>Lun</span><span>Mar</span><span>Mié</span><span>Jue</span><span>Vie</span><span>Sáb</span><span>Dom</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="max-w-6xl mx-auto px-6 py-20">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-10 md:p-16 shadow-sm border border-gray-100 dark:border-zinc-800">
            <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">¿Cómo funciona?</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-lg shadow-blue-600/25">1</div>
                <h4 className="font-semibold text-gray-800 dark:text-white mb-2 text-lg">Comparte tu enlace</h4>
                <p className="text-gray-600 dark:text-zinc-400">Cada negocio tiene una URL única y un código QR personalizable</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-600 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-lg shadow-purple-600/25">2</div>
                <h4 className="font-semibold text-gray-800 dark:text-white mb-2 text-lg">Cliente responde</h4>
                <p className="text-gray-600 dark:text-zinc-400">Califican de 1-5 estrellas, dejan comentario y datos opcionales</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-green-600 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-lg shadow-green-600/25">3</div>
                <h4 className="font-semibold text-gray-800 dark:text-white mb-2 text-lg">Analiza y mejora</h4>
                <p className="text-gray-600 dark:text-zinc-400">Revisa gráficos, filtra datos y exporta para tomar decisiones</p>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="bg-white dark:bg-zinc-900 border-y border-gray-100 dark:border-zinc-800 py-20">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Lo que dicen nuestros clientes
              </h2>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-gray-50 dark:bg-zinc-800 p-6 rounded-2xl">
                <div className="flex text-yellow-400 mb-4">★★★★★</div>
                <p className="text-gray-700 dark:text-zinc-300 mb-4">
                  &quot;Antes no tenía idea de qué pensaban mis clientes. Ahora puedo mejorar mi servicio basado en datos reales.&quot;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">M</div>
                  <div>
                    <div className="font-medium text-gray-800 dark:text-white">María González</div>
                    <div className="text-sm text-gray-500 dark:text-zinc-400">Restaurante El Buen Sabor</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-zinc-800 p-6 rounded-2xl">
                <div className="flex text-yellow-400 mb-4">★★★★★</div>
                <p className="text-gray-700 dark:text-zinc-300 mb-4">
                  &quot;El QR con nuestro logo quedó espectacular. Lo imprimimos en cada mesa y las opiniones aumentaron 300%.&quot;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold">C</div>
                  <div>
                    <div className="font-medium text-gray-800 dark:text-white">Carlos Muñoz</div>
                    <div className="text-sm text-gray-500 dark:text-zinc-400">Café Central</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-zinc-800 p-6 rounded-2xl">
                <div className="flex text-yellow-400 mb-4">★★★★★</div>
                <p className="text-gray-700 dark:text-zinc-300 mb-4">
                  &quot;Exportar a Excel me permite hacer reportes mensuales para mi equipo. Simple y efectivo.&quot;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">A</div>
                  <div>
                    <div className="font-medium text-gray-800 dark:text-white">Ana Torres</div>
                    <div className="text-sm text-gray-500 dark:text-zinc-400">Clínica Dental Sonrisa</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Planes simples y transparentes
            </h2>
            <p className="text-gray-600 dark:text-zinc-400">
              Empieza gratis, escala cuando lo necesites
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Free */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 border border-gray-200 dark:border-zinc-800">
              <div className="text-lg font-medium text-gray-800 dark:text-white mb-2">Gratis</div>
              <div className="text-4xl font-bold text-gray-900 dark:text-white mb-1">$0</div>
              <div className="text-gray-500 dark:text-zinc-400 text-sm mb-6">Para siempre</div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-gray-700 dark:text-zinc-300">
                  <span className="text-green-500">✓</span> Encuestas ilimitadas
                </li>
                <li className="flex items-center gap-2 text-gray-700 dark:text-zinc-300">
                  <span className="text-green-500">✓</span> Dashboard completo
                </li>
                <li className="flex items-center gap-2 text-gray-700 dark:text-zinc-300">
                  <span className="text-green-500">✓</span> Código QR básico
                </li>
                <li className="flex items-center gap-2 text-gray-700 dark:text-zinc-300">
                  <span className="text-green-500">✓</span> Exportar 100 registros/mes
                </li>
              </ul>
              <a href="#contact" className="block text-center bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-800 dark:text-white py-3 rounded-xl font-medium transition-colors">
                Comenzar gratis
              </a>
            </div>
            
            {/* Pro */}
            <div className="bg-gradient-to-b from-blue-600 to-blue-700 rounded-2xl p-8 text-white relative transform md:scale-105 shadow-xl">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full">
                POPULAR
              </div>
              <div className="text-lg font-medium text-blue-100 mb-2">Pro</div>
              <div className="text-4xl font-bold mb-1">$9.990</div>
              <div className="text-blue-200 text-sm mb-6">CLP / mes</div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2">
                  <span className="text-yellow-300">✓</span> Todo lo del plan Gratis
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-yellow-300">✓</span> QR con logo personalizado
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-yellow-300">✓</span> Exportación ilimitada
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-yellow-300">✓</span> Gráficos avanzados
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-yellow-300">✓</span> Soporte prioritario
                </li>
              </ul>
              <a href="#contact" className="block text-center bg-white text-blue-600 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-colors">
                Elegir Pro
              </a>
            </div>
            
            {/* Enterprise */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 border border-gray-200 dark:border-zinc-800">
              <div className="text-lg font-medium text-gray-800 dark:text-white mb-2">Enterprise</div>
              <div className="text-4xl font-bold text-gray-900 dark:text-white mb-1">Custom</div>
              <div className="text-gray-500 dark:text-zinc-400 text-sm mb-6">Según necesidades</div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-gray-700 dark:text-zinc-300">
                  <span className="text-green-500">✓</span> Todo lo del plan Pro
                </li>
                <li className="flex items-center gap-2 text-gray-700 dark:text-zinc-300">
                  <span className="text-green-500">✓</span> Multi-sucursal
                </li>
                <li className="flex items-center gap-2 text-gray-700 dark:text-zinc-300">
                  <span className="text-green-500">✓</span> API de integración
                </li>
                <li className="flex items-center gap-2 text-gray-700 dark:text-zinc-300">
                  <span className="text-green-500">✓</span> Soporte dedicado
                </li>
                <li className="flex items-center gap-2 text-gray-700 dark:text-zinc-300">
                  <span className="text-green-500">✓</span> SLA garantizado
                </li>
              </ul>
              <a href="#contact" className="block text-center bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-800 dark:text-white py-3 rounded-xl font-medium transition-colors">
                Contactar ventas
              </a>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="bg-gray-50 dark:bg-zinc-900/50 py-20">
          <div className="max-w-3xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Preguntas frecuentes
              </h2>
            </div>
            
            <div className="space-y-4">
              {faqs.map((faq, i) => (
                <div 
                  key={i} 
                  className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <span className="font-medium text-gray-800 dark:text-white">{faq.question}</span>
                    <span className={`text-gray-400 transition-transform ${openFaq === i ? 'rotate-180' : ''}`}>
                      ▼
                    </span>
                  </button>
                  {openFaq === i && (
                    <div className="px-6 pb-4 text-gray-600 dark:text-zinc-400">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Compatibility */}
        <section className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Funciona en todas partes
            </h2>
            <p className="text-gray-600 dark:text-zinc-400">
              Diseñado para funcionar perfectamente en cualquier dispositivo
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-8 text-center">
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 bg-gray-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-3xl">📱</div>
              <span className="text-gray-700 dark:text-zinc-300 font-medium">Móvil</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 bg-gray-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-3xl">💻</div>
              <span className="text-gray-700 dark:text-zinc-300 font-medium">Desktop</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 bg-gray-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-3xl">📟</div>
              <span className="text-gray-700 dark:text-zinc-300 font-medium">Tablet</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 bg-gray-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-3xl">🌐</div>
              <span className="text-gray-700 dark:text-zinc-300 font-medium">Todos los navegadores</span>
            </div>
          </div>
        </section>

        {/* Contact CTA */}
        <section id="contact" className="max-w-6xl mx-auto px-6 py-20">
          <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl p-10 md:p-16 text-center text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              ¿Listo para conocer a tus clientes?
            </h2>
            <p className="text-blue-100 max-w-xl mx-auto mb-8">
              Déjanos tu email y te contactaremos para configurar tu cuenta gratis en menos de 24 horas.
            </p>
            
            {submitted ? (
              <div className="bg-white/20 backdrop-blur rounded-2xl p-6 max-w-md mx-auto">
                <div className="text-4xl mb-3">🎉</div>
                <div className="font-semibold text-lg">¡Gracias por tu interés!</div>
                <p className="text-blue-100 text-sm mt-2">Te contactaremos pronto.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="flex-1 px-6 py-4 rounded-full text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-white/30"
                />
                <button
                  type="submit"
                  className="bg-white text-blue-600 px-8 py-4 rounded-full font-semibold hover:bg-blue-50 transition-colors whitespace-nowrap"
                >
                  Comenzar →
                </button>
              </form>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-zinc-800 py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-2xl">⭐</span>
              <span className="font-bold text-gray-800 dark:text-white">Satisfacción</span>
            </div>
            <div className="flex gap-6 text-sm text-gray-500 dark:text-zinc-400">
              <a href="#" className="hover:text-gray-800 dark:hover:text-white transition-colors">Términos</a>
              <a href="#" className="hover:text-gray-800 dark:hover:text-white transition-colors">Privacidad</a>
              <a href="#" className="hover:text-gray-800 dark:hover:text-white transition-colors">Contacto</a>
            </div>
            <div className="text-sm text-gray-500 dark:text-zinc-400">
              © 2026 Satisfacción
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
