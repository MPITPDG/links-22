import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DataService } from '../../shared/service/dataService';
import { LoginService } from '../../shared/service/loginService';
import { Configuration } from '../../app.constants';
import { LoaderService } from '../../shared/service/loader.service';
import { Tds26asExportService } from './tds26as-export.service';

@Component({
    selector: 'app-tds26as-reconcil',
    templateUrl: './tds26as-reconcil.component.html',
    styleUrls: ['./tds26as-reconcil.component.css'],
    standalone: false
})
export class Tds26asReconcil implements OnInit {

    @ViewChild('inputFile', { static: false }) myInputVariable: ElementRef;

    Header: string = "26AS TDS Reconciliation";
    displayType: string = 'SEARCH';
    activeTab: string = 'ALL';           // ALL | MATCHED | UNMATCHED

    selectedFile: File = null;
    selfilename: string = "";
    uploadurl: string = "";

    logid: string = "0";
    batchInfo: any = null;               // PANNO / FINYEAR / ASSESSEENAME / FILENAME / UPLOADEDDATE
    summaryList: any[] = [];
    clientList: any[] = [];

    // drill-down modal
    public showModal_Detail: boolean = false;
    detailDeductor: any = null;
    detailList: any[] = [];
    detailInvList: any[] = [];

    // totals across the whole statement
    totAmtCredited: number = 0;
    totTdsDeposited: number = 0;
    totInvoiced: number = 0;

    constructor(
        private _dataService: DataService,
        private http: HttpClient,
        private _loginService: LoginService,
        private _config: Configuration,
        private _loaderService: LoaderService,
        private _exportService: Tds26asExportService,
    ) { }

    // tbl_mst_form id for this page - DIFFERS PER APP: 444 on manilal, 418 on LinksDB
    private readonly FORMID: string = '418';

    ngOnInit() {
        this.verifyPermission(this.FORMID, 'View');
        this.uploadurl = this._config.ServerWithApiUrl + "Accounts/Upload26ASFile";
        // Reopen the most recent statement, if one was uploaded earlier
        // (LOGID 0 = latest batch on the server side).
        this.loadSummary("0", true);
    }

    verifyPermission(formId, userMode) {
        this._loginService.verifyRights(formId, '')
            .subscribe((data: any) => {
                this._loginService.checkVerify(userMode, data);
            });
    }

    onFileChange(event) {
        this.selectedFile = (event.target.files && event.target.files.length > 0)
            ? event.target.files[0]
            : null;
        this.selfilename = this.selectedFile ? this.selectedFile.name : "";
    }

    private resetFileInput() {
        this.selectedFile = null;
        this.selfilename = "";
        if (this.myInputVariable && this.myInputVariable.nativeElement) {
            this.myInputVariable.nativeElement.value = "";
        }
    }

    upload() {
        if (this.selectedFile == undefined || this.selectedFile == null) {
            alert('Please select the 26AS statement file (.txt downloaded from TRACES, or .xlsx)');
            return false;
        }
        this._loaderService.display(true);
        const filedata = new FormData();
        filedata.append("file", this.selectedFile, this.selectedFile.name);
        filedata.append("cmpid", this._loginService.getLogin()[0].CMPID);
        filedata.append("vguid", this._loginService.getLogin()[0].GUID);
        filedata.append("makerip", this._loginService.getLogin()[0].MAKERIP);
        filedata.append("cmpcode", this._loginService.getLogin()[0].CMPCODE);
        filedata.append("citycode", this._loginService.getLogin()[0].CITYCODE);
        filedata.append("citycode1", this._loginService.getLogin()[0].CITYCODE1);
        // FY / PAN checks are done against what the file itself declares; the
        // server rejects only when these are non-blank and disagree.
        filedata.append("finyear", "");
        filedata.append("expectedpan", "");
        this.http.post(this.uploadurl, filedata)
            .subscribe((data: any) => {
                // Locate the upload-status row by shape (it is the table that
                // carries LOGID). On success the DataSet also has:
                //   Table = summary, Table1 = client list, Table2 = batch header.
                let status = null;
                for (const key of ['Table3', 'Table2', 'Table1', 'Table']) {
                    const t = data ? data[key] : null;
                    if (t && t.length > 0 && t[0] && t[0].STATUS !== undefined && t[0].LOGID !== undefined) {
                        status = t[0];
                        break;
                    }
                }
                if (status && status.STATUS == "100") {
                    this.logid = status.LOGID;
                    this.applySummary(data);
                    this.displayType = "LIST";
                    this.activeTab = 'ALL';
                    alert(status.MSG);
                }
                else {
                    // error responses come back as a single {STATUS,MSG} table
                    let msg = 'Upload failed: unexpected response from the server.';
                    for (const key of ['Table', 'Table1', 'Table2', 'Table3']) {
                        const t = data ? data[key] : null;
                        if (t && t.length > 0 && t[0] && t[0].STATUS == "104" && t[0].MSG !== undefined) {
                            msg = t[0].MSG;
                            break;
                        }
                    }
                    alert(msg);
                }
                this.resetFileInput();
                this._loaderService.display(false);
            },
                (error: any) => {
                    this._loaderService.display(false);
                    const msg = (error && error.error && error.error.Message) ? error.error.Message
                        : (error && error.message) ? error.message
                            : 'server error';
                    alert('Upload failed: ' + msg);
                });
    }

    loadSummary(logid: string, silent: boolean = false) {
        const jsonview = {
            LOGID: logid,
            CMPCODE: this._loginService.getLogin()[0].CMPCODE,
            CITYCODE: this._loginService.getLogin()[0].CITYCODE,
            CITYCODE1: this._loginService.getLogin()[0].CITYCODE1
        };
        if (!silent) { this._loaderService.display(true); }
        this._dataService.getData("Accounts/TDS26AS_GetSummary", jsonview)
            .subscribe((data: any) => {
                if (data && data.Table && data.Table.length > 0) {
                    this.applySummary(data);
                    this.displayType = "LIST";
                }
                this._loaderService.display(false);
            },
                (error: any) => { this._loaderService.display(false); });
    }

    private applySummary(data: any) {
        this.summaryList = (data.Table || []).map((r: any) => ({ ...r, selExp: null }));
        this.clientList = data.Table1 || [];
        this.batchInfo = (data.Table2 && data.Table2.length > 0) ? data.Table2[0] : null;
        this.totAmtCredited = 0; this.totTdsDeposited = 0; this.totInvoiced = 0;
        for (const r of this.summaryList) {
            this.totAmtCredited += Number(r.TOT_AMTCREDITED) || 0;
            this.totTdsDeposited += Number(r.TOT_TDSDEPOSITED) || 0;
            this.totInvoiced += Number(r.FY_INVOICED) || 0;
        }
    }

    get filteredList(): any[] {
        if (this.activeTab == 'MATCHED') { return this.summaryList.filter(r => r.MATCHTYPE); }
        if (this.activeTab == 'UNMATCHED') { return this.summaryList.filter(r => !r.MATCHTYPE); }
        return this.summaryList;
    }

    get matchedCount(): number { return this.summaryList.filter(r => r.MATCHTYPE).length; }
    get unmatchedCount(): number { return this.summaryList.filter(r => !r.MATCHTYPE).length; }

    openDetail(row: any) {
        this.detailDeductor = row;
        this.detailList = [];
        this.detailInvList = [];
        this._loaderService.display(true);
        this._dataService.getData("Accounts/TDS26AS_GetDetail", { DEDID: row.PK_DEDID })
            .subscribe((data: any) => {
                this.detailList = data.Table || [];
                this.detailInvList = data.Table1 || [];
                this.showModal_Detail = true;
                this._loaderService.display(false);
            },
                (error: any) => { this._loaderService.display(false); });
    }

    closeDetail() {
        this.showModal_Detail = false;
        this.detailDeductor = null;
    }

    saveMapping(row: any) {
        if (!row.selExp) {
            alert('Select the client this deductor belongs to first.');
            return false;
        }
        this._loaderService.display(true);
        const jsonmap = {
            TAN: row.TAN,
            EXPCODE: row.selExp,
            CMPID: this._loginService.getLogin()[0].CMPID
        };
        this._dataService.getData("Accounts/TDS26AS_SaveMapping", jsonmap)
            .subscribe((data: any) => {
                this._loaderService.display(false);
                if (data && data.Table && data.Table.length > 0 && data.Table[0].STATUS == "100") {
                    // refresh so FY invoiced totals appear for the newly mapped client
                    this.loadSummary(this.logid);
                }
                else {
                    alert((data && data.Table && data.Table.length > 0) ? data.Table[0].MSG : 'Could not save the mapping.');
                }
            },
                (error: any) => { this._loaderService.display(false); });
    }

    uploadNew() {
        this.displayType = 'SEARCH';
    }

    clearStatement() {
        if (!confirm('Clear the uploaded 26AS statement from the system?\n\n'
            + 'All parsed deductors and transactions of this statement will be deleted.\n'
            + 'Your saved TAN-to-client mappings are kept, and you can upload the statement again anytime.')) {
            return false;
        }
        this._loaderService.display(true);
        this._dataService.getData("Accounts/TDS26AS_ClearStatement", { LOGID: this.logid })
            .subscribe((data: any) => {
                this._loaderService.display(false);
                if (data && data.Table && data.Table.length > 0 && data.Table[0].STATUS == "100") {
                    alert(data.Table[0].MSG);
                    this.summaryList = [];
                    this.clientList = [];
                    this.batchInfo = null;
                    this.logid = "0";
                    this.totAmtCredited = 0; this.totTdsDeposited = 0; this.totInvoiced = 0;
                    this.displayType = 'SEARCH';
                }
                else {
                    alert((data && data.Table && data.Table.length > 0) ? data.Table[0].MSG : 'Could not clear the statement.');
                }
            },
                (error: any) => { this._loaderService.display(false); });
    }

    // Bundled help page (src/assets/help) - ships with the app, works offline.
    openGuide() {
        window.open('assets/help/tds26as-guide.html', '_blank');
    }

    Exporttoxl() {
        if (this.summaryList.length == 0) {
            alert('Nothing to export');
            return false;
        }
        this._exportService.export(this.batchInfo, this.filteredList, this.activeTab,
            'TDS26AS_Reconciliation_' + (this.batchInfo ? this.batchInfo.FINYEAR : ''));
    }
}
