import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { LoginService } from '../../shared/service/loginService';
import { ToastCommonService } from '../../shared/service/toastService';
import { BoardJob, ExportHomeData, ExportHomeService, VesselRow } from './export-home.service';

/*  Export module home.

    Laid out in the order people actually ask their questions when they land here:
      1. Is anything going wrong?     status strip - late / due-soon jobs, or "all clear"
      2. What is coming up?           next 7 days: vessels sailing and our jobs on them
      3. Where is the work?           the stage pipeline, left to right
      4. Where is my job?             searchable, filterable list of recent jobs
      5. The bigger picture           mode split, top consignees, top vessels

    Two kinds of figure, and the page says which is which:
      - EXACT   headline numbers and the pipeline - complete per-stage counts from the board.
      - SAMPLE  risk list, timeline jobs, job list, top-5 lists - the job rows the board returns
                (newest 50 per stage per mode), so they are a floor, never a total.

    Rights-gated like the Accounts home: no View right on FORM_ID -> nothing renders, no
    redirect, and the menu still works. SA bypasses.                                          */

interface StageDef { code: number; short: string; long: string; icon: string; }
interface RiskItem { job: BoardJob; etd: Date; days: number; }
interface DayGroup { date: Date; days: number; vessels: VesselRow[]; jobs: BoardJob[]; }

@Component({
    selector: 'app-export-home',
    templateUrl: './export-home.component.html',
    styleUrls: ['./export-home.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class ExportHomeComponent implements OnInit {

    /*  tbl_mst_form id that gates this page. 449 on Manilal, 443 on Links - the two systems
        number their forms differently, so this constant differs between the two repos.    */
    static readonly FORM_ID = '443';

    readonly stages: StageDef[] = [
        { code: 0, short: 'Opened',     long: 'Job opened',      icon: 'fa-folder-open-o' },
        { code: 1, short: 'Ship. bill', long: 'Shipping bill',   icon: 'fa-file-o' },
        { code: 2, short: 'Cargo recd', long: 'Cargo received',  icon: 'fa-cube' },
        { code: 3, short: 'Carted',     long: 'Carted',          icon: 'fa-truck' },
        { code: 4, short: 'Container',  long: 'Containerised',   icon: 'fa-archive' },
        { code: 5, short: 'Out charge', long: 'Out of charge',   icon: 'fa-check-square-o' },
        { code: 6, short: 'Documented', long: 'Document issued', icon: 'fa-file-text-o' },
        { code: 7, short: 'Prealert',   long: 'Prealert sent',   icon: 'fa-paper-plane-o' }
    ];

    /*  A job whose vessel sails within this many days and has no document yet is "due soon". */
    readonly RISK_DAYS = 3;
    /*  A job that sailed up to this many days ago without a document still "needs attention";
        older than that it is listed as paperwork to tidy up.                                  */
    readonly LATE_DAYS = 7;

    canView: boolean = null;
    login: any = null;

    days: number = 90;
    busy: boolean = false;
    failed: boolean = false;
    failReason: string = '';
    loaded: boolean = false;
    updatedAt: Date = null;

    windowFrom: Date = null;
    windowTo: Date = null;

    // exact
    total = 0; sea = 0; air = 0; documented = 0; inProgress = 0; cancelled = 0;
    pipeline: { def: StageDef; sea: number; air: number; total: number }[] = [];

    // sample
    jobs: BoardJob[] = [];
    late: RiskItem[] = [];
    dueSoon: RiskItem[] = [];
    showAllRisk = false;
    stale: RiskItem[] = [];
    showStale = false;
    week: DayGroup[] = [];
    vesselsThisWeek = 0;
    jobsThisWeek = 0;
    topConsignees: { name: string; n: number }[] = [];
    topVessels: { name: string; n: number }[] = [];

    // the new ERP's three operational panels
    upcoming: { row: VesselRow; etd: Date; days: number }[] = [];   // every vessel sailing today onwards
    showAllVessels = false;
    riskAll: RiskItem[] = [];                                          // sailing risk, however late
    departing: RiskItem[] = [];                                        // next 6 jobs by ETD

    // job list
    recent: BoardJob[] = [];
    search = '';
    modeFilter = 'all';          // all | sea | air
    stageFilter = -1;            // -1 = every stage
    agentFilter = '';            // '' = every agent, else the agent name
    exporterFilter = '';         // '' = every exporter (shipper), else the exporter name
    exporterOptions: string[] = [];
    hasExporters = false;

    /*  Sailing risk filters: agent-wise and exporter-wise. */
    riskAgent = '';
    riskExporter = '';

    /*  Agents (28-Sep-2026). The board's Table2 gives complete job counts per agent and stage.
        Prealert is sent for agent MP Cargo only, so the prealert figures are MP Cargo's:
        documents issued (stage 6) = prealert still to send, stage 7 = prealert sent.
        hasAgents is false while the procedure is the older one without the agent.            */
    hasAgents = false;
    agentTotals: { name: string; n: number; sea: number; air: number }[] = [];   // all agents, busiest first
    agentOptions: string[] = [];
    mpDocIssued = 0;             // MP Cargo, document issued, prealert not yet sent (complete count)
    mpPrealertSent = 0;          // MP Cargo, prealert sent (complete count)
    mpTotal = 0;                 // MP Cargo jobs in the window
    prealertDue: BoardJob[] = [];   // MP Cargo stage-6 jobs from the sample, oldest first
    showAllPrealert = false;
    page = 1;
    readonly pageSize = 10;

    // look
    dark = false;
    helpOpen = false;
    private static readonly DARK_KEY = 'EXP_HOME_DARK';

    constructor(private _service: ExportHomeService,
        private _loginService: LoginService,
        private _toasterService: ToastCommonService) { }

    ngOnInit() {
        try { this.dark = localStorage.getItem(ExportHomeComponent.DARK_KEY) == '1'; } catch (e) { this.dark = false; }
        this.login = this._loginService.getLogin()[0];
        try {
            const d = +sessionStorage.getItem('eh.days');
            if (d === 30 || d === 90 || d === 365) { this.days = d; }
        } catch (e) { }
        this.checkRights();
    }

    toggleDark(): void {
        this.dark = !this.dark;
        try { localStorage.setItem(ExportHomeComponent.DARK_KEY, this.dark ? '1' : '0'); } catch (e) { }
    }

    /*  ---- rights (same rule as accounts-home) ---------------------------------------- */

    checkRights() {
        if (this.login && this.login.ROLETYPE == 'SA') {
            this.canView = true;
            this.load();
            return;
        }
        // verifyRights only reports; checkVerify is the one that redirects and is not used here.
        this._loginService.verifyRights(ExportHomeComponent.FORM_ID, '')
            .subscribe((data: any) => {
                let ok = false;
                if (data && data.Table && data.Table.length > 0 && data.Table[0].STATUS == '100') {
                    const v = data.Table[0].viewForm;
                    ok = (v == 1 || v === true || v == '1' || v == 'true');
                }
                this.canView = ok;
                if (ok) { this.load(); }
            }, () => { this.canView = false; });
    }

    /*  ---- data ----------------------------------------------------------------------- */

    setDays(d: number) {
        if (this.days === d || this.busy) { return; }
        this.days = d;
        try { sessionStorage.setItem('eh.days', String(d)); } catch (e) { }
        this.load();
    }

    load() {
        if (!this.login) { return; }
        this.busy = true;
        this.failed = false;
        this.failReason = '';

        this._service.load(this.login.CMPCODE, this.login.CITYCODE, this.days)
            .subscribe((data: ExportHomeData) => {
                this.busy = false;
                this.loaded = true;
                this.updatedAt = new Date();
                this.build(data);
            }, (err: any) => {
                this.busy = false;
                this.loaded = true;
                this.failed = true;
                this.failReason = (err && err.message) ? err.message : '';
                this._toasterService.toast('error', 'error', 'Could not load the Export dashboard.');
            });
    }

    private build(data: ExportHomeData) {
        const today = this.today();
        this.windowTo = today;
        this.windowFrom = new Date(today.getTime() - this.days * 86400000);

        // ---- exact counts
        const count = (half: { counts: { stage: number; n: number }[] }, code: number) =>
            half.counts.filter(c => c.stage === code).reduce((s, c) => s + c.n, 0);

        this.pipeline = this.stages.map(def => {
            const s = count(data.sea, def.code), a = count(data.air, def.code);
            return { def: def, sea: s, air: a, total: s + a };
        });
        this.sea = this.pipeline.reduce((s, b) => s + b.sea, 0);
        this.air = this.pipeline.reduce((s, b) => s + b.air, 0);
        this.total = this.sea + this.air;
        this.documented = this.pipeline.filter(b => b.def.code >= 6).reduce((s, b) => s + b.total, 0);
        this.inProgress = this.total - this.documented;
        this.cancelled = count(data.sea, 99) + count(data.air, 99);

        // ---- sample rows (cancelled jobs are not work in hand)
        this.jobs = data.sea.jobs.concat(data.air.jobs).filter(j => !j.CANCELLED && j.STAGE_CODE !== 99);

        const withEtd = this.jobs
            .map(j => ({ job: j, etd: this.parseDmy(j.ETD) }))
            .filter(x => x.etd !== null)
            .map(x => ({ job: x.job, etd: x.etd, days: this.dayDiff(x.etd, today) }));

        // needs attention: no document yet and the vessel has sailed / sails within RISK_DAYS
        //  Only current action counts as "attention": sailing within RISK_DAYS, or sailed in the
        //  last LATE_DAYS. Jobs whose ETD is long gone with no BL recorded are paperwork to tidy,
        //  not an emergency, so they sit in a quiet list of their own instead of a big red number.
        const atRisk = withEtd
            .filter(x => x.job.STAGE_CODE < 6 && x.days <= this.RISK_DAYS)
            .sort((a, b) => a.etd.getTime() - b.etd.getTime());
        this.late = atRisk.filter(x => x.days < 0 && x.days >= -this.LATE_DAYS);
        this.dueSoon = atRisk.filter(x => x.days >= 0);
        this.stale = atRisk.filter(x => x.days < -this.LATE_DAYS);
        this.showAllRisk = false;
        this.showStale = false;

        // ---- the next 7 days: vessels from the vessel list, our jobs from the sample
        const vessels = (data.vessels || [])
            .map(v => ({ row: v, etd: this.parseDmy(this.findDmy(v.VSLDET)) }))
            .filter(v => v.etd !== null);
        const groups: DayGroup[] = [];
        for (let d = 0; d < 7; d++) {
            const date = new Date(today.getTime() + d * 86400000);
            const vs = vessels.filter(v => this.dayDiff(v.etd, date) === 0).map(v => v.row);
            const js = withEtd.filter(x => x.days === d).map(x => x.job)
                .sort((a, b) => a.STAGE_CODE - b.STAGE_CODE);
            if (vs.length || js.length) { groups.push({ date: date, days: d, vessels: vs, jobs: js }); }
        }
        this.week = groups;
        this.vesselsThisWeek = groups.reduce((s, g) => s + g.vessels.length, 0);
        this.jobsThisWeek = groups.reduce((s, g) => s + g.jobs.length, 0);

        // ---- vessels sailing next: every vessel from today on, soonest first
        this.upcoming = vessels
            .map(v => ({ row: v.row, etd: v.etd, days: this.dayDiff(v.etd, today) }))
            .filter(v => v.days >= 0)
            .sort((a, b) => a.etd.getTime() - b.etd.getTime());
        this.showAllVessels = false;

        // ---- sailing risk: every job with no document whose vessel sails within RISK_DAYS or has
        //      already sailed, however long ago - soonest ETD first
        this.riskAll = atRisk;

        // ---- departing next: the next 6 jobs by ETD, from today on
        this.departing = withEtd
            .filter(x => x.days >= 0)
            .sort((a, b) => a.etd.getTime() - b.etd.getTime() || (a.job.EXPTNO < b.job.EXPTNO ? 1 : -1))
            .slice(0, 6);

        // ---- bigger picture
        this.topConsignees = this.top(this.jobs.map(j => (j.CONSIGNEE || '').trim()));
        this.topVessels = this.top(this.jobs.map(j => (j.VSL_NAME || '').trim()));

        // ---- agents: complete counts from Table2 of both halves
        this.hasAgents = data.sea.hasAgents || data.air.hasAgents;
        const byAgent: { [k: string]: { name: string; n: number; sea: number; air: number } } = {};
        const add = (list: { name: string; stage: number; n: number }[], mode: 'sea' | 'air') => list.forEach(a => {
            if (a.stage === 99) { return; }
            const name = a.name || '(no agent)';
            const x = byAgent[name] || (byAgent[name] = { name: name, n: 0, sea: 0, air: 0 });
            x.n += a.n; x[mode] += a.n;
        });
        add(data.sea.agents || [], 'sea');
        add(data.air.agents || [], 'air');
        this.agentTotals = Object.keys(byAgent).map(k => byAgent[k]).sort((a, b) => b.n - a.n || (a.name < b.name ? -1 : 1));
        this.agentOptions = this.agentTotals.map(a => a.name);
        // exporters (shippers): from the job rows, busiest first
        this.hasExporters = this.jobs.some(j => !!j.EXPORTER);
        const ex: { [k: string]: number } = {};
        this.jobs.forEach(j => { const k = j.EXPORTER || '(no exporter)'; ex[k] = (ex[k] || 0) + 1; });
        this.exporterOptions = Object.keys(ex).sort((a, b) => ex[b] - ex[a] || (a < b ? -1 : 1));
        if (this.exporterFilter && this.exporterOptions.indexOf(this.exporterFilter) < 0) { this.exporterFilter = ''; }
        if (this.agentFilter && this.agentOptions.indexOf(this.agentFilter) < 0) { this.agentFilter = ''; }
        const mp = (data.sea.agents || []).concat(data.air.agents || []).filter(a => this.isMpCargo(a.name));
        this.mpDocIssued = mp.filter(a => a.stage === 6).reduce((t, a) => t + a.n, 0);
        this.mpPrealertSent = mp.filter(a => a.stage === 7).reduce((t, a) => t + a.n, 0);
        this.mpTotal = mp.filter(a => a.stage !== 99).reduce((t, a) => t + a.n, 0);
        this.prealertDue = this.jobs.filter(j => j.STAGE_CODE === 6 && this.isMpCargo(j.AGENT))
            .sort((a, b) => this.time(a.SYSEXPT_DOCRECD) - this.time(b.SYSEXPT_DOCRECD));
        this.showAllPrealert = false;

        // ---- job list, newest opened first
        this.recent = this.jobs.slice().sort((a, b) =>
            this.time(b.SYSEXPT_DOCRECD) - this.time(a.SYSEXPT_DOCRECD) || (a.EXPTNO < b.EXPTNO ? 1 : -1));
        this.page = 1;
    }

    /*  ---- status strip -------------------------------------------------------------- */

    get attentionCount(): number { return this.late.length + this.dueSoon.length; }

    get vesselsShown() { return this.showAllVessels ? this.upcoming : this.upcoming.slice(0, 6); }
    get vesselsWeek(): number { return this.upcoming.filter(v => v.days <= 6).length; }
    inDays(d: number): string { return d === 0 ? 'today' : d === 1 ? 'tomorrow' : 'in ' + d + 'd'; }
    riskDays(d: number): string { return d < 0 ? (-d) + ' late' : d === 0 ? 'today' : d + ' left'; }

    get riskShown(): RiskItem[] {
        const all = this.late.concat(this.dueSoon);
        return this.showAllRisk ? all : all.slice(0, 6);
    }

    greeting(): string {
        const h = new Date().getHours();
        return h < 12 ? 'Good morning' : (h < 17 ? 'Good afternoon' : 'Good evening');
    }

    userName(): string {
        return this.login ? (this.login.USERNAME || this.login.CMP_USERNAME || '') : '';
    }

    /*  ---- view helpers ---------------------------------------------------------------- */

    get sampleSize(): number { return this.jobs.length; }

    pct(n: number, of: number, dp: number = 0): string {
        if (!of) { return '0'; }
        const p = n * 100 / of;
        return dp ? p.toFixed(dp) : String(Math.round(p));
    }

    stageName(code: number): string {
        if (code === 99) { return 'Cancelled'; }
        const s = this.stages.find(x => x.code === code);
        return s ? s.long : '';
    }

    /*  0-100: how far along the ladder a job is, for the little progress bar in the list. */
    stageProgress(code: number): number {
        return Math.round((Math.min(code, 7) + 1) * 100 / 8);
    }

    modeLabel(j: BoardJob): string { return j.MODE === 'air' ? 'Air' : 'Sea'; }

    documentNo(j: BoardJob): string {
        return j.HBLNO || j.BLNO || j.HAWB || j.MAWB || '';
    }

    vesselVoyage(j: BoardJob): string {
        if (!j.VSL_NAME) { return ''; }
        return j.VSL_VOYNO ? j.VSL_NAME + ' / ' + j.VSL_VOYNO : j.VSL_NAME;
    }

    /*  The vessel list's VSLDET differs between databases, e.g.
          "VSL NAME : CHARLESTON EXPRESS ( 638W ) & ETD : 26/09/2026"
          "CHARLESTON EXPRESS - 638W ( 202610463 ) 26/09/2026 - NH1"
        vesselName() pulls out the ship's name, vesselVoy() the voyage when it is in brackets.   */
    vesselName(v: VesselRow): string {
        let s = (v.VSLDET || '').replace(/^\s*VSL\s*NAME\s*:\s*/i, '');
        s = s.replace(/&\s*ETD.*$/i, '').replace(/\d{2}\/\d{2}\/\d{4}.*$/, '');
        s = s.replace(/\([^)]*\)/g, '').replace(/\s+-\s+\S+\s*$/, '');
        return s.replace(/[\s\-&]+$/, '').trim() || v.VSLDET;
    }

    vesselVoy(v: VesselRow): string {
        const m = /VSL\s*NAME\s*:[^(]*\(\s*([^)]+?)\s*\)/i.exec(v.VSLDET || '') || /\s-\s(\S+)\s*\(/.exec(v.VSLDET || '');
        return m ? m[1] : '';
    }

    jobsOnVessel(g: DayGroup, v: VesselRow): number {
        const name = this.vesselName(v).toUpperCase();
        return g.jobs.filter(j => j.VSL_NAME && j.VSL_NAME.trim().toUpperCase() === name).length;
    }

    readyCount(g: DayGroup): number { return g.jobs.filter(j => j.STAGE_CODE >= 6).length; }

    ageDays(j: BoardJob): number {
        const t = this.time(j.SYSEXPT_DOCRECD);
        if (!t) { return null; }
        const d = new Date(t);
        return this.dayDiff(this.today(), new Date(d.getFullYear(), d.getMonth(), d.getDate()));
    }

    openedOn(j: BoardJob): Date {
        const t = this.time(j.SYSEXPT_DOCRECD);
        return t ? new Date(t) : null;
    }

    dayLabel(days: number): string {
        if (days === 0) { return 'Today'; }
        if (days === 1) { return 'Tomorrow'; }
        return 'In ' + days + ' days';
    }

    riskText(days: number): string {
        if (days < 0) { return 'sailed ' + (-days) + (days === -1 ? ' day' : ' days') + ' ago'; }
        if (days === 0) { return 'sails today'; }
        if (days === 1) { return 'sails tomorrow'; }
        return 'sails in ' + days + ' days';
    }

    barMax(list: { n: number }[]): number {
        return list.length ? Math.max.apply(null, list.map(x => x.n)) : 1;
    }

    get pipeMax(): number { return Math.max(1, ...this.pipeline.map(p => p.total)); }

    /*  ---- mode split ring ------------------------------------------------------------- */

    readonly ringLen = 2 * Math.PI * 52;   // r = 52
    get seaDash(): string {
        const f = this.total ? this.sea / this.total : 0;
        return (f * this.ringLen) + ' ' + this.ringLen;
    }

    /*  ---- job list: search, filters, pager -------------------------------------------------- */

    get filtered(): BoardJob[] {
        const q = (this.search || '').trim().toUpperCase();
        return this.recent.filter(j =>
            (this.modeFilter === 'all' || j.MODE === this.modeFilter) &&
            (!this.agentFilter || (j.AGENT || '(no agent)') === this.agentFilter) &&
            (!this.exporterFilter || (j.EXPORTER || '(no exporter)') === this.exporterFilter) &&
            (this.stageFilter < 0 || j.STAGE_CODE === this.stageFilter) &&
            (!q || (j.EXPTNO || '').toUpperCase().indexOf(q) >= 0
                || (j.CONSIGNEE || '').toUpperCase().indexOf(q) >= 0
                || (j.VSL_NAME || '').toUpperCase().indexOf(q) >= 0
                || (j.AGENT || '').toUpperCase().indexOf(q) >= 0
                || (j.EXPORTER || '').toUpperCase().indexOf(q) >= 0
                || this.documentNo(j).toUpperCase().indexOf(q) >= 0));
    }

    onFilter() { this.page = 1; }

    setMode(m: string) { this.modeFilter = m; this.page = 1; }

    /*  Clicking a pipeline stage filters the job list to it and scrolls there. */
    pickStage(code: number, el?: HTMLElement) {
        this.stageFilter = this.stageFilter === code ? -1 : code;
        this.page = 1;
        if (el && el.scrollIntoView) { setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0); }
    }

    clearFilters() { this.search = ''; this.modeFilter = 'all'; this.stageFilter = -1; this.agentFilter = ''; this.exporterFilter = ''; this.page = 1; }

    get hasFilters(): boolean { return !!this.search || this.modeFilter !== 'all' || this.stageFilter >= 0 || !!this.agentFilter || !!this.exporterFilter; }

    /*  ---- sailing risk: agent-wise and exporter-wise ---- */
    get riskAgents(): string[] { return this.distinct(this.riskAll.map(r => r.job.AGENT || '(no agent)')); }
    get riskExporters(): string[] { return this.distinct(this.riskAll.map(r => r.job.EXPORTER || '(no exporter)')); }
    get riskFiltered(): RiskItem[] {
        return this.riskAll.filter(r =>
            (!this.riskAgent || (r.job.AGENT || '(no agent)') === this.riskAgent) &&
            (!this.riskExporter || (r.job.EXPORTER || '(no exporter)') === this.riskExporter));
    }
    clearRiskFilters() { this.riskAgent = ''; this.riskExporter = ''; }
    /*  Distinct names, most frequent first. */
    private distinct(list: string[]): string[] {
        const m: { [k: string]: number } = {};
        list.forEach(x => m[x] = (m[x] || 0) + 1);
        return Object.keys(m).sort((a, b) => m[b] - m[a] || (a < b ? -1 : 1));
    }

    /*  Clicking an agent (busiest agents list) filters the job list to it and scrolls there. */
    pickAgent(name: string, el?: HTMLElement) {
        this.agentFilter = this.agentFilter === name ? '' : name;
        this.page = 1;
        if (el && el.scrollIntoView) { setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0); }
    }

    /*  MP Cargo, however the supplier name is written: "MP CARGO", "M.P. Cargo France", "M P CARGO". */
    isMpCargo(name: string): boolean { return /\bM\.?\s*P\.?\s*CARGO/i.test(name || ''); }

    get prealertShown(): BoardJob[] { return this.showAllPrealert ? this.prealertDue : this.prealertDue.slice(0, 6); }
    get agentMax(): number { return this.agentTotals.length ? this.agentTotals[0].n : 1; }

    get pageCount(): number { return Math.max(1, Math.ceil(this.filtered.length / this.pageSize)); }
    get pageRows(): BoardJob[] {
        const s = (this.page - 1) * this.pageSize;
        return this.filtered.slice(s, s + this.pageSize);
    }
    get pageFrom(): number { return this.filtered.length ? (this.page - 1) * this.pageSize + 1 : 0; }
    get pageTo(): number { return Math.min(this.filtered.length, this.page * this.pageSize); }

    /*  1 2 … 18 19 around the current page; null marks a gap. */
    get pageLinks(): number[] {
        const n = this.pageCount, p = this.page, set: number[] = [];
        [1, 2, p - 1, p, p + 1, n - 1, n].forEach(x => {
            if (x >= 1 && x <= n && set.indexOf(x) < 0) { set.push(x); }
        });
        set.sort((a, b) => a - b);
        const out: number[] = [];
        set.forEach((x, i) => {
            if (i > 0 && x - set[i - 1] > 1) { out.push(null); }
            out.push(x);
        });
        return out;
    }

    goPage(p: number) {
        if (p >= 1 && p <= this.pageCount) { this.page = p; }
    }

    trackByExptno(i: number, j: BoardJob) { return j.EXPTNO; }
    trackByRisk(i: number, r: RiskItem) { return r.job.EXPTNO; }

    /*  ---- small utilities -------------------------------------------------------------- */

    private top(names: string[]): { name: string; n: number }[] {
        const m: { [k: string]: number } = {};
        names.filter(n => !!n).forEach(n => m[n] = (m[n] || 0) + 1);
        return Object.keys(m).map(k => ({ name: k, n: m[k] }))
            .sort((a, b) => b.n - a.n || (a.name < b.name ? -1 : 1))
            .slice(0, 5);
    }

    private today(): Date {
        const n = new Date();
        return new Date(n.getFullYear(), n.getMonth(), n.getDate());
    }

    /*  whole days from b to a (a - b), both taken at midnight */
    private dayDiff(a: Date, b: Date): number {
        return Math.round((a.getTime() - b.getTime()) / 86400000);
    }

    private findDmy(s: string): string {
        const m = /(\d{2}\/\d{2}\/\d{4})/.exec(s || '');
        return m ? m[1] : '';
    }

    /*  dd/MM/yyyy -> Date, or null. Never hand these strings to new Date(): it reads them as MM/dd. */
    private parseDmy(s: string): Date {
        const m = /^\s*(\d{1,2})\/(\d{1,2})\/(\d{4})\s*$/.exec(s || '');
        if (!m) { return null; }
        const d = new Date(+m[3], +m[2] - 1, +m[1]);
        return (d.getMonth() === +m[2] - 1) ? d : null;
    }

    private time(v: any): number {
        if (!v) { return 0; }
        const t = new Date(v).getTime();
        return isNaN(t) ? 0 : t;
    }
}
