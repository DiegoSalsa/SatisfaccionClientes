"use client";
import { useState, useEffect, useRef } from "react";
import { ThemeToggle } from "@/components/ThemeProvider";
import { CheckoutModal } from "@/components/CheckoutModal";
import { motion, useInView } from "framer-motion";

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 }
  }
};

const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

// Animated counter component
function AnimatedCounter({ target, suffix = "" }: { target: number | string; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  
  useEffect(() => {
    if (!isInView) return;
    const numTarget = typeof target === "string" ? parseFloat(target) : target;
    if (isNaN(numTarget)) return;
    
    const duration = 2000;
    const steps = 60;
    const increment = numTarget / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= numTarget) {
        setCount(numTarget);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current * 10) / 10);
      }
    }, duration / steps);
    
    return () => clearInterval(timer);
  }, [isInView, target]);
  
  const displayValue = typeof target === "string" && target.includes(".") 
    ? count.toFixed(1) 
    : Math.floor(count);
  
  return <span ref={ref}>{displayValue}{suffix}</span>;
}

// Section wrapper with intersection observer
function AnimatedSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.6 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function Home() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [checkoutPlan, setCheckoutPlan] = useState<'pro_mensual' | 'pro_anual' | 'test_plan' | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      // Enviar notificación al admin
      fetch('/api/notify-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      }).catch(console.error);
      
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
      question: "¿Cuánto cuesta ValoraLocal?",
      answer: "Ofrecemos dos opciones: Pro Mensual a $9.990 CLP/mes y Pro Anual a $99.990 CLP/año (ahorras 2 meses). Ambos planes incluyen todas las funcionalidades."
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
            <img src="/logo-light.svg" alt="ValoraLocal" className="h-10 dark:hidden" />
            <img src="/logo-dark.svg" alt="ValoraLocal" className="h-10 hidden dark:block" />
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
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-block bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-4 py-1.5 rounded-full text-sm font-medium mb-6"
            >
              +60 negocios ya confían en nosotros
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-5xl md:text-7xl font-bold text-gray-900 dark:text-white mb-6 leading-tight"
            >
              Conoce lo que piensan<br />
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                tus clientes
              </span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="text-xl text-gray-600 dark:text-zinc-300 max-w-2xl mx-auto mb-10"
            >
              Sistema de encuestas de valoración simple y efectivo. 
              Recoge opiniones, mejora tu servicio, haz crecer tu negocio.
            </motion.p>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="flex gap-4 justify-center flex-wrap"
            >
              <a 
                href="#contact" 
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all hover:scale-105 shadow-lg shadow-blue-600/25"
              >
                Comenzar ahora
              </a>
              <a 
                href="/dashboard/c2e0c5bf-e0c9-4b6a-b6b6-02026e00c707" 
                className="bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 text-gray-800 dark:text-white px-8 py-4 rounded-full font-semibold text-lg transition-all border border-gray-200 dark:border-zinc-700 hover:scale-105"
              >
                Ver Demo →
              </a>
            </motion.div>
          </div>
        </section>

        {/* Stats */}
        <section className="bg-white dark:bg-zinc-900 border-y border-gray-100 dark:border-zinc-800">
          <div className="max-w-6xl mx-auto px-6 py-16">
            <motion.div 
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              className="grid grid-cols-2 md:grid-cols-4 gap-8"
            >
              <motion.div variants={staggerItem} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                  <AnimatedCounter target={60} suffix="+" />
                </div>
                <div className="text-gray-600 dark:text-zinc-400">Negocios activos</div>
              </motion.div>
              <motion.div variants={staggerItem} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                  <AnimatedCounter target={10} suffix="K+" />
                </div>
                <div className="text-gray-600 dark:text-zinc-400">Opiniones recolectadas</div>
              </motion.div>
              <motion.div variants={staggerItem} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-green-600 dark:text-green-400 mb-2">
                  <AnimatedCounter target="4.8" />
                </div>
                <div className="text-gray-600 dark:text-zinc-400">Rating promedio</div>
              </motion.div>
              <motion.div variants={staggerItem} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-orange-600 dark:text-orange-400 mb-2">
                  <AnimatedCounter target={30} suffix="s" />
                </div>
                <div className="text-gray-600 dark:text-zinc-400">Tiempo de encuesta</div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="max-w-6xl mx-auto px-6 py-20">
          <AnimatedSection className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Todo lo que necesitas
            </h2>
            <p className="text-gray-600 dark:text-zinc-400 max-w-2xl mx-auto">
              Herramientas poderosas para entender a tus clientes y mejorar tu negocio
            </p>
          </AnimatedSection>
          
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <motion.div variants={staggerItem} className="bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-800 hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/50 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Encuesta en 30 segundos</h3>
              <p className="text-gray-600 dark:text-zinc-400">
                Sin registros ni complicaciones. El cliente solo califica y comenta.
              </p>
            </motion.div>
            
            <motion.div variants={staggerItem} className="bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-800 hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/50 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Gráficos de tendencia</h3>
              <p className="text-gray-600 dark:text-zinc-400">
                Visualiza la evolución de valoraciones por semana y distribución por edad.
              </p>
            </motion.div>
            
            <motion.div variants={staggerItem} className="bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-800 hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="w-14 h-14 bg-green-100 dark:bg-green-900/50 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Exportar Excel/CSV</h3>
              <p className="text-gray-600 dark:text-zinc-400">
                Descarga todos los datos filtrados para análisis externo con un clic.
              </p>
            </motion.div>
            
            <motion.div variants={staggerItem} className="bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-800 hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="w-14 h-14 bg-orange-100 dark:bg-orange-900/50 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Filtros avanzados</h3>
              <p className="text-gray-600 dark:text-zinc-400">
                Filtra por fecha, comuna, rango de edad y calificación específica.
              </p>
            </motion.div>
            
            <motion.div variants={staggerItem} className="bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-800 hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="w-14 h-14 bg-pink-100 dark:bg-pink-900/50 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-pink-600 dark:text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">QR con tu logo</h3>
              <p className="text-gray-600 dark:text-zinc-400">
                Genera códigos QR personalizados con el logo de tu negocio al centro.
              </p>
            </motion.div>
            
            <motion.div variants={staggerItem} className="bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-800 hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="w-14 h-14 bg-red-100 dark:bg-red-900/50 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Anti-spam</h3>
              <p className="text-gray-600 dark:text-zinc-400">
                Rate limiting inteligente para evitar opiniones duplicadas o spam.
              </p>
            </motion.div>
          </motion.div>
        </section>

        {/* Dashboard Preview */}
        <section className="bg-gradient-to-b from-transparent to-blue-50 dark:to-zinc-900/50 py-20">
          <div className="max-w-6xl mx-auto px-6">
            <AnimatedSection className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Dashboard intuitivo
              </h2>
              <p className="text-gray-600 dark:text-zinc-400">
                Todo lo que necesitas saber de tu negocio en un solo lugar
              </p>
            </AnimatedSection>
            
            {/* Mock Dashboard */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-zinc-700 overflow-hidden"
            >
              {/* Header mock */}
              <div className="bg-gray-50 dark:bg-zinc-800 px-6 py-4 border-b border-gray-200 dark:border-zinc-700 flex items-center gap-3">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                <div className="flex-1 text-center">
                  <span className="text-sm text-gray-500 dark:text-zinc-400">dashboard.valoralocal.cl</span>
                </div>
              </div>
              
              {/* Content mock */}
              <div className="p-8">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                  </div>
                  <div>
                    <div className="font-bold text-gray-800 dark:text-white">Tu Negocio</div>
                    <div className="text-sm text-gray-500 dark:text-zinc-400">Dashboard de valoraciones</div>
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
                  <div className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-4 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                    Tendencia semanal
                  </div>
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
            </motion.div>
          </div>
        </section>

        {/* How it works */}
        <section className="max-w-6xl mx-auto px-6 py-20">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-white dark:bg-zinc-900 rounded-3xl p-10 md:p-16 shadow-sm border border-gray-100 dark:border-zinc-800"
          >
            <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">¿Cómo funciona?</h2>
            <motion.div 
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid md:grid-cols-3 gap-8"
            >
              <motion.div variants={staggerItem} className="text-center">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-lg shadow-blue-600/25">1</div>
                <h4 className="font-semibold text-gray-800 dark:text-white mb-2 text-lg">Comparte tu enlace</h4>
                <p className="text-gray-600 dark:text-zinc-400">Cada negocio tiene una URL única y un código QR personalizable</p>
              </motion.div>
              <motion.div variants={staggerItem} className="text-center">
                <div className="w-16 h-16 bg-purple-600 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-lg shadow-purple-600/25">2</div>
                <h4 className="font-semibold text-gray-800 dark:text-white mb-2 text-lg">Cliente responde</h4>
                <p className="text-gray-600 dark:text-zinc-400">Califican de 1-5 estrellas, dejan comentario y datos opcionales</p>
              </motion.div>
              <motion.div variants={staggerItem} className="text-center">
                <div className="w-16 h-16 bg-green-600 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-lg shadow-green-600/25">3</div>
                <h4 className="font-semibold text-gray-800 dark:text-white mb-2 text-lg">Analiza y mejora</h4>
                <p className="text-gray-600 dark:text-zinc-400">Revisa gráficos, filtra datos y exporta para tomar decisiones</p>
              </motion.div>
            </motion.div>
          </motion.div>
        </section>

        {/* Testimonials */}
        <section className="bg-white dark:bg-zinc-900 border-y border-gray-100 dark:border-zinc-800 py-20">
          <div className="max-w-6xl mx-auto px-6">
            <AnimatedSection className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Lo que dicen nuestros clientes
              </h2>
            </AnimatedSection>
            
            <motion.div 
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              className="grid md:grid-cols-3 gap-6"
            >
              <motion.div variants={staggerItem} className="bg-gray-50 dark:bg-zinc-800 p-6 rounded-2xl hover:shadow-lg transition-shadow">
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
              </motion.div>
              
              <motion.div variants={staggerItem} className="bg-gray-50 dark:bg-zinc-800 p-6 rounded-2xl hover:shadow-lg transition-shadow">
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
              </motion.div>
              
              <motion.div variants={staggerItem} className="bg-gray-50 dark:bg-zinc-800 p-6 rounded-2xl hover:shadow-lg transition-shadow">
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
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="max-w-6xl mx-auto px-6 py-20">
          <AnimatedSection className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Planes simples y transparentes
            </h2>
            <p className="text-gray-600 dark:text-zinc-400">
              Elige el plan que mejor se adapte a tu negocio
            </p>
          </AnimatedSection>
          
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto"
          >
            {/* Plan Prueba - Solo para testing */}
            <motion.div 
              variants={staggerItem}
              whileHover={{ y: -5 }}
              className="bg-gradient-to-b from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl p-8 border-2 border-dashed border-amber-300 dark:border-amber-700 relative"
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                🧪 SOLO TESTING
              </div>
              <div className="text-lg font-medium text-gray-800 dark:text-white mb-2">Plan Prueba</div>
              <div className="text-4xl font-bold text-gray-900 dark:text-white mb-1">$1.000</div>
              <div className="text-gray-500 dark:text-zinc-400 text-sm mb-6">CLP / mes</div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-gray-700 dark:text-zinc-300">
                  <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Para probar referidos
                </li>
                <li className="flex items-center gap-2 text-gray-700 dark:text-zinc-300">
                  <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Funcionalidad completa
                </li>
                <li className="flex items-center gap-2 text-gray-700 dark:text-zinc-300">
                  <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Precio mínimo
                </li>
              </ul>
              <button 
                onClick={() => setCheckoutPlan('test_plan')}
                className="block w-full text-center bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-xl font-semibold transition-colors cursor-pointer"
              >
                Probar ahora
              </button>
            </motion.div>

            {/* Pro Mensual */}
            <motion.div 
              variants={staggerItem}
              whileHover={{ y: -5 }}
              className="bg-white dark:bg-zinc-900 rounded-2xl p-8 border border-gray-200 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
            >
              <div className="text-lg font-medium text-gray-800 dark:text-white mb-2">Pro Mensual</div>
              <div className="text-4xl font-bold text-gray-900 dark:text-white mb-1">$9.990</div>
              <div className="text-gray-500 dark:text-zinc-400 text-sm mb-6">CLP / mes</div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-gray-700 dark:text-zinc-300">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Encuestas ilimitadas
                </li>
                <li className="flex items-center gap-2 text-gray-700 dark:text-zinc-300">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Dashboard completo
                </li>
                <li className="flex items-center gap-2 text-gray-700 dark:text-zinc-300">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  QR con logo personalizado
                </li>
                <li className="flex items-center gap-2 text-gray-700 dark:text-zinc-300">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Exportación ilimitada
                </li>
                <li className="flex items-center gap-2 text-gray-700 dark:text-zinc-300">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Gráficos avanzados
                </li>
                <li className="flex items-center gap-2 text-gray-700 dark:text-zinc-300">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Soporte prioritario
                </li>
              </ul>
              <button 
                onClick={() => setCheckoutPlan('pro_mensual')}
                className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition-colors cursor-pointer"
              >
                Comenzar
              </button>
            </motion.div>
            
            {/* Pro Anual */}
            <motion.div 
              variants={staggerItem}
              whileHover={{ y: -5 }}
              className="bg-gradient-to-b from-blue-600 to-blue-700 rounded-2xl p-8 text-white relative shadow-xl"
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full">
                AHORRA 17%
              </div>
              <div className="text-lg font-medium text-blue-100 mb-2">Pro Anual</div>
              <div className="text-4xl font-bold mb-1">$99.990</div>
              <div className="text-blue-200 text-sm mb-6">CLP / año</div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Todo lo del plan mensual
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  2 meses gratis incluidos
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Precio fijo garantizado
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Soporte prioritario 24/7
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Onboarding personalizado
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Facturación anual
                </li>
              </ul>
              <button 
                onClick={() => setCheckoutPlan('pro_anual')}
                className="block w-full text-center bg-white text-blue-600 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-colors cursor-pointer"
              >
                Elegir anual
              </button>
            </motion.div>
          </motion.div>
        </section>

        {/* FAQ */}
        <section id="faq" className="bg-gray-50 dark:bg-zinc-900/50 py-20">
          <div className="max-w-3xl mx-auto px-6">
            <AnimatedSection className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Preguntas frecuentes
              </h2>
            </AnimatedSection>
            
            <motion.div 
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="space-y-4"
            >
              {faqs.map((faq, i) => (
                <motion.div 
                  key={i}
                  variants={staggerItem}
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
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="px-6 pb-4 text-gray-600 dark:text-zinc-400"
                    >
                      {faq.answer}
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Compatibility */}
        <section className="max-w-6xl mx-auto px-6 py-20">
          <AnimatedSection className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Funciona en todas partes
            </h2>
            <p className="text-gray-600 dark:text-zinc-400">
              Diseñado para funcionar perfectamente en cualquier dispositivo
            </p>
          </AnimatedSection>
          
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="flex flex-wrap justify-center gap-8 text-center"
          >
            <motion.div variants={staggerItem} className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 bg-gray-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-600 dark:text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
              </div>
              <span className="text-gray-700 dark:text-zinc-300 font-medium">Móvil</span>
            </motion.div>
            <motion.div variants={staggerItem} className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 bg-gray-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-600 dark:text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              </div>
              <span className="text-gray-700 dark:text-zinc-300 font-medium">Desktop</span>
            </motion.div>
            <motion.div variants={staggerItem} className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 bg-gray-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-600 dark:text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
              </div>
              <span className="text-gray-700 dark:text-zinc-300 font-medium">Tablet</span>
            </motion.div>
            <motion.div variants={staggerItem} className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 bg-gray-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-600 dark:text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
              </div>
              <span className="text-gray-700 dark:text-zinc-300 font-medium">Web</span>
            </motion.div>
          </motion.div>
        </section>

        {/* Contact CTA */}
        <section id="contact" className="max-w-6xl mx-auto px-6 py-20">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl p-10 md:p-16 text-center text-white"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              ¿Listo para conocer a tus clientes?
            </h2>
            <p className="text-blue-100 max-w-xl mx-auto mb-8">
              Déjanos tu email y te contactaremos para configurar tu cuenta gratis en menos de 24 horas.
            </p>
            
            {submitted ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white/20 backdrop-blur rounded-2xl p-6 max-w-md mx-auto"
              >
                <svg className="w-12 h-12 mx-auto mb-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <div className="font-semibold text-lg">¡Gracias por tu interés!</div>
                <p className="text-blue-100 text-sm mt-2">Te contactaremos pronto.</p>
              </motion.div>
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
                  className="bg-white text-blue-600 px-8 py-4 rounded-full font-semibold hover:bg-blue-50 transition-colors whitespace-nowrap hover:scale-105 transform"
                >
                  Comenzar →
                </button>
              </form>
            )}
          </motion.div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-zinc-800 py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <img src="/logo-light.svg" alt="ValoraLocal" className="h-6 dark:hidden" />
              <img src="/logo-dark.svg" alt="ValoraLocal" className="h-6 hidden dark:block" />
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-sm text-gray-500 dark:text-zinc-400">
              <a href="mailto:contacto.valoralocal@gmail.com" className="hover:text-gray-800 dark:hover:text-white transition-colors flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                contacto.valoralocal@gmail.com
              </a>
              <div className="flex gap-6">
                <a href="#" className="hover:text-gray-800 dark:hover:text-white transition-colors">Términos</a>
                <a href="#" className="hover:text-gray-800 dark:hover:text-white transition-colors">Privacidad</a>
              </div>
            </div>
            <div className="text-sm text-gray-500 dark:text-zinc-400">
              © 2026 ValoraLocal
            </div>
          </div>
        </div>
      </footer>

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={checkoutPlan !== null}
        onClose={() => setCheckoutPlan(null)}
        planId={checkoutPlan || 'pro_mensual'}
        planName={
          checkoutPlan === 'pro_anual' ? 'Pro Anual' : 
          checkoutPlan === 'test_plan' ? 'Plan Prueba' : 
          'Pro Mensual'
        }
        planPrice={
          checkoutPlan === 'pro_anual' ? '$99.990 CLP/año' : 
          checkoutPlan === 'test_plan' ? '$1.000 CLP/mes' : 
          '$9.990 CLP/mes'
        }
      />
    </div>
  );
}
