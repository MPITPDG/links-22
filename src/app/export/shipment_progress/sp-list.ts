/**
 * Shipment Progress list helpers: the vessel-search pager (10 rows a page) and
 * the client-side CSV export used by every list in this package. Presentation
 * only - no API calls, no change to the rows handed in.
 */
export class SpPager {
    readonly pageSize: number = 10;
    page: number = 1;

    /** Rows the pager slices; set by the owning component. */
    constructor(private source: () => any[]) { }

    get total(): number { return (this.source() || []).length; }

    get pageCount(): number { return Math.max(1, Math.ceil(this.total / this.pageSize)); }

    get rows(): any[] {
        const start = (this.page - 1) * this.pageSize;
        return (this.source() || []).slice(start, start + this.pageSize);
    }

    /** Index of the first row on this page within the full list. */
    get offset(): number { return (this.page - 1) * this.pageSize; }

    get rangeStart(): number { return this.total ? this.offset + 1 : 0; }

    get rangeEnd(): number { return Math.min(this.page * this.pageSize, this.total); }

    /** Page numbers with 0 standing in for an ellipsis. */
    get pageList(): number[] {
        const n = this.pageCount, p = Math.min(this.page, n);
        if (n <= 7) { return Array.from({ length: n }, (_, i) => i + 1); }
        const out: number[] = [1];
        const lo = Math.max(2, p - 1), hi = Math.min(n - 1, p + 1);
        if (lo > 2) { out.push(0); }
        for (let i = lo; i <= hi; i++) { out.push(i); }
        if (hi < n - 1) { out.push(0); }
        out.push(n);
        return out;
    }

    go(p: number) {
        if (p >= 1 && p <= this.pageCount) { this.page = p; }
    }

    /** Back to page 1, or clamp after the list shrank. */
    reset() { this.page = 1; }

    clamp() { if (this.page > this.pageCount) { this.page = this.pageCount; } }
}

/** UTF-8 BOM, quoted CSV of the given rows, saved as `<name>-YYYYMMDD.csv`. */
export function spExportCsv(name: string, head: string[], rows: any[][]) {
    const q = (v: any) => {
        const s = (v === null || v === undefined) ? '' : String(v);
        return '"' + s.replace(/"/g, '""') + '"';
    };
    const csv = [head, ...rows].map(line => line.map(q).join(',')).join('\r\n');
    const d = new Date();
    const stamp = d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name + '-' + stamp + '.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 0);
}

/** Case-insensitive "any of these fields contains the text" filter. */
export function spMatches(row: any, text: string, fields: string[]): boolean {
    const t = (text || '').trim().toLowerCase();
    if (!t) { return true; }
    return fields.some(f => String(row == null || row[f] == null ? '' : row[f]).toLowerCase().indexOf(t) >= 0);
}
