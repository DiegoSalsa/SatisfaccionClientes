"use client";
import { useEffect, useState, useRef, useMemo } from "react";
import { db } from "@/firebase/client";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { ThemeToggle } from "@/components/ThemeProvider";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import * as XLSX from "xlsx";

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
      '18-25': 0,
      '26-35': 0,
      '36-45': 0,
      '46-55': 0,
      '56-65': 0,
      '65+': 0
    };
    
    filteredReviews.forEach(r => {
      const edad = Number(r.edad);
      if (!edad) return;
      if (edad <= 25) ageGroups['18-25']++;
      else if (edad <= 35) ageGroups['26-35']++;
      else if (edad <= 45) ageGroups['36-45']++;
      else if (edad <= 55) ageGroups['46-55']++;
      else if (edad <= 65) ageGroups['56-65']++;
      else ageGroups['65+']++;
    });
    
    return Object.entries(ageGroups)
      .map(([rango, cantidad]) => ({ rango, cantidad }))
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
            <span className="text-3xl">🔒</span>
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
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              {business.logo_url ? (
                <img src={business.logo_url} alt={business.name} className="w-12 h-12 rounded-lg object-cover" />
              ) : (
                <span className="text-2xl text-white">🏪</span>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{business.name}</h1>
              <p className="text-gray-500 dark:text-zinc-400 text-sm">Dashboard de satisfacción</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Average Rating Card */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm p-6 border border-gray-100 dark:border-zinc-800">
            <p className="text-gray-500 dark:text-zinc-400 text-sm mb-2">Calificación promedio</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-gray-800 dark:text-white">{avg}</span>
              <span className="text-yellow-400 text-2xl">★</span>
            </div>
            <div className="flex gap-1 mt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={`text-xl ${parseFloat(avg) >= star ? "text-yellow-400" : "text-gray-200 dark:text-zinc-700"}`}
                >
                  ★
                </span>
              ))}
            </div>
          </div>

          {/* Total Reviews Card */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm p-6 border border-gray-100 dark:border-zinc-800">
            <p className="text-gray-500 dark:text-zinc-400 text-sm mb-2">Total de opiniones</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-gray-800 dark:text-white">{reviews.length}</span>
              <span className="text-gray-400 dark:text-zinc-500">reviews</span>
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
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 max-w-sm w-full border dark:border-zinc-800" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white text-center mb-2">{business.name}</h3>
              <p className="text-gray-500 dark:text-zinc-400 text-center text-sm mb-6">Escanea para dejar tu opinión</p>
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
            <h3 className="font-semibold text-gray-800 dark:text-white mb-4">📈 Tendencia de satisfacción</h3>
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
                    formatter={(value) => [`${value} ⭐`, 'Promedio']}
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
            <h3 className="font-semibold text-gray-800 dark:text-white mb-4">👥 Distribución por edad</h3>
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
                🔍 Filtros
              </button>
              <button
                onClick={exportToExcel}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                📊 Excel
              </button>
              <button
                onClick={exportToCSV}
                className="bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                📄 CSV
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
                      <option key={r} value={r}>{r} ⭐</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={clearFilters}
                  className="text-sm text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors"
                >
                  ✕ Limpiar filtros
                </button>
              </div>
            </div>
          )}

          {/* Reviews List */}
          <div className="divide-y divide-gray-100 dark:divide-zinc-800">
            {filteredReviews.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">💬</span>
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
                          <span>📧</span> {r.contact_email}
                        </p>
                      )}
                      {(r.comuna || r.edad) && (
                        <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1 flex items-center gap-3">
                          {r.comuna && <span>📍 {r.comuna}</span>}
                          {r.edad && <span>🎂 {r.edad} años</span>}
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
        <p>Powered by <span className="font-medium">Satisfacción</span> ⭐</p>
      </footer>
    </div>
  );
}
