import { Component, OnInit ,ViewEncapsulation} from '@angular/core';
import { DataService } from '../../../shared/service/dataService';
import { AuthService } from '../../../shared/service/authService';
import { Router } from '@angular/router';
import { ToastCommonService } from '../../../shared/service/toastService';
import { LoginService } from '../../../shared/service/loginService';
import { SharedDataSerice } from '../../export-share-data.service';
import { LoaderService } from '../../../shared/service/loader.service';
 
@Component({
    templateUrl: 'consg-start.component.html',
 //   styleUrls: ['../../../../../node_modules/@ng-select/ng-select/themes/default.theme.css'], 
    // encapsulation: ViewEncapsulation.None
     
})
export class ConsgStartComponent implements OnInit {
    private baseUrl: string = 'Export/GetExportConsignment';

    exporters:Array<any> = [];
    agents: Array<any> = [];
    subagents: Array<any> = [];
    consignees: Array<any> = [];
    banks: Array<any> = [];
    vessels: Array<any> = [];

    commondrpselected: string;
    dateNow: any;
    rbexptshipper: boolean = false;
    rbbillto: boolean = false;
    rbmanufaturer: boolean = false;

    rbexporter: number;
    rbCons: number;
    rbConsDisabled: number;
    hdshipper: string;
    hdexpt_billto: string;
    hdmanufacturer: string;
    hdexpt_consignee: any;
    hdexpt_buyer: any;
    txtshipper;
    txtexpt_billto;
    txtmanufacturer;
    drpShipper: any;
    drpexpt_consignee: any;
    drpManufact: any;
    drpAgent: any = null;
    drpSubAgent: any = null;
    chknotify: boolean;
    drpBank: any = null;
    drpVessel: any = null;
    txtConsignee: any;
    txtBuyername: any;
    rbstuff: number;
    drpVesselDisabled: number;
    trSubAir: string;
    rbsubair: number = 0;
    shipmentMode: string = 'SEA';
    airShipmentType: string;
    trSubSea: string;
    rbsubsea: number = 0;
    seaShipmentType: string;
    City: string = '';

    constructor(
        private _router: Router,
        private _dataService: DataService,
        private _auth: AuthService,
        private _toasterService: ToastCommonService,
        private _loginService: LoginService,
        private _sharedconsig: SharedDataSerice,
        private _loaderService: LoaderService) {
        this.commondrpselected = '-1';
        this.drpShipper = "";
        this.drpManufact = "";
        this.drpexpt_consignee = "";
        this.chknotify = false;
        this.drpVessel = null;
        this.rbstuff = 2;
        this.drpVesselDisabled = 0;
        this.trSubAir = 'N';
        this.trSubSea = 'Y'
        this.City = this._loginService.getLogin()[0].CITYCODE;
    }

    ngOnInit(): void {
        this._loginService.verifyRights('214', '')
            .subscribe((data: any) => {
                this._loginService.checkVerify('Add', data);
            });
        this.rbexporter = 1;
        this.rbCons = 1;
         this._toasterService.toast('info', 'New feature...', '1. Please select [Differed Air] , Air [Normal Air] or SEA- AIR for AIR SHIPMENT  !!!');

     // this._toasterService.toast('info', 'New feature...', '1. Please select [Sea-Air] or Sea [Normal Sea] for SEA SHIPMENT !!!');
        const jcitycode = {
            citycode: this._loginService.getLogin()[0].CITYCODE,
            cmpcode: this._loginService.getLogin()[0].CMPCODE
        };
        this._loaderService.display(true);
        this._dataService.Common(this.baseUrl, jcitycode)
            .subscribe((data: any) => {
                this._loaderService.display(false);
                this.exporters = data.Table;
                this.agents = data.Table1;
                     
                if (this._loginService.getLogin()[0].CITYCODE == 'DAC') {
                    //this.subagents = data.Table2;
                    this.consignees = data.Table2;
                    this.banks = data.Table3;
                    this.vessels = data.Table4;
                } else {
                    this.consignees = data.Table2;
                    this.banks = data.Table3;
                    this.vessels = data.Table4;
                    this.subagents=data.Table5;
                }
            },
                (error) => {
                    this._toasterService.toast('error', 'Error', error.status + '<br/>' + error.statusText);
                },
                () => {
                });
    }

    fill(check): void {
        this.rbexporter = check;
        if (check == 1) {
            if (this.hdshipper != "") {
                this.drpShipper = this.hdshipper;
            }
            else {
                this.drpShipper = "";
            }
        } else if (check == 2) {
            if (this.hdexpt_billto != "") {
                this.drpShipper = this.hdexpt_billto;
            }
            else {
                this.drpShipper = "";
            }
        } else if (check == 3) {
            if (this.hdmanufacturer != "") {
                this.drpShipper = this.hdmanufacturer;
            }
            else {
                this.drpShipper = "";
            }
        }

    }

    drpfill(drpShipper: any): void {
        if (drpShipper != null || drpShipper != "") {
            if (this.rbexporter == 1) {
                this.txtshipper = this.exporters.filter((exporter: any) => exporter.VALUEFIELD === drpShipper)[0].TEXTFIELD;
                this.txtexpt_billto = this.exporters.filter((exporter: any) => exporter.VALUEFIELD === drpShipper)[0].TEXTFIELD;
                this.hdshipper = drpShipper;
                this.hdexpt_billto = drpShipper;
                this.rbexporter = 2;
            } else if (this.rbexporter == 2) {
                this.txtexpt_billto = this.exporters.filter((exporter: any) => exporter.VALUEFIELD === drpShipper)[0].TEXTFIELD;
                this.hdexpt_billto = drpShipper;
            } else if (this.rbexporter == 3) {
                this.txtmanufacturer = this.exporters.filter((exporter: any) => exporter.VALUEFIELD === drpShipper)[0].TEXTFIELD;
                this.hdmanufacturer = drpShipper;
            }
        }
    }

    onChangeNotify(chk: any): void {
        if (chk) {
            this.rbConsDisabled = 2;
            this.rbCons = 1;
            this.hdexpt_buyer = "";
            this.txtBuyername = "";
        } else {
            this.rbConsDisabled = 0;
            this.rbCons = 0;
        }
        this.drpexpt_consignee = "";
        this.hdexpt_consignee = "";
    }

    fill1(check: any): void {
        this.rbCons = check;
        if (check == 1) {
            if (this.hdexpt_consignee != "") {
                this.drpexpt_consignee = this.hdexpt_consignee;
            }
            else {
                this.drpexpt_consignee = "";
            }
        }
        else if (check == 2) {
            if (this.hdexpt_buyer != "") {
                this.drpexpt_consignee = this.hdexpt_buyer;
            }
            else {
                this.drpexpt_consignee = "";
            }
        }
    }

    consfill(drpconsig: any): void {
        if (drpconsig != null || drpconsig != "") {
            if (this.rbCons == 1) {
                if (this.chknotify) {
                    this.hdexpt_consignee = drpconsig;
                    this.txtConsignee = this.consignees.filter((consignee: any) => consignee.VALUEFIELD === drpconsig)[0].TEXTFIELD;
                    this.hdexpt_buyer = drpconsig;
                    this.txtBuyername = this.consignees.filter((consignee: any) => consignee.VALUEFIELD === drpconsig)[0].TEXTFIELD;
                } else {
                    this.hdexpt_consignee = drpconsig;
                    this.txtConsignee = this.consignees.filter((consignee: any) => consignee.VALUEFIELD === drpconsig)[0].TEXTFIELD;
                }
            }
            else if (this.rbCons == 2) {
                this.hdexpt_buyer = drpconsig;
                this.txtBuyername = this.consignees.filter((consignee: any) => consignee.VALUEFIELD === drpconsig)[0].TEXTFIELD;
            }
        }
    }

    vsl(chk, shpttype): void {
        this.rbstuff = chk;
        this.shipmentMode = shpttype;
        if (chk == 1) {
            this.drpVesselDisabled = 0;
        }
        if (chk == 2) {
            this.drpVesselDisabled = 0;
        }
        if (chk == 3) {
            this.drpVesselDisabled = 1;
            this.drpVessel = null;
        }
        //this.rbsubair = null; //  null= nothing selected 

        if (chk == 3) {
            this.trSubAir = 'Y';
        } else { this.trSubAir = 'N'; }
       if (chk != 3) {
            this.trSubSea = 'Y';
        } else { this.trSubSea = 'N'; }
    }

    subAir(chk: any): void {
        this.rbsubair = chk;
        this.airShipmentType = chk;
        if (chk==2){
        this.drpVesselDisabled = 0;}
    }
    // subSea(chk: any): void {
    //     this.rbsubsea = chk;
    //     this.seaShipmentType = chk;
    // }

    finalSubmit() {

        if (this.txtshipper == undefined || this.txtshipper == "") { this._toasterService.toast('error', 'Error', "Exporter can not be blank"); return false; }
        else if (this.txtexpt_billto == undefined || this.txtexpt_billto == "") { this._toasterService.toast('error', 'Error', "Bill To can not be blank"); return false; }
        else if (this.drpAgent == undefined || this.drpAgent == -1) { this._toasterService.toast('error', 'Error', "Agent can not be blank"); return false; } //Agent can not be blank
        else if (this.txtConsignee == undefined || this.txtConsignee == "") { this._toasterService.toast('error', 'Error', "Consignee can not be blank"); return false; }
        else if (!this.chknotify) { if (this.txtBuyername == undefined || this.txtBuyername == "") { this._toasterService.toast('error', 'Error', "Buyer can not be blank"); return false; } }
        else if (this.rbstuff == 1) {
            if (this.drpVessel == null) {
                this._toasterService.toast('error', 'Error', "Please select vessel");
                return false;
            }
            else if (this.drpVessel.substring(3, 7) == "2099") {
                this._toasterService.toast('error', 'Error', "Please select the correct vessel");
                return false;
            }
        }
        else if (this.rbstuff == 2) {
            if (this.drpVessel == null) {
                this._toasterService.toast('error', 'Error', "Please select vessel");
                return false;
            }
        }
        // else if (this.rbstuff != 3) {
        //     if (this.rbsubsea == null) {
        //         this._toasterService.toast('error', 'Error', "Please select at least One \n 1. Sea [ Normal Sea ] \n 2.SEA - AIR [Air from Transhipment port] !");
        //         return false;
        //     }
        //     else {
        //         if (this.rbsubsea == 0) {
        //             SubAirSTR = "SEA [Normal SEA]";
        //             strmsg = "You have selected " + SubAirSTR + " ! \n Mode of Shipment Cannot be modified later !! \n\n If Selection is ok, Click OK to Continue and Cancel To Retry !!!"
        //         }
        //         if (this.rbsubair == 1) {
        //             SubAirSTR = "SEA - AIR ";
        //             strmsg = "You have selected " + SubAirSTR + "  !\n Mode of Shipment Cannot be modified later !! \n\n If Selection is ok, Click OK to Continue and Cancel To Retry !!!"
        //         }
        //         var confirm1 = confirm(strmsg);
        //         if (confirm1 == false) {
        //             return false;
        //         }
        //     }
        // }
        else if (this.rbstuff == 3) {
            var strmsg = "";

            var SubAirSTR = "";

            if (this.rbsubair == null) {
                this._toasterService.toast('error', 'Error', "Please select at least One \n 1. Air [ Normal Air ] \n 2. Diff Air [Differed Air] \n 3. SEA- AIR !");
                return false;
            }
            else {
                if (this.rbsubair == 0) {
                    SubAirSTR = "AIR [Normal Air]";
                    strmsg = "You have selected " + SubAirSTR + " ! \n Mode of Shipment Cannot be modified later !! \n\n If Selection is ok, Click OK to Continue and Cancel To Retry !!!"
                }
                if (this.rbsubair == 1) {
                    SubAirSTR = "DIFFERED AIR ";
                    strmsg = "You have selected " + SubAirSTR + "  !\n Mode of Shipment Cannot be modified later !! \n\n If Selection is ok, Click OK to Continue and Cancel To Retry !!!"
                }
                if (this.rbsubair == 2) {
                    SubAirSTR = "SEA-AIR ";
                    strmsg = "You have selected " + SubAirSTR + "  !\n Mode of Shipment Cannot be modified later !! \n\n If Selection is ok, Click OK to Continue and Cancel To Retry !!!"
                }
                var confirm1 = confirm(strmsg);
                if (confirm1 == false) {
                    return false;
                }
            }
        }
       
         let vesselcode ="",vesselport=""
         vesselcode = (this.rbstuff != 3) ? (this.drpVessel != null) ? this.drpVessel.split("|")[0] : '' : '';
         vesselport = (this.rbstuff != 3) ? (this.drpVessel != null) ? this.drpVessel.split("|")[1] : '' : '';
         if (this.rbstuff == 3)
         {
             if (this.rbsubair==2){
                  vesselcode =   (this.drpVessel != null) ? this.drpVessel.split("|")[0] : ''  ;
                  vesselport =  (this.drpVessel != null) ? this.drpVessel.split("|")[1] : ''  ;
             }
         }      
        
        let vesselid = (this.drpVessel != null) ? this.vessels.filter((vessel: any) => vessel.VALUEFIELD === this.drpVessel)[0].VALUEFIELD : '';
        let vesselname = (this.drpVessel != null) ? this.vessels.filter((vessel: any) => vessel.VALUEFIELD === this.drpVessel)[0].TEXTFIELD : '';
        if(this.rbsubair == 2)
        {
           if(vesselid =='')
           {
            this._toasterService.toast('error', 'Error', "Please select the correct vessel");
            return false;
           }
        }
        this._sharedconsig.sharedData = {
            exporterid: this.hdshipper,
            exportername: this.txtshipper,
            billtoid: this.hdexpt_billto,
            billtoname: this.txtexpt_billto,
            manufacturerid: (this.hdmanufacturer != undefined) ? this.hdmanufacturer : '',
            manufacturername: (this.txtmanufacturer != undefined) ? this.txtmanufacturer : '',
            agentid: (this.drpAgent) ? this.drpAgent : '',
            agentname: (this.drpAgent != null) ? this.agents.filter((filter) => filter.VALUEFIELD == this.drpAgent)[0].TEXTFIELD : '',
            subagentid: (this.drpSubAgent != null) ? this.drpSubAgent : '',
            subagentname: (this.drpSubAgent != null) ? this.subagents.filter((filter) => filter.VALUEFIELD == this.drpSubAgent)[0].TEXTFIELD : '',
            consigneeid: this.hdexpt_consignee,
            consigneename: this.txtConsignee,
            consigneetobankid: (this.drpBank != null) ? this.drpBank : '',
            consigneetobankname: (this.drpBank != null) ? this.banks.filter((filter) => filter.VALUEFIELD == this.drpBank)[0].TEXTFIELD : '',
            notifybuyer: (this.chknotify == true) ? "yes" : "",
            buyerid: this.hdexpt_buyer,
            buyername: this.txtBuyername,
            modeofship: (this.rbsubair == 2) ? "SEA" : this.shipmentMode,
            airshipmode: this.rbsubair,
            vesselcode: vesselcode,
            vesselport: vesselport,
            vesselid: vesselid,
            vesselname: vesselname,
            pcs: 0,
            seashipmode:this.rbsubsea,
            modeofshipment:this.rbstuff
        };

        //this._sharedconsig.sharedData =
        //    {
        //        agentid: "S101715",
        //        agentname: "2W SINOTRANS - BEJING AIRTRANS NORTHERN BRANCH",
        //        billtoid: "E100966",
        //        billtoname: "2ND IN BUILDING MATERIALS INC.",
        //        notifybuyer: "yes",
        //        buyerid: "C106326",
        //        buyername: "3Z CORPORATIONS.",
        //        consigneeid: "C100057",
        //        consigneename: "LA REDOUTE",
        //        exporterid: "E100966",
        //        exportername: "2ND IN BUILDING MATERIALS INC.",
        //        consigneetobankid: "B100043",
        //        consigneetobankname: "HSBC -CCF, TRADE SERVICES",
        //        manufacturerid: "E100185",
        //        manufacturername: "3 `A` INC.",
        //        modeofship: "AIR",
        //        airshipmode: 0,
        //        vesselcode: "MUM20024178",
        //        vesselport: "MUM",
        //        vesselid: null,
        //        vesselname: null,
        //        pcs: 0
        //    };
        this._loaderService.display(true);
        this._router.navigate(['export/Consignment/main']);
       // if (this._loginService.getLogin()[0].CMPTYPE === 'FRT') {
         //    this._router.navigate(['export/consignment/order-booking-list']);
       // } else {
        //    this._router.navigate(['export/consignment/main']);
      //  }
        this._loaderService.display(false);
    }
}  