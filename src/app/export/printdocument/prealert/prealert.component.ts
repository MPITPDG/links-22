import { Component, OnInit, OnChanges, ElementRef, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { DataService } from '../../../shared/service/dataService';
import { AuthService } from '../../../shared/service/authService';
import { Router } from '@angular/router';
import { LoginService } from '../../../shared/service/loginService';
import { ToastCommonService } from '../../../shared/service/toastService';
//import { markViewDirty } from '@angular/core/src/render3/instructions';
import { prealertshareservice, SharedDataSerice } from '../../export-share-data.service';
import { LoaderService } from '../../../shared/service/loader.service';
@Component({

    selector: 'app-export-prealert-prepare',
    templateUrl: 'prealert.prepare.component.html',
    styleUrls: ['prealert-page.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class PreAlertPrepareComponent implements OnChanges {
    @Input() searchList: any = [];
    @Input() searchListLength: number = 0;
    @Output() result: EventEmitter<any> = new EventEmitter<any>();
    MAWBNO : string="";
    REMARK: string="NOTE:- ORIGINAL GSP IS ATTACHED IN DESTINATION POUCH WITH MAWB";
    
    constructor() { }

    ngOnChanges() {
        for (let i = 0; i < this.searchList.length; i++) {
            this.searchList[i]["REMARK"] = "NOTE:- ORIGINAL GSP IS ATTACHED IN DESTINATION POUCH WITH MAWB";
            this.searchList[i]["ISDISABLED"] = false;
        }
    }

    previewClick() {
        let data = { MAWBNO: this.MAWBNO, REMARK: this.REMARK };
        this.result.emit(data);
    }
}

@Component({
    selector: 'app-export-prealert-auto',
    templateUrl: 'prealert.auto.component.html',
    styleUrls: ['prealert-page.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class PreAlertAutoComponent implements OnChanges {
    @Input() searchList: any = [];
    @Input() searchListLength: number = 0;
    @Output() result: EventEmitter<any> = new EventEmitter<any>();

    // ---------- additive (from MPERPNG-20): client-side filter + pagination (presentation only, no API change) ----------
    readonly autoPageSize = 10;
    filterText: string = '';
    autoPage: number = 1;
    constructor(
        private _toasterService: ToastCommonService,
        private _mawbnoshrd : prealertshareservice
    ) { }

    ngOnChanges() {
        for (let i = 0; i < this.searchList.length; i++) {
            this.searchList[i]["CITY"] = null;
            this.searchList[i]["ISDISABLED"] = false;
        }
        this.autoPage = 1;
    }

    autoClick(mawbno, city) {
        if (city == null) {
            this._toasterService.toast('error', 'Error', "PLEASE SELECT THE CITY WHERE YOU WANT TO SEND THE PREALERT !");
        } else {
            let answer = confirm("Are you sure you want to generate Prealert?")
            if (answer) {
                let data = { MAWBNO: mawbno, CITYCODE: city };
                this.result.emit(data);
            }
        }
    }

    get filteredList(): any[] {
        const q = (this.filterText || '').trim().toLowerCase();
        const list = this.searchList || [];
        if (!q) { return list; }
        return list.filter((r: any) =>
            String(r.MAWBNO || '').toLowerCase().indexOf(q) >= 0 ||
            String(r.HOUSEBILLNO || '').toLowerCase().indexOf(q) >= 0 ||
            String(r.CONS_NAME || '').toLowerCase().indexOf(q) >= 0 ||
            String(r.EXPTNO || '').toLowerCase().indexOf(q) >= 0);
    }

    get autoPageCount(): number {
        return Math.max(1, Math.ceil(this.filteredList.length / this.autoPageSize));
    }

    get autoPageRows(): any[] {
        const start = (this.autoPage - 1) * this.autoPageSize;
        return this.filteredList.slice(start, start + this.autoPageSize);
    }

    get autoRangeStart(): number {
        return this.filteredList.length ? (this.autoPage - 1) * this.autoPageSize + 1 : 0;
    }

    get autoRangeEnd(): number {
        return Math.min(this.autoPage * this.autoPageSize, this.filteredList.length);
    }

    get autoPageList(): number[] {
        const n = this.autoPageCount, p = this.autoPage;
        if (n <= 7) { return Array.from({ length: n }, (_, i) => i + 1); }
        const out: number[] = [1];
        const lo = Math.max(2, p - 1), hi = Math.min(n - 1, p + 1);
        if (lo > 2) { out.push(0); }
        for (let i = lo; i <= hi; i++) { out.push(i); }
        if (hi < n - 1) { out.push(0); }
        out.push(n);
        return out;
    }

    goAutoPage(p: number) {
        if (p >= 1 && p <= this.autoPageCount) { this.autoPage = p; }
    }

    exportAutoCsv() {
        const head = ['City', 'MAWB No', 'MAWB DT.', 'ETD', 'ETA', 'HAWB No.', 'HAWB DT.', 'Ex-Jobno.', 'No of Pkgs', 'GRWT', 'CBM', 'Consignee', 'Flight Details', 'MAWB FRT', 'Invoice Type', 'MAWBDEST'];
        const rows = this.filteredList.map((r: any) => [r.CITY, r.MAWBNO, r.AEROBILLDT, r.ETD, r.ETA, r.HOUSEBILLNO, r.HOUSEBILLDT, r.EXPTNO,
            r.EXPT_NOOFPGS, r.EXPT_GRWT, r.EXPT_VOLUME, r.CONS_NAME, r.FLIGHTDET, r.MAWBFRT, r.EXPT_INVTYPE, r.MAWBDEST]);
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
        a.download = 'prealert-auto-' + stamp + '.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 0);
    }
}

@Component({
    selector: 'app-export-prealert-sending-through',
    templateUrl: 'prealert.sending.through.expt.component.html',
    styleUrls: ['prealert-page.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class PreAlertPrepareSendingThroughComponent implements OnInit,OnChanges {
    @Input() Mawbno: any = null;
    @Output() result: EventEmitter<any> = new EventEmitter<any>();
    setLoader: number = 0;
    consoleList: any = [];
    jobList: any = [];
    orderList: any = [];
   // @Output() results: EventEmitter<any> = new EventEmitter<any>();

    constructor(
        private _dataService: DataService,
        private _toasterService: ToastCommonService,
        private _loginService: LoginService,
        private _mawbnoshrd :prealertshareservice) { }

    ngOnInit() {
           this.setSendingData();
        //this.getSendingViewData();
        

    }

    ngOnChanges() { }

    getSendingViewData() {
      //  console.log(this.result.Mawbno)
        const _jsonData = {
            Type1:this._mawbnoshrd.mawbnoshrd,//'15732327422'
        };
        this._dataService.getData("Export/PrintDocumentPrealertSendingView", _jsonData)
            .subscribe((data: any) => {
                this.setLoader = 3;
                this.consoleList = (data && data.Table1) ? data.Table1 : [];
                this.jobList = (data && data.Table2) ? data.Table2 : [];
                this.orderList = (data && data.Table3) ? data.Table3 : [];
            });
    }

    setSendingData ()   {
        
        const _jsonData = {
            Type1: this._mawbnoshrd.mawbnoshrd,// '15732327422',
            Type2: this._loginService.getLogin()[0].CITYCODE,
            Type3: this._loginService.getLogin()[0].CMP_USERNAME,
            Type4: this._loginService.getLogin()[0].CMP_USERNAME  //Change later by Router Ip
        };
        this._dataService.Common("Export/PrintDocumentPrealertSending", _jsonData)
            .subscribe((data: any) => {
                if (data && data.Table && data.Table[0] && data.Table[0].status == 100) {
                    this.setLoader = 1;
                    this.getSendingViewData();
                } else {
                    this.setLoader = 2;
                }
            });
    }

    exitClick() {
        this.result.emit(true);
    }
}

@Component({
    templateUrl: 'prealert.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class PreAlertComponent implements OnInit {
    viewType: string = '';
    rights: number = null;
    searchList: any = [];
    searchListLength: number = 0;
    mawb :any [];
    @Output() result: EventEmitter<any> = new EventEmitter<any>();

    constructor(
        private _router: Router,
        private _dataService: DataService,
        private _auth: AuthService,
        private _toasterService: ToastCommonService,
        private _loginService: LoginService,
        private _mawbnoshrd :prealertshareservice,
        private _loaderService: LoaderService,) { }

    ngOnInit() {
        let pageType = /prepare/gi;
        let curUrl = this._router.url;
        if (curUrl.search(pageType) != -1) {
            this.viewType = 'Prepare';
            this.rights = 349;
        }
        else {
            this.viewType = 'Auto';
            this.rights = 350;
            this._loginService.verifyRights(this.rights, '')
            .subscribe((data: any) => {
                this._loginService.checkVerify('View', data);  //For verify user access
                this.getData('air');
            });
        }
     
        //this.viewType = 'Sending';
    }

    getData(mode) {
        const _jsonData = {
            Type1: this._loginService.getLogin()[0].CITYCODE,
            Type2: mode,
            Type3: this._loginService.getLogin()[0].CMPCODE
        };
        this._dataService.getData("Export/PrintDocumentPrealertPageload", _jsonData)
            .subscribe((data: any) => {
                const rows = (data && data.Table) ? data.Table : [];
                this.searchListLength = (rows.length == 0)? -1 : -2;
                this.searchList = rows;
            });
    }

    EnableDisablePrealertButton(mawbno, isdisabled) {
        let updateItem = (this.searchList || []).find(item => item.MAWBNO === mawbno);
        if (!updateItem) { return; }
        let index = this.searchList.indexOf(updateItem);
        this.searchList[index]["ISDISABLED"] = isdisabled;
    }

    PrealertPrepare(prepareData: any) {
 
        this._loaderService.display(true);
       // this.EnableDisablePrealertButton(prepareData.MAWBNO, true);
        const _jsonData = {
            Type1: prepareData.MAWBNO,
            Type2: prepareData.REMARK
        };
        let filename ="PREALERT_" +prepareData.MAWBNO +".doc"
        this._dataService.getDownload("Export/PrintDocumentPrealertPrepare_word", _jsonData,{responseType:'arraybuffer'})
        .subscribe((data: any) => {
            this._dataService.common_downloadDocFileByUrl(data,filename);            
            this._loaderService.display(false);
           
        },
        (error) => {
            // From MPERPNG-20: a failed download must not leave the app-wide loader spinning.
            this._loaderService.display(false);
            this._toasterService.toast('error', 'Error', 'Unable to prepare Pre-Alert. Please check the MAWB No. and try again.');
        });

        // this._dataService.Common("Export/PrintDocumentPrealertPrepare", _jsonData)
        //     .subscribe((data: any) => {
        //         this.EnableDisablePrealertButton(prepareData.MAWBNO, false);
        //         let items = '';
        //         let msg = '';
        //         items = data.Table[0].STATUS.split("#")[0];
        //         msg = data.Table[0].STATUS.split("#")[1];

        //         if (items == "101") {
        //             alert("Session Time Out! Please Re-Login.");
        //         }
        //         else if (items == "102") {
        //             alert('Error! Please contact System Administrator.');
        //         }
        //         else if (items == "100") {
        //             var openWin = window.open("about:blank", "_blank");
        //             if (!openWin) {
        //                 alert("A popup blocker was detected. Please Remove popupblocker for this site");
        //             } else {
        //                 openWin.close();
        //                 window.open(msg, "_blank");
        //             }
        //         }
        //     });
    }

    EnableDisableAutoButton(mawbno, isdisabled) {
        let updateItem = (this.searchList || []).find(item => item.MAWBNO === mawbno);
        if (!updateItem) { return; }
        let index = this.searchList.indexOf(updateItem);
        this.searchList[index]["ISDISABLED"] = isdisabled;
    }

    AutoPrealert(autoData: any) {
        this._loaderService.display(true);
        this.EnableDisableAutoButton(autoData.MAWBNO, true);
        const _jsonData = {
            Type1: autoData.MAWBNO,
            Type2: autoData.CITYCODE,
            Type3: this._loginService.getLogin()[0].CMP_USERNAME,
            Type4: this._loginService.getLogin()[0].CMPID
        };
        this._dataService.Common("Export/PrintDocumentPrealertAuto", _jsonData)
            .subscribe((data: any) => {
                this.EnableDisableAutoButton(autoData.MAWBNO, false);
                if (!data || !data.Table || !data.Table[0]) {
                    this._toasterService.toast('error', 'Error', "Please contact System Administrator");
                    this._loaderService.display(false);
                    return;
                }
                let items = '';
                let msg = '';
                items = data.Table[0].STATUS;
                msg = data.Table[0].STATUS;

                if (items == "101") {
                    this._toasterService.toast('error', 'Error', "HAWB No. is not Entered.");
                    this._loaderService.display(false);
                }
                else if (items == "102") {
                    var concode = data.Table[0].CON_NAME;
                    this._toasterService.toast('error', 'Error', concode + 'These clients have not been added in client master \n Pleast contact administrator.');
                    this._loaderService.display(false);
                }
                else if (items == '103') {
                    this._toasterService.toast('error', 'Error', 'CONSOLIDATION IS ALREADY DONE FOR MAWB ' + data.MAWBNO);
                    this._loaderService.display(false);
                }
                else if (items == '104') {
                    this._toasterService.toast('error', 'Error', 'CHARGABLE WT IS NOT ENTERD FOR THIS MAWBNO  ' + data.MAWBNO);
                    this._loaderService.display(false);
                }
                else if (items == '105') {
                    this._toasterService.toast('error', 'Error', 'NET RATE IS NOT ENTERD FOR THIS MAWBNO ' + data.MAWBNO);
                    this._loaderService.display(false);
                }
                else if (items == '109') {
                    var EXPTNO_CUS = data.Table[0].EXPTNO_CUS;
                    this._toasterService.toast('error', 'Error', 'CUSTOM DATE IS NOT ENTERED ' + EXPTNO_CUS);
                    this._loaderService.display(false);
                }
                else if (items == '110') {
                    var EXPTNO_CUS = data.Table[0].EXPTNO;
                    this._toasterService.toast('error', 'Error', 'APPROVAL DATE MISSING  ' + EXPTNO_CUS);
                    this._loaderService.display(false);
                }
                else if (items == '111') {
                    var EXPTNO_CUS = data.Table[0].EXPTNO;
                    this._toasterService.toast('error', 'Error', "ETA SHOULD BE GRATER THAN ETD");
                    this._loaderService.display(false);
                }
                else if (items == "100") {
                    this._toasterService.toast('success', 'Message', "Console is generated Successfully ,Console No."+ data.Table[0].CONSOLENO.substring(4,14));
                    this._loaderService.display(false);
                    this.viewType = 'Sending';
                     this._mawbnoshrd.mawbnoshrd= autoData.MAWBNO;
                     // let mawb ={ MAWBNO : autoData.MAWBNO}
                    // this.result.emit(mawb);
                }
                else {
                    this._toasterService.toast('error', 'Error', "Please contact System Administrator");
                    this._loaderService.display(false);
                }
            },
            (error) => {
                // From MPERPNG-20: an HTTP failure must not leave the app-wide loader spinning.
                this.EnableDisableAutoButton(autoData.MAWBNO, false);
                this._loaderService.display(false);
                this._toasterService.toast('error', 'Error', "Please contact System Administrator");
            });
    }

    ExitPrealert(event:boolean) {
        this.viewType = 'Auto';
        this.searchList = [];
        this.searchListLength = 0;
        this.getData('air');
    }

}