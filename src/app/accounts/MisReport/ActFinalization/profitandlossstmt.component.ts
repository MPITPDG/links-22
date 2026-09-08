import { Component, OnInit, HostListener } from '@angular/core';
import { IMyDpOptions } from 'mydatepicker';
import { DataService } from '../../../shared/service/dataService';
import { LoginService } from '../../../shared/service/loginService';
import { ToastCommonService } from '../../../shared/service/toastService';
import { LoaderService } from '../../../shared/service/loader.service';
import { ExportexcelService } from 'src/app/shared/service/exportexcel.service';

@Component({
    selector: 'app-ProfitandLossStmt',
    templateUrl: './profitandlossstmt.component.html',
    styleUrls: ['./profitandlossstmt.component.css']
})
export class ProfitandLossStmtComponent implements OnInit {

    public myDatePickerOptions: IMyDpOptions = {
        dateFormat: 'dd-mmm-yyyy',
        inline: false,
        height: '20px',
        width: '130px',
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

    Header: string;
    cmpnyname: string;
    FromDate;
    ToDate;
    BranchList: any[] = [];
    Branch: any;
    BranchLabel = '';
    Searched = false;
    Summary: any = null;
    Groups: any[] = [];
    Ledgers: any[] = [];
    expanded: any = {};

    constructor(private _dataService: DataService,
        private _toasterService: ToastCommonService,
        private loaderService: LoaderService,
        private _loginService: LoginService,
        private exportser: ExportexcelService) { }

    ngOnInit() {
        this.Header = 'Profit & Loss Statement';
        this.FromDate = this._loginService.getLogin()[0].FINANCIAL_YEAR.STARTDATE;
        this.ToDate = this._dataService.datechnge1(new Date());
        this.Branch = this._loginService.getLogin()[0].CITYCODE1;
        this.FillBranches();
        const jsonmaster = {
            CmpCode: this._loginService.getLogin()[0].CMPCODE,
            CityCode: this._loginService.getLogin()[0].CITYCODE,
        };
        this._dataService.getData('Accounts/fn_Acc_Rpt_Common_CompanyDetails', jsonmaster).subscribe((data: any) => {
            this.cmpnyname = data.Table[0].cmp_name;
        });
        /* user form rights - form no 440 = Profit & Loss Statement */
        this._loginService.verifyRights(434, '')
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

    Submit() {
        this.loaderService.display(true);
        this.Searched = false;
        const bsel = this.BranchList.find(b => b.CITYCODE1 === this.Branch);
        this.BranchLabel = bsel ? bsel.CITYNAME : this.Branch;
        const jsonItem = {
            FIN_STARTDATE: this.FromDate,
            FIN_ENDDATE: this._loginService.getLogin()[0].FINANCIAL_YEAR.ENDDATE,
            CMPCODE: this._loginService.getLogin()[0].CMPCODE,
            CITYCODE: this.Branch,
            USR_ENDDATE: this.ToDate
        };
        this._dataService.getData('Accounts/ACC_RPT_PROFIT_AND_LOSS', jsonItem)
            .subscribe((data: any) => {
                this.loaderService.display(false);
                if (data && data.Table && data.Table.length > 0) {
                    this.Summary = data.Table[0];
                    this.Groups = data.Table1 ? data.Table1 : [];
                    this.Ledgers = data.Table2 ? data.Table2 : [];
                    this.expanded = {};
                    this.Searched = true;
                } else {
                    this._toasterService.toast('warning', 'warning', 'No Record Found !');
                }
            }, () => {
                this.loaderService.display(false);
                this._toasterService.toast('error', 'error', 'Error while loading Profit & Loss !');
            });
    }

    /* back to the search page view; keeps the selected dates */
    BackToSearch() {
        this.Searched = false;
    }

    /* section label without the sort prefix, e.g. '1-TRADING EXPENSES' -> 'TRADING EXPENSES' */
    SectionLabel(section: string) {
        return section ? section.substring(2) : '';
    }

    Toggle(section: string, groupname: string) {
        const key = section + '|' + groupname;
        this.expanded[key] = !this.expanded[key];
    }

    IsExpanded(section: string, groupname: string) {
        return this.expanded[section + '|' + groupname] === true;
    }

    GetLedgers(section: string, groupname: string) {
        return this.Ledgers.filter(l => l.SECTION === section && l.GROUPNAME === groupname);
    }

    /* ---- export the full P&L statement (summary + groups + ledger details) ---- */
    ExportStatement() {
        if (!this.Searched || !this.Summary) {
            this._toasterService.toast('warning', 'warning', 'Please submit the report first !');
            return;
        }
        /* expenses and income side by side, like the balance sheet export */
        const expRows = [];
        const incRows = [];
        this.Groups.forEach((g: any) => {
            if (g.SECTION === '1-TRADING EXPENSES' || g.SECTION === '3-INDIRECT EXPENSES') {
                expRows.push([g.GROUPNAME, g.AMOUNT]);
            } else {
                incRows.push([g.GROUPNAME, g.AMOUNT]);
            }
        });
        expRows.push(['TOTAL EXPENSES',
            Number(this.Summary.TRADING_EXPENSES) + Number(this.Summary.INDIRECT_EXPENSES)]);
        incRows.push(['TOTAL INCOME',
            Number(this.Summary.TRADING_INCOME) + Number(this.Summary.INDIRECT_INCOME)]);
        const grpData = [];
        const maxRows = Math.max(expRows.length, incRows.length);
        for (let i = 0; i < maxRows; i++) {
            const e = expRows[i];
            const n = incRows[i];
            grpData.push([e ? e[0] : '', e ? e[1] : '', n ? n[0] : '', n ? n[1] : '']);
        }
        const detData = [];
        this.Ledgers.forEach((l: any) => {
            detData.push([this.SectionLabel(l.SECTION), l.GROUPNAME, l.CODE, l.LEDGERNAME,
                l.DRAMT, l.CRAMT, l.AMOUNT]);
        });
        const reportData = {
            data: grpData,
            advdata: detData,
            headers: ['EXPENSES', 'Amount', 'INCOME', 'Amount'],
            advheaders: ['Section', 'Group', 'Code', 'Ledger Name', 'Debit', 'Credit', 'Amount'],
            pagetype: 'AccountStatement',
            title: this.cmpnyname,
            subtitle: 'PROFIT & LOSS STATEMENT From ' + this.Summary.PERIOD_FROM + ' To ' + this.Summary.PERIOD_TO
                + '   [ Branch : ' + this.BranchLabel + ' ]',
            clntname: 'Trading Income : ' + this.Summary.TRADING_INCOME
                + '      Trading Expenses : ' + this.Summary.TRADING_EXPENSES,
            opbal: 'GROSS ' + (this.Summary.GROSS_PROFIT >= 0 ? 'PROFIT' : 'LOSS')
                + ' : ' + this.Summary.GROSS_PROFIT,
            currenttot: 'Indirect Income : ' + this.Summary.INDIRECT_INCOME
                + '      Indirect Expenses : ' + this.Summary.INDIRECT_EXPENSES,
            closing: 'NET ' + (this.Summary.NET_PROFIT >= 0 ? 'PROFIT' : 'LOSS')
                + ' : ' + this.Summary.NET_PROFIT,
            advance: 'Group summary below, ledger-wise details after it'
        };
        this.exportser.exportExceltry(reportData, 'ProfitAndLoss_Statement_');
    }

    /* ---- ledger statement popup (same API as the General A/c statement page) ---- */
    ShowLedger = false;
    LedgerLoading = false;
    LedgerTitle = '';
    LedgerRows: any[] = [];
    LedgerSummary: any = null;

    OpenLedger(l: any) {
        this.ShowLedger = true;
        this.LedgerLoading = true;
        this.LedgerTitle = l.CODE + ' - ' + l.LEDGERNAME + '   [ ' + this.FromDate + ' To ' + this.ToDate + ' ]';
        this.LedgerRows = [];
        this.LedgerSummary = null;
        this.DragX = 0;
        this.DragY = 0;
        const jsonItem = {
            ClientCode: l.CODE,
            cmp_code: this._loginService.getLogin()[0].CMPCODE,
            User_StartDate: this.FromDate,
            User_EndDate: this.ToDate,
            Fin_StartDate: this._loginService.getLogin()[0].FINANCIAL_YEAR.STARTDATE,
            Fin_EndDate: this._loginService.getLogin()[0].FINANCIAL_YEAR.ENDDATE
        };
        this._dataService.getData('Accounts/Acc_Rpt_ClientOutstandingALL_AllCITY_LIST', jsonItem)
            .subscribe((data: any) => {
                this.LedgerLoading = false;
                if (data && data.Table && data.Table.length > 0) {
                    this.LedgerRows = data.Table;
                    this.LedgerSummary = (data.Table1 && data.Table1.length > 0) ? data.Table1[0] : null;
                } else {
                    this._toasterService.toast('info', 'info', 'No transactions for this ledger in the period !');
                }
            }, () => {
                this.LedgerLoading = false;
                this._toasterService.toast('error', 'error', 'Error while loading ledger statement !');
            });
    }

    CloseLedger() {
        this.ShowLedger = false;
    }

    /* ---- movable dialog (drag by the header) ---- */
    DragX = 0;
    DragY = 0;
    private IsDragging = false;
    private DragOffX = 0;
    private DragOffY = 0;

    StartDrag(ev: MouseEvent) {
        this.IsDragging = true;
        this.DragOffX = ev.clientX - this.DragX;
        this.DragOffY = ev.clientY - this.DragY;
        ev.preventDefault();
    }

    @HostListener('document:mousemove', ['$event'])
    OnDragMove(ev: MouseEvent) {
        if (this.IsDragging) {
            this.DragX = ev.clientX - this.DragOffX;
            this.DragY = ev.clientY - this.DragOffY;
        }
    }

    @HostListener('document:mouseup')
    OnDragEnd() {
        this.IsDragging = false;
    }

    /* ---- export popup ledger statement (summary + details) to excel ---- */
    ExportLedger() {
        if (!this.LedgerRows || this.LedgerRows.length === 0) {
            this._toasterService.toast('warning', 'warning', 'No data to export !');
            return;
        }
        const dataForExcel = [];
        this.LedgerRows.forEach((t: any) => {
            dataForExcel.push([
                t.TRANSTYPE, t.TRANSCODE, t.TRANSDATE,
                ((t.NARR ? t.NARR : '') + ' ' + (t.EXP_SNAME ? t.EXP_SNAME : '') + ' '
                    + (t.SUP_SNAME ? t.SUP_SNAME : '') + ' ' + (t.ACCTNAME ? t.ACCTNAME : '')).trim(),
                t.DRAMT, t.CRAMT
            ]);
        });
        let opbal = ''; let currenttot = ''; let closing = '';
        if (this.LedgerSummary) {
            opbal = this.LedgerSummary.OPBAL >= 0 ? this.LedgerSummary.OPBAL + ' Dr'
                : Math.abs(this.LedgerSummary.OPBAL) + ' Cr';
            currenttot = this.LedgerSummary.TLDR + ' Dr  ' + this.LedgerSummary.TLCR + ' Cr';
            closing = this.LedgerSummary.CLBAL >= 0 ? this.LedgerSummary.CLBAL + ' Dr'
                : Math.abs(this.LedgerSummary.CLBAL) + ' Cr';
        }
        const reportData = {
            data: dataForExcel,
            advdata: [],
            headers: ['Type', 'Number', 'Date', 'Particulars', 'Debit', 'Credit'],
            advheaders: ['Type', 'Number', 'Particulars', 'Amount'],
            pagetype: 'AccountStatement',
            title: this.cmpnyname,
            subtitle: 'Ledger Statement From ' + this.FromDate + ' To ' + this.ToDate,
            clntname: this.LedgerTitle,
            opbal: 'Opening: ' + opbal,
            currenttot: 'Current Total : ' + currenttot,
            closing: 'Closing : ' + closing,
            advance: 'Advance : '
        };
        this.exportser.exportExceltry(reportData, 'Ledger_Statement_');
    }
}
