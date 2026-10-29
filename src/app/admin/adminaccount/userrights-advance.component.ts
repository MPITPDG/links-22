import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { IMyDpOptions } from 'mydatepicker';
import { DataService } from '../../shared/service/dataService';
import { LoginService } from '../../shared/service/loginService';
import { LoaderService } from '../../shared/service/loader.service';
import { ToastCommonService } from '../../shared/service/toastService';

/*
 * Admin > User Rights (Advance)
 * Port of the V4 page UI/Admin/frm_Admin_UserRights_Form_Advance.aspx (+ its iframe grid
 * frm_Admin_UserRights_Form_Advance_Grid.aspx): give one user View / Add / Modify / Delete rights
 * on the forms of one module, for a date range, in the ticked company / branches.
 *
 * Save rules carried over from V4:
 *  - only forms with View ticked are sent; Add / Modify / Delete need View
 *  - every list is comma separated and ends with a comma (the procedure splits on ',')
 */
@Component({
    selector: 'app-userrights-advance',
    templateUrl: './userrights-advance.component.html',
    styleUrls: ['./userrights-advance.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class UserRightsAdvanceComponent implements OnInit {

    Header: string = 'User Rights (Advance)';

    // tbl_mst_form id of the V4 page; V4 required the Modify right on it
    private readonly FORMID: string = '327';

    // false until the rights check confirms Modify on form 327 (Submit stays disabled)
    canModify: boolean = false;
    rightsChecked: boolean = false;

    userList: any[] = [];
    moduleList: any[] = [];
    branchList: any[] = [];      // { CMP_CODE, COMPANY, selected }
    formList: any[] = [];        // API rows + view/add/modify/del booleans

    selectedUser: string = '0';
    selectedModule: string = '0';
    FromDate: any = '';
    ToDate: any = '';
    formFilter: string = '';

    loadingForms: boolean = false;
    saving: boolean = false;
    resultOk: string = '';
    resultFail: string = '';

    // guards against an older forms-list response landing after a newer selection
    private formsRequestNo: number = 0;

    public myDatePickerOptions: IMyDpOptions = {
        dateFormat: 'dd/mm/yyyy',
        inline: false,
        height: '16px',
        width: '140px',
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

    constructor(
        private _dataService: DataService,
        private _loginService: LoginService,
        private _loaderService: LoaderService,
        private _toasterService: ToastCommonService,
    ) { }

    ngOnInit() {
        this.verifyPermission();
        this.pageLoad();
    }

    // View right is needed to open the page (checkVerify redirects to access-denied otherwise);
    // Modify right (as V4) is needed to save - without it Submit stays disabled.
    verifyPermission() {
        this._loginService.verifyRights(this.FORMID, '')
            .subscribe((data: any) => {
                this._loginService.checkVerify('View', data);
                let ok = false;
                try {
                    ok = this._loginService.checkVerifyWithMessage('Modify', data).Status === true;
                } catch (e) {
                    ok = false;     // malformed / empty rights response
                }
                this.canModify = ok;
                this.rightsChecked = true;
            }, () => {
                this.canModify = false;
                this.rightsChecked = true;
            });
    }

    pageLoad() {
        this._loaderService.display(true);
        this._dataService.getData('Admin/ADMIN_USER_FORMRIGHTS_PAGELOAD', {})
            .subscribe((data: any) => {
                this._loaderService.display(false);
                this.userList = (data && data.Table) ? data.Table : [];
                this.moduleList = (data && data.Table1) ? data.Table1 : [];
                this.branchList = ((data && data.Table2) ? data.Table2 : [])
                    .map((r: any) => ({ ...r, selected: false }));
            }, () => {
                this._loaderService.display(false);
                this._toasterService.toast('error', 'Error', 'Could not load users, modules and branches.');
            });
    }

    // V4 rebinds the grid on module change; here also on user change. Needs both chosen.
    onSelectionChange() {
        this.resultOk = '';
        this.resultFail = '';
        this.formList = [];
        if (this.selectedUser == '0' || this.selectedModule == '0' || !this.selectedUser || !this.selectedModule) {
            this.formsRequestNo++;
            this.loadingForms = false;
            return;
        }
        const reqNo = ++this.formsRequestNo;
        this.loadingForms = true;
        this._dataService.getData('Admin/ADMIN_USER_FORMRIGHTS_MST_FORMS_LIST',
            { CMPID: this.selectedUser, MODULEID: this.selectedModule })
            .subscribe((data: any) => {
                if (reqNo != this.formsRequestNo) { return; }
                this.loadingForms = false;
                const rows: any[] = (data && data.Table1) ? data.Table1 : [];
                this.formList = rows.map((r: any) => {
                    const view = this.isOn(r.VIEWFORM);
                    return {
                        ...r,
                        view: view,
                        // a right without View is not valid, so it is not pre-ticked either
                        add: view && this.isOn(r.ADDFORM),
                        modify: view && this.isOn(r.MODIFYFORM),
                        del: view && this.isOn(r.DELETEFORM),
                    };
                });
            }, () => {
                if (reqNo != this.formsRequestNo) { return; }
                this.loadingForms = false;
                this._toasterService.toast('error', 'Error', 'Could not load the forms of this module.');
            });
    }

    private isOn(v: any): boolean {
        return v === true || v === 1 || String(v).trim() === '1' || String(v).toLowerCase() === 'true';
    }

    // ---------------------------------------------------------------- forms grid
    get filteredForms(): any[] {
        const q = (this.formFilter || '').trim().toLowerCase();
        if (!q) { return this.formList; }
        return this.formList.filter(f =>
            String(f.DISPLAYNAME || '').toLowerCase().includes(q) ||
            String(f.FORMNAME || '').toLowerCase().includes(q) ||
            String(f.PK_FORMID || '').includes(q));
    }

    get viewCount(): number {
        return this.formList.filter(f => f.view).length;
    }

    // unticking View clears the other rights
    onViewToggle(f: any) {
        if (!f.view) { f.add = false; f.modify = false; f.del = false; }
    }

    // ticking Add / Modify / Delete ticks View too
    onRightToggle(f: any, key: string) {
        if (f[key]) { f.view = true; }
    }

    isColumnAll(key: string): boolean {
        const rows = this.filteredForms;
        return rows.length > 0 && rows.every(f => f[key]);
    }

    // header select-all: applies to the rows currently shown (after the filter)
    toggleColumn(key: string, checked: boolean) {
        for (const f of this.filteredForms) {
            f[key] = checked;
            if (key == 'view') { this.onViewToggle(f); } else { this.onRightToggle(f, key); }
        }
    }

    // ---------------------------------------------------------------- branches
    get allBranches(): boolean {
        return this.branchList.length > 0 && this.branchList.every(b => b.selected);
    }

    get branchCount(): number {
        return this.branchList.filter(b => b.selected).length;
    }

    toggleAllBranches(checked: boolean) {
        this.branchList.forEach(b => b.selected = checked);
    }

    // ---------------------------------------------------------------- save
    // dd/mm/yyyy (date picker) -> yyyyMMdd. The procedure puts FROMDT/TODT straight into datetime
    // columns without CONVERT, so use the one string format SQL Server reads the same under any DATEFORMAT.
    private toApiDate(d: any): string {
        const s: string = d && d.formatted ? d.formatted : '';
        if (s.length != 10) { return ''; }
        return s.substring(6, 10) + s.substring(3, 5) + s.substring(0, 2);
    }

    private validate(): boolean {
        if (!this.selectedUser || this.selectedUser == '0') {
            this._toasterService.toast('info', 'Info', 'Please select the User Name.');
            return false;
        }
        if (!this.selectedModule || this.selectedModule == '0') {
            this._toasterService.toast('info', 'Info', 'Please select the Module.');
            return false;
        }
        if (!this.FromDate || !this.FromDate.formatted) {
            this._toasterService.toast('info', 'Info', 'Please select From Date.');
            return false;
        }
        if (!this.ToDate || !this.ToDate.formatted) {
            this._toasterService.toast('info', 'Info', 'Please select To Date.');
            return false;
        }
        if (this._dataService.date2Comparison(this.FromDate.formatted, this.ToDate.formatted) == false) {
            this._toasterService.toast('info', 'Info', 'To Date should not be before From Date.');
            return false;
        }
        if (this.branchCount == 0) {
            this._toasterService.toast('info', 'Info', 'Please select at least one Company / Branch.');
            return false;
        }
        if (this.formList.some(f => !f.view && (f.add || f.modify || f.del))) {
            this._toasterService.toast('info', 'Info', 'Please select View rights first!');
            return false;
        }
        if (this.viewCount == 0) {
            this._toasterService.toast('info', 'Info', 'Please select View rights for at least one form.');
            return false;
        }
        return true;
    }

    buildPayload(): any {
        const sent = this.formList.filter(f => f.view);
        const list = (vals: any[]) => vals.map(v => v + ',').join('');
        const flag = (b: boolean) => (b ? '1' : '0');
        return {
            FK_MODULEID: this.selectedModule,
            FK_CMPID: this.selectedUser,
            CMPCITY_STR: list(this.branchList.filter(b => b.selected).map(b => b.CMP_CODE)),
            FORMID_STR: list(sent.map(f => f.PK_FORMID)),
            VIEW_STR: list(sent.map(f => flag(f.view))),
            ADD_STR: list(sent.map(f => flag(f.add))),
            MODIFY_STR: list(sent.map(f => flag(f.modify))),
            DELETE_STR: list(sent.map(f => flag(f.del))),
            FROMDT: this.toApiDate(this.FromDate),
            TODT: this.toApiDate(this.ToDate),
        };
    }

    // the procedure returns a debug table first; the STATUS row is in the last Table* that has one
    private lastStatus(data: any): string {
        if (!data) { return ''; }
        const keys = Object.keys(data)
            .filter(k => /^Table\d*$/.test(k))
            .sort((a, b) => (parseInt(a.substring(5), 10) || 0) - (parseInt(b.substring(5), 10) || 0));
        for (let i = keys.length - 1; i >= 0; i--) {
            const t = data[keys[i]];
            if (Array.isArray(t) && t.length > 0 && t[0].STATUS !== undefined && t[0].STATUS !== null) {
                return String(t[0].STATUS);
            }
        }
        return '';
    }

    submit() {
        this.resultOk = '';
        this.resultFail = '';
        if (!this.canModify) {
            this._toasterService.toast('error', 'Rights', 'You do not have Modify rights on this page.');
            return;
        }
        if (this.saving || !this.validate()) { return; }

        const body = this.buildPayload();
        this.saving = true;
        this._loaderService.display(true);
        this._dataService.Common('Admin/ADMIN_USER_FORMRIGHTS_ADDEDIT', body)
            .subscribe((data: any) => {
                this.saving = false;
                this._loaderService.display(false);
                const status = this.lastStatus(data);
                const code = status.split('#')[0];
                const msg = status.indexOf('#') >= 0 ? status.substring(status.indexOf('#') + 1) : '';
                if (code == '100') {
                    this.resultOk = msg || 'User is successfully assigned Rights for selected Forms.';
                    this._toasterService.toast('success', 'Saved', this.resultOk);
                } else {
                    this.resultFail = code == '101' ? 'Session Time Out! Please Re-Login.'
                        : (msg || 'Sorry ! Failed to assign User Rights.' + (status ? ' (' + status + ')' : ''));
                    this._toasterService.toast('error', 'Error', this.resultFail);
                }
            }, () => {
                this.saving = false;
                this._loaderService.display(false);
                this.resultFail = 'Error! Please contact System Administrator.';
                this._toasterService.toast('error', 'Error', this.resultFail);
            });
    }

    reset() {
        if (!confirm('Are you sure you want to reset all data?')) { return; }
        this.formsRequestNo++;
        this.selectedUser = '0';
        this.selectedModule = '0';
        this.FromDate = '';
        this.ToDate = '';
        this.formFilter = '';
        this.formList = [];
        this.loadingForms = false;
        this.branchList.forEach(b => b.selected = false);
        this.resultOk = '';
        this.resultFail = '';
    }
}
