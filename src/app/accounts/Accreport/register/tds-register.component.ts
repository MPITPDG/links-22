import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IMyDpOptions } from 'mydatepicker';
import { DataService } from 'src/app/shared/service/dataService';
import { LoginService } from 'src/app/shared/service/loginService';
import { ToastCommonService } from 'src/app/shared/service/toastService';
import { LoaderService } from 'src/app/shared/service/loader.service';
import { TdsRegisterExportService } from './tds-register-export.service';

/* One row of the on-screen register. KIND drives the row style:
     party    - party name band
     head     - TDS account head band (ledger + 194 section)
     row      - voucher line
     subtotal - per party/head total with closing balance
     grand    - register total (rendered outside the loop)                         */
export interface TdsRegisterLine {
    KIND: 'party' | 'head' | 'row' | 'subtotal';
    PARTYCODE?: string;
    PARTYNAME?: string;
    PARTYPAN?: string;
    HEADNAME?: string;
    SRNO?: number;
    VNO?: string;
    VTYPE?: string;
    VDATE?: string;
    TDSON?: number;
    TDSPCT?: number;
    DRAMT?: number;
    CRAMT?: number;
    BALANCE?: number;       // signed: P = Cr - Dr, R = Dr - Cr
    BALTEXT?: string;       // "13,630.00 Cr"
    NARRATION?: string;
    BILLNO?: string;
}

import { FinPager, FinChart, finBars, finNum, finAmt, finByKey } from '../fin-kit';
@Component({
    selector: 'app-tds-register',
    templateUrl: './tds-register.component.html',
    host: { class: 'kit-accreport' },
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class TdsRegisterComponent implements OnInit {

    public myDatePickerOptions: IMyDpOptions = {
        dateFormat: 'dd-mmm-yyyy',
        inline: false,
        height: '18px',
        width: '180px',
        componentDisabled: false,
        selectionTxtFontSize: '12px',
        editableDateField: false,
        sunHighlight: true,
        satHighlight: true,
        firstDayOfWeek: 'su',
        openSelectorTopOfInput: false,
        openSelectorOnInputClick: true,
        selectorHeight: '180px',
        selectorWidth: '200px',
        disableUntil: { year: 0, month: 0, day: 0 },
        disableSince: { year: 0, month: 0, day: 0 }
    };

    // 'P' = TDS Payable (deducted by us), 'R' = TDS Receivable (deducted by clients)
    RegType: string = 'P';
    Header: string = 'TDS Payable Register';
    // tbl_mst_form ids - DIFFER PER APP: 436/437 on LinksDB (manilal uses 445/446)
    private readonly FORMIDS = { P: '436', R: '437' };

    FromDate: any;
    ToDate: any;
    BranchList: any[] = [];
    Branch: string = '';
    BranchLabel: string = '';
    PartyList: any[] = [];
    Party: string = null;
    Compname: string = '';

    activeTab: string = 'DETAIL';        // DETAIL | SUMMARY
    Searched: boolean = false;
    rawRows: any[] = [];                 // Table  - voucher lines from the proc
    rawSummary: any[] = [];              // Table1 - party summary from the proc
    status: any = null;                  // Table2

    lines: TdsRegisterLine[] = [];       // grouped detail (party -> head -> rows -> subtotal)
    summary: any[] = [];                 // party summary after party filter
    totTdsOn: number = 0;
    totDr: number = 0;
    totCr: number = 0;
    totBalText: string = '';
    partyCount: number = 0;
    rowCount: number = 0;

    constructor(
        private _dataService: DataService,
        private _loginService: LoginService,
        private _toasterService: ToastCommonService,
        private _loaderService: LoaderService,
        private _activatedRoute: ActivatedRoute,
        private _exportService: TdsRegisterExportService
    ) { }

    ngOnInit() {
        // two menu entries / routes (tdspayable, tdsreceivable) share this screen; route data picks the register
        this._activatedRoute.data.subscribe(rd => {
            const t = ((rd && rd['regType']) || 'P').toString().toUpperCase();
            this.RegType = (t === 'R') ? 'R' : 'P';
            this.Header = (this.RegType === 'R') ? 'TDS Receivable Register' : 'TDS Payable Register';
            this.resetResult();
            this.verifyPermission(this.FORMIDS[this.RegType], 'View');
        });
        this.FromDate = this._dataService.datechnge1(this._loginService.getLogin()[0].FINANCIAL_YEAR.STARTDATE);
        this.ToDate = this._dataService.datechnge1(new Date());
        this.Branch = this._loginService.getLogin()[0].CITYCODE1;
        this.FillBranches();
        this.getCompanyName();
    }

    verifyPermission(formId, userMode) {
        this._loginService.verifyRights(formId, '')
            .subscribe((data: any) => {
                this._loginService.checkVerify(userMode, data);
            });
    }

    FillBranches() {
        const json = { CMPCODE: this._loginService.getLogin()[0].CMPCODE };
        this._dataService.getData('Accounts/ACC_RPT_COMPANY_BRANCH_LIST', json)
            .subscribe((data: any) => {
                const list = (data && data.Table) ? data.Table : [];
                this.BranchList = [{ CITYCODE1: 'ALL', CITYNAME: 'ALL BRANCHES' }].concat(list);
            });
    }

    getCompanyName() {
        const json = {
            CmpCode: this._loginService.getLogin()[0].CMPCODE,
            CityCode: this._loginService.getLogin()[0].CITYCODE
        };
        this._dataService.getData('Accounts/fn_Acc_Rpt_Common_CompanyDetails', json)
            .subscribe((data: any) => {
                if (data && data.Table && data.Table.length > 0) { this.Compname = data.Table[0].cmp_name; }
            });
    }

    FromDateChanged(ev) { this.FromDate = ev.formatted; }
    ToDateChanged(ev) { this.ToDate = ev.formatted; }

    private resetResult() {
        this.Searched = false;
        this.rawRows = []; this.rawSummary = []; this.status = null;
        this.lines = []; this.summary = []; this.PartyList = []; this.Party = null;
        this.totTdsOn = 0; this.totDr = 0; this.totCr = 0; this.totBalText = '';
        this.partyCount = 0; this.rowCount = 0;
    }

    clear() {
        this.FromDate = this._dataService.datechnge1(this._loginService.getLogin()[0].FINANCIAL_YEAR.STARTDATE);
        this.ToDate = this._dataService.datechnge1(new Date());
        this.Branch = this._loginService.getLogin()[0].CITYCODE1;
        this.resetResult();
    }

    Showdata() {
        if (!this.FromDate || !this.ToDate) {
            this._toasterService.toast('warning', 'warning', 'Please select From and To date');
            return false;
        }
        if (!this.Branch) {
            this._toasterService.toast('warning', 'warning', 'Please select Branch');
            return false;
        }
        const bsel = this.BranchList.find(b => b.CITYCODE1 === this.Branch);
        this.BranchLabel = bsel ? bsel.CITYNAME : this.Branch;
        const json = {
            FROMDATE: this.FromDate,
            TODATE: this.ToDate,
            CMPCODE: this._loginService.getLogin()[0].CMPCODE,
            CITYCODE1: this.Branch
        };
        this._loaderService.display(true);
        const action = (this.RegType === 'R') ? 'Accounts/ACC_RPT_TDS_RECEIVABLE_REGISTER' : 'Accounts/ACC_RPT_TDS_PAYABLE_REGISTER';
        this._dataService.getData(action, json)
            .subscribe((data: any) => {
                this._loaderService.display(false);
                this.status = (data && data.Table2 && data.Table2.length > 0) ? data.Table2[0] : null;
                if (this.status && this.status.STATUS !== '100') {
                    this._toasterService.toast('error', 'error', this.status.MSG);
                    return;
                }
                this.rawRows = (data && data.Table) ? data.Table : [];
                this.rawSummary = (data && data.Table1) ? data.Table1 : [];
                if (this.rawRows.length === 0) {
                    this.Searched = false;
                    this._toasterService.toast('warning', 'warning', 'No Record Found !');
                    return;
                }
                // party dropdown = the parties present in the result (filtering is client-side)
                this.PartyList = this.rawSummary.map(s => ({ PARTYCODE: s.PARTYCODE, PARTYNAME: s.PARTYNAME }));
                this.Party = null;
                this.buildGroups();
                this.Searched = true;
                this.activeTab = 'DETAIL';
            },
                () => {
                    this._loaderService.display(false);
                    this._toasterService.toast('error', 'error', 'Error while loading ' + this.Header + ' !');
                });
    }

    onPartyChange() { if (this.Searched) { this.buildGroups(); } }

    /* signed balance: payable register carries a credit balance, receivable a debit balance */
    private signed(dr: number, cr: number): number {
        return (this.RegType === 'P') ? (cr - dr) : (dr - cr);
    }
    balText(bal: number): string {
        const natural = (this.RegType === 'P') ? 'Cr' : 'Dr';
        const opposite = (this.RegType === 'P') ? 'Dr' : 'Cr';
        const abs = Math.abs(bal);
        return abs.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            + ' ' + (bal >= 0 ? natural : opposite);
    }

    /* Party -> head -> voucher lines, Sr No and running balance per group, subtotal per group. */
    buildGroups() {
        const rows = this.Party ? this.rawRows.filter(r => r.PARTYCODE === this.Party) : this.rawRows;
        const out: TdsRegisterLine[] = [];
        let curParty: string = null, curHead: string = null;
        let sr = 0, gOn = 0, gDr = 0, gCr = 0;
        let tOn = 0, tDr = 0, tCr = 0;
        const parties = new Set<string>();

        const closeGroup = () => {
            if (curHead !== null) {
                gOn = Math.round(gOn * 100) / 100; gDr = Math.round(gDr * 100) / 100; gCr = Math.round(gCr * 100) / 100;
                out.push({ KIND: 'subtotal', TDSON: gOn, DRAMT: gDr, CRAMT: gCr,
                           BALANCE: this.signed(gDr, gCr), BALTEXT: this.balText(this.signed(gDr, gCr)) });
            }
            sr = 0; gOn = 0; gDr = 0; gCr = 0;
        };

        for (const r of rows) {
            const on = Number(r.TDSON) || 0, dr = Number(r.DRAMT) || 0, cr = Number(r.CRAMT) || 0;
            if (r.PARTYCODE !== curParty) {
                closeGroup();
                curParty = r.PARTYCODE; curHead = null;
                parties.add(curParty);
                out.push({ KIND: 'party', PARTYCODE: r.PARTYCODE, PARTYNAME: r.PARTYNAME, PARTYPAN: r.PARTYPAN });
            }
            if (r.HEADNAME !== curHead) {
                if (curHead !== null) { closeGroup(); }
                curHead = r.HEADNAME;
                out.push({ KIND: 'head', HEADNAME: r.HEADNAME });
            }
            sr++; gOn += on; gDr += dr; gCr += cr; tOn += on; tDr += dr; tCr += cr;
            const bal = this.signed(gDr, gCr);
            out.push({
                KIND: 'row', SRNO: sr, VNO: r.VNO, VTYPE: r.VTYPE, VDATE: r.VDATE,
                HEADNAME: (sr === 1) ? r.HEADNAME : '',
                TDSON: on, TDSPCT: Number(r.TDSPCT) || 0, DRAMT: dr, CRAMT: cr,
                BALANCE: bal, BALTEXT: this.balText(bal),
                NARRATION: r.NARRATION, BILLNO: r.BILLNO
            });
        }
        closeGroup();

        const r2 = (n: number) => Math.round(n * 100) / 100;
        this.lines = out;
        this.summary = this.Party ? this.rawSummary.filter(s => s.PARTYCODE === this.Party) : this.rawSummary;
        this.totTdsOn = r2(tOn); this.totDr = r2(tDr); this.totCr = r2(tCr);
        this.totBalText = this.balText(this.signed(tDr, tCr));
                this.partyCount = parties.size;
        this.rowCount = rows.length;
        this.buildView();
    }

    summaryAmtText(s: any): string {
        const net = Number(s.NETAMT) || 0;
        return Math.abs(net).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ' + s.DRCR;
    }

    Exporttoxl() {
        if (!this.Searched || this.lines.length === 0) {
            this._toasterService.toast('warning', 'warning', 'Nothing to export');
            return false;
        }
        const meta = {
            company: this.Compname,
            title: this.Header,
            fromDate: this.FromDate,
            toDate: this.ToDate,
            branch: this.BranchLabel,
            regType: this.RegType,
            totTdsOn: this.totTdsOn, totDr: this.totDr, totCr: this.totCr, totBalText: this.totBalText
        };
        const name = (this.RegType === 'P' ? 'TDS_Payable_Register_' : 'TDS_Receivable_Register_')
            + this.FromDate + '_' + this.ToDate;
        this._exportService.export(meta, this.lines, this.summary.map(s => ({ ...s, AMTTEXT: this.summaryAmtText(s) })), name);
    }

    // ---- redesign: detail paged 10 parties per page (a party's heads/rows/subtotals stay together),
    //      summary paged 10/page, TDS-by-party chart. Display only; totals are the fields above. ----
    partyPager = new FinPager<TdsRegisterLine[]>(10);
    sumPager = new FinPager<any>(10);
    chart: FinChart | null = null;
    fmt = finAmt;
    buildView() {
        const groups: TdsRegisterLine[][] = [];
        for (const l of this.lines) {
            if (l.KIND === 'party' || !groups.length) { groups.push([]); }
            groups[groups.length - 1].push(l);
        }
        this.partyPager.set(groups);
        this.sumPager.set(this.summary);
        const items = finByKey(this.summary, s => s.PARTYNAME, s => Math.abs(finNum(s.NETAMT)));
        this.chart = items.length ? finBars(items) : null;
    }
    pagedLines(): TdsRegisterLine[] { return ([] as TdsRegisterLine[]).concat(...this.partyPager.paged); }
}
