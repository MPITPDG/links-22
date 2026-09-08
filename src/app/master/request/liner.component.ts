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
    selector: 'app-masterLiner',
    templateUrl: 'liner.component.html'

})  


export class Linermaster  implements OnInit  { 

    Header: string="SHIPPING LINER MASTER";teleno: string="";nofax:string="";
    ShrtName : string=""; panno : string="";title : string="Mr.";Name : string="";  
    addrs21 : string=""; addrs22 : string=""; addrs23: string="";
    position2:string="After"; Pincode2 : string=""; city2 : string="";    country2: string="";
   
    telephone: string="";  mobile: string=""; email : string=""; 
    
    LinerId: string="0"; queryParamsReqType: string = "";quryParamsLinerCode:string="";
    validEmail:boolean = false;
    
    text: string="Submit";
    countrycode :string;  
    LinerCode :string=""; 
    
    Citylist : any [];
   
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
    Countryfilter(citycode){       
        this.listcnt=this.Citylist.filter((cntrylist:any)=>cntrylist.DATAVALUEFIELD==citycode);      
            this.country2=this.listcnt[0].CITY_COUNTRY;            
            this.countrycode=this.listcnt[0].ISO_COUNTRY_CODE;       
    }
    ngOnInit(){
        this._activatedRoute.params.subscribe(params => {
            this.queryParamsReqType = params["ReqType"];
            this.quryParamsLinerCode=params["linerC"];
            
        })
        const jsonmaster = {  CMPID:this._loginService.getLogin()[0].CMPID }
        this.loaderService.display(true);
        

        
        this._dataService.getAll("Common/GetFillcity")
        .subscribe((data: any) => {
            this.Citylist=data.Table;
        });
        
    
       if (this.queryParamsReqType =='TEMP' && this.quryParamsLinerCode !=' ')
       {
           this._loginService.verifyRights(108, '')
           .subscribe((data: any) => { this._loginService.checkVerify('Modify', data); });  
        this.Header='SHIPPING LINER MASTER - - UPDATE REQUEST';
        this.populateEdit();
       }
       else if (this.queryParamsReqType ==' ' && this.quryParamsLinerCode !=' ')
       {
           this._loginService.verifyRights(108, '')
           .subscribe((data: any) => { this._loginService.checkVerify('Modify', data); }); 
           this.Header= 'SHIPPING LINER MASTER -- UPDATE';
           this.populateEdit();
           this.text='Update';
       }
       if (this.queryParamsReqType =='TEMP' && this.quryParamsLinerCode ==' ')
       {   this.Header=  'SHIPPING LINER MASTER - REQUEST TO ADD ';
           
       }
        if (this.queryParamsReqType ==' ' && this.quryParamsLinerCode ==' ')
       { this.Header=  'SHIPPING LINER MASTER - - ADD';
       this._loginService.verifyRights(108, '')
       .subscribe((data: any) => { this._loginService.checkVerify('Add', data); }); 
           }

        this.loaderService.display(false);
    }
    onChange(emialid)
    {
        if(this._dataService.emailvalidation(emialid)==false){
            this._toasterService.toast('warning', 'warning', 'Enter Invalid E-mail !');
        }
    }

    populateEdit()
    {
        this.loaderService.display(true);
        const jsonmaster = {fkliner_code:this.quryParamsLinerCode,RequestMode: this.queryParamsReqType}
        this._dataService.getData("Master/Master_Liner_Populate",jsonmaster)
        .subscribe((data: any) => {
            this.LinerId=data.Table[0].ID  ;
            this.LinerCode=data.Table[0].liner_code  ;
            this.ShrtName  = 	data.Table[0].liner_sname  ;
            this.Name  = 	data.Table[0].liner_name  ;
            // this.title   = 	data.Table[0].agt_title  ;
            this.addrs21   = 	data.Table[0].liner_add1  ;
            this.addrs22  = 	data.Table[0].liner_add2  ;
            this.addrs23   = 	data.Table[0].liner_add3  ;
            this.email    = 	data.Table[0].liner_email  ;
            this.Pincode2    = 	data.Table[0].liner_pincode  ;
            this.position2  = 	data.Table[0].liner_pinposition  ;
            this.city2   = 	data.Table[0].liner_city_code  ;
            this.country2   = 	data.Table[0].liner_country  ;
            this.countrycode   = 	data.Table[0].city_country  ;
            this.teleno   = 	data.Table[0].liner_telno  ;
            this.nofax=	data.Table[0].liner_faxno  ;
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
            id:  this.LinerId  ,
            liner_sname:this.ShrtName.replace("'","`")    ,
            liner_name: this.Name.replace("'","`")   ,
            // agt_title: this.title   ,
            liner_add1:this.addrs21.replace("'","`")    ,
            liner_add2: this.addrs22.replace("'","`")   ,
            liner_add3: this.addrs23.replace("'","`")   ,
            liner_email:this.email    ,
            liner_pincode:this.Pincode2    ,
            liner_pinposition: this.position2   ,
            liner_city: this.city2   ,
            liner_country: this.country2   ,
            liner_telno: this.teleno   ,
            liner_faxno:  this.nofax  ,
           
            MakerID: this._loginService.getLogin()[0].CMPID,
            MakerIP:this._loginService.getLogin()[0].MAKERIP,
            cmp_code:this._loginService.getLogin()[0].CMPCODE,
            citycode: this._loginService.getLogin()[0].CITYCODE, 
            RequestMode:this.queryParamsReqType  }
            this._dataService.Common("Master/Shiping_liner_IU", jsonmaster)
            .subscribe((data: any) => {
               if (data.Table[0].STATUS == "100") {
                    if (this.queryParamsReqType =='TEMP' && this.quryParamsLinerCode ==' ')
                        { this._toasterService.toast('success', 'success', 'Requst Liner saved successfully !');   }
                    else  if (this.queryParamsReqType =='TEMP' && this.quryParamsLinerCode !=' ')
                        { this._toasterService.toast('success', 'success', 'Requst Liner Authorised successfully !');}
                    else  if (this.queryParamsReqType ==" " && this.quryParamsLinerCode !=' ')
                        { this._toasterService.toast('success', 'success', 'Liner update successfully !');}
                    else  if (this.queryParamsReqType ==" " && this.quryParamsLinerCode ==" ")
                        { this._toasterService.toast('success', 'success', 'Liner saved successfully !');   }
                   this.loaderService.display(false);
                   this.RestMain();
               
               }
               
               else   if (data.Table[0].STATUS == "105")
                {
                if (confirm(data.Table[0].STATUSTEXT))
                 {
                    this._dataService.Common("Master/Shiping_liner_IU", jsonmaster)
                    .subscribe((data: any) => {
                       if (data.Table[0].STATUS == "100") {
                            if (this.queryParamsReqType =='TEMP' && this.quryParamsLinerCode ==' ')
                                { this._toasterService.toast('success', 'success', 'Request Liner saved successfully !');   }
                            else  if (this.queryParamsReqType =='TEMP' && this.quryParamsLinerCode !=' ')
                                { this._toasterService.toast('success', 'success', 'Request Liner Authorised successfully !');}
                            else  if (this.queryParamsReqType ==" " && this.quryParamsLinerCode !=' ')
                                { this._toasterService.toast('success', 'success', 'Liner update successfully !');}
                            else  if (this.queryParamsReqType ==" " && this.quryParamsLinerCode ==" ")
                                { this._toasterService.toast('success', 'success', 'Liner saved successfully !');   }
                           this.loaderService.display(false);
                           this.RestMain();
                           
            }
            else if (data.Table[0].STATUS == "105") {
                this._toasterService.toast("warning","warning" ,'Add Liner with different City & address '  );
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
        this.LinerId ="";
        this.ShrtName  ="";
        this.Name   ="";
        // agt_title: this.title   ,
        this.addrs21    ="";
        this.addrs22   ="";
        this.addrs23   ="";
        this.email   ="";
        this.Pincode2    ="";
        this.position2   ="";
        this.city2   ="";
        this.country2   ="";
        this.teleno   ="";
        this.nofax ="";
       

    }
}