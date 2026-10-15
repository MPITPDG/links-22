import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { forkJoin } from 'rxjs';
import { DataService } from '../../shared/service/dataService';
import { LoginService } from '../../shared/service/loginService';
import { ToastCommonService } from '../../shared/service/toastService';
import {
    addDays, checkHomeRights, dayDiff, greeting, mdy, num, pageLinks, parseDmy, today, top
} from '../../shared/home-dashboard/home-dashboard.util';

/*  Import module home, MPERPNG-20's six-section dashboard layout: header row, attention tiles,
    Act now (the jobs behind the tile you picked, 10 a page), This week (arrivals by day),
    Workload picture (period cards, jobs by mode, 30-day chart, arrivals ahead, period
    comparison), Detail (recent jobs, 10 a page) and Reference (top importers, quick links,
    a collapsed "How this page works"). Greyscale house style, no dark mode.

    Data: Import/Report_Search (the Sea and Air search screens' search), Sea and Air, over the
    last 730 days. The search repeats a job once per line, so rows are folded to one per
    pk_ImpoterId. Jobs are placed in a period by their Import Date.

    Air: Links books sea imports only. Everything about Air (the Air card, the Air row and
    column, the chart's Air series, the mode filter) shows only when the Air search returned at
    least one live job, so a branch that starts air imports gets them without a code change.

    Rights-gated exactly as before the port (see VIEW_GATE_FORM_ID): no View right on the gate
    form -> nothing renders, no redirect, the menu still works. SA bypasses.                   */

interface ImpJob {
    pk: string; code: string; mode: 'sea' | 'air'; opened: Date;
    importer: string; city: string; vessel: string; eta: Date;
    goods: string; pkgs: number; kg: number;
}
interface Period { jobs: number; sea: number; air: number; kg: number; pkgs: number; }

@Component({
    selector: 'app-import-home',
    templateUrl: './import-home.component.html',
    styleUrls: ['./import-home.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class ImportHomeComponent implements OnInit {

    /*  THE rights gate for this page, and the only place it is configured: the tbl_mst_form id
        whose View right shows the dashboard (SA always sees it; checkHomeRights does the rest).
        NOTE: in LinksDB20, 444 is the Day-End form, not an Import dashboard form, so this id is
        most likely wrong. It is kept deliberately, so today's access does not change, until the
        user decides. To drop gating, set this to null: the page then loads for every logged-in
        user. checkViewGate() is the only reader.                                            */
    static readonly VIEW_GATE_FORM_ID: string | null = '444';

    /*  Rights. null = not yet checked (render nothing), false = denied (render nothing). */
    canView: boolean = null;

    login: any = null;
    busy = false;
    failed = false;
    failReason = '';
    loaded = false;
    updatedAt: Date = null;
    helpOpen = false;

    /*  True when the Air search returned at least one live (not cancelled) job. */
    hasAir = false;

    // periods
    mtdFrom: Date = null; mtdTo: Date = null; pmFrom: Date = null; pmTo: Date = null;
    mtd: Period = { jobs: 0, sea: 0, air: 0, kg: 0, pkgs: 0 };
    pm: Period = { jobs: 0, sea: 0, air: 0, kg: 0, pkgs: 0 };

    jobs: ImpJob[] = [];          // everything read (the last 730 days -> today)
    cancelled = 0;

    /*  Period for the KPI cards: 'mtd' = month to date vs the same days last month, or a number
        of days = the last N days vs the N days before them.                                   */
    sel: any = 'mtd';
    readonly periods = [{ key: 'mtd', label: 'Month' }, { key: 30, label: '30 days' }, { key: 90, label: '90 days' },
                        { key: 180, label: '180 days' }, { key: 365, label: '365 days' }];
    curLabel = 'This month';
    prevLabel = 'Last month';

    /*  All four rolling windows side by side, each against the equal period before it. */
    compare: { days: number; cur: Period; prev: Period; from: Date; prevFrom: Date; prevTo: Date }[] = [];

    // work
    arriving: ImpJob[] = [];      // ETA today .. +6
    arrivingVessels = 0;
    arrivingByDay: { date: Date; label: string; jobs: ImpJob[] }[] = [];
    justArrived: ImpJob[] = [];   // ETA -7 .. -1
    noEta: ImpJob[] = [];         // sea, no ETA
    openedWeek: ImpJob[] = [];    // opened in the last 7 days
    listKind = 'arrived';         // which list Act now shows (most urgent by default)
    listPage = 1;

    // tiles
    ahead: { label: string; n: number; pct: number }[] = [];
    aheadTotal = 0;

    // tables
    modes: { mode: string; icon: string; mtd: number; pm: number; kg: number; pkgs: number }[] = [];
    topImporters: { name: string; jobs: number; kg: number; share: number }[] = [];

    // 30-day chart (ng2-charts 4 / Chart.js 4: colours on the datasets)
    trendLabels: string[] = [];
    trendData: any[] = [];
    trendOptions: any = null;
    trendTotal = 0;
    private daily: { date: Date; sea: number; air: number }[] = [];

    // recent jobs
    search = '';
    modeFilter = 'all';
    page = 1;
    readonly pageSize = 10;

    quickLinks = [
        { label: 'Sea search',       icon: 'fa-ship',      link: '/import/sea/search' },
        { label: 'Air search',       icon: 'fa-plane',     link: '/import/air/search' },
        { label: 'New sea job',      icon: 'fa-plus',      link: '/import/sea/entry-data' },
        { label: 'New air job',      icon: 'fa-plus',      link: '/import/air/entry-data' },
        { label: 'Sea docket print', icon: 'fa-print',     link: '/import/sea/docket-print-search' },
        { label: 'Vessel master',    icon: 'fa-anchor',    link: '/import/master/vessel/search' }
    ];

    constructor(private _dataService: DataService,
        private _loginService: LoginService,
        private _toasterService: ToastCommonService) { }

    ngOnInit() {
        this.login = this._loginService.getLogin()[0];
        try {
            const p = sessionStorage.getItem('ih.period');
            if (p === 'mtd') { this.sel = 'mtd'; } else if ([30, 90, 180, 365].indexOf(+p) >= 0) { this.sel = +p; }
        } catch (e) { }
        this.checkViewGate();
    }

    /*  The whole rights check, driven by VIEW_GATE_FORM_ID (null = no gate). Same rule as before
        the port: SA sees everything; anyone else needs View on the form; a failed rights call
        stays blank. verifyRights only reports, so there is never a redirect.                  */
    checkViewGate() {
        const formId = ImportHomeComponent.VIEW_GATE_FORM_ID;
        if (!formId) {
            this.canView = true;
            this.load();
            return;
        }
        checkHomeRights(this.login, id => this._loginService.verifyRights(id, ''), formId, ok => {
            this.canView = ok;
            if (ok) { this.load(); }
        });
    }

    greeting() { return greeting(); }
    userName(): string { return this.login ? (this.login.USERNAME || this.login.CMP_USERNAME || '') : ''; }

    /*  Sets the current / previous date ranges for the chosen period. */
    private setRanges() {
        const t = today();
        if (this.sel === 'mtd') {
            this.mtdFrom = new Date(t.getFullYear(), t.getMonth(), 1);
            this.mtdTo = t;
            this.pmFrom = new Date(t.getFullYear(), t.getMonth() - 1, 1);
            const lastDayPm = new Date(t.getFullYear(), t.getMonth(), 0).getDate();
            this.pmTo = new Date(t.getFullYear(), t.getMonth() - 1, Math.min(t.getDate(), lastDayPm));
            this.curLabel = 'This month'; this.prevLabel = 'Last month';
        } else {
            const n = +this.sel;
            this.mtdFrom = addDays(t, -(n - 1)); this.mtdTo = t;
            this.pmFrom = addDays(t, -(2 * n - 1)); this.pmTo = addDays(t, -n);
            this.curLabel = 'Last ' + n + ' d'; this.prevLabel = 'Before';
        }
    }

    /*  Switching period only re-counts what is already loaded (730 days are read once). */
    setPeriod(k: any) {
        if (this.sel === k) { return; }
        this.sel = k;
        try { sessionStorage.setItem('ih.period', String(k)); } catch (e) { }
        this.setRanges();
        if (this.loaded && !this.failed) { this.build(this.jobs); }
    }

    get periodName(): string { return this.sel === 'mtd' ? 'this month' : 'last ' + this.sel + ' days'; }

    load() {
        if (!this.login) { return; }
        this.busy = true; this.failed = false; this.failReason = '';
        const t = today();
        this.setRanges();
        // two years: the 365-day comparison needs the 365 days before the last 365
        const readFrom = addDays(t, -729);

        const body = (mode: string) => ({
            Mode: mode, ImportCode: '', ImportFromDate: mdy(readFrom), ImportToDate: mdy(t),
            Importer: '', ImporterType: 'All', BillTo: '', BillToType: 'All', Vessel: '', VesselType: 'All',
            Agent: '', AgentType: 'All', GlFromDate: '', GlToDate: '', SearchType: '2',
            CityCode1: this.login.CITYCODE1, CmpCode: this.login.CMPCODE
        });
        forkJoin(
            this._dataService.Common('Import/Report_Search', body('Sea')),
            this._dataService.Common('Import/Report_Search', body('Air'))
        ).subscribe(([s, a]: any[]) => {
            this.busy = false; this.loaded = true; this.updatedAt = new Date();
            const bad = [s, a].find(d => d && d.Table && d.Table[0] && d.Table[0].STATUS && ['100', '103'].indexOf(String(d.Table[0].STATUS)) < 0);
            if (bad) {
                this.failed = true;
                this.failReason = bad.Table[0].STATUSTEXT || bad.Table[0].statusText || bad.Table[0].statustext || '';
                this._toasterService.toast('error', 'error', 'Could not load the Import summary.');
                return;
            }
            this.cancelled = 0;
            const sea = this.rows(s, 'sea'), air = this.rows(a, 'air');
            this.hasAir = air.length > 0;
            if (!this.hasAir && this.modeFilter === 'air') { this.modeFilter = 'all'; }
            this.build(sea.concat(air));
        }, () => {
            this.busy = false; this.loaded = true; this.failed = true;
            this._toasterService.toast('error', 'error', 'Could not load the Import summary.');
        });
    }

    /*  One job per pk_ImpoterId; the search repeats a job once per container / line. */
    private rows(data: any, mode: 'sea' | 'air'): ImpJob[] {
        const list: any[] = (data && data.Table) ? data.Table : [];
        const seen: { [k: string]: boolean } = {};
        const out: ImpJob[] = [];
        list.forEach(r => {
            if (r.pk_ImpoterId == null || seen[r.pk_ImpoterId]) { return; }
            seen[r.pk_ImpoterId] = true;
            if (String(r.Doc_Cancel || '').toUpperCase() === 'Y') { this.cancelled++; return; }
            const imp = String(r['Importer'] || '').split('|');
            // "Vessel" is "ETA | ... | VESSEL NAME | ..." for sea jobs, empty for air
            const ves = String(r['Vessel'] || '').split('|').map(x => x.trim());
            out.push({
                pk: String(r.pk_ImpoterId), code: r['Import Code'] || '', mode: mode, opened: parseDmy(r['Import Date']),
                importer: (imp[0] || '').trim(), city: (imp[1] || '').trim(),
                vessel: (ves[2] || '').replace(/\s+/g, ' ').trim(), eta: parseDmy(ves[0]),
                goods: (r['Desc of Goods'] || '').trim(), pkgs: num(r['No. of Pkgs.']), kg: num(r['Gross Weight'])
            });
        });
        return out;
    }

    private period(from: Date, to: Date): Period {
        const js = this.jobs.filter(j => j.opened && j.opened.getTime() >= from.getTime() && j.opened.getTime() <= to.getTime());
        return {
            jobs: js.length, sea: js.filter(j => j.mode === 'sea').length, air: js.filter(j => j.mode === 'air').length,
            kg: js.reduce((s, j) => s + j.kg, 0), pkgs: js.reduce((s, j) => s + j.pkgs, 0)
        };
    }

    private build(jobs: ImpJob[]) {
        const t = today();
        this.jobs = jobs;
        this.mtd = this.period(this.mtdFrom, this.mtdTo);
        this.pm = this.period(this.pmFrom, this.pmTo);
        this.compare = [30, 90, 180, 365].map(n => ({
            days: n, from: addDays(t, -(n - 1)), prevFrom: addDays(t, -(2 * n - 1)), prevTo: addDays(t, -n),
            cur: this.period(addDays(t, -(n - 1)), t), prev: this.period(addDays(t, -(2 * n - 1)), addDays(t, -n))
        }));

        const withEta = jobs.filter(j => j.eta);
        this.arriving = withEta.filter(j => { const d = dayDiff(j.eta, t); return d >= 0 && d <= 6; })
            .sort((a, b) => a.eta.getTime() - b.eta.getTime());
        this.arrivingByDay = this.groupArriving();
        this.arrivingVessels = this.arriving.map(j => j.vessel).filter((v, i, a) => v && a.indexOf(v) === i).length;
        this.justArrived = withEta.filter(j => { const d = dayDiff(j.eta, t); return d < 0 && d >= -7; })
            .sort((a, b) => b.eta.getTime() - a.eta.getTime());
        this.noEta = jobs.filter(j => j.mode === 'sea' && !j.eta && j.opened && dayDiff(t, j.opened) <= 60)
            .sort((a, b) => (a.opened ? a.opened.getTime() : 0) - (b.opened ? b.opened.getTime() : 0));
        this.openedWeek = jobs.filter(j => j.opened && dayDiff(t, j.opened) <= 6)
            .sort((a, b) => b.opened.getTime() - a.opened.getTime());

        // arrivals ahead, four bands from today
        const future = withEta.filter(j => dayDiff(j.eta, t) >= 0);
        const bucket = (lo: number, hi: number) => future.filter(j => { const d = dayDiff(j.eta, t); return d >= lo && d <= hi; }).length;
        const b = [bucket(0, 7), bucket(8, 15), bucket(16, 30), bucket(31, 100000)];
        this.aheadTotal = future.length;
        this.ahead = [
            { label: 'Next 7 days', n: b[0], pct: 0 },
            { label: '8-15 days', n: b[1], pct: 0 },
            { label: '16-30 days', n: b[2], pct: 0 },
            { label: 'Beyond 30 days', n: b[3], pct: 0 }
        ].map(x => (x.pct = this.aheadTotal ? Math.round(x.n * 1000 / this.aheadTotal) / 10 : 0, x));

        // jobs opened in the period by mode (the Air row only when there are air jobs at all)
        const mtdJobs = jobs.filter(j => j.opened && j.opened.getTime() >= this.mtdFrom.getTime());
        this.modes = [
            { mode: 'Sea', icon: 'fa-ship', mtd: this.mtd.sea, pm: this.pm.sea,
              kg: mtdJobs.filter(j => j.mode === 'sea').reduce((s, j) => s + j.kg, 0), pkgs: mtdJobs.filter(j => j.mode === 'sea').reduce((s, j) => s + j.pkgs, 0) },
            { mode: 'Air', icon: 'fa-plane', mtd: this.mtd.air, pm: this.pm.air,
              kg: mtdJobs.filter(j => j.mode === 'air').reduce((s, j) => s + j.kg, 0), pkgs: mtdJobs.filter(j => j.mode === 'air').reduce((s, j) => s + j.pkgs, 0) }
        ].filter(m => m.mode === 'Sea' || this.hasAir);

        // top importers in the period
        const tops = top(mtdJobs, j => j.importer, 8);
        this.topImporters = tops.map(x => ({
            name: x.name, jobs: x.n,
            kg: mtdJobs.filter(j => j.importer === x.name).reduce((s, j) => s + j.kg, 0),
            share: this.mtd.jobs ? Math.round(x.n * 1000 / this.mtd.jobs) / 10 : 0
        }));

        // last 30 days, per day
        this.daily = [];
        for (let d = 29; d >= 0; d--) {
            const day = addDays(t, -d);
            const js = jobs.filter(j => j.opened && j.opened.getTime() === day.getTime());
            this.daily.push({ date: day, sea: js.filter(j => j.mode === 'sea').length, air: js.filter(j => j.mode === 'air').length });
        }
        this.buildTrend();
        this.page = 1;
        this.listPage = 1;
    }

    buildTrend() {
        if (!this.daily.length) { this.trendOptions = null; return; }
        const pad = (n: number) => (n < 10 ? '0' : '') + n;
        this.trendLabels = this.daily.map(d => pad(d.date.getDate()) + '/' + pad(d.date.getMonth() + 1));
        const bar = { borderWidth: 0, barPercentage: 0.8, categoryPercentage: 0.9 };
        this.trendData = [
            Object.assign({ data: this.daily.map(d => d.sea), label: 'Sea', stack: 'jobs',
                backgroundColor: '#0A0A0A', hoverBackgroundColor: '#0A0A0A' }, bar)
        ];
        if (this.hasAir) {
            this.trendData.push(Object.assign({ data: this.daily.map(d => d.air), label: 'Air', stack: 'jobs',
                backgroundColor: '#BDBDBD', hoverBackgroundColor: '#BDBDBD' }, bar));
        }
        this.trendTotal = this.daily.reduce((s, d) => s + d.sea + d.air, 0);
        const self = this;
        const tick = '#6B6B6B';
        const grid = '#F3F3F3';
        this.trendOptions = {
            responsive: true,
            maintainAspectRatio: false,
            layout: { padding: { top: 4, right: 4, bottom: 0, left: 0 } },
            plugins: {
                legend: { display: false },
                tooltip: {
                    mode: 'index',
                    callbacks: {
                        title: function (items: any) {
                            const d = self.daily[items[0].dataIndex];
                            return d ? d.date.toDateString() : '';
                        }
                    }
                }
            },
            scales: {
                x: { stacked: true, grid: { display: false },
                    ticks: { color: tick, font: { size: 11 }, autoSkip: true, maxTicksLimit: 8, maxRotation: 0 } },
                y: { stacked: true, beginAtZero: true, grid: { color: grid }, border: { display: false },
                    ticks: { color: tick, font: { size: 11 }, maxTicksLimit: 4, precision: 0 } }
            }
        };
    }

    /*  ---- cards ---- */

    /*  Width of one bar in a this-period / period-before pair; both share the larger value as 100%. */
    cmpPct(a: number, b: number): number {
        const max = Math.max(Math.abs(a), Math.abs(b));
        return max > 0 ? Math.round(Math.abs(a) / max * 100) : 0;
    }
    private delta(c: number, p: number): number { return p ? (c - p) / Math.abs(p) * 100 : null; }
    deltaClass(c: number, p: number): string {
        const d = this.delta(c, p);
        if (d === null || Math.abs(d) < 0.05) { return 'flat'; }
        return d > 0 ? 'up' : 'down';
    }
    deltaText(c: number, p: number): string {
        const d = this.delta(c, p);
        if (d === null) { return 'no comparison'; }
        return (d > 0 ? '▲' : (d < 0 ? '▼' : '▬')) + ' ' + Math.abs(d).toFixed(1) + '%';
    }
    tonnes(kg: number): string { return (kg / 1000).toLocaleString('en-IN', { maximumFractionDigits: kg < 10000 ? 1 : 0 }); }
    share(v: number, list: any[], field: string): number {
        const max = Math.max(0, ...list.map(x => +x[field] || 0));
        return max > 0 ? Math.round(v * 100 / max) : 0;
    }

    /*  ---- attention tiles and the Act now list ---- */

    /*  Tiles and the Act now select choose the list; tiles also scroll to it. */
    pickList(k: string, scroll = true) {
        this.listKind = k || 'arrived'; this.listPage = 1;
        if (scroll) { this.goTo('ih-act'); }
    }
    goTo(id: string) {
        setTimeout(() => { const el = document.getElementById(id); if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); } });
    }
    /*  A mode row in the workload picture filters Recent jobs (click again to clear). */
    filterMode(m: string) { this.setMode(this.modeFilter === m ? 'all' : m); this.goTo('ih-recent'); }

    /*  Arrivals in the next 7 days, one group per ETA day. */
    private groupArriving(): { date: Date; label: string; jobs: ImpJob[] }[] {
        const t = today();
        const out: { date: Date; label: string; jobs: ImpJob[] }[] = [];
        this.arriving.forEach(j => {
            let g = out.find(x => x.date.getTime() === j.eta.getTime());
            if (!g) {
                const d = dayDiff(j.eta, t);
                g = { date: j.eta, label: d === 0 ? 'Today' : d === 1 ? 'Tomorrow' : 'In ' + d + ' days', jobs: [] };
                out.push(g);
            }
            g.jobs.push(j);
        });
        return out;
    }

    get listPageCount() { return Math.max(1, Math.ceil(this.listRows.length / this.pageSize)); }
    get listPageRows() { const st = (this.listPage - 1) * this.pageSize; return this.listRows.slice(st, st + this.pageSize); }
    get listFrom() { return this.listRows.length ? (this.listPage - 1) * this.pageSize + 1 : 0; }
    get listTo() { return Math.min(this.listRows.length, this.listPage * this.pageSize); }
    get listPageLinks() { return pageLinks(this.listPage, this.listPageCount); }
    goListPage(p: number) { if (p >= 1 && p <= this.listPageCount) { this.listPage = p; } }
    get listRows(): ImpJob[] {
        switch (this.listKind) {
            case 'arrived': return this.justArrived;
            case 'arriving': return this.arriving;
            case 'noeta': return this.noEta;
            case 'week': return this.openedWeek;
        }
        return [];
    }
    get listTitle(): string {
        switch (this.listKind) {
            case 'arrived': return 'Arrived in the last 7 days';
            case 'arriving': return 'Arriving in the next 7 days';
            case 'noeta': return 'Sea jobs without a vessel ETA';
            case 'week': return 'Opened in the last 7 days';
        }
        return '';
    }
    whenText(j: ImpJob): string {
        const t = today();
        if (this.listKind === 'noeta' || this.listKind === 'week' || !j.eta) { return j.opened ? 'opened ' + dayDiff(t, j.opened) + ' d ago' : ''; }
        const d = dayDiff(j.eta, t);
        return d === 0 ? 'today' : d === 1 ? 'tomorrow' : d === -1 ? 'yesterday' : d > 0 ? 'in ' + d + ' days' : (-d) + ' days ago';
    }
    link(j: ImpJob) { return ['/import', j.mode, 'update-data', j.pk]; }
    modeLabel(j: ImpJob) { return j.mode === 'air' ? 'Air' : 'Sea'; }

    /*  ---- recent jobs ---- */
    get filtered(): ImpJob[] {
        const q = (this.search || '').trim().toUpperCase();
        return this.jobs.filter(j => (this.modeFilter === 'all' || j.mode === this.modeFilter) &&
            (!q || [j.code, j.importer, j.vessel, j.goods, j.city].some(v => (v || '').toUpperCase().indexOf(q) >= 0)))
            .sort((a, b) => (b.opened ? b.opened.getTime() : 0) - (a.opened ? a.opened.getTime() : 0) || (a.code < b.code ? 1 : -1));
    }
    setMode(m: string) { this.modeFilter = m; this.page = 1; }
    clearFilters() { this.search = ''; this.modeFilter = 'all'; this.page = 1; }
    get hasFilters() { return !!this.search || this.modeFilter !== 'all'; }
    get pageCount() { return Math.max(1, Math.ceil(this.filtered.length / this.pageSize)); }
    get pageRows() { const s = (this.page - 1) * this.pageSize; return this.filtered.slice(s, s + this.pageSize); }
    get pageFrom() { return this.filtered.length ? (this.page - 1) * this.pageSize + 1 : 0; }
    get pageTo() { return Math.min(this.filtered.length, this.page * this.pageSize); }
    get pageLinks() { return pageLinks(this.page, this.pageCount); }
    goPage(p: number) { if (p >= 1 && p <= this.pageCount) { this.page = p; } }
    trackByPk(i: number, j: ImpJob) { return j.pk; }
}
