import React, { useState } from 'react';
import {
  X,
  MapPin,
  Vote,
  Hash,
  User,
  Share2,
  Check,
  Printer,
  Sparkles,
  School,
  UserCheck
} from 'lucide-react';
import { ElectorRecord, CampaignConfig } from '../types';
import { formatCedulaDisplay } from '../utils/sheetParser';
import { ListaOpcionBadge } from './ListaOpcionBadge';

interface ElectorDetailModalProps {
  elector: ElectorRecord | null;
  isOpen: boolean;
  onClose: () => void;
  campaign: CampaignConfig;
  onNewSearch: () => void;
  isVoted?: boolean;
  horaVoto?: string;
  onToggleVote?: (status: boolean) => void;
}

export const ElectorDetailModal: React.FC<ElectorDetailModalProps> = ({
  elector,
  isOpen,
  onClose,
  campaign,
  onNewSearch,
  isVoted = false,
  horaVoto,
  onToggleVote,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !elector) return null;

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
                Datos del Elector
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
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          
          {/* Elector Main Identity Card */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-lg text-center relative overflow-hidden notranslate" translate="no">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
            
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
              Nombre y Apellido
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-amber-300 tracking-tight mt-0.5 mb-1.5">
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
                    <p className="text-xs text-slate-300 font-mono mt-0.5">
                      Hora de registro: <strong className="text-amber-300">{horaVoto}</strong>
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

          {/* Mesa & Orden Highlights (High contrast cards) */}
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

          {/* Quick Share / Print Buttons */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={handleShareWhatsApp}
              className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold shadow-md cursor-pointer transition-colors"
            >
              <Share2 className="w-4 h-4" />
              <span>WhatsApp</span>
            </button>

            <button
              onClick={handleCopy}
              className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs sm:text-sm font-bold shadow-md cursor-pointer transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Printer className="w-4 h-4" />}
              <span>{copied ? '¡Copiado!' : 'Copiar Ficha'}</span>
            </button>
          </div>

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
