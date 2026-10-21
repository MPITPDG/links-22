import { Injectable } from '@angular/core';
import { Workbook, Worksheet, Row } from 'exceljs';
import * as fs from 'file-saver';

/** What the Account Statement screens hand over for the Excel download. */
export interface AccStatementExcel {
  titleLines: string[];   // printed above the grid, one row each (company, report title, client)
  totals: any;            // Table1[0] of the statement proc: OPBAL, TLDR, TLCR, CLBAL
  advTotals: any;         // Table2[0] of the statement proc: ADVTOTALDR, ADVTOTALCR
  rows: any[];            // statement rows exactly as shown on screen
  advRows?: any[];        // advance rows; leave out for the "without advance" file
  fileName: string;       // without extension
}

// Manilal V4 DataGrid look (frm_Acc_Rpt_ClientOutstanding_ToExcel_WithAdvance.aspx):
// black header with white bold Arial 10, Arial 8 rows, WhiteSmoke banding, #999999 vertical grid lines.
const BLACK = 'FF000000';
const WHITE = 'FFFFFFFF';
const BAND = 'FFF5F5F5';
const GRID = 'FF999999';
const SUMMARY = 'FFD9D9D9';
const AMOUNT_FMT = '#,##0.00';
const BALANCE_FMT = '#,##0.00" Dr";#,##0.00" Cr";0.00';
const DATE_FMT = 'dd-mm-yyyy';
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

/**
 * Account statement Excel in the Manilal V4 layout (Opening / Current Total / Closing / Advance lines above
 * the grid), written as a real .xlsx so it is easy to work with: header row frozen, filter drop-downs,
 * real dates and amounts, and a running Dr/Cr balance.
 */
@Injectable({
  providedIn: 'root'
})
export class ExportexcelAccStatementV4 {

  download(stmt: AccStatementExcel) {
    const rows = stmt.rows || [];
    const totals = stmt.totals || null;
    const opening = totals ? this.toNumber(totals.OPBAL) : 0;
    const closing = totals ? this.toNumber(totals.CLBAL) : 0;

    // only show the running balance when the rows really add up from opening to closing
    let movement = 0;
    rows.forEach(r => movement += this.amount(r, 'DRAMT') - this.amount(r, 'CRAMT'));
    const showBalance = !!totals && Math.abs(opening + movement - closing) < 0.05;
    const lastCol = showBalance ? 7 : 6;

    const workbook = new Workbook();
    const ws = workbook.addWorksheet('Account Statement');
    ws.columns = [
      { width: 7 }, { width: 20 }, { width: 12 }, { width: 62 }, { width: 15 }, { width: 15 }, { width: 18 }
    ];

    // title block
    (stmt.titleLines || []).filter(t => !!t).forEach((text, i) => {
      const row = ws.addRow([text]);
      ws.mergeCells(row.number, 1, row.number, lastCol);
      row.getCell(1).font = { name: 'Arial', size: i == 0 ? 12 : 10, bold: true };
      row.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };
      row.height = i == 0 ? 18 : 15;
    });

    // V4 summary lines, straight above the grid header
    if (totals) {
      const adv = stmt.advTotals || null;
      const advCr = adv ? Math.abs(this.toNumber(adv.ADVTOTALCR)) : 0;
      [
        'Opening : ' + this.drCr(opening),
        'Current Total : ' + this.side(totals.TLDR, 'Dr') + '    ' + this.side(totals.TLCR, 'Cr'),
        'Closing : ' + this.drCr(closing),
        'Advance : ' + (advCr ? this.round(advCr).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '')
      ].forEach(text => {
        const row = ws.addRow([text.trim()]);
        ws.mergeCells(row.number, 1, row.number, lastCol);
        row.getCell(1).font = { name: 'Arial', size: 10 };
        row.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };
      });
    } else {
      ws.addRow([]);
    }

    // statement grid
    const headerRow = this.headerRow(ws, ['Type', 'Number', 'Date', 'Particulars', 'Debit', 'Credit', 'Balance'].slice(0, lastCol));
    const firstGridRow = headerRow.number + 1;

    // running balance starts from the opening figure above the grid
    let balanceRef = String(this.round(opening));
    let running = opening;
    rows.forEach((r, i) => {
      const dr = this.amount(r, 'DRAMT');
      const cr = this.amount(r, 'CRAMT');
      const row = ws.addRow([
        this.text(r, 'TRANSTYPE'),
        this.text(r, 'TRANSCODE'),
        this.toDate(this.field(r, 'TRANSDATE')) || this.toDate(this.field(r, 'DATE1')) || this.text(r, 'TRANSDATE'),
        this.particulars(r, ['NARR', 'EXP_SNAME', 'SUP_SNAME', 'ACCTNAME']),
        dr || null,
        cr || null
      ]);
      if (showBalance) {
        running += dr - cr;
        row.getCell(7).value = this.formula(balanceRef + '+E' + row.number + '-F' + row.number, this.round(running));
        balanceRef = 'G' + row.number;
      }
      this.gridStyle(row, lastCol, i);
    });
    const lastTxn = ws.rowCount;
    this.closeGrid(ws, lastCol);

    // filter drop-downs on the statement lines
    ws.autoFilter = { from: { row: headerRow.number, column: 1 }, to: { row: Math.max(lastTxn, headerRow.number), column: lastCol } };

    // advance grid, below the statement as in V4
    if (stmt.advRows) {
      ws.addRow([]);
      const title = ws.addRow(['Advance']);
      title.getCell(1).font = { name: 'Arial', size: 10, bold: true };
      this.headerRow(ws, ['Type', 'Number', 'Date', 'Particulars', 'Amount']);
      const firstAdv = ws.rowCount + 1;
      let advTotal = 0;
      stmt.advRows.forEach((r, i) => {
        const amt = this.amount(r, 'CRAMT');
        advTotal += amt;
        const row = ws.addRow([
          this.text(r, 'TRANSTYPE'),
          this.text(r, 'TRANSCODE'),
          this.toDate(this.field(r, 'TRANSDATE')) || this.text(r, 'TRANSDATE'),
          this.particulars(r, ['EXP_SNAME', 'SUP_SNAME', 'ACCTNAME']),
          amt || null
        ]);
        this.gridStyle(row, 5, i);
      });
      if (stmt.advRows.length > 0) {
        const tot = ws.addRow(['', '', null, 'Advance Total',
          this.formula('SUM(E' + firstAdv + ':E' + ws.rowCount + ')', this.round(advTotal))]);
        this.summaryStyle(tot, 5);
      } else {
        const none = ws.addRow(['', '', null, 'No advance entries']);
        this.gridStyle(none, 5, 0);
      }
      this.closeGrid(ws, 5);
    }

    ws.views = [<any>{ state: 'frozen', xSplit: 0, ySplit: headerRow.number, topLeftCell: 'A' + firstGridRow, showGridLines: false }];
    ws.pageSetup = {
      paperSize: 9, orientation: 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 0,
      printTitlesRow: headerRow.number + ':' + headerRow.number,
      margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.3, footer: 0.3 }
    };

    workbook.xlsx.writeBuffer().then((data) => {
      const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      fs.saveAs(blob, (stmt.fileName || 'Account_Statement').replace(/[\\\/:*?"<>|]/g, '_') + '.xlsx');
    }).catch((err) => {
      console.error('Error saving file:', err);
    });
  }

  /** "-26-27" style suffix used by the V4 file names, from the financial year dates. */
  finYearSuffix(finStart: any, finEnd: any): string {
    const yy = (d: any) => { const m = /(\d{4})/.exec(String(d || '')); return m ? m[1].substr(2) : ''; };
    return '-' + yy(finStart) + '-' + yy(finEnd);
  }

  private headerRow(ws: Worksheet, labels: string[]): Row {
    const row = ws.addRow(labels);
    row.height = 16;
    labels.forEach((l, i) => {
      const cell = row.getCell(i + 1);
      cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: WHITE } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BLACK } };
      cell.alignment = { horizontal: this.isAmountLabel(l) ? 'right' : 'left', vertical: 'middle' };
      cell.border = this.border(true, true);
    });
    return row;
  }

  private gridStyle(row: Row, lastCol: number, index: number) {
    let longest = 0;
    for (let c = 1; c <= lastCol; c++) {
      const cell = row.getCell(c);
      cell.font = { name: 'Arial', size: 8 };
      cell.border = this.border(false, false);
      cell.alignment = { vertical: 'top', horizontal: c >= 5 ? 'right' : 'left', wrapText: c == 4 };
      if (index % 2 == 1) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BAND } };
      }
      if (c == 2) { cell.numFmt = '@'; }
      if (c == 3 && cell.value instanceof Date) { cell.numFmt = DATE_FMT; }
      if (c >= 5) { cell.numFmt = c == 7 ? BALANCE_FMT : AMOUNT_FMT; }
      if (c == 4) { longest = String(cell.value || '').length; }
    }
    // Excel does not grow wrapped rows on open, so size long particulars here
    const lines = Math.ceil(longest / 72);
    if (lines > 1) { row.height = Math.min(lines, 8) * 11 + 2; }
  }

  private summaryStyle(row: Row, lastCol: number) {
    for (let c = 1; c <= lastCol; c++) {
      const cell = row.getCell(c);
      cell.font = { name: 'Arial', size: 8, bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SUMMARY } };
      cell.border = this.border(true, true);
      cell.alignment = { vertical: 'middle', horizontal: c >= 4 ? 'right' : 'left' };
      if (c >= 5) { cell.numFmt = c == 7 ? BALANCE_FMT : AMOUNT_FMT; }
    }
  }

  /** bottom line under the last row of a grid */
  private closeGrid(ws: Worksheet, lastCol: number) {
    const row = ws.getRow(ws.rowCount);
    for (let c = 1; c <= lastCol; c++) {
      const cell = row.getCell(c);
      cell.border = Object.assign({}, cell.border, { bottom: { style: 'thin', color: { argb: GRID } } });
    }
  }

  private border(top: boolean, bottom: boolean): any {
    const line = { style: 'thin', color: { argb: GRID } };
    const b: any = { left: line, right: line };
    if (top) { b.top = line; }
    if (bottom) { b.bottom = line; }
    return b;
  }

  private isAmountLabel(label: string) {
    return ['Debit', 'Credit', 'Balance', 'Amount'].indexOf(label) >= 0;
  }

  private formula(formula: string, result: number): any {
    return { formula: formula, result: result };
  }

  /** column names differ in case between the procs (TRANSCODE / Transcode / transcode) */
  private field(row: any, name: string): any {
    if (!row) { return null; }
    if (row[name] !== undefined) { return row[name]; }
    const key = Object.keys(row).find(k => k.toLowerCase() == name.toLowerCase());
    return key === undefined ? null : row[key];
  }

  private text(row: any, name: string): string {
    const v = this.field(row, name);
    return v === null || v === undefined ? '' : String(v).trim();
  }

  private particulars(row: any, names: string[]): string {
    return names.map(n => this.text(row, n)).filter(t => t != '').join(' ');
  }

  private amount(row: any, name: string): number {
    return this.toNumber(this.field(row, name));
  }

  private toNumber(v: any): number {
    if (v === null || v === undefined || v === '') { return 0; }
    const n = Number(String(v).replace(/,/g, ''));
    return isNaN(n) ? 0 : n;
  }

  private round(n: number): number {
    return Math.round(n * 100) / 100;
  }

  /** V4 wording for a balance: "120304.00 Dr", "500.00 Cr", blank when zero */
  private drCr(n: number): string {
    if (!n) { return ''; }
    return Math.abs(n).toFixed(2) + (n > 0 ? ' Dr' : ' Cr');
  }

  /** V4 wording for one side of Current Total: "254408.00 Dr", blank when zero */
  private side(v: any, suffix: string): string {
    const n = Math.abs(this.toNumber(v));
    return n ? n.toFixed(2) + ' ' + suffix : '';
  }

  /** dd/MM/yyyy, dd-MM-yyyy, dd MMM yyyy or ISO -> Date at UTC midnight (exceljs writes dates as UTC) */
  private toDate(v: any): Date {
    if (v === null || v === undefined || v === '') { return null; }
    const s = String(v).trim();
    let m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s);
    if (m) { return this.utc(+m[1], +m[2], +m[3]); }
    m = /^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/.exec(s);
    if (m) { return this.utc(+m[3], +m[2], +m[1]); }
    m = /^(\d{1,2})[\s\-]([A-Za-z]{3})[A-Za-z]*[\s\-,]+(\d{4})/.exec(s);
    if (m && MONTHS.indexOf(m[2].toUpperCase()) >= 0) { return this.utc(+m[3], MONTHS.indexOf(m[2].toUpperCase()) + 1, +m[1]); }
    return null;
  }

  private utc(y: number, mth: number, d: number): Date {
    if (mth < 1 || mth > 12 || d < 1 || d > 31) { return null; }
    return new Date(Date.UTC(y, mth - 1, d));
  }
}
