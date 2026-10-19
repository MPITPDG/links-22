import { Component, OnInit, ViewEncapsulation, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { DataService } from '../../shared/service/dataService';
import { LoginService } from '../../shared/service/loginService';
import { ToastCommonService } from '../../shared/service/toastService';
import { IMyDpOptions } from 'mydatepicker';
import { LoaderService } from '../../shared/service/loader.service';
@Component({
    selector: 'app-consignment-import-sea-search',
    templateUrl: 'search.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class SeaSearchComponent implements OnInit {
    public myDatePickerOptions: IMyDpOptions = {
        dateFormat: 'dd/mm/yyyy',
        inline: false,
        height: '16px',
        width: '120px',
        componentDisabled: false,
        selectionTxtFontSize: '12px',
        editableDateField: false,
        sunHighlight: true,
        satHighlight: true,
        firstDayOfWeek: 'su',
        openSelectorTopOfInput: false,
        openSelectorOnInputClick: true,
        selectorHeight: '198px',
        selectorWidth: '200px'
    };
    ImporterList: any = [];
    BillToList: any = [];
    VesselList: any = [];
    AgentList: any = [];
    searchList: any = [];

    displayType: string = 'SEARCH';
    searchHeaderText: string = 'List of Sea';
    Mode: string = 'Sea';
    Type: string = 'CODE';
    ImportCode: any = '';
    ImportFromDate: any = null;
    ImportToDate: any = null;
    Importer: any = null;
    ImporterType: string = 'All';
    BillTo: any = null;
    BillToType: string = 'All';
    Vessel: any = null;
    VesselType: string = 'All';
    Agent: any = null;
    AgentType: string = 'All';
    GlFromDate: any = null;
    GlToDate: any = null;

    // ---------- page kit (MPERPNG-20 redesign): results list state ----------
    readonly pageSize = 10;
    /** de-duplicated, decorated rows on screen (the default 30-day load or an explicit search) */
    List: Array<any> = [];
    page: number = 1;
    loading: boolean = false;
    loadError: boolean = false;
    /** the rights check failed, so nothing is loaded */
    noRights: boolean = false;
    /** true once the default (last 30 days) load has completed, so the toolbar/empty text can say so */
    defaultLoaded: boolean = false;

    constructor(
        private _dataService: DataService,
        private _loginService: LoginService,
        private _toasterService: ToastCommonService,
        private _router: Router,
        private _loaderService: LoaderService) { }

    ngOnInit() {
        this.verifyPermission(126, "Modify");
    }

    verifyPermission(formId, userMode) {
        this._loaderService.display(true);
        this._loginService.verifyRights(formId, '')
            .subscribe((data: any) => {
                if (this._loginService.checkVerify(userMode, data)) {
                    this.fillCommonDropdownList();
                } else { this._loaderService.display(false); this.noRights = true; }
            });
    }

    fillCommonDropdownList() {
        const _jsonData = {
            citycode: this._loginService.getLogin()[0].CITYCODE,
        };
        this._dataService.getData("Import/Fill_Dropdown_Report_Search", _jsonData)
            .subscribe((data: any) => {
                this._loaderService.display(false);
                this.ImporterList = data.Table;
                this.BillToList = data.Table;
                this.VesselList = data.Table1;
                this.AgentList = data.Table;
                // list the last 30 days so the page is never empty on open
                this.loadDefault();
            });
    }

    /** last-30-days date-wise search (SearchType '2'): same proc and payload shape as the Search button, listed rather than auto-navigated */
    loadDefault() {
        const to = new Date();
        const from = new Date(to.getTime() - 30 * 86400000);
        const us = (d: Date) => ('0' + (d.getMonth() + 1)).slice(-2) + '/' + ('0' + d.getDate()).slice(-2) + '/' + d.getFullYear();
        const _jsonData = {
            Mode: this.Mode,
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
                this.defaultLoaded = true;
                this.List = this.dedupeAndDecorate(data);
                this.page = 1;
            }, () => {
                this.loading = false;
                this.loadError = true;
            });
    }

    fnValidate_Code(): boolean {
        if (this.ImportCode.trim().length === 0) {
            alert("Please Enter Import Code.");
            return false;
        } else if (this.ImportCode.trim().length != 15) {
            alert("Invalid Import Code.");
            return false;
        }
        return true;
    }
    fnValidate_Date(): boolean {
        if (!this.ImportFromDate) {
            alert("Please select From Date.");
            return false;
        }
        else if (!this.ImportToDate) {
            alert("Please select To Date.");
            return false;
        }
        else if (!this._dataService.DateFromAndToComparision(this.ImportFromDate.formatted, this.ImportToDate.formatted)) {
            alert("To Date should be greater than From Date");
            return false;
        }
        return true;
    }
    fnValidate_Importer(): boolean {
        if (!this.Importer) {
            alert("Please select Importer.");
            return false;
        }
        return true;
    }
    fnValidate_BillTo(): boolean {
        if (!this.BillTo) {
            alert("Please select Bill To.");
            return false;
        }
        return true;
    }
    fnValidate_Vessel(): boolean {
        if (!this.BillTo) {
            alert("Please select Vessel Name.");
            return false;
        }
        return true;
    }
    fnValidate_Agent(): boolean {
        if (!this.Agent) {
            alert("Please select Agent Name.");
            return false;
        }
        return true;
    }
    fnValidate_Gl(): boolean {
        if (!this.GlFromDate) {
            alert("Please select From Date.");
            return false;
        }
        else if (!this.GlToDate) {
            alert("Please select To Date.");
            return false;
        }
        else if (!this._dataService.DateFromAndToComparision(this.ImportFromDate.formatted, this.ImportToDate.formatted)) {
            alert("To Date should be greater than From Date");
            return false;
        }
        return true;
    }

    SqlDate(strdateP) {
        if (strdateP != "" || strdateP != undefined) {
            let strdate = strdateP.split("/");
            let StrSqlDate = strdate[1] + "/" + strdate[0] + "/" + strdate[2];
            return StrSqlDate;
        }
        else return "";
    }


    search() {
        let SearchType = "";
        if (this.Type == 'CODE') { if (this.fnValidate_Code()) { SearchType = "1"; this.getData(SearchType); }; }
        else if (this.Type == 'DATE') { if (this.fnValidate_Date()) { SearchType = "2"; this.getData(SearchType); } }
        else if (this.Type == 'IMPORTER') { if (this.fnValidate_Importer()) { SearchType = "3"; this.getData(SearchType); } }
        else if (this.Type == 'BILLTO') { if (this.fnValidate_BillTo()) { SearchType = "4"; this.getData(SearchType); } }
        else if (this.Type == 'VESSEL') { if (this.fnValidate_Vessel()) { SearchType = "5"; this.getData(SearchType); } }
        else if (this.Type == 'AGENT') { if (this.fnValidate_Agent()) { SearchType = "6"; this.getData(SearchType); } }
        else if (this.Type == 'GL') { if (this.fnValidate_Gl()) { SearchType = "7"; this.getData(SearchType); } }
    }

    getData(searchtype) {
        const _jsonData = {
            Mode: this.Mode,
            ImportCode: this.ImportCode,
            ImportFromDate: (this.ImportFromDate) ? this.SqlDate(this.ImportFromDate.formatted) : "",
            ImportToDate: (this.ImportToDate) ? this.SqlDate(this.ImportToDate.formatted) : "",
            Importer: (this.Importer) ? this.Importer : "",
            ImporterType: this.ImporterType,
            BillTo: (this.BillTo) ? this.BillTo : "",
            BillToType: this.BillToType,
            Vessel: (this.Vessel) ? this.Vessel : "",
            VesselType: this.VesselType,
            Agent: (this.Agent) ? this.Agent : "",
            AgentType: this.AgentType,
            GlFromDate: (this.GlFromDate) ? this.SqlDate(this.GlFromDate.formatted) : "",
            GlToDate: (this.GlToDate) ? this.SqlDate(this.GlToDate.formatted) : "",
            SearchType: searchtype,
            CityCode1: this._loginService.getLogin()[0].CITYCODE1,
            CmpCode: this._loginService.getLogin()[0].CMPCODE,
        };
        this._loaderService.display(true);
        this.loading = true;
        this.loadError = false;
        this._dataService.Common("Import/Report_Search", _jsonData)
            .subscribe((data: any) => {
                this._loaderService.display(false);
                this.loading = false;
               // console.log(data);
                // a response with no result set (the API answers {}) is "no results", not an error
                const table = (data && data.Table) || [];
                if (table.length == 0) {
                    this._toasterService.toast("warning", "Alert", "No record found");
                    this.displayType = 'LIST';
                    this.searchList = [];
                    this.List = [];
                    this.page = 1;
                }
                else if (table.length == 1) {
                    this._router.navigate(["./import/sea/update-data/", table[0].pk_ImpoterId]);
                }
                else if (table.length > 1) {
                    this.displayType = 'LIST';
                    this.searchList = table;
                    this.List = this.dedupeAndDecorate(data);
                    this.page = 1;
                }
            }, () => {
                this._loaderService.display(false);
                this.loading = false;
                this.loadError = true;
            });
    }

    redirectToEdit(pkid) {
        this._router.navigate(["./import/sea/update-data/", pkid]);
    }

    /** was the "back to search" link on the old LIST view: leave the result list and show the default 30 days again */
    backToSearch() {
        this.displayType = 'SEARCH';
        this.searchList = [];
        this.List = [];
        this.page = 1;
        // the default list is only loaded once the rights check has passed, as on open
        if (!this.noRights) { this.loadDefault(); }
    }

    clear() {
        this.Type = 'CODE';
        this.ImportCode = '';
        this.ImportFromDate = null;
        this.ImportToDate = null;
        this.Importer = null;
        this.ImporterType = 'All';
        this.BillTo = null;
        this.BillToType = 'All';
        this.Vessel = null;
        this.VesselType = 'All';
        this.Agent = null;
        this.AgentType = 'All';
        this.GlFromDate = null;
        this.GlToDate = null;
        this.backToSearch();
    }

    /** the All / Under clearance choice bound to whichever *Type field the current Search-by selection uses */
    get ClearanceType(): string {
        switch (this.Type) {
            case 'IMPORTER': return this.ImporterType;
            case 'BILLTO': return this.BillToType;
            case 'VESSEL': return this.VesselType;
            case 'AGENT': return this.AgentType;
            default: return 'All';
        }
    }
    set ClearanceType(v: string) {
        switch (this.Type) {
            case 'IMPORTER': this.ImporterType = v; break;
            case 'BILLTO': this.BillToType = v; break;
            case 'VESSEL': this.VesselType = v; break;
            case 'AGENT': this.AgentType = v; break;
        }
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
    exportCsv() {
        const head = ['Import code', 'Import date', 'Importer', 'Vessel', 'Agent', 'Desc of goods', 'No. of pkgs', 'Gross weight'];
        const rows = this.List.map(r => [r['Import Code'], r['Import Date'], r['Importer'], r['Vessel'], r['Agent'], r['Desc of Goods'], r['No. of Pkgs.'], r['Gross Weight']]);
        const q = (v: any) => {
            const s = (v === null || v === undefined) ? '' : String(v);
            return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
        };
        const csv = [head, ...rows].map(line => line.map(q).join(',')).join('\r\n');
        const d = new Date();
        const stamp = d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'import-sea-' + stamp + '.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 0);
    }

    // ---------- row helpers ----------
    /** the proc returns one row per container: keep one per job. A missing Table (API answered {}) is no rows; an error row ({STATUS, STATUSTEXT}) is a load error */
    private dedupeAndDecorate(data: any): any[] {
        const table = (data && data.Table) || [];
        if (table.length && table[0].STATUS && !table[0].pk_ImpoterId) { this.loadError = true; return []; }
        const seen = new Set();
        return table
            .filter((r: any) => !seen.has(r.pk_ImpoterId) && seen.add(r.pk_ImpoterId))
            .map((r: any) => this.decorate(r));
    }

    private decorate(r: any): any {
        const importerRaw: string = r['Importer'] || '';
        const [importerName, importerCity] = importerRaw.split('|').map((s: string) => (s || '').trim());
        const vessel = this.parseVessel(r['Vessel']);
        return Object.assign({}, r, {
            _importerName: importerName || importerRaw,
            _importerCity: importerCity || '',
            _vesselName: vessel ? vessel.name : '',
            _vesselEta: vessel ? vessel.eta : ''
        });
    }

    private parseVessel(raw: string): { name: string; eta: string } | null {
        if (!raw) { return null; }
        const parts = String(raw).split('|').map(p => p.trim());
        const dateMatch = /(\d{1,2}\/\d{1,2}\/\d{4})/.exec(raw);
        const name = parts.find(p => p && !/^ETA\b/i.test(p) && !/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(p));
        if (!name) { return null; }
        return { name, eta: dateMatch ? dateMatch[1] : '' };
    }

}