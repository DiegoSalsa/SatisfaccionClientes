"use client";
import { useEffect, useState } from "react";
import { db } from "@/firebase/client";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { useParams, useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeProvider";

const ADMIN_TOKEN = "super-admin-secreto-2026-xyz";

interface Business {
  id: string;
  name: string;
  slug: string;
  private_token: string;
  logo_url: string;
}

export default function AdminPage() {
  const params = useParams<{ admin_token: string }>();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", slug: "", logo_url: "" });
  const [showAddForm, setShowAddForm] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (params.admin_token !== ADMIN_TOKEN) {
      setAuthorized(false);
      setLoading(false);
      return;
    }
    setAuthorized(true);
    fetchBusinesses();
  }, [params.admin_token]);

  async function fetchBusinesses() {
    setLoading(true);
    const snapshot = await getDocs(collection(db, "businesses"));
    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Business));
    data.sort((a, b) => a.name.localeCompare(b.name));
    setBusinesses(data);
    setLoading(false);
  }

  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const handleAdd = async () => {
    if (!form.name.trim()) return alert("El nombre es requerido");
    
    const slug = form.slug || generateSlug(form.name);
    const newBusiness = {
      id: `business_${Date.now()}`,
      name: form.name.trim(),
      slug,
      private_token: generateUUID(),
      logo_url: form.logo_url || "",
    };

    try {
      await addDoc(collection(db, "businesses"), newBusiness);
      setForm({ name: "", slug: "", logo_url: "" });
      setShowAddForm(false);
      fetchBusinesses();
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
      fetchBusinesses();
    } catch (err) {
      alert("Error al actualizar negocio");
    }
  };

  const handleDelete = async (business: Business) => {
    if (!confirm(`¿Eliminar "${business.name}"? Esta acción no se puede deshacer.`)) return;
    
    try {
      await deleteDoc(doc(db, "businesses", business.id));
      fetchBusinesses();
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

  const filteredBusinesses = businesses.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.slug.toLowerCase().includes(search.toLowerCase())
  );

  if (!authorized) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-white">Acceso Denegado</h1>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Theme Toggle */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      {/* Header */}
      <header className="bg-zinc-900 border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">🛠️ Admin Panel</h1>
              <p className="text-gray-400 text-sm">Gestión de negocios</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-400">{businesses.length} negocios</span>
              <button
                onClick={() => { setShowAddForm(true); setEditingId(null); setForm({ name: "", slug: "", logo_url: "" }); }}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                + Agregar Negocio
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Add Form */}
        {showAddForm && (
          <div className="bg-zinc-900 rounded-xl p-6 mb-8 border border-zinc-800">
            <h3 className="text-lg font-semibold mb-4">Agregar Nuevo Negocio</h3>
            <div className="grid md:grid-cols-3 gap-4 mb-4">
              <input
                type="text"
                placeholder="Nombre del negocio *"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
              />
              <input
                type="text"
                placeholder="Slug (auto-generado si vacío)"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                className="bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
              />
              <input
                type="text"
                placeholder="URL del logo (opcional)"
                value={form.logo_url}
                onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
                className="bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAdd}
                className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Crear Negocio
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="bg-gray-600 hover:bg-gray-500 px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="🔍 Buscar negocios..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-96 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
          />
        </div>

        {/* Businesses Table */}
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
          <table className="w-full">
            <thead className="bg-zinc-800">
              <tr>
                <th className="text-left px-6 py-4 font-medium">Negocio</th>
                <th className="text-left px-6 py-4 font-medium">Slug</th>
                <th className="text-left px-6 py-4 font-medium">Links</th>
                <th className="text-right px-6 py-4 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filteredBusinesses.map((business) => (
                <tr key={business.id} className="hover:bg-zinc-800/50">
                  {editingId === business.id ? (
                    <>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          className="bg-zinc-800 border border-zinc-700 rounded px-3 py-2 w-full text-white"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={form.slug}
                          onChange={(e) => setForm({ ...form, slug: e.target.value })}
                          className="bg-zinc-800 border border-zinc-700 rounded px-3 py-2 w-full text-white"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={form.logo_url}
                          onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
                          placeholder="URL logo"
                          className="bg-zinc-800 border border-zinc-700 rounded px-3 py-2 w-full text-white"
                        />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleEdit(business)}
                          className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded mr-2 text-sm"
                        >
                          Guardar
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="bg-gray-600 hover:bg-gray-500 px-3 py-1 rounded text-sm"
                        >
                          Cancelar
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center">
                            {business.logo_url ? (
                              <img src={business.logo_url} alt="" className="w-8 h-8 rounded object-cover" />
                            ) : (
                              <span>🏪</span>
                            )}
                          </div>
                          <span className="font-medium">{business.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-zinc-400">{business.slug}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <a
                            href={`/encuesta/${business.slug}`}
                            target="_blank"
                            className="text-xs bg-blue-600/20 text-blue-400 px-2 py-1 rounded hover:bg-blue-600/30"
                          >
                            Encuesta
                          </a>
                          <a
                            href={`/dashboard/${business.private_token}`}
                            target="_blank"
                            className="text-xs bg-purple-600/20 text-purple-400 px-2 py-1 rounded hover:bg-purple-600/30"
                          >
                            Dashboard
                          </a>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => startEdit(business)}
                          className="text-blue-400 hover:text-blue-300 px-3 py-1 text-sm"
                        >
                          ✏️ Editar
                        </button>
                        <button
                          onClick={() => handleDelete(business)}
                          className="text-red-400 hover:text-red-300 px-3 py-1 text-sm"
                        >
                          🗑️ Eliminar
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredBusinesses.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              No se encontraron negocios
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
