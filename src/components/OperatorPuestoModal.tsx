import React, { useState, useEffect } from 'react';
import { Monitor, Check, X, ShieldCheck, MapPin, Sparkles } from 'lucide-react';

interface OperatorPuestoModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPuesto: string;
  onSavePuesto: (puesto: string) => void;
}

const PRESET_PCS = ['PC 1', 'PC 2', 'PC 3', 'PC 4', 'PC 5', 'PC 6', 'PC 7', 'PC 8'];

export const OperatorPuestoModal: React.FC<OperatorPuestoModalProps> = ({
  isOpen,
  onClose,
  currentPuesto,
  onSavePuesto,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [customPuesto, setCustomPuesto] = useState<string>('');
  const [ubicacionDetalle, setUbicacionDetalle] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      if (currentPuesto && PRESET_PCS.includes(currentPuesto)) {
        setSelectedPreset(currentPuesto);
        setCustomPuesto('');
      } else if (currentPuesto) {
        setSelectedPreset('custom');
        setCustomPuesto(currentPuesto);
      } else {
        setSelectedPreset('PC 1');
        setCustomPuesto('');
      }
    }
  }, [isOpen, currentPuesto]);

  if (!isOpen) return null;

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    let finalPC = '';
    if (selectedPreset === 'custom') {
      finalPC = customPuesto.trim() || 'PC General';
    } else {
      finalPC = selectedPreset || 'PC 1';
    }

    if (ubicacionDetalle.trim()) {
      finalPC = `${finalPC} (${ubicacionDetalle.trim()})`;
    }

    onSavePuesto(finalPC);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-emerald-500/60 rounded-3xl shadow-2xl overflow-hidden text-white flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 p-4 border-b border-emerald-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <Monitor className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Identificación de Puesto (PC)</h3>
              <p className="text-[11px] text-emerald-300 font-mono">Control y trazabilidad de operadores</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSave} className="p-5 space-y-4">
          <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-2xl p-3.5 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-300 leading-relaxed">
              Indica en qué <strong>Puesto de Control (PC)</strong> estás trabajando. Cada vez que marques a un votante, se registrará este puesto para auditar y ver los resultados por puesto en tiempo real.
            </p>
          </div>

          {/* Quick presets */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2 font-mono">
              Seleccionar Puesto Rápido
            </label>
            <div className="grid grid-cols-4 gap-2">
              {PRESET_PCS.map((pc) => {
                const isSelected = selectedPreset === pc;
                return (
                  <button
                    key={pc}
                    type="button"
                    onClick={() => {
                      setSelectedPreset(pc);
                      setCustomPuesto('');
                    }}
                    className={`py-2.5 px-2 rounded-xl text-xs sm:text-sm font-black font-mono transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-400 shadow-lg shadow-emerald-600/30 scale-102'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    {pc}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom PC Option */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setSelectedPreset('custom')}
              className={`w-full py-2 px-3 rounded-xl text-xs font-bold border transition-colors flex items-center justify-between cursor-pointer ${
                selectedPreset === 'custom'
                  ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Otro nombre / Puesto personalizado</span>
              </div>
              {selectedPreset === 'custom' && <Check className="w-4 h-4 text-cyan-400" />}
            </button>

            {selectedPreset === 'custom' && (
              <div className="mt-2 animate-fadeIn">
                <input
                  type="text"
                  value={customPuesto}
                  onChange={(e) => setCustomPuesto(e.target.value)}
                  placeholder="Ej: PC Móvil 1, PC Tinglado, PC Mesa 5..."
                  className="w-full bg-slate-950 border border-cyan-500/50 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/30 font-sans"
                  autoFocus
                />
              </div>
            )}
          </div>

          {/* Optional location/operator note */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1 font-mono flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <span>Detalle de Ubicación u Operador (Opcional)</span>
            </label>
            <input
              type="text"
              value={ubicacionDetalle}
              onChange={(e) => setUbicacionDetalle(e.target.value)}
              placeholder="Ej: Portón Norte, Delegado Carlos..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg shadow-emerald-600/30 transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-98"
            >
              <Check className="w-4 h-4" />
              <span>Confirmar Puesto</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
