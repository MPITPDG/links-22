import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { IMyDpOptions } from 'mydatepicker';
import { DataService } from '../../../shared/service/dataService';
import { LoginService } from '../../../shared/service/loginService';
import { LoaderService } from '../../../shared/service/loader.service';

type VesselStatus = 'Expected' | 'Arrived' | 'ETA passed';

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

@Component({
    selector: 'app-consignment-import-master-vessel-search',
    templateUrl: 'search.component.html',
    styleUrls: ['../master-page.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class SearchVesselMasterComponent implements OnInit {
    public myDatePickerOptions: IMyDpOptions = {
        dateFormat: 'dd-mmm-yyyy',
        inline: false,
        height: '30px',
        width: '100%',
        componentDisabled: false,
        selectionTxtFontSize: '13px',
        editableDateField: false,
        sunHighlight: true,
        satHighlight: true,
        firstDayOfWeek: 'su',
        openSelectorTopOfInput: false,
        openSelectorOnInputClick: true,
        selectorHeight: '198px',
        selectorWidth: '200px'
    };

    readonly pageSize = 10;

    Input: string = '';
    List: Array<any> = [];

    // client-side filters over the name-search result (presentation only)
    Voyage: string = '';
    ExpectedFrom: any = null;
    ExpectedTo: any = null;
    Status: string = 'All';

    /** List after voyage / date / status filters */
    Filtered: Array<any> = [];
    /** the name the current List was fetched with (for "matching ...") */
    SearchedName: string = '';
    page: number = 1;
    loading: boolean = false;

    constructor(
        private _dataService: DataService,
        private _loginService: LoginService,
        private _router: Router,
        private _loaderService: LoaderService) { }

    ngOnInit() {
        this.verifyPermission(121, "View");
    }

    verifyPermission(formId, userMode) {
        this._loaderService.display(true);
        this._loginService.verifyRights(formId, '')
            .subscribe((data: any) => {
                this._loaderService.display(false);
                // checkVerify returns false only when it has redirected to access-denied
                // (an SA login returns undefined), so anything else loads the list
                if (this._loginService.checkVerify(userMode, data) !== false) {
                    // load every vessel so the page is never empty on open
                    this.search();
                }
            });
    }

    search() {
        this._loaderService.display(true);
        this.loading = true;
        let _jsonData = {
            search: this.Input
        }
        this._dataService.getData("Import/Imp_Vessel_Search", _jsonData)
            .subscribe((data: any) => {
                this._loaderService.display(false);
                this.loading = false;
                this.SearchedName = (this.Input || '').trim();
                this.List = (data && Array.isArray(data.Table)) ? data.Table.map((r: any) => this.decorate(r)) : [];
                this.applyFilters();
            }, () => {
                this._loaderService.display(false);
                this.loading = false;
            });
    }

    goTo(id){
        this._router.navigate(["./import/master/vessel/update-entry", id]);
    }

    // ---------- presentation (MPERPNG-20 page kit) ----------

    /** voyage, expected-date range and status are applied client-side to the API result */
    applyFilters() {
        const voy = (this.Voyage || '').trim().toLowerCase();
        const from = this.pickerTime(this.ExpectedFrom);
        const to = this.pickerTime(this.ExpectedTo);
        this.Filtered = this.List.filter(r => {
            if (voy && String(r.voyageno || '').toLowerCase().indexOf(voy) < 0) { return false; }
            if (from !== null && (r._eta === null || r._eta < from)) { return false; }
            if (to !== null && (r._eta === null || r._eta > to)) { return false; }
            if (this.Status !== 'All' && r._status !== this.Status) { return false; }
            return true;
        });
        this.page = 1;
    }

    clear() {
        this.Input = '';
        this.Voyage = '';
        this.ExpectedFrom = null;
        this.ExpectedTo = null;
        this.Status = 'All';
        this.List = [];
        this.Filtered = [];
        this.SearchedName = '';
        this.page = 1;
    }

    newVessel() {
        this._router.navigate(["./import/master/vessel/data-entry"]);
    }

    get pageCount(): number {
        return Math.max(1, Math.ceil(this.Filtered.length / this.pageSize));
    }

    get pageRows(): Array<any> {
        const start = (this.page - 1) * this.pageSize;
        return this.Filtered.slice(start, start + this.pageSize);
    }

    get rangeStart(): number {
        return this.Filtered.length ? (this.page - 1) * this.pageSize + 1 : 0;
    }

    get rangeEnd(): number {
        return Math.min(this.page * this.pageSize, this.Filtered.length);
    }

    /** page numbers with 0 standing in for an ellipsis */
    get pageList(): number[] {
        const n = this.pageCount, p = this.page;
        if (n <= 7) { return Array.from({ length: n }, (_, i) => i + 1); }
        const out: number[] = [1];
        const lo = Math.max(2, p - 1), hi = Math.min(n - 1, p + 1);
        if (lo > 2) { out.push(0); }
        for (let i = lo; i <= hi; i++) { out.push(i); }
        if (hi < n - 1) { out.push(0); }
        out.push(n);
        return out;
    }

    goPage(p: number) {
        if (p >= 1 && p <= this.pageCount) { this.page = p; }
    }

    exportCsv() {
        const head = ['Rotation no.', 'Vessel', 'Voyage', 'IGM no.', 'Expected', 'Actual', 'Status', 'Arrival port', 'Berth no.', 'User'];
        const rows = this.Filtered.map(r => [r.vsl_rotation, r.name, r.voyageno, r.igmno, r.ExpectedDt, r.ActualDt,
            r._status, r._port, r.berth, r.Requested]);
        this.downloadCsv('vessels', head, rows);
    }

    private downloadCsv(name: string, head: string[], rows: any[][]) {
        const q = (v: any) => {
            const s = (v === null || v === undefined) ? '' : String(v);
            return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
        };
        const csv = [head, ...rows].map(line => line.map(q).join(',')).join('\r\n');
        const d = new Date();
        const stamp = d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
        const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = name + '-' + stamp + '.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 0);
    }

    private decorate(r: any): any {
        const eta = this.parseDt(r.ExpectedDt);
        const actual = String(r.ActualDt || '').trim();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        let status: VesselStatus;
        if (actual) { status = 'Arrived'; }
        else if (eta !== null && eta >= today.getTime()) { status = 'Expected'; }
        else { status = 'ETA passed'; }
        const port = String(r.arrivalport || '').trim();
        return Object.assign({}, r, {
            _eta: eta,
            _status: status,
            _actual: actual,
            _port: (port === '' || port === '|') ? '' : port,
            _createdBy: this.formatRequested(r.Requested)
        });
    }

    /** "dd-MMM-yyyy" -> local midnight ms, or null */
    private parseDt(v: any): number | null {
        const m = /^\s*(\d{1,2})-([A-Za-z]{3})-(\d{4})\s*$/.exec(String(v || ''));
        if (!m) { return null; }
        const mon = MONTHS.indexOf(m[2].toLowerCase());
        if (mon < 0) { return null; }
        return new Date(+m[3], mon, +m[1]).getTime();
    }

    private pickerTime(v: any): number | null {
        if (!v || !v.date || !v.date.year) { return null; }
        return new Date(v.date.year, v.date.month - 1, v.date.day).getTime();
    }

    /** "<user> Mon d yyyy h:mm:ssAM" -> "user · d Mon yyyy" */
    private formatRequested(v: any): string {
        const s = String(v || '').trim();
        const m = /^(.*?)\s+([A-Za-z]{3})\s+(\d{1,2})\s+(\d{4})\b/.exec(s);
        if (!m) { return s; }
        const mon = MONTHS.indexOf(m[2].toLowerCase());
        if (mon < 0) { return s; }
        return m[1] + ' · ' + (+m[3]) + ' ' + MONTH_LABELS[mon] + ' ' + m[4];
    }
}
