
import { Component, OnInit} from '@angular/core';
import { DataService } from '../../shared/service/dataService';
import { AuthService } from '../../shared/service/authService';
import { Router} from '@angular/router';
import { ToasterService } from 'angular2-toaster';
import { LoginService } from '../../shared/service/loginService';
import { IMyDpOptions } from 'mydatepicker';
import { ToastCommonService } from '../../shared/service/toastService';
import { FcrSharedDataService } from '../export-share-data.service';
import { LoaderService } from '../../shared/service/loader.service';
import { TrimPipe } from 'angular-pipes';

@Component({
    selector: 'app-fcr-iu',
    templateUrl: 'exp_prt_fcr_generate.component.html' 
})

export class ExptFCRGenerate  implements OnInit {
    private baseUrl: string = ""//'Export/Export_FCR_Pageload';

    exJobno: any = "";
    shippername: any = "";
    vesselname: any = "";
    vslvoyage: any = "";
    vslAgt: any = "";
    bltype: any = "";
    frttype: any = "";
    currency: any = "";
    bldate: any = null;
    deliveryTo: any = "";
    selJob: any = "";
    pod: any = "";
    frtAmt: any="";
    jobnos: any = "";
    FCRNo: any = "";
    listcnt: any;
    exptdt: any = [];
    listBltype: any = []
    listCurreny: any = [];
    listSupp: any = [];
    listFCR :any[];
    switchhbl:boolean=false;
    viewswitch: string='0';

    buttonStatus = false;
    buttonSearchStatus = false;
    FRMBL :boolean=false;
    ishablissue :any="";
    DRAFTPRINT: string="";
    ISPRINT :string='0';
    public buttonvisible = true;    
    constructor(
        private _router: Router,
        private _dataService: DataService,
        private _auth: AuthService,
        private _toasterService: ToastCommonService,
        private _loginService: LoginService,
        private _fcrsharedvataSerice: FcrSharedDataService,
        private _fcrHbltypesharedvataSerice: FcrSharedDataService,
        private loaderService: LoaderService) {
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
        selectorWidth: '200px',
        disableSince: this.disableFutureDate()
         
    };
   

    disableFutureDate() {
        let d = new Date();
        let disabledDate;
        let year = new Date().getFullYear();
        let month = d.getMonth() + 1;
        let date = d.getDate();
        if (month === 12 && date === 31) { //For next year change
            disabledDate = { year: year + 1, month: 1, day: 1 };
        } else if (month < 12 && (date === 31 || date === 30 || date === 28 || date === 29)) { //For next month change
            disabledDate = { year: year, month: month + 1, day: 1 };
        } else { //For next day change
            disabledDate = { year: year, month: month, day: date + 1 };
        }
        return disabledDate;
    }

    ngOnInit(): void {
        this._loginService.verifyRights(401, '')
        .subscribe((data: any) => { this._loginService.checkVerify('View', data); });
        if(this._loginService.getLogin()[0].ISHBL == '1')
        {  this.ishablissue="1";  }
        else{ this.ishablissue="0";}
    }
    jobserch() {
        if (this.exJobno == ""  || this.exJobno == null) {
            this._toasterService.toast('error', 'Error', "Please Enter export job no");             
            return false;
        }
        this.loaderService.display(true);
        this.buttonStatus = true;
        this.buttonSearchStatus = true;
        this.baseUrl = 'Export/Export_FCR_Pageload';
        const jsonExport = { citycode: this._loginService.getLogin()[0].CITYCODE, EXPTNO: this.exJobno };
        this._dataService.Common(this.baseUrl, jsonExport)
            .subscribe((data: any) => {               
                if (data.Table[0].STATUS == 100) {
                    this.ISPRINT=data.Table[0].ISPRINT;
                    this.DRAFTPRINT=data.Table[0].DRAFTPRINT;
                    if(data.Table[0].FRMBL =="0")
                    {
                        this.FRMBL=false;
                    }
                    else
                    {
                        this.FRMBL=true;                        
                    }
                    this.buttonStatus = false;
                    if (data.Table1.length>0)
                    {
                        this.exptdt = data.Table1;                   
                        this.shippername = this.exptdt[0].EXPT_EXPORTER;
                        this.vesselname = this.exptdt[0].EXPT_VESSEL;
                        this.vslvoyage = this.exptdt[0].vsl_voyno;
                        this.vslAgt = this.exptdt[0].EXPT_VSLAGENT;                   
                        this.pod = this.exptdt[0].POD;
                        this.switchhbl=(this.exptdt[0].isSwitcHblNo =="1")?true :false

                        if (this.exptdt[0].EXPT_HBLNO.trim() == '') {

                            this.bltype = -1;
                            this.frttype = -1;
                            this.currency = -1;
                             
                            this.FCRNo ='';
                        }
                        else {
                            this.bltype = this.exptdt[0].HBLTYPE;
                            this.frttype = this.exptdt[0].FRTYPE;
                            this.currency = this.exptdt[0].FRTCURR;
                            this.FCRNo = this.exptdt[0].EXPT_HBLNO;
                            this.frtAmt = this.exptdt[0].FRTAMT;
                            this.bldate = (this.exptdt[0].EXPT_HBLDT != "") ? this._dataService.stringdttoArry(this.exptdt[0].EXPT_HBLDT) : ""; 
                            if( this.FCRNo !='' && this.exptdt[0].isSwitcHblNo =="1" && this.bltype=="M" ){
                                this.viewswitch='1';
                            }else if (this.bltype!="M"){ this.viewswitch='1';}
                            else
                            {  this.viewswitch='0';}
                        }
                        
                    }   
                    else{
                        this.loaderService.display(false);
                        this.buttonStatus = false;
                        this._toasterService.toast('error', 'Error', "Please select vessel agent corresponding Ex-job !");
                    }               

                    
                    this.listBltype = data.Table2;
                    this.listCurreny = data.Table3;
                    this.listSupp = data.Table4;

                  
                    this.loaderService.display(false);
                    this._toasterService.toast('info', 'Complete', 'Data filled successfully');
                } else {
                    this.loaderService.display(false);
                    this.buttonStatus = false;
                    this._toasterService.toast('error', 'Error', data.Table[0].STATUSTEXT);
                }
            },
            (error) => {
                this.loaderService.display(false);
                this.buttonStatus = false;
                this._toasterService.toast('error', 'Error', error.status + '<br/>' + error.statusText);
            },
            () => {
            });
            if (this.ISPRINT =='1')
            {
                this.buttonvisible=false;
            }
            if(this.DRAFTPRINT =='3')
            {
                this.buttonvisible=false;
            }
            if (this.ISPRINT !='1' &&  this.DRAFTPRINT !='3' )
            {
                this.buttonvisible=true;
            }

    }

    GenSwitchBL()
    {
         if (  this.bltype != "M"){
        this._toasterService.toast('error', 'Error', "Switch BL only for MTO !");        
        return false;
        }
        if (this.switchhbl==false){
            this._toasterService.toast('error', 'Error', "Please select Switch BL !");
        }
        if( confirm("Are you sure you are going to generate switch bl ?") )  { 
            this.loaderService.display(true);  
            const jsonsExport = {FCRNO:this.FCRNo, CITYCODE1: this._loginService.getLogin()[0].CITYCODE1, CMPCODE: this._loginService.getLogin()[0].CMPCODE, CITYCODE:this._loginService.getLogin()[0].CITYCODE,   USERNAME: this._loginService.getLogin()[0].CMP_USERNAME};
            this._dataService.Common("Export/EXPORT_SWICH_FCR_GENERATION", jsonsExport)
                .subscribe((data: any) => {
                    if (data.Table[0].STATUS == 100) {    
                        this._toasterService.toast('info', 'Complete', ' FCR NO. ' + data.Table[0].FCRNO);
                        this.loaderService.display(false);
                    }
                });
        }
            else {return false;}
    } 
    
    AddFCR()
    {
        
        if (this.ISPRINT=='0' && this.DRAFTPRINT !='3')
        {
        this._loginService.verifyRights(401, '')
        .subscribe((data: any) => { this._loginService.checkVerify('Add', data); });

        if (this.bldate == null) {
            this._toasterService.toast('error', 'Error', "Please select Hbl Date");
            this.buttonStatus = false;
            return false;
        }

        if (this.frttype == ""  || this.frttype == "-1") {
            this._toasterService.toast('error', 'Error', "Please Enter Freight Type");
            this.buttonStatus = false;
            return false;
        }
        if (this.bltype == "" || this.bltype == "-1") {
            this._toasterService.toast('error', 'Error', "Please Enter Bl Type");
            this.buttonStatus = false;
            return false;
        }
        
        for (let obj of this.exptdt)
        {
            if (obj.SELEJOB == "null" || obj.SELEJOB == true )
                {
                this.jobnos = this.jobnos + obj.EXPTNO + ',';           
                }
        }
       if(this.jobnos ==''){this.jobnos =this.exJobno +','}
        
       if  (this.jobnos=="")
       {
           this._toasterService.toast('warning', 'warning', "Please select atleast one export job no");             
           return false;
       }
       if(this._loginService.getLogin()[0].ISHBL == '0')
       {
           if(this.FCRNo=='')
           {
            this._toasterService.toast('warning', 'warning', "Please Enter HBL No");             
            return false;
           }
       }
        //  this.bltype 
        this.listcnt=this.listBltype.filter((cntrylist:any)=>cntrylist.HBLCODE==this.bltype);
        let hblname=this.listcnt[0].HBLNAME;

        if (this.FCRNo=="")
        {
            if( confirm("Are you sure you are going to generate " +hblname + '?') )  {  //this.generateFCR();  
                if (this.switchhbl==true){
                    if( confirm("Are you sure you are going to generate switch bl ?") )  {   
                        this.generateFCR();    }else {return false;}
                } 
                else{this.generateFCR();}
                
            }
        }
        else{this.generateFCR();}

        // if (this.switchhbl==true){
        //     if( confirm("Are you sure you are going to generate switch bl ?") )  {   
        //         this.generateFCR();    }
        // } else{return false;}

    }
    else
    {
        this._toasterService.toast('warning', 'warning', "You cannot update Print already taken");             
        return false;
    }
    

  }
    

    generateFCR(){
        this.baseUrl = 'Export/Export_FCR_GENERATION';
        this.loaderService.display(true);
        let isswitchbl='0';
        if (this.switchhbl==true){isswitchbl='1'  }else {isswitchbl='0'}
        const jsonExport = { citycode: this._loginService.getLogin()[0].CITYCODE, EXPTNO: this.exJobno, jobnos: this.jobnos, POD: this.pod, citycode1:  this._loginService.getLogin()[0].CITYCODE1, FCRDT: this.bldate.formatted, FRTYPE: this.frttype, FRTCur: this.currency, FRTAMT: this.frtAmt, HBLType: this.bltype, DeliveryTo: this.deliveryTo, cmpcode: this._loginService.getLogin()[0].CMPCODE, username: this._loginService.getLogin()[0].CMP_USERNAME, FCRNO: this.FCRNo ,switchhbl:isswitchbl};
        this._dataService.Common(this.baseUrl, jsonExport)
            .subscribe((data: any) => {
                if (data.Table[0].STATUS == 100) {                 

                    this._toasterService.toast('info', 'Complete', ' FCR NO. ' + data.Table1[0].FCRNO);
                    this.buttonStatus = false;
                    if (this.bltype=='H'){this.bltype='F'}
                    this._fcrHbltypesharedvataSerice.fcrHbltypesharedData = this.bltype;
                    this.loaderService.display(false);
                    // if(data.Table1.length==1){                    
                    this._fcrsharedvataSerice.fcrsharedData = data.Table1[0].FCRNO;
                    
                    this._router.navigate(['/export/fcr/sea-bl-print-view']);  
                    // }
                    // else {  this.listFCR=data.Table1;  }
                }
                else {
                    this.loaderService.display(false);
                    this._toasterService.toast('error', 'Error', data.Table[0].STATUSTEXT);
                    this.buttonStatus = false;
                }

            });
    }
    checkValue(event: any){
        console.log(event);
     }
    

    onprint()    
    {
        if(this.FCRNo.trim()!='')
        {
        this._loginService.verifyRights(401, '')
        .subscribe((data: any) => { this._loginService.checkVerify('View', data); });
           

        if (this.bltype=="H")
        {
            this._fcrHbltypesharedvataSerice.fcrHbltypesharedData = "F";
        }
        else   {
            this._fcrHbltypesharedvataSerice.fcrHbltypesharedData = this.bltype;
          }

      //  this._fcrHbltypesharedvataSerice.fcrHbltypesharedData = this.bltype;
        this._fcrsharedvataSerice.fcrsharedData = this.FCRNo;
         
        this._router.navigate(['/export/fcr/sea-bl-print-view']);//'/export/fcr/seablprintview'
    }
        else{this._toasterService.toast('warning','warning','Please generate House Bl')}
       // window.open('./#/export/fcr/sea-bl-print-view');
    //    if (this.bltype=='F'){
    //    window.open('./#/new-tab/FCRpreview/' +  this.FCRNo.trim() +'/'+ this.bltype.trim()   ,'_blank', 'height=600,width=800');
    //    }else{
    //    window.open('./#/new-tab/MTOpreview/' +  this._fcrsharedvataSerice.fcrsharedData.trim() +'/'+ this._fcrHbltypesharedvataSerice.fcrHbltypesharedData   ,'_blank', 'height=600,width=800');
    //    }
    }
    onpreview()
    {
        if(this.FCRNo.trim()!='')
        { 
                this._fcrHbltypesharedvataSerice.fcrHbltypesharedData = this.bltype;
                this._fcrsharedvataSerice.fcrsharedData = this.FCRNo;
                this._loginService.verifyRights(401, '')               
            .subscribe((data: any) => { this._loginService.checkVerify('View', data); });   
            if (this.bltype=='F'){
                window.open('./#/new-tab/FCRpreview/' +  this.FCRNo.trim() +'/'+ this.bltype.trim()   ,'_blank', 'height=600,width=800');
                }else{
                window.open('./#/new-tab/MTOpreview/' +  this._fcrsharedvataSerice.fcrsharedData.trim() +'/'+ this._fcrHbltypesharedvataSerice.fcrHbltypesharedData   ,'_blank', 'height=600,width=800');
                }
        }
        else{this._toasterService.toast('warning','warning','Please generate House Bl')}
        
    }

    ResetAll()
    {
        this.buttonSearchStatus = false;
        this.buttonStatus = false;
        this.exptdt = [];

    }
}