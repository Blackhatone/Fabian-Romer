import React, { useState } from 'react';
import { Search, CheckCircle2, Settings, AlertCircle, Vote, PlusCircle, Radio, Monitor } from 'lucide-react';
import { CampaignConfig, ElectorRecord, CollectedCedula } from '../types';
import { ListaOpcionBadge } from './ListaOpcionBadge';
import { ElectorDetailModal } from './ElectorDetailModal';
import { LiveVotantesMonitorModal } from './LiveVotantesMonitorModal';
import { OperatorPuestoModal } from './OperatorPuestoModal';
import { normalizeCedula, formatCedulaDisplay } from '../utils/sheetParser';

interface MainPadronViewProps {
  campaign: CampaignConfig;
  electors: ElectorRecord[];
  collectedCedulas: CollectedCedula[];
  onSearchElector: (cedula: string) => { found: boolean; elector?: ElectorRecord };
  onSaveCedula: (cedula: string) => boolean;
  onTogglePasoPorMesa: (record: CollectedCedula | ElectorRecord, status: boolean, puestoControl?: string) => void;
  onOpenAdmin: () => void;
  operatorPuesto: string;
  setOperatorPuesto: (puesto: string) => void;
}

export const MainPadronView: React.FC<MainPadronViewProps> = ({
  campaign,
  electors,
  collectedCedulas,
  onSearchElector,
  onSaveCedula,
  onTogglePasoPorMesa,
  onOpenAdmin,
  operatorPuesto,
  setOperatorPuesto,
}) => {
  const [cedulaInput, setCedulaInput] = useState('');
  const [selectedElector, setSelectedElector] = useState<ElectorRecord | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isLiveMonitorOpen, setIsLiveMonitorOpen] = useState(false);
  const [isOperatorModalOpen, setIsOperatorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notFoundCedula, setNotFoundCedula] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Real-time count of electors who have already voted / passed the table
  const votedCount = collectedCedulas.filter((c) => c.pasoPorMesa === true).length;

  // Selected elector voting status
  const selectedCleanCed = selectedElector ? normalizeCedula(selectedElector.cedula) : '';
  const currentVoteRecord = selectedCleanCed
    ? collectedCedulas.find((c) => normalizeCedula(c.cedula) === selectedCleanCed)
    : undefined;
  const isCurrentElectorVoted = currentVoteRecord?.pasoPorMesa === true;
  const currentElectorHoraVoto = currentVoteRecord?.horaVoto;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCedula = normalizeCedula(cedulaInput);
    if (!cleanCedula) {
      setErrorMessage('Por favor ingresa un número de cédula válido.');
      return;
    }

    setErrorMessage(null);
    setNotFoundCedula(null);
    setSaveSuccess(null);

    // Search elector in the LibreOffice padron
    const result = onSearchElector(cleanCedula);

    if (result.found && result.elector) {
      setSelectedElector(result.elector);
      setIsDetailModalOpen(true);
      // Automatically record consultation
      onSaveCedula(cleanCedula);
    } else {
      // Elector not found in database
      setNotFoundCedula(cleanCedula);
    }
  };

  const handleSaveNotFound = () => {
    if (!notFoundCedula) return;
    onSaveCedula(notFoundCedula);
    setSaveSuccess(`¡Cédula ${formatCedulaDisplay(notFoundCedula)} registrada con éxito!`);
    setNotFoundCedula(null);
    setCedulaInput('');
    setTimeout(() => setSaveSuccess(null), 4000);
  };

  const handleResetSearch = () => {
    setCedulaInput('');
    setSelectedElector(null);
    setNotFoundCedula(null);
    setErrorMessage(null);
  };

  return (
    <div className="relative min-h-screen w-full bg-slate-950 text-white overflow-hidden flex flex-col justify-between font-sans select-none">
      
      {/* Background Image Layer with aerial blur and overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-700"
        style={{ backgroundImage: `url(${campaign.backgroundUrl})` }}
      />
      {/* Gradient & Light Blur Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/40 to-slate-950/60 backdrop-brightness-110" />
      <div className="absolute inset-0 bg-white/20 backdrop-blur-[2px]" />

      {/* MAIN SCREEN CONTAINER */}
      <div className="relative z-20 flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 flex flex-col justify-between items-center">

        {/* TOP BRANDING ROW */}
        <div className="w-full flex items-start justify-between gap-2 sm:gap-4">
          
          {/* Top-Left Banner: Candidate Logo Image or High-Contrast Badge */}
          <div className="flex flex-col items-start space-y-1 max-w-[55%] sm:max-w-none">
            {campaign.headerLogoUrl ? (
              <img
                src={campaign.headerLogoUrl}
                alt={campaign.candidateName}
                referrerPolicy="no-referrer"
                className="max-h-28 sm:max-h-36 md:max-h-40 w-auto object-contain drop-shadow-2xl transition-all"
              />
            ) : (
              <div className="bg-slate-900/90 border-2 border-emerald-600 px-4 sm:px-6 py-2 sm:py-3 rounded-2xl shadow-2xl backdrop-blur-md flex flex-col items-start border-b-4 border-b-emerald-500">
                <div className="text-2xl sm:text-4xl font-black tracking-tight text-white font-sans drop-shadow-md flex items-center gap-1.5 sm:gap-2">
                  <span className="text-amber-400 font-extrabold">{campaign.candidateName.split(' ')[0]}</span>
                  <span className="text-slate-100">{campaign.candidateName.split(' ')[1]}</span>
                </div>
                <div className="bg-emerald-600 text-white text-[10px] sm:text-sm font-black tracking-widest px-2.5 sm:px-3.5 py-0.5 sm:py-1 rounded-md uppercase mt-1 shadow-sm">
                  {campaign.candidateRole}
                </div>
              </div>
            )}
          </div>

          {/* Top-Right Badges: LISTA 1 OPCION 7 on top, Monitor Día D button below it */}
          <div className="flex flex-col items-end gap-1.5 sm:gap-2">
            {/* LISTA 1 - OPCIÓN 7 */}
            <div className="transform hover:scale-105 transition-transform">
              <ListaOpcionBadge
                listNumber={campaign.listNumber}
                optionNumber={campaign.optionNumber || '7'}
                size="md"
              />
            </div>

            {/* Action buttons row: PC Selector + Live Día D Monitor */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Operator Active PC Selector Button */}
              <button
                onClick={() => setIsOperatorModalOpen(true)}
                className="flex items-center gap-1.5 sm:gap-2 bg-slate-900/90 hover:bg-slate-800 border-2 border-cyan-500/80 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl shadow-xl backdrop-blur-md cursor-pointer transition-all hover:scale-105 active:scale-95 text-right group"
                title="Cambiar Puesto de Control (PC)"
              >
                <div className="p-1 rounded-lg bg-cyan-500/20 text-cyan-400 group-hover:bg-cyan-500 group-hover:text-slate-950 transition-colors">
                  <Monitor className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <div className="text-right">
                  <span className="text-[9px] sm:text-[10px] font-mono text-cyan-300 font-bold uppercase block leading-none">
                    Puesto
                  </span>
                  <span className="text-[11px] sm:text-xs font-black text-white font-mono leading-tight block">
                    {operatorPuesto}
                  </span>
                </div>
              </button>

              {/* Live Day D Monitor Button */}
              <button
                onClick={() => setIsLiveMonitorOpen(true)}
                className="flex items-center gap-1.5 sm:gap-2 bg-slate-900/90 hover:bg-slate-800 border-2 border-emerald-500/80 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl shadow-xl backdrop-blur-md cursor-pointer transition-all hover:scale-105 active:scale-95 text-right group"
                title="Abrir Monitor Día D en Vivo"
              >
                <div className="relative">
                  <div className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-colors">
                    <Vote className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                </div>
                <div>
                  <div className="flex items-center justify-end gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span className="text-[9px] sm:text-[10px] font-mono text-emerald-300 font-bold uppercase">Día D</span>
                  </div>
                  <div className="text-[11px] sm:text-xs font-black text-white font-mono leading-tight">
                    <span className="text-amber-300">{votedCount}</span> votaron
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* MIDDLE CONTENT AREA: CANDIDATE + FROSTED GLASS RECOPILACIÓN CARD */}
        <div className="w-full flex-1 flex flex-col items-center justify-center py-2 sm:py-4 my-auto">

          {/* MOBILE CANDIDATE PORTRAIT (Significantly enlarged on mobile) */}
          <div className="flex md:hidden flex-col items-center -mb-8 z-30 relative pointer-events-none">
            <img
              src={campaign.candidatePhotoUrl}
              alt={campaign.candidateName}
              referrerPolicy="no-referrer"
              className="w-72 h-72 xs:w-80 xs:h-80 sm:w-96 sm:h-96 max-h-[380px] object-contain object-bottom drop-shadow-2xl transition-all"
            />
          </div>

          <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 lg:gap-6 items-center">
            
            {/* DESKTOP CANDIDATE PORTRAIT (LEFT SIDE - 5 COLS) */}
            <div className="hidden md:flex md:col-span-5 flex-col items-end justify-center relative md:pr-1 lg:pr-2">
              <img
                src={campaign.candidatePhotoUrl}
                alt={campaign.candidateName}
                referrerPolicy="no-referrer"
                className="max-h-[560px] lg:max-h-[640px] xl:max-h-[700px] w-auto object-contain object-bottom drop-shadow-2xl transition-transform duration-300 hover:scale-[1.02]"
              />
            </div>

            {/* FROSTED GLASS CARD (RIGHT/CENTER - 7 COLS ON DESKTOP, FULL WIDTH ON MOBILE) */}
            <div className="col-span-1 md:col-span-7 flex justify-start w-full md:pl-1 lg:pl-2">
              <div className="w-full max-w-xl sm:max-w-2xl bg-white/20 backdrop-blur-xl rounded-3xl border-2 border-white/50 p-6 sm:p-10 shadow-2xl relative overflow-hidden transition-all pt-10 md:pt-10">
                
                {/* Form Title Label */}
                <div className="flex items-center justify-between mb-3.5">
                  <label className="block text-slate-100 text-base sm:text-xl font-black font-sans drop-shadow-md tracking-tight">
                    Número de cédula
                  </label>
                  <span className="text-xs text-amber-300 font-mono font-bold bg-slate-950/60 px-2.5 py-1 rounded-full border border-amber-400/40">
                    Padrón 2026
                  </span>
                </div>

                {/* Consultation Search Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="relative">
                    <input
                      type="text"
                      value={cedulaInput}
                      onChange={(e) => {
                        setCedulaInput(e.target.value);
                        if (errorMessage) setErrorMessage(null);
                        if (notFoundCedula) setNotFoundCedula(null);
                      }}
                      placeholder="Ej: 1234567"
                      className="w-full bg-white text-slate-900 placeholder-slate-400 px-5 py-4 rounded-2xl text-xl sm:text-2xl font-bold border-2 border-slate-200 focus:outline-none focus:ring-4 focus:ring-red-500/30 focus:border-red-500 shadow-inner font-mono text-center tracking-wider"
                      autoFocus
                    />
                  </div>

                  {/* Primary Action Button: "Consultar Padrón" in Red */}
                  <button
                    type="submit"
                    className="w-full bg-red-600 hover:bg-red-500 text-white font-black py-4 rounded-2xl text-lg sm:text-xl flex items-center justify-center gap-2.5 shadow-2xl shadow-red-600/50 border border-red-400/40 transition-all transform active:scale-98 cursor-pointer"
                  >
                    <Search className="w-5 h-5 sm:w-6 sm:h-6" />
                    <span>Consultar Padrón</span>
                  </button>
                </form>

                {/* Not Found In LibreOffice Sheet Notification */}
                {notFoundCedula && (
                  <div className="mt-4 p-4 bg-slate-950/90 border-2 border-amber-500/80 text-white rounded-2xl text-xs sm:text-sm font-sans shadow-xl animate-fadeIn space-y-3">
                    <div className="flex items-start gap-2.5">
                      <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-amber-300">
                          Cédula {formatCedulaDisplay(notFoundCedula)} no encontrada
                        </p>
                        <p className="text-slate-300 text-xs mt-0.5">
                          No figura en la hoja del padrón electoral actual. Puedes verificar el número o registrarla en el sistema.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
                      <button
                        onClick={handleSaveNotFound}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow cursor-pointer transition-colors"
                      >
                        <PlusCircle className="w-4 h-4" />
                        <span>Registrar Cédula</span>
                      </button>
                      <button
                        onClick={() => setNotFoundCedula(null)}
                        className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                      >
                        Cerrar
                      </button>
                    </div>
                  </div>
                )}

                {/* Success Feedback Alert */}
                {saveSuccess && (
                  <div className="mt-4 p-3.5 bg-emerald-600/90 border border-emerald-400 text-white rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2.5 shadow-xl animate-fadeIn font-mono">
                    <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
                    <span>{saveSuccess}</span>
                  </div>
                )}

                {/* Error Message Alert */}
                {errorMessage && (
                  <div className="mt-4 p-3 bg-rose-600/90 border border-rose-400 text-white rounded-2xl text-xs font-bold font-mono">
                    {errorMessage}
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM BRANDING SECTION */}
        <div className="w-full flex flex-col items-center gap-3 text-xs text-slate-200 pt-4 pb-2">
          
          {/* Main Footer Row: Campaign Logo / Slogan Image */}
          <div className="w-full flex items-center justify-center sm:justify-end">
            {campaign.footerLogoUrl ? (
              <img
                src={campaign.footerLogoUrl}
                alt={campaign.campaignSlogan}
                referrerPolicy="no-referrer"
                className="max-h-24 sm:max-h-32 md:max-h-36 w-auto object-contain drop-shadow-2xl transition-all"
              />
            ) : (
              <div className="bg-emerald-950/80 border-2 border-amber-400/80 px-6 py-2.5 rounded-2xl shadow-xl backdrop-blur-md flex flex-col items-center">
                <span className="text-xs uppercase tracking-widest text-emerald-300 font-extrabold">
                  CAMBYRETÁ
                </span>
                <span className="text-base sm:text-lg font-black text-amber-300 font-sans tracking-tight">
                  {campaign.campaignSlogan}
                </span>
              </div>
            )}
          </div>

          {/* Bottom Line: 2026 padrón electoral desarrollado por @blackhatone */}
          <div className="w-full flex flex-col items-center justify-center gap-2 pt-2 border-t border-white/10 font-sans">
            <p className="text-slate-300 text-xs sm:text-sm font-medium tracking-wide text-center drop-shadow">
              2026 padrón electoral desarrollado por @blackhatone
            </p>

            {/* Admin Gear Button directly below */}
            <button
              onClick={onOpenAdmin}
              className="opacity-40 hover:opacity-100 transition-all p-2 rounded-full hover:bg-slate-900/60 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer mt-0.5 hover:rotate-90 duration-300"
              title="Panel de Administración"
              aria-label="Panel de Administración"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>

      {/* Elector Detail Modal with LibreOffice Data & Real-time Voting Status */}
      <ElectorDetailModal
        elector={selectedElector}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        campaign={campaign}
        onNewSearch={handleResetSearch}
        isVoted={isCurrentElectorVoted}
        horaVoto={currentElectorHoraVoto}
        puestoControl={currentVoteRecord?.puestoControl}
        currentOperatorPuesto={operatorPuesto}
        onToggleVote={(status) => {
          if (selectedElector) {
            onTogglePasoPorMesa(selectedElector, status, operatorPuesto);
          }
        }}
      />

      {/* Live Polling Station Monitor Modal (Día D - Sincronizado en Tiempo Real) */}
      <LiveVotantesMonitorModal
        isOpen={isLiveMonitorOpen}
        onClose={() => setIsLiveMonitorOpen(false)}
        campaign={campaign}
        electors={electors}
        collectedCedulas={collectedCedulas}
        onTogglePasoPorMesa={onTogglePasoPorMesa}
        operatorPuesto={operatorPuesto}
        onOpenPuestoModal={() => setIsOperatorModalOpen(true)}
      />

      {/* Operator PC Selection Modal */}
      <OperatorPuestoModal
        isOpen={isOperatorModalOpen}
        onClose={() => setIsOperatorModalOpen(false)}
        currentPuesto={operatorPuesto}
        onSavePuesto={setOperatorPuesto}
      />

    </div>
  );
};
