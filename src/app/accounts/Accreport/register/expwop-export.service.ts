import { Injectable } from '@angular/core';
import { Workbook } from 'exceljs';
import * as fs from 'file-saver';

/* Excel export for the EXPWOP register (foreign-currency invoices + credit notes with receipt details).
   Workbook:
     INV      - invoice rows (Table from USP_Acc_Rpt_EXPWOP_Register)
     CN       - credit-note rows (Table1)
     Summary  - per-currency totals (invoiced / received / outstanding, credit notes / adjusted)
   Users get frozen header rows, auto-filter, number formats, alternate shading per document,
   document number only on the first receipt row, and totals that count each document once.      */
@Injectable({
    providedIn: 'root'
})
export class ExpwopExportService {

    private readonly thin = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } } as const;
    private readonly NUM = '#,##0.00';
    private readonly RATE = '#,##0.0000';

    export(meta: { company: string; fromDate: string; toDate: string; branch?: string },
           invRows: any[], cnRows: any[], downloadname: string) {

        const wb = new Workbook();
        const invTot = this.docSheet(wb, 'INV', meta, 'EXPWOP Register - Foreign Currency Invoices', invRows, 'Inv. No', 'Recd.', 'Amt in INR');
        const cnTot = this.docSheet(wb, 'CN', meta, 'EXPWOP Register - Foreign Currency Credit Notes', cnRows, 'CN No', 'Adj.', 'Amt in INR');
        this.summarySheet(wb, meta, invTot, cnTot);

        wb.xlsx.writeBuffer().then((data) => {
            const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            fs.saveAs(blob, downloadname + '.xlsx');
        });
    }

    /* one document sheet; returns per-currency totals for the summary */
    private docSheet(wb: Workbook, name: string, meta: any, title: string, rows: any[],
                     docCol: string, recPrefix: string, amtCol: string): { [cur: string]: { docs: number; amt: number; recd: number } } {

        const ws = wb.addWorksheet(name, { views: [{ state: 'frozen', ySplit: 4 }] });
        const headers: string[] = rows.length > 0 ? Object.keys(rows[0]) : [];
        const totals: { [cur: string]: { docs: number; amt: number; recd: number } } = {};

        ws.getCell('A1').value = meta.company;
        ws.getCell('A1').font = { name: 'Arial', size: 12, bold: true };
        ws.getCell('A2').value = title + '  |  From ' + meta.fromDate + ' To ' + meta.toDate + (meta.branch ? '  |  ' + meta.branch : '');
        ws.getCell('A2').font = { name: 'Arial', size: 10, bold: true };
        ws.getCell('A3').value = rows.length === 0 ? 'No records for this period.' : (rows.length + ' rows');
        ws.getCell('A3').font = { name: 'Arial', size: 9, italic: true, color: { argb: '64748B' } };

        if (headers.length === 0) { return totals; }

        const hr = ws.getRow(4);
        hr.values = headers;
        hr.height = 30;
        hr.eachCell((cell) => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1F3864' } };
            cell.font = { name: 'Arial', bold: true, color: { argb: 'FFFFFF' }, size: 10 };
            cell.border = this.thin;
            cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        });

        const isNum = (h: string) => h === 'Curr.' || h === recPrefix + ' Curr.' || h.indexOf('Amt in INR') >= 0;
        const isRate = (h: string) => h.indexOf('Ex. Rate') >= 0;
        const isRecCol = (h: string) => h.indexOf(recPrefix) === 0 || ['Voucher No', 'Bill No', 'Cheque/Ref No', 'Cheque Date', 'Bank Ref No', 'Bank', 'Narration'].indexOf(h) >= 0;
        const curIdx = headers.indexOf('Curr. In word');
        const amtIdx = headers.indexOf(amtCol);
        const recAmtIdx = headers.indexOf(recPrefix + ' Amt in INR');
        const docIdx = headers.indexOf(docCol);

        let r = 5, prevDoc: string = null, band = false;
        let grandAmt = 0, grandRecd = 0, docCount = 0;
        for (const row of rows) {
            const vals = headers.map(h => this.clean(row[h]));
            const doc = String(vals[docIdx] || '');
            const first = doc !== prevDoc;
            if (first) { band = !band; prevDoc = doc; docCount++; }

            const xr = ws.getRow(r++);
            xr.values = vals.map((v, i) => (!first && !isRecCol(headers[i])) ? null : v);
            xr.font = { name: 'Arial', size: 9 };
            xr.eachCell({ includeEmpty: true }, (cell, col) => {
                const h = headers[col - 1];
                cell.border = this.thin;
                if (band) { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F3F6FB' } }; }
                if (isNum(h)) { cell.numFmt = this.NUM; cell.alignment = { horizontal: 'right' }; }
                else if (isRate(h)) { cell.numFmt = this.RATE; cell.alignment = { horizontal: 'right' }; }
                else if (h.indexOf('Date') >= 0 || h === docCol || h === 'Voucher No' || h === 'Bill No') { cell.alignment = { horizontal: 'center' }; }
            });

            const cur = String(vals[curIdx] || '').trim() || '(none)';
            if (!totals[cur]) { totals[cur] = { docs: 0, amt: 0, recd: 0 }; }
            const amt = Number(vals[amtIdx]) || 0, recd = Number(vals[recAmtIdx]) || 0;
            if (first) { totals[cur].docs++; totals[cur].amt += amt; grandAmt += amt; }
            totals[cur].recd += recd; grandRecd += recd;
        }

        const tr = ws.getRow(r);
        tr.getCell(1).value = 'TOTAL  (' + docCount + ' ' + (name === 'CN' ? 'credit notes' : 'invoices') + ')';
        tr.getCell(amtIdx + 1).value = this.r2(grandAmt);
        tr.getCell(recAmtIdx + 1).value = this.r2(grandRecd);
        tr.font = { name: 'Arial', size: 10, bold: true };
        tr.eachCell({ includeEmpty: true }, (cell, col) => {
            cell.border = { top: { style: 'thin' }, bottom: { style: 'double' } };
            if (col === amtIdx + 1 || col === recAmtIdx + 1) { cell.numFmt = this.NUM; cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2CC' } }; }
        });

        ws.autoFilter = { from: { row: 4, column: 1 }, to: { row: Math.max(4, r - 1), column: headers.length } };
        headers.forEach((h, i) => {
            const c = ws.getColumn(i + 1);
            c.width = h === 'Party Name' ? 42 : h === 'Narration' ? 40 : h === 'Bank' ? 30 : h === 'Against Inv. No' ? 24
                : (h === docCol || h === 'Voucher No' || h === 'Bill No' || h === 'Bank Ref No') ? 20 : isNum(h) || isRate(h) ? 14 : 13;
        });
        return totals;
    }

    private summarySheet(wb: Workbook, meta: any,
                         inv: { [cur: string]: { docs: number; amt: number; recd: number } },
                         cn: { [cur: string]: { docs: number; amt: number; recd: number } }) {
        const ws = wb.addWorksheet('Summary');
        ws.getCell('A1').value = meta.company;
        ws.getCell('A1').font = { name: 'Arial', size: 12, bold: true };
        ws.getCell('A2').value = 'EXPWOP Summary  |  From ' + meta.fromDate + ' To ' + meta.toDate + (meta.branch ? '  |  ' + meta.branch : '');
        ws.getCell('A2').font = { name: 'Arial', size: 10, bold: true };

        const headers = ['Currency', 'Invoices', 'Invoiced (INR)', 'Received (INR)', 'Outstanding (INR)', 'Credit Notes', 'CN Value (INR)', 'CN Adjusted (INR)', 'Net Outstanding (INR)'];
        const hr = ws.getRow(4);
        hr.values = headers;
        hr.eachCell((cell) => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1F3864' } };
            cell.font = { name: 'Arial', bold: true, color: { argb: 'FFFFFF' }, size: 10 };
            cell.border = this.thin;
            cell.alignment = { horizontal: 'center', wrapText: true };
        });
        hr.height = 30;

        const curs = Array.from(new Set(Object.keys(inv).concat(Object.keys(cn)))).sort();
        let r = 5;
        const g = [0, 0, 0, 0, 0, 0, 0, 0];
        for (const cur of curs) {
            const i = inv[cur] || { docs: 0, amt: 0, recd: 0 }, c = cn[cur] || { docs: 0, amt: 0, recd: 0 };
            const out = i.amt - i.recd, net = out - (c.amt - c.recd);
            const vals = [cur, i.docs, this.r2(i.amt), this.r2(i.recd), this.r2(out), c.docs, this.r2(c.amt), this.r2(c.recd), this.r2(net)];
            const xr = ws.getRow(r++);
            xr.values = vals;
            xr.font = { name: 'Arial', size: 10 };
            xr.eachCell({ includeEmpty: true }, (cell, col) => { cell.border = this.thin; if (col >= 3 && col !== 6) { cell.numFmt = this.NUM; } });
            [i.docs, i.amt, i.recd, out, c.docs, c.amt, c.recd, net].forEach((v, k) => g[k] += v);
        }
        const tr = ws.getRow(r);
        tr.values = ['TOTAL', g[0], this.r2(g[1]), this.r2(g[2]), this.r2(g[3]), g[4], this.r2(g[5]), this.r2(g[6]), this.r2(g[7])];
        tr.font = { name: 'Arial', size: 10, bold: true };
        tr.eachCell({ includeEmpty: true }, (cell, col) => {
            cell.border = { top: { style: 'thin' }, bottom: { style: 'double' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2CC' } };
            if (col >= 3 && col !== 6) { cell.numFmt = this.NUM; }
        });
        ws.getCell('A' + (r + 2)).value = 'Outstanding = Invoiced - Received (INR, at invoice exchange rate). Net Outstanding also deducts credit notes not yet adjusted on a receipt.';
        ws.getCell('A' + (r + 2)).font = { name: 'Arial', size: 9, italic: true, color: { argb: '64748B' } };
        ws.columns.forEach((c, i) => { c.width = i === 0 ? 16 : 18; });
    }

    /* the proc prefixes document numbers with an apostrophe for legacy CSV exports; exceljs keeps text as text */
    private clean(v: any): any {
        if (typeof v === 'string') {
            const s = v.replace(/^'+/, '').trim();
            return s;
        }
        return v;
    }
    private r2(n: number): number { return Math.round(n * 100) / 100; }
}
