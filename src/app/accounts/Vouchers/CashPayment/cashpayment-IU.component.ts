import { Component, OnInit } from '@angular/core';
import { ActivatedRoute,Router } from '@angular/router';
import { IMyDpOptions } from 'mydatepicker';
import { DataService } from 'src/app/shared/service/dataService';
import { LoaderService } from 'src/app/shared/service/loader.service';
import { LoginService } from 'src/app/shared/service/loginService';
import { ToastCommonService } from 'src/app/shared/service/toastService';
@Component({
  
  selector: 'app-cashpayment',
  templateUrl: './cashpayment-IU.component.html',
  styles: []
})
export class CashPaymentComponent implements OnInit {
  EntryNo: string = " "
  EntryDate: any = null
  Narration: string = ""
  AccountNameList: any = []
  AccountName: string
  ItemName: string 
  Allitemlist: any = []
  entrytype: string 
  department: string 
  billno: string = ""
  jobno: string = ""
  Amount: string = ""
  Deduction: string = ""
  ActNarration: string = ""
  NetTotal: string = ""
  NetAmount: string = ""
  Netdeduction: string = ""
  EntryTypeName:string=""
  Accountlist: any = []
  AccountNameTable: any = []
  text = "Submit"; txtchild = "Add"
  Type:string ="";
  HeaderText: string="";
  TotalAmount: string="0";
  TotalDeduction: string="0";
  public myDatePickerOptionsInv: IMyDpOptions = {
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
    disableUntil: { year: 0, month: 0, day: 0 },
    disableSince: { year: 0, month: 0, day: 0 }
  };
  departmenttable: any = [];
  entrytypetable: any = [];
  Allitemtable: any = [];
  PKID_CR: string = "0";
  BankDetailId: string = "0"
  filteitemtable: any;
  CR_iseditable: string = "0"
  emp_code: any;
  fromright_dt: any="";
  queryParamsUserId: any;
  ACCTNAME: any;

  public disable_deduction: boolean = false;



  constructor(private _dataService: DataService, private _activatedRoute: ActivatedRoute, private _toasterService: ToastCommonService,
   private _router: Router,
    private _loginService: LoginService, private loaderService: LoaderService) { }


  ngOnInit() {
    this._activatedRoute.params.subscribe(params => {
      // console.log(params)
       this.queryParamsUserId = params["EntryNo"];
       this.Type= params["Type"];
       if (this.Type=="CE"){this.HeaderText="CASH EXPENCE"}
       else{this.HeaderText="CASH PAYMENT"}
     })
     this.EntryDate = new Date();
     this.EntryDate =  this._dataService.datechnge(this.EntryDate)   
     this.resetdatapageload()
     this.loaderService.display(true);
    const jsonmaster = {
      CMPCODE: this._loginService.getLogin()[0].CMPCODE,
      CITYCODE: this._loginService.getLogin()[0].CITYCODE,
      CITYCODE1: this._loginService.getLogin()[0].CITYCODE1,
      PSTATUS:this.Type
    }
  //  console.log(jsonmaster)
    this._dataService.getData("Accounts/ACC_CASHBOOK_BRBPCRCPCE_PAGELOAD", jsonmaster)
      .subscribe((data: any) => {  
        this.AccountNameTable = data.Table
        this.departmenttable = data.Table1
        this.Allitemtable = data.Table5
        this.entrytypetable = data.Table6
        this.loaderService.display(false);
      })
      if (this.queryParamsUserId != ' ') {
        this.text="Update"
        this.verifyPermission('29','Modify')
       this.editpopulate()
    }else{
       this.verifyPermission('29','Add')
    }
  }
  
  verifyPermission(formId, userMode) {
    this.loaderService.display(true);
    this._loginService.verifyRights(formId, '')
        .subscribe((data: any) => {   
         // console.log(data)
          if( data.Table.length>"0"){
          this.fromright_dt= data.Table[0].rightsfrmdt;
           this.onDisableRange();
          }
           this._loginService.checkVerify(userMode, data);
           this.loaderService.display(false);

        });
}
EntryDateChanged(ev){
  this.EntryDate=ev.formatted
}
onDisableRange() {
    var date = new Date(this.fromright_dt);
    var newdate = new Date(date);
    let bdate = new Date();
    bdate=newdate 
    let copy = this.getCopyOfOptions();
    bdate.setDate(bdate.getDate());     
    copy.disableUntil={year: bdate.getFullYear(), month: bdate.getMonth() + 1, day: bdate.getDate()} ;
    this.myDatePickerOptionsInv = copy;

    let d = new Date();
    d.setDate(d.getDate() + 1);
    let copy1 = this.getCopyOfOptions();
    copy1.disableSince = {year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate()};
    this.myDatePickerOptionsInv = copy1;
}
  getCopyOfOptions(): IMyDpOptions {
    return JSON.parse(JSON.stringify(this.myDatePickerOptionsInv));
}
  GetActName(act_id) {
    this.ACCTNAME = this.AccountNameTable.filter((code: any) => code.ACCTCODENAME === act_id)[0].ACCTNAME;
    this.filteitemtable = this.Allitemtable.filter((x: any) => x.ACCTCODE === act_id.split("|")[0]);
    if (this.filteitemtable.length == "1") {
      this.ItemName = this.filteitemtable[0].VALUEFIELD
    }
  }
  job_validation(){
    if(this.jobno.length != 15){
      alert("Please Enter 15 digit Jobno.")
      return false
    }else
    if (this.jobno.substring(0, 2) != this._loginService.getLogin()[0].CMPCODE) {
      alert("Entered Job No. is different company !");
      this._toasterService.toast('warning', 'warning','Entered Job No. is different company !');
      this.jobno="";
      return false;
    }
    else{
      let deptcode= this.jobno.substr(2, 3) +  this.jobno.substr(5, 1);
      //01 110 1/2
      this.department = this.departmenttable.filter((code: any) => code.CODE === deptcode)[0].VALUEFIELD;

    }
  }
  Addchildrcrd() {
    //  console.log(this.AccountName)
      if(this.AccountName == "" || this.AccountName==undefined)   {
         this._toasterService.toast('warning', 'warning', 'Please select Account  !');
         return false;
      }
      if(this.filteitemtable.length>1)  {
        if(this.ItemName=="" || this.ItemName==undefined)  {
          this._toasterService.toast('warning', 'warning', 'Please select Item  !');
          return false;
        }
      }
      if (this.entrytype == "" || this.entrytype == undefined) {
        this._toasterService.toast("warning", "warning", "Please Select EntryType.");
        return false
      } 
      if (this.entrytype == "AB" || this.entrytype == "AO" || this.entrytype == "PE")  {
        if(this.billno=="")  {
            this._toasterService.toast('warning', 'warning', 'Please Enter BillNo. !');
            return false;
        }
        if(this._loginService.getLogin()[0].CMPCODE=="20") {
            if(this.billno.length != 10)  {
            this._toasterService.toast('warning', 'warning', 'Invalid BillNo - Please Check !');
            return false;
            }   
        }
        else {
            if(this.billno.length < 15)  {
            this._toasterService.toast('warning', 'warning', 'Invalid BillNo - Please Check !');
            return false;
            } 
        }  
    }     
    if (this.entrytype == "AD" || this.entrytype == "JB")  {
        if(this.jobno=="")  {      
            this._toasterService.toast('warning', 'warning', 'Please Enter Job No. !');
            return false;
        }
    } 
    if(this.jobno.length > 0 && this.jobno.length < 15) {
      this._toasterService.toast('warning', 'warning', 'Invalid JobNo - Please Check !');
      return false;
   }
   if(this.jobno.length > 0 && this.jobno.length == 15) {
      if (this.jobno.substr(0, 2) != this._loginService.getLogin()[0].CMPCODE) {
      this._toasterService.toast("warning","warning",'You have entered Job No of different Company !');
       return false;
       }
  if (this.jobno.substr(2, 3) != this._loginService.getLogin()[0].CITYCODE1) {
      this._toasterService.toast("warning","warning",'You have entered Job No of different City !');
      return false;
      }
  }
  if(this.jobno=="" && this.billno=="") {
      if(this.department=="" || this.department==undefined || this.department=="0"){
          this._toasterService.toast('warning', 'warning', 'Please Select Department !');
          return false;
      }
  }
  if(this._loginService.getLogin()[0].CMPCODE=="20")   {
      if(this.jobno.length > 0 && this.jobno.length != 10){
      this._toasterService.toast('warning', 'warning', 'Invalid JobNo - Please Check !');
      return false;
      }        
  }
  else  {
      if(this.jobno.length != 15 && this.jobno.length >0 )  {
          this._toasterService.toast('warning', 'warning', 'Invalid JobNo - Please Check !');
          return false;
       }
  }
  if(this.jobno=="" || this.jobno==undefined)  {
    if(this.department=="" || this.department==undefined)  {
        this._toasterService.toast('warning', 'warning', 'Please Select Department !');
        return false;
    }
      }
  if((this.Amount=="" || this.Amount=="0") && (this.Deduction=="" || this.Deduction=="0") ) {
      this._toasterService.toast('warning', 'warning', 'Both Deduction & Amount cannot be Left Blank !');
      return false;   
      }  
      if(parseFloat(this.Amount) > 0 && parseFloat(this.Deduction) > 0) {
        this._toasterService.toast('warning', 'warning', 'Either Deduction or Amount can be Entered !');
        return false;   
        }  
        if(this.Deduction.length>0)    {
          let tmpdeduction =this.Deduction;
          if(isNaN((Math.round(parseFloat(tmpdeduction) * 100) / 100))) {
               this._toasterService.toast('warning', 'warning', 'Deduction Entered not Valid !');
                  return false; 
          } 
          if(parseFloat(tmpdeduction) <=0)  {
              this._toasterService.toast('warning', 'warning', 'Deduction Entered not Valid !');
                 return false; 
         } 
      }
      if(this.Amount.length>0)     {
          let tmpamount =this.Amount;
          if(isNaN((Math.round(parseFloat(tmpamount) * 100) / 100)))  {
               this._toasterService.toast('warning', 'warning', 'Amount Entered not Valid !');
                  return false; 
          } 
          if(parseFloat(tmpamount) <=0)   {
              this._toasterService.toast('warning', 'warning', 'Amount Entered not Valid !');
                 return false; 
         } 
      }          
      let clientcodeval=this.AccountName.split("|")[1];
      if(clientcodeval=='Y') {
          if(this.jobno.length==0) {
          this._toasterService.toast('warning', 'warning', 'Please Enter JobNo !');
          return false;   
          } 
      } 
      
    
     this.loaderService.display(true);
     this.EntryTypeName = this.entrytypetable.filter((code: any) => code.VALUEFIELD == this.entrytype)[0].TEXTFIELD;

      const jsonmaster = {
        ID: this.PKID_CR,
        ENTRYNO: this.EntryNo,
        CLIENT: this.AccountName.split("|")[0],
        JOBNO: this.jobno,
        BILLNO: this.billno,                
        DEDUCTION: this.Deduction,
        AMOUNT: this.Amount,
        ENTRYTYPE: (this.entrytype==undefined)?"" :this.entrytype,
        EMP_CODE:"",
        USERNAME: this._loginService.getLogin()[0].CMP_USERNAME,
        CRPARENTENTRYNO: "0",
        NARRATION: this.ActNarration,
        IS_NOT_EDIT_ABLE: this.CR_iseditable,
        ITEMCODE: (this.ItemName ==""|| this.ItemName==undefined)?"":this.ItemName.split("|")[0],
        DEPTID: this.department,
        VGUID: this._loginService.getLogin()[0].GUID,
        ACCOUNT_NAME: this.ACCTNAME,
        ITEM: (this.ItemName==undefined || this.ItemName=="" )?"" :this.ItemName.split("|")[2],
        DEPARTMENT: this.department,
        ACC_BANKDTLS_ID: this.BankDetailId,
        STATUS:this.Type,
        ISJOBREPORT: this.AccountName.split("|")[1],
        EMP_CODE_VALUE: "",
        EMP_CODE_TEXT: "",
        ITEM_DATAVALUE: (this.ItemName==undefined || this.ItemName=="" )?"" :this.ItemName,
        CMPCODE: this._loginService.getLogin()[0].CMPCODE,
        CITYCODE: this._loginService.getLogin()[0].CITYCODE
      } 
      this._dataService.Common("Accounts/ACC_BRBPCRCPCE_TMP_IU", jsonmaster)
        .subscribe((data: any) => { 
          this.loaderService.display(false);
          if (data.Table[0].STATUS == "100") {
            this._toasterService.toast("success", "success", data.Table[0].STATUSTEXT);
            this.Netdeduction = data.Table1[0].TOTDEDUCTION
            this.NetAmount = data.Table1[0].TOTAMOUNT
            this.TotalAmount=data.Table1[0].TOTAMOUNT;
            this.TotalDeduction=data.Table1[0].TOTDEDUCTION;
            this.NetTotal = data.Table1[0].NETTOTAL
            this.Accountlist = data.Table
            this.Resetchildrcrd()
            this.txtchild = "Add";
          }else{
            this._toasterService.toast("success", "success", data.Table1[0].STATUSTEXT);
            return false
          }
        })
    }
    Resetchildrcrd() {
      //this.AccountName = ""
     /// this.entrytype = ""
      this.Amount = ""
      this.Deduction = ""
      //this.department = ""
      this.ItemName = ""
      this.jobno = ""
      this.billno = ""
      this.ActNarration = ""
      this.PKID_CR = "0"
      this.CR_iseditable = "0"
      this.BankDetailId = "0"
    }
    Resetchild() {
      this.AccountName = ""
      this.entrytype = ""
      this.Amount = ""
      this.Deduction = ""
      this.department = ""
      this.ItemName = ""
      this.jobno = ""
      this.billno = ""
      this.ActNarration = ""
       }
    Editchildrecd(id) {
      let filterData = this.Accountlist.filter((filter) => filter.ID == id)[0];
      this.PKID_CR = filterData.ID;
      this.ACCTNAME=filterData.ACCOUNT_NAME
      this.AccountName = filterData.CLIENT + '|' + filterData.ISJOBREPORT;
      this.entrytype =  filterData.ENTRYTYPE;
      this.Amount = filterData.AMOUNT;
      this.Deduction = filterData.DEDUCTION;
      this.ItemName = filterData.ITEM_DATAVALUE;
      this.jobno = filterData.JOBNO;
      this.billno = filterData.BILLNO;
      this.ActNarration = filterData.NARRATION;
      this.txtchild = "Update";
      this.BankDetailId = filterData.ACC_BANKDTLS_ID;
      this.CR_iseditable = filterData.IS_NOT_EDIT_ABLE;
      this.department = filterData.DEPTID
      this.GetActName(this.AccountName)
    }
    Add_Main() {
      if (this.Accountlist.length ==[]) {
        this._toasterService.toast("error", "error", "Please Fill Account Details First.");
        return false
      }
      this.loaderService.display(true);
        const jsonmaster = {
        CMPID: this._loginService.getLogin()[0].CMPID,
        CMPCODE: this._loginService.getLogin()[0].CMPCODE,
        CITYCODE1: this._loginService.getLogin()[0].CITYCODE1,
        CITYCODE: this._loginService.getLogin()[0].CITYCODE,
        USERNAME: this._loginService.getLogin()[0].CMP_USERNAME,
        ENTRYNO: this.EntryNo,
        ENTRYDT: (this.EntryDate == "" || this.EntryDate == undefined) ? "" : this.EntryDate,
        STATUS:this.Type,
        OURBANK: "",
        OURBANKNM: "",
        CHEQUETYPE: "",
        CHEQUENO: "",
        CHEQUEDT: "",
        BANK: "",
        NARRATION: this.Narration,
        ACTUALAMOUNT: this.NetTotal,
        VGUID: this._loginService.getLogin()[0].GUID,
        MAKER_ID: this._loginService.getLogin()[0].GUID,
        MAKER_IP: this._loginService.getLogin()[0].MAKERIP,
        NOTOVERFLAG: "",
        ACTION: (this.EntryNo == " " || this.EntryNo == undefined) ? "INSERT" : "UPDATE",
        PAYEENAME: ""
      }
      this._dataService.Common("Accounts/ACC_BRBPCRCPCE_IU", jsonmaster)
        .subscribe((data: any) => {   
          this.loaderService.display(false);  
          if (data.Table[0].STATUS == "100") {
            this._toasterService.toast('success', 'success', data.Table[0].STATUSTEXT);
            this.Print(data.Table1[0].ENTRYNO );
            this.RestMain()
          } else if (data.Table[0].STATUS == "103") {
            this._toasterService.toast('success', 'success', data.Table[0].STATUSTEXT);
          }
        })
  
    }
    Print(no){
    let theTop = (screen.height / 2) - (483 / 2);
    let theLeft = (screen.width / 2) - (780 / 2);
    let toolbar = 'resizable=no,scrollbars=no,width=800,height=450,status=no,left=' + theLeft + ',top=' + theTop;
    window.open('./#/popup/Account-CashBook-BankReceipt-print/' + "CP" + '/' + no + '/' , "CashBook BankReceipt Print", toolbar);
  }
    RestMain() {
     // this.resetpage();
      this.NetAmount = ""
      this.NetTotal = ""
      this.Netdeduction = ""
      this.EntryNo = ""
      this.EntryDate = ""
      this.Resetchildrcrd()
      this.text="Add"
      this.Accountlist=[]
      this.Narration=""
      this.TotalAmount=""
      this._router.navigate(['/accounts/Voucher/CashPayment/Add/CP/ ']);
     }
  
    deletechildrecd(id) {  
      if (confirm('Are you sure want to delete the record ?')) {
        this.loaderService.display(true);  
        const jsondelete = {
          ID: id,
          VGUID: this._loginService.getLogin()[0].GUID,
          ACC_BANKDTLS_ID: this.BankDetailId
         }
        this._dataService.getData("Accounts/ACC_BRBPCRCPCE_TMP_DEL", jsondelete)
          .subscribe((data: any) => {          
            this.loaderService.display(false);
            if (data.Table1[0].STATUS.split("#")[0]== "100") {
              this.Accountlist = data.Table;
              this.TotalAmount=data.Table1[0].TOTAMOUNT;
              this.TotalDeduction=data.Table1[0].TOTDEDUCTION;
              this.NetTotal=data.Table1[0].NETTOTAL;
              this._toasterService.toast('success', 'success', data.Table1[0].STATUSTEXT);  
            }
            else {
              this._toasterService.toast("warning", "warning", "Error in Deleting");
            }
        });
      }
      else {
        this.loaderService.display(false);
        return false;
    
      }
    }
  
    resetpage() {
      if(confirm('Are you sure you want to reset all data?'))    {
        this.Accountlist=[];
        this.NetAmount = ""
        this.NetTotal = ""
        this.Netdeduction = ""
        this.TotalAmount=""
        this.TotalDeduction=""
       const jsonmaster = {
        VGUID: this._loginService.getLogin()[0].GUID,
       }
       this._dataService.getData("Accounts/ACC_BRBPCRCPCE_RESET", jsonmaster)
         .subscribe((data: any) => { 
          this._toasterService.toast('info', 'success', "Clear all data");
          this.loaderService.display(false);
          this._router.navigate(['accounts/Voucher/CashPayment/Add/CP/ '] );
         
         });               
      }  
      else {   
          return false;
          this.loaderService.display(false);
      }        
       }
   

  resetdatapageload() {
    const jsonmaster = {
      VGUID: this._loginService.getLogin()[0].GUID,
    }
    this._dataService.getData("Accounts/ACC_BRBPCRCPCE_RESET", jsonmaster)
      .subscribe((data: any) => { 
     })
  }
    editpopulate()  {
      const jsonview = {
        EntryNo  : this.queryParamsUserId,
        CMPCODE:this._loginService.getLogin()[0].CMPCODE,
        CITYCODE:this._loginService.getLogin()[0].CITYCODE,
        VGUID:this._loginService.getLogin()[0].GUID,
        STATUS:this.Type
      }
 
      this._dataService.getData("Accounts/ACC_BRBPCRCPCE_View", jsonview)
      .subscribe((data: any) => {
    
        this.EntryNo  = data.Table[0].ENTRYNO    ;
        this.EntryDate=(data.Table[0].ENTRYDT != "") ? data.Table[0].ENTRYDT : "";
        this.Narration=data.Table[0].NARRATION;
        this.Accountlist=data.Table1;
        this.NetAmount=data.Table2[0].TOTAMOUNT;
        this.Netdeduction=data.Table2[0].TOTDEDUCTION;
        this.NetTotal  =data.Table2[0].NETTOTAL;
        this.TotalAmount=data.Table2[0].TOTAMOUNT;
        this.TotalDeduction=data.Table2[0].TOTDEDUCTION;
                  
      })
    }   
    EntryTypeChg(entrytypeval) {                
      if (entrytypeval == "AD")   {
          this.Deduction="";
          this.disable_deduction=true;
      }
          else   {
          this.disable_deduction=false;  }
      if (entrytypeval == "PE")   {
          this.billno="";
          this.Amount="";
      }
      if (entrytypeval == "AB")  {
          this.billno="";
      }
  }
  FillAmount(event)
  {
    if(event.split("|")[1] == undefined)
    {
      this.Amount = "";
    }
    else
    {
      this.Amount= event.split("|")[1];
    }
  }
}
