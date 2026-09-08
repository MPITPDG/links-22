import { Component, OnInit, OnChanges, ElementRef, Input, Output, EventEmitter } from '@angular/core';
import { DataService } from '../../../shared/service/dataService';
import { AuthService } from '../../../shared/service/authService';
import { Router } from '@angular/router';
import { LoginService } from '../../../shared/service/loginService';
import { ToastCommonService } from '../../../shared/service/toastService';
//import { markViewDirty } from '@angular/core/src/render3/instructions';
import { analyzeAndValidateNgModules } from '@angular/compiler';
import { prealertshareservice, SharedDataSerice } from '../../export-share-data.service';
import { LoaderService } from '../../../shared/service/loader.service';
@Component({

    selector: 'app-export-prealert-prepare',
    templateUrl: 'prealert.prepare.component.html'
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
    templateUrl: 'prealert.auto.component.html'
})
export class PreAlertAutoComponent implements OnChanges {
    @Input() searchList: any = [];
    @Input() searchListLength: number = 0;
    @Output() result: EventEmitter<any> = new EventEmitter<any>();
    constructor(
        private _toasterService: ToastCommonService,
        private _mawbnoshrd : prealertshareservice
    ) { }

    ngOnChanges() {
        for (let i = 0; i < this.searchList.length; i++) {
            this.searchList[i]["CITY"] = null;
            this.searchList[i]["ISDISABLED"] = false;
        }
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
}

@Component({
    selector: 'app-export-prealert-sending-through',
    templateUrl: 'prealert.sending.through.expt.component.html'
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
                this.consoleList = data.Table1;
                this.jobList = data.Table2;
                this.orderList = data.Table3;
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
                if (data.Table[0].status == 100) {
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
    templateUrl: 'prealert.component.html'
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
                this.searchListLength = (data.Table.length == 0)? -1 : -2;
                this.searchList = data.Table;
            });
    }

    EnableDisablePrealertButton(mawbno, isdisabled) {
        let updateItem = this.searchList.find(item => item.MAWBNO === mawbno);
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
        let updateItem = this.searchList.find(item => item.MAWBNO === mawbno);
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
            });
    }

    ExitPrealert(event:boolean) {
        this.viewType = 'Auto';
        this.searchList = [];
        this.searchListLength = 0;
        this.getData('air');
    }

}