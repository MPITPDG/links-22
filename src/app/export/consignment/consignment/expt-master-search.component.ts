import { Component, OnInit, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { DataService } from '../../../shared/service/dataService';
import { LoginService } from '../../../shared/service/loginService';
import { ToastCommonService } from '../../../shared/service/toastService';
import { OkModalComponent } from '../../../shared/common-modal.directive';
import { SharedDataSerice } from '../../export-share-data.service';
import { LoaderService } from '../../../shared/service/loader.service';
@Component({
    selector: 'app-consignment-search-modal',
    templateUrl: 'expt-master-search.component.html',
    // Page kit is global (src/styles/kit); kit-consignment scopes consignment-page.css.
    host: { class: 'kit-consignment' },
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class ExportMasterSearchComponent implements OnInit {
    @ViewChild('okModal', {static: false}) okModal: OkModalComponent;
    countryList: any = [];
    cityList: any = [];
    vesselList: any = [];
    searchList: any = [];
    searchHeaderText: string = "";

    checkWise: string = "1";

    numberWise: string = "EXPORTNO";
    numberName: string = "Export No.";
    numberText: any = "";

    // ---------------------------------------------------------------- presentation (MP)
    // The document types were radio buttons spread across the screen; they are now one
    // dropdown. numberOption() still does the work, so validation and the search call
    // are unchanged.
    numberOptions: Array<any> = [
        { code: 'ANY', text: 'Any document' },
        { code: 'EXPORTNO', text: 'Export No.' },
        { code: 'INV_NO', text: 'Invoice No.' },
        { code: 'FCR_NO', text: 'FCR No.' },
        { code: 'BL_NO', text: 'BL No.' },
        { code: 'HAWB_NO', text: 'HAWB No.' },
        { code: 'MAWB_NO', text: 'MAWB No.' },
        { code: 'GRI_NO', text: 'GRI No.' },
        { code: 'SHIP_BILL_NO', text: 'Shipping Bill No.' },
        { code: 'ORDER_NO', text: 'Order No.' },
        { code: 'REF_NO', text: 'Ref. No.' },
        { code: 'NO_OF_PKGS', text: 'No. of Pkgs' },
        { code: 'NO_OF_PCS', text: 'No. of Pcs' }
    ];

    onNumberTypeChange(code) {
        const opt = this.numberOptions.filter(o => o.code == code)[0];
        this.numberOption(opt ? opt.text : code, code);
        this.liveMessage = '';
    }

    // ---------------------------------------------------------------- live search (MP)
    // Typing searches on its own after a pause. It never navigates away on a single
    // hit - that only happens when the user presses Search or Enter.
    liveTimer: any = null;
    liveBusy: boolean = false;
    liveMessage: string = '';

    onNumberInput() {
        if (this.liveTimer) { clearTimeout(this.liveTimer); }
        this.liveMessage = '';
        const text = (this.numberText || '').toString().trim();
        if (text.length < 3) { return; }
        this.liveTimer = setTimeout(() => { this.runLive(text); }, 500);
    }

    private runLive(text) {
        if (this.numberWise == 'ANY') { this.runAny(text, 0); return; }
        this.liveBusy = true;
        this.fetchList(text, this.numberWise, (rows, head) => {
            this.liveBusy = false;
            if (rows.length == 0) { this.liveMessage = 'No match for ' + this.numberName.toLowerCase() + ' "' + text + '"'; return; }
            this.applyRows(rows, head);
        });
    }

    // "Any document" tries each document type in turn and stops at the first one that
    // returns rows, so the user does not have to know which number they are holding.
    anyOrder: Array<string> = ['EXPORTNO', 'INV_NO', 'BL_NO', 'HAWB_NO', 'MAWB_NO', 'FCR_NO',
        'GRI_NO', 'SHIP_BILL_NO', 'ORDER_NO', 'REF_NO'];

    private runAny(text, index) {
        if (index == 0) { this.liveBusy = true; }
        if (index >= this.anyOrder.length) {
            this.liveBusy = false;
            this.liveMessage = 'No document found for "' + text + '"';
            return;
        }
        const type = this.anyOrder[index];
        // an export number has a fixed length; skip that lookup when it cannot match
        const expLen = (this._loginService.getLogin()[0].CITYCODE == 'LIL') ? 10 : 15;
        if (type == 'EXPORTNO' && text.length != expLen) { this.runAny(text, index + 1); return; }

        this.fetchList(text, type, (rows, head) => {
            if (rows.length > 0) {
                this.liveBusy = false;
                const opt = this.numberOptions.filter(o => o.code == type)[0];
                this.applyRows(rows, head);
                this.liveMessage = 'Matched on ' + (opt ? opt.text : type);
            } else {
                this.runAny(text, index + 1);
            }
        });
    }

    private applyRows(rows, head) {
        this.searchList = rows;
        this.loadError = false;
        this.page = 1;
        this.showingRecent = false;
        this.searchHeaderText = head || '';
        if (rows.length > 0) {
            this.MAWBNO = rows[0].MAWBNO;
            this.DESTINATION = rows[0].MAWBDEST;
            this.PKGS = rows[0].P_PKGS;
            this.GRWT = rows[0].P_GRWT;
            this.CHBLWT = rows[0].P_CHBLWT;
            this.PLANNEDFLIGHT = rows[0].FLIGHTDTLS;
            this.ACTUALFLIGHT = rows[0].ACTFLIGHTDTLS;
            this.ETA = rows[0].ETAPORT1;
        }
    }

    // Shared fetch used by the live search. Silent: no loader, no toast. Same endpoint and
    // payload as getSearchData(). A missing Table is treated as empty.
    private fetchList(value, stype, done) {
        const _jsonData = {
            Type1: stype,
            Type2: value,
            Type3: this._loginService.getLogin()[0].CMPCODE,
            Type4: this._loginService.getLogin()[0].CITYCODE
        };
        this._dataService.Common("Export/ConsignmentSearchList", _jsonData)
            .subscribe((data: any) => {
                const rows = (data && Array.isArray(data.Table)) ? data.Table.filter((r: any) => r && String(r.STATUS ?? '') !== '101') : [];
                const head = (data && data.Table1 && data.Table1.length > 0) ? data.Table1[0].SEARCH_HEAD : '';
                done(rows, head);
            },
            () => { this.liveBusy = false; done([], ''); });
    }

    vesselname: any = "";
    voyageno: any = "";
    searchby: any = null;

    shipmentWise: string = "SHIP_CUR";
    consigneeWise: string = "CON_CUR";

    shippersearchby: any = "COUNTRY";
    shippername: any = "";
    shippercountry: any = null;
    shippercity: any = null;
    shipperList: any = [];
    shipper: any = null;


    consigneesearchby: any = "COUNTRY";
    consigneename: any = "";
    consigneecountry: any = null;
    consigneeList: any = [];
    consignee: any = null;

    MAWBNO : string = "";
    DESTINATION	 : string = "";
    PKGS	 : string = "";
    GRWT : string = "";
    CHBLWT : string = "";
    PLANNEDFLIGHT  : string = "";
    ACTUALFLIGHT  : string = "";
    ETA : string = "";

    constructor(
        private _dataService: DataService,
        private _loginService: LoginService,
        private _toasterService: ToastCommonService,
        private _router: Router,
        private _sharedEditExport: SharedDataSerice,
        private _loaderService: LoaderService) { }

    ngOnInit() {
        this._loginService.verifyRights('214', '')
            .subscribe((data: any) => {
                if (this._loginService.checkVerify('View', data) === false) { this.noRights = true; }
            });
        this.readJustSaved();
        this.getData("PAGELOAD", "", "");
        // Paint whatever this browser opened last straight away, then replace it with
        // the server's recent list as soon as it lands.
        this.loadLocalRecent();
        this.loadRecent();
    }

    // ---------------------------------------------------------------- recent list
    // Ported from MPERPNG-20. On open the page lists the most recently opened export
    // jobs for the logged-in user's city/company, newest first, in the same grid as
    // search results. Backed by USP_EXPT_CONSIGNMENT_RECENT via Export/GetRecentConsignments
    // (Links search columns: GRPID present, no INCOTERM/CONTFRT); Table1[0].SEARCH_HEAD is
    // the caption. Fails silently (endpoint not deployed, error envelope): the page is then
    // the plain search it always was.
    static RECENT_TOP: number = 50;
    showingRecent: boolean = false;
    recentBusy: boolean = false;

    loadRecent() {
        const l = this._loginService.getLogin()?.[0];
        if (!l) { return; }
        const _jsonData = { Type1: l.CITYCODE, Type2: l.CMPCODE, Type3: ExportMasterSearchComponent.RECENT_TOP };
        this.recentBusy = true;
        this._dataService.Common("Export/GetRecentConsignments", _jsonData)
            .subscribe((data: any) => {
                this.recentBusy = false;
                // A search the user started while this was in flight wins.
                if (this.searchHeaderText) { return; }
                const rows: any[] = Array.isArray(data?.Table) ? data.Table : [];
                // ErrorLog envelope ({STATUS:'101', ...}) instead of rows: ignore.
                if (rows.some(r => r && String(r.STATUS ?? '') === '101')) { return; }
                const jobs = rows.filter(r => r && r.EXPTNO);
                if (jobs.length > 0) {
                    this.searchList = this.pinJustSaved(jobs);
                    this.loadError = false;
                    this.page = 1;
                    this.showingRecent = true;
                    this.recentCaption = (data?.Table1?.[0]?.SEARCH_HEAD || 'Recent consignments').toString();
                }
            },
            () => { this.recentBusy = false; /* silent: the page still works as a plain search */ });
    }

    /** Caption the recent-list proc returns (Table1[0].SEARCH_HEAD); shown in the toolbar. */
    recentCaption: string = '';

    // ------------------------------------------------------------- saved just now (MP)
    // The workspace puts the new export no. on the shared service right before it
    // navigates here. We read it once, tag that row so the grid can show a "Saved just
    // now" chip, and move it to the top of the recent list.
    justSavedExptno: string = '';

    private readJustSaved() {
        this.justSavedExptno = (this._sharedEditExport.justSavedExptno || '').toString().trim();
        this._sharedEditExport.justSavedExptno = '';
    }

    private pinJustSaved(rows: Array<any>): Array<any> {
        if (!this.justSavedExptno) { return rows; }
        const hit = (rows || []).filter((r: any) => r && r.EXPTNO == this.justSavedExptno);
        if (hit.length === 0) { return rows; }
        const rest = (rows || []).filter((r: any) => !r || r.EXPTNO != this.justSavedExptno);
        return hit.concat(rest);
    }

    mainCheck(ctype) {
        this.checkWise = ctype;
    }

    numberOption(text, ntype) {
        this.numberWise = ntype;
        this.numberName = text;
    }

    changeShipmentType(stype) {
        this.shipmentWise = stype;
    }

    changeConsigneeType(stype) {
        this.consigneeWise = stype;
    }

    search() {
        let SearchType, Value;
        if (this.checkWise == '1') {
            if (this.numberText == "") {
                this._toasterService.toast('error', 'Alert', "Please Enter " + this.numberName); return false;
            }
            else if (this.numberWise == 'ANY') {
                this.runAny((this.numberText || '').toString().trim(), 0); return false;
            }
            else if (this.numberWise == 'EXPORTNO') {
                if (this._loginService.getLogin()[0].CITYCODE =='LIL')
                {
                    if (this.numberText.length != 10) {
                        this._toasterService.toast('error', 'Alert', "Invalid Export number."); return false;
                    }
                }
                else{
                if (this.numberText.length != 15) {
                    this._toasterService.toast('error', 'Alert', "Invalid Export number."); return false;
                }
            }
            }
            Value = this.numberText;
            SearchType = this.numberWise;
        } else if (this.checkWise == '2') {
            if (this.searchby == null) { this._toasterService.toast('error', 'Alert', "Please select Vessel Name."); return false; }
            Value = this.searchby;
            SearchType = "VESSEL";
        }
        else if (this.checkWise == '3') {
            if (this.shipper == null) { this._toasterService.toast('error', 'Alert', "Please select Shipper Name."); return false; }
            Value = this.shipper;
            SearchType = this.shipmentWise;
        }
        else if (this.checkWise == '4') {
            if (this.consignee == null) { this._toasterService.toast('error', 'Alert', "Please select Shipper Name."); return false; }
            Value = this.consignee;
            SearchType = this.consigneeWise;
        }
        //Value = "011011820000005";//"011011810000022";//"011081710002162";//"011020210075028";//'E100394';//'E101781';//
        //SearchType = "EXPORTNO";//'SHIP_CUR';
        this.getSearchData(Value, SearchType);

    }

    getSearchData(value, stype) {
        const _jsonData = {
            Type1: stype,
            Type2: value,
            Type3: this._loginService.getLogin()[0].CMPCODE,
            Type4: this._loginService.getLogin()[0].CITYCODE
        };
        this._loaderService.display(true);
        this._dataService.Common("Export/ConsignmentSearchList", _jsonData)
            .subscribe((data: any) => {
                this._loaderService.display(false);
                // fail soft: a missing Table is "no record found"
                if (!data || !Array.isArray(data.Table)) { data = { Table: [] }; }
                if (data.Table.length >0) {

                if (data.Table.length == 1) {
                    this.setValue(data.Table[0]);
                }
                else if (data.Table.length > 0) {
                    this.searchHeaderText = (data.Table1 && data.Table1[0]) ? data.Table1[0].SEARCH_HEAD : '';
                    this.searchList = data.Table;
                    this.showingRecent = false;
                    this.page = 1;

                   this.MAWBNO  = this.searchList[0].MAWBNO
                   this.DESTINATION	  = this.searchList[0].MAWBDEST
                   this.PKGS	= this.searchList[0].P_PKGS
                   this.GRWT  = this.searchList[0].P_GRWT
                   this.CHBLWT = this.searchList[0].P_CHBLWT
                   this.PLANNEDFLIGHT  = this.searchList[0].FLIGHTDTLS
                   this.ACTUALFLIGHT  = this.searchList[0].ACTFLIGHTDTLS
                   this.ETA = this.searchList[0].ETAPORT1

                }
                else { this.okModal.show(); }
            }
            else
            {
                this._toasterService.toast('error', 'Error',  "No record found");
            }
            },
            (error) => {
                this._loaderService.display(false);
                this.loadError = true;
                this._toasterService.toast('error', 'Error', error.status + '<br/>' + error.statusText);
            },
            () => {
            });
    }

    getData(ptype, vslname, voyageno) {
        const _jsonData = {
            Type: ptype,
            VslName: vslname,
            VoyageNo: voyageno
        };
        this._loaderService.display(true);
        return this._dataService.Common("Export/ConsignmentSearchFillDropdown", _jsonData)
            .subscribe((data: any) => {
                this._loaderService.display(false);
                if (ptype == 'PAGELOAD') {
                    this.countryList = data.Table;
                    this.cityList = data.Table1;
                } else if (ptype == 'VSLWISE') {
                    this.vesselList = data.Table;
                }
            },
            (error) => {
                this._toasterService.toast('error', 'Error', error.status + '<br/>' + error.statusText);
            },
            () => {
            });
    }

    getVessel() {
        this.getData("VSLWISE", this.vesselname, this.voyageno);
    }

    getShipper() {
        if (this.shippersearchby == 'COUNTRY') {
            if (this.shippercountry == null) { this._toasterService.toast('error', 'Alert', "Please Select Country"); return false; }
        } else if (this.shippersearchby == 'CITY') {
            if (this.shippercity == null) { this._toasterService.toast('error', 'Alert', "Please Select City"); return false; }
        }
        else if (this.shippersearchby == 'NAME') {
            if (this.shippername == "") { this._toasterService.toast('error', 'Alert', "Please Enter Name"); return false; }
        }
        let value = "";
        if (this.shippersearchby == 'COUNTRY') { value = this.shippercountry; }
        else if (this.shippersearchby == 'CITY') { value = this.shippercity; }
        else if (this.shippersearchby == 'NAME') { value = this.shippername; }
        else { value = "ALL"; }
        this.fillShipperConsignee('S', this.shippersearchby, value);
    }


    getConsignee() {
        if (this.consigneesearchby == 'COUNTRY') {
            if (this.consigneecountry == null) { this._toasterService.toast('error', 'Alert', "Please Select Country"); return false; }
        } else if (this.consigneesearchby == 'NAME') {
            if (this.consigneename == "") { this._toasterService.toast('error', 'Alert', "Please Enter Name"); return false; }
        }
        let value = "";
        if (this.consigneesearchby == 'COUNTRY') { value = this.consigneecountry; }
        else if (this.consigneesearchby == 'NAME') { value = this.consigneename; }
        else { value = "ALL"; }
        this.fillShipperConsignee('C', this.consigneesearchby, value);
    }

    fillShipperConsignee(ship_con, searchby, value) {
        const _jsonData = {
            Type: ship_con,
            VslName: searchby,
            VoyageNo: value
        };
        this._loaderService.display(true);
        return this._dataService.Common("Export/ConsignmentSearchShipperConsignee", _jsonData)
            .subscribe((data: any) => {
                this._loaderService.display(false);
                if (ship_con == "S") {
                    this.shipperList = data.Table;
                } else {
                    this.consigneeList = data.Table;
                }
            },
            (error) => {
                this._toasterService.toast('error', 'Error', error.status + '<br/>' + error.statusText);
            });
    }

    setValue(event) {
        this.rememberRecent(event);
        if  (event.EXPTCANCEL == 'Y')
        {
            this._toasterService.toast("error", "Alert", "This DOCS. " + event.EXPTNO + " CANCELED"); 
            this._sharedEditExport.exportEditData = event;
            this._router.navigate(['export/Consignment/view', event.EXPTNO]);
        }
        else
        {
            if (event.EXPT_MODE == 'AIR') {
                if (event.JOBEXIST != 'NO') {
                    if (event.ACTUALFLIGHTDT != '' && event.CO2_EMITION_LVL != '0') {
                       // this._toasterService.toast("error", "Alert", "This Export No. " + event.EXPTNO + " Already Imported");
                        this._sharedEditExport.exportEditData = event;
                        this._sharedEditExport.jobcreationtype='M';
                        //this._router.navigate(['export/Consignment/view', event.EXPTNO]);
                        this.setEditAndRedirect(event.EXPTNO);
                    }  else if (event.ACTUALFLIGHTDT == '' || event.CO2_EMITION_LVL == '0') {
                       this._sharedEditExport.jobcreationtype='M';
                        this.setEditAndRedirect(event.EXPTNO);
                    // this._router.navigate(["export/consignment/edit-actual-flight-date", event.EXPTNO]);
                    }
                }
                else {
                    this._sharedEditExport.exportEditData = event;
                    this._sharedEditExport.jobcreationtype='M';
                    this.setEditAndRedirect(event.EXPTNO);
                }
            } else if (event.EXPT_MODE == 'SEA' && event.ISDIFFAIR =='0'  ) {
                if (event.JOBEXIST != 'NO') { 
                    this._toasterService.toast("error", "Alert", "This Export No. " + event.EXPTNO + " Already Imported"); 
                    this._sharedEditExport.exportEditData = event;
                    this._sharedEditExport.jobcreationtype='M';
                    this._router.navigate(['export/Consignment/view', event.EXPTNO]);
                }
                else {
                    this._sharedEditExport.exportEditData = event;
                    this._sharedEditExport.jobcreationtype='M';
                    this.setEditAndRedirect(event.EXPTNO);
                }                
            } 
            else if (event.EXPT_MODE == 'SEA' && event.ISDIFFAIR =='2'  ) {
                this._sharedEditExport.exportEditData = event;
                this._sharedEditExport.jobcreationtype='M';
                this.setEditAndRedirect(event.EXPTNO);
            }  
        }
    }

    setViewAndRedirect(exptno){
        this._toasterService.toast('info', '', "Please wait fetching data...");
        const _jsonData = {
            Type1: exptno,
            Type2: this._loginService.getLogin()[0].CMPID
        };
        this._loaderService.display(true);
        this._dataService.Common("Export/ConsignmentEditSearchView", _jsonData)
            .subscribe((data: any) => {
                this._loaderService.display(false);
                this._sharedEditExport.exportEditData = data.Table[0];
                this._sharedEditExport.jobcreationtype='M';
                this._router.navigate(['export/Consignment/edit']);
            },
            (error) => {
                this._toasterService.toast('error', 'Error', error.status + '<br/>' + error.statusText);
            });
    }

    setEditAndRedirect(exptno){
        this._toasterService.toast('info', '', "Please wait fetching data...");
        const _jsonData = {
            Type1: exptno,
            Type2: this._loginService.getLogin()[0].CMPID
        };
        this._loaderService.display(true);
        this._dataService.Common("Export/ConsignmentEditSearchView", _jsonData)
            .subscribe((data: any) => {
                this._loaderService.display(false);
                this._sharedEditExport.exportEditData = data.Table[0];
                this._sharedEditExport.jobcreationtype='M';
                this._router.navigate(['export/Consignment/edit']);
            },
            (error) => {
                this._toasterService.toast('error', 'Error', error.status + '<br/>' + error.statusText);
            });
    }

    // ================================================================ redesign: list state (MP)
    readonly pageSize = 10;
    page: number = 1;
    loadError: boolean = false;
    noRights: boolean = false;
    quickFilter: string = '';
    modeFilter: string = '';

    /** Rows shown in the grid: searchList de-duplicated by export no., then the client-side filters. */
    get List(): Array<any> {
        const seen = new Set();
        const q = (this.quickFilter || '').trim().toLowerCase();
        return (this.searchList || [])
            .filter((r: any) => { const k = r && r.EXPTNO; if (!k) { return true; } if (seen.has(k)) { return false; } seen.add(k); return true; })
            .filter((r: any) => !this.modeFilter || r.EXPT_MODE == this.modeFilter)
            .filter((r: any) => !q || [r.EXPTNO, r.INVNO, r.SHIPPER, r.CONSIGNEE, r.HAWBNO, r.ORDER_NO, r.FREIGHT]
                .some(v => v != null && String(v).toLowerCase().indexOf(q) >= 0));
    }

    get pageCount(): number { return Math.max(1, Math.ceil(this.List.length / this.pageSize)); }
    get pageRows(): Array<any> { const st = (this.page - 1) * this.pageSize; return this.List.slice(st, st + this.pageSize); }
    get rangeStart(): number { return this.List.length ? (this.page - 1) * this.pageSize + 1 : 0; }
    get rangeEnd(): number { return Math.min(this.page * this.pageSize, this.List.length); }
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
    goPage(p: number) { if (p >= 1 && p <= this.pageCount) { this.page = p; } }

    clear() {
        this.checkWise = '1';
        this.numberText = '';
        this.liveMessage = '';
        this.vesselname = ''; this.voyageno = ''; this.searchby = null;
        this.shipper = null; this.consignee = null;
        this.quickFilter = ''; this.modeFilter = '';
        this.searchHeaderText = '';
        this.searchList = [];
        this.loadError = false;
        this.page = 1;
        // Clearing the filters puts the recent list back.
        this.loadLocalRecent();
        this.loadRecent();
    }

    exportCsv() {
        const head = ['Export no', 'Mode', 'Cancelled', 'Job', 'Invoice no', 'Shipper', 'Consignee', 'Gr wt', 'Vol', 'Vol wt', 'Chbl wt', 'Pkgs', 'HAWB no', 'HAWB dt', 'Order no', 'Freight'];
        const strip = (v: any) => (v == null ? '' : String(v).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim());
        const rows = this.List.map((r: any) => [r.EXPTNO, r.EXPT_MODE, r.EXPTCANCEL, r.JOBEXIST, r.INVNO, r.SHIPPER, r.CONSIGNEE, r.GRWT, r.VOLUME, r.VOLWT, r.CHBLWT, r.PKGS, r.HAWBNO, r.HAWBDT, strip(r.ORDER_NO), r.FREIGHT]);
        const q = (v: any) => '"' + (v == null ? '' : String(v)).replace(/"/g, '""') + '"';
        const csv = [head, ...rows].map(line => line.map(q).join(',')).join('\r\n');
        const d = new Date();
        const stamp = d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
        const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'export-consignments-' + stamp + '.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 0);
    }

    // ---------------------------------------------------------------- local recent list (MP)
    // The consignments this browser opened last - the grid rows exactly as the search proc
    // returned them - newest first, de-duplicated by export no. Painted straight away on
    // open, then replaced by the server's recent list (Export/GetRecentConsignments).
    private static RECENT_KEY = 'links_export_consignment_recent';
    private static RECENT_MAX = 50;

    private loadLocalRecent() {
        let rows: any[] = [];
        try { rows = JSON.parse(localStorage.getItem(ExportMasterSearchComponent.RECENT_KEY) || '[]') || []; } catch (e) { rows = []; }
        if (!Array.isArray(rows)) { rows = []; }
        if (rows.length > 0 && !this.searchHeaderText) {
            this.searchList = rows;
            this.showingRecent = true;
            this.page = 1;
        }
    }

    private rememberRecent(row: any) {
        if (!row || !row.EXPTNO) { return; }
        try {
            let rows: any[] = JSON.parse(localStorage.getItem(ExportMasterSearchComponent.RECENT_KEY) || '[]') || [];
            if (!Array.isArray(rows)) { rows = []; }
            rows = [row].concat(rows.filter((r: any) => r && r.EXPTNO != row.EXPTNO)).slice(0, ExportMasterSearchComponent.RECENT_MAX);
            localStorage.setItem(ExportMasterSearchComponent.RECENT_KEY, JSON.stringify(rows));
        } catch (e) { /* storage unavailable: the page still works as a plain search */ }
    }
}
