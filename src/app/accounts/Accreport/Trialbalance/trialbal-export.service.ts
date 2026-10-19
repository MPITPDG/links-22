import { Injectable } from '@angular/core';
import { Workbook } from 'exceljs';
import * as fs from 'file-saver';

/*  Excel export of the Trial Balance - Group Wise (details) report.
    Follows the .NET page Links_V4 UI\Accounts\frm_Acc_Rpt_TrialBalance_GrpWiseDtls_All_ToExcel.aspx(.vb), which does not use its DataGrid:
    it writes plain HTML.
      - title lines: "<company> - <city>", then "Trial Balance as on <date>"
        (the date is the as-on date, or today when the as-on date is today or later; the .NET page prints that line twice, here once)
      - one bordered table: the stored procedure's own column names (each followed by a space) as the header, no fill, not bold,
        Arial 10; every row 17.25pt high
      - every value goes through the number format #,##0.00 (so numeric text such as "39478.03" becomes a number),
        text stays text; empty values stay empty
    The procedure (usp_Acct_Rpt_Trialbalance_byGrpDtls) returns 9 columns:
      Group Name | ACCOUNT CODE | Particulars | OpeningDr | OpeningCr | CurrentDr | CurrentCr | ClosingDr | ClosingCr   */
@Injectable({
    providedIn: 'root'
})
export class TrialBalanceExportService {

    private readonly ARIAL = 'Arial';

    exportGroupWiseDetail(meta: { asOn: string, company: string }, rows: any[], downloadname: string) {
        const workbook = new Workbook()
        /* the .NET .xls opens in Excel with the sheet named after the file, cut to Excel's 31 character limit */
        const ws = workbook.addWorksheet(this.sheetName(downloadname))

        const names = rows.length > 0 ? Object.keys(rows[0]) : []
        const thin: any = { style: 'thin' }
        const border: any = { top: thin, left: thin, bottom: thin, right: thin }

        /* title lines */
        let r = 1
        const line = (text: string) => {
            const c = ws.getRow(r).getCell(1)
            c.value = text
            c.font = { name: this.ARIAL, size: 10 }
            r++
        }
        /* the .NET page prints the "Trial Balance as on" line twice (before and after the company); here it is shown once */
        line(meta.company)
        line('Trial Balance as on ' + this.cappedAtToday(meta.asOn))
        r++                                                           // one blank line before the table

        /* header: column names, each followed by a space, plain */
        const hdr = ws.getRow(r)
        names.forEach((n, i) => {
            const c = hdr.getCell(i + 1)
            c.value = n + ' '
            c.font = { name: this.ARIAL, size: 10 }
            c.border = border
        })
        r++

        /* rows */
        const widths: number[] = names.map(n => (n + ' ').length)
        rows.forEach(row => {
            const xr = ws.getRow(r)
            xr.height = 17.25
            names.forEach((n, i) => {
                const c = xr.getCell(i + 1)
                const v = this.cell(row[n])
                c.border = border
                c.font = { name: this.ARIAL, size: 10 }
                if (typeof v === 'number') {
                    c.value = v
                    c.numFmt = '#,##0.00'
                    widths[i] = Math.max(widths[i], this.display(v).length)
                } else if (v !== '') {
                    c.value = v
                    widths[i] = Math.max(widths[i], (v + '').length)
                }
            })
            r++
        })
        widths.forEach((w, i) => { ws.getColumn(i + 1).width = Math.min(Math.max(w + 2, 12), 60) })

        workbook.xlsx.writeBuffer().then((data) => {
            const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
            fs.saveAs(blob, downloadname + '.xlsx')
        })
    }

    /* Excel sheet names are at most 31 characters and cannot contain  \ / ? * [ ] : */
    private sheetName(name: string): string {
        const n = (name || '').replace(/[\\\/\?\*\[\]:]/g, '').trim().substring(0, 31)
        return n === '' ? 'Sheet1' : n
    }

    /* the .NET page prints today's date instead of an as-on date that is today or later */
    private cappedAtToday(asOn: string): string {
        const d = this.parse(asOn)
        const now = new Date()
        if (d && d.getTime() < new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) { return asOn }
        const mon = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][now.getMonth()]
        return ('0' + now.getDate()).slice(-2) + '-' + mon + '-' + now.getFullYear()
    }
    /* "31-Aug-2025" -> Date */
    private parse(s: string): Date | null {
        const m = /^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/.exec((s || '').trim())
        if (!m) { return null }
        const mon = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'].indexOf(m[2].toLowerCase())
        return mon < 0 ? null : new Date(+m[3], mon, +m[1])
    }

    /* numeric text -> number; other text -> text without HTML tags; null / empty -> '' */
    private cell(v: any): any {
        if (v === null || v === undefined) { return '' }
        if (typeof v === 'number') { return v }
        const s = (v + '').replace(/<[^>]*>/g, '').trim()
        if (s === '') { return '' }
        return /^-?\d+(\.\d+)?$/.test(s) ? parseFloat(s) : s
    }
    private display(n: number): string {
        return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    }
}
