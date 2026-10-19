import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { DataService } from '../../../shared/service/dataService';
import { LoginService } from '../../../shared/service/loginService';
import { LoaderService } from '../../../shared/service/loader.service';
@Component({
    selector: 'app-consignment-import-master-airline-search',
    templateUrl: 'search.component.html',
    styleUrls: ['../master-page.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class SearchAirlineMasterComponent implements OnInit {
    readonly pageSize = 10;

    Input: string = '';
    List: Array<any> = [];

    // client-side filter over the name-search result (presentation only)
    Code: string = '';
    /** List after the airline-code filter */
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
                    // load every airline so the page is never empty on open
                    this.search();
                }
            });
    }

    search() {
        this._loaderService.display(true);
        this.loading = true;
        let _jsonData = {
            SearchText: this.Input
        }
        this._dataService.Common("Import/Imp_Airline_Search", _jsonData)
            .subscribe((data: any) => {
                this._loaderService.display(false);
                this.loading = false;
                this.SearchedName = (this.Input || '').trim();
                this.List = (data && Array.isArray(data.Table)) ? data.Table : [];
                this.applyFilters();
            }, () => {
                this._loaderService.display(false);
                this.loading = false;
            });
    }

    goTo(id){
        this._router.navigate(["./import/master/airline/update-entry", id]);
    }

    // ---------- presentation (MPERPNG-20 page kit) ----------

    /** airline code is applied client-side to the name-search result */
    applyFilters() {
        const code = (this.Code || '').trim().toLowerCase();
        this.Filtered = this.List.filter(r => {
            if (code && String(r["Airline Code"] || '').toLowerCase().indexOf(code) < 0) { return false; }
            return true;
        });
        this.page = 1;
    }

    clear() {
        this.Input = '';
        this.Code = '';
        this.List = [];
        this.Filtered = [];
        this.SearchedName = '';
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
        const head = ['Airline code', 'Airline name'];
        const rows = this.Filtered.map(r => [r["Airline Code"], r["Airline Name"]]);
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
        a.download = 'airlines-' + stamp + '.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 0);
    }
}
