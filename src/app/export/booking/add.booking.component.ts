import { Component, OnInit, OnChanges, ViewChild, ElementRef ,ViewEncapsulation} from '@angular/core';
import { DataService } from '../../shared/service/dataService';
import { AuthService } from '../../shared/service/authService';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastCommonService } from '../../shared/service/toastService';
import { LoginService } from '../../shared/service/loginService';
import { IMyDpOptions } from 'mydatepicker';
import { ButtonService } from '../../shared/common-font-changer.directive';
import { LoaderService } from '../../shared/service/loader.service';

@Component({
    selector: 'app-export-booking',
    templateUrl: 'add.booking.component.html' ,
    styleUrls: ['../../../../node_modules/@ng-select/ng-select/themes/default.theme.css'], 
    encapsulation: ViewEncapsulation.None
})
export class AddBookingComponent implements OnInit {
    @ViewChild('searchButton', {static: false}) searchButton: ElementRef;
    @ViewChild('newButton', {static: false}) newButton: ElementRef;
    @ViewChild('Mode', {static: false}) Mode: ElementRef;
    @ViewChild('addButton', {static: false}) addButton: ElementRef;
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
    HdCount: any = '0';
    HdCountMode: any = '';
    HdMode: any = '';
    ViewType: string = 'SEARCH';

    ValidateField: number = 0;
    EdiGroup: any = null;
    EdiGroupList: Array<any> = [];
    Consignee: any = null;
    ConsigneeList: Array<any> = [];
    Exporter: any = null;
    ExporterList: Array<any> = [];
    OrderNo: any = '';
    OrderNoList: Array<any> = [];
    TmpOrderNoObject: any = {};
    ErrorMessage: string = '';


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
    //Mode: any = 'SEA';
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

    constructor(
        private _toaster: ToastCommonService,
        private _router: Router,
        private _dataService: DataService,
        private _loginService: LoginService,
        private _disable: ButtonService,
        private loaderService : LoaderService,) {
    }

    ngOnInit() {
      
        this._loginService.verifyRights(357, '')
            .subscribe((data: any) => {
                this._loginService.checkVerify('Add', data);
                this.pageLoad();
            });
    }
    ngAfterViewInit() {
        this.newButton.nativeElement.hidden = true;
        this.Mode.nativeElement.value = 'SEA';
    }
    pageLoad() {
        this.BookingDate = this._dataService.getCurrentdate();
        const _jsonData = {
            citycode: this._loginService.getLogin()[0].CITYCODE,
            edigroup: 1,//this.EdiGroup,
            cmpcode: this._loginService.getLogin()[0].CMPCODE,
            optional: "empty"
        };
        this._dataService.getData("Export/OrderBookingDropdownFill", _jsonData)
            .subscribe((data: any) => {
                this.ConsigneeList = data.Table;
                this.ExporterList = data.Table1;
                this.EdiGroupList = data.Table2;
            });
    }

    search() {
        if (this.EdiGroup == null) {
            this.ValidateField = 1;
        } else if (this.OrderNo == "") {
            this.ValidateField = 2.1;
        } else if (this.EdiGroup != 3) {
            if (this.OrderNo.length < 6) {
                this.ValidateField = 2.2;
            } else {
                this.ValidateField = 0;
                this.callSearch();
            }
        } else {
            this.ValidateField = 0;
            this.callSearch();
        }
    }

    updateValidator(index, event, value) {
        this.TmpOrderNoObject = (value) ? event : {};
        if (JSON.stringify(this.TmpOrderNoObject) !== JSON.stringify({})) {
            this.Mode.nativeElement.value = this.TmpOrderNoObject.MODE;
            if (this.TmpOrderNoObject.MODE != this.TmpOrderNoObject.MODE) {
                alert("Different modes of shipment cannot acceptable same booking!");
                this.OrderNoList[index]["ISCHECKED"] = false;
                this.OrderNoList[index]["TYPESOFPIECES"] = 'PIECES';
                this.OrderNoList[index]["HDPIECES"] = this.OrderNoList[index].QTY_PCS;
            }
        }
    }

    add() {
        if (this.vaidateAddEditField()) {
            this.addEditDataService();
        }
    }

    addEditDataService() {
        let Str_value = '';
        for (let i = 0; i < this.OrderNoList.length; i++) {
            let tempData = this.OrderNoList[i];
            if (tempData["ISCHECKED"] == true) {
                var Orderno = tempData["ORDERNO"];
                var Styleno = tempData["STYLENO"];
                var pcs = Number(tempData["QTY_PCS"]);
                var typepcs = tempData["TYPESOFPIECES"];
                var pkgs = tempData["CARTONS"];
                var vol = tempData["VOL"];
                var GrWt = tempData["GRWT"];
                var NetWt = tempData["NETWT"];
                var orig_pcs = tempData["HDPIECES"];
                var Ref_Assorti = tempData["REF_ASSORTI"] || '';
                if (Ref_Assorti == '&nbsp;') {
                    Ref_Assorti = '';
                }

                let plus_pcs5 = 0;
                let minus_pcs5 = 0;
                let plus_diff = 0;
                let minus_diff = 0;
                plus_pcs5 = Number((parseFloat(orig_pcs) * 1.05).toFixed(0));
                minus_pcs5 = Number((parseFloat(orig_pcs) * .95).toFixed(0));

                if (pcs == 0) {
                    alert("Please enter Pcs !");
                    return false;
                }
                if (pcs > plus_pcs5) {
                    plus_diff = pcs - plus_pcs5;
                    plus_diff = Number(plus_diff.toFixed(0));
                    if (confirm("The difference  " + plus_diff + " , /n is an excess of permissible limit of +/- 5%  , \n Do you want to continue ?") == false) {
                        return false;
                    }
                }
                if (pcs < minus_pcs5) {
                    minus_diff = minus_pcs5 - pcs;
                    minus_diff = Number(minus_diff.toFixed(0));
                    if (confirm("The difference  " + minus_diff + " , /n is an excess of permissible limit of +/- 5%  , \n Do you want to continue ?") == false) {
                        return false;
                    }
                }
                if (Str_value == '') {
                    Str_value = Orderno + "|" + Styleno + "|" + pcs + "|" + typepcs + "|" + pkgs + "|" + vol + "|" + GrWt + "|" + NetWt + "|" + Ref_Assorti + ";";
                }
                else {
                    Str_value = Str_value + Orderno + "|" + Styleno + "|" + pcs + "|" + typepcs + "|" + pkgs + "|" + vol + "|" + GrWt + "|" + NetWt + "|" + Ref_Assorti + ";";
                }
            }
        }

        if (Str_value == '') {
            this._toaster.toast("error", "Alert", "Please select at least one Order No!");
            return false;
        }
      this.loaderService.display(true);
        const _jsonData = {
            ORDMODE: this.Mode.nativeElement.value,
            TEMPSTRING: Str_value,
            BOOKINGDT: this.BookingDate,
            CARGOEDT: (this.CargoExpected != null) ? this.CargoExpected.formatted : '',
            DOCSEDT: (this.DocsExpected != null) ? this.DocsExpected.formatted : '',
            ETDE: (this.ETD != null) ? this.ETD.formatted : '',
            ETAE: (this.ETA != null) ? this.ETA.formatted : '',
            APPROVALDT: (this.ApprovalExpectedDate != null) ? this.ApprovalExpectedDate.formatted : '',
            CRAGORECVDDT: '',
            CONCODE: (this.Consignee != null) ? this.Consignee : '',
            EXPCODE: (this.Exporter != null) ? this.Exporter : '',
            ISTRANS: (this.Transhipment == true) ? '1' : '0',
            ETDTRANS: (this.Transhipment == true) ? (this.ETDTranshipmentDate != null) ? this.ETDTranshipmentDate.formatted : '' : '',
            ETATRANS: (this.Transhipment == true) ? (this.ETATranshipmentDate != null) ? this.ETATranshipmentDate.formatted : '' : '',
            ACTLAPPROVAL: (this.ActualApprovalDate != null) ? this.ActualApprovalDate.formatted : '',
            ACTLAPPROVALBY: this.ActualApprovalBy,
            SUP_CONTACT_DT: (this.EdiGroup == '2') ? (this.SupContactDate != null) ? this.SupContactDate.formatted : '' : '',
            SHIP_CONFIRM: (this.EdiGroup == '2') ? (this.ShipmentConfirmation != null) ? this.ShipmentConfirmation : '0' : '0',
            NEW_SHIP_DT: (this.NewShipmentDate != null) ? this.NewShipmentDate.formatted : '',
            FK_GRPID: this.EdiGroup,
            MakerId: this._loginService.getLogin()[0].CMPID,
            CITY: this._loginService.getLogin()[0].CITYCODE,
        };
        this._disable.disableButton(this.addButton);
        this._dataService.Common("Export/OrderBookingAdd", _jsonData)
            .subscribe((data: any) => {
                this._disable.enableButton(this.addButton);
                if (data.Table[0].STATUS == "100") { alert("Booking saved successfully !");this.reset(); this.loaderService.display(false);}
                else { alert('Contact to administrator');this.loaderService.display(false); }
            });
    }

    callSearch() {
        this._disable.disableButton(this.searchButton);
        const _jsonData = {
            EdiGroup: this.EdiGroup,
            Mode: 0,
            OrderNo: this.OrderNo,
            UserType: 1,
            ExpCode: 0
        };
        this.loaderService.display(true);
        this._dataService.Common("Export/OrderBookingSearch", _jsonData)
            .subscribe((data: any) => {
                this._disable.enableButton(this.searchButton);
                let responseData = data.Table;
                if (responseData[0].STATUS == "100") {
                    this.newButton.nativeElement.hidden = true;
                    this.OrderNoList = data.Table;
                    for (let i = 0; i < this.OrderNoList.length; i++) {
                        this.OrderNoList[i]["ISCHECKED"] = false;
                        this.OrderNoList[i]["TYPESOFPIECES"] = 'PIECES';
                        this.OrderNoList[i]["HDPIECES"] = this.OrderNoList[i].QTY_PCS;
                    }
                    this.ConsigneeList = data.Table1;
                    this.HdMode = (data.Table2.length == 1) ? data.Table2[0].MODE : '';
                    this.Mode.nativeElement.value = (data.Table2.length == 1) ? data.Table2[0].MODE : 'SEA';
                    this.ViewType = 'LIST';
                    this.loaderService.display(false);
                } else {
                    if (responseData[0].STMSG == "No record found ,New Booking click On New button!") {
                        this._toaster.toast("info", "Alert", "No record found ,New Booking click On New button!");
                        this.newButton.nativeElement.hidden = false;
                        this.loaderService.display(false);
                    } else {
                        this._toaster.toast("info", "Alert", responseData[0].STMSG);
                        this.newButton.nativeElement.hidden = true;
                        this.loaderService.display(false);
                    }
                    this.ViewType = 'SEARCH';
                }
            });
    }

    modeChange() {
        if (this.HdMode != this.Mode.nativeElement.value) {
            if (confirm("Actual mode " + this.HdMode + ", do you want change to " + this.Mode.nativeElement.value + "?")) {
            }
            else {
                this.Mode.nativeElement.value = this.HdMode;
            }
        } else {
            this.Mode.nativeElement.value = this.HdMode;
        }
    }

    vaidateAddEditField(): Boolean {
        if (this.EdiGroup == 2) {
            if (this.SupContactDate == null) {
                this._toaster.toast("error", "Alert", "Supplier contact Date canot be blank !");
                return false;
            }
            if (this.ShipmentConfirmation == '1') {
                if (this.NewShipmentDate == null) {
                    this._toaster.toast("error", "Alert", "New Shipment Date canot be blank !");
                    return false;
                }
            }
        }

        if (this.CargoExpected == null) {
            this._toaster.toast("error", "Alert", "Cargo Expected Date canot be blank !");
            return false;
        }

       // if (this._dataService.DateFromAndToComparision(this.BookingDate,this.CargoExpected.formatted ) == false) {
            if (this._dataService.date2Comparison(this.BookingDate.formatted,this.CargoExpected.formatted ) == false) {
            this._toaster.toast("error", "Alert", "Cargo Expected Date Should be greater than or Equal to Booking Received Date !");
            return false;
        }


        if (this.DocsExpected == null) {
            this._toaster.toast("error", "Alert", "Document Expected Date canot be blank !");
            return false;
        }

        //if (this._dataService.DateFromAndToComparision(this.DocsExpected.formatted, this.BookingDate) == false) {
            if (this._dataService.date2Comparison(this.BookingDate.formatted,this.DocsExpected.formatted) == false) {
            this._toaster.toast("error", "Alert", "Document Expected Date Should be greater than or Equal to Booking Received Date !");
            return false;
        }

        if (this.ApprovalExpectedDate == null) {
            this._toaster.toast("error", "Alert", "Approval Expected Date canot be blank !");
            return false;
        }

        //if (this._dataService.DateFromAndToComparision(this.ApprovalExpectedDate.formatted, this.BookingDate) == false) {
            if (this._dataService.date2Comparison(this.BookingDate.formatted,this.ApprovalExpectedDate.formatted) == false) {
            this._toaster.toast("error", "Alert", "Approval Date Should be greater than or Equal to Booking Received Date !");
            return false;
        }

        if (this.ETD == null) {
            this._toaster.toast("error", "Alert", "ETD canot be blank !");
            return false;
        }

        //if (this._dataService.DateFromAndToComparision(this.ETD.formatted, this.BookingDate) == false) {
        if (this._dataService.date2Comparison(this.BookingDate.formatted,this.ETD.formatted )== false) {
            this._toaster.toast("error", "Alert", "ETD Should be greater than Booking Received Date !");
            return false;
        }
        if (this.Transhipment) {
            if (this.ETATranshipmentDate == null) {
                this._toaster.toast("error", "Alert", "ETA At Transhipment canot be blank !");
                return false;
            }
            if (this.ETD != null && this.ETATranshipmentDate != null) {
                //if (this._dataService.DateFromAndToComparision(this.ETATranshipmentDate.formatted, this.ETD) == false) {
                if (this._dataService.date2Comparison(this.ETD.formatted,this.ETATranshipmentDate.formatted) == false) {
                    this._toaster.toast("error", "Alert", "ETA Transhipment Date Should be greater than or equal to ETD !");
                    return false;
                }
            }
            if (this.ETDTranshipmentDate == null) {
                this._toaster.toast("error", "Alert", "ETD At Transhipment canot be blank !"); return false;
            }
            if (this.ETDTranshipmentDate != null) {
               // if (this._dataService.DateFromAndToComparision(this.ETDTranshipmentDate.formatted, this.BookingDate) == false) {
                if (this._dataService.date2Comparison(this.ETATranshipmentDate.formatted,this.ETDTranshipmentDate.formatted) == false) {
                    this._toaster.toast("error", "Alert", "ETD at Transhipment port Should be greater than or equal to ETA at Transhipment !");
                    return false;
                }
            }
        }
        if (this.ETA == null) {
            this._toaster.toast("error", "Alert", "ETA canot be blank !");
            return false;
        }

//        if (this._dataService.DateFromAndToComparision(this.ETA.formatted, this.BookingDate) == false) {
        if (this._dataService.date2Comparison(this.BookingDate.formatted,this.ETA.formatted) == false) {
            this._toaster.toast("error", "Alert", "ETA Should be greater than Booking Received Date !");
            return false;
        }
        return true;
    }

    reset() {
        this.ViewType = 'SEARCH';
        this.OrderNo = '';
    }

    new() {
        this._router.navigate(['export/Booking/new-order-booking', this.EdiGroup, this.OrderNo, 'new']);
    }
}