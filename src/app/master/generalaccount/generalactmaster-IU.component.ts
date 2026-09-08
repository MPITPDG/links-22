import { Component, OnInit } from '@angular/core';
import {DataService} from '../../shared/service/dataService';
import { ToastCommonService } from '../../shared/service/toastService';
import { LoaderService } from '../../shared/service/loader.service';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { LoginService } from '../../shared/service/loginService';
import { Configuration } from '../../app.constants';
import { IMyDpOptions } from 'mydatepicker';
import { TokenizeResult } from '@angular/compiler/src/ml_parser/lexer';
@Component({
    selector: 'app-GeneralaccountCreation',
    templateUrl: 'generalactmaster-IU.component.html',
    styles: [`
    table, tr, td, th{
        border: none;
        } `]
})

export class generalactmasterIU implements OnInit {
    Companylist:any;undergrouplist:any=[];  Companycode:any[];undergroup: string="";
    text: string="Submit";
    AccountName:string="";
    SacCode:string="";
    IsInvoiceAccount : boolean =false;
    IsBank:boolean=false;
    IsJobreport : boolean =false;
    IsEmployee: boolean =false;
    IsInvregreport:boolean=false;
    IsExpenselock:boolean=false;
    IsPurchaseshow:boolean=false;
    IsMUM : boolean =true;
    IsDEL : boolean =false;
    IsMAA : boolean =false;
    IsBLR : boolean =false;
    IsAMD : boolean =false;
    IsTRN:boolean=false;
    IsTRU:boolean=false;
    IsCOC:boolean=false;
    ID: string="0";
    Activecompany: any=[]; Activecompanycode: any=[]; listcnt: any; cmpArr :any=[];
    grp:string="";Sectionlist: any=[];CompanyList:any[];
    txtchild : string ="Add";TdsList :any=[];
    txtchildTDS: string="Add";
    IS_TDSApp :boolean =false;tdstype : string="";
    frmdt: any = ""; todt: any = "";sections: string="";secRate: string="0";tdsLimit : string="0";Pk_Tdsid : string="0";
    public isLoadingData: Boolean = false;
    public disableldcrate: Boolean = true;
    ldcRate:string="0";
    Company : string="";
    public disablecompany :Boolean = true;
    public disablelimitamt:Boolean=true;
    public disablecertno:Boolean=true;
    LdccertNo:string;
    FK_GENACT_MST_ID:string="0"
    ACCTCODE:string="0";
    TDSCompanyList:any=[];
    constructor( private _dataService: DataService,
        private _toasterService:ToastCommonService,
        private loaderService: LoaderService,
        private _router: Router,
        private http: HttpClient,
        private _activatedRoute: ActivatedRoute,
        private _loginService:LoginService,
        private _configuration: Configuration) { }
        public myDatePickerOptions: IMyDpOptions = {
            dateFormat: 'dd/mm/yyyy',
            inline: false,
            height: '20px',
            width: '180px',
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

        };
        Header: string="General Account Details"
ngOnInit()
{
    {
        this._activatedRoute.params.subscribe(params => {
            this.ID = params["ID"];
        })
    }
    const jsonmaster = {  CMPID:this._loginService.getLogin()[0].CMPID }
    this.loaderService.display(true);
    this._dataService.getData("Master/GenActMstpageload",jsonmaster)
    .subscribe((data: any) => {
      this.Sectionlist=data.Table;
      this.loaderService.display(false);
    });
        this._dataService.getAll("Master/MST_GENERAL_ACCOUNT_FILL")
        .subscribe((data: any) => {
        this.undergrouplist=data.Table;
        this.Companylist=data.Table1;
       });
       this._dataService.getAll("Common/FillCompany")
       .subscribe((data: any) => {
           this.TDSCompanyList=data.Table;
           this.loaderService.display(false);
       });
        // this._dataService.getAll("Master/MST_GENERAL_ACCOUNT_FILL")
        // .subscribe((data: any) => {
        //         this.Companylist=data.Table1;
        // });
    if(this.ID !=' ')
    {
        this.editpopulate()
        this.text='Update';
    }
}
onchnage(Companycode)
{
    console.log(Companycode)
}
getgroupcode(val){

    this.grp=val

}
editpopulate()
{
const jsonedit = { ID  :  this.ID,
                    MAKERID:this._loginService.getLogin()[0].CMPID,
                    MAKERIP:this._loginService.getLogin()[0].MAKERIP,
                    VGUID:this._loginService.getLogin()[0].GUID}
this._dataService.getData("Master/MST_GENERAL_ACCOUNT_POPULATE_NG", jsonedit)
.subscribe((data: any) => {

this.AccountName=    data.Table[0].acctname ;
this.FK_GENACT_MST_ID=this.ID;
console.log(this.FK_GENACT_MST_ID);
this.undergroup  =    data.Table[0].undergroup;
this.ACCTCODE  =    (data.Table[0].acctcode=='')?'' :data.Table[0].acctcode;
this.SacCode=data.Table[0].SACCode;
this.IsInvoiceAccount=     (data.Table[0].INVOICE=='Y')?true:false;
this.IsBank =    (data.Table[0].bank=='Y')?true:false;
this.IsJobreport =  (data.Table[0].IsJobReport=='Y')?true:false;
this.IsEmployee=  (data.Table[0].IsEmployee=='1')?true:false;
this.IsInvregreport= (data.Table[0].invreg_isreport=='Y')?true:false;
this.IsExpenselock= (data.Table[0].IsExpenseLock=='Y')?true:false;
this.IsPurchaseshow= (data.Table[0].IsPurchase_Show=='Y')?true:false;
this.IsMUM  =     (data.Table[0].MUM=='Y')?true:false;
this.IsDEL =    (data.Table[0].DEL=='Y')?true:false;
this.IsMAA =     (data.Table[0].MAA=='Y')?true:false;
this.IsBLR  =    (data.Table[0].BLR=='Y')?true:false;
this.IsAMD =    (data.Table[0].AMD=='Y')?true:false;
this.IsTRN =    (data.Table[0].TRN=='Y')?true:false;
this.IsTRU=    (data.Table[0].TRU=='Y')?true:false;
this.IsCOC =    (data.Table[0].COC=='Y')?true:false;
if(data.Table[0].IS_TDS_APP=="1"){
    this.IS_TDSApp=true
}
else{
    this.IS_TDSApp=false
}
this.grp=data.Table[0].undergroup;
this.TdsList=data.Table1
if (data.Table[0].Active_comp!=''){
    data.Table[0].Active_comp.split(',').forEach((item, index) => {
   this.cmpArr.push(item.trim());
});
}
 if(this.cmpArr[this.cmpArr.length - 1]==""){
    this.cmpArr.pop();
     this.Companycode=this.cmpArr;
 }
 else
 {
     this.Companycode=this.cmpArr;
 }
this.Companycode=this.cmpArr;
this.Activecompany=data.Table[0].Active_comp;
this.loaderService.display(false);
});
}
AddTDScildrcrd()
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
           const jsonmasterTDS = {  PKID: this.Pk_Tdsid ,
               FK_GENACT_MST_ID: this.FK_GENACT_MST_ID,
               ACCT_CODE:this.ACCTCODE ,
               SECTIONID:this.sections ,
               PER_RATE:this.secRate,
               FRMDT: fr_dt ,
               TODT: to_dt ,
               TDS_LIMIT_AMT: this.tdsLimit ,
               TDS_TYPE: this.tdstype ,
               MAKERID: this._loginService.getLogin()[0].CMPID   ,
               MAKERIP:  this._loginService.getLogin()[0].MAKERIP,
               VGUID:  this._loginService.getLogin()[0].GUID,
               LDCRATE:(this.ldcRate==undefined)?"0" :this.ldcRate,
               CMPCODE:(this.Company=="")?"0" :this.Company,
               LDCCERTNO:(this.LdccertNo=="")?"0" :this.LdccertNo,
               //MODEOFENTRY: this.queryParamsReqType,
              

           }
           this._dataService.Common("Master/MST_GENERAL_ACCOUNT_TDS_IU_NG", jsonmasterTDS)
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
      this.Pk_Tdsid="0";
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
AddMain()
    {
        this.Activecompany="";
        if(this.AccountName=="" || this.AccountName==undefined){
           this._toasterService.toast('warning', 'warning', 'Account name could not be blank !');
           return false;
        }
        if(this.undergroup==""){
            this._toasterService.toast('warning', 'warning', 'Please select Undergroup  !');
            return false;
         }
       //  if(this.ID==" ")
        // {
            if(this.Companycode!=undefined){
                this.Companycode.forEach((item, index) => {
                    this.Activecompany = this.Activecompany+item + ",";
                    this.listcnt=this.Companylist.filter((cntrylist:any)=>cntrylist.CMPCODE==item);
                    this.Activecompanycode=this.Activecompanycode+this.listcnt[0].CMPCODE + ",";
               });
            }

      //   }



        this.loaderService.display(true);
        const jsonmaster = {

        id :  this.ID,
        AccName :this.AccountName.replace("'","`")  ,
        UnderGroup:this.undergroup,
        SACCode:this.SacCode,
        Invoice:(this.IsInvoiceAccount==true)?"Y" :"",
        Bank:(this.IsBank==true)?"Y" :"",
        JobRpt:(this.IsJobreport==true)?"Y" :"",
        invreg_isreport:(this.IsInvregreport==true)?"Y" :"",
        IsExpenseLock:(this.IsExpenselock==true)?"Y" :"",
        IsPurchase_Show:(this.IsPurchaseshow==true)?"Y" :"",
        Mum:(this.IsMUM==true)?"Y" :"",
        Del:(this.IsDEL==true)?"Y" :"",
        Maa:(this.IsMAA==true)?"Y" :"",
        Blr:(this.IsBLR==true)?"Y" :"",
        Amd:(this.IsAMD==true)?"Y" :"",
        Dac:"",
        IsEmployee:(this.IsEmployee==true)?"1" :"",
        Company : this.Activecompany,//this.Activecompany.slice(this.Activecompany.length - 1),
        MakerID :  this._loginService.getLogin()[0].CMPID,
        MakerIP :  this._loginService.getLogin()[0].MAKERIP,
        VGUID:this._loginService.getLogin()[0].GUID,
        IS_TDS_APP: (this.IS_TDSApp==true) ?'1':'0'
        }
       this._dataService.Common("Master/MST_GENERAL_ACCOUNT_IU_NG", jsonmaster)
        .subscribe((data: any) => {
           if (data.Table[0].STATUS == "100") {
               if(this.ID==' ')
               {
            { this._toasterService.toast('success', 'success', 'General Account with code ' + data.Table[0].ACCTCODE + ' saved successfully!');   }
               this.loaderService.display(false);
               this.RestMain();
            }
            else if(this.ID!=' ')
            { this._toasterService.toast('success', 'success', 'General Account with code ' + data.Table[0].ACCTCODE +' updated successfully!');   }
            this.loaderService.display(false);
            this.RestMain();
           }
           else{   this._toasterService.toast("warning","warning" ,data.Table[0].STATUSTEXT  );
                    this.loaderService.display(false);
            }
        });
    }
    checkValue(event: any){
        console.log(event);
        if(event=="TDS"){
            this.IS_TDSApp=true;
        }else{
            this.IS_TDSApp=false; 
        }
     }
    RestMain()
    {
        this.ResetTDScildrcrd();
        this.AccountName ='';
        this.undergroup ='';
        this.SacCode='';
        this.IsInvoiceAccount=false;
        this.IsBank=false;
        this.IsJobreport=false;
        this.IsMUM=false;
        this.IsMAA=false;
        this.IsDEL=false;
        this.IsAMD=false;
        this.IsBLR=false;
        this.IsTRN=false;
        this.IsTRU=false;
        this.IsCOC=false;
        this.IsInvregreport=false;
        this.IsPurchaseshow=false;
        this.IsExpenselock=false;
        this.IsEmployee=false;
        this.Companycode=[];
        this.ID==' ';
        this.TdsList=[];
        this._router.navigate(['//master/generalaccount/GeneralAccount/ ']);
    }
}