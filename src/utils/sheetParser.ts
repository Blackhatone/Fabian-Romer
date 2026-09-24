import * as XLSX from 'xlsx';
import { ElectorRecord } from '../types';

export function normalizeCedula(val: any): string {
  if (val === null || val === undefined) return '';
  return String(val)
    .trim()
    .replace(/[.\s,]/g, '');
}

export function formatCedulaDisplay(val: string | number): string {
  if (!val) return '';
  const str = String(val).replace(/\D/g, '');
  if (!str) return String(val);
  return str.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

interface ColumnMap {
  cedulaKey: string | null;
  nombreKey: string | null;
  barrioKey: string | null;
  localKey: string | null;
  mesaKey: string | null;
  ordenKey: string | null;
  responsableKey: string | null;
}

function cleanHeader(header: string): string {
  return header
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function identifyColumns(headers: string[]): ColumnMap {
  const map: ColumnMap = {
    cedulaKey: null,
    nombreKey: null,
    barrioKey: null,
    localKey: null,
    mesaKey: null,
    ordenKey: null,
    responsableKey: null,
  };

  headers.forEach((original) => {
    const clean = cleanHeader(original);

    // C.I.N° / Cédula / Documento
    if (!map.cedulaKey && (clean.includes('cin') || clean.includes('ci') || clean.includes('cedula') || clean.includes('documento') || clean === 'ci' || clean === 'nro')) {
      map.cedulaKey = original;
    }
    // Nombre y Apellido
    else if (!map.nombreKey && (clean.includes('nombre') || clean.includes('apellido') || clean.includes('elector') || clean.includes('votante') || clean.includes('ciudadano'))) {
      map.nombreKey = original;
    }
    // Barrio
    else if (!map.barrioKey && (clean.includes('barrio') || clean.includes('zona') || clean.includes('sector') || clean.includes('fraccion'))) {
      map.barrioKey = original;
    }
    // Local de Votación
    else if (!map.localKey && (clean.includes('local') || clean.includes('votacion') || clean.includes('escuela') || clean.includes('colegio') || clean.includes('sede'))) {
      map.localKey = original;
    }
    // Mesa
    else if (!map.mesaKey && clean.includes('mesa')) {
      map.mesaKey = original;
    }
    // Orden
    else if (!map.ordenKey && (clean.includes('orden') || clean.includes('ord'))) {
      map.ordenKey = original;
    }
    // Responsable
    else if (!map.responsableKey && (clean.includes('responsable') || clean.includes('encargado') || clean.includes('lider') || clean.includes('operador') || clean.includes('coordinador'))) {
      map.responsableKey = original;
    }
  });

  return map;
}

export function parseSpreadsheetBuffer(buffer: ArrayBuffer | Uint8Array): {
  electors: ElectorRecord[];
  totalParsed: number;
  error?: string;
} {
  try {
    const workbook = XLSX.read(buffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      return { electors: [], totalParsed: 0, error: 'El archivo no contiene hojas de cálculo.' };
    }

    const worksheet = workbook.Sheets[firstSheetName];
    const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

    if (!rawRows || rawRows.length === 0) {
      return { electors: [], totalParsed: 0, error: 'La hoja de cálculo está vacía.' };
    }

    // Find header row (usually row 0)
    let headerRowIndex = 0;
    let headers: string[] = [];

    for (let i = 0; i < Math.min(rawRows.length, 5); i++) {
      const row = rawRows[i];
      if (Array.isArray(row)) {
        const textRow = row.map((cell) => String(cell || '').trim());
        const hasCI = textRow.some((c) => {
          const cl = cleanHeader(c);
          return cl.includes('cin') || cl.includes('ci') || cl.includes('cedula');
        });
        if (hasCI) {
          headerRowIndex = i;
          headers = textRow;
          break;
        }
      }
    }

    if (headers.length === 0) {
      headers = (rawRows[0] || []).map((c: any) => String(c || '').trim());
    }

    const colMap = identifyColumns(headers);

    // Fallback if no matching headers found: assign by index based on user's exact image layout:
    // [0]: C.I.N°, [1]: Nombre y Apellido, [2]: Barrio, [3]: Local de Votación, [4]: Mesa, [5]: Orden, [6]: Responsable
    const dataRows = rawRows.slice(headerRowIndex + 1);
    const electors: ElectorRecord[] = [];

    dataRows.forEach((row, idx) => {
      if (!Array.isArray(row)) return;

      let cedula = '';
      let nombreApellido = '';
      let barrio = '';
      let localVotacion = '';
      let mesa: string | number = '';
      let orden: string | number = '';
      let responsable = '';

      if (colMap.cedulaKey) {
        const cIdx = headers.indexOf(colMap.cedulaKey);
        cedula = normalizeCedula(row[cIdx]);
      } else {
        cedula = normalizeCedula(row[0]);
      }

      if (!cedula) return; // Skip empty rows

      if (colMap.nombreKey) {
        const nIdx = headers.indexOf(colMap.nombreKey);
        nombreApellido = String(row[nIdx] || '').trim();
      } else {
        nombreApellido = String(row[1] || '').trim();
      }

      if (colMap.barrioKey) {
        const bIdx = headers.indexOf(colMap.barrioKey);
        barrio = String(row[bIdx] || '').trim();
      } else {
        barrio = String(row[2] || '').trim();
      }

      if (colMap.localKey) {
        const lIdx = headers.indexOf(colMap.localKey);
        localVotacion = String(row[lIdx] || '').trim();
      } else {
        localVotacion = String(row[3] || '').trim();
      }

      if (colMap.mesaKey) {
        const mIdx = headers.indexOf(colMap.mesaKey);
        mesa = String(row[mIdx] || '').trim();
      } else {
        mesa = String(row[4] || '').trim();
      }

      if (colMap.ordenKey) {
        const oIdx = headers.indexOf(colMap.ordenKey);
        orden = String(row[oIdx] || '').trim();
      } else {
        orden = String(row[5] || '').trim();
      }

      if (colMap.responsableKey) {
        const rIdx = headers.indexOf(colMap.responsableKey);
        responsable = String(row[rIdx] || '').trim();
      } else {
        responsable = String(row[6] || '').trim();
      }

      electors.push({
        id: `elec-import-${Date.now()}-${idx}`,
        cedula,
        nombreApellido: nombreApellido || 'Sin Nombre',
        barrio: barrio || 'No especificado',
        localVotacion: localVotacion || 'No especificado',
        mesa: mesa || '-',
        orden: orden || '-',
        responsable: responsable || '',
      });
    });

    return { electors, totalParsed: electors.length };
  } catch (err: any) {
    return { electors: [], totalParsed: 0, error: err.message || 'Error al procesar el archivo.' };
  }
}

export function parsePastedLibreOfficeText(text: string): {
  electors: ElectorRecord[];
  totalParsed: number;
  error?: string;
} {
  try {
    const trimmed = text.trim();
    if (!trimmed) {
      return { electors: [], totalParsed: 0, error: 'El texto ingresado está vacío.' };
    }

    const lines = trimmed.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) {
      return { electors: [], totalParsed: 0, error: 'No se detectaron filas válidas.' };
    }

    // Detect delimiter in first row (tab, semicolon, or comma)
    const firstLine = lines[0];
    let delimiter = '\t';
    if (firstLine.includes('\t')) {
      delimiter = '\t';
    } else if (firstLine.includes(';')) {
      delimiter = ';';
    } else if (firstLine.includes(',')) {
      delimiter = ',';
    }

    const firstCells = firstLine.split(delimiter).map((c) => c.trim().replace(/^["']|["']$/g, ''));
    const isFirstRowHeader = firstCells.some((c) => {
      const cl = cleanHeader(c);
      return cl.includes('cin') || cl.includes('ci') || cl.includes('cedula') || cl.includes('nombre') || cl.includes('barrio');
    });

    let headers: string[] = [];
    let startIdx = 0;

    if (isFirstRowHeader) {
      headers = firstCells;
      startIdx = 1;
    } else {
      // Default exact headers from user image
      headers = ['C.I.N°', 'Nombre y Apellido', 'Barrio', 'Local de Votación', 'Mesa', 'Orden', 'Responsable'];
      startIdx = 0;
    }

    const colMap = identifyColumns(headers);
    const electors: ElectorRecord[] = [];

    for (let i = startIdx; i < lines.length; i++) {
      const cells = lines[i].split(delimiter).map((c) => c.trim().replace(/^["']|["']$/g, ''));
      if (cells.length === 0 || !cells[0]) continue;

      let cedula = '';
      let nombreApellido = '';
      let barrio = '';
      let localVotacion = '';
      let mesa: string | number = '';
      let orden: string | number = '';
      let responsable = '';

      if (colMap.cedulaKey && headers.includes(colMap.cedulaKey)) {
        const cIdx = headers.indexOf(colMap.cedulaKey);
        cedula = normalizeCedula(cells[cIdx]);
      } else {
        cedula = normalizeCedula(cells[0]);
      }

      if (!cedula) continue;

      if (colMap.nombreKey && headers.includes(colMap.nombreKey)) {
        const nIdx = headers.indexOf(colMap.nombreKey);
        nombreApellido = cells[nIdx] || '';
      } else {
        nombreApellido = cells[1] || '';
      }

      if (colMap.barrioKey && headers.includes(colMap.barrioKey)) {
        const bIdx = headers.indexOf(colMap.barrioKey);
        barrio = cells[bIdx] || '';
      } else {
        barrio = cells[2] || '';
      }

      if (colMap.localKey && headers.includes(colMap.localKey)) {
        const lIdx = headers.indexOf(colMap.localKey);
        localVotacion = cells[lIdx] || '';
      } else {
        localVotacion = cells[3] || '';
      }

      if (colMap.mesaKey && headers.includes(colMap.mesaKey)) {
        const mIdx = headers.indexOf(colMap.mesaKey);
        mesa = cells[mIdx] || '';
      } else {
        mesa = cells[4] || '';
      }

      if (colMap.ordenKey && headers.includes(colMap.ordenKey)) {
        const oIdx = headers.indexOf(colMap.ordenKey);
        orden = cells[oIdx] || '';
      } else {
        orden = cells[5] || '';
      }

      if (colMap.responsableKey && headers.includes(colMap.responsableKey)) {
        const rIdx = headers.indexOf(colMap.responsableKey);
        responsable = cells[rIdx] || '';
      } else {
        responsable = cells[6] || '';
      }

      electors.push({
        id: `elec-paste-${Date.now()}-${i}`,
        cedula,
        nombreApellido: nombreApellido || 'Sin Nombre',
        barrio: barrio || 'No especificado',
        localVotacion: localVotacion || 'No especificado',
        mesa: mesa || '-',
        orden: orden || '-',
        responsable: responsable || '',
      });
    }

    return { electors, totalParsed: electors.length };
  } catch (err: any) {
    return { electors: [], totalParsed: 0, error: err.message || 'Error al procesar el texto.' };
  }
}

export function generateTemplateCSV(): string {
  const headers = ['C.I.N°', 'Nombre y Apellido', 'Barrio', 'Local de Votación', 'Mesa', 'Orden', 'Responsable'];
  const sample1 = ['1234567', 'Carlos Ramón Benítez González', 'Centro', 'Colegio Nacional Cambyretá', '4', '118', 'Pedro Sanabria'];
  const sample2 = ['3456789', 'María Elena Giménez de Maidana', 'San Francisco', 'Escuela Básica N° 512 San Francisco', '2', '45', 'Lic. Gladys Duarte'];
  const sample3 = ['4567890', 'Jorge Aníbal Rojas Silvero', 'Arroyo Porá', 'Liceo Técnico Arroyo Porá', '8', '202', 'Marcos Benítez'];

  const rows = [headers, sample1, sample2, sample3];
  return rows.map((r) => r.join('\t')).join('\n');
}
