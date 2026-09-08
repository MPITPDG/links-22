import { Injectable } from '@angular/core';
import { Workbook } from 'exceljs';
import * as fs from 'file-saver';

// Export for the Bank Reconciliation Add/Edit page (bank-reconcil.component).
// Matches the legacy "Bank Reconciliation Statement" .xls format exactly:
// a flat list of every entry (both cleared and uncleared, BR and BP) with
// no summary schedule and no totals row — just the letterhead lines above
// a 10-column table with a black/white header row and alternating row
// shading. Kept as its own service (not touching the shared exportexcel
// service) per the standing rule for this feature area.
@Injectable({
  providedIn: 'root'
})
export class BankReconcilAddEditExportService {

  private readonly headers = [
    'Entry No', 'Entry Date', 'Trans Type', 'Party Name', 'Chq Type',
    'Cheque No', 'Cheque Date', 'Clearing Date', 'Debit', 'Credit'
  ];
  private readonly COLS = 10;

  export(companyLine: string, period: string, rows: any[], downloadname: string) {

    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet('Bank Reconciliation');

    worksheet.columns = [
      { width: 18 }, { width: 11 }, { width: 10 }, { width: 45 }, { width: 9 },
      { width: 12 }, { width: 12 }, { width: 12 }, { width: 13 }, { width: 13 }
    ];

    worksheet.mergeCells(1, 1, 1, this.COLS);
    worksheet.getCell('A1').value = companyLine;
    worksheet.getCell('A1').font = { name: 'Arial', size: 11, bold: true };

    worksheet.mergeCells(2, 1, 2, this.COLS);
    worksheet.getCell('A2').value = 'Bank Reconciliation Statement';
    worksheet.getCell('A2').font = { name: 'Arial', size: 10, bold: true };
    worksheet.getCell('A2').alignment = { horizontal: 'center' };

    worksheet.mergeCells(3, 1, 3, this.COLS);
    worksheet.getCell('A3').value = period;
    worksheet.getCell('A3').font = { name: 'Arial', size: 10 };
    worksheet.getCell('A3').alignment = { horizontal: 'center' };

    const headerRow = worksheet.getRow(5);
    headerRow.values = this.headers;
    headerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF000000' } };
      cell.font = { name: 'Arial', bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
      cell.alignment = { vertical: 'middle' };
    });

    const debitIdx = this.headers.indexOf('Debit');
    const creditIdx = this.headers.indexOf('Credit');
    let rowIdx = 6;

    (rows || []).forEach((d, i) => {
      const row = worksheet.getRow(rowIdx);
      row.values = [
        d.ENTRYNO,
        d.ENTRYDT,
        d.STATUS,
        this.cleanPartyName(d.PARTYNAME),
        d.CHEQUETYPE || '',
        d.CHEQUENO || '',
        d.CHEQUEDT || '',
        (d.CLEARANCEDATE && d.CLEARANCEDATE.formatted) || '',
        parseFloat(d.DRAMT) || 0,
        parseFloat(d.CRAMT) || 0
      ];
      row.font = { name: 'Arial', size: 9 };
      row.alignment = { wrapText: true, vertical: 'middle' };
      if (i % 2 === 1) {
        row.eachCell({ includeEmpty: true }, (cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } };
        });
      }
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        if (colNumber - 1 === debitIdx || colNumber - 1 === creditIdx) {
          cell.numFmt = '#,##0.00';
          cell.alignment = { horizontal: 'right' };
        }
      });
      rowIdx++;
    });

    workbook.xlsx.writeBuffer().then((data) => {
      const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      fs.saveAs(blob, downloadname + '.xlsx');
    });
  }

  // PARTYNAME comes through as raw HTML (rendered via [innerHTML] on screen,
  // e.g. "VISHNU ART & CRAFT [S DR.] <BR>RECD AMT 98969/-") — turn <br> into
  // a line break for a wrapped Excel cell and strip any other tags.
  private cleanPartyName(val: string): string {
    if (!val) { return ''; }
    return val
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .trim();
  }

}
