import { Component, OnInit } from '@angular/core';
import { IMyDpOptions } from 'mydatepicker';
import { DataService } from '../../../shared/service/dataService';
import { LoginService } from '../../../shared/service/loginService';
import { ToastCommonService } from '../../../shared/service/toastService';
import { LoaderService } from '../../../shared/service/loader.service';
import { ExportexcelService } from 'src/app/shared/service/exportexcel.service';

@Component({
    selector: 'app-FyDrCrDiffAudit',
    templateUrl: './fydrcrdiffaudit.component.html',
    styleUrls: ['./fydrcrdiffaudit.component.css']
})
export class FyDrCrDiffAuditComponent implements OnInit {

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
    Groups: any[] = [];
    Details: any[] = [];
    expanded: any = {};

    constructor(private _dataService: DataService,
        private _toasterService: ToastCommonService,
        private loaderService: LoaderService,
        private _loginService: LoginService,
        private exportser: ExportexcelService) { }

    ngOnInit() {
        this.Header = 'FY Debit/Credit Difference Audit';
        this.FromDate = this._loginService.getLogin()[0].FINANCIAL_YEAR.STARTDATE;
        this.ToDate = this._loginService.getLogin()[0].FINANCIAL_YEAR.ENDDATE;
        this.Branch = 'ALL';
        this.FillBranches();
        const jsonmaster = {
            CmpCode: this._loginService.getLogin()[0].CMPCODE,
            CityCode: this._loginService.getLogin()[0].CITYCODE,
        };
        this._dataService.getData('Accounts/fn_Acc_Rpt_Common_CompanyDetails', jsonmaster).subscribe((data: any) => {
            this.cmpnyname = data.Table[0].cmp_name;
        });
        /* This is a brand-new admin/audit page with no FormId registered yet in
           the rights table. Once one exists, wire up the same view-rights check
           every other MIS report page uses, e.g.:
             this._loginService.verifyRights(<FORM_ID>, '')
                 .subscribe((data: any) => { this._loginService.checkVerify('View', data); });
           Left out for now since a wrong/unregistered FormId would incorrectly
           block non-SA users from a page that should otherwise work. */
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
            FIN_ENDDATE: this.ToDate,
            COMPANYCODE: this._loginService.getLogin()[0].CMPCODE,
            CITYCODE: (this.Branch === 'ALL' ? '' : this.Branch)
        };
        this._dataService.getData('Accounts/ACCT_RPT_FY_DRCR_DIFF_AUDIT', jsonItem)
            .subscribe((data: any) => {
                this.loaderService.display(false);
                this.Groups = (data && data.Table) ? data.Table : [];
                this.Details = (data && data.Table1) ? data.Table1 : [];
                this.expanded = {};
                this.Searched = true;
            }, () => {
                this.loaderService.display(false);
                this._toasterService.toast('error', 'error', 'Error while running the difference audit !');
            });
    }

    /* back to the search page view; keeps the selected dates */
    BackToSearch() {
        this.Searched = false;
    }

    get TotalIssueRows(): number {
        return this.Groups.reduce((t, g) => t + (Number(g.ENTRIES) || 0), 0);
    }

    get TotalDiffAmt(): number {
        return this.Groups.reduce((t, g) => t + Math.abs(Number(g.TOTAL_DIFF) || 0), 0);
    }

    get IsClean(): boolean {
        return this.Searched && this.Groups.length === 0;
    }

    Toggle(checktype: string) {
        this.expanded[checktype] = !this.expanded[checktype];
    }

    IsExpanded(checktype: string) {
        return this.expanded[checktype] === true;
    }

    GetDetails(checktype: string) {
        return this.Details.filter(d => d.CHECKTYPE === checktype);
    }

    /* ---- export the full audit (checktype summary + all voucher-level rows) ---- */
    ExportStatement() {
        if (!this.Searched) {
            this._toasterService.toast('warning', 'warning', 'Please run the audit first !');
            return;
        }
        const grpData = this.Groups.map((g: any) => [g.CHECKTYPE, g.ENTRIES, g.TOTAL_DIFF]);
        const detData = this.Details.map((d: any) => [
            d.CHECKTYPE, d.VTYPE, d.VOUCHERNO, d.VDATE, d.ACCOUNT, d.NAME,
            d.DRAMT, d.CRAMT, d.DIFF, d.REMARK
        ]);
        const reportData = {
            data: grpData,
            advdata: detData,
            headers: ['Check Type', 'Entries', 'Total Diff'],
            advheaders: ['Check Type', 'Voucher Type', 'Voucher No', 'Date', 'Account', 'Name', 'Debit', 'Credit', 'Diff', 'Remark'],
            pagetype: 'AccountStatement',
            title: this.cmpnyname,
            subtitle: 'FY DEBIT/CREDIT DIFFERENCE AUDIT From ' + this.FromDate + ' To ' + this.ToDate
                + '   [ Branch : ' + this.BranchLabel + ' ]',
            clntname: 'Total Flagged Entries : ' + this.TotalIssueRows,
            opbal: 'Total Absolute Difference : ' + this.TotalDiffAmt.toFixed(2),
            currenttot: '',
            closing: '',
            advance: 'Check-type summary above, voucher-level detail after it'
        };
        this.exportser.exportExceltry(reportData, 'FY_DrCr_Diff_Audit_');
    }
}
