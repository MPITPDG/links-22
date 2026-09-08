import {Component, OnInit} from '@angular/core';
import {DataService} from '../../shared/service/dataService';
import {ToastCommonService} from '../../shared/service/toastService';
import {LoaderService} from '../../shared/service/loader.service'; 
import {LoginService} from '../../shared/service/loginService';
import {AuthService} from '../../shared/service/authService';
import { Router} from '@angular/router';
 @Component({
    selector: 'app-GeneralMastersearch',
    templateUrl: 'generalactmaster-search.component.html'
})

export class generalactmastersearch implements OnInit   {
    config: any; 
    accountlist:any=[];
    Companylist:any;
    Undergroup: string="";
    IsInvoiceAccount : boolean =false;
    IsBank:boolean=false;
    IsJobreport : boolean =false;
    IsEmployee: boolean =false;
    IsInvregreport:boolean=false;
    IsExpenselock:boolean=false;
    IsPurchaseshow:boolean=false;
    IsMUM : boolean =false;
    IsDEL : boolean =false;
    IsMAA : boolean =false;
    IsBLR : boolean =false;
    IsAMD : boolean =false;
    IsTRN:boolean=false;
    IsTRU:boolean=false;
    IsCOC:boolean=false;
    AccountName:string="";
    AccountNameType: string = "B";
    UndergroupList:any=[]; 
    Type: string = 'NAME';
    Activecompany: any=[];Activecompanycode: any=[]; listcnt: any;Companycode:any[];

    constructor(
        private _router: Router,
        private _dataService: DataService,
        private _auth: AuthService,
        private _toasterService: ToastCommonService,
        private _loginService: LoginService,
        private loaderService: LoaderService,   
    
    ) {     }
    ngOnInit()
    {
      
       this._dataService.getAll("Master/MST_GENERAL_ACCOUNT_FILL")
      .subscribe((data: any) => {
       this.UndergroupList=data.Table;
        });   

      this._dataService.getAll("Master/MST_GENERAL_ACCOUNT_FILL")
      .subscribe((data: any) => {
             this.Companylist=data.Table1;
       });  

    }
      fnValidate_Name(): boolean {
      if (this.AccountName.trim().length === 0) {
         this._toasterService.toast('warning', 'warning', 'Please enter Account Name ');
          return false;
      } else
         return true;
       }

       fnValidate_Undergroup(): boolean {
         if (!this.Undergroup) {
            this._toasterService.toast('warning', 'warning', 'Please select Undergroup ');
             return false;
         }
         return true;
        }

        fnValidate_Type(): boolean {
         if ((!this.IsInvoiceAccount==true) && (!this.IsBank==true) && (!this.IsJobreport==true) &&
         (!this.IsInvregreport==true) && (!this.IsExpenselock==true) && (!this.IsPurchaseshow==true)
         && (!this.IsEmployee==true))
         {
            this._toasterService.toast('warning', 'warning', 'Please select any Affecting Area ');
            return false;
         }
          else
         {
            return true;
         }
         }

         fnValidate_City(): boolean {
            if ((!this.IsMUM==true) && (!this.IsDEL==true) && (!this.IsMAA==true) &&
            (!this.IsBLR==true) && (!this.IsAMD==true) && (!this.IsTRN==true) && (!this.IsTRU==true)&& (!this.IsCOC==true))
            {
               this._toasterService.toast('warning', 'warning', 'Please select City ');
               return false;
            }
             else
            {
               return true;
            }
            }

            fnValidate_Company(): boolean {
             
               if (this.Companycode==undefined) {
                  this._toasterService.toast('warning', 'warning', 'Please select Company ');
                   return false;
               }
               else
            {
               return true;
            }
            }

            
    search() {
      this._loginService.verifyRights(176, '')
      .subscribe((data: any) => { 
          this._loginService.checkVerify('View', data); 
          
      });
      let SearchType = "";
      if (this.Type == 'NAME') { if (this.fnValidate_Name()) { SearchType = "AN"; this.getData(SearchType); }; }
      //if (this.Type == 'NAME') { SearchType = "AN"; this.getData(SearchType); }
      //else if (this.Type == 'UnderGroupwise') {  SearchType = "UG"; this.getData(SearchType); }
      else if (this.Type == 'UnderGroupwise') { if (this.fnValidate_Undergroup()) { SearchType = "UG"; this.getData(SearchType); }; }
      else if (this.Type == 'Typewise') { if (this.fnValidate_Type()) { SearchType = "TYPE"; this.getData(SearchType); }; }
      //else if (this.Type == 'Typewise') {  SearchType = "TYPE"; this.getData(SearchType);  }
      else if (this.Type == 'Citywise') { if (this.fnValidate_City()) { SearchType = "CITY"; this.getData(SearchType); }; }
    //  else if (this.Type == 'Citywise') {  SearchType = "CITY"; this.getData(SearchType);  }
      //else if (this.Type == 'Companywise') { SearchType = "COMPANY"; this.getData(SearchType); 
      else if (this.Type == 'Companywise') { if (this.fnValidate_Company()) { SearchType = "COMPANY"; this.getData(SearchType); }; }
    
      }

       getData(searchtype) {
          if (searchtype=="COMPANY")
          { 
            this.Companycode.forEach((item, index) => {              
            this.Activecompany = this.Activecompany+item + ",";           
            this.listcnt=this.Companylist.filter((cntrylist:any)=>cntrylist.CMPCODE==item);
            this.Activecompanycode=this.Activecompanycode+this.listcnt[0].CMPCODE + ",";  
             });
          }
         const _jsonData = {
            Mode: searchtype,
            AccName: this.AccountName.replace("'","`")  , 
            AccOption:this.AccountNameType.replace("'","`") , 
            UnderGroup: (this.Undergroup)  ? this.Undergroup : "",
            Invoice:(this.IsInvoiceAccount==true)?"Y" :"",   
            Bank:(this.IsBank==true)?"Y" :"",   
            JobRpt:(this.IsJobreport==true)?"Y" :"", 
            invreg_isreport:(this.IsInvregreport==true)?"Y" :"", 
            IsExpenseLock:(this.IsExpenselock==true)?"Y" :"", 
            IsPurchase_Show:(this.IsPurchaseshow==true)?"Y" :"", 
            MUM:(this.IsMUM==true)?"Y" :"", 
            DEL:(this.IsDEL==true)?"Y" :"", 
            MAA:(this.IsMAA==true)?"Y" :"", 
            BLR:(this.IsBLR==true)?"Y" :"", 
            AMD:(this.IsAMD==true)?"Y" :"", 
            TRN:(this.IsTRN==true)?"Y" :"", 
            TRU:(this.IsTRU==true)?"Y" :"", 
            COC:(this.IsCOC==true)?"Y" :"", 
            IsEmployee:(this.IsEmployee==true)?"Y" :"",
            Company :this.Activecompany 
          };
       
            this.loaderService.display(true);
            this._dataService.getData("Master/MST_GENERAL_ACCOUNT_SEARCH",_jsonData)
            .subscribe((data: any) => {
            this.accountlist = data.Table;      
            this.loaderService.display(false);      
             });
             this.config = {
               itemsPerPage: 10,
               currentPage: 1,
               totalItems: this.accountlist.count
             };  
     }
     onchnage(Companycode)
   {
    console.log(Companycode)
   }
     /* searchlist() {
      
        
        this.loaderService.display(true);
      
         const jsoncompany = {Mode:"",AccName:"",AccOption:"",UnderGroup:"",Invoice:"",
         Bank:"",JobRpt:"",MUM:"",DEL:"",MAA:"",BLR:"",AMD:"",DAC:"",Company:""
        }
         this._dataService.getData("Master/MST_GENERAL_ACCOUNT_SEARCH",jsoncompany)
            .subscribe((data: any) => {
           this.accountlist = data.Table;      
           this.loaderService.display(false);             
    
   });
 
}*/
   
pageChanged(event){
   this.config.currentPage = event;
 }

   ListOnclick(ID)
   {
    //// this._router.navigate(['/admin/company/companyIU/'+CODE]);
     this._router.navigate(['/master/generalaccount/GeneralAccount/'+ID]);
   }

   
   back() {
      //this.result.emit(true);
      //this._router.navigate(['/master/generalaccount/GeneralAccountsearch']);
      this._router.navigate(['/master/generalaccount/GeneralAccountsearch']).then(()=>  {window.location.reload();});
  }
  check(val) 
   {
    console.log(val)
   }
  handleChangeacc(val)
    {
      if(val==1)
      {
   this.IsInvregreport=false;
   this.IsBank=false;
   this.IsJobreport=false;
   this.IsPurchaseshow=false;
   this.IsEmployee=false;
   this.IsExpenselock=false;
   this.IsInvoiceAccount=false;
   this.IsMUM=false;
   this.IsDEL=false;
   this.IsTRN=false;
   this.IsTRU=false;
   this.IsCOC=false;
   this.IsMAA=false;
   this.IsAMD=false;
   this.IsBLR=false;
   this.Companycode=[];
   this.Undergroup ='';  
   }
   if(val==2)
   {
      this.IsInvregreport=false;
      this.IsBank=false;
      this.IsJobreport=false;
      this.IsPurchaseshow=false;
      this.IsEmployee=false;
      this.IsExpenselock=false;
      this.IsInvoiceAccount=false;
      this.IsMUM=false;
      this.IsDEL=false;
      this.IsTRN=false;
      this.IsTRU=false;
      this.IsCOC=false;
      this.IsMAA=false;
      this.IsAMD=false;
      this.IsBLR=false;
      this.Companycode=[];
      this.AccountName=""; 
      }
      if(val==3)
      {
         this.Undergroup =''; 
         this.IsMUM=false;
         this.IsDEL=false;
         this.IsTRN=false;
         this.IsTRU=false;
         this.IsCOC=false;
         this.IsMAA=false;
         this.IsAMD=false;
         this.IsBLR=false;
         this.Companycode=[];
         this.AccountName="";   
      }
      if(val==4)
      {
         this.Undergroup =''; 
         this.IsInvregreport=false;
         this.IsBank=false;
         this.IsJobreport=false;
         this.IsPurchaseshow=false;
         this.IsEmployee=false;
         this.IsExpenselock=false;
         this.IsInvoiceAccount=false;
         this.Companycode=[];
         this.AccountName=""; 
      }  
      if(val==5)
      {
         this.IsInvregreport=false;
         this.IsBank=false;
         this.IsJobreport=false;
         this.IsPurchaseshow=false;
         this.IsEmployee=false;
         this.IsExpenselock=false;
         this.IsInvoiceAccount=false;
         this.IsMUM=false;
         this.IsDEL=false;
         this.IsTRN=false;
         this.IsTRU=false;
         this.IsCOC=false;
         this.IsMAA=false;
         this.IsAMD=false;
         this.IsBLR=false;
         this.AccountName=""; 
         this.Undergroup =''; 
      }  
}
   handleChangegrp(event)
  {
   this.IsInvregreport=false;
   this.IsBank=false;
   this.IsJobreport=false;
   this.IsPurchaseshow=false;
   this.IsEmployee=false;
   this.IsExpenselock=false;
   this.IsInvoiceAccount=false;
   this.IsMUM=false;
   this.IsDEL=false;
   this.IsTRN=false;
   this.IsTRU=false;
   this.IsCOC=false;
   this.IsMAA=false;
   this.IsAMD=false;
   this.IsBLR=false;
   this.Companycode=[];
   this.AccountName=""; 
   }
   handleChangetype(event)
   {
    this.Undergroup =''; 
    this.IsMUM=false;
    this.IsDEL=false;
    this.IsTRU=false;
    this.IsTRN=false;
    this.IsCOC=false;
    this.IsMAA=false;
    this.IsAMD=false;
    this.IsBLR=false;
    this.Companycode=[];
    this.AccountName=""; 
    }
    handleChangecity()
    {
      this.Undergroup =''; 
      this.IsInvregreport=false;
      this.IsBank=false;
      this.IsJobreport=false;
      this.IsPurchaseshow=false;
      this.IsEmployee=false;
      this.IsExpenselock=false;
      this.IsInvoiceAccount=false;
      this.Companycode=[];
      this.AccountName=""; 
      }
      handleChangecmp(event)
      {
       this.IsInvregreport=false;
       this.IsBank=false;
       this.IsJobreport=false;
       this.IsPurchaseshow=false;
       this.IsEmployee=false;
       this.IsExpenselock=false;
       this.IsInvoiceAccount=false;
       this.IsMUM=false;
       this.IsDEL=false;
       this.IsTRN=false;
       this.IsTRU=false;
       this.IsCOC=false;
       this.IsMAA=false;
       this.IsAMD=false;
       this.IsBLR=false;
       this.AccountName=""; 
       this.Undergroup =''; 
       }
}