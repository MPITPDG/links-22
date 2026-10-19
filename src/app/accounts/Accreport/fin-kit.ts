/* Finance page kit helpers (presentation only).
 * Shared by the India Accounts reports / lists that were moved onto the
 * import-page.css design: a client-side 10/page pager, a CSV exporter,
 * period presets that produce my-date-picker models, and bar-chart geometry
 * for the inline SVG charts. Nothing here touches an API payload. */

/** Client-side pager (10/page by default), same behaviour as the import kit pagers. */
export class FinPager<T = any> {
    rows: T[] = [];
    page = 1;
    constructor(public size = 10) { }
    set(rows: T[] | null | undefined) { this.rows = Array.isArray(rows) ? rows : []; this.page = 1; }
    get total() { return Math.max(1, Math.ceil(this.rows.length / this.size)); }
    get paged(): T[] { const s = (this.page - 1) * this.size; return this.rows.slice(s, s + this.size); }
    get from() { return this.rows.length ? (this.page - 1) * this.size + 1 : 0; }
    get to() { return Math.min(this.page * this.size, this.rows.length); }
    get numbers(): (number | '...')[] {
        const total = this.total, cur = this.page;
        if (total <= 7) { return Array.from({ length: total }, (_, i) => i + 1); }
        const list = Array.from(new Set([1, 2, total - 1, total, cur - 1, cur, cur + 1]))
            .filter(p => p >= 1 && p <= total).sort((a, b) => a - b);
        const out: (number | '...')[] = [];
        let prev = 0;
        for (const p of list) { if (prev && p - prev > 1) { out.push('...'); } out.push(p); prev = p; }
        return out;
    }
    go(p: number | '...') { if (p === '...' || p < 1 || p > this.total) { return; } this.page = p; }
}

/** Parse a number the way the legacy screens display it (strings with commas allowed). */
export function finNum(v: any): number {
    if (v === null || v === undefined || v === '') { return 0; }
    if (typeof v === 'number') { return isFinite(v) ? v : 0; }
    const n = parseFloat(String(v).replace(/,/g, ''));
    return isFinite(n) ? n : 0;
}

/** Indian-grouped amount for KPI tiles / chart labels (display only). */
export function finAmt(v: number, digits = 0): string {
    return (v || 0).toLocaleString('en-IN', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

/** Compact amount for axis labels: 12.3L / 4.5Cr / 950K. */
export function finShort(v: number): string {
    const a = Math.abs(v), s = v < 0 ? '-' : '';
    if (a >= 1e7) { return s + (a / 1e7).toFixed(1) + 'Cr'; }
    if (a >= 1e5) { return s + (a / 1e5).toFixed(1) + 'L'; }
    if (a >= 1e3) { return s + (a / 1e3).toFixed(0) + 'K'; }
    return s + Math.round(a);
}

/** Client-side CSV of all rows: UTF-8 BOM, every cell quoted, <name>-YYYYMMDD.csv. */
export function finCsv(name: string, headers: string[], rows: any[][]) {
    const q = (v: any) => '"' + String(v === null || v === undefined ? '' : v).replace(/"/g, '""') + '"';
    const body = [headers.map(q).join(','), ...rows.map(r => r.map(q).join(','))].join('\r\n');
    const d = new Date();
    const stamp = d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
    const blob = new Blob(['﻿' + body], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name + '-' + stamp + '.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** A my-date-picker model for a JS date, formatted per the picker's dateFormat. */
export function finDp(d: Date, dateFormat = 'dd/mm/yyyy'): any {
    const dd = String(d.getDate()).padStart(2, '0'), mm = String(d.getMonth() + 1).padStart(2, '0'), yyyy = String(d.getFullYear());
    const formatted = dateFormat.toLowerCase()
        .replace('yyyy', yyyy).replace('mmm', MON[d.getMonth()]).replace('mm', mm).replace('dd', dd);
    return { date: { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() }, jsdate: d, formatted, epoc: Math.round(d.getTime() / 1000) };
}

export type FinPeriod = 'month' | 'lastmonth' | 'quarter' | 'fy' | 'custom';
export const FIN_PERIODS: { key: FinPeriod; label: string }[] = [
    { key: 'month', label: 'This month' },
    { key: 'lastmonth', label: 'Last month' },
    { key: 'quarter', label: 'Last 3 months' },
    { key: 'fy', label: 'This FY' },
    { key: 'custom', label: 'Custom' },
];

/** From/To dates for a preset (Indian FY starts 1 April). Returns null for custom. */
export function finRange(p: FinPeriod, today = new Date()): { from: Date; to: Date } | null {
    const y = today.getFullYear(), m = today.getMonth();
    switch (p) {
        case 'month': return { from: new Date(y, m, 1), to: today };
        case 'lastmonth': return { from: new Date(y, m - 1, 1), to: new Date(y, m, 0) };
        case 'quarter': return { from: new Date(y, m - 2, 1), to: today };
        case 'fy': return { from: new Date(m >= 3 ? y : y - 1, 3, 1), to: today };
        default: return null;
    }
}

/** Geometry for a simple monochrome vertical bar chart (supports negatives). */
export interface FinBar { x: number; y: number; w: number; h: number; label: string; value: number; neg: boolean; lx: number; ly: number; }
export interface FinChart { w: number; h: number; l: number; bars: FinBar[]; grid: { y: number; label: string }[]; }

export function finBars(items: { label: string; value: number }[], w = 760, h = 220, fmt: (v: number) => string = finShort): FinChart {
    const l = 56, r = 12, t = 12, b = 34;
    const max = Math.max(0, ...items.map(i => i.value));
    const min = Math.min(0, ...items.map(i => i.value));
    const span = (max - min) || 1;
    const plotH = h - t - b, plotW = w - l - r;
    const yOf = (v: number) => t + (max - v) / span * plotH;
    const slot = items.length ? plotW / items.length : plotW;
    const bw = Math.max(4, Math.min(48, slot * 0.62));
    const bars = items.map((it, i) => {
        const x = l + i * slot + (slot - bw) / 2;
        const y0 = yOf(0), y1 = yOf(it.value);
        const lab = it.label.length > 12 ? it.label.slice(0, 11) + '…' : it.label;
        return { x, y: Math.min(y0, y1), w: bw, h: Math.max(1, Math.abs(y1 - y0)), label: lab, value: it.value, neg: it.value < 0, lx: x + bw / 2, ly: h - b + 14 };
    });
    const grid = [0, 0.25, 0.5, 0.75, 1].map(f => { const v = max - f * span; return { y: yOf(v), label: fmt(v) }; });
    return { w, h, l, bars, grid };
}

/** Month key ('2026-04') and label ('Apr 26') from the date strings the APIs return
 *  (dd/mm/yyyy, dd-mm-yyyy, dd-MMM-yyyy, yyyy-mm-dd...). Null when unparseable. */
export function finMonth(v: any): { key: string; label: string } | null {
    if (!v) { return null; }
    const s = String(v).trim();
    let y = 0, m = -1;
    let r = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s);
    if (r) { y = +r[1]; m = +r[2] - 1; }
    if (m < 0) { r = /^(\d{1,2})[\/\-. ](\d{1,2})[\/\-. ](\d{4})/.exec(s); if (r) { y = +r[3]; m = +r[2] - 1; } }
    if (m < 0) {
        r = /^(\d{1,2})[\/\-. ]([A-Za-z]{3})[A-Za-z]*[\/\-. ](\d{2,4})/.exec(s);
        if (r) { m = MON.findIndex(x => x.toLowerCase() === r[2].toLowerCase()); y = +r[3] < 100 ? 2000 + +r[3] : +r[3]; }
    }
    if (m < 0 || m > 11 || !y) { return null; }
    return { key: y + '-' + String(m + 1).padStart(2, '0'), label: MON[m] + ' ' + String(y).slice(-2) };
}

/** Sum a value per month (sorted chronologically) -> chart items. */
export function finByMonth(rows: any[], dateOf: (r: any) => any, valueOf: (r: any) => number): { label: string; value: number }[] {
    const map = new Map<string, { label: string; value: number }>();
    (rows || []).forEach(r => {
        const mk = finMonth(dateOf(r));
        if (!mk) { return; }
        const cur = map.get(mk.key) || { label: mk.label, value: 0 };
        cur.value += valueOf(r);
        map.set(mk.key, cur);
    });
    return Array.from(map.entries()).sort((a, b) => a[0] < b[0] ? -1 : 1).map(e => e[1]);
}

/** Sum a value per text key, largest magnitude first, top n. */
export function finByKey(rows: any[], keyOf: (r: any) => any, valueOf: (r: any) => number, n = 12): { label: string; value: number }[] {
    const map = new Map<string, number>();
    (rows || []).forEach(r => { const k = String(keyOf(r) ?? '').trim() || '—'; map.set(k, (map.get(k) || 0) + valueOf(r)); });
    return Array.from(map.entries()).map(([label, value]) => ({ label, value }))
        .sort((a, b) => Math.abs(b.value) - Math.abs(a.value)).slice(0, n);
}

/** Sparkline paths for a 130x28 KPI tile (same geometry as the Import dashboard tiles). */
export interface FinSpark { area: string; line: string; dotX: number; dotY: number; }
export function finSpark(vals: number[]): FinSpark {
    if (!vals || !vals.length) { return { area: 'M2,28 L128,28 Z', line: 'M2,28 L128,28', dotX: 128, dotY: 28 }; }
    const mx = Math.max(...vals), mn = Math.min(...vals);
    const n = vals.length;
    const pts = vals.map((v, i) => [i / (n - 1 || 1) * 126 + 2, 26 - (v - mn) / ((mx - mn) || 1) * 22]);
    const line = 'M' + pts.map(p => p.map(x => Math.round(x * 10) / 10).join(',')).join(' L');
    const last = pts[pts.length - 1];
    return { area: line + ' L128,28 L2,28 Z', line, dotX: last[0], dotY: last[1] };
}

/** KPI typography: split a formatted figure ("16.61 Cr", "-8.32 L", "12 k€", "23 d") into the
 *  number and its trailing unit, so a tile can set the unit smaller and lighter than the number.
 *  Display only - the formatted string itself is produced by the page's existing formatter. */
export function finFigure(s: any): { n: string; u: string } {
    const t = (s === null || s === undefined) ? '' : String(s).trim();
    const m = /^(.*?[0-9])\s*([^0-9\s][^0-9]*)$/.exec(t);
    const n = m ? m[1] : (t === '' ? '-' : t);
    return { n: n.length > 1 ? n.replace(/^-/, '−') : n, u: m ? m[2].trim() : '' };
}
