import React, { useState } from 'react';
import {
  X,
  FileSpreadsheet,
  Download,
  Copy,
  Check,
  FileText,
  Code,
  Table as TableIcon,
  Info
} from 'lucide-react';
import { CollectedCedula } from '../types';
import { formatCedulaDisplay } from '../utils/sheetParser';
import * as XLSX from 'xlsx';

interface CedulasFileViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  collectedCedulas: CollectedCedula[];
}

export const CedulasFileViewerModal: React.FC<CedulasFileViewerModalProps> = ({
  isOpen,
  onClose,
  collectedCedulas,
}) => {
  const [viewFormat, setViewFormat] = useState<'table' | 'csv' | 'json'>('table');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Generate CSV text
  const generateCSVText = () => {
    const headers = [
      'N°',
      'C.I.N°',
      'Nombre y Apellido',
      'Estado Mesa',
      'Hora Voto',
      'Barrio',
      'Local de Votacion',
      'Mesa',
      'Orden',
      'Responsable',
      'Telefono',
      'Fecha Registro',
    ];

    const rows = collectedCedulas.map((c, i) => [
      i + 1,
      c.cedula,
      c.nombre || 'No registrado',
      c.pasoPorMesa ? 'YA VOTO (PASO POR MESA)' : 'PENDIENTE',
      c.horaVoto || '—',
      c.barrio || '—',
      c.localVotacion || '—',
      c.mesa || '—',
      c.orden || '—',
      c.responsable || '—',
      c.telefono || '—',
      new Date(c.createdAt).toLocaleString('es-PY'),
    ]);

    const lines = [
      headers.join(';'),
      ...rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(';')),
    ];

    return lines.join('\r\n');
  };

  const csvText = generateCSVText();
  const jsonText = JSON.stringify(collectedCedulas, null, 2);

  // Download Excel (.xlsx)
  const handleDownloadExcel = () => {
    if (collectedCedulas.length === 0) return;

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
  };

  // Download CSV (.csv with UTF-8 BOM for LibreOffice/Excel)
  const handleDownloadCSV = () => {
    if (collectedCedulas.length === 0) return;
    const blob = new Blob(['\uFEFF' + csvText], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Cedulas_Recopiladas_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyContent = () => {
    const content = viewFormat === 'json' ? jsonText : csvText;
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-slate-900 border-2 border-slate-700 rounded-3xl shadow-2xl overflow-hidden text-white flex flex-col max-h-[90vh]">
        
        {/* Top Header */}
        <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-red-600/20 text-red-400">
              <FileSpreadsheet className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>Archivo de Cédulas Recopiladas</span>
                <span className="text-xs font-mono bg-red-950 text-red-400 px-2 py-0.5 rounded-full border border-red-800">
                  {collectedCedulas.length} registros
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Visualiza el contenido del archivo o descárgalo para abrirlo en LibreOffice Calc o Excel
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

        {/* View Mode Selector & Download Actions Bar */}
        <div className="bg-slate-950/60 p-3 sm:px-6 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          
          {/* Format Tabs */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setViewFormat('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                viewFormat === 'table'
                  ? 'bg-red-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Hoja / Tabla</span>
            </button>
            <button
              onClick={() => setViewFormat('csv')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                viewFormat === 'csv'
                  ? 'bg-red-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Archivo CSV (Texto)</span>
            </button>
            <button
              onClick={() => setViewFormat('json')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                viewFormat === 'json'
                  ? 'bg-red-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>JSON Backup</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {viewFormat !== 'table' && (
              <button
                onClick={handleCopyContent}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? '¡Copiado!' : 'Copiar Texto'}</span>
              </button>
            )}

            <button
              onClick={handleDownloadCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
              title="Descargar archivo CSV compatible con LibreOffice"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Descargar .CSV</span>
            </button>

            <button
              onClick={handleDownloadExcel}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
              title="Descargar archivo Excel (.xlsx)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar Excel (.xlsx)</span>
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 font-mono text-xs">
          
          {collectedCedulas.length === 0 ? (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <Info className="w-8 h-8 mx-auto text-slate-600" />
              <p className="font-bold">Aún no hay cédulas en el archivo.</p>
              <p className="text-[11px] text-slate-600">
                A medida que se consulten cédulas en la pantalla principal, se irán acumulando aquí automáticamente.
              </p>
            </div>
          ) : viewFormat === 'table' ? (
            <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950">
              <div className="overflow-x-auto">
                <table className="w-full text-left font-sans text-xs">
                  <thead className="bg-slate-900 text-slate-400 text-[11px] font-mono border-b border-slate-800 uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3 text-center">Estado Mesa</th>
                      <th className="py-2.5 px-3">C.I. N°</th>
                      <th className="py-2.5 px-3">Nombre y Apellido</th>
                      <th className="py-2.5 px-3 text-center">Mesa</th>
                      <th className="py-2.5 px-3 text-center">Orden</th>
                      <th className="py-2.5 px-3">Local de Votación</th>
                      <th className="py-2.5 px-3">Barrio</th>
                      <th className="py-2.5 px-3">Responsable</th>
                      <th className="py-2.5 px-3">Fecha Registro</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {collectedCedulas.map((c, idx) => (
                      <tr key={c.id} className={`hover:bg-slate-900/50 ${c.pasoPorMesa ? 'bg-emerald-950/20' : ''}`}>
                        <td className="py-2.5 px-3 text-slate-500">{idx + 1}</td>
                        <td className="py-2.5 px-3 text-center">
                          {c.pasoPorMesa ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40 text-[10px]">
                              <span>VOTÓ {c.horaVoto ? `(${c.horaVoto})` : ''}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px]">
                              <span>PENDIENTE</span>
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-amber-300">
                          {formatCedulaDisplay(c.cedula)}
                        </td>
                        <td className="py-2.5 px-3 font-sans text-white font-semibold">
                          {c.nombre || '—'}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {c.mesa ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                              {c.mesa}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {c.orden ? (
                            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                              {c.orden}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-sans text-slate-300">
                          {c.localVotacion || '—'}
                        </td>
                        <td className="py-2.5 px-3 font-sans text-slate-400">
                          {c.barrio || '—'}
                        </td>
                        <td className="py-2.5 px-3 font-sans text-purple-300 text-[11px]">
                          {c.responsable || '—'}
                        </td>
                        <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                          {new Date(c.createdAt).toLocaleString('es-PY')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : viewFormat === 'csv' ? (
            <div className="relative">
              <pre className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-slate-300 overflow-x-auto whitespace-pre font-mono text-xs leading-relaxed">
                {csvText}
              </pre>
            </div>
          ) : (
            <div className="relative">
              <pre className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-emerald-400 overflow-x-auto whitespace-pre font-mono text-xs leading-relaxed">
                {jsonText}
              </pre>
            </div>
          )}

        </div>

        {/* Bottom Bar Info */}
        <div className="p-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5 font-sans">
            <Info className="w-4 h-4 text-emerald-400" />
            <span>Los archivos se descargan listos para abrirse en <strong>LibreOffice Calc</strong> o <strong>Microsoft Excel</strong> sin errores de formato.</span>
          </span>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold cursor-pointer transition-colors"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
