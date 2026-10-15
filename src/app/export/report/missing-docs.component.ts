import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { DataService } from '../../shared/service/dataService';
import { LoginService } from '../../shared/service/loginService';
import { LoaderService } from '../../shared/service/loader.service';
import { MissingDocsService } from './missing-docs.service';
import { MissingDocsRow, MissingDocsView } from './missing-docs.model';

/**
 * Export -> Report -> Missing shipping docs (ported from MPERPNG-20, menu 7.13).
 * Page kit .im-page + .im-dash are global in Links (src/styles/kit), so only the
 * screen's own layout file is pulled in here. Fails soft: the service returns an
 * empty view with a note while Export/EXP_RPT_MISSING_DOCS is not deployed.
 */
@Component({
    templateUrl: 'missing-docs.component.html',
    styleUrls: ['./missing-docs.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class MissingDocsReportComponent implements OnInit {
    readonly pageSize = 10;
    readonly graceDays = 2;

    // filter sources
    ConsigneeList: Array<any> = [];
    CityList: Array<any> = [];
    CountryList: Array<string> = [];

    // filters
    Consignee: any = null;
    Country: string = '';
    Mode: 'AIR' | 'SEA' | '' = '';
    City: any = null;

    view: MissingDocsView | null = null;
    Filtered: Array<MissingDocsRow> = [];
    page: number = 1;
    loading: boolean = false;
    error: string = '';

    constructor(
        private _dataService: DataService,
        private _loginService: LoginService,
        private _loaderService: LoaderService,
        private _missingDocs: MissingDocsService) {
    }

    ngOnInit() {
        this._loginService.verifyRights('21', '')
            .subscribe((data: any) => {
                if (this._loginService.checkVerify('View', data)) {
                    // load with the default filters so the page is never empty on open
                    this.search();
                } else {
                    this.error = 'You do not have access to this report.';
                }
            });
        this.pageLoad();
    }

    pageLoad() {
        this.getCityData();
        this.getConsigneeData();
    }

    getCityData() {
        this._dataService.getData("Common/getCityList", {})
            .subscribe((data: any) => {
                const list: Array<any> = [];
                ((data && data.Table) || []).forEach((key) => {
                    list.push({ citycode: key.citycode, citycode1: key.citycode1, cityname: key.cityname });
                });
                this.CityList = list;
            }, () => { this.CityList = []; });
    }

    getConsigneeData() {
        this._dataService.getData("Common/getConsigneeList", {})
            .subscribe((data: any) => {
                this.ConsigneeList = (data && data.Table) || [];
            }, () => { this.ConsigneeList = []; });
    }

    search() {
        this._loaderService.display(true);
        this.loading = true;
        this.error = '';
        this._missingDocs.getMissingDocs({
            ConCode: this.Consignee != null ? String(this.Consignee) : '',
            Country: this.Country || '',
            Mode: this.Mode,
            CityCode: this.City != null ? String(this.City) : '',
            GraceDays: this.graceDays
        }).subscribe((v: MissingDocsView) => {
            this._loaderService.display(false);
            this.loading = false;
            this.view = v;
            this.Filtered = v.rows || [];
            this.error = v.unavailable ? (v.note || '') : '';
            // country options come from the loaded rows; keep them while a country is picked
            if (!this.Country) {
                this.CountryList = Array.from(new Set(this.Filtered
                    .map(r => String(r.ORIGIN_COUNTRY || '').trim())
                    .filter(c => c !== ''))).sort();
            }
            this.page = 1;
        }, () => {
            // the service already swallows HTTP errors; this is a last guard
            this._loaderService.display(false);
            this.loading = false;
            this.view = null;
            this.Filtered = [];
            this.page = 1;
            this.error = 'The missing documents report is not available on this server yet.';
        });
    }

    clear() {
        this.Consignee = null;
        this.Country = '';
        this.Mode = '';
        this.City = null;
        this.search();
    }

    // ---------- pagination ----------
    get pageCount(): number {
        return Math.max(1, Math.ceil(this.Filtered.length / this.pageSize));
    }

    get pageRows(): Array<MissingDocsRow> {
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

    // ---------- export ----------
    /** every filtered row, not just the current page; UTF-8 BOM, every field quoted */
    exportCsv() {
        const head = ['Client', 'Order No', 'Style No', 'Booking Ref', 'Origin City', 'Origin Country', 'Mode', 'Branch',
            'Shipper', 'Agent', 'Announced CRD', 'Revised CRD', 'Days Since CRD', 'Last C1 Sent', 'Job No', 'Doc Status'];
        const rows = this.Filtered.map(r => [r.CLIENT, r.ORDERNO, r.STYLENO, r.BOOKING_REF, r.ORIGIN_CITY, r.ORIGIN_COUNTRY,
            r.MODE, r.BRANCH, r.SHIPPER, r.AGENT, r.ANNOUNCED_CRD, r.REVISED_CRD, r.DAYS_SINCE_CRD, r.LAST_C1_SENT, r.JOBNO, r.DOC_STATUS]);
        const q = (v: any) => {
            const s = (v === null || v === undefined) ? '' : String(v);
            return '"' + s.replace(/"/g, '""') + '"';
        };
        const csv = [head, ...rows].map(line => line.map(q).join(',')).join('\r\n');
        const d = new Date();
        const stamp = d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
        const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'missing-docs-' + stamp + '.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 0);
    }
}
