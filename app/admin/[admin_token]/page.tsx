"use client";
import { useEffect, useState, useMemo } from "react";
import { db } from "@/firebase/client";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { useParams } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeProvider";

const ADMIN_TOKEN = "super-admin-secreto-2026-xyz";

interface Business {
  id: string;
  name: string;
  slug: string;
  private_token: string;
  logo_url: string;
  email?: string;
  created_at?: any;
  expires_at?: any;
  referral_code?: string;
  referral_count?: number;
  referral_balance?: number;
  referred_by?: string;
  subscription?: {
    plan?: string;
    status?: string;
    amount?: number;
  };
}

interface Review {
  business_id: string;
  rating: number;
  timestamp?: any;
}

interface Stats {
  totalBusinesses: number;
  activeBusinesses: number;
  expiredBusinesses: number;
  totalReviews: number;
  averageRating: number;
  totalReferralBalance: number;
  totalReferrals: number;
  revenueEstimate: number;
}

type TabType = 'overview' | 'businesses' | 'referrals' | 'top';

export default function AdminPage() {
  const params = useParams<{ admin_token: string }>();
  const [authorized, setAuthorized] = useState(false);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", slug: "", logo_url: "" });
  const [showAddForm, setShowAddForm] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [sortBy, setSortBy] = useState<'name' | 'reviews' | 'rating' | 'referrals' | 'created'>('name');

  useEffect(() => {
    if (params.admin_token !== ADMIN_TOKEN) {
      setAuthorized(false);
      setLoading(false);
      return;
    }
    setAuthorized(true);
    fetchData();
  }, [params.admin_token]);

  async function fetchData() {
    setLoading(true);
    try {
      const businessSnapshot = await getDocs(collection(db, "businesses"));
      const businessData = businessSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Business));
      setBusinesses(businessData);

      const reviewsSnapshot = await getDocs(collection(db, "reviews"));
      const reviewsData = reviewsSnapshot.docs.map((doc) => doc.data() as Review);
      setReviews(reviewsData);
    } catch (err) {
      console.error("Error fetching data:", err);
    }
    setLoading(false);
  }

  const stats = useMemo((): Stats => {
    const now = new Date();
    const activeBusinesses = businesses.filter(b => {
      if (!b.expires_at) return true;
      const expiresAt = b.expires_at?.toDate?.() || new Date(b.expires_at);
      return expiresAt > now;
    });

    const totalReferralBalance = businesses.reduce((sum, b) => sum + (b.referral_balance || 0), 0);
    const totalReferrals = businesses.reduce((sum, b) => sum + (b.referral_count || 0), 0);

    const avgRating = reviews.length > 0 
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
      : 0;

    const revenueEstimate = activeBusinesses.length * 8990;

    return {
      totalBusinesses: businesses.length,
      activeBusinesses: activeBusinesses.length,
      expiredBusinesses: businesses.length - activeBusinesses.length,
      totalReviews: reviews.length,
      averageRating: avgRating,
      totalReferralBalance,
      totalReferrals,
      revenueEstimate,
    };
  }, [businesses, reviews]);

  const businessStats = useMemo(() => {
    return businesses.map(b => {
      const businessReviews = reviews.filter(r => r.business_id === b.id);
      const avgRating = businessReviews.length > 0
        ? businessReviews.reduce((sum, r) => sum + r.rating, 0) / businessReviews.length
        : 0;
      return {
        ...b,
        reviewCount: businessReviews.length,
        avgRating,
      };
    });
  }, [businesses, reviews]);

  const topByReviews = useMemo(() => {
    return [...businessStats]
      .sort((a, b) => b.reviewCount - a.reviewCount)
      .slice(0, 10);
  }, [businessStats]);

  const topByRating = useMemo(() => {
    return [...businessStats]
      .filter(b => b.reviewCount >= 5)
      .sort((a, b) => b.avgRating - a.avgRating)
      .slice(0, 10);
  }, [businessStats]);

  const topReferrers = useMemo(() => {
    return [...businesses]
      .filter(b => (b.referral_count || 0) > 0)
      .sort((a, b) => (b.referral_count || 0) - (a.referral_count || 0))
      .slice(0, 10);
  }, [businesses]);

  const referralNetwork = useMemo(() => {
    return businesses
      .filter(b => b.referred_by)
      .map(b => {
        const referrer = businesses.find(ref => ref.referral_code === b.referred_by);
        return { business: b, referrer };
      });
  }, [businesses]);

  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  };

  const generateReferralCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleAdd = async () => {
    if (!form.name.trim()) return alert("El nombre es requerido");
    const slug = form.slug || generateSlug(form.name);
    const newBusiness = {
      name: form.name.trim(),
      slug,
      private_token: generateUUID(),
      logo_url: form.logo_url || "",
      referral_code: generateReferralCode(),
      referral_count: 0,
      referral_balance: 0,
      created_at: new Date(),
    };
    try {
      await addDoc(collection(db, "businesses"), newBusiness);
      setForm({ name: "", slug: "", logo_url: "" });
      setShowAddForm(false);
      fetchData();
    } catch (err) {
      alert("Error al crear negocio");
    }
  };

  const handleEdit = async (business: Business) => {
    if (!form.name.trim()) return alert("El nombre es requerido");
    try {
      await updateDoc(doc(db, "businesses", business.id), {
        name: form.name.trim(),
        slug: form.slug || business.slug,
        logo_url: form.logo_url,
      });
      setEditingId(null);
      setForm({ name: "", slug: "", logo_url: "" });
      fetchData();
    } catch (err) {
      alert("Error al actualizar negocio");
    }
  };

  const handleDelete = async (business: Business) => {
    if (!confirm(`¿Eliminar "${business.name}"? Esta acción no se puede deshacer.`)) return;
    try {
      await deleteDoc(doc(db, "businesses", business.id));
      fetchData();
    } catch (err) {
      alert("Error al eliminar negocio");
    }
  };

  const startEdit = (business: Business) => {
    setEditingId(business.id);
    setForm({ name: business.name, slug: business.slug, logo_url: business.logo_url || "" });
    setShowAddForm(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ name: "", slug: "", logo_url: "" });
  };

  const filteredBusinesses = useMemo(() => {
    let filtered = businessStats.filter((b) =>
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.slug.toLowerCase().includes(search.toLowerCase()) ||
      (b.email || '').toLowerCase().includes(search.toLowerCase())
    );
    switch (sortBy) {
      case 'reviews': filtered.sort((a, b) => b.reviewCount - a.reviewCount); break;
      case 'rating': filtered.sort((a, b) => b.avgRating - a.avgRating); break;
      case 'referrals': filtered.sort((a, b) => (b.referral_count || 0) - (a.referral_count || 0)); break;
      case 'created': filtered.sort((a, b) => {
        const dateA = a.created_at?.toDate?.() || new Date(0);
        const dateB = b.created_at?.toDate?.() || new Date(0);
        return dateB.getTime() - dateA.getTime();
      }); break;
      default: filtered.sort((a, b) => a.name.localeCompare(b.name));
    }
    return filtered;
  }, [businessStats, search, sortBy]);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '-';
    const date = timestamp?.toDate?.() || new Date(timestamp);
    return date.toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const isExpired = (business: Business) => {
    if (!business.expires_at) return false;
    const expiresAt = business.expires_at?.toDate?.() || new Date(business.expires_at);
    return expiresAt < new Date();
  };

  if (!authorized) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 bg-gray-200 dark:bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Acceso Denegado</h1>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-white">
      <div className="fixed top-4 right-4 z-50"><ThemeToggle /></div>

      <header className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                ValoraLocal Admin
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Panel de administración</p>
            </div>
            <button onClick={() => { setShowAddForm(true); setEditingId(null); setForm({ name: "", slug: "", logo_url: "" }); setActiveTab('businesses'); }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
              + Agregar Negocio
            </button>
          </div>
        </div>
      </header>

      <div className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex gap-6">
            {[
              { id: 'overview', label: 'Resumen', icon: '📊' },
              { id: 'businesses', label: 'Negocios', icon: '🏢' },
              { id: 'referrals', label: 'Referidos', icon: '🤝' },
              { id: 'top', label: 'Rankings', icon: '🏆' },
            ].map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as TabType)} className={`py-4 px-2 border-b-2 font-medium transition-colors ${activeTab === tab.id ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                {tab.icon} {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-gray-200 dark:border-zinc-800">
                <div className="text-3xl font-bold text-blue-600">{stats.totalBusinesses}</div>
                <div className="text-gray-500 dark:text-gray-400 text-sm">Total Negocios</div>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-gray-200 dark:border-zinc-800">
                <div className="text-3xl font-bold text-green-600">{stats.activeBusinesses}</div>
                <div className="text-gray-500 dark:text-gray-400 text-sm">Activos</div>
                {stats.expiredBusinesses > 0 && <div className="text-xs text-red-500 mt-1">{stats.expiredBusinesses} expirados</div>}
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-gray-200 dark:border-zinc-800">
                <div className="text-3xl font-bold text-purple-600">{stats.totalReviews}</div>
                <div className="text-gray-500 dark:text-gray-400 text-sm">Total Reseñas</div>
                <div className="text-xs text-gray-400 mt-1">⭐ {stats.averageRating.toFixed(1)} promedio</div>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-gray-200 dark:border-zinc-800">
                <div className="text-3xl font-bold text-amber-600">${stats.revenueEstimate.toLocaleString('es-CL')}</div>
                <div className="text-gray-500 dark:text-gray-400 text-sm">Ingresos Est./mes</div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-gray-200 dark:border-zinc-800">
                <h3 className="font-semibold mb-4 flex items-center gap-2"><span className="text-2xl">🤝</span> Sistema de Referidos</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div><div className="text-2xl font-bold text-green-600">{stats.totalReferrals}</div><div className="text-sm text-gray-500">Referidos totales</div></div>
                  <div><div className="text-2xl font-bold text-amber-600">${stats.totalReferralBalance.toLocaleString('es-CL')}</div><div className="text-sm text-gray-500">Saldo pendiente</div></div>
                </div>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-gray-200 dark:border-zinc-800">
                <h3 className="font-semibold mb-4 flex items-center gap-2"><span className="text-2xl">📈</span> Promedios</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div><div className="text-2xl font-bold text-blue-600">{(stats.totalReviews / (stats.totalBusinesses || 1)).toFixed(1)}</div><div className="text-sm text-gray-500">Reseñas/negocio</div></div>
                  <div><div className="text-2xl font-bold text-purple-600">{(stats.totalReferrals / (stats.totalBusinesses || 1)).toFixed(2)}</div><div className="text-sm text-gray-500">Referidos/negocio</div></div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-gray-200 dark:border-zinc-800">
              <h3 className="font-semibold mb-4">🕐 Últimos Negocios Registrados</h3>
              <div className="space-y-3">
                {[...businesses].sort((a, b) => {
                  const dateA = a.created_at?.toDate?.() || new Date(0);
                  const dateB = b.created_at?.toDate?.() || new Date(0);
                  return dateB.getTime() - dateA.getTime();
                }).slice(0, 5).map((b) => (
                  <div key={b.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-zinc-800 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center">
                        {b.logo_url ? <img src={b.logo_url} alt="" className="w-8 h-8 rounded object-cover" /> : <span className="text-lg">🏢</span>}
                      </div>
                      <div><div className="font-medium">{b.name}</div><div className="text-xs text-gray-500">{b.email || 'Sin email'}</div></div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">{formatDate(b.created_at)}</div>
                      {b.referred_by && <div className="text-xs text-green-600">Referido ✓</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'businesses' && (
          <div className="space-y-6">
            {showAddForm && (
              <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-gray-200 dark:border-zinc-800">
                <h3 className="text-lg font-semibold mb-4">Agregar Nuevo Negocio</h3>
                <div className="grid md:grid-cols-3 gap-4 mb-4">
                  <input type="text" placeholder="Nombre del negocio *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-gray-50 dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500" />
                  <input type="text" placeholder="Slug (auto-generado)" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="bg-gray-50 dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500" />
                  <input type="text" placeholder="URL del logo (opcional)" value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} className="bg-gray-50 dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="flex gap-2">
                  <button onClick={handleAdd} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium">Crear Negocio</button>
                  <button onClick={() => setShowAddForm(false)} className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 px-6 py-2 rounded-lg font-medium">Cancelar</button>
                </div>
              </div>
            )}

            <div className="flex flex-col md:flex-row gap-4">
              <input type="text" placeholder="🔍 Buscar negocios..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-800 rounded-lg px-4 py-3" />
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} className="bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-800 rounded-lg px-4 py-3">
                <option value="name">Ordenar: Nombre</option>
                <option value="reviews">Ordenar: Más reseñas</option>
                <option value="rating">Ordenar: Mejor rating</option>
                <option value="referrals">Ordenar: Más referidos</option>
                <option value="created">Ordenar: Más reciente</option>
              </select>
            </div>

            <div className="text-sm text-gray-500">Mostrando {filteredBusinesses.length} de {businesses.length} negocios</div>

            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-zinc-800">
                  <tr>
                    <th className="text-left px-4 py-4 font-medium">Negocio</th>
                    <th className="text-left px-4 py-4 font-medium">Email</th>
                    <th className="text-center px-4 py-4 font-medium">Reseñas</th>
                    <th className="text-center px-4 py-4 font-medium">Rating</th>
                    <th className="text-center px-4 py-4 font-medium">Referidos</th>
                    <th className="text-center px-4 py-4 font-medium">Estado</th>
                    <th className="text-left px-4 py-4 font-medium">Links</th>
                    <th className="text-right px-4 py-4 font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-zinc-800">
                  {filteredBusinesses.map((business) => (
                    <tr key={business.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50">
                      {editingId === business.id ? (
                        <>
                          <td className="px-4 py-4" colSpan={4}>
                            <div className="flex gap-2">
                              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-gray-50 dark:bg-zinc-800 border rounded px-3 py-2 flex-1" placeholder="Nombre" />
                              <input type="text" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="bg-gray-50 dark:bg-zinc-800 border rounded px-3 py-2 w-32" placeholder="Slug" />
                              <input type="text" value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} className="bg-gray-50 dark:bg-zinc-800 border rounded px-3 py-2 flex-1" placeholder="URL logo" />
                            </div>
                          </td>
                          <td className="px-4 py-4 text-right" colSpan={4}>
                            <button onClick={() => handleEdit(business)} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded mr-2 text-sm">Guardar</button>
                            <button onClick={cancelEdit} className="bg-gray-200 dark:bg-gray-600 px-3 py-1 rounded text-sm">Cancelar</button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gray-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center flex-shrink-0">
                                {business.logo_url ? <img src={business.logo_url} alt="" className="w-8 h-8 rounded object-cover" /> : <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
                              </div>
                              <div><div className="font-medium">{business.name}</div><div className="text-xs text-gray-500">{business.slug}</div></div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-500">{business.email || '-'}</td>
                          <td className="px-4 py-4 text-center font-semibold">{business.reviewCount}</td>
                          <td className="px-4 py-4 text-center">{business.reviewCount > 0 ? <span className="inline-flex items-center gap-1"><span className="text-amber-500">⭐</span>{business.avgRating.toFixed(1)}</span> : <span className="text-gray-400">-</span>}</td>
                          <td className="px-4 py-4 text-center">
                            <span className={`font-semibold ${(business.referral_count || 0) > 0 ? 'text-green-600' : 'text-gray-400'}`}>{business.referral_count || 0}</span>
                            {(business.referral_balance || 0) > 0 && <div className="text-xs text-amber-600">${(business.referral_balance || 0).toLocaleString('es-CL')}</div>}
                          </td>
                          <td className="px-4 py-4 text-center">
                            {isExpired(business) ? <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Expirado</span> : business.expires_at ? <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Activo</span> : <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-gray-400">Trial</span>}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex gap-2">
                              <a href={`/encuesta/${business.slug}`} target="_blank" className="text-xs bg-blue-100 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 px-2 py-1 rounded hover:bg-blue-200">Encuesta</a>
                              <a href={`/dashboard/${business.private_token}`} target="_blank" className="text-xs bg-purple-100 dark:bg-purple-600/20 text-purple-600 dark:text-purple-400 px-2 py-1 rounded hover:bg-purple-200">Dashboard</a>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button onClick={() => startEdit(business)} className="text-blue-600 hover:text-blue-700 p-1" title="Editar"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                              <button onClick={() => handleDelete(business)} className="text-red-600 hover:text-red-700 p-1" title="Eliminar"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredBusinesses.length === 0 && <div className="text-center py-12 text-gray-500">No se encontraron negocios</div>}
            </div>
          </div>
        )}

        {activeTab === 'referrals' && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-gray-200 dark:border-zinc-800">
                <div className="text-3xl font-bold text-green-600">{stats.totalReferrals}</div>
                <div className="text-gray-500 text-sm">Total Referidos</div>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-gray-200 dark:border-zinc-800">
                <div className="text-3xl font-bold text-amber-600">${stats.totalReferralBalance.toLocaleString('es-CL')}</div>
                <div className="text-gray-500 text-sm">Saldo Pendiente Total</div>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-gray-200 dark:border-zinc-800">
                <div className="text-3xl font-bold text-blue-600">{referralNetwork.length}</div>
                <div className="text-gray-500 text-sm">Negocios Referidos</div>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-gray-200 dark:border-zinc-800">
              <h3 className="text-lg font-semibold mb-4">🏆 Top Referidores</h3>
              {topReferrers.length > 0 ? (
                <div className="space-y-3">
                  {topReferrers.map((b, i) => (
                    <div key={b.id} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-zinc-800 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${i === 0 ? 'bg-amber-500' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-amber-700' : 'bg-gray-600'}`}>{i + 1}</div>
                        <div><div className="font-medium">{b.name}</div><div className="text-xs text-gray-500">Código: {b.referral_code}</div></div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600">{b.referral_count} referidos</div>
                        <div className="text-sm text-amber-600">${(b.referral_balance || 0).toLocaleString('es-CL')}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : <div className="text-center py-8 text-gray-500">Aún no hay referidos</div>}
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-gray-200 dark:border-zinc-800">
              <h3 className="text-lg font-semibold mb-4">🔗 Red de Referidos</h3>
              {referralNetwork.length > 0 ? (
                <div className="space-y-3">
                  {referralNetwork.map(({ business, referrer }) => (
                    <div key={business.id} className="flex items-center gap-4 py-3 border-b border-gray-100 dark:border-zinc-800 last:border-0">
                      <div className="flex-1"><div className="font-medium">{business.name}</div><div className="text-xs text-gray-500">{formatDate(business.created_at)}</div></div>
                      <div className="text-gray-400">←</div>
                      <div className="flex-1 text-right">
                        {referrer ? <><div className="font-medium text-green-600">{referrer.name}</div><div className="text-xs text-gray-500">Código: {business.referred_by}</div></> : <div className="text-gray-500">Código: {business.referred_by}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : <div className="text-center py-8 text-gray-500">Aún no hay negocios referidos</div>}
            </div>
          </div>
        )}

        {activeTab === 'top' && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-gray-200 dark:border-zinc-800">
              <h3 className="text-lg font-semibold mb-4">📝 Top por Reseñas</h3>
              {topByReviews.length > 0 ? (
                <div className="space-y-3">
                  {topByReviews.map((b, i) => (
                    <div key={b.id} className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold text-white ${i === 0 ? 'bg-amber-500' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-amber-700' : 'bg-gray-600'}`}>{i + 1}</div>
                        <span className="font-medium truncate max-w-[200px]">{b.name}</span>
                      </div>
                      <div className="font-bold text-blue-600">{b.reviewCount} reseñas</div>
                    </div>
                  ))}
                </div>
              ) : <div className="text-center py-8 text-gray-500">Sin datos</div>}
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-gray-200 dark:border-zinc-800">
              <h3 className="text-lg font-semibold mb-4">⭐ Top por Rating</h3>
              <p className="text-xs text-gray-500 mb-4">(mínimo 5 reseñas)</p>
              {topByRating.length > 0 ? (
                <div className="space-y-3">
                  {topByRating.map((b, i) => (
                    <div key={b.id} className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold text-white ${i === 0 ? 'bg-amber-500' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-amber-700' : 'bg-gray-600'}`}>{i + 1}</div>
                        <span className="font-medium truncate max-w-[200px]">{b.name}</span>
                      </div>
                      <div className="flex items-center gap-1"><span className="text-amber-500">⭐</span><span className="font-bold">{b.avgRating.toFixed(2)}</span><span className="text-gray-500 text-xs">({b.reviewCount})</span></div>
                    </div>
                  ))}
                </div>
              ) : <div className="text-center py-8 text-gray-500">Se requieren al menos 5 reseñas</div>}
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-gray-200 dark:border-zinc-800">
              <h3 className="text-lg font-semibold mb-4">💰 Mayor Saldo por Referidos</h3>
              {businesses.filter(b => (b.referral_balance || 0) > 0).length > 0 ? (
                <div className="space-y-3">
                  {[...businesses].filter(b => (b.referral_balance || 0) > 0).sort((a, b) => (b.referral_balance || 0) - (a.referral_balance || 0)).slice(0, 10).map((b, i) => (
                    <div key={b.id} className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold text-white ${i === 0 ? 'bg-green-500' : i === 1 ? 'bg-green-400' : i === 2 ? 'bg-green-600' : 'bg-gray-600'}`}>{i + 1}</div>
                        <span className="font-medium truncate max-w-[200px]">{b.name}</span>
                      </div>
                      <div className="font-bold text-green-600">${(b.referral_balance || 0).toLocaleString('es-CL')}</div>
                    </div>
                  ))}
                </div>
              ) : <div className="text-center py-8 text-gray-500">Sin saldos</div>}
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-gray-200 dark:border-zinc-800">
              <h3 className="text-lg font-semibold mb-4">⚠️ Suscripciones Expiradas</h3>
              {businesses.filter(isExpired).length > 0 ? (
                <div className="space-y-3">
                  {businesses.filter(isExpired).sort((a, b) => {
                    const dateA = a.expires_at?.toDate?.() || new Date(0);
                    const dateB = b.expires_at?.toDate?.() || new Date(0);
                    return dateB.getTime() - dateA.getTime();
                  }).slice(0, 10).map((b) => (
                    <div key={b.id} className="flex items-center justify-between py-2">
                      <div><div className="font-medium">{b.name}</div><div className="text-xs text-gray-500">{b.email || '-'}</div></div>
                      <div className="text-right"><div className="text-sm text-red-600">Expiró</div><div className="text-xs text-gray-500">{formatDate(b.expires_at)}</div></div>
                    </div>
                  ))}
                </div>
              ) : <div className="text-center py-8 text-green-600">✓ No hay suscripciones expiradas</div>}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
