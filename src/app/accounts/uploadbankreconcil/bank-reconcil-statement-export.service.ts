import { Injectable } from '@angular/core';
import { Workbook } from 'exceljs';
import * as fs from 'file-saver';

// Export for the Bank Reconciliation Statement page only.
// Column widths are fixed to match the 10-column detail table. The
// reconciliation schedule above it uses merged cells (label spans A:F,
// value spans G:J) instead of column-autosize — autosizing off the
// schedule's long label text (e.g. "Add : Payments issued but not yet
// presented at bank (2 items)") would blow column A out to 60+ chars
// and drag the "Entry No" column in the table below along with it.
@Injectable({
  providedIn: 'root'
})
export class BankReconcilStatementExportService {

  private readonly COLS = 10; // Entry No, Date, Type, Party, Chq Type, Cheque No, Cheque Dt, Debit, Credit, Clearance Status
  private readonly thinBorder = {
    top: { style: 'thin' },
    left: { style: 'thin' },
    bottom: { style: 'thin' },
    right: { style: 'thin' }
  } as const;

  export(excelData, downloadname) {

    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet('Statement');

    worksheet.columns = [
      { width: 16 }, { width: 11 }, { width: 8 }, { width: 42 }, { width: 10 },
      { width: 13 }, { width: 13 }, { width: 14 }, { width: 14 }, { width: 16 }
    ];

    // TITLE
    worksheet.mergeCells(1, 1, 1, this.COLS);
    const titleCell = worksheet.getCell('A1');
    titleCell.value = excelData.title;
    titleCell.font = { name: 'Arial', size: 12, bold: true, underline: 'single' };

    // BANK NAME + PERIOD
    worksheet.mergeCells(2, 1, 2, 5);
    worksheet.mergeCells(2, 6, 2, this.COLS);
    worksheet.getCell('A2').value = excelData.bankName || '';
    worksheet.getCell('F2').value = excelData.period || '';
    worksheet.getRow(2).font = { name: 'Arial', size: 10 };

    // RECONCILIATION SCHEDULE (rows 4-8)
    this.addScheduleRow(worksheet, 4, 'Opening Balance', excelData.openingBalance);
    this.addScheduleRow(worksheet, 5, 'Balance as per Books (Company Ledger)', excelData.booksBalance);
    this.addScheduleRow(worksheet, 6, excelData.addLabel, excelData.addValue);
    this.addScheduleRow(worksheet, 7, excelData.lessLabel, excelData.lessValue);
    this.addScheduleRow(worksheet, 8, 'Balance as per Bank Statement', excelData.bankBalance, true, true);

    // SECTION TITLE (Outstanding Items / All Entries)
    worksheet.mergeCells(10, 1, 10, this.COLS);
    const sectionCell = worksheet.getCell('A10');
    sectionCell.value = excelData.sectionTitle;
    sectionCell.font = { name: 'Arial', size: 10, bold: true };

    // TABLE HEADER
    const headerRow = worksheet.getRow(11);
    headerRow.values = excelData.headers;
    headerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '2563EB' }, bgColor: { argb: '' } };
      cell.font = { name: 'Arial', bold: true, color: { argb: 'FFFFFF' }, size: 10 };
      cell.border = this.thinBorder;
      cell.alignment = { vertical: 'middle', wrapText: true };
    });

    // TABLE DATA
    const debitIdx = excelData.headers.indexOf('Debit');
    const creditIdx = excelData.headers.indexOf('Credit');
    let rowIdx = 12;
    (excelData.data || []).forEach(d => {
      const row = worksheet.getRow(rowIdx);
      row.values = d;
      row.font = { name: 'Arial', size: 10, color: { argb: '00000000' } };
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        cell.border = this.thinBorder;
        if (colNumber - 1 === debitIdx || colNumber - 1 === creditIdx) {
          cell.numFmt = '#,##0.00';
          cell.alignment = { horizontal: 'right' };
        }
      });
      rowIdx++;
    });

    // TOTALS ROW — placed one column before Debit, under Debit/Credit
    const totalRowValues = new Array(this.COLS).fill('');
    if (debitIdx > 0) { totalRowValues[debitIdx - 1] = 'Total'; }
    if (debitIdx >= 0) { totalRowValues[debitIdx] = excelData.debitTotal; }
    if (creditIdx >= 0) { totalRowValues[creditIdx] = excelData.creditTotal; }
    const totalRow = worksheet.getRow(rowIdx);
    totalRow.values = totalRowValues;
    totalRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.font = { name: 'Arial', size: 10, bold: true };
      cell.border = { top: { style: 'thin' }, bottom: { style: 'double' } };
      if (colNumber - 1 === debitIdx || colNumber - 1 === creditIdx) {
        cell.numFmt = '#,##0.00';
        cell.alignment = { horizontal: 'right' };
      }
    });

    workbook.xlsx.writeBuffer().then((data) => {
      const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      fs.saveAs(blob, downloadname + '.xlsx');
    });
  }

  private addScheduleRow(worksheet, rowIdx: number, label: any, value: any, bold = false, topBorder = false) {
    worksheet.mergeCells(rowIdx, 1, rowIdx, 6);
    worksheet.mergeCells(rowIdx, 7, rowIdx, this.COLS);
    const labelCell = worksheet.getCell(rowIdx, 1);
    const valueCell = worksheet.getCell(rowIdx, 7);
    labelCell.value = label;
    valueCell.value = value;
    labelCell.font = { name: 'Arial', size: 10, bold };
    valueCell.font = { name: 'Arial', size: 10, bold };
    valueCell.alignment = { horizontal: 'right' };
    if (topBorder) {
      labelCell.border = { top: { style: 'thin' } };
      valueCell.border = { top: { style: 'thin' } };
    }
  }

}
