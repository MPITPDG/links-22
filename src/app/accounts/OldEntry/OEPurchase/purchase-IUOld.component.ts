import { Component, OnInit } from '@angular/core';
import { IMyDpOptions } from 'mydatepicker';
import{DataService} from '../../../shared/service/dataService';
import { LoginService } from '../../../shared/service/loginService';
import { ToastCommonService } from '../../../shared/service/toastService';
import { LoaderService } from '../../../shared/service/loader.service'; 
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
@Component({
    templateUrl: 'purchase-IUOld.component.html'
})
export class PurchaseOEComponent implements OnInit {
    chkrules:string="N";
    public chkoriginactdtl:boolean=false;
    public chkactwisedtl:boolean=false;
    public showhidebtn:boolean=false;
    public disablePurchaseno:boolean=false;
    Accountwiselist:any=[];
    OriginalAccountlist:any=[];
    Allitemlist: any = [];
    supplierlist: any = [];
    codelistActt: any = [];
    PassedBylist: any = [];
    billaddress: string = "";
    InvNo: string = "";
    InvDate: any = "";
    BillReceive: any = "";
    DueDate: any = "";
    suppliername: string;
    passedby: string = "";
    IsPassed: boolean = false;
    PurchaseNo: string = "";
    PurchaseDate: any = "";
    Narration: string = "";
    PassedAmount: string = "";
    InvoiceAmount: string = "";
    VoucherNo: string = "";
    AccountName: string;
    AccountNameList: any = [];
    Item: string;
    ItemList: any = [];
    Amount: string = "";
    Deduction: string = "";
    JobNo: string = "";
    actpassedamount: string = "";
    ActNarration: string = "";
    NetAmount: any = "0";
    Netdeduction: any = "0";
    text: string = "Submit"; txtchild: string = "Add";
    ID: string = "0";
    ENTRYNO: string = "0";
    CLIENT: string = "";
    ISNOTEDITABLE: string = "0";
    ACCTNAME: string = "";
    ACCBANKDTLSID: string = "0";
    STATUS: string = "PI";
    Accountlist: any = [];
    billaddressList: any = [];
    billaddressfilter:any=[];
    Itemslist: any = [];
    NetAmt: string = "0"; Type: string = "";
    lblNetSummary: string ="2.Net Amount will be same.";
    ISOLDENTRY:string;
    OLD_NETAMOUNT:any;
    OLD_DEDUCTION:any;
    OLDNETTOTAMT:any;
    NEWNETTOTAMT:any;
    public togglevno: boolean = true;
    public togglepassedby: boolean = true;
    public togglepamount: boolean = true;
    public toggleinvamount: boolean = true;
    public showModal_MAWB: boolean = false;
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
        private _dataService: DataService, 
        private _toasterService:ToastCommonService, 
        private loaderService: LoaderService, 
        private _router: Router,
        private http: HttpClient, 
        private _activatedRoute: ActivatedRoute,
        private _loginService:LoginService,   ) { }
    ngOnInit() { 
        const jsonparam = {
            cmp_code: this._loginService.getLogin()[0].CMPCODE,
            citycode: this._loginService.getLogin()[0].CITYCODE,
            citycode1: this._loginService.getLogin()[0].CITYCODE1,
            PSTATUS: this.STATUS
                    }
           this.loaderService.display(true);
           this._dataService.getData("Accounts/ACC_PURCHASE_PAGELOAD", jsonparam)
            .subscribe((data: any) => {       
              this.AccountNameList = data.Table;
              this.supplierlist = data.Table1;
              this.PassedBylist = data.Table2;
              this.Allitemlist = data.Table3;
              this.billaddressList = data.Table4;
            })
            this.loaderService.display(false);
    }
    showrules(chktype){
        if(chktype=='R'){
        if(this.chkrules=='N'){
        this.chkrules="Y";
    }else{
    this.chkrules="N";
        }
    }
    else if(chktype=='OA'){
        if(this.chkoriginactdtl==false){
        this.chkoriginactdtl=true;
    }else{
    this.chkoriginactdtl=false;
        }
    }  
    else if(chktype=='A'){
        if(this.chkactwisedtl==false){
        this.chkactwisedtl=true;
    }else{
    this.chkactwisedtl=false;
        }
    }         
}
    ShowoldData() {
        if (this.Validate_PURCHASE_OldEntryNo() == false) {
            return false;
        }
        else {
            const jsonview = { 
                CMPCODE:this._loginService.getLogin()[0].CMPCODE,
                CITYCODE:this._loginService.getLogin()[0].CITYCODE,
                ENTRYNO  : this.PurchaseNo,
                VGUID:this._loginService.getLogin()[0].GUID,
                STATUS:"PI",
                CMPID:this._loginService.getLogin()[0].CMPID,
                }
                this._dataService.getData("Accounts/ACC_PURCHASE_VIEW_OLD", jsonview)
                .subscribe((data: any) => { 
                    this.PurchaseNo  = data.Table2[0].PUR_CODE;
                    this.PurchaseDate  = data.Table2[0].PUR_DATE;
                    this.suppliername= data.Table2[0].PUR_SUPPLIER;
                    this.GetSupplierName(this.suppliername);
                    this.InvNo=data.Table2[0].PUR_INVNO;
                    this.InvDate= (data.Table2[0].PUR_SUPINVDATE != "") ? this._dataService.stringdttoArry(data.Table2[0].PUR_SUPINVDATE) : "";
                    this.BillReceive= (data.Table2[0].PUR_SUPBILLDATE != "") ? this._dataService.stringdttoArry(data.Table2[0].PUR_SUPBILLDATE) : "";
                    this.DueDate=(data.Table2[0].PUR_DUEDT != "") ? this._dataService.stringdttoArry(data.Table2[0].PUR_DUEDT) : "";
                    this.IsPassed = (data.Table2[0].PASS == 'Y') ? true : false;
                    this.passedby = data.Table2[0].PASSEDBY;
                    this.VoucherNo = data.Table2[0].VOUCHERNO;
                    this.PassedAmount = data.Table2[0].PASSEDAMOUNT;
                    this.InvoiceAmount = data.Table2[0].SUPINVAMT;
                    this.Narration= data.Table2[0].REMARKS;
                    this.Accountlist = data.Table;
                    this.OriginalAccountlist=data.Table;
                    this.Accountwiselist=data.Table1
                    this.NetAmount=data.Table3[0].TOTAMOUNT;
                    this.Netdeduction=data.Table3[0].TOTDEDUCTION;
                    this.NetAmt  =data.Table3[0].NETTOTAL;
                    this.OLD_NETAMOUNT=data.Table3[0].TOTAMOUNT;
                    this.OLD_DEDUCTION=data.Table3[0].TOTDEDUCTION;
                    this.OLDNETTOTAMT=data.Table3[0].NETTOTAL;
                
                   // this.OldNetTotal=data.Table[0].ACTUALAMOUNT;
                    this.lblNetSummary=data.Table3[0].MSG_LINE2;
                    this.chkrules='Y'
                    this.showhidebtn=true;
                    this.disablePurchaseno=true;
     
        })
        }
    }
    Addchildrcrd() {
      if (this.AccountName == "" || this.AccountName == undefined) {
        this._toasterService.toast('warning', 'warning', 'Please select Account  !');
        return false;
      }
      if (this.Itemslist.length>0){
        if (this.Item == "" || this.Item == undefined) {
          this._toasterService.toast('warning', 'warning', 'Please select Item  !');
          return false;
        }
      }
      if (this.suppliername==this.AccountName.split('|')[0])
      {
        this._toasterService.toast('warning', 'warning', 'Supplier and Account Name Should be different .!');     
        return false; 
      }
      if ((this.Amount == "" || this.Amount == undefined ||  this.Amount == '0' ) && (this.Deduction == "" || this.Deduction == undefined  || this.Deduction == '0')) {
        this._toasterService.toast('warning', 'warning', 'Please enter Amount or Deduction.!');
        return false;
      }
  
      if (parseFloat(this.Amount) >0 && parseFloat(this.Deduction )>0) {
        this._toasterService.toast('warning', 'warning', 'Invalid Amount - Please Check !');
        return false;
      }
      if (parseFloat(this.Amount) < 0 && parseFloat(this.Deduction )>0) {
        this._toasterService.toast('warning', 'warning', 'Invalid Amount - Please Check !');
        return false;
      }
      if (parseFloat(this.Deduction) < 0) {
        this._toasterService.toast('warning', 'warning', 'Invalid Amount - Please Check !');
        return false;
      }
      let clientcodeval=this.AccountName.split("|")[1];
      if(clientcodeval=='Y') {
          if(this.JobNo.length==0) {
          this._toasterService.toast('warning', 'warning', 'Please Enter JobNo !');
          return false;   
          } 
      } 
      let ITEMCODEvl; let ITEMvl; let ITEMDT
      ITEMCODEvl= (this.Item == null)? "" : this.Item.split("|")[0];
      ITEMvl= (this.Item == null)? "" : this.Item.split("|")[2];
      ITEMDT =(this.Item == null)? "" : this.Item;
        const jsonchild = {
        ID: this.ID,
        ENTRYNO: this.ENTRYNO,
        CLIENT: this.AccountName.split("|")[0],
        JOBNO: this.JobNo,
        DEDUCTION: (this.Deduction == "")? "0": this.Deduction,
        AMOUNT: (this.Amount == "") ? "0": this.Amount,
        USERNAME: this._loginService.getLogin()[0].CMPID,
        NARRATION: this.ActNarration,
        IS_NOT_EDIT_ABLE: this.ISNOTEDITABLE,
        ITEMCODE:ITEMCODEvl,
        VGUID: this._loginService.getLogin()[0].GUID,
        ACCOUNT_NAME: this.ACCTNAME,
        ITEM: ITEMvl,
        ACC_PURCHASEDTLS_ID: this.ACCBANKDTLSID,
        STATUS: this.STATUS,
        IsJobReport: this.AccountName.split("|")[1],
        ITEM_DATAVALUE: ITEMDT,
        SRPIPASSAMOUNT:( this.actpassedamount == "" ||  this.actpassedamount == null)? "0": this.actpassedamount,
        cmpid:this._loginService.getLogin()[0].CMPID
      }
     // console.log(jsonchild)
     this.loaderService.display(true);
      this._dataService.Common("Accounts/ACC_PURCHASE_TMP_IU", jsonchild)
        .subscribe((data: any) => {
       //   console.log(data)
          if (data.Table[0].STATUS == "100") {
            this._toasterService.toast("success", "success", data.Table[0].STATUSTEXT)
            this.Accountlist = data.Table;
            this.NetAmount = data.Table1[0].TOTAMOUNT;
            this.Netdeduction = data.Table1[0].TOTDEDUCTION;
            this.NetAmt = data.Table1[0].NETTOTAL;
            this.Resetchildrcrd();
            this.loaderService.display(false);
  
          }
          else {
            this._toasterService.toast("warning", "warning", data.Table[0].STATUSTEXT);
            this.loaderService.display(false);
          }
        });
    }
    changeEvent(event) {
      if (event.target.checked) {
  
        this.togglevno = false;
        this.togglepassedby = false;
        this.togglepamount = false;
        this.toggleinvamount = false;
      }
      else {
        this.togglevno = true;
        this.togglepassedby = true;
        this.togglepamount = true;
        this.toggleinvamount = true;
      }
    }
  
    GetActName(Acctcode) {
      this.codelistActt = this.AccountNameList.filter((code: any) => code.ACCTCODENAME === Acctcode);
      //console.log(this.codelistActt)
      this.ACCTNAME = this.codelistActt[0].ACCTNAME;
      //console.log(Acctcode.split("|")[0])
      this.Itemslist = this.Allitemlist.filter((code: any) => code.ACCTCODE === Acctcode.split("|")[0]);
  
    }
     Editchildrecd(id) {
        let filterData = this.Accountlist.filter((filter) => filter.ID == id)[0];
        if ( filterData.IS_NOT_EDIT_ABLE == "1") {
          alert("You cannot edit this reocrd!")
          return false;
        }
        else{
        this.ID = filterData.ID;
        this.AccountName = filterData.CLIENT + '|' + filterData.ISJOBREPORT;
        this.ACCTNAME=filterData.ACCOUNT_NAME;
        this.Amount = filterData.AMOUNT;
        this.Deduction = filterData.DEDUCTION;
        this.actpassedamount = filterData.SRPIPASSAMOUNT;
        this.Itemslist = this.Allitemlist.filter((code: any) => code.ACCTCODE === filterData.CLIENT);
        this.Item = (filterData.ITEM_DATAVALUE== "") ?null:filterData.ITEM_DATAVALUE;
        this.JobNo = filterData.JOBNO;
        this.ActNarration = filterData.NARRATION;
        this.txtchild = "Update";
        this.ACCBANKDTLSID = filterData.ACC_PURCHASEDTLS_ID;
        this.ISNOTEDITABLE = filterData.IS_NOT_EDIT_ABLE;
        }
      }
    
     deletechildrecd(id) {
        if (this.ISNOTEDITABLE == "1") {
          alert("You cannot delete this record!")
        }
        else {
          if (confirm('Are you sure want to delete the record ?')) {
            this.loaderService.display(true);
            const jsondelete = { ID: id, VGUID: this._loginService.getLogin()[0].GUID, ACC_PURCHASEDTLS_ID: this.ACCBANKDTLSID }
            this._dataService.getData("Accounts/ACC_PURCHASE_TMP_DEL", jsondelete)
              .subscribe((data: any) => {
               // console.log(data)
                if (data.Table[0].STATUS == "100") {
                  this.Accountlist = data.Table;
                  this.NetAmount=data.Table1[0].TOTAMOUNT;
                  this.Netdeduction=data.Table1[0].TOTDEDUCTION;
                  this.NetAmt=data.Table1[0].NETTOTAL;
                  this._toasterService.toast('info', 'Complete', data.Table[0].STATUSTEXT);
                  this.loaderService.display(false);
                }
                else {
                  this._toasterService.toast('info', 'Complete', data.Table[0].STATUSTEXT);
                  this._toasterService.toast("warning", "warning", "Error in Deleting");
                  this.loaderService.display(false);
                }
              });
          }
          else { return false; this.loaderService.display(false); }
        }
       }
     Validate_PURCHASE_OldEntryNo(){
            if (this.PurchaseNo.substring(11, 12) != '9' && this.PurchaseNo.length != 15 ) {
                alert("You have entered Entryno. is not of Purchase No. !!");
                return false;
            }
       }  
     Add_Main() {
        if(this.ISOLDENTRY=="1")   {
          if (this.Validate_OLD_NEW_NETAMT_IU() == false) {
            return false;
        }
        }
        if (this.PurchaseDate== "" || this.PurchaseDate == undefined) {
          this._toasterService.toast('warning', 'warning', 'Purchase Date cannot be left blank!');
          return false;
        }
            if (this.suppliername == "" || this.suppliername == undefined) {
              this._toasterService.toast('warning', 'warning', 'Please select Supplier !');
              return false;
            }
            if (this.InvNo == "" || this.InvNo == undefined) {
              this._toasterService.toast('warning', 'warning', 'Supplier Invoice No cannot be left blank!');
              return false;
            }
            if (this.InvDate.formatted== "" || this.InvDate == undefined) {
              this._toasterService.toast('warning', 'warning', 'Supplier Invoice Date cannot be left blank!');
              return false;
            }
            if(this._dataService.date2Comparison(this.DueDate.formatted,this.PurchaseDate.formatted)==false)
            {
              this._toasterService.toast('warning', 'warning', 'Due date Cannot be Less than Purchase Entry date');
              return false;
            }
            var tot_amount =this.NetAmount;
            var tot_deduction = this.Netdeduction;
            if ((parseFloat(tot_amount) + parseFloat(tot_deduction)) < 0.01) {
              this._toasterService.toast('warning', 'warning','Sum of Total Amount and Deduction cannot be Less Than 0.01');
                return false;
            }
            this.loaderService.display(true);
            var data;
            data = this.supplierlist.filter((code: any) => code.VALUEFIELD === this.suppliername)[0].TEXTFIELD;
            const jsonmaster = {
              CMPID: this._loginService.getLogin()[0].CMPID,
              CMPCODE: this._loginService.getLogin()[0].CMPCODE,
              CITYCODE1: this._loginService.getLogin()[0].CITYCODE1,
              CITYCODE: this._loginService.getLogin()[0].CITYCODE,
              USERNAME: this._loginService.getLogin()[0].CMP_USERNAME,
              ENTRYNO: (this.PurchaseNo == undefined) ? "" : this.PurchaseNo,
              ENTRYDT: this.PurchaseDate,
              STATUS: this.STATUS,
              SUP_CODE: this.suppliername,
              SUP_NAME: data,
              SUP_INVNO: this.InvNo,
              SUP_INVDT: (this.InvDate) ?this.InvDate.formatted : "",
              SUP_BILLRECEIVEDDT:  (this.BillReceive) ?this.BillReceive.formatted : "",
              SUP_DUEDT:   (this.DueDate) ?this.DueDate.formatted : "",
              PASSFLAG: (this.IsPassed == true) ? "Y" : "",
              PASSEDBY: (this.passedby == "") ? "0" : this.passedby,
              PASSEDAMT: (this.PassedAmount == "") ? "0" : this.PassedAmount,
              INVAMT: (this.InvoiceAmount == "") ? "0" : this.InvoiceAmount,
              VOUCHERNO: (this.VoucherNo == "") ? "0" : this.VoucherNo,
              MAWBN0: "",
              FREIGHTG100235: "0",
              SURCHARGEG101468: "0",
              AIRFRTCOMMG100153: "0",
              FRTREBATEG100186: "0",
              NARRATION: this.Narration,
              ACTUALAMOUNT: this.NetAmt,
              VGUID: this._loginService.getLogin()[0].GUID,
              MAKER_ID: this._loginService.getLogin()[0].CMPID,
              MAKER_IP: this._loginService.getLogin()[0].MAKERIP,
              ACTION: (this.PurchaseNo == '' || this.PurchaseNo == undefined) ? "INSERT" : "UPDATE",
              DOCUMENTG100179: "0",
              FK_SUP_ADDR_ID:  (this.billaddress.split("|")[0]=="") ?"0":this.billaddress.split("|")[0],
              AMSENSEXP_G102024: "0",
              MISCEXP_G102025: "0"
            }
            let url = "";
            if (this.PurchaseNo == ' ' || this.PurchaseNo == undefined) {
              url = "Accounts/ACC_PURCHASE_INSERT"
            }
            else {
              url = "Accounts/ACC_PURCHASE_UPDATE"
            } 
            this._dataService.Common(url, jsonmaster)
              .subscribe((data: any) => {
               // console.log(data)
                if (data.Table[0].STATUS == "100") {
                  this._toasterService.toast('success', 'success', data.Table[0].STATUSTEXT);
                  this.loaderService.display(false);
                  this.RestMain();
                  this.showhidebtn=false;
                  this.disablePurchaseno=false;
                }
                else {
                  this._toasterService.toast('success', 'success', data.Table[0].STATUSTEXT);
                  this.loaderService.display(false);
                  this.RestMain();
                  this.showhidebtn=false;
                  this.disablePurchaseno=false;
                }
              });
          } 
        Validate_OLD_NEW_NETAMT_IU() {   
          this.NEWNETTOTAMT=this.NetAmount-this.Netdeduction;
          if ((this.NEWNETTOTAMT) != (this.OLDNETTOTAMT)) {
           alert('Failed to Submit!\n\nOriginal Net Total [' + this.OLDNETTOTAMT + '] (i.e., Total Amount [' + this.OLD_NETAMOUNT + '] less Total Deduction [' + this.OLD_DEDUCTION + ']) is not equal to Current Net Total [' + this.NEWNETTOTAMT + '] (i.e., Total Amount [' + this.NetAmount + '] less total Deduction [' + this.Netdeduction + '])\n');
                 return false;
        }
          } 
        RestMain() {
            this.Resetchildrcrd();
            this.InvNo = "";
            this.InvDate = "";
            this.DueDate = "";
            this.BillReceive = ""
            this.PurchaseNo = '';
            this.PurchaseDate = '';
            this.passedby = '';
            this.PassedAmount = '';
            this.InvoiceAmount = '';
            this.suppliername = undefined;
            this.VoucherNo = '';
            this.IsPassed = false;
            this.Narration = '';
            this.NetAmount = '';
            this.Netdeduction = '';
            this.NetAmt = '';
            this.text = "Submit";
            this.lblNetSummary='2. Net Amount will be same.';
            this.Accountlist=[];
            this.OriginalAccountlist=[];
            this.Accountwiselist=[];
            this.billaddressfilter=[];
            this.Clearall();
            this._router.navigate(['/accounts/OldEntry/OEPurchase/Add/ ']); 
          } 
          Reset() {
            if(confirm('Are you sure you want to reset all data?')){
            this.Resetchildrcrd();
            this.InvNo = "";
            this.InvDate = "";
            this.DueDate = "";
            this.BillReceive = ""
            this.PurchaseNo = '';
            this.PurchaseDate = '';
            this.passedby = '';
            this.PassedAmount = '';
            this.InvoiceAmount = '';
            this.suppliername = undefined;
            this.VoucherNo = '';
            this.IsPassed = false;
            this.Narration = '';
            this.NetAmount = '';
            this.Netdeduction = '';
            this.NetAmt = '';
            this.text = "Submit";
            this.lblNetSummary='2. Net Amount will be same.';
            this.Accountlist=[];
            this.OriginalAccountlist=[];
            this.Accountwiselist=[];
            this.billaddressfilter=[];
            this.Clearall();
            this.showhidebtn=false;
            this.disablePurchaseno=false;
            this._router.navigate(['/accounts/OldEntry/OEPurchase/Add/ ']); 
          } 
          }  
        Resetchildrcrd() {
            this.ID = "0";
            this.AccountName = undefined;
            this.JobNo = "";
            this.Deduction = "";
            this.Amount = "";
            this.ActNarration = "";
            this.Item = undefined;
            this.actpassedamount = "";
            this.txtchild = "Add";
          }
        Clearall(){
            const jsonmaster={CMPID:this._loginService.getLogin()[0].CMPID}
            this._dataService.getData("Accounts/ACC_PURCHASE_RESTALL", jsonmaster)
            .subscribe((data: any) => {
            });
          }   
        supplier_validation() {
            if (this.suppliername == "" || this.suppliername == undefined) {
              this._toasterService.toast('warning', 'warning', 'Please select Supplier !');
              return false;
            }
            if (this.InvNo == "" || this.InvNo == undefined) {
              this._toasterService.toast('warning', 'warning', 'Supplier Invoice No cannot be left blank!');
              return false;
            }
            const jsonview = {
              SUPCODE: this.suppliername,
              SUPINVNO:this.InvNo,
              ENTRYNO: this.PurchaseNo
            }
            this._dataService.getData("Accounts/ACC_PURCHASE_SUPINVNO_VALIDATE", jsonview)
              .subscribe((data: any) => {
                if (data.Table[0].STATUS.split('#')[0] == '100') {
                   this.Add_Main();
                 } 
                 else{
                  var answer = confirm("Record with same supplier and invoice number already exists.\n Click Ok to Add & Cancel to Retry!");
                  if (answer == false)  {return false; }	
                  else{  this.Add_Main();  }
                 }        
              });
          }  
          GetSupplierName(Suppcode){
            this.billaddressfilter= this.billaddressList.filter((x: any) => x.SUPPCODE === Suppcode);
              if( this.billaddressfilter.length =="1"){
                this.billaddress= this.billaddressfilter[0].DATAVALUEFIELD
              }
          }
}