import{Component,OnInit} from '@angular/core';
import{ActivatedRoute,Router} from '@angular/router';
import{DataService} from '../../shared/service/dataService';
import{AuthService} from '../../shared/service/authService';
import { LoginService } from '../../shared/service/loginService';
import { ToastCommonService } from '../../shared/service/toastService';
import { LoaderService } from '../../shared/service/loader.service'; 
import { HttpClient   } from '@angular/common/http';
import { Configuration } from '../../app.constants';
 
 
@Component({
    selector: 'app-masterConsigneebank',
    templateUrl: 'Bank-Consignee.component.html'

})  


export class bankConsigneemaster  implements OnInit  { 
    
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
    
    BankId: string="0"; queryParamsReqType: string = "";quryParamsBnkCode:string="";
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
         //   this.queryParamsReqType = params["ReqType"];
            this.quryParamsBnkCode=params["BnkCode"];
            
        })
        const jsonmaster = {  CMPID:this._loginService.getLogin()[0].CMPID }
        this.loaderService.display(true);
        

      
        this._dataService.getAll("Common/GetFillcity")
        .subscribe((data: any) => {
            this.Citylist=data.Table;
        });

    
    
       if ( this.quryParamsBnkCode !=' ')
        {
            this._loginService.verifyRights(107, '')
            .subscribe((data: any) => { this._loginService.checkVerify('Modify', data); });  
         this.Header='BANK DETAILS - UPDATE';
          this.populateEdit();
        }
       
         else  
        { this.Header=  'BANK DETAILS - ADD';
        this._loginService.verifyRights(107, '')
        .subscribe((data: any) => { this._loginService.checkVerify('Add', data); }); 
            }
            this.loaderService.display(false);
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
        this.text="Update";
        this.loaderService.display(true);
        const jsonmaster = {fkbankcode:this.quryParamsBnkCode }
        this._dataService.getData("Master/Master_bankdet_Populate",jsonmaster)
        .subscribe((data: any) => {
            this.BankId=data.Table[0].ID  ;
            this.AgtCode=data.Table[0].bank_code  ;
            this.ShrtName  = 	data.Table[0].bank_sname  ;
            this.Name  = 	data.Table[0].bank_name  ;
            this.title   = 	data.Table[0].bank_title  ;
            this.addrs21   = 	data.Table[0].bank_add1  ;
            this.addrs22  = 	data.Table[0].bank_add2  ;
            this.addrs23   = 	data.Table[0].bank_add3  ;
            this.email    = 	data.Table[0].bank_email  ;
            this.Pincode2    = 	data.Table[0].bank_pincode  ;
            this.position2  = 	data.Table[0].bank_pinposition  ;
            this.city2   = 	data.Table[0].bank_cityCode  ;
            this.country2   = 	data.Table[0].bank_city_country  ;
            this.countrycode   = 	data.Table[0].bank_country  ;
            this.telephone   = 	data.Table[0].bank_telno  ;
            this.nofax=	data.Table[0].bank_faxno  ;
            this.Ctitle1   = 	data.Table[0].bank_title1  ;
            this.Cname1   = 	data.Table[0].bank_contact1  ;
            this.CDesignation1   = 	data.Table[0].bank_designation1  ;
            this.Ctelphone1   = 	data.Table[0].con_telno1  ;
            this.Cfaxno1   = 	data.Table[0].bank_faxno1  ;
            this.Cmobileno1   = 	data.Table[0].bank_telno1  ;
            this.Cemail1   = 	data.Table[0].bank_cont1email  ;
            this.Cemail2   = 	data.Table[0].bank_cont2email  ;
            this.Cemail3   = 	data.Table[0].bank_cont3email  ;
            this.Cemail4   = 	data.Table[0].bank_cont4email  ;
            this.Ctitle2   = 	data.Table[0].bank_title2 ;
            this.Cname2   = 	data.Table[0].bank_contact2  ;
            this.CDesignation2   = 	data.Table[0].bank_designation2  ;
            this.Ctelphone2   = 	data.Table[0].con_telno2  ;
            this.Cfaxno2   = 	data.Table[0].bank_faxno2  ;
            this.Cmobileno2   = 	data.Table[0].bank_telno2  ;
            this.Cname3   = 	data.Table[0].bank_contact3  ;
            this.Ctitle3   = 	data.Table[0].bank_title3  ;
            this.Cname3   = 	data.Table[0].cbank_contact3  ;
            this.CDesignation3  = 	data.Table[0].bank_designation3  ;
            this.Ctelphone3   = 	data.Table[0].con_telno3  ;
            this.Cfaxno3   = 	data.Table[0].bank_faxno3  ;
            this.Cmobileno3   = 	data.Table[0].bank_telno3  ;
            this.Cname4   = 	data.Table[0].bank_contact4  ;
            this.Ctitle4   = 	data.Table[0].bank_title4  ;
            this.Cname4   = 	data.Table[0].con_contact4  ;
            this.CDesignation4   = 	data.Table[0].bank_designation4 ;
            this.Ctelphone4   = 	data.Table[0].con_telno4  ;
            this.Cfaxno4   = 	data.Table[0].bank_faxno4  ;
            this.Cmobileno4   = 	data.Table[0].bank_telno4  ;
          
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
            id:  this.BankId  ,
            bank_sname:(this.ShrtName="" ? "" :this.ShrtName.replace("'","`")),    
            bank_name:(this.Name="" ? "" : this.Name.replace("'","`")),   
            bank_title:(this.title="" ? "" :  this.title)   ,
            bank_add1:(this.addrs21="" ? "" : this.addrs21.replace("'","`")), 
                              
            bank_add2:(this.addrs22="" ? "" : this.addrs22.replace("'","`")),   
            bank_add3:(this.addrs23="" ? "" : this.addrs23.replace("'","`")),   
            bank_email:this.email,
            bank_pincode:this.Pincode2,
            bank_pinposition:(this.position2="" ? "" : this.position2.replace("'","`")),
           
            bank_city:this.city2,
      
            bank_country:this.country2,
            bank_telno:this.telephone,
            bank_faxno:this.nofax,
            bank_title1:(this.Ctitle1="" ? "" : this.Ctitle1.replace("'","`")),
            bank_contact1:(this.Cname1="" ? "" : this.Cname1.replace("'","`")) ,
            bank_designation1:(this.CDesignation1="" ? "" :this.CDesignation1.replace("'","`")),
            // bank_telno1:(this.Ctelphone1="" ? "" : this.Ctelphone1.replace("'","`")),
              bank_telno1:this.Ctelphone1 , 
              bank_faxno1:this.Cfaxno1,
            bank_mobile1:this.Cmobileno1,
            bank_cont1email:this.Cemail1,
            bank_title2:this.Ctitle2,
            bank_contact2:this.Cname2,
            bank_designation2:this.CDesignation2,
            //bank_title2:(this.Ctitle2="" ? "" : this.Ctitle2.replace("'","`")),
            //bank_contact2:(this.Cname2="" ? "" :this.Cname2.replace("'","`").replace("'","`")),
            //bank_designation2:(this.CDesignation2="" ? "" :this.CDesignation2.replace("'","`")),
            // bank_telno2:(this.Ctelphone2="" ? "" :this.Ctelphone2.replace("'","`")),
            bank_telno2:this.Ctelphone2,
            bank_faxno2:this.Cfaxno2,
            bank_mobile2:this.Cmobileno2,
            bank_cont2email:this.Cemail2,
            bank_title3:(this.Ctitle3="" ? "" :this.Ctitle3.replace("'","`")),
            // bank_contact3:(this.Cname3="" ? "" : this.Cname3.replace("'","`")),
            bank_contact3:this.Cname3,
            bank_designation3:(this.CDesignation3="" ? "" :this.CDesignation3.replace("'","`")),
            // bank_telno3:(this.Ctelphone3="" ? "" : this.Ctelphone3.replace("'","`")),
             bank_telno3:this.Ctelphone3,
            bank_faxno3:this.Cfaxno3,
            bank_mobile3:this.Cmobileno3,
            bank_cont3email:this.Cemail3,
            bank_title4:(this.Ctitle4="" ? "" : this.Ctitle4.replace("'","`")),
            // bank_contact4:(this.Cname4="" ? "" : this.Cname4.replace("'","`")) ,
            bank_contact4:this.Cname4,
            bank_designation4:(this.CDesignation4="" ? "" :this.CDesignation4.replace("'","`")),
            // bank_telno4:(this.Ctelphone4="" ? "" : this.Ctelphone4.replace("'","`")),
            bank_telno4:this.Ctelphone4,
            bank_faxno4:this.Cfaxno4,
            bank_mobile4:this.Cmobileno4,
            bank_cont4email:this.Cemail4,
            
            MakerID: this._loginService.getLogin()[0].CMPID,
            MakerIP:this._loginService.getLogin()[0].MAKERIP,
            cmp_code:this._loginService.getLogin()[0].CMPCODE,
            citycode: this._loginService.getLogin()[0].CITYCODE, 
            RequestMode:this.queryParamsReqType  }
            this._dataService.Common("Master/Consignee_bank_IU", jsonmaster)
            .subscribe((data: any) => {
               if (data.Table[0].STATUS == "100") {
                    if ( this.quryParamsBnkCode ==' ')
                        { this._toasterService.toast('success', 'success', 'Bank saved successfully !');   }
                     else  if ( this.quryParamsBnkCode !=' ')
                        { this._toasterService.toast('success', 'success', 'Bank update successfully !');}
                       this.loaderService.display(false);
                   this.RestMain();
                }
                   else   if (data.Table[0].STATUS == "105")
                   {
                   if (confirm(data.Table[0].STATUSTEXT))
                    {
                        this._dataService.Common("Master/Consignee_bank_IU", jsonmaster)
                        .subscribe((data: any) => {
                           if (data.Table[0].STATUS == "100") {
                                if ( this.quryParamsBnkCode ==' ')
                                    { this._toasterService.toast('success', 'success', 'Bank saved successfully !');   }
                                 else  if ( this.quryParamsBnkCode !=' ')
                                    { this._toasterService.toast('success', 'success', 'Bank update successfully !');}
                                   this.loaderService.display(false);
                               this.RestMain();
                            }
                            else if (data.Table[0].STATUS == "105") {
                                this._toasterService.toast("warning","warning" ,'Add Consignee Bank with different City & address '  );
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
        this.email  ="";   
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
        this.text="Submit";
       
       // if(this.queryParamsReqType=="Exporter"){
            this._router.navigate(['/master/request/ConsigneeBank/ ']);
       /// }
    }



}