import { Component, OnInit, OnChanges, Input, Output, EventEmitter } from '@angular/core';
import { DataService } from '../../../shared/service/dataService';
import { AuthService } from '../../../shared/service/authService';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastCommonService } from '../../../shared/service/toastService';
import { LoginService } from '../../../shared/service/loginService';
import { IMyDpOptions } from 'mydatepicker';
import { LoaderService } from '../../../shared/service/loader.service';
import { environment } from '../../../../environments/environment'; //'../../../environments/environment';

@Component({
    selector: 'app-print-air-hawb-list',
    templateUrl: 'hawb.list.component.html'
})
export class PrintDocumentHawbListComponent implements OnChanges {
    //this._dataService.stringdttoArry(data.Table[0].CARTEDDT); set Date
    //(this.cartingdt != null) ? this.cartingdt.formatted : ""; get Date
    @Input() hawbno: any = null;
    @Input() searchList: any = [];
    @Output() result: EventEmitter<any> = new EventEmitter<any>();
    disableCheckbox: boolean = false;
    error: string = null;
    @Input() searchLength: any;
    constructor(
        private _dataService: DataService,
        private _loginService: LoginService,
        private _loaderService: LoaderService,

    ) {
        this.searchList = this.searchList;
    }



    ngOnChanges() { }

    validate(exptno, exporter, importer) {
        for (let i = 0; i < this.searchList.length; i++) {
            if (this.searchList[i].SHIPPER === exporter && this.searchList[i].CONSIGNEE === importer) {
                this.searchList[i]["Disabled"] = false;
            } else {
                this.searchList[i]["Disabled"] = true;
            }
            if (this.searchList[i].SHIPPER === exporter && this.searchList[i].CONSIGNEE === importer && this.searchList[i].EXPTNO === exptno) {
                if (this.searchList[i]["Select"] === true) {
                    this.searchList[i]["Select"] = false;
                } else {
                    this.searchList[i]["Select"] = true;
                }
            }
        }
        let tempList = 0;
        tempList = this.searchList.filter((searchlist: any) => searchlist.Select === false).length;
        if (tempList === this.searchList.length) {
            for (let i = 0; i < this.searchList.length; i++) {
                this.searchList[i]["Select"] = false;
                this.searchList[i]["Disabled"] = false;
            }
        }
    }

    submit() {
        let count = 0;
        for (let i = 0; i < this.searchList.length; i++) {
            if (this.searchList[i].Select == true) {
                count++;
            }
        }
        if (count === 0) {
            this.error = 'Select atleast one job no !!';
            return false;
        }
        this.error = null;
        this._loaderService.display(true);
        this.result.emit(this.searchList);
        this._loaderService.display(true);
    }
}

@Component({
    selector: 'app-print-air-hawb-search',
    templateUrl: 'hawb.search.component.html'
})
export class PrintDocumentHawbSearchComponent implements OnChanges {

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
        selectorWidth: '200px',
        disableSince: this.disableFutureDate()
    };




    disableFutureDate() {
        let d = new Date();
        let disabledDate;
        let year = new Date().getFullYear();
        let month = d.getMonth() + 1;
        let date = d.getDate();
        if (month === 12 && date === 31) { //For next year change
            disabledDate = { year: year + 1, month: 1, day: 1 };
        } else if (month < 12 && (date === 31 || date === 30 || date === 28 || date === 29)) { //For next month change
            disabledDate = { year: year, month: month + 1, day: 1 };
        } else { //For next day change
            disabledDate = { year: year, month: month, day: date + 1 };
        }
        return disabledDate;
    }

    searchList: any = [];
    exptnos: any = '';
    hawbno: any = '';
    hawbdate: any = null;
    strHawbDate: any = '';
    error: number = null;

    constructor(
        private _dataService: DataService,
        private _loginService: LoginService,
        private _router: Router,
        private _activatedRoute: ActivatedRoute,
        private _loaderService: LoaderService) { }

    ngOnChanges() { }

    searchData() {
        if (this.hawbno.length < 6) {
            this.error = 1;
        } else if (!this.hawbdate) {
            this.error = 2;
        } else {
            this.error = null;
            this.strHawbDate = this.hawbdate.formatted;
            this.searchoutput.emit({ hawbno: this.hawbno, hawbdate: this.strHawbDate });
        }
    }
    printData() {
        // window.open('www.manilal.com', "_blank");
        if (this.hawbno.length < 6) {
            this.error = 1;
        } else if (!this.hawbdate) {
            this.error = 2;
        }
        else{

        let URL = "http://manilal.com/erp/UI/Export/frm_Exp_Print_Document_HAWBNO_final_PRINT.aspx?" +
            "huhpnk=" + this._loginService.getLogin()[0].GUID
            + "&citycode=" + this._loginService.getLogin()[0].CITYCODE1
            + "&Userid=" + this._loginService.getLogin()[0].CMPID
            + "&cmp_code=" + this._loginService.getLogin()[0].CMPCODE
            + "&HAWBNo=" + this.hawbno
            + "&CurLogInIP=" + environment.edocumentIp
        window.open(URL, "_blank");
        }

    }

}


@Component({
    selector: 'app-print-air-hawb-update',
    templateUrl: 'hawb.update.component.html'
})
export class PrintDocumentHawbUpdateComponent implements OnChanges {
    @Input() hawbno: any = '';
    @Input() hawbdate: any = null;
    @Input() exptnos;
    @Output() result: EventEmitter<any> = new EventEmitter<any>();

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
        selectorWidth: '200px',
        disableSince: this.disableFutureDate()
    };

    disableFutureDate() {
        let d = new Date();
        let disabledDate;
        let year = new Date().getFullYear();
        let month = d.getMonth() + 1;
        let date = d.getDate();
        if (month === 12 && date === 31) { //For next year change
            disabledDate = { year: year + 1, month: 1, day: 1 };
        } else if (month < 12 && (date === 31 || date === 30 || date === 28 || date === 29)) { //For next month change
            disabledDate = { year: year, month: month + 1, day: 1 };
        } else { //For next day change
            disabledDate = { year: year, month: month, day: date + 1 };
        }
        return disabledDate;
    }

    currencyList: any = [];
    hawbnoList: any = [];
    FreightType: any = "0";
    Fcurrency: any = "0";
    FreightAmount: any = 0;
    totalGrwt: any = 0;
    totalChblwt: any = 0;
    hawb_cmpcode :any="";
    hawb_issue :any="";


    constructor(
        private _router: Router,
        private _dataService: DataService,
        private _auth: AuthService,
        private _toasterService: ToastCommonService,
        private _loginService: LoginService,
        private _loaderService: LoaderService
    ) { }

    ngOnChanges() {
        this.hawbno = (this.hawbno != undefined || this.hawbno != '') ? this.hawbno : '';
        this.hawbdate = (this.hawbdate == undefined || this.hawbdate == '' || this.hawbdate == null) ? null : this._dataService.stringdttoArry(this.hawbdate);
        this.exptnos = this.exptnos;
        this.hawb_cmpcode=this._loginService.getLogin()[0].CMPCODE;
        // if(this._loginService.getLogin()[0].CMPCODE == '22' || this._loginService.getLogin()[0].CMPCODE =='25')
        // {  this.hawb_china="1";  }
        // else{ this.hawb_china="0";}
        if(this._loginService.getLogin()[0].ISHAWB == '1')
        {  this.hawb_issue="1";  }
        else{ this.hawb_issue="0";}
        this.pageLoad(this.exptnos, this.hawbno);
    }

    pageLoad(exptno, hawbno) {
        this._loaderService.display(true);
        const _jsonData = {
            Type1: exptno,
            Type2: hawbno,
            Type3: this._loginService.getLogin()[0].CITYCODE
        };
        this._dataService.getData("Export/PrintDocumentAirHawbUpdatePageload", _jsonData)
            .subscribe((data: any) => {

                this.currencyList = data.Table;
                if (data.Table1[0].STATUS == 100) {
                    this.hawbnoList = data.Table1;
                    this.exptnos = data.Table1[0].EXPTSTRING;
                    if (this.hawbnoList.length > 0) {
                        this.hawbdate = (this.hawbdate == undefined || this.hawbdate == '' || this.hawbdate == null) ? this._dataService.stringdttoArry(this.hawbnoList[0].HAWBDT) : this.hawbdate;
                        for (let i = 0; i < this.hawbnoList.length; i++) {
                            this.totalGrwt += parseFloat(this.hawbnoList[i].GRWT);
                            this.totalChblwt += parseFloat(this.hawbnoList[i].CHBLWT);
                        }
                    }
                    this.FreightType = this.hawbnoList[0].FRT_TYPE;
                    this.Fcurrency = this.hawbnoList[0].FRT_CUR;
                    this.FreightAmount = this.hawbnoList[0].FRT_AMT;

                    this._loaderService.display(false);
                }
                else
                {
                    this._toasterService.toast('warning', 'warning',data.Table[0].STATUSTEXT);
                    this._loaderService.display(false);
                }

            });
    }//STATUSTEXT

    submit() {
        this._loaderService.display(true);
        const _jsonData = {
            HAWBNO: this.hawbno,
            HAWBDT: (this.hawbdate != null) ? this.hawbdate.formatted : "",
            EXPTNO: this.exptnos,
            GRWT: this.totalGrwt,
            CHBL_WT: this.totalChblwt,
            FRT_TYPE: (this.FreightType != null) ? this.FreightType : '0',
            FRT_CUR: (this.Fcurrency != null) ? this.Fcurrency : '0',
            FRT_AMT: (this.FreightAmount == '') ? this.FreightAmount : '0',
            CityCode: this._loginService.getLogin()[0].CITYCODE,
            CityCode1: this._loginService.getLogin()[0].CITYCODE1,
            CmpId: this._loginService.getLogin()[0].CMPID,
            CmpCode: this._loginService.getLogin()[0].CMPCODE
        };
        this._dataService.Common("Export/PrintDocumentAirHawbUpdateIU", _jsonData)
            .subscribe((data: any) => {
                this._loaderService.display(false);
                this._toasterService.toast('info', 'Complete', data.Table[0].STATUSMSG);
                 alert(data.Table[0].STATUSMSG);
                //   this.result.emit(true);
               // this._router.navigate(['/export/print-document/air/air-print-update', this.hawbno]);
               this._router.navigate(['/export/print-document/air/air-print-update', data.Table[0].HAWBNO]);
            });
    }
}


@Component({
    templateUrl: 'hawb.component.html'
})
export class PrintDocumentHawbComponent implements OnInit {

    viewType: string = 'Update';
    searchList: any = [];
    exptnos: any = '';
    hawbno: any = '';
    strHawbDate: any = '';
    searchLength: any = 0;
    constructor(
        private _router: Router,
        private _dataService: DataService,
        private _loginService: LoginService,
        private _loaderService: LoaderService) { }

    ngOnInit() {
        //this._router.navigate(['export/print-document/air/hawb/search']);
        this._loginService.verifyRights(379, '')
            .subscribe((data: any) => {
                this._loginService.checkVerify('Modify', data);
            });
        let pageType = /number/gi;
        let curUrl = this._router.url;
        if (curUrl.search(pageType) == -1) {
            this.viewType = 'Search';
        }
        else {
            this.viewType = 'List';
            this.getList("");
        }
    }

    getList(hawbno) {
        this._loaderService.display(true);
        const _jsonData = {
            Type1: hawbno,
            Type2: this._loginService.getLogin()[0].CITYCODE,
            Type3: this._loginService.getLogin()[0].CITYCODE1,
            Type4: this._loginService.getLogin()[0].CMPCODE
        };
        this._dataService.getData("Export/PrintDocumentAirHawbList", _jsonData)
            .subscribe((data: any) => {
                this._loaderService.display(false);
                this.searchList = data.Table;
                this.searchLength = (this.searchList.length > 0) ? 1 : -1;
                for (let i = 0; i < this.searchList.length; i++) {
                    this.searchList[i]["Select"] = false;
                    this.searchList[i]["Disabled"] = false;
                }
            });
    }

    getSearchInputValue(data: any) {
        this.hawbno = data.hawbno;
        this.strHawbDate = data.hawbdate;
        this.exptnos = '';
        this.viewType = 'Update';
    }

    getDataFromList(data: any) {
        this.searchList = data;
        let strExptno = '';
        for (let i = 0; i < this.searchList.length; i++) {
            if (this.searchList[i].Select == true) {
                strExptno += this.searchList[i].EXPTNO + ',';
            }
        }
        this.exptnos = strExptno;
        this.strHawbDate = '';
        this.viewType = 'Update';
    }

    getPrintData(event) {
        if (event) {
            this.viewType = 'Search';
        }
    }
}