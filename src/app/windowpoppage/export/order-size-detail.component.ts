import { Component, OnInit, ViewChild, ElementRef ,AfterViewInit} from '@angular/core';
import { DataService } from '../../shared/service/dataService';
import { LoginService } from '../../shared/service/loginService';
import { ToastCommonService } from '../../shared/service/toastService';
import {
    ButtonService
} from '../../shared/common-font-changer.directive';
import { ActivatedRoute } from '@angular/router';

@Component({
    templateUrl: 'order-size-detail.component.html'
})
export class ExportConsignmentOrderSizeDetailComponent implements OnInit {
    @ViewChild('submitButton', {static: false}) submitButton: ElementRef;

   
    
    TransferJobList: Array<any> = [];

    paramData: any = { orderno: null, styleno: null, exptno: null, concode: null };
    OrderSizeList: Array<any> = [];


    OldJobNo: any = '';
    Branch: any = null;
    BranchList: Array<any> = [];
    UserRemarks = '';
    CNT_TYPE :string="";
    ErrorMessage: any = '';

    constructor(
        private _dataService: DataService,
        private _toasterService: ToastCommonService,
        private _disable: ButtonService,
        private _loginService: LoginService,
        private _route: ActivatedRoute) { }

        ngAfterViewInit()
        {
         console.log(this.submitButton.nativeElement);
        }

    ngOnInit() {
        this._route.params.subscribe(params => {
            this.paramData = {
                orderno: params["orderno"],
                styleno: params["styleno"],
                exptno: params["exptno"],
                concode: params["concode"]
            }
         
            this.pageLoad(this.paramData);
        });

    }

    pageLoad(paramData: any) {
      //  this._disable.disableButton(this.submitButton);
        const _jsonData = {
            orderno: paramData.orderno,
            styleno: paramData.styleno,
            exptno: paramData.exptno,
            concode: paramData.concode
        };
        this._dataService.getData("Export/OrderSizeDetailsList", _jsonData)
            .subscribe((data: any) => {
               
                this.OrderSizeList = data.Table;
                this.CNT_TYPE=data.Table[0].CNT_TYPE;
              //  this._disable.enableButton(this.submitButton);
              //  console.log("Data", data);
            });
    }

    submit() {
        let tempArray = this.OrderSizeList;
        let strValue = '';
        let Total_pkg = 0;
        let Total_Noofpkgs = 0;
        let Total_grwt = 0;
        let Total_netwt = 0;
        let Total_vol = 0;
        tempArray.forEach(item => {
            Total_pkg = Number(Total_pkg) + Number(item.PCS);
            Total_Noofpkgs = Number(Total_Noofpkgs) + Number(item.PKGS);
            Total_grwt = Number(Total_grwt) + Number(item.GRWT);
            Total_netwt = Number(Total_netwt) + Number(item.NETWT);
            Total_vol = Number(Total_vol) + Number(item.VOL);

            strValue += item["PK_ID"] + "|"               
                + item["CODE_SIZE"] + "|"
                + item["FK_ORDERID"] + "|"
                + item["PCS"] + "|"
                + item["PKGS"] + "|"
                + item["GRWT"] + "|"
                + item["NETWT"] + "|"
                + item["VOL"] + ";";
        });

        if (Number.isNaN(Total_pkg)
            || Number.isNaN(Total_Noofpkgs)
            || Number.isNaN(Total_grwt)
            || Number.isNaN(Total_netwt)
            || Number.isNaN(Total_vol)) {
            this._toasterService.toast('error', 'Alert', 'Invalid input please try to input number or decimal number value.');
        }
        else {
            if (Total_pkg == 0) { this._toasterService.toast('error', 'Alert', 'Please enter atleast one entry !'); return false; }
            if (Total_Noofpkgs == 0) { this._toasterService.toast('error', 'Alert', 'Please Enter PKGs !'); return false; }
            if (Total_grwt == 0) { this._toasterService.toast('error', 'Alert', 'Please Enter Gross Wt. !'); return false; }
            if (Total_netwt == 0) { this._toasterService.toast('error', 'Alert', 'Please Enter Net Wt. !'); return false; }
            if (Total_vol == 0) { this._toasterService.toast('error', 'Alert', 'Please Enter Volume !'); return false; }


            if (Total_pkg != Number(tempArray[0]["TOT_PCS"])) { this._toasterService.toast('error', 'Alert', "Size wise Toal Pcs : [ " + Total_pkg + " ], Should be Equal to Order Pcs: " + tempArray[0]["TOT_PCS"] + " !"); return false; }
            if (Total_Noofpkgs != Number(tempArray[0]["TOT_PKGS"])) { this._toasterService.toast('error', 'Alert', "Size wise Toal Pkgs : [ " + Total_Noofpkgs + " ], Should be Equal to Order Pkgs: [ " + tempArray[0]["TOT_PKGS"] + " ] !"); return false; }
            if (Total_grwt.toFixed(3) != Number(tempArray[0]["TOT_GRWT"]).toFixed(3)) { this._toasterService.toast('error', 'Alert', "Size wise Toal Gross Wt. : [ " + Total_grwt + " ], Should be Equal to Order Gr. Wt: [ " + tempArray[0]["TOT_GRWT"] + " ] !"); return false; }
            if (Total_netwt.toFixed(3) != Number(tempArray[0]["TOT_NETWT"]).toFixed(3)) { this._toasterService.toast('error', 'Alert', "Size wise Toal Net Wt. : [ " + Total_netwt + " ], Should be Equal to Order Net Wt. : [ " + tempArray[0]["TOT_NETWT"] + " ] !"); return false; }
            if (this.CNT_TYPE !='GOH'){
             if (Total_vol.toFixed(3) != Number(tempArray[0]["TOT_VOL"]).toFixed(3)) { this._toasterService.toast('error', 'Alert', "Size wise Toal Volume : [ " + Total_vol + " ] Should be Equal to Order Volume : [ " + tempArray[0]["TOT_VOL"] + " ] !"); return false; }
            }

            this._disable.disableButton(this.submitButton);
            const _jsonData = {
                ExptNo: this.paramData.exptno,
                Concode: this.paramData.concode,
                OrderNo: this.paramData.orderno,
                StyleNo: this.paramData.styleno,
                TotalPackage: Total_pkg,
                Str: strValue,
                MakerId: this._loginService.getLogin()[0].CMPID,
                MakerIp: this._loginService.getLogin()[0].CMPID     //Change later by ip
            };
            this._dataService.Common("Export/OrderSizeDetailsSubmit", _jsonData)
                .subscribe((data: any) => {
                    this._disable.enableButton(this.submitButton);
                    if(data.Table[0].STATUS=='100'){
                        this._toasterService.toast('success', 'Alert', 'Order size details saved successfully !');
                    }
                });

        }

    }
}