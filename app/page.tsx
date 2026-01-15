"use client";
import { ThemeToggle } from "@/components/ThemeProvider";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors">
      {/* Theme Toggle */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      {/* Hero Section */}
      <header className="px-6 py-8">
        <nav className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-3xl">⭐</span>
            <span className="text-xl font-bold text-gray-800 dark:text-white">Satisfacción</span>
          </div>
        </nav>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-16">
        {/* Hero */}
        <section className="text-center mb-20">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
            Conoce lo que piensan<br />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
              tus clientes
            </span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8">
            Sistema de encuestas de satisfacción simple y efectivo. 
            Recoge opiniones, mejora tu servicio, haz crecer tu negocio.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <a 
              href="/encuesta/negocio-1" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all hover:scale-105 shadow-lg shadow-blue-200 dark:shadow-blue-900/50"
            >
              Ver Demo Encuesta
            </a>
          </div>
        </section>

        {/* Features */}
        <section className="grid md:grid-cols-3 gap-8 mb-20">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
            <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/50 rounded-xl flex items-center justify-center text-2xl mb-4">
              📱
            </div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Fácil para el cliente</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Encuesta simple de 30 segundos. Sin registros, sin complicaciones.
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
            <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/50 rounded-xl flex items-center justify-center text-2xl mb-4">
              🔒
            </div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Acceso Privado</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Cada negocio tiene su dashboard privado con enlace único y seguro.
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
            <div className="w-14 h-14 bg-green-100 dark:bg-green-900/50 rounded-xl flex items-center justify-center text-2xl mb-4">
              📊
            </div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Métricas Claras</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Promedio de calificación y comentarios recientes en tiempo real.
            </p>
          </div>
        </section>

        {/* How it works */}
        <section className="bg-white dark:bg-gray-800 rounded-3xl p-10 md:p-16 shadow-sm border border-gray-100 dark:border-gray-700">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">¿Cómo funciona?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">1</div>
              <h4 className="font-semibold text-gray-800 dark:text-white mb-2">Comparte tu enlace</h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Cada negocio tiene una URL única como /encuesta/tu-negocio</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">2</div>
              <h4 className="font-semibold text-gray-800 dark:text-white mb-2">Cliente responde</h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Califican de 1-5 estrellas y dejan un comentario opcional</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">3</div>
              <h4 className="font-semibold text-gray-800 dark:text-white mb-2">Revisa tu dashboard</h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Accede con tu enlace privado y ve todas las opiniones</p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="text-center py-10 text-gray-500 dark:text-gray-400 text-sm">
        <p>© 2026 Satisfacción - Sistema de encuestas para negocios</p>
      </footer>
    </div>
  );
}
