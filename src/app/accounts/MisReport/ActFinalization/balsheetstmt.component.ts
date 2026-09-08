import { Component, OnInit, HostListener } from '@angular/core';
import { IMyDpOptions } from 'mydatepicker';
import { DataService } from '../../../shared/service/dataService';
import { LoginService } from '../../../shared/service/loginService';
import { ToastCommonService } from '../../../shared/service/toastService';
import { LoaderService } from '../../../shared/service/loader.service';
import { ExportexcelService } from 'src/app/shared/service/exportexcel.service';

@Component({
    selector: 'app-BalSheetStmt',
    templateUrl: './balsheetstmt.component.html',
    styleUrls: ['./balsheetstmt.component.css']
})
export class BalSheetStmtComponent implements OnInit {

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
    Liabilities: any[] = [];
    Assets: any[] = [];
    Ledgers: any[] = [];
    expanded: any = {};

    constructor(private _dataService: DataService,
        private _toasterService: ToastCommonService,
        private loaderService: LoaderService,
        private _loginService: LoginService,
        private exportser: ExportexcelService) { }

    ngOnInit() {
        this.Header = 'Balance Sheet';
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
        /* user form rights - form no 441 = Balance Sheet */
        this._loginService.verifyRights(435, '')
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
        this._dataService.getData('Accounts/ACC_RPT_BALANCE_SHEET', jsonItem)
            .subscribe((data: any) => {
                this.loaderService.display(false);
                if (data && data.Table && data.Table.length > 0) {
                    this.Liabilities = data.Table.filter(r => r.SIDE === '1-LIABILITIES');
                    this.Assets = data.Table.filter(r => r.SIDE === '2-ASSETS');
                    this.Summary = (data.Table1 && data.Table1.length > 0) ? data.Table1[0] : null;
                    this.Ledgers = data.Table2 ? data.Table2 : [];
                    this.expanded = {};
                    this.Searched = true;
                } else {
                    this._toasterService.toast('warning', 'warning', 'No Record Found !');
                }
            }, () => {
                this.loaderService.display(false);
                this._toasterService.toast('error', 'error', 'Error while loading Balance Sheet !');
            });
    }

    /* back to the search page view; keeps the selected dates */
    BackToSearch() {
        this.Searched = false;
    }

    /* TOTAL / DIFFERENCE rows are shown bold and are not expandable */
    IsTotalRow(row: any) {
        return row.GROUPNAME === 'TOTAL'
            || row.GROUPNAME.indexOf('DIFFERENCE IN OPENING') === 0;
    }

    Toggle(row: any) {
        if (this.IsTotalRow(row)) { return; }
        const key = row.SIDE + '|' + row.GROUPNAME;
        this.expanded[key] = !this.expanded[key];
    }

    IsExpanded(row: any) {
        return this.expanded[row.SIDE + '|' + row.GROUPNAME] === true;
    }

    /* ledger drill-down: normal groups match on side+group; the accumulated
       P&L line expands to the P&L ledgers; ungrouped line to ungrouped ones */
    GetLedgers(row: any) {
        if (row.GROUPNAME === 'PROFIT & LOSS A/C (ACCUMULATED)') {
            return this.Ledgers.filter(l => l.SIDE === '4-P&L LEDGERS');
        }
        if (row.GROUPNAME.indexOf('UNGROUPED') >= 0) {
            return this.Ledgers.filter(l => l.SIDE === '3-UNGROUPED');
        }
        return this.Ledgers.filter(l => l.SIDE === row.SIDE && l.GROUPNAME === row.GROUPNAME);
    }

    /* ---- export the full Balance Sheet (summary + groups + ledger details) ---- */
    ExportStatement() {
        if (!this.Searched || !this.Summary) {
            this._toasterService.toast('warning', 'warning', 'Please submit the report first !');
            return;
        }
        /* liabilities and assets side by side, like the on-screen layout */
        const grpData = [];
        const maxRows = Math.max(this.Liabilities.length, this.Assets.length);
        for (let i = 0; i < maxRows; i++) {
            const li = this.Liabilities[i];
            const asr = this.Assets[i];
            grpData.push([
                li ? li.GROUPNAME : '', li ? li.AMOUNT : '',
                asr ? asr.GROUPNAME : '', asr ? asr.AMOUNT : ''
            ]);
        }
        const detData = [];
        this.Ledgers.forEach((l: any) => {
            detData.push([l.SIDE, l.GROUPNAME, l.CODE, l.LEDGERNAME,
                l.OPENING, l.CUR_DR, l.CUR_CR, l.CLOSING]);
        });
        const reportData = {
            data: grpData,
            advdata: detData,
            headers: ['LIABILITIES', 'Amount', 'ASSETS', 'Amount'],
            advheaders: ['Side', 'Group', 'Code', 'Ledger Name', 'Opening', 'Debit', 'Credit', 'Closing'],
            pagetype: 'AccountStatement',
            title: this.cmpnyname,
            subtitle: 'BALANCE SHEET As On ' + this.Summary.AS_ON_DATE
                + '   [ Branch : ' + this.BranchLabel + ' ]',
            clntname: 'Capital : ' + this.Summary.CAPITAL,
            opbal: 'Profit & Loss A/c (Accumulated) : ' + this.Summary.PL_ACCOUNT_ACCUMULATED,
            currenttot: 'Difference In Opening : ' + this.Summary.DIFFERENCE_IN_OPENING,
            closing: 'Group summary below, ledger-wise details after it',
            advance: ''
        };
        this.exportser.exportExceltry(reportData, 'BalanceSheet_Statement_');
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
