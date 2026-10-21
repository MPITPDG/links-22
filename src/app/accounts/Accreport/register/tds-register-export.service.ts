import { Injectable } from '@angular/core';
import { Workbook } from 'exceljs';
import * as fs from 'file-saver';
import { TdsRegisterLine } from './tds-register.component';

// Excel export for the TDS Payable / Receivable registers.
// Layout follows the finance team's "TDS Register" template:
//   company / period header, then per party -> per TDS head:
//   Sr. No. | Voucher No. | Voucher Date | Party Name | Account Name | TDS On | TDS % | Debit | Credit | Balance
//   with a subtotal per group, and a party-wise "TDS Summary" block at the end.
@Injectable({
    providedIn: 'root'
})
export class TdsRegisterExportService {

    private readonly thinBorder = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
    } as const;

    private readonly NUM = '#,##0.00';
    private readonly COLS = 10;

    export(meta: any, lines: TdsRegisterLine[], summary: any[], downloadname: string) {

        const workbook = new Workbook();
        const ws = workbook.addWorksheet(meta.regType === 'P' ? 'TDS Payable Register' : 'TDS Receivable Register');

        ws.columns = [
            { width: 8 },   // Sr
            { width: 22 },  // Voucher No
            { width: 13 },  // Voucher Date
            { width: 52 },  // Party Name [PAN]
            { width: 58 },  // Account Name
            { width: 16 },  // TDS On
            { width: 9 },   // TDS %
            { width: 14 },  // Debit
            { width: 14 },  // Credit
            { width: 18 }   // Balance
        ];

        let r = 1;
        // ---- header block (rows 1-3 like the template) ----
        ws.mergeCells(r, 1, r, this.COLS);
        ws.getCell(r, 1).value = meta.company || '';
        ws.getCell(r, 1).font = { name: 'Arial', size: 12, bold: true };
        r += 2;
        ws.mergeCells(r, 1, r, this.COLS);
        ws.getCell(r, 1).value = 'TDS Register for the period From ' + meta.fromDate + ' To ' + meta.toDate
            + '   (' + meta.title + (meta.branch ? ' - ' + meta.branch : '') + ')';
        ws.getCell(r, 1).font = { name: 'Arial', size: 10, bold: true };
        r++;

        // ---- detail ----
        for (const l of lines) {
            if (l.KIND === 'party') {
                ws.mergeCells(r, 1, r, this.COLS);
                ws.getCell(r, 1).value = l.PARTYNAME + (l.PARTYPAN ? '   [PAN: ' + l.PARTYPAN + ']' : '');
                ws.getCell(r, 1).font = { name: 'Arial', size: 10, bold: true };
                ws.getCell(r, 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'DBEAFE' } };
                r++;
            }
            else if (l.KIND === 'head') {
                r++;   // blank line before each head, as in the template
                ws.mergeCells(r, 1, r, this.COLS);
                ws.getCell(r, 1).value = l.HEADNAME;
                ws.getCell(r, 1).font = { name: 'Arial', size: 10, bold: true, underline: 'single' };
                r++;
                const h = ws.getRow(r);
                h.values = ['Sr. No.', 'Voucher No.', 'Voucher Date', 'Party Name', 'Account Name', 'TDS On', 'TDS %', 'Debit', 'Credit', 'Balance'];
                h.eachCell((cell) => {
                    cell.font = { name: 'Arial', size: 9, bold: true };
                    cell.border = this.thinBorder;
                    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F1F5F9' } };
                });
                r++;
            }
            else if (l.KIND === 'row') {
                const row = ws.getRow(r);
                row.values = [
                    l.SRNO,
                    l.VNO + '-' + l.VTYPE,
                    this.toDate(l.VDATE),
                    (l.PARTYNAME || '') + (l.PARTYPAN ? '   [PAN: ' + l.PARTYPAN + ']' : ''),
                    l.HEADNAME || '',
                    l.TDSON || 0,
                    l.TDSPCT || 0,
                    l.DRAMT ? l.DRAMT : null,
                    l.CRAMT ? l.CRAMT : null,
                    l.BALTEXT
                ];
                row.font = { name: 'Arial', size: 9 };
                row.getCell(3).numFmt = 'dd-mmm-yyyy';
                row.getCell(6).numFmt = this.NUM;
                row.getCell(7).numFmt = '0.00';
                row.getCell(8).numFmt = this.NUM;
                row.getCell(9).numFmt = this.NUM;
                row.getCell(10).alignment = { horizontal: 'right' };
                r++;
            }
            else if (l.KIND === 'subtotal') {
                const row = ws.getRow(r);
                row.values = ['', '', '', '', '', l.TDSON || 0, '', l.DRAMT || 0, l.CRAMT || 0, l.BALTEXT];
                row.font = { name: 'Arial', size: 9, bold: true };
                for (const c of [6, 8, 9]) { row.getCell(c).numFmt = this.NUM; }
                row.getCell(10).alignment = { horizontal: 'right' };
                row.eachCell({ includeEmpty: true }, (cell, col) => {
                    if (col >= 6) { cell.border = { top: { style: 'thin' }, bottom: { style: 'double' } }; }
                });
                r++;
            }
        }

        // ---- summary block ----
        r++;
        ws.mergeCells(r, 1, r, this.COLS);
        ws.getCell(r, 1).value = 'TDS Summary';
        ws.getCell(r, 1).font = { name: 'Arial', size: 11, bold: true };
        r++;
        const sh = ws.getRow(r);
        sh.values = ['Account', '', '', '', '', 'TDS ON', '', '', '', 'TDS Amount'];
        ws.mergeCells(r, 1, r, 5);
        sh.eachCell({ includeEmpty: true }, (cell) => {
            cell.font = { name: 'Arial', size: 9, bold: true };
            cell.border = this.thinBorder;
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F1F5F9' } };
        });
        sh.getCell(6).alignment = { horizontal: 'center' };
        sh.getCell(10).alignment = { horizontal: 'center' };
        r++;
        let sOn = 0;
        for (const s of summary) {
            const row = ws.getRow(r);
            row.values = [s.PARTYNAME, '', '', '', '', Number(s.TDSON) || 0, '', '', '', s.AMTTEXT];
            ws.mergeCells(r, 1, r, 5);
            row.font = { name: 'Arial', size: 9 };
            row.getCell(6).numFmt = this.NUM;
            row.getCell(10).alignment = { horizontal: 'right' };
            sOn += Number(s.TDSON) || 0;
            r++;
        }
        const tot = ws.getRow(r);
        tot.values = ['***  Total  ***', '', '', '', '', sOn, '', meta.totDr, meta.totCr, meta.totBalText];
        ws.mergeCells(r, 1, r, 5);
        tot.font = { name: 'Arial', size: 9, bold: true };
        for (const c of [6, 8, 9]) { tot.getCell(c).numFmt = this.NUM; }
        tot.getCell(10).alignment = { horizontal: 'right' };
        tot.eachCell({ includeEmpty: true }, (cell) => {
            cell.border = { top: { style: 'thin' }, bottom: { style: 'double' } };
        });

        ws.views = [{ state: 'frozen', ySplit: 3 }];

        workbook.xlsx.writeBuffer().then((data) => {
            const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            fs.saveAs(blob, downloadname + '.xlsx');
        });
    }

    /* voucher dates arrive as dd/MM/yyyy strings */
    private toDate(s: string): Date | string {
        if (!s) { return ''; }
        const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s);
        if (!m) { return s; }
        return new Date(Date.UTC(Number(m[3]), Number(m[2]) - 1, Number(m[1])));
    }
}
