    import{Component,OnInit,ViewChild} from '@angular/core';
    import{ActivatedRoute,Router} from '@angular/router';
    import{DataService} from '../../shared/service/dataService';
    import{AuthService} from '../../shared/service/authService';
    import { LoginService } from '../../shared/service/loginService';
    import { ToastCommonService } from '../../shared/service/toastService';
    import { LoaderService } from '../../shared/service/loader.service';
    import { IMyDpOptions } from 'mydatepicker';
    import { HttpClient   } from '@angular/common/http';
    import { Configuration } from '../../app.constants';
    import { IfStmt } from '@angular/compiler';
    
    @Component({
        selector: 'app-mastersupplier',
        templateUrl: 'supplier.component.html'

    })  

    export class suppliermaster  implements OnInit  { 
        CHECKC1 : any =null;CHECKC2 : any =null;CHECKC3 : any =null;CHECKC4 : any =null; CHECKC5 :any =null;
        Header: string="Supplier Details";teleno: string="";nofax:string="";
        ShrtName : string=""; panno : string="";title : string="Messrs";Name : string=""; EORIno : string="";
        addrs21 : string=""; addrs22 : string=""; addrs23: string="";
        position2:string="After"; Pincode2 : string=""; city2 : string="";  state: string=""; country2: string="";
        GST: string="gst"; GstNo : string=""; ARNNo: string=""; title1 : string="Mr.";  person: string=""; 
        telephone: string="";  mobile: string=""; email : string=""; 
        servtaxno: string="";  tanno: string="";  
        Ctitle1 : string="Mr.";  Cname1 : string="";  CDesignation1: string=""; Ctelphone1 : string="";
        Cfaxno1: string="";  Cmobileno1: string=""; Cemail1  : string="";
        Ctitle2  : string="Mr."; Cname2 : string="";  CDesignation2 : string=""; Ctelphone2: string="";
        Cfaxno2: string="";   Cmobileno2: string=""; Cemail2: string="";
        Ctitle3  : string="Mr."; Cname3 : string="";  CDesignation3 : string="";  Ctelphone3: string="";
        Cfaxno3: string="";  Cmobileno3: string="";  Cemail3: string="";
        Ctitle4  : string="Mr.";  Cname4 : string="";  CDesignation4 : string="";  Ctelphone4: string="";
        Cfaxno4: string=""; Cmobileno4: string="";  Cemail4: string="";itcgrpcode:string="";exphouseno : string="";
        listcnt: any;statetinno : string="";CitycodeA : string=""; Airlinecode: string="";
        Citylist:any=[];gstlist:any=[];citybranchlict:any[];  
        TmpcitybranchObject: any = {};
        childrecdid: string="0";sup_id: string="0"; queryParamsReqType: string = "";quryParamsSupCode:string="";
        validEmail:boolean = false;
        exphousedt   : any = ""; exphouse : any =""; bnkDivision: string="";
        sup_city :any=[]; 
        fileData: File = null;
        uploadedFilePath: string = null;    
        localUrl: any[];
        text: string="Submit";
        countrycode :string; expcountrycode :string;
        Concode :string="";Airline :string="";   AirlineAgent :string="";    shipAgent :string="";  warehousse :string="";
        Tranporter :string="";   BusAssociate :string="";    Franwarehouse :string="";   other :string="";IS_gst_reg :boolean =true;fksup_code :string=""
        txtchild : string ="Add";TdsList :any=[];
        txtchildTDS: string="Add";
        IS_TDSApp :boolean =true;tdstype : string="";
        frmdt: any = ""; todt: any = "";sections: string="";secRate: string="0";tdsLimit : string="0";Pk_Tdsid : string="0";
        Sectionlist: any=[]
        public isLoadingData: Boolean = false;
        public disableldcrate: Boolean = true;
        ldcRate:string="0";
        CompanyList:any[];  
        Company : string="";
        public disablecompany :Boolean = true;
        public disablelimitamt:Boolean=true;
        public disablecertno:Boolean=true;
        LdccertNo:string;
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

        ngOnInit()
        {
        this._activatedRoute.params.subscribe(params => {
            this.queryParamsReqType = params["ReqType"];
            this.quryParamsSupCode=params["SupCode"];
            })
        const jsonmaster = {  CMPID:this._loginService.getLogin()[0].CMPID }
        this.loaderService.display(true);
        this._dataService.getData("Master/Supplierpageload",jsonmaster)
        .subscribe((data: any) => {
          this.Sectionlist=data.Table;
        });
        this.loaderService.display(true);
        this._dataService.getAll("Common/GetFillcity")
        .subscribe((data: any) => {
            this.Citylist=data.Table;
        });
        this._dataService.getAll("Master/Fill_BranchCity")
        .subscribe((data: any) => {
            this.citybranchlict=data.Table;
            this.loaderService.display(false);
        });
        this._dataService.getAll("Common/FillCompany")
        .subscribe((data: any) => {
            this.CompanyList=data.Table;
            this.loaderService.display(false);
        });

     
       if (this.queryParamsReqType =='TEMP' && this.quryParamsSupCode !=' ')
        {
            this._loginService.verifyRights(105, '')
            .subscribe((data: any) => { this._loginService.checkVerify('Modify', data); });
            this.Header='SUPPLIER DETAILS - UPDATE REQUEST';
            this.editpopulate();
        }
        else if (this.queryParamsReqType ==' ' && this.quryParamsSupCode !=' ')
        {
            this._loginService.verifyRights(105, '')
            .subscribe((data: any) => { this._loginService.checkVerify('Modify', data); });
          this.Header= 'SUPPLIER DETAILS - UPDATE';
            this.editpopulate();
           
        }
        if (this.queryParamsReqType =='TEMP' && this.quryParamsSupCode ==' ')
            {   
                // this._loginService.verifyRights(105, '')
                // .subscribe((data: any) => { this._loginService.checkVerify('Add', data); });
                this.Header=  'SUPPLIER DETAILS - REQUEST TO ADD';}
        if (this.queryParamsReqType ==' ' && this.quryParamsSupCode ==' ')
        {
            this._loginService.verifyRights(105, '')
            .subscribe((data: any) => { this._loginService.checkVerify('Add', data); });
          this.Header= 'SUPPLIER DETAILS - ADD';
         
        }
    }
    checkValue(event: any){
        console.log(event);
     }

    getcollapse(chk,section)
    {        
        if (section=='contact1')
        {
            if (chk=='null')
            {   this.CHECKC1=true;                
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
                this.CHECKC1='null';
                this.CHECKC3='null';
                this.CHECKC4='null';                   
            }
            else
            {this.CHECKC2='null';}
        }
        if (section=='contact3')
        {
            if (chk=='null')
            {   this.CHECKC3=true;
                this.CHECKC1='null';
                this.CHECKC2='null';
                this.CHECKC4='null';               
             }
            else
            {this.CHECKC3='null';}
        }
        if (section=='contact4')
        {
            if (chk=='null')
            {   this.CHECKC4=true;
                this.CHECKC1='null';
                this.CHECKC2='null';
                this.CHECKC3='null';             
              }
            else
            {this.CHECKC4='null';}
        }            
    }

    Countryfilter(citycode,type){       
        this.listcnt=this.Citylist.filter((cntrylist:any)=>cntrylist.DATAVALUEFIELD==citycode);      
        if (type=='INV'){
            this.state=this.listcnt[0].STATE_NAME;
            this.country2=this.listcnt[0].CITY_COUNTRY;
            this.statetinno=this.listcnt[0].STATE_NO;
            this.countrycode=this.listcnt[0].ISO_COUNTRY_CODE;
        }
    }

    onChange(emialid)
    {
        if(this._dataService.emailvalidation(emialid)==false){
            this._toasterService.toast('warning', 'warning', 'Enter Invalid E-mail !');
        }
    }


  Tanchange() {
    if(this.tanno!=''){
        let Tan_3,Tan_5,Tan_9;
        Tan_3=this.tanno.substring(0,4) 
        Tan_5=this.tanno.substring(4,9); 
        Tan_9=this.tanno.substring(9,10); 
        if(this.tanno.length<10){
        this._toasterService.toast('warning', 'warning', 'TAN No Should be 10 characters !');            
        return false;
        }
        const validTanAlphaRegEx =/^[A-Za-z]+$/;
        if (validTanAlphaRegEx.test(Tan_3)) {
        }
        else {
        this._toasterService.toast('warning', 'warning','TAN No first 4 characters should be an Alphabet');
        return false;
        }
        const validTanNumRegEx =/^[0-9]*$/;
        if (validTanNumRegEx.test(Tan_5)) {
        }
        else {
        this._toasterService.toast('warning', 'warning','TAN No 4-9 characters should be Numeric');
        return false;
        }
        
        if (validTanAlphaRegEx.test(Tan_9)) {
        }
        else {
        this._toasterService.toast('warning', 'warning','TAN No last characters should be an Alphabet');
        return false;
        }
    }
  }

    chkonchange(citycode,chk)
    {
    
            if (chk==true){
            this.sup_city=this.sup_city + ','+citycode ;
            this.sup_city=   this.sup_city.replace(',,',',')
            }
            else{
                this.sup_city=   this.sup_city.replace(citycode,'')
                this.sup_city=   this.sup_city.replace(',,',',')
            }
        
    }

    Addcildrcrd()
    {
        if (this.country2=='INDIA')
        {
            let isgstreg: string ;
            if (this.IS_gst_reg==true)
            {
                if(this.GstNo!=''){
                    if(this.GstNo.length !=15){
                    this._toasterService.toast('warning', 'warning', 'GST No Should be 15 characters !');
                        return false;
                    }
                    else if (this.GstNo.length ==15){
                    isgstreg=this.GstNo.substring(0,2);
                    this.Countryfilter(this.city2,"INV")
                    if (this.statetinno!=isgstreg)
                    {
                        this._toasterService.toast('warning', 'warning', 'Invalid GST No. for ' + this.state + " . Please enter the GST No. Starting Two digit match with state code is " + this.state);
                        return false;
                    }
                    }
                }
                else{
                this._toasterService.toast('warning', 'warning', 'GST No Should not be blank !');
                return false;
                }
            }
            else{
                if (confirm('Are you sure want add without GST!'))
                { }
                else{return false;}
            }

        }
        else if(this.country2==''){
            this._toasterService.toast('warning', 'warning', 'Please Select City to add invoice address.');
            return false;
        }
        this.loaderService.display(true);
        const jsonmasterchild = {Pk_SupAdd_Id: this.childrecdid, fksup_code:this.fksup_code, sup_add1 :this.addrs21.replace("'","`") , sup_add2: this.addrs22.replace("'","`"), 
        sup_add3: this.addrs23.replace("'","`"), sup_pincode: this.Pincode2, sup_position: this.position2,sup_city: this.city2, 
        TelNo: this.teleno, FaxNo: this.nofax, sup_GSTNO: this.GstNo, sup_GSTARNNO: this.ARNNo,  sup_GSTcontP:this.person , 
        sup_GSTtelno:this.telephone ,   sup_GSTMobno: this.mobile,   sup_GSTcontemail: this.email, sup_GSTtitle:this.title1 , 
        vguid: this._loginService.getLogin()[0].GUID , MakerID: this._loginService.getLogin()[0].CMPID, MakerIP :this._loginService.getLogin()[0].MAKERIP , 
        maineSupid: this.sup_id,    reqmode: this.queryParamsReqType,
        IS_Gst_Reg:(this.IS_gst_reg==true)? '1' : '0'
        }
        this._dataService.Common("Master/SUPPLIER_CHILD_IU", jsonmasterchild)
        .subscribe((data: any) => {
        if (data.Table[0].STATUS == "100") {
            this.gstlist=data.Table1;
            this.loaderService.display(false);
            this.Resetcildrcrd();
        }
        else{   this._toasterService.toast("warning","warning" ,data.Table[0].STATUSTEXT )
            this.loaderService.display(false);}
        this.txtchild="Add";
        });    
    }
    Resetcildrcrd(){
    this.childrecdid ="0";
    this.addrs21="";
    this.addrs22="";
    this.addrs23="";
    this.Pincode2="";
    this.position2="";
    this.city2="";
    this.GstNo="";
    this.ARNNo ="";
    this.title1="Mr.";
    this.person="";
    this.telephone="";
    this.mobile="";
    this.email="";
    this.teleno="";
    this.nofax="";
    this.country2="";
    this.state="";
    this.txtchild="Add";
    }
     Editchildrecd(id)
     {
        let filterData = this.gstlist.filter((filter) => filter.ID == id)[0]; 
        this.childrecdid=id;
        this.fksup_code=filterData.SUP_CODE;
        this.addrs21=filterData.PURDD1;
        this.addrs22=filterData.PURADD2;
        this.addrs23=filterData.PURADD3;
        this.Pincode2=filterData.PURINCODE;
        this.position2=filterData.PURPINPOS;
        this.city2=filterData.INVCITY;
        this.state=filterData.PURSTATE;
        this.country2=filterData.PURCOUNTRY;
        this.statetinno=filterData.PURSTATETIN;
        this.teleno=filterData.TelePhone_No;
        this.nofax=filterData.Fax_No;
        this.GstNo=filterData.GST_NO;
        this.ARNNo =filterData.GST_ARNNO;
        this.title1=filterData.GSTTITLE;
        this.person=filterData.GSTCONTP;
        this.telephone=filterData.GSTTELNO;
        this.mobile=filterData.GSTMOBNO;
        this.email=filterData.GSTCONTEMAIL;
        this.statetinno=filterData.PURSTATETIN;
        this.IS_gst_reg=(filterData.IS_GST_Registered=='1')? true : false;
       
        this.txtchild="Update";
        
     }

     deletetmpchildrecd(id){
        if(confirm('Are you sure want to delete the record ?'))
        {   this.loaderService.display(true);
       const jsonmaster = { id  : id,guid :this._loginService.getLogin()[0].GUID ,
                            makerid :this._loginService.getLogin()[0].CMPID,
                            Mode:this.queryParamsReqType,SUP_CODE:this.quryParamsSupCode}
        this._dataService.getData("Master/supplier_TempAddress_delete", jsonmaster)
        .subscribe((data: any) => {
           if (data.Table[0].STATUS == "100") {
               this.gstlist=data.Table1;
               this._toasterService.toast("success","success" ,data.Table[0].STATUSTEXT  );
               this.loaderService.display(false);
           }
           else{   this._toasterService.toast("warning","warning" ,data.Table[0].STATUSTEXT  );
           this.loaderService.display(false);
   }
        }); 
       }
       else{return false;  }
       this.loaderService.display(false);
    }  
    deletedtlrecd(id,ISPI)
    {
        if (this.queryParamsReqType =='TEMP' && (this.quryParamsSupCode ==' ' || this.quryParamsSupCode !=' '))
        {
           this.deletetmpchildrecd(id); 
        }
        if (this.queryParamsReqType ==' ' && (this.quryParamsSupCode ==' ' || this.quryParamsSupCode !=' '))
        {
           this.deletechildrecd(id,ISPI); 
        }
    }
    deletechildrecd(id,ISPI){
        if(ISPI=="1"){
            this._toasterService.toast("warning","warning" ,"Already used in Purchase!"  );
            return false;
        }    
        else  if (ISPI=="0"){
            if(confirm('Are you sure want to delete the record ?'))
            {   this.loaderService.display(true);
           const jsonmaster = { id  : id,guid :this._loginService.getLogin()[0].GUID ,
           makerid :this._loginService.getLogin()[0].CMPID,Mode:'',
           SUP_CODE:this.quryParamsSupCode}
           this._dataService.getData("Master/supplier_Address_delete", jsonmaster)
            .subscribe((data: any) => {
               if (data.Table[0].STATUS == "100") {
                   this.gstlist=data.Table1;
                   this._toasterService.toast("success","success" ,data.Table[0].STATUSTEXT  );
                   this.loaderService.display(false);
               }
                 else{   this._toasterService.toast("warning","warning" ,data.Table[0].STATUSTEXT  );
                    this.loaderService.display(false);
                     }
            }); 
        }
       
       }
       else{return false; }
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
         if (this.Airline=='Y')
         {
             if(this.Airlinecode==''){
                this._toasterService.toast('warning', 'warning', 'Please enter Airline code !');            
                return false;
             }
         }
         if (this.IS_TDSApp ==true)
         {
             if(this.panno==''){
                this._toasterService.toast('warning', 'warning', 'Pan cardno is compulsory for TDS Applicable !');            
                return false;
             }
         }
         this.loaderService.display(true);
         const jsonmaster = {
        id :  this.sup_id, 
        sup_sname:this.ShrtName.replace("'","`")   , 
        sup_name:this.Name.replace("'","`")  , 
        sup_title:this.title,sup_add1:this.addrs21,sup_add2:this.addrs22,sup_add3:this.addrs23,sup_email:this.email,
        sup_pincode:this.Pincode2,sup_pinposition:this.position2,sup_city:this.city2, sup_country:this.country2, 
        sup_telno:this.teleno, sup_faxno:this.nofax , 
        sup_title1:this.Ctitle1   , 
        sup_contact1:this.Cname1.replace("'","`")   , 
        sup_designation1:this.CDesignation1   , 
        sup_telno1:this.Ctelphone1  , 
        sup_faxno1:this.Cfaxno1   , 
        sup_mobile1:this.Cmobileno1   , 
        sup_cont1email:this.Cemail1   , 
        sup_title2:this.Ctitle2   , 
        sup_contact2:this.Cname2   , 
        sup_designation2:this.CDesignation2  , 
        sup_telno2:this.Ctelphone2   , 
        sup_faxno2:this.Cfaxno2   , 
        sup_mobile2:this.Cmobileno2   , 
        sup_cont2email:this.Cemail2   , 
        sup_title3:this.Ctitle3  , 
        sup_contact3:this.Cname3.replace("'","`")   , 
        sup_designation3:this.CDesignation3   , 
        sup_telno3:this.Ctelphone3  , 
        sup_faxno3:this.Cfaxno3   , 
        sup_mobile3:this.Cmobileno3   , 
        sup_cont3email:this.Cemail3   , 
        sup_title4:this.Ctitle4  , 
        sup_contact4:this.Cname4.replace("'","`")   , 
        sup_designation4:this.CDesignation4   , 
        sup_telno4:this.Ctelphone4  , 
        sup_faxno4:this. Cfaxno4  , 
        sup_mobile4:this.Cmobileno4   , 
        sup_cont4email:this.Cemail4   , 
        airline:this.Airline   , 
        airlineagent:this.AirlineAgent   , 
        shippingline:this.shipAgent  , 
        warehouse:this.warehousse   , 
        transporter:this.Tranporter   , 
        agent:this.BusAssociate   , 
        fwarehouse:this.Franwarehouse   , 
        others:this.other   , 
        sup_airlinecode:this.Airlinecode   , 
        agentcity:this.CitycodeA   , 
        city:this.sup_city   , 
        sup_panno:this.panno   , 
        sup_servicetax:this.servtaxno   , 
        cmpid:this._loginService.getLogin()[0].CMPID  , 
        MakerIP:this._loginService.getLogin()[0].MAKERIP   , 
        cmp_code:this._loginService.getLogin()[0].CMPCODE   , 
        citycode:this._loginService.getLogin()[0].CITYCODE   , 
        RequestMode:this.queryParamsReqType   ,
        sup_EORINUMBER:this.EORIno   , 
        Sup_TANNO:this.tanno  ,  sup_GSTNO:'', sup_GSTARNNO: '',   sup_GSTtitle:'', sup_GSTcontP:'', sup_GSTtelno:'',  sup_GSTMobno:'',sup_GSTcontemail:''   , 
        vguid: this._loginService.getLogin()[0].GUID ,
        IS_TDS: (this.IS_TDSApp==true) ?'1':'0'
         }
         this._dataService.Common("Master/SUPPLIER_MASTER_IU", jsonmaster)
         .subscribe((data: any) => {
            if (data.Table[0].STATUS == "100") {
                 if (this.queryParamsReqType =='TEMP' && this.quryParamsSupCode ==' ')
                     { this._toasterService.toast('success', 'success', 'Requst Supplier added successfully !');   }
                 else  if (this.queryParamsReqType =='TEMP' && this.quryParamsSupCode !=' ')
                     { this._toasterService.toast('success', 'success', 'Requst Supplier Authorised successfully !');}
                 else  if (this.queryParamsReqType ==' ' && this.quryParamsSupCode !=' ')
                     { this._toasterService.toast('success', 'success', 'Supplier update successfully !');}
                 else  if (this.queryParamsReqType ==' ' && this.quryParamsSupCode ==' ')
                     { this._toasterService.toast('success', 'success', 'Supplier added successfully !');   }
                this.loaderService.display(false);
                this.RestMain();
            }
            else{   this._toasterService.toast("warning","warning" ,data.Table[0].STATUSTEXT )
                this.loaderService.display(false);}
         });  
     }

     RestMain()
     {
         this.Resetcildrcrd();
         const jsonmaster = {  CMPID:this._loginService.getLogin()[0].CMPID }
         this.loaderService.display(true);
         this._dataService.getData("Master/Supplierpageload",jsonmaster)
         .subscribe((data: any) => {
            // this.Citylist=data.Table;
         });
        this.ShrtName ='';  
        this.Name ='';  
        this.panno ='';     
        this.EORIno  =''; 
        this.addrs21  =''; 
        this.addrs22 =''; 
        this.addrs23 =''; 
        this.Pincode2  =''; 
        this.position2  =''; 
        this.city2 =''; 
        this.country2 =''; 
        this.teleno  =''; 
        this.nofax ='';        
        this.exphouse =''; 
        this.exphousedt 
        this.exphouse 
        this.itcgrpcode  ='';           
        this.servtaxno ='';
        this.tanno='';                
        this.Ctitle1 ='Mr.'; 
        this.Cname1   =''; 
        this.Cemail1 =''; 
        this.Ctelphone1  =''; 
        this.Cfaxno1  ='';
        this.CDesignation1 ='';
        this.Cmobileno1 ='';        
        this.Ctitle2  ='Mr.'; 
        this.Cname2 ='';         
        this.Cemail2  =''; 
        this.Ctelphone2  =''; 
        this.Cfaxno2  ='';
        this.CDesignation2 =''; 
        this.Cmobileno2='';       
        this.Ctitle3  ='Mr.'; 
        this.Cname3 =''; 
        this.Cemail3  =''; 
        this.Ctelphone3 =''; 
        this.Cfaxno3 =''; 
        this.CDesignation3 ='';
        this.Cmobileno3 ='';       
        this.Ctitle4  ='Mr.';
        this.Cname4 =''; 
        this.Cemail4 =''; 
        this.Ctelphone4 =''; 
        this.Cfaxno4  =''; 
        this.CDesignation4='';
        this.Cmobileno4 ='';
        this.sup_city  ='';        
        this.gstlist=[];               
        this._router.navigate(['/master/request/supplier/'+ this.queryParamsReqType  +'/ ']);        
        this.loaderService.display(false);
        this.text='Submit';
        this.TdsList=[];
     }
    
    editpopulate()
    {
        this.text='Update';
        const jsonmaster = { fkSup_code  : this.quryParamsSupCode,RequestMode :this.queryParamsReqType,makerid:this._loginService.getLogin()[0].CMPID,vguid:this._loginService.getLogin()[0].VGUID}
        this._dataService.getData("Master/Master_supplier_Populate", jsonmaster)
            .subscribe((data: any) => {
            if (data.Table[0].STATUS == "100") {
            this.sup_id=    data.Table[0].ID    ; 
            this.fksup_code= data.Table[0].SUP_CODE;
            this.ShrtName  =    data.Table[0].SUP_SNAME    ; 
            this.title=    data.Table[0].SUP_TITLE    ; 
            this.Name =    data.Table[0].SUP_NAME    ; 
            this.panno =    data.Table[0].SUP_PANNO    ;    
            this.EORIno   =    data.Table[0].EORI_NUMBER ;  
            this.addrs21  =    data.Table[0].SUP_ADD1   ; 
            this.addrs22 =    data.Table[0].SUP_ADD2   ; 
            this.addrs23 =    data.Table[0].SUP_ADD3    ; 
            this.Pincode2  =    data.Table[0].SUP_PINCODE    ; 
            this.position2  =    data.Table[0].SUP_PINPOSITION   ; 
            this.city2 =    data.Table[0].SUP_CITY ; 
            this.countrycode =    data.Table[0].SUP_COUNTRY; 
            this.country2= data.Table[0].CITY_COUNTRY; 
            this.teleno  =    data.Table[0].SUP_TELNO; 
            this.nofax  =    data.Table[0].SUP_FAXNO; 
           // this.email= data.Table[0].SUP_EMAIL;     
            this.GstNo = data.Table[0].SUP_GSTNO;   
            this.ARNNo=   data.Table[0].SUP_GSTARNNO;   
            this.title1= data.Table[0].SUP_GSTTITLE;   
            this.person= data.Table[0].SUP_GSTCONTP;   
            this.telephone=data.Table[0].SUP_GSTTELNO
            this.mobile=data.Table[0].SUP_GSTMOBNO
            this.email= data.Table[0].SUP_GSTCONTEMAIL; 
            
            this.servtaxno =    data.Table[0].SUP_SERVICETAX    ;
            this.tanno=    data.Table[0].SUP_TANNO    ;    
            this.Ctitle1 =    data.Table[0].SUP_TITLE1   ; 
            this.Cname1   =    data.Table[0].SUP_CONTACT1    ; 
            this.Cemail1 =    data.Table[0].SUP_CONT1EMAIL    ; 
            this.Ctelphone1  =    data.Table[0].SUP_TELNO1    ; 
            this.Cfaxno1  =    data.Table[0].SUP_FAXNO1    ;
            this.CDesignation1 =    data.Table[0].SUP_DESIGNATION1    ;
            this.Cmobileno1 =    data.Table[0].SUP_MOBILE1    ; 
            this.Ctitle2  =    data.Table[0].SUP_TITLE2    ; 
            this.Cname2 =    data.Table[0].SUP_CONTACT2    ; 
            this.Cemail2  =    data.Table[0].SUP_CONT2EMAIL    ; 
            this.Ctelphone2  =    data.Table[0].SUP_TELNO2    ; 
            this.Cfaxno2  =    data.Table[0].SUP_FAXNO2    ;
            this.CDesignation2 =    data.Table[0].SUP_DESIGNATION2    ; 
            this.Cmobileno2=    data.Table[0].SUP_MOBILE2    ;
            this.Ctitle3  =    data.Table[0].SUP_TITLE3    ; 
            this.Cname3 =    data.Table[0].SUP_CONTACT3    ; 
            this.Cemail3  =    data.Table[0].SUP_CONT3EMAIL    ; 
            this.Ctelphone3 =    data.Table[0].SUP_TELNO3    ; 
            this.Cfaxno3 =    data.Table[0].SUP_FAXNO3    ; 
            this.CDesignation3 =    data.Table[0].SUP_DESIGNATION3    ;
            this.Cmobileno3 =    data.Table[0].SUP_MOBILE3    ;    
            this.Ctitle4  =    data.Table[0].SUP_TITLE4    ;
            this.Cname4 =    data.Table[0].SUP_CONTACT4    ; 
            this.Cemail4 =    data.Table[0].SUP_CONT4EMAIL    ; 
            this.Ctelphone4 =    data.Table[0].SUP_TELNO4    ; 
            this.Cfaxno4  =    data.Table[0].SUP_FAXNO4    ;          
            this.CDesignation4=    data.Table[0].SUP_DESIGNATION4    ;
            this.Cmobileno4 =    data.Table[0].SUP_MOBILE4    ;
            this.sup_city=data.Table[0].CITY;             
            this.Airlinecode=    data.Table[0].AIRLINECODE; 
            this.CitycodeA=data.Table[0].AGENTCITY;
            this.Airline=data.Table[0].AIRLINE;
            this.AirlineAgent=data.Table[0].AIRLINEAGT;
            this.shipAgent=data.Table[0].SHIPPINGLINE;
            this.warehousse=data.Table[0].WAREHOUSE;
            this.Tranporter=data.Table[0].TRANSPORTER;
            this.BusAssociate=data.Table[0].AGENT;
            this.Franwarehouse=data.Table[0].FWAREHOUSE;
            this.other=data.Table[0].OTHERS;
            this.statetinno=data.Table[0].PURSTATETIN;
            this.state=data.Table[0].STATE_NAME;
            this.IS_TDSApp=(data.Table[0].IS_TDS_APP=='1')?true:false;
            this.gstlist= data.Table1;         
            this.TdsList=data.Table2; 
            this.citybranchlict=data.Table3; 
            this.loaderService.display(false);
            }
            else{   this._toasterService.toast("warning","warning" ,data.Table[0].STATUSTEXT )
            this.loaderService.display(false);}
            })
    }

    AddTDScildrcrd()
     {
        if (this.countrycode=='INDIA' || this.countrycode=='IN')
        {
            if(this.IS_TDSApp==false){
                this._toasterService.toast("warning","warning" ,"Please select Tds Details first" )
                return false;
            }
            let isTDSapp: string ;
            if (this.IS_TDSApp==true)
            {
                if (this.sections==""){
                    this._toasterService.toast("warning","warning" ,"Please select section");
                    return false;
                }
                if (this.secRate==""){
                    this._toasterService.toast("warning","warning" ,"Please enter Base rate");
                    return false;
                }
                let fr_dt ,to_dt;
                if (this.frmdt == "") { fr_dt = "" } else { fr_dt = this.frmdt.formatted; }
                if (this.todt == "")  { to_dt = "" } else { to_dt = this.todt.formatted; }
             
                if (fr_dt==""){
                    this._toasterService.toast("warning","warning" ,"Please select From date");
                    return false
                    0;
                }
                if (to_dt==""){
                    this._toasterService.toast("warning","warning" ,"Please select To date");
                    return false;
                }
               
              
                if (this.tdstype==""){
                    this._toasterService.toast("warning","warning" ,"Please select TDS Type");
                    return false;
                }
                if (this.tdstype=="BRC" && this.secRate=="0"){
                    this._toasterService.toast("warning","warning" ,"Please enter Base % Rate");
                    return false;
                }
                if (this.tdstype=="LDC" && this.secRate==""){
                    this._toasterService.toast("warning","warning" ,"Please enter Base % rate");
                    return false;
                }
                if (this.tdstype=="LDC" && this.ldcRate=="0"){
                    this._toasterService.toast("warning","warning" ,"Please select LDS % Rate");
                    return false;
                }
                if (this.tdstype=="LDC" && this.tdsLimit=="0"){
                    this._toasterService.toast("warning","warning" ,"Please enter amount limit");
                    return false;
                }
                if (this.tdstype=="LDC" && (this.Company=="0" || this.Company=="")){
                    this._toasterService.toast("warning","warning" ,"Please select company");
                    return false;
                }
                if (this.tdstype=="LDC" && (this.LdccertNo=="" || this.LdccertNo==undefined)){
                    this._toasterService.toast("warning","warning" ,"Please enter Certificate No.");
                    return false;
                }
                
                this.loaderService.display(true);
                const jsonmasterTDS = {  PKID: this.Pk_Tdsid ,ID: this.sup_id,
                    SUP_CODE:this.quryParamsSupCode  , SECTIONID:this.sections  ,
                    PER_RATE:this.secRate  , FRMDT: fr_dt , TODT: to_dt ,
                    TDS_LIMIT_AMT: this.tdsLimit , TDS_TYPE: this.tdstype , 
                    MAKERID: this._loginService.getLogin()[0].CMPID   , 
                    MAKERIP:  this._loginService.getLogin()[0].MAKERIP,
                    VGUID:  this._loginService.getLogin()[0].GUID,MODEOFENTRY: this.queryParamsReqType,
                    LDCRATE:(this.ldcRate==undefined)?"0" :this.ldcRate,
                    CMPCODE:(this.Company=="")?"0" :this.Company,
                    reqmode: this.queryParamsReqType,
                    LDCCERTNO:(this.LdccertNo=="")?"0" :this.LdccertNo,
                }
                this._dataService.Common("Master/SUPPLIER_CHILD_TDS_IU_NG", jsonmasterTDS)
                .subscribe((data: any) => {
                if (data.Table[0].STATUS == "100") {
                    this.TdsList=data.Table1;
                    this.loaderService.display(false);
                   this.ResetTDScildrcrd();
                   this.txtchild="Add";
                }
                else{   this._toasterService.toast("warning","warning" ,data.Table[0].STATUSTEXT )
                    this.loaderService.display(false);}
                this.txtchild="Add";
                });   

            }
         
            } 
             else{   this._toasterService.toast("warning","warning" ,"TDS only applicable for India" )
             this.loaderService.display(false);}
        }
        AddTDScildrcrd_old()
        {
           if (this.countrycode=='INDIA' || this.countrycode=='IN')
           {
               if(this.IS_TDSApp==false){
                   this._toasterService.toast("warning","warning" ,"Please select Tds Details first" )
                   return false;
               }
               let isTDSapp: string ;
               if (this.IS_TDSApp==true)
               {
                   if (this.sections==""){
                       this._toasterService.toast("warning","warning" ,"Please select section");
                       return false;
                   }
                   if (this.secRate==""){
                       this._toasterService.toast("warning","warning" ,"Please enter Base rate");
                       return false;
                   }
                   let fr_dt ,to_dt;
                   if (this.frmdt == "") { fr_dt = "" } else { fr_dt = this.frmdt.formatted; }
                   if (this.todt == "")  { to_dt = "" } else { to_dt = this.todt.formatted; }
                
                   if (fr_dt==""){
                       this._toasterService.toast("warning","warning" ,"Please select From date");
                       return false
                       0;
                   }
                   if (to_dt==""){
                       this._toasterService.toast("warning","warning" ,"Please select To date");
                       return false;
                   }
                  
                 
                   if (this.tdstype==""){
                       this._toasterService.toast("warning","warning" ,"Please select TDS Type");
                       return false;
                   }
                   if (this.tdstype=="BRC" && this.secRate=="0"){
                       this._toasterService.toast("warning","warning" ,"Please enter Base % Rate");
                       return false;
                   }
                   if (this.tdstype=="LDC" && this.ldcRate=="0"){
                       this._toasterService.toast("warning","warning" ,"Please select LDS % Rate");
                       return false;
                   }
                   if (this.tdstype=="LDC" && this.tdsLimit=="0"){
                       this._toasterService.toast("warning","warning" ,"Please enter amount limit");
                       return false;
                   }
                   if (this.tdstype=="LDC" && this.Company==""){
                       this._toasterService.toast("warning","warning" ,"Please select company");
                       return false;
                   }
                   this.loaderService.display(true);
                   const jsonmasterTDS = {  PKID: this.Pk_Tdsid , SUP_CODE:this.quryParamsSupCode  , SECTIONID:this.sections  , PER_RATE:this.secRate  , FRMDT: fr_dt , TODT: to_dt , TDS_LIMIT_AMT: this.tdsLimit , TDS_TYPE: this.tdstype , MAKERID: this._loginService.getLogin()[0].CMPID   , MAKERIP:  this._loginService.getLogin()[0].MAKERIP,VGUID:  this._loginService.getLogin()[0].GUID,MODEOFENTRY: this.queryParamsReqType,
                       LDCRATE:(this.ldcRate==undefined)?"0" :this.ldcRate,CMPCODE:(this.Company==undefined)?"" :this.Company}
                   this._dataService.Common("Master/SUPPLIER_CHILD_TDS_IU", jsonmasterTDS)
                   .subscribe((data: any) => {
                   if (data.Table[0].STATUS == "100") {
                       this.TdsList=data.Table;
                       this.loaderService.display(false);
                      this.ResetTDScildrcrd();
                      this.txtchild="Add";
                   }
                   else{   this._toasterService.toast("warning","warning" ,data.Table[0].STATUSTEXT )
                       this.loaderService.display(false);}
                   this.txtchild="Add";
                   });   
   
               }
            
               } 
               else{   this._toasterService.toast("warning","warning" ,"TDS only applicable for India" )
               this.loaderService.display(false);}
           }

     EDIT_Tds(id)
     {let filterData = this.TdsList.filter((filter) => filter.PKID == id)[0]; 
        if(filterData.PK_TDSTBL_ID==null)
        { 
        this.Pk_Tdsid=id;
        this.sections=filterData.SECTIONID;
        this.secRate=filterData.PER_RATE;
        this.frmdt= (filterData.FRMDT != "") ? this._dataService.stringdttoArry(filterData.FRMDT) : "";
        this.todt= (filterData.TODT != "") ? this._dataService.stringdttoArry(filterData.TODT) : "";
        this.tdsLimit=filterData.TDS_LIMIT_AMT;
        this.tdstype=filterData.TDS_TYPE;
        this.ldcRate=filterData.LDCRATE;
        this.Company=filterData.CMPCODE;
        this.LdccertNo=filterData.LDCCERTNO;
        if(this.tdstype=="LDC"){
            this.disablecompany=false;
            this.disableldcrate=false;
            this.disablelimitamt=false;
            this.disablecertno=false;
        }
        else{
            this.disablecompany=true;
            this.disableldcrate=true;
            this.disablelimitamt=true;
            this.disablecertno=true;
            }
        this.txtchildTDS="Update";
        }
        else{
              this._toasterService.toast("warning","warning" ,"You cannot update this Record" )
            this.loaderService.display(false); 
        }
     }
     ResetTDScildrcrd(){
        this.sections="";
        this.secRate="0";
        this.frmdt="";
        this.todt="";
        this.tdsLimit="0";
        this.tdstype="";
        this.ldcRate="0";
        this.Company="0";
        this.txtchildTDS="Add";
        this.Pk_Tdsid="";
        this.LdccertNo="";
    }
     EnableLDSRate(val)
     {
        if(val=="LDC")
        {
            this.disableldcrate=false;
            this.disablecompany=false;
            this.disablelimitamt=false;
            this.disablecertno=false;
        }  
        else
        {
            this.disableldcrate=true;
            this.ldcRate="0";
            this.Company="0";
            this.disablecompany=true;
            this.tdsLimit="0"
            this.disablelimitamt=true;
            this.LdccertNo='';
            this.disablecertno=true;
        } 
     }
}