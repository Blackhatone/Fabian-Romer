import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  MapPin,
  Vote,
  Hash,
  User,
  Share2,
  Check,
  Printer,
  School,
  UserCheck,
  Pencil,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Building
} from 'lucide-react';
import { ElectorRecord, CampaignConfig } from '../types';
import { formatCedulaDisplay, normalizeCedula } from '../utils/sheetParser';
import { ListaOpcionBadge } from './ListaOpcionBadge';

interface ElectorDetailModalProps {
  elector: ElectorRecord | null;
  isOpen: boolean;
  onClose: () => void;
  campaign: CampaignConfig;
  onNewSearch: () => void;
  isVoted?: boolean;
  horaVoto?: string;
  puestoControl?: string;
  currentOperatorPuesto?: string;
  onToggleVote?: (status: boolean) => void;
  onUpdateElector?: (originalCedula: string, updated: ElectorRecord) => void;
  existingElectors?: ElectorRecord[];
}

export const ElectorDetailModal: React.FC<ElectorDetailModalProps> = ({
  elector,
  isOpen,
  onClose,
  campaign,
  onNewSearch,
  isVoted = false,
  horaVoto,
  puestoControl,
  currentOperatorPuesto,
  onToggleVote,
  onUpdateElector,
  existingElectors = [],
}) => {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editCedula, setEditCedula] = useState('');
  const [editNombreApellido, setEditNombreApellido] = useState('');
  const [editMesa, setEditMesa] = useState<string | number>('');
  const [editOrden, setEditOrden] = useState<string | number>('');
  const [editLocalVotacion, setEditLocalVotacion] = useState('');
  const [editBarrio, setEditBarrio] = useState('');
  const [editResponsable, setEditResponsable] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const [savedFeedback, setSavedFeedback] = useState<string | null>(null);

  // Reset edit mode when modal is reopened or elector changes
  useEffect(() => {
    setIsEditing(false);
    setEditError(null);
    setSavedFeedback(null);
  }, [isOpen, elector?.cedula]);

  // Extract unique locales and barrios for auto-complete suggestions
  const uniqueLocales = useMemo(() => {
    const set = new Set<string>();
    existingElectors.forEach((e) => {
      if (e.localVotacion?.trim()) set.add(e.localVotacion.trim());
    });
    return Array.from(set).slice(0, 20);
  }, [existingElectors]);

  const uniqueBarrios = useMemo(() => {
    const set = new Set<string>();
    existingElectors.forEach((e) => {
      if (e.barrio?.trim()) set.add(e.barrio.trim());
    });
    return Array.from(set).slice(0, 20);
  }, [existingElectors]);

  if (!isOpen || !elector) return null;

  const startEditing = () => {
    setEditCedula(elector.cedula);
    setEditNombreApellido(elector.nombreApellido);
    setEditMesa(elector.mesa);
    setEditOrden(elector.orden);
    setEditLocalVotacion(elector.localVotacion);
    setEditBarrio(elector.barrio);
    setEditResponsable(elector.responsable || '');
    setEditError(null);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditError(null);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editNombreApellido.trim()) {
      setEditError('El Nombre y Apellido no puede estar vacío.');
      return;
    }
    const cleanCedula = normalizeCedula(String(editCedula));
    if (!cleanCedula) {
      setEditError('Por favor ingresa un número de cédula válido.');
      return;
    }

    const updatedRecord: ElectorRecord = {
      ...elector,
      cedula: cleanCedula,
      nombreApellido: editNombreApellido.trim().toUpperCase(),
      mesa: String(editMesa).trim() || 'General',
      orden: String(editOrden).trim() || '—',
      localVotacion: editLocalVotacion.trim() || 'Local General',
      barrio: editBarrio.trim() || 'General',
      responsable: editResponsable.trim() || undefined,
    };

    if (onUpdateElector) {
      onUpdateElector(elector.cedula, updatedRecord);
    }
    setIsEditing(false);
    setSavedFeedback('¡Datos modificados y sincronizados correctamente en la nube!');
    setTimeout(() => setSavedFeedback(null), 4000);
  };

  const handleShareWhatsApp = () => {
    const text = `🗳️ *DATOS DE VOTACIÓN - CAMBYRETÁ 2026*\n\n` +
      `👤 *Votante:* ${elector.nombreApellido}\n` +
      `🆔 *C.I. N°:* ${formatCedulaDisplay(elector.cedula)}\n` +
      `📍 *Local:* ${elector.localVotacion}\n` +
      `🗳️ *Mesa:* ${elector.mesa}\n` +
      `🔢 *Orden:* ${elector.orden}\n` +
      `🏘️ *Barrio:* ${elector.barrio}\n` +
      (elector.responsable ? `🤝 *Responsable:* ${elector.responsable}\n` : '') +
      `\n⭐ *¡Tu voto cuenta! Lista ${campaign.listNumber} - Opción ${campaign.optionNumber || '7'}*`;

    const encoded = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  const handleCopy = () => {
    const text = `DATOS DE VOTACIÓN:\nVotante: ${elector.nombreApellido}\nC.I. N°: ${formatCedulaDisplay(elector.cedula)}\nLocal: ${elector.localVotacion}\nMesa: ${elector.mesa}\nOrden: ${elector.orden}\nBarrio: ${elector.barrio}${elector.responsable ? `\nResponsable: ${elector.responsable}` : ''}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn notranslate" translate="no">
      <div className="relative w-full max-w-lg bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-emerald-500/60 rounded-3xl shadow-2xl overflow-hidden text-white flex flex-col max-h-[92vh]">
        
        {/* Top Header Badge */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 p-4 border-b border-emerald-500/30 flex items-center justify-between notranslate" translate="no">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
              <Vote className="w-5 h-5" />
            </span>
            <div>
              <p className="text-[10px] font-mono tracking-widest text-emerald-400 uppercase font-bold">
                Padrón Electoral 2026
              </p>
              <h3 className="text-sm sm:text-base font-black text-white">
                {isEditing ? 'Modificar Datos de Elector' : 'Datos del Elector'}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="scale-75 origin-right">
              <ListaOpcionBadge
                listNumber={campaign.listNumber}
                optionNumber={campaign.optionNumber || '7'}
                size="sm"
              />
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 font-sans text-xs sm:text-sm">
          
          {/* Saved Feedback Alert */}
          {savedFeedback && (
            <div className="p-3 bg-emerald-600/90 border border-emerald-400 text-white rounded-2xl font-bold flex items-center gap-2 shadow-xl animate-fadeIn font-mono text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
              <span>{savedFeedback}</span>
            </div>
          )}

          {/* EDIT MODE FORM */}
          {isEditing ? (
            <form onSubmit={handleSaveEdit} className="space-y-4 animate-fadeIn">
              
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs">
                <p className="font-bold flex items-center gap-1.5 text-amber-300">
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Modificar Datos del Elector</span>
                </p>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Puedes corregir el Nombre, Mesa, Orden, Barrio o Local si existe algún error. Se sincronizará inmediatamente.
                </p>
              </div>

              {editError && (
                <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-500/60 text-rose-200 text-xs font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{editError}</span>
                </div>
              )}

              {/* Nombre y Apellido */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1 font-mono">
                  Nombre y Apellido *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400" />
                  <input
                    type="text"
                    value={editNombreApellido}
                    onChange={(e) => setEditNombreApellido(e.target.value)}
                    required
                    autoFocus
                    placeholder="Ej: JUAN CARLOS BENÍTEZ"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-white font-bold text-sm focus:outline-none focus:border-amber-500 uppercase"
                  />
                </div>
              </div>

              {/* Cédula */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1 font-mono">
                  Cédula (C.I. N°) *
                </label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400" />
                  <input
                    type="text"
                    value={editCedula}
                    onChange={(e) => setEditCedula(e.target.value)}
                    required
                    placeholder="Ej: 4567890"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-white font-mono font-bold text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Mesa y Orden */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1 font-mono">
                    Mesa N°
                  </label>
                  <input
                    type="text"
                    value={editMesa}
                    onChange={(e) => setEditMesa(e.target.value)}
                    placeholder="Ej: 3"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-center font-bold text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1 font-mono">
                    N° de Orden
                  </label>
                  <input
                    type="text"
                    value={editOrden}
                    onChange={(e) => setEditOrden(e.target.value)}
                    placeholder="Ej: 142"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-center font-bold text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Local de Votación */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1 font-mono flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Local de Votación</span>
                </label>
                <input
                  type="text"
                  list="edit-locales-list"
                  value={editLocalVotacion}
                  onChange={(e) => setEditLocalVotacion(e.target.value)}
                  placeholder="Ej: Escuela República de Colombia"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500 text-xs sm:text-sm"
                />
                <datalist id="edit-locales-list">
                  {uniqueLocales.map((loc) => (
                    <option key={loc} value={loc} />
                  ))}
                </datalist>
              </div>

              {/* Barrio y Responsable */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1 font-mono flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-400" />
                    <span>Barrio</span>
                  </label>
                  <input
                    type="text"
                    list="edit-barrios-list"
                    value={editBarrio}
                    onChange={(e) => setEditBarrio(e.target.value)}
                    placeholder="Ej: Centro"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500 text-xs sm:text-sm"
                  />
                  <datalist id="edit-barrios-list">
                    {uniqueBarrios.map((b) => (
                      <option key={b} value={b} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1 font-mono flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-purple-400" />
                    <span>Responsable / Referente</span>
                  </label>
                  <input
                    type="text"
                    value={editResponsable}
                    onChange={(e) => setEditResponsable(e.target.value)}
                    placeholder="Ej: Carlos González"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500 text-xs sm:text-sm"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={cancelEditing}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-2 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-500/30 flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-98"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar Modificación</span>
                </button>
              </div>

            </form>
          ) : (
            <>
              {/* NORMAL VIEW MODE */}

              {/* Elector Main Identity Card */}
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-lg text-center relative overflow-hidden notranslate" translate="no">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
                
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                    Nombre y Apellido
                  </span>

                  {/* Clean Edit Button */}
                  <button
                    type="button"
                    onClick={startEditing}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 text-xs font-bold font-mono transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-sm"
                    title="Modificar datos del elector si hay error en nombre, mesa u otros datos"
                  >
                    <Pencil className="w-3.5 h-3.5 text-amber-400" />
                    <span>Modificar Datos</span>
                  </button>
                </div>

                <h2 className="text-xl sm:text-2xl font-black text-amber-300 tracking-tight mt-0.5 mb-2">
                  {elector.nombreApellido}
                </h2>

                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-900 border border-slate-700 text-xs sm:text-sm font-mono text-emerald-300 font-bold">
                  <span>C.I. N°</span>
                  <span className="text-white text-base font-mono">{formatCedulaDisplay(elector.cedula)}</span>
                </div>
              </div>

              {/* Real-time Voting Status Card (Synchronized with Cloud Firestore) */}
              {isVoted ? (
                <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border-2 border-emerald-500/80 rounded-2xl p-4 shadow-xl flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400">
                      <Check className="w-6 h-6 stroke-[3]" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-extrabold flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        CONFIRMADO EN LA NUBE
                      </span>
                      <h4 className="text-white text-base sm:text-lg font-black">
                        ¡Ya pasó por la mesa! (Ya votó)
                      </h4>
                      {horaVoto && (
                        <p className="text-xs text-slate-300 font-mono mt-0.5 flex flex-wrap items-center gap-1.5">
                          <span>Hora: <strong className="text-amber-300">{horaVoto}</strong></span>
                          {puestoControl && (
                            <span className="bg-cyan-950/80 text-cyan-300 border border-cyan-700/60 px-2 py-0.5 rounded-md font-bold text-[11px]">
                              {puestoControl}
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>

                  {onToggleVote && (
                    <button
                      onClick={() => onToggleVote(false)}
                      className="text-xs px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-600 transition-colors cursor-pointer"
                      title="Desmarcar voto si fue registrado por error"
                    >
                      Desmarcar
                    </button>
                  )}
                </div>
              ) : (
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-md flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400">
                      <Vote className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold">
                        CONTROL EN MESA
                      </span>
                      <h4 className="text-slate-200 text-sm sm:text-base font-bold">
                        Aún no figura como votado
                      </h4>
                      {currentOperatorPuesto && (
                        <span className="text-[11px] text-emerald-400 font-mono">
                          Operando desde: <strong>{currentOperatorPuesto}</strong>
                        </span>
                      )}
                    </div>
                  </div>

                  {onToggleVote && (
                    <button
                      onClick={() => onToggleVote(true)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Marcar: Ya Pasó por Mesa</span>
                    </button>
                  )}
                </div>
              )}

              {/* Mesa & Orden Highlights */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4 notranslate" translate="no">
                {/* Mesa */}
                <div className="bg-gradient-to-br from-emerald-950 to-slate-900 border-2 border-emerald-500/70 rounded-2xl p-3.5 sm:p-4 text-center shadow-md">
                  <span className="text-[10px] sm:text-xs uppercase font-extrabold tracking-wider text-emerald-400 block font-mono">
                    MESA N°
                  </span>
                  <span className="text-3xl sm:text-4xl font-black text-white font-mono mt-1 block">
                    {elector.mesa}
                  </span>
                </div>

                {/* Orden */}
                <div className="bg-gradient-to-br from-amber-950 to-slate-900 border-2 border-amber-500/70 rounded-2xl p-3.5 sm:p-4 text-center shadow-md">
                  <span className="text-[10px] sm:text-xs uppercase font-extrabold tracking-wider text-amber-400 block font-mono">
                    N° DE ORDEN
                  </span>
                  <span className="text-3xl sm:text-4xl font-black text-amber-300 font-mono mt-1 block">
                    {elector.orden}
                  </span>
                </div>
              </div>

              {/* Details List */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3 font-sans">
                
                {/* Local de Votación */}
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
                    <School className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block">
                      Local de Votación
                    </span>
                    <p className="text-sm sm:text-base font-bold text-white break-words">
                      {elector.localVotacion}
                    </p>
                  </div>
                </div>

                <div className="h-px bg-slate-800" />

                {/* Barrio */}
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 shrink-0 mt-0.5">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block">
                      Barrio
                    </span>
                    <p className="text-sm sm:text-base font-semibold text-slate-100">
                      {elector.barrio}
                    </p>
                  </div>
                </div>

                {/* Responsable (if exists) */}
                {elector.responsable && (
                  <>
                    <div className="h-px bg-slate-800" />
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 shrink-0 mt-0.5">
                        <UserCheck className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block">
                          Responsable de Lista
                        </span>
                        <p className="text-sm sm:text-base font-semibold text-purple-200">
                          {elector.responsable}
                        </p>
                      </div>
                    </div>
                  </>
                )}

              </div>

              {/* Quick Share / Print / Modify Buttons */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={handleShareWhatsApp}
                  className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md cursor-pointer transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  <span>WhatsApp</span>
                </button>

                <button
                  onClick={handleCopy}
                  className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold shadow-md cursor-pointer transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Printer className="w-4 h-4" />}
                  <span>{copied ? 'Copiado' : 'Copiar'}</span>
                </button>

                <button
                  onClick={startEditing}
                  className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 text-xs font-bold shadow-md cursor-pointer transition-colors"
                  title="Modificar datos del votante"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Modificar</span>
                </button>
              </div>
            </>
          )}

        </div>

        {/* Modal Bottom Actions */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center gap-3">
          <button
            onClick={() => {
              onClose();
              onNewSearch();
            }}
            className="w-full bg-red-600 hover:bg-red-500 text-white font-black py-3 rounded-2xl text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-red-600/40 cursor-pointer transition-all active:scale-98"
          >
            <span>Consultar otra cédula</span>
          </button>
        </div>

      </div>
    </div>
  );
};
