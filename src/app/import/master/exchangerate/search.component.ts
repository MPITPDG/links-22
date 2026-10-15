import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { DataService } from '../../../shared/service/dataService';
import { LoginService } from '../../../shared/service/loginService';
import { LoaderService } from '../../../shared/service/loader.service';
import { ToastCommonService } from '../../../shared/service/toastService';
import { IMyDpOptions } from 'mydatepicker';

type RateStatus = 'Current' | 'Upcoming' | 'Expired';

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

@Component({
    selector: 'app-consignment-import-master-exchange-rate-search',
    templateUrl: 'search.component.html',
    styleUrls: ['../master-page.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class SearchExchangeRateMasterComponent implements OnInit {
    CurrencyType: string = "0";
    BranchName: string = "0";
    FromDate: any = null;
    ToDate: any = null;
    ExchangeRate: string = '';
    Input: string='';

    CurrencyList: Array<any> = [];
    BranchList: Array<any> = [];
    DisplayList: Array<any> = [];

    // ---------- presentation (MPERPNG-20 page kit) ----------
    readonly pageSize = 10;
    /** DisplayList with the derived status; kept for pagination symmetry with the other masters */
    Filtered: Array<any> = [];
    Searched: boolean = false;
    page: number = 1;
    loading: boolean = false;

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
    constructor(
        private _dataService: DataService,
        private _loginService: LoginService,
        private _router: Router,
        private _loaderService: LoaderService,
        private _toaster: ToastCommonService) { }

    ngOnInit() {
        this.verifyPermission(124, "View");
    }

    verifyPermission(formId, userMode) {
        this._loaderService.display(true);
        this._loginService.verifyRights(formId, '')
            .subscribe((data: any) => {
                this._loaderService.display(false);
                if (this._loginService.checkVerify(userMode, data)) { this.fillData(); }
            });
    }

    fillData() {
        this._dataService.getData("Import/CurrencyAndCity", {})
            .subscribe((data: any) => {
                this._loaderService.display(false);
                this.CurrencyList = (data && Array.isArray(data.Table)) ? data.Table : [];
                this.BranchList = (data && Array.isArray(data.Table1)) ? data.Table1 : [];
                // load every exchange rate so the page is never empty on open
                this.search();
            });
    }

    search() {
        if (this.FromDate && !this.ToDate) { alert("Please provide to date."); return false; }
        if (!this.FromDate && this.ToDate) { alert("Please provide from date."); return false; }
        if (this.FromDate && this.ToDate) {
            if (this._dataService.DateFromAndToComparision(this._dataService.returnMonthMMFromMMM(this.ToDate.formatted), this._dataService.returnMonthMMFromMMM(this.FromDate.formatted))) {
                alert("To Date should be greater than From Date"); return false;
            }
        }
        this._loaderService.display(true);
        this.loading = true;
        let _jsonData = {
            CurrencyType: this.CurrencyType,
            Cities: this.BranchName,
            FromDate: (this.FromDate) ? this.FromDate.formatted : "",
            ToDate: (this.ToDate) ? this.ToDate.formatted : "",
            ExchangeRate: this.ExchangeRate
        }
        this._dataService.Common("Import/Imp_Currency_Search", _jsonData)
            .subscribe((data: any) => {
                this._loaderService.display(false);
                this.loading = false;
                this.Searched = true;
                const rows = (data && Array.isArray(data.Table)) ? data.Table : [];
                if (rows.length == 0) {
                    this._toaster.toast("warning", "Message", "No Data Found");
                }
                this.DisplayList = rows;
                this.Filtered = rows.map((r: any) => this.decorate(r));
                this.page = 1;
            }, () => {
                this._loaderService.display(false);
                this.loading = false;
            });
    }

    goTo(id) {
        this._router.navigate(["./import/master/exchange-rate/update-entry", id]);
    }

    clear() {
        this.CurrencyType = "0";
        this.BranchName = "0";
        this.FromDate = null;
        this.ToDate = null;
        this.ExchangeRate = '';
        this.Input = '';
        this.DisplayList = [];
        this.Filtered = [];
        this.Searched = false;
        this.page = 1;
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
        const head = ['Currency type', 'Branch name', 'From', 'To', 'Exchange rate', 'Status'];
        const rows = this.Filtered.map(r => [r["CURRENCY TYPE"], r["BRANCH NAME"], r["FROM"], r["TO"], r["EXCHANGE RATE"], r._status]);
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
        a.download = 'exchange-rates-' + stamp + '.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 0);
    }

    private decorate(r: any): any {
        const from = this.parseDt(r["FROM"]);
        const to = this.parseDt(r["TO"]);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const t = today.getTime();
        let status: RateStatus;
        if (from !== null && from > t) { status = 'Upcoming'; }
        else if (to !== null && to < t) { status = 'Expired'; }
        else { status = 'Current'; }
        return Object.assign({}, r, { _status: status });
    }

    /** "dd-MMM-yyyy" or the search API's "Mon  d yyyy" -> local midnight ms, or null */
    private parseDt(v: any): number | null {
        const s = String(v || '');
        let d: number, mon: number, y: number;
        let m = /^\s*(\d{1,2})-([A-Za-z]{3})-(\d{4})\s*$/.exec(s);
        if (m) { d = +m[1]; mon = MONTHS.indexOf(m[2].toLowerCase()); y = +m[3]; }
        else {
            m = /^\s*([A-Za-z]{3})\s+(\d{1,2})\s+(\d{4})\s*$/.exec(s);
            if (!m) { return null; }
            d = +m[2]; mon = MONTHS.indexOf(m[1].toLowerCase()); y = +m[3];
        }
        if (mon < 0) { return null; }
        return new Date(y, mon, d).getTime();
    }
}
