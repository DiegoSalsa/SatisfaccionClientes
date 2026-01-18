
"use client";
import { useEffect, useState } from "react";
import { db } from "@/firebase/client";
import { collection, addDoc, Timestamp, getDocs, query, where } from "firebase/firestore";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";

export default function EncuestaPage() {
  const params = useParams<{ slug: string }>();
  const [business, setBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ rating: 0, comment: "", contact_email: "" });
  const [hoverRating, setHoverRating] = useState(0);
  const [showMapsModal, setShowMapsModal] = useState(false);
  const [submittedRating, setSubmittedRating] = useState(0);

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
    setSuccess(false);
    if (!form.rating) {
      setError("Debes seleccionar una calificación");
      return;
    }
    setSubmitting(true);
    try {
      await addDoc(collection(db, "reviews"), {
        business_id: business.id,
        rating: form.rating,
        comment: form.comment,
        contact_email: form.contact_email,
        timestamp: Timestamp.now(),
      });
      
      // Si rating >= 4 y hay Google Maps URL, mostrar modal
      if (form.rating >= 4 && business.google_maps_url) {
        setSubmittedRating(form.rating);
        setShowMapsModal(true);
      } else {
        setSuccess(true);
      }
      
      setForm({ rating: 0, comment: "", contact_email: "" });
    } catch (err) {
      setError("Error al enviar. Intenta de nuevo.");
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500">Cargando...</p>
        </div>
      </div>
    );
  }

  if (error && !business) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">😕</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Negocio no encontrado</h2>
          <p className="text-gray-600">El enlace que usaste no corresponde a ningún negocio registrado.</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, type: "spring" }}
          className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md"
        >
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ 
              scale: 1,
              y: [0, -10, 0]
            }}
            transition={{ 
              scale: { delay: 0.2, type: "spring", stiffness: 200 },
              y: { delay: 0.5, duration: 2, repeat: Infinity, ease: "easeInOut" }
            }}
            className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <span className="text-4xl">🎉</span>
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-bold text-gray-800 mb-2"
          >
            ¡Gracias por tu opinión!
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-gray-600 mb-6"
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
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Enviar otra opinión
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4">
      <main className="max-w-lg mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="w-20 h-20 bg-white rounded-2xl shadow-md flex items-center justify-center mx-auto mb-4"
          >
            {business.logo_url ? (
              <img src={business.logo_url} alt={business.name} className="w-16 h-16 rounded-xl object-cover" />
            ) : (
              <span className="text-4xl">🏪</span>
            )}
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-bold text-gray-800"
          >
            {business.name}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-gray-500 mt-1"
          >
            ¿Cómo fue tu experiencia?
          </motion.p>
        </motion.div>

        {/* Form */}
        <motion.form 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          onSubmit={handleSubmit} 
          className="bg-white rounded-2xl shadow-lg p-6 md:p-8 space-y-6"
        >
          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
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
                  transition={{ delay: 0.4 + index * 0.1, type: "spring", stiffness: 300 }}
                  whileHover={{ scale: 1.3, rotate: 5 }}
                  whileTap={{ scale: 0.9 }}
                  className="focus:outline-none"
                >
                  <motion.span
                    animate={{
                      scale: (hoverRating || form.rating) >= star ? [1, 1.2, 1] : 1,
                      rotate: (hoverRating || form.rating) >= star ? [0, -10, 10, 0] : 0
                    }}
                    transition={{ duration: 0.3 }}
                    className={`text-5xl cursor-pointer transition-colors block ${
                      (hoverRating || form.rating) >= star
                        ? "text-yellow-400 drop-shadow-lg"
                        : "text-gray-200"
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
              className="text-center text-sm text-gray-500 mt-3 h-6"
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cuéntanos más <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <textarea
              name="comment"
              className="w-full border border-gray-200 rounded-xl p-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              rows={4}
              placeholder="¿Qué te gustó? ¿Qué podemos mejorar?"
              value={form.comment}
              onChange={handleChange}
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tu email <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <input
              name="contact_email"
              type="email"
              className="w-full border border-gray-200 rounded-xl p-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Para que podamos contactarte"
              value={form.contact_email}
              onChange={handleChange}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm text-center">
              {error}
            </div>
          )}

          {/* Submit */}
          <motion.button
            type="submit"
            disabled={submitting || !form.rating}
            whileHover={form.rating ? { scale: 1.02 } : {}}
            whileTap={form.rating ? { scale: 0.98 } : {}}
            className={`w-full py-4 rounded-xl font-semibold text-lg transition-all ${
              form.rating
                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200 hover:shadow-xl"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
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
          </motion.button>
        </motion.form>

        {/* Footer */}
        <p className="text-center text-sm text-gray-400 mt-6">
          Powered by <span className="font-medium">Satisfacción</span> ⭐
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
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center animate-in fade-in zoom-in duration-300">
            {/* Confetti-like decoration */}
            <div className="absolute -top-6 left-1/2 -translate-x-1/2">
              <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-4xl">⭐</span>
              </div>
            </div>
            
            <div className="mt-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {submittedRating === 5 ? "¡Increíble!" : "¡Genial!"}
              </h2>
              <p className="text-gray-600 mb-6">
                Nos alegra que hayas tenido una gran experiencia en <strong>{business.name}</strong>. 
                ¿Te gustaría compartir tu opinión en Google Maps?
              </p>
              
              <p className="text-sm text-gray-500 mb-6">
                Tu reseña ayuda a otros a descubrir este negocio 🙏
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
                  className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-4 rounded-xl font-semibold transition-all shadow-lg shadow-blue-200 hover:shadow-xl"
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
                  className="w-full text-gray-500 hover:text-gray-700 py-3 font-medium transition-colors"
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
