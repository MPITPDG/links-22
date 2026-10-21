import { Injectable } from '@angular/core';
import { Workbook, Worksheet, Row } from 'exceljs';
import * as fs from 'file-saver';

/** What the Trial Balance - Group Wise screen hands over for the Excel download. */
export interface TrialBalanceGrpExcel {
  titleLines: string[];   // printed above the grid, one row each (company, "Trial Balance As On ...")
  rows: any[];            // Table of the group wise proc, in its own order
  fileName: string;       // without extension
}

// same look as the account statement Excel (exportexcel_accstatement_v4.ts)
const BLACK = 'FF000000';
const WHITE = 'FFFFFFFF';
const BAND = 'FFF5F5F5';
const GRID = 'FF999999';
const GROUP = 'FFDDEBF7';
const SUMMARY = 'FFD9D9D9';
const AMOUNT_FMT = '#,##0.00';
const BALANCE_FMT = '#,##0.00" Dr";#,##0.00" Cr";0.00';

// the proc's columns (usp_Acct_Rpt_Trialbalance_byGrpDtls): Group Name | ACCOUNT CODE | Particulars | OpeningDr .. ClosingCr
const AMOUNT_COLS = ['OpeningDr', 'OpeningCr', 'CurrentDr', 'CurrentCr', 'ClosingDr', 'ClosingCr'];
const HEADERS = ['Group Name', 'Account Code', 'Particulars', 'Opening Dr', 'Opening Cr', 'Current Dr', 'Current Cr', 'Closing Dr', 'Closing Cr'];
const FIRST_AMOUNT = 4;   // column D

/**
 * Trial Balance - Group Wise Excel that is easy to work with: header row frozen with filter drop-downs, the group name on every
 * ledger line (so a filter on one group shows its ledgers and its total), real amounts, SUBTOTAL group totals and grand total
 * (they follow the filter), and a Dr - Cr difference line under the grand total.
 */
@Injectable({
  providedIn: 'root'
})
export class ExportexcelTrialBalanceGroupWise {

  download(tb: TrialBalanceGrpExcel) {
    const rows = tb.rows || [];
    const workbook = new Workbook();
    const ws = workbook.addWorksheet('Trial Balance');
    ws.columns = [
      { width: 30 }, { width: 14 }, { width: 46 }, { width: 15 }, { width: 15 }, { width: 15 }, { width: 15 }, { width: 15 }, { width: 15 }
    ];

    // title block
    (tb.titleLines || []).filter(t => !!t).forEach((text, i) => {
      const row = ws.addRow([text]);
      ws.mergeCells(row.number, 1, row.number, HEADERS.length);
      row.getCell(1).font = { name: 'Arial', size: i == 0 ? 12 : 10, bold: true };
      row.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };
      row.height = i == 0 ? 18 : 15;
    });
    ws.addRow([]);

    const header = this.headerRow(ws, HEADERS);
    const firstData = header.number + 1;

    let lastCol = HEADERS.length;
    if (!this.hasProcColumns(rows)) {
      // not the expected proc layout: still give a clean table of whatever came back
      lastCol = Math.max(this.plainTable(ws, header, rows), 1);
    } else {
      this.groupedTable(ws, rows, firstData);
    }

    ws.autoFilter = { from: { row: header.number, column: 1 }, to: { row: Math.max(ws.rowCount, header.number), column: lastCol } };
    ws.views = [<any>{ state: 'frozen', xSplit: 0, ySplit: header.number, topLeftCell: 'A' + firstData, showGridLines: false }];
    ws.pageSetup = {
      paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0,
      printTitlesRow: header.number + ':' + header.number,
      margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.3, footer: 0.3 }
    };

    workbook.xlsx.writeBuffer().then((data) => {
      const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      fs.saveAs(blob, (tb.fileName || 'Trial_Balance').replace(/[\\\/:*?"<>|]/g, '_') + '.xlsx');
    }).catch((err) => {
      console.error('Error saving file:', err);
    });
  }

  /** group heading, its ledgers, its TOTAL line; the proc's blank spacer lines are left out so the data stays one block */
  private groupedTable(ws: Worksheet, rows: any[], firstData: number) {
    const lastTotal = this.lastTotalIndex(rows);
    let group = '';
    let ledgerFrom = 0;        // first ledger row of the current group
    let band = 0;
    const ledgerSums = AMOUNT_COLS.map(() => 0);   // ledgers of the current group
    const allSums = AMOUNT_COLS.map(() => 0);      // every ledger
    let plainGroupTotal = false;                   // a group total written as a figure would be counted again by SUBTOTAL

    rows.forEach((r, i) => {
      const groupName = this.text(r, 'Group Name');
      const code = this.text(r, 'ACCOUNT CODE');
      const name = this.text(r, 'Particulars');
      const amounts = AMOUNT_COLS.map(c => this.amount(r, c));
      const hasAmount = AMOUNT_COLS.some(c => this.text(r, c) !== '');

      if (!groupName && !code && !name && !hasAmount) { return; }   // spacer line

      if (this.isTotal(name)) {
        if (i === lastTotal) {
          // grand total: every ledger above, SUBTOTAL skips the group totals
          const row = ws.addRow(['', '', 'GRAND TOTAL']);
          const formula = plainGroupTotal || row.number == firstData ? null : (c: string) => 'SUBTOTAL(9,' + c + firstData + ':' + c + (row.number - 1) + ')';
          this.totalCells(row, amounts, allSums, formula);
          this.summaryStyle(row, true);
          this.differenceRow(ws, row.number);
        } else {
          const row = ws.addRow([group, '', 'TOTAL : ' + group]);
          const from = ledgerFrom;
          const formula = from ? (c: string) => 'SUBTOTAL(9,' + c + from + ':' + c + (row.number - 1) + ')' : null;
          if (!this.totalCells(row, amounts, ledgerSums, formula)) { plainGroupTotal = true; }
          this.summaryStyle(row, false);
        }
        ledgerSums.fill(0);
        ledgerFrom = 0;
        return;
      }

      if (!code && !hasAmount) {
        // group heading: the proc puts the name in Group Name (older versions in Particulars, in <B>)
        group = groupName || name;
        const row = ws.addRow([group]);
        this.groupStyle(row);
        ledgerFrom = 0;
        band = 0;
        return;
      }

      // ledger line
      const row = ws.addRow((<any[]>[group || groupName, code, name]).concat(amounts.map(a => a || null)));
      if (!ledgerFrom) { ledgerFrom = row.number; }
      amounts.forEach((a, k) => { ledgerSums[k] += a; allSums[k] += a; });
      this.gridStyle(row, band++);
    });
  }

  /** a total cell is a SUBTOTAL formula when the ledgers really add up to the proc's figure, otherwise the proc's figure;
      returns false when any cell had to be written as a figure */
  private totalCells(row: Row, procTotals: number[], sums: number[], formula: (col: string) => string): boolean {
    let allFormula = true;
    AMOUNT_COLS.forEach((c, k) => {
      const col = String.fromCharCode(64 + FIRST_AMOUNT + k);
      const proc = this.round(procTotals[k]);
      if (formula && Math.abs(proc - this.round(sums[k])) < 0.05) {
        row.getCell(FIRST_AMOUNT + k).value = <any>{ formula: formula(col), result: proc };
      } else {
        row.getCell(FIRST_AMOUNT + k).value = proc;
        if (proc !== 0 || formula) { allFormula = false; }
      }
    });
    return allFormula;
  }

  /** Dr - Cr for opening, current and closing: 0.00 when the trial balance tallies */
  private differenceRow(ws: Worksheet, grandRow: number) {
    const row = ws.addRow(['', '', 'Difference (Dr - Cr)']);
    [0, 2, 4].forEach(k => {
      const dr = String.fromCharCode(64 + FIRST_AMOUNT + k);
      const cr = String.fromCharCode(64 + FIRST_AMOUNT + k + 1);
      const grand = ws.getRow(grandRow);
      const result = this.round(this.cellNumber(grand.getCell(FIRST_AMOUNT + k).value) - this.cellNumber(grand.getCell(FIRST_AMOUNT + k + 1).value));
      row.getCell(FIRST_AMOUNT + k).value = <any>{ formula: dr + grandRow + '-' + cr + grandRow, result: result };
    });
    for (let c = 1; c <= HEADERS.length; c++) {
      const cell = row.getCell(c);
      cell.font = { name: 'Arial', size: 9, bold: true, italic: c == 3 };
      cell.alignment = { vertical: 'middle', horizontal: c >= 3 ? 'right' : 'left' };
      cell.border = this.border(false, true);
      if (c >= FIRST_AMOUNT) { cell.numFmt = BALANCE_FMT; }
    }
  }

  /** returns the number of columns written */
  private plainTable(ws: Worksheet, header: Row, rows: any[]): number {
    const keys = rows.length ? Object.keys(rows[0]) : [];
    keys.forEach((k, i) => {
      const cell = header.getCell(i + 1);
      cell.value = k;
      cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: WHITE } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BLACK } };
      cell.border = this.border(true, true);
    });
    for (let c = keys.length + 1; c <= HEADERS.length; c++) {
      const cell = header.getCell(c);
      cell.value = null;
      cell.fill = <any>{ type: 'pattern', pattern: 'none' };
      cell.border = {};
    }
    rows.forEach((r, i) => {
      const row = ws.addRow(keys.map(k => { const v = this.clean(r[k]); return this.isNumber(v) ? Number(v.replace(/,/g, '')) : (v === '' ? null : v); }));
      for (let c = 1; c <= keys.length; c++) {
        const cell = row.getCell(c);
        cell.font = { name: 'Arial', size: 9 };
        cell.border = this.border(false, false);
        if (typeof cell.value === 'number') { cell.numFmt = AMOUNT_FMT; }
        if (i % 2 == 1) { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BAND } }; }
      }
    });
    return keys.length;
  }

  private headerRow(ws: Worksheet, labels: string[]): Row {
    const row = ws.addRow(labels);
    row.height = 16;
    labels.forEach((l, i) => {
      const cell = row.getCell(i + 1);
      cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: WHITE } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BLACK } };
      cell.alignment = { horizontal: i + 1 >= FIRST_AMOUNT ? 'right' : 'left', vertical: 'middle' };
      cell.border = this.border(true, true);
    });
    return row;
  }

  private gridStyle(row: Row, index: number) {
    for (let c = 1; c <= HEADERS.length; c++) {
      const cell = row.getCell(c);
      cell.font = { name: 'Arial', size: 9, color: c == 1 ? { argb: 'FF808080' } : undefined };
      cell.border = this.border(false, false);
      cell.alignment = { vertical: 'top', horizontal: c >= FIRST_AMOUNT ? 'right' : 'left', wrapText: c == 3 };
      if (index % 2 == 1) { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BAND } }; }
      if (c == 2) { cell.numFmt = '@'; }
      if (c >= FIRST_AMOUNT) { cell.numFmt = AMOUNT_FMT; }
    }
  }

  private groupStyle(row: Row) {
    for (let c = 1; c <= HEADERS.length; c++) {
      const cell = row.getCell(c);
      cell.font = { name: 'Arial', size: 9, bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GROUP } };
      cell.border = this.border(true, false);
      cell.alignment = { vertical: 'middle', horizontal: 'left' };
    }
  }

  private summaryStyle(row: Row, grand: boolean) {
    for (let c = 1; c <= HEADERS.length; c++) {
      const cell = row.getCell(c);
      cell.font = { name: 'Arial', size: grand ? 10 : 9, bold: true, color: grand ? { argb: WHITE } : (c == 1 ? { argb: 'FF808080' } : undefined) };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: grand ? 'FF404040' : SUMMARY } };
      cell.border = this.border(true, true);
      cell.alignment = { vertical: 'middle', horizontal: c >= 3 ? 'right' : 'left' };
      if (c >= FIRST_AMOUNT) { cell.numFmt = AMOUNT_FMT; }
    }
  }

  private border(top: boolean, bottom: boolean): any {
    const line = { style: 'thin', color: { argb: GRID } };
    const b: any = { left: line, right: line };
    if (top) { b.top = line; }
    if (bottom) { b.bottom = line; }
    return b;
  }

  /** the proc ends with " Total: " for all ledgers; each group ends with "TOTAL : " */
  private isTotal(name: string): boolean {
    return name.replace(/\s+/g, '').toUpperCase() === 'TOTAL:';
  }

  private lastTotalIndex(rows: any[]): number {
    for (let i = rows.length - 1; i >= 0; i--) {
      if (this.isTotal(this.text(rows[i], 'Particulars'))) { return i; }
    }
    return -1;
  }

  private hasProcColumns(rows: any[]): boolean {
    if (!rows.length) { return true; }
    return ['Group Name', 'ACCOUNT CODE', 'Particulars'].concat(AMOUNT_COLS).every(n => this.key(rows[0], n) !== undefined);
  }

  /** column names differ in case and spacing between the procs */
  private key(row: any, name: string): string {
    const want = name.replace(/\s+/g, '').toLowerCase();
    return Object.keys(row || {}).find(k => k.replace(/\s+/g, '').toLowerCase() == want);
  }

  private text(row: any, name: string): string {
    const k = this.key(row, name);
    return k === undefined ? '' : this.clean(row[k]);
  }

  /** drops the <B> tags and the leading apostrophe some procs add, and trims */
  private clean(v: any): string {
    if (v === null || v === undefined) { return ''; }
    return String(v).replace(/<[^>]*>/g, '').replace(/^'(?=\d)/, '').trim();
  }

  private amount(row: any, name: string): number {
    const s = this.text(row, name).replace(/,/g, '');
    const n = Number(s);
    return s === '' || isNaN(n) ? 0 : Math.abs(n);   // the proc already strips the minus sign
  }

  private isNumber(s: string): boolean {
    return /^-?\d+(\.\d+)?$/.test((s || '').replace(/,/g, ''));
  }

  private cellNumber(v: any): number {
    if (v && typeof v === 'object' && 'result' in v) { return Number(v.result) || 0; }
    return Number(v) || 0;
  }

  private round(n: number): number {
    return Math.round(n * 100) / 100;
  }
}
