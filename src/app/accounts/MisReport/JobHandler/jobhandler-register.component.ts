import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { IMyDpOptions } from 'mydatepicker';
import { DataService } from '../../../shared/service/dataService';
import { LoginService } from '../../../shared/service/loginService';
import { ToastCommonService } from '../../../shared/service/toastService';
import { LoaderService } from '../../../shared/service/loader.service';
import { ExportexcelService } from 'src/app/shared/service/exportexcel.service';

/**
 * MIS 13.11 - Job Handler / Sales Person Register.
 * Weekly / monthly list of jobs opened (Export, Import Sea/Air, Misc) with
 * Handler (Sales Person on the job) and Controller (user who opened the job),
 * plus POL / POD / Agent - the table Nakul Tanna asked for (mail 09-09-2026).
 * Data: USP_Acc_MIS_JobHandler_Register via Accounts/fn_Acc_MIS_JobHandler_Register.
 */
@Component({
    selector: 'app-jobhandler-register',
    templateUrl: './jobhandler-register.component.html',
    styles: [`
        .jh-table th { position: sticky; top: 0; background: #d9edf7; }
        .jh-scroll { max-height: 520px; overflow: auto; }
        .jh-right { text-align: right; }
    `],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class JobHandlerRegisterComponent implements OnInit {

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

    Header: string = 'MIS - Job Handler / Sales Person Register';
    FromDate: any = null;
    ToDate: any = null;
    SalesPerson: any = null;
    SalesPersonList: Array<any> = [];
    JobType: string = 'ALL';
    JobTypeList = [
        { VALUEFIELD: 'ALL', TEXTFIELD: 'All' },
        { VALUEFIELD: 'EXPORT', TEXTFIELD: 'Export' },
        { VALUEFIELD: 'IMPORT', TEXTFIELD: 'Import (Sea / Air)' },
        { VALUEFIELD: 'MISC', TEXTFIELD: 'Misc' }
    ];
    registerdata: Array<any> = [];
    searched: boolean = false;
    summary: Array<any> = [];      // per-handler counts shown above the grid
    cmpnyname: string = '';

    constructor(
        private _dataService: DataService,
        private _toasterService: ToastCommonService,
        private loaderService: LoaderService,
        private _loginService: LoginService,
        private exportser: ExportexcelService) { }

    ngOnInit() {
        const login = this._loginService.getLogin()[0];
        // company title for the Excel header (same source as the account registers)
        this._dataService.getData('Accounts/fn_Acc_Rpt_Common_CompanyDetails', { CmpCode: login.CMPCODE, CityCode: login.CITYCODE })
            .subscribe((data: any) => { this.cmpnyname = (data && data.Table && data.Table.length) ? data.Table[0].cmp_name : ''; });
        // default range: current week (Monday .. today)
        const today = new Date();
        const monday = new Date(today);
        monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
        this.FromDate = this.toPickerDate(monday);
        this.ToDate = this.toPickerDate(today);
        this.fillDropdown();
    }

    private toPickerDate(d: Date) {
        const mon = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const dd = ('0' + d.getDate()).slice(-2);
        return {
            date: { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() },
            formatted: dd + '-' + mon[d.getMonth()] + '-' + d.getFullYear()
        };
    }

    private baseParams() {
        const login = this._loginService.getLogin()[0];
        return {
            Mode: '',
            _FromDt: (this.FromDate) ? this.FromDate.formatted : '',
            _ToDt: (this.ToDate) ? this.ToDate.formatted : '',
            cmp_code: login.CMPCODE,
            citycode: login.CITYCODE,
            citycode1: login.CITYCODE1,
            SalesPerson: (this.SalesPerson) ? this.SalesPerson : '',
            JobType: this.JobType
        };
    }

    fillDropdown() {
        const p = this.baseParams(); p.Mode = 'FILL';
        this.loaderService.display(true);
        this._dataService.getData('Accounts/fn_Acc_MIS_JobHandler_Register', p)
            .subscribe((data: any) => {
                this.loaderService.display(false);
                this.SalesPersonList = (data && data.Table) ? data.Table : [];
            }, () => this.loaderService.display(false));
    }

    Search() {
        if (!this.FromDate || !this.ToDate) {
            this._toasterService.toast('warning', 'warning', 'Please select From and To date.');
            return false;
        }
        const p = this.baseParams(); p.Mode = 'SEARCH';
        this.loaderService.display(true);
        this._dataService.getData('Accounts/fn_Acc_MIS_JobHandler_Register', p)
            .subscribe((data: any) => {
                this.loaderService.display(false);
                this.registerdata = (data && data.Table) ? data.Table : [];
                this.searched = true;
                this.buildSummary();
                if (this.registerdata.length == 0) {
                    this._toasterService.toast('warning', 'warning', 'No Record Found !');
                }
            }, () => this.loaderService.display(false));
    }

    private buildSummary() {
        const map: { [k: string]: any } = {};
        this.registerdata.forEach(r => {
            const key = r['Handler'] || '(No Sales Person)';
            if (!map[key]) { map[key] = { Handler: key, EXPORT: 0, IMPORT: 0, MISC: 0, Total: 0 }; }
            map[key][r['Job Type']] = (map[key][r['Job Type']] || 0) + 1;
            map[key].Total++;
        });
        this.summary = Object.keys(map).map(k => map[k]).sort((a, b) => b.Total - a.Total);
    }

    ExportExcel() {
        if (this.registerdata.length == 0) {
            this._toasterService.toast('warning', 'warning', 'Nothing to export. Please search first.');
            return false;
        }
        const rows = [];
        this.registerdata.forEach((row: any) => rows.push(Object.values(row)));
        const who = this.SalesPerson
            ? this.SalesPersonList.filter(s => s.VALUEFIELD == this.SalesPerson).map(s => s.TEXTFIELD)[0]
            : 'All Sales Persons';
        const reportData = {
            title: this.cmpnyname,
            subtitle: 'Job Handler Register - ' + who + ' - ' + this.JobType + ' - From ' + this.FromDate.formatted + ' To ' + this.ToDate.formatted,
            data: rows,
            headers: Object.keys(this.registerdata[0]),
            pagetype: 'JobHandler'
        };
        this.exportser.exportExceltry(reportData, 'Job Handler Register ' + this.FromDate.formatted + ' to ' + this.ToDate.formatted);
    }

    ViewJob(row: any) {
        if (row['Job Type'] != 'EXPORT') { return; }
        const theTop = (screen.height / 2) - (483 / 2);
        const theLeft = (screen.width / 2) - (780 / 2);
        const toolbar = 'resizable=no,scrollbars=no,width=800,height=450,status=no,left=' + theLeft + ',top=' + theTop;
        window.open('./#/popup/Export-Consignment-view/' + row['Job No'] + '/', 'CONSIGNMENT VIEW', toolbar);
    }

    Reset() {
        this.SalesPerson = null;
        this.JobType = 'ALL';
        this.registerdata = [];
        this.summary = [];
        this.searched = false;
        this.ngOnInit();
    }
}
