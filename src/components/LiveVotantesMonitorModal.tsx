import React, { useState } from 'react';
import {
  X,
  Vote,
  Users,
  Search,
  CheckCircle2,
  Clock,
  Download,
  Filter,
  Check,
  Building,
  MapPin,
  TrendingUp,
  UserCheck
} from 'lucide-react';
import { CollectedCedula, ElectorRecord, CampaignConfig } from '../types';
import { formatCedulaDisplay, normalizeCedula } from '../utils/sheetParser';
import * as XLSX from 'xlsx';

interface LiveVotantesMonitorModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: CampaignConfig;
  electors: ElectorRecord[];
  collectedCedulas: CollectedCedula[];
  onTogglePasoPorMesa: (record: CollectedCedula | ElectorRecord, status: boolean) => void;
}

export const LiveVotantesMonitorModal: React.FC<LiveVotantesMonitorModalProps> = ({
  isOpen,
  onClose,
  campaign,
  electors,
  collectedCedulas,
  onTogglePasoPorMesa,
}) => {
  const [filterType, setFilterType] = useState<'voted' | 'pending' | 'all'>('voted');
  const [selectedMesa, setSelectedMesa] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  // Create a map of cleanCedula -> CollectedCedula
  const votedMap = new Map<string, CollectedCedula>();
  collectedCedulas.forEach((c) => {
    if (c.pasoPorMesa) {
      votedMap.set(normalizeCedula(c.cedula), c);
    }
  });

  // Calculate stats
  const totalElectors = electors.length;
  const totalVoted = votedMap.size;
  const totalPending = Math.max(0, totalElectors - totalVoted);
  const participationRate = totalElectors > 0 ? ((totalVoted / totalElectors) * 100).toFixed(1) : '0';

  // Get distinct mesas
  const mesasSet = new Set<string>();
  electors.forEach((e) => {
    if (e.mesa) mesasSet.add(String(e.mesa));
  });
  const mesas = Array.from(mesasSet).sort((a, b) => Number(a) - Number(b));

  // Build combined electors view
  const combinedList = electors.map((elector) => {
    const cleanCed = normalizeCedula(elector.cedula);
    const voteRecord = votedMap.get(cleanCed);
    const hasVoted = Boolean(voteRecord);
    return {
      elector,
      voteRecord,
      hasVoted,
      horaVoto: voteRecord?.horaVoto,
      registradoPor: voteRecord?.registradoPor,
    };
  });

  // Apply filters
  const filteredList = combinedList.filter((item) => {
    // Filter by vote status
    if (filterType === 'voted' && !item.hasVoted) return false;
    if (filterType === 'pending' && item.hasVoted) return false;

    // Filter by Mesa
    if (selectedMesa !== 'all' && String(item.elector.mesa) !== selectedMesa) {
      return false;
    }

    // Filter by search query
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchName = item.elector.nombreApellido.toLowerCase().includes(q);
      const matchCed = item.elector.cedula.includes(q);
      const matchBarrio = item.elector.barrio.toLowerCase().includes(q);
      const matchLocal = item.elector.localVotacion.toLowerCase().includes(q);
      const matchResp = item.elector.responsable?.toLowerCase().includes(q);
      return matchName || matchCed || matchBarrio || matchLocal || matchResp;
    }

    return true;
  });

  // Export filtered voters to Excel
  const handleExportExcel = () => {
    const wsData = [
      ['N°', 'C.I. N°', 'Nombre y Apellido', 'Mesa', 'Orden', 'Estado', 'Hora de Voto', 'Local de Votación', 'Barrio', 'Responsable'],
      ...filteredList.map((item, idx) => [
        idx + 1,
        item.elector.cedula,
        item.elector.nombreApellido,
        item.elector.mesa,
        item.elector.orden,
        item.hasVoted ? 'YA VOTÓ (PASÓ POR MESA)' : 'PENDIENTE DE VOTAR',
        item.horaVoto || '—',
        item.elector.localVotacion,
        item.elector.barrio,
        item.elector.responsable || '—',
      ]),
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = [
      { wch: 6 },
      { wch: 14 },
      { wch: 32 },
      { wch: 8 },
      { wch: 8 },
      { wch: 22 },
      { wch: 14 },
      { wch: 30 },
      { wch: 20 },
      { wch: 20 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'Control_Votantes_DiaD');
    XLSX.writeFile(wb, `Control_Votantes_Mesa_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-5xl bg-slate-900 border-2 border-emerald-500/60 rounded-3xl shadow-2xl overflow-hidden text-white flex flex-col max-h-[92vh]">
        
        {/* Top Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 p-4 border-b border-emerald-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <Vote className="w-6 h-6 animate-pulse" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">
                  Monitor Día D: Votantes que Pasaron por Mesa
                </h3>
                <span className="flex items-center gap-1 text-[11px] bg-emerald-950 text-emerald-400 border border-emerald-700 px-2 py-0.5 rounded-full font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  NUBE EN TIEMPO REAL
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Control de votación sincronizado al segundo entre todos los delegados, veedores y el equipo central
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Real-time KPI Stats Bar */}
        <div className="bg-slate-950 p-3 sm:px-6 border-b border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3">
          
          <div className="bg-slate-900/90 border border-emerald-500/40 rounded-2xl p-3 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold block">
                YA VOTARON
              </span>
              <span className="text-2xl font-black text-white font-mono">
                {totalVoted}
              </span>
            </div>
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-900/90 border border-amber-500/40 rounded-2xl p-3 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase text-amber-400 font-bold block">
                FALTAN POR VOTAR
              </span>
              <span className="text-2xl font-black text-amber-300 font-mono">
                {totalPending}
              </span>
            </div>
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-900/90 border border-purple-500/40 rounded-2xl p-3 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase text-purple-400 font-bold block">
                PARTICIPACIÓN
              </span>
              <span className="text-2xl font-black text-purple-300 font-mono">
                {participationRate}%
              </span>
            </div>
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-700 rounded-2xl p-3 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
                PADRÓN TOTAL
              </span>
              <span className="text-2xl font-black text-slate-200 font-mono">
                {totalElectors}
              </span>
            </div>
            <div className="p-2 rounded-xl bg-slate-800 text-slate-300">
              <Users className="w-5 h-5" />
            </div>
          </div>

        </div>

        {/* Filter Toolbar */}
        <div className="bg-slate-950/70 p-3 sm:px-6 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          
          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-mono">
            <button
              onClick={() => setFilterType('voted')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                filterType === 'voted'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Ya Votaron ({totalVoted})</span>
            </button>
            <button
              onClick={() => setFilterType('pending')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                filterType === 'pending'
                  ? 'bg-amber-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Faltan Votar ({totalPending})</span>
            </button>
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                filterType === 'all'
                  ? 'bg-slate-700 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Todos ({totalElectors})</span>
            </button>
          </div>

          {/* Mesa Dropdown & Search & Export */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Mesa Filter */}
            <select
              value={selectedMesa}
              onChange={(e) => setSelectedMesa(e.target.value)}
              className="bg-slate-900 text-white border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-mono focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">Todas las Mesas</option>
              {mesas.map((m) => (
                <option key={m} value={m}>Mesa {m}</option>
              ))}
            </select>

            {/* Search Input */}
            <div className="relative min-w-[180px] sm:min-w-[220px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Buscar votante o cédula..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900 text-white border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs font-sans focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Export Excel Button */}
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-mono font-bold cursor-pointer transition-colors"
              title="Descargar lista filtrada en Excel"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Excel</span>
            </button>

          </div>

        </div>

        {/* Scrollable Voters Table */}
        <div className="p-3 sm:p-5 overflow-y-auto flex-1 font-sans text-xs">
          {filteredList.length === 0 ? (
            <div className="p-12 text-center text-slate-500 space-y-2 font-mono">
              <Vote className="w-8 h-8 mx-auto text-slate-600" />
              <p className="font-bold">No hay votantes que coincidan con el filtro.</p>
              <p className="text-[11px] text-slate-600">
                {filterType === 'voted'
                  ? 'A medida que los electores voten y se marquen en las mesas, aparecerán aquí en vivo.'
                  : 'Todos los votantes de esta mesa ya pasaron a votar.'}
              </p>
            </div>
          ) : (
            <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950 shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-900 text-slate-400 text-[11px] font-mono border-b border-slate-800 uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3 text-center">Estado</th>
                      <th className="py-2.5 px-3">C.I. N°</th>
                      <th className="py-2.5 px-3">Nombre y Apellido</th>
                      <th className="py-2.5 px-3 text-center">Mesa</th>
                      <th className="py-2.5 px-3 text-center">Orden</th>
                      <th className="py-2.5 px-3">Local de Votación</th>
                      <th className="py-2.5 px-3">Barrio</th>
                      <th className="py-2.5 px-3">Responsable</th>
                      <th className="py-2.5 px-3 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                    {filteredList.map((item) => (
                      <tr
                        key={item.elector.cedula}
                        className={`hover:bg-slate-900/60 transition-colors ${
                          item.hasVoted ? 'bg-emerald-950/20' : ''
                        }`}
                      >
                        {/* Estado Badge */}
                        <td className="py-2.5 px-3 text-center">
                          {item.hasVoted ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40 text-[11px]">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              <span>VOTÓ {item.horaVoto ? `(${item.horaVoto})` : ''}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 border border-amber-500/30 text-[10px]">
                              <Clock className="w-3 h-3 text-amber-400" />
                              <span>PENDIENTE</span>
                            </span>
                          )}
                        </td>

                        {/* Cedula */}
                        <td className="py-2.5 px-3 font-bold text-white">
                          <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                            {formatCedulaDisplay(item.elector.cedula)}
                          </span>
                        </td>

                        {/* Nombre */}
                        <td className="py-2.5 px-3 font-sans font-bold text-white">
                          {item.elector.nombreApellido}
                        </td>

                        {/* Mesa */}
                        <td className="py-2.5 px-3 text-center">
                          <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-bold border border-emerald-800">
                            {item.elector.mesa}
                          </span>
                        </td>

                        {/* Orden */}
                        <td className="py-2.5 px-3 text-center font-bold text-amber-300">
                          {item.elector.orden}
                        </td>

                        {/* Local */}
                        <td className="py-2.5 px-3 font-sans text-slate-300 text-[11px]">
                          {item.elector.localVotacion}
                        </td>

                        {/* Barrio */}
                        <td className="py-2.5 px-3 font-sans text-slate-400 text-[11px]">
                          {item.elector.barrio}
                        </td>

                        {/* Responsable */}
                        <td className="py-2.5 px-3 font-sans text-purple-300 text-[11px]">
                          {item.elector.responsable || '—'}
                        </td>

                        {/* Toggle Action Button */}
                        <td className="py-2.5 px-3 text-center">
                          {item.hasVoted ? (
                            <button
                              onClick={() => onTogglePasoPorMesa(item.voteRecord || item.elector, false)}
                              className="text-[10px] px-2 py-1 rounded bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-700 transition-colors cursor-pointer"
                              title="Desmarcar voto si fue error"
                            >
                              Desmarcar
                            </button>
                          ) : (
                            <button
                              onClick={() => onTogglePasoPorMesa(item.elector, true)}
                              className="text-[11px] px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md cursor-pointer transition-colors flex items-center gap-1 mx-auto"
                              title="Marcar que ya votó"
                            >
                              <Check className="w-3 h-3" />
                              <span>Marcar Voto</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Bar */}
        <div className="p-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span className="font-sans flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Los cambios se transmiten de forma instantánea a los teléfonos de todos los veedores y encargados de mesa.</span>
          </span>

          <button
            onClick={onClose}
            className="px-5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold cursor-pointer transition-colors"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
