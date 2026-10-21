import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { DataService } from '../../../../shared/service/dataService';
import { LoginService } from '../../../../shared/service/loginService';
import { ToastCommonService } from '../../../../shared/service/toastService';
import { ExportexcelService } from 'src/app/shared/service/exportexcel.service';

/**
 * Finance > MIS Report > Admin Report > Management Day-End.
 * Quick blocks (billing, jobs, delayed, tomorrow, unbilled) come from USP_ACC_RPT_MGMT_DAYEND;
 * receivables and margin watch reuse USP_ACC_RPT_FINANCE_DASHBOARD so they tie to the Finance Dashboard.
 *
 * Page rights (tbl_mst_form / tbl_Mst_FormWiseRights, viewForm):
 *   444 page   445 margin watch   446 export   447 all branches / other companies
 */
@Component({
    selector: 'app-mgmt-dayend',
    templateUrl: './mgmt-dayend.component.html',
    // page kit like the Finance dashboard: global kit + that page's scoped sheet, then Day-End's few additions
    styleUrls: ['../../FinanceDashboard/finance-dashboard-page.css', './mgmt-dayend.component.css'],
    host: { class: 'kit-accreport' },
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class MgmtDayEndComponent implements OnInit {

    static readonly FORM_PAGE = 444;
    static readonly FORM_MARGIN = 445;
    static readonly FORM_EXPORT = 446;
    static readonly FORM_ALLBRANCH = 447;

    OnDate: string = '';                 // yyyy-mm-dd (native date input)
    Company: any = null;
    CompanyList: Array<any> = [];
    Branch: any = null;                  // 3-letter city code or 'ALL'
    BranchList: Array<any> = [];

    Rights = { margin: false, export: false, allBranch: false };

    Kpi: any = null;
    Delayed: Array<any> = [];
    Tomorrow: Array<any> = [];
    Unbilled: Array<any> = [];
    loading = false;
    DarkMode = false;
    ShowAllDelayed = false;
    ShowAllTomorrow = false;
    ShowAllUnbilled = false;

    Fin: any = null;                     // Finance Dashboard KPI row
    FinMargin: Array<any> = [];          // worst jobs by profit
    FinLoading = false;
    FinError = false;
    FinCacheInfo: any = null;

    constructor(
        private _dataService: DataService,
        private _loginService: LoginService,
        private _toasterService: ToastCommonService,
        private exportser: ExportexcelService) { }

    ngOnInit() {
        const login = this._loginService.getLogin()[0];
        this.OnDate = this.toIso(new Date());
        this.Company = login.CMPCODE;
        this.Branch = login.CITYCODE;

        this._loginService.verifyRights(MgmtDayEndComponent.FORM_PAGE, '')
            .subscribe((data: any) => { this._loginService.checkVerify('View', data); });

        this.resolveRight(MgmtDayEndComponent.FORM_MARGIN, 'margin');
        this.resolveRight(MgmtDayEndComponent.FORM_EXPORT, 'export');
        this.resolveRight(MgmtDayEndComponent.FORM_ALLBRANCH, 'allBranch');

        this._dataService.getData('Accounts/ACC_RPT_MGMT_DAYEND_FILL', {})
            .subscribe((data: any) => {
                this.CompanyList = (data && data.Table) ? data.Table : [];
                const rows = (data && data.Table1) ? data.Table1 : [];
                this.BranchList = [{ code: 'ALL', name: 'All branches' }]
                    .concat(rows.map((r: any) => ({ code: r.CODE, name: r.NAME })));
            });

        this.load();
    }

    /** A sub-right is granted when the user's role is SA or the form's viewForm flag is on. */
    private resolveRight(formId: number, key: 'margin' | 'export' | 'allBranch') {
        if (this._loginService.getLogin()[0].ROLETYPE === 'SA') {
            this.Rights[key] = true;
            return;
        }
        this._loginService.verifyRights(formId, '').subscribe((data: any) => {
            const r = data && data.Table && data.Table.length > 0 ? data.Table[0] : null;
            this.Rights[key] = !!(r && r.STATUS == '100' && (r.viewForm == 1 || r.viewForm === true));
            if (key === 'allBranch' && !this.Rights.allBranch) {
                const login = this._loginService.getLogin()[0];
                this.Company = login.CMPCODE;
                this.Branch = login.CITYCODE;
            }
        });
    }

    load() {
        if (!this.OnDate) { return; }
        const login = this._loginService.getLogin()[0];
        // without the all-branches right the scope is always the user's own company and branch
        const cmp = this.Rights.allBranch ? this.Company : login.CMPCODE;
        const city = this.Rights.allBranch ? this.Branch : login.CITYCODE;

        this.loading = true;
        this._dataService.getData('Accounts/ACC_RPT_MGMT_DAYEND',
            { ONDATE: this.toDmy(this.OnDate), CMPCODE: cmp, CITYCODE: city })
            .subscribe((data: any) => {
                this.loading = false;
                if (!data || !data.Table || data.Table.length === 0 || data.Table[0].STATUS != '100') {
                    this.Kpi = null;
                    this.Delayed = []; this.Tomorrow = []; this.Unbilled = [];
                    this._toasterService.toast('warning', 'warning', 'No data returned for the selected date.');
                    return;
                }
                this.Kpi = data.Table[0];
                this.Delayed = data.Table1 || [];
                this.Tomorrow = data.Table2 || [];
                this.Unbilled = data.Table3 || [];
            }, () => { this.loading = false; });

        this.loadFinance(cmp, city);
    }

    /** Receivables + margin: slower (cached on the API), so it loads after the quick blocks. */
    private loadFinance(cmp: string, city: string, syncNow = false) {
        const to = new Date(this.OnDate + 'T00:00:00');
        const from = new Date(to);
        from.setDate(from.getDate() - 29);
        this.FinLoading = true;
        this.FinError = false;
        const json: any = {
            FROMDATE: this.toDmy(this.toIso(from)), TODATE: this.toDmy(this.OnDate),
            CMPCODE: cmp, CITYCODE: city, CLIENTCODE: '', TOPN: '10'
        };
        if (syncNow) { json.SYNCNOW = '1'; }
        this._dataService.getData('Accounts/ACC_RPT_FINANCE_DASHBOARD', json)
            .subscribe((data: any) => {
                this.FinLoading = false;
                if (!data || !data.Table || data.Table.length === 0 || data.Table[0].STATUS != '100') {
                    this.Fin = null; this.FinMargin = []; this.FinError = true;
                    return;
                }
                this.Fin = data.Table[0];
                this.FinCacheInfo = (data.CACHEINFO && data.CACHEINFO.length > 0) ? data.CACHEINFO[0] : null;
                const jobs: Array<any> = data.Table8 || [];
                this.FinMargin = jobs
                    .filter(j => j.IS_BILLED && Number(j.INCOME) > 0)
                    .sort((a, b) => Number(a.PROFIT) - Number(b.PROFIT))
                    .slice(0, 8);
            }, () => { this.FinLoading = false; this.FinError = true; });
    }

    refreshFinance() {
        const login = this._loginService.getLogin()[0];
        this.loadFinance(this.Rights.allBranch ? this.Company : login.CMPCODE,
                         this.Rights.allBranch ? this.Branch : login.CITYCODE, true);
    }

    delta(today: number, before: number): string {
        const t = Number(today), b = Number(before);
        if (!b) { return t ? 'no billing yesterday' : ''; }
        const p = Math.round((t - b) / b * 100);
        return (p >= 0 ? '+' : '') + p + '% vs yesterday';
    }

    /** Finance Dashboard tones: fd-down (green) = good, fd-up (red) = bad. */
    deltaTone(today: number, before: number): string {
        return Number(today) >= Number(before) ? 'fd-down' : 'fd-up';
    }

    pct(part: any, whole: any): string {
        const w = Number(whole);
        return w > 0 ? Math.round(Number(part) / w * 100) + '%' : '-';
    }

    /** Indian short format: 1,23,456 -> 1.2 L, 2,50,00,000 -> 2.50 Cr */
    inr(v: any): string {
        const n = Number(v);
        if (isNaN(n)) { return '-'; }
        const a = Math.abs(n), sign = n < 0 ? '-' : '';
        if (a >= 10000000) { return sign + '₹ ' + (a / 10000000).toFixed(2) + ' Cr'; }
        if (a >= 100000) { return sign + '₹ ' + (a / 100000).toFixed(1) + ' L'; }
        return sign + '₹ ' + Math.round(a).toLocaleString('en-IN');
    }

    exportExcel() {
        if (!this.Rights.export) { return; }
        const rows: Array<any> = [];
        this.Delayed.forEach(d => rows.push(['Delayed shipment', d.JOBNO, d.CLIENT, d.STAGE + ' (' + d.DELAY_DAYS + ' days, ETD ' + d.ETD + ', ' + d.VESSEL + ')']));
        this.Unbilled.forEach(u => rows.push(['Unbilled job', u.JOBNO, u.CLIENT, u.JOB_TYPE + ', opened ' + u.JOB_DATE + ' (' + u.AGE_DAYS + ' days)']));
        this.Tomorrow.forEach(t => rows.push(['Tomorrow - ' + t.KIND, t.REF, t.PARTY, t.DETAIL]));
        if (rows.length === 0) {
            this._toasterService.toast('warning', 'warning', 'Nothing to export.');
            return;
        }
        const login = this._loginService.getLogin()[0];
        this.exportser.exportExceltry({
            title: 'Management Day-End',
            subtitle: 'As on ' + this.toDmy(this.OnDate) + ' - Company ' + (this.Rights.allBranch ? this.Company : login.CMPCODE)
                      + ' - Branch ' + (this.Rights.allBranch ? this.Branch : login.CITYCODE),
            data: rows,
            headers: ['Section', 'Reference', 'Party', 'Detail'],
            pagetype: 'MgmtDayEnd'
        }, 'Management Day-End ' + this.toDmy(this.OnDate));
    }

    private toIso(d: Date): string {
        const m = d.getMonth() + 1, day = d.getDate();
        return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (day < 10 ? '0' : '') + day;
    }

    private toDmy(iso: string): string {
        return iso.substring(8, 10) + '/' + iso.substring(5, 7) + '/' + iso.substring(0, 4);
    }
}
