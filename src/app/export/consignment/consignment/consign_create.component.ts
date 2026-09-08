import { Component, OnInit ,ViewEncapsulation} from '@angular/core';
import { DataService } from '../../../shared/service/dataService';
import { AuthService } from '../../../shared/service/authService';
import { Router } from '@angular/router';
import { ToastCommonService } from '../../../shared/service/toastService';
import { LoginService } from '../../../shared/service/loginService';
import { SharedDataSerice } from '../../export-share-data.service';
import { LoaderService } from '../../../shared/service/loader.service';
import { IMyDpOptions } from 'mydatepicker';
import { trigger, state, style, transition, animate } from '@angular/animations';
@Component({
    templateUrl: 'consign_create.component.html',
   styleUrls: ['consign_create.component.css'], 
    animations: [
    trigger('slideToggle', [
      state('open', style({ height: '*', opacity: 1, overflow: 'hidden' })),
      state('closed', style({ height: '0px', opacity: 0, overflow: 'hidden' })),
      transition('open <=> closed', [animate('250ms ease-in-out')]),
    ])
  ]
    // encapsulation: ViewEncapsulation.None
     
})
export class CreateJobComponent implements OnInit {
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
            openSelectorTopOfInput: false,
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
    jobno:string="";
    joblist: Array<any> = [];
    selectedJob: any;
    showPopup = false;
    popupJob: any;
    filteredjobdata : Array<any> = [];  
    filteredjobno:any;
    filteredjobconsignee:any;
    filteredjobshipper:any;
    filteredjobinvno:any;
    filteredjobpkgs:any;
    filteredjobpcs:any;  
   hoverTimeout: any;
   popupPosition = { top: 0, left: 0 };
   popupX = 0;
    popupY = 0;
    popupItem: any = null;
    jobDetailsVisible = false;
    showjobdtls=false;
    newArray: any = [];
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
    toggleJobDetails() {
    this.jobDetailsVisible = !this.jobDetailsVisible;
    }
    getprevjobdtls(expcode){
        const _jsonData = {
            expno:expcode,
        };
        this._loaderService.display(true);
        this._dataService.getData("Export/EXP_CONSIGNEMENT_GETPREVJOBDETAILS", _jsonData)
            .subscribe((data: any) => {
                this.joblist=data.Table;
                this.showjobdtls=true;
           });
            this._loaderService.display(false);
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
        console.log(drpShipper)
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
            this.getprevjobdtls(drpShipper);
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
    autojobsubmit(){
        if(this.newArray.length =="0"){
           alert('Please select at least one job no') ;
           return false;
        }
        console.log('jobno :' + this.newArray[0].exptno)
        if (this.docrecdt == null) { this._toasterService.toast('error', 'Error', "Document Received Date can not be blank"); return false; }
            if (this.expinvno == null) { this._toasterService.toast('error', 'Error', "Invoice No. can not be blank"); return false; }
            if (this.exptinvdt == null) { this._toasterService.toast('error', 'Error', "Invoice Date can not be blank"); return false; }
            let _jsonFinal = {
                Id: "0",
                Exptno: this.newArray[0].exptno,//this.jobno,
                Expt_Guid: this._loginService.getLogin()[0].GUID,
                Expt_Mode:  (this.rbsubair == 2) ? "SEA" : this.shipmentMode,
                Expt_Exporter: this.drpShipper,
                Expt_Docrecd: this.docrecdt.formatted,
                Expt_Invno: this.expinvno,
                Expt_Invdate: this.exptinvdt.formatted,
                Citycode: this._loginService.getLogin()[0].CITYCODE,
                Cmpcode: this._loginService.getLogin()[0].CMPCODE,
                Username: this._loginService.getLogin()[0].CMPID,
                Citycode1: this._loginService.getLogin()[0].CITYCODE1,
                MODEOF_SHIPMENT: this.rbstuff,
                Makerip:this._loginService.getLogin()[0].MAKERIP,
                
                
            }
            this._loaderService.display(true);
            this._dataService.Common("Export/EXP_MST_EXPORT_AUTO_IU_20250922", _jsonFinal)
                .subscribe((data: any) => {
                    this._loaderService.display(false);
                    if (data.Table[0].STATUS == "100") {
                        alert("Export Consignment " + data.Table[0]["STATUSTEXT"] + " Gnererated Successfully!");
                        this.exptnolist=data.Table1;
                        this.joblist=[];
                        this.newArray=[];   
                        this.expinvno='';
                        this.exptinvdt='';
                        this.docrecdt='';             
                    // this._router.navigate(['export/Consignment/search']);
                    }
                    else {
                        alert(data.Table[0].STATUSTEXT) ;
                    }
                });
        
        }

    finalSubmit() {

        if (this.txtshipper == undefined || this.txtshipper == '') { this._toasterService.toast('error', 'Error', "Exporter can not be blank"); return false; }
        else if (this.txtexpt_billto == undefined || this.txtexpt_billto == '') { this._toasterService.toast('error', 'Error', "Bill To can not be blank"); return false; }
        else if (this.drpAgent == undefined || this.drpAgent == -1) { this._toasterService.toast('error', 'Error', "Agent can not be blank"); return false; } //Agent can not be blank
        else if (this.txtConsignee == undefined || this.txtConsignee == '') { this._toasterService.toast('error', 'Error', "Consignee can not be blank"); return false; }
        else if (!this.chknotify) { if (this.txtBuyername == undefined || this.txtBuyername == '') { this._toasterService.toast('error', 'Error', "Buyer can not be blank"); return false; } }
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
          if (this.docrecdt == null) { this._toasterService.toast('error', 'Error', "Document Received Date can not be blank"); return false; }
        if (this.expinvno == null) { this._toasterService.toast('error', 'Error', "Invoice No. can not be blank"); return false; }
        if (this.exptinvdt == null) { this._toasterService.toast('error', 'Error', "Invoice Date can not be blank"); return false; }
        if (this._dataService.DateFromAndToComparision_exp(this.exptinvdt.formatted, this.docrecdt.formatted) == false) { this._toasterService.toast('error', 'Error', "Invoice Date Should be less than or Equal to Doc. Recd Date."); return false; }
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
                    this._toasterService.toast('error', 'Error', data.Table[0].STATUSTEXT);
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
                this._toasterService.toast('error', 'Error',  "No record found");
            }
            },
            (error) => {
                this._toasterService.toast('error', 'Error', error.status + '<br/>' + error.statusText);
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
    }
 onJobChange(jobno: any) {
    this.filteredjobdata=this.joblist.filter((job: any) => job.DATAVALUEFIELD === jobno.DATAVALUEFIELD);
    this.filteredjobno=this.filteredjobdata[0].DATATEXTFIELD.split("|")[0];
    this.filteredjobno=this.filteredjobno.split(":")[1];
    this.filteredjobconsignee=this.filteredjobdata[0].DATATEXTFIELD.split("|")[1];
    this.filteredjobconsignee=this.filteredjobconsignee.split(":")[1];
    this.filteredjobshipper=this.filteredjobdata[0].DATATEXTFIELD.split("|")[2];
    this.filteredjobshipper=this.filteredjobshipper.split(":")[1];
    this.filteredjobinvno=this.filteredjobdata[0].DATATEXTFIELD.split("|")[3];
    this.filteredjobinvno=this.filteredjobinvno.split(":")[1];
    this.filteredjobpkgs=this.filteredjobdata[0].DATATEXTFIELD.split("|")[4];
    this.filteredjobpkgs=this.filteredjobpkgs.split(":")[1];
    this.filteredjobpcs=this.filteredjobdata[0].DATATEXTFIELD.split("|")[5];
    this.filteredjobpcs=this.filteredjobpcs.split(":")[1];
    this.popupJob = jobno;
   // this.showPopup = true;
  }
onJobHover(job: any, event: MouseEvent) {
  const parts = job.DATATEXTFIELD.split('|');
  this.filteredjobno = parts[0].split(':')[1] || '';
  this.filteredjobconsignee = parts[1].split(':')[1] || '';
  this.filteredjobshipper = parts[2].split(':')[1] || '';
  this.filteredjobinvno = parts[3].split(':')[1] || '';
  this.filteredjobpkgs = parts[4].split(':')[1] || '';
  this.filteredjobpcs = parts[5].split(':')[1] || '';

  this.popupJob = job;
  //this.showPopup = true;

  const target = event.target as HTMLElement;
  const rect = target.getBoundingClientRect();

  // Calculate popup position relative to page scroll
  let top = rect.bottom + window.scrollY + 5; // 5px below the item
  let left = rect.left + window.scrollX;

  // Optional: prevent popup from going off the right edge
  const popupWidth = 300;
  if (left + popupWidth > window.innerWidth) {
    left = window.innerWidth - popupWidth - 10;
  }

  this.popupPosition = { top, left };
  this.showPopup = true;
}

  closeJobDetails() {
   // this.showPopup = false;
  }
keepPopupOpen() {
  clearTimeout(this.hoverTimeout);
  //this.showPopup = true;
}



onMouseLeave() {
  this.hoverTimeout = setTimeout(() => {
   // this.showPopup = false;
  }, 200); // 200ms delay to allow smooth exit
}
showPopupItem(item: any) {
   this.popupItem = item;
   const parts = item.DATATEXTFIELD.split('|');
  this.filteredjobno = parts[0].split(':')[1] || '';
  this.filteredjobconsignee = parts[1].split(':')[1] || '';
  this.filteredjobshipper = parts[2].split(':')[1] || '';
  this.filteredjobinvno = parts[3].split(':')[1] || '';
  this.filteredjobpkgs = parts[4].split(':')[1] || '';
  this.filteredjobpcs = parts[5].split(':')[1] || '';
   const target = event.target as HTMLElement;
  const rect = target.getBoundingClientRect();

  // Calculate popup position relative to page scroll
  let top = rect.bottom + window.scrollY + 5; // 5px below the item
  let left = rect.right + window.scrollX;

  // Optional: prevent popup from going off the right edge
  const popupWidth = 300;
  if (left + popupWidth > window.innerWidth) {
    left = window.innerWidth - popupWidth - 300;
  }

  this.popupPosition = { top, left };
  this.showPopup = true;
}
hidePopup() {
  this.showPopup = false;
}

// // Utility to split the DATATEXTFIELD
// getPart(item: any, index: number): string {
//   if (!item || !item.DATATEXTFIELD) return '';
//   const parts = item.DATATEXTFIELD.split('|');
//   if (!parts[index]) return '';
//   const part = parts[index].split(':');
//   return part[1] ? part[1].trim() : '';
// }
onItemSelect() {
  this.showPopup = false;  // hide popup when an item is selected
}
  getCheckboxValuesold(event, data) {

    var index = this.newArray.findIndex(x => x.exptno == data);
    if (event) {
      let obj = {
        exptno: data
      }
      this.newArray.push(obj);
    }
    else {
      this.newArray.splice(index, 1);
    }
    console.log(this.newArray);
  }
  getCheckboxValues(event: boolean, selectedObj: any) {
  if (event) {
    // Uncheck all other rows in the UI
    this.joblist.forEach(row => {
      if (row.EXPTNO !== selectedObj.EXPTNO) {
        row.CHECKED = false;  // <-- this updates UI immediately
      }
    });

    // Clear previous selection and add new one
    this.newArray = [{ exptno: selectedObj.EXPTNO }];
  } else {
    // If unchecked, just clear newArray
    this.newArray = [];
  }

  console.log('Selected Rows:', this.newArray);
}

}