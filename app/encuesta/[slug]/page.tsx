"use client";
import { useEffect, useState } from "react";
import { db } from "@/firebase/client";
import { collection, addDoc, Timestamp, getDocs, query, where } from "firebase/firestore";
import { useParams } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeProvider";
import confetti from "canvas-confetti";
import { motion } from "framer-motion";

// Rate limiting: 1 review cada 30 minutos por negocio
const RATE_LIMIT_KEY = "review_timestamps";
const RATE_LIMIT_MS = 30 * 60 * 1000; // 30 minutos

function checkRateLimit(businessId: string): { allowed: boolean; remainingTime: number } {
  try {
    const stored = localStorage.getItem(RATE_LIMIT_KEY);
    const timestamps: Record<string, number> = stored ? JSON.parse(stored) : {};
    const lastSubmit = timestamps[businessId] || 0;
    const now = Date.now();
    const elapsed = now - lastSubmit;
    
    if (elapsed < RATE_LIMIT_MS) {
      return { allowed: false, remainingTime: Math.ceil((RATE_LIMIT_MS - elapsed) / 1000) };
    }
    return { allowed: true, remainingTime: 0 };
  } catch {
    return { allowed: true, remainingTime: 0 };
  }
}

function setRateLimitTimestamp(businessId: string) {
  try {
    const stored = localStorage.getItem(RATE_LIMIT_KEY);
    const timestamps: Record<string, number> = stored ? JSON.parse(stored) : {};
    timestamps[businessId] = Date.now();
    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(timestamps));
  } catch {}
}

function fireConfetti() {
  const duration = 3000;
  const end = Date.now() + duration;

  const frame = () => {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
      colors: ['#3b82f6', '#8b5cf6', '#f59e0b']
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
      colors: ['#3b82f6', '#8b5cf6', '#f59e0b']
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };
  frame();
}

export default function EncuestaPage() {
  const params = useParams<{ slug: string }>();
  const [business, setBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ rating: 0, comment: "", contact_email: "", comuna: "", edad: "" });
  const [hoverRating, setHoverRating] = useState(0);
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);
  const [showMapsModal, setShowMapsModal] = useState(false);
  const [submittedRating, setSubmittedRating] = useState(0);
  const [showMenuChoice, setShowMenuChoice] = useState(true); // Para mostrar opciones carta/valorar

  useEffect(() => {
    async function fetchBusiness() {
      setLoading(true);
      try {
        const q = query(collection(db, "businesses"), where("slug", "==", params.slug));
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
          setError("Negocio no encontrado");
          setLoading(false);
          return;
        }
        setBusiness({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
      } catch (err) {
        setError("Error al cargar el negocio");
      }
      setLoading(false);
    }
    fetchBusiness();
  }, [params.slug]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleRating = (star: number) => {
    setForm((f) => ({ ...f, rating: star }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setRateLimitError(null);
    setSuccess(false);
    
    if (!form.rating) {
      setError("Debes seleccionar una calificación");
      return;
    }

    // Check rate limit
    const rateCheck = checkRateLimit(business.id);
    if (!rateCheck.allowed) {
      const minutes = Math.floor(rateCheck.remainingTime / 60);
      const seconds = rateCheck.remainingTime % 60;
      setRateLimitError(`Debes esperar ${minutes > 0 ? `${minutes}m ` : ''}${seconds}s antes de enviar otra opinión`);
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, "reviews"), {
        business_id: business.id,
        rating: form.rating,
        comment: form.comment,
        contact_email: form.contact_email,
        comuna: form.comuna,
        edad: form.edad,
        timestamp: Timestamp.now(),
      });
      setRateLimitTimestamp(business.id);

      // Notificar al dueño del negocio (no bloquea el flujo)
      fetch('/api/notify-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: business.id,
          rating: form.rating,
          comment: form.comment || null,
        }),
      }).catch(console.error);
      
      // Si rating >= 4 y hay Google Maps URL, mostrar modal
      if (form.rating >= 4 && business.google_maps_url) {
        setSubmittedRating(form.rating);
        setShowMapsModal(true);
        fireConfetti();
      } else {
        setSuccess(true);
        fireConfetti();
      }
      
      setForm({ rating: 0, comment: "", contact_email: "", comuna: "", edad: "" });
    } catch (err) {
      setError("Error al enviar. Intenta de nuevo.");
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-black dark:via-zinc-900 dark:to-black flex items-center justify-center transition-colors">
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggle />
        </div>
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 dark:text-zinc-400">Cargando...</p>
        </div>
      </div>
    );
  }

  if (error && !business) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-black dark:via-zinc-900 dark:to-black flex items-center justify-center px-4 transition-colors">
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggle />
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg p-8 text-center max-w-md border dark:border-zinc-800">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Negocio no encontrado</h2>
          <p className="text-gray-600 dark:text-zinc-400">El enlace que usaste no corresponde a ningún negocio registrado.</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-black dark:via-zinc-900 dark:to-black flex items-center justify-center px-4 transition-colors">
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggle />
        </div>
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, type: "spring" }}
          className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg p-8 text-center max-w-md border dark:border-zinc-800"
        >
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1, y: [0, -10, 0] }}
            transition={{ 
              scale: { delay: 0.2, type: "spring", stiffness: 200 },
              y: { delay: 0.5, duration: 2, repeat: Infinity, ease: "easeInOut" }
            }}
            className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-bold text-gray-800 dark:text-white mb-2"
          >
            ¡Gracias por tu opinión!
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-gray-600 dark:text-zinc-400 mb-6"
          >
            Tu feedback nos ayuda a mejorar cada día.
          </motion.p>
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSuccess(false)}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
          >
            Enviar otra opinión
          </motion.button>
        </motion.div>
      </div>
    );
  }

  // Si el negocio tiene carta/menú y aún no ha elegido opción
  if (business.menu_pdf_url && showMenuChoice) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-black dark:via-zinc-900 dark:to-black py-8 px-4 transition-colors">
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggle />
        </div>
        <main className="max-w-lg mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-24 h-24 bg-white dark:bg-zinc-800 rounded-2xl shadow-md flex items-center justify-center mx-auto mb-4 border dark:border-zinc-700">
              {business.logo_url ? (
                <img src={business.logo_url} alt={business.name} className="w-20 h-20 rounded-xl object-cover" />
              ) : (
                <svg className="w-12 h-12 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{business.name}</h1>
            <p className="text-gray-500 dark:text-zinc-400 mt-1">¿Qué te gustaría hacer?</p>
          </div>

          {/* Options */}
          <div className="space-y-4">
            {/* Ver Carta */}
            <motion.a
              href={business.menu_pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="block bg-white dark:bg-zinc-900 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-zinc-800 hover:border-amber-300 dark:hover:border-amber-600 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg group-hover:shadow-xl transition-shadow">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-1">Ver Carta</h2>
                  <p className="text-gray-500 dark:text-zinc-400 text-sm">Consulta nuestro menú completo</p>
                </div>
                <svg className="w-6 h-6 text-gray-400 dark:text-zinc-500 group-hover:text-amber-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </div>
            </motion.a>

            {/* Valorar */}
            <motion.button
              onClick={() => setShowMenuChoice(false)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-white dark:bg-zinc-900 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-blue-600 transition-all cursor-pointer group text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg group-hover:shadow-xl transition-shadow">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-1">Valorar</h2>
                  <p className="text-gray-500 dark:text-zinc-400 text-sm">Cuéntanos tu experiencia</p>
                </div>
                <svg className="w-6 h-6 text-gray-400 dark:text-zinc-500 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </motion.button>
          </div>

          {/* Footer */}
          <p className="text-center text-sm text-gray-400 dark:text-zinc-500 mt-8 flex items-center justify-center gap-2">
            Powered by 
            <img src="/logo-light.svg" alt="ValoraLocal" className="h-5 dark:hidden" />
            <img src="/logo-dark.svg" alt="ValoraLocal" className="h-5 hidden dark:block" />
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-black dark:via-zinc-900 dark:to-black py-8 px-4 transition-colors">
      {/* Theme Toggle */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      <main className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-white dark:bg-zinc-800 rounded-2xl shadow-md flex items-center justify-center mx-auto mb-4 border dark:border-zinc-700">
            {business.logo_url ? (
              <img src={business.logo_url} alt={business.name} className="w-16 h-16 rounded-xl object-cover" />
            ) : (
              <svg className="w-10 h-10 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{business.name}</h1>
          <p className="text-gray-500 dark:text-zinc-400 mt-1">¿Cómo fue tu experiencia?</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg p-6 md:p-8 space-y-6 border dark:border-zinc-800">
          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-200 mb-3 text-center">
              Tu calificación
            </label>
            <div className="flex justify-center gap-3">
              {[1, 2, 3, 4, 5].map((star, index) => (
                <motion.button
                  type="button"
                  key={star}
                  onClick={() => handleRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.1, type: "spring", stiffness: 300 }}
                  whileHover={{ scale: 1.3, rotate: 5 }}
                  whileTap={{ scale: 0.9 }}
                  className="focus:outline-none"
                >
                  <motion.span
                    animate={{
                      scale: (hoverRating || form.rating) >= star ? [1, 1.3, 1] : 1,
                      rotate: (hoverRating || form.rating) >= star ? [0, -15, 15, 0] : 0
                    }}
                    transition={{ duration: 0.4 }}
                    className={`text-5xl cursor-pointer transition-colors block ${
                      (hoverRating || form.rating) >= star
                        ? "text-yellow-400 drop-shadow-lg"
                        : "text-gray-200 dark:text-zinc-700"
                    }`}
                  >
                    ★
                  </motion.span>
                </motion.button>
              ))}
            </div>
            <motion.p 
              key={form.rating}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center text-sm text-gray-500 dark:text-zinc-400 mt-3 h-6"
            >
              {form.rating === 1 && "Muy malo 😞"}
              {form.rating === 2 && "Malo 😕"}
              {form.rating === 3 && "Regular 😐"}
              {form.rating === 4 && "Bueno 🙂"}
              {form.rating === 5 && "¡Excelente! 🤩"}
            </motion.p>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-200 mb-2">
              Cuéntanos más <span className="text-gray-400 dark:text-zinc-500 font-normal">(opcional)</span>
            </label>
            <textarea
              name="comment"
              className="w-full border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white rounded-xl p-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              rows={4}
              placeholder="¿Qué te gustó? ¿Qué podemos mejorar?"
              value={form.comment}
              onChange={handleChange}
              style={{ color: 'inherit' }}
            />
          </div>

          {/* Comuna y Edad */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-200 mb-2">
                Comuna
              </label>
              <input
                name="comuna"
                type="text"
                className="w-full border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white rounded-xl p-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Ej: Providencia"
                value={form.comuna}
                onChange={handleChange}
                style={{ color: 'inherit' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-200 mb-2">
                Edad
              </label>
              <input
                name="edad"
                type="number"
                min="1"
                max="120"
                className="w-full border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white rounded-xl p-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Ej: 25"
                value={form.edad}
                onChange={handleChange}
                style={{ color: 'inherit' }}
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-200 mb-2">
              Tu email <span className="text-gray-400 dark:text-zinc-500 font-normal">(opcional)</span>
            </label>
            <input
              name="contact_email"
              type="email"
              className="w-full border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white rounded-xl p-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Para que podamos contactarte"
              value={form.contact_email}
              onChange={handleChange}
              style={{ color: 'inherit' }}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm text-center">
              {error}
            </div>
          )}

          {/* Rate Limit Error */}
          {rateLimitError && (
            <div className="bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-4 py-3 rounded-xl text-sm text-center flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {rateLimitError}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting || !form.rating}
            className={`w-full py-4 rounded-xl font-semibold text-lg transition-all ${
              form.rating
                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl"
                : "bg-gray-100 dark:bg-zinc-800 text-gray-400 dark:text-zinc-500 cursor-not-allowed"
            }`}
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Enviando...
              </span>
            ) : (
              "Enviar opinión"
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-sm text-gray-400 dark:text-zinc-500 mt-6 flex items-center justify-center gap-2">
          Powered by 
          <img src="/logo-light.svg" alt="ValoraLocal" className="h-5 dark:hidden" />
          <img src="/logo-dark.svg" alt="ValoraLocal" className="h-5 hidden dark:block" />
        </p>
      </main>

      {/* Google Maps Modal */}
      {showMapsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => {
              setShowMapsModal(false);
              setSuccess(true);
            }}
          />
          <div className="relative bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-w-md w-full p-8 text-center animate-in fade-in zoom-in duration-300">
            {/* Star decoration */}
            <div className="absolute -top-6 left-1/2 -translate-x-1/2">
              <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                </svg>
              </div>
            </div>
            
            <div className="mt-8">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                {submittedRating === 5 ? "¡Increíble!" : "¡Genial!"}
              </h2>
              <p className="text-gray-600 dark:text-zinc-400 mb-6">
                Nos alegra que hayas tenido una gran experiencia en <strong>{business.name}</strong>. 
                ¿Te gustaría compartir tu opinión en Google Maps?
              </p>
              
              <p className="text-sm text-gray-500 dark:text-zinc-500 mb-6">
                Tu reseña ayuda a otros a descubrir este negocio
              </p>

              <div className="space-y-3">
                <a
                  href={business.google_maps_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    setShowMapsModal(false);
                    setSuccess(true);
                  }}
                  className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-4 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                  Dejar reseña en Google Maps
                </a>
                
                <button
                  onClick={() => {
                    setShowMapsModal(false);
                    setSuccess(true);
                  }}
                  className="w-full text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300 py-3 font-medium transition-colors"
                >
                  Quizás más tarde
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
