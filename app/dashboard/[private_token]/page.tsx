"use client";
import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { db } from "@/firebase/client";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { useParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { ThemeToggle } from "@/components/ThemeProvider";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import * as XLSX from "xlsx";
import { motion } from "framer-motion";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

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
  const [currentPage, setCurrentPage] = useState(1);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoSaved, setLogoSaved] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [showEmails, setShowEmails] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [showPaymentInfo, setShowPaymentInfo] = useState(false);
  const [uploadingMenu, setUploadingMenu] = useState(false);
  const [menuSaved, setMenuSaved] = useState(false);
  const [removingMenu, setRemovingMenu] = useState(false);
  const menuInputRef = useRef<HTMLInputElement>(null);
  const reviewsPerPage = 15;

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

  // Emails únicos recolectados
  const collectedEmails = useMemo(() => {
    const emails = reviews
      .map(r => r.contact_email?.trim().toLowerCase())
      .filter((email): email is string => Boolean(email) && email!.includes('@'));
    return [...new Set(emails)].sort();
  }, [reviews]);

  // Copiar todos los emails al portapapeles
  const copyAllEmails = () => {
    navigator.clipboard.writeText(collectedEmails.join('\n'));
    alert(`¡${collectedEmails.length} emails copiados!`);
  };

  // Exportar emails a CSV
  const exportEmailsToCSV = () => {
    const csv = 'Email\n' + collectedEmails.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `emails-${business?.slug || 'export'}.csv`;
    link.click();
  };

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
    setCurrentPage(1);
  };

  // Exportar a PDF
  const exportToPDF = useCallback(async () => {
    if (!business) return;
    
    setExportingPDF(true);
    
    try {
      // Crear un contenedor temporal para el reporte
      const reportContainer = document.createElement('div');
      reportContainer.style.position = 'absolute';
      reportContainer.style.left = '-9999px';
      reportContainer.style.top = '0';
      reportContainer.style.width = '800px';
      reportContainer.style.padding = '40px';
      reportContainer.style.backgroundColor = 'white';
      reportContainer.style.fontFamily = 'Arial, sans-serif';
      
      const avg = reviews.length
        ? (reviews.reduce((a, r) => a + (r.rating || 0), 0) / reviews.length).toFixed(1)
        : "0.0";
      
      const ratingCounts = [5, 4, 3, 2, 1].map((star) => ({
        star,
        count: reviews.filter((r) => r.rating === star).length,
        percent: reviews.length ? (reviews.filter((r) => r.rating === star).length / reviews.length) * 100 : 0,
      }));

      const today = new Date().toLocaleDateString('es-CL', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });

      reportContainer.innerHTML = `
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #3B82F6; padding-bottom: 20px;">
          <h1 style="color: #1F2937; margin: 0 0 8px; font-size: 28px;">Reporte de Satisfacción</h1>
          <h2 style="color: #3B82F6; margin: 0 0 8px; font-size: 22px;">${business.name}</h2>
          <p style="color: #6B7280; margin: 0; font-size: 14px;">Generado el ${today}</p>
        </div>

        <div style="display: flex; gap: 20px; margin-bottom: 30px;">
          <div style="flex: 1; background: linear-gradient(135deg, #3B82F6, #8B5CF6); border-radius: 12px; padding: 24px; text-align: center; color: white;">
            <p style="margin: 0 0 8px; font-size: 14px; opacity: 0.9;">Calificación Promedio</p>
            <p style="margin: 0; font-size: 48px; font-weight: bold;">${avg}</p>
            <p style="margin: 8px 0 0; font-size: 24px;">★★★★★</p>
          </div>
          <div style="flex: 1; background: #F3F4F6; border-radius: 12px; padding: 24px; text-align: center;">
            <p style="color: #6B7280; margin: 0 0 8px; font-size: 14px;">Total de Opiniones</p>
            <p style="color: #1F2937; margin: 0; font-size: 48px; font-weight: bold;">${reviews.length}</p>
            <p style="color: #6B7280; margin: 8px 0 0; font-size: 14px;">reseñas recibidas</p>
          </div>
        </div>

        <div style="background: #F9FAFB; border-radius: 12px; padding: 24px; margin-bottom: 30px;">
          <h3 style="color: #1F2937; margin: 0 0 16px; font-size: 18px;">Distribución de Calificaciones</h3>
          ${ratingCounts.map(({ star, count, percent }) => `
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
              <span style="width: 60px; color: #374151; font-size: 14px;">${star} estrellas</span>
              <div style="flex: 1; height: 20px; background: #E5E7EB; border-radius: 10px; overflow: hidden;">
                <div style="width: ${percent}%; height: 100%; background: linear-gradient(90deg, #FBBF24, #F59E0B); border-radius: 10px;"></div>
              </div>
              <span style="width: 80px; text-align: right; color: #6B7280; font-size: 14px;">${count} (${percent.toFixed(0)}%)</span>
            </div>
          `).join('')}
        </div>

        ${filteredReviews.slice(0, 10).length > 0 ? `
        <div style="margin-bottom: 30px;">
          <h3 style="color: #1F2937; margin: 0 0 16px; font-size: 18px;">Últimas Opiniones</h3>
          ${filteredReviews.slice(0, 10).map(r => `
            <div style="background: white; border: 1px solid #E5E7EB; border-radius: 8px; padding: 16px; margin-bottom: 12px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <span style="color: #FBBF24; font-size: 18px;">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</span>
                <span style="color: #9CA3AF; font-size: 12px;">${r.timestamp?.toDate?.()?.toLocaleDateString('es-CL') || ''}</span>
              </div>
              ${r.comment ? `<p style="color: #374151; margin: 0; font-size: 14px; line-height: 1.5;">"${r.comment}"</p>` : '<p style="color: #9CA3AF; margin: 0; font-size: 14px; font-style: italic;">Sin comentario</p>'}
            </div>
          `).join('')}
        </div>
        ` : ''}

        <div style="text-align: center; padding-top: 20px; border-top: 1px solid #E5E7EB;">
          <p style="color: #9CA3AF; font-size: 12px; margin: 0;">
            Reporte generado por ValoraLocal · ${window.location.origin}/encuesta/${business.slug}
          </p>
        </div>
      `;

      document.body.appendChild(reportContainer);

      const canvas = await html2canvas(reportContainer, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      document.body.removeChild(reportContainer);

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 0;

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`reporte-${business.slug}-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generando PDF:', error);
      alert('Error al generar el PDF. Intenta de nuevo.');
    }
    
    setExportingPDF(false);
  }, [business, reviews, filteredReviews]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

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

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !business?.id) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona una imagen');
      return;
    }

    // Validar tamaño (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen no puede superar los 5MB');
      return;
    }

    setUploadingLogo(true);
    setLogoSaved(false);

    try {
      // Obtener firma de Cloudinary
      const signRes = await fetch('/api/cloudinary/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ public_id: `logo_${business.slug}` }),
      });
      
      if (!signRes.ok) throw new Error('Error al obtener firma');
      
      const { signature, timestamp, cloudName, apiKey } = await signRes.json();

      // Subir a Cloudinary
      const formData = new FormData();
      formData.append('file', file);
      formData.append('signature', signature);
      formData.append('timestamp', timestamp.toString());
      formData.append('api_key', apiKey);
      formData.append('upload_preset', 'valoralocal_logos');
      formData.append('folder', 'valoralocal/logos');
      formData.append('public_id', `logo_${business.slug}`);

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: 'POST', body: formData }
      );

      if (!uploadRes.ok) throw new Error('Error al subir imagen');

      const uploadData = await uploadRes.json();
      const logoUrl = uploadData.secure_url;

      // Guardar URL en Firestore
      const businessRef = doc(db, 'businesses', business.id);
      await updateDoc(businessRef, { logo_url: logoUrl });

      setBusiness({ ...business, logo_url: logoUrl });
      setLogoSaved(true);
      setTimeout(() => setLogoSaved(false), 3000);
    } catch (err) {
      console.error('Error subiendo logo:', err);
      alert('Error al subir el logo. Intenta de nuevo.');
    }

    setUploadingLogo(false);
    // Reset input
    if (logoInputRef.current) logoInputRef.current.value = '';
  };

  const handleMenuUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !business?.id) return;

    // Validar tipo de archivo (solo PDF)
    if (file.type !== 'application/pdf') {
      alert('Por favor selecciona un archivo PDF');
      return;
    }

    // Validar tamaño (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('El archivo no puede superar los 10MB');
      return;
    }

    setUploadingMenu(true);
    setMenuSaved(false);

    try {
      // Obtener firma de Cloudinary con folder correcto para menus
      const signRes = await fetch('/api/cloudinary/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          public_id: `menu_${business.slug}`,
          folder: 'valoralocal/menus'
        }),
      });
      
      if (!signRes.ok) throw new Error('Error al obtener firma');
      
      const { signature, timestamp, cloudName, apiKey, folder } = await signRes.json();

      // Subir a Cloudinary (usando auto upload para PDFs)
      const formData = new FormData();
      formData.append('file', file);
      formData.append('signature', signature);
      formData.append('timestamp', timestamp.toString());
      formData.append('api_key', apiKey);
      formData.append('upload_preset', 'valoralocal_logos');
      formData.append('folder', folder);
      formData.append('public_id', `menu_${business.slug}`);

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
        { method: 'POST', body: formData }
      );

      const uploadData = await uploadRes.json();
      
      if (!uploadRes.ok) {
        console.error('Cloudinary error:', uploadData);
        throw new Error(uploadData.error?.message || 'Error al subir archivo');
      }

      const menuUrl = uploadData.secure_url;

      // Guardar URL en Firestore
      const businessRef = doc(db, 'businesses', business.id);
      await updateDoc(businessRef, { menu_pdf_url: menuUrl });

      setBusiness({ ...business, menu_pdf_url: menuUrl });
      setMenuSaved(true);
      setTimeout(() => setMenuSaved(false), 3000);
    } catch (err) {
      console.error('Error subiendo carta:', err);
      alert('Error al subir la carta. Intenta de nuevo.');
    }

    setUploadingMenu(false);
    if (menuInputRef.current) menuInputRef.current.value = '';
  };

  const handleRemoveMenu = async () => {
    if (!business?.id) return;
    if (!confirm('¿Estás seguro de eliminar la carta? Los clientes ya no podrán verla al escanear el QR.')) return;
    
    setRemovingMenu(true);
    try {
      const businessRef = doc(db, 'businesses', business.id);
      await updateDoc(businessRef, { menu_pdf_url: null });
      setBusiness({ ...business, menu_pdf_url: null });
    } catch (err) {
      console.error('Error eliminando carta:', err);
      alert('Error al eliminar la carta');
    }
    setRemovingMenu(false);
  };

  const handleSaveName = async () => {
    if (!business?.id || !newName.trim()) return;
    setSavingName(true);
    try {
      const businessRef = doc(db, "businesses", business.id);
      await updateDoc(businessRef, {
        name: newName.trim(),
      });
      setBusiness({ ...business, name: newName.trim() });
      setEditingName(false);
    } catch (err) {
      console.error("Error guardando nombre:", err);
      alert("Error al guardar el nombre");
    }
    setSavingName(false);
  };

  const startEditingName = () => {
    setNewName(business?.name || "");
    setEditingName(true);
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
    <div className="min-h-screen bg-gray-50 dark:bg-black transition-colors overflow-x-hidden">
      {/* Header */}
      <header className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800">
        <div className="max-w-5xl mx-auto px-4 py-4 sm:py-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
              {business.logo_url ? (
                <img src={business.logo_url} alt={business.name} className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl object-contain flex-shrink-0" />
              ) : (
                <div className="w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              )}
              <div className="min-w-0 flex-1">
                {editingName ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="text-lg sm:text-2xl font-bold text-gray-800 dark:text-white bg-gray-100 dark:bg-zinc-800 rounded-lg px-3 py-1 border border-gray-300 dark:border-zinc-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full max-w-xs"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveName();
                        if (e.key === 'Escape') setEditingName(false);
                      }}
                    />
                    <button
                      onClick={handleSaveName}
                      disabled={savingName}
                      className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50"
                    >
                      {savingName ? (
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin block"></span>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={() => setEditingName(false)}
                      className="p-2 bg-gray-200 dark:bg-zinc-700 hover:bg-gray-300 dark:hover:bg-zinc-600 text-gray-600 dark:text-zinc-300 rounded-lg"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 group">
                    <h1 className="text-lg sm:text-2xl font-bold text-gray-800 dark:text-white truncate">{business.name}</h1>
                    <button
                      onClick={startEditingName}
                      className="p-1.5 text-gray-400 hover:text-gray-600 dark:text-zinc-500 dark:hover:text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Editar nombre"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  </div>
                )}
                <p className="text-gray-500 dark:text-zinc-400 text-xs sm:text-sm">Dashboard de valoraciones</p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 sm:py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Average Rating Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            whileHover={{ scale: 1.02, y: -5 }}
            className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm p-5 sm:p-6 border border-gray-100 dark:border-zinc-800 cursor-default hover:shadow-lg transition-shadow"
          >
            <p className="text-gray-500 dark:text-zinc-400 text-sm mb-2">Calificación promedio</p>
            <div className="flex items-baseline gap-2">
              <motion.span 
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
                className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-white"
              >
                {avg}
              </motion.span>
              <motion.span 
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ delay: 0.5, duration: 0.5 }}
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
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className={`text-lg sm:text-xl ${parseFloat(avg) >= star ? "text-yellow-400" : "text-gray-200 dark:text-zinc-700"}`}
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
            className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm p-5 sm:p-6 border border-gray-100 dark:border-zinc-800 cursor-default hover:shadow-lg transition-shadow"
          >
            <p className="text-gray-500 dark:text-zinc-400 text-sm mb-2">Total de opiniones</p>
            <div className="flex items-baseline gap-2">
              <motion.span 
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, type: "spring" }}
                className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-white"
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
            className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-sm p-5 sm:p-6 text-white cursor-default hover:shadow-xl transition-shadow sm:col-span-2 lg:col-span-1"
          >
            <p className="text-blue-100 text-sm mb-2">Tu enlace de encuesta</p>
            <code className="text-xs sm:text-sm bg-white/20 px-3 py-2 rounded-lg block truncate">
              /encuesta/{business.slug}
            </code>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/encuesta/${business.slug}`);
                  alert("¡Enlace copiado!");
                }}
                className="flex-1 sm:flex-none bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                Copiar
              </button>
              <button
                onClick={() => setShowQR(true)}
                className="flex-1 sm:flex-none bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
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
          className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm p-4 sm:p-6 border border-gray-100 dark:border-zinc-800 mb-6 sm:mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-800 dark:text-white mb-1">Reseñas en Google Maps</h3>
              <p className="text-gray-500 dark:text-zinc-400 text-sm mb-4">
                Agrega tu link de Google Maps y los clientes que califiquen con 4 o 5 estrellas 
                recibirán una invitación para dejar su reseña pública en Google.
              </p>
              <div className="flex gap-3 flex-col">
                <input
                  type="url"
                  value={googleMapsUrl}
                  onChange={(e) => setGoogleMapsUrl(e.target.value)}
                  placeholder="https://g.page/r/tu-negocio/review"
                  className="w-full border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-xl px-4 py-3 text-sm text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                />
                <button
                  onClick={handleSaveGoogleMaps}
                  disabled={savingMaps}
                  className="w-full sm:w-auto bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-6 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
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

        {/* Logo Upload Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm p-4 sm:p-6 border border-gray-100 dark:border-zinc-800 mb-6 sm:mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-800 dark:text-white mb-1">Logo de tu negocio</h3>
              <p className="text-gray-500 dark:text-zinc-400 text-sm mb-4">
                Sube el logo de tu negocio para personalizar tu encuesta y dashboard.
              </p>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {/* Preview del logo */}
                <div className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 dark:border-zinc-700 flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-zinc-800 flex-shrink-0">
                  {business.logo_url ? (
                    <img src={business.logo_url} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                    <svg className="w-8 h-8 text-gray-400 dark:text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 w-full">
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    id="logo-upload"
                  />
                  <label
                    htmlFor="logo-upload"
                    className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors cursor-pointer ${
                      uploadingLogo
                        ? 'bg-purple-400 text-white cursor-wait'
                        : logoSaved
                        ? 'bg-green-600 text-white'
                        : 'bg-purple-600 hover:bg-purple-700 text-white'
                    }`}
                  >
                    {uploadingLogo ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        Subiendo...
                      </>
                    ) : logoSaved ? (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        ¡Logo guardado!
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        {business.logo_url ? 'Cambiar logo' : 'Subir logo'}
                      </>
                    )}
                  </label>
                  <p className="text-xs text-gray-400 dark:text-zinc-500 mt-2">
                    PNG, JPG o SVG. Máximo 5MB.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Menu/Carta PDF Upload Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.47 }}
          className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm p-4 sm:p-6 border border-gray-100 dark:border-zinc-800 mb-6 sm:mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-gray-800 dark:text-white">Carta / Menú</h3>
                <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full">Ideal para restaurantes</span>
              </div>
              <p className="text-gray-500 dark:text-zinc-400 text-sm mb-4">
                Sube tu carta en PDF. Al escanear el QR, tus clientes podrán elegir entre ver la carta o dejar una valoración.
              </p>
              
              {business.menu_pdf_url ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                    <svg className="w-8 h-8 text-green-600 dark:text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className="text-green-700 dark:text-green-400 font-medium text-sm">Carta activa</p>
                      <p className="text-green-600 dark:text-green-500 text-xs truncate">Los clientes verán la opción al escanear el QR</p>
                    </div>
                    <a 
                      href={business.menu_pdf_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-green-600 dark:text-green-400 hover:text-green-700 p-2"
                      title="Ver carta"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                  <div className="flex gap-2">
                    <label
                      htmlFor="menu-upload"
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-colors cursor-pointer text-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      Cambiar carta
                    </label>
                    <button
                      onClick={handleRemoveMenu}
                      disabled={removingMenu}
                      className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-lg font-medium transition-colors text-sm disabled:opacity-50"
                    >
                      {removingMenu ? 'Eliminando...' : 'Eliminar'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="w-20 h-20 rounded-xl border-2 border-dashed border-amber-300 dark:border-amber-700 flex items-center justify-center overflow-hidden bg-amber-50 dark:bg-amber-900/20 flex-shrink-0">
                    <svg className="w-8 h-8 text-amber-400 dark:text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 w-full">
                    <label
                      htmlFor="menu-upload"
                      className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors cursor-pointer ${
                        uploadingMenu
                          ? 'bg-amber-400 text-white cursor-wait'
                          : menuSaved
                          ? 'bg-green-600 text-white'
                          : 'bg-amber-600 hover:bg-amber-700 text-white'
                      }`}
                    >
                      {uploadingMenu ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                          Subiendo...
                        </>
                      ) : menuSaved ? (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          ¡Carta guardada!
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                          Subir carta PDF
                        </>
                      )}
                    </label>
                    <p className="text-xs text-gray-400 dark:text-zinc-500 mt-2">
                      Solo archivos PDF. Máximo 10MB.
                    </p>
                  </div>
                </div>
              )}
              <input
                ref={menuInputRef}
                type="file"
                accept="application/pdf"
                onChange={handleMenuUpload}
                className="hidden"
                id="menu-upload"
              />
            </div>
          </div>
        </motion.div>

        {/* Referral Section - Invita y Gana */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl shadow-sm p-4 sm:p-6 border border-amber-200 dark:border-amber-800/50 mb-6 sm:mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-gray-800 dark:text-white">Invita y Gana</h3>
                {/* Tooltip con información de pago */}
                <div className="relative">
                  <button 
                    onClick={() => setShowPaymentInfo(!showPaymentInfo)}
                    className="w-5 h-5 rounded-full bg-amber-200 dark:bg-amber-800 text-amber-700 dark:text-amber-300 text-xs font-bold flex items-center justify-center hover:bg-amber-300 dark:hover:bg-amber-700 transition-colors"
                  >
                    ?
                  </button>
                  {showPaymentInfo && (
                    <>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setShowPaymentInfo(false)}
                      />
                      <div className="absolute left-0 sm:left-auto sm:right-0 bottom-full mb-2 w-72 p-4 bg-white dark:bg-zinc-800 rounded-xl shadow-xl border border-gray-200 dark:border-zinc-700 z-50">
                        <p className="text-sm text-gray-700 dark:text-zinc-200 font-medium mb-2">¿Cómo recibo mi pago?</p>
                        <p className="text-xs text-gray-500 dark:text-zinc-400 leading-relaxed">
                          El pago de tus referidos se efectuará al momento en que lo solicites mediante correo electrónico a <span className="text-amber-600 dark:text-amber-400 font-medium">contacto.valoralocal@gmail.com</span>. Solo incluye tu código de referido y los datos de transferencia.
                        </p>
                        <div className="mt-2 pt-2 border-t border-gray-100 dark:border-zinc-700">
                          <p className="text-xs text-gray-400 dark:text-zinc-500">Mínimo para solicitar: $3.000 CLP</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <p className="text-gray-500 dark:text-zinc-400 text-sm mb-4">
                Gana <span className="font-bold text-amber-600 dark:text-amber-400">$3.000 CLP</span> por cada negocio que se suscriba usando tu código.
              </p>

              {/* Código de referido */}
              <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-amber-200 dark:border-amber-800/50 mb-4">
                <p className="text-xs text-gray-500 dark:text-zinc-500 mb-1">Tu código de referido</p>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-gray-800 dark:text-white tracking-wider">
                    {business.referral_code || 'CARGANDO...'}
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(business.referral_code || '');
                      alert("¡Código copiado!");
                    }}
                    className="p-2 bg-amber-100 dark:bg-amber-900/30 hover:bg-amber-200 dark:hover:bg-amber-800/50 rounded-lg text-amber-700 dark:text-amber-400 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Stats de referidos */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-gray-200 dark:border-zinc-700">
                  <p className="text-xs text-gray-500 dark:text-zinc-500 mb-1">Referidos exitosos</p>
                  <p className="text-xl font-bold text-gray-800 dark:text-white">
                    {business.referral_count || 0} <span className="text-sm font-normal text-gray-400 dark:text-zinc-500">/ 20</span>
                  </p>
                  <div className="mt-2 h-2 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(((business.referral_count || 0) / 20) * 100, 100)}%` }}
                    />
                  </div>
                </div>
                <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-gray-200 dark:border-zinc-700">
                  <p className="text-xs text-gray-500 dark:text-zinc-500 mb-1">Saldo acumulado</p>
                  <p className="text-xl font-bold text-green-600 dark:text-green-400">
                    ${(business.referral_balance || 0).toLocaleString('es-CL')}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">CLP</p>
                </div>
              </div>

              {/* Mensaje si llegó al límite */}
              {(business.referral_count || 0) >= 20 && (
                <div className="mt-4 p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                  <p className="text-sm text-amber-700 dark:text-amber-400 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                    ¡Felicitaciones! Has alcanzado el máximo de referidos.
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Emails Recolectados */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm p-4 sm:p-6 border border-gray-100 dark:border-zinc-800 mb-6 sm:mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 dark:text-white text-sm sm:text-base">Emails Recolectados</h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400">
                  {collectedEmails.length} {collectedEmails.length === 1 ? 'contacto único' : 'contactos únicos'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {collectedEmails.length > 0 && (
                <>
                  <button
                    onClick={copyAllEmails}
                    className="px-3 py-2 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-200 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                    <span className="hidden sm:inline">Copiar</span>
                  </button>
                  <button
                    onClick={exportEmailsToCSV}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span className="hidden sm:inline">Exportar CSV</span>
                  </button>
                </>
              )}
              <button
                onClick={() => setShowEmails(!showEmails)}
                className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center gap-1 ${
                  showEmails 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-200 hover:bg-gray-200 dark:hover:bg-zinc-700'
                }`}
              >
                <svg className={`w-4 h-4 transition-transform ${showEmails ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                <span className="hidden sm:inline">{showEmails ? 'Ocultar' : 'Ver lista'}</span>
              </button>
            </div>
          </div>

          {/* Lista de emails expandible */}
          {showEmails && (
            <div className="border-t border-gray-100 dark:border-zinc-800 pt-4">
              {collectedEmails.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-gray-400 dark:text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 dark:text-zinc-400 text-sm">Aún no hay emails recolectados</p>
                  <p className="text-gray-400 dark:text-zinc-500 text-xs mt-1">Los emails aparecerán cuando los clientes los dejen en la encuesta</p>
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto space-y-1">
                  {collectedEmails.map((email, index) => (
                    <div 
                      key={email}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800/50 group"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs text-gray-400 dark:text-zinc-500 w-6 flex-shrink-0">{index + 1}.</span>
                        <span className="text-sm text-gray-700 dark:text-zinc-300 truncate">{email}</span>
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(email);
                          alert('Email copiado');
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-gray-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition-all"
                        title="Copiar email"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
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
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm p-4 sm:p-6 border border-gray-100 dark:border-zinc-800 mb-6 sm:mb-8">
            <h3 className="font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2 text-sm sm:text-base">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              Tendencia de valoraciones
            </h3>
            <div className="h-48 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                  <XAxis dataKey="week" stroke="#9CA3AF" fontSize={10} />
                  <YAxis domain={[1, 5]} stroke="#9CA3AF" fontSize={10} />
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
                    dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: '#60A5FA' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Age Distribution Chart */}
        {ageDistributionData.length > 0 && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm p-4 sm:p-6 border border-gray-100 dark:border-zinc-800 mb-6 sm:mb-8">
            <h3 className="font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2 text-sm sm:text-base">
              <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Distribución por edad
            </h3>
            <div className="h-48 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ageDistributionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                  <XAxis dataKey="rango" stroke="#9CA3AF" fontSize={10} />
                  <YAxis stroke="#9CA3AF" fontSize={10} allowDecimals={false} />
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
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm p-4 sm:p-6 border border-gray-100 dark:border-zinc-800 mb-6 sm:mb-8">
          <h3 className="font-semibold text-gray-800 dark:text-white mb-4 text-sm sm:text-base">Distribución de calificaciones</h3>
          <div className="space-y-3">
            {ratingCounts.map(({ star, count, percent }) => (
              <div key={star} className="flex items-center gap-2 sm:gap-3">
                <span className="text-xs sm:text-sm text-gray-600 dark:text-zinc-400 w-6">{star}★</span>
                <div className="flex-1 h-3 sm:h-4 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-400 rounded-full transition-all duration-500"
                    style={{ width: `${percent}%` }}
                  ></div>
                </div>
                <span className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400 w-8 sm:w-10 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Filters & Export Section */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-800 mb-6 sm:mb-8">
          <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-zinc-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <h3 className="font-semibold text-gray-800 dark:text-white text-sm sm:text-base">Comentarios</h3>
                <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full text-xs sm:text-sm">
                  {filteredReviews.length} de {reviews.length}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center gap-1 sm:gap-2 ${
                    showFilters 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-200 hover:bg-gray-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  <span className="hidden sm:inline">Filtros</span>
                </button>
                <button
                  onClick={exportToExcel}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="hidden sm:inline">Excel</span>
                </button>
                <button
                  onClick={exportToCSV}
                  className="bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-200 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <span className="hidden sm:inline">CSV</span>
                </button>
                <button
                  onClick={exportToPDF}
                  disabled={exportingPDF}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center gap-1"
                >
                  {exportingPDF ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span className="hidden sm:inline">Generando...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="hidden sm:inline">PDF</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/50">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
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
              <div className="p-8 sm:p-12 text-center">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 dark:text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h4 className="font-medium text-gray-800 dark:text-white mb-1 text-sm sm:text-base">
                  {reviews.length === 0 ? 'Sin comentarios aún' : 'Sin resultados'}
                </h4>
                <p className="text-gray-500 dark:text-zinc-400 text-xs sm:text-sm">
                  {reviews.length === 0 
                    ? 'Comparte tu enlace de encuesta para recibir opiniones' 
                    : 'Intenta ajustar los filtros'}
                </p>
              </div>
            ) : (
              filteredReviews.slice((currentPage - 1) * reviewsPerPage, currentPage * reviewsPerPage).map((r, i) => (
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
                        <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-zinc-300">{r.rating}/5</span>
                      </div>
                      {r.comment ? (
                        <p className="text-gray-700 dark:text-zinc-200 text-sm sm:text-base break-words">{r.comment}</p>
                      ) : (
                        <p className="text-gray-400 dark:text-zinc-500 italic text-xs sm:text-sm">Sin comentario</p>
                      )}
                      {r.contact_email && (
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400 mt-2 flex items-center gap-1 break-all">
                          <svg className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          {r.contact_email}
                        </p>
                      )}
                      {(r.comuna || r.edad) && (
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400 mt-1 flex items-center gap-3 flex-wrap">
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
                    <div className="text-left sm:text-right flex-shrink-0">
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

          {/* Pagination */}
          {filteredReviews.length > reviewsPerPage && (
            <div className="p-4 border-t border-gray-100 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400 text-center sm:text-left">
                Mostrando {((currentPage - 1) * reviewsPerPage) + 1} - {Math.min(currentPage * reviewsPerPage, filteredReviews.length)} de {filteredReviews.length}
              </p>
              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-200 hover:bg-gray-200 dark:hover:bg-zinc-700"
                >
                  ← <span className="hidden sm:inline">Anterior</span>
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.ceil(filteredReviews.length / reviewsPerPage) }, (_, i) => i + 1)
                    .filter(page => {
                      const totalPages = Math.ceil(filteredReviews.length / reviewsPerPage);
                      if (totalPages <= 5) return true;
                      if (page === 1 || page === totalPages) return true;
                      if (Math.abs(page - currentPage) <= 1) return true;
                      return false;
                    })
                    .map((page, idx, arr) => (
                      <span key={page} className="flex items-center">
                        {idx > 0 && arr[idx - 1] !== page - 1 && (
                          <span className="px-1 sm:px-2 text-gray-400 dark:text-zinc-500 text-xs">...</span>
                        )}
                        <button
                          onClick={() => setCurrentPage(page)}
                          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                            currentPage === page
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-200 hover:bg-gray-200 dark:hover:bg-zinc-700'
                          }`}
                        >
                          {page}
                        </button>
                      </span>
                    ))}
                </div>
                <button
                  onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredReviews.length / reviewsPerPage), p + 1))}
                  disabled={currentPage >= Math.ceil(filteredReviews.length / reviewsPerPage)}
                  className="px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-200 hover:bg-gray-200 dark:hover:bg-zinc-700"
                >
                  <span className="hidden sm:inline">Siguiente</span> →
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-6 sm:py-8 text-gray-400 dark:text-zinc-500 text-xs sm:text-sm">
        <p className="flex items-center justify-center gap-2">
          Powered by 
          <img src="/logo-light.svg" alt="ValoraLocal" className="h-5 dark:hidden" />
          <img src="/logo-dark.svg" alt="ValoraLocal" className="h-5 hidden dark:block" />
        </p>
      </footer>
    </div>
  );
}
