/*  Excel export of what the grid shows: visible columns in order, visible (sorted /
    filtered) rows, row colours, cell colours and bold, frozen header + columns.
    exceljs is loaded on demand so it stays out of the page's chunk until used.     */

import { SheetColumn, SheetRow } from './sheet-grid.types';
import { isCanonicalDate } from './sheet-date';
import { parseNumber } from './sheet-fill';

/** '#abc' / '#aabbcc' / 'rgb(r,g,b)' -> 'FFAABBCC' (exceljs ARGB), else null. */
export function cssColorToArgb(c: string | null | undefined): string | null {
    if (!c) {
        return null;
    }
    const s = c.trim();
    let m = s.match(/^#([0-9a-f]{3})$/i);
    if (m) {
        const h = m[1];
        return ('FF' + h[0] + h[0] + h[1] + h[1] + h[2] + h[2]).toUpperCase();
    }
    m = s.match(/^#([0-9a-f]{6})$/i);
    if (m) {
        return ('FF' + m[1]).toUpperCase();
    }
    m = s.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
    if (m) {
        const hx = (n: string) => ('0' + Math.min(255, +n).toString(16)).slice(-2);
        return ('FF' + hx(m[1]) + hx(m[2]) + hx(m[3])).toUpperCase();
    }
    return null;
}

export interface SheetExcelOptions {
    fileName: string;
    sheetName?: string;
    frozenCols?: number;
    /** data rows frozen under the header row */
    frozenRows?: number;
    /** merged ranges, zero-based over the exported rows / columns */
    merges?: { r0: number; c0: number; r1: number; c1: number }[];
}

function safeSheetName(s: string): string {
    return (s || 'Sheet').replace(/[\\/?*[\]:]/g, ' ').slice(0, 31) || 'Sheet';
}

export async function loadExcelJs(): Promise<any> {
    const mod: any = await import('exceljs');
    return mod && mod.Workbook ? mod : mod.default;
}

/** Builds the .xlsx (as an ArrayBuffer) of the given columns and rows. */
export async function buildSheetWorkbook(columns: SheetColumn[], rows: SheetRow[], opts: SheetExcelOptions): Promise<ArrayBuffer> {
    const ExcelJS = await loadExcelJs();
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet(safeSheetName(opts.sheetName || opts.fileName), {
        views: [{ state: 'frozen', xSplit: Math.max(0, opts.frozenCols || 0), ySplit: 1 + Math.max(0, opts.frozenRows || 0) }]
    });
    ws.columns = columns.map(c => ({ key: c.key, width: Math.max(6, Math.round((c.width || 100) / 7)) }));

    const head = ws.getRow(1);
    columns.forEach((c, i) => {
        const cell = head.getCell(i + 1);
        cell.value = c.header;
        cell.font = { bold: true, size: 10 };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F3F3' } };
        cell.border = { bottom: { style: 'thin', color: { argb: 'FFBDBDBD' } } };
        cell.alignment = { vertical: 'middle', wrapText: true };
    });
    head.height = 30;

    rows.forEach((row, ri) => {
        const xr = ws.getRow(ri + 2);
        const rowBg = cssColorToArgb(row.rowFmt && row.rowFmt.bg);
        const rowFg = cssColorToArgb(row.rowFmt && row.rowFmt.fg);
        columns.forEach((c, ci) => {
            const raw = (row.values && row.values[c.key]) || '';
            const cell = xr.getCell(ci + 1);
            const kind = c.kind || 'text';
            if (raw === '') {
                cell.value = null;
            } else if (kind === 'date' && isCanonicalDate(raw)) {
                cell.value = new Date(Date.UTC(+raw.slice(6), +raw.slice(3, 5) - 1, +raw.slice(0, 2)));
                cell.numFmt = 'dd-mm-yyyy';
            } else if (kind === 'num' && parseNumber(raw) !== null) {
                cell.value = parseNumber(raw);
            } else {
                cell.value = raw;
            }
            const f = row.fmt && row.fmt[c.key];
            const bg = cssColorToArgb(f && f.bg) || rowBg;
            const fg = cssColorToArgb(f && f.fg) || rowFg;
            if (bg) {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
            }
            const font: any = { size: 10 };
            if (fg) {
                font.color = { argb: fg };
            }
            if (f && f.bold) {
                font.bold = true;
            }
            cell.font = font;
            if (raw.indexOf('\n') >= 0) {
                cell.alignment = { wrapText: true, vertical: 'top' };
            }
        });
    });
    for (const m of opts.merges || []) {
        if (m.r1 < rows.length && m.c1 < columns.length && (m.r1 > m.r0 || m.c1 > m.c0)) {
            ws.mergeCells(m.r0 + 2, m.c0 + 1, m.r1 + 2, m.c1 + 1); // +1 header row, 1-based
        }
    }
    ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: Math.max(1, columns.length) } };

    return wb.xlsx.writeBuffer();
}

/** Builds the workbook and hands it to the browser as <fileName>.xlsx. */
export async function exportSheetToExcel(columns: SheetColumn[], rows: SheetRow[], opts: SheetExcelOptions): Promise<void> {
    const buf = await buildSheetWorkbook(columns, rows, opts);
    const fsMod: any = await import('file-saver');
    const saveAs = fsMod.saveAs || (fsMod.default && fsMod.default.saveAs) || fsMod.default;
    const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const name = /\.xlsx$/i.test(opts.fileName) ? opts.fileName : opts.fileName + '.xlsx';
    saveAs(blob, name);
}
