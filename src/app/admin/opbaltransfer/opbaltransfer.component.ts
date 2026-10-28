import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { DataService } from '../../shared/service/dataService';
import { LoginService } from '../../shared/service/loginService';
import { LoaderService } from '../../shared/service/loader.service';
import { ToastCommonService } from '../../shared/service/toastService';

/*
 * Admin > Opening Balance Carry Forward
 * Port of the V4 page frm_Admin_TransferOPBal_CFd.aspx.
 *
 * Copies each ledger's closing balance of the year BEFORE the chosen "To Year" into that year's
 * opening-balance table, for every ticked company / city. The routine overwrites the opening
 * column for that company-city, so the page asks for confirmation and the run is logged
 * (who / when / which ledgers changed) in TBL_ACCT_OPBAL_TRANSFER_LOG - see the History tab.
 *
 * Links V22 port of the Angular 8 screen (links-erp src/app/admin/opbaltransfer): logic unchanged,
 * template moved to the page kit (.im-page + host class kit-accreport), so no component CSS.
 */
@Component({
    selector: 'app-opbal-transfer',
    templateUrl: './opbaltransfer.component.html',
    // the page kit (import-page / accreport-page) is GLOBAL in Links; the host class opts in.
    styleUrls: [],
    host: { class: 'kit-accreport' },
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class OpBalTransfer implements OnInit {

    Header: string = "Opening Balance Carry Forward";

    // tbl_mst_form id of the V4 page (frm_Admin_TransferOPBal_CFd.aspx) - the same row exists on
    // LinksDB20 and Manilal, so users who had the right on V4 keep it here.
    private readonly FORMID: string = '162';

    activeTab: string = 'TRANSFER';          // TRANSFER | HISTORY

    yearList: any[] = [];
    cmpCityList: any[] = [];
    selectedYear: string = '0';
    allSelected: boolean = false;

    resultOk: string = '';
    resultFail: string = '';

    // the History tab shows only when the audit log exists on this database (see *_OPBAL_TRANSFER_AUDIT_*.sql)
    historyAvailable: boolean = false;
    logList: any[] = [];
    logLoaded: boolean = false;
    selectedLog: any = null;
    logDetail: any[] = [];

    constructor(
        private _dataService: DataService,
        private _loginService: LoginService,
        private _loaderService: LoaderService,
        private _toasterService: ToastCommonService,
    ) { }

    ngOnInit() {
        this.verifyPermission(this.FORMID, 'View');
        this.fill();
        this.detectHistory();
    }

    // Quietly asks the server for the log. A working log returns an empty list or rows with LOG_ID;
    // when the audit script is not installed the API returns an error row (or fails) and the tab stays hidden.
    detectHistory() {
        this._dataService.getData("Admin/Admin_OpBalTransfer_Log", { LogId: 0 })
            .subscribe((data: any) => {
                const rows: any[] = (data && data.Table) ? data.Table : null;
                this.historyAvailable = Array.isArray(rows) && (rows.length == 0 || rows[0].LOG_ID !== undefined);
                if (this.historyAvailable) {
                    this.logList = rows;
                    this.logLoaded = true;
                }
            }, () => { this.historyAvailable = false; });
    }

    verifyPermission(formId, userMode) {
        this._loginService.verifyRights(formId, '')
            .subscribe((data: any) => {
                this._loginService.checkVerify(userMode, data);
            });
    }

    fill() {
        this._loaderService.display(true);
        this._dataService.getData("Admin/Admin_OpBalTransfer_Fill", {})
            .subscribe((data: any) => {
                // only real company/city rows (an API error comes back as a row without cmpcitycode)
                this.cmpCityList = ((data && data.Table) ? data.Table : [])
                    .filter((r: any) => r && r.cmpcitycode !== undefined && r.cmpcitycode !== null)
                    .map((r: any) => {
                        r.selected = false;
                        return r;
                    });
                this.yearList = ((data && data.Table1) ? data.Table1 : [])
                    .filter((r: any) => r && r.yearcode !== undefined && r.yearcode !== null);
                if (this.cmpCityList.length == 0 || this.yearList.length == 0) {
                    this._toasterService.toast('warning', 'warning', 'Could not load the account years / company list from the server.');
                }
                this._loaderService.display(false);
            }, () => {
                this._loaderService.display(false);
                this._toasterService.toast('warning', 'warning', 'Could not load the account years / company list from the server.');
            });
    }

    toggleAll() {
        this.cmpCityList.forEach(r => r.selected = this.allSelected);
    }

    onRowToggle() {
        this.allSelected = this.cmpCityList.length > 0 && this.cmpCityList.every(r => r.selected);
    }

    get selectedCount(): number {
        return this.cmpCityList.filter(r => r.selected).length;
    }

    get selectedYearText(): string {
        const y = this.yearList.find(r => r.yearcode == this.selectedYear);
        return y ? y.AcctYear : '';
    }

    submit() {
        if (this.selectedYear == '0' || this.selectedYear == '' || this.selectedYear == null) {
            this._toasterService.toast('warning', 'warning', 'Please Select Account Year !');
            return;
        }
        if (this.selectedCount == 0) {
            this._toasterService.toast('warning', 'warning', 'Please Select at least one Company for Transfer Opening balance !');
            return;
        }

        const names = this.cmpCityList.filter(r => r.selected)
            .map(r => (r.cmp_name || '').trim() + ' - ' + (r.cityname || '').trim()).join('\n');
        const ok = confirm(
            'Transfer opening balance into ' + this.selectedYearText + ' for:\n\n' + names +
            '\n\nThis REPLACES the opening balances already stored for that year and cannot be undone ' +
            '(the run is logged). Continue?');
        if (!ok) { return; }

        const cmpstr = this.cmpCityList.filter(r => r.selected).map(r => r.cmpcitycode + ',').join('');
        const user = (this._loginService.getLogin()[0].CMP_USERNAME || '').toString().trim();

        this.resultOk = '';
        this.resultFail = '';
        this._loaderService.display(true);
        this._dataService.getData("Admin/Admin_OpBalTransfer_Run", { CmpStr: cmpstr, YearCode: this.selectedYear, AppUser: user })
            .subscribe((data: any) => {
                const rows: any[] = (data && data.Table) ? data.Table : [];
                const okList: string[] = [];
                const failList: string[] = [];
                rows.forEach(r => {
                    const code = (r.CMPCITY || '').toString().trim();
                    const name = this.nameOf(code);
                    if ((r.SUCCESS || '').toString().trim() == '1') { okList.push(name); } else { failList.push(name); }
                });
                if (okList.length) { this.resultOk = 'Opening balance transferred Successfully for ' + okList.join(', '); }
                if (failList.length) { this.resultFail = 'Sorry, failed to transfer for ' + failList.join(', ') + ' (year table not found)'; }
                if (!rows.length) { this.resultFail = 'Nothing was returned by the server - please check the History tab.'; }
                this.logLoaded = false;            // refresh history next time it is opened
                this._loaderService.display(false);
            }, () => {
                this.resultFail = 'ERROR: the transfer could not be completed - please check the History tab before retrying.';
                this._loaderService.display(false);
            });
    }

    private nameOf(code: string): string {
        const r = this.cmpCityList.find(x => (x.cmpcitycode || '').toString().trim() == code);
        return r ? (r.cmp_name || '').trim() + ' - ' + (r.cityname || '').trim() : code;
    }

    showTab(tab: string) {
        this.activeTab = tab;
        if (tab == 'HISTORY' && !this.logLoaded) { this.loadLog(); }
    }

    loadLog() {
        this._loaderService.display(true);
        this.selectedLog = null;
        this.logDetail = [];
        this._dataService.getData("Admin/Admin_OpBalTransfer_Log", { LogId: 0 })
            .subscribe((data: any) => {
                this.logList = (data && data.Table) ? data.Table : [];
                this.logLoaded = true;
                this._loaderService.display(false);
            }, () => {
                this.logList = [];
                this.logLoaded = true;
                this._loaderService.display(false);
                this._toasterService.toast('warning', 'warning', 'History is not available yet (audit script not deployed on this database).');
            });
    }

    openLog(row: any) {
        this.selectedLog = row;
        this.logDetail = [];
        this._loaderService.display(true);
        this._dataService.getData("Admin/Admin_OpBalTransfer_Log", { LogId: row.LOG_ID })
            .subscribe((data: any) => {
                this.logDetail = (data && data.Table) ? data.Table : [];
                this._loaderService.display(false);
            }, () => this._loaderService.display(false));
    }

    closeLog() {
        this.selectedLog = null;
        this.logDetail = [];
    }

    get logDetailNet(): number {
        return this.logDetail.reduce((s, r) => s + (Number(r.CHANGE_AMT) || 0), 0);
    }
}
