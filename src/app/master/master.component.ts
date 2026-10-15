import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { DataService } from '../shared/service/dataService';
import { LoginService } from '../shared/service/loginService';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Pending master requests, one Master/Master_Search_common call per type -- the same call
 *  (rqPage + '%' wildcard) the Request Search screens make on load. */
const REQ_TYPES = [
    { page: 'RequestExporter', label: 'Exporter', route: 'client' },
    { page: 'RequestConsignee', label: 'Consignee', route: 'consignee' },
    { page: 'RequestSupplier', label: 'Supplier', route: 'supplier' },
    { page: 'RequestAgentVessel', label: 'Agent vessel', route: 'AgentVessel' },
    { page: 'RequestLiner', label: 'Shipping liner', route: 'Liner' },
];

interface ReqRow { type: string; route: string; code: string; name: string; city: string; country: string; user: string; }
interface TypeCount { label: string; count: number; pct: number; loading: boolean; failed: boolean; }
interface MonthBar { label: string; enq: number; quot: number; }
interface GridLine { y: number; label: number; }

/** Master landing page (sidebar Dashboard). Read-only: pending request counts per type,
 *  quotations and sales enquiries over the last 12 months, all from existing search calls.
 *  Each source loads and fails on its own so one slow call never blanks the page. */
@Component({
    templateUrl: 'master.component.html',
    styleUrls: ['./master-home.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class MasterComponent implements OnInit {

    cityName = '';
    fromLabel = '';
    toLabel = '';

    // requests
    types: TypeCount[] = [];
    requests: ReqRow[] = [];
    reqPending = 0;
    get reqLoading() { return this.types.some(t => t.loading); }
    get reqFailed() { return this.types.some(t => t.failed); }

    // quotations
    quotLoading = false;
    quotFailed = false;
    quotTotal = 0;
    quotSea = 0;
    quotAir = 0;
    quotThisMonth: number | null = null;
    quotDated = false;

    // enquiries
    enqLoading = false;
    enqFailed = false;
    enqTotal = 0;
    enqThisMonth = 0;
    enqOpen = 0;
    enqStatuses: { name: string; count: number; pct: number }[] = [];

    // month chart (viewBox 0 0 640 250)
    readonly chartW = 640;
    readonly chartH = 250;
    readonly chartL = 34;
    readonly chartR = 8;
    readonly chartT = 12;
    readonly chartB = 26;
    months: MonthBar[] = [];
    gridLines: GridLine[] = [];
    bars: { x: number; w: number; eY: number; eH: number; qY: number; qH: number; lx: number; label: string; enq: number; quot: number }[] = [];

    private quotRows: any[] = [];
    private enqRows: any[] = [];
    private from = new Date();
    private to = new Date();

    readonly pageSize = 10;
    currentPage = 1;

    constructor(
        private _router: Router,
        private _dataService: DataService,
        private _loginService: LoginService,
        private _cd: ChangeDetectorRef,
    ) { }

    ngOnInit(): void {
        this.load();
    }

    get loadingAny() { return this.reqLoading || this.quotLoading || this.enqLoading; }

    load() {
        const login = (this._loginService.getLogin() || [])[0] || {};
        this.cityName = this.titleCase(login.CITYNAME || login.CITYCODE1 || login.CITYCODE || '');
        this.to = new Date();
        this.from = new Date(this.to.getFullYear(), this.to.getMonth() - 11, 1, 12);
        this.fromLabel = `${MONTHS[this.from.getMonth()]} ${this.from.getFullYear()}`;
        this.toLabel = `${this.to.getDate()} ${MONTHS[this.to.getMonth()]} ${this.to.getFullYear()}`;
        this.loadRequests();
        this.loadQuotations();
        this.loadEnquiries();
    }

    // ---------------- sources ----------------

    private loadRequests() {
        this.requests = [];
        this.currentPage = 1;
        this.types = REQ_TYPES.map(t => ({ label: t.label, count: 0, pct: 0, loading: true, failed: false }));
        const perType: ReqRow[][] = REQ_TYPES.map(() => []);
        REQ_TYPES.forEach((t, i) => {
            this._dataService.getData('Master/Master_Search_common', { rqPage: t.page, strSearchTxt: '%' })
                .pipe(catchError(() => of(null)))
                .subscribe((data: any) => {
                    const tc = this.types[i];
                    tc.loading = false;
                    const rows = data && Array.isArray(data.Table) ? data.Table : null;
                    if (!rows || (rows[0] && rows[0].STATUS && !rows[0].CODE)) {
                        tc.failed = true;
                    } else {
                        perType[i] = rows.map((r: any) => ({
                            type: t.label, route: t.route, code: r.CODE, name: r.NAME,
                            city: r.CITY, country: r.COUNTRY, user: r.USER,
                        }));
                        tc.count = perType[i].length;
                    }
                    this.requests = ([] as ReqRow[]).concat(...perType);
                    this.reqPending = this.requests.length;
                    const max = Math.max(1, ...this.types.map(x => x.count));
                    this.types.forEach(x => x.pct = Math.round(x.count / max * 1000) / 10);
                    this._cd.markForCheck();
                });
        });
    }

    private loadQuotations() {
        this.quotLoading = true;
        this.quotFailed = false;
        // same payload as Quotation Search's "Start date" filter (SearchVal 4, dd/mm/yyyy)
        this._dataService.getData('Admin/ADMIN_QUOTATION_SEARCHLIST', {
            SearchVal: '4', SearchText: '', efftfrdt: this.dmy(this.from), effttodt: this.dmy(this.to),
        }).pipe(catchError(() => of(null))).subscribe((data: any) => {
            const rows = data && Array.isArray(data.Table) ? data.Table : null;
            if (!rows || (rows[0] && rows[0].STATUS && !rows[0].QUOT_CODE)) {
                this.quotFailed = true;
                this.quotRows = [];
            } else {
                this.quotRows = rows;
            }
            this.quotTotal = this.quotRows.length;
            this.quotSea = this.quotRows.filter(r => (r.SHIP_MODE || '').toUpperCase() === 'SEA').length;
            this.quotAir = this.quotRows.filter(r => (r.SHIP_MODE || '').toUpperCase() === 'AIR').length;
            // the list has no documented date column; use the first dd/mm/yyyy date field if present
            const key = this.dateKey(this.quotRows);
            this.quotDated = !!key;
            this.quotThisMonth = key ? this.quotRows.filter(r => this.isThisMonth(this.parseDate(r[key]))).length : null;
            this.quotLoading = false;
            this.buildMonths();
            this._cd.markForCheck();
        });
    }

    private loadEnquiries() {
        this.enqLoading = true;
        this.enqFailed = false;
        // same payload as Enquiry Search's date filter (SEARCHVAL 3, dd/mm/yyyy)
        this._dataService.getData('Admin/ADMIN_SALESENQUIRY_SEARCHLIST', {
            SEARCHVAL: '3', SEARCHTXT: '', STARTDT: this.dmy(this.from), ENDDT: this.dmy(this.to),
        }).pipe(catchError(() => of(null))).subscribe((data: any) => {
            const rows = data && Array.isArray(data.Table) ? data.Table : null;
            if (!rows || (rows[0] && rows[0].STATUS && !rows[0].ENQREFNO)) {
                this.enqFailed = true;
                this.enqRows = [];
            } else {
                this.enqRows = rows;
            }
            this.enqTotal = this.enqRows.length;
            this.enqThisMonth = this.enqRows.filter(r => this.isThisMonth(this.parseDate(r.ENQRECPTDT))).length;
            const counts = new Map<string, number>();
            this.enqRows.forEach(r => {
                const s = (r.ENQSTATUS || 'Unspecified').toString().trim() || 'Unspecified';
                counts.set(s, (counts.get(s) || 0) + 1);
            });
            this.enqOpen = this.enqRows.filter(r => !/clos|lost|lose|reject|cancel|convert|won|win/i.test(r.ENQSTATUS || '')).length;
            const top = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6);
            const max = top.length ? top[0][1] : 1;
            this.enqStatuses = top.map(([name, count]) => ({ name, count, pct: Math.round(count / max * 1000) / 10 }));
            this.enqLoading = false;
            this.buildMonths();
            this._cd.markForCheck();
        });
    }

    // ---------------- chart ----------------

    private buildMonths() {
        const months: MonthBar[] = [];
        const idx = new Map<string, MonthBar>();
        for (let i = 0; i < 12; i++) {
            const d = new Date(this.from.getFullYear(), this.from.getMonth() + i, 1);
            const m: MonthBar = {
                label: (d.getMonth() === 0 || i === 0) ? `${MONTHS[d.getMonth()]} ${('' + d.getFullYear()).slice(-2)}` : MONTHS[d.getMonth()],
                enq: 0, quot: 0,
            };
            idx.set(`${d.getFullYear()}-${d.getMonth()}`, m);
            months.push(m);
        }
        const bump = (d: Date | null, f: 'enq' | 'quot') => {
            const m = d && idx.get(`${d.getFullYear()}-${d.getMonth()}`);
            if (m) { m[f]++; }
        };
        this.enqRows.forEach(r => bump(this.parseDate(r.ENQRECPTDT), 'enq'));
        const qk = this.dateKey(this.quotRows);
        if (qk) { this.quotRows.forEach(r => bump(this.parseDate(r[qk]), 'quot')); }
        this.months = months;

        const L = this.chartL, T = this.chartT, ih = this.chartH - T - this.chartB, iw = this.chartW - L - this.chartR;
        const bw = iw / months.length;
        const rawMax = Math.max(1, ...months.map(m => Math.max(m.enq, m.quot)));
        const rough = rawMax / 4, mag = Math.pow(10, Math.floor(Math.log10(rough)));
        const norm = rough / mag;
        const step = Math.max(1, (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10) * mag);
        const max = step * 4;
        this.gridLines = [0, 1, 2, 3, 4].map(k => ({ y: T + ih - k * step / max * ih, label: k * step }));
        const base = T + ih;
        this.bars = months.map((m, i) => {
            const w = bw * 0.32;
            const x = L + i * bw + bw * 0.16;
            const eH = m.enq / max * ih, qH = m.quot / max * ih;
            return { x, w, eY: base - eH, eH, qY: base - qH, qH, lx: L + i * bw + bw / 2, label: m.label, enq: m.enq, quot: m.quot };
        });
    }

    // ---------------- table ----------------

    get totalPages() { return Math.max(1, Math.ceil(this.requests.length / this.pageSize)); }
    get pagedRequests() { const s = (this.currentPage - 1) * this.pageSize; return this.requests.slice(s, s + this.pageSize); }
    get pageFrom() { return this.requests.length ? (this.currentPage - 1) * this.pageSize + 1 : 0; }
    get pageTo() { return Math.min(this.currentPage * this.pageSize, this.requests.length); }
    get pageNumbers(): (number | '...')[] {
        const total = this.totalPages, cur = this.currentPage;
        if (total <= 7) { return Array.from({ length: total }, (_, i) => i + 1); }
        const list = Array.from(new Set([1, 2, total - 1, total, cur - 1, cur, cur + 1]))
            .filter(p => p >= 1 && p <= total).sort((a, b) => a - b);
        const out: (number | '...')[] = [];
        let prev = 0;
        for (const p of list) { if (prev && p - prev > 1) { out.push('...'); } out.push(p); prev = p; }
        return out;
    }
    goToPage(p: number | '...') {
        if (p === '...' || p < 1 || p > this.totalPages) { return; }
        this.currentPage = p;
    }

    openRequest(r: ReqRow) {
        this._router.navigate(['/master/request/' + r.route + '/TEMP/' + r.code]);
    }

    // ---------------- helpers ----------------

    private dmy(d: Date) {
        return ('0' + d.getDate()).slice(-2) + '/' + ('0' + (d.getMonth() + 1)).slice(-2) + '/' + d.getFullYear();
    }

    private dateKey(rows: any[]): string | null {
        const r = rows[0];
        if (!r) { return null; }
        return Object.keys(r).find(k => /DATE|DT/i.test(k) && !!this.parseDate(r[k])) || null;
    }

    /** Accepts dd/mm/yyyy, dd-mm-yyyy, dd-Mon-yyyy and ISO strings. */
    private parseDate(v: any): Date | null {
        if (!v) { return null; }
        const s = ('' + v).trim();
        let m = /^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})/.exec(s);
        if (m) { return new Date(+m[3], +m[2] - 1, +m[1], 12); }
        m = /^(\d{1,2})[\s-]([A-Za-z]{3})[a-z]*[\s-](\d{4})/.exec(s);
        if (m) {
            const mi = MONTHS.findIndex(x => x.toLowerCase() === m![2].toLowerCase());
            return mi < 0 ? null : new Date(+m[3], mi, +m[1], 12);
        }
        m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
        return m ? new Date(+m[1], +m[2] - 1, +m[3], 12) : null;
    }

    private isThisMonth(d: Date | null) {
        return !!d && d.getFullYear() === this.to.getFullYear() && d.getMonth() === this.to.getMonth();
    }

    private titleCase(s: string): string {
        return s.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
    }
}
