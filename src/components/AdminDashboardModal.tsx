import React, { useState } from 'react';
import {
  X,
  Database,
  Sliders,
  Image as ImageIcon,
  Code2,
  Download,
  Trash2,
  Search,
  CheckCircle2,
  Check,
  Copy,
  Server,
  User,
  Plus,
  Shield,
  ExternalLink,
  Calendar,
  AlertCircle,
  FileSpreadsheet,
  Eye,
  FileText,
  HardDrive
} from 'lucide-react';
import { CampaignConfig, CampaignImage, CollectedCedula, ElectorRecord } from '../types';
import { ListaOpcionBadge } from './ListaOpcionBadge';
import { AdminPadronTab } from './AdminPadronTab';
import { CedulasFileViewerModal } from './CedulasFileViewerModal';
import { formatCedulaDisplay } from '../utils/sheetParser';
import * as XLSX from 'xlsx';

interface AdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: CampaignConfig;
  setCampaign: React.Dispatch<React.SetStateAction<CampaignConfig>>;
  electors: ElectorRecord[];
  setElectors: React.Dispatch<React.SetStateAction<ElectorRecord[]>>;
  onAddElector: (elector: ElectorRecord) => void;
  onUpdateElector: (elector: ElectorRecord) => void;
  onDeleteElector: (id: string) => void;
  onClearElectors: () => void;
  onRestoreSampleElectors: () => void;
  collectedCedulas: CollectedCedula[];
  onDeleteCedula: (id: string) => void;
  onClearCedulas: () => void;
  onAddManualCedula: (cedula: string, nombre?: string, telefono?: string) => void;
  campaignImages: CampaignImage[];
  onAddCampaignImage: (img: CampaignImage) => void;
  onDeleteCampaignImage: (id: string) => void;
}

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({
  isOpen,
  onClose,
  campaign,
  setCampaign,
  electors,
  setElectors,
  onAddElector,
  onUpdateElector,
  onDeleteElector,
  onClearElectors,
  onRestoreSampleElectors,
  collectedCedulas,
  onDeleteCedula,
  onClearCedulas,
  onAddManualCedula,
  campaignImages,
  onAddCampaignImage,
  onDeleteCampaignImage,
}) => {
  const [activeTab, setActiveTab] = useState<'padron' | 'cedulas' | 'imagenes' | 'galeria' | 'inspector' | 'neon'>('padron');
  const [searchTerm, setSearchTerm] = useState('');
  const [manualCedula, setManualCedula] = useState('');
  const [manualNombre, setManualNombre] = useState('');
  const [manualTelefono, setManualTelefono] = useState('');
  const [copiedSQL, setCopiedSQL] = useState(false);
  const [notification, setNotification] = useState('');

  // Form states for campaign customizer
  const [candidateName, setCandidateName] = useState(campaign.candidateName);
  const [candidateRole, setCandidateRole] = useState(campaign.candidateRole || 'CONCEJAL 2026');
  const [listNumber, setListNumber] = useState(campaign.listNumber);
  const [optionNumber, setOptionNumber] = useState(campaign.optionNumber || '7');
  const [slogan, setSlogan] = useState(campaign.campaignSlogan);
  const [photoUrl, setPhotoUrl] = useState(campaign.candidatePhotoUrl);
  const [bgUrl, setBgUrl] = useState(campaign.backgroundUrl);
  const [headerLogo, setHeaderLogo] = useState(campaign.headerLogoUrl || '');
  const [footerLogo, setFooterLogo] = useState(campaign.footerLogoUrl || '');

  // New gallery image states
  const [galleryTitle, setGalleryTitle] = useState('');
  const [galleryUrl, setGalleryUrl] = useState('');
  const [isFileViewerOpen, setIsFileViewerOpen] = useState(false);

  if (!isOpen) return null;

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 3000);
  };

  const handleSaveCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    setCampaign((prev) => ({
      ...prev,
      candidateName,
      candidateRole,
      listNumber,
      optionNumber,
      campaignSlogan: slogan,
      candidatePhotoUrl: photoUrl,
      backgroundUrl: bgUrl,
      headerLogoUrl: headerLogo,
      footerLogoUrl: footerLogo,
    }));
    showNotification('¡Configuración de campaña actualizada!');
  };

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCedula.trim()) return;
    onAddManualCedula(manualCedula.trim(), manualNombre.trim(), manualTelefono.trim());
    setManualCedula('');
    setManualNombre('');
    setManualTelefono('');
    showNotification('¡Cédula agregada exitosamente a la base de datos!');
  };

  const handleAddGallery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!galleryUrl.trim()) return;
    onAddCampaignImage({
      id: `gal-${Date.now()}`,
      type: 'galeria',
      title: galleryTitle || 'Imagen de Campaña',
      url: galleryUrl,
      uploadedAt: new Date().toISOString().substring(0, 10),
    });
    setGalleryTitle('');
    setGalleryUrl('');
    showNotification('¡Imagen agregada a la galería!');
  };

  const exportToExcel = () => {
    if (collectedCedulas.length === 0) {
      alert('No hay cédulas registradas para exportar');
      return;
    }
    const wsData = [
      ['N°', 'C.I.N°', 'Nombre y Apellido', 'Estado Mesa', 'Hora Voto', 'Barrio', 'Local de Votación', 'Mesa', 'Orden', 'Responsable', 'Teléfono', 'Fecha Registro'],
      ...collectedCedulas.map((c, i) => [
        i + 1,
        c.cedula,
        c.nombre || 'Sin registrar',
        c.pasoPorMesa ? 'YA VOTÓ (PASÓ POR MESA)' : 'PENDIENTE',
        c.horaVoto || '—',
        c.barrio || '—',
        c.localVotacion || '—',
        c.mesa || '—',
        c.orden || '—',
        c.responsable || '—',
        c.telefono || '—',
        new Date(c.createdAt).toLocaleString('es-PY'),
      ]),
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = [
      { wch: 6 },
      { wch: 14 },
      { wch: 30 },
      { wch: 22 },
      { wch: 14 },
      { wch: 20 },
      { wch: 32 },
      { wch: 10 },
      { wch: 10 },
      { wch: 22 },
      { wch: 16 },
      { wch: 22 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'Cedulas_Recopiladas');
    XLSX.writeFile(wb, `Cedulas_Recopiladas_${new Date().toISOString().slice(0, 10)}.xlsx`);
    showNotification('¡Archivo Excel (.xlsx) descargado exitosamente!');
  };

  const exportToCSV = () => {
    if (collectedCedulas.length === 0) {
      alert('No hay cédulas registradas para exportar');
      return;
    }
    const headers = ['N°', 'C.I.N°', 'Nombre y Apellido', 'Estado Mesa', 'Hora Voto', 'Barrio', 'Local de Votación', 'Mesa', 'Orden', 'Responsable', 'Teléfono', 'Fecha Registro'];
    const rows = collectedCedulas.map((c, i) => [
      i + 1,
      `"${c.cedula}"`,
      `"${(c.nombre || '').replace(/"/g, '""')}"`,
      `"${c.pasoPorMesa ? 'YA VOTÓ' : 'PENDIENTE'}"`,
      `"${c.horaVoto || '—'}"`,
      `"${(c.barrio || '').replace(/"/g, '""')}"`,
      `"${(c.localVotacion || '').replace(/"/g, '""')}"`,
      `"${c.mesa || ''}"`,
      `"${c.orden || ''}"`,
      `"${(c.responsable || '').replace(/"/g, '""')}"`,
      `"${c.telefono || ''}"`,
      `"${new Date(c.createdAt).toLocaleString('es-PY')}"`,
    ]);
    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Cedulas_Recopiladas_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showNotification('¡Archivo CSV descargado exitosamente!');
  };

  const neonSQLCode = `-- =====================================================
-- TABLA EN NEON POSTGRESQL PARA GUARDAR CÉDULAS
-- =====================================================
CREATE TABLE IF NOT EXISTS cedulas_recopiladas (
    id BIGSERIAL PRIMARY KEY,
    cedula VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(150),
    telefono VARCHAR(50),
    seccional VARCHAR(100),
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cedula ON cedulas_recopiladas(cedula);`;

  const copySQL = () => {
    navigator.clipboard.writeText(neonSQLCode);
    setCopiedSQL(true);
    setTimeout(() => setCopiedSQL(false), 2000);
  };

  const filteredCedulas = collectedCedulas.filter(
    (c) =>
      c.cedula.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.nombre && c.nombre.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] my-auto text-white">
        
        {/* MODAL HEADER */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-600/20 text-red-400 flex items-center justify-center border border-red-500/30">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white">Panel de Administración Oculto</h2>
                <span className="bg-red-950 text-red-400 border border-red-800 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
                  PRIVADO
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Gestión de base de datos de cédulas, conexión Neon/Vercel e imágenes.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-xl border border-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* NOTIFICATION BANNER */}
        {notification && (
          <div className="bg-emerald-950/90 border-b border-emerald-500/40 text-emerald-300 px-6 py-2.5 text-xs font-mono flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{notification}</span>
          </div>
        )}

        {/* NAVIGATION TABS */}
        <div className="bg-slate-900 border-b border-slate-800 px-6 flex flex-wrap gap-2 pt-3">
          <button
            onClick={() => setActiveTab('padron')}
            className={`pb-3 px-3.5 text-xs font-bold font-mono flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'padron'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Padrón LibreOffice ({electors.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('cedulas')}
            className={`pb-3 px-3.5 text-xs font-bold font-mono flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'cedulas'
                ? 'border-red-500 text-red-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Cédulas Recopiladas ({collectedCedulas.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('imagenes')}
            className={`pb-3 px-3.5 text-xs font-bold font-mono flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'imagenes'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Personalizar Imágenes & Textos</span>
          </button>

          <button
            onClick={() => setActiveTab('galeria')}
            className={`pb-3 px-3.5 text-xs font-bold font-mono flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'galeria'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Galería ({campaignImages.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('neon')}
            className={`pb-3 px-3.5 text-xs font-bold font-mono flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'neon'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>Conexión Neon & Vercel</span>
          </button>

          <button
            onClick={() => setActiveTab('inspector')}
            className={`pb-3 px-3.5 text-xs font-bold font-mono flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'inspector'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>Inspector HTML / CSS</span>
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">

          {/* TAB 0: PADRÓN ELECTORAL LIBREOFFICE */}
          {activeTab === 'padron' && (
            <AdminPadronTab
              electors={electors}
              onSetElectors={setElectors}
              onAddElector={onAddElector}
              onUpdateElector={onUpdateElector}
              onDeleteElector={onDeleteElector}
              onClearElectors={onClearElectors}
              onRestoreSampleElectors={onRestoreSampleElectors}
            />
          )}

          {/* TAB 1: CÉDULAS RECOPILADAS */}
          {activeTab === 'cedulas' && (
            <div className="space-y-6">
              
              {/* Where do the cedulas go? Explanatory Card */}
              <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-4 sm:p-5 rounded-3xl border-2 border-emerald-500/50 shadow-xl space-y-2.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2.5 text-emerald-400 font-bold text-sm font-sans">
                    <div className="p-2 rounded-xl bg-emerald-500/20">
                      <HardDrive className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="text-white text-base font-black flex items-center gap-2">
                        <span>Base de Datos en la Nube Conectada</span>
                        <span className="flex items-center gap-1 text-[11px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded-full font-mono font-normal">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          En Vivo (Firestore Cloud)
                        </span>
                      </h4>
                      <p className="text-xs text-slate-300 font-normal">
                        Sincronización multi-dispositivo en tiempo real y descarga de archivo físico
                      </p>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-300 font-sans leading-relaxed">
                  ¡Tu aplicación ya está conectada a la base de datos en la nube! Cada vez que cualquier elector o miembro del equipo ingresa una cédula desde su propio celular o computadora en el enlace público, se guarda de forma instantánea y centralizada. Si el votante figura en el padrón, se asocian de inmediato su <strong>Nombre, Barrio, Local de Votación, Mesa, Orden y Responsable</strong>.
                </p>

                <div className="pt-2 flex flex-wrap items-center gap-2 text-[11px] font-mono text-emerald-300">
                  <span className="bg-slate-900 px-3 py-1 rounded-lg border border-slate-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Nube centralizada activa</span>
                  </span>
                  <span className="bg-slate-900 px-3 py-1 rounded-lg border border-slate-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Sincronización multi-usuario</span>
                  </span>
                  <span className="bg-slate-900 px-3 py-1 rounded-lg border border-slate-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Descarga directa a Excel / LibreOffice</span>
                  </span>
                </div>
              </div>

              {/* Stats & Actions Bar */}
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-slate-950 p-4 sm:p-5 rounded-3xl border border-slate-800">
                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-2xl bg-red-600/20 border-2 border-red-500/40 flex items-center justify-center font-black text-2xl text-red-400 font-mono shadow-inner">
                    {collectedCedulas.length}
                  </div>
                  <div>
                    <div className="font-black text-white text-base">Cédulas Recopiladas en el Sistema</div>
                    <div className="text-slate-400 text-xs">
                      {collectedCedulas.length === 0
                        ? 'Esperando consultas en la pantalla principal...'
                        : `${collectedCedulas.length} persona(s) consultada(s) o registradas`}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* View File Modal Button */}
                  <button
                    onClick={() => setIsFileViewerOpen(true)}
                    className="flex-1 sm:flex-initial bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-2.5 rounded-xl font-bold font-mono text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    title="Ver archivo en pantalla"
                  >
                    <Eye className="w-4 h-4 text-cyan-400" />
                    <span>Ver Archivo</span>
                  </button>

                  {/* Download CSV for LibreOffice */}
                  <button
                    onClick={exportToCSV}
                    className="flex-1 sm:flex-initial bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-2.5 rounded-xl font-bold font-mono text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    title="Descargar archivo CSV para LibreOffice Calc"
                  >
                    <Download className="w-4 h-4 text-amber-400" />
                    <span>Descargar .CSV</span>
                  </button>

                  {/* Download Excel (.xlsx) */}
                  <button
                    onClick={exportToExcel}
                    className="flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-bold font-mono text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 cursor-pointer transition-all active:scale-98"
                    title="Descargar archivo Excel listo para abrir en LibreOffice Calc o MS Excel"
                  >
                    <Download className="w-4 h-4" />
                    <span>Descargar Excel (.xlsx)</span>
                  </button>

                  {/* Clear All Button */}
                  {collectedCedulas.length > 0 && (
                    <button
                      onClick={() => {
                        if (confirm('¿Estás seguro de que deseas vaciar todas las cédulas recopiladas?')) {
                          onClearCedulas();
                          showNotification('Base de datos vaciada');
                        }
                      }}
                      className="bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 px-3 py-2.5 rounded-xl font-mono cursor-pointer transition-colors"
                      title="Vaciar cédulas recopiladas"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Manual Add Form */}
              <form onSubmit={handleManualAdd} className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-3 font-sans">
                <span className="font-bold text-slate-300 text-xs flex items-center gap-1.5 font-mono">
                  <Plus className="w-4 h-4 text-emerald-400" />
                  Registrar Cédula Manualmente:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <input
                    type="text"
                    placeholder="Número de Cédula *"
                    value={manualCedula}
                    onChange={(e) => setManualCedula(e.target.value)}
                    required
                    className="bg-slate-900 text-white border border-slate-800 rounded-xl p-2.5 font-mono text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Nombre Completo (opcional)"
                    value={manualNombre}
                    onChange={(e) => setManualNombre(e.target.value)}
                    className="bg-slate-900 text-white border border-slate-800 rounded-xl p-2.5 font-sans text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Teléfono / Contacto (opcional)"
                    value={manualTelefono}
                    onChange={(e) => setManualTelefono(e.target.value)}
                    className="bg-slate-900 text-white border border-slate-800 rounded-xl p-2.5 font-mono text-xs"
                  />
                  <button
                    type="submit"
                    className="bg-red-600 hover:bg-red-500 text-white font-bold px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-1 cursor-pointer text-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Guardar Cédula</span>
                  </button>
                </div>
              </form>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Buscar por cédula, nombre, local, barrio o responsable..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-950 text-white border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 font-sans text-xs focus:outline-none focus:border-red-500"
                />
              </div>

              {/* Records Table */}
              <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                {filteredCedulas.length === 0 ? (
                  <div className="p-12 text-center text-slate-500 space-y-2">
                    <Database className="w-8 h-8 mx-auto text-slate-600" />
                    <p className="font-mono">No hay cédulas registradas aún.</p>
                    <p className="text-[11px] text-slate-600">
                      Cuando los usuarios o vos ingresen cédulas desde la página principal y pulsen "Consultar Padrón" o "Registrar", se guardarán aquí automáticamente.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left font-sans text-xs">
                      <thead className="bg-slate-900 text-slate-400 text-[11px] font-mono border-b border-slate-800 uppercase tracking-wider">
                        <tr>
                          <th className="p-3">#</th>
                          <th className="p-3 text-center">ESTADO MESA</th>
                          <th className="p-3">CÉDULA</th>
                          <th className="p-3">NOMBRE Y APELLIDO</th>
                          <th className="p-3 text-center">MESA</th>
                          <th className="p-3 text-center">ORDEN</th>
                          <th className="p-3">LOCAL DE VOTACIÓN</th>
                          <th className="p-3">BARRIO</th>
                          <th className="p-3">RESPONSABLE</th>
                          <th className="p-3">FECHA / HORA</th>
                          <th className="p-3 text-right">ACCIÓN</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-xs font-mono">
                        {filteredCedulas.map((c, index) => (
                          <tr key={c.id} className={`hover:bg-slate-900/50 ${c.pasoPorMesa ? 'bg-emerald-950/20' : ''}`}>
                            <td className="p-3 text-slate-500">{index + 1}</td>
                            <td className="p-3 text-center">
                              {c.pasoPorMesa ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40 text-[10px]">
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span>VOTÓ {c.horaVoto ? `(${c.horaVoto})` : ''}</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px]">
                                  <span>PENDIENTE</span>
                                </span>
                              )}
                            </td>
                            <td className="p-3 font-bold text-amber-300">
                              <span className="bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg">
                                {formatCedulaDisplay(c.cedula)}
                              </span>
                            </td>
                            <td className="p-3 text-white font-sans font-semibold">
                              {c.nombre || '—'}
                            </td>
                            <td className="p-3 text-center">
                              {c.mesa ? (
                                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">
                                  {c.mesa}
                                </span>
                              ) : (
                                '—'
                              )}
                            </td>
                            <td className="p-3 text-center">
                              {c.orden ? (
                                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40">
                                  {c.orden}
                                </span>
                              ) : (
                                '—'
                              )}
                            </td>
                            <td className="p-3 text-slate-300 font-sans text-xs">
                              {c.localVotacion || '—'}
                            </td>
                            <td className="p-3 text-slate-400 font-sans text-xs">
                              {c.barrio || '—'}
                            </td>
                            <td className="p-3 text-purple-300 font-sans text-xs">
                              {c.responsable || '—'}
                            </td>
                            <td className="p-3 text-slate-400 text-[11px]">
                              {new Date(c.createdAt).toLocaleString('es-PY')}
                            </td>
                            <td className="p-3 text-right">
                              <button
                                onClick={() => {
                                  onDeleteCedula(c.id);
                                  showNotification(`Cédula ${c.cedula} eliminada`);
                                }}
                                className="text-rose-400 hover:text-rose-300 p-1 rounded hover:bg-rose-950/50 cursor-pointer transition-colors"
                                title="Eliminar registro"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: PERSONALIZAR IMÁGENES Y TEXTOS */}
          {activeTab === 'imagenes' && (
            <form onSubmit={handleSaveCampaign} className="space-y-6">
              
              {/* Designed Logo for Candidate Name (Top Left) */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-400 text-sm flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-emerald-400" />
                    Imagen Diseñada del Nombre (Esquina Superior Izquierda)
                  </span>
                  <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-emerald-300 px-3 py-1 rounded-lg text-xs font-semibold border border-slate-700">
                    Subir archivo local
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => setHeaderLogo(ev.target?.result as string);
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  {headerLogo ? (
                    <img
                      src={headerLogo}
                      alt="Logo Nombre"
                      referrerPolicy="no-referrer"
                      className="w-20 h-12 rounded-xl object-contain bg-slate-900 border border-emerald-500 shrink-0"
                    />
                  ) : (
                    <div className="w-20 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 text-[10px] text-center shrink-0 font-mono">
                      Texto estándar
                    </div>
                  )}
                  <input
                    type="url"
                    value={headerLogo}
                    onChange={(e) => setHeaderLogo(e.target.value)}
                    placeholder="URL de la imagen del nombre (ej: logo_candidato.png)..."
                    className="w-full bg-slate-900 text-white border border-slate-800 rounded-xl p-2.5 font-mono"
                  />
                  {headerLogo && (
                    <button
                      type="button"
                      onClick={() => setHeaderLogo('')}
                      className="text-rose-400 text-xs underline font-mono shrink-0"
                    >
                      Quitar
                    </button>
                  )}
                </div>
              </div>

              {/* Designed Logo for Slogan (Bottom Right) */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-300 text-sm flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-amber-400" />
                    Imagen Diseñada del Slogan (Esquina Inferior Derecha)
                  </span>
                  <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-amber-300 px-3 py-1 rounded-lg text-xs font-semibold border border-slate-700">
                    Subir archivo local
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => setFooterLogo(ev.target?.result as string);
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  {footerLogo ? (
                    <img
                      src={footerLogo}
                      alt="Logo Slogan"
                      referrerPolicy="no-referrer"
                      className="w-20 h-12 rounded-xl object-contain bg-slate-900 border border-amber-500 shrink-0"
                    />
                  ) : (
                    <div className="w-20 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 text-[10px] text-center shrink-0 font-mono">
                      Texto estándar
                    </div>
                  )}
                  <input
                    type="url"
                    value={footerLogo}
                    onChange={(e) => setFooterLogo(e.target.value)}
                    placeholder="URL de la imagen del slogan (ej: cambyreta_avanza.png)..."
                    className="w-full bg-slate-900 text-white border border-slate-800 rounded-xl p-2.5 font-mono"
                  />
                  {footerLogo && (
                    <button
                      type="button"
                      onClick={() => setFooterLogo('')}
                      className="text-rose-400 text-xs underline font-mono shrink-0"
                    >
                      Quitar
                    </button>
                  )}
                </div>
              </div>

              {/* Candidate Photo & Background */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-cyan-300">Foto del Candidato</span>
                    <label className="cursor-pointer text-[11px] bg-slate-800 px-2 py-1 rounded text-cyan-300">
                      Subir
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (ev) => setPhotoUrl(ev.target?.result as string);
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <img
                      src={photoUrl}
                      alt="Candidato"
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-xl object-cover border border-cyan-500 shrink-0"
                    />
                    <input
                      type="url"
                      value={photoUrl}
                      onChange={(e) => setPhotoUrl(e.target.value)}
                      className="w-full bg-slate-900 text-white border border-slate-800 rounded-xl p-2 font-mono text-[11px]"
                    />
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-300">Fondo Panorámico</span>
                    <label className="cursor-pointer text-[11px] bg-slate-800 px-2 py-1 rounded text-amber-300">
                      Subir
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (ev) => setBgUrl(ev.target?.result as string);
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <img
                      src={bgUrl}
                      alt="Fondo"
                      referrerPolicy="no-referrer"
                      className="w-14 h-12 rounded-xl object-cover border border-amber-500 shrink-0"
                    />
                    <input
                      type="url"
                      value={bgUrl}
                      onChange={(e) => setBgUrl(e.target.value)}
                      className="w-full bg-slate-900 text-white border border-slate-800 rounded-xl p-2 font-mono text-[11px]"
                    />
                  </div>
                </div>
              </div>

              {/* Text Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <div>
                  <label className="block text-slate-400 mb-1 font-mono">Nombre</label>
                  <input
                    type="text"
                    value={candidateName}
                    onChange={(e) => setCandidateName(e.target.value)}
                    className="w-full bg-slate-900 text-white border border-slate-800 rounded-xl p-2.5 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-mono">Cargo</label>
                  <input
                    type="text"
                    value={candidateRole}
                    onChange={(e) => setCandidateRole(e.target.value)}
                    className="w-full bg-slate-900 text-white border border-slate-800 rounded-xl p-2.5 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-mono">Lista</label>
                  <input
                    type="text"
                    value={listNumber}
                    onChange={(e) => setListNumber(e.target.value)}
                    className="w-full bg-slate-900 text-red-400 border border-slate-800 rounded-xl p-2.5 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-mono">Opción</label>
                  <input
                    type="text"
                    value={optionNumber}
                    onChange={(e) => setOptionNumber(e.target.value)}
                    className="w-full bg-slate-900 text-emerald-400 border border-slate-800 rounded-xl p-2.5 font-bold"
                  />
                </div>
                <div className="sm:col-span-2 lg:col-span-4">
                  <label className="block text-slate-400 mb-1 font-mono">Slogan</label>
                  <input
                    type="text"
                    value={slogan}
                    onChange={(e) => setSlogan(e.target.value)}
                    className="w-full bg-slate-900 text-amber-300 border border-slate-800 rounded-xl p-2.5 font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-cyan-600/30"
                >
                  Guardar y Aplicar Cambios
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: GALERÍA DE IMÁGENES */}
          {activeTab === 'galeria' && (
            <div className="space-y-6">
              {/* Add form */}
              <form onSubmit={handleAddGallery} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <span className="font-bold text-amber-300 text-xs flex items-center gap-1.5 font-mono">
                  <Plus className="w-4 h-4 text-amber-400" />
                  Agregar Afiche / Volante / Foto de Campaña:
                </span>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    placeholder="Título del Afiche..."
                    value={galleryTitle}
                    onChange={(e) => setGalleryTitle(e.target.value)}
                    className="bg-slate-900 text-white border border-slate-800 rounded-xl p-2.5 flex-1"
                  />
                  <input
                    type="url"
                    placeholder="URL de Imagen (https://...)"
                    value={galleryUrl}
                    onChange={(e) => setGalleryUrl(e.target.value)}
                    required
                    className="bg-slate-900 text-white border border-slate-800 rounded-xl p-2.5 flex-1 font-mono"
                  />
                  <button
                    type="submit"
                    className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-4 py-2.5 rounded-xl font-mono shrink-0"
                  >
                    + Guardar en Galería
                  </button>
                </div>
              </form>

              {/* Gallery Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {campaignImages.map((img) => (
                  <div
                    key={img.id}
                    className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden relative group"
                  >
                    <img
                      src={img.url}
                      alt={img.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-36 object-cover"
                    />
                    <div className="p-2.5">
                      <div className="font-bold text-white truncate text-xs">{img.title}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{img.uploadedAt}</div>
                    </div>
                    <button
                      onClick={() => onDeleteCampaignImage(img.id)}
                      className="absolute top-2 right-2 p-1.5 bg-rose-900/90 text-rose-300 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Eliminar de galería"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: BASE DE DATOS EN LA NUBE & NEON / SUPABASE */}
          {activeTab === 'neon' && (
            <div className="space-y-6 font-mono text-xs">
              {/* Active Cloud Database Card */}
              <div className="bg-emerald-950/60 border-2 border-emerald-500/50 p-4 sm:p-5 rounded-2xl space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2.5 text-emerald-400 font-bold text-sm">
                    <Server className="w-5 h-5 text-emerald-400" />
                    <span className="text-white text-base font-black">Base de Datos Centralizada Activa</span>
                  </div>
                  <span className="flex items-center gap-1.5 text-xs bg-emerald-500 text-slate-950 px-3 py-1 rounded-full font-bold">
                    <span className="w-2 h-2 rounded-full bg-slate-950 animate-ping" />
                    CONECTADA Y EN PRODUCCIÓN
                  </span>
                </div>
                <p className="text-slate-300 font-sans text-xs leading-relaxed">
                  Tu aplicación <strong>ya está guardando las consultas de cédulas en tiempo real en la nube</strong>. No necesitas configurar servidores ni pagar por hosting: cada elector que entre al enlace público de tu campaña quedará registrado y lo verás en la pestaña <em>"Cédulas Recopiladas"</em>.
                </p>
                <div className="bg-slate-950/80 p-3 rounded-xl border border-emerald-500/30 font-mono text-[11px] text-emerald-300 flex items-center justify-between flex-wrap gap-2">
                  <span>URL Pública de tu Campaña:</span>
                  <a
                    href="https://ais-pre-ydwwqi2wh4rk7txlamn7un-569078938447.us-west2.run.app"
                    target="_blank"
                    rel="noreferrer"
                    className="text-amber-400 underline font-bold hover:text-amber-300 flex items-center gap-1 font-sans"
                  >
                    <span>Abrir Enlace Público</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* PostgreSQL Neon / Supabase Compatibility */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200">Compatibilidad con PostgreSQL (Neon / Supabase):</span>
                  <button
                    onClick={copySQL}
                    className="bg-slate-800 hover:bg-slate-700 text-cyan-300 px-3 py-1.5 rounded-lg border border-slate-700 flex items-center gap-1.5 text-xs font-bold cursor-pointer transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedSQL ? '¡Copiado!' : 'Copiar SQL'}</span>
                  </button>
                </div>
                <p className="text-slate-400 font-sans text-xs">
                  Si adicionalmente deseas sincronizar o migrar tus datos a una base de datos PostgreSQL en <strong>Neon</strong> o <strong>Supabase</strong>, aquí tienes el esquema SQL idéntico listo para ejecutar:
                </p>
                <pre className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 text-emerald-300 overflow-x-auto text-[11px] leading-relaxed">
                  {neonSQLCode}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 5: INSPECTOR HTML / CSS */}
          {activeTab === 'inspector' && (
            <div className="space-y-4 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-purple-400 text-sm">Estructura HTML5 & CSS de la Página</span>
                <span className="text-slate-500 text-[11px]">Diseño responsive listo para producción</span>
              </div>
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-slate-400 font-bold block mb-1">Bloque Principal HTML:</span>
                <pre className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-cyan-300 text-[11px] overflow-x-auto">
{`<div class="banner-fondo min-h-screen bg-slate-950 font-sans">
  <!-- Top Branding: Logo Candidato + Lista / Opcion -->
  <header class="flex justify-between items-start">
    <div class="header-logo">...</div>
    <div class="lista-opcion-squares">...</div>
  </header>

  <!-- Middle: Mobile/Desktop Candidate Portrait + Glass Form Card -->
  <main class="grid grid-cols-1 md:grid-cols-12">
    <!-- Mobile: Mounted above modal -->
    <!-- Desktop: Left side cutout -->
    <div class="glass-card">
      <label>Número de cédula</label>
      <input type="text" placeholder="Ej: 1234567" />
      <button class="btn-guardar">Guardar</button>
    </div>
  </main>

  <!-- Footer: Slogan Cambyretá Avanza con Vos -->
  <footer>...</footer>
</div>`}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="bg-slate-950 px-6 py-4 border-t border-slate-800 flex items-center justify-between">
          <div className="text-slate-500 text-xs font-mono">
            {collectedCedulas.length} cédula(s) recopilada(s)
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
          >
            Cerrar Panel
          </button>
        </div>

      </div>

      {/* Cedulas File Viewer Modal */}
      <CedulasFileViewerModal
        isOpen={isFileViewerOpen}
        onClose={() => setIsFileViewerOpen(false)}
        collectedCedulas={collectedCedulas}
      />
    </div>
  );
};
