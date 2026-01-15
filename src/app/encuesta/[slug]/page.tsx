
"use client";
import { useEffect, useState } from "react";
import { db } from "@/firebase/client";
import { collection, addDoc, Timestamp, getDocs, query, where } from "firebase/firestore";
import { useParams } from "next/navigation";

export default function EncuestaPage() {
  const params = useParams<{ slug: string }>();
  const [business, setBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ rating: 0, comment: "", contact_email: "" });
  const [hoverRating, setHoverRating] = useState(0);

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
      setSuccess(true);
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
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">🎉</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">¡Gracias por tu opinión!</h2>
          <p className="text-gray-600 mb-6">Tu feedback nos ayuda a mejorar cada día.</p>
          <button
            onClick={() => setSuccess(false)}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Enviar otra opinión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4">
      <main className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-white rounded-2xl shadow-md flex items-center justify-center mx-auto mb-4">
            {business.logo_url ? (
              <img src={business.logo_url} alt={business.name} className="w-16 h-16 rounded-xl object-cover" />
            ) : (
              <span className="text-4xl">🏪</span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-800">{business.name}</h1>
          <p className="text-gray-500 mt-1">¿Cómo fue tu experiencia?</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-6 md:p-8 space-y-6">
          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
              Tu calificación
            </label>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => handleRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="focus:outline-none transform transition-transform hover:scale-110"
                >
                  <span
                    className={`text-5xl cursor-pointer transition-colors ${
                      (hoverRating || form.rating) >= star
                        ? "text-yellow-400"
                        : "text-gray-200"
                    }`}
                  >
                    ★
                  </span>
                </button>
              ))}
            </div>
            <p className="text-center text-sm text-gray-500 mt-2">
              {form.rating === 1 && "Muy malo 😞"}
              {form.rating === 2 && "Malo 😕"}
              {form.rating === 3 && "Regular 😐"}
              {form.rating === 4 && "Bueno 🙂"}
              {form.rating === 5 && "¡Excelente! 🤩"}
            </p>
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
          <button
            type="submit"
            disabled={submitting || !form.rating}
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
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-sm text-gray-400 mt-6">
          Powered by <span className="font-medium">Satisfacción</span> ⭐
        </p>
      </main>
    </div>
  );
}
