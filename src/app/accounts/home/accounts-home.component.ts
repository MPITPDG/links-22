import { Component, HostListener, Input, OnInit, OnDestroy, NgZone, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { DataService } from '../../shared/service/dataService';
import { LoginService } from '../../shared/service/loginService';
import { ToastCommonService } from '../../shared/service/toastService';
import { LoaderService } from '../../shared/service/loader.service';
import { ExportexcelService } from '../../shared/service/exportexcel.service';
import { finFigure } from '../Accreport/fin-kit';

/*  Accounts module home.

    What a Finance user sees the moment they click the Finance module: month-to-date invoicing,
    collections, outstanding, overdue and GOP, jobs by mode, ageing, the top debtors and a
    30-day invoicing trend. One call to Accounts/ACC_RPT_ACCOUNTS_HOME, which the API caches for
    ten minutes, so the page paints in well under a second on every visit but the first.

    Layout (from MPERPNG-20): header row, Needs attention tiles, Act now (clients to chase,
    earned but not collected), This week (cash position, forecast, DSO vs DPO), Workload
    picture (KPI cards, ageing, jobs by mode, 30-day trend), Detail (the drill-down tables,
    10 rows a page) and Reference (top clients, quick links, a collapsed "How this page works").
    Greyscale house style, no look mode. Styles: the global dashboard kit (.im-dash,
    src/styles/kit/import-home.css) plus accounts-home.component.css.

    Rights-gated (see VIEW_GATE_FORM_ID). If the user has no View right on the gate form,
    nothing renders and the page is the blank home it has always been - no redirect, no
    message. That is deliberate: this is the landing page of the module, and a user who cannot
    see the summary must still be able to land here and use the menu.

    The figures are the Finance Dashboard's figures, cut down. Anything that needs explaining is
    explained in ACCOUNTS_HOME_SETUP.sql, not re-derived here.                                  */
@Component({
    selector: 'app-accounts-home',
    templateUrl: './accounts-home.component.html',
    styleUrls: ['./accounts-home.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class AccountsHomeComponent implements OnInit, OnDestroy {

    /*  THE rights gate for this page, and the only place it is configured: the tbl_mst_form id
        whose View right shows the summary (SA always sees it). 438 on Links. MPERPNG-20 uses
        447, which in LinksDB20 is "Mgmt day-end all branches", so do not copy MP's value.
        To drop gating, set this to null: the page then loads for every logged-in user, as the
        Import home does. checkViewGate() is the only reader.                              */
    static readonly VIEW_GATE_FORM_ID: string | null = '438';

    /*  Future use: the same component on the Export / Import homes, where finance tiles are
        not shown. Only 'accounts' exists today.                                           */
    @Input() scope: string = 'accounts';

    /*  Rights. null = not yet checked (render nothing), false = denied (render nothing). */
    canView: boolean = null;

    login: any = null;
    allBranches: boolean = false;

    kpi: any = null;
    modes: any[] = [];
    ageing: any[] = [];
    topClients: any[] = [];
    daily: any[] = [];
    cash: any = null;          // Table5: payable, due windows, DSO/DPO, pipeline
    forecast: any[] = [];      // Table6: money in vs out by window
    watch: any[] = [];         // Table7: clients to ask about
    fyYears: any[] = [];       // Table8: outstanding by financial year of the bill
    awaitJobs: any[] = [];     // Table9: billed this month, no supplier cost booked yet
    /*  The client breakdown of each year is NOT part of the page load - it was 639 rows
        on Links and 1,692 on Manilal fetched every time anybody opened the dashboard,
        and it held the other menus up. It comes from the drill procedure instead, only
        when somebody asks for it.  */
    fyClients: any[] = [];     // drill Table6, loaded on demand
    fyDetail = false;          // has the breakdown been fetched
    fyBusy = false;
    fyError = '';
    fyOpen: number = null;     // the year whose modal is open
    fyLabel = '';              // that year's label, for the modal heading
    fyRow: any = null;         // that year's summary row, for the modal heading
    unmClient: string = null;  // client whose unmatched-cost lines are open
    showAwait = false;         // the awaiting-cost list under the GOP card
    cacheInfo: any = null;

    loaded: boolean = false;

    /*  Loading state lives ON THIS PAGE, not in the app-wide overlay.
        The shared LoaderService paints a fixed full-screen mask (.loading:before in
        spinner.scss, z-index 1200) that covers the side menu too, so while the summary
        was loading nobody could click away to another screen. The summary takes a few
        seconds on a cold cache (All branches can take 30s+), which made the whole ERP feel
        frozen. This page shows its own loading banner and leaves the menu alive.       */
    loading: boolean = false;
    failed: boolean = false;
    failReason: string = '';   // API-side message (ERROR table), shown under the alert

    /*  ng2-charts 4 / Chart.js 4: colours live on the dataset, scales are keyed x / y,
        legend and tooltip sit under plugins.                                              */
    trendLabels: string[] = [];
    trendData: any[] = [];
    trendOptions: any = null;
    trendTotal: number = 0;

    quickLinks = [
        { label: 'Invoice Search',      icon: 'fa-search',      link: '/accounts/transaction/invoice/invoicesearch' },
        { label: 'Proforma Invoice',    icon: 'fa-clipboard', link: '/accounts/transaction/proformainvoice/proformasearch' },
        { label: 'Authorisation',       icon: 'fa-check-square-o', link: '/accounts/Authorisation/InvoiceAuth' },
        { label: 'Pending Invoicing',   icon: 'fa-clock-o',     link: '/accounts/MisReport/PendingInvoicingJobs' },
        { label: 'Client Outstanding',  icon: 'fa-address-book-o', link: '/accounts/MisReport/Clientoutstandingageing/clntAgeing' },
        { label: 'Finance Dashboard',   icon: 'fa-tachometer', link: '/accounts/MisReport/FinanceDashboard/dashboard' }
    ];

    constructor(private _dataService: DataService,
        private _loginService: LoginService,
        private _toasterService: ToastCommonService,
        private loaderService: LoaderService,
        private exportser: ExportexcelService,
        private zone: NgZone,
        private cdr: ChangeDetectorRef) { }

    ngOnInit() {
        this.login = this._loginService.getLogin()[0];

        try {
            this.allBranches = sessionStorage.getItem('ah.allBranches') == '1';
        } catch (e) { this.allBranches = false; }

        this.checkViewGate();
    }

    /*  ---- rights --------------------------------------------------------------------- */

    /*  The whole rights check, driven by VIEW_GATE_FORM_ID (null = no gate). */
    checkViewGate() {
        const formId = AccountsHomeComponent.VIEW_GATE_FORM_ID;
        if (!formId || (this.login && this.login.ROLETYPE == 'SA')) {
            this.canView = true;
            this.load(false);
            return;
        }

        /*  verifyRights returns viewForm; checkVerify is the piece that redirects to
            access-denied, and it is deliberately not called here.                         */
        this._loginService.verifyRights(formId, '')
            .subscribe((data: any) => {
                let ok = false;
                if (data && data.Table && data.Table.length > 0 && data.Table[0].STATUS == '100') {
                    const v = data.Table[0].viewForm;
                    ok = (v == 1 || v === true || v == '1' || v == 'true');
                }
                this.canView = ok;
                if (ok) { this.load(false); }
            }, () => {
                /*  If the rights call itself fails, stay blank. Showing finance figures because a
                    permission check errored is the wrong way round.                          */
                this.canView = false;
            });
    }

    /*  Attention tiles and the How to read button scroll to their section. */
    go(id: string): void {
        const el = document.getElementById(id);
        if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    }

    /*  ---- data ----------------------------------------------------------------------- */

    isSA(): boolean {
        return this.login && this.login.ROLETYPE == 'SA';
    }

    setBranches(all: boolean) {
        if (this.allBranches == all) { return; }
        this.allBranches = all;
        this.drill = {};           // the detail belongs to the branch it was loaded for
        try { sessionStorage.setItem('ah.allBranches', all ? '1' : '0'); } catch (e) { }
        this.load(false);
    }

    refresh() {
        this.load(true);
    }

    load(syncNow: boolean) {
        this.loading = true;
        this.loaded = false;
        this.failed = false;
        this.failReason = '';

        const jsonItem: any = {
            CMPCODE: this.login.CMPCODE,
            CITYCODE: this.allBranches ? 'ALL' : this.login.CITYCODE1,
            ASOF: ''
        };
        if (syncNow) { jsonItem.SYNCNOW = '1'; }

        this._dataService.getData('Accounts/ACC_RPT_ACCOUNTS_HOME', jsonItem)
            .subscribe((data: any) => {
                this.loading = false;
                this.loaded = true;

                const ok = data && data.Table && data.Table.length > 0 && data.Table[0].STATUS == '100';
                this.kpi        = ok ? data.Table[0] : null;
                this.modes      = ((data && data.Table1) ? data.Table1 : [])
                    // a mode this branch never handles (Links books no air) adds nothing but a zero line
                    .filter(m => +m.JOBS_MTD > 0 || +m.JOBS_PM > 0);
                this.ageing     = (data && data.Table2) ? data.Table2 : [];
                this.topClients = (data && data.Table3) ? data.Table3 : [];
                this.daily      = (data && data.Table4) ? data.Table4 : [];
                this.cash       = (data && data.Table5 && data.Table5.length > 0) ? data.Table5[0] : null;
                this.forecast   = (data && data.Table6) ? data.Table6 : [];
                this.watch      = (data && data.Table7) ? data.Table7 : [];
                this.fyYears    = (data && data.Table8) ? data.Table8 : [];
                this.awaitJobs  = (data && data.Table9) ? data.Table9 : [];
                this.cacheInfo  = (data && data.CACHEINFO && data.CACHEINFO.length > 0) ? data.CACHEINFO[0] : null;

                if (!ok) {
                    this.failed = true;
                    // The API puts the real cause in an ERROR table when the proc call throws.
                    this.failReason = (data && data.ERROR && data.ERROR.length > 0) ? data.ERROR[0].MESSAGE : '';
                    this._toasterService.toast('error', 'error', 'Could not load the Accounts summary.');
                }
                this.buildTrend();
            }, () => {
                this.loading = false;
                this.loaded = true;
                this.failed = true;
                this.kpi = null;
                this.cash = null;
                this._toasterService.toast('error', 'error', 'Could not load the Accounts summary.');
            });
    }

    /*  ---- card drill-down ------------------------------------------------------------
        A summary figure on its own ("Overdue 13.01 Cr") alarms people and cannot be
        questioned. Clicking the card opens the rows behind it - clients, bills with their
        dates, and the jobs on each bill with income and expense - so a manager can put a
        specific bill number to Finance. Fetched only on click, from a procedure built out
        of the home procedure's own logic, so the totals equal the card. Kept for the
        session per card; Refresh in the panel re-reads it.                              */
    drillKind: string = null;          // 'OVERDUE' | 'MARGIN' while the panel is open
    drillBusy = false;
    drillError = '';
    drill: any = {};                   // kind -> loaded detail
    drillSearch = '';
    drillOpenClient: string = null;
    drillOpenBill: string = null;
    drillShowAll: any = {};
    drillFilter = 'ALL';               // margin: ALL | LOSS | NOCOST | UNBILLED
    drillSortKey = 'GOP';
    drillSortDir = -1;

    /*  Drill tables show 10 rows a page. One page index per table key ('watch', 'ovd', 'jobs',
        'mcli', 'b:<client>'); out-of-range pages clamp, so a narrower search lands on the
        last page that exists.                                                            */
    readonly drillPageSize = 10;
    drillPg: { [k: string]: number } = {};
    pageOf(list: any[], key: string): any[] {
        const i = this.pgInfo(list, key);
        return list.slice(i.p * this.drillPageSize, (i.p + 1) * this.drillPageSize);
    }
    pgInfo(list: any[], key: string): { from: number; to: number; n: number; p: number; pages: number } {
        const n = list.length, pages = Math.max(1, Math.ceil(n / this.drillPageSize));
        const p = Math.min(Math.max(0, this.drillPg[key] || 0), pages - 1);
        return { from: n ? p * this.drillPageSize + 1 : 0, to: Math.min(n, (p + 1) * this.drillPageSize), n, p, pages };
    }
    goPage(key: string, p: number, ev?: any) {
        if (ev) { ev.stopPropagation(); }
        this.drillPg[key] = p;
    }

    openDrill(kind: string, ev?: any) {
        // the small icon on a card opens its explanation, not the detail
        const t: any = ev && ev.target;
        if (t && t.closest && t.closest('.ah-ico')) { return; }
        this.drillKind = kind;
        this.dragX = 0;           // opens centred; the title bar drags it (same handler as the explanation popup)
        this.dragY = 0;
        this.drillSearch = '';
        this.drillOpenClient = null;
        this.drillOpenBill = null;
        this.drillShowAll = {};
        this.drillPg = {};
        this.drillFilter = 'ALL';
        this.marginView = 'JOBS';
        this.marginOpenClient = null;
        if (!this.drill[kind]) { this.loadDrill(kind, false); }
    }

    closeDrill() { this.drillKind = null; }

    @HostListener('document:keydown.escape')
    onDrillEscape() { if (this.drillKind) { this.closeDrill(); } }

    loadDrill(kind: string, syncNow: boolean) {
        this.drillBusy = true;
        this.drillError = '';
        const q: any = {
            CMPCODE: this.login.CMPCODE,
            CITYCODE: this.allBranches ? 'ALL' : this.login.CITYCODE1,
            KIND: kind,
            ASOF: ''
        };
        if (syncNow) { q.SYNCNOW = '1'; }

        this._dataService.getData('Accounts/ACC_RPT_ACCOUNTS_HOME_DRILL', q)
            .subscribe((data: any) => {
                this.drillBusy = false;
                const ok = data && data.Table && data.Table.length > 0 && data.Table[0].STATUS == '100';
                if (!ok) {
                    this.drillError = (data && data.ERROR && data.ERROR.length > 0)
                        ? data.ERROR[0].MESSAGE : 'The detail could not be loaded.';
                    return;
                }
                const d: any = {
                    sum: data.Table[0],
                    t1: data.Table1 || [], t2: data.Table2 || [], t3: data.Table3 || [],
                    t4: data.Table4 || [], t5: data.Table5 || []
                };
                if (kind === 'OVERDUE') {
                    d.byClient = {};
                    d.t3.forEach((b: any) => { (d.byClient[b.CLIENTCODE] = d.byClient[b.CLIENTCODE] || []).push(b); });
                    d.byBill = {};
                    d.t4.forEach((j: any) => { (d.byBill[j.INV_NO] = d.byBill[j.INV_NO] || []).push(j); });
                    d.names = {};
                    d.t2.forEach((c: any) => { d.names[c.CLIENTCODE] = c.CLIENTNAME; });
                    d.maxBar = Math.max(1, ...d.t1.map((x: any) => +x.AMOUNT || 0));
                } else {
                    d.maxBar = Math.max(1, ...d.t1.map((x: any) => Math.abs(+x.GOP || 0)));
                }
                this.drill[kind] = d;
            }, () => {
                this.drillBusy = false;
                this.drillError = 'The detail could not be loaded.';
            });
    }

    /* whole rupees with Indian grouping, for the rows (the cards use short()) */
    rs(v: any): string {
        const n = Number(v);
        if (v === null || v === undefined || v === '' || isNaN(n)) { return '-'; }
        return n.toLocaleString('en-IN', { maximumFractionDigits: 0 });
    }
    barW(v: any, max: number): number {
        const n = Math.abs(Number(v) || 0);
        return n <= 0 ? 0 : Math.max(2, Math.min(100, n / (max || 1) * 100));
    }
    private matches(...vals: any[]): boolean {
        const q = (this.drillSearch || '').trim().toUpperCase();
        return !q || vals.some(v => String(v || '').toUpperCase().indexOf(q) >= 0);
    }

    /* the opening balance brought forward is carried as one bill per client, 'OPBAL-<client>' */
    isOpening(inv: string): boolean { return String(inv || '').indexOf('OPBAL-') === 0; }

    /* ---- overdue: clients -> bills -> jobs ---- */
    drillClients(): any[] {
        const d = this.drill.OVERDUE;
        return d ? d.t2.filter((c: any) => this.matches(c.CLIENTNAME, c.CLIENTCODE)) : [];
    }
    clientBills(code: string): any[] {
        const d = this.drill.OVERDUE;
        const list = (d && d.byClient[code]) || [];
        return list;     // paged 10 at a time by pageOf(); every bill is reachable
    }
    clientBillCount(code: string): number {
        const d = this.drill.OVERDUE;
        return ((d && d.byClient[code]) || []).length;
    }
    billJobs(inv: string): any[] {
        const d = this.drill.OVERDUE;
        return (d && d.byBill[inv]) || [];
    }
    toggleClient(code: string) {
        this.drillOpenClient = this.drillOpenClient === code ? null : code;
        this.drillOpenBill = null;
    }
    toggleBill(inv: string, ev: any) {
        if (ev) { ev.stopPropagation(); }
        this.drillOpenBill = this.drillOpenBill === inv ? null : inv;
    }

    /* ---- margin: Jobs or Clients. Clients shows each client's share of the jobs billed to
       it - a job billed to two clients is split between them (Table2 / Table4). ---- */
    marginView = 'JOBS';               // JOBS | CLIENTS
    marginOpenClient: string = null;
    marginClients(): any[] {
        const d = this.drill.MARGIN;
        return d ? d.t2.filter((c: any) => this.matches(c.CLIENTNAME, c.CLIENTCODE)) : [];
    }
    clientShares(code: string): any[] {
        const d = this.drill.MARGIN;
        return d ? d.t4.filter((j: any) => j.CLIENTCODE === code) : [];
    }
    toggleMarginClient(code: string) { this.marginOpenClient = this.marginOpenClient === code ? null : code; }

    /* ---- margin: jobs ---- */
    marginJobs(): any[] {
        const d = this.drill.MARGIN;
        if (!d) { return []; }
        const f = this.drillFilter, k = this.drillSortKey, dir = this.drillSortDir;
        const text = k === 'JOBNO' || k === 'CLIENTNAME' || k === 'MODE_' || k === 'JOB_YMD';
        return d.t3.filter((j: any) =>
                    (f === 'ALL'
                     || (f === 'LOSS' && this.isTrue(j.IS_BILLED) && +j.GOP < 0)
                     || (f === 'NOCOST' && this.isTrue(j.IS_BILLED) && Math.abs(+j.EXPENSE || 0) < 0.01)
                     || (f === 'UNBILLED' && !this.isTrue(j.IS_BILLED)))
                    && this.matches(j.JOBNO, j.CLIENTNAME, j.SHIPPERNAME))
            .slice()
            .sort((a: any, b: any) => {
                const r = text ? String(a[k] || '').localeCompare(String(b[k] || ''))
                               : (Number(a[k]) || 0) - (Number(b[k]) || 0);
                return r * dir;
            });
    }
    marginCount(f: string): number {
        const d = this.drill.MARGIN;
        if (!d) { return 0; }
        const keep = this.drillFilter;
        this.drillFilter = f;
        const s = this.drillSearch;
        this.drillSearch = '';
        const n = this.marginJobs().length;
        this.drillFilter = keep;
        this.drillSearch = s;
        return n;
    }
    sortJobs(k: string) {
        if (this.drillSortKey === k) { this.drillSortDir = -this.drillSortDir; }
        else { this.drillSortKey = k; this.drillSortDir = (k === 'JOBNO' || k === 'CLIENTNAME' || k === 'MODE_') ? 1 : -1; }
    }
    sortMark(k: string): string { return this.drillSortKey === k ? (this.drillSortDir === 1 ? ' \u25B2' : ' \u25BC') : ''; }
    isTrue(v: any): boolean { return v === true || v === 1 || v === '1' || String(v).toLowerCase() === 'true'; }

    /* the existing Job Profit statement, in its own window */
    openJob(jobno: string, ev: any) {
        if (ev) { ev.stopPropagation(); ev.preventDefault(); }
        const no = String(jobno || '').trim();
        if (!no) { return; }
        window.open('./#/popup/Account-Job-Profit-Report/' + no + '/', '_blank',
                    'width=1200,height=800,scrollbars=yes,resizable=yes');
    }

    /* the full list, not only what is on screen */
    exportDrill(what: string) {
        const d = this.drill[this.drillKind];
        if (!d) { return; }
        let headers: string[] = [], rows: any[] = [], name = '', label = '';
        if (this.drillKind === 'OVERDUE' && what === 'clients') {
            headers = ['Client code', 'Client', 'Bills', 'Overdue bills', 'Paid on account, not matched', 'Overdue (net)',
                       'Outstanding (net)', 'Oldest (days late)', 'Last receipt'];
            rows = d.t2.map((c: any) => [c.CLIENTCODE, c.CLIENTNAME, +c.BILLS, +c.OVERDUE_GROSS, +c.CREDIT_ON_ACCOUNT,
                                         +c.OVERDUE_NET, +c.OUTSTANDING_NET, +c.OLDEST_DAYS, c.LAST_RECEIPT || '']);
            name = 'Home_Overdue_Clients_'; label = 'Overdue by client';
        } else if (this.drillKind === 'OVERDUE') {
            headers = ['Client', 'Bill no', 'Bill date', 'Due date', 'Days late', 'Bill value', 'Received', 'Pending',
                       'Last receipt', 'Jobs on the bill'];
            rows = d.t3.map((b: any) => [d.names[b.CLIENTCODE] || b.CLIENTCODE, this.isOpening(b.INV_NO) ? 'Opening balance b/f' : b.INV_NO, b.INV_DATE, b.DUE_DATE, +b.DAYS_OVERDUE,
                                         +b.BILL_AMT, +b.RECEIVED, +b.PENDING, b.LAST_RECEIPT || '',
                                         ((d.byBill[b.INV_NO] || []).map((j: any) => j.JOBNO)).join(', ')]);
            name = 'Home_Overdue_Bills_'; label = 'Overdue bills';
        } else {
            headers = ['Job no', 'Job date', 'Mode', 'Client (billed)', 'Shipper', 'Billed', 'Last billed',
                       'Income', 'Expense', 'GOP', 'Margin %'];
            rows = d.t3.map((j: any) => [j.JOBNO, j.JOB_DATE, j.MODE_, j.CLIENTNAME, j.SHIPPERNAME,
                                         this.isTrue(j.IS_BILLED) ? 'Yes' : 'No', j.LAST_BILLED || '',
                                         +j.INCOME, +j.EXPENSE, +j.GOP, j.MARGIN_PCT === null ? '' : +j.MARGIN_PCT]);
            name = 'Home_GOP_Jobs_'; label = 'Jobs behind GOP';
        }
        if (!rows.length) { this._toasterService.toast('warning', 'warning', 'Nothing to export !'); return; }
        this.exportser.exportExceltry({
            data: rows, headers: headers, pagetype: 'FinanceDashboard',
            title: (this.login && (this.login.CMPNAME || this.login.CMP_NAME)) || 'Accounts',
            subtitle: label + ' - ' + (this.allBranches ? 'All branches' : (d.sum.BRANCH || '')) + ' - as on ' + d.sum.ASON
        }, name);
    }

    /*  ---- presentation helpers ------------------------------------------------------- */

    /*  Every tile reads through these so a missing result set shows "-", never NaN. */
    /*  num() above reads a KPI FIELD BY NAME. toNum() converts a VALUE. They are easy to
        confuse: passing a value to num() looks up this.kpi[<the value>], which is always
        undefined, so it quietly returns null. That is what stopped the year modal from
        opening and made every 'Credit applied' cell show a dash.  */
    toNum(v: any): number {
        if (v === null || v === undefined || v === '') { return 0; }
        const n = Number(String(v).replace(/[^0-9.\-]/g, ''));
        return isNaN(n) ? 0 : n;
    }

    num(field: string): number {
        if (!this.kpi || this.kpi[field] === undefined || this.kpi[field] === null) { return null; }
        const n = Number(String(this.kpi[field]).replace(/[^0-9.\-]/g, ''));
        return isNaN(n) ? null : n;
    }

    /*  The GOP and Margin cards report the trading figures - the jobs that carry a
        supplier cost. Revenue billed on a job with no purchase entered at all is pure
        profit on paper and swamped the headline: Links October 2026 showed 80.8% because
        11.04 Cr of MISC billing had 74,816 of cost against it. That money is not hidden,
        it is named on its own line as cost still to come.  */
    awaitRevenue(): number { return this.num('REVENUE_AWAITCOST_MTD') || 0; }
    awaitCount(): number { return this.num('JOBS_AWAITCOST_MTD') || 0; }
    hasAwait(): boolean { return this.awaitRevenue() > 0.5; }

    /* the two or three parties behind most of it, for the one-line summary on the card */
    awaitWho(): string {
        const by: any = {};
        this.awaitJobs.forEach(j => {
            const k = (j.BILLED_TO || '').toString().trim() || 'not billed';
            by[k] = (by[k] || 0) + this.toNum(j.REVENUE);
        });
        return Object.keys(by).sort((a, b) => by[b] - by[a]).slice(0, 3).join(', ');
    }

    toggleAwait(ev: any) { if (ev) { ev.stopPropagation(); } this.showAwait = !this.showAwait; }

    /*  One year at a time. Clicking a year opens a modal with only that year's clients;
        the breakdown itself is fetched once, from the drill procedure, the first time
        anybody asks. Nothing of it is fetched on page load.  */
    openFy(y: any) {
        this.fyOpen = this.toNum(y.FY_START);
        this.fyLabel = y.FY;
        this.fyRow = y;
        if (this.fyDetail || this.fyBusy) { return; }
        this.fyBusy = true;
        this.fyError = '';
        this._dataService.getData('Accounts/ACC_RPT_ACCOUNTS_HOME_DRILL', {
            CMPCODE: this.login.CMPCODE,
            CITYCODE: this.allBranches ? 'ALL' : this.login.CITYCODE1,
            KIND: 'OVERDUE',
            ASOF: ''
        }).subscribe((data: any) => {
            this.fyBusy = false;
            const ok = data && data.Table && data.Table.length > 0 && data.Table[0].STATUS == '100';
            if (!ok) { this.fyError = 'The client detail could not be loaded.'; return; }
            this.fyClients = data.Table6 || [];
            this.fyDetail = true;
        }, () => { this.fyBusy = false; this.fyError = 'The client detail could not be loaded.'; });
    }

    closeFy() { this.fyOpen = null; }

    fyClientsFor(y: any): any[] {
        const n = this.toNum(y);
        return this.fyClients.filter(c => this.toNum(c.FY_START) === n);
    }

    exportFy() {
        const rows = this.fyClientsFor(this.fyOpen);
        if (!rows.length) { this._toasterService.toast('warning', 'warning', 'Nothing to export !'); return; }
        this.exportser.exportExceltry({
            data: rows.map((c: any) => [c.CLIENTCODE, c.CLIENTNAME, +c.BILLS, +c.GROSS_PENDING,
                                        +c.CREDIT_APPLIED, +c.OUTSTANDING, +c.NOT_YET_DUE,
                                        +c.OVERDUE, c.OLDEST_BILL || '', +c.OLDEST_DAYS]),
            headers: ['Client code', 'Client', 'Bills', 'Bills pending', 'Credit applied',
                      'Outstanding', 'Not yet due', 'Overdue', 'Oldest bill', 'Oldest (days)'],
            pagetype: 'FinanceDashboard',
            title: (this.login && (this.login.CMPNAME || this.login.CMP_NAME)) || 'Accounts',
            subtitle: 'Outstanding by financial year - ' + this.fyLabel
                + ' - ' + (this.allBranches ? 'All branches' : 'this branch')
        }, 'Home_OutstandingByYear_');
    }

    /*  The voucher lines behind the amber "unmatched" badge: cost that found no charge
        of its own billed on the job, so it was shared across the job's clients by their
        share of income. The shares add back to the badge exactly.  */
    unmLines(client: string): any[] {
        const d: any = this.drill['MARGIN'];
        if (!d || !d.t5) { return []; }
        return d.t5.filter(r => (r.CLIENTCODE || '').toString().trim() === client);
    }

    openUnm(client: string, ev: any) {
        if (ev) { ev.stopPropagation(); }
        this.unmClient = (this.unmClient === client) ? null : client;
    }

    closeUnm() { this.unmClient = null; }

    unmTotal(client: string): number {
        return this.unmLines(client).reduce((s, r) => s + this.toNum(r.SHARE), 0);
    }

    money(v: any): string {
        if (v === null || v === undefined || v === '') { return '-'; }
        const n = Number(String(v).replace(/[^0-9.\-]/g, ''));
        if (isNaN(n)) { return '-'; }
        return n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    }

    /*  Lakhs / crores for the big numbers, full value in the title attribute. */
    short(v: any): string {
        if (v === null || v === undefined || v === '') { return '-'; }
        const n = Number(String(v).replace(/[^0-9.\-]/g, ''));
        if (isNaN(n)) { return '-'; }
        const a = Math.abs(n);
        const sign = n < 0 ? '-' : '';
        if (a >= 10000000) { return sign + (a / 10000000).toFixed(2) + ' Cr'; }
        if (a >= 100000)   { return sign + (a / 100000).toFixed(2) + ' L'; }
        return sign + a.toLocaleString('en-IN', { maximumFractionDigits: 0 });
    }

    /*  Headline figure split for the dashboard KPI style: number, then a small grey unit (L / Cr). */
    amt(v: any): { n: string; u: string } {
        return finFigure(this.short(v));
    }

    count(v: any): string {
        if (v === null || v === undefined || v === '') { return '-'; }
        const n = Number(v);
        return isNaN(n) ? '-' : n.toLocaleString('en-IN');
    }

    /*  Change against last month as a percentage; null when there is nothing to compare.
        upIsGood says which direction to colour green - up is bad for Overdue and Cost.   */
    delta(cur: string, prev: string): number {
        const c = this.num(cur), p = this.num(prev);
        if (c === null || p === null || p == 0) { return null; }
        return ((c - p) / Math.abs(p)) * 100;
    }

    /*  Width of one bar in a this-month / last-month pair; both bars share the larger value as 100%. */
    cmpPct(field: string, other: string): number {
        const a = Math.abs(this.num(field) || 0), b = Math.abs(this.num(other) || 0);
        const max = Math.max(a, b);
        return max > 0 ? Math.round(a / max * 100) : 0;
    }

    deltaClass(cur: string, prev: string, upIsGood: boolean): string {
        const d = this.delta(cur, prev);
        if (d === null || Math.abs(d) < 0.05) { return 'ah-delta-flat'; }
        const good = upIsGood ? d > 0 : d < 0;
        return good ? 'ah-delta-good' : 'ah-delta-bad';
    }

    deltaText(cur: string, prev: string): string {
        const d = this.delta(cur, prev);
        if (d === null) { return 'no comparison'; }
        const arrow = d > 0 ? '▲' : (d < 0 ? '▼' : '▬');
        return arrow + ' ' + Math.abs(d).toFixed(1) + '%';
    }

    /*  Width of a bar as a share of the largest value in the list, for the CSS bars. */
    /** "How this page works" (collapsed by default, in the Reference section). No look mode. */
    helpOpen: boolean = false;

    /** Cash-side helpers. Days come back as DECIMAL(5,1) strings; null means "no settled bills". */
    days(v: any): string {
        if (v === null || v === undefined || v === '') { return '-'; }
        const n = Number(v);
        return isNaN(n) ? '-' : String(Math.round(n));
    }

    /** Working-capital gap: positive means clients take longer to pay us than we take to pay suppliers. */
    dsoGap(): number {
        if (!this.cash || this.cash.DSO_DAYS == null || this.cash.DPO_DAYS == null) { return 0; }
        return Math.round(Number(this.cash.DSO_DAYS) - Number(this.cash.DPO_DAYS));
    }

    /** Share of a forecast row against the larger of the two legs, for the paired bars. */
    flowShare(v: any): number {
        let max = 0;
        for (const r of this.forecast) {
            max = Math.max(max, Math.abs(Number(r.INFLOW) || 0), Math.abs(Number(r.OUTFLOW) || 0));
        }
        const n = Math.abs(Number(v) || 0);
        return max > 0 ? Math.round((n / max) * 100) : 0;
    }

    /** Which KPI card is showing its explanation; the icon toggles it. */
    info: string = '';
    toggleInfo(key: string): void {
        this.info = (this.info == key) ? '' : key;
        this.dragX = 0;
        this.dragY = 0;
    }

    /*  The explanation popup can be dragged by its title bar, so it can be moved off the
        figure it is explaining. Position resets each time a popup opens.               */
    dragX: number = 0;
    dragY: number = 0;
    private dragging: boolean = false;
    private dragStartX: number = 0;
    private dragStartY: number = 0;

    startDrag(ev: MouseEvent): void {
        const t = ev.target as HTMLElement;
        if (ev.button !== 0 || (t && t.closest && t.closest('button'))) { return; }
        this.dragging = true;
        this.dragStartX = ev.clientX - this.dragX;
        this.dragStartY = ev.clientY - this.dragY;
        ev.preventDefault();
        this.bindDrag();
    }

    /*  The move/up listeners exist only while a drag is in progress. They are added outside
        Angular's zone (a document-level mousemove inside the zone would run change detection
        on every mouse move anywhere in the app); each move re-enters the zone just to update
        the popup position, and mouseup removes both listeners.                              */
    private dragOff: (() => void) | null = null;

    private bindDrag(): void {
        this.unbindDrag();
        const move = (ev: MouseEvent) => {
            this.zone.run(() => {
                this.dragX = ev.clientX - this.dragStartX;
                this.dragY = ev.clientY - this.dragStartY;
            });
        };
        const up = () => this.zone.run(() => this.onDragEnd());
        this.zone.runOutsideAngular(() => {
            document.addEventListener('mousemove', move);
            document.addEventListener('mouseup', up);
        });
        this.dragOff = () => {
            document.removeEventListener('mousemove', move);
            document.removeEventListener('mouseup', up);
        };
    }

    private unbindDrag(): void {
        if (this.dragOff) { this.dragOff(); this.dragOff = null; }
    }

    onDragEnd(): void {
        this.dragging = false;
        this.unbindDrag();
        this.cdr.markForCheck();
    }

    ngOnDestroy(): void { this.unbindDrag(); }

    /*  Close only when the press starts on the dim background itself. Using click here would
        also close the popup when a drag happens to end outside it.                          */
    closeOnBackdrop(ev: MouseEvent): void {
        if (ev.target === ev.currentTarget) { this.info = ''; }
    }

    /** Plain-words tooltip for an ageing tile. */
    ageHint(bucket: any): string {
        switch (+bucket) {
            case 1:  return 'Invoiced within the last 30 days. Normal; most of this is still inside the credit period.';
            case 2:  return 'Invoiced 31 to 90 days ago. Usually past the credit period; worth a reminder.';
            case 3:  return 'Invoiced 91 to 180 days ago. Needs active follow-up.';
            default: return 'Unpaid for more than 180 days. At risk; consider escalation or provision.';
        }
    }

    share(v: any, list: any[], field: string): number {
        const n = Number(v) || 0;
        let max = 0;
        for (let i = 0; i < list.length; i++) { max = Math.max(max, Number(list[i][field]) || 0); }
        return max > 0 ? Math.round((n / max) * 100) : 0;
    }

    ageClass(bucketNo: any): string {
        const b = Number(bucketNo);
        return b <= 1 ? 'ah-age-1' : b == 2 ? 'ah-age-2' : b == 3 ? 'ah-age-3' : 'ah-age-4';
    }

    greeting(): string {
        const h = new Date().getHours();
        return h < 12 ? 'Good morning' : (h < 17 ? 'Good afternoon' : 'Good evening');
    }

    cacheAge(): string {
        if (!this.cacheInfo) { return ''; }
        const s = Number(this.cacheInfo.AGE_SECONDS) || 0;
        if (s < 60) { return 'just now'; }
        const m = Math.round(s / 60);
        return m + ' min ago';
    }

    /*  Popup header for each icon: title and the same distinct icon as on the page. */
    readonly titles: any = {
        inv: 'Invoiced this month',
        col: 'Collected this month',
        out: 'Outstanding',
        ovd: 'Overdue',
        gop: 'GOP (gross profit)',
        mgn: 'Margin',
        pipe: 'Earned but not yet collected',
        pauth: 'Invoices waiting for authorisation',
        ppro: 'Proformas not yet converted',
        punb: 'Shipments unbilled after 15 days',
        puna: 'Money received, not applied to a bill',
        age: 'Receivable ageing',
        cash: 'Cash position',
        cin: 'Clients owe us',
        cout: 'We owe suppliers',
        cnet: 'Net position',
        days: 'Days to collect vs days to pay',
        ddso: 'Clients pay us in',
        ddpo: 'We pay suppliers in',
        jobs: 'Jobs opened this month',
        trend: 'Invoiced, last 30 days',
        watch: 'Clients to ask about',
        top: 'Top clients by outstanding',
        quick: 'Quick links'
    };

    readonly icons: any = {
        inv: 'fa-file-text-o',
        col: 'fa-arrow-circle-down',
        out: 'fa-balance-scale',
        ovd: 'fa-exclamation-triangle',
        gop: 'fa-line-chart',
        mgn: 'fa-percent',
        pipe: 'fa-hourglass-start',
        pauth: 'fa-gavel',
        ppro: 'fa-file-o',
        punb: 'fa-ship',
        puna: 'fa-random',
        age: 'fa-calendar',
        cash: 'fa-university',
        cin: 'fa-sign-in',
        cout: 'fa-sign-out',
        cnet: 'fa-calculator',
        days: 'fa-exchange',
        ddso: 'fa-hourglass-half',
        ddpo: 'fa-credit-card',
        jobs: 'fa-cubes',
        trend: 'fa-bar-chart',
        watch: 'fa-eye',
        top: 'fa-users',
        quick: 'fa-th-large'
    };

    /*  Plain-words explanation behind each icon on the page. */
    readonly explain: any = {
        inv: 'The total value of invoices we have sent to clients from the 1st of this month until today, including GST. It is compared with the same number of days last month, so the comparison is fair.',
        col: 'The money clients have actually paid this month and that has been matched to their invoices. If money has reached the bank but nobody has matched it to an invoice yet, it is not counted here.',
        out: 'The total amount all clients still owe us today, on every invoice we have ever raised. This is a running balance, not a figure for this month only.',
        ovd: 'The part of what clients owe us that they should already have paid, because the number of days we allowed them to pay has passed. This is the money to chase first.',
        gop: 'The profit on the jobs we started this month: what we billed the client minus what we paid for those jobs. Costs usually arrive before we raise the invoice, so this number is only complete at month end.',
        mgn: 'Out of every 100 rupees we billed on this month\'s jobs, how many rupees we kept as profit. 20% means we kept 20 rupees from every 100.',
        pipe: 'Money we have already earned but cannot bank yet, because a step is still pending: an approval, an invoice, or matching a payment. Each box is one kind of hold-up and opens the screen where it is cleared.',
        pauth: 'Invoices that are ready but still waiting for a manager to approve them. Until they are approved they cannot be sent to the client, so the client cannot pay them.',
        ppro: 'A proforma is a quotation-style bill sent before the real invoice. These are proformas that have not yet been turned into a proper tax invoice, so they bring in no money yet.',
        punb: 'Shipments we started more than 15 days ago that still have no invoice, even though we have already spent money on them. The work is done but the client has not been billed.',
        puna: 'Money that has reached our bank but has not been matched to the invoices it pays. Until someone matches it, those invoices still look unpaid and a client may be chased for a bill already paid.',
        age: 'Everything clients owe us, sorted by how long ago we sent the invoice. The longer a bill stays unpaid, the harder it is to collect. Green (up to 30 days) is normal; red (over 180 days) is at risk of never being paid.',
        cash: 'Puts what clients owe us next to what we owe our suppliers, as of today. The table below shows when each amount is due to come in or go out.',
        cin: 'The total all clients owe us today. "Overdue" is the part they should already have paid; "due in 7 days" is what should arrive this week.',
        cout: 'The total we owe our suppliers today, from bills of the last 12 months. "Overdue" is what we should already have paid them.',
        cnet: 'What clients owe us minus what we owe suppliers. Positive means more money is owed to us than we owe; negative means we owe more, so cash can run short.',
        days: 'On average, how many days clients take to pay us and how many days we take to pay suppliers, looking at bills settled in the last 90 days. Big bills count more than small ones.',
        ddso: 'The average number of days between sending an invoice and the client paying it. "Agreed" is the number of days we allowed the client to pay.',
        ddpo: 'The average number of days between receiving a supplier\'s bill and paying it.',
        jobs: 'The shipments we started this month, by air or sea and export or import, compared with the same days last month. "Billed" jobs have at least one invoice; "Unbilled" have none yet.',
        trend: 'Each bar is one day of the last 30 days, and its height is the value of invoices raised that day. A few very tall bars mean billing is being done in bursts instead of every day.',
        watch: 'Clients who are late paying, with those whose money has been stuck longest at the top. "Pays in" is how many days they really take, and the number in brackets is how late that is against what was agreed.',
        top: 'The clients who owe us the most money today. "Share" is how much of all the money owed to us sits with that one client.',
        quick: 'Shortcuts to the screens used most often to act on what this page shows, so nobody has to search the menu.'
    };

    /*  One sentence, from today's figures, that points at the shortfall behind each figure.
        Empty when there is nothing worth pointing at. */
    gap(key: string): string {
        const k = this.kpi || {}, c = this.cash || {};
        const v = (x: any) => Number(String(x === null || x === undefined ? '' : x).replace(/[^0-9.\-]/g, '')) || 0;
        const R = (x: any) => '\u20B9 ' + this.short(x);
        const pc = (a: number, b: number) => b ? Math.round(a / b * 100) : 0;
        const age = (n: number) => { const r = (this.ageing || []).find((a: any) => +a.BUCKET_NO == n); return r ? v(r.AMOUNT) : 0; };
        const out = v(k.TOTAL_OUTSTANDING);
        switch (key) {
            case 'inv': {
                const a = v(k.INV_VALUE_MTD), b = v(k.INV_VALUE_PM);
                if (!b) { return ''; }
                return a < b ? 'Billing is ' + pc(b - a, b) + '% lower than the same days last month (' + R(a) + ' against ' + R(b) + ').'
                             : 'Billing is ahead of last month (' + R(a) + ' against ' + R(b) + ').';
            }
            case 'col': {
                const a = v(k.COLLECTED_MTD), b = v(k.INV_VALUE_MTD);
                return a < b ? 'Only ' + R(a) + ' collected against ' + R(b) + ' invoiced this month - ' + R(b - a) + ' has not come in.'
                             : 'Collections this month (' + R(a) + ') are more than this month\'s billing.';
            }
            case 'out': {
                let s = pc(v(k.OVERDUE_AMT), out) + '% of it is already overdue.';
                if (v(c.UNAPPLIED_RECEIPTS) > 0) { s += ' ' + R(c.UNAPPLIED_RECEIPTS) + ' received is not yet matched to invoices, so part of this may already be paid.'; }
                return s;
            }
            case 'ovd':
                return R(k.OVERDUE_AMT) + ' is past the agreed payment date. ' + this.count(k.UNBILLED_JOBS) + ' jobs opened this month are still not billed, with ' + R(k.UNBILLED_VALUE) + ' already spent on them.';
            case 'gop': {
                const a = v(k.GOP_MTD), b = v(k.GOP_PM);
                return a < b ? 'Profit is ' + R(a) + ' against ' + R(b) + ' for the same days last month. Some costs or invoices may still be missing.'
                             : 'Profit is ahead of last month (' + R(a) + ' against ' + R(b) + ').';
            }
            case 'mgn': {
                const m = (this.modes || []).filter((x: any) => v(x.REVENUE_MTD) > 0).sort((x: any, y: any) => v(x.MARGIN_PCT_MTD) - v(y.MARGIN_PCT_MTD))[0];
                return 'Margin is ' + v(k.MARGIN_PCT_MTD) + '% against ' + v(k.MARGIN_PCT_PM) + '% last month.' + (m ? ' Weakest: ' + m.MODE_ + ' at ' + v(m.MARGIN_PCT_MTD) + '%.' : '');
            }
            case 'pipe': {
                const parts = [['invoices awaiting approval', v(c.AUTH_PENDING_VALUE)], ['unconverted proformas', v(c.PROFORMA_OPEN_VALUE)],
                               ['cost on unbilled shipments', v(c.UNBILLED15_COST)], ['unmatched receipts', v(c.UNAPPLIED_RECEIPTS)]] as any[];
                const total = parts.reduce((s: number, p: any) => s + p[1], 0);
                const big = parts.sort((x: any, y: any) => y[1] - x[1])[0];
                return total > 0 ? R(total) + ' is held up in total. The biggest part is ' + big[0] + ' (' + R(big[1]) + ').' : '';
            }
            case 'pauth':
                return v(c.AUTH_PENDING_COUNT) > 0 ? this.count(c.AUTH_PENDING_COUNT) + ' invoices worth ' + R(c.AUTH_PENDING_VALUE) + ' are waiting; the oldest for ' + this.count(c.AUTH_PENDING_OLDEST_DAYS) + ' days. Every day waiting delays the payment.' : 'Nothing is waiting for approval.';
            case 'ppro':
                return v(c.PROFORMA_OPEN_COUNT) > 0 ? this.count(c.PROFORMA_OPEN_COUNT) + ' proformas worth ' + R(c.PROFORMA_OPEN_VALUE) + ' are not converted; the oldest is ' + this.count(c.PROFORMA_OPEN_OLDEST_DAYS) + ' days old.' : 'No proforma is waiting to be converted.';
            case 'punb':
                return v(c.UNBILLED15_JOBS) > 0 ? this.count(c.UNBILLED15_JOBS) + ' shipments have ' + R(c.UNBILLED15_COST) + ' of cost spent and no invoice; the oldest is ' + this.count(c.UNBILLED15_OLDEST_DAYS) + ' days old.' : 'No shipment is unbilled after 15 days.';
            case 'puna':
                return v(c.UNAPPLIED_RECEIPTS) > 0 ? R(c.UNAPPLIED_RECEIPTS) + ' from ' + this.count(c.UNAPPLIED_CLIENTS) + ' clients is unmatched' + (out ? ' - that is ' + pc(v(c.UNAPPLIED_RECEIPTS), out) + '% of everything clients owe us.' : '.') : '';
            case 'age':
                return out ? R(age(4)) + ' (' + pc(age(4), out) + '%) has been unpaid for over 180 days, and ' + R(age(3)) + ' (' + pc(age(3), out) + '%) is 91-180 days old and heading the same way.' : '';
            case 'cash': case 'cnet': {
                const n = v(c.NET_POSITION);
                return (n < 0 ? 'We owe suppliers ' + R(-n) + ' more than clients owe us.' : 'Clients owe us ' + R(n) + ' more than we owe suppliers.')
                     + (v(c.PAY_OVERDUE) > 0 ? ' ' + R(c.PAY_OVERDUE) + ' of supplier bills are already overdue.' : '');
            }
            case 'cin':
                return R(c.RECV_OVERDUE) + ' of ' + R(c.RECEIVABLE) + ' is overdue, and only ' + R(c.RECV_DUE_7) + ' is due this week.';
            case 'cout':
                return R(c.PAY_OVERDUE) + ' of ' + R(c.PAYABLE) + ' is overdue, and ' + R(c.PAY_DUE_7) + ' more falls due this week.';
            case 'days': {
                const g = this.dsoGap();
                return g > 0 ? 'We pay suppliers ' + g + ' days before clients pay us, so our own cash fills that gap.'
                             : 'Clients pay us ' + (-g) + ' days before we pay suppliers, so no cash gap.';
            }
            case 'ddso': {
                const d = v(c.DSO_DAYS), a = v(c.AVG_CREDIT_PERIOD);
                return d > a ? 'Clients take ' + Math.round(d - a) + ' days longer than agreed.' : 'Clients pay within the agreed ' + Math.round(a) + ' days.';
            }
            case 'ddpo':
                return 'We pay suppliers in about ' + Math.round(v(c.DPO_DAYS)) + ' days.';
            case 'jobs': {
                const unb = (this.modes || []).reduce((s: number, m: any) => s + v(m.UNBILLED_MTD), 0);
                return this.count(k.JOBS_MTD) + ' jobs this month against ' + this.count(k.JOBS_PM) + ' on the same days last month; ' + unb + ' of them are not billed yet.';
            }
            case 'trend': {
                const days = this.daily || [];
                if (!days.length) { return ''; }
                const top = days.reduce((a: any, b: any) => (v(b.INV_VALUE) > v(a.INV_VALUE) ? b : a));
                const none = days.filter((d: any) => v(d.INV_VALUE) == 0).length;
                return 'The biggest day, ' + top.INV_DT + ', carried ' + pc(v(top.INV_VALUE), this.trendTotal) + '% of the 30-day total. ' + none + ' days had no billing.';
            }
            case 'watch': {
                const w = (this.watch || [])[0];
                return w ? 'At the top: ' + w.CLIENTNAME + ', with ' + R(w.OVER_180) + ' unpaid for over 180 days.' : '';
            }
            case 'top': {
                const t = (this.topClients || []).slice(0, 3);
                return t.length ? 'The top ' + t.length + ' clients hold ' + Math.round(t.reduce((s: number, x: any) => s + v(x.PCT_OF_TOTAL), 0)) + '% of all money owed to us.' : '';
            }
        }
        return '';
    }

    /*  ---- chart ---------------------------------------------------------------------- */

    buildTrend() {
        const cats = [], vals = [];
        this.trendTotal = 0;
        for (let i = 0; i < this.daily.length; i++) {
            const d = this.daily[i];
            const v = Number(String(d.INV_VALUE || 0).replace(/[^0-9.\-]/g, '')) || 0;
            cats.push(String(d.INV_DT || '').substr(0, 5));   // dd/MM
            vals.push(v);
            this.trendTotal += v;
        }

        this.trendLabels = cats;
        this.trendData = [{
            data: vals, label: 'Invoiced',
            backgroundColor: '#0A0A0A', hoverBackgroundColor: '#6B6B6B', borderWidth: 0,
            barPercentage: 0.8, categoryPercentage: 0.9
        }];

        const self = this;
        const tick = '#6B6B6B';
        const grid = '#F3F3F3';
        this.trendOptions = {
            responsive: true,
            maintainAspectRatio: false,
            layout: { padding: { top: 4, right: 4, bottom: 0, left: 0 } },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { color: tick, font: { size: 11 }, autoSkip: true, maxTicksLimit: 8, maxRotation: 0 }
                },
                y: {
                    beginAtZero: true,
                    grid: { color: grid },
                    border: { display: false },
                    ticks: {
                        color: tick, font: { size: 11 }, maxTicksLimit: 4,
                        callback: function (value: any) { return self.short(value); }
                    }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        title: function (items: any) {
                            const row = self.daily[items[0].dataIndex] || {};
                            return row.INV_DT + ' (' + row.DOW + ')';
                        },
                        label: function (item: any) {
                            const row = self.daily[item.dataIndex] || {};
                            return self.count(row.INV_COUNT) + ' invoices, ₹ ' + self.money(row.INV_VALUE);
                        }
                    }
                }
            }
        };
    }
}
