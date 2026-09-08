import { Component, OnInit, OnChanges, ViewChild, ElementRef, Input, Output, EventEmitter, AfterViewInit,ViewEncapsulation,ViewContainerRef,ViewChildren,ContentChild } from '@angular/core';
import { DataService } from '../../shared/service/dataService';
import { AuthService } from '../../shared/service/authService';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastCommonService } from '../../shared/service/toastService';
import { LoginService } from '../../shared/service/loginService';
import { IMyDpOptions } from 'mydatepicker';
import {
    FontChangerComponent,
    ButtonService } from '../../shared/common-font-changer.directive';

@Component({
    templateUrl: 'common.search.sp.component.html'
})
export class CommonSearchShipmentProgressComponent implements OnInit {
    @ViewChild('searchButton', {static: false}) searchButton: ElementRef;    
   @ViewChild(FontChangerComponent, {static: false})  disableButton:FontChangerComponent ;
 
    headerType: string = '';
    viewHeaderTypeList: any = [
        { id: 1, headertype: 'SHIPMENT PROGRESS - SHIPPING BILL DETAILS SEARCH', valuetype: 'SHIPPING_BILL_DETAILS' },
        { id: 2, headertype: 'SHIPMENT PROGRESS - RECEIPT OF CARGO SEARCH', valuetype: 'RECEIPT_OF_CARGO' },
        { id: 3, headertype: 'SHIPMENT PROGRESS - DIMENSION SEARCH', valuetype: 'DIMENSSION' },
        { id: 4, headertype: 'SHIPMENT PROGRESS - APPROVAL RECEIVED SEARCH', valuetype: 'APPROVAL_RECEIVED' },
        { id: 5, headertype: 'SHIPMENT PROGRESS - CARTING SEA SEARCH', valuetype: 'CARTING_SEA' },
        { id: 6, headertype: 'SHIPMENT PROGRESS - CARTING AIR SEARCH', valuetype: 'CARTING_AIR' },
        { id: 7, headertype: 'SHIPMENT PROGRESS - DESTINATION DOCUMENTS SEARCH', valuetype: 'DESTINATION_DOCUMENTS' },
        { id: 8, headertype: 'SHIPMENT PROGRESS - MEASUREMENT SEARCH', valuetype: 'MEASUREMENT' },
        { id: 9, headertype: 'SHIPMENT PROGRESS - OUT OF CHARGE SEARCH', valuetype: 'OUT_OF_CHARGE' },
        { id: 10, headertype: 'SHIPMENT PROGRESS - PREALERT SENT ON SEARCH', valuetype: 'PREALERT_SENT_ON' },
        { id: 11, headertype: 'SHIPMENT PROGRESS - BL DETAILS SEARCH', valuetype: 'BL_DETAILS' },
        { id: 12, headertype: 'SHIPMENT PROGRESS - BHEL DETAILS SEARCH', valuetype: 'BHEL_DETAILS' },
        { id: 13, headertype: 'SHIPMENT PROGRESS - TRANSFER SEA TO AIR SEARCH', valuetype: 'SEA_TO_AIR' },
        { id: 14, headertype: 'SHIPMENT PROGRESS - PREPAID FREIGHT APPROVED BY SHIPPER', valuetype: 'PRPFRT_APPROV' },
    ];
    viewIdType: string = '';
    rights: number = null;
    searchList: any = [];
    searchListLength: number = 0;
    checkType: string = 'EXPORT_NO';
    SearchValue: any = '';
    ErrorMessage: string = '';
    constructor(
        private _router: Router,
        private _dataService: DataService,
        private _loginService: LoginService,
      ) { }

    ngOnInit() {
     //   this.disableButton.changeFontwithDisableButton(1, this.searchButton);
        let curUrl = this._router.url;
        if (curUrl.match('ship-bill-search') != null) {
            this.viewIdType = this.viewHeaderTypeList.find(item => item.id === 1).id;
            this.headerType = this.viewHeaderTypeList.find(item => item.id === 1).headertype;
            this.rights = 220;
        }
        else if (curUrl.match('receipt-cargo-with-job-no') != null) {
            this.viewIdType = this.viewHeaderTypeList.find(item => item.id === 2).id;
            this.headerType = this.viewHeaderTypeList.find(item => item.id === 2).headertype;
            this.rights = 217;
        }
        else if (curUrl.match('dimension-search') != null) {
            this.viewIdType = this.viewHeaderTypeList.find(item => item.id === 3).id;
            this.headerType = this.viewHeaderTypeList.find(item => item.id === 3).headertype;
            this.rights = 265;
        }
        else if (curUrl.match('approval-received-search') != null) {
            this.viewIdType = this.viewHeaderTypeList.find(item => item.id === 4).id;
            this.headerType = this.viewHeaderTypeList.find(item => item.id === 4).headertype;
            this.rights = 221;
        }        
        else if (curUrl.match('carting-air-search') != null) {
            this.viewIdType = this.viewHeaderTypeList.find(item => item.id === 6).id;
            this.headerType = this.viewHeaderTypeList.find(item => item.id === 6).headertype;
            this.rights = 225;
        }
        else if (curUrl.match('destination-document-search') != null) {
            this.viewIdType = this.viewHeaderTypeList.find(item => item.id === 7).id;
            this.headerType = this.viewHeaderTypeList.find(item => item.id === 7).headertype;
            this.rights = 227;
        }
        else if (curUrl.match('measurement-search') != null) {
            this.viewIdType = this.viewHeaderTypeList.find(item => item.id === 8).id;
            this.headerType = this.viewHeaderTypeList.find(item => item.id === 8).headertype;
            this.rights = 222;
        }
        else if (curUrl.match('out-of-charge-search') != null) {
            this.viewIdType = this.viewHeaderTypeList.find(item => item.id === 9).id;
            this.headerType = this.viewHeaderTypeList.find(item => item.id === 9).headertype;
            this.rights = 223;
        }
        else if (curUrl.match('prealert-sent-on-search') != null) {
            this.viewIdType = this.viewHeaderTypeList.find(item => item.id === 10).id;
            this.headerType = this.viewHeaderTypeList.find(item => item.id === 10).headertype;
            this.rights = 226;
        }
        else if (curUrl.match('bl-details-search') != null) {
            this.viewIdType = this.viewHeaderTypeList.find(item => item.id === 11).id;
            this.headerType = this.viewHeaderTypeList.find(item => item.id === 11).headertype;
            this.rights = 224;
        }
         
        else if (curUrl.match('transfer-sea-to-air-search') != null) {
            this.viewIdType = this.viewHeaderTypeList.find(item => item.id === 13).id;
            this.headerType = this.viewHeaderTypeList.find(item => item.id === 13).headertype;
            this.rights = 229;
        }
        else if (curUrl.match('Prepaid-freight-apprvd-search') != null) {
            this.viewIdType = this.viewHeaderTypeList.find(item => item.id === 14).id;
            this.headerType = this.viewHeaderTypeList.find(item => item.id === 14).headertype;
            this.rights = 406;
        }
        this._loginService.verifyRights(this.rights, '')
            .subscribe((data: any) => {
                this._loginService.checkVerify('View', data);  //For verify user access
            });
    }

    changeType(event) {
        this.checkType = event;
    }

    search() {
        if (this.SearchValue == '') {
            if (this.checkType == 'EXPORT_NO') { this.ErrorMessage = "Please enter Export No"; return false; }
            else if (this.checkType == 'ORDER_NO') { this.ErrorMessage = "Please enter Order No"; return false; }
            else if (this.checkType == 'REF_NO') { this.ErrorMessage = "Please enter Ref. No"; return false; }
        } else { this.ErrorMessage = ""; }
        this.getSearchData(this.viewHeaderTypeList.find(item => item.id === this.viewIdType).valuetype, this.checkType, this.SearchValue);
    }

    // ngAfterViewInit() {
    //   this.disableButton.changeFontwithDisableButton(1, this.searchButton);//this.searchButton            
    //   }

    getSearchData(formType, searchType, valueType) {
        this.disableButton.changeFontwithDisableButton(1, this.searchButton);
        const _jsonData = {
            Type1: formType,
            Type2: searchType,
            Type3: valueType,
            Type4: this._loginService.getLogin()[0].CITYCODE,
            Type5: this._loginService.getLogin()[0].CMPCODE
        };
        this._dataService.getData("Export/ShipmentCommonSearch", _jsonData)
            .subscribe((data: any) => {
                this.searchList = data.Table;
                this.searchListLength = (data.Table.length == 0) ? 1 : -1;                 
                this.disableButton.changeFontwithEnableButton(0, this.searchButton);
            });
    }

    rowClick(exptno) {
        let curUrl = this._router.url;
        if (curUrl.match('ship-bill-search') != null) {
            this._router.navigate(['export/shipment-progress/ship-bill/' + exptno]);
        }
        else if (curUrl.match('receipt-cargo-with-job-no') != null) {
            this._router.navigate(['export/shipment-progress/reciept-of-cargo/' + exptno]);
        }
        else if (curUrl.match('dimension-search') != null) {
            this._router.navigate(['export/shipment-progress/Dimension/' + exptno]);
        }
        else if (curUrl.match('approval-received-search') != null) {
            this._router.navigate(['export/shipment-progress/approval-received/' + exptno]);
        }
        else if (curUrl.match('carting-air-search') != null) {
            this._router.navigate(['export/shipment-progress/carting-air/' + exptno]);
        }
        else if (curUrl.match('destination-document-search') != null) {
            this._router.navigate(['export/shipment-progress/destination-document/' + exptno]);
        }
        else if (curUrl.match('measurement-search') != null) {
            this._router.navigate(['export/shipment-progress/measurement/' + exptno]);
        }
        else if (curUrl.match('out-of-charge-search') != null) {
            this._router.navigate(['export/shipment-progress/out-of-charge/' + exptno]);
        }
        else if (curUrl.match('prealert-sent-on-search') != null) {
            this._router.navigate(['export/shipment-progress/prealert-sent-on/' + exptno]);
        }
        else if (curUrl.match('bl-details-search') != null) {
            this._router.navigate(['export/shipment-progress/bl-details/' + exptno]);
        }
        else if (curUrl.match('transfer-sea-to-air-search') != null) {
            this._router.navigate(['export/shipment-progress/transfer-sea-to-air/' + exptno]);
        }
        else if (curUrl.match('Prepaid-freight-apprvd-search') != null) {
            this._router.navigate(['export/shipment-progress/Prepaid-freight-apprvd/' + exptno]);
        }
    }
}

@Component({
    selector: 'app-shipment-progress-common-view',
    templateUrl: 'common.view.sp.component.html'
})
export class CommonViewShipmentProgressComponent implements OnInit, OnChanges {
    @Input() ExptNo: any;
    viewDataTable: any = [];
    viewDataTable1: any = [];
    constructor(
        private _router: Router,
        private _dataService: DataService,
        private _loginService: LoginService) {
        this.ExptNo = this.ExptNo;
    }

    ngOnInit() { }
    ngOnChanges() { this.getData(this.ExptNo); }

    getData(exptNo) {
        const _jsonData = {
            Type1: exptNo
        };
        this._dataService.getData("Export/ShipmentCommonView", _jsonData)
            .subscribe((data: any) => {
                this.viewDataTable = data.Table[0];
                this.viewDataTable1 = data.Table1[0];
            });
    }
}

@Component({
    templateUrl: 'sp.component.html'
})
export class ShipmentProgressComponent implements OnInit {
    constructor() { }

    ngOnInit() { }
}


@Component({
    selector: 'app-shipment-progress-shipping-bill',
    templateUrl: 'shipping-bill.sp.component.html'
})
export class ShippingBillShipmentProgressComponent implements OnInit, OnChanges {
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

    ExptNo: any = null;
    ErrorMessage: any = '';
    IsCargoRecd: string = '';
    CustomDate: any = null;
    ShipBillNo: any = '';
    ShipBillDate: any = null;
    ExaminDate: any = null;
    Objection: any = '';
    Remark: any = '';
    CustomClearanceMsg: string = '';
    CCNo: any = '';
    CCDate: any = null;
    popData: any = [];
    PkId: number = null;
    constructor(
        private _router: Router,
        private _dataService: DataService,
        private _loginService: LoginService,
        private _activatedRoute: ActivatedRoute,
        private _toasterService: ToastCommonService) {
        this._activatedRoute.params.subscribe(params => { this.ExptNo = params.exptno; });
    }

    ngOnInit() {
        if (this.ExptNo.length != 15) {
            this.ErrorMessage = 'Invalid Export No. or Job No';
        }
        this.getData('SHIPPING_BILL_DETAILS', this.ExptNo);
    }
    ngOnChanges() { }

    changeObjection() {
        this.Objection = (this.Objection == 'Y') ? '' : 'Y';
        this.Remark = '';
    }
	search(){}

    submit() {
        if (this.validation() == false) { return false; }
        this.saveData(
            this.PkId,
            this.ExptNo,
            (this.CustomDate != null) ? this.CustomDate.formatted : '',
            this.ShipBillNo,
            (this.ShipBillDate != null) ? this.ShipBillDate.formatted : '',
            (this.ExaminDate != null) ? this.ExaminDate.formatted : '',
            (this.Objection == 'Y') ? this.Objection : '',
            (this.Objection == 'Y') ? this.Remark : '',
            this.CCNo,
            (this.CCDate != null) ? this.CCDate.formatted : ''
        );
    }

    validation() {
        let CustomDate = (this.CustomDate != null) ? this.CustomDate.formatted : null;
        let ShipBillDate = (this.ShipBillDate != null) ? this.ShipBillDate.formatted : null;
        let ExaminDate = (this.ExaminDate != null) ? this.ExaminDate.formatted : null;
        let CCDate = (this.CCDate != null) ? this.CCDate.formatted : null;
        if (CustomDate != null && ShipBillDate != null) {
            if (this._dataService.date2Comparison(CustomDate,ShipBillDate) == false) {
                this._toasterService.toast('error', 'Error', 'Shippling bill date cant be less than shipping bill present date to custom'); return false;
            }
        }
        if (CustomDate != null && ExaminDate != null) {
            if (this._dataService.date2Comparison(CustomDate, ExaminDate) == false) {
                this._toasterService.toast('error', 'Error', 'Custom Examined date cant be less than shipping bill present date to custom'); return false;
            }
        }
        if (ShipBillDate != null && ExaminDate != null) {
            if (this._dataService.date2Comparison(ShipBillDate, ExaminDate) == false) {
                this._toasterService.toast('error', 'Error', 'Custom Examined date cant be less than Shipping Bill date'); return false;
            }
        }
        if (ExaminDate != null && CCDate != null) {
            if (this._dataService.date2Comparison(CustomDate, CCDate) == false) {
                this._toasterService.toast('error', 'Error', 'Custom Cleared date cant be less than Custom Examined date'); return false;
            }
        }
        if (ShipBillDate != null && CCDate != null) {
            if (this._dataService.date2Comparison(CustomDate, CCDate) == false) {
                this._toasterService.toast('error', 'Error', 'Custom Cleared date cant be less than Shipping Bill date'); return false;
            }
        }
        if (CustomDate != null && CCDate != null) {
            if (this._dataService.date2Comparison(CustomDate, CCDate) == false) {
                this._toasterService.toast('error', 'Error', 'Custom Cleared date cant be less than Custom Date');
            }
        }
        return true;
    }

    saveData(PkId, ExptNo, CustomDate, ShipBillNo, ShipBillDate, ExaminDate, Objection, Remark, CCNo, CCDate) {
        const _jsonData = {
            PkId: PkId,
            ExptNo: ExptNo,
            CustomDate: CustomDate,
            ShipBillNo: ShipBillNo,
            ShipBillDate: ShipBillDate,
            ExaminDate: ExaminDate,
            Objection: Objection,
            Remark: Remark,
            CCNo: CCNo,
            CCDate: CCDate,
            CmpId: this._loginService.getLogin()[0].CMPID,
            MakerIp: this._loginService.getLogin()[0].MAKERIP //change by ip
        };
        this._dataService.Common("Export/ShippingBillShipmentProgressUpdate", _jsonData)
            .subscribe((data: any) => {
                if (data.Table[0].STATUS != undefined) {
                    alert("Shipping Bill Details updated successfully!");
                    this._router.navigate(['export/shipment-progress/ship-bill-search']);
                }
            });
    }

    getData(formType, exptNo) {
        const _jsonData = {
            Type1: formType,
            Type2: exptNo,
            Type3: "",
            Type4: this._loginService.getLogin()[0].CMPID
        };
        this._dataService.getData("Export/ShipmentProgressPopulate", _jsonData)
            .subscribe((data: any) => {
                if (data.Table != undefined) {
                    this.popData = data.Table;
                    this.PkId = this.popData[0].ID;
                    this.CustomDate = (this.popData[0].EXPT_SHIPBILLDT1 != "") ? this._dataService.stringdttoArry(this.popData[0].EXPT_SHIPBILLDT1) : null;
                    this.ShipBillNo = this.popData[0].EXPT_SHIPBILLNO;
                    this.ShipBillDate = (this.popData[0].EXPT_SHIPBILLDT != "") ? this._dataService.stringdttoArry(this.popData[0].EXPT_SHIPBILLDT) : null;
                    this.ExaminDate = (this.popData[0].EXPT_SHIPCUSTOM1 != "") ? this._dataService.stringdttoArry(this.popData[0].EXPT_SHIPCUSTOM1) : null;
                    this.Objection = (this.popData[0].OBJECTION == "Y") ? 'Y' : '';
                    this.Remark = (this.popData[0].OBJECTION == "Y") ? this.popData[0].CUSTOMREMARK : '';
                    this.CCNo = this.popData[0].EXPT_SHIPCCNO;
                    this.CCDate = (this.popData[0].EXPT_SHIPCUSTOM != "") ? this._dataService.stringdttoArry(this.popData[0].EXPT_SHIPCUSTOM) : null;
                    this.IsCargoRecd = this.popData[0].ISCARGORECD;
                    if (this.IsCargoRecd == 'NO') {
                        this.CustomClearanceMsg = "CARGO IS NOT YET RECEIVED, HENCE CUSTOM CLEARANCE DATE CAN NOT BE ENTERED";
                        this.CCNo = '';
                        this.CCDate = null;
                    }
                } else {
                    alert('Not Found!');
                }
            });
    }
}

@Component({
    selector: 'app-shipment-progress-receipt-cargo',
    templateUrl: 'receipt-cargo.sp.component.html',
    styleUrls: ['../../../../node_modules/@ng-select/ng-select/themes/default.theme.css'], 
    encapsulation: ViewEncapsulation.None
})
export class ReceiptCargoShipmentProgressComponent implements OnInit, OnChanges, AfterViewInit {
    @ViewChild('addButton', {static: false}) addButton: ElementRef;
    @ViewChild('updateButton', {static: false}) updateButton: ElementRef;
    @ViewChild('submitButton', {static: false}) submitButton: ElementRef;
    @ViewChild(FontChangerComponent, {static: false}) private disable: FontChangerComponent;
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
    Id: any = '';
    ExptNo: any = null;
    TOTPKGS: any = '';
    TOT_DTLS_PKGS: any = '0';
    ErrorMessage: any = '';
    cargoList: any = [];

    GuId: string = '';
    Type: string = 'A';
    TblIndexId: any = '0';
    cargoId: any = '0';
    NoOfPkgs: any = '';
    EditValue: any = '';
    RecdDate: any = null;
    RecdTime: any = '00';
    RecdMin: any = '00';
    RecdWhere: any = '';
    RecdLocal: any = null;
    RecdLocalTime: any = '00';
    RecdLocalMin: any = '00';
    constructor(
        private _router: Router,
        private _dataService: DataService,
        private _loginService: LoginService,
        private _activatedRoute: ActivatedRoute,
        private _toasterService: ToastCommonService) {
        this._activatedRoute.params.subscribe(params => { this.ExptNo = params.exptno; });
    }

    ngOnInit() {
        if(this._loginService.getLogin()[0].CITYCODE=='LIL'|| this._loginService.getLogin()[0].CITYCODE=='PAR')
        {
            if (this.ExptNo.length != 14) {
                this.ErrorMessage = 'Invalid Export No. or Job No';
            }
        }
        else
        {
            if (this.ExptNo.length != 15) {
                this.ErrorMessage = 'Invalid Export No. or Job No';
            }
        }
       
        this.GuId = this._loginService.getLogin()[0].GUID;
        this.getData('RECEIPT_OF_CARGO', this.ExptNo);
    }
    ngOnChanges() { }

    ngAfterViewInit() {
        this.disable.disableButton(this.addButton);
        this.disable.disableButton(this.submitButton);
    }

    getData(formType, exptNo) {
        const _jsonData = {
            Type1: formType,
            Type2: exptNo,
            Type3: this._loginService.getLogin()[0].GUID,
            Type4: this._loginService.getLogin()[0].CMPID
        };
        this._dataService.getData("Export/ShipmentProgressPopulate", _jsonData)
            .subscribe((data: any) => {
                this.disable.enableButton(this.addButton);
                this.disable.enableButton(this.submitButton);
                if (data.Table != undefined) {
                    this.Id = data.Table[0].ID;
                    this.TOTPKGS = data.Table[0].EXPT_NOOFPKGS;
                    this.cargoList = data.Table1;
                } else {
                    alert('Not Found!');
                }
            });
    }

    populate(TYPE, TBL_INDEXID, CARGOID, GUID, EXPTNO, NOOFPKGS, RECDDATE, RECDTIME, RECDWHERE, RECDLOCAL, RECDLOCALTIME) {
        this.TblIndexId = TBL_INDEXID;
        this.cargoId = CARGOID;
        this.NoOfPkgs = NOOFPKGS;
        this.EditValue = NOOFPKGS;
        this.RecdDate = (RECDDATE != "") ? this._dataService.stringdttoArry(RECDDATE) : null;
        if (RECDTIME != "") {
            this.RecdTime = RECDTIME.split(":")[0];
            this.RecdMin = RECDTIME.split(":")[1];
        }
        else {
            this.RecdTime = "00";
            this.RecdMin = "00";
        }
        this.RecdWhere = RECDWHERE;
        this.RecdLocal = (RECDLOCAL != "") ? this._dataService.stringdttoArry(RECDLOCAL) : null;
        if (RECDLOCALTIME != "") {
            this.RecdLocalTime = RECDLOCALTIME.split(":")[0];
            this.RecdLocalMin = RECDLOCALTIME.split(":")[1];
        }
        else {
            this.RecdLocalTime = "00";
            this.RecdLocalMin = "00";
        }
        this.Type = TYPE;
    }

    addUpdate() {
        if (this.validation() == false) { return false; }
        let NOOFPKGS = this.NoOfPkgs;
        let EditValue = this.EditValue;
        if (EditValue == '') {
            EditValue = '0'
        }
        let TotalValue = Math.abs(this.TOTPKGS);
        let TotalDtlsValue = this.TOT_DTLS_PKGS;
        TotalDtlsValue = (Math.abs(TotalDtlsValue) - Math.abs(EditValue)) + Math.abs(NOOFPKGS);
        if (TotalValue >= Math.abs(NOOFPKGS)) {
            if (TotalValue < TotalDtlsValue) {
                alert("Total No.Of Pkgs should be less then or equal to " + String(TotalValue));
                return false;
            }
        } else {
            alert("Can not add more than Total No.Of Pkgs " + String(TotalValue));
            return false;
        }

        let RECDDATE = (this.RecdDate != null) ? this.RecdDate.formatted : "";
        let RecdTimeHour = (this.RecdTime != null) ? this.RecdTime : "";
        let RecdTimeMin = (this.RecdMin != null) ? this.RecdMin : "";
        let RECDTIME = String(RecdTimeHour) + ':' + String(RecdTimeMin);
        let RECDWHERE = this.RecdWhere;
        let RECDLOCAL = (this.RecdLocal != null) ? this.RecdLocal.formatted : "";
        let RecdLocalTimeHour = (this.RecdLocalTime != null) ? this.RecdLocalTime : "";
        let RecdLocalTimeMin = (this.RecdLocalMin != null) ? this.RecdLocalMin : "";
        let RECDLOCALTIME = String(RecdLocalTimeHour) + ':' + String(RecdLocalTimeMin);
        if (RECDLOCAL == "") {
            let RecdLocalTime = "00:00";
        }
        let CARGOID = this.cargoId;
        let EXPTNO = this.ExptNo;
        let GUID = this.GuId;
        let TBL_INDEXID = this.TblIndexId;
        let TYPE = this.Type;
        //if (TYPE != 'E') {
        //    TYPE = 'A'
        //}
        //return false;
        if (this.Type == 'A') { this.disable.disableButton(this.addButton); }
        else { this.disable.disableButton(this.updateButton); }

        const _jsonData = {
            Tbl_IndexId: TBL_INDEXID,
            CargoId: CARGOID,
            ExptNo: EXPTNO,
            NoOfPkgs: NOOFPKGS,
            RecdDate: RECDDATE,
            RecdWhere: RECDWHERE,
            RecdLocal: RECDLOCAL,
            RecdTime: RECDTIME,
            RecdLocalTime: RECDLOCALTIME,
            Guid: GUID,
            CmpId: this._loginService.getLogin()[0].CMPID,
            Type: TYPE
        };
        this._dataService.Common("Export/ReceiptCargoUpdateDtlsShipmentProgress", _jsonData)
            .subscribe((data: any) => {
                if (this.Type == 'A') { this.disable.enableButton(this.addButton); }
                else { this.disable.enableButton(this.updateButton); }
                if (data.Table != undefined) {
                    this.cargoList = data.Table;
                    this.TOT_DTLS_PKGS = data.Table[0].TOTPKGS;
                    this.populate('A', "0", "0", "", "", "", "", "00:00", "", "", "00:00");
                } else {
                    alert('Not Found!');
                }
            });
    }

    submit() {
        this.disable.disableButton(this.submitButton);
        const _jsonData = {
            Type1: this.Id,
            Type2: this.ExptNo,
            Type3: this._loginService.getLogin()[0].GUID,
            Type4: this._loginService.getLogin()[0].CMPID,
            Type5: this._loginService.getLogin()[0].MAKERIP //change later by ip
        };
        this._dataService.Common("Export/ReceiptCargoUpdateShipmentProgress", _jsonData)
            .subscribe((data: any) => {
                this.disable.enableButton(this.submitButton);
                if (data.Table != undefined) {
                    if (data.Table[0].STATUS == 100) {
                        alert("Receipt of Cargo details updated successfully!");
                        this._router.navigate(['export/shipment-progress/receipt-cargo-with-job-no-search']);
                    } else if (data.Table[0].STATUS == 102) {
                        alert('Error! Please contact System Administrator.');
                    }
                }
            });
    }

    abort() {
        this._router.navigate(['export/shipment-progress/receipt-cargo-with-job-no-search']);
    }


    validation() {
        if (this.NoOfPkgs == "") {
            alert("Please enter No Of Pkgs.");
            return false;
        }
        else if (this.RecdDate == "") {
            alert("Please select Received Date.");
            return false;
        }
        if (this.RecdWhere != "") {
            if (this.RecdLocal == "") {
                alert("Please enter Locally Recd Time.");
                return false;
            }
        }
        if (this.RecdLocal != "") {
            if (this.RecdWhere == "") {
                alert("Please enter Received Where.");
                return false;
            }
        }
        return true;
    }

    reset() {
        this.populate('A', "0", "0", "", "", "", "", "00:00", "", "", "00:00");
    }
}


@Component({
    selector: 'app-shipment-progress-approval-received',
    templateUrl: 'approval-received.sp.component.html'
})
export class ApprovalReceivedShipmentProgressComponent implements OnInit, OnChanges, AfterViewInit {
    @ViewChild('submitButton', {static: false}) submitButton: ElementRef;
    @ViewChild(FontChangerComponent, {static: false}) private disable: FontChangerComponent;
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
    Id: any = '';
    ExptNo: any = null;
    ErrorMessage: any = '';
    ApprovalDate: any = null;
    ByWhom: any = '';
    Remark: any = '';
    constructor(
        private _router: Router,
        private _dataService: DataService,
        private _loginService: LoginService,
        private _activatedRoute: ActivatedRoute,
        private _toasterService: ToastCommonService) {
        this._activatedRoute.params.subscribe(params => { this.ExptNo = params.exptno; });
    }

    ngOnInit() {
        if (this.ExptNo.length != 15) {
            this.ErrorMessage = 'Invalid Export No. or Job No';
        }
        this.getData('APPROVAL_RECEIVED', this.ExptNo);
    }
    ngOnChanges() { }

    ngAfterViewInit() {
        this.disable.disableButton(this.submitButton);
    }

    getData(formType, exptNo) {
        const _jsonData = {
            Type1: formType,
            Type2: exptNo,
            Type3: this._loginService.getLogin()[0].GUID,
            Type4: this._loginService.getLogin()[0].CMPID
        };
        this._dataService.getData("Export/ShipmentProgressPopulate", _jsonData)
            .subscribe((data: any) => {
                this.disable.enableButton(this.submitButton);
                if (data.Table != undefined) {
                    this.Id = data.Table[0].ID;
                    this.ApprovalDate = (data.Table[0].EXPTAPPDT != "") ? this._dataService.stringdttoArry(data.Table[0].EXPTAPPDT) : null;
                    this.ByWhom = data.Table[0].EXPTAPPWM;
                    this.Remark = data.Table[0].CONREMARK;
                } else {
                    alert('Not Found!');
                }
            });
    }

    submit() {
        this.disable.disableButton(this.submitButton);
        const _jsonData = {
            Type1: this.Id,
            Type2: this.ExptNo,
            Type3: (this.ApprovalDate != null) ? this.ApprovalDate.formatted : "",
            Type4: this.ByWhom,
            Type5: this.Remark,
            Type6: this._loginService.getLogin()[0].CMPID,
            Type7: this._loginService.getLogin()[0].MAKERIP //change later by ip
        };
        this._dataService.Common("Export/ApprovalReceivedUpdateShipmentProgress", _jsonData)
            .subscribe((data: any) => {
                this.disable.enableButton(this.submitButton);
                if (data.Table != undefined) {
                    if (data.Table[0].STATUS == 100) {
                        alert("Approval Received details updated successfully!");
                        this._router.navigate(['export/shipment-progress/approval-received-search']);
                    } else if (data.Table[0].STATUS == 102) {
                        alert('Error! Please contact System Administrator.');
                    }
                }
            });
    }

    abort() {
        this._router.navigate(['export/shipment-progress/approval-received-search']);
    }

}

@Component({
    selector: 'app-shipment-progress-measurement',
    templateUrl: 'measurement.sp.component.html'
})
export class MeasurementShipmentProgressComponent implements OnInit, OnChanges, AfterViewInit {
    @ViewChild('submitButton', {static: false}) submitButton: ElementRef;
    @ViewChild(FontChangerComponent, {static: false}) private disable: FontChangerComponent;
    Id: any = '';
    ExptNo: any = null;
    ErrorMessage: any = '';
    Cbm: any = '';
    constructor(
        private _router: Router,
        private _dataService: DataService,
        private _loginService: LoginService,
        private _activatedRoute: ActivatedRoute,
        private _toasterService: ToastCommonService) {
        this._activatedRoute.params.subscribe(params => { this.ExptNo = params.exptno; });
    }

    ngOnInit() {
        if (this.ExptNo.length != 15) {
            this.ErrorMessage = 'Invalid Export No. or Job No';
        }
        this.getData('MEASUREMENT', this.ExptNo);
    }
    ngOnChanges() { }

    ngAfterViewInit() {
        this.disable.disableButton(this.submitButton);
    }

    getData(formType, exptNo) {
        const _jsonData = {
            Type1: formType,
            Type2: exptNo,
            Type3: this._loginService.getLogin()[0].GUID,
            Type4: this._loginService.getLogin()[0].CMPID
        };
        this._dataService.getData("Export/ShipmentProgressPopulate", _jsonData)
            .subscribe((data: any) => {
                this.disable.enableButton(this.submitButton);
                if (data.Table != undefined) {
                    this.Id = data.Table[0].ID;
                    this.Cbm = data.Table[0].EXPT_VOLUME;
                } else {
                    alert('Not Found!');
                }
            });
    }

    submit() {
        this.disable.disableButton(this.submitButton);
        const _jsonData = {
            Type1: this.Id,
            Type2: this.ExptNo,
            Type3: this.Cbm,
            Type4: this._loginService.getLogin()[0].CMPID,
            Type5: this._loginService.getLogin()[0].MAKERIP //change later by ip
        };
        this._dataService.Common("Export/MeasurementUpdateShipmentProgress", _jsonData)
            .subscribe((data: any) => {
                this.disable.enableButton(this.submitButton);
                if (data.Table != undefined) {
                    if (data.Table[0].STATUS == 100) {
                        alert("Measurement(CBM) details updated successfully!");
                        this._router.navigate(['export/shipment-progress/measurement-search']);
                    } else if (data.Table[0].STATUS == 102) {
                        alert('Error! Please contact System Administrator.');
                    }
                }
            });
    }

    abort() {
        this._router.navigate(['export/shipment-progress/measurement-search']);
    }

}


@Component({
    selector: 'app-shipment-progress-out-of-charge',
    templateUrl: 'out-of-charge.sp.component.html'
})
export class OutOfChargeShipmentProgressComponent implements OnInit, OnChanges, AfterViewInit {
    @ViewChild('submitButton', {static: false}) submitButton: ElementRef;
    @ViewChild(FontChangerComponent, {static: false}) private disable: FontChangerComponent;
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
    Id: any = '';
    ExptNo: any = null;
    ErrorMessage: any = '';
    Date: any = null;
    constructor(
        private _router: Router,
        private _dataService: DataService,
        private _loginService: LoginService,
        private _activatedRoute: ActivatedRoute,
        private _toasterService: ToastCommonService) {
        this._activatedRoute.params.subscribe(params => { this.ExptNo = params.exptno; });
    }

    ngOnInit() {
        if (this.ExptNo.length != 15) {
            this.ErrorMessage = 'Invalid Export No. or Job No';
        }
        this.getData('OUT_OF_CHARGE', this.ExptNo);
    }
    ngOnChanges() { }

    ngAfterViewInit() {
        this.disable.disableButton(this.submitButton);
    }

    getData(formType, exptNo) {
        const _jsonData = {
            Type1: formType,
            Type2: exptNo,
            Type3: this._loginService.getLogin()[0].GUID,
            Type4: this._loginService.getLogin()[0].CMPID
        };
        this._dataService.getData("Export/ShipmentProgressPopulate", _jsonData)
            .subscribe((data: any) => {
                this.disable.enableButton(this.submitButton);
                if (data.Table != undefined) {
                    this.Id = data.Table[0].ID;
                    this.Date = (data.Table[0].OUTCHARGEDT != "") ? this._dataService.stringdttoArry(data.Table[0].OUTCHARGEDT) : null;
                } else {
                    alert('Not Found!');
                }
            });
    }

    submit() {
        this.disable.disableButton(this.submitButton);
        const _jsonData = {
            Type1: this.Id,
            Type2: this.ExptNo,
            Type3: (this.Date != null) ? this.Date.formatted : "",
            Type4: this._loginService.getLogin()[0].CMPID,
            Type5: this._loginService.getLogin()[0].MAKERIP //change later by ip
        };
        this._dataService.Common("Export/OutOfChargeUpdateShipmentProgress", _jsonData)
            .subscribe((data: any) => {
                this.disable.enableButton(this.submitButton);
                if (data.Table != undefined) {
                    if (data.Table[0].STATUS == 100) {
                        alert("Out of Charge details updated successfully!");
                        this._router.navigate(['export/shipment-progress/out-of-charge-search']);
                    } else if (data.Table[0].STATUS == 102) {
                        alert('Error! Please contact System Administrator.');
                    }
                }
            });
    }

    abort() {
        this._router.navigate(['export/shipment-progress/out-of-charge-search']);
    }

}

@Component({
    selector: 'app-shipment-progress-bl-details',
    templateUrl: 'bl-details.sp.component.html'
})
export class BlDetailsShipmentProgressComponent implements OnInit, OnChanges, AfterViewInit {
    @ViewChild('submitButton', {static: false}) submitButton: ElementRef;
    @ViewChild(FontChangerComponent, {static: false}) private disable: FontChangerComponent;
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
    Id: any = '';
    ExptNo: any = null;
    ErrorMessage: any = '';
    BlType: string = 'M';
    BLNo: any = '';
    BLDate: any = null;
    BLFreight: any = '-1';
    HBLNo: any = '';
    HBLDate: any = null;

    constructor(
        private _router: Router,
        private _dataService: DataService,
        private _loginService: LoginService,
        private _activatedRoute: ActivatedRoute,
        private _toasterService: ToastCommonService) {
        this._activatedRoute.params.subscribe(params => { this.ExptNo = params.exptno; });
    }

    ngOnInit() {
        if (this.ExptNo.length != 15) {
            this.ErrorMessage = 'Invalid Export No. or Job No';
        }
        this.getData('BL_DETAILS', this.ExptNo);
    }
    ngOnChanges() { }

    ngAfterViewInit() {
        this.disable.disableButton(this.submitButton);
    }

    getData(formType, exptNo) {
        const _jsonData = {
            Type1: formType,
            Type2: exptNo,
            Type3: this._loginService.getLogin()[0].GUID,
            Type4: this._loginService.getLogin()[0].CMPID
        };
        this._dataService.getData("Export/ShipmentProgressPopulate", _jsonData)
            .subscribe((data: any) => {
                this.disable.enableButton(this.submitButton);
                if (data.Table != undefined) {
                    this.Id = data.Table[0].ID;
                    this.BlType = (data.Table[0].EXPT_BLTYPE == "S") ? 'S' : 'M';
                    this.BLNo = data.Table[0].EXPT_BLNO;
                    this.BLDate = (data.Table[0].EXPT_BLDT != "") ? this._dataService.stringdttoArry(data.Table[0].EXPT_BLDT) : null;
                    this.BLFreight = data.Table[0].EXPT_MBLFRT;
                    this.HBLNo = data.Table[0].EXPT_HBLNO;
                    this.HBLDate = (data.Table[0].EXPT_HBLDT != "") ? this._dataService.stringdttoArry(data.Table[0].EXPT_HBLDT) : null;
                } else {
                    alert('Not Found!');
                }
            });
    }

    submit() {
        this.disable.disableButton(this.submitButton);
        const _jsonData = {
            Type1: this.Id,
            Type2: this.ExptNo,
            Type3: this.BLNo,
            Type4: (this.BLDate != null) ? this.BLDate.formatted : "",
            Type5: this.HBLNo,
            Type6: (this.HBLDate != null) ? this.HBLDate.formatted : "",
            Type7: this.BlType,
            Type8: (this.BLFreight != null) ? this.BLFreight : "",
            Type9: this._loginService.getLogin()[0].CMPID,
            Type10: this._loginService.getLogin()[0].MAKERIP //change later by ip
        };
        this._dataService.Common("Export/BlDetailsUpdateShipmentProgress", _jsonData)
            .subscribe((data: any) => {
                this.disable.enableButton(this.submitButton);
                if (data.Table != undefined) {
                    if (data.Table[0].STATUS == 100) {
                        alert("BL Details details updated successfully!");
                        this._router.navigate(['export/shipment-progress/bl-details-search']);
                    } else if (data.Table[0].STATUS == 102) {
                        alert('Error! Please contact System Administrator.');
                    }
                }
            });
    }

    abort() {
        this._router.navigate(['export/shipment-progress/bl-details-search']);
    }
}

@Component({
    selector: 'app-shipment-progress-carting-air',
    templateUrl: 'carting-air.sp.component.html'
})
export class CartingAirShipmentProgressComponent implements OnInit, OnChanges, AfterViewInit {
    @ViewChild('submitButton', {static: false}) submitButton: ElementRef;
    @ViewChild(FontChangerComponent, {static: false}) private disable: FontChangerComponent;
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
    Id: any = '';
    ExptNo: any = null;
    ErrorMessage: any = '';
    CartingDate: any = null;
    constructor(
        private _router: Router,
        private _dataService: DataService,
        private _loginService: LoginService,
        private _activatedRoute: ActivatedRoute,
        private _toasterService: ToastCommonService) {
        this._activatedRoute.params.subscribe(params => { this.ExptNo = params.exptno; });
    }

    ngOnInit() {
        if (this.ExptNo.length != 15) {
            this.ErrorMessage = 'Invalid Export No. or Job No';
        }
        this.getData('CARTING_AIR', this.ExptNo);
    }
    ngOnChanges() { }

    ngAfterViewInit() {
        this.disable.disableButton(this.submitButton);
    }

    getData(formType, exptNo) {
        const _jsonData = {
            Type1: formType,
            Type2: exptNo,
            Type3: this._loginService.getLogin()[0].GUID,
            Type4: this._loginService.getLogin()[0].CMPID
        };
        this._dataService.getData("Export/ShipmentProgressPopulate", _jsonData)
            .subscribe((data: any) => {
                this.disable.enableButton(this.submitButton);
                if (data.Table != undefined) {
                    this.Id = data.Table[0].ID;
                    this.CartingDate = (data.Table[0].CARTEDDT != "") ? this._dataService.stringdttoArry(data.Table[0].CARTEDDT) : null;
                } else {
                    alert('Not Found!');
                }
            });
    }

    submit() {
        this.disable.disableButton(this.submitButton);
        const _jsonData = {
            Type1: this.Id,
            Type2: this.ExptNo,
            Type3: (this.CartingDate != null) ? this.CartingDate.formatted : "",
            Type4: this._loginService.getLogin()[0].CMPID,
            Type5: this._loginService.getLogin()[0].MAKERIP //change later by ip
        };
        this._dataService.Common("Export/CartingAirUpdateShipmentProgress", _jsonData)
            .subscribe((data: any) => {
                this.disable.enableButton(this.submitButton);
                if (data.Table != undefined) {
                    if (data.Table[0].STATUS == 100) {
                        alert("Carting Air Date updated successfully!");
                        this._router.navigate(['export/shipment-progress/carting-air-search']);
                    } else if (data.Table[0].STATUS == 102) {
                        alert('Error! Please contact System Administrator.');
                    }
                }
            });
    }

    abort() {
        this._router.navigate(['export/shipment-progress/carting-air-search']);
    }
}

@Component({
    selector: 'app-shipment-progress-prealert-sent-on',
    templateUrl: 'prealert-sent-on.sp.component.html'
})
export class PrealertSentOnShipmentProgressComponent implements OnInit, OnChanges, AfterViewInit {
    @ViewChild('submitButton', {static: false}) submitButton: ElementRef;
    @ViewChild(FontChangerComponent, {static: false}) private disable: FontChangerComponent;
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
    Id: any = '';
    ExptNo: any = null;
    ErrorMessage: any = '';
    SentOnDate: any = null;
    constructor(
        private _router: Router,
        private _dataService: DataService,
        private _loginService: LoginService,
        private _activatedRoute: ActivatedRoute,
        private _toasterService: ToastCommonService) {
        this._activatedRoute.params.subscribe(params => { this.ExptNo = params.exptno; });
    }

    ngOnInit() {
        if (this.ExptNo.length != 15) {
            this.ErrorMessage = 'Invalid Export No. or Job No';
        }
        this.getData('PREALERT_SENT_ON', this.ExptNo);
    }
    ngOnChanges() { }

    ngAfterViewInit() {
        this.disable.disableButton(this.submitButton);
    }

    getData(formType, exptNo) {
        const _jsonData = {
            Type1: formType,
            Type2: exptNo,
            Type3: this._loginService.getLogin()[0].GUID,
            Type4: this._loginService.getLogin()[0].CMPID
        };
        this._dataService.getData("Export/ShipmentProgressPopulate", _jsonData)
            .subscribe((data: any) => {
                this.disable.enableButton(this.submitButton);
                if (data.Table != undefined) {
                    this.Id = data.Table[0].ID;
                    this.SentOnDate = (data.Table[0].PREALERTDT != "") ? this._dataService.stringdttoArry(data.Table[0].PREALERTDT) : null;
                } else {
                    alert('Not Found!');
                }
            });
    }

    submit() {
        this.disable.disableButton(this.submitButton);
        const _jsonData = {
            Type1: this.Id,
            Type2: this.ExptNo,
            Type3: (this.SentOnDate != null) ? this.SentOnDate.formatted : "",
            Type4: this._loginService.getLogin()[0].CMPID,
            Type5: this._loginService.getLogin()[0].MAKERIP //change later by ip
        };
        this._dataService.Common("Export/PrealertSentOnUpdateShipmentProgress", _jsonData)
            .subscribe((data: any) => {
                this.disable.enableButton(this.submitButton);
                if (data.Table != undefined) {
                    if (data.Table[0].STATUS == 100) {
                        alert("Prealert Date updated successfully!");
                        this._router.navigate(['export/shipment-progress/prealert-sent-on-search']);
                    } else if (data.Table[0].STATUS == 102) {
                        alert('Error! Please contact System Administrator.');
                    }
                }
            });
    }

    abort() {
        this._router.navigate(['export/shipment-progress/prealert-sent-on-search']);
    }
}

@Component({
    selector: 'app-shipment-progress-destination-document',
    templateUrl: 'destination-document-on.sp.component.html'
})
export class DestinationDocumentShipmentProgressComponent implements OnInit, OnChanges, AfterViewInit {
    @ViewChild('submitButton', {static: false}) submitButton: ElementRef;
    @ViewChild(FontChangerComponent, {static: false}) private disable: FontChangerComponent;
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
    Id: any = '';
    ExptNo: any = null;
    ErrorMessage: any = '';

    docRecdList: any = [];
    mainList: any = [];

    Date: any = null;
    CourierNo: any = '';
    Remark: any = '';
    IsAllRecd: any = '';
    IsDocRequired: any = '';
    IsDocumentSent: boolean = false;

    constructor(
        private _router: Router,
        private _dataService: DataService,
        private _loginService: LoginService,
        private _activatedRoute: ActivatedRoute,
        private _toasterService: ToastCommonService) {
        this._activatedRoute.params.subscribe(params => { this.ExptNo = params.exptno; });
    }

    ngOnInit() {
        if (this.ExptNo.length != 15) {
            this.ErrorMessage = 'Invalid Export No. or Job No';
        }
        this.getData('DESTINATION_DOCUMENTS', this.ExptNo);
    }
    ngOnChanges() { }

    ngAfterViewInit() {
        this.disable.disableButton(this.submitButton);
    }

    getData(formType, exptNo) {
        const _jsonData = {
            Type1: formType,
            Type2: exptNo,
            Type3: this._loginService.getLogin()[0].GUID,
            Type4: this._loginService.getLogin()[0].CMPID
        };
        this._dataService.getData("Export/ShipmentProgressPopulate", _jsonData)
            .subscribe((data: any) => {
                this.disable.enableButton(this.submitButton);
                if (data.Table != undefined) {
                    if (data.Table[0].STATUS == 100) {
                        this.docRecdList = data.Table1;
                        if (data.Table2.length > 0) {
                            this.mainList = data.Table2;
                            for (let i = 0; i < this.mainList.length; i++) {
                                this.mainList[i]["RECD"] = null;
                                this.mainList[i]["RECDDT"] = null;
                                this.mainList[i]["CALL"] = 'C' + this.mainList[i]["DOCCODE"];
                                this.mainList[i]["NA"] = null;
                            }
                            this.IsAllRecd = 'NO';
                            this.IsDocumentSent = false;
                        } else {
                            this.IsAllRecd = 'YES';
                            this.IsDocumentSent = true;
                        }
                        if (data.Table3.length > 0) {
                            this.Id = data.Table3[0].ID;
                            this.Date = (data.Table3[0].DOCSENTDT != "") ? this._dataService.stringdttoArry(data.Table3[0].DOCSENTDT) : null;
                            this.CourierNo = data.Table3[0].COURIERNO;
                            this.Remark = data.Table3[0].DESTDOCRMK;
                        }
                        this.IsDocRequired = 'YES';
                        this.ErrorMessage = "";
                    } else {
                        this.IsDocRequired = 'NO';
                        this.ErrorMessage = "DESTINATION DOCUMENTS ARE NOT REQUIRED FOR THIS CONSIGNEE";
                    }
                } else {
                    alert('Not Found!');
                }
            });
    }

    submit() {
        let DocStr = "";
        let cmpname = "";
        for (let i = 0; i < this.mainList.length; i++) {
            cmpname = "";
            if (this.mainList[i].RECD != null) {
                if (this.mainList[i].RECDDT != null) {
                    cmpname = this.mainList[i].DOCCODE + ';' + this.mainList[i].RECDDT.formatted;
                } else {
                    this._toasterService.toast('error', 'Error', "Please enter Recd Date for " + this.mainList[i].DOCUMENT);
                    return false;
                }
            } else if (this.mainList[i].CALL != null) {
                cmpname = this.mainList[i].DOCCODE + ';CALLED';
            } else if (this.mainList[i].NA != null) {
                cmpname = this.mainList[i].DOCCODE + ';NA';
            }
            DocStr = DocStr + cmpname + ",";
        }
        this.disable.disableButton(this.submitButton);
        const _jsonData = {
            Type1: this.Id,
            Type2: this.ExptNo,
            Type3: (this.IsAllRecd == 'YES') ? '' : DocStr,
            Type4: (this.IsAllRecd == 'YES') ? (this.Date != null) ? this.Date.formatted : "" : "",
            Type5: (this.IsAllRecd == 'YES') ? this.CourierNo : "",
            Type6: (this.IsAllRecd == 'YES') ? this.Remark : "",
            Type7: this._loginService.getLogin()[0].CITYCODE,
            Type8: this._loginService.getLogin()[0].CMPID,
            Type9: this._loginService.getLogin()[0].MAKERIP //change later by ip
        };
        this._dataService.Common("Export/DestinationDocumentUpdateShipmentProgress", _jsonData)
            .subscribe((data: any) => {
                this.disable.enableButton(this.submitButton);
                if (data.Table != undefined) {
                    if (data.Table[0].STATUS == 100) {
                        alert("Destination Document updated successfully!");
                        this._router.navigate(['export/shipment-progress/destination-document-search']);
                    } else if (data.Table[0].STATUS == 102) {
                        alert('Error! Please contact System Administrator.');
                    }
                }
            });
    }

    abort() {
        this._router.navigate(['export/shipment-progress/destination-document-search']);
    }
}

@Component({
    selector: 'app-shipment-progress-sea-to-air',
    templateUrl: 'transfer-sea-to-air.sp.component.html',
    styleUrls: ['../../../../node_modules/@ng-select/ng-select/themes/default.theme.css'], 
    encapsulation: ViewEncapsulation.None
})
export class SeaToAirShipmentProgressComponent implements OnInit, OnChanges, AfterViewInit {
    @ViewChild('submitButton', {static: false}) submitButton: ElementRef;
    @ViewChild(FontChangerComponent, {static: false}) private disable: FontChangerComponent;
    Id: any = '';
    ExptNo: any = null;
    ErrorMessage: any = '';
    CompanyList: any = [];
    Company: any = null;
    constructor(
        private _router: Router,
        private _dataService: DataService,
        private _loginService: LoginService,
        private _activatedRoute: ActivatedRoute,
        private _toasterService: ToastCommonService) {
        this._activatedRoute.params.subscribe(params => { this.ExptNo = params.exptno; });
    }

    ngOnInit() {
        if (this.ExptNo.length != 15) {
            this.ErrorMessage = 'Invalid Export No. or Job No';
        }
        this.getData();
    }
    ngOnChanges() { }

    ngAfterViewInit() {
        this.disable.disableButton(this.submitButton);
    }

    getData() {
        const _jsonData = {
            CityCode: this._loginService.getLogin()[0].CITYCODE
        };
        this._dataService.getData("Export/TransferSeaToAirShipmentProgressPopulate", _jsonData)
            .subscribe((data: any) => {
                this.disable.enableButton(this.submitButton);
                if (data.Table != undefined) {
                    this.CompanyList = data.Table;
                } else {
                    alert('Not Found!');
                }
            });
    }

    submit() {
        if (this.Company == null) {
            alert("Please select Company Name.");
            return false;
        }


        this.disable.disableButton(this.submitButton);
        const _jsonData = {
            Type1: this.ExptNo,
            Type2: this.Company,
            Type3: this._loginService.getLogin()[0].CITYCODE,
            Type4: this._loginService.getLogin()[0].CITYCODE1,
            Type5: this._loginService.getLogin()[0].CMPID,
            Type6: this._loginService.getLogin()[0].MAKERIP //change later by ip
        };
        this._dataService.Common("Export/TransferSeaToAirUpdateShipmentProgress", _jsonData)
            .subscribe((data: any) => {
                this.disable.enableButton(this.submitButton);
                if (data.Table != undefined) {
                    if (data.Table[0].STATUS == 100) {
                        alert("Export details Transfered successfully!. Air Export No is : " + String(data.Table[0].EXPTNO));
                        this._router.navigate(['export/shipment-progress/transfer-sea-to-air-search']);
                    } else if (data.Table[0].STATUS == 102) {
                        alert('Error! Please contact System Administrator.');
                    }
                }
            });
    }

    abort() {
        this._router.navigate(['export/shipment-progress/transfer-sea-to-air-search']);
    }

}


@Component({
    selector: 'app-shipment-progress-receipt-cargo-provision',
    templateUrl: 'receipt-cargo-provision.sp.component.html',
    styleUrls: ['../../../../node_modules/@ng-select/ng-select/themes/default.theme.css'], 
    encapsulation: ViewEncapsulation.None
})
export class ReceiptCargoProvisionShipmentProgressComponent implements OnInit, OnChanges, AfterViewInit {

    @ViewChild('searchButton', {static: false}) searchButton: ElementRef;
    @ViewChild('addButton', {static: false}) addButton: ElementRef;
    @ViewChild('updateButton', {static: false}) updateButton: ElementRef;
    @ViewChild('submitButton', {static: false}) submitButton: ElementRef;
    @ViewChild(FontChangerComponent, {static: false}) private disable: FontChangerComponent;
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
    viewType: string = 'Search';
    RightsList: any = [];
    ShipperList: any = [];
    ConsigneeList: any = [];
    Shipper: any = null;
    Consignee: any = null;
    Id: any = '';
    ExptNo: any = null;
    TOTPKGS: any = '';
    TOT_DTLS_PKGS: any = '0';
    ErrorMessage: any = '';
    cargoList: any = [];

    GuId: string = '';
    Type: string = 'A';
    TblIndexId: any = '0';
    cargoId: any = '0';
    NoOfPkgs: any = '';
    EditValue: any = '';
    RecdDate: any = null;
    RecdTime: any = '00';
    RecdMin: any = '00';
    RecdWhere: any = '';
    RecdLocal: any = null;
    RecdLocalTime: any = '00';
    RecdLocalMin: any = '00';
    constructor(
        private _router: Router,
        private _dataService: DataService,
        private _loginService: LoginService,
        private _activatedRoute: ActivatedRoute,
        private _toasterService: ToastCommonService) {

    }

    ngOnInit() {
        this._loginService.verifyRights(218, '')
            .subscribe((data: any) => {
                this.RightsList = data;
                this._loginService.checkVerify('View', this.RightsList);  //For verify user access
                this.GuId = this._loginService.getLogin()[0].GUID;
                this.fillDropdown();
            });
    }
    ngOnChanges() { }

    ngAfterViewInit() {
        this.disable.disableButton(this.searchButton);
    }

    fillDropdown() {
        const _jsonData = {
            CityCode: this._loginService.getLogin()[0].CITYCODE
        };
        this._dataService.getData("Export/ROCProvisionShipmentProgressFill", _jsonData)
            .subscribe((data: any) => {
                this.disable.enableButton(this.searchButton);
                if (data.Table != undefined) {
                    this.ShipperList = data.Table;
                    this.ConsigneeList = data.Table1;
                } else {
                    alert('Not Found!');
                }
            });
    }

    Search() {
        if (this.Shipper == null) {
            this._toasterService.toast('error', 'Error', 'Select Shipper');
            return false;
        }
        else if (this.Consignee == null) {
            this._toasterService.toast('error', 'Error', 'Select Consignee');
            return false;
        }
        let check = this._loginService.checkVerifyWithMessage('Add', this.RightsList);
        if (check.Status === false) {
            this._toasterService.toast('error', 'Form: ' + check.FormName, check.ErrorMessage);
            return false;
        }
        this.viewType = 'Add';
    }

    populate(TYPE, TBL_INDEXID, CARGOID, GUID, EXPTNO, NOOFPKGS, RECDDATE, RECDTIME, RECDWHERE, RECDLOCAL, RECDLOCALTIME) {
        this.TblIndexId = TBL_INDEXID;
        this.cargoId = CARGOID;
        this.NoOfPkgs = NOOFPKGS;
        this.EditValue = NOOFPKGS;
        this.RecdDate = (RECDDATE != "") ? this._dataService.stringdttoArry(RECDDATE) : null;
        if (RECDTIME != "") {
            this.RecdTime = RECDTIME.split(":")[0];
            this.RecdMin = RECDTIME.split(":")[1];
        }
        else {
            this.RecdTime = "00";
            this.RecdMin = "00";
        }
        this.RecdWhere = RECDWHERE;
        this.RecdLocal = (RECDLOCAL != "") ? this._dataService.stringdttoArry(RECDLOCAL) : null;
        if (RECDLOCALTIME != "") {
            this.RecdLocalTime = RECDLOCALTIME.split(":")[0];
            this.RecdLocalMin = RECDLOCALTIME.split(":")[1];
        }
        else {
            this.RecdLocalTime = "00";
            this.RecdLocalMin = "00";
        }
        this.Type = TYPE;
    }

    addUpdate() {
        if (this.validation() == false) { return false; }
        let NOOFPKGS = this.NoOfPkgs;
        let EditValue = this.EditValue;
        if (EditValue == '') {
            EditValue = '0'
        }
        let TotalValue = Math.abs(this.TOTPKGS);
        let TotalDtlsValue = this.TOT_DTLS_PKGS;
        TotalDtlsValue = (Math.abs(TotalDtlsValue) - Math.abs(EditValue)) + Math.abs(NOOFPKGS);
        if (TotalValue >= Math.abs(NOOFPKGS)) {
            if (TotalValue < TotalDtlsValue) {
                alert("Total No.Of Pkgs should be less then or equal to " + String(TotalValue));
                return false;
            }
        } else {
            alert("Can not add more than Total No.Of Pkgs " + String(TotalValue));
            return false;
        }

        let RECDDATE = (this.RecdDate != null) ? this.RecdDate.formatted : "";
        let RecdTimeHour = (this.RecdTime != null) ? this.RecdTime : "";
        let RecdTimeMin = (this.RecdMin != null) ? this.RecdMin : "";
        let RECDTIME = String(RecdTimeHour) + ':' + String(RecdTimeMin);
        let RECDWHERE = this.RecdWhere;
        let RECDLOCAL = (this.RecdLocal != null) ? this.RecdLocal.formatted : "";
        let RecdLocalTimeHour = (this.RecdLocalTime != null) ? this.RecdLocalTime : "";
        let RecdLocalTimeMin = (this.RecdLocalMin != null) ? this.RecdLocalMin : "";
        let RECDLOCALTIME = String(RecdLocalTimeHour) + ':' + String(RecdLocalTimeMin);
        if (RECDLOCAL == "") {
            let RecdLocalTime = "00:00";
        }
        let CARGOID = this.cargoId;
        let EXPTNO = this.ExptNo;
        let GUID = this.GuId;
        let TBL_INDEXID = this.TblIndexId;
        let TYPE = this.Type;
        //if (TYPE != 'E') {
        //    TYPE = 'A'
        //}
        //return false;
        if (this.Type == 'A') { this.disable.disableButton(this.addButton); }
        else { this.disable.disableButton(this.updateButton); }

        const _jsonData = {
            Tbl_IndexId: TBL_INDEXID,
            CargoId: CARGOID,
            ExptNo: EXPTNO,
            NoOfPkgs: NOOFPKGS,
            RecdDate: RECDDATE,
            RecdWhere: RECDWHERE,
            RecdLocal: RECDLOCAL,
            RecdTime: RECDTIME,
            RecdLocalTime: RECDLOCALTIME,
            Guid: GUID,
            CmpId: this._loginService.getLogin()[0].CMPID,
            Type: TYPE
        };
        this._dataService.Common("Export/ReceiptCargoUpdateDtlsShipmentProgress", _jsonData)
            .subscribe((data: any) => {
                if (this.Type == 'A') { this.disable.enableButton(this.addButton); }
                else { this.disable.enableButton(this.updateButton); }
                if (data.Table != undefined) {
                    this.cargoList = data.Table;
                    this.TOT_DTLS_PKGS = data.Table[0].TOTPKGS;
                    this.populate('A', "0", "0", "", "", "", "", "00:00", "", "", "00:00");
                } else {
                    alert('Not Found!');
                }
            });
    }

    submit() {
        this.disable.disableButton(this.submitButton);
        const _jsonData = {
            Type1: this.Id,
            Type2: this.ExptNo,
            Type3: this._loginService.getLogin()[0].GUID,
            Type4: this._loginService.getLogin()[0].CMPID,
            Type5: this._loginService.getLogin()[0].MAKERIP //change later by ip
        };
        this._dataService.Common("Export/ReceiptCargoUpdateShipmentProgress", _jsonData)
            .subscribe((data: any) => {
                this.disable.enableButton(this.submitButton);
                if (data.Table != undefined) {
                    if (data.Table[0].STATUS == 100) {
                        alert("Receipt of Cargo details updated successfully!");
                        this._router.navigate(['export/shipment-progress/receipt-cargo-with-job-no-search']);
                    } else if (data.Table[0].STATUS == 102) {
                        alert('Error! Please contact System Administrator.');
                    }
                }
            });
    }

    abort() {
        this._router.navigate(['export/shipment-progress/receipt-cargo-with-job-no-search']);
    }


    validation() {
        if (this.NoOfPkgs == "") {
            alert("Please enter No Of Pkgs.");
            return false;
        }
        else if (this.RecdDate == "") {
            alert("Please select Received Date.");
            return false;
        }
        if (this.RecdWhere != "") {
            if (this.RecdLocal == "") {
                alert("Please enter Locally Recd Time.");
                return false;
            }
        }
        if (this.RecdLocal != "") {
            if (this.RecdWhere == "") {
                alert("Please enter Received Where.");
                return false;
            }
        }
        return true;
    }

    reset() {
        this.populate('A', "0", "0", "", "", "", "", "00:00", "", "", "00:00");
    }
}


@Component({
    selector: 'app-shipment-progress-scan-docs-sent',
    templateUrl: 'scan-docs-sent.sp.component.html'
})
export class ScanDocSentShipmentProgressComponent implements OnInit, OnChanges, AfterViewInit {

    @ViewChild(FontChangerComponent, {static: false}) _disable: FontChangerComponent;
    @ViewChild('submitButton', {static: false}) submitButton: ElementRef;
    RightsList: any = [];
    viewType: string = 'Search';
    ContainerNo: any = '';
    searchList: any = [];
    ErrorMessage: string = '';
    constructor(
        private _router: Router,
        private _dataService: DataService,
        private _loginService: LoginService,
        private _activatedRoute: ActivatedRoute,
        private _toasterService: ToastCommonService
    ) {

    }

    ngOnInit() {
        this._loginService.verifyRights(228, '')
            .subscribe((data: any) => {
                this.RightsList = data;
                this._loginService.checkVerify('Modify', this.RightsList);  //For verify user access
            });
    }
    ngOnChanges() { }

    ngAfterViewInit() {
    }

    Search() {
        if (this.ContainerNo == '') {
            this._toasterService.toast('error', 'Error', 'Please enter ContainerNo.');
            return false;
        } else if (this.ContainerNo.length != 11) {
            this._toasterService.toast('error', 'Error', 'Container No length should be 11.');
            return false;
        }
        this.getSearchData(this.ContainerNo);
    }

    getSearchData(ContainerNo) {
        const _jsonData = {
            ContainerNo: this.ContainerNo
        };
        this._dataService.getData("Export/ScanDocSentShipmentProgressFill", _jsonData)
            .subscribe((data: any) => {
                if (data.Table != undefined) {
                    this.searchList = data.Table;
                    if (this.searchList.length > 0) {
                        this.viewType = 'List';
                        for (let i = 0; i < this.searchList.length; i++) {
                            this.searchList[i]["Sent"] = false;
                        }
                        this.ErrorMessage = '';
                    } else {
                        this.ErrorMessage = 'There is no record for this Container No [' + this.ContainerNo + ']';
                    }
                } else {
                    alert('Not Found!');
                }
            });
    }

    getCount() {
        return this.searchList.filter((search: any) => search.SCANDOCS === 'NO').length;
    }

    submit() {
        let tmpVessel = '';
        let tmpCount = this.searchList.filter((search: any) => search.SCANDOCS === 'NO' && search.Sent === true);
        if (tmpCount.length === 0) {
            this.ErrorMessage = 'Please select atleast one.';
            return false;
        } else {
            this.ErrorMessage = '';
        }


        let tmpString = '';
        for (let i = 0; i < tmpCount.length; i++) {
            tmpString = tmpString + tmpCount[i].CONTAINERID + ',' + this.ContainerNo + ',' + tmpCount[i].EXPT_VESSEL + '|';
            tmpVessel = tmpVessel + tmpCount[i].EXPT_VESSEL + ',';
        }

        tmpString = tmpString.substring(0, tmpString.length - 1);
        tmpVessel = tmpVessel.substring(0, tmpVessel.length - 1);
        this._disable.disableButton(this.submitButton);
        const _jsonData = {
            Type1: tmpString,
            Type2: this._loginService.getLogin()[0].CMPID,
            Type3: this._loginService.getLogin()[0].MAKERIP //change later by ip,
        };
        this._dataService.Common("Export/ScanDocSentUpdateShipmentProgress", _jsonData)
            .subscribe((data: any) => {
                this._disable.enableButton(this.submitButton);
                this._toasterService.toast('success', 'Success', 'Doc Sent Date updated for ' + tmpVessel + ' Rotation No(s).');
                this.getSearchData(this.ContainerNo);
            });
    }
}


@Component({
    selector: 'app-shipment-progress-pending-shipment',
    templateUrl: 'pending-shipment.sp.component.html',
    styleUrls: ['../../../../node_modules/@ng-select/ng-select/themes/default.theme.css'], 
    encapsulation: ViewEncapsulation.None
})
export class PendingShipmentShipmentProgressComponent implements OnInit, OnChanges, AfterViewInit {

    @ViewChild('searchButton', {static: false}) searchButton: ElementRef;
    @ViewChild('submitButton', {static: false}) submitButton: ElementRef;
    @ViewChild('submitContainerButton', {static: false}) submitContainerButton: ElementRef;
    @ViewChild(FontChangerComponent, {static: false}) private fontDisabled: FontChangerComponent;
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
    viewType: string = 'Search';
    RightsList: any = [];
    VesselName: string = '';
    VoyageNo: string = '';
    searchList: any = [];
    ErrorMessage: string = '';
    ReportType: string = '';

    //Export No
    VesselLabel: string = '';
    ExportNoList: any = [];
    SelectAll: boolean = false;
    NewVessel: any = null;
    NewVesselList: any = [];
    NewAgent: any = null;
    NewAgentList: any = [];
    ExportErrorMessage: string = '';
    DataSet: any = [];

    //Container No
    ContainerNoList: any = [];
    ContainerErrorMessage: string = '';

    //TRANSFER CONTAINER DETAILS 
    ContainerExptVessel: string = '';
    ContainerHeader: string = '';
    ContainerDetailsList: any = [];
    ContainerVessel: any = null;
    ContainerVesselList: any = [];
    ContainerAgent: any = null;
    ContainerAgentList: any = [];
    ContainerLiner: any = null;
    ContainerLinerList: any = [];

    constructor(
        private _router: Router,
        private _dataService: DataService,
        private _loginService: LoginService,
        private _activatedRoute: ActivatedRoute,
        private _toasterService: ToastCommonService,
        private _disabled: ButtonService) {

    }

    ngOnInit() {
        this._loginService.verifyRights(230, '')
            .subscribe((data: any) => {
                this.RightsList = data;
                this._loginService.checkVerify('Modify', this.RightsList);  //For verify user access
                //this.fillDropdown();
            });

    }
    ngOnChanges() { }

    ngAfterViewInit() {
        //this.disable.disableButton(this.searchButton);
    }

    fillDropdown() {
        const _jsonData = {
            CityCode: this._loginService.getLogin()[0].CITYCODE
        };
        this._dataService.getData("Export/ROCProvisionShipmentProgressFill", _jsonData)
            .subscribe((data: any) => {
                this._disabled.enableButton(this.searchButton);
                if (data.Table != undefined) {
      
                } else {
                    alert('Not Found!');
                }
            });
    }

    Search() {
        if (this.VesselName == '' && this.VoyageNo == '') {
            this._toasterService.toast('error', 'Alert', 'Please enter atleast any of Vessel Name & Voyage No');
            return false;
        }
        const _jsonData = {
            Type1: this.VesselName,
            Type2: this.VoyageNo,
            Type3: this._loginService.getLogin()[0].CITYCODE
        };
        this._disabled.disableButton(this.searchButton);
        this._dataService.Common("Export/PendingShipment_ShipmentProgressFill", _jsonData)
            .subscribe((data: any) => {
                this._disabled.enableButton(this.searchButton);
                if (data.Table != undefined) {
                    if (data.Table.length > 0) {
                        this.searchList = data.Table;
                    } else {
                        this.searchList = [];
                        this._toasterService.toast('info', 'Data', 'No Record Found.');
                    }
                }
            });
    }

    rowSearchSendClick(RtNo, VslName, VoyageNo, ETD) {
        this.ErrorMessage = "Please Wait Preparing Data....";
        this.VesselLabel = "VESSEL : " + RtNo + " - " + VslName + " - " + VoyageNo + " - " + ETD;
        this.VesselName = VslName;
        this.getExportNoData(RtNo);
    }

    getExportNoData(rnno) {
        this.SelectAll = false;
        this.ExportNoList = [];
        const _jsonData = {
            VesselRtNo: rnno,
            CityCode: this._loginService.getLogin()[0].CITYCODE
        };
        this._dataService.getData("Export/PendingShipment_ShipmentProgressView", _jsonData)
            .subscribe((data: any) => {
                this.ErrorMessage = "";
                this.viewType = 'View';
                if (data.Table != undefined) {
                    if (data.Table.length > 0) {
                        this.ExportNoList = data.Table;
                        for (let i = 0; i < this.ExportNoList.length; i++) {
                            this.ExportNoList[i]["Check"] = false;
                        }
                        this.NewVesselList = data.Table2;
                    } else {
                        this.ExportNoList = [];
                        this._toasterService.toast('info', 'Data', 'No Export Record Found.');
                    }
                }
                if (data.Table1 != undefined) {
                    if (data.Table1.length > 0) { this.ContainerNoList = data.Table1; }
                    else { this.ContainerNoList = []; this._toasterService.toast('info', 'Data', 'No Container Record Found.'); }
                }
            });
    }

    changeNewVessel(new_vessel) {
        if (new_vessel != null) {
            const _jsonData = {
                VesselRtNo: new_vessel.split("|")[0],
                VesselPort: new_vessel.split("|")[1]
            };
            this._dataService.getData("Export/PendingShipment_ShipmentProgressView_Agent", _jsonData)
                .subscribe((data: any) => {
                    if (data.Table != undefined) {
                        if (data.Table.length > 0) {
                            this.NewAgentList = data.Table;
                        } else {
                            this.NewAgentList = [];
                            this._toasterService.toast('info', 'Data', 'No Record Found.');
                        }
                    }
                });
        }
    }

    checkSelectAll() {
        this.SelectAll = (this.SelectAll) ? false : true;
        for (let i = 0; i < this.ExportNoList.length; i++) {
            this.ExportNoList[i]["Check"] = this.SelectAll;
        }
    }

    rowContainerSendClick(expt_vessel, containerno, agentname, containerstatus) {
        this.ContainerHeader = 'To transfer the container (' + containerno + ') from Vessel (' + this.VesselName + ') Agent (' + agentname + ') You have to transfer all the following containers';
        this.ContainerExptVessel = expt_vessel;
        this.getContainerNoDetails(expt_vessel, containerno);
    }

    getContainerNoDetails(expt_vessel, containerno) {
        const _jsonData = {
            ExptVessel: expt_vessel,
            ContainerNo: containerno,
            CmpId: this._loginService.getLogin()[0].CMPID,
            CityCode: this._loginService.getLogin()[0].CITYCODE
        };
        this._dataService.getData("Export/PendingShipment_ShipmentProgress_ContainerNo_Populate", _jsonData)
            .subscribe((data: any) => {
                this.viewType = 'ContainerDetail';
                if (data.Table != undefined) {
                    this.ContainerDetailsList = data.Table;
                    this.ContainerVesselList = data.Table1;
                }
            });
    }

    changeContainerNewVessel(new_vessel) {
        if (new_vessel != null) {
            const _jsonData = {
                VesselRtNo: new_vessel.split("|")[0],
                VesselPort: new_vessel.split("|")[1]
            };
            this._dataService.getData("Export/PendingShipment_ShipmentProgressView_Agent", _jsonData)
                .subscribe((data: any) => {
                    if (data.Table != undefined) {
                        if (data.Table.length > 0) {
                            this.ContainerAgentList = data.Table;
                            this.ContainerLinerList = data.Table1;
                        } else {
                            this.ContainerAgentList = [];
                            this._toasterService.toast('info', 'Data', 'No Record Found.');
                        }
                    }
                });
        }
    }

    submit() {
        let exportnos = this.ExportNoList.filter((search: any) => search.Check === true);
        if (exportnos.length === 0) {
            this._toasterService.toast('error', 'Alert', 'Please Select Atleast one Export No.');
        } else if (this.NewVessel == null) {
            this._toasterService.toast('error', 'Alert', 'Please select New Vessel Name.');
        } else if (this.NewAgent == null) {
            this._toasterService.toast('error', 'Alert', 'Please select Agent Name for this current Vessel.');
        } else {
            let strExportNos = '';
            for (let i = 0; i < this.ExportNoList.length; i++) {
                if (this.ExportNoList[i].Check === true) {
                    strExportNos = strExportNos + this.ExportNoList[i].EXPTNO + ',';
                }
            }
            var answer = confirm("Are you sure you want to Transfer selected shipments to another vessel?")
            if (answer == true) {
                let NewVesselName = this.NewVesselList.filter((search: any) => search.VALUEFIELD === this.NewVessel)[0].TEXTFIELD;
                this._disabled.disableButton(this.submitButton);
                const _jsonData = {
                    ExptNos: strExportNos,
                    VesselRtNo: this.NewVessel.split("|")[0],
                    VesselPort: this.NewVessel.split("|")[1],
                    ExptAgent: this.NewAgent,
                    CmpId: this._loginService.getLogin()[0].CMPID,
                    MakerIp: this._loginService.getLogin()[0].MAKERIP //change later by ip
                };
                this._dataService.Common("Export/PendingShipment_ShipmentProgress_ExportNo", _jsonData)
                    .subscribe((data: any) => {
                        this._disabled.enableButton(this.submitButton);
                        this._toasterService.toast('success', 'Success', 'Selected Pending Shipments Transfer to Vessel (' + NewVesselName + ') Successfully!');
                        this.DataSet = data;
                        this.ReportType = 'EXPORTNO';
                        this.viewType = 'Report';
                    });
            }
        }
    }

    submitContainer() {
        if (this.ContainerVessel == null) {
            this._toasterService.toast('error', 'Alert', 'Please select New Vessel Name.');
        } else if (this.ContainerAgent == null) {
            this._toasterService.toast('error', 'Alert', 'Please select Agent Name for this current Vessel.');
        } else {
            let NewVesselName = this.ContainerVesselList.filter((search: any) => search.VALUEFIELD === this.ContainerVessel)[0].TEXTFIELD;
            this._disabled.disableButton(this.submitContainerButton);
            const _jsonData = {
                ExptVessel: this.ContainerExptVessel,
                VesselRtNo: this.ContainerVessel.split("|")[0],
                VesselPort: this.ContainerVessel.split("|")[1],
                ExptAgent: this.ContainerAgent,
                ShipLiner: "",
                GuId: this._loginService.getLogin()[0].CMPID,
                CmpId: this._loginService.getLogin()[0].CMPID,
                MakerIp: this._loginService.getLogin()[0].MAKERIP //change later by Ip
            };
            this._dataService.Common("Export/PendingShipment_ShipmentProgress_ContainerNo", _jsonData)
                .subscribe((data: any) => {
                    this._disabled.enableButton(this.submitContainerButton);
                    this._toasterService.toast('success', 'Success', 'Selected Pending Shipments Transfer to Vessel (' + NewVesselName + ') Successfully!');
                    this.clear();
                });
        }
    }

    back(event) {
        if (event) {
            this.clear();
        }
    }

    clear() {
        this.ContainerExptVessel = '';
        this.ContainerDetailsList = [];
        this.ContainerVesselList = [];
        this.ContainerVessel = null;
        this.ExportNoList = [];
        this.NewVesselList = [];
        this.NewVessel = null;
        this.NewAgentList = [];
        this.NewAgent = null;
        this.ContainerNoList = [];
        this.viewType = 'Search';
        this.VesselName = '';
        this.VoyageNo = '';
        this.searchList = [];
    }

    abort() {

    }


    reset() {

    }
}


@Component({
    selector: 'app-shipment-progress-pending-shipment-report',
    templateUrl: 'pending-shipment-report.sp.component.html'
})
export class PendingShipReportShipmentProgressComponent implements OnInit, OnChanges {

    @Input() DataSet: any = [];
    @Input() ReportType: string = '';
    @Input() OldVessel: string = '';
    @Output() result = new EventEmitter<any>();
    ExportList: any = [];
    ContainerList: any = [];
    Header: string = '';
    NewVessel: string = '';
    constructor(private _router: Router) {

    }
    ngOnInit() { }

    ngOnChanges() {
        if (this.ReportType != '') {
            if (this.ReportType === 'EXPORTNO') {
                this.Header = 'Following Export No(s) successfully transfred to New Vessel.';
                this.fillExportNo();
            }
            else {
                this.Header = 'Following Container(s) and Export No(s) successfully transfred to New Vessel.';
                this.fillContainerNo();
            }

            if (this.DataSet.Table1.length > 0) {
                this.NewVessel = "VESSEL : " + this.DataSet.Table1[0].VESSEL_NAME
                    + " AGENT : " + this.DataSet.Table1[0].AGENT_NAME
                    + " PORT : " + this.DataSet.Table1[0].PORT_NAME;
            }
        }
    }

    fillExportNo() {
        this.ExportList = this.DataSet.Table;
    }

    fillContainerNo() {
        this.ContainerList = this.DataSet.Table;
    }

    back() {
        this.result.emit(true);
    }
}

@Component({
    templateUrl: 'container-loading-confirmation.sp.component.html',
    styleUrls: ['../../../../node_modules/@ng-select/ng-select/themes/default.theme.css'], 
    encapsulation: ViewEncapsulation.None
})
export class ContainerLoadingShipmentProgressComponent implements OnInit, OnChanges {

    @ViewChild('searchButton', {static: false}) searchButton: ElementRef;
    @ViewChild('submitButton', {static: false}) submitButton: ElementRef;
    @ViewChild('submitContainerButton', {static: false}) submitContainerButton: ElementRef;
    @ViewChild(FontChangerComponent, {static: false}) private fontDisabled: FontChangerComponent;

    viewType: string = 'Search';
    RightsList: any = [];
    VesselName: string = '';
    VoyageNo: string = '';
    searchList: any = [];
    ErrorMessage: string = '';

    ContainerDataSet: any = [];
    UpdateDataSet: any = [];
    ReportDataSet: any = [];
    EditData: any = {};
    constructor(
        private _router: Router,
        private _dataService: DataService,
        private _loginService: LoginService,
        private _activatedRoute: ActivatedRoute,
        private _toasterService: ToastCommonService,
        private _disabled: ButtonService) {

    }

    ngOnInit() {
        this._loginService.verifyRights('231', '')
            .subscribe((data: any) => {
                this.RightsList = data;
                this._loginService.checkVerify('Add', this.RightsList);  //For verify user access
            });

    }
    ngOnChanges() { }

    Search() {
        if (this.VesselName == '' && this.VoyageNo == '') {
            this._toasterService.toast('error', 'Alert', 'Please enter atleast any of Vessel Name & Voyage No');
            return false;
        }
        const _jsonData = {
            Type1: this.VesselName,
            Type2: this.VoyageNo,
            Type3: this._loginService.getLogin()[0].CITYCODE
        };
        this._disabled.disableButton(this.searchButton);
        this._dataService.Common("Export/PendingShipment_ShipmentProgressFill", _jsonData)
            .subscribe((data: any) => {
                this._disabled.enableButton(this.searchButton);
                if (data.Table != undefined) {
                    if (data.Table.length > 0) {
                        this.searchList = data.Table;
                    } else {
                        this.searchList = [];
                        this._toasterService.toast('info', 'Data', 'No Record Found.');
                    }
                }
            });
    }

    rowSearchSendClick(RtNo, VslName, VoyageNo, ETD) {
        this.ErrorMessage = "Please Wait Preparing Data....";

        this.VesselName = VslName;
        this.getContainerData(RtNo);
    }

    getContainerData(rnno) {
        this.ContainerDataSet = [];
        const _jsonData = {
            ExptVessel: rnno,
            CityCode: this._loginService.getLogin()[0].CITYCODE
        };
        this._dataService.getData("Export/ContainerLoadingConf_ShipmentProgress", _jsonData)
            .subscribe((data: any) => {
                this.ErrorMessage = '';
                this.viewType = 'View';
                this.ContainerDataSet = data;
            });
    }

    editdata(event) {
        this.ErrorMessage = 'Please Wait Fetching Data....';
        this.EditData = event;
        const _jsonData = {
            ExptVessel: event.EXPT_RTNO,
            ContainerNo: event.CONTAINERNO,
            MultiDest: event.MULTIDEST,
            Dest: event.DEST,
            CityCode: this._loginService.getLogin()[0].CITYCODE
        };
        this._dataService.getData("Export/ContainerLoadingConf_ShipmentProgress_Populate", _jsonData)
            .subscribe((data: any) => {
                this.ErrorMessage = '';
                this.viewType = 'Update';
                this.UpdateDataSet = data;
            });
    }

    reportdata(event) {
        this.ReportDataSet = event;
        this.viewType = 'Report';
    }

    back(event) {
        if (event) {
            this.viewType = 'Search';
            this.VesselName = '';
            this.VoyageNo = '';
            this.searchList = [];
        }
    }
}

@Component({
    selector: 'app-shipment-progress-container-loading-view',
    templateUrl: 'view-container-loading-confirmation.sp.component.html',
    styles: ['.scroll::-webkit-scrollbar{width:10px}.scroll::-webkit-scrollbar-track{background:#f1f1f1}.scroll::-webkit-scrollbar-thumb{background:#888}.scroll::-webkit-scrollbar-thumb:hover{background:#555}']
})
export class ViewContainerLoadingShipmentProgressComponent implements OnInit, OnChanges {

    @Input() DataSet: any = [];
    @Output() editdata = new EventEmitter<any>();
    @Output() backtosearch = new EventEmitter<any>();
    VesselDetail: any = {};
    ContainerList: any = [];
    Header: string = '';
    NewVessel: string = '';
    ErrorMessage: string = '';
    keys: string[] = [];
    constructor() { }
    ngOnInit() { }

    ngOnChanges() {
        this.VesselDetail = this.DataSet.Table[0];
        this.ContainerList = this.DataSet.Table1;
        if (this.ContainerList.length > 0) {
            this.ContainerList = this.DataSet.Table1;
            this.keys = Object.keys(this.ContainerList[0]);
        }
    }

    edit(expt_rtno, multidest, dest, containerno) {
        this.editdata.emit({ EXPT_RTNO: expt_rtno, MULTIDEST: multidest, DEST: dest, CONTAINERNO: containerno })
    }

    back() {
        this.backtosearch.emit(true);
    }
}

@Component({
    selector: 'app-shipment-progress-container-loading-update',
    templateUrl: 'update-container-loading-confirmation.sp.component.html',
    styleUrls: ['../../../../node_modules/@ng-select/ng-select/themes/default.theme.css'], 
    encapsulation: ViewEncapsulation.None
})
export class UpdateContainerLoadingShipmentProgressComponent implements OnInit, OnChanges {

    @Input() DataSet: any = [];
    @Input() EditData: any;
    @Output() backtosearch = new EventEmitter<any>();
    @Output() updatedata = new EventEmitter<any>();
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
    @ViewChild('updateButton', {static: false}) updateButton: ElementRef;
    @ViewChild('abortButton', {static: false}) abortButton: ElementRef;

    RotationNo: any = '';
    VoyageNo: any = '';
    VesselName: any = '';
    LastCartingDate: any = '';
    ETD: any = '';
    ActSailingDate: any = '';
    ContainerNo: any = '';
    NoOfPackage: any = '';
    TotalVolume: any = '';
    AgentName: any = '';
    Destination: any = '';

    MessageLoadNotDone: string = '';
    LabelLoadOriginDt: any = '';
    hiddenLoadDate: any = '';
    hiddenLoadDateOne: any = '';
    hiddenLoadDateTwo: any = '';
    CheckLoadOriginDt: boolean = false;
    MessageLoadOriginDtMsg: string = '';
    TransType: string = 'Direct';

    CityList: any = [];
    TransPortOne: any = null;
    ConnVesselList: any = [];
    ConnVesselListOne: any = [];
    ConnVesselOne: any = null;
    disableEtdPort: boolean = true;
    EtdPort: any = null;
    ATAPort : any =null; // Actual arrival at transhipment port incase of SEA - AIR
    ETA: any = null;
    MessageConnLoadNotDone: string = '';
    LabelLoadOrigin2Dt: any = '';
    LoadOrigin2Dt: boolean = false;
    MessageLoadOrigin2Dt: string = '';
    TransPortTwo: any = null;
    ConnVesselTwo: any = null;
    ConnVesselListTwo: any = [];
    EtdPortTwo: any = null;
    disableEtdPortTwo: boolean = true;
    ETATwo: any = null;
    MessageConnLoadNotDone1: string = '';
    LabelLoadOrigin3Dt: any = '';
    LoadOrigin3Dt: boolean = false;
    MessageLoadOrigin3Dt: string = '';
    OnwardTrans: boolean = false;
    OnwardTransBy: any = null;
    From: any = null;
    LabelTo: string = '';
    Cost: any = '';
    ETAThree: any = null;
    CurrentDate: any = "";
    PlcaRecptlist: any = [];
    PlcRecpt: any = null;
    precarby: any = null;
    EtdPor : any = null;
    EtdporHr : any = null;
    EtdporMin: any = null;
    EtaPol: any = null;
    EtaPolHr: any = null;
    EtaPolMin: any = null;
    pracarrieagedisable :boolean=true;

    constructor(
        private _dataService: DataService,
        private _disabled: ButtonService,
        private _loginService: LoginService,
        private _toasterService: ToastCommonService) {

    }
    ngOnInit() {
        this.CurrentDate = new Date();
        let dd = this.CurrentDate.getDate();
        let mm = this.CurrentDate.getMonth() + 1;
        let yyyy = this.CurrentDate.getFullYear();
        dd = (dd < 10) ? '0' + dd : dd;
        mm = (mm < 10) ? '0' + mm : mm;
        this.CurrentDate = dd + '/' + mm + '/' + yyyy;
    }

    ngOnChanges() {
        if (this.DataSet.Table != undefined) {
            this.CityList = this.DataSet.Table1;
            this.ConnVesselList = this.DataSet.Table4;
            this.PlcaRecptlist== this.DataSet.Table5;
            if (this.DataSet.Table5.length>0)
            {this.pracarrieagedisable==false;}
            else {this.pracarrieagedisable=true;}

            this.fillData(this.DataSet.Table[0]);
        }
    }

    fillData(data) {
        this.RotationNo = data.VSL_RTNO;
        this.VoyageNo = data.VSL_VOYNO;
        this.VesselName = data.VSL_NAME;
        this.LastCartingDate = data.CARTING;
        this.ETD = data.ETD;
        this.ActSailingDate = data.SAILING;
        this.ContainerNo = data.CONTAINERNO + ' - ' + data.SIZE + ' - ' + data.CONTAINERSTATUS;
        this.NoOfPackage = data.NOOFPKGS;
        this.TotalVolume = data.VOLUME;
        this.AgentName = data.AGT_NAME;
        this.Destination = data.DESTINATION;

        this.MessageLoadNotDone = (data.MSG != "") ? data.MSG : '';
        if (data.VERIFIED == 'Y') {
            if (data.LOADDT != '') {
                this.LabelLoadOriginDt = data.LOADDT;
                this.CheckLoadOriginDt = true;
                this.hiddenLoadDate = data.LOADDT;
            }
            else {
                this.LabelLoadOriginDt = '';
                this.hiddenLoadDate = 'CHECK';
            }
            this.MessageLoadOriginDtMsg = '';
        } else {
            this.hiddenLoadDate = '';
            this.MessageLoadOriginDtMsg = 'CONTAINER IS NOT VERIFIED..SO YOU CANT PUT THE LOADING CONFIRMATION DATE';
        }

        //hdLoaddt.Value = .Item("LOADDT").ToString.Trim
        this.TransType = (data.DIRECTVSL == "NO") ? 'Transhipment' : 'Direct';
        this.TransPortOne = (data.TRANSPORT1 != "") ? data.TRANSPORT1 : null;
        this.changePort(this.TransPortOne);
        this.ConnVesselOne = (data.CONVESSEL1 != "") ? data.CONVESSEL1 : null;
        this.EtdPort = (data.ETDPORT1 != "") ? this._dataService.stringdttoArry(data.ETDPORT1) : null;
        this.ETA = (data.ETA1 != "") ? this._dataService.stringdttoArry(data.ETA1) : null;

        this.MessageConnLoadNotDone = (data.MSG1 != "") ? data.MSG1 : '';
        if (data.LOADDT != '') {
            if (data.PORT1LOADDT != '') {
                this.LabelLoadOrigin2Dt = data.PORT1LOADDT;
                this.LoadOrigin2Dt = true;
                this.hiddenLoadDateOne = data.PORT1LOADDT;
            }
            else {
                this.LabelLoadOrigin2Dt = '';
                this.hiddenLoadDateOne = 'CHECK';
            }
        } else {
            this.hiddenLoadDateOne = '';
            this.MessageLoadOrigin2Dt = 'Please enter & save the CONTAINER LOADING AT ORIGIN CONFIRMATION DATE';
        }

        this.TransPortTwo = (data.TRANSPORT2 != "") ? data.TRANSPORT2 : null;
        this.ConnVesselTwo = (data.CONVESSEL2 != "") ? data.CONVESSEL2 : null;
        this.EtdPortTwo = (data.ETDPORT2 != "") ? this._dataService.stringdttoArry(data.ETDPORT2) : null;
        this.ETATwo = (data.ETA2 != "") ? this._dataService.stringdttoArry(data.ETA2) : null;

        this.MessageConnLoadNotDone1 = (data.MSG2 != "") ? data.MSG2 : '';
        if (data.PORT1LOADDT != '') {
            if (data.PORT2LOADDT != '') {
                this.LabelLoadOrigin3Dt = data.PORT2LOADDT;
                this.LoadOrigin3Dt = false;
                this.hiddenLoadDateTwo = data.PORT2LOADDT;
            }
            else {
                this.LabelLoadOrigin3Dt = '';
                this.LoadOrigin3Dt = false;
                this.hiddenLoadDateTwo = 'CHECK';
            }
        } else {
            this.hiddenLoadDateTwo = '';
            this.MessageLoadOrigin3Dt = 'Please enter & save the CONTAINER LOADING AT TRANSHIPMENT PORT 1 CONFIRMATION DATE';
        }
        if (data.ONWARDTRANS == 'Y') {
            this.OnwardTrans = true;
            this.OnwardTransBy = (data.ONWARDTRANSBY != "") ? data.ONWARDTRANSBY : null;
            this.From = (data.ONWARDTRANSPORT != "") ? data.ONWARDTRANSPORT : null;
            this.LabelTo = data.DESTINATION;
            this.Cost = (data.ONWARDTRANSCOST != "") ? data.ONWARDTRANSCOST : null;
        }
        this.precarby= (data.PRECRGFRM != "") ? data.PRECRGFRM : null;
        this.PlcRecpt= (data.PREPOR != "") ? data.PREPOR : null;
        this.EtdPor =(data.PREETDPOR != "") ? data.PREETDPOR : null;
        this.EtdporHr= (data.PREETDPORHRS != "") ? data.PREETDPORHRS : null;
        this.EtdporMin= (data.PreETDPorMin != "") ? data.PreETDPorMin : null;
        this.EtaPol= (data.PREETAPOL != "") ? data.PREETAPOL : null;
        this.EtaPolHr=(data.PREETAPOLHRS != "") ? data.PREETAPOLHRS : null;
        this.EtaPolMin=(data.PreETAPolMin != "") ? data.PreETAPolMin : null;
    }

    changePort(port_code) {
        if (port_code != null) {
            this.ConnVesselListOne = this.ConnVesselList.filter((search: any) => search.PORT_CODE === port_code);
        } else {
            this.ConnVesselListOne = [];
        }
    }

    changePortTwo(port_code) {
        if (port_code != null) {
            this.ConnVesselListTwo = this.ConnVesselList.filter((search: any) => search.PORT_CODE === port_code);
        } else {
            this.ConnVesselListTwo = [];
        }
    }

    callPortEtd(connvesselone) {
        if (connvesselone != null) {
            let filterData = this.ConnVesselListOne.filter((search: any) => search.VALUEFIELD === connvesselone);
            if (filterData.length > 0) {
                this.disableEtdPort = (filterData[0].TEXTFIELD.substring(0, 3) === 'TBA') ? false : true;
            }
        } else {
            this.disableEtdPort = true;
        }
    }

    changePortEtdTwo(connvesseltwo) {
        if (connvesseltwo != null) {
            let filterData = this.ConnVesselListTwo.filter((search: any) => search.VALUEFIELD === connvesseltwo);
            if (filterData.length > 0) {
                this.disableEtdPortTwo = (filterData[0].TEXTFIELD.substring(0, 3) === 'TBA') ? false : true;
            }
        } else {
            this.disableEtdPortTwo = true;
        }
    }

    validate() {
        if (this.TransType == 'Direct') {
            if (this.LabelLoadOriginDt != "") {
                if (this.ETA == null) {
                    this._toasterService.toast('error', 'Alert', 'ETA can not be blank'); return false;
                }
                if (this.ConnVesselOne != null) {
                    if (this.ConnVesselOne.substring(0, 3) == "MUM") {
                        if (this.EtdPort == null) {
                            this._toasterService.toast('error', 'Alert', 'ETD at transshipment port1 can not be blank'); return false;
                        }
                    }
                }
                if (this.CheckLoadOriginDt == true && this.TransType != 'Direct') {
                    if (this.TransPortOne == this.TransPortTwo) {
                        this._toasterService.toast('error', 'Alert', 'Transhipment port1 and Transhipment port2 can not be same'); return false;
                    }
                    if (this.RotationNo == this.ConnVesselTwo) {
                        this._toasterService.toast('error', 'Alert', 'Main Vessel and Connecting Vessel2 can not be same'); return false;
                    }
                    if (this.ConnVesselOne == this.ConnVesselTwo) {
                        this._toasterService.toast('error', 'Alert', 'Connecting Vessel1 and Connecting Vessel2 can not be same'); return false;
                    }
                    if (this.ConnVesselTwo != null) {
                        if (this.ConnVesselTwo.substring(0, 3) == "MUM") {
                            if (this.EtdPortTwo == null) {
                                this._toasterService.toast('error', 'Alert', 'ETD at transshipment port2 can not be blank'); return false;
                            }
                        }
                    }
                }
            }
        }
    }

    Update() {
        if (this.validate() == false) { return false; }
        let EXPT_VESSEL = this.EditData.EXPT_RTNO;
        let CONTAINERNO = this.EditData.CONTAINERNO;
        let DESTPORT = this.EditData.DEST;
        let EXPT_AGENT = this.DataSet.Table[0].EXPT_AGENT;

        let LOADDT = this.hiddenLoadDate;
        let PORT1LOADDT;
        let PORT2LOADDT;
        if (this.LoadOrigin2Dt==true)
        { PORT1LOADDT=this.CurrentDate;  }else {PORT1LOADDT="";}
        if (this.LoadOrigin3Dt== true)
        { PORT2LOADDT =this.CurrentDate;}else {PORT2LOADDT="";}

        //let PORT1LOADDT = this.hiddenLoadDateOne;
        //let PORT2LOADDT = this.hiddenLoadDateTwo;

        if (LOADDT == "CHECK")
        { LOADDT = this.CurrentDate }

        let TRANSPORT1 = (this.TransPortOne != null) ? this.TransPortOne : "";
        let CONVESSEL1 = (this.ConnVesselOne != null) ? this.ConnVesselOne : "";
        let ETA1 = (this.ETA != null) ? this.ETA.formatted : "";
        let TRANSPORT2 = (this.TransPortTwo != null) ? this.TransPortTwo : "";
        let CONVESSEL2 = (this.ConnVesselTwo != null) ? this.ConnVesselTwo : "";
        let ETA2 = (this.ETATwo != null) ? this.ETATwo.formatted : "";
        let ata = (this.ATAPort != null) ? this.ATAPort.formatted : "";
        let etdpordt =(this.EtdPor != null) ? this.EtdPor.formatted : "";
        let etapoldt =(this.EtaPol != null) ? this.EtaPol.formatted : "";

        let DIRECTVSL;
        if (this.TransType == "Direct")
        { DIRECTVSL = "YES" }
        else
        { DIRECTVSL = "NO" }

        let ONWARDTRANS = "",
            ONWARDTRANSBY = "",
            ONWARDTRANSPORT = "",
            ONWARDTRANSCOST = "",
            ETA3 = "";

        if (this.OnwardTrans == true) {
            ONWARDTRANS = "Y";
            ONWARDTRANSBY = (this.OnwardTransBy != null) ? this.OnwardTransBy : "";
            ONWARDTRANSPORT = (this.From != null) ? this.From : "";
            ONWARDTRANSCOST = "";
            ETA3 = (this.ETAThree != null) ? this.ETAThree.formatted : "";
        }
        let ETDPORT1 = (this.EtdPort != null) ? this.EtdPort.formatted : "";
        let ETDPORT2 = (this.EtdPortTwo != null) ? this.EtdPortTwo.formatted : "";
        let MULTI_DEST = this.EditData.MULTIDEST;

        const _jsonData = {
            Expt_Vessel: EXPT_VESSEL,
            ContainerNo: CONTAINERNO,
            DestPort: DESTPORT,
            Expt_Agent: EXPT_AGENT,
            LoadDt: LOADDT,
            Port1loaddt: PORT1LOADDT,
            port2loaddt: PORT2LOADDT,
            TransPortOne: TRANSPORT1,
            ConVesselOne: CONVESSEL1,
            EtaOne: ETA1,
            TransportOne: TRANSPORT2,
            ConVsselTwo: CONVESSEL2,
            Eta2: ETA2,
            DirectVsl: DIRECTVSL,
            OnwardTrans: ONWARDTRANS,
            OnwardTransBy: ONWARDTRANSBY,
            OnwardTransPort: ONWARDTRANSPORT,
            OnwardTransCost: ONWARDTRANSCOST,
            Eta3: ETA3,
            EtdPort1: ETDPORT1,
            EtdPort2: ETDPORT2,
            Multi_Dest: MULTI_DEST,
            CityCode: this._loginService.getLogin()[0].CITYCODE,
            CmpId: this._loginService.getLogin()[0].CMPID,
            MakerIp: this._loginService.getLogin()[0].MAKERIP,
            ATAPort:ata,
            precarby :this.precarby,
            PlcRecpt :this.PlcRecpt,
            EtdPor  :etdpordt,
            EtdporHr :this.EtdporHr,
            EtdporMin : this.EtdporMin,
            EtaPol :    etapoldt,
            EtaPolHr :this.EtaPolHr,
            EtaPolMin :this.EtaPolMin
        };
        this._disabled.disableButton(this.updateButton);
        this._dataService.Common("Export/ContainerLoadingConf_ShipmentProgress_Update", _jsonData)
            .subscribe((data: any) => {
                this._disabled.disableButton(this.updateButton);
                this.updatedata.emit(data);
            });
    }

    Abort() { }

    back() {
        this.backtosearch.emit(true);
    }
}


@Component({
    selector: 'app-shipment-progress-container-loading-report',
    templateUrl: 'report-container-loading-confirmation.sp.component.html'
})
export class ReportContainerLoadingShipmentProgressComponent implements OnInit, OnChanges {

    @Input() DataSet: any = [];
    @Output() backtosearch = new EventEmitter<any>();
    UpdatedList: any = [];
    keys: string[] = [];
    constructor(private _dataService: DataService, private _loginService: LoginService) {}
    ngOnInit() { }

    ngOnChanges() { 
        if (this.DataSet.Table1 != undefined) {
            let StrBody = "";
            this.UpdatedList = this.DataSet.Table1;
            this.keys = Object.keys(this.UpdatedList[0]);
            if (this.DataSet.Table1.length > 0) {
                if (this.DataSet.Table.length > 0) {
                    if (this.DataSet.Table1[0].STATUSTEXT.trim() != "") {
                        StrBody = "" + this.DataSet.Table1[0].VSLDET;
                        StrBody = StrBody + "<br>" + this.DataSet.Table1[0].CONTAINERNO;
                        //StrBody = StrBody + "<br>" + this.DataSet.Table[0].MAIN_VESSEL;
                        StrBody = StrBody + "<br>" + this.DataSet.Table1[0].CNEE_NAME;
                        StrBody = StrBody + "<br>" + this.DataSet.Table1[0].DEST;
                        StrBody = StrBody + "<BR><BR>"
                        StrBody = StrBody + "<br>" + this.DataSet.Table1[0].ETA;
                       // StrBody = StrBody + "<br>" + "BY " + this._loginService.getLogin()[0].CMP_USERNAME;
                       // this.sendMail(StrBody);
                       const _jsonData = {
                        mail_body: StrBody,
                        ipadd : this.DataSet.Table1[0].IPADDS,
                        Frmmail :this.DataSet.Table1[0].FROMMAIL,
                        Tomail:this.DataSet.Table1[0].TO,
                        cc:"",
                        bcc:this.DataSet.Table1[0].BCC,
                        pwd:this.DataSet.Table1[0].PWD,
                        subject:"ETA HAS BEEN MODIFIED " +this.DataSet.Table1[0].CONTAINERNO             
                    };
                       this._dataService.getData("Export/ContainerLoadingConf_ShipmentProgress_SendMail", _jsonData)
                       .subscribe((data: any) => {
                        alert(data);
                       });

                    }
                }
            }
        }
    }
    
    back() {
        this.backtosearch.emit(true);
    }
}


@Component({
    selector: 'app-shipment-progress-prepaid-frt',
    templateUrl: 'pre-frt-approved-shipper.component.html'
})
export class PrepaidfrtApprovShipmentProgressComponent implements OnInit, OnChanges, AfterViewInit {
    @ViewChild('submitButton', {static: false}) submitButton: ElementRef;
    @ViewChild(FontChangerComponent, {static: false}) private disable: FontChangerComponent;
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
    Id: any = '';
    ExptNo: any = null;
    ErrorMessage: any = '';
    frtApprdt: any = null;
    constructor(
        private _router: Router,
        private _dataService: DataService,
        private _loginService: LoginService,
        private _activatedRoute: ActivatedRoute,
        private _toasterService: ToastCommonService) {
        this._activatedRoute.params.subscribe(params => { this.ExptNo = params.exptno; });
    }

    ngOnInit() {
        if (this.ExptNo.length != 15) {
            this.ErrorMessage = 'Invalid Export No. or Job No';
        }
        this.getData('PRPFRT_APPROV', this.ExptNo);
    }
    ngOnChanges() { }

    ngAfterViewInit() {
        this.disable.disableButton(this.submitButton);
    }

    getData(formType, exptNo) {
        const _jsonData = {
            Type1: formType,
            Type2: exptNo,
            Type3: this._loginService.getLogin()[0].GUID,
            Type4: this._loginService.getLogin()[0].CMPID
        };
        this._dataService.getData("Export/ShipmentProgressPopulate", _jsonData)
            .subscribe((data: any) => {
                this.disable.enableButton(this.submitButton);
                if (data.Table != undefined) {
                    this.Id = data.Table[0].ID;
                    this.frtApprdt = (data.Table[0].EXPT_PPFRTAPPDT != "") ? this._dataService.stringdttoArry(data.Table[0].EXPT_PPFRTAPPDT) : null;
                } else {
                    alert('Not Found!');
                }
            });
    }

    submit() {
        let aprvdt 
        aprvdt=(this.frtApprdt != null) ? this.frtApprdt.formatted : "";
        if(aprvdt=="")
        {
            alert("Prepaid approved by shipper Date can`t blank!");
            return false;
        }
        this.disable.disableButton(this.submitButton);
        const _jsonData = {
            Type1: this.Id,
            Type2: this.ExptNo,
            Type3: (this.frtApprdt != null) ? this.frtApprdt.formatted : "",
            Type4: this._loginService.getLogin()[0].CMPID,
            Type5: this._loginService.getLogin()[0].MAKERIP //change later by ip
        };
        this._dataService.Common("Export/PrepaidfrtdtUpdateShipmentProgress", _jsonData)
            .subscribe((data: any) => {
                this.disable.enableButton(this.submitButton);
                if (data.Table != undefined) {
                    if (data.Table[0].STATUS == 100) {
                        alert("Prepaid approved by shipper Date updated successfully!");
                        this._router.navigate(['export/shipment-progress/Prepaid-freight-apprvd-search']);
                    } else if (data.Table[0].STATUS == 102) {
                        alert('Error! Please contact System Administrator.');
                    }
                }
            });
    }

    abort() {
        this._router.navigate(['export/shipment-progress/Prepaid-freight-apprvd-search']);
    }
}


@Component({
    selector: 'app-shipment-progress-dimension',
    templateUrl: 'dimension.sp.component.html'
})
export class dimensionShipmentProgressComponent implements OnInit, OnChanges, AfterViewInit {
    @ViewChild('submitButton', {static: false}) submitButton: ElementRef;
    @ViewChild(FontChangerComponent, {static: false}) private disable: FontChangerComponent;

    ExptNo: any = null;

    constructor(
        private _router: Router,
        private _dataService: DataService,
        private _loginService: LoginService,
        private _activatedRoute: ActivatedRoute,
        private _toasterService: ToastCommonService) {
        this._activatedRoute.params.subscribe(params => { this.ExptNo = params.exptno; });
    }
  ngOnInit() {
         
    }
    ngOnChanges() { }

    ngAfterViewInit() {
        //this.disable.disableButton(this.submitButton);
    }

}
 