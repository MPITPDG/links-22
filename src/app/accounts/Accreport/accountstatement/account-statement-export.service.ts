import { Injectable } from '@angular/core';
import { Workbook, Worksheet } from 'exceljs';
import * as fs from 'file-saver';

/*  Excel export of Account Statement > Search, "Export To Excel" with advance.
    Follows the .NET page Links_V4 UI\Accounts\frm_Acc_Rpt_ClientOutstanding_ToExcel_WithAdvance_AllCity.aspx(.vb):
      lines :  <company>
               Account Statement All with All Branch From <from> To <to>
               <client name>
               Opening : <amount> Dr|Cr
               Current Total : <debit> Dr   <credit> Cr
               Closing : <amount> Dr|Cr
               Advance : <advance credit>
      grid 1:  (type) | Number | Date | Particulars | Debit | Credit
               Number = transaction code, Date = DATE1, Particulars = narration + customer + supplier + account name,
               Debit / Credit formatted #,##0.00
      "Advance" (bold), then grid 2: (type) | Number | Particulars | Amount
      look  :  DataGrid - black header with white bold Arial 10, Arial 8 rows, every other row WhiteSmoke, vertical grid lines.
    The stored procedure prefixes the numbers with an apostrophe (so Excel keeps them as text); here it is dropped and the cell is text. */
@Injectable({
    providedIn: 'root'
})
export class AccountStatementExportService {

    private readonly GRID = '999999';
    private readonly ARIAL = 'Arial';

    exportWithAdvance(meta: { company: string, from: string, to: string, clientName: string, title?: string, companyLast?: boolean, font?: { name: string, size: number } },
        rows: any[], bal: any, adv: any, advRows: any[], downloadname: string) {

        const workbook = new Workbook()
        const ws = workbook.addWorksheet(this.sheetName(downloadname))

        /* ---- header lines (the .NET page writes them as text above the grid) ---- */
        let r = 1
        const line = (text: string, bold?: boolean) => {
            const c = ws.getRow(r).getCell(1)
            c.value = text
            c.font = { name: (meta.font && meta.font.name) || this.ARIAL, size: (meta.font && meta.font.size) || 10, bold: !!bold }
            r++
        }
        if (!meta.companyLast) { line(meta.company) }
        line((meta.title || 'Account Statement All with All Branch') + ' From ' + meta.from + ' To ' + meta.to)
        line(meta.clientName)
        if (meta.companyLast) { line(meta.company) }
        line('Opening : ' + this.drcr(bal && bal.OPBAL, 'Dr', 'Cr'))
        line('Current Total : ' + this.tldr(bal && bal.TLDR) + '    ' + this.tlcr(bal && bal.TLCR))
        line('Closing : ' + this.drcr(bal && bal.CLBAL, 'Dr', 'Cr'))
        line('Advance : ' + this.advAmount(adv && adv.ADVTOTALCR))

        /* ---- grid 1: the statement ---- */
        const cols1: GridCol[] = [
            { header: '', get: x => this.val(x, 'transtype'), align: 'left', width: 6 },
            { header: 'Number', get: x => this.text(x, 'transcode'), align: 'left' },
            { header: 'Date', get: x => this.val(x, 'date1') || this.val(x, 'transdate'), align: 'left', width: 12 },
            { header: 'Particulars', get: x => this.particulars(x, true), align: 'left' },
            { header: 'Debit', get: x => this.amt(x, 'dramt'), align: 'right', numFmt: '#,##0.00', width: 14 },
            { header: 'Credit', get: x => this.amt(x, 'cramt'), align: 'right', numFmt: '#,##0.00', width: 14 }
        ]
        r = this.grid(ws, r, cols1, rows)

        /* ---- "Advance" + grid 2 ---- */
        r++                                                              // the .NET page starts "Advance" on a new line after the grid
        line('Advance ', true)
        const cols2: GridCol[] = [
            { header: '', get: x => this.val(x, 'transtype'), align: 'left', width: 6 },
            { header: 'Number', get: x => this.text(x, 'transcode'), align: 'left' },
            { header: 'Particulars', get: x => this.particulars(x, false), align: 'left' },
            { header: 'Amount', get: x => this.amt(x, 'cramt'), align: 'right', numFmt: '#,##0.00', width: 14 }
        ]
        this.grid(ws, r, cols2, advRows || [])

        workbook.xlsx.writeBuffer().then((data) => {
            const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
            fs.saveAs(blob, downloadname + '.xlsx')
        })
    }

    /* ---------------- grid (DataGrid look) ---------------- */
    private grid(ws: Worksheet, startRow: number, cols: GridCol[], rows: any[]): number {
        const line: any = { style: 'thin', color: { argb: 'FF' + this.GRID } }
        let r = startRow
        const h = ws.getRow(r)
        cols.forEach((c, i) => {
            const cell = h.getCell(i + 1)
            cell.value = c.header === '' ? null : c.header
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
                const v = c.get(row)
                cell.value = v === '' || v === null || v === undefined ? null : v
                cell.font = { name: this.ARIAL, size: 8 }
                cell.alignment = { horizontal: c.align || 'left', vertical: 'top' }
                if (c.numFmt) { cell.numFmt = c.numFmt }
                if (idx % 2 === 1) { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } } }
                cell.border = { left: line, right: line, bottom: idx === rows.length - 1 ? line : undefined }
            })
            r++
        })
        /* widths: the widest of each column over both grids (the second grid shares columns A-D with the first) */
        cols.forEach((c, i) => {
            const col = ws.getColumn(i + 1)
            let max = c.width ? c.width - 2 : (c.header + '').length
            rows.forEach(row => { const v = c.get(row); const len = (v === null || v === undefined ? '' : String(v)).length; if (len > max) { max = len } })
            const w = Math.min(Math.max(max + 2, c.width || 10), 70)
            col.width = Math.max(col.width || 0, w)
        })
        return r
    }

    /* ---------------- text of the balance lines (as the .NET code builds them) ---------------- */
    private n(x: any): number { const v = parseFloat(x); return isNaN(v) ? 0 : v }
    private two(x: number): string { return Math.abs(x).toFixed(2) }
    /* OPBAL / CLBAL: > 0 -> "<amount> Dr", 0 -> "", < 0 -> "<amount> Cr" */
    private drcr(x: any, dr: string, cr: string): string {
        const v = this.n(x)
        return v > 0 ? this.two(v) + ' ' + dr : (v === 0 ? '' : this.two(v) + ' ' + cr)
    }
    /* TLDR: > 0 -> "<amount> Dr", 0 -> "", < 0 -> "<amount> Dr" */
    private tldr(x: any): string {
        const v = this.n(x)
        return v === 0 ? '' : this.two(v) + ' Dr'
    }
    /* TLCR: > 0 -> "<amount> Cr", 0 -> "", < 0 -> "<amount>" (the .NET page adds no suffix here) */
    private tlcr(x: any): string {
        const v = this.n(x)
        return v > 0 ? this.two(v) + ' Cr' : (v === 0 ? '' : this.two(v))
    }
    /* advance total: #,##0.00, blank when 0 */
    private advAmount(x: any): string {
        const v = this.n(x)
        return v === 0 ? '' : Math.abs(v).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    }

    /* ---------------- helpers ---------------- */
    private val(row: any, name: string): any {
        if (!row) { return '' }
        const k = name.toLowerCase()
        for (const key of Object.keys(row)) { if (key.toLowerCase() === k) { return row[key] === null || row[key] === undefined ? '' : row[key] } }
        return ''
    }
    private text(row: any, name: string): string {
        const s = this.val(row, name)
        return (typeof s === 'string' ? s.replace(/^'(?=\d)/, '') : s + '').trim()
    }
    /* statement: narration, customer, supplier and account name side by side; advance: customer, supplier, account name */
    private particulars(row: any, withNarration: boolean): string {
        const parts = (withNarration ? [this.val(row, 'narr')] : []).concat([this.val(row, 'exp_sname'), this.val(row, 'sup_sname'), this.val(row, 'acctname')])
        /* the .NET file is HTML, where runs of spaces show as one space */
        return parts.map(p => (p === null || p === undefined ? '' : (p + '').replace(/^'(?=\d)/, '').replace(/\s+/g, ' ').trim())).filter(p => p !== '').join(' ')
    }
    private amt(row: any, name: string): any {
        const v = this.val(row, name)
        return v === '' ? null : this.n(v)
    }
    /* Excel sheet names are at most 31 characters and cannot contain  \ / ? * [ ] : */
    private sheetName(name: string): string {
        const s = (name || '').replace(/[\\\/\?\*\[\]:]/g, '').trim().substring(0, 31)
        return s === '' ? 'Sheet1' : s
    }
}

interface GridCol {
    header: string;
    get: (row: any) => any;
    align?: 'left' | 'right' | 'center';
    numFmt?: string;
    width?: number;
}
