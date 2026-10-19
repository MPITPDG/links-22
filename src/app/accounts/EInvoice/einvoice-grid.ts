/**
 * Presentation-only helper shared by the E-Invoice screens: client-side text filter,
 * 10-per-page pagination, CSV export and the on-page result / error notice.
 * It never touches the rows' Checked flags or the selection arrays the screens send
 * to the API; it only reads the list it is given.
 */
export interface EInvNotice {
    kind: 'ok' | 'err';
    title: string;
    text: string;
    at: Date;
}

export class EInvGrid {
    readonly pageSize = 10;
    text = '';
    page = 1;
    loading = false;
    loadError = '';
    notice: EInvNotice | null = null;

    private _src: any[] = null;
    private _len = -1;
    private _key = '';
    private _out: any[] = [];

    constructor(private source: () => any[], private keys: string[]) { }

    get all(): any[] {
        return this.source() || [];
    }

    get filtered(): any[] {
        const src = this.all;
        const key = (this.text || '').trim().toLowerCase();
        if (src !== this._src || src.length !== this._len || key !== this._key) {
            this._src = src;
            this._len = src.length;
            this._key = key;
            this._out = !key ? src.slice() : src.filter(r =>
                this.keys.some(k => String(r?.[k] ?? '').toLowerCase().indexOf(key) >= 0));
            if (this.page > this.pageCount) { this.page = 1; }
        }
        return this._out;
    }

    get checkedCount(): number {
        return this.all.filter(r => r && r.Checked).length;
    }

    onFilter() {
        this.page = 1;
    }

    clear() {
        this.text = '';
        this.page = 1;
    }

    get pageCount(): number {
        return Math.max(1, Math.ceil(this.filtered.length / this.pageSize));
    }

    get pageRows(): any[] {
        const start = (this.page - 1) * this.pageSize;
        return this.filtered.slice(start, start + this.pageSize);
    }

    get rangeStart(): number {
        return this.filtered.length ? (this.page - 1) * this.pageSize + 1 : 0;
    }

    get rangeEnd(): number {
        return Math.min(this.page * this.pageSize, this.filtered.length);
    }

    /** page numbers with 0 standing in for an ellipsis */
    get pageList(): number[] {
        const n = this.pageCount, p = this.page;
        if (n <= 7) { return Array.from({ length: n }, (_, i) => i + 1); }
        const out: number[] = [1];
        const lo = Math.max(2, p - 1), hi = Math.min(n - 1, p + 1);
        if (lo > 2) { out.push(0); }
        for (let i = lo; i <= hi; i++) { out.push(i); }
        if (hi < n - 1) { out.push(0); }
        out.push(n);
        return out;
    }

    goPage(p: number) {
        if (p >= 1 && p <= this.pageCount) { this.page = p; }
    }

    say(kind: 'ok' | 'err', title: string, text: any) {
        this.notice = { kind, title, text: (text === null || text === undefined) ? '' : String(text), at: new Date() };
    }

    /** Readable text for an HTTP / runtime error. */
    static errText(err: any): string {
        if (!err) { return 'Unknown error.'; }
        if (typeof err === 'string') { return err; }
        const e = err.error;
        if (e && typeof e === 'string') { return e; }
        if (e && e.Message) { return e.Message; }
        if (e && e.message) { return e.message; }
        if (err.status !== undefined && err.statusText) { return err.status + ' ' + err.statusText; }
        return err.message || 'Unknown error.';
    }

    exportCsv(name: string, cols: Array<[string, string]>) {
        const q = (v: any) => {
            const s = (v === null || v === undefined) ? '' : String(v);
            return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
        };
        const lines = [cols.map(c => c[0])].concat(this.filtered.map(r => cols.map(c => r?.[c[1]])));
        const csv = lines.map(l => l.map(q).join(',')).join('\r\n');
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
}
