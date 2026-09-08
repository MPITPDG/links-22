import { Injectable } from '@angular/core';
import { Workbook } from 'exceljs';
import * as fs from 'file-saver';

// Dedicated export for the Cashbook Bank Reconciliation Statement page only.
// exportexcel.service.ts has no branch for pagetype "BankRecStatement" /
// "BankRecOutStatement" — the reconciliation summary (Opening/Closing/Bank
// Balance/Difference) that the original component computed and sent was
// being silently dropped from the exported file. Built fresh here rather
// than patching the shared service, per earlier direction to keep page-
// specific export logic out of that file.
@Injectable({
  providedIn: 'root'
})
export class BankReconcilCashbookStatementExportService {

  private readonly thinBorder = {
    top: { style: 'thin' },
    left: { style: 'thin' },
    bottom: { style: 'thin' },
    right: { style: 'thin' }
  } as const;

  export(data: {
    companyName: string,
    bankName: string,
    fromDt: string,
    toDt: string,
    bankpayList: any[],
    bankrecList: any[],
    issueTotal: any,
    recTotal: any,
    openingBalance: any,
    currentDrBal: any,
    currentCrbal: any,
    closingBalance: any,
    bankBalance: any,
    difference: any
  }, downloadname: string) {

    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet('Statement');

    worksheet.columns = [
      { width: 18 }, { width: 12 }, { width: 8 }, { width: 12 }, { width: 12 }, { width: 14 }, { width: 14 }
    ];

    let row = 1;

    const titleCell = worksheet.getCell(row, 1);
    titleCell.value = data.companyName || '';
    titleCell.font = { name: 'Arial', size: 12, bold: true, underline: 'single' };
    row++;

    const subCell = worksheet.getCell(row, 1);
    subCell.value = `Reconciliation Statement For ${data.bankName || ''}`;
    subCell.font = { name: 'Arial', size: 11, bold: true };
    row++;

    const periodCell = worksheet.getCell(row, 1);
    periodCell.value = `From ${data.fromDt || ''} To ${data.toDt || ''}`;
    periodCell.font = { name: 'Arial', size: 10 };
    row += 2;

    row = this.writeSection(worksheet, row, 'Cheque Issued But Not Clear', data.bankpayList, data.issueTotal);
    row++;
    row = this.writeSection(worksheet, row, 'Cheque Received But Not Clear', data.bankrecList, data.recTotal);
    row += 2;

    const summaryTitle = worksheet.getCell(row, 1);
    summaryTitle.value = 'Reconciliation Summary';
    summaryTitle.font = { name: 'Arial', size: 11, bold: true, underline: 'single' };
    row++;

    row = this.writeSummaryRow(worksheet, row, 'Opening Balance (As Per Cash Book)', data.openingBalance);
    row = this.writeSummaryRow(worksheet, row, 'Dr. Amount', data.currentDrBal);
    row = this.writeSummaryRow(worksheet, row, 'Cr. Amount', data.currentCrbal);
    row = this.writeSummaryRow(worksheet, row, 'Closing Balance (As Per Cash Book)', data.closingBalance, true);
    row = this.writeSummaryRow(worksheet, row, 'Balance As Per Bank Statement', data.bankBalance);
    row = this.writeSummaryRow(worksheet, row, 'Difference', data.difference, true);

    workbook.xlsx.writeBuffer().then((buf) => {
      const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      fs.saveAs(blob, downloadname + '.xlsx');
    });
  }

  // Matches the visual format of bank-reconcil-statement-export.service.ts
  // (the "Reconciliation Statement" page in uploadbankreconcil) — merged-cell
  // schedule, blue header row, single combined outstanding table, totals row
  // — adapted to this page's own already-correct figures (cleared-only
  // Opening/Dr/Cr/Closing/Bank Balance/Difference) and data shape (no Party/
  // Reference or Chq Type fields exist on bankpayList/bankrecList, so those
  // columns are dropped rather than left permanently blank).
  exportOutstanding(data: {
    bankName: string,
    fromDt: string,
    toDt: string,
    bankpayList: any[],
    bankrecList: any[],
    openingBalance: any,
    currentDrBal: any,
    currentCrbal: any,
    closingBalance: any,
    bankBalance: any,
    difference: any
  }, downloadname: string) {

    const COLS = 8; // Entry No, Date, Type, Cheque No, Cheque Dt, Debit, Credit, Clearance Status
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet('Outstanding');

    worksheet.columns = [
      { width: 18 }, { width: 12 }, { width: 8 }, { width: 14 }, { width: 12 }, { width: 14 }, { width: 14 }, { width: 16 }
    ];

    // TITLE
    worksheet.mergeCells(1, 1, 1, COLS);
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'Bank Reconciliation Statement';
    titleCell.font = { name: 'Arial', size: 12, bold: true, underline: 'single' };

    // BANK NAME + PERIOD
    worksheet.mergeCells(2, 1, 2, 4);
    worksheet.mergeCells(2, 5, 2, COLS);
    worksheet.getCell(2, 1).value = data.bankName || '';
    worksheet.getCell(2, 5).value = `For the period ${data.fromDt || ''} to ${data.toDt || ''}`;
    worksheet.getRow(2).font = { name: 'Arial', size: 10 };

    // RECONCILIATION SCHEDULE (rows 4-9)
    this.addScheduleRow(worksheet, 4, COLS, 'Opening Balance (As Per Cash Book)', data.openingBalance);
    this.addScheduleRow(worksheet, 5, COLS, 'Dr. Amount (Cleared Receipts This Period)', data.currentDrBal);
    this.addScheduleRow(worksheet, 6, COLS, 'Cr. Amount (Cleared Payments This Period)', data.currentCrbal);
    this.addScheduleRow(worksheet, 7, COLS, 'Closing Balance (As Per Cash Book)', data.closingBalance);
    this.addScheduleRow(worksheet, 8, COLS, 'Balance As Per Bank Statement', data.bankBalance);
    this.addScheduleRow(worksheet, 9, COLS, 'Difference', data.difference, true, true);

    // SECTION TITLE — bankpayList (BP) + bankrecList (BR) combined into one
    // list, ordered by entry date, matching the single-table reference format
    const combined = [...(data.bankpayList || []), ...(data.bankrecList || [])]
      .sort((a, b) => this.dateSortKey(a.ENTRYDT) - this.dateSortKey(b.ENTRYDT));

    worksheet.mergeCells(11, 1, 11, COLS);
    const sectionCell = worksheet.getCell(11, 1);
    sectionCell.value = `Outstanding Items (${combined.length})`;
    sectionCell.font = { name: 'Arial', size: 10, bold: true };

    // TABLE HEADER
    const headers = ['Entry No', 'Date', 'Type', 'Cheque No', 'Cheque Dt', 'Debit', 'Credit', 'Clearance Status'];
    const headerRow = worksheet.getRow(12);
    headerRow.values = headers;
    headerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '2563EB' }, bgColor: { argb: '' } };
      cell.font = { name: 'Arial', bold: true, color: { argb: 'FFFFFF' }, size: 10 };
      cell.border = this.thinBorder;
    });

    // TABLE DATA — BR (receipt) amounts go under Debit, BP (payment) amounts
    // go under Credit, same Dr/Cr convention used throughout this project
    // (BR increases the bank asset = Debit; BP decreases it = Credit).
    let rowIdx = 13;
    let debitTotal = 0;
    let creditTotal = 0;

    combined.forEach((d) => {
      const isReceipt = d.STATUS === 'BR';
      const amt = d.ACTUALAMOUNT ? parseFloat(d.ACTUALAMOUNT) : 0;

      const row = worksheet.getRow(rowIdx);
      row.values = [
        (d.ENTRYNO || '').toString().replace(/^'/, ''),
        this.cleanDate(d.ENTRYDT),
        d.STATUS || '',
        d.CHEQUENO || '',
        this.cleanDate(d.CHEQUEDT),
        isReceipt ? amt : '',
        !isReceipt ? amt : '',
        'Not Cleared'
      ];
      row.font = { name: 'Arial', size: 10 };
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        cell.border = this.thinBorder;
        if (colNumber === 6 || colNumber === 7) {
          cell.numFmt = '#,##0.00';
          cell.alignment = { horizontal: 'right' };
        }
      });

      if (isReceipt) { debitTotal += amt; } else { creditTotal += amt; }
      rowIdx++;
    });

    if (combined.length === 0) {
      const emptyRow = worksheet.getRow(rowIdx);
      emptyRow.getCell(1).value = 'Nothing outstanding for this period';
      emptyRow.getCell(1).font = { name: 'Arial', size: 10, italic: true, color: { argb: '9CA3AF' } };
      rowIdx++;
    }

    // TOTALS ROW
    const totalRow = worksheet.getRow(rowIdx);
    totalRow.getCell(5).value = 'Total';
    totalRow.getCell(6).value = debitTotal;
    totalRow.getCell(7).value = creditTotal;
    totalRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.font = { name: 'Arial', size: 10, bold: true };
      if (colNumber === 5 || colNumber === 6 || colNumber === 7) {
        cell.border = { top: { style: 'thin' }, bottom: { style: 'double' } };
      }
      if (colNumber === 6 || colNumber === 7) {
        cell.numFmt = '#,##0.00';
        cell.alignment = { horizontal: 'right' };
      }
    });

    workbook.xlsx.writeBuffer().then((buf) => {
      const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      fs.saveAs(blob, downloadname + '.xlsx');
    });
  }

  private addScheduleRow(worksheet, rowIdx: number, cols: number, label: string, value: any, bold = false, topBorder = false) {
    worksheet.mergeCells(rowIdx, 1, rowIdx, cols - 2);
    worksheet.mergeCells(rowIdx, cols - 1, rowIdx, cols);
    const labelCell = worksheet.getCell(rowIdx, 1);
    const valueCell = worksheet.getCell(rowIdx, cols - 1);
    labelCell.value = label;
    valueCell.value = this.toNumber(value);
    valueCell.numFmt = '#,##0.00';
    labelCell.font = { name: 'Arial', size: 10, bold };
    valueCell.font = { name: 'Arial', size: 10, bold };
    valueCell.alignment = { horizontal: 'right' };
    if (topBorder) {
      labelCell.border = { top: { style: 'thin' } };
      valueCell.border = { top: { style: 'thin' } };
    }
  }

  // dd/mm/yyyy (post-cleanDate) -> sortable timestamp
  private dateSortKey(val: any): number {
    const s = this.cleanDate(val);
    if (!s) { return 0; }
    const parts = s.split('/');
    if (parts.length !== 3) { return 0; }
    const [d, m, y] = parts;
    const t = new Date(`${y}-${m}-${d}`).getTime();
    return isNaN(t) ? 0 : t;
  }

  private writeSection(worksheet, startRow: number, title: string, list: any[], total: any): number {
    let row = startRow;

    const t = worksheet.getCell(row, 1);
    t.value = `${title} (${(list || []).length})`;
    t.font = { name: 'Arial', size: 10, bold: true };
    row++;

    const headers = ['Entry No', 'Entry Date', 'Status', 'Cheque No', 'Cheque Date', 'Clearing Date', 'Amount'];
    const headerRow = worksheet.getRow(row);
    headerRow.values = headers;
    headerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '2563EB' }, bgColor: { argb: '' } };
      cell.font = { name: 'Arial', bold: true, color: { argb: 'FFFFFF' }, size: 10 };
      cell.border = this.thinBorder;
    });
    row++;

    (list || []).forEach((d) => {
      const dataRow = worksheet.getRow(row);
      dataRow.values = [
        (d.ENTRYNO || '').toString().replace(/^'/, ''),
        this.cleanDate(d.ENTRYDT),
        d.STATUS || '',
        d.CHEQUENO || '',
        this.cleanDate(d.CHEQUEDT),
        this.cleanDate(d.CLEARANCEDATE),
        d.ACTUALAMOUNT ? parseFloat(d.ACTUALAMOUNT) : ''
      ];
      dataRow.font = { name: 'Arial', size: 10 };
      dataRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        cell.border = this.thinBorder;
        if (colNumber === 7) {
          cell.numFmt = '#,##0.00';
          cell.alignment = { horizontal: 'right' };
        }
      });
      row++;
    });

    if (!list || list.length === 0) {
      const emptyRow = worksheet.getRow(row);
      emptyRow.getCell(1).value = 'Nothing outstanding for this period';
      emptyRow.getCell(1).font = { name: 'Arial', size: 10, italic: true, color: { argb: '9CA3AF' } };
      row++;
    }

    const totalRow = worksheet.getRow(row);
    totalRow.getCell(6).value = 'Total';
    totalRow.getCell(7).value = this.toNumber(total);
    totalRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.font = { name: 'Arial', size: 10, bold: true };
      if (colNumber === 6 || colNumber === 7) {
        cell.border = { top: { style: 'thin' } };
      }
      if (colNumber === 7) {
        cell.numFmt = '#,##0.00';
        cell.alignment = { horizontal: 'right' };
      }
    });
    row++;

    return row;
  }

  private writeSummaryRow(worksheet, row: number, label: string, value: any, bold = false): number {
    const labelCell = worksheet.getCell(row, 1);
    labelCell.value = label;
    labelCell.font = { name: 'Arial', size: 10, bold };

    const valCell = worksheet.getCell(row, 3);
    valCell.value = this.toNumber(value);
    valCell.numFmt = '#,##0.00';
    valCell.font = { name: 'Arial', size: 10, bold };
    valCell.alignment = { horizontal: 'right' };

    return row + 1;
  }

  // "2025-04-02T00:00:00" -> "02/04/2025". Leaves already-clean dd/mm/yyyy
  // strings (like ENTRYDT) untouched.
  private cleanDate(val: any): string {
    if (!val) { return ''; }
    const s = (val + '').trim();
    if (!s) { return ''; }
    if (s.indexOf('T') > -1) {
      const datePart = s.split('T')[0];
      const parts = datePart.split('-');
      if (parts.length === 3) {
        const [y, m, d] = parts;
        return `${d}/${m}/${y}`;
      }
    }
    return s;
  }

  private toNumber(val: any): number {
    if (val === null || val === undefined || val === '') { return 0; }
    const n = parseFloat((val + '').replace(/[^0-9.\-]/g, ''));
    return isNaN(n) ? 0 : n;
  }

}
