import { Component, OnInit, OnChanges, ViewChild, ElementRef, Input, Output, EventEmitter ,ViewEncapsulation} from '@angular/core';
import { DataService } from '../../shared/service/dataService';
import { AuthService } from '../../shared/service/authService';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastCommonService } from '../../shared/service/toastService';
import { LoginService } from '../../shared/service/loginService';
import { IMyDpOptions } from 'mydatepicker';
import { ButtonService } from '../../shared/common-font-changer.directive';

@Component({
    selector: 'app-export-order-new-booking',
    templateUrl: 'new.booking.component.html' ,
    styleUrls: ['../../../../node_modules/@ng-select/ng-select/themes/default.theme.css'], 
    encapsulation: ViewEncapsulation.None
})
export class NewBookingComponent implements OnInit {
    @ViewChild('searchButton', {static: false}) searchButton: ElementRef;
    @ViewChild('resetSearchButton', {static: false}) resetSearchButton: ElementRef;
    @ViewChild('addButton', {static: false}) addButton: ElementRef;
    @ViewChild('updateButton', {static: false}) updateButton: ElementRef;
    @ViewChild('addArea', {static: false}) addArea: ElementRef;
    @ViewChild('listArea', {static: false}) listArea: ElementRef;
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

    Sr_Mode: string = '';

    ExptNo: any = '';
    EdiGroupList: Array<any> = [];
    ConsigneeList: Array<any> = [];
    ExporterList: Array<any> = [];
    addList: Array<any> = [];
    ErrorMessage: string = '';

    EdiGroup: any = null;
    OrderNo: any = '';
    ReferenceNo: any = '';
    OrderId: any = '0';
    Rebooking: boolean = false;
    DisabledRebooking: boolean = false;
    BookingPreDate: any = null;
    BookingDate: any = '';
    Pieces: any = '';
    TypesOfPieces: any = 'PIECES';
    Package: any = '';
    Volume: any = '';
    Grossweight: any = '';
    NetWeight: any = '';
    ItemDescription: any = '';
    Exporter: any = null;
    Consignee: any = null;
    Mode: any = 'SEA';
    DocsExpected: any = null;
    CargoExpected: any = null;
    ApprovalExpectedDate: any = null;
    ActualApprovalDate: any = null;
    ActualApprovalBy: any = '';
    ETD: any = null;
    SupContactDate: any = null;
    RefAssorti: any = '';
    ShipmentConfirmation: any = '0';
    NewShipmentDate: any = null;
    Transhipment: boolean = false;
    ETATranshipmentDate: any = null;
    ETDTranshipmentDate: any = null;
    ETA: any = null;
    EditFlag: any = '';

    isVisibleRebooking: string = 'new';
    constructor(
        private _toaster: ToastCommonService,
        private _router: Router,
        private _dataService: DataService,
        private _loginService: LoginService,
        private _disable: ButtonService,
        private route: ActivatedRoute) {
        this.route.params.subscribe(params => {
            this.EdiGroup = (params["edi_id"]) ? Number(params["edi_id"]) : null;
            this.OrderNo = (params["order_no"]) ? String(params["order_no"]) : '';
            this.Sr_Mode = (params["sr_mode"]) ? params["sr_mode"] : '';
            this.pageLoad();
        });
    }

    ngOnInit() {
        this.BookingDate = this._dataService.getCurrentdate();
        // if (this.Sr_Mode) {
        //     this.searchButton.nativeElement.hidden = true;
        //     this.resetSearchButton.nativeElement.hidden = true;
        //     this.addArea.nativeElement.hidden = false;
        //     this.listArea.nativeElement.hidden = false;
        // } else {
        //      this.searchButton.nativeElement.hidden = false;
        //     this.resetSearchButton.nativeElement.hidden = false;
        //     this.addArea.nativeElement.hidden = true;
        //     this.listArea.nativeElement.hidden = true;
        // }
        //this.updateButton.nativeElement.hidden = true;
        if (this.Sr_Mode == 'new') {
            this._loginService.verifyRights(357, '')
                .subscribe((data: any) => { this._loginService.checkVerify('Add', data); });
        } else {
            this._loginService.verifyRights(357, '')
                .subscribe((data: any) => { this._loginService.checkVerify('Modify', data); });
        }
    }
    ngAfterViewInit() {
         if (this.Sr_Mode) {
            this.searchButton.nativeElement.hidden = true;
            this.resetSearchButton.nativeElement.hidden = true;
            this.addArea.nativeElement.hidden = false;
            this.listArea.nativeElement.hidden = false;
        } else {
             this.searchButton.nativeElement.hidden = false;
            this.resetSearchButton.nativeElement.hidden = false;
            this.addArea.nativeElement.hidden = true;
            this.listArea.nativeElement.hidden = true;
        }
        this.updateButton.nativeElement.hidden = true;
      }

    checkboxRebooking() {
        this.BookingDate = (this.Rebooking) ? this._dataService.getCurrentdate() : this.BookingPreDate;
    }

    search() {
        if (this.EdiGroup == null) { this._toaster.toast("error", "Alert", "Select EDI GROUP !"); return false; }
        if (this.OrderNo == '') { this._toaster.toast("error", "Alert", "ORDER NO can not be Blank !"); return false; }
        if (this.EdiGroup == 1) { if (this.ReferenceNo == '') { this._toaster.toast("error", "Alert", "STYLE NO can not be Blank !"); return false; } }
        const _jsonData = {
            SearchType: '',
            OrderNo: this.OrderNo,
            ReferenceNo: this.ReferenceNo,
            CmpCode: this._loginService.getLogin()[0].CMPCODE,
            CityCode: this._loginService.getLogin()[0].CITYCODE,
            EdiGroup: (this.EdiGroup == null) ? Number(0) : this.EdiGroup,
            Mode: 0
        };
        this._disable.disableButton(this.searchButton);
        this._dataService.Common("Export/OrderBookingSearchList", _jsonData)
            .subscribe((data: any) => {
                this._disable.enableButton(this.searchButton);
                if (data.Table1[0].STATUS.split('#')[0] == '100') {
                    this.addList = data.Table1;
                    this.listArea.nativeElement.hidden = false;
                }
                else {
                    this.ErrorMessage = data.Table1[0].STATUS.split('#')[1];
                    this.addList = data.Table1;
                    this.listArea.nativeElement.hidden = true;
                }
            });
    }


    editPopulateData(id) {
        let filterData = this.addList.filter((filter) => filter.ID == id)[0];
        this.EditFlag = filterData.EDITFLAG;
        this.isVisibleRebooking = 'edit';
        if (this.EditFlag != '' && filterData.IS_REBOOKING == 1) {
            this._toaster.toast("warning", "Alert", "Actual Approval and Cargo Received Done  \n for Booking Order No. [" + filterData.ORDERNO + "] And style No. [" + filterData.STYLENO + "]  \n and Re-Booking is done \n for Booking Order No. " + filterData.ORDERNO + " \n So You Can not Edit !");
            this.addButton.nativeElement.hidden = false;
            this.updateButton.nativeElement.hidden = true;
            this.addArea.nativeElement.hidden = false;
        }
        else {

            this.addButton.nativeElement.hidden = true;
            this.updateButton.nativeElement.hidden = false;
            this.addArea.nativeElement.hidden = false;

            if (filterData.IS_REBOOKING == 1) {
                this.Rebooking = true;
                this.DisabledRebooking = true;
            }
            else { this.Rebooking = false; this.DisabledRebooking = false; }
            this.ExptNo = filterData.EXPTNO;
            this.BookingPreDate = filterData.BOOKINGDT;
            this.BookingDate = filterData.BOOKINGDT;
            this.Pieces = filterData.PIECES;
            this.TypesOfPieces = filterData.TYPEOFPCS;
            this.Package = filterData.PKGS;
            this.Volume = filterData.VOLUME;
            this.Grossweight = filterData.GRWT;
            this.NetWeight = filterData.NETWT;
            this.ItemDescription = filterData.ITEMDESC;
            this.Exporter = filterData.EXPCODE;
            this.Consignee = filterData.CONCODE;
            this.Mode = filterData.MODE;
            this.OrderId = filterData.ORDERID;
            this.DocsExpected = (filterData.DOCSEXPECT != "") ? this._dataService.stringdttoArry(filterData.DOCSEXPECT) : null;
            this.CargoExpected = (filterData.CARGOEXPECT != "") ? this._dataService.stringdttoArry(filterData.CARGOEXPECT) : null;
            this.ApprovalExpectedDate = (filterData.APPROVALDT != "") ? this._dataService.stringdttoArry(filterData.APPROVALDT) : null;
            this.ActualApprovalDate = (filterData.ACTLAPPROVAL != "") ? this._dataService.stringdttoArry(filterData.ACTLAPPROVAL) : null;
            this.ActualApprovalBy = filterData.ACTLAPPROVALBY;
            this.ETD = (filterData.ETDEXPECT != "") ? this._dataService.stringdttoArry(filterData.ETDEXPECT) : null; filterData.ETDEXPECT;
            if (filterData.ISTRANS == '1') {
                this.Transhipment = true;
                this.ETATranshipmentDate = (filterData.ETATRANS != "") ? this._dataService.stringdttoArry(filterData.ETATRANS) : null;
                this.ETDTranshipmentDate = (filterData.ETDTRANS != "") ? this._dataService.stringdttoArry(filterData.ETDTRANS) : null;
            }
            else {
                this.Transhipment = false;
                this.ETATranshipmentDate = null;
                this.ETDTranshipmentDate = null;
            }
            this.ETA = (filterData.ETAEXPECT != "") ? this._dataService.stringdttoArry(filterData.ETAEXPECT) : null;

            if (this.EdiGroup == 2) {
                this.SupContactDate = (filterData.SUP_CONTACT_DT != "") ? this._dataService.stringdttoArry(filterData.SUP_CONTACT_DT) : null;
                this.ShipmentConfirmation = (filterData.SHIP_CONFIRM == "YES") ? '0' : '1';
                this.NewShipmentDate = (filterData.NEW_SHIP_DT != "") ? this._dataService.stringdttoArry(filterData.NEW_SHIP_DT) : null;
            }
            this.RefAssorti = (this.EdiGroup == 3) ? filterData.REF_ASSORTI : '';
        }
    }

    add() {
        if (this.vaidateAddEditField()) {
            this.addEditDataService();
        }
    }

    update() {
        if (this.vaidateAddEditField()) {
            this.addEditDataService();
        }
    }

    addEditDataService() {

        let TYPE = 'A'
        if (this.OrderId != "0") {
            TYPE = 'E'
        }
        let REBOOKING = 0;
        if (TYPE == 'E') {
            if (this.Rebooking == true) {
                REBOOKING = 1;
            }
            else {
                REBOOKING = 0;
            }
        }

        if (this.EditFlag != '' && this.ExptNo != '' && REBOOKING == 0 && TYPE == 'E') {
            alert("Actual Approval and Cargo Received Done \n for Booking Order No. [" + this.OrderNo + "] And style No. [" + this.ReferenceNo + "]  \n\n So You Can not Edit !!!");
            this.reset();
            return false;
        } else if (this.EditFlag != '' && this.ExptNo != '' && REBOOKING == 1 && TYPE == 'E') {
            alert("1. Actual Approval and Cargo Received Done ! \n2. Re-Booking is done ! \n    for Booking Order No. [" + this.OrderNo + "] And style No. [" + this.ReferenceNo + "]  \n\n So You Can not Edit !!!");
            this.reset();
            return false;
        }

        let _jsonData = {
            Type: TYPE,
            OrderId: this.OrderId,
            Concode: (this.Consignee != null) ? this.Consignee : '',
            Mode: (this.Mode != null) ? this.Mode : '',
            OrderNo: this.OrderNo,
            StyleNo: this.ReferenceNo,
            ItemDescription: this.ItemDescription,
            Pieces: this.Pieces,
            TypeOfPcs: (this.TypesOfPieces != null) ? this.TypesOfPieces : '',
            Packages: this.Package,
            GrossWeight: this.Grossweight,
            Volume: this.Volume,
            NetWeight: this.NetWeight,
            BookingDate: this.BookingDate,
            CargoExpectedDate: (this.CargoExpected != null) ? this.CargoExpected.formatted : '',
            DocsExpectedEDate: (this.DocsExpected != null) ? this.DocsExpected.formatted : '',
            EtdE: (this.ETD != null) ? this.ETD.formatted : '',
            EtaE: (this.ETA != null) ? this.ETA.formatted : '',
            ApprovalDate: (this.ApprovalExpectedDate != null) ? this.ApprovalExpectedDate.formatted : '',
            CargoReceivedDate: '',
            Exporter: (this.Exporter != null) ? this.Exporter : '',
            Transhipment: (this.Transhipment == true) ? '1' : '0',
            ETDTranshipmentDate: (this.Transhipment == true) ? (this.ETDTranshipmentDate != null) ? this.ETDTranshipmentDate.formatted : '' : '',
            ETATranshipmentDate: (this.Transhipment == true) ? (this.ETATranshipmentDate != null) ? this.ETATranshipmentDate.formatted : '' : '',
            Rebooking: REBOOKING,
            ActualApprovalDate: (this.ActualApprovalDate != null) ? this.ActualApprovalDate.formatted : '',
            ActualApprovalBy: this.ActualApprovalBy,
            SupContactDate: (this.EdiGroup == '2') ? (this.SupContactDate != null) ? this.SupContactDate.formatted : '' : '',
            ShipmentConfirmation: (this.EdiGroup == '2') ? (this.ShipmentConfirmation != null) ? this.ShipmentConfirmation : '0' : '0',
            NewShipmentDate: (this.EdiGroup == '2') ? (this.NewShipmentDate != null) ? this.NewShipmentDate.formatted : '' : '',
            EdiGroup: this.EdiGroup,
            CmpCode: this._loginService.getLogin()[0].CMPCODE,
            CityCode: this._loginService.getLogin()[0].CITYCODE,
            MakerId: this._loginService.getLogin()[0].CMPID
        }

        this._dataService.Common("Export/OrderBookingInsertUpdate", _jsonData)
            .subscribe((data: any) => {
                this.addList = data.Table1;
                this._toaster.toast("success", "Alert", "Data Saved Successfully!!!");
            });
    }

    vaidateAddEditField(): Boolean {
        if (this.OrderNo == '') { this._toaster.toast("error", "Alert", "Order No. can not be Empty."); return false; }
        if (this.EdiGroup == 1) {
            if (this.OrderNo.length < 8) { this._toaster.toast("error", "Alert", "Order No. length Should be 8."); return false; }
            if (this.OrderNo.substring(6, 7) != '-') { this._toaster.toast("error", "Alert", "This is not a valid orderno. OrderNo 7th digit must containe a '-'"); return false; }
            if (this.ReferenceNo == '') { this._toaster.toast("error", "Alert", "Style No. can not be Empty."); return false; }
            if (this.ReferenceNo.length < 6) { this._toaster.toast("error", "Alert", "Styleno No. length Should be 6."); return false; }
        }
        if (Math.abs(this.Pieces) == 0) { this._toaster.toast("error", "Alert", "Pieces can not be Empty."); return false; }
        if (this.BookingDate == '') { this._toaster.toast("error", "Alert", "Booking Date canot be blank."); return false; }
        if (this.CargoExpected != null)
        { if (this._dataService.DateFromAndToComparision_exp(this.BookingDate,this.CargoExpected.formatted) == false) 
            { this._toaster.toast("error", "Alert", "Cargo Expected Date Should be greater than or Equal to Booking Recvd Date !"); 
            return false; }
         }
        if (this.DocsExpected != null) {
             if (this._dataService.DateFromAndToComparision_exp(this.BookingDate,this.DocsExpected.formatted) == false)
              { this._toaster.toast("error", "Alert", "Document Expected Date Should be greater than or Equal to Booking Recvd Date !"); 
              return false; } }
        if (this.ETD == null) { this._toaster.toast("error", "Alert", "ETD canot be blank !"); return false; }
        if (this.ETD != null) { if (this._dataService.DateFromAndToComparision_exp(this.BookingDate,this.ETD.formatted) == false) 
            { this._toaster.toast("error", "Alert", "ETD Should be greater than Booking Recvd Date !"); return false; } }
        if (this.EdiGroup == 2) {
            if (this.ShipmentConfirmation == '1') {
                if (this.NewShipmentDate == null) { this._toaster.toast("error", "Alert", "New Shipment dt canot be blank !"); return false; }
            }
            else if (this.SupContactDate == null) { this._toaster.toast("error", "Alert", "Supplier contact Date can not be blank !"); return false; }
        }
        if (this.Transhipment) {
            if (this.ETATranshipmentDate == null) {
                this._toaster.toast("error", "Alert", "ETA At Transhipment canot be blank !"); return false;
            }
            if (this.ETD != null && this.ETATranshipmentDate != null) {
                if (this._dataService.DateFromAndToComparision_exp(this.ETD.formatted,this.ETATranshipmentDate.formatted) == false) {
                    this._toaster.toast("error", "Alert", "ETA Transhipment Date Should be greater than or equal to ETD !");
                    return false;
                }
            }
            if (this.ETDTranshipmentDate == null) {
                this._toaster.toast("error", "Alert", "ETD At Transhipment canot be blank !"); return false;
            }
            if (this.ETDTranshipmentDate != null) {
                if (this._dataService.DateFromAndToComparision_exp(this.ETATranshipmentDate.formatted,this.ETDTranshipmentDate.formatted) == false) {
                    this._toaster.toast("error", "Alert", "ETD at Transhipment port Should be greater than or equal to ETA at Transhipment !");
                    return false;
                }
            }
        }
        if (this.ApprovalExpectedDate == null) { this._toaster.toast("error", "Alert", "Approval Expected Date canot be blank !"); return false; }
        if (this.ApprovalExpectedDate != null) {
            if (this._dataService.DateFromAndToComparision_exp(this.BookingDate.formatted, this.ApprovalExpectedDate.formatted) == false) {
                this._toaster.toast("error", "Alert", "Approval Date Should be greater than Booking Recvd Date.");
                return false;
            }
        }
        if (this.ETA == null) {
            this._toaster.toast("error", "Alert", "ETA canot be blank !");
            return false;
        }

//        if (this._dataService.DateFromAndToComparision(this.ETA.formatted, this.BookingDate) == false) {
        if (this._dataService.DateFromAndToComparision_exp(this.BookingDate.formatted,this.ETA.formatted) == false) {
            this._toaster.toast("error", "Alert", "ETA Should be greater than Booking Received Date !");
            return false;
        }

        return true;
    }

    resetSearch() {
        this.reset();
        this.addList = [];
        this.addArea.nativeElement.hidden = true;
        this.listArea.nativeElement.hidden = true;
    }

    reset() {
        this.addButton.nativeElement.hidden = false;
        this.updateButton.nativeElement.hidden = true;
        this.ExptNo = '';
        //this.BookingDate = '';
        this.OrderNo = '';
        this.ReferenceNo = '';
        this.OrderId = '0';
        this.Pieces = '';
        this.TypesOfPieces = 'PIECES';
        this.Package = '';
        this.Volume = '';
        this.Grossweight = '';
        this.NetWeight = '';
        this.ItemDescription = '';
        this.Exporter = null;
        this.Consignee = null;
        this.Mode = 'SEA';
        this.DocsExpected = null;
        this.CargoExpected = null;
        this.ApprovalExpectedDate = null;
        //this.ActualApprovalDate = null;
        //this.ActualApprovalBy = '';
        this.ETD = null;
        this.SupContactDate = null;
        this.RefAssorti = '';
        this.ShipmentConfirmation = '0';
        this.NewShipmentDate = null;
        this.Transhipment = false;
        this.ETATranshipmentDate = null;
        this.ETDTranshipmentDate = null;
        this.ETA = null;
        this.EditFlag = '';
    }

    pageLoad() {
        const _jsonData = {
            citycode: this._loginService.getLogin()[0].CITYCODE,
            edigroup: (this.EdiGroup == null) ? Number(0) : this.EdiGroup,
            cmpcode: this._loginService.getLogin()[0].CMPCODE,
            optional: "new"
        };
        this._dataService.getData("Export/OrderBookingDropdownFill", _jsonData)
            .subscribe((data: any) => {
                this.ConsigneeList = data.Table;
                this.ExporterList = data.Table1;
                this.EdiGroupList = data.Table2;
            });
    }
}