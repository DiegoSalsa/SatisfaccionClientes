
"use client";
import { useEffect, useState } from "react";
import { db } from "@/firebase/client";
import { collection, query, where, getDocs, orderBy, doc, updateDoc } from "firebase/firestore";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { ThemeToggle } from "@/components/ThemeProvider";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

interface Review {
  rating: number;
  comment?: string;
  contact_email?: string;
  timestamp?: any;
}

export default function DashboardPage() {
  const params = useParams<{ private_token: string }>();
  const [business, setBusiness] = useState<any>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [googleMapsUrl, setGoogleMapsUrl] = useState("");
  const [savingMaps, setSavingMaps] = useState(false);
  const [mapsSaved, setMapsSaved] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const q = query(collection(db, "businesses"), where("private_token", "==", params.private_token));
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
          setError("Acceso no autorizado");
          setLoading(false);
          return;
        }
        const businessData = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as any;
        setBusiness(businessData);
        setGoogleMapsUrl(businessData.google_maps_url || "");
        
        const reviewsQ = query(
          collection(db, "reviews"),
          where("business_id", "==", businessData.id),
          orderBy("timestamp", "desc")
        );
        const reviewsSnap = await getDocs(reviewsQ);
        setReviews(reviewsSnap.docs.map((doc) => doc.data() as Review));
      } catch (err) {
        setError("Error al cargar datos");
      }
      setLoading(false);
    }
    fetchData();
  }, [params.private_token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 dark:text-gray-400">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex items-center justify-center px-4">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🔒</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Acceso denegado</h2>
          <p className="text-gray-600 dark:text-gray-400">El enlace no es válido o ha expirado.</p>
        </div>
      </div>
    );
  }

  const avg = reviews.length
    ? (reviews.reduce((a, r) => a + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : "0.0";

  const ratingCounts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
    percent: reviews.length ? (reviews.filter((r) => r.rating === star).length / reviews.length) * 100 : 0,
  }));

  const handleSaveGoogleMaps = async () => {
    if (!business?.id) return;
    setSavingMaps(true);
    setMapsSaved(false);
    try {
      const businessRef = doc(db, "businesses", business.id);
      await updateDoc(businessRef, {
        google_maps_url: googleMapsUrl.trim() || null,
      });
      setBusiness({ ...business, google_maps_url: googleMapsUrl.trim() || null });
      setMapsSaved(true);
      setTimeout(() => setMapsSaved(false), 3000);
    } catch (err) {
      console.error("Error guardando Google Maps URL:", err);
    }
    setSavingMaps(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 overflow-x-hidden">
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800"
      >
        <div className="max-w-5xl mx-auto px-4 py-4 sm:py-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0"
              >
                {business.logo_url ? (
                  <img src={business.logo_url} alt={business.name} className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg object-cover" />
                ) : (
                  <span className="text-xl sm:text-2xl text-white">🏪</span>
                )}
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className="min-w-0"
              >
                <h1 className="text-lg sm:text-2xl font-bold text-gray-800 dark:text-white truncate">{business.name}</h1>
                <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">Dashboard de satisfacción</p>
              </motion.div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </motion.header>

      <main className="max-w-5xl mx-auto px-4 py-6 sm:py-8">
        {/* Stats Grid */}
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8"
        >
          {/* Average Rating Card */}
          <motion.div 
            variants={staggerItem} 
            whileHover={{ scale: 1.02, y: -5 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm p-5 sm:p-6 border border-gray-100 dark:border-zinc-800 hover:shadow-lg cursor-default"
          >
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">Calificación promedio</p>
            <div className="flex items-baseline gap-2">
              <motion.span 
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, type: "spring" }}
                className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-white"
              >
                {avg}
              </motion.span>
              <motion.span 
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ delay: 0.8, duration: 0.5 }}
                className="text-yellow-400 text-xl sm:text-2xl"
              >
                ★
              </motion.span>
            </div>
            <div className="flex gap-1 mt-2">
              {[1, 2, 3, 4, 5].map((star, i) => (
                <motion.span
                  key={star}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + i * 0.1 }}
                  className={`text-lg sm:text-xl ${parseFloat(avg) >= star ? "text-yellow-400" : "text-gray-200 dark:text-zinc-700"}`}
                >
                  ★
                </motion.span>
              ))}
            </div>
          </motion.div>

          {/* Total Reviews Card */}
          <motion.div 
            variants={staggerItem} 
            whileHover={{ scale: 1.02, y: -5 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm p-5 sm:p-6 border border-gray-100 dark:border-zinc-800 hover:shadow-lg cursor-default"
          >
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">Total de opiniones</p>
            <div className="flex items-baseline gap-2">
              <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-white"
              >
                {reviews.length}
              </motion.span>
              <span className="text-gray-400 dark:text-gray-500">reviews</span>
            </div>
            <p className="text-green-600 dark:text-green-400 text-sm mt-2 flex items-center gap-1">
              <span>📈</span> Sigue compartiendo tu enlace
            </p>
          </motion.div>

          {/* Survey Link Card */}
          <motion.div 
            variants={staggerItem} 
            whileHover={{ scale: 1.02, y: -5 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-sm p-5 sm:p-6 text-white hover:shadow-xl cursor-default sm:col-span-2 lg:col-span-1"
          >
            <p className="text-blue-100 text-sm mb-2">Tu enlace de encuesta</p>
            <code className="text-xs sm:text-sm bg-white/20 px-3 py-2 rounded-lg block truncate">
              /encuesta/{business.slug}
            </code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/encuesta/${business.slug}`);
                alert("¡Enlace copiado!");
              }}
              className="mt-3 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors w-full sm:w-auto"
            >
              📋 Copiar enlace
            </button>
          </motion.div>
        </motion.div>

        {/* Google Maps Integration */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm p-4 sm:p-6 border border-gray-100 dark:border-zinc-800 mb-6 sm:mb-8 hover:shadow-md transition-shadow"
        >
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-800 dark:text-white mb-1">Reseñas en Google Maps</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
                Agrega tu link de Google Maps y los clientes que califiquen con 4 o 5 estrellas 
                recibirán una invitación para dejar su reseña pública en Google.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="url"
                  value={googleMapsUrl}
                  onChange={(e) => setGoogleMapsUrl(e.target.value)}
                  placeholder="https://g.page/r/tu-negocio/review"
                  className="flex-1 border border-gray-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                />
                <button
                  onClick={handleSaveGoogleMaps}
                  disabled={savingMaps}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-6 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  {savingMaps ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      Guardando
                    </>
                  ) : mapsSaved ? (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      ¡Guardado!
                    </>
                  ) : (
                    "Guardar"
                  )}
                </button>
              </div>
              {business.google_maps_url && (
                <p className="text-green-600 dark:text-green-400 text-sm mt-3 flex items-center gap-1">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Integración activa - Los clientes satisfechos verán la invitación</span>
                </p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Rating Distribution */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm p-4 sm:p-6 border border-gray-100 dark:border-zinc-800 mb-6 sm:mb-8 hover:shadow-md transition-shadow"
        >
          <h3 className="font-semibold text-gray-800 dark:text-white mb-4">Distribución de calificaciones</h3>
          <div className="space-y-3">
            {ratingCounts.map(({ star, count, percent }, index) => (
              <motion.div 
                key={star} 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                className="flex items-center gap-2 sm:gap-3"
              >
                <span className="text-sm text-gray-600 dark:text-gray-400 w-6">{star}★</span>
                <div className="flex-1 h-3 sm:h-4 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    transition={{ delay: 0.8 + index * 0.1, duration: 0.8, ease: "easeOut" }}
                    className="h-full bg-yellow-400 rounded-full"
                  />
                </div>
                <motion.span 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 + index * 0.1 }}
                  className="text-sm text-gray-500 dark:text-gray-400 w-8 sm:w-10 text-right"
                >
                  {count}
                </motion.span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Reviews List */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-800"
        >
          <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-zinc-800">
            <h3 className="font-semibold text-gray-800 dark:text-white">Comentarios recientes</h3>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-zinc-800">
            {reviews.length === 0 ? (
              <div className="p-8 sm:p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">💬</span>
                </div>
                <h4 className="font-medium text-gray-800 dark:text-white mb-1">Sin comentarios aún</h4>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Comparte tu enlace de encuesta para recibir opiniones</p>
              </div>
            ) : (
              reviews.slice(0, 20).map((r, i) => (
                <div key={i} className="p-4 sm:p-6 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span
                              key={star}
                              className={`text-base sm:text-lg ${r.rating >= star ? "text-yellow-400" : "text-gray-200 dark:text-zinc-700"}`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{r.rating}/5</span>
                      </div>
                      {r.comment ? (
                        <p className="text-gray-700 dark:text-gray-300 text-sm sm:text-base break-words">{r.comment}</p>
                      ) : (
                        <p className="text-gray-400 dark:text-gray-500 italic text-sm">Sin comentario</p>
                      )}
                      {r.contact_email && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-1 break-all">
                          <span>📧</span> {r.contact_email}
                        </p>
                      )}
                    </div>
                    <div className="text-left sm:text-right flex-shrink-0">
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {r.timestamp?.toDate
                          ? new Date(r.timestamp.toDate()).toLocaleDateString("es-ES", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : ""}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="text-center py-6 sm:py-8 text-gray-400 dark:text-gray-500 text-sm">
        <p>Powered by <span className="font-medium">ValoraLocal</span> ⭐</p>
      </footer>
    </div>
  );
}
