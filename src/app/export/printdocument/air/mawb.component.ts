import { Component, OnInit, OnChanges, ViewChild, ElementRef, Input, Output, EventEmitter } from '@angular/core';
import { DataService } from '../../../shared/service/dataService';
import { AuthService } from '../../../shared/service/authService';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastCommonService } from '../../../shared/service/toastService';
import { LoginService } from '../../../shared/service/loginService';
import { IMyDpOptions } from 'mydatepicker';
import { LoaderService } from '../../../shared/service/loader.service';
import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';
@Component({
    selector: 'app-print-air-mawb-list',
    templateUrl: 'mawb.list.component.html'
})
export class PrintDocumentMawbListComponent implements OnChanges {
    //this._dataService.stringdttoArry(data.Table[0].CARTEDDT); set Date
    //(this.cartingdt != null) ? this.cartingdt.formatted : ""; get Date
    @Input() searchList: any = [];
    @Output() result: EventEmitter<any> = new EventEmitter<any>();

    constructor(
        private _loaderService: LoaderService) {
        this.searchList = this.searchList;
    }

    ngOnChanges() { }

    submit() {
        let count = 0;
        for (let i = 0; i < this.searchList.length; i++) {
            if (this.searchList[i].SELECT == true){
                count++;
            }
        }
        if (count === 0) {
            alert('Select atleast one export no !!');
            return false;
        }
        this._loaderService.display(true);
        this.result.emit(this.searchList);
        this._loaderService.display(false);
    }


    validate(Mode,exptno) {
        for (let i = 0; i < this.searchList.length; i++) {
            if (this.searchList[i].MODEOFSHIP === Mode ) {
                this.searchList[i]["Disabled"] = false;
            } else {
                this.searchList[i]["Disabled"] = true;
            }
            if (this.searchList[i].MODEOFSHIP === Mode && this.searchList[i].EXPTNO === exptno ) {
                if (this.searchList[i]["SELECT"] === true) {
                    this.searchList[i]["SELECT"] = false;
                } else {
                    this.searchList[i]["SELECT"] = true;
                    this.searchList[i]["Disabled"] = false;
                }
            }
        }
        let tempList = 0;
        tempList = this.searchList.filter((searchlist: any) => searchlist.SELECT === false).length;
        if (tempList === this.searchList.length) {
            for (let i = 0; i < this.searchList.length; i++) {
                this.searchList[i]["SELECT"] = false;
                this.searchList[i]["Disabled"] = false;
            }
        }
    }
}


@Component({
    selector: 'app-print-air-mawb-update',
    templateUrl: 'mawb.update.component.html'
})
export class PrintDocumentMawbUpdateComponents implements OnChanges {
    @Input() mawbno;
    @Input() mawbdate: any = null;;
    @Input() exptnos;
    @Input() MawbType;
    @Input() AirLine;
    @Output() result: EventEmitter<any> = new EventEmitter<any>();
    @Output() abort: EventEmitter<any> = new EventEmitter<any>();

    currencyList: any = [];
    destinationList: any = [];
    mawbnoList: any = [];
    FreightType: any = null;
    Fcurrency: any = null;
    FreightAmount: any = 0;
    ShipType: any = '0';
    ShipDest: any = '0';
    totalGrwt: any = 0;
    totalChblwt: any = 0;

    constructor(
        private _router: Router,
        private _dataService: DataService,
        private _auth: AuthService,
        private _toasterService: ToastCommonService,
        private _loginService: LoginService,
        private _loaderService: LoaderService
    ) {
        // this.mawbno = this.mawbno;
        // this.mawbdate = this.mawbdate;
        // this.exptnos = this.exptnos;
        // this.MawbType=this.MawbType;
        // this.AirLine=this.AirLine;
    }

    ngOnChanges() {
        this.mawbno = (this.mawbno != undefined || this.mawbno != '') ? this.mawbno : '';
        this.mawbdate = (this.mawbdate == undefined || this.mawbdate == '' || this.mawbdate == null) ? null : this.mawbdate //this._dataService.stringdttoArry(this.mawbdate);
        this.exptnos = this.exptnos;

        this.pageLoad(this.exptnos, this.mawbno);
        console.log(this.MawbType);
    }

    pageLoad(exptno, mawbno) {
        this._loaderService.display(true);
        alert('mawb page load');
        const _jsonData = {
            Type1: exptno,
            Type2: mawbno,
            Type3: this._loginService.getLogin()[0].CITYCODE
        };
        let totalchwt =0
        this._dataService.getData("Export/PrintDocumentAirMawbUpdatePageload", _jsonData)
            .subscribe((data: any) => {
                this._loaderService.display(false);
                this.currencyList = data.Table;
                this.destinationList = data.Table1;
                this.mawbnoList = data.Table2;
                if (this.mawbnoList.length > 0) {
                    for (let i=0; i < this.mawbnoList.length; i++) {
                        this.totalGrwt += this.mawbnoList[i].GRWT;
                        totalchwt += this.mawbnoList[i].CHBLWT;
                    }
                }

                this.totalChblwt=   Math.round(totalchwt * 100) / 100;
                this.FreightType = this.mawbnoList[0].FRT_TYPE;
                this.Fcurrency = this.mawbnoList[0].FRT_CUR;
                this.ShipType = (this.mawbnoList[0].IsDDX == 0)? '0' : '1';
                this.ShipDest = this.mawbnoList[0].DdxDestWhId;
                this.FreightAmount = this.mawbnoList[0].FRT_AMT;
            });
    }

    submit() {
        this._loaderService.display(true);
        const _jsonData = {
            MAWBNO: this.mawbno,
            MAWBDT: this.mawbdate,
            EXPTNO: this.exptnos,
            GRWT: this.totalGrwt,
            CHBL_WT: this.totalChblwt,
            FRT_TYPE: (this.FreightType != null) ? this.FreightType : '0',
            FRT_CUR: (this.Fcurrency != null) ? this.Fcurrency : '0',
            FRT_AMT: (this.FreightAmount == '') ? this.FreightAmount : '0',
            CityCode: this._loginService.getLogin()[0].CITYCODE,
            CmpId: this._loginService.getLogin()[0].CMPID,
            CmpCode: this._loginService.getLogin()[0].CMPCODE,
            ISDDX: (this.ShipType != null) ? this.ShipType : '0',
            DDXWAREHSE: (this.ShipType != null && this.ShipType == '1') ? ((this.ShipDest != null) ? this.ShipDest : '0') : '0',
            MAWBTYPE:this.MawbType,
            AIRLINE:this.AirLine,
            MAKERIP:this._loginService.getLogin()[0].MAKERIP
        };
        this._dataService.Common("Export/PrintDocumentAirMawbUpdateIU", _jsonData)
            .subscribe((data: any) => {
                this._loaderService.display(false);
                alert("MAWBNO Details saved successfully !");
               // this.result.emit(true);
               //print-document/air/air-Mawbprint-update/:param
               this._router.navigate(['/export/print-document/air/air-Mawbprint-update', this.mawbno]);
            });
    }

    cancel() {
        this.abort.emit(true);
    }

    ddx_Onchange(ddxType) {
        this.ShipDest = null;
    }

}

@Component({
    templateUrl: 'mawb.component.html'
})
export class PrintDocumentMawbComponent implements OnInit {
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
        selectorHeight: '180px',
        selectorWidth: '200px'
    };
    //pageType: string = '';
    viewType: string = 'Update';
    searchList: any = [];
    exptnos: any = '';
    mawbno: any = '0';
    mawbdate: any = null;
    strMawbDate: any = '';
    error: number = null;
    AirLine:string="0";
    AirLineMawbNoList: any = [];
    AirLineList: any = [];
    MawbType:string="M";
    Airmawbno:any;
    searchLength: any = 0;
    AllMawbNoList: any = [];
    constructor(
        private _router: Router,
        private _activatedRoute: ActivatedRoute,
        private _dataService: DataService,
        private _auth: AuthService,
        private _toasterService: ToastCommonService,
        private _loginService: LoginService,
        private _loaderService: LoaderService) { }

    ngOnInit() {
        //let obj = this._activatedRoute.snapshot.queryParams;
        //if (obj.type !== undefined || obj.type !== '') {
        //    this.pageType = obj.type;
        //} else {
        //    this.pageType = 'search';
        //}
        this._loginService.verifyRights(373, '')
            .subscribe((data: any) => {
                this._loginService.checkVerify('Modify', data);  //For verify user access
            });

            const _jsonData = {
                CITYCODE:this._loginService.getLogin()[0].CITYCODE1,
                CMPCODE:this._loginService.getLogin()[0].CMPCODE
            }
            this._dataService.getData("Export/EXP_MAWB_STOCK_PAGELOAD",_jsonData)
            .subscribe((data: any) => {
                this.AirLineList=data.Table1;
                this.AllMawbNoList=data.Table3
            });

            let pageType = /number/gi;
        let curUrl = this._router.url;
        if (curUrl.search(pageType) == -1) {
            this.viewType = 'Search';
        }
        else {
            this.viewType = 'Generate';
            //this.getSearchData("");
        }

    }
    getmwawblist(alcd)
    {
        this.AirLineMawbNoList= this.AllMawbNoList .filter((code: any) => code.AIRLINE_CD === alcd);
    }
    fn_generateLastMawbNo(cnt){
        if( this.Airmawbno.length==11){
            let  remainder=0;
            let chklastdigit=0;
            let extractno ;
            extractno  =this.Airmawbno.substr(3,8)

            for (let i = 0; i < cnt; i++) {
                chklastdigit=extractno.toString().slice(-1)
                if(chklastdigit==6){
                    extractno =parseInt(extractno)+4;
                }
                else{
                    extractno =parseInt(extractno)+11;
                }
                console.log(extractno)
            }
            this.Airmawbno= extractno
        }
    }
    searchData() {
        if(this.AirLine=="" || this.AirLine==undefined || this.AirLine=="0"){
            this.error = 1;
            return false;
        }
        else if (this.mawbno == "0") {
            this.error = 2;
            return false;
        }
        // else if (this.mawbno.length != 11) {
        //     this.error = 3;
        //     return false;}
        else if (this.mawbdate == null) {
            this.error = 4;
            return false;
        } else {
            this.error = null;
            this.strMawbDate = this.mawbdate.formatted;
            this.getSearchData(this.mawbno);
        }
    }
    fn_validateMawbNo(){
     if( this.Airmawbno.length==8){
     let  remainder=0;
     let chklastdigit=0;
     let extractno =0;
     extractno  =this.Airmawbno.substr(3,7)
     remainder=(extractno % 7) //(extractno - 7 * extractno / 7)
       chklastdigit=this.Airmawbno.slice(-1)//no.substr(11,1)
        if(remainder!=chklastdigit){
            this._toasterService.toast("warning","warning","GIVEN MAWB NO IS NOT VALID ");
            this.Airmawbno="";
            this.Airmawbno.focus();
            return false;
        }
    }
    }
    getSearchInputValue(data: any) {
        this.mawbno = data.mawbno;
        this.strMawbDate = data.mawbdate;
        this.exptnos = '';
        this.viewType = 'Update';
    }
    printData() {
        //this._router.navigate(['export/print-document/air/air-Mawbprint',this.mawbno]);
        this._router.navigate(['/export/print-document/air/air-Mawbprint-update', this.mawbno]);
    }

    getSearchData(mawbnum) {
        this._loaderService.display(true);
        const _jsonData = {
            Type1: mawbnum,
            Type2: this._loginService.getLogin()[0].CITYCODE,
            Type3: this._loginService.getLogin()[0].CMPCODE
        };
        this._dataService.getData("Export/PrintDocumentAirMawbList", _jsonData)
            .subscribe((data: any) => {
                this._loaderService.display(false);
                if (data.Table.length > 0) {
                    if (data.Table[0].STATUS == 100) {
                        this.viewType = 'List';
                        this.searchList = data.Table;
                       // this.searchLength = (this.searchList.length > 0) ? 1 : -1;
                        for (let i = 0; i < this.searchList.length; i++) {
                            this.searchList[i]["SELECT"] = false;
                            this.searchList[i]["Disabled"] = false;
                        }

                    } else if (data.Table[0].STATUS == 102){
                        this.exptnos = '';
                        this.viewType = 'Update';
                    } else {
                       // alert('MAWBNO already exists');
                       this._toasterService.toast("warning","warning",data.Table[0].STATUSTXT);
                    }
                } else {
                    alert('No record found');
                }
            });
    }
    getData(data: any) {
        this.searchList = data;
        let strExptno = '';
        for (let i = 0; i < this.searchList.length; i++) {
            if (this.searchList[i].SELECT == true) {
                strExptno += this.searchList[i].EXPTNO + ',';
            }
        }
        this.exptnos = strExptno;
        this.viewType = 'Update';
    }

    getPrintData(event) {
        if (event) {
            this.viewType = 'Search';
        }
    }

    cancelled(event) {
        this.viewType = "Search";
    }

}
@Component({
    selector: 'app-mawb-search',
    templateUrl: 'mawb.search.component.html'
})
export class PrintDocumentMawbSearchComponent implements OnChanges {
    @Output() searchoutput: EventEmitter<any> = new EventEmitter<any>();
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
        selectorHeight: '180px',
        selectorWidth: '200px'
    };
    //pageType: string = '';
    viewType: string = 'Search';
    searchList: any = [];
    exptnos: any = '';
    mawbno: any = '0';
    mawbdate: any = null;
    strMawbDate: any = '';
    error: number = null;
    Airmawbno:any
    AirLineList: any = [];
    AirLine:string="";
    constructor(
        private _router: Router,
        private _activatedRoute: ActivatedRoute,
        private _dataService: DataService,
        private _auth: AuthService,
        private _toasterService: ToastCommonService,
        private _loginService: LoginService,
        private _loaderService: LoaderService) { }

    ngOnInit() {
        //let obj = this._activatedRoute.snapshot.queryParams;
        //if (obj.type !== undefined || obj.type !== '') {
        //    this.pageType = obj.type;
        //} else {
        //    this.pageType = 'search';
        //}
        this._loginService.verifyRights(373, '')
            .subscribe((data: any) => {
                this._loginService.checkVerify('Modify', data);  //For verify user access
            });
            const _jsonData = {
                CITYCODE:this._loginService.getLogin()[0].CITYCODE,
                CMPCODE:this._loginService.getLogin()[0].CMPCODE
            }
            this._dataService.getData("Export/EXP_MAWB_STOCK_PAGELOAD",_jsonData)
            .subscribe((data: any) => {
                this.AirLineList=data.Table1;
            });
    }
    ngOnChanges() { }
    searchData() {

       if(this.AirLine==""){
        this.error = 1;
        return false;
       }
       else if (this.mawbno == "0") {
            this.error = 2;
            return false;
        }
        else if (this.mawbno.length != 11) {
            this.error = 3;
            return false;
        // } else if  (!this.mawbdate) {//(this.mawbdate == null) {
        //     this.error = 4;
        //     return false;
        } else {
            this.error = null;
            this.strMawbDate = this.mawbdate.formatted;
            this.searchoutput.emit({ mawbno: this.mawbno, mawbdate: this.strMawbDate });
            //this.getSearchData(this.mawbno);
        }
    }
    fn_validateMawbNo(){
     if( this.Airmawbno.length==11){
     let  remainder=0;
     let chklastdigit=0;
     let extractno =0;
     extractno  =this.Airmawbno.substr(3,7)
     remainder=(extractno % 7) //(extractno - 7 * extractno / 7)
       chklastdigit=this.Airmawbno.slice(-1)//no.substr(11,1)
        if(remainder!=chklastdigit){
            this._toasterService.toast("warning","warning","GIVEN MAWB NO IS NOT VALID ");
            this.Airmawbno="";
            return false;
        }
    }
    }
    fn_generateLastMawbNo(cnt){
        if( this.Airmawbno.length==11){
            let  remainder=0;
            let chklastdigit=0;
            let extractno ;
            extractno  =this.Airmawbno.substr(3,8)
            chklastdigit=extractno.slice(-1)
            for (let i = 0; i < cnt; i++) {
                if(chklastdigit==4){
                    extractno  =extractno+6;
                }
                else{
                    extractno  =extractno+11;
                }
                console.log(extractno)
            }

        }
    }
    printData() {
        //this._router.navigate(['export/print-document/air/air-Mawbprint',this.mawbno]);
        this._router.navigate(['/export/print-document/air/air-Mawbprint-update', this.mawbno]);
    }

    getSearchData(mawbnum) {
        this._loaderService.display(true);
        const _jsonData = {
            Type1: mawbnum,
            Type2: this._loginService.getLogin()[0].CITYCODE,
            Type3: this._loginService.getLogin()[0].CMPCODE
        };
        this._dataService.getData("Export/PrintDocumentAirMawbList", _jsonData)
            .subscribe((data: any) => {
                this._loaderService.display(false);
                if (data.Table.length > 0) {
                    if (data.Table[0].STATUS == 100) {
                        this.viewType = 'List';
                        this.searchList = data.Table;
                       // this.searchLength = (this.searchList.length > 0) ? 1 : -1;
                        for (let i = 0; i < this.searchList.length; i++) {
                            this.searchList[i]["SELECT"] = false;
                            this.searchList[i]["Disabled"] = false;
                        }

                    } else if (data.Table[0].STATUS == 102){
                        this.exptnos = '';
                        this.viewType = 'Update';
                    } else {
                       // alert('MAWBNO already exists');
                       this._toasterService.toast("warning","warning",data.Table[0].STATUSTXT);
                    }
                } else {
                    alert('No record found');
                }
            });
    }
    getData(data: any) {
        this.searchList = data;
        let strExptno = '';
        for (let i = 0; i < this.searchList.length; i++) {
            if (this.searchList[i].SELECT == true) {
                strExptno += this.searchList[i].EXPTNO + ',';
            }
        }
        this.exptnos = strExptno;
        this.viewType = 'Update';
    }

    getPrintData(event) {
        if (event) {
            this.viewType = 'Search';
        }
    }
    cancelled(event) {
        this.viewType = "Search";
    }

}




