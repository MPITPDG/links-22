import { Injectable } from '@angular/core';
import { Workbook, Worksheet } from 'exceljs';
import * as fs from 'file-saver';

/*  Excel export for the Register menu (Invoice, CashBook, Purchase, Brokerage, Storage, CreditNote, Invoice detail).
    Each method reproduces the Excel the .NET page produced (Links_V4 UI\Accounts\frm_Acc_Rpt_*_Register*_XL.aspx):
      - the same title lines ("<Report> Register From <from> To <to>", then "<company> - <city>")
      - the same visible columns, in the same order, with the same header text (HeaderText of the .NET DataGrid)
      - hidden columns stay hidden (Sup_Code, exp_Code, INV_CLIENT)
      - DataGrid look: black header with white bold Arial 10, Arial 8 rows, alternate rows WhiteSmoke, vertical grid lines
      - the "TOTAL AMOUNT :" row sits under the last two columns, as the .NET total grid does
      - CashBook: the plain bordered table with the Cash / Bank OP Balance lines above it
    The stored procedures prefix document numbers with an apostrophe (so Excel keeps them as text); here the
    apostrophe is dropped and the cell is written as text.                                                       */

interface GridCol {
    header: string;
    field?: string;                    // SP column name (case-insensitive)
    get?: (row: any) => any;           // or a getter
    align?: 'left' | 'right' | 'center';
    numFmt?: string;
    bold?: boolean;
    wrap?: boolean;
    width?: number;
}

@Injectable({
    providedIn: 'root'
})
export class RegisterExportService {

    private readonly GRID = '999999';
    private readonly ARIAL = 'Arial';

    /* ------------------------------------------------------------------ reports ------------------------------------------------------------------ */

    /* frm_Acc_Rpt_Invoice_Register_XL: Invoice No | Invoice Date | Client | Job No (all jobs of the invoice) | Total Amount */
    exportInvoice(meta: any, rows: any[], jobs: { [invNo: string]: string[] }, downloadname: string) {
        const cols: GridCol[] = [
            { header: 'Invoice No', get: r => this.text(r, 'inv_no'), align: 'left' },
            { header: 'Invoice Date', field: 'inv_date', align: 'left', width: 16 },
            { header: 'Client', field: 'clientname', align: 'left' },
            { header: 'Job No', get: r => (jobs[this.text(r, 'inv_no')] || []).join('\n'), align: 'left', wrap: true },
            { header: 'Total Amount', get: r => this.num(this.val(r, 'totalamt')), align: 'right', numFmt: '0.00', width: 16 }
        ];
        this.save(downloadname, ws => {
            const r = this.titles(ws, meta.header, meta.company)
            this.grid(ws, r, cols, rows)
        })
    }

    /* frm_Acc_Rpt_Purchase_Register_XL: Pur No | Pur Date | Supplier Name | Suppl. Invno | Suppl. Invdt | Job No | Amount, then the total row */
    exportPurchase(meta: any, rows: any[], total: any, downloadname: string) {
        const cols: GridCol[] = [
            { header: 'Pur No', get: r => this.text(r, 'entryno'), align: 'left' },
            { header: 'Pur Date ', field: 'entrydt', align: 'left' },
            { header: 'Supplier Name', field: 'sup_name', align: 'left' },
            { header: 'Suppl. Invno', get: r => this.text(r, 'sup_invno'), align: 'left' },
            { header: 'Suppl. Invdt', field: 'sup_invdt', align: 'left' },
            { header: 'Job No', get: r => this.text(r, 'jobno'), align: 'left' },
            { header: 'Amount', get: r => this.num(this.val(r, 'amount')), align: 'right', numFmt: '0.00', bold: true }
        ]
        this.save(downloadname, ws => {
            /* the live .NET purchase export has no title lines (the page calls Response.Clear() after writing them) and plain
               0.00 row amounts; only the total carries thousands separators */
            const end = this.grid(ws, 1, cols, rows)
            this.totalRow(ws, end, cols.length, this.val(total, 'header'), this.num(this.val(total, 'total')), '#,##0.00')
        }, downloadname)                                  // sheet is named like the file, e.g. PDG_Accounts_Purchase_Register
    }

    /* frm_Acc_Rpt_Brokerage_Register_XL: Brokerage No | Brok Date | Job No | Vsl Name | VslVoy No | Amount, then the total row */
    exportBrokerage(meta: any, rows: any[], total: any, downloadname: string) {
        const cols: GridCol[] = [
            { header: 'Brokerage No', get: r => this.text(r, 'brokno'), align: 'left' },
            { header: 'Brok Date ', field: 'brokdt', align: 'left' },
            { header: 'Job No ', get: r => this.text(r, 'jobno'), align: 'left' },
            { header: 'Vsl Name', field: 'vslname', align: 'left' },
            { header: 'VslVoy No', field: 'vslvoyno', align: 'left' },
            { header: 'Amount', get: r => this.num(this.val(r, 'amount')), align: 'right', numFmt: '0.00', bold: true }
        ]
        this.save(downloadname, ws => {
            const r = this.titles(ws, meta.header, meta.company)
            const end = this.grid(ws, r, cols, rows)
            this.totalRow(ws, end, cols.length, this.val(total, 'header'), this.num(this.val(total, 'total')), '0.00')
        }, downloadname)                                  // sheet is named like the file, e.g. PDG_Accounts_Brokerage_Register
    }

    /* frm_Acc_Rpt_storage_Register_XL: Entry No | Entry Date | Client Name | Good Desc | Amount, then the total row */
    exportStorage(meta: any, rows: any[], total: any, downloadname: string) {
        const cols: GridCol[] = [
            { header: 'Entry No', get: r => this.text(r, 'entryno'), align: 'left' },
            { header: 'Entry Date ', field: 'entrydt', align: 'left' },
            { header: 'Client Name ', field: 'exp_name', align: 'left' },
            { header: 'Good Desc', field: 'gooddesc', align: 'left' },
            { header: 'Amount', get: r => this.num(this.val(r, 'amount')), align: 'right', numFmt: '0.00', bold: true }
        ]
        this.save(downloadname, ws => {
            const r = this.titles(ws, meta.header, meta.company)
            const end = this.grid(ws, r, cols, rows)
            this.totalRow(ws, end, cols.length, this.val(total, 'header'), this.num(this.val(total, 'total')), '0.00')
        }, downloadname)                                  // sheet is named like the file, e.g. PDG_Accounts_Storage_Register
    }

    /* frm_Acc_Rpt_Invoice_Register_ActDetail_XL and frm_Acc_Rpt_CN_Register_AcctDetail_XL: the .NET DataGrid auto-generates
       its columns, so every column of the stored procedure is shown with its own name. */
    exportAutoGrid(meta: any, rows: any[], downloadname: string) {
        const names = rows.length > 0 ? Object.keys(rows[0]) : []
        const cols: GridCol[] = names.map(n => {
            const isNum = rows.some(r => typeof r[n] === 'number')
            return {
                header: n,
                get: (r: any) => this.cell(r[n]),
                align: isNum ? 'right' : 'left',
                numFmt: isNum ? '0.00' : undefined
            } as GridCol
        })
        this.save(downloadname, ws => {
            const r = this.titles(ws, meta.header, meta.company)
            this.grid(ws, r, cols, rows)
        })
    }

    /* frm_Acc_Rpt_CashBook_Register_XL: plain bordered table of the stored procedure's own column names, preceded by
       the Cash OP Balance / Bank OP Balance lines. Dates are dd-mmm-yyyy, amounts #,##0.00. */
    exportCashBook(meta: any, cashOp: any, bankOp: any, rows: any[], downloadname: string) {
        this.save(downloadname, ws => {
            let r = this.titles(ws, meta.header, meta.company)
            r = this.line(ws, r, 'Cash OP Balance ' + this.stripTags(cashOp), this.hasBold(cashOp))
            r = this.line(ws, r, 'Bank OP Balance ' + this.stripTags(bankOp), this.hasBold(bankOp))
            r = this.line(ws, r, '')

            const names = rows.length > 0 ? Object.keys(rows[0]) : []
            const thin: any = { style: 'thin' }
            const border: any = { top: thin, left: thin, bottom: thin, right: thin }
            const hdr = ws.getRow(r)
            names.forEach((n, i) => {
                const c = hdr.getCell(i + 1)
                c.value = n + ' '
                c.font = { name: this.ARIAL, size: 10 }
                c.border = border
            })
            r++
            for (const row of rows) {
                const xr = ws.getRow(r)
                names.forEach((n, i) => {
                    const c = xr.getCell(i + 1)
                    const raw = row[n]
                    c.border = border
                    c.font = { name: this.ARIAL, size: 10 }
                    if (i === 1) {                                           // entry date column
                        const d = this.parseDate(raw)
                        c.value = d ? d : this.cell(raw)
                        if (d) { c.numFmt = 'dd-mmm-yyyy' }
                    } else if (typeof raw === 'number') {
                        c.value = raw
                        c.numFmt = '#,##0.00'
                    } else {
                        const t = this.stripTags(this.cell(raw))
                        c.value = t
                        if (this.hasBold(raw)) { c.font = { name: this.ARIAL, size: 10, bold: true } }
                    }
                })
                r++
            }
            this.widths(ws, names, rows, 12, 55)
        })
    }

    /* ------------------------------------------------------------------ building blocks ------------------------------------------------------------------ */

    /* Excel sheet names are at most 31 characters and cannot contain  \ / ? * [ ] : */
    private sheetName(name: string): string {
        const n = (name || '').replace(/[\\\/\?\*\[\]:]/g, '').trim().substring(0, 31)
        return n === '' ? 'Sheet1' : n
    }

    private save(downloadname: string, build: (ws: Worksheet) => void, sheet?: string) {
        const workbook = new Workbook()
        const ws = workbook.addWorksheet(sheet ? this.sheetName(sheet) : 'Sheet1')
        build(ws)
        workbook.xlsx.writeBuffer().then((data) => {
            const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
            fs.saveAs(blob, downloadname + '.xlsx')
        })
    }

    /* the .NET page writes the header line, then the company line; returns the next free row (after one blank row) */
    private titles(ws: Worksheet, header: string, company: string): number {
        let r = this.line(ws, 1, header)
        r = this.line(ws, r, company)
        return this.line(ws, r, '')
    }
    private line(ws: Worksheet, r: number, text: string, bold?: boolean): number {
        const c = ws.getRow(r).getCell(1)
        c.value = text
        c.font = { name: this.ARIAL, size: 10, bold: !!bold }
        return r + 1
    }

    /* DataGrid look. Returns the row after the last data row. */
    private grid(ws: Worksheet, startRow: number, cols: GridCol[], rows: any[]): number {
        const line: any = { style: 'thin', color: { argb: 'FF' + this.GRID } }
        let r = startRow

        const h = ws.getRow(r)
        cols.forEach((c, i) => {
            const cell = h.getCell(i + 1)
            cell.value = c.header
            cell.font = { name: this.ARIAL, size: 10, bold: true, color: { argb: 'FFFFFFFF' } }
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF000000' } }
            cell.alignment = { horizontal: c.align || 'left', vertical: 'top' }
            cell.border = { top: line, left: line, bottom: line, right: line }
        })
        r++

        rows.forEach((row, idx) => {
            const xr = ws.getRow(r)
            cols.forEach((c, i) => {
                const cell = xr.getCell(i + 1)
                const v = c.get ? c.get(row) : this.cell(this.val(row, c.field))
                cell.value = v === '' ? null : v
                cell.font = { name: this.ARIAL, size: 8, bold: !!c.bold }
                cell.alignment = { horizontal: c.align || 'left', vertical: 'top', wrapText: !!c.wrap }
                if (c.numFmt) { cell.numFmt = c.numFmt }
                if (idx % 2 === 1) { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } } }
                cell.border = { left: line, right: line, bottom: idx === rows.length - 1 ? line : undefined }
            })
            r++
        })

        cols.forEach((c, i) => {
            const col = ws.getColumn(i + 1)
            if (c.width) { col.width = c.width; return }
            let max = (c.header + '').length
            rows.forEach(row => {
                const v = c.get ? c.get(row) : this.val(row, c.field)
                String(v === null || v === undefined ? '' : v).split('\n').forEach(p => { if (p.length > max) { max = p.length } })
            })
            col.width = Math.min(Math.max(max + 2, 10), 60)
        })
        return r
    }

    /* the .NET total grid (no header row): blank cells, "TOTAL AMOUNT :" right aligned in the second last column, the total in the last */
    private totalRow(ws: Worksheet, r: number, colCount: number, label: any, total: number, numFmt: string) {
        const line: any = { style: 'thin', color: { argb: 'FF' + this.GRID } }
        const row = ws.getRow(r)
        for (let i = 1; i <= colCount; i++) {
            const c = row.getCell(i)
            c.font = { name: this.ARIAL, size: 8, bold: true }
            c.border = { left: line, right: line, top: line, bottom: line }
        }
        const lc = row.getCell(colCount - 1)
        lc.value = (label + '').trim() === '' ? 'TOTAL AMOUNT :' : label
        lc.alignment = { horizontal: 'right', vertical: 'top' }
        const vc = row.getCell(colCount)
        vc.value = total
        vc.numFmt = numFmt
        vc.alignment = { horizontal: 'left', vertical: 'top' }
    }

    /* column widths from the header and the data only (the title lines above the table do not count) */
    private widths(ws: Worksheet, names: string[], rows: any[], min: number, max: number) {
        names.forEach((n, i) => {
            let m = (n + ' ').length
            rows.forEach(row => {
                const len = this.stripTags(this.cell(row[n])).length
                if (len > m) { m = len }
            })
            ws.getColumn(i + 1).width = Math.min(Math.max(m + 2, min), max)
        })
    }

    /* ------------------------------------------------------------------ helpers ------------------------------------------------------------------ */

    /* SP column names are matched case-insensitively */
    private val(row: any, name: string): any {
        if (!row || !name) { return '' }
        const n = name.toLowerCase()
        for (const k of Object.keys(row)) {
            if (k.toLowerCase() === n) { return row[k] === null || row[k] === undefined ? '' : row[k] }
        }
        return ''
    }
    /* text value of a document number: the procedures prefix it with an apostrophe so Excel keeps it as text */
    private text(row: any, name: string): string {
        return this.cell(this.val(row, name)) + ''
    }
    private cell(v: any): any {
        if (v === null || v === undefined) { return '' }
        if (typeof v === 'string') { return v.replace(/^'(?=\d|$)/, '').trim() }
        return v
    }
    private num(x: any): number {
        const n = parseFloat(x)
        return isNaN(n) ? 0 : Math.round(n * 100) / 100
    }
    private stripTags(v: any): string {
        return (v === null || v === undefined ? '' : v + '').replace(/<[^>]*>/g, '').trim()
    }
    private hasBold(v: any): boolean {
        return /<\s*b\s*>/i.test(v === null || v === undefined ? '' : v + '')
    }
    /* "04 Aug 2025" or "04/08/2025" -> Date */
    private parseDate(v: any): Date | null {
        if (v === null || v === undefined || v === '') { return null }
        const s = (v + '').trim()
        let m = /^(\d{1,2})[ \-]([A-Za-z]{3})[a-z]*[ \-](\d{4})$/.exec(s)
        if (m) {
            const mon = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'].indexOf(m[2].toLowerCase())
            if (mon >= 0) { return new Date(Date.UTC(+m[3], mon, +m[1])) }
        }
        m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s)
        if (m) { return new Date(Date.UTC(+m[3], +m[2] - 1, +m[1])) }
        return null
    }
}
