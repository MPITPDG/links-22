import { Component, OnInit, Input, Output, ViewChild, EventEmitter, OnChanges, ElementRef } from '@angular/core';
import { DataService } from '../../shared/service/dataService';
import { Router } from '@angular/router';
import { LoginService } from '../../shared/service/loginService';
import { ToastCommonService } from '../../shared/service/toastService';
import { IMyDpOptions } from 'mydatepicker';
import { cartingVslAgnt } from '../export-share-data.service';
import { LoaderService } from '../../shared/service/loader.service';

@Component({
    selector: 'app-search-carting-sea',
    templateUrl: 'search-carting-sea.sp.component.html'

})
export class SearchCartingSea implements OnInit, OnChanges {
    private baseUrl: string = 'Export/Carting_vsl_agent_populate';
    @ViewChild('searchButton', {static: false}) searchButton: ElementRef;
    @Input() searchtype: string;
    @Output() search: any = new EventEmitter();
    loading: boolean;
    vslnameList: any = [];
    vslAgentlist: any = [];
    Agentlist: any = [];
    VslPortlist: any = [];
    Vslrotation: any = [];
    VslName: any = "";
    VslAgent: any = "";
    VslPort: any = [];
    CartingList: any = [];
    Agtcode: any = "";
    headerType: string = 'SHIPMENT PROGRESS - CARTING SEA SEARCH'

    constructor(
        private _router: Router,
        private _dataService: DataService,
        private _toasterService: ToastCommonService,
        private _loginService: LoginService,
        private _cartingVslAgnt: cartingVslAgnt,
        private loaderService: LoaderService,
    ) {
    }
    ngOnChanges() {
    }
    ngOnInit() {
        this.loaderService.display(true);       
       
            //userrights add mode
         this._loginService.verifyRights(277, '')
         .subscribe((data: any) => { this._loginService.checkVerify('Add', data); });


        const jsonExport = { CITYCODE: this._loginService.getLogin()[0].CITYCODE };

        this._dataService.getData(this.baseUrl, jsonExport)
            .subscribe((data: any) => {
                if (data.Table[0].STATUS == 100) {
                    this.vslnameList = data.Table;
                    this.vslAgentlist = data.Table1;
                    this.loaderService.display(false);  
                } else {
                    this._toasterService.toast('error', 'Error', data.Table[0].STATUSTEXT);
                    this.loaderService.display(false);  
                }
            });
    }

    onAgentSelect(RtNo) {
        let port: any = [];
        this.VslPortlist = this.vslnameList.filter((linerlist: any) => linerlist.RTNOPRT == RtNo);// this.vslnameList[0].VSL_PORT;  
        port = this.VslPortlist[0].RTNOPRT;
        this.VslPort = port.split("|")[1];
        this.Vslrotation = port.split("|")[0];
        this.Agentlist = [];
        this.Agentlist = this.vslAgentlist.filter((linerlist: any) => linerlist.vsl_rtno == this.Vslrotation);
    }
    onsearch() {
        this.loading = true;        
        if (this.Vslrotation =="")
        {
            this._toasterService.toast('warning', 'warning', "Please select vessel first");
            return false;
        }
        const jsonExport = {
            vsl_rtno: this.Vslrotation,
            citycode: this._loginService.getLogin()[0].CITYCODE,
            cmpcode: this._loginService.getLogin()[0].CMPCODE,
            port: this.VslPort
        };
        this._dataService.getData('Export/Carting_SearchList_populate', jsonExport)
            .subscribe((data: any) => {
                this.loading = false;
                if (data.Table[0].STATUS == 100) {
                    if (data.Table1.length > 0) {
                        this._cartingVslAgnt.VslAgntsharedData = this.VslAgent;
                        this.search.emit(data);
                        this.CartingList = data;
                    } else {
                        this._toasterService.toast('error', 'Alert', 'No Record Found!');
                    }
                } else {
                    this._toasterService.toast('error', 'Error', data.Table[0].statusText);
                }
            });
    }
}

@Component({
    selector: 'app-list-carting-sea',
    templateUrl: 'List-carting-sea.sp.component.html'

})
export class ListCartingSea implements OnInit, OnChanges {
    @Input() CartingList: any = [];
    @Input() SearchHead: any = [];

    @Input() MangeList: any = [];
    @Output() searlist: any = new EventEmitter();

    buttondis: boolean = false;
    headerType: string = 'SHIPMENT PROGRESS - LIST JOB FOR CARTING'
    cartingjob: any = "";
    constructor(
        private _router: Router,
        private _dataService: DataService,
        private _toasterService: ToastCommonService,
        private _loginService: LoginService,
        private _cartingVslAgnt: cartingVslAgnt) {
    }
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

    ngOnChanges() {
        for (let obj of this.CartingList) {
            obj["CARTEDON"] = (obj["CARTEDON"] != "") ? this._dataService.stringdttoArry(obj["CARTEDON"]) : null;
        }
    }

    ngOnInit() {

    }

    OnCartSave() {
        this.cartingjob = [];
        for (let obj of this.CartingList) {
            if (obj.SELEJOB == 1 || obj.SELEJOB == true) {
                if (obj.NOOFPKG > obj.RCVDPKGS) {
                    this._toasterService.toast('error', 'Error', "Total No.of packages are more than the no.of packages received.");
                    return false;
                }
                this.cartingjob = this.cartingjob + obj.EXPTNO + ',' + obj.CARTEDON.formatted + ',' + obj.NOOFPKG + ',' + obj.REMARK + ',' + obj.CARTID + ';';
            }
        }
        if (this.cartingjob == "") {
            this._toasterService.toast('error', 'Error', "Please select atleast one job for carting");
            return false;
        }

        const jsonExport = {
            exptstr: this.cartingjob,
            vsl_rtno: this.SearchHead[0].vsl_rtno,
            vslagent: this._cartingVslAgnt.VslAgntsharedData,
            port: this.SearchHead[0].port,
            cmpid: this._loginService.getLogin()[0].CMPID,
            citycode: this._loginService.getLogin()[0].CITYCODE,
            cmpcode: this._loginService.getLogin()[0].CMPCODE
        };
        this._dataService.Common('Export/Carting_Sea_IU', jsonExport)
            .subscribe((data: any) => {
                if (data.Table[0].STATUS == 100) {
                    this._toasterService.toast('info', 'Complete', "Carting Saved Successfully")
                    this.searlist.emit("Search")
                } else {
                    this._toasterService.toast('error', 'Error', data.Table[0].statusText);
                }
            });


    }

    vslidaionPkgs(RCVDPKGS, noofpkgs) {
        if (noofpkgs > RCVDPKGS) {
            this._toasterService.toast('error', 'Error', "Total No.of packages are more than the no.of packages received.");
            this.buttondis = true;

        }
        else { this.buttondis = false; }
    }

    OnDelete(containerno, cartid) {
        let listcart: any = [];
        if (containerno == null) {

            listcart = this.CartingList.filter((linerlist: any) => linerlist.CARTID == cartid);

            const jsonExport = {
                cartid: cartid,
                exptno: listcart[0].EXPTNO,
                cmpid: this._loginService.getLogin()[0].CMPID,
                citycode: this._loginService.getLogin()[0].CITYCODE,
                cmpcode: this._loginService.getLogin()[0].CMPCODE
            };

            this._dataService.Common('Export/Carting_Sea_DELETE', jsonExport)
                .subscribe((data: any) => {
                    if (data.Table[0].STATUS == 100) {
                        this._toasterService.toast('info', 'Complete', "Carting delete Successfully")

                        listcart[0].CARTEDON = "";
                        listcart[0].NOOFPKG = "";
                        listcart[0].REMARK = "";

                    } else {
                        this._toasterService.toast('error', 'Error', data.Table[0].statusText);
                    }
                });
        }
        else {
            this._toasterService.toast('error', 'Error', "Can not delete the cargo as it is already containerised ");
            return false;

        }


    }
}
@Component({
    selector: 'app-manage-carting-sea',
    templateUrl: 'manage-carting-sea.sp.component.html'

})
export class manageCartingSea implements OnInit, OnChanges {
    @Input() manageList: any = [];

    vslnameList: any = [];
    Agentlist: any = [];
    VslName: any = '';
    VslAgent: any = '';

    constructor(
        private _router: Router,
        private _dataService: DataService,
        private _toasterService: ToastCommonService,
        private _loginService: LoginService,
        private _cartingVslAgnt: cartingVslAgnt) {
    }
    ngOnChanges() {
    }
    ngOnInit() {
    }

    deletecarting() { }

    trfVessel() { }

    onAgentSelect(event){

    }

    onsearch(){}
}

@Component({
    templateUrl: 'carting-sea.sp.component.html'
})
export class CartingSea implements OnInit, OnChanges {
    public _viewType: string = "Search"; // "Search";

    private searchList: any = [];
    private header: any = [];

    private managecartid: any = [];

    constructor(
        private _router: Router,
        private _dataService: DataService,
        private _toasterService: ToastCommonService,
        private _loginService: LoginService) {
    }
    ngOnChanges() {
    }
    ngOnInit() {
    }
    SearchData(data) {
        this.header = data.Table;
        this.searchList = data.Table1;
        this._viewType = "List";
    }

    onlist(data) {
        this._viewType = "data";
    }

}