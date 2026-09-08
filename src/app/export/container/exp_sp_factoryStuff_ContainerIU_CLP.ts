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
import { ThemeService } from 'ng2-charts';
import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';
@Component({
    selector: 'app-containerFS-iu',
    templateUrl: 'exp_sp_factoryStuff_ContainerIU_CLP.html'
})
export class ExptSpContainerIUFS implements OnInit {
    Add:string="Add";
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
    CustSealNo: any = "";
    freight: any = "PP";
    containerClp : any=[];
    vessel :any=[];
    vslName :string="";
    vsl_voyno :string="";
    vslAgent: any = [];
    shpline: any = [];
    vslshpline: any = [];
    Vsl :string;
    containerlist: any =[];
    containerClpedt :any[];
    Movetype :string="";
    city:any=[];
    ExptNoList : any[];
    VSLExptNoList : any[];
    THIS_CONTAINER_NO :string;
    exptno :string;
    TOTAL_NOOFPKGS :string;
    TOTAL_CBM :string;
    TOTAL_NO_OF_PCS :any = "";
    TOTAL_NO_GR_WT :any = "";
    TOTAL_NO_NET_WT :any = "";
    THIS_CONTAINER_NOOFPKGS :any = "";
    THIS_CONTAINER_CBM :any = "";
    THIS_CONTAINER_NO_OF_PCS :any = "";
    THIS_CONTAINER_NO_GR_WT :any = "";
    THIS_CONTAINER_NO_NET_WT :any = "";
    THIS_CONTAINER_NO_CLP_SEQ :any = "";

    AVAILABLE_NOOFPKGS :any = "";
    AVAILABLE_CBM :any = "";
    AVAILABLE_NO_OF_PCS :any = "";
    AVAILABLE_NO_GR_WT :any = "";
    AVAILABLE_NO_NET_WT:any = "";
    id :string="0";
    containerid: string="0";

    constructor(
        private _router: Router,
        private _dataService: DataService,
        private _auth: AuthService,
        private _toasterService: ToastCommonService,
        private _loginService: LoginService,
        private _ContainerIUSharedDataService: ContainerIUSharedDataService,
        private _vslsharedvataSerice: VesselSearchSharedDataService,
        private loaderService: LoaderService) {
    }

    public myDatePickerOptions: IMyDpOptions = {
        dateFormat: 'dd/mm/yyyy',
        inline: false,
        height: '16px',
        width: '120px',
        componentDisabled:  false,
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

    ngOnInit(): void {
        this.loaderService.display(true);  
        this._loginService.verifyRights(231, '')
        .subscribe((data: any) => { this._loginService.checkVerify('Add', data); });

        const jsonPage = { userid:this._loginService.getLogin()[0].CMPID };
        this._dataService.getData("Export/ContainerFS_PAGELOAD", jsonPage)
            .subscribe((data: any) => {
                if (data.Table[0].STATUS == "100") {

                }
            });
        const jsonExport = { SEARCHMODE:"0", VSLNAME: this.vslName, VSL_VOY: this.vsl_voyno, CITYCODE:this._loginService.getLogin()[0].CITYCODE };
        this._dataService.Common("Export/Export_Vessel_List", jsonExport)
            .subscribe((data: any) => {
                if (data.Table[0].STATUS == 100) {
                    this.vessel = data.Table1;
                    this.loaderService.display(false);      
                }
                else {
                    
                    this._toasterService.toast('Warning', 'Warning', 'Data Loaded Successfully');
                    this.loaderService.display(false);      
                }
            });
    }
    onfillAgent(vsldt)
    {
        if (vsldt !="")
        {

        
        let rtnos="",ports=""
        rtnos=vsldt.split('|')[0];
        ports=vsldt.split('|')[1];
        if(this.vslAgent.length >0 )
        {
            if (confirm("Are you sure ,Do you want to change the vessel ,While changing the vessel current data will be lost" )) {
                this.containerClp=[];
            }
            else {return false ;}
        }
        this.loaderService.display(true);  
        const jsonExport = { vsl: rtnos, port: ports ,CMPCOD:this._loginService.getLogin()[0].CMPCODE,CITYCODE:this._loginService.getLogin()[0].CITYCODE,CMPID:this._loginService.getLogin()[0].CMPID};
            this._dataService.getData('Export/ContainerFS_Fill', jsonExport)
                .subscribe((data: any) => {
                    if (data.Table[0].STATUS == 100) {
                        this.containerlist = data.Table;
                     //  this.vsldet = "VESSEL: " + this.containerlist[0].VSL_NAME + " - ROTATION: " + this.containerlist[0].VSL_RTNO + "  -  VOYAGE: " + this.containerlist[0].VSL_VOYNO + " -  ETD: " + this.containerlist[0].ETD;
                        this.vslrotation = this.containerlist[0].VSL_RTNO;
                        this.vslport = this.containerlist[0].PORT;
                      
                        this.vslAgent = data.Table1;
                        this.city = data.Table2;                    
                        this.shpline = data.Table3;
                        this.VSLExptNoList=data.Table4;
                      
                        this.loaderService.display(false);  
                    }
            });
        }
        else
        {
            this.childreset();
            this.masterReset();
            this.containerClp=[];
        }

    }

    OnChangeExjob(exjobno)    
    {
        if(exjobno !="")
        {
        this.loaderService.display(true);  
        const jsonExport = { exptno: exjobno, userid: this._loginService.getLogin()[0].CMPID };
        this._dataService.getData('Export/ContainerFS_FillExptno', jsonExport)
            .subscribe((data: any) => {
                if(data.Table[0].AVAI_PKGS ==0)
                {
                    this._toasterService.toast('warning', 'warning', "Total Pkgs is used ");
                    this.loaderService.display(false);  
                    return false;
                }
                else{
               this.TOTAL_NOOFPKGS=data.Table[0].PKGS;
               this.TOTAL_CBM=data.Table[0].CBM;
               this.TOTAL_NO_OF_PCS=data.Table[0].PCS;
               this.TOTAL_NO_GR_WT=data.Table[0].GRWT;
               this.TOTAL_NO_NET_WT=data.Table[0].NETWT;

               this.THIS_CONTAINER_NOOFPKGS=data.Table[0].AVAI_PKGS;
               this.THIS_CONTAINER_CBM=data.Table[0].AVAI_CBM;
               this.THIS_CONTAINER_NO_OF_PCS=data.Table[0].AVAI_PCS;
               this.THIS_CONTAINER_NO_GR_WT=data.Table[0].AVAI_GRWT;
               this.THIS_CONTAINER_NO_NET_WT=data.Table[0].AVAI_NETWT;

               this.AVAILABLE_NOOFPKGS =  data.Table[0].AVAI_PKGS;
               this.AVAILABLE_CBM= data.Table[0].AVAI_CBM;
               this.AVAILABLE_NO_OF_PCS = data.Table[0].AVAI_PCS;
               this.AVAILABLE_NO_GR_WT= data.Table[0].AVAI_GRWT;
               this.AVAILABLE_NO_NET_WT=data.Table[0].AVAI_NETWT;
                }
               this.loaderService.display(false);  

            });
        }
        else{
            this.childreset();
        }
    }

    onfillshipline(Agtcode) {
        if(Agtcode !="")
        {
        this.vslshpline = this.shpline.filter((agent: any) => agent.VSL_AGENT === Agtcode);
        this.ExptNoList = this.VSLExptNoList.filter((agent: any) => agent.EXPT_VSLAGENT === Agtcode);

        this.AVAILABLE_NOOFPKGS =  this.ExptNoList[0].AVAI_PKGS;
        this.AVAILABLE_CBM= this.ExptNoList[0].AVAI_CBM;
        this.AVAILABLE_NO_OF_PCS = this.ExptNoList[0].AVAI_PCS;
        this.AVAILABLE_NO_GR_WT= this.ExptNoList[0].AVAI_GRWT;
        this.AVAILABLE_NO_NET_WT=this.ExptNoList[0].AVAI_NETWT;
        }
    }
    AddChild()
    {
        if (this.vessel == undefined || this.vessel == null || this.vessel == "") {
            this._toasterService.toast('error', 'Error', "Please select Vessel ");
            return false;
        }
        if (this.Vslagt == undefined || this.Vslagt == null || this.Vslagt == "") {
            this._toasterService.toast('error', 'Error', "Please select Agent Name ");
            return false;
        }
        if (this.THIS_CONTAINER_NO == undefined ||   this.THIS_CONTAINER_NO == "") {
            this._toasterService.toast('error', 'Error', "Please enter Container No. ");
            return false;
        }
        if (this.THIS_CONTAINER_NO.length < 11) {
            this._toasterService.toast('error', 'Error', "Container no. length should be 11 characters");
            return false;
        }
        if (this.cntsize == undefined ||   this.cntsize == "") {
            this._toasterService.toast('error', 'Error', "Please enter Container Size. ");
            return false;
        }
        if (this.cntsize1 == undefined ||   this.cntsize1 == "") {
            this._toasterService.toast('error', 'Error', "Please enter Container Size. ");
            return false;
        }
        if (this.destport == undefined ||  this.destport == "") {
            this._toasterService.toast('error', 'Error', "Please select Destination POrt ");
            return false;
        }
        if (this.Movetype == undefined || this.Movetype == "") {
            this._toasterService.toast('error', 'Error', "Please select Move Type");
            return false;
        } 
        if (this.SteAgtSealno == "") {
            this._toasterService.toast('error', 'Error', "Please enter Steamer agent No");
            return false;
        }
        if (this.CustSealNo == "") {
            this._toasterService.toast('error', 'Error', "Please enter Custome Seal No.");
            return false;
        }
        if (this.exptno == undefined ||   this.exptno == "") {
            this._toasterService.toast('error', 'Error', "Please select Ex-Job No. ");
            return false;
        }
        if (this.THIS_CONTAINER_NO_CLP_SEQ == undefined || this.THIS_CONTAINER_NO_CLP_SEQ == null || this.THIS_CONTAINER_NO_CLP_SEQ == "") { }
        else {   if (this.THIS_CONTAINER_NO_CLP_SEQ.length < 2) {       
                this._toasterService.toast('warning', 'warning', "CLP should be 2 digit no start from 01");                        
                return false;                 
                
            }
        }

    
        if (this.THIS_CONTAINER_NOOFPKGS == undefined || this.THIS_CONTAINER_NOOFPKGS == null || this.THIS_CONTAINER_NOOFPKGS == "") {     
            this._toasterService.toast('warning', 'warning', "No of Pkgs can`t be blank");                         
            return false;                       
        }
        if (this.THIS_CONTAINER_CBM == undefined || this.THIS_CONTAINER_CBM == null || this.THIS_CONTAINER_CBM == "") {       
            this._toasterService.toast('warning', 'warning', "CBM can`t be blank");                        
            return false;                       
        }
        if (this.THIS_CONTAINER_NO_OF_PCS == undefined || this.THIS_CONTAINER_NO_OF_PCS == null || this.THIS_CONTAINER_NO_OF_PCS == "") {     
            this._toasterService.toast('warning', 'warning', "No of Pcs  can`t be blank");                      
            return false;                       
        }
        if (this.THIS_CONTAINER_NO_GR_WT == undefined || this.THIS_CONTAINER_NO_GR_WT == null || this.THIS_CONTAINER_NO_GR_WT == "") {       
            this._toasterService.toast('warning', 'warning', "GrWt can`t be blank");                      
            return false;                       
        }
        if (this.THIS_CONTAINER_NO_NET_WT == undefined || this.THIS_CONTAINER_NO_NET_WT == null || this.THIS_CONTAINER_NO_NET_WT == "") {
            this._toasterService.toast('warning', 'warning', "NetWt can`t be blank");                       
            return false;                        
        }
        if (parseFloat(this.THIS_CONTAINER_NOOFPKGS) > parseFloat(this.AVAILABLE_NOOFPKGS)) {
            this._toasterService.toast('warning', 'warning', "No of packages should be less than or equal to available no of pkgs");                      
            return false;                       
        }
        if (parseFloat(this.THIS_CONTAINER_CBM) > parseFloat(this.AVAILABLE_CBM )) {
            this._toasterService.toast('warning', 'warning', "CBM should be less than or equal to available CBM");                     
            return false;                         
        }
        if (parseFloat(this.THIS_CONTAINER_NO_OF_PCS) > parseFloat(this.AVAILABLE_NO_OF_PCS) ) {
        this._toasterService.toast('warning', 'warning', "No of Pcs should be less than or equal to available Pcs");                       
            return false;                        
        }
        if (parseFloat(this.THIS_CONTAINER_NO_GR_WT) > parseFloat(this.AVAILABLE_NO_GR_WT )) {
        this._toasterService.toast('warning', 'warning', "GrWt should be less than or equal to available GrWt");                       
            return false;                     
        }
        if (parseFloat(this.THIS_CONTAINER_NO_NET_WT) > parseFloat(this.AVAILABLE_NO_NET_WT) ) {
            this._toasterService.toast('warning', 'warning', "NetWt should be less than or equal to available NetWt");                        
            return false;                        
        }

        this.loaderService.display(true);    //ID,CONTAINERID
        const jsonExport = {
            ID:this.id , CONTAINERID:this.containerid, CONTAINERNO: this.THIS_CONTAINER_NO, CONTSIZE: this.cntsize,CONTSIZE1:this.cntsize1,EXPTNO:this.exptno,PKGS:this.THIS_CONTAINER_NOOFPKGS,CBM:this.THIS_CONTAINER_CBM,Pcs:this.THIS_CONTAINER_NO_OF_PCS,GrWt:this.THIS_CONTAINER_NO_GR_WT,NetWt:this.THIS_CONTAINER_NO_NET_WT,CLP_SEQ:this.THIS_CONTAINER_NO_CLP_SEQ, USERID:this._loginService.getLogin()[0].CMPID,  VGUID: this._loginService.getLogin()[0].GUID,CONTSTATUS:this.contstatus,DESTPORT:this.destport,MOVETYPE:this.Movetype,STEAM_AGENTNO:this.SteAgtSealno,CUSTOM_AGENTNO:this.CustSealNo,FREIGHT :this.freight
        };
        this._dataService.Common('Export/Export_containerFSTmp_IU', jsonExport)
        .subscribe((data: any) => {

            if (data.Table[0].STATUS == "100") {
                this._toasterService.toast('info', 'Success', data.Table[0].STATUSTEXT);
                this.containerClp=data.Table;
                this.childreset();
                this.loaderService.display(false);                        
            }
            else {
                this._toasterService.toast('error', 'Error', data.Table[0].STATUSTEXT);
                this.loaderService.display(false);
            }
        }); 
    
    }
    EditchildExptNo(Id)
    {   this.Add="Update";
        this.containerClpedt = this.containerClp.filter((pkid: any) => pkid.ID === Id);
        this.id=this.containerClpedt[0].ID;
        this.containerid= this.containerClpedt[0].CONTAINERID;
        this.THIS_CONTAINER_NO=this.containerClpedt[0].CONTAINERNO;
        this.cntsize=  this.containerClpedt[0].CONT_SIZE ;
        this.cntsize1=  this.containerClpedt[0].CONT_SIZE1;
        this.exptno=  this.containerClpedt[0].EXPTNO ;

        this.TOTAL_NOOFPKGS=  this.containerClpedt[0].TOTAL_NOOFPKGS ;
        this.TOTAL_CBM=  this.containerClpedt[0].TOTAL_CBM ;
        this.TOTAL_NO_OF_PCS=  this.containerClpedt[0].TOTAL_NO_OF_PCS ;
        this.TOTAL_NO_GR_WT=  this.containerClpedt[0].TOTAL_NO_GR_WT ;
        this.TOTAL_NO_NET_WT=  this.containerClpedt[0].TOTAL_NO_NET_WT ;

        this.THIS_CONTAINER_NOOFPKGS=  this.containerClpedt[0].PKGS ;
        this.THIS_CONTAINER_CBM=  this.containerClpedt[0].CBM ;
        this.THIS_CONTAINER_NO_OF_PCS=  this.containerClpedt[0].PCS ;
        this.THIS_CONTAINER_NO_GR_WT=  this.containerClpedt[0].GRWT;
        this.THIS_CONTAINER_NO_NET_WT=  this.containerClpedt[0].NETWT ;
        this.THIS_CONTAINER_NO_CLP_SEQ=  this.containerClpedt[0].CLP_SEQ ;

         this.contstatus=  this.containerClpedt[0].CONTAINERSTATUS ;
         this.destport=  this.containerClpedt[0].DESTPORT ;
         this.Movetype=  this.containerClpedt[0].MOVETYPE ;
         this.SteAgtSealno=  this.containerClpedt[0].AGTSEALNO ;
         this.CustSealNo=  this.containerClpedt[0].CUSTSEALNO ;
         this.freight=  this.containerClpedt[0].FREIGHT ;

        this.AVAILABLE_NOOFPKGS =parseFloat(this.containerClpedt[0].AVAI_PKGS) +parseFloat(this.THIS_CONTAINER_NOOFPKGS) ;
        this.AVAILABLE_CBM= parseFloat(this.containerClpedt[0].AVAI_CBM) +parseFloat(this.THIS_CONTAINER_CBM);
        this.AVAILABLE_NO_OF_PCS = parseFloat(this.containerClpedt[0].AVAI_PCS) +parseFloat(this.THIS_CONTAINER_NO_OF_PCS);
        this.AVAILABLE_NO_GR_WT= parseFloat(this.containerClpedt[0].AVAI_GRWT) +parseFloat(this.THIS_CONTAINER_NO_GR_WT);
        this.AVAILABLE_NO_NET_WT=parseFloat(this.containerClpedt[0].AVAI_NETWT) +parseFloat(this.THIS_CONTAINER_NO_NET_WT);

    }

    deletechildExptNo(ID,contid)
    {
     if (contid==0)
     {     
        this.loaderService.display(true);   
        const jsondelete = { ID:ID,userid:this._loginService.getLogin()[0].CMPID,vguid:this._loginService.getLogin()[0].GUID};
        this._dataService.getData("Export/ContainerFS_DELETE", jsondelete)
            .subscribe((data: any) => {
                if (data.Table[0].STATUS == "100") {
                    this._toasterService.toast('info', 'Success', data.Table[0].STATUSTEXT);
                    this.containerClp=data.Table;
                   
                    this.loaderService.display(false);   
                }
            });
        }
        else{
            this._toasterService.toast('info', 'info', "This container is already containerized please contact administrator !");
        }
    }
 childreset()
 {
    this.Add="Add"
    this.id="0";
    this.containerid="0";
    this.THIS_CONTAINER_NO="";
    this.cntsize= "20"  ;
    this.cntsize1= "F";
    this.exptno="" ;
    this.TOTAL_NOOFPKGS=  "" ;
    this.TOTAL_CBM=  "";
    this.TOTAL_NO_OF_PCS= "";
    this.TOTAL_NO_GR_WT=  "" ;
    this.TOTAL_NO_NET_WT= "" ;
    this.THIS_CONTAINER_NOOFPKGS=  "" ;
    this.THIS_CONTAINER_CBM="";
    this.THIS_CONTAINER_NO_OF_PCS=  "" ;
    this.THIS_CONTAINER_NO_GR_WT="";
    this.THIS_CONTAINER_NO_NET_WT=   "" ;
    this.THIS_CONTAINER_NO_CLP_SEQ=  "";
    this.AVAILABLE_NOOFPKGS =0 ;
    this.AVAILABLE_CBM= 0;
    this.AVAILABLE_NO_OF_PCS = 0;
    this.AVAILABLE_NO_GR_WT= 0;
    this.AVAILABLE_NO_NET_WT=0;
    this.contstatus="LCL/FCL";
    this.Movetype="";
    this.destport=""
    this.SteAgtSealno="";
    this.CustSealNo="";
    this.freight="PP";

 }
    finalSubmit()
    {
        if (this.Vsl == undefined || this.Vsl == "") {
            this._toasterService.toast('error', 'Error', "Please select Vessel ");
            return false;
        }
        if (this.Vslagt == undefined || this.Vslagt == "") {
            this._toasterService.toast('error', 'Error', "Please select Agent Name ");
            return false;
        }
        if (this.Vslshpgline == undefined || this.Vslshpgline == "") {
            this._toasterService.toast('error', 'Error', "Please select shipping Line ");
            return false;
        }
       
        let rtnos="",ports=""
        rtnos=this.Vsl.split('|')[0];
        ports=this.Vsl.split('|')[1];
        this.loaderService.display(true);    
        const jsonExport = {
            VSL_RTNO: rtnos, VSL_PORT: ports,VSL_AGNT:this.Vslagt,VSL_SHIPLINE:this.Vslshpgline, USERID:this._loginService.getLogin()[0].CMPID,  VGUID: this._loginService.getLogin()[0].GUID
        };
        this._dataService.Common('Export/Export_containerFS_IU', jsonExport)
        .subscribe((data: any) => {

            if (data.Table[0].STATUS == "100") {
                this._toasterService.toast('info', 'Success', data.Table[0].STATUSTEXT);    
                this.masterReset();     
                        
                this.loaderService.display(false);                        
            }
            else {
                this._toasterService.toast('error', 'Error', data.Table[0].STATUSTEXT);
                this.loaderService.display(false);
            }
        }); 
    }
    masterReset()
    {
        this.childreset();
        this.Vsl=undefined;
        this.Vslagt="";
        this.Vslshpgline="";
       
        this.ExptNoList=[];
        this.containerClp=[];
        const jsonPage = { userid:this._loginService.getLogin()[0].CMPID };
        this._dataService.getData("Export/ContainerFS_PAGELOAD", jsonPage)
            .subscribe((data: any) => {
                if (data.Table[0].STATUS == "100") {
                    
                }
            });
    }

}