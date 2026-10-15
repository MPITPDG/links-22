import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription, forkJoin, of } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';

import { LoginService } from '../shared/service/loginService';
import { ExportDashboardService, VesselListRow } from '../export/dashboard/export-dashboard.service';
import { AIR_ENABLED, BoardAgentCount, BoardCard, BoardStage, BoardView, STAGES, CANCELLED_CODE } from '../export/dashboard/export-dashboard.model';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY = 86400000;

/** Short x-axis labels for the stage chart; the full label stays in the tooltip. */
const STAGE_SHORT: { [code: number]: string } = {
    0: 'Opened', 1: 'Ship. bill', 2: 'Cargo recd', 3: 'Carted',
    4: 'Container', 5: 'Out charge', 6: 'Doc issued',
};

/** One export job - one EXPT_MASTER row, one EXPT_NO - as this page renders it. */
interface Job {
    key: string;
    exptno: string;
    mode: 'Sea' | 'Air';
    stageCode: number;
    stageLabel: string;
    document: string;       // FCR/HBL, master BL, MAWB or HAWB once one is recorded
    opened: Date | null;    // SYSEXPT_DOCRECD - when the job was opened
    etd: Date | null;
    etdStr: string;
    consignee: string;
    carrier: string;        // vessel / voyage
    ageDays: number | null;
    cancelled: boolean;
    agent: string;          // EXPT_MASTER.AGENT name
    exporter: string;
    docsIn: boolean;        // stage 6: FCR/HBL, master BL, MAWB or HAWB recorded
}

/** A sailing-risk row: no document yet and the vessel sails within RISK_DAYS (or sailed lately). */
interface RiskRow { job: Job; days: number; }

/** Week ahead: one vessel sailing in the next 7 days and our jobs on it. */
interface WeekVessel { name: string; voy: string; port: string; etd: Date; days: number; jobs: Job[]; ready: number; onList: boolean; }

interface AgentBar { name: string; n: number; sea: number; air: number; seaPct: number; airPct: number; }

/** One vessel-list row from today on (Vessels sailing next). jobs = our sampled jobs on it. */
interface Sailing { name: string; voy: string; port: string; etd: Date; etdStr: string; rtno: string; days: number; jobs: number; }

interface Bucket { label: string; full: string; code: number; sea: number; air: number; }
/** Week ahead grouped by day: the vessels sailing that day and how many of our jobs are ready. */
interface WeekDay { days: number; date: Date; vessels: WeekVessel[]; jobs: number; ready: number; }
interface BarGeom {
    seaX: number; seaY: number; seaW: number; seaH: number;
    airPath: string | null;
    labelX: number; labelY: number; label: string;
    hitX: number; hitY: number; hitW: number; hitH: number; code: number;
    tipX: number; tipY: number; sea: number; air: number; total: number;
    fullLabel: string;
}
interface GridLine { y: number; label: number; }
interface BarRow { name: string; count: number; pct: number; }

/** Client-side 10-per-page pager. */
class Pager<T> {
    rows: T[] = [];
    page = 1;
    constructor(public size = 10) { }
    set(rows: T[]) { this.rows = rows; this.page = 1; }
    get total() { return Math.max(1, Math.ceil(this.rows.length / this.size)); }
    get paged() { const s = (this.page - 1) * this.size; return this.rows.slice(s, s + this.size); }
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

/**
 * Export landing page (/dashboard), ported from MPERPNG-20 (88c283f, V8 parity +
 * six-section layout) and adapted to Links data. It replaces both the CoreUI
 * demo that used to sit on /dashboard and the V8 export home (export/home),
 * whose every number, table and chart is carried here.
 *
 * Counts one shipment per export job number (EXPT_NO) from the export master.
 * Source: Export/EXPT_EXPORT_DASHBOARD_Board (USP_EXPT_EXPORT_DASHBOARD_BOARD).
 * MP calls it twice, Mode 'SEA' and 'AIR'; Links is sea-only, so the AIR call is
 * skipped while AIR_ENABLED is false (see export-dashboard.model.ts).
 *
 * Each call returns result sets and the difference is load-bearing:
 *  - counts: EXHAUSTIVE jobs per stage for the window. Every headline figure
 *    (tiles, the stage chart, totals) is a true total.
 *  - job rows: the newest 50 jobs PER STAGE - a sample. At MUM a 90-day window
 *    holds about 1,270 jobs, so the lists built from rows (sailing risk, week
 *    ahead, departing next, detail, top 5) say so on screen.
 *
 * Prealert was removed from the Links dashboard by user decision (PREALERTDT is
 * never set in Links): no tile, no step, no card, no "Send prealert" link.
 *
 * The vessel list is a separate, slower call (Export/Export_Vessel_List).
 * All charts are inline SVG computed here.
 *
 * Rights-gated exactly like the V8 export home it replaces (FORM_ID 443): no View
 * right -> nothing renders, no redirect, and the menu still works. SA bypasses.
 */
@Component({
    selector: 'app-dashboard-home',
    templateUrl: 'dashboard.component.html',
    styleUrls: ['../export/dashboard/export-dashboard.css', './dashboard.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false,
})
export class DashboardComponent implements OnInit, OnDestroy {

    /*  tbl_mst_form id that gates this page. 449 on Manilal, 443 on Links - the two systems
        number their forms differently, so this constant differs between the two repos.
        (Kept from the V8 export home by user decision: access stays as it was.)
        To drop the gate, set this to null: checkRights() is its only reader, and the page
        then loads for every logged-in user, as in MPERPNG-20.                              */
    static readonly FORM_ID: string | null = '443';

    /*  Rights. null = not yet checked, false = denied: either way nothing renders. */
    canView: boolean | null = null;

    /** false on Links: no AIR board call, and every Air control, legend and column is hidden. */
    readonly air = AIR_ENABLED;

    readonly windows = [30, 90, 365];
    days = 90;

    cityName = '';
    fromLabel = '';
    toLabel = '';

    // ---- core source: export master job board ----
    loading = false;
    slow = false;
    failed = false;
    partial = '';           // 'Sea' | 'Air' when only one mode failed

    jobs: Job[] = [];       // the sampled job rows
    sampled = false;        // true when jobs[] is a per-stage sample of `total`

    total = 0;
    seaCount = 0;
    airCount = 0;
    seaPct = 0;
    airPct = 0;
    documented = 0;
    inProgress = 0;
    documentedPct = 0;

    stages: BoardStage[] = [];   // exhaustive per-stage totals, both modes summed
    readonly stageSteps = STAGES.length;

    buckets: Bucket[] = [];      // one per stage, for the bar chart
    readonly chartW = 640;
    readonly chartH = 250;
    readonly chartL = 34;
    readonly chartR = 8;
    readonly chartT = 14;
    readonly chartB = 26;
    gridLines: GridLine[] = [];
    barGeoms: BarGeom[] = [];
    tip: BarGeom | null = null;

    donutSeaPath = '';
    donutAirPath = '';

    topConsignees: BarRow[] = [];
    topCarriers: BarRow[] = [];

    departing: Job[] = [];
    riskPager = new Pager<RiskRow>();
    /** every job with no document whose vessel sails within RISK_DAYS, however late */
    riskAll: RiskRow[] = [];
    riskScope: 'attention' | 'stale' | 'all' = 'attention';
    riskAgent = '';
    riskExporter = '';
    riskAgents: string[] = [];
    riskExporters: string[] = [];
    dueSoonCount = 0;       // no document, sails today..RISK_DAYS
    lateCount = 0;          // no document, sailed in the last LATE_DAYS
    staleCount = 0;         // no document, sailed more than LATE_DAYS ago
    cancelledCount = 0;
    updatedAt: Date | null = null;
    chartMode: 'all' | 'Sea' | 'Air' = 'all';
    helpOpen = false;
    weekDays: WeekDay[] = [];
    recentPager = new Pager<Job>();

    /** Sailing risk: a job with no document whose vessel sails within this many days. */
    readonly RISK_DAYS = 3;
    /** ...or sailed up to this many days ago (older is paperwork to tidy, not risk). */
    readonly LATE_DAYS = 7;

    // ---- recent jobs filter ----
    search = '';
    modeFilter: 'all' | 'Sea' | 'Air' = 'all';
    stageFilter = -1;           // -1 = every stage
    agentFilter = '';
    exporterFilter = '';
    agentOptions: string[] = [];
    exporterOptions: string[] = [];
    hasExporters = false;
    readonly stageOptions = STAGES.map(s => ({ code: s.code, label: s.label }));

    // ---- shipments by agent (complete, from Table2) ----
    hasAgents = false;
    agentBars: AgentBar[] = [];
    agentCount = 0;

    // ---- week ahead ----
    week: WeekVessel[] = [];
    weekJobs = 0;
    weekReady = 0;

    // ---- slow source: vessel list ----
    sailLoading = false;
    sailSlow = false;
    sailFailed = false;
    sailings: Sailing[] = [];       // every vessel-list row with a readable ETD
    sailPager = new Pager<Sailing>();   // Vessels sailing next: today onwards, soonest first

    readonly skel5 = [1, 2, 3, 4, 5];

    private rightsSub: Subscription | null = null;
    private coreSub: Subscription | null = null;
    private sailSub: Subscription | null = null;
    private coreTimer: any = null;
    private sailTimer: any = null;

    constructor(
        private _router: Router,
        private _loginService: LoginService,
        private _board: ExportDashboardService,
        private _cd: ChangeDetectorRef,
    ) { }

    ngOnInit(): void { this.checkRights(); }

    ngOnDestroy(): void {
        this.rightsSub?.unsubscribe();
        this.coreSub?.unsubscribe();
        this.sailSub?.unsubscribe();
        this.clearTimers();
    }

    /** The window is applied server-side (Days), so changing it refetches. */
    setDays(d: number) {
        if (this.days === d) { return; }
        this.days = d;
        const { from, to } = this.range();
        this.fromLabel = this.dMonY(from);
        this.toLabel = this.dMonY(to);
        this.loadCore();
    }

    private login(): any { return (this._loginService.getLogin() || [])[0] || {}; }

    /*  ---- rights (same rule as the V8 export home and accounts-home) ---------------- */

    /*  The whole rights check, driven by FORM_ID (null = no gate). SA bypasses. load() only
        runs once canView is true. verifyRights only reports; checkVerify is the one that
        redirects and is deliberately not used here, so a user without the right still
        lands on a blank page with a working menu.                                          */
    checkRights() {
        const formId = DashboardComponent.FORM_ID;
        if (!formId || this.login().ROLETYPE == 'SA') {
            this.canView = true;
            this.load();
            return;
        }
        this.rightsSub = this._loginService.verifyRights(formId, '')
            .subscribe({
                next: (data: any) => {
                    let ok = false;
                    if (data && data.Table && data.Table.length > 0 && data.Table[0].STATUS == '100') {
                        const v = data.Table[0].viewForm;
                        ok = (v == 1 || v === true || v == '1' || v == 'true');
                    }
                    this.canView = ok;
                    if (ok) { this.load(); }
                    this._cd.markForCheck();
                },
                error: () => { this.canView = false; this._cd.markForCheck(); },
            });
    }

    private range() {
        const to = new Date();
        const from = new Date(to.getTime() - this.days * DAY);
        from.setHours(0, 0, 0, 0);
        return { from, to };
    }

    private clearTimers() {
        if (this.coreTimer) { clearTimeout(this.coreTimer); this.coreTimer = null; }
        if (this.sailTimer) { clearTimeout(this.sailTimer); this.sailTimer = null; }
    }

    load() {
        if (!this.canView) { return; }
        const login = this.login();
        const { from, to } = this.range();
        this.cityName = this.titleCase(login.CITYNAME || login.CITYCODE || '');
        this.fromLabel = this.dMonY(from);
        this.toLabel = this.dMonY(to);
        this.loadCore();
        this.loadSailings();
    }

    // ================= core: export master job board =================

    loadCore() {
        this.coreSub?.unsubscribe();
        if (this.coreTimer) { clearTimeout(this.coreTimer); }
        this.loading = true;
        this.slow = false;
        this.failed = false;
        this.partial = '';
        this.coreTimer = setTimeout(() => { this.slow = true; this._cd.markForCheck(); }, 8000);

        const call = (mode: 'SEA' | 'AIR') => this._board.getBoard(this.days, mode).pipe(
            timeout(180000),
            catchError(() => of(null as BoardView | null)),
        );
        // Links is sea-only: the AIR half is not requested while AIR_ENABLED is false.
        const air$ = this.air ? call('AIR') : of(null as BoardView | null);

        this.coreSub = forkJoin([call('SEA'), air$]).subscribe(([sea, air]) => {
            if (this.coreTimer) { clearTimeout(this.coreTimer); this.coreTimer = null; }
            if (!this.air) { if (!sea) { this.failed = true; } }
            else if (!sea && !air) { this.failed = true; }
            else if (!sea) { this.partial = 'Sea'; }
            else if (!air) { this.partial = 'Air'; }
            this.compute(sea, air);
            this.updatedAt = new Date();
            this.loading = false;
            this.slow = false;
            this._cd.markForCheck();
        });
    }

    private toJobs(mode: 'Sea' | 'Air', cards: BoardCard[]): Job[] {
        const seen = new Set<string>();
        const out: Job[] = [];
        const now = Date.now();
        for (const c of cards || []) {
            // one shipment per job number
            const exptno = (c.exptno || '').trim();
            if (!exptno || seen.has(exptno)) { continue; }
            seen.add(exptno);
            out.push({
                key: exptno,
                exptno,
                mode,
                stageCode: c.stageCode,
                stageLabel: c.stageLabel,
                document: c.document,
                opened: c.ageDays === null ? null : new Date(now - c.ageDays * DAY),
                etd: c.etdDate,
                etdStr: c.etd,
                consignee: c.consignee,
                carrier: c.vessel,
                ageDays: c.ageDays,
                cancelled: c.cancelled,
                agent: c.agent || '',
                exporter: c.exporter || '',
                docsIn: c.stageCode >= 6 && c.stageCode !== CANCELLED_CODE,
            });
        }
        return out;
    }

    // ================= slow: vessel list =================

    loadSailings() {
        this.sailSub?.unsubscribe();
        if (this.sailTimer) { clearTimeout(this.sailTimer); }
        this.sailLoading = true;
        this.sailSlow = false;
        this.sailFailed = false;
        this.sailTimer = setTimeout(() => { this.sailSlow = true; this._cd.markForCheck(); }, 8000);

        this.sailSub = this._board.getVessels().pipe(timeout(180000)).subscribe({
            next: (rows: VesselListRow[]) => {
                if (this.sailTimer) { clearTimeout(this.sailTimer); this.sailTimer = null; }
                this.sailings = [];
                for (const r of rows) {
                    const etd = this.parseDate(r.etd);
                    if (!etd || !r.name) { continue; }
                    this.sailings.push({ name: r.name, voy: r.voy, port: r.port, etd, etdStr: r.etd, rtno: r.rtno, days: this.dayDiff(etd), jobs: 0 });
                }
                this.computeSailings();
                this.buildWeek();
                this.sailLoading = false;
                this.sailSlow = false;
                this._cd.markForCheck();
            },
            error: () => {
                if (this.sailTimer) { clearTimeout(this.sailTimer); this.sailTimer = null; }
                this.sailLoading = false;
                this.sailSlow = false;
                this.sailFailed = true;
                this.sailings = [];
                this.sailPager.set([]);
                this.buildWeek();
                this._cd.markForCheck();
            },
        });
    }

    private computeSailings() {
        const upcoming = this.sailings
            .filter(s => s.days >= 0)
            .sort((a, b) => a.etd.getTime() - b.etd.getTime() || a.name.localeCompare(b.name));
        this.sailPager.set(upcoming);
    }

    /** Vessel-list rows sailing today..+6 (the V8 "Vessels sailing next" count). */
    get sailingsThisWeek(): number { return this.sailPager.rows.filter(s => s.days <= 6).length; }

    // ================= navigation =================

    open(s: Job) {
        if (s.exptno) { this._router.navigate(['/export/Consignment/view', s.exptno]); }
    }

    goConsignments() { this._router.navigate(['/export/Consignment/search']); }

    scrollTo(id: string) {
        setTimeout(() => { const el = document.getElementById(id); if (el && el.scrollIntoView) { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); } }, 0);
    }

    get greeting(): string {
        const h = new Date().getHours();
        return h < 12 ? 'Good morning' : (h < 17 ? 'Good afternoon' : 'Good evening');
    }

    get userName(): string { const l = this.login(); return this.str(l.USERNAME || l.CMP_USERNAME || ''); }

    get attentionCount(): number { return this.dueSoonCount + this.lateCount; }

    /** BL alone while Links is sea-only; BL / AWB once air is back. */
    get docLabel(): string { return this.air ? 'BL / AWB' : 'BL'; }

    /** Attention tile clicks: open the risk table on the matching scope. */
    showRisk(scope: 'attention' | 'stale' | 'all') { this.riskScope = scope; this.applyRisk(); this.scrollTo('ed-act'); }

    /** Pipeline step click: filter the detail table to that step (click again to clear). */
    pickStage(code: number) {
        this.stageFilter = +this.stageFilter === code ? -1 : code;
        if (this.chartMode !== 'all') { this.modeFilter = this.chartMode; }
        this.applyFilter();
        this.scrollTo('ed-detail');
    }

    pickAgent(name: string) {
        this.agentFilter = this.agentFilter === name ? '' : name;
        this.applyFilter();
        this.scrollTo('ed-detail');
    }

    setChartMode(m: 'all' | 'Sea' | 'Air') { this.chartMode = m; this.buildBarChart(); }

    setDaysSel(v: any) { this.setDays(+v); }

    // ================= computed dashboard data =================

    private compute(sea: BoardView | null, air: BoardView | null) {
        // --- exhaustive figures: the procedure's own per-stage counts ---
        const seaBy = this.countsByCode(sea);
        const airBy = this.countsByCode(air);

        this.seaCount = this.sum(seaBy);
        this.airCount = this.sum(airBy);
        this.total = this.seaCount + this.airCount;
        this.seaPct = this.total ? Math.round(this.seaCount / this.total * 1000) / 10 : 0;
        this.airPct = this.total ? Math.round(this.airCount / this.total * 1000) / 10 : 0;

        this.cancelledCount = (sea?.cancelled || 0) + (air?.cancelled || 0);
        this.stages = STAGES.map(s => ({ ...s, count: (seaBy.get(s.code) || 0) + (airBy.get(s.code) || 0) }));
        // a document number is recorded from stage 6 (document issued) onwards
        this.documented = this.stages.filter(s => s.code >= 6).reduce((a, s) => a + s.count, 0);
        this.inProgress = Math.max(0, this.total - this.documented);
        this.documentedPct = this.total ? Math.round(this.documented / this.total * 1000) / 10 : 0;

        this.buckets = STAGES.map(s => ({
            label: STAGE_SHORT[s.code] || s.label,
            full: s.label,
            code: s.code,
            sea: seaBy.get(s.code) || 0,
            air: airBy.get(s.code) || 0,
        }));
        this.buildBarChart();
        this.buildDonut();

        // --- sampled figures: the newest 50 jobs per stage, per mode ---
        this.jobs = [...this.toJobs('Sea', sea?.cards || []), ...this.toJobs('Air', air?.cards || [])];
        this.sampled = this.jobs.length < this.total;

        this.topConsignees = this.topN(this.jobs.map(j => j.consignee), 5);
        this.topCarriers = this.topN(this.jobs.map(j => this.carrierName(j)), 5);

        const today = new Date(); today.setHours(0, 0, 0, 0);
        const now = today.getTime();
        // departing next: ETD today or later, soonest first
        this.departing = this.jobs
            .filter(j => !j.cancelled && j.etd && (j.etd as Date).getTime() >= now)
            .sort((a, b) => (a.etd as Date).getTime() - (b.etd as Date).getTime())
            .slice(0, 10);
        // sailing risk: no document yet, vessel sails within RISK_DAYS or sailed in the last LATE_DAYS
        // (older ones are "older jobs to tidy up": usually the BL was just not entered)
        this.riskAll = this.jobs
            .filter(j => !j.cancelled && !j.docsIn && j.etd)
            .map(j => ({ job: j, days: this.dayDiff(j.etd as Date) }))
            .filter(r => r.days <= this.RISK_DAYS)
            .sort((a, b) => this.riskRank(a.days) - this.riskRank(b.days) || a.days - b.days);
        this.dueSoonCount = this.riskAll.filter(r => r.days >= 0).length;
        this.lateCount = this.riskAll.filter(r => r.days < 0 && r.days >= -this.LATE_DAYS).length;
        this.staleCount = this.riskAll.filter(r => r.days < -this.LATE_DAYS).length;
        this.riskAgents = this.distinct(this.riskAll.map(r => r.job.agent || '(no agent)'));
        this.riskExporters = this.distinct(this.riskAll.map(r => r.job.exporter || '(no exporter)'));
        if (this.riskAgent && this.riskAgents.indexOf(this.riskAgent) < 0) { this.riskAgent = ''; }
        if (this.riskExporter && this.riskExporters.indexOf(this.riskExporter) < 0) { this.riskExporter = ''; }
        this.applyRisk();

        this.hasExporters = this.jobs.some(j => !!j.exporter);
        this.agentOptions = this.distinct(this.jobs.map(j => j.agent || '(no agent)'));
        this.exporterOptions = this.distinct(this.jobs.map(j => j.exporter || '(no exporter)'));
        if (this.agentFilter && this.agentOptions.indexOf(this.agentFilter) < 0) { this.agentFilter = ''; }
        if (this.exporterFilter && this.exporterOptions.indexOf(this.exporterFilter) < 0) { this.exporterFilter = ''; }

        this.buildAgents(sea, air);
        this.buildWeek();
        this.applyFilter();
    }

    /** Sort key for the risk table: sailing soonest first, then recently sailed, then old paperwork. */
    private riskRank(days: number): number { return days >= 0 ? 0 : days >= -this.LATE_DAYS ? 1 : 2; }

    applyRisk() {
        this.riskPager.set(this.riskAll.filter(r =>
            (this.riskScope === 'all' ||
                (this.riskScope === 'stale' ? r.days < -this.LATE_DAYS : r.days >= -this.LATE_DAYS)) &&
            (!this.riskAgent || (r.job.agent || '(no agent)') === this.riskAgent) &&
            (!this.riskExporter || (r.job.exporter || '(no exporter)') === this.riskExporter)));
    }

    get riskScopeTotal(): number {
        return this.riskScope === 'all' ? this.riskAll.length : this.riskScope === 'stale' ? this.staleCount : this.attentionCount;
    }

    get hasRiskFilters(): boolean { return !!this.riskAgent || !!this.riskExporter; }

    clearRiskFilters() { this.riskAgent = ''; this.riskExporter = ''; this.applyRisk(); }

    /** Distinct names, most frequent first. */
    private distinct(list: string[]): string[] {
        const m = new Map<string, number>();
        list.forEach(x => m.set(x, (m.get(x) || 0) + 1));
        return Array.from(m.keys()).sort((a, b) => (m.get(b) as number) - (m.get(a) as number) || a.localeCompare(b));
    }

    // ================= recent jobs: search + mode/stage filter =================

    applyFilter() {
        const q = (this.search || '').trim().toUpperCase();
        const stage = +this.stageFilter;
        this.recentPager.set(this.jobs
            .filter(j =>
                (this.modeFilter === 'all' || j.mode === this.modeFilter) &&
                (stage < 0 || j.stageCode === stage) &&
                (!this.agentFilter || (j.agent || '(no agent)') === this.agentFilter) &&
                (!this.exporterFilter || (j.exporter || '(no exporter)') === this.exporterFilter) &&
                (!q || [j.exptno, j.consignee, j.carrier, j.document, j.agent, j.exporter]
                    .some(v => (v || '').toUpperCase().indexOf(q) >= 0)))
            .sort((a, b) => {
                const av = a.opened ? a.opened.getTime() : 0;
                const bv = b.opened ? b.opened.getTime() : 0;
                return bv !== av ? bv - av : b.exptno.localeCompare(a.exptno);
            }));
    }

    get hasFilters(): boolean {
        return !!this.search || this.modeFilter !== 'all' || +this.stageFilter >= 0 || !!this.agentFilter || !!this.exporterFilter;
    }

    clearFilters() {
        this.search = ''; this.modeFilter = 'all'; this.stageFilter = -1; this.agentFilter = ''; this.exporterFilter = '';
        this.applyFilter();
    }

    // ================= shipments by agent (Table2, complete counts) =================

    private buildAgents(sea: BoardView | null, air: BoardView | null) {
        this.hasAgents = !!(sea?.hasAgents || air?.hasAgents);
        const by = new Map<string, { n: number; sea: number; air: number }>();
        const add = (list: BoardAgentCount[] | undefined, mode: 'sea' | 'air') => (list || []).forEach(a => {
            if (a.stage === CANCELLED_CODE) { return; }
            const name = a.name || '(no agent)';
            const x = by.get(name) || { n: 0, sea: 0, air: 0 };
            x.n += a.n; x[mode] += a.n;
            by.set(name, x);
        });
        add(sea?.agents, 'sea');
        add(air?.agents, 'air');
        const all = Array.from(by.entries()).map(([name, x]) => ({ name, ...x }))
            .sort((a, b) => b.n - a.n || a.name.localeCompare(b.name));
        this.agentCount = all.length;
        const mx = all.length ? all[0].n : 1;
        this.agentBars = all.slice(0, 10).map(a => ({
            ...a,
            seaPct: Math.round(a.sea / mx * 1000) / 10,
            airPct: Math.round(a.air / mx * 1000) / 10,
        }));
    }

    // ================= week ahead: vessels sailing in the next 7 days =================

    /**
     * Vessels from the vessel list with ETD today..+6, each with the sampled jobs
     * on it. A job matches a vessel on VSL_NAME (trimmed, upper-cased) and the ETD
     * day - both sides come from VSL_MASTER / VSL_PORTDTLS, so no label parsing.
     * Jobs with an ETD this week whose vessel is not on the list get a row of
     * their own, so no job is lost. Also counts our jobs on every upcoming
     * vessel for "Vessels sailing next". Runs after either source lands.
     */
    private buildWeek() {
        const map = new Map<string, WeekVessel>();
        const key = (name: string, days: number) => (name || '').trim().toUpperCase() + '|' + days;
        for (const s of this.sailings) {
            if (s.days < 0 || s.days > 6) { continue; }
            const k = key(s.name, s.days);
            if (!map.has(k)) {
                map.set(k, { name: s.name, voy: s.voy, port: s.port, etd: s.etd, days: s.days, jobs: [], ready: 0, onList: true });
            }
        }
        const onVessel = new Map<string, number>();
        for (const j of this.jobs) {
            if (j.cancelled || !j.etd) { continue; }
            const days = this.dayDiff(j.etd);
            const [name, voy] = (j.carrier || '').split('/').map(x => x.trim());
            if (days >= 0) { const kk = key(name || '', days); onVessel.set(kk, (onVessel.get(kk) || 0) + 1); }
            if (days < 0 || days > 6) { continue; }
            const k = key(name || '(no vessel)', days);
            let v = map.get(k);
            if (!v) {
                v = { name: name || '(no vessel)', voy: voy || '', port: '', etd: j.etd, days, jobs: [], ready: 0, onList: false };
                map.set(k, v);
            }
            if (!v.voy && voy) { v.voy = voy; }
            v.jobs.push(j);
        }
        this.sailPager.rows.forEach(s => { s.jobs = onVessel.get(key(s.name, s.days)) || 0; });
        const out = Array.from(map.values());
        out.forEach(v => {
            v.jobs.sort((a, b) => Number(a.docsIn) - Number(b.docsIn) || a.exptno.localeCompare(b.exptno));
            v.ready = v.jobs.filter(j => j.docsIn).length;
        });
        this.week = out.sort((a, b) => a.days - b.days || b.jobs.length - a.jobs.length || a.name.localeCompare(b.name));
        this.weekJobs = out.reduce((t, v) => t + v.jobs.length, 0);
        this.weekReady = out.reduce((t, v) => t + v.ready, 0);
        const days = new Map<number, WeekDay>();
        for (const v of this.week) {
            let d = days.get(v.days);
            if (!d) { d = { days: v.days, date: v.etd, vessels: [], jobs: 0, ready: 0 }; days.set(v.days, d); }
            d.vessels.push(v); d.jobs += v.jobs.length; d.ready += v.ready;
        }
        this.weekDays = Array.from(days.values()).sort((a, b) => a.days - b.days);
    }

    /** Whole days from today (midnight) to d (midnight). */
    private dayDiff(d: Date): number {
        const t = new Date(); t.setHours(0, 0, 0, 0);
        const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        return Math.round((x.getTime() - t.getTime()) / DAY);
    }

    riskText(days: number): string {
        if (days < 0) { return (-days) + 'd late'; }
        return days === 0 ? 'today' : days === 1 ? 'tomorrow' : 'in ' + days + 'd';
    }

    weekDay(v: { days: number; date: Date }): string {
        return v.days === 0 ? 'Today' : v.days === 1 ? 'Tomorrow' : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][v.date.getDay()];
    }

    pct(n: number, of: number): number { return of ? Math.round(n * 100 / of) : 0; }

    stamp(d: Date | null): string {
        return d ? `${d.getDate()} ${MONTHS[d.getMonth()]}, ${('0' + d.getHours()).slice(-2)}:${('0' + d.getMinutes()).slice(-2)}` : '';
    }

    /** Per-stage counts of one mode's view, keyed by stage code. Cancelled jobs excluded. */
    private countsByCode(v: BoardView | null): Map<number, number> {
        const m = new Map<number, number>();
        for (const s of (v?.stages || [])) {
            if (s.code === CANCELLED_CODE) { continue; }
            m.set(s.code, s.count);
        }
        return m;
    }

    private sum(m: Map<number, number>): number {
        let n = 0;
        m.forEach(v => { n += v; });
        return n;
    }

    private carrierName(j: Job): string {
        // "VESSEL NAME / VOY 123" -> "VESSEL NAME"
        return (j.carrier || '').split(/[|\/,]/)[0].trim();
    }

    private topN(values: string[], n: number): BarRow[] {
        const counts = new Map<string, number>();
        values.forEach(v => { const k = (v || '').trim(); if (k) { counts.set(k, (counts.get(k) || 0) + 1); } });
        const top = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, n);
        const mx = top.length ? top[0][1] : 1;
        return top.map(([name, count]) => ({ name, count, pct: Math.round(count / mx * 1000) / 10 }));
    }

    private niceMax(max: number, ticks = 4): { step: number; max: number } {
        if (max <= 0) { return { step: 1, max: ticks }; }
        const rough = max / ticks;
        const mag = Math.pow(10, Math.floor(Math.log10(rough)));
        const norm = rough / mag;
        const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10) * mag;
        return { step, max: step * ticks };
    }

    private buildBarChart() {
        const n = this.buckets.length || 1;
        const L = this.chartL, R = this.chartR, T = this.chartT, B = this.chartB, W = this.chartW, H = this.chartH;
        const ih = H - T - B, iw = W - L - R, bw = iw / n;
        const src = this.buckets.map(b => ({
            ...b, sea: this.chartMode === 'Air' ? 0 : b.sea, air: this.chartMode === 'Sea' ? 0 : b.air,
        }));
        const { step, max } = this.niceMax(Math.max(1, ...src.map(b => b.sea + b.air)));
        this.gridLines = [0, 1, 2, 3, 4].map(m => ({ y: T + ih - (m * step) / max * ih, label: m * step }));
        this.barGeoms = src.map((b, i) => {
            const x = L + i * bw + bw * 0.2;
            const w = bw * 0.6;
            const hs = (b.sea / max) * ih;
            const ha = (b.air / max) * ih;
            const base = T + ih;
            const total = b.sea + b.air;
            let airPath: string | null = null;
            if (ha > 0.01) {
                const r = Math.min(4, w / 2, ha);
                const y0 = base - hs, yTop = base - hs - ha;
                airPath = `M${x},${y0} V${yTop + r} Q${x},${yTop} ${x + r},${yTop} H${x + w - r} Q${x + w},${yTop} ${x + w},${yTop + r} V${y0} Z`;
            }
            return {
                seaX: x, seaY: base - hs, seaW: w, seaH: hs, airPath,
                labelX: x + w / 2, labelY: H - 8, label: b.label,
                hitX: L + i * bw, hitY: T, hitW: bw, hitH: ih, code: b.code,
                tipX: x + w / 2, tipY: base - hs - ha, sea: b.sea, air: b.air, total,
                fullLabel: b.full,
            };
        });
    }

    showTip(g: BarGeom) { this.tip = g; }
    hideTip() { this.tip = null; }

    private buildDonut() {
        const cx = 100, cy = 100, R = 90, r = 60;
        const arc = (a0: number, a1: number) => {
            const p = (rad: number, a: number) => [cx + rad * Math.cos(a), cy + rad * Math.sin(a)];
            const [x0, y0] = p(R, a0), [x1, y1] = p(R, a1), [x2, y2] = p(r, a1), [x3, y3] = p(r, a0);
            return `M${x0} ${y0}A${R} ${R} 0 0 1 ${x1} ${y1}L${x2} ${y2}A${r} ${r} 0 0 0 ${x3} ${y3}Z`;
        };
        if (!this.total) { this.donutSeaPath = ''; this.donutAirPath = ''; return; }
        const gap = (this.seaCount && this.airCount) ? 0.012 : 0;
        const mid = Math.PI + Math.PI * this.seaCount / this.total;
        this.donutSeaPath = this.seaCount ? arc(Math.PI, mid - gap) : '';
        this.donutAirPath = this.airCount ? arc(mid + gap, 2 * Math.PI) : '';
    }

    get donutEmptyPath(): string {
        return 'M10 100A90 90 0 0 1 190 100L160 100A60 60 0 0 0 40 100Z';
    }

    // ================= formatting / parsing =================

    private str(v: any): string { return v === null || v === undefined ? '' : String(v).trim(); }

    /** Accepts dd/MM/yyyy, dd-MM-yyyy, dd-MMM-yyyy, dd MMM yyyy and ISO strings. */
    private parseDate(v: any): Date | null {
        const s = this.str(v);
        if (!s) { return null; }
        let m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
        if (m) { return new Date(+m[1], +m[2] - 1, +m[3], 12); }
        m = /(\d{1,2})[\/\-. ](\d{1,2})[\/\-. ](\d{4})/.exec(s);
        if (m) { return new Date(+m[3], +m[2] - 1, +m[1], 12); }
        m = /(\d{1,2})[\/\-. ]([A-Za-z]{3})[A-Za-z]*[\/\-. ,]+(\d{2,4})/.exec(s);
        if (m) {
            const mi = MONTHS.findIndex(x => x.toLowerCase() === m![2].toLowerCase());
            if (mi >= 0) { const y = +m[3] < 100 ? 2000 + +m[3] : +m[3]; return new Date(y, mi, +m[1], 12); }
        }
        return null;
    }

    private titleCase(s: string): string { return s.toLowerCase().replace(/\b\w/g, c => c.toUpperCase()); }

    fmt(n: number): string { return Math.round(n).toLocaleString('en-IN'); }
    dMonY(d: Date | null): string { return d ? `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}` : '—'; }
    day(d: Date | null): string { return d ? '' + d.getDate() : '–'; }
    mon(d: Date | null): string { return d ? MONTHS[d.getMonth()] : ''; }

    daysUntil(d: Date | null): string {
        if (!d) { return ''; }
        const today = new Date(); today.setHours(12, 0, 0, 0);
        const n = Math.round((d.getTime() - today.getTime()) / DAY);
        return n <= 0 ? 'today' : n === 1 ? 'tomorrow' : 'in ' + n + 'd';
    }
}
