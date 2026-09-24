import React, { useState, useRef } from 'react';
import {
  FileSpreadsheet,
  Upload,
  ClipboardPaste,
  Download,
  Trash2,
  Search,
  Plus,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Vote,
  School,
  MapPin,
  RefreshCw,
  FileDown
} from 'lucide-react';
import { ElectorRecord } from '../types';
import {
  parseSpreadsheetBuffer,
  parsePastedLibreOfficeText,
  generateTemplateCSV,
  formatCedulaDisplay,
  normalizeCedula
} from '../utils/sheetParser';
import { saveElectorsToCloud } from '../services/firebase';
import * as XLSX from 'xlsx';

interface AdminPadronTabProps {
  electors: ElectorRecord[];
  onSetElectors: React.Dispatch<React.SetStateAction<ElectorRecord[]>>;
  onAddElector: (elector: ElectorRecord) => void;
  onUpdateElector: (elector: ElectorRecord) => void;
  onDeleteElector: (id: string) => void;
  onClearElectors: () => void;
  onRestoreSampleElectors: () => void;
}

export const AdminPadronTab: React.FC<AdminPadronTabProps> = ({
  electors,
  onSetElectors,
  onAddElector,
  onUpdateElector,
  onDeleteElector,
  onClearElectors,
  onRestoreSampleElectors,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [pasteText, setPasteText] = useState('');
  const [showPasteBox, setShowPasteBox] = useState(false);
  const [importMode, setImportMode] = useState<'replace' | 'append'>('replace');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  // Single Elector Modal (Add / Edit)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingElector, setEditingElector] = useState<ElectorRecord | null>(null);

  // Form states for manual add/edit
  const [formCedula, setFormCedula] = useState('');
  const [formNombre, setFormNombre] = useState('');
  const [formBarrio, setFormBarrio] = useState('');
  const [formLocal, setFormLocal] = useState('');
  const [formMesa, setFormMesa] = useState('');
  const [formOrden, setFormOrden] = useState('');
  const [formResponsable, setFormResponsable] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Handle File Upload (.ods, .xlsx, .xls, .csv, .tsv)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      const result = parseSpreadsheetBuffer(buffer);

      if (result.error) {
        showToast('error', `Error al leer archivo: ${result.error}`);
        return;
      }

      if (result.electors.length === 0) {
        showToast('error', 'No se encontraron registros de votantes en el archivo.');
        return;
      }

      if (importMode === 'replace') {
        onSetElectors(result.electors);
        showToast('success', `¡Padrón importado con éxito! ${result.totalParsed} votantes cargados.`);
      } else {
        onSetElectors((prev) => [...prev, ...result.electors]);
        showToast('success', `¡Se agregaron ${result.totalParsed} votantes al padrón existente!`);
      }

      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      showToast('error', `Error al procesar: ${err.message}`);
    }
  };

  // Handle Pasted Text from LibreOffice Calc
  const handleImportPastedText = () => {
    if (!pasteText.trim()) {
      showToast('error', 'Por favor pega primero las celdas copiadas de LibreOffice.');
      return;
    }

    const result = parsePastedLibreOfficeText(pasteText);
    if (result.error) {
      showToast('error', result.error);
      return;
    }

    if (result.electors.length === 0) {
      showToast('error', 'No se detectaron registros válidos en el texto pegado.');
      return;
    }

    if (importMode === 'replace') {
      onSetElectors(result.electors);
      showToast('success', `¡Padrón importado! ${result.totalParsed} votantes cargados.`);
    } else {
      onSetElectors((prev) => [...prev, ...result.electors]);
      showToast('success', `¡Se agregaron ${result.totalParsed} votantes!`);
    }

    setPasteText('');
    setShowPasteBox(false);
  };

  // Download LibreOffice / Excel Template
  const handleDownloadTemplate = () => {
    const wsData = [
      ['C.I.N°', 'Nombre y Apellido', 'Barrio', 'Local de Votación', 'Mesa', 'Orden', 'Responsable'],
      ['1234567', 'Carlos Ramón Benítez González', 'Centro', 'Colegio Nacional Cambyretá', '4', '118', 'Pedro Sanabria'],
      ['3456789', 'María Elena Giménez de Maidana', 'San Francisco', 'Escuela Básica N° 512 San Francisco', '2', '45', 'Lic. Gladys Duarte'],
      ['4567890', 'Jorge Aníbal Rojas Silvero', 'Arroyo Porá', 'Liceo Técnico Arroyo Porá', '8', '202', 'Marcos Benítez'],
      ['2345678', 'Silvia Beatriz Acuña Martínez', 'San Rafael', 'Colegio Nacional San Rafael', '1', '12', 'Claudia Fernández'],
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, 'Padron_Cambyreta');
    XLSX.writeFile(wb, 'Plantilla_Padron_LibreOffice.xlsx');
    showToast('success', 'Plantilla descargada en formato Excel/LibreOffice.');
  };

  // Export current padron to Excel
  const handleExportExcel = () => {
    if (electors.length === 0) {
      showToast('error', 'No hay votantes cargados para exportar.');
      return;
    }

    const wsData = [
      ['C.I.N°', 'Nombre y Apellido', 'Barrio', 'Local de Votación', 'Mesa', 'Orden', 'Responsable'],
      ...electors.map((e) => [
        e.cedula,
        e.nombreApellido,
        e.barrio,
        e.localVotacion,
        e.mesa,
        e.orden,
        e.responsable || '',
      ]),
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, 'Padron_Electoral');
    XLSX.writeFile(wb, `Padron_Electoral_${new Date().toISOString().slice(0, 10)}.xlsx`);
    showToast('success', 'Padrón exportado con éxito.');
  };

  // Open modal to add or edit
  const handleOpenAdd = () => {
    setEditingElector(null);
    setFormCedula('');
    setFormNombre('');
    setFormBarrio('');
    setFormLocal('');
    setFormMesa('');
    setFormOrden('');
    setFormResponsable('');
    setIsEditModalOpen(true);
  };

  const handleOpenEdit = (el: ElectorRecord) => {
    setEditingElector(el);
    setFormCedula(el.cedula);
    setFormNombre(el.nombreApellido);
    setFormBarrio(el.barrio);
    setFormLocal(el.localVotacion);
    setFormMesa(String(el.mesa));
    setFormOrden(String(el.orden));
    setFormResponsable(el.responsable || '');
    setIsEditModalOpen(true);
  };

  const handleSaveElector = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCI = normalizeCedula(formCedula);
    if (!cleanCI || !formNombre.trim()) {
      showToast('error', 'Cédula y Nombre son obligatorios.');
      return;
    }

    if (editingElector) {
      onUpdateElector({
        ...editingElector,
        cedula: cleanCI,
        nombreApellido: formNombre.trim(),
        barrio: formBarrio.trim() || 'No especificado',
        localVotacion: formLocal.trim() || 'No especificado',
        mesa: formMesa.trim() || '-',
        orden: formOrden.trim() || '-',
        responsable: formResponsable.trim(),
      });
      showToast('success', 'Votante actualizado.');
    } else {
      onAddElector({
        id: `elec-man-${Date.now()}`,
        cedula: cleanCI,
        nombreApellido: formNombre.trim(),
        barrio: formBarrio.trim() || 'No especificado',
        localVotacion: formLocal.trim() || 'No especificado',
        mesa: formMesa.trim() || '-',
        orden: formOrden.trim() || '-',
        responsable: formResponsable.trim(),
      });
      showToast('success', 'Votante agregado al padrón.');
    }
    setIsEditModalOpen(false);
  };

  // Filtered electors
  const filteredElectors = electors.filter((e) => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    return (
      e.cedula.toLowerCase().includes(q) ||
      e.nombreApellido.toLowerCase().includes(q) ||
      e.barrio.toLowerCase().includes(q) ||
      e.localVotacion.toLowerCase().includes(q) ||
      (e.responsable && e.responsable.toLowerCase().includes(q))
    );
  });

  const totalPages = Math.ceil(filteredElectors.length / itemsPerPage) || 1;
  const currentItems = filteredElectors.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Quick stats
  const distinctLocales = new Set(electors.map((e) => e.localVotacion)).size;
  const distinctMesas = new Set(electors.map((e) => `${e.localVotacion}-${e.mesa}`)).size;

  return (
    <div className="space-y-6">
      
      {/* Toast Notification */}
      {notification && (
        <div
          className={`p-3.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2.5 shadow-xl animate-fadeIn ${
            notification.type === 'success'
              ? 'bg-emerald-600 text-white border border-emerald-400'
              : 'bg-rose-600 text-white border border-rose-400'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Top Banner & Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center">
          <span className="text-[11px] text-slate-400 font-mono block uppercase">Votantes en Padrón</span>
          <span className="text-2xl sm:text-3xl font-black text-amber-300 font-mono mt-1 block">
            {electors.length.toLocaleString()}
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center">
          <span className="text-[11px] text-slate-400 font-mono block uppercase">Locales de Votación</span>
          <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono mt-1 block">
            {distinctLocales}
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center">
          <span className="text-[11px] text-slate-400 font-mono block uppercase">Mesas Registradas</span>
          <span className="text-2xl sm:text-3xl font-black text-blue-400 font-mono mt-1 block">
            {distinctMesas}
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center">
          <span className="text-[11px] text-slate-400 font-mono block uppercase">Consultados / Filtro</span>
          <span className="text-2xl sm:text-3xl font-black text-purple-400 font-mono mt-1 block">
            {filteredElectors.length.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Import Section (LibreOffice Calc / Excel / CSV) */}
      <div className="bg-slate-900/90 border-2 border-emerald-500/40 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white">
                Importar Hoja de LibreOffice / Excel
              </h3>
              <p className="text-xs text-slate-400">
                Encabezados exactos: <span className="text-amber-300 font-mono font-bold">C.I.N° | Nombre y Apellido | Barrio | Local de Votación | Mesa | Orden | Responsable</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={async () => {
                setIsSyncingCloud(true);
                const res = await saveElectorsToCloud(electors);
                setIsSyncingCloud(false);
                if (res.success) {
                  showToast('success', `¡Padrón de ${res.totalSaved} electores guardado y sincronizado en la Nube de Firestore!`);
                } else {
                  showToast('error', `Error al sincronizar con la nube: ${res.error}`);
                }
              }}
              disabled={isSyncingCloud}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold border border-emerald-400/50 shadow-md transition-all cursor-pointer"
              title="Guardar y sincronizar padrón en Firebase Firestore para todos los dispositivos"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingCloud ? 'animate-spin' : ''}`} />
              <span>{isSyncingCloud ? 'Sincronizando...' : 'Sincronizar Nube'}</span>
            </button>

            <button
              onClick={handleDownloadTemplate}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
              title="Descargar plantilla de ejemplo"
            >
              <FileDown className="w-3.5 h-3.5 text-emerald-400" />
              <span>Descargar Plantilla</span>
            </button>

            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
              title="Exportar padrón a Excel"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>Exportar</span>
            </button>
          </div>
        </div>

        {/* Action Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          
          {/* File Upload Button */}
          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".ods,.xlsx,.xls,.csv,.tsv,.txt"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-full min-h-[50px] flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Subir Archivo LibreOffice (.ods / .xlsx / .csv)</span>
            </button>
          </div>

          {/* Paste Directly Button */}
          <div>
            <button
              onClick={() => setShowPasteBox(!showPasteBox)}
              className="w-full h-full min-h-[50px] flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-sm transition-all cursor-pointer"
            >
              <ClipboardPaste className="w-4 h-4 text-amber-400" />
              <span>{showPasteBox ? 'Ocultar Cuadro de Pegado' : 'Pegar Celdas de LibreOffice'}</span>
            </button>
          </div>

          {/* Mode Selector */}
          <div className="flex items-center justify-between sm:justify-end gap-2 bg-slate-950 px-3 py-2 rounded-2xl border border-slate-800">
            <span className="text-xs text-slate-400 font-mono">Modo:</span>
            <div className="flex rounded-xl bg-slate-900 p-0.5 border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setImportMode('replace')}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  importMode === 'replace'
                    ? 'bg-red-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Reemplazar
              </button>
              <button
                type="button"
                onClick={() => setImportMode('append')}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  importMode === 'append'
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sumar
              </button>
            </div>
          </div>

        </div>

        {/* Expandable Paste Box */}
        {showPasteBox && (
          <div className="pt-3 border-t border-slate-800 space-y-3 animate-fadeIn">
            <div className="text-xs text-slate-300">
              <p className="font-semibold text-emerald-400">
                Tip: En LibreOffice Calc selecciona las filas de tu hoja, presiona <kbd className="bg-slate-800 px-1 py-0.5 rounded border border-slate-700">Ctrl+C</kbd> y pega (<kbd className="bg-slate-800 px-1 py-0.5 rounded border border-slate-700">Ctrl+V</kbd>) en este recuadro:
              </p>
            </div>
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="Pega aquí los datos copiados desde LibreOffice Calc..."
              rows={4}
              className="w-full bg-slate-950 text-slate-200 placeholder-slate-500 font-mono text-xs p-3 rounded-2xl border border-slate-800 focus:outline-none focus:border-emerald-500"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPasteText('')}
                className="px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white bg-slate-800 cursor-pointer"
              >
                Limpiar
              </button>
              <button
                type="button"
                onClick={handleImportPastedText}
                className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Procesar e Importar</span>
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Table Actions & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Buscar por C.I., Nombre, Local..."
            className="w-full bg-slate-900 text-slate-100 text-xs sm:text-sm pl-10 pr-4 py-2.5 rounded-2xl border border-slate-800 focus:outline-none focus:border-amber-400"
          />
        </div>

        {/* Buttons: Add Single, Restore Sample, Clear */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nuevo Votante</span>
          </button>

          <button
            onClick={onRestoreSampleElectors}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
            title="Cargar votantes de ejemplo de Cambyretá"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ejemplos</span>
          </button>

          <button
            onClick={() => {
              if (window.confirm('¿Seguro que deseas vaciar todos los votantes del padrón?')) {
                onClearElectors();
                showToast('success', 'Se vació el padrón.');
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-900/60 hover:bg-rose-800 border border-rose-700/60 text-rose-200 text-xs font-semibold transition-colors cursor-pointer"
            title="Vaciar padrón"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Vaciar</span>
          </button>
        </div>
      </div>

      {/* Main Electors Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm font-sans">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[11px] font-mono border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">C.I. N°</th>
                <th className="py-3 px-4">Nombre y Apellido</th>
                <th className="py-3 px-4">Barrio</th>
                <th className="py-3 px-4">Local de Votación</th>
                <th className="py-3 px-4 text-center">Mesa</th>
                <th className="py-3 px-4 text-center">Orden</th>
                <th className="py-3 px-4">Responsable</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {currentItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 font-mono">
                    {searchTerm
                      ? 'No se encontraron votantes que coincidan con la búsqueda.'
                      : 'El padrón está vacío. Sube tu archivo de LibreOffice o pega las celdas arriba.'}
                  </td>
                </tr>
              ) : (
                currentItems.map((e) => (
                  <tr key={e.id || e.cedula} className="hover:bg-slate-800/40 transition-colors">
                    {/* C.I. */}
                    <td className="py-3 px-4 font-mono font-bold text-amber-300">
                      {formatCedulaDisplay(e.cedula)}
                    </td>
                    {/* Nombre y Apellido */}
                    <td className="py-3 px-4 font-bold text-white">
                      {e.nombreApellido}
                    </td>
                    {/* Barrio */}
                    <td className="py-3 px-4 text-slate-300">
                      {e.barrio}
                    </td>
                    {/* Local de Votación */}
                    <td className="py-3 px-4 text-slate-200">
                      {e.localVotacion}
                    </td>
                    {/* Mesa */}
                    <td className="py-3 px-4 text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 font-mono font-bold border border-emerald-500/40">
                        {e.mesa}
                      </span>
                    </td>
                    {/* Orden */}
                    <td className="py-3 px-4 text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 font-mono font-bold border border-amber-500/40">
                        {e.orden}
                      </span>
                    </td>
                    {/* Responsable */}
                    <td className="py-3 px-4 text-purple-300 text-xs">
                      {e.responsable || '-'}
                    </td>
                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(e)}
                          className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                          title="Editar"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (e.id) onDeleteElector(e.id);
                          }}
                          className="p-1 rounded-lg hover:bg-rose-900/40 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                          title="Eliminar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>
              Página {currentPage} de {totalPages} ({filteredElectors.length} votantes)
            </span>
            <div className="flex gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-white cursor-pointer"
              >
                Anterior
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-white cursor-pointer"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Manual Add / Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 border-2 border-emerald-500/60 rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-black text-white">
              {editingElector ? 'Editar Votante' : 'Nuevo Votante'}
            </h3>

            <form onSubmit={handleSaveElector} className="space-y-3 font-sans text-xs">
              <div>
                <label className="block text-slate-400 mb-1">C.I. N° *</label>
                <input
                  type="text"
                  value={formCedula}
                  onChange={(e) => setFormCedula(e.target.value)}
                  placeholder="Ej: 1234567"
                  className="w-full bg-slate-950 text-white p-2.5 rounded-xl border border-slate-800 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Nombre y Apellido *</label>
                <input
                  type="text"
                  value={formNombre}
                  onChange={(e) => setFormNombre(e.target.value)}
                  placeholder="Ej: Carlos Ramón Benítez"
                  className="w-full bg-slate-950 text-white p-2.5 rounded-xl border border-slate-800"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Barrio</label>
                  <input
                    type="text"
                    value={formBarrio}
                    onChange={(e) => setFormBarrio(e.target.value)}
                    placeholder="Ej: Centro"
                    className="w-full bg-slate-950 text-white p-2.5 rounded-xl border border-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Responsable</label>
                  <input
                    type="text"
                    value={formResponsable}
                    onChange={(e) => setFormResponsable(e.target.value)}
                    placeholder="Ej: Pedro Sanabria"
                    className="w-full bg-slate-950 text-white p-2.5 rounded-xl border border-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Local de Votación</label>
                <input
                  type="text"
                  value={formLocal}
                  onChange={(e) => setFormLocal(e.target.value)}
                  placeholder="Ej: Colegio Nacional Cambyretá"
                  className="w-full bg-slate-950 text-white p-2.5 rounded-xl border border-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Mesa</label>
                  <input
                    type="text"
                    value={formMesa}
                    onChange={(e) => setFormMesa(e.target.value)}
                    placeholder="Ej: 4"
                    className="w-full bg-slate-950 text-white p-2.5 rounded-xl border border-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Orden</label>
                  <input
                    type="text"
                    value={formOrden}
                    onChange={(e) => setFormOrden(e.target.value)}
                    placeholder="Ej: 118"
                    className="w-full bg-slate-950 text-white p-2.5 rounded-xl border border-slate-800 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
