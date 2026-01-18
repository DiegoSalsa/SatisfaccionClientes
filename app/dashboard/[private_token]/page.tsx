"use client";
import { useEffect, useState, useRef, useMemo } from "react";
import { db } from "@/firebase/client";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { useParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { ThemeToggle } from "@/components/ThemeProvider";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import * as XLSX from "xlsx";
import { motion } from "framer-motion";

interface Review {
  rating: number;
  comment?: string;
  contact_email?: string;
  comuna?: string;
  edad?: string;
  timestamp?: any;
}

interface Filters {
  dateFrom: string;
  dateTo: string;
  comuna: string;
  edadMin: string;
  edadMax: string;
  rating: string;
}

export default function DashboardPage() {
  const params = useParams<{ private_token: string }>();
  const [business, setBusiness] = useState<any>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showQR, setShowQR] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    dateFrom: "",
    dateTo: "",
    comuna: "",
    edadMin: "",
    edadMax: "",
    rating: ""
  });
  const qrRef = useRef<HTMLDivElement>(null);
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
        const businessData = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
        setBusiness(businessData);
        setGoogleMapsUrl((businessData as any).google_maps_url || "");
        
        const reviewsQ = query(
          collection(db, "reviews"),
          where("business_id", "==", businessData.id)
        );
        const reviewsSnap = await getDocs(reviewsQ);
        const reviewsData = reviewsSnap.docs.map((doc) => doc.data() as Review);
        reviewsData.sort((a, b) => {
          const timeA = a.timestamp?.toDate?.() || new Date(0);
          const timeB = b.timestamp?.toDate?.() || new Date(0);
          return timeB.getTime() - timeA.getTime();
        });
        setReviews(reviewsData);
      } catch (err) {
        setError("Error al cargar datos");
      }
      setLoading(false);
    }
    fetchData();
  }, [params.private_token]);

  // Filtrar reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter(r => {
      const date = r.timestamp?.toDate?.() || new Date(0);
      if (filters.dateFrom && date < new Date(filters.dateFrom)) return false;
      if (filters.dateTo && date > new Date(filters.dateTo + "T23:59:59")) return false;
      if (filters.comuna && r.comuna?.toLowerCase() !== filters.comuna.toLowerCase()) return false;
      if (filters.edadMin && Number(r.edad) < Number(filters.edadMin)) return false;
      if (filters.edadMax && Number(r.edad) > Number(filters.edadMax)) return false;
      if (filters.rating && r.rating !== Number(filters.rating)) return false;
      return true;
    });
  }, [reviews, filters]);

  // Datos para gráfico de tendencia semanal
  const trendData = useMemo(() => {
    const weeks: Record<string, { ratings: number[], count: number }> = {};
    filteredReviews.forEach(r => {
      const date = r.timestamp?.toDate?.() || new Date();
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const key = weekStart.toISOString().split('T')[0];
      if (!weeks[key]) weeks[key] = { ratings: [], count: 0 };
      weeks[key].ratings.push(r.rating);
      weeks[key].count++;
    });
    return Object.entries(weeks)
      .map(([week, data]) => ({
        week: new Date(week).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
        promedio: Number((data.ratings.reduce((a, b) => a + b, 0) / data.ratings.length).toFixed(1)),
        cantidad: data.count
      }))
      .sort((a, b) => new Date(a.week).getTime() - new Date(b.week).getTime())
      .slice(-8);
  }, [filteredReviews]);

  // Datos para gráfico de distribución de edades
  const ageDistributionData = useMemo(() => {
    const ageGroups: Record<string, number> = {
      '< 18': 0,
      '18-25': 0,
      '26-35': 0,
      '36-45': 0,
      '46-55': 0,
      '56-65': 0,
      '65+': 0
    };
    
    filteredReviews.forEach(r => {
      const edad = Number(r.edad);
      if (!edad || edad < 1 || edad > 120) return;
      if (edad < 18) ageGroups['< 18']++;
      else if (edad <= 25) ageGroups['18-25']++;
      else if (edad <= 35) ageGroups['26-35']++;
      else if (edad <= 45) ageGroups['36-45']++;
      else if (edad <= 55) ageGroups['46-55']++;
      else if (edad <= 65) ageGroups['56-65']++;
      else ageGroups['65+']++;
    });
    
    // Mantener orden específico de los grupos
    const orderedGroups = ['< 18', '18-25', '26-35', '36-45', '46-55', '56-65', '65+'];
    return orderedGroups
      .map(rango => ({ rango, cantidad: ageGroups[rango] }))
      .filter(d => d.cantidad > 0);
  }, [filteredReviews]);

  // Comunas únicas para el filtro
  const uniqueComunas = useMemo(() => {
    const comunas = reviews.map(r => r.comuna).filter(Boolean);
    return [...new Set(comunas)].sort();
  }, [reviews]);

  // Exportar a Excel
  const exportToExcel = () => {
    const data = filteredReviews.map(r => ({
      Fecha: r.timestamp?.toDate?.()?.toLocaleDateString('es-ES') || '',
      Rating: r.rating,
      Comentario: r.comment || '',
      Email: r.contact_email || '',
      Comuna: r.comuna || '',
      Edad: r.edad || ''
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reviews");
    XLSX.writeFile(wb, `reviews-${business?.slug || 'export'}.xlsx`);
  };

  // Exportar a CSV
  const exportToCSV = () => {
    const headers = ['Fecha', 'Rating', 'Comentario', 'Email', 'Comuna', 'Edad'];
    const rows = filteredReviews.map(r => [
      r.timestamp?.toDate?.()?.toLocaleDateString('es-ES') || '',
      r.rating,
      `"${(r.comment || '').replace(/"/g, '""')}"`,
      r.contact_email || '',
      r.comuna || '',
      r.edad || ''
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `reviews-${business?.slug || 'export'}.csv`;
    link.click();
  };

  const clearFilters = () => {
    setFilters({ dateFrom: "", dateTo: "", comuna: "", edadMin: "", edadMax: "", rating: "" });
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center transition-colors">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 dark:text-zinc-400">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center px-4 transition-colors">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg p-8 text-center max-w-md border dark:border-zinc-800">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Acceso denegado</h2>
          <p className="text-gray-600 dark:text-zinc-400">El enlace no es válido o ha expirado.</p>
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
    <div className="min-h-screen bg-gray-50 dark:bg-black transition-colors">
      {/* Theme Toggle */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      {/* Header */}
      <header className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            {business.logo_url ? (
              <img src={business.logo_url} alt={business.name} className="w-14 h-14 rounded-xl object-contain" />
            ) : (
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{business.name}</h1>
              <p className="text-gray-500 dark:text-zinc-400 text-sm">Dashboard de valoraciones</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Average Rating Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            whileHover={{ scale: 1.02, y: -5 }}
            className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm p-6 border border-gray-100 dark:border-zinc-800 cursor-default hover:shadow-lg transition-shadow"
          >
            <p className="text-gray-500 dark:text-zinc-400 text-sm mb-2">Calificación promedio</p>
            <div className="flex items-baseline gap-2">
              <motion.span 
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
                className="text-4xl font-bold text-gray-800 dark:text-white"
              >
                {avg}
              </motion.span>
              <motion.span 
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="text-yellow-400 text-2xl"
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
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className={`text-xl ${parseFloat(avg) >= star ? "text-yellow-400" : "text-gray-200 dark:text-zinc-700"}`}
                >
                  ★
                </motion.span>
              ))}
            </div>
          </motion.div>

          {/* Total Reviews Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.02, y: -5 }}
            className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm p-6 border border-gray-100 dark:border-zinc-800 cursor-default hover:shadow-lg transition-shadow"
          >
            <p className="text-gray-500 dark:text-zinc-400 text-sm mb-2">Total de opiniones</p>
            <div className="flex items-baseline gap-2">
              <motion.span 
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, type: "spring" }}
                className="text-4xl font-bold text-gray-800 dark:text-white"
              >
                {reviews.length}
              </motion.span>
              <span className="text-gray-400 dark:text-zinc-500">reviews</span>
            </div>
            <p className="text-green-600 dark:text-green-400 text-sm mt-2 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              Sigue compartiendo tu enlace
            </p>
          </motion.div>

          {/* Survey Link Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.02, y: -5 }}
            className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-sm p-6 text-white cursor-default hover:shadow-xl transition-shadow"
          >
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
                className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                Copiar
              </button>
              <button
                onClick={() => setShowQR(true)}
                className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h2M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
                Ver QR
              </button>
            </div>
          </motion.div>
        </div>

        {/* Google Maps Integration */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm p-6 border border-gray-100 dark:border-zinc-800 mb-8"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800 dark:text-white mb-1">Reseñas en Google Maps</h3>
              <p className="text-gray-500 dark:text-zinc-400 text-sm mb-4">
                Agrega tu link de Google Maps y los clientes que califiquen con 4 o 5 estrellas 
                recibirán una invitación para dejar su reseña pública en Google.
              </p>
              <div className="flex gap-3 flex-col sm:flex-row">
                <input
                  type="url"
                  value={googleMapsUrl}
                  onChange={(e) => setGoogleMapsUrl(e.target.value)}
                  placeholder="https://g.page/r/tu-negocio/review"
                  className="flex-1 border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-xl px-4 py-3 text-sm text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                />
                <button
                  onClick={handleSaveGoogleMaps}
                  disabled={savingMaps}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-6 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
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
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Integración activa - Los clientes satisfechos verán la invitación
                </p>
              )}
            </div>
          </div>
        </motion.div>

        {/* QR Modal */}
        {showQR && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowQR(false)}>
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 max-w-sm w-full border dark:border-zinc-800" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white text-center mb-2">{business.name}</h3>
              <p className="text-gray-500 dark:text-zinc-400 text-center text-sm mb-6">Escanea para dejar tu opinión</p>
              <div ref={qrRef} className="flex justify-center mb-6 bg-white p-4 rounded-xl">
                <QRCodeSVG
                  value={`${typeof window !== 'undefined' ? window.location.origin : ''}/encuesta/${business.slug}`}
                  size={200}
                  level="H"
                  includeMargin={true}
                  imageSettings={business.logo_url ? {
                    src: business.logo_url,
                    height: 40,
                    width: 40,
                    excavate: true,
                  } : undefined}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    const svg = qrRef.current?.querySelector('svg');
                    if (!svg) return;
                    
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    const size = 200 + 20; // QR size + margin
                    canvas.width = size;
                    canvas.height = size;
                    
                    // Dibujar QR base
                    const svgData = new XMLSerializer().serializeToString(svg);
                    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
                    const svgUrl = URL.createObjectURL(svgBlob);
                    
                    const qrImg = new Image();
                    qrImg.onload = async () => {
                      ctx?.drawImage(qrImg, 0, 0, size, size);
                      URL.revokeObjectURL(svgUrl);
                      
                      // Si hay logo, dibujarlo encima
                      if (business.logo_url) {
                        const logoImg = new Image();
                        logoImg.crossOrigin = 'anonymous';
                        logoImg.onload = () => {
                          const logoSize = 40;
                          const logoX = (size - logoSize) / 2;
                          const logoY = (size - logoSize) / 2;
                          // Fondo blanco para el logo
                          ctx!.fillStyle = 'white';
                          ctx!.fillRect(logoX - 4, logoY - 4, logoSize + 8, logoSize + 8);
                          ctx?.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
                          
                          const link = document.createElement('a');
                          link.download = `qr-${business.slug}.png`;
                          link.href = canvas.toDataURL('image/png');
                          link.click();
                        };
                        logoImg.onerror = () => {
                          // Si falla el logo, descargar sin él
                          const link = document.createElement('a');
                          link.download = `qr-${business.slug}.png`;
                          link.href = canvas.toDataURL('image/png');
                          link.click();
                        };
                        logoImg.src = business.logo_url;
                      } else {
                        const link = document.createElement('a');
                        link.download = `qr-${business.slug}.png`;
                        link.href = canvas.toDataURL('image/png');
                        link.click();
                      }
                    };
                    qrImg.src = svgUrl;
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Descargar PNG
                </button>
                <button
                  onClick={() => setShowQR(false)}
                  className="flex-1 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-200 py-3 rounded-xl font-medium transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Trend Chart */}
        {trendData.length > 1 && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm p-6 border border-gray-100 dark:border-zinc-800 mb-8">
            <h3 className="font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              Tendencia de valoraciones
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                  <XAxis dataKey="week" stroke="#9CA3AF" fontSize={12} />
                  <YAxis domain={[1, 5]} stroke="#9CA3AF" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#18181b',
                      border: '1px solid #3f3f46',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                    formatter={(value) => [`${value} ★`, 'Promedio']}
                  />
                  <Line
                    type="monotone"
                    dataKey="promedio"
                    stroke="#3B82F6"
                    strokeWidth={3}
                    dot={{ fill: '#3B82F6', strokeWidth: 2, r: 5 }}
                    activeDot={{ r: 8, fill: '#60A5FA' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Age Distribution Chart */}
        {ageDistributionData.length > 0 && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm p-6 border border-gray-100 dark:border-zinc-800 mb-8">
            <h3 className="font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Distribución por edad
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ageDistributionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                  <XAxis dataKey="rango" stroke="#9CA3AF" fontSize={12} />
                  <YAxis stroke="#9CA3AF" fontSize={12} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#18181b',
                      border: '1px solid #3f3f46',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                    formatter={(value) => [`${value} clientes`, 'Cantidad']}
                  />
                  <Bar 
                    dataKey="cantidad" 
                    fill="#8B5CF6" 
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Rating Distribution */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm p-6 border border-gray-100 dark:border-zinc-800 mb-8">
          <h3 className="font-semibold text-gray-800 dark:text-white mb-4">Distribución de calificaciones</h3>
          <div className="space-y-3">
            {ratingCounts.map(({ star, count, percent }) => (
              <div key={star} className="flex items-center gap-3">
                <span className="text-sm text-gray-600 dark:text-zinc-400 w-6">{star}★</span>
                <div className="flex-1 h-4 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-400 rounded-full transition-all duration-500"
                    style={{ width: `${percent}%` }}
                  ></div>
                </div>
                <span className="text-sm text-gray-500 dark:text-zinc-400 w-10 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Filters & Export Section */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-800 mb-8">
          <div className="p-6 border-b border-gray-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-gray-800 dark:text-white">Comentarios</h3>
              <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full text-sm">
                {filteredReviews.length} de {reviews.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  showFilters 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-200 hover:bg-gray-200 dark:hover:bg-zinc-700'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filtros
              </button>
              <button
                onClick={exportToExcel}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Excel
              </button>
              <button
                onClick={exportToCSV}
                className="bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                CSV
              </button>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="p-6 border-b border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/50">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 dark:text-zinc-400 mb-1">Desde</label>
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-800 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-zinc-400 mb-1">Hasta</label>
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-800 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-zinc-400 mb-1">Comuna</label>
                  <select
                    value={filters.comuna}
                    onChange={(e) => setFilters({...filters, comuna: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-800 dark:text-white text-sm"
                  >
                    <option value="">Todas</option>
                    {uniqueComunas.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-zinc-400 mb-1">Edad mín</label>
                  <input
                    type="number"
                    placeholder="18"
                    value={filters.edadMin}
                    onChange={(e) => setFilters({...filters, edadMin: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-800 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-zinc-400 mb-1">Edad máx</label>
                  <input
                    type="number"
                    placeholder="99"
                    value={filters.edadMax}
                    onChange={(e) => setFilters({...filters, edadMax: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-800 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-zinc-400 mb-1">Rating</label>
                  <select
                    value={filters.rating}
                    onChange={(e) => setFilters({...filters, rating: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-800 dark:text-white text-sm"
                  >
                    <option value="">Todos</option>
                    {[5,4,3,2,1].map(r => (
                      <option key={r} value={r}>{r} ★</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={clearFilters}
                  className="text-sm text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Limpiar filtros
                </button>
              </div>
            </div>
          )}

          {/* Reviews List */}
          <div className="divide-y divide-gray-100 dark:divide-zinc-800">
            {filteredReviews.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400 dark:text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h4 className="font-medium text-gray-800 dark:text-white mb-1">
                  {reviews.length === 0 ? 'Sin comentarios aún' : 'Sin resultados'}
                </h4>
                <p className="text-gray-500 dark:text-zinc-400 text-sm">
                  {reviews.length === 0 
                    ? 'Comparte tu enlace de encuesta para recibir opiniones' 
                    : 'Intenta ajustar los filtros'}
                </p>
              </div>
            ) : (
              filteredReviews.slice(0, 50).map((r, i) => (
                <div key={i} className="p-6 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span
                              key={star}
                              className={`text-lg ${r.rating >= star ? "text-yellow-400" : "text-gray-200 dark:text-zinc-700"}`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                        <span className="text-sm font-medium text-gray-700 dark:text-zinc-300">{r.rating}/5</span>
                      </div>
                      {r.comment ? (
                        <p className="text-gray-700 dark:text-zinc-200">{r.comment}</p>
                      ) : (
                        <p className="text-gray-400 dark:text-zinc-500 italic text-sm">Sin comentario</p>
                      )}
                      {r.contact_email && (
                        <p className="text-sm text-gray-500 dark:text-zinc-400 mt-2 flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          {r.contact_email}
                        </p>
                      )}
                      {(r.comuna || r.edad) && (
                        <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1 flex items-center gap-3">
                          {r.comuna && (
                            <span className="flex items-center gap-1">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              {r.comuna}
                            </span>
                          )}
                          {r.edad && (
                            <span className="flex items-center gap-1">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              {r.edad} años
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400 dark:text-zinc-500">
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
      <footer className="text-center py-8 text-gray-400 dark:text-zinc-500 text-sm">
        <p className="flex items-center justify-center gap-2">
          Powered by 
          <img src="/logo-light.svg" alt="ValoraLocal" className="h-5 dark:hidden" />
          <img src="/logo-dark.svg" alt="ValoraLocal" className="h-5 hidden dark:block" />
        </p>
      </footer>
    </div>
  );
}
