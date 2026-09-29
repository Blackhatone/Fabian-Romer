import React, { useState, useEffect, useMemo } from 'react';
import { UserPlus, X, Check, Building, MapPin, Hash, User, Phone, FileText, Vote, ShieldCheck } from 'lucide-react';
import { ElectorRecord } from '../types';
import { normalizeCedula, formatCedulaDisplay } from '../utils/sheetParser';

interface AddElectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCedula: string;
  existingElectors: ElectorRecord[];
  operatorPuesto: string;
  onSaveFullElector: (
    elector: ElectorRecord,
    options: {
      markAsVoted: boolean;
      puestoControl?: string;
      telefono?: string;
      observaciones?: string;
    }
  ) => void;
}

export const AddElectorModal: React.FC<AddElectorModalProps> = ({
  isOpen,
  onClose,
  initialCedula,
  existingElectors,
  operatorPuesto,
  onSaveFullElector,
}) => {
  const [cedula, setCedula] = useState('');
  const [nombreApellido, setNombreApellido] = useState('');
  const [mesa, setMesa] = useState('');
  const [orden, setOrden] = useState('');
  const [localVotacion, setLocalVotacion] = useState('');
  const [barrio, setBarrio] = useState('');
  const [responsable, setResponsable] = useState('');
  const [telefono, setTelefono] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [markAsVoted, setMarkAsVoted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Extract distinct locals and barrios for easy auto-complete suggestions
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

  useEffect(() => {
    if (isOpen) {
      const clean = normalizeCedula(initialCedula);
      setCedula(clean || initialCedula || '');
      setNombreApellido('');
      setMesa('');
      setOrden('');
      setLocalVotacion(uniqueLocales[0] || 'Colegio Electoral');
      setBarrio(uniqueBarrios[0] || '');
      setResponsable('');
      setTelefono('');
      setObservaciones('');
      setMarkAsVoted(false);
      setErrorMessage(null);
    }
  }, [isOpen, initialCedula, uniqueLocales, uniqueBarrios]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCed = normalizeCedula(cedula);
    if (!cleanCed) {
      setErrorMessage('Por favor ingresa un número de cédula válido.');
      return;
    }
    if (!nombreApellido.trim()) {
      setErrorMessage('Por favor ingresa el Nombre y Apellido del elector.');
      return;
    }

    const newElector: ElectorRecord = {
      cedula: cleanCed,
      nombreApellido: nombreApellido.trim().toUpperCase(),
      mesa: mesa.trim() || 'General',
      orden: orden.trim() || '—',
      localVotacion: localVotacion.trim() || 'Local General',
      barrio: barrio.trim() || 'General',
      responsable: responsable.trim() || undefined,
    };

    onSaveFullElector(newElector, {
      markAsVoted,
      puestoControl: operatorPuesto,
      telefono: telefono.trim() || undefined,
      observaciones: observaciones.trim() || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-lg bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-red-500/60 rounded-3xl shadow-2xl overflow-hidden text-white flex flex-col my-auto max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-red-950 via-slate-900 to-red-950 p-4 sm:p-5 border-b border-red-500/30 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-red-600/20 text-red-400 border border-red-500/30">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white leading-tight">
                Registrar Elector en Padrón
              </h3>
              <p className="text-xs text-red-300 font-mono">
                Carga completa de datos del votante
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 font-sans text-xs sm:text-sm">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/60 text-rose-200 text-xs font-bold animate-fadeIn">
              {errorMessage}
            </div>
          )}

          {/* C.I. & Nombre */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1 font-mono">
                Cédula (C.I. N°) *
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400" />
                <input
                  type="text"
                  value={cedula}
                  onChange={(e) => setCedula(e.target.value)}
                  placeholder="Ej: 4567890"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-white font-mono font-bold text-sm focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div className="sm:col-span-7">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1 font-mono">
                Nombre y Apellido *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400" />
                <input
                  type="text"
                  value={nombreApellido}
                  onChange={(e) => setNombreApellido(e.target.value)}
                  placeholder="Ej: JUAN CARLOS BENÍTEZ"
                  required
                  autoFocus
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-white font-bold text-sm focus:outline-none focus:border-red-500 uppercase"
                />
              </div>
            </div>
          </div>

          {/* Mesa y Orden */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1 font-mono">
                Mesa de Votación
              </label>
              <input
                type="text"
                value={mesa}
                onChange={(e) => setMesa(e.target.value)}
                placeholder="Ej: 3"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-center font-bold text-sm focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1 font-mono">
                N° de Orden
              </label>
              <input
                type="text"
                value={orden}
                onChange={(e) => setOrden(e.target.value)}
                placeholder="Ej: 142"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-center font-bold text-sm focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          {/* Local de Votación con datalist */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1 font-mono flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-emerald-400" />
              <span>Local de Votación</span>
            </label>
            <input
              type="text"
              list="locales-list"
              value={localVotacion}
              onChange={(e) => setLocalVotacion(e.target.value)}
              placeholder="Ej: Escuela Graduada N° 123"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs sm:text-sm focus:outline-none focus:border-red-500"
            />
            <datalist id="locales-list">
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
                list="barrios-list"
                value={barrio}
                onChange={(e) => setBarrio(e.target.value)}
                placeholder="Ej: San Blas"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs sm:text-sm focus:outline-none focus:border-red-500"
              />
              <datalist id="barrios-list">
                {uniqueBarrios.map((b) => (
                  <option key={b} value={b} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1 font-mono flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                <span>Responsable / Referente</span>
              </label>
              <input
                type="text"
                value={responsable}
                onChange={(e) => setResponsable(e.target.value)}
                placeholder="Ej: Carlos González"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs sm:text-sm focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          {/* Teléfono & Observación */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1 font-mono flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-cyan-400" />
                <span>Teléfono de Contacto (Opcional)</span>
              </label>
              <input
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="Ej: 0981 123 456"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs sm:text-sm focus:outline-none focus:border-red-500 font-mono"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1 font-mono flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span>Observación o Nota</span>
              </label>
              <input
                type="text"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Ej: Votante trasladado, mesa especial..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs sm:text-sm focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          {/* Quick Vote Toggle Checkbox */}
          <div className="pt-2">
            <label className="flex items-center gap-3 p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl cursor-pointer hover:bg-emerald-950/60 transition-colors">
              <input
                type="checkbox"
                checked={markAsVoted}
                onChange={(e) => setMarkAsVoted(e.target.checked)}
                className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 focus:ring-offset-slate-900 accent-emerald-500 cursor-pointer"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Vote className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-white text-xs sm:text-sm">
                    Marcar como YA VOTÓ (Pasó por mesa) ahora
                  </span>
                </div>
                <p className="text-[11px] text-emerald-300 font-mono mt-0.5">
                  Se registrará desde tu puesto actual: <strong className="text-white">{operatorPuesto}</strong>
                </p>
              </div>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs sm:text-sm transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-2 py-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black text-xs sm:text-sm shadow-xl shadow-red-600/30 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
            >
              <Check className="w-4 h-4" />
              <span>Guardar Elector Completo</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
