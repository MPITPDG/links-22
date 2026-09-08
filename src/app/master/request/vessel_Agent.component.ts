import{Component,OnInit,ViewChild} from '@angular/core';
import{ActivatedRoute,Router} from '@angular/router';
import{DataService} from '../../shared/service/dataService';
import{AuthService} from '../../shared/service/authService';
import { LoginService } from '../../shared/service/loginService';
import { ToastCommonService } from '../../shared/service/toastService';
import { LoaderService } from '../../shared/service/loader.service'; 
import { HttpClient   } from '@angular/common/http';
import { Configuration } from '../../app.constants';
 
 
@Component({
    selector: 'app-masterAgentVessel',
    templateUrl: 'vessel_Agent.component.html'

})  


export class vesselAgentmaster  implements OnInit  { 

    
    
    Header: string="AGENT(VESSEL) MASTER";teleno: string="";nofax:string="";
    ShrtName : string=""; panno : string="";title : string="Mr.";Name : string="";  
    addrs21 : string=""; addrs22 : string=""; addrs23: string="";
    position2:string="After"; Pincode2 : string=""; city2 : string="";    country2: string="";
   
    telephone: string="";  mobile: string=""; email : string=""; 
    
    Ctitle1 : string="Mr.";  Cname1 : string="";  CDesignation1: string=""; Ctelphone1 : string="";
    Cfaxno1: string="";  Cmobileno1: string=""; Cemail1  : string="";
    Ctitle2  : string="Mr."; Cname2 : string="";  CDesignation2 : string=""; Ctelphone2: string="";
    Cfaxno2: string="";   Cmobileno2: string=""; Cemail2: string="";
    Ctitle3  : string="Mr."; Cname3 : string="";  CDesignation3 : string="";  Ctelphone3: string="";
    Cfaxno3: string="";  Cmobileno3: string="";  Cemail3: string="";
    Ctitle4  : string="Mr.";  Cname4 : string="";  CDesignation4 : string="";  Ctelphone4: string="";
    Cfaxno4: string=""; Cmobileno4: string="";  Cemail4: string=""; 
    
    vslAgntId: string="0"; queryParamsReqType: string = "";quryParamsAgtCode:string="";
    validEmail:boolean = false;
    exphousedt   : any = ""; exphouse : any =""; bnkDivision: string="";
    sup_city :any=[]; 
    fileData: File = null;
    uploadedFilePath: string = null;    
    localUrl: any[];
    text: string="Submit";
    countrycode :string; expcountrycode :string;
    AgtCode :string=""; 
    SHPGLine1 : string="SELF";SHPGLine2 : string="";SHPGLine3 : string="";SHPGLine4 : string="";
    Citylist : any [];
    Shipgline :any[];
    listcnt : any[];
    public isLoadingData: Boolean = false;

    constructor(
        private _activatedRoute: ActivatedRoute,
        private _router: Router,
        private _dataService: DataService,
        private _auth: AuthService,
        private _toasterService: ToastCommonService,
        private _loginService: LoginService,
        private loaderService: LoaderService,   
        private http: HttpClient,   private _configuration: Configuration
        //private http1: Http   

    ) {   }

    ngOnInit()
    {
        this._activatedRoute.params.subscribe(params => {
            this.queryParamsReqType = params["ReqType"];
            this.quryParamsAgtCode=params["VslAgtC"];
            
        })
        const jsonmaster = {  CMPID:this._loginService.getLogin()[0].CMPID }
        this.loaderService.display(true);
        

        this.loaderService.display(true);
        this._dataService.getAll("Common/GetFillcity")
        .subscribe((data: any) => {
            this.Citylist=data.Table;
        });

        this._dataService.getAll("Master/AgentFill")
        .subscribe((data: any) => {
            this.Shipgline=data.Table;
            this.loaderService.display(false);
        });
        

    
       if (this.queryParamsReqType =='TEMP' && this.quryParamsAgtCode !=' ')
        {
            this._loginService.verifyRights(107, '')
            .subscribe((data: any) => { this._loginService.checkVerify('Modify', data); });  
         this.Header='AGENT(VESSEL) MASTER - UPDATE REQUEST';
         this.populateEdit();
        }
        else if (this.queryParamsReqType ==' ' && this.quryParamsAgtCode !=' ')
        {
            this._loginService.verifyRights(107, '')
            .subscribe((data: any) => { this._loginService.checkVerify('Modify', data); }); 
            this.Header= 'AGENT(VESSEL) MASTER - UPDATE';
            this.populateEdit();
            
        }
        if (this.queryParamsReqType =='TEMP' && this.quryParamsAgtCode ==' ')
        {   this.Header=  'AGENT(VESSEL) MASTER - REQUEST TO ADD';
            
        }
         if (this.queryParamsReqType ==' ' && this.quryParamsAgtCode ==' ')
        { this.Header=  'AGENT(VESSEL) MASTER - ADD';
        this._loginService.verifyRights(107, '')
        .subscribe((data: any) => { this._loginService.checkVerify('Add', data); }); 
            }
    }
    Countryfilter(citycode){       
        this.listcnt=this.Citylist.filter((cntrylist:any)=>cntrylist.DATAVALUEFIELD==citycode);      
            this.country2=this.listcnt[0].CITY_COUNTRY;            
            this.countrycode=this.listcnt[0].ISO_COUNTRY_CODE;       
    }
    onChange(emialid)
    {
        if(this._dataService.emailvalidation(emialid)==false){
            this._toasterService.toast('warning', 'warning', 'Enter Invalid E-mail !');
        }
    }
    populateEdit()
    {
        this.text='Update';
        this.loaderService.display(true);
        const jsonmaster = {fkAgt_code:this.quryParamsAgtCode,RequestMode: this.queryParamsReqType}
        this._dataService.getData("Master/Master_VesselAgent_Populate",jsonmaster)
        .subscribe((data: any) => {
            this.vslAgntId=data.Table[0].id  ;
            this.AgtCode=data.Table[0].agt_code  ;
            this.ShrtName  = 	data.Table[0].agt_sname  ;
            this.Name  = 	data.Table[0].agt_name  ;
            this.title   = 	data.Table[0].agt_title  ;
            this.addrs21   = 	data.Table[0].agt_add1  ;
            this.addrs22  = 	data.Table[0].agt_add2  ;
            this.addrs23   = 	data.Table[0].agt_add3  ;
            this.email    = 	data.Table[0].agt_email  ;
            this.Pincode2    = 	data.Table[0].agt_pincode  ;
            this.position2  = 	data.Table[0].agt_pinposition  ;
            this.city2   = 	data.Table[0].agt_city  ;
            this.country2   = 	data.Table[0].city_country  ;
            this.countrycode   = 	data.Table[0].agt_country  ;
            this.telephone   = 	data.Table[0].agt_telno  ;
            this.nofax=	data.Table[0].agt_faxno  ;
            this.Ctitle1   = 	data.Table[0].agt_title1  ;
            this.Cname1   = 	data.Table[0].agt_contact1  ;
            this.CDesignation1   = 	data.Table[0].agt_designation1  ;
            this.Ctelphone1   = 	data.Table[0].con_telno1  ;
            this.Cfaxno1   = 	data.Table[0].agt_faxno1  ;
            this.Cmobileno1   = 	data.Table[0].agt_telno1  ;
            this.Cemail1   = 	data.Table[0].agt_cont1email  ;
            this.Cemail2   = 	data.Table[0].agt_cont2email  ;
            this.Cemail3   = 	data.Table[0].agt_cont3email  ;
            this.Cemail4   = 	data.Table[0].agt_cont4email  ;
            this.Ctitle2   = 	data.Table[0].agt_title2 ;
            this.Cname2   = 	data.Table[0].agt_contact2  ;
            this.CDesignation2   = 	data.Table[0].agt_designation2  ;
            this.Ctelphone2   = 	data.Table[0].con_telno2  ;
            this.Cfaxno2   = 	data.Table[0].agt_faxno2  ;
            this.Cmobileno2   = 	data.Table[0].agt_telno2  ;
            this.Cname3   = 	data.Table[0].agt_contact3  ;
            this.Ctitle3   = 	data.Table[0].agt_title3  ;
            this.Cname3   = 	data.Table[0].cagt_contact3  ;
            this.CDesignation3  = 	data.Table[0].agt_designation3  ;
            this.Ctelphone3   = 	data.Table[0].con_telno3  ;
            this.Cfaxno3   = 	data.Table[0].agt_faxno3  ;
            this.Cmobileno3   = 	data.Table[0].agt_telno3  ;
            this.Cname4   = 	data.Table[0].agt_contact4  ;
            this.Ctitle4   = 	data.Table[0].agt_title4  ;
            this.Cname4   = 	data.Table[0].con_contact4  ;
            this.CDesignation4   = 	data.Table[0].agt_designation4 ;
            this.Ctelphone4   = 	data.Table[0].con_telno4  ;
            this.Cfaxno4   = 	data.Table[0].agt_faxno4  ;
            this.Cmobileno4   = 	data.Table[0].agt_telno4  ;
            this.SHPGLine1=data.Table[0].agt_liner1;
            this.SHPGLine2=data.Table[0].agt_liner2;
            this.SHPGLine3=data.Table[0].agt_liner3;
            this.SHPGLine4=data.Table[0].agt_liner4;
            this.panno=data.Table[0].agt_panno;
           
            
        });

        this.loaderService.display(false);
    }
    Add_Main()
    {
        
        if(this.ShrtName.normalize()==""){
            this._toasterService.toast('warning', 'warning', 'Short name could not be blank !');
            return false;
        }
        if(this.Name.normalize()==""){
            this._toasterService.toast('warning', 'warning', 'Name could not be blank !');            
            return false;
        }
        if(this.city2.normalize()==""){
            this._toasterService.toast('warning', 'warning', 'Please select City !');            
            return false;
        }
        this.loaderService.display(true);
        const jsonmaster = {
            id:  this.vslAgntId  ,
            agt_sname:this.ShrtName    ,
            agt_name: this.Name   ,
            agt_title: this.title   ,
            agt_add1:this.addrs21    ,
            agt_add2: this.addrs22   ,
            agt_add3: this.addrs23   ,
            agt_email:this.email    ,
            agt_pincode:this.Pincode2    ,
            agt_pinposition: this.position2   ,
            agt_city: this.city2   ,
            agt_country: this.country2   ,
            agt_telno: this.telephone   ,
            agt_faxno:  this.nofax  ,
            agt_title1: this.Ctitle1   ,
            agt_contact1: this.Cname1   ,
            agt_designation1:this.CDesignation1    ,
            agt_telno1: this.Ctelphone1   ,
            agt_faxno1: this.Cfaxno1   ,
            agt_mobile1: this.Cmobileno1   ,
            agt_cont1email: this.Cemail1   ,
            agt_title2: this.Ctitle2   ,
            agt_contact2:this.Cname2    ,
            agt_designation2:this.CDesignation2    ,
            agt_telno2:this.Ctelphone2    ,
            agt_faxno2: this.Cfaxno2   ,
            agt_mobile2: this.Cmobileno2   ,
            agt_cont2email:this.Cemail2    ,
            agt_title3:this.Ctitle3    ,
            agt_contact3: this.Cname3   ,
            agt_designation3:this.CDesignation3    ,
            agt_telno3: this.Ctelphone3   ,
            agt_faxno3: this.Cfaxno3   ,
            agt_mobile3: this.Cmobileno3   ,
            agt_cont3email:  this.Cemail3  ,
            agt_title4: this.Ctitle4  ,
            agt_contact4: this.Cname4   ,
            agt_designation4:this.CDesignation4    ,
            agt_telno4: this.Ctelphone4   ,
            agt_faxno4: this.Cfaxno4   ,
            agt_mobile4: this.Cmobileno4   ,
            agt_cont4email:  this.Cemail4  ,
            agt_panno:this.panno,
            agt_liner1:this.SHPGLine1,
            agt_liner2:this.SHPGLine2,
            agt_liner3:this.SHPGLine3,
            agt_liner4:this.SHPGLine4,
            MakerID: this._loginService.getLogin()[0].CMPID,
            MakerIP:this._loginService.getLogin()[0].MAKERIP,
            cmp_code:this._loginService.getLogin()[0].CMPCODE,
            citycode: this._loginService.getLogin()[0].CITYCODE, 
            RequestMode:this.queryParamsReqType  }
            this._dataService.Common("Master/Vessel_Agent_MASTER_IU", jsonmaster)
            .subscribe((data: any) => {
               if (data.Table[0].STATUS == "100") {
                    if (this.queryParamsReqType =='TEMP' && this.quryParamsAgtCode ==' ')
                        { this._toasterService.toast('success', 'success', 'Requst Vessel Agent saved successfully !');   }
                    else  if (this.queryParamsReqType =='TEMP' && this.quryParamsAgtCode !=' ')
                        { this._toasterService.toast('success', 'success', 'Requst Vessel Agent Authorised successfully !');}
                    else  if (this.queryParamsReqType ==" " && this.quryParamsAgtCode !=' ')
                        { this._toasterService.toast('success', 'success', 'Vessel Agent update successfully !');}
                    else  if (this.queryParamsReqType ==" " && this.quryParamsAgtCode ==" ")
                        { this._toasterService.toast('success', 'success', 'Vessel Agent saved successfully !');   }
                   this.loaderService.display(false);
                   this.RestMain();
               }

               else   if (data.Table[0].STATUS == "105")
               {
               if (confirm(data.Table[0].STATUSTEXT))
                {
                    this._dataService.Common("Master/Vessel_Agent_MASTER_IU", jsonmaster)
                    .subscribe((data: any) => {
                       if (data.Table[0].STATUS == "100") {
                            if (this.queryParamsReqType =='TEMP' && this.quryParamsAgtCode ==' ')
                                { this._toasterService.toast('success', 'success', 'Requst Vessel Agent saved successfully !');   }
                            else  if (this.queryParamsReqType =='TEMP' && this.quryParamsAgtCode !=' ')
                                { this._toasterService.toast('success', 'success', 'Requst Vessel Agent Authorised successfully !');}
                            else  if (this.queryParamsReqType ==" " && this.quryParamsAgtCode !=' ')
                                { this._toasterService.toast('success', 'success', 'Vessel Agent update successfully !');}
                            else  if (this.queryParamsReqType ==" " && this.quryParamsAgtCode ==" ")
                                { this._toasterService.toast('success', 'success', 'Vessel Agent saved successfully !');   }
                           this.loaderService.display(false);
                           this.RestMain();
                        }
                        else if (data.Table[0].STATUS == "105") {
                            this._toasterService.toast("warning","warning" ,'Add VesselAgent with different City & address '  );
                            this.loaderService.display(false);
                        }
            
                    }); 
                    }
                        else
                          {this.loaderService.display(false);
                         return false}
            
                            }
               else{   this._toasterService.toast("warning","warning" ,data.Table[0].STATUSTEXT  );
                        this.loaderService.display(false);
                }
            });  

    }

    RestMain()
    {
        this.ShrtName  =''; 
        this.Name  =''; 
        this.title   ='Messrs';          
        this.countrycode   =''; 
        this.telephone   ='';       
        this.Ctitle1   ='Mr.'; 
        this.Cname1   =''; 
        this.CDesignation1   =''; 
        this.Ctelphone1   =''; 
        this.Cfaxno1   =''; 
        this.Cmobileno1   =''; 
        this.Cemail1   =''; 
        this.Ctitle2   ='Mr.'; 
        this.Cname2   =''; 
        this.CDesignation2   =''; 
        this.Ctelphone2   =''; 
        this.Cfaxno2   =''; 
        this.Cmobileno2   =''; 
        this.Cname3   =''; 
        this.Ctitle3   ='Mr.'; 
        this.Cname3   =''; 
        this.CDesignation3  =''; 
        this.Ctelphone3   =''; 
        this.Cfaxno3   =''; 
        this.Cmobileno3   =''; 
        this.Cname4   =''; 
        this.Ctitle4   ='Mr.'; 
        this.Cname4   =''; 
        this.CDesignation4   =''; 
        this.Ctelphone4   =''; 
        this.Cfaxno4   =''; 
        this.Cmobileno4   =''; 
        this.Cemail4   =''; 
        this.SHPGLine1="";
        this.SHPGLine2="";
        this.SHPGLine3="";
        this.SHPGLine4="";
         this.panno="";
         this.text='Submit';
       // if(this.queryParamsReqType=="Exporter"){
            this._router.navigate(['/master/request/AgentVessel/'+ this.queryParamsReqType  +' / ']);
       /// }
    }
}
