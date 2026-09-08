import { Injectable } from '@angular/core';
import { Workbook } from 'exceljs';
import * as fs from 'file-saver';

// Excel export for the 26AS TDS Reconciliation page. One summary sheet:
// the deductor-wise comparison the grid shows, plus a totals row.
@Injectable({
    providedIn: 'root'
})
export class Tds26asExportService {

    private readonly thinBorder = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
    } as const;

    export(batchInfo: any, rows: any[], tab: string, downloadname: string) {

        const workbook = new Workbook();
        const worksheet = workbook.addWorksheet('26AS Reconciliation');

        worksheet.columns = [
            { width: 6 }, { width: 45 }, { width: 13 }, { width: 40 }, { width: 9 },
            { width: 16 }, { width: 14 }, { width: 16 }, { width: 14 }, { width: 7 }
        ];

        // TITLE
        worksheet.mergeCells(1, 1, 1, 10);
        const titleCell = worksheet.getCell('A1');
        titleCell.value = '26AS TDS Reconciliation'
            + (batchInfo ? (' - PAN ' + batchInfo.PANNO + ' - FY ' + batchInfo.FINYEAR) : '');
        titleCell.font = { name: 'Arial', size: 12, bold: true, underline: 'single' };

        worksheet.mergeCells(2, 1, 2, 10);
        worksheet.getCell('A2').value =
            (batchInfo ? ('Statement: ' + batchInfo.FILENAME + '  |  ') : '') + 'View: ' + tab;
        worksheet.getRow(2).font = { name: 'Arial', size: 10 };

        // HEADER
        const headers = ['Sr', 'Deductor (as per 26AS)', 'TAN', 'Matched Client', 'Match',
            'Amount Credited', 'TDS Deposited', 'FY Invoiced', 'Difference', 'Txns'];
        const headerRow = worksheet.getRow(4);
        headerRow.values = headers;
        headerRow.eachCell((cell) => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '2563EB' }, bgColor: { argb: '' } };
            cell.font = { name: 'Arial', bold: true, color: { argb: 'FFFFFF' }, size: 10 };
            cell.border = this.thinBorder;
            cell.alignment = { vertical: 'middle', wrapText: true };
        });

        // DATA
        let totAmt = 0, totTds = 0, totInv = 0;
        let r = 5;
        for (const row of rows) {
            const matched = !!row.MATCHTYPE;
            const excelRow = worksheet.getRow(r++);
            excelRow.values = [
                Number(row.SRNO) || row.SRNO,
                row.DEDUCTOR_NAME,
                row.TAN,
                matched ? (row.CLIENT_NAME || row.EXP_CODE) : 'UNMATCHED',
                row.MATCHTYPE || '',
                Number(row.TOT_AMTCREDITED) || 0,
                Number(row.TOT_TDSDEPOSITED) || 0,
                matched ? (Number(row.FY_INVOICED) || 0) : null,
                matched ? (Number(row.DIFFERENCE) || 0) : null,
                Number(row.TXNCOUNT) || 0
            ];
            excelRow.font = { name: 'Arial', size: 10 };
            excelRow.eachCell({ includeEmpty: false }, (cell, col) => {
                cell.border = this.thinBorder;
                if (col >= 6 && col <= 9) { cell.numFmt = '#,##0.00'; }
            });
            totAmt += Number(row.TOT_AMTCREDITED) || 0;
            totTds += Number(row.TOT_TDSDEPOSITED) || 0;
            totInv += matched ? (Number(row.FY_INVOICED) || 0) : 0;
        }

        // TOTALS
        const totalRow = worksheet.getRow(r);
        totalRow.values = ['', 'TOTAL', '', '', '', totAmt, totTds, totInv, '', ''];
        totalRow.font = { name: 'Arial', size: 10, bold: true };
        totalRow.eachCell({ includeEmpty: false }, (cell, col) => {
            cell.border = this.thinBorder;
            if (col >= 6 && col <= 8) { cell.numFmt = '#,##0.00'; }
        });

        workbook.xlsx.writeBuffer().then((data) => {
            const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            fs.saveAs(blob, downloadname + '.xlsx');
        });
    }
}
