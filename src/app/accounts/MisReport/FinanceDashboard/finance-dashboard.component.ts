import { Component, OnInit, HostListener, ChangeDetectionStrategy } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { IMyDpOptions } from 'mydatepicker';
import { DataService } from '../../../shared/service/dataService';
import { LoginService } from '../../../shared/service/loginService';
import { ToastCommonService } from '../../../shared/service/toastService';
import { LoaderService } from '../../../shared/service/loader.service';
import { ExportexcelService } from 'src/app/shared/service/exportexcel.service';

@Component({
    selector: 'app-FinanceDashboard',
    templateUrl: './finance-dashboard.component.html',
    styleUrls: ['./finance-dashboard.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class FinanceDashboardComponent implements OnInit {

    /* dates are sent to the proc as dd/MM/yyyy, so the picker uses the same format */
    public myDatePickerOptions: IMyDpOptions = {
        dateFormat: 'dd/mm/yyyy',
        inline: false,
        height: '36px',
        width: '150px',
        componentDisabled: false,
        selectionTxtFontSize: '12px',
        editableDateField: false,
        sunHighlight: true,
        satHighlight: true,
        firstDayOfWeek: 'su',
        openSelectorTopOfInput: false,
        openSelectorOnInputClick: true,
        selectorHeight: '180px',
        selectorWidth: '200px'
    };

    Header = 'Finance Dashboard';
    cmpnyname: string;

    /* ---- filters ---- */
    FromDate: any;
    ToDate: any;
    BranchList: any[] = [];
    Branch: any;
    BranchLabel = '';
    ClientCode: any = null;
    ClientList: any[] = [];
    ClientMaster: any[] = [];      // full client master; ClientList falls back to the search result if it is empty
    CurrencyMode = 'INR';          // 'INR' | 'TXN'
    TopN = 10;

    Searched = false;
    Tab = 'OVERVIEW';              // OVERVIEW | RECEIVABLES | MARGIN | UNBILLED | PAYABLES | AUDIT
    DarkMode = false;

    /* ---- result sets ---- */
    Kpi: any = null;
    Exposure: any[] = [];
    Recovery: any[] = [];
    Mix: any[] = [];
    UnbilledAge: any[] = [];
    UnbilledJobs: any[] = [];
    Ageing: any[] = [];
    Margin: any[] = [];
    JobPL: any[] = [];             // Table8: job-wise income/expense/P&L (Job Profit grain)
    UnbilledLines: any[] = [];     // Table9: voucher-level expense lines behind unbilled jobs
    Funnel: any[] = [];            // Table10: Jobs -> Invoiced -> Collected
    Coverage: any = null;          // Table11: billing coverage / invoicing lag
    CacheInfo: any = null;         // CACHEINFO appended by the API cache

    /* expanded-row state for the Margin (per client) and Unbilled (per job) drills */
    MarginOpen: any = {};
    UnbilledOpen: any = {};

    /* ---- AUDIT tab (fetched on first activation, never with the dashboard) ---- */
    AuditSummary: any[] = [];
    AuditDetail: any[] = [];
    AuditLoaded = false;
    AuditLoading = false;
    AuditOpen: any = {};
    ShowPassing = false;

    /* ---- payment reminder composer ---- */
    ReminderOpen = false;

    /* ---- job profit drawer: the Job Profit statement inside the dashboard (iframe on the
       existing popup route), so checking many jobs does not mean many windows ---- */
    JobDrawerNo: string = null;
    JobDrawerUrl: SafeResourceUrl = null;

    /* ---- "how is this calculated?" explainer (click on a KPI card icon) ---- */
    ExplainKey: string = null;

    /* ---- legend / help: what every badge, colour and abbreviation means ---- */
    LegendOpen = false;

    /* ---- PAYABLES tab (whom do we owe) --------------------------------------
       Fetched on first activation only, never with the dashboard: it is a
       separate proc and a payables user does not open it every time.
       UNDER TEST - the figures have not yet been reconciled with Accounts, so the
       tab carries a banner saying so. Remove the banner, not the caveat, once the
       three-supplier reconciliation passes.                                     */
    PayLoaded = false;
    PayLoading = false;
    PayKpi: any = null;
    PaySupp: any[] = [];          // Table1 supplier exposure
    PayAge: any[] = [];           // Table3 portfolio ageing buckets
    PayFlow: any[] = [];          // Table4 cash forecast
    PayBills: any[] = [];         // Table5 open bill worklist
    PaySpeed: any[] = [];         // Table6 how fast we pay
    PayUnlinked: any = null;      // Table7 cost with no job number
    PayDqSum: any[] = [];         // Table8 discrepancy summary
    PayDqRows: any[] = [];        // Table9 discrepancy rows
    PayCacheInfo: any = null;
    PayLookback = '12';           // months of purchase history
    PayInflow = false;            // include the receivable leg of the forecast
    PayView = 'SUPPLIER';         // SUPPLIER | BILLS | DQ
    PayDqOpen: any = {};
    PayOverdueOnly = false;
    ReminderClient: any = null;
    ReminderText = '';
    ReminderSubject = '';

    /* ---- client drill-down ---- */
    DrillClient: any = null;
    DrillAgeing: any = null;
    DrillMargin: any[] = [];
    DrillJobs: any[] = [];

    /* ---- charts (ng2-charts / Chart.js 2.8) ---- */
    recoveryLabels: string[] = [];
    recoveryData: any[] = [];
    /* palette lifted from the Management Dashboard prototype (shadcn chart tokens):
       #1447e6 blue, #00bb7f green, #f99c00 amber, #ac4bff purple, #e40014 red */
    recoveryColors: any[] = [
        { backgroundColor: '#93b4ff', borderRadius: 4 },
        { backgroundColor: '#1447e6', borderRadius: 4 }
    ];
    barOptions: any = {
        responsive: true,
        maintainAspectRatio: false,
        legend: { display: false },
        tooltips: { backgroundColor: '#171717', xPadding: 10, yPadding: 8, cornerRadius: 8 },
        scales: {
            yAxes: [{
                ticks: { beginAtZero: true, fontColor: '#737373' },
                gridLines: { color: 'rgba(115,115,115,.12)', borderDash: [4, 4], drawBorder: false },
                scaleLabel: { display: true, labelString: 'Days', fontColor: '#737373' }
            }],
            xAxes: [{
                ticks: { autoSkip: false, maxRotation: 60, minRotation: 30, fontColor: '#737373' },
                gridLines: { display: false }
            }]
        }
    };

    mixLabels: string[] = [];
    mixData: number[] = [];
    mixColors: any[] = [{ backgroundColor: ['#1447e6', '#93b4ff', '#00bb7f', '#8fe6c8', '#f99c00'] }];
    donutOptions: any = {
        responsive: true,
        maintainAspectRatio: false,
        legend: { position: 'bottom', labels: { usePointStyle: true, fontColor: '#737373', padding: 16 } },
        tooltips: { backgroundColor: '#171717', xPadding: 10, yPadding: 8, cornerRadius: 8 },
        cutoutPercentage: 62
    };

    ageingLabels: string[] = ['0-30', '31-60', '61-90', '91-120', '121-180', '181-365', '366-730', '731-1095', '1095+'];
    ageingData: any[] = [];
    /* green -> amber -> red as the bucket ages, like the prototype's status meters */
    ageingColors: any[] = [{
        backgroundColor: ['#00bb7f', '#00bb7f', '#00bb7f', '#f99c00', '#f99c00', '#f99c00', '#e40014', '#e40014', '#e40014']
    }];
    hbarOptions: any = {
        responsive: true,
        maintainAspectRatio: false,
        legend: { display: false },
        tooltips: { backgroundColor: '#171717', xPadding: 10, yPadding: 8, cornerRadius: 8 },
        scales: {
            xAxes: [{
                ticks: { beginAtZero: true, fontColor: '#737373' },
                gridLines: { color: 'rgba(115,115,115,.12)', borderDash: [4, 4], drawBorder: false }
            }],
            yAxes: [{ ticks: { fontColor: '#737373' }, gridLines: { display: false } }]
        }
    };

    private RANK_COLORS = ['#1447e6', '#00bb7f', '#f99c00', '#ac4bff', '#009588', '#e40014', '#737373'];

    constructor(private _dataService: DataService,
        private _toasterService: ToastCommonService,
        private loaderService: LoaderService,
        private _loginService: LoginService,
        private exportser: ExportexcelService,
        private _sanitizer: DomSanitizer
    ) { }

    ngOnInit() {
        /* default period = current Indian financial year to date, built from the JS date
           rather than parsed from the login string, so no date-format guessing */
        const today = new Date();
        const fyStartYear = today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1;
        const fyStart = new Date(fyStartYear, 3, 1);

        /* mydatepicker's [selDate] takes either a string in the configured dateFormat
           or an IMyDate {year, month, day}. It must NOT be the {date:{...}, formatted}
           wrapper that DataService.stringdttoArry returns - that has no year/month/day,
           so the input renders "undefined/undefined" and the calendar loses its month.
           Plain dd/mm/yyyy strings, same as the P&L page. */
        this.FromDate = this._dataService.datechnge(fyStart);
        this.ToDate = this._dataService.datechnge(today);

        this.Branch = this._loginService.getLogin()[0].CITYCODE1;
        this.FillBranches();
        this.FillClients();

        const jsonmaster = {
            CmpCode: this._loginService.getLogin()[0].CMPCODE,
            CityCode: this._loginService.getLogin()[0].CITYCODE
        };
        this._dataService.getData('Accounts/fn_Acc_Rpt_Common_CompanyDetails', jsonmaster)
            .subscribe((data: any) => {
                if (data && data.Table && data.Table.length > 0) { this.cmpnyname = data.Table[0].cmp_name; }
            });

        /* user form rights - form no 442 = Finance Dashboard */
        this._loginService.verifyRights(442, '')
            .subscribe((data: any) => { this._loginService.checkVerify('View', data); });
    }

    FromDateChanged(ev) { this.FromDate = ev.formatted; }
    ToDateChanged(ev) { this.ToDate = ev.formatted; }

    FillBranches() {
        const json = { CMPCODE: this._loginService.getLogin()[0].CMPCODE };
        this._dataService.getData('Accounts/ACC_RPT_COMPANY_BRANCH_LIST', json)
            .subscribe((data: any) => {
                const list = (data && data.Table) ? data.Table : [];
                this.BranchList = [{ CITYCODE1: 'ALL', CITYNAME: 'ALL BRANCHES (CONSOLIDATED)' }].concat(list);
            });
    }

    /* client master for the searchable picker (same source as the outstanding screens);
       ng-select virtual-scrolls, so the full list is fine */
    FillClients() {
        const login = this._loginService.getLogin()[0];
        const json = { cmpcode: login.CMPCODE, citycode: login.CITYCODE, citycode1: login.CITYCODE1 };
        this._dataService.getData('Accounts/ACC_CMP_FillClient', json)
            .subscribe((data: any) => {
                const rows = (data && data.Table) ? data.Table : [];
                this.ClientMaster = rows
                    .map(r => ({ CODE: r.acctcodename || r.ACCTCODENAME || r.acctcode || r.ACCTCODE,
                                 NAME: r.acctname || r.ACCTNAME }))
                    .filter(r => r.CODE && r.NAME);
                if (this.ClientMaster.length > 0) { this.ClientList = this.ClientMaster; }
            }, () => { /* fall back to the result-derived list after the first search */ });
    }

    /* the pickers hold plain dd/mm/yyyy strings; tolerate an event object too */
    private fmtDate(d): string {
        if (!d) { return ''; }
        return (typeof d === 'string') ? d : (d.formatted ? d.formatted : '');
    }

    Submit(syncNow: boolean = false) {
        const from = this.fmtDate(this.FromDate);
        const to = this.fmtDate(this.ToDate);

        if (!from || !to) {
            this._toasterService.toast('warning', 'warning', 'Please select both From and To dates !');
            return;
        }
        if (this._dataService.dateTWoComparison(from, to)) {
            this._toasterService.toast('warning', 'warning', 'To Date cannot be earlier than From Date !');
            return;
        }

        this.loaderService.display(true);
        this.Searched = false;
        this.DrillClient = null;

        const bsel = this.BranchList.find(b => b.CITYCODE1 === this.Branch);
        this.BranchLabel = bsel ? bsel.CITYNAME : this.Branch;

        const jsonItem: any = {
            FROMDATE: from,
            TODATE: to,
            CMPCODE: this._loginService.getLogin()[0].CMPCODE,
            CITYCODE: this.Branch,
            CLIENTCODE: this.ClientCode ? this.ClientCode : '',
            TOPN: this.TopN
        };
        if (syncNow) { jsonItem.SYNCNOW = '1'; }

        this._dataService.getData('Accounts/ACC_RPT_FINANCE_DASHBOARD', jsonItem)
            .subscribe((data: any) => {
                this.loaderService.display(false);

                if (!data || !data.Table || data.Table.length === 0) {
                    this._toasterService.toast('warning', 'warning', 'No Record Found !');
                    return;
                }

                this.Kpi = data.Table[0];
                this.Exposure = data.Table1 ? data.Table1 : [];
                this.Recovery = data.Table2 ? data.Table2 : [];
                this.Mix = data.Table3 ? data.Table3 : [];
                this.UnbilledAge = data.Table4 ? data.Table4 : [];
                this.UnbilledJobs = data.Table5 ? data.Table5 : [];
                this.Ageing = data.Table6 ? data.Table6 : [];
                this.Margin = data.Table7 ? data.Table7 : [];
                this.JobPL = data.Table8 ? data.Table8 : [];
                this.UnbilledLines = data.Table9 ? data.Table9 : [];
                this.Funnel = data.Table10 ? data.Table10 : [];
                this.Coverage = (data.Table11 && data.Table11.length > 0) ? data.Table11[0] : null;
                this.CacheInfo = (data.CACHEINFO && data.CACHEINFO.length > 0) ? data.CACHEINFO[0] : null;
                this.MarginOpen = {};
                this.UnbilledOpen = {};
                /* the audit belongs to a filter set; a new Submit invalidates it */
                this.AuditLoaded = false;
                this.AuditSummary = [];
                this.AuditDetail = [];

                /* the client filter list is derived from the result, so no extra API call
                   and no 13,000-row master dropdown */
                if (this.ClientMaster.length === 0 && !this.ClientCode) {
                    this.ClientList = this.Exposure.map(r => ({ CODE: r.CLIENTCODE, NAME: r.CLIENTNAME }));
                }

                this.BuildCharts();
                this.Searched = true;
            }, () => {
                this.loaderService.display(false);
                this._toasterService.toast('error', 'error', 'Error while loading Finance Dashboard !');
            });
    }

    BuildCharts() {
        /* credit period vs actual recovery days, top N by billing */
        this.recoveryLabels = this.Recovery.map(r => this.shortName(r.CLIENTNAME));
        this.recoveryData = [
            { data: this.Recovery.map(r => this.num(r.CREDIT_PERIOD)), label: 'Credit period (days)' },
            { data: this.Recovery.map(r => this.num(r.ACTUAL_DAYS_WTD)), label: 'Actual recovery (days)' }
        ];

        /* taxable vs non-taxable, normalised to INR */
        const t = this.num(this.Kpi.TAXABLE_INR);
        const nt = this.num(this.Kpi.NONTAXABLE_INR);
        const tf = this.num(this.Kpi.TAXABLE_FX_INR);
        const ntf = this.num(this.Kpi.NONTAXABLE_FX_INR);
        this.mixLabels = ['Taxable (INR)', 'Non-taxable (INR)', 'Taxable (Foreign)', 'Non-taxable (Foreign)'];
        this.mixData = [t, nt, tf, ntf];

        /* receivable ageing, summed across the returned clients */
        const cols = ['DAYS_000_030', 'DAYS_031_060', 'DAYS_061_090', 'DAYS_091_120', 'DAYS_121_180',
            'DAYS_181_365', 'DAYS_366_730', 'DAYS_731_1095', 'DAYS_1096_9999'];
        const totals = cols.map(c => this.Ageing.reduce((s, r) => s + this.num(r[c]), 0));
        this.ageingData = [{ data: totals, label: 'Receivable' }];
    }

    /* ---- client drill-down (requirement: total exposure for a particular client) ---- */
    OpenDrill(row: any) {
        this.DrillClient = row;
        this.DrillAgeing = this.Ageing.find(a => a.CLIENTCODE === row.CLIENTCODE) || null;
        this.DrillMargin = this.Margin.filter(m => m.CLIENTCODE === row.CLIENTCODE);
        this.DrillJobs = this.UnbilledJobs.filter(j => j.CLIENTCODE === row.CLIENTCODE);
    }
    CloseDrill() { this.DrillClient = null; }

    /* re-run the whole dashboard scoped to one client */
    LoadClient(code: string) {
        this.ClientCode = code;
        this.Submit();
    }
    /* name + code for the active-filter chip; falls back to the code alone */
    ClientLabel(): string {
        const c = this.ClientList.find(x => x.CODE === this.ClientCode);
        return c ? (c.NAME + ' (' + c.CODE + ')') : this.ClientCode;
    }

    ClearClient() {
        this.ClientCode = null;
        this.Submit();
    }

    BackToSearch() { this.Searched = false; }

    SyncNow() { this.Submit(true); }

    /* ---- AUDIT tab: fetched live on first activation, never with the dashboard ---- */
    SetTab(tab: string) {
        this.Tab = tab;
        if (tab === 'AUDIT' && !this.AuditLoaded && !this.AuditLoading) { this.LoadAudit(); }
        if (tab === 'PAYABLES' && !this.PayLoaded && !this.PayLoading) { this.LoadPayables(); }
    }

    /* ---------------------------------------------------------------------------
       PAYABLES
       Same period and branch as the rest of the screen. SUPPLIERCODE is blank -
       the client filter above belongs to the receivable side and must not leak in.
    --------------------------------------------------------------------------- */
    LoadPayables(syncNow: boolean = false) {
        const from = this.fmtDate(this.FromDate), to = this.fmtDate(this.ToDate);
        if (!from || !to) {
            this._toasterService.toast('warning', 'warning', 'Please select both From and To dates !');
            return;
        }
        this.PayLoading = true;
        const jsonItem: any = {
            FROMDATE: from,
            TODATE: to,
            CMPCODE: this._loginService.getLogin()[0].CMPCODE,
            CITYCODE: this.Branch,
            SUPPLIERCODE: '',
            TOPN: this.TopN,
            LOOKBACK: this.PayLookback,
            INFLOW: this.PayInflow ? '1' : '0'
        };
        if (syncNow) { jsonItem.SYNCNOW = '1'; }

        this.loaderService.display(true);
        this._dataService.getData('Accounts/ACC_RPT_PAYABLE_DASHBOARD', jsonItem)
            .subscribe((data: any) => {
                this.loaderService.display(false);
                this.PayLoading = false;
                if (!data || !data.Table || data.Table.length === 0) {
                    this._toasterService.toast('warning', 'warning', 'No payable data found for this period !');
                    this.PayLoaded = true;
                    return;
                }
                this.PayKpi       = data.Table[0];
                this.PaySupp      = data.Table1 ? data.Table1 : [];
                this.PayAge       = data.Table3 ? data.Table3 : [];
                this.PayFlow      = data.Table4 ? data.Table4 : [];
                this.PayBills     = data.Table5 ? data.Table5 : [];
                this.PaySpeed     = data.Table6 ? data.Table6 : [];
                this.PayUnlinked  = (data.Table7 && data.Table7.length) ? data.Table7[0] : null;
                this.PayDqSum     = data.Table8 ? data.Table8 : [];
                this.PayDqRows    = data.Table9 ? data.Table9 : [];
                this.PayCacheInfo = (data.CACHEINFO && data.CACHEINFO.length) ? data.CACHEINFO[0] : null;
                this.PayDqOpen    = {};
                this.PayLoaded    = true;
            }, () => {
                this.loaderService.display(false);
                this.PayLoading = false;
                this._toasterService.toast('error', 'error', 'Error while loading Payables !');
            });
    }
    ReloadPayables() { this.PayLoaded = false; this.LoadPayables(); }
    SyncPayables()   { this.LoadPayables(true); }

    /* rows of the bill worklist, honouring the "overdue only" switch */
    PayBillRows(): any[] {
        return this.PayOverdueOnly ? this.PayBills.filter(b => this.num(b.OVERDUE_DAYS) > 0) : this.PayBills;
    }
    /* discrepancy rows for one issue code */
    PayDqFor(code: string): any[] {
        return this.PayDqRows.filter(r => r.ISSUE_CODE === code);
    }
    TogglePayDq(code: string) { this.PayDqOpen[code] = !this.PayDqOpen[code]; }

    /* severity 1 = the figures on screen are affected */
    dqClass(sev: any): string {
        const n = this.num(sev);
        return n === 1 ? 'fd-pill--red' : (n === 2 ? 'fd-pill--amber' : 'fd-pill--muted');
    }
    dqLabel(sev: any): string {
        const n = this.num(sev);
        return n === 1 ? 'AFFECTS FIGURES' : (n === 2 ? 'ASSUMED VALUE' : 'FYI');
    }
    payStatusClass(st: string): string {
        switch ((st || '').toUpperCase()) {
            case 'OVERDUE-OLD': return 'fd-pill--red';
            case 'OVERDUE':     return 'fd-pill--amber';
            case 'SETTLED':     return 'fd-pill--muted';
            default:            return 'fd-pill--green';
        }
    }
    /* share of the payable that is overdue, for the meter */
    payOverduePct(): number {
        if (!this.PayKpi) { return 0; }
        return this.pctOf(this.PayKpi.OVERDUE_AMT, this.PayKpi.TOTAL_PAYABLE);
    }
    /* biggest bucket width, for the ageing bar */
    payAgeWidth(a: any): number {
        const max = Math.max.apply(null, this.PayAge.map(x => this.num(x.AMOUNT)).concat([1]));
        return max > 0 ? (this.num(a.AMOUNT) / max) * 100 : 0;
    }

    LoadAudit() {
        this.AuditLoading = true;
        const jsonItem = {
            FROMDATE: this.fmtDate(this.FromDate),
            TODATE: this.fmtDate(this.ToDate),
            CMPCODE: this._loginService.getLogin()[0].CMPCODE,
            CITYCODE: this.Branch,
            CLIENTCODE: '',
            TOPN: this.TopN
        };
        this.loaderService.display(true);
        this._dataService.getData('Accounts/ACC_RPT_FINANCE_DASHBOARD_AUDIT', jsonItem)
            .subscribe((data: any) => {
                this.loaderService.display(false);
                this.AuditLoading = false;
                this.AuditSummary = data && data.Table ? data.Table : [];
                this.AuditDetail = data && data.Table1 ? data.Table1 : [];
                this.AuditOpen = {};
                this.AuditLoaded = true;
            }, () => {
                this.loaderService.display(false);
                this.AuditLoading = false;
                this._toasterService.toast('error', 'error', 'Error while loading the audit checks !');
            });
    }

    ToggleAudit(code: string) { this.AuditOpen[code] = !this.AuditOpen[code]; }
    AuditRows(code: string): any[] { return this.AuditDetail.filter(d => d.CHECK_CODE === code); }
    VisibleChecks(): any[] {
        return this.ShowPassing ? this.AuditSummary : this.AuditSummary.filter(c => this.num(c.ITEMS) > 0);
    }
    sevClass(sev: string): string {
        switch (sev) {
            case 'HIGH': return 'fd-pill--red';
            case 'MEDIUM': return 'fd-pill--amber';
            default: return 'fd-pill--grey';
        }
    }

    ExportAudit() {
        if (!this.AuditDetail || this.AuditDetail.length === 0) {
            this._toasterService.toast('warning', 'warning', 'Nothing to export !');
            return;
        }
        const headers = Object.keys(this.AuditDetail[0]);
        const rows = this.AuditDetail.map(r => headers.map(h => r[h]));
        this.exportser.exportExceltry({
            data: rows,
            headers: headers,
            pagetype: 'FinanceDashboardAudit',
            title: this.cmpnyname,
            subtitle: 'Data Quality Audit - ' + this.BranchLabel + ' - '
                + this.fmtDate(this.FromDate) + ' to ' + this.fmtDate(this.ToDate)
        }, 'FinanceDashboard_Audit_');
    }

    /* ---- payment reminder: composed in the browser, sent from the USER'S mail client.
       No SMTP on the server, no password handling, and the sender reviews the body
       before anything leaves the building. ---- */
    OpenReminder(r: any, ev?: any) {
        if (ev) { ev.stopPropagation(); }
        this.ReminderClient = r;
        const age = this.Ageing.find(a => a.CLIENTCODE === r.CLIENTCODE);
        const nl = '\r\n';
        const lines: string[] = [];
        this.ReminderSubject = 'Payment reminder - outstanding balance '
            + this.fmtINR(r.OUTSTANDING) + ' as on ' + this.fmtDate(this.ToDate);
        lines.push('Dear Sir / Madam,');
        lines.push('');
        lines.push('Greetings from ' + (this.cmpnyname || 'Manilal Patel Group') + '.');
        lines.push('');
        lines.push('As per our records, the following balance is outstanding against '
            + r.CLIENTNAME + ' (' + r.CLIENTCODE + ') as on ' + this.fmtDate(this.ToDate) + ':');
        lines.push('');
        lines.push('  Outstanding balance : Rs. ' + this.fmtINR(r.OUTSTANDING));
        lines.push('  Overdue (past due)  : Rs. ' + this.fmtINR(r.OVERDUE));
        if (this.num(r.CREDIT_PERIOD) > 0) {
            lines.push('  Agreed credit period: ' + r.CREDIT_PERIOD + ' days');
        }
        if (age) {
            lines.push('');
            lines.push('Ageing of the outstanding amount:');
            const buckets = [
                ['0-30 days', age.DAYS_000_030], ['31-60 days', age.DAYS_031_060],
                ['61-90 days', age.DAYS_061_090], ['91-120 days', age.DAYS_091_120],
                ['121-180 days', age.DAYS_121_180], ['181-365 days', age.DAYS_181_365],
                ['Over 1 year', this.num(age.DAYS_366_730) + this.num(age.DAYS_731_1095) + this.num(age.DAYS_1096_9999)]
            ];
            for (const b of buckets) {
                if (this.num(b[1]) > 0.01) {
                    lines.push('  ' + (b[0] + '              ').substring(0, 14) + ': Rs. ' + this.fmtINR(b[1]));
                }
            }
        }
        lines.push('');
        lines.push('We request you to kindly arrange payment at the earliest. If payment has');
        lines.push('already been made, please share the details so we can update our records.');
        lines.push('');
        lines.push('Thanks and regards,');
        lines.push('Accounts Department');
        lines.push(this.cmpnyname || '');
        this.ReminderText = lines.join(nl);
        this.ReminderOpen = true;
    }

    CloseReminder() { this.ReminderOpen = false; this.ReminderClient = null; }

    /* mailto URLs truncate around ~2,000 encoded chars in Outlook; past ~1,800 the
       button is disabled and the user is steered to Copy instead */
    ReminderTooLong(): boolean {
        return encodeURIComponent(this.ReminderText).length + encodeURIComponent(this.ReminderSubject).length > 1800;
    }

    SendReminderMail() {
        if (this.ReminderTooLong()) { return; }
        window.location.href = 'mailto:?subject=' + encodeURIComponent(this.ReminderSubject)
            + '&body=' + encodeURIComponent(this.ReminderText);
    }

    CopyReminder(area: HTMLTextAreaElement) {
        area.select();
        try {
            document.execCommand('copy');
            this._toasterService.toast('success', 'success', 'Reminder copied - paste it into your email.');
        } catch (e) {
            this._toasterService.toast('error', 'error', 'Copy failed - please select the text and copy manually.');
        }
        area.setSelectionRange(0, 0);
    }

    /* ---- Margin table sort: default client A-Z then service type; click a header to change ---- */
    /* default: most recently billed client x service first, so the latest billing is on top */
    MarginSortKey = 'LAST_BILLED_YMD';
    MarginSortDir = -1;           // 1 asc, -1 desc
    SortMargin(key: string) {
        if (this.MarginSortKey === key) { this.MarginSortDir = -this.MarginSortDir; }
        else {
            this.MarginSortKey = key;
            /* text columns start ascending, figures start with the biggest first */
            this.MarginSortDir = (key === 'CLIENTNAME' || key === 'SERVICE_TYPE') ? 1 : -1;
        }
    }
    sortArrow(key: string): string {
        return this.MarginSortKey === key ? (this.MarginSortDir === 1 ? '▲' : '▼') : '';
    }
    MarginSorted(): any[] {
        const k = this.MarginSortKey, d = this.MarginSortDir;
        const text = (k === 'CLIENTNAME' || k === 'SERVICE_TYPE' || k === 'LAST_BILLED_YMD');
        return (this.Margin || []).slice().sort((a, b) => {
            let r: number;
            if (text) {
                const av = (k === 'SERVICE_TYPE' ? this.svcLabel(a[k]) : (a[k] || '')).toString().toUpperCase();
                const bv = (k === 'SERVICE_TYPE' ? this.svcLabel(b[k]) : (b[k] || '')).toString().toUpperCase();
                r = av < bv ? -1 : av > bv ? 1 : 0;
            } else {
                r = this.num(a[k]) - this.num(b[k]);
            }
            if (r === 0 && k !== 'CLIENTNAME') {           /* stable secondary: client A-Z */
                const an = (a.CLIENTNAME || '').toUpperCase(), bn = (b.CLIENTNAME || '').toUpperCase();
                return an < bn ? -1 : an > bn ? 1 : 0;
            }
            if (r === 0 && k === 'CLIENTNAME') {           /* then service type */
                const as = this.svcLabel(a.SERVICE_TYPE), bs = this.svcLabel(b.SERVICE_TYPE);
                return as < bs ? -1 : as > bs ? 1 : 0;
            }
            return r * d;
        });
    }

    /* ERP voucher-type abbreviations -> full name (tooltip on the voucher pill) */
    vchName(t: string): string {
        switch ((t || '').toUpperCase().trim()) {
            case 'II': return 'Invoice';
            case 'SI': return 'Storage Invoice';
            case 'BI': return 'Brokerage Invoice';
            case 'CN': return 'Credit Note';
            case 'PI': return 'Purchase Invoice';
            case 'BP': return 'Bank Payment';
            case 'BR': return 'Bank Receipt';
            case 'CP': return 'Cash Payment';
            case 'CR': return 'Cash Receipt';
            case 'CE': return 'Cash Expense';
            case 'JV': return 'Journal Voucher';
            default:   return t;
        }
    }

    /* service-type codes from the proc -> one consistent "Name (CODE)" label everywhere:
       FFD = Freight Forwarding, CCLR = Custom Clearance, EX = Exwork */
    svcLabel(t: string): string {
        switch ((t || '').toUpperCase().trim()) {
            case 'FFD':      case 'FREIGHT FORWARDING': return 'Freight Forwarding (FFD)';
            case 'CCLR':     case 'CUSTOM CLEARANCE':   return 'Custom Clearance (CCLR)';
            case 'EX':       case 'EXWORK':             return 'Exwork (EX)';
            case 'FFD+CCLR': case 'FFD + CCLR':         return 'Freight Forwarding + Custom Clearance (FFD+CCLR)';
            case 'MISC':     case 'MISC / OTHER':       return 'Misc / Other';
            case 'UNCLASS':  case 'UNCLASSIFIED':       return 'Unclassified';
            default:                                    return t;
        }
    }

    /* ======================= KPI explainers ======================= */
    OpenExplain(key: string) { this.ExplainKey = key; }
    CloseExplain() { this.ExplainKey = null; }

    /* full-rupee figure for the arithmetic lines (the cards show the short form) */
    fmtRs(v): string { return 'Rs. ' + this.fmtINR(v); }

    /* Builds the explanation for the open card from the live KPI row, so the
       arithmetic a layman sees is exactly the numbers on the card. */
    explain(): any {
        const k = this.Kpi || {};
        const p = this.PayKpi || {};      // PAYABLES cards read their own KPI row
        const n = (v) => this.num(v);
        const period = this.fmtDate(this.FromDate) + ' to ' + this.fmtDate(this.ToDate);
        const asOn = this.fmtDate(this.ToDate);
        switch (this.ExplainKey) {
            case 'EXPOSURE': return {
                title: 'Total Exposure',
                what: 'All the money currently tied up with customers: what they owe us on bills, plus the cost we have already '
                    + 'spent on jobs that have not been invoiced yet. It is the true credit risk, as on ' + asOn + '.',
                steps: [
                    { op: '',  label: 'Outstanding (net, what customers owe us)', value: this.fmtRs(k.TOTAL_OUTSTANDING) },
                    { op: '+', label: 'Unbilled (cost on jobs not yet invoiced)', value: this.fmtRs(k.UNBILLED_VALUE) }
                ],
                result: { label: 'Total Exposure', value: this.fmtRs(k.TOTAL_EXPOSURE), short: this.fmtShort(k.TOTAL_EXPOSURE) },
                source: 'Outstanding comes from the invoice register less bill-wise receipts (acc_invoice, acc_bankdtls "AB" lines). '
                    + 'Unbilled is the purchase / payment / JV cost booked on jobs that have no invoice yet.',
                notes: ['Always greater than or equal to Outstanding.',
                        'Unbilled is cost, not the bill value - the real amount at stake is higher.']
            };
            case 'OUTSTANDING': return {
                title: 'Outstanding (net)',
                what: 'What customers still owe us today. We start from the bills that are not knocked off, then deduct the money '
                    + 'customers have paid on account (received, but never matched to a specific bill).',
                steps: [
                    { op: '',  label: 'Bills pending (bill value not yet knocked off)', value: this.fmtRs(k.GROSS_PENDING) },
                    { op: '-', label: 'Unapplied credit (receipts not matched to any bill)', value: this.fmtRs(k.UNADJUSTED_CREDITS) }
                ],
                result: { label: 'Outstanding (net)', value: this.fmtRs(k.TOTAL_OUTSTANDING), short: this.fmtShort(k.TOTAL_OUTSTANDING) },
                extra: [
                    { label: 'of which Overdue (past the due date)', value: this.fmtRs(k.OVERDUE_AMT) },
                    { label: 'Overdue share of Outstanding', value: this.pctOf(k.OVERDUE_AMT, k.TOTAL_OUTSTANDING).toFixed(0) + ' %' }
                ],
                source: 'A bill counts as paid when a receipt line is entered "Against Bill" (AB) with that bill number. '
                    + 'Receipts entered as GR / OA / AO name no bill, so they sit as unapplied credit and are deducted per client.',
                notes: ['Calculated per client and floored at zero - one client\'s surplus credit never offsets another client\'s dues.',
                        'Advances (AD) are kept separate and are not deducted here.',
                        'Due date = invoice date + credit period (see the Recovery card).']
            };
            case 'RECOVERY': return {
                title: 'Recovery (days to get paid)',
                what: 'How many days customers actually take to pay us, for bills raised in ' + period + ' that have been paid. '
                    + 'Big bills count more than small ones (value-weighted), so a few tiny old bills cannot distort the number.',
                steps: [
                    { op: '',  label: 'For each paid bill: days = payment date - invoice date', value: '' },
                    { op: '',  label: 'Weighted average = sum(days x bill amount) / sum(bill amount)', value: n(k.AVG_COLLECTION_DAYS).toFixed(1) + ' days' },
                    { op: '-', label: 'Credit period we agreed (average)', value: n(k.AVG_CREDIT_PERIOD).toFixed(1) + ' days' }
                ],
                result: { label: 'Recovery gap', value: (n(k.RECOVERY_GAP) > 0 ? '+' : '') + n(k.RECOVERY_GAP).toFixed(1) + ' days',
                          short: n(k.RECOVERY_GAP) > 0 ? 'paying LATE' : 'paying early / on time' },
                extra: (k.FASTEST_DAYS === undefined || k.FASTEST_DAYS === null) ? [] : [
                    { label: 'Fastest bill paid: Inv ' + k.FASTEST_INV + ' - ' + k.FASTEST_CLIENT, value: n(k.FASTEST_DAYS).toFixed(0) + ' days' },
                    { label: 'Slowest bill paid: Inv ' + k.SLOWEST_INV + ' - ' + k.SLOWEST_CLIENT, value: n(k.SLOWEST_DAYS).toFixed(0) + ' days' },
                    { label: 'Settled bills the average is built on', value: n(k.SETTLED_BILLS).toLocaleString('en-IN') }
                ],
                source: 'Invoice date from acc_invoice; payment date = the last "Against Bill" receipt for that bill. '
                    + 'Credit period: the bill\'s pay-by date if sensible (1-180 days), else the client master terms (sea / air), else 30 days.',
                notes: ['Positive gap = customers pay later than agreed; negative = earlier.',
                        'Fastest / Slowest are single bills - the quickest and the slowest one settled in the period. Fastest ignores bills paid before they were raised (prepaid).',
                        'Rule of thumb: +10 days on Rs. 70 Cr of yearly billing is about Rs. 2 Cr lent to customers interest-free.',
                        'Clients with no terms on file are measured against 30 days and show as NO-TERMS.']
            };
            case 'BILLED': return {
                title: 'Billed in Period',
                what: 'The value of invoices we raised to customers between ' + period + ', converted to INR.',
                steps: [
                    { op: '',  label: 'Invoices raised in the period', value: n(k.INVOICE_COUNT).toLocaleString('en-IN') + ' invoices' },
                    { op: '',  label: 'Taxable services', value: this.fmtRs(k.TAXABLE_INR) },
                    { op: '+', label: 'Non-taxable / exempt services', value: this.fmtRs(k.NONTAXABLE_INR) },
                    { op: '+', label: 'GST', value: this.fmtRs(k.GST_AMT) }
                ],
                result: { label: 'Billed in Period', value: this.fmtRs(k.BILLED_PERIOD), short: this.fmtShort(k.BILLED_PERIOD) },
                source: 'acc_invoice for the totals; the charge lines (both charge tables) for the taxable / non-taxable split; '
                    + 'GST from the CGST / SGST / IGST columns. Foreign-currency bills are shown at their INR value.',
                notes: ['Taxable + Non-taxable + GST reconciles to the invoice register to the rupee.']
            };
            case 'UNBILLED': return {
                title: 'Unbilled (cost)',
                what: 'Jobs opened in ' + period + ' on which we have already spent money (freight, transport, duty, agency) but have '
                    + 'not yet raised an invoice. Every rupee here is our money until the bill goes out.',
                steps: [
                    { op: '',  label: 'Jobs in the period with no invoice at all', value: n(k.UNBILLED_JOBS).toLocaleString('en-IN') + ' jobs' },
                    { op: '',  label: 'Cost booked on those jobs (purchases + payments + JVs)', value: this.fmtRs(k.UNBILLED_VALUE) }
                ],
                result: { label: 'Unbilled (cost)', value: this.fmtRs(k.UNBILLED_VALUE), short: this.fmtShort(k.UNBILLED_VALUE) },
                source: 'Job list from the export / import masters; "has an invoice" from acc_invjobno; '
                    + 'cost from purchase vouchers, bank / cash payments marked to the job, and JV lines on the job.',
                notes: ['This is what we have SPENT, not what the bill will be worth - the real leakage is higher.',
                        'The Unbilled tab lists every job so billing can act on it; anything over 15 days old should have a reason.']
            };
            case 'MARGIN': return {
                title: 'Margin %',
                what: 'Out of every Rs. 100 we billed on jobs opened in ' + period + ', how much stayed with us after paying the job costs. '
                    + 'Same grain as the Job Profit report (job-wise), taken from the accounts ledger.',
                steps: [
                    { op: '',  label: 'Income (job billing, net of GST)', value: this.fmtRs(k.REVENUE_PERIOD) },
                    { op: '-', label: 'Expense (job cost)', value: this.fmtRs(k.COST_PERIOD) },
                    { op: '=', label: 'Profit', value: this.fmtRs(n(k.REVENUE_PERIOD) - n(k.COST_PERIOD)) },
                    { op: '/', label: 'Income', value: this.fmtRs(k.REVENUE_PERIOD) },
                    { op: 'x', label: '100', value: '' }
                ],
                result: { label: 'Margin %', value: n(k.MARGIN_PCT).toFixed(1) + ' %', short: n(k.MARGIN_PCT) >= 0 ? 'profit' : 'loss so far' },
                source: 'Ledger figures, like every other card. Income = the invoice charge lines of the jobs opened in the period '
                    + '(both charge tables, net of GST, up to the To Date). Expense = purchases, bank / cash payments and JV lines '
                    + 'booked on those jobs. The shipment summary table is used only for service type and duty.',
                notes: ['Customs duty we pay and bill to the client sits outside job income, so clearance-heavy work can read negative even when the service made money.',
                        'A job costed but not yet fully invoiced shows a loss so far - that corrects once it is billed.',
                        'Read margin by service type and client on the Margin tab rather than the single headline %.']
            };
            /* ---------------- PAYABLES ----------------
               Same shape as the receivable cards above, but built from PayKpi. Kept in
               this one switch on purpose: there is a single explainer overlay and a
               single OpenExplain(), so a second copy would only drift. */
            case 'PAY_TOTAL': return {
                title: 'Total Payable',
                what: 'What we still owe our suppliers as on ' + asOn + '. We start from the bills that have not been '
                    + 'knocked off, then deduct money already paid to that supplier which names no bill (advances and '
                    + 'on-account payments).',
                steps: [
                    { op: '',  label: 'Bills pending (bill value not yet knocked off)', value: this.fmtRs(p.GROSS_PENDING) },
                    { op: '-', label: 'Paid but no bill named (advance / on account)', value: this.fmtRs(p.ADVANCE_PAID) }
                ],
                result: { label: 'Total Payable (net)', value: this.fmtRs(p.TOTAL_PAYABLE), short: this.fmtShort(p.TOTAL_PAYABLE) },
                extra: [
                    { label: 'Open bills making it up', value: n(p.OPEN_BILLS).toLocaleString('en-IN') },
                    { label: 'Suppliers involved', value: n(p.SUPPLIER_COUNT).toLocaleString('en-IN') },
                    { label: 'Bills loaded from', value: p.HISTORY_FROM + ' (' + p.HISTORY_MONTHS + ' months)' }
                ],
                source: 'Bills from acc_purchase / acc_purchasedtls. A bill counts as PAID when a line on a Bank Payment, '
                    + 'Cash Payment or Cash Expense voucher (BP / CP / CE) names that bill number - the supplier side does '
                    + 'not use the "Against Bill" flag the receipt side uses.',
                notes: ['A bill\'s value is Amount + Deduction. Those are two alternative value columns in this ERP, not '
                        + 'value-and-TDS; TDS has its own column. Reading them the other way understated this figure.',
                        'Calculated per supplier and floored at zero - one supplier\'s advance never reduces what we owe another.',
                        'Direct job cost paid with no purchase bill behind it is excluded: it can never settle a payable.',
                        'Only bills raised inside the History window are loaded. Widen it if you are reconciling.']
            };
            case 'PAY_OVERDUE': return {
                title: 'Overdue',
                what: 'The part of the payable that is already past its pay-by date on ' + asOn + '. This is money the '
                    + 'supplier is entitled to chase us for today.',
                steps: [
                    { op: '',  label: 'For each open bill: due date = the date keyed on the bill', value: '' },
                    { op: '',  label: 'if that date is missing or not credible, bill date + 30 days', value: '' },
                    { op: '',  label: 'Add up every bill whose due date is before ' + asOn, value: '' }
                ],
                result: { label: 'Overdue', value: this.fmtRs(p.OVERDUE_AMT), short: this.fmtShort(p.OVERDUE_AMT) },
                extra: [
                    { label: 'Share of Total Payable', value: this.payOverduePct().toFixed(0) + ' %' },
                    { label: 'Oldest bill still open', value: n(p.OLDEST_BILL_DAYS).toLocaleString('en-IN') + ' days' },
                    { label: 'Bills carrying a usable due date', value: n(p.PCT_WITH_DUEDATE).toFixed(0) + ' %' },
                    { label: 'Due dates rejected as not credible', value: n(p.DUEDATE_IGNORED).toLocaleString('en-IN') }
                ],
                source: 'Due date from acc_purchase.pur_duedt, accepted only when it falls 0 to 180 days AFTER the bill '
                    + 'date. Anything outside that - including due dates keyed before the bill date - is ignored and the '
                    + '30-day assumption is used instead. Every rejected bill is listed on the Data to fix view.',
                notes: ['Where the due date was assumed, "overdue" is our assumption, not an agreed term.',
                        'A high overdue share alongside a low DPO usually means old residue that was never knocked off, '
                        + 'not that we are paying late today - check the oldest bills first.']
            };
            case 'PAY_DUE': return {
                title: 'Falling due',
                what: 'Bills that are NOT yet overdue but come due shortly. This is the cash we have to find next. '
                    + 'Each figure is cumulative from today, so the 30-day figure includes the 7 and 15-day ones.',
                steps: [
                    { op: '',  label: 'Due within 7 days', value: this.fmtRs(p.DUE_7) },
                    { op: '',  label: 'Due within 15 days (includes the 7-day figure)', value: this.fmtRs(p.DUE_15) },
                    { op: '',  label: 'Due within 30 days (includes the 15-day figure)', value: this.fmtRs(p.DUE_30) }
                ],
                result: { label: 'Falling due in 7 days', value: this.fmtRs(p.DUE_7), short: this.fmtShort(p.DUE_7) },
                extra: [
                    { label: 'Already overdue (counted separately, NOT included above)', value: this.fmtRs(p.OVERDUE_AMT) }
                ],
                source: 'The same due date as the Overdue card: the date on the bill when it is credible, otherwise bill '
                    + 'date + 30 days.',
                notes: ['Overdue money is deliberately kept out of these buckets - it is not "falling due", it is late.',
                        'Where the due date was assumed the bill may really be due earlier or later than shown.',
                        'The Cash forecast below puts these against expected collections.']
            };
            case 'PAY_DPO': return {
                title: 'DPO (days we take to pay)',
                what: 'How many days we actually take to pay a supplier, for bills raised in ' + period + ' that have '
                    + 'since been settled. Big bills count more than small ones (value-weighted), so a handful of tiny '
                    + 'bills cannot distort it.',
                steps: [
                    { op: '',  label: 'For each settled bill: days = payment date - bill date', value: '' },
                    { op: '',  label: 'Weighted average = sum(days x bill value) / sum(bill value)',
                      value: (p.DPO_DAYS === null || p.DPO_DAYS === undefined) ? '-' : n(p.DPO_DAYS).toFixed(1) + ' days' }
                ],
                result: { label: 'DPO', value: (p.DPO_DAYS === null || p.DPO_DAYS === undefined) ? '-' : n(p.DPO_DAYS).toFixed(1) + ' days',
                          short: 'average across settled bills' },
                extra: [
                    { label: 'Fastest bill settled', value: n(p.FASTEST_PAID_DAYS).toFixed(0) + ' days' },
                    { label: 'Slowest bill settled', value: n(p.SLOWEST_PAID_DAYS).toFixed(0) + ' days' }
                ],
                source: 'Bill date from acc_purchase; payment date = the LAST payment voucher line naming that bill.',
                notes: ['Compare with Recovery on the Overview tab. Paying suppliers faster than customers pay us means '
                        + 'we are funding the gap out of our own cash.',
                        'Only bills raised in the period AND settled are counted - bills still open are not in this average, '
                        + 'so DPO can look healthy while the Overdue card does not.']
            };
            case 'PAY_PURCHASED': return {
                title: 'Purchased in period',
                what: 'The value of supplier bills we booked between ' + period + '. This is what we committed to pay, '
                    + 'whether or not it has been paid yet.',
                steps: [
                    { op: '',  label: 'Bills booked in the period', value: n(p.BILLS_IN_PERIOD).toLocaleString('en-IN') + ' bills' },
                    { op: '',  label: 'Gross billed (charge lines: Amount + Deduction)', value: this.fmtRs(p.GROSS_BILLED_PERIOD) },
                    { op: '-', label: 'TDS deducted on those bills', value: this.fmtRs(p.TDS_DEDUCTED_PERIOD) }
                ],
                result: { label: 'Purchased (net of TDS)', value: this.fmtRs(p.PURCHASED_PERIOD), short: this.fmtShort(p.PURCHASED_PERIOD) },
                source: 'acc_purchasedtls charge lines, grouped by the bill date on acc_purchase. TDS comes from the '
                    + 'TDS_AMT column on the line.',
                notes: ['A charge line puts its value in EITHER the Amount column or the Deduction column - both are '
                        + 'value columns, so both are added. Only 27 lines in 17 lakh use both, and those bills are '
                        + 'listed on the Data to fix view.',
                        'This is bills BOOKED in the period, not bills paid - see the Paid card for cash going out.',
                        'Bills whose date cannot be read are excluded entirely and are listed on Data to fix.']
            };
            case 'PAY_PAID': return {
                title: 'Paid in period',
                what: 'Money that actually went out to suppliers between ' + period + ' against a named bill.',
                steps: [
                    { op: '',  label: 'Payment lines on BP / CP / CE vouchers that name a bill', value: this.fmtRs(p.PAID_PERIOD) }
                ],
                result: { label: 'Paid in period', value: this.fmtRs(p.PAID_PERIOD), short: this.fmtShort(p.PAID_PERIOD) },
                extra: [
                    { label: 'Direct job cost paid with no purchase bill behind it', value: this.fmtRs(p.JOBCOST_PAID_PERIOD) },
                    { label: 'Suppliers paid', value: n(p.SUPPLIER_COUNT).toLocaleString('en-IN') }
                ],
                source: 'acc_bankdtls lines on vouchers with status BP (Bank Payment), CP (Cash Payment) or CE (Cash '
                    + 'Expense), where the line carries a bill number. Both the Amount and the Deduction column are '
                    + 'counted - like the purchase side, they are two value columns.',
                notes: ['Direct job cost is shown separately, not added: it is cost booked straight to a job with no '
                        + 'purchase bill, so it can never settle a payable.',
                        'A payment that names no bill at all is an advance and appears on the Total Payable card instead.']
            };
        }
        return null;
    }

    fmtINR(v): string {
        const n = this.num(v);
        return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    cacheAge(): string {
        if (!this.CacheInfo) { return ''; }
        const s = this.num(this.CacheInfo.AGE_SECONDS);
        if (s < 90) { return 'just now'; }
        if (s < 5400) { return Math.round(s / 60) + ' min ago'; }
        return (s / 3600).toFixed(1) + ' h ago';
    }

    funnelWidth(f: any): number {
        const p = this.num(f.PCT_OF_FIRST);
        return Math.max(12, Math.min(100, p));
    }

    /* ---- job-level drills (Job Profit grain) ---- */
    ToggleMargin(code: string) { this.MarginOpen[code] = !this.MarginOpen[code]; }
    ToggleUnbilled(jobno: string) { this.UnbilledOpen[jobno] = !this.UnbilledOpen[jobno]; }

    /* jobs behind one Margin row: same client AND same service type (the template
       passes both; filtering by client alone repeated every job under every type) */
    JobsFor(client: string, svc?: string): any[] {
        const t = (svc || '').toUpperCase().trim();
        /* children follow the parent: Last Billed newest first (or oldest first if the
           header arrow is flipped); never-billed jobs sink to the bottom, by job date */
        const dir = (this.MarginSortKey === 'LAST_BILLED_YMD') ? this.MarginSortDir : -1;
        return this.JobPL.filter(j => j.CLIENTCODE === client
            && (!t || (j.SERVICE_TYPE || '').toUpperCase().trim() === t))
            .sort((a, b) => {
                const ab = this.ymd(a.LAST_BILLED), bb = this.ymd(b.LAST_BILLED);
                if (ab && !bb) { return -1; }
                if (!ab && bb) { return 1; }
                const r = ab.localeCompare(bb) * dir;
                return r || this.ymd(a.JOB_DATE).localeCompare(this.ymd(b.JOB_DATE)) * dir
                         || (a.JOBNO || '').localeCompare(b.JOBNO || '');
            });
    }
    /* dd/MM/yyyy -> yyyyMMdd so job dates sort chronologically */
    private ymd(d: string): string {
        const s = (d || '').toString();
        return s.length === 10 ? s.substr(6, 4) + s.substr(3, 2) + s.substr(0, 2) : s;
    }
    /* voucher lines under an unbilled job: by voucher date, then type, then number */
    LinesFor(jobno: string): any[] {
        return this.UnbilledLines.filter(l => l.JOBNO === jobno)
            .sort((a, b) => this.ymd(a.REF_DATE).localeCompare(this.ymd(b.REF_DATE))
                || (a.VCH_TYPE || a.SOURCE_ || '').localeCompare(b.VCH_TYPE || b.SOURCE_ || '')
                || (a.REFNO || '').localeCompare(b.REFNO || ''));
    }

    /* ---- Unbilled table sort: default OLDEST first (a billing worklist), then biggest cost ---- */
    UnbilledSortKey = 'AGE_DAYS';
    UnbilledSortDir = -1;
    SortUnbilled(key: string) {
        if (this.UnbilledSortKey === key) { this.UnbilledSortDir = -this.UnbilledSortDir; }
        else {
            this.UnbilledSortKey = key;
            const text = (key === 'JOBNO' || key === 'MODE_' || key === 'CLIENTNAME' || key === 'JOB_DATE');
            this.UnbilledSortDir = text ? 1 : -1;      /* text & date ascending, figures biggest first */
        }
    }
    usortArrow(key: string): string {
        return this.UnbilledSortKey === key ? (this.UnbilledSortDir === 1 ? '\u25B2' : '\u25BC') : '';
    }
    UnbilledSorted(): any[] {
        const k = this.UnbilledSortKey, d = this.UnbilledSortDir;
        const text = (k === 'JOBNO' || k === 'MODE_' || k === 'CLIENTNAME' || k === 'JOB_DATE');
        return (this.UnbilledJobs || []).slice().sort((a, b) => {
            let r: number;
            if (k === 'JOB_DATE') { r = this.ymd(a.JOB_DATE).localeCompare(this.ymd(b.JOB_DATE)); }
            else if (text) {
                const av = (a[k] || '').toString().toUpperCase(), bv = (b[k] || '').toString().toUpperCase();
                r = av < bv ? -1 : av > bv ? 1 : 0;
            } else { r = this.num(a[k]) - this.num(b[k]); }
            if (r !== 0) { return r * d; }
            /* tie-breakers: biggest cost, then oldest */
            return (this.num(b.TOTAL_COST) - this.num(a.TOTAL_COST))
                || (this.num(b.AGE_DAYS) - this.num(a.AGE_DAYS));
        });
    }

    /* full voucher-level statement for one job - the existing Job Profit popup page */
    /* job number click -> drawer (stays on the dashboard); the arrow icon still opens the detached window */
    OpenJobDrawer(jobno: string) {
        const no = String(jobno || '').replace(/^'/, '').trim();
        if (!no) { return; }
        this.JobDrawerNo = no;
        this.JobDrawerUrl = this._sanitizer.bypassSecurityTrustResourceUrl('./#/popup/Account-Job-Profit-Report/' + no + '/');
    }
    CloseJobDrawer() { this.JobDrawerNo = null; this.JobDrawerUrl = null; }
    @HostListener('document:keydown.escape')
    onEsc() {
        if (this.JobDrawerNo) { this.CloseJobDrawer(); }
        else if (this.LegendOpen) { this.LegendOpen = false; }
        else if (this.ExplainKey) { this.CloseExplain(); }
    }

    OpenJobPopup(jobno: string) {
        const theTop = (screen.height / 2) - (483 / 2);
        const theLeft = (screen.width / 2) - (780 / 2);
        const toolbar = 'resizable=no,scrollbars=yes,width=800,height=450,status=no,left=' + theLeft + ',top=' + theTop;
        window.open('./#/popup/Account-Job-Profit-Report/' + String(jobno).replace(/^'/, '') + '/', 'Job Profit Report', toolbar);
    }

    Reset() {
        const today = new Date();
        const fyStartYear = today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1;
        this.FromDate = this._dataService.datechnge(new Date(fyStartYear, 3, 1));
        this.ToDate = this._dataService.datechnge(today);
        this.Branch = this._loginService.getLogin()[0].CITYCODE1;
        this.ClientCode = null;
        this.TopN = 10;
        this.Searched = false;
        this.Tab = 'OVERVIEW';
        this.DrillClient = null;
    }

    /* ---- helpers ---- */
    num(v): number {
        const n = parseFloat(v);
        return isNaN(n) ? 0 : n;
    }

    shortName(n: string): string {
        if (!n) { return ''; }
        return n.length > 18 ? n.substring(0, 18) + '..' : n;
    }

    /* compact Indian display for the KPI cards: 1,23,45,678 -> 1.23 Cr */
    fmtShort(v): string {
        const n = this.num(v);
        const a = Math.abs(n);
        const sign = n < 0 ? '-' : '';
        if (a >= 10000000) { return sign + (a / 10000000).toFixed(2) + ' Cr'; }
        if (a >= 100000) { return sign + (a / 100000).toFixed(2) + ' L'; }
        return sign + a.toFixed(0);
    }

    pillClass(status: string): string {
        switch (status) {
            case 'RED': return 'fd-pill--red';
            case 'AMBER': return 'fd-pill--amber';
            case 'GREEN': return 'fd-pill--green';
            default: return 'fd-pill--grey';
        }
    }

    meterClass(status: string): string {
        switch (status) {
            case 'RED': return 'bad';
            case 'AMBER': return 'warn';
            case 'GREEN': return 'ok';
            default: return '';
        }
    }

    iconClass(status: string): string {
        switch (status) {
            case 'RED': return 'fd-ico--red';
            case 'AMBER': return 'fd-ico--amber';
            case 'GREEN': return 'fd-ico--green';
            default: return 'fd-ico--blue';
        }
    }

    /* width of the utilisation bar, capped so a 400% client does not overflow the cell */
    utilWidth(v): number {
        const n = this.num(v);
        return n > 100 ? 100 : (n < 0 ? 0 : n);
    }

    pctOf(part, whole): number {
        const w = this.num(whole);
        if (w <= 0) { return 0; }
        const p = this.num(part) / w * 100;
        return p > 100 ? 100 : (p < 0 ? 0 : p);
    }

    taxablePct(): number {
        if (!this.Kpi) { return 0; }
        const tax = this.num(this.Kpi.TAXABLE_INR) + this.num(this.Kpi.TAXABLE_FX_INR);
        const all = tax + this.num(this.Kpi.NONTAXABLE_INR) + this.num(this.Kpi.NONTAXABLE_FX_INR);
        return all > 0 ? tax / all * 100 : 0;
    }

    deltaArrow(v): string {
        const n = this.num(v);
        return n > 0 ? '↗' : (n < 0 ? '↘' : '→');
    }

    rankColor(i: number): string {
        return this.RANK_COLORS[i % this.RANK_COLORS.length];
    }

    bucketColor(sortOrder): string {
        const n = this.num(sortOrder);
        return n <= 1 ? '#00bb7f' : (n === 2 ? '#f99c00' : (n === 3 ? '#f05100' : '#e40014'));
    }

    ExportExposure() {
        if (!this.Exposure || this.Exposure.length === 0) {
            this._toasterService.toast('warning', 'warning', 'Nothing to export !');
            return;
        }
        const headers = Object.keys(this.Exposure[0]);
        const rows = this.Exposure.map(r => headers.map(h => r[h]));
        const reportData = {
            data: rows,
            headers: headers,
            pagetype: 'FinanceDashboard',
            title: this.cmpnyname,
            subtitle: 'Client Exposure - ' + this.BranchLabel + ' - '
                + this.fmtDate(this.FromDate) + ' to ' + this.fmtDate(this.ToDate)
        };
        this.exportser.exportExceltry(reportData, 'FinanceDashboard_Exposure_');
    }
}
