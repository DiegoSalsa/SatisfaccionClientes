"use client";
import { useEffect, useState, useRef } from "react";
import { db } from "@/firebase/client";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { ThemeToggle } from "@/components/ThemeProvider";

interface Review {
  rating: number;
  comment?: string;
  contact_email?: string;
  comuna?: string;
  edad?: string;
  timestamp?: any;
}

export default function DashboardPage() {
  const params = useParams<{ private_token: string }>();
  const [business, setBusiness] = useState<any>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showQR, setShowQR] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        console.log("Buscando token:", params.private_token);
        const q = query(collection(db, "businesses"), where("private_token", "==", params.private_token));
        const snapshot = await getDocs(q);
        console.log("Resultados:", snapshot.size, snapshot.empty);
        if (snapshot.empty) {
          setError("Acceso no autorizado");
          setLoading(false);
          return;
        }
        const businessData = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
        setBusiness(businessData);
        
        const reviewsQ = query(
          collection(db, "reviews"),
          where("business_id", "==", businessData.id)
        );
        const reviewsSnap = await getDocs(reviewsQ);
        const reviewsData = reviewsSnap.docs.map((doc) => doc.data() as Review);
        // Ordenar en el cliente
        reviewsData.sort((a, b) => {
          const timeA = a.timestamp?.toDate?.() || new Date(0);
          const timeB = b.timestamp?.toDate?.() || new Date(0);
          return timeB.getTime() - timeA.getTime();
        });
        setReviews(reviewsData);
      } catch (err) {
        console.error("Error:", err);
        setError("Error al cargar datos");
      }
      setLoading(false);
    }
    fetchData();
  }, [params.private_token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 dark:text-gray-400">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4 transition-colors">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 text-center max-w-md">
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Theme Toggle */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              {business.logo_url ? (
                <img src={business.logo_url} alt={business.name} className="w-12 h-12 rounded-lg object-cover" />
              ) : (
                <span className="text-2xl text-white">🏪</span>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{business.name}</h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Dashboard de satisfacción</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Average Rating Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">Calificación promedio</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-gray-800 dark:text-white">{avg}</span>
              <span className="text-yellow-400 text-2xl">★</span>
            </div>
            <div className="flex gap-1 mt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={`text-xl ${parseFloat(avg) >= star ? "text-yellow-400" : "text-gray-200 dark:text-gray-600"}`}
                >
                  ★
                </span>
              ))}
            </div>
          </div>

          {/* Total Reviews Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">Total de opiniones</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-gray-800 dark:text-white">{reviews.length}</span>
              <span className="text-gray-400 dark:text-gray-500">reviews</span>
            </div>
            <p className="text-green-600 dark:text-green-400 text-sm mt-2 flex items-center gap-1">
              <span>📈</span> Sigue compartiendo tu enlace
            </p>
          </div>

          {/* Survey Link Card */}
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-sm p-6 text-white">
            <p className="text-blue-100 text-sm mb-2">Tu enlace de encuesta</p>
            <code className="text-sm bg-white/20 px-3 py-2 rounded-lg block truncate">
              /encuesta/{business.slug}
            </code>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/encuesta/${business.slug}`);
                  alert("¡Enlace copiado!");
                }}
                className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                📋 Copiar
              </button>
              <button
                onClick={() => setShowQR(true)}
                className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                📱 Ver QR
              </button>
            </div>
          </div>
        </div>

        {/* QR Modal */}
        {showQR && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowQR(false)}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white text-center mb-2">{business.name}</h3>
              <p className="text-gray-500 dark:text-gray-400 text-center text-sm mb-6">Escanea para dejar tu opinión</p>
              <div ref={qrRef} className="flex justify-center mb-6 bg-white p-4 rounded-xl">
                <QRCodeSVG
                  value={`${typeof window !== 'undefined' ? window.location.origin : ''}/encuesta/${business.slug}`}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const svg = qrRef.current?.querySelector('svg');
                    if (svg) {
                      const svgData = new XMLSerializer().serializeToString(svg);
                      const canvas = document.createElement('canvas');
                      const ctx = canvas.getContext('2d');
                      const img = new Image();
                      img.onload = () => {
                        canvas.width = img.width;
                        canvas.height = img.height;
                        ctx?.drawImage(img, 0, 0);
                        const link = document.createElement('a');
                        link.download = `qr-${business.slug}.png`;
                        link.href = canvas.toDataURL('image/png');
                        link.click();
                      };
                      img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
                    }
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium transition-colors"
                >
                  ⬇️ Descargar PNG
                </button>
                <button
                  onClick={() => setShowQR(false)}
                  className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 py-3 rounded-xl font-medium transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Rating Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 mb-8">
          <h3 className="font-semibold text-gray-800 dark:text-white mb-4">Distribución de calificaciones</h3>
          <div className="space-y-3">
            {ratingCounts.map(({ star, count, percent }) => (
              <div key={star} className="flex items-center gap-3">
                <span className="text-sm text-gray-600 dark:text-gray-400 w-6">{star}★</span>
                <div className="flex-1 h-4 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-400 rounded-full transition-all duration-500"
                    style={{ width: `${percent}%` }}
                  ></div>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400 w-10 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Reviews List */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700">
            <h3 className="font-semibold text-gray-800 dark:text-white">Comentarios recientes</h3>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {reviews.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">💬</span>
                </div>
                <h4 className="font-medium text-gray-800 dark:text-white mb-1">Sin comentarios aún</h4>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Comparte tu enlace de encuesta para recibir opiniones</p>
              </div>
            ) : (
              reviews.slice(0, 20).map((r, i) => (
                <div key={i} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span
                              key={star}
                              className={`text-lg ${r.rating >= star ? "text-yellow-400" : "text-gray-200 dark:text-gray-600"}`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{r.rating}/5</span>
                      </div>
                      {r.comment ? (
                        <p className="text-gray-700 dark:text-gray-200">{r.comment}</p>
                      ) : (
                        <p className="text-gray-400 dark:text-gray-500 italic text-sm">Sin comentario</p>
                      )}
                      {r.contact_email && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-1">
                          <span>📧</span> {r.contact_email}
                        </p>
                      )}
                      {(r.comuna || r.edad) && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-3">
                          {r.comuna && <span>📍 {r.comuna}</span>}
                          {r.edad && <span>🎂 {r.edad} años</span>}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
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
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
        <p>Powered by <span className="font-medium">Satisfacción</span> ⭐</p>
      </footer>
    </div>
  );
}
