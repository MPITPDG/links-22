import { Component, OnInit ,ViewEncapsulation} from '@angular/core';
import { DataService } from '../../../shared/service/dataService';
import { AuthService } from '../../../shared/service/authService';
import { Router } from '@angular/router';
import { ToastCommonService } from '../../../shared/service/toastService';
import { LoginService } from '../../../shared/service/loginService';
import { SharedDataSerice } from '../../export-share-data.service';
import { LoaderService } from '../../../shared/service/loader.service';
import { IMyDpOptions } from 'mydatepicker';
import { ToasterConfig } from 'angular2-toaster';
@Component({
    templateUrl: 'consign_create_new.component.html',
 //   styleUrls: ['../../../../../node_modules/@ng-select/ng-select/themes/default.theme.css'], 
    // encapsulation: ViewEncapsulation.None
     
})
export class CreateAutoJobComponent implements OnInit {
    private baseUrl: string = 'Export/GetExportConsignmentNew';

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
            openSelectorTopOfInput: true,
            openSelectorOnInputClick: true,
            selectorHeight: '180px',
            selectorWidth: '200px'
        };
    exptnolist:Array<any> =[];   
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
    docrecdt: any = null;
    grino: any = null;
    gridt: any = null;
    expinvno: any = null;
    exptinvdt: any = null;
    incotermlist: Array<any> = [];
    incoterm: any = "FOB";
    constructor(
        private _router: Router,
        private _dataService: DataService,
        private _auth: AuthService,
        private _toasterService: ToastCommonService,
        private _loginService: LoginService,
        private _sharedEditExport: SharedDataSerice,
        private _loaderService: LoaderService) {
        this.commondrpselected = '-1';
        this.drpShipper =null;
        this.drpManufact = null;
        this.drpexpt_consignee = null;
        this.chknotify = false;
        this.drpVessel = null;
        this.rbstuff = 2;
        this.drpVesselDisabled = 0;
        this.trSubAir = 'N';
        this.trSubSea = 'Y'
        this.City = this._loginService.getLogin()[0].CITYCODE;
    }

    ngOnInit(): void {
        
        this._loginService.verifyRights('428', '')
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
                this.subagents=data.Table5
                this.exptnolist=data.Table7;
                this.incotermlist = data.Table8
                if (this._loginService.getLogin()[0].CITYCODE == 'DAC') {
                    //this.subagents = data.Table2;
                    this.consignees = data.Table2;
                    this.banks = data.Table3;
                    this.vessels = data.Table4;
                } else {
                    this.consignees = data.Table2;
                    this.banks = data.Table3;
                    this.vessels = data.Table4;
                }
            },
                (error) => {
                    this._toasterService.toast('error', 'Error', error.status + '<br/>' + error.statusText);
                },
                () => {
                });
    }
testToast() {
    this._toasterService.toast('error', 'Error', 'Shipper cannot be blank');
}
    fill(check): void {
        this.rbexporter = check;
        if (check == 1) {
            if (this.hdshipper != "") {
                this.drpShipper = this.hdshipper;
            }
            else {
                this.drpShipper = null;
            }
        } else if (check == 2) {
            if (this.hdexpt_billto != "") {
                this.drpShipper = this.hdexpt_billto;
            }
            else {
                this.drpShipper = null;
            }
        } else if (check == 3) {
            if (this.hdmanufacturer != "") {
                this.drpShipper = this.hdmanufacturer;
            }
            else {
                this.drpShipper = null;
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


    finalSubmit() {

        if (this.txtshipper == undefined || this.txtshipper == '') 
            { alert('Exporter can not be blank');return false; }
        else if (this.txtexpt_billto == undefined || this.txtexpt_billto == '') { alert('Bill To can not be blank'); return false; }
        else if (this.drpAgent == undefined || this.drpAgent == -1) { alert('Agent can not be blank');  return false; } //Agent can not be blank
        else if (this.txtConsignee == undefined || this.txtConsignee == '') { alert('Consignee can not be blank'); return false; }
        else if (!this.chknotify) { if (this.txtBuyername == undefined || this.txtBuyername == '') { alert('Buyer can not be blank'); return false; } }
        // else if (this.rbstuff == 1) {
        //     if (this.drpVessel == null) {
        //         this._toasterService.toast('error', 'Error', "Please select vessel");
        //         return false;
        //     }
        //     else if (this.drpVessel.substring(3, 7) == "2099") {
        //         this._toasterService.toast('error', 'Error', "Please select the correct vessel");
        //         return false;
        //     }
        // }
        // else if (this.rbstuff == 2) {
        //     if (this.drpVessel == null) {
        //         this._toasterService.toast('error', 'Error', "Please select vessel");
        //         return false;
        //     }
        // }
      
        else if (this.rbstuff == 3) {
            var strmsg = "";

            var SubAirSTR = "";

            if (this.rbsubair == null) {
                alert('Please select at least One \n 1. Air [ Normal Air ] \n 2. Diff Air [Differed Air] \n 3. SEA- AIR !');
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
          if (this.docrecdt == null)
             {   
                alert('Document Received Date can not be blank'); return false; }
        if (this.expinvno == null) { alert('Invoice No. can not be blank'); return false; }
        if (this.exptinvdt == null) { alert('Invoice Date can not be blank'); return false; }
        if (this._dataService.DateFromAndToComparision_exp(this.exptinvdt.formatted, this.docrecdt.formatted) == false) { alert('Invoice Date Should be less than or Equal to Doc. Recd Date.'); return false; }
        //  let vesselcode ="",vesselport=""
        //  vesselcode = (this.rbstuff != 3) ? (this.drpVessel != null) ? this.drpVessel.split("|")[0] : '' : '';
        //  vesselport = (this.rbstuff != 3) ? (this.drpVessel != null) ? this.drpVessel.split("|")[1] : '' : '';
        //  if (this.rbstuff == 3)
        //  {
        //      if (this.rbsubair==2){
        //           vesselcode =   (this.drpVessel != null) ? this.drpVessel.split("|")[0] : ''  ;
        //           vesselport =  (this.drpVessel != null) ? this.drpVessel.split("|")[1] : ''  ;
        //      }
        //  }      
        
        // let vesselid = (this.drpVessel != null) ? this.vessels.filter((vessel: any) => vessel.VALUEFIELD === this.drpVessel)[0].VALUEFIELD : '';
        // let vesselname = (this.drpVessel != null) ? this.vessels.filter((vessel: any) => vessel.VALUEFIELD === this.drpVessel)[0].TEXTFIELD : '';
        // if(this.rbsubair == 2)
        // {
        //    if(vesselid =='')
        //    {
        //     this._toasterService.toast('error', 'Error', "Please select the correct vessel");
        //     return false;
        //    }
        // }
        let _jsonFinal = {
            Id: "0",
            Exptno: "",
            Expt_Guid: this._loginService.getLogin()[0].GUID,
            Expt_Mode:  (this.rbsubair == 2) ? "SEA" : this.shipmentMode,
            Expt_Exporter: this.drpShipper,
            Expt_Billto: this.hdexpt_billto,
            Expt_Consignee: this.drpexpt_consignee,
            Expt_Docrecd: this.docrecdt.formatted,
            Expt_Invno: this.expinvno,
            Expt_Invdate: this.exptinvdt.formatted,
            Citycode: this._loginService.getLogin()[0].CITYCODE,
            Cmpcode: this._loginService.getLogin()[0].CMPCODE,
            Notifybuyer:  (this.chknotify == true) ? "yes" : "",
            Expt_Buyer: this.hdexpt_buyer,
            Manufacturer: (this.hdmanufacturer != undefined || this.hdmanufacturer != null) ? this.hdmanufacturer : '',
            Username: this._loginService.getLogin()[0].CMPID,
            Citycode1: this._loginService.getLogin()[0].CITYCODE1,
            SubAgentId: (this.drpSubAgent != null) ? this.drpSubAgent : '',
            agentid:  (this.drpAgent) ? this.drpAgent : '',
            MODEOF_SHIPMENT: this.rbstuff,
            Isdiffair:this.rbsubair,
            MakerIp:this._loginService.getLogin()[0].MAKERIP,
            incoterm:this.incoterm
            
        }
        this._loaderService.display(true);
        this._dataService.Common("Export/USP_EXP_MST_EXPORT_AUTO_IU", _jsonFinal)
            .subscribe((data: any) => {
                this._loaderService.display(false);
                if (data.Table[0].STATUS == "100") {
                    alert("Export Consignment " + data.Table[0]["STATUSTEXT"] + " Gnererated Successfully!");
                    this.exptnolist=data.Table1;
                                     
                   // this._router.navigate(['export/Consignment/search']);
                }
                else {
                    alert(data.Table[0].STATUSTEXT) ;
                }
            });
      
}
 getSearchData(value, stype) {
        const _jsonData = {
            Type1: stype,
            Type2: value,
            Type3: this._loginService.getLogin()[0].CMPCODE,
            Type4: this._loginService.getLogin()[0].CITYCODE
        };
        this._loaderService.display(true);
        this._dataService.Common("Export/ConsignmentSearchList", _jsonData)
            .subscribe((data: any) => {
                this._loaderService.display(false);
                if (data.Table.length >0) {

                if (data.Table.length == 1) {
                    this.setValue(data.Table[0]);
                }
                          
            }
            else
            {
                alert('No record found');
            }
            },
            (error) => {
                alert(error.status + '<br/>' + error.statusText);
            },
            () => {
            });
    }
setValue(event) {
        if  (event.EXPTCANCEL == 'Y')
        {
            this._toasterService.toast("error", "Alert", "This DOCS. " + event.EXPTNO + " CANCELED"); 
            this._sharedEditExport.exportEditData = event;
            this._router.navigate(['export/Consignment/view', event.EXPTNO]);
        }
        else
        {
            if (event.EXPT_MODE == 'AIR') {
                if (event.JOBEXIST != 'NO') {
                    if (event.ACTUALFLIGHTDT != '' && event.CO2_EMITION_LVL != '0') {
                       // this._toasterService.toast("error", "Alert", "This Export No. " + event.EXPTNO + " Already Imported");
                        this._sharedEditExport.exportEditData = event;
                        this._sharedEditExport.jobcreationtype='A';
                        //this._router.navigate(['export/Consignment/view', event.EXPTNO]);
                        this.setEditAndRedirect(event.EXPTNO);
                    }  else if (event.ACTUALFLIGHTDT == '' || event.CO2_EMITION_LVL == '0') {
                        this.setEditAndRedirect(event.EXPTNO);
                    // this._router.navigate(["export/consignment/edit-actual-flight-date", event.EXPTNO]);
                    }
                }
                else {
                    this._sharedEditExport.exportEditData = event;
                    this.setEditAndRedirect(event.EXPTNO);
                }
            } else if (event.EXPT_MODE == 'SEA' && event.ISDIFFAIR =='0'  ) {
                if (event.JOBEXIST != 'NO') { 
                    this._toasterService.toast("error", "Alert", "This Export No. " + event.EXPTNO + " Already Imported"); 
                    this._sharedEditExport.exportEditData = event;
                    this._sharedEditExport.jobcreationtype='A';
                    this._router.navigate(['export/Consignment/view', event.EXPTNO]);
                }
                else {
                    this._sharedEditExport.exportEditData = event;
                    this._sharedEditExport.jobcreationtype='A';
                    this.setEditAndRedirect(event.EXPTNO);
                }                
            } 
            else if (event.EXPT_MODE == 'SEA' && event.ISDIFFAIR =='2'  ) {
                this._sharedEditExport.exportEditData = event;
                this._sharedEditExport.jobcreationtype='A';
                this.setEditAndRedirect(event.EXPTNO);
            }  
        }
    }
setEditAndRedirect(exptno){
        this._toasterService.toast('info', '', "Please wait fetching data...");
        const _jsonData = {
            Type1: exptno,
            Type2: this._loginService.getLogin()[0].CMPID
        };
        this._loaderService.display(true);
        this._dataService.Common("Export/ConsignmentEditSearchView", _jsonData)
            .subscribe((data: any) => {
                this._loaderService.display(false);
                this._sharedEditExport.exportEditData = data.Table[0];
                this._sharedEditExport.jobcreationtype='A';
                this._router.navigate(['export/Consignment/edit']);
            },
            (error) => {
                this._toasterService.toast('error', 'Error', error.status + '<br/>' + error.statusText);
            });
    }  
    Redirecttoedit(exptno){
        this.getSearchData(exptno,'EXPORTNO')
    }
    Reset(){
        this.drpShipper=null;
        this.drpBank=null;
        this.drpAgent=null;
        this.drpSubAgent=null;
        this.drpexpt_consignee=null;
        this.drpManufact=null;
        this.hdexpt_buyer=null;
        this.expinvno='';
        this.exptinvdt='';
        this.docrecdt='';
        this.txtBuyername='';
        this.txtexpt_billto='';
        this.txtshipper='';
        this.txtmanufacturer='';
        this.txtConsignee='';
        this.shipmentMode="SEA"
        this.rbstuff=2
    }
}