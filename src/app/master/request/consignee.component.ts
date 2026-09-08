import{Component,OnInit,ViewChild, ɵConsole} from '@angular/core';
import{ActivatedRoute,Router} from '@angular/router';
import{DataService} from '../../shared/service/dataService';
import{AuthService} from '../../shared/service/authService';
import { LoginService } from '../../shared/service/loginService';
import { ToastCommonService } from '../../shared/service/toastService';
import { LoaderService } from '../../shared/service/loader.service';
import { IMyDpOptions } from 'mydatepicker';
import { HttpClient, HttpEventType,   } from '@angular/common/http'; 
import { Configuration } from '../../app.constants';
import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';
@Component({
    selector: 'app-masterconsignee',
    templateUrl: 'consignee.component.html'

})
export class consigneemaster  implements OnInit  { 
    document_Array: Array<any> = [];
    CHECK : any=null;CHECKB : any =null;CHECKC1 : any =null;CHECKC2 : any =null;CHECKC3 : any =null;CHECKC4 : any =null;  
    Header: string="Consignee Details"
    cons_id :string="0";con_code : string;
    ShrtName : string=""; panno : string="";title : string="Messrs";Name : string=""; EORIno : string="";
    addrs1: string=""; addrs2: string=""; addrs3: string="";  position: string="After"; Pincode: string="";
    city: string="";country : string=""; email : string=""; telephone: string="";   faxno1: string=""; 
    Ctitle1 : string="Mr.";  Cname1 : string="";  CDesignation1: string=""; Ctelphone1 : string="";
    Cfaxno1: string="";  Cmobileno1: string=""; Cemail1  : string="";
    Ctitle2  : string="Mr."; Cname2 : string="";  CDesignation2 : string=""; Ctelphone2: string="";
    Cfaxno2: string="";   Cmobileno2: string=""; Cemail2: string="";
    Ctitle3  : string="Mr."; Cname3 : string="";  CDesignation3 : string="";  Ctelphone3: string="";
    Cfaxno3: string="";  Cmobileno3: string="";  Cemail3: string="";
    Ctitle4  : string="Mr.";  Cname4 : string="";  CDesignation4 : string="";  Ctelphone4: string="";
    Cfaxno4: string=""; Cmobileno4: string="";  Cemail4: string="";
    isappr:string ="Y";list : string="";documentlist:any=[];
    Citylist:any=[];listcnt: any;countrycode :string;queryParamsReqType: string = "";exp_doc :any=[];
    CNFsourceagt : string="";CNFrance: string=""; CNFothers: string="Y"; 
    queryParamsConcode: string = "";populatelist :string;
         text: string="Submit"

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
    constructor(
        private _activatedRoute: ActivatedRoute,
        private _router: Router,
        private _dataService: DataService,
        private _auth: AuthService,
        private _toasterService: ToastCommonService,
        private _loginService: LoginService,
        private loaderService: LoaderService,   
        private http: HttpClient,   
        private _configuration: Configuration
        

    ) {  
    }
   
    ngOnInit(){
        this._activatedRoute.params.subscribe(params => {
            this.queryParamsReqType = params["ReqType"];
            this.queryParamsConcode = params["ConCode"];
        })
    
        if (this.queryParamsReqType =='TEMP' && this.queryParamsConcode !=' ')
        {
            this._loginService.verifyRights(106, '')
            .subscribe((data: any) => { this._loginService.checkVerify('Modify', data); });
           // console.log(this._loginService.getLogin()[0].USERNAME);
            this.Header='CONSIGNEE DETAILS - UPDATE REQUEST';
           this.populateEdit();
        }
        else if (this.queryParamsReqType ==' ' && this.queryParamsConcode !=' ')
        {
            this._loginService.verifyRights(106, '')
            .subscribe((data: any) => { this._loginService.checkVerify('Modify', data); });
            this.Header= 'CONSIGNEE DETAILS - UPDATE';
            this.populateEdit();
          
        }
        else if (this.queryParamsReqType ==' ' && this.queryParamsConcode ==' ')
        {
            this._loginService.verifyRights(106, '')
            .subscribe((data: any) => { this._loginService.checkVerify('Add', data); });
            this.Header= 'CONSIGNEE DETAILS - ADD';
            //this.populateEdit();
        }
        else if (this.queryParamsReqType =='TEMP' && this.queryParamsConcode ==' ')
        {
           
            this.Header= 'CONSIGNEE DETAILS - REQUEST TO ADD';
        //   this.populateEdit();
        }
        this.loaderService.display(true);
        this._dataService.getAll("Common/GetFillcity")
        .subscribe((data: any) => {
            this.Citylist=data.Table;
        });
        this._dataService.getAll("Master/con_documentList_load")
        .subscribe((data: any) => {
            this.documentlist=data.Table;
          
        });
        this.loaderService.display(false);   
    }
    populateEdit()
    {
        this.text='Update';
        const jsonmaster = {concode:this.queryParamsConcode,RequestMode: this.queryParamsReqType}
        this._dataService.getData("Master/consignee_populate",jsonmaster)
        .subscribe((data: any) => {
            this.cons_id=data.Table[0].id  ;
            this.con_code=data.Table[0].con_code  ;
            this.ShrtName  = 	data.Table[0].con_sname  ;
            this.Name  = 	data.Table[0].con_name  ;
            this.title   = 	data.Table[0].con_title  ;
            this.addrs1   = 	data.Table[0].con_add1  ;
            this.addrs2   = 	data.Table[0].con_add2  ;
            this.addrs3   = 	data.Table[0].con_add3  ;
            this.email   = 	data.Table[0].con_email ;
            this.Pincode   = 	data.Table[0].con_pincode  ;
            this.position   = 	data.Table[0].con_pinposition  ;
            this.city   = 	data.Table[0].con_city  ;
            this.countrycode   = 	data.Table[0].con_country  ;
           this.country   = 	data.Table[0].city_country  ;
            this.telephone   = 	data.Table[0].con_telno  ;
            this.faxno1   = 	data.Table[0].con_faxno  ;
            this.Ctitle1   = 	data.Table[0].con_title1  ;
            this.Cname1   = 	data.Table[0].con_contact1  ;
            this.CDesignation1   = 	data.Table[0].con_designation1  ;
            this.Ctelphone1   = 	data.Table[0].con_telno1  ;
            this.Cfaxno1   = 	data.Table[0].con_faxno1  ;
            this.Cmobileno1   = 	data.Table[0].con_mobile1  ;
            this.Cemail1   = 	data.Table[0].con_cont1email  ;
            this.Ctitle2   = 	data.Table[0].con_title2 ;
            this.Cname2   = 	data.Table[0].con_contact2  ;
            this.CDesignation2   = 	data.Table[0].con_designation2  ;
            this.Ctelphone2   = 	data.Table[0].con_telno2  ;
            this.Cfaxno2   = 	data.Table[0].con_faxno2  ;
            this.Cmobileno2   = 	data.Table[0].con_mobile2  ;
            this.Cname3   = 	data.Table[0].con_contact3  ;
            this.Ctitle3   = 	data.Table[0].con_title3  ;
            this.Cname3   = 	data.Table[0].con_contact3  ;
            this.CDesignation3  = 	data.Table[0].con_designation3  ;
            this.Ctelphone3   = 	data.Table[0].con_telno3  ;
            this.Cfaxno3   = 	data.Table[0].con_faxno3  ;
            this.Cmobileno3   = 	data.Table[0].con_mobile3  ;
            this.Cname4   = 	data.Table[0].con_contact4  ;
            this.Ctitle4   = 	data.Table[0].con_title4  ;
            this.Cname4   = 	data.Table[0].con_contact4  ;
            this.CDesignation4   = 	data.Table[0].con_designation4 ;
            this.Ctelphone4   = 	data.Table[0].con_telno4  ;
            this.Cfaxno4   = 	data.Table[0].con_faxno4  ;
            this.Cmobileno4   = 	data.Table[0].con_mobile4  ;
            this.Cemail4   = 	data.Table[0].con_cont4email  ;
            this.isappr   = 	data.Table[0].approval  ;
            this.CNFsourceagt   = 	(data.Table[0].srcagt=='N')?null :data.Table[0].srcagt ;
            this.exp_doc   = 	data.Table[0].doccode  ;
            this.CNFrance   = 	(data.Table[0].cneefrance == 'N')? null : data.Table[0].cneefrance  ;
            this.CNFothers=	(data.Table[0].cneeothers =='N') ? null : data.Table[0].cneeothers  ;
            
            this.documentlist=data.Table1;
            
        });
    }
    getcollapse(chk,section)
    {   
        if (section=='bank')
        {
            if (chk=='null')
            {   this.CHECKB=true;
                this.CHECK='null';
                this.CHECKC1='null';
                this.CHECKC2='null';
                this.CHECKC3='null';
                this.CHECKC4='null';
            }
            else
            {this.CHECKB='null';}
        }
        if (section=='contact1')
        {
            if (chk=='null')
            {   this.CHECKC1=true;
                this.CHECK='null';
                this.CHECKB='null';
                this.CHECKC2='null';
                this.CHECKC3='null';
                this.CHECKC4='null';
            } 
            else
            {this.CHECKC1='null';}
        }
        if (section=='contact2')
        {
            if (chk=='null')
            {   this.CHECKC2=true;
                this.CHECK='null';
                this.CHECKB='null';
                this.CHECKC1='null';
                this.CHECKC3='null';
                this.CHECKC4='null'
                }
            else
            {this.CHECKC2='null';}
        }
        if (section=='contact3')
        {
            if (chk=='null')
            {   this.CHECKC3=true;
                this.CHECK='null';
                this.CHECKB='null';
                this.CHECKC1='null';
                this.CHECKC2='null';
                this.CHECKC4='null'
                }
            else
            {this.CHECKC3='null';}
        }
        if (section=='contact4')
        {
            if (chk=='null')
            {   this.CHECKC4=true;
                this.CHECK='null';
                this.CHECKB='null';
                this.CHECKC1='null';
                this.CHECKC2='null';
                this.CHECKC3='null'
                }
            else
            {this.CHECKC4='null';}
        }            
    }
    Countryfilter(citycode){       
        this.listcnt=this.Citylist.filter((cntrylist:any)=>cntrylist.DATAVALUEFIELD==citycode);
            this.country=this.listcnt[0].CITY_COUNTRY;
            this.countrycode=this.listcnt[0].ISO_COUNTRY_CODE;
    }
    chkonchange(citycode,chk,)
    {    
        if (chk==true){
        this.exp_doc=this.exp_doc+citycode  + ',';
        this.exp_doc=   this.exp_doc.replace(',,',',')
        }
        else{
            this.exp_doc=   this.exp_doc.replace(citycode,'')
            this.exp_doc=   this.exp_doc.replace(',,',',')
        }
    }
    onChange(emialid)
    {
        if(this._dataService.emailvalidation(emialid)==false){
            this._toasterService.toast('warning', 'warning', 'Enter Invalid E-mail !');
        }
    }

    CNFonchange(list,type)
    {
    if (type=='1'){
        if (list==true){
            this.CNFrance= 'Y'
            }
            //else { this.CNFrance= 'N'}
    }
    if (type=='2'){
        if (list==true){
            this.CNFothers= 'Y'
            }
           // else { this.CNFothers= 'N'}
    }
    if (type=='3'){
        if (list==true){
            this.CNFsourceagt= 'Y'
            }
         //   else { this.CNFsourceagt= 'N'}
    }
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
        if(this.city.normalize()==""){
            this._toasterService.toast('warning', 'warning', 'Please select City !');            
            return false;
        }
        this.loaderService.display(true);
        const jsonmaster = {
            id:  this.cons_id,
            con_sname: this.ShrtName.replace("'","`") , 
            con_name: this.Name.replace("'","`") , 
            con_title:this.title  , 
            con_add1: this.addrs1.replace("'","`")  , 
            con_add2: this.addrs2.replace("'","`")  , 
            con_add3: this.addrs3.replace("'","`")  , 
            con_email: this.email  , 
            con_pincode: this.Pincode  , 
            con_pinposition: this.position  , 
            con_city: this.city  , 
            con_country:  this.countrycode  , 
            con_telno: this.telephone  , 
            con_faxno: this.faxno1  , 
            con_title1: this.Ctitle1  , 
            con_contact1: this.Cname1.replace("'","`")  , 
            con_designation1: this.CDesignation1  , 
            con_telno1: this.Ctelphone1  , 
            con_faxno1: this.Cfaxno1  , 
            con_mobile1: this.Cmobileno1  , 
            con_cont1email: this.Cemail1  , 
            con_title2: this.Ctitle2  , 
            con_contact2: this.Cname2.replace("'","`")  , 
            con_designation2: this.CDesignation2  , 
            con_telno2: this.Ctelphone2  , 
            con_faxno2: this.Cfaxno2  , 
            con_mobile2: this.Cmobileno2  , 
            con_cont2email: this.Cname3  , 
            con_title3: this.Ctitle3  , 
            con_contact3: this.Cname3.replace("'","`")  , 
            con_designation3: this.CDesignation3 , 
            con_telno3: this.Ctelphone3  , 
            con_faxno3: this.Cfaxno3  , 
            con_mobile3: this.Cmobileno3  , 
            con_cont3email: this.Cname4  , 
            con_title4: this.Ctitle4  , 
            con_contact4: this.Cname4.replace("'","`")  , 
            con_designation4: this.CDesignation4  , 
            con_telno4: this.Ctelphone4  , 
            con_faxno4: this.Cfaxno4  , 
            con_mobile4: this.Cmobileno4  , 
            con_cont4email: this.Cemail4  , 
            con_approval: this.isappr  , 
            con_sourceagt: (this.CNFsourceagt =='')? 'N':this.CNFsourceagt , 
            con_doccode: this.exp_doc  , 
            con_cneefrance: (this.CNFrance =='')? 'N':this.CNFrance , 
            con_cneeothers: (this.CNFothers =='')? 'N':this.CNFothers, 
            MakerID  :this._loginService.getLogin()[0].CMPID  ,
            MakerIP :this._loginService.getLogin()[0].MAKERIP,
            cmp_code :this._loginService.getLogin()[0].CMPCODE,
            citycode :this._loginService.getLogin()[0].CITYCODE,
            RequestMode  :this.queryParamsReqType ,
            con_EORINUMBER:this.EORIno,
            
        }
        this._dataService.Common("Master/Consignee_IU", jsonmaster)
        .subscribe((data: any) => {
            if (data.Table[0].STATUS == "100") {
            this._toasterService.toast('success', 'success', 'Consignee saved successfully !');
                this.loaderService.display(false);
                this.RestMain();
            }
            else   if (data.Table[0].STATUS == "105")
            {
            if (confirm(data.Table[0].STATUSTEXT))
             {

                this._dataService.Common("Master/Consignee_IU", jsonmaster)
                .subscribe((data: any) => {
                    if (data.Table[0].STATUS == "100") {
                    this._toasterService.toast('success', 'success', 'Consignee saved successfully !');
                        this.loaderService.display(false);
                        this.RestMain();
                    }
                    else if (data.Table[0].STATUS == "105") {
                        this._toasterService.toast("warning","warning" ,'Add Consignee with different City & address '  );
                        this.loaderService.display(false);
                    }
        
                }); 
            }
            else
            {this.loaderService.display(false);
              return false}
        
        }
            else{   this._toasterService.toast("warning","warning" ,data.Table[0].STATUSTEXT )
                this.loaderService.display(false);}
        });  
    }
    RestMain()
    {
        this.ShrtName  =''; 
        this.Name  =''; 
        this.title   ='Messrs'; 
        this.addrs1   =''; 
        this.addrs2   =''; 
        this.addrs3   =''; 
        this.email   =''; 
        this.Pincode   =''; 
        this.position   =''; 
        this.city   =''; 
        this.countrycode   =''; 
        this.telephone   =''; 
        this.faxno1   =''; 
        this.Ctitle1   ='Mr'; 
        this.Cname1   =''; 
        this.CDesignation1   =''; 
        this.Ctelphone1   =''; 
        this.Cfaxno1   =''; 
        this.Cmobileno1   =''; 
        this.Cemail1   =''; 
        this.Ctitle2   ='Mr'; 
        this.Cname2   =''; 
        this.CDesignation2   =''; 
        this.Ctelphone2   =''; 
        this.Cfaxno2   =''; 
        this.Cmobileno2   =''; 
        this.Cname3   =''; 
        this.Ctitle3   ='Mr'; 
        this.Cname3   =''; 
        this.CDesignation3  =''; 
        this.Ctelphone3   =''; 
        this.Cfaxno3   =''; 
        this.Cmobileno3   =''; 
        this.Cname4   =''; 
        this.Ctitle4   ='Mr'; 
        this.Cname4   =''; 
        this.CDesignation4   =''; 
        this.Ctelphone4   =''; 
        this.Cfaxno4   =''; 
        this.Cmobileno4   =''; 
        this.Cemail4   =''; 
        this.isappr   =''; 
        this.CNFsourceagt   ='N'; 
        this.exp_doc   =[]; 
        this.CNFrance   ='N'; 
        this.CNFothers='N';
      
        this.documentlist=[];
        this.CNFrance=null;
        this.CNFothers=null;
        this.CNFsourceagt=null;
       // if(this.queryParamsReqType=="Exporter"){
            this._router.navigate(['/master/request/consignee/'+ this.queryParamsReqType  +' / ']);
       /// }
    }

}