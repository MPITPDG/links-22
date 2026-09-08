import { Component, OnInit,  ViewChild } from '@angular/core';
import { DataService } from '../../shared/service/dataService';
import { AuthService } from '../../shared/service/authService';
import { Router} from '@angular/router';
import { ToasterService } from 'angular2-toaster';
import { LoginService } from '../../shared/service/loginService';
import { IMyDpOptions } from 'mydatepicker';
import { ToastCommonService } from '../../shared/service/toastService';
import { ContainerIUSharedDataService, VesselSearchSharedDataService} from '../export-share-data.service';
import { LoaderService } from '../../shared/service/loader.service';
import { TabsetComponent  } from 'ngx-bootstrap/tabs';
//import { CLPList, ContainerCLP  } from  'ngx-bootstrap/tabs';
@Component({
    selector: 'app-container-iu',
    templateUrl: 'exp_sp_container_IU.component.html'
})
export class ExptSpContainerIU implements OnInit {
  //  this._loginService.getLogin
    @ViewChild('containerTabs', {static: false}) containerTabs: TabsetComponent;

    private baseUrl: string = "";
    showLoader: boolean = false;

    vslrotation: any = "";
    vslport: any = "";
    vsldet: any = "";
    Vslagt: any = "";
    Vslshpgline: any = "";
    ContainerID: any = "0";
    Containerno: any = "";
    cntsize: any = "20";
    cntsize1: any = "F";
    contstatus: any = "LCL/FCL";
    destport: any = "";
    SteAgtSealno: any = "";
    hstuffed: any = "NO";
    stufwhere: any = "";
    stufwhere2: any = "";
    stufwhere3: any = "";
    stufcity: any = "";
    CustSealNo: any = "";
    freight: any = "PP";
    frtCurency: any = "";
    frtCurChargs: any = "";
    BAFCurency: any = "";
    BAFCurChargs: any = "";
    ThcName: any = "";
    ThcCurency: any = "";
    ThcCurChargs: any = "";
    otherName: any = "";
    OtherCurency: any = "";
    otherCurChargs: any = "";
    OCUR1: any = "";
    OCURRate1: any = "";
    OCUR2: any = "";
    OCURRate2: any = "";
    DCUR1: any = "";
    DCURRate1: any = "";
    DCUR2: any = "";
    DCURRate2: any = "";
    remark: any = "";
    LINERCONTRACT: any = "";
    BcarrierNo: any = "";
    Bcarrierdt: any = "";
    Movetype: any = "";

    containerlist: any = [];
    vslAgent: any = [];
    shpline: any = [];
    vslshpline: any = [];
    city: any = [];
    currency: any = [];

    freightEnable = true;
    freightRateEnable = false;
    buttonStatus = false;
    contract: string ="";
    

    //------------CLP

    containerClp: any = [];
    clpVessel: any = [];
    containerNoClp: any = [];
    clpstring: any = "";


    clpHeader: any = "";
    pkgs: any = "";
    pcs: any = "";
    cbm: any = "";
    grwt: any = "";
    netwt: any = "";
    ClpSeq: any = "";
    colurcode: any = "";
    contReq: any = "";
    verified: any = "";
    verifiedflg: any = "";
    CLP: any = "";
    ClpRotation: any = "";

    //NO OF PALLET

    p_vslrtno: any = "";
    p_etd: any = "";
    P_vslName: any = "";
    p_VoyNo: any = "";
    P_List: any = "";
    P_Containerno: any = "";
    p_header: any = "";
    cntrpkgs: any="0";
    cntrpkgss: any="0";
    cntrcbm: any="0";
    cntrpcs: any="0";
    cntrgrwt: any="0";
    cntrnetwt: any="0";
    constructor(
        private _router: Router,
        private _dataService: DataService,
        private _auth: AuthService,
        private _toasterService: ToastCommonService,
        private _loginService: LoginService,
        private _ContainerIUSharedDataService: ContainerIUSharedDataService,
        private _vslsharedvataSerice: VesselSearchSharedDataService,
        private _loaderService: LoaderService) {
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

    selectTab(tab_id: number) {
        this.containerTabs.tabs[tab_id].active = true;
        this._loaderService.display(false);
    }
    disableEnable_clp() {
        this.containerTabs.tabs[1].disabled = !this.containerTabs.tabs[1].disabled;
    }
    disableEnable_pallet() {
        this.containerTabs.tabs[2].disabled = !this.containerTabs.tabs[2].disabled;
    }
    ngOnInit(): void {
         
        if (this._vslsharedvataSerice.RtnosharedData == undefined || this._vslsharedvataSerice.RtnosharedData == null) {
            this._toasterService.toast('error', 'Error', "Please select Vessel Details first ");
            this.disableEnable_clp();
            this.disableEnable_pallet();
        }
        else {
            this._loaderService.display(true);
            this.baseUrl = 'Export/Export_container_filldropdown';
            const jsonExport = { vsl_rtno: this._vslsharedvataSerice.RtnosharedData, Port: this._vslsharedvataSerice.vslPortsharedData };
            this._dataService.Common(this.baseUrl, jsonExport)
                .subscribe((data: any) => {
                    if (data.Table[0].STATUS == 100) {
                        this.containerlist = data.Table;
                        this.vsldet = "VESSEL: " + this.containerlist[0].VSL_NAME + " - ROTATION: " + this.containerlist[0].VSL_RTNO + "  -  VOYAGE: " + this.containerlist[0].VSL_VOYNO + " -  ETD: " + this.containerlist[0].ETD;
                        this.vslrotation = this.containerlist[0].VSL_RTNO;
                        this.vslport = this.containerlist[0].PORT;
                      
                        this.vslAgent = data.Table1;
                        this.city = data.Table2;
                        this.currency = data.Table3;
                        this.shpline = data.Table4;
                        this.editmodeContainerfill();
                    }
                    else {                       
                        this._toasterService.toast('error', 'Error', data.Table[0].STATUSTEXT);                         
                        this._loaderService.display(false);
                    }
                });
            }
    }
    
    editmodeContainerfill() {
        if (this._ContainerIUSharedDataService.ContainerID !== undefined) {
            this.baseUrl = 'Export/Export_container_Populate';
            const jsonExport = { ContainerID: this._ContainerIUSharedDataService.ContainerID };
            this._dataService.Common(this.baseUrl, jsonExport)
                .subscribe((data: any) => {
                    if (data.Table[0].STATUS == 100) {
                        this.Vslagt = data.Table[0].EXPT_AGENT;
                        this.onfillshipline(this.Vslagt);
                        this.Vslshpgline = data.Table[0].SHPGLINE;
                        this.ContainerID = data.Table[0].ContainerID;
                        this.Containerno = data.Table[0].CONTAINERNO;
                        this.cntsize = data.Table[0].CONTAINERSIZE;
                        this.cntsize1 = data.Table[0].CONTAINERSIZE1
                        this.contstatus = data.Table[0].CONTAINERSTATUS;
                        this.destport = data.Table[0].DESTPORT;
                        this.SteAgtSealno = data.Table[0].AGTSEALNO;
                        this.hstuffed = data.Table[0].HSTUFFED;
                        this.stufwhere = data.Table[0].STUFFWHERE;
                        this.stufwhere2 = data.Table[0].STUFFWHERE1;
                        this.stufwhere3 = data.Table[0].STUFFWHERE2;
                        this.stufcity = data.Table[0].STUFFINGCITY;
                        this.CustSealNo = data.Table[0].CUSTSEALNO;
                        this.freight = data.Table[0].FREIGHT;
                        this.frtCurency = data.Table[0].FREIGHTCUR;
                        this.frtCurChargs = data.Table[0].FREIGHTUSD;
                        this.BAFCurency = data.Table[0].BAFCUR;
                        this.BAFCurChargs = data.Table[0].BAFUSD;
                        this.ThcName = data.Table[0].THCNAME;
                        this.ThcCurency = data.Table[0].THCCUR;
                        this.ThcCurChargs = data.Table[0].THCINR;
                        this.otherName = data.Table[0].OTHERNAME;
                        this.OtherCurency = data.Table[0].OTHERCUR;
                        this.otherCurChargs = data.Table[0].OTHERAMT;
                        this.OCUR1 = data.Table[0].OCUR1;
                        this.OCURRate1 = data.Table[0].OCURRATE1;
                        this.OCUR2 = data.Table[0].OCUR2;
                        this.OCURRate2 = data.Table[0].OCURRATE2;
                        this.DCUR1 = data.Table[0].DCUR1;
                        this.DCURRate1 = data.Table[0].DCURRATE1;
                        this.DCUR2 = data.Table[0].DCUR2;
                        this.DCURRate2 = data.Table[0].DCURRATE2;
                        this.remark = data.Table[0].REMARK;
                        this.Movetype=data.Table[0].MoveType;
                        this.contract=data.Table[0].TypeOfContract;
                        this.editmodeContainerCLPfill()
                    }
                });
        }
        else
        { this.disableEnable_clp();
          this._loaderService.display(false);}
    }

    editmodeContainerCLPfill() {
        if (this._ContainerIUSharedDataService.ContainerID !== undefined) {
            this.baseUrl = 'Export/Export_containerCLP_Populate';
            const jsonExportclp = { vsl_rtno: this._vslsharedvataSerice.RtnosharedData, Port: this._vslsharedvataSerice.vslPortsharedData, CONTAINERNO: this.Containerno, EXPT_AGENT: this.Vslagt, GUID: this._loginService.getLogin()[0].GUID ,cmpcode:  this._loginService.getLogin()[0].CMPCODE};
            this._dataService.Common(this.baseUrl, jsonExportclp)
                .subscribe((data: any) => {
                    if (data.Table[0].STATUS == 100) {
                        this.clpVessel = data.Table;
                        this.clpHeader = "VESSEL: " + this.clpVessel[0].VSL_NAME + " - ROTATION: " + this.clpVessel[0].VSL_RTNO + "  -  VOYAGE: " + this.clpVessel[0].VSL_VOYNO + " -  ETD: " + this.clpVessel[0].ETD;
                        this.ClpRotation = this.clpVessel[0].VSL_RTNO;
                        this.verified = this.clpVessel[0].VERIFIED
                        this.verifiedflg = this.clpVessel[0].VERIFIED_FLAG
                        this.containerClp = data.Table1;
                        var totpkgs =0;var totcbm =0;var totpcs =0; var totgrwt =0;var totnetwt =0;
                        for (let i=0;i<this.containerClp.length; i++){
                           this.cntrpkgs =this.containerClp[i].THIS_CONTAINER_NOOFPKGS;
                           this.cntrcbm =this.containerClp[i].THIS_CONTAINER_CBM;
                           this.cntrpcs =this.containerClp[i].THIS_CONTAINER_NO_OF_PCS;
                           this.cntrgrwt =this.containerClp[i].THIS_CONTAINER_NO_GR_WT;
                           this.cntrnetwt =this.containerClp[i].THIS_CONTAINER_NO_NET_WT;
                           if(parseFloat(this.cntrpkgs)>0){
                               totpkgs += parseFloat (this.cntrpkgs);
                           } if(parseFloat(this.cntrcbm)>0){
                               totcbm += parseFloat (this.cntrcbm);
                           } if(parseFloat(this.cntrpcs)>0){
                               totpcs += parseFloat (this.cntrpcs);
                           } if(parseFloat(this.cntrgrwt)>0){
                               totgrwt += parseFloat (this.cntrgrwt);
                           }  if(parseFloat(this.cntrnetwt)>0){
                               totnetwt += parseFloat (this.cntrnetwt);
                           }
                        }
                        this.pkgs = totpkgs;
                        this.cbm = totcbm;
                        this.pcs = totpcs;
                        this.grwt = totgrwt;
                        this.netwt = totnetwt;
                        this.containerNoClp = data.Table2;
                        if (this.verified == "Y") {
                            this.LoadPallet();
                          //  this.disableEnable_Tab3();
                             this.disableEnable_clp();                           
                        }                         
                        this._loaderService.display(false);
                    }
                    else {                       
                        this._toasterService.toast('error', 'Error', data.Table[0].STA_MSG);
                         this.disableEnable_clp();
                         this._loaderService.display(false);
                    }
                });
        }

    }
    LoadPallet()
    {
        this.baseUrl = 'Export/Export_containerCLP_Pallets';
        const jsonExportclp = { ContainerID: this._ContainerIUSharedDataService.ContainerID, ContainerNo: this.Containerno, vsl_rtno: this._vslsharedvataSerice.RtnosharedData, huhpnk:  this._loginService.getLogin()[0].CMP_USERENCCODE };
        this._dataService.Common(this.baseUrl, jsonExportclp)
            .subscribe((data: any) => {
                if (data.Table[0].STATUS == 100) {
                   
                    this.p_header = "VESSEL: " + data.Table1[0].VSL_NAME + " - ROTATION: " + data.Table1[0].VSL_RTNO + "  -  VOYAGE: " + data.Table1[0].VSL_VOYNO + " -  ETD: " + data.Table1[0].ETD;
                    this.p_vslrtno = data.Table1[0].VSL_RTNO;                    
                    this.P_List = data.Table2;
                   
                }
                
            });
    }

    onfillshipline(Agtcode) {
        this.vslshpline = this.shpline.filter((agent: any) => agent.VSL_AGENT === Agtcode);
    }
    radioonclick(lcontract) {
        this.LINERCONTRACT = lcontract;
        if (lcontract === "S")
        { this.freightRateEnable = true; }
        else
        { this.freightRateEnable = false }
    }
    onchangeFreight(frtVal) {
        if (frtVal == "CC") {
            this.freightEnable = false;
        }
        else {
            this.freightEnable = true;
        }

    }

    AddEditContainer() {
      
        if (this.vslAgent == undefined || this.vslAgent == null || this.vslAgent == "") {
            this._toasterService.toast('error', 'Error', "Please select Agent Name ");
            return false;
        }
        if (this.Vslshpgline == undefined || this.Vslshpgline == null || this.Vslshpgline == "") {
            this._toasterService.toast('error', 'Error', "Please select Shiping Line ");
            return false;
        }
        if (this.Containerno == undefined || this.Containerno == null || this.Containerno == "") {
            this._toasterService.toast('error', 'Error', "Container No. can not be blank");
            return false;
        }

        else if (this.Containerno.length < 11) {
            this._toasterService.toast('error', 'Error', "Container no. length should be 11 characters");
            return false;
        }
        if (this.contstatus == "LCL/LCL") {
            if (this.SteAgtSealno == undefined || this.SteAgtSealno == null || this.SteAgtSealno == "") {
                this._toasterService.toast('error', 'Error', "Steamer Agent Seal No Cannot Be Left Blank");
                return false;
            }
        }
        if (this.OCUR1 != "") {
            if (this.OCUR1 == this.OCUR2) {
                this._toasterService.toast('error', 'Error', "Both currency can not be same");
                return false;
            }
        }
        if (this.DCUR1 != "") {
            if (this.DCUR1 == this.DCUR2) {
                this._toasterService.toast('error', 'Error', "Both currency can not be same");
                return false;
            }
        }
        if (this.contract=="")
        {
            this._toasterService.toast('error', 'Error', "Please select type of contract");
            return false;
        }
        var Bcarrierdt
        if (this.Bcarrierdt == "") { Bcarrierdt = "" } else { Bcarrierdt = this.Bcarrierdt.formatted; }
        // if (  this.SteAgtSealno==""){
        //     this._toasterService.toast('error', 'Error', "Steamer Agent Seal No. cannot blank");
        //     return false;
        // }
        this._loaderService.display(true);  
        const jsonExport = {
            ContainerID: this.ContainerID, vsl_rtno: this.vslrotation, EXPT_AGENT: this.Vslagt, CONTAINERNO: this.Containerno, CONTAINERSIZE: this.cntsize, CONTAINERSIZE1: this.cntsize1, CONTAINERSTATUS: this.contstatus, DESTPORT: this.destport, AGTSEALNO: this.SteAgtSealno, HSTUFFED: this.hstuffed, STUFFWHERE: this.stufwhere, CUSTSEALNO: this.CustSealNo, FREIGHTUSD: this.frtCurChargs, BAFUSD: this.BAFCurChargs, STUFFWHERE1: this.stufwhere2, STUFFWHERE2: this.stufwhere3, STUFFINGCITY: this.stufcity, REMARK: this.remark, FREIGHT: this.freight, LINERCONTRACT: this.LINERCONTRACT, THCINR: this.ThcCurChargs, OCUR1: this.OCUR1, OCURRATE1: this.OCURRate1, OCUR2: this.OCUR2, OCURRATE2: this.OCURRate2, DCUR1: this.DCUR1, DCURRATE1: this.DCURRate1, DCUR2: this.DCUR2, DCURRATE2: this.DCURRate2, FREIGHTCUR: this.frtCurency, BAFCUR: this.BAFCurency, THCNAME: this.ThcName, THCCUR: this.ThcCurency, OTHERNAME: this.otherName, OTHERCUR: this.OtherCurency, OTHERAMT: this.otherCurChargs, SHPGLINE: this.Vslshpgline, Port: this.vslport, MOVETYPE: this.Movetype, BCARRIERNO: this.BcarrierNo, BCARRIERDT: Bcarrierdt, cmpid: this._loginService.getLogin()[0].CMPID, CITYCODE:this._loginService.getLogin()[0].CITYCODE , cmpcode: this._loginService.getLogin()[0].CMPCODE,contract:this.contract
        };
        this._dataService.Common("Export/Export_container_IU", jsonExport)
            .subscribe((data: any) => {
                if (data.Table[0].STATUS == "100") {
                    this._toasterService.toast('info', 'Complete', data.Table[0].STATUSTEXT);
                    this.buttonStatus = false;
                    this._vslsharedvataSerice.RtnosharedData = this.vslrotation;
                    this._vslsharedvataSerice.vslPortsharedData = this.vslport;
                    this.ContainerID=data.Table[0].CONTAINERID
                    this.editmodeContainerCLPfill();
                    this.selectTab(1);
                    //this.loaderService.display(false);
                }
                else {

                    this._toasterService.toast('error', 'Error', data.Table[0].STATUSTEXT);
                    this.buttonStatus = false;
                    this._loaderService.display(false);
                }
            });
    }
    // Check duplicate value in an array 
    checkDuplicateInObject(propertyName, inputArray) {
        var seenDuplicate = false,
            testObject = {};

        inputArray.map(function (item) {
            var itemPropertyName = item[propertyName];
            if (itemPropertyName== null) { }
            else {
                if (itemPropertyName in testObject) {
                    testObject[itemPropertyName].duplicate = true;
                    item.duplicate = true;
                    seenDuplicate = true;
                }
                else {
                    testObject[itemPropertyName] = item;
                    delete item.duplicate;
                }
            }
        });

        return seenDuplicate;
    }


    addContainerCLP() {
        let count=0;
        if (this.checkDuplicateInObject("THIS_CONTAINER_NO_CLP_SEQ", this.containerClp) == false) {
            this.clpstring = "";
           
            for (let i = 0;i<= this.containerClp.length-1; i++) {
                this.CLP = this.containerClp[i].THIS_CONTAINER_NO_CLP_SEQ;
                if (this.CLP == undefined || this.CLP == null || this.CLP == "") { }
                else {
                    if (this.CLP.length < 2) {
                        count=1;
                        this._toasterService.toast('warning', 'warning', "CLP should be 2 digit no start from 01");                        
                        break;                     
                        
                    }
                    if (this.containerClp[i].THIS_CONTAINER_NOOFPKGS == undefined || this.containerClp[i].THIS_CONTAINER_NOOFPKGS == null || this.containerClp[i].THIS_CONTAINER_NOOFPKGS == "") {
                        count=1;
                        this._toasterService.toast('warning', 'warning', "No of Pkgs can`t be blank");                         
                        break;                        
                    }
                    if (this.containerClp[i].THIS_CONTAINER_CBM == undefined || this.containerClp[i].THIS_CONTAINER_CBM == null || this.containerClp[i].THIS_CONTAINER_CBM == "") {
                        count=1;
                        this._toasterService.toast('warning', 'warning', "CBM can`t be blank");                        
                        break;                        
                    }
                    if (this.containerClp[i].THIS_CONTAINER_NO_OF_PCS == undefined || this.containerClp[i].THIS_CONTAINER_NO_OF_PCS == null || this.containerClp[i].THIS_CONTAINER_NO_OF_PCS == "") {
                        count=1;
                        this._toasterService.toast('warning', 'warning', "No of Pcs  can`t be blank");                      
                        break;                        
                    }
                    if (this.containerClp[i].THIS_CONTAINER_NO_GR_WT == undefined || this.containerClp[i].THIS_CONTAINER_NO_GR_WT == null || this.containerClp[i].THIS_CONTAINER_NO_GR_WT == "") {
                        count=1;
                        this._toasterService.toast('warning', 'warning', "GrWt can`t be blank");                      
                        break;                       
                    }
                    if (this.containerClp[i].THIS_CONTAINER_NO_NET_WT == undefined || this.containerClp[i].THIS_CONTAINER_NO_NET_WT == null || this.containerClp[i].THIS_CONTAINER_NO_NET_WT == "") {
                        count=1;
                        this._toasterService.toast('warning', 'warning', "NetWt can`t be blank");                       
                        break;                         
                    }
                    if (parseFloat(this.containerClp[i].THIS_CONTAINER_NOOFPKGS) > parseFloat(this.containerClp[i].AVAILABLE_NOOFPKGS)) {
                        count=1;
                        this._toasterService.toast('warning', 'warning', "No of packages should be less than or equal to available no of pkgs");                      
                        break;                         
                    }
                    if (parseFloat(this.containerClp[i].THIS_CONTAINER_CBM) > parseFloat(this.containerClp[i].AVAILABLE_CBM )) {
                        count=1;
                        this._toasterService.toast('warning', 'warning', "CBM should be less than or equal to available CBM");                     
                        break;                         
                    }
                    if (parseFloat(this.containerClp[i].THIS_CONTAINER_NO_OF_PCS) > parseFloat(this.containerClp[i].AVAILABLE_NO_OF_PCS) ) {
                        count=1;
                        this._toasterService.toast('warning', 'warning', "No of Pcs should be less than or equal to available Pcs");                       
                        break;                        
                    }
                    if (parseFloat(this.containerClp[i].THIS_CONTAINER_NO_GR_WT) > parseFloat(this.containerClp[i].AVAILABLE_NO_GR_WT )) {
                        count=1;
                        this._toasterService.toast('warning', 'warning', "GrWt should be less than or equal to available GrWt");                       
                        break;                        
                    }
                    if (parseFloat(this.containerClp[i].THIS_CONTAINER_NO_NET_WT) > parseFloat(this.containerClp[i].AVAILABLE_NO_NET_WT) ) {
                        count=1;
                        this._toasterService.toast('warning', 'warning', "NetWt should be less than or equal to available NetWt");                        
                        break;                        
                    }
                    this.clpstring = this.clpstring + this.containerClp[i].EXPTNO + "," + this.containerClp[i].THIS_CONTAINER_NOOFPKGS + "," + this.containerClp[i].THIS_CONTAINER_CBM + "," + this.containerClp[i].THIS_CONTAINER_NO_OF_PCS + "," + this.containerClp[i].THIS_CONTAINER_NO_GR_WT + "," + this.containerClp[i].THIS_CONTAINER_NO_NET_WT + "," + this.containerClp[i].THIS_CONTAINER_NO_CLP_SEQ + "," + this.containerClp[i].COLOUR_CODE + "," + this.containerClp[i].CONTAINER_NO + ";";
                }

            }
            if (this.clpstring=="")           
            {   count=1;
                this._toasterService.toast('warning', 'warning', "Please enter at least one CLP");
                return false;
            }
            if (count==0){
                this._loaderService.display(true);
                this.baseUrl = 'Export/Export_containerCLP_IU';
                    const jsonExport = {
                        ContainerNo: this.Containerno, vsl_rtno: this.ClpRotation, cmpid:this._loginService.getLogin()[0].CMPID, ContVerified: this.verified, CITYCODE:this._loginService.getLogin()[0].CITYCODE, clpString: this.clpstring, CMPCODE:this._loginService.getLogin()[0].CMPCODE
                    };
                    this._dataService.Common(this.baseUrl, jsonExport)
                        .subscribe((data: any) => {

                            if (data.Table[0].STATUS == "100") {
                                this._toasterService.toast('info', 'Complete', data.Table[0].STATUSTEXT);
                                this.buttonStatus = false;

                                this._vslsharedvataSerice.RtnosharedData = this.vslrotation;
                                this._vslsharedvataSerice.vslPortsharedData = this.vslport;
                                this._loaderService.display(false);
                                this.editmodeContainerCLPfill()
                                this.selectTab(1)
                            }
                            else {

                                this._toasterService.toast('error', 'Error', data.Table[0].STATUSTEXT);
                                this.buttonStatus = false;
                            }
                        }); 
                    }
                }
        else
        {
            this._toasterService.toast('error', 'Error', "CLP should be unique ");
            return false;
        }
        
        this.buttonStatus = false;
        }

  
    
    AddPallets()
    {
        this.baseUrl = 'Export/Export_containerCLP_Pallets_IU';
        const jsonExport = [];
        for (let i = 0; i < this.P_List.length; i++) {
            jsonExport.push({
                id: this.P_List[i].ID, ContainerID: this._ContainerIUSharedDataService.ContainerID, ContainerNo: this.Containerno, vsl_rtno: this.p_vslrtno, CON_CODE: this.P_List[i].ID, EXPT_CONSIGNEE: this.P_List[i].NO_OF_PALLETS, huhpnk:this._loginService.getLogin()[0].CMP_USERENCCODE
            });
        }
         
        this._dataService.Common(this.baseUrl, jsonExport)
            .subscribe((data: any) => {

                if (data.Table[0].STATUS == "100") {
                    this._toasterService.toast('info', 'Complete', data.Table[0].STATUSTEXT);
                    this.buttonStatus = false;

                    this._vslsharedvataSerice.RtnosharedData = this.vslrotation;
                    this._vslsharedvataSerice.vslPortsharedData = this.vslport;

                    this.editmodeContainerCLPfill()
                    this.selectTab(1)
                }
                else {

                    this._toasterService.toast('error', 'Error', data.Table[0].STATUSTEXT);
                    this.buttonStatus = false;
                }
            });
        this.buttonStatus = false;
    }
    ResetAll() {
        this.Vslagt = ""
        this.Vslshpgline = "";
        this.ContainerID = "0";
        this.Containerno = "";
        this.cntsize = "";
        this.cntsize1 = "";
        this.contstatus = "LCL/FCL";
        this.destport = "";
        this.SteAgtSealno = "";
        this.hstuffed = "NO";
        this.stufwhere = "";
        this.stufwhere2 = "";
        this.stufwhere3 = "";
        this.stufcity = "";
        this.CustSealNo = "";
        this.freight = "PP";
        this.frtCurency = "";
        this.frtCurChargs = "";
        this.BAFCurency = "";
        this.BAFCurChargs = "";
        this.ThcName = "";
        this.ThcCurency = "";
        this.ThcCurChargs = "";
        this.otherName = "";
        this.OtherCurency = "";
        this.otherCurChargs = "";
        this.OCUR1 = "";
        this.OCURRate1 = "";
        this.OCUR2 = "";
        this.OCURRate2 = "";
        this.DCUR1 = "";
        this.DCURRate1 = "";
        this.DCUR2 = "";
        this.DCURRate2 = "";
        this.remark = "";
        this.BcarrierNo = "";
        this.Bcarrierdt = "";
        this.Movetype = "";
    }
    back()
    { 
        this._vslsharedvataSerice.RtnosharedData   =this._vslsharedvataSerice.RtnosharedData ;
        this._vslsharedvataSerice.vslPortsharedData=this._vslsharedvataSerice.vslPortsharedData;
        this._router.navigate(['/export/container/container-vessel-view']);
        this._ContainerIUSharedDataService.ContainerID  == null;
    }
    selectionChange(cntrval: any){
        // this.pkgs =0;
        // this.cbm =0;
        // this.pcs=0;
        // this.grwt=0;
        // this.netwt=0;
        var totpkgs =0;

         for (let i=0;i<this.containerClp.length; i++){

            this.cntrpkgs =this.containerClp[i][cntrval];

            if(parseFloat(this.cntrpkgs)>0){
                totpkgs += parseFloat (this.cntrpkgs);
            }
         }
         if (cntrval=='THIS_CONTAINER_NOOFPKGS'){
            this.pkgs = totpkgs;
         }else if (cntrval=='THIS_CONTAINER_CBM'){
            this.cbm = totpkgs;
         }else if (cntrval=='THIS_CONTAINER_NO_OF_PCS'){
            this.pcs = totpkgs;
         }else if (cntrval=='THIS_CONTAINER_NO_GR_WT'){
            this.grwt = totpkgs;
         }else if (cntrval=='THIS_CONTAINER_NO_NET_WT'){
            this.netwt = totpkgs;
         }

    }
    
}
 