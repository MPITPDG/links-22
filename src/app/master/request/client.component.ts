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
@Component({
    selector: 'app-masterclient',
    templateUrl: 'client.component.html'

})


export class clientmaster  implements OnInit  { 
    @ViewChild('fileUpload', {static: false}) fileUploadVar: any;
    CHECK : any=null;CHECKB : any =null;CHECKC1 : any =null;CHECKC2 : any =null;CHECKC3 : any =null;CHECKC4 : any =null; CHECKC5 :any =null;
    Header: string="Exporter Details"
    ShrtName : string=""; panno : string="";title : string="Messrs";Name : string=""; EORIno : string="";
    addrs1: string=""; addrs2: string=""; addrs3: string="";  position: string="After"; Pincode: string="";
    city: string="";country : string="";  addrs21 : string=""; addrs22 : string=""; addrs23: string="";
    position2:string="After"; Pincode2 : string=""; city2 : string="";  state: string=""; country2: string="";
    GST: boolean=true; GstNo : string=""; ARNNo: string=""; title1 : string="Mr";  person: string=""; 
    telephone: string="";  mobile: string=""; email : string="";SOexport: string="";  telphone1: string="";   
    faxno1: string="";  email1 : string=""; rbicode: string=""; imno : string=""; itno: string="";
    bankername : string="";  custpono: string=""; ieccode: string=""; typeexpo: string="(R) Merchant";
    typeexpohouse : string="(EH) Export House"; exp_typeb : string="(P) Private"; servtaxno: string="";  tanno: string="";  bnkaddss1: string="";
    bnkaddss2: string="";   bnkAcctno : string="";  bnkauthdealercode : string="";  RBIwaiverno: string="";
    bnkCommissionrate: string=""; bnkRange: string="";   bkacctnoSBI: string="";
    Ctitle1 : string="Mr";  Cname1 : string="";  CDesignation1: string=""; Ctelphone1 : string="";
    Cfaxno1: string="";  Cmobileno1: string=""; Cemail1  : string="";
    Ctitle2  : string="Mr"; Cname2 : string="";  CDesignation2 : string=""; Ctelphone2: string="";
    Cfaxno2: string="";   Cmobileno2: string=""; Cemail2: string="";
    Ctitle3  : string="Mr"; Cname3 : string="";  CDesignation3 : string="";  Ctelphone3: string="";
    Cfaxno3: string="";  Cmobileno3: string="";  Cemail3: string="";
    Ctitle4  : string="Mr";  Cname4 : string="";  CDesignation4 : string="";  Ctelphone4: string="";
    Cfaxno4: string=""; Cmobileno4: string="";  Cemail4: string="";itcgrpcode:string="";exphouseno : string="";
    listcnt: any;statetinno : string="";
    Citylist:any=[];gstlist:any=[];citybranchlict:any[];  
    TmpcitybranchObject: any = {};
    childrecdid: string="";exp_id: string="0"; queryParamsReqType: string = "";quryParamsExpCode:string="";
    validEmail:boolean = false;
    exphousedt   : any = ""; exphouse : any =""; bnkDivision: string="";
    exp_city :any=[];imp_city :any=[];sorc_city: any=[];
    fileData: File = null;
    uploadedFilePath: string = null;
    doctype: string="PANC";
    localUrl: any[];
    text: string="Submit";txtchild : string ="Add";
    countrycode :string; expcountrycode :string;
    Concode :string="";
    filesToUpload: Array<File>;
    selectedFileNames: string[] = [];
    public isLoadingData: Boolean = false;
    crperiodsea:string;
    crperiodair:string;
    isoverseasagent:string="0";
    overseasagent: boolean=false;
    uploadResult: any=[];
    res: Array<string>;
    ISSEZCLIENT: boolean=false;
    public disablechkIsSez: boolean = false;
    private actionUrl: string;
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
        private http: HttpClient,   private _configuration: Configuration
        //private http1: Http   

    ) { this.actionUrl = _configuration.ServerWithApiUrl;
    }
   
    ngOnInit(){
        this._activatedRoute.params.subscribe(params => {
            this.queryParamsReqType = params["ReqType"];
            this.quryParamsExpCode=params["ExpCode"];
            
        })
        const jsonmaster = {  CMPID:this._loginService.getLogin()[0].CMPID }
        this.loaderService.display(true);
        this._dataService.getData("Master/masterpageload",jsonmaster)
        .subscribe((data: any) => {
           // this.Citylist=data.Table;
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
      // console.log(this._loginService.getLogin()[0]);
      if (this.queryParamsReqType =='isExporter')
      {
        this._loginService.verifyRights(123, '')
        .subscribe((data: any) => { this._loginService.checkVerify('Add', data); });
        this.populate_AddExpoter();
      }
      else if (this.queryParamsReqType =='TEMP' && this.quryParamsExpCode !=' ')
      {
        this._loginService.verifyRights(104, '')
        .subscribe((data: any) => { this._loginService.checkVerify('Modify', data); });

          this.Header='EXPORTER DETAILS - UPDATE REQUEST';
          this.editpopulate();
      }
      else if (this.queryParamsReqType ==' ' && this.quryParamsExpCode !=' ')
      {
        this._loginService.verifyRights(104, '')
        .subscribe((data: any) => { this._loginService.checkVerify('Modify', data); });
        
        this.Header= 'EXPORTER DETAILS - UPDATE';
          this.editpopulate();
          this.text='Update';
      }
      if (this.queryParamsReqType =='TEMP' && this.quryParamsExpCode ==' ')
      {       //no rights to request
                this.Header=  'EXPORTER DETAILS - REQUEST TO ADD';
      }
      if (this.queryParamsReqType ==' ' && this.quryParamsExpCode ==' ')
      {
        this._loginService.verifyRights(104, '')
        .subscribe((data: any) => { this._loginService.checkVerify('Add', data); });

          this.Header='EXPORTER DETAILS - ADD';
      //    this.editpopulate();
      }
     
      //populate_AddExpoter

    }
    
    getcollapse(chk,section)
    {
        if (section=='other')
        {
            if (chk=='null')
            { this.CHECK=true;
              this.CHECKB='null';
              this.CHECKC1='null';
              this.CHECKC2='null';
              this.CHECKC3='null';
              this.CHECKC4='null';    
              this.CHECKC5='null';            
            }
            else
            {this.CHECK='null';}
        }
        if (section=='bank')
        {
            if (chk=='null')
            {   this.CHECKB=true;
                this.CHECK='null';
                this.CHECKC1='null';
                this.CHECKC2='null';
                this.CHECKC3='null';
                this.CHECKC4='null';
                //this.CHECKC5='null';                
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
               // this.CHECKC5='null'; 
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
                //this.CHECKC5='null';   
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
                //this.CHECKC5='null';  
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
               // this.CHECKC5='null'; 
              }
            else
            {this.CHECKC4='null';}
        }
        // if (section=='doc')
        // {
        //     if (chk=='null')
        //     {   this.CHECKC5=true;
        //         this.CHECK='null';
        //         this.CHECKB='null';
        //         this.CHECKC1='null';
        //         this.CHECKC2='null';
        //         this.CHECKC3='null'
        //         this.CHECKC4='null';   }
        //     else
        //     {this.CHECKC5='null';}
        // }         
    }

    Countryfilter(citycode,type){
       
        this.listcnt=this.Citylist.filter((cntrylist:any)=>cntrylist.DATAVALUEFIELD==citycode);
        if (type=='DOC'){
            this.country=this.listcnt[0].CITY_COUNTRY;
            this.expcountrycode=this.listcnt[0].ISO_COUNTRY_CODE;
        }
        if (type=='INV'){
            this.state=this.listcnt[0].STATE_NAME;
            this.country2=this.listcnt[0].CITY_COUNTRY;
            this.statetinno=this.listcnt[0].STATE_NO;
            this.countrycode=this.listcnt[0].ISO_COUNTRY_CODE;
        }

    }
     Addcildrcrd()
     {
         if (this.country2=='INDIA'){
             let isgstreg: string ;
            //  if (this.GST=='gst')
            if (this.GST==true)
             {
                 if(this.GstNo!=''){
                     if(this.GstNo.length !=15){
                        this._toasterService.toast('warning', 'warning', 'GST No Should be 15 characters !');
                         return false;
                     }
                     else if (this.GstNo.length ==15){
                        isgstreg=this.GstNo.substring(0,2);
                        this.Countryfilter(this.city2,'INV');
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
         const jsonmasterchild = { childrecdId  : this.childrecdid,exp_invadd1 :this.addrs21.replace("'","`"),exp_invadd2 : this.addrs22.replace("'","`"),  
            exp_invadd3 : this.addrs23.replace("'","`"),exp_invpincode : this.Pincode2,exp_invpinposition :this.position2,  
            exp_invcity :this.city2,  vguid :this._loginService.getLogin()[0].GUID , 
            MakerIP:this._loginService.getLogin()[0].MAKERIP, 
            MakerID:this._loginService.getLogin()[0].CMPID,  
            EXP_GSTNO :this.GstNo,  EXP_GSTARNNO :this.ARNNo,  
            EXP_GSTtitle :this.title1, Exp_GSTcontP :this.person,  
            Exp_GSTtelno :this.telephone,  EXP_GSTMobno : this.mobile,  
            EXP_GSTcontemail : this.email,  
            expid :this.exp_id, 
            reqmode : this.queryParamsReqType
         }
         this._dataService.Common("Master/exporter_child_IU", jsonmasterchild)
         .subscribe((data: any) => {
            if (data.Table[0].STATUS == "100") {
                this.gstlist=data.Table1;
                this.loaderService.display(false);
                this.Resetcildrcrd();
            }
            else{   this._toasterService.toast("warning","warning" ,data.Table[0].STATUSTEXT  );
                    this.loaderService.display(false);
            }
         });   
         this.txtchild="Add"; 
     }
     Resetcildrcrd(){
        this.childrecdid ="";
        this.addrs21="";
        this.addrs22="";
        this.addrs23="";
        this.Pincode2="";
        this.position2="";
        this.city2="";
        this.GstNo="";
        this.ARNNo ="";
        this.title1="";
        this.person="";
        this.telephone="";
        this.mobile="";
        this.email="";
        this.txtchild="Add";
     }
     Editchildrecd(id)
     {
        let filterData = this.gstlist.filter((filter) => filter.ID == id)[0]; 
        this.childrecdid=filterData.ID;
        this.addrs21=filterData.INVADD1;
        this.addrs22=filterData.INVADD2;
        this.addrs23=filterData.INVADD3;
        this.Pincode2=filterData.INPINCODE;
        this.position2=filterData.INVPINPOS;
        this.city2=filterData.INVCITY;
        this.state=filterData.INVSTATE;
        this.country2=filterData.INVCOUNTRY;
        this.GstNo=filterData.GST_NO;
        this.ARNNo =filterData.GST_ARNNO;
        this.title1=filterData.GSTTITLE;
        this.person=filterData.GSTCONTP;
        this.telephone=filterData.GSTTELNO;
        this.mobile=filterData.GSTMOBNO;
        this.email=filterData.GSTCONTEMAIL;
        this.statetinno=filterData.INVSTATETIN;
        this.txtchild="Update";
        if(filterData.GST_NO  !='')
        {       this.GST=true;    
         this.checkValue('gst') ;   }
        else
        {     this.GST=false;  this.checkValue('');  }

     }
     deletechildrecd(id){
         if(confirm('Are you sure want to delete the record ?'))
         {   this.loaderService.display(true);
        const jsonmaster = { id  : id,guid :this._loginService.getLogin()[0].GUID ,makerid :this._loginService.getLogin()[0].CMPID}
        this._dataService.getData("Master/exporter_child_delete", jsonmaster)
         .subscribe((data: any) => {
            if (data.Table[0].STATUS == "100") {
                this.gstlist=data.Table1;
                this.loaderService.display(false);
            }
            else{   this._toasterService.toast("warning","warning" ,data.Table[0].STATUSTEXT  );
            this.loaderService.display(false);
    }
         }); 
        }
        else{return false;  this.loaderService.display(false);}
     }  

    //  onChange(newValue) {          
    //     const validEmailRegEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    //     if (validEmailRegEx.test(newValue)) {
    //         this.validEmail = true;
    //         this._toasterService.toast('warning', 'warning', 'Enter valid E-mail !');            
    //     }else {
    //       this.validEmail = false;
    //       this._toasterService.toast('warning', 'warning', 'Enter Invalid E-mail !');
    //     }
    
    //   }

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

    chkonchange(citycode,chk,type)
    {
        if ( type=='E')
        {
            if (chk==true){
            this.exp_city=this.exp_city + ','+citycode ;
            this.exp_city=   this.exp_city.replace(',,',',')
            }
            else{
                this.exp_city=   this.exp_city.replace(citycode,'')
                this.exp_city=   this.exp_city.replace(',,',',')
            }
        }
        if ( type=='I')
        {
            if (chk==true){
            this.imp_city=this.imp_city + ','+citycode ;
            this.imp_city=  this.imp_city.replace(',,','')
            }
            else{
                this.imp_city=  this.imp_city.replace(citycode,'');
                this.imp_city=  this.imp_city.replace(',,','')
            }            
        }
        if ( type=='S')
        {
            if (chk==true){
            this.sorc_city =this.sorc_city + ','+citycode ;
            this.imp_city=  this.imp_city.replace(',,','')
            }
            else{
                this.sorc_city= this.sorc_city.replace(citycode,'');
                this.sorc_city= this.sorc_city.replace(',,','');
            }             
        }
    }

 /*  

fileChangeEvent(fileInput: any)
    {
        //Clear Uploaded Files result message
        this.uploadResult = "";
        this.filesToUpload = <Array<File>>fileInput.target.files;
 
        for (let i = 0; i < this.filesToUpload.length; i++)
        {
            this.selectedFileNames.push(this.filesToUpload[i].name);
        }
        return false;
    }
    upload()
    {
        if (this.filesToUpload.length == 0)
        {
            alert('Please select at least 1  files to upload!');
        }       
        else
        {  this.uploadFiles(); }
    }

    validatePDFSelectedOnly(filesSelected: string[])
    {
        for (var i = 0; i < filesSelected.length; i++)
        {
            if (filesSelected[i].slice(-3).toUpperCase() != "PDF")
            {
                alert('Please selecte PDF files only!');
                return false;
            }
            else {
                return true;
            }
        }
    }
 
    uploadFiles()
    {
        this.uploadResult = "";
 
        if (this.filesToUpload.length > 0)
        {
            this.filesToUpload[0].size;
            this.isLoadingData = true; 
            let formData: FormData = new FormData(); 
            formData.append('uploadedFiles', this.filesToUpload[0], this.filesToUpload[0].name); 
            formData.append('cmpid', this._loginService.getLogin()[0].CMPID);
            formData.append('DOCTYPE',this.doctype)
            formData.append('guid', this._loginService.getLogin()[0].GUID)
            formData.append('filesize', this.filesToUpload[0].size.toString());
            formData.append('Makerip', this._loginService.getLogin()[0].MAKERIP);

            let apiUrl =this.actionUrl+ "Master/UploadFiles"; 
            this.http.post(apiUrl, formData )            
              .subscribe((data: any) => {
                        this.uploadResult = data.Table;                       
                    },
                    err => {                        
                        this.isLoadingData = false;
                        alert("File Upload successfully !");
                    },
                    () => {
                        this.isLoadingData = false,
                        this.fileUploadVar.nativeElement.value = "";
                        this.selectedFileNames = [];
                        this.filesToUpload = [];
                    } );
                }
        }
   
        deletefiles(id,ACT_FILENAME)
        {
         if(confirm('Are you sure want to delete the file ?'))
         {   this.loaderService.display(true);
            const jsonmaster = { PKID  : id,FILENAME: ACT_FILENAME ,CMPID :this._loginService.getLogin()[0].CMPID,GUID :this._loginService.getLogin()[0].GUID}
            this._dataService.getData("Master/RemoveUploadFiles", jsonmaster)
            .subscribe((data: any) => {
                if (data.Table[0].STATUS == "100") {
                    this.uploadResult=data.Table;
                    this.loaderService.display(false);
                }
            }); 
        }
        else{return false;  this.loaderService.display(false);}
        }
  */
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
        id :  this.exp_id, 
        exp_sname :this.ShrtName.replace("'","`")  , 
        exp_title :  this.title, 
        exp_name : this.Name.replace("'","`") , 
        exp_panno : this.panno ,    
        exp_EORINUMBER : this.EORIno   ,  

        exp_add1 :this.addrs1.replace("'","`")  , 
        exp_add2 : this.addrs2.replace("'","`") , 
        exp_add3 : this.addrs3.replace("'","`") , 
        exp_pincode : this.Pincode , 
        exp_pinposition :this.position  , 
        exp_city : this.city , 
        exp_country : this.expcountrycode , 
        exp_invadd1 :this.addrs21.replace("'","`")  , 
        exp_invadd2 : this.addrs22.replace("'","`") , 
        exp_invadd3 : this.addrs23.replace("'","`") , 
        exp_invpincode :this.Pincode2  , 
        exp_invpinposition :this.position2  , 
        exp_invcity : this.city2 , 
        exp_invcountry :this.countrycode , 
        exp_state :this.SOexport  , 
        exp_telno : this.telphone1 , 
        exp_faxno : this.faxno1 , 
        exp_telex :''  , 
        exp_email : this.email1  , 
        exp_rbicode :this.rbicode  , 
        exp_imno : this.imno , 
        exp_itno : this.itno , 
        exp_bank : this.bankername , 
        exp_custpno :this.custpono  ,
        exp_ieccode :  this.ieccode,  
        exp_hscertno : this.exphouse , 
        exp_hscertdt :  this.exphousedt === null ?    this.exphousedt.formatted: '' ,// if (this.exphousedt == "") { LCD = "" } else { LCD = this.vslLCD.formatted; }  , 
        exp_certvaliddt :  this.exphouse === null ?    this.exphouse.formatted: '' , 
        exp_ItcGroupcode :this.itcgrpcode  ,
        exp_typea :this.typeexpo  , 
        exp_typeb : this.exp_typeb , 
        exp_expthouse : this.typeexpohouse ,        
        exp_servicetax :this.servtaxno ,
        TANNO :this.tanno,
       
        exp_bankaddr1 : this.bnkaddss1 , 
        exp_bankaddr2 : this.bnkaddss2 , 
        exp_acctno1 :this.bnkAcctno , 
        exp_delarcode : this.bnkauthdealercode , 
        exp_rbiwaiverno :this.RBIwaiverno  , 
        exp_commrate :this.bnkCommissionrate  , 
        exp_division : this.bnkDivision , 
        exp_range : this.bnkRange ,
        exp_acctno : this.bkacctnoSBI , 
        exp_title1 : this.Ctitle1 , 
        exp_contact1 :this.Cname1.replace("'","`")   , 
        exp_cont1email : this.Cemail1 , 
        exp_telno1 :this.Ctelphone1  , 
        exp_faxno1 :this.Cfaxno1  ,
        exp_designation1 : this.CDesignation1 ,
        exp_mobile1 : this.Cmobileno1 , 

        exp_title2 :this.Ctitle2  , 
        exp_contact2 : this.Cname2.replace("'","`") ,         
        exp_cont2email :this.Cemail2  , 
        exp_telno2 :this.Ctelphone2  , 
        exp_faxno2 :this.Cfaxno2  ,
        exp_designation2 : this.CDesignation2 , 
        exp_mobile2 :  this.Cmobileno2,

        exp_title3 :this.Ctitle3  , 
        exp_contact3 : this.Cname3.replace("'","`") , 
        exp_cont3email :this.Cemail3  , 
        exp_telno3 : this.Ctelphone3 , 
        exp_faxno3 : this.Cfaxno3 , 
        exp_designation3 : this.CDesignation3 ,
        exp_mobile3 : this.Cmobileno3 ,

        exp_title4 : this.Ctitle4  ,
        exp_contact4 : this.Cname4.replace("'","`") , 
        exp_cont4email : this.Cemail4 , 
        exp_telno4 : this.Ctelphone4 , 
        exp_faxno4 :this.Cfaxno4  , 
        exp_designation4 :  this.CDesignation4,
        exp_mobile4 : this.Cmobileno4 ,
       
        con_code :   (this.queryParamsReqType=='isExporter') ?this.Concode : '',
        exporterin : '' , 
        importerin : '' , 
        exporterfr : '' ,
        importerfr : '' ,
        exporter :this.exp_city  ,
        importer : this.imp_city , 
        srcagent :this.sorc_city  , 
        consignee : '' , 

        MakerIP :  this._loginService.getLogin()[0].MAKERIP,
        cmpid :  this._loginService.getLogin()[0].CMPID,
        cmp_code :  this._loginService.getLogin()[0].CMPCODE,
        citycode :   this._loginService.getLogin()[0].CITYCODE, 
        RequestMode : this.queryParamsReqType  , 
      
        EXP_GSTNO : '' , 
        EXP_GSTARNNO : '' , 
        Exp_GSTcontP : '' , 
        Exp_GSTtelno : '' , 
        EXP_GSTMobno :  '', 
        EXP_GSTcontemail :''  , 
        VGUID : this._loginService.getLogin()[0].GUID,
        // ISSEZCLIENT: (this.ISSEZCLIENT==true) ?'1':'0',
        // SIRENNO:this.sirenno,
        ISSEZCLIENT: (this.ISSEZCLIENT==true) ?'1':'0',
        CREDITPERIOD_SEA:this.crperiodsea,
        CREDITPERIOD_AIR:this.crperiodair,
        ISOVERSEASAGENT:this.isoverseasagent,
        }
        this._dataService.Common("Master/exporter_Main_IU", jsonmaster)
        .subscribe((data: any) => {
            if (data.Table[0].STATUS == "100") {
                if (this.queryParamsReqType =='TEMP' && this.quryParamsExpCode ==' ')
                    { this._toasterService.toast('success', 'success', 'Requst Expoter/Impoter saved successfully !');   }
                else  if (this.queryParamsReqType =='TEMP' && this.quryParamsExpCode !=' ')
                    { this._toasterService.toast('success', 'success', 'Requst Expoter/Impoter Authorised successfully !');}
                else  if (this.queryParamsReqType ==' ' && this.quryParamsExpCode !=' ')
                    { this._toasterService.toast('success', 'success', 'Expoter/Impoter update successfully !');}
                else  if (this.queryParamsReqType ==' ' && this.quryParamsExpCode ==' ')
                    { this._toasterService.toast('success', 'success', 'Expoter/Impoter saved successfully !');   }
               this.loaderService.display(false);
               this.RestMain();
           }

           else   if (data.Table[0].STATUS == "105")
           {
           if (confirm(data.Table[0].STATUSTEXT))
            {
                this._dataService.Common("Master/exporter_Main_IU", jsonmaster)
                .subscribe((data: any) => {
                   if (data.Table[0].STATUS == "100") {
                        if (this.queryParamsReqType =='TEMP' && this.quryParamsExpCode ==' ')
                            { this._toasterService.toast('success', 'success', 'Requst Expoter/Impoter saved successfully !');   }
                        else  if (this.queryParamsReqType =='TEMP' && this.quryParamsExpCode !=' ')
                            { this._toasterService.toast('success', 'success', 'Requst Expoter/Impoter Authorised successfully !');}
                        else  if (this.queryParamsReqType ==' ' && this.quryParamsExpCode !=' ')
                            { this._toasterService.toast('success', 'success', 'Expoter/Impoter update successfully !');}
                        else  if (this.queryParamsReqType ==' ' && this.quryParamsExpCode ==' ')
                            { this._toasterService.toast('success', 'success', 'Expoter/Impoter saved successfully !');   }
                       this.loaderService.display(false);
                       this.RestMain();
                                       
            }
            else if (data.Table[0].STATUS == "105") {
                this._toasterService.toast("warning","warning" ,'Add Exporter with different City & address '  );
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
        this.Resetcildrcrd();
        const jsonmaster = {  CMPID:this._loginService.getLogin()[0].CMPID }
        this.loaderService.display(true);
        this._dataService.getData("Master/masterpageload",jsonmaster)
        .subscribe((data: any) => {
           // this.Citylist=data.Table;
        });
       
        this.ShrtName ='';  
        this.Name ='';  
        this.panno ='';     
        this.EORIno  =''; 
        this.addrs1  =''; 
        this.addrs2 =''; 
        this.addrs3=''; 
        this.Pincode =''; 
        this.city =''; 
        this.country =''; 
        this.addrs21  =''; 
        this.addrs22 =''; 
        this.addrs23 =''; 
       this.Pincode2  =''; 
       this.position2  =''; 
       this.city2 =''; 
       this.country2 =''; 
       this.SOexport  =''; 
       this.telphone1 =''; 
       this.faxno1 ='';        
       this.email1  =''; 
       this.imno =''; 
       this.itno =''; 
       this.bankername =''; 
       this.custpono  ='';
       this.ieccode='';  
       this.exphouse =''; 
       this.exphousedt 
       this.exphouse 
       this.itcgrpcode  ='';
       this.typeexpo  ='(R)Merchant'; 
       this.exp_typeb ='(P)Private'; 
       this.typeexpohouse ='(EH)Export House';        
       this.servtaxno ='';
       this.tanno='';       
       this.bnkaddss1 =''; 
       this.bnkaddss2 =''; 
       this.bnkAcctno =''; 
       this.bnkauthdealercode =''; 
       this.RBIwaiverno  =''; 
       this.bnkCommissionrate  =''; 
       this.bnkDivision =''; 
       this.bnkRange ='';
       this.bkacctnoSBI =''; 
       this.Ctitle1 ='Mr.'; 
       this.Cname1   =''; 
       this.Cemail1 =''; 
       this.Ctelphone1  =''; 
       this.Cfaxno1  ='';
       this.CDesignation1 ='';
       this.Cmobileno1 ='';        
       this.Ctitle2  ='Mr'; 
       this.Cname2 ='';         
       this.Cemail2  =''; 
       this.Ctelphone2  =''; 
       this.Cfaxno2  ='';
       this.CDesignation2 =''; 
       this.Cmobileno2='';       
       this.Ctitle3  ='Mr'; 
       this.Cname3 =''; 
       this.Cemail3  =''; 
       this.Ctelphone3 =''; 
       this.Cfaxno3 =''; 
       this.CDesignation3 ='';
       this.Cmobileno3 ='';       
       this.Ctitle4  ='Mr';
       this.Cname4 =''; 
       this.Cemail4 =''; 
       this.Ctelphone4 =''; 
       this.Cfaxno4  =''; 
       this.CDesignation4='';
       this.Cmobileno4 ='';
       this.exp_city  ='';
       this.imp_city =''; 
       this.sorc_city  =''; 
       this.uploadResult=[];
       this.gstlist=[];
       this.exp_city =[];
       this.imp_city= [];
       this.sorc_city= [];
       if(this.queryParamsReqType =='isExporter')
       {
        this._router.navigate(['/master/request/client/ / ']);
       }
       else
       {this._router.navigate(['/master/request/client/'+ this.queryParamsReqType  +' / ']);}
       
       this.loaderService.display(false);
    }
    //http://109.15.43.138/edocument/api/API_Master/UploadEdocSingleFile

    editpopulate()
    {
        const jsonmaster = { _ExpCode  : this.quryParamsExpCode,RequestMode :this.queryParamsReqType }
        this._dataService.getData("Master/Fill_Exp_Details", jsonmaster)
         .subscribe((data: any) => {
            if (data.Table[0].STATUS == "100") {
            this.exp_id=    data.Table[0].ID    ; 
            this.ShrtName  =    data.Table[0].EXP_SNAME    ; 
            this.title=    data.Table[0].EXP_TITLE    ; 
            this.Name =    data.Table[0].EXP_NAME    ; 
            this.panno =    data.Table[0].EXP_PANNO    ;    
          //  this.EORIno   =    data.Table[0].    ;  

            this.addrs1  =    data.Table[0].EXP_ADD1    ; 
            this.addrs2 =    data.Table[0].EXP_ADD2    ; 
            this.addrs3 =    data.Table[0].EXP_ADD3    ; 
            this.Pincode =    data.Table[0].EXP_PINCODE    ; 
            this.position  =    data.Table[0].EXP_PINPOSITION    ; 
            this.city =    data.Table[0].EXP_CITYCODE    ; 
            this.expcountrycode =    data.Table[0].EXP_COUNTRY   ; 
            this.country =    data.Table[0].EXP_CITY_COUNTRY   ; 
            this.addrs21  =    data.Table[0].EXP_INVADD1   ; 
            this.addrs22 =    data.Table[0].EXP_INVADD2    ; 
            this.addrs23 =    data.Table[0].EXP_INVADD3    ; 
            this.Pincode2  =    data.Table[0].EXP_INVPINCODE    ; 
            this.position2  =    data.Table[0].EXP_INVPINPOSITION   ; 
            this.city2 =    data.Table[0].EXP_INVCITYCODE ; 
            this.countrycode =    data.Table[0].EXP_INVCOUNTRY; 
            this.SOexport  =    data.Table[0].EXP_STATE; 
            this.telphone1 =    data.Table[0].EXP_TELNO1; 
            this.faxno1 =    data.Table[0].EXP_FAXNO1 ; 

            this.email1  =    data.Table[0].EXP_EMAIL; 
            this.rbicode  =    data.Table[0].EXP_RBICODE; 
            this.imno =    data.Table[0].EXP_IMNO    ; 
            this.itno =    data.Table[0].EXP_ITNO    ; 
            this.bankername =    data.Table[0].EXP_BANK    ; 
            this.custpono  =    data.Table[0].EXP_CUSTPNO    ;
            this.ieccode=    data.Table[0].EXP_IECCODE    ;  
            this.exphouse =    data.Table[0].EXP_HSCERTNO    ; 
            this.exphousedt= data.Table[0].EXP_HSCERTDT
            
            this.itcgrpcode  =    data.Table[0].EXP_ITCGROUPCODE    ;
            this.typeexpo  =    data.Table[0].EXP_TYPEA    ; 
            this.exp_typeb =    data.Table[0].EXP_TYPEB    ; 
            this.typeexpohouse =    data.Table[0].EXP_EXPTHOUSE    ;
            this.servtaxno =    data.Table[0].EXP_SERVICETAX    ;
            this.tanno=    data.Table[0].EXP_TANNO    ;

            this.bnkaddss1 =    data.Table[0].EXP_BANKADDR1 ; 
            this.bnkaddss2 =    data.Table[0].EXP_BANKADDR2; 
            this.bnkAcctno =    data.Table[0].EXP_ACCTNO1 ; 
            this.bnkauthdealercode =    data.Table[0].EXP_DELARCODE    ; 
            this.RBIwaiverno  =    data.Table[0].EXP_RBIWAIVERNO    ; 
            this.bnkCommissionrate  =    data.Table[0].EXP_COMMRATE  ; 
            this.bnkDivision =    data.Table[0].EXP_DIVISION    ; 
            this.bnkRange =    data.Table[0].EXP_RANGE    ;
            this.bkacctnoSBI =    data.Table[0].EXP_ACCTNO    ; 

            this.Ctitle1 =    data.Table[0].EXP_TITLE1   ; 
            this.Cname1   =    data.Table[0].EXP_CONTACT1    ; 
            this.Cemail1 =    data.Table[0].EXP_CONT1EMAIL    ; 
            this.Ctelphone1  =    data.Table[0].EXP_TELNO1    ; 
            this.Cfaxno1  =    data.Table[0].EXP_FAXNO1    ;
            this.CDesignation1 =    data.Table[0].EXP_DESIGNATION1    ;
            this.Cmobileno1 =    data.Table[0].EXP_MOBILE1    ; 

            this.Ctitle2  =    data.Table[0].EXP_TITLE2    ; 
            this.Cname2 =    data.Table[0].EXP_CONTACT2    ; 
            this.Cemail2  =    data.Table[0].EXP_CONT2EMAIL    ; 
            this.Ctelphone2  =    data.Table[0].EXP_TELNO2    ; 
            this.Cfaxno2  =    data.Table[0].EXP_FAXNO2    ;
            this.CDesignation2 =    data.Table[0].EXP_DESIGNATION2    ; 
            this.Cmobileno2=    data.Table[0].EXP_MOBILE2    ;

            this.Ctitle3  =    data.Table[0].EXP_TITLE3    ; 
            this.Cname3 =    data.Table[0].EXP_CONTACT3    ; 
            this.Cemail3  =    data.Table[0].EXP_CONT3EMAIL    ; 
            this.Ctelphone3 =    data.Table[0].EXP_TELNO3    ; 
            this.Cfaxno3 =    data.Table[0].EXP_FAXNO3    ; 
            this.CDesignation3 =    data.Table[0].EXP_DESIGNATION3    ;
            this.Cmobileno3 =    data.Table[0].EXP_MOBILE3    ;

            this.Ctitle4  =    data.Table[0].EXP_TITLE4    ;
            this.Cname4 =    data.Table[0].EXP_CONTACT4    ; 
            this.Cemail4 =    data.Table[0].EXP_CONT4EMAIL    ; 
            this.Ctelphone4 =    data.Table[0].EXP_TELNO4    ; 
            this.Cfaxno4  =    data.Table[0].EXP_FAXNO4    ;          
            this.CDesignation4=    data.Table[0].EXP_DESIGNATION4    ;
            this.Cmobileno4 =    data.Table[0].EXP_MOBILE4    ;
            this.exp_city=data.Table[0].EXPORTER;
            this.imp_city=data.Table[0].IMPORTER;
            this.sorc_city=data.Table[0].SRCAGENT;
            this.gstlist= data.Table1;
            this.citybranchlict=data.Table2;
              // this.ISSEZCLIENT=(data.Table[0].ISSEZCLIENT=='1')?true:false;
            // if(this.ISSEZCLIENT==true){
            // this.disablechkIsSez=true
            // }else
            // {
            // this.disablechkIsSez=false
            // }
            // this.sirenno=data.Table[0].SIRENNO;
            this.crperiodsea=data.Table[0].CREDITPERIOD_SEA;
            this.crperiodair=data.Table[0].CREDITPERIOD_AIR;
            this.overseasagent=(data.Table[0].ISOVERSEASAGENT=='Y')?true:false;
            this.ISSEZCLIENT=(data.Table[0].ISSEZCLIENT=='1')?true:false;
            if(this.ISSEZCLIENT==true){
            this.disablechkIsSez=true
            }else
            {
            this.disablechkIsSez=false
             }
            this.loaderService.display(false);
            }
            else{   this._toasterService.toast("warning","warning" ,data.Table[0].STATUSTEXT  );
            this.loaderService.display(false);
    }
         })
    }
    populate_AddExpoter()
    {
        const jsonmaster = { concode  : this.quryParamsExpCode}
        this._dataService.getData("Master/Fill_Consg_Details_AddAs_Expoter", jsonmaster)
         .subscribe((data: any) => {
            if (data.Table[0].STATUS == "100") {
                
                this.ShrtName  	=	data.Table[0].con_sname      ;
                this.title	=	data.Table[0].con_title      ;
                this.Name 	=	data.Table[0]. con_name     ;
                //this.panno 	=	data.Table[0].      ;
                        
                this.addrs1  	=	data.Table[0].con_add1     ;
                this.addrs2 	=	data.Table[0].con_add2      ;
                this.addrs3 	=	data.Table[0].con_add3      ;
                this.Pincode 	=	data.Table[0].con_pincode      ;
                this.position  	=	data.Table[0].con_pinposition      ;
                this.city 	=	data.Table[0].con_city      ;
                this.expcountrycode 	=	data.Table[0].con_country      ;
                this.addrs21  	=	data.Table[0].con_add1     ;
                this.addrs22 	=	data.Table[0].con_add2      ;
                this.addrs23 	=	data.Table[0].con_add3      ;
                this.Pincode2  	=	data.Table[0].con_pincode      ;
                this.position2  	=	data.Table[0].con_pinposition      ;
                this.city2 	=	data.Table[0].con_city      ;
                this.countrycode 	=	data.Table[0].con_country      ;
              //  this.SOexport  	=	data.Table[0].      ;
                this.telphone1 	=	data.Table[0].con_telno    ;
                this.faxno1 	=	data.Table[0].con_faxno      ;
                        
                this.email1  	=	data.Table[0].con_email      ;
                // this.rbicode  	=	data.Table[0].      ;
                // this.imno 	=	data.Table[0].      ;
                // this.itno 	=	data.Table[0].      ;
                // this.bankername 	=	data.Table[0].      ;
                // this.custpono  	=	data.Table[0].      ;
                // this.ieccode	=	data.Table[0].      ;
                // this.exphouse 	=	data.Table[0].      ;
                // this.exphousedt	=	data.Table[0].      ;
                        
                // this.itcgrpcode  	=	data.Table[0].      ;
                // this.typeexpo  	=	data.Table[0].      ;
                // this.exp_typeb 	=	data.Table[0].      ;
                // this.typeexpohouse 	=	data.Table[0].      ;
                // this.servtaxno 	=	data.Table[0].      ;
                // this.tanno	=	data.Table[0].      ;
                        
                // this.bnkaddss1 	=	data.Table[0].      ;
                // this.bnkaddss2 	=	data.Table[0].      ;
                // this.bnkAcctno 	=	data.Table[0].      ;
                // this.bnkauthdealercode 	=	data.Table[0].      ;
                // this.RBIwaiverno  	=	data.Table[0].      ;
                // this.bnkCommissionrate  	=	data.Table[0].      ;
                // this.bnkDivision 	=	data.Table[0].      ;
                // this.bnkRange 	=	data.Table[0].      ;
                // this.bkacctnoSBI 	=	data.Table[0].      ;
                        
               // this.Ctitle1 	=	data.Table[0].      ;
                this.Cname1   	=	data.Table[0].con_contact1      ;
                this.Cemail1 	=	data.Table[0].con_cont1email      ;
                this.Ctelphone1  	=	data.Table[0].con_telno1      ;
                this.Cfaxno1  	=	data.Table[0].con_faxno1     ;
                this.CDesignation1 	=	data.Table[0].con_designation1     ;
                this.Cmobileno1 	=	data.Table[0].con_mobile1      ;
                        
                this.Ctitle2  	=	data.Table[0].con_title2     ;
                this.Cname2 	=	data.Table[0].con_contact2      ;
                this.Cemail2  	=	data.Table[0].con_cont2email      ;
                this.Ctelphone2  	=	data.Table[0].con_telno2      ;
                this.Cfaxno2  	=	data.Table[0].con_faxno2      ;
                this.CDesignation2 	=	data.Table[0].con_designation2      ;
                this.Cmobileno2	=	data.Table[0].con_mobile2      ;
                        
                this.Ctitle3  	=	data.Table[0].con_title3      ;
                this.Cname3 	=	data.Table[0].con_contact3      ;
                this.Cemail3  	=	data.Table[0].con_cont3email      ;
                this.Ctelphone3 	=	data.Table[0].con_telno3     ;
                this.Cfaxno3 	=	data.Table[0].con_faxno3     ;
                this.CDesignation3 	=	data.Table[0].con_designation3      ;
                this.Cmobileno3 	=	data.Table[0].con_mobile3      ;
                        
                this.Ctitle4  	=	data.Table[0].con_title4      ;
                this.Cname4 	=	data.Table[0].con_contact4      ;
                this.Cemail4 	=	data.Table[0].con_cont4email      ;
                this.Ctelphone4 	=	data.Table[0].con_telno4     ;
                this.Cfaxno4  	=	data.Table[0].con_faxno4      ;
                this.CDesignation4	=	data.Table[0].con_designation4      ;
                this.Cmobileno4 	=	data.Table[0].con_mobile4      ;  
                this.Concode=         data.Table[0].con_code     ;
                 // this.ISSEZCLIENT=(data.Table[0].ISSEZCLIENT=='1')?true:false;
            // if(this.ISSEZCLIENT==true){
            // this.disablechkIsSez=true
            // }else
            // {
            // this.disablechkIsSez=false
            // }
            // this.sirenno=data.Table[0].SIRENNO;
            this.crperiodsea=data.Table[0].CREDITPERIOD_SEA;
            this.crperiodair=data.Table[0].CREDITPERIOD_AIR;
            this.overseasagent=(data.Table[0].ISOVERSEASAGENT=='Y')?true:false;
            }
            else{   this._toasterService.toast("warning","warning" ,data.Table[0].STATUSTEXT  );
            this.loaderService.display(false);
    }
        })
    }
    checkValue(event: any){
        console.log(event);
     }
     checkValueoverseas(event: any){
        console.log(event);
        this.isoverseasagent=event;
        console.log(this.isoverseasagent);
     }
}