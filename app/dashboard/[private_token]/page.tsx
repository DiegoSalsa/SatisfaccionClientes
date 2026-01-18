
"use client";
import { useEffect, useState } from "react";
import { db } from "@/firebase/client";
import { collection, query, where, getDocs, orderBy, doc, updateDoc } from "firebase/firestore";
import { useParams } from "next/navigation";

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🔒</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Acceso denegado</h2>
          <p className="text-gray-600">El enlace no es válido o ha expirado.</p>
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
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
              <h1 className="text-2xl font-bold text-gray-800">{business.name}</h1>
              <p className="text-gray-500 text-sm">Dashboard de satisfacción</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Average Rating Card */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <p className="text-gray-500 text-sm mb-2">Calificación promedio</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-gray-800">{avg}</span>
              <span className="text-yellow-400 text-2xl">★</span>
            </div>
            <div className="flex gap-1 mt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={`text-xl ${parseFloat(avg) >= star ? "text-yellow-400" : "text-gray-200"}`}
                >
                  ★
                </span>
              ))}
            </div>
          </div>

          {/* Total Reviews Card */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <p className="text-gray-500 text-sm mb-2">Total de opiniones</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-gray-800">{reviews.length}</span>
              <span className="text-gray-400">reviews</span>
            </div>
            <p className="text-green-600 text-sm mt-2 flex items-center gap-1">
              <span>📈</span> Sigue compartiendo tu enlace
            </p>
          </div>

          {/* Survey Link Card */}
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-sm p-6 text-white">
            <p className="text-blue-100 text-sm mb-2">Tu enlace de encuesta</p>
            <code className="text-sm bg-white/20 px-3 py-2 rounded-lg block truncate">
              /encuesta/{business.slug}
            </code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/encuesta/${business.slug}`);
                alert("¡Enlace copiado!");
              }}
              className="mt-3 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              📋 Copiar enlace
            </button>
          </div>
        </div>

        {/* Google Maps Integration */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 mb-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800 mb-1">Reseñas en Google Maps</h3>
              <p className="text-gray-500 text-sm mb-4">
                Agrega tu link de Google Maps y los clientes que califiquen con 4 o 5 estrellas 
                recibirán una invitación para dejar su reseña pública en Google.
              </p>
              <div className="flex gap-3">
                <input
                  type="url"
                  value={googleMapsUrl}
                  onChange={(e) => setGoogleMapsUrl(e.target.value)}
                  placeholder="https://g.page/r/tu-negocio/review"
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                />
                <button
                  onClick={handleSaveGoogleMaps}
                  disabled={savingMaps}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-6 py-3 rounded-xl font-medium transition-colors flex items-center gap-2"
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
                <p className="text-green-600 text-sm mt-3 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Integración activa - Los clientes satisfechos verán la invitación
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Rating Distribution */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 mb-8">
          <h3 className="font-semibold text-gray-800 mb-4">Distribución de calificaciones</h3>
          <div className="space-y-3">
            {ratingCounts.map(({ star, count, percent }) => (
              <div key={star} className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-6">{star}★</span>
                <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-400 rounded-full transition-all duration-500"
                    style={{ width: `${percent}%` }}
                  ></div>
                </div>
                <span className="text-sm text-gray-500 w-10 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Reviews List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Comentarios recientes</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {reviews.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">💬</span>
                </div>
                <h4 className="font-medium text-gray-800 mb-1">Sin comentarios aún</h4>
                <p className="text-gray-500 text-sm">Comparte tu enlace de encuesta para recibir opiniones</p>
              </div>
            ) : (
              reviews.slice(0, 20).map((r, i) => (
                <div key={i} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span
                              key={star}
                              className={`text-lg ${r.rating >= star ? "text-yellow-400" : "text-gray-200"}`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                        <span className="text-sm font-medium text-gray-700">{r.rating}/5</span>
                      </div>
                      {r.comment ? (
                        <p className="text-gray-700">{r.comment}</p>
                      ) : (
                        <p className="text-gray-400 italic text-sm">Sin comentario</p>
                      )}
                      {r.contact_email && (
                        <p className="text-sm text-gray-500 mt-2 flex items-center gap-1">
                          <span>📧</span> {r.contact_email}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">
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
      <footer className="text-center py-8 text-gray-400 text-sm">
        <p>Powered by <span className="font-medium">Satisfacción</span> ⭐</p>
      </footer>
    </div>
  );
}
