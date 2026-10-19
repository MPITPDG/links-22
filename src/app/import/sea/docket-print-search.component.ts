import { Component, OnInit, ViewChild, ElementRef, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { DataService } from '../../shared/service/dataService';
import { LoginService } from '../../shared/service/loginService';
import { ToastCommonService } from '../../shared/service/toastService';
import { LoaderService } from '../../shared/service/loader.service';
@Component({
    selector: 'app-consignment-import-sea-docket-print-search',
    templateUrl: 'docket-print-search.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class SeaDocketPrintSearchComponent implements OnInit {
    inputValue: any = '';

    // ---------- page kit (MPERPNG-20 redesign): recent-jobs list ----------
    readonly pageSize = 10;
    List: Array<any> = [];
    page: number = 1;
    loading: boolean = false;
    loadError: boolean = false;

    constructor(
        private _dataService: DataService,
        private _loginService: LoginService,
        private _toasterService: ToastCommonService,
        private _router: Router,
        private _loaderService: LoaderService) { }

    ngOnInit() {
        this.verifyPermission(125, "View");
    }

    verifyPermission(formId, userMode) {
        this._loaderService.display(true);
        this._loginService.verifyRights(formId, '')
            .subscribe((data: any) => {
                this._loginService.checkVerify(userMode, data);
                this._loaderService.display(false);
                // as before, a failed check navigates to error/access-denied; otherwise list recent jobs
                this.loadRecent();
            });
    }

    /** last-30-days list (the Report_Search date-wise call the sea search screen makes) so a code can be picked instead of typed */
    loadRecent() {
        const to = new Date();
        const from = new Date(to.getTime() - 30 * 86400000);
        const us = (d: Date) => ('0' + (d.getMonth() + 1)).slice(-2) + '/' + ('0' + d.getDate()).slice(-2) + '/' + d.getFullYear();
        const _jsonData = {
            Mode: 'Sea',
            ImportCode: '',
            ImportFromDate: us(from),
            ImportToDate: us(to),
            Importer: '',
            ImporterType: 'All',
            BillTo: '',
            BillToType: 'All',
            Vessel: '',
            VesselType: 'All',
            Agent: '',
            AgentType: 'All',
            GlFromDate: '',
            GlToDate: '',
            SearchType: '2',
            CityCode1: this._loginService.getLogin()[0].CITYCODE1,
            CmpCode: this._loginService.getLogin()[0].CMPCODE,
        };
        this.loading = true;
        this.loadError = false;
        this._dataService.Common("Import/Report_Search", _jsonData)
            .subscribe((data: any) => {
                this.loading = false;
                this.List = this.dedupe(data);
                this.page = 1;
            }, () => {
                this.loading = false;
                this.loadError = true;
            });
    }

    search() {
        if (this.inputValue == '') { this._toasterService.toast("warning", "Alert", "Please enter Import Code."); return false; }
        else if (this.inputValue.length != 15) { this._toasterService.toast("warning", "Alert", "Import Code should be 15 digit."); return false; }
        else {
            this.printCode(this.inputValue);
        }
    }

    /** the print action, unchanged: check the code has a docket record, then open the docket in a new tab */
    printCode(code: string) {
        const _jsonData = {
            mode: 'Sea',
            importcode: code
        };
        this._loaderService.display(true);
        this._dataService.getData("Import/SeaAirDocketPrint", _jsonData)
            .subscribe((data: any) => {
                this._loaderService.display(false);
                if (((data && data.Table) || []).length == 0) {
                    this._toasterService.toast("warning", "Alert", "No record Found.");
                }else {
                    window.open("/#/new-tab/import-sea-docket-print/"+code, "_blank");
                }
            });
    }

    // ---------- pagination ----------
    get pageCount(): number {
        return Math.max(1, Math.ceil(this.List.length / this.pageSize));
    }

    get pageRows(): Array<any> {
        const start = (this.page - 1) * this.pageSize;
        return this.List.slice(start, start + this.pageSize);
    }

    get rangeStart(): number {
        return this.List.length ? (this.page - 1) * this.pageSize + 1 : 0;
    }

    get rangeEnd(): number {
        return Math.min(this.page * this.pageSize, this.List.length);
    }

    goPage(p: number) {
        if (p >= 1 && p <= this.pageCount) { this.page = p; }
    }

    /** one row per job (the proc returns one per container). A missing Table (API answered {}) is no rows; an error row ({STATUS, STATUSTEXT}) is a load error */
    private dedupe(data: any): any[] {
        const table = (data && data.Table) || [];
        if (table.length && table[0].STATUS && !table[0].pk_ImpoterId) { this.loadError = true; return []; }
        const seen = new Set();
        return table
            .filter((r: any) => !seen.has(r.pk_ImpoterId) && seen.add(r.pk_ImpoterId))
            .map((r: any) => {
                const importerRaw: string = r['Importer'] || '';
                const [importerName, importerCity] = importerRaw.split('|').map((x: string) => (x || '').trim());
                return Object.assign({}, r, { _importerName: importerName || importerRaw, _importerCity: importerCity || '' });
            });
    }
}