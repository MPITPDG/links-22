import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IMyDpOptions } from 'mydatepicker';
import { Configuration } from 'src/app/app.constants';
import { DataService } from 'src/app/shared/service/dataService';
import { LoaderService } from 'src/app/shared/service/loader.service';
import { LoginService } from 'src/app/shared/service/loginService';
import { ToastCommonService } from 'src/app/shared/service/toastService';
@Component({
  selector: 'app-req-bankpayment',
  templateUrl: './req-bankpayment.component.html',
  styles: []
})
export class ReqBankpaymentComponent implements OnInit {
  EntryNo: string = " ";
  EntryDate: any = "";
  Narration: string = "";
  AccountName: string;
  Allitemlist: any = [];
  codelistActt: any = [];
  AccountNameList: any = [];
  Departmentlist: any = [];
  Department:string="0"
  DepartmentName: string;
  OurBankList: any = [];
  OurBank: string;
  OurBankName: string;
  ChequeType: string = "CHQ"
  Item: string;
  ItemList: any = [];
  EntryType: string;
  BillNo: string = "";
  JobNo: string = "";
  Amount: string = "";
  Deduction: string = "";
  ShortNarration: string = "";
  TotalAmount: string = "0";
  TotalDeduction: string = "0";
  NetTotal: string = "0";
  ID: string = "0";
  ISNOTEDITABLE: string = "0";
  ACC_BANKDTLS_ID: string = "0";
  Header: string = "Request - BANK PAYMENt";
  text: string = "Submit"; txtchild: string = "Add"; txtadd: string = "Add";
  Accountlist: any = [];
  ACCTNAME: string = "";
  STATUS: string = "CC";
  entrytable: any = []
  NOTOVERFLAG: string = "";
  PAYEENAME: string = "";
  CRPARENTENTRYNO: string = "0";
  ChequeNo: string = "";
  ChequeDate: any = '';
  BankName: string;
  CompChequeFlag: string = "0";
  dfltourbank: string = "";
  PayeeName: any;
  HDPayeeName: string = "";
  HDlblname: string = "";
  /* added for tds part */
  chkIsTDS:boolean=false;
  tottdsamt:any;
  seltdsamt: any = 0;
  sectioncnt:any="0";
  retsupcode:string="";
  str:string="";
  GSTApplicable:string="";
  TDSApplicable:string="";
  ISTDSAPP:string="";
  SuppliertdsList: any = []
  tdsaddflag:string="0";
  public disablesupplier:boolean=false;
  public disablesupplieraddr:boolean=false;
  public disablechildaddbtn:boolean=false;
  public disablechildresetbtn:boolean=false;
  public disableresetbtn:boolean=true;
  chktdslbl:string="Is Tds Applicable";
  public showModal_TDS: boolean = false;
  suppliername: string;
  totpiamt:any;
  Ftotpiamt:any;
  selpiamt: any = 0;
  seltaxableamt: any = 0;
  TotalTDSList: any = [];
  TDSList: any = [];
  public disabletdsbtn:boolean=true;
  public disablecheckbox:boolean=true;
  sel_accid : string;
  tdsledgercnt:string="";
  gstratelist: any = [];
  gstrate:string="0";
  newArray: any = [];
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
    // disableUntil: { year: 0, month: 0, day: 0 },
    // disableSince: { year: 0, month: 0, day: 0 }
  };
  labelbind: string="Normal Cheque Print.";
  fromright_dt: string | number | Date;

  constructor(
    private _dataService: DataService,
    private _toasterService: ToastCommonService,
    private loaderService: LoaderService,
    private _router: Router,
    private http: HttpClient,
    private _activatedRoute: ActivatedRoute,
    private _loginService: LoginService,
    private _configuration: Configuration) { }


  ngOnInit() {
    this.ChequeDate = this._dataService.getCurrentdate();
    this._activatedRoute.params.subscribe(params => {
    this.EntryNo = params["bankpayno"];

    })
    var today = new Date();
   // this.EntryDate = this.ChequeDate = this._dataService.datechnge(today)
    this.EntryDate =  this._dataService.datechnge(today)
    this.ChequeDate =this._dataService.datechnge(today)
   // this.cleardata()
    const jsonparam = {
      CMPCODE: this._loginService.getLogin()[0].CMPCODE,
      CITYCODE: this._loginService.getLogin()[0].CITYCODE,
      CITYCODE1: this._loginService.getLogin()[0].CITYCODE1,
      PSTATUS: "CC"
    }

    this._dataService.getData("Accounts/ACC_CASHBOOK_BRBPCRCPCE_PAGELOAD_RBP", jsonparam)
      .subscribe((data: any) => {
        this.AccountNameList = data.Table;
        this.Departmentlist = data.Table1;
        this.OurBankList = data.Table2;
        this.Allitemlist = data.Table5;
        this.entrytable = data.Table6
        let defCode = data.Table3[0].ACCTCODE
        //  this.OurBank = defCode;
          this.dfltourbank = data.Table3[0].ACCTCODE
      //  this.PayeeName = data.Table4[0].PAYORDER_PYEENAME
      this.HDPayeeName = data.Table4[0].PAYORDER_PYEENAME
      this.SuppliertdsList=data.Table7;
      this.gstratelist=data.Table8;
      });
      const jsonreset = { VGUID :this._loginService.getLogin()[0].GUID}
      this._dataService.getData("Accounts/ACC_BRBPCRCPCE_RESET_NG", jsonreset)
      .subscribe((data: any) => {
          });

    if (this.EntryNo != ' ') {
      this.text = "Update"
      this.Header = 'Request - BANK PAYMENt - UPDATE ';
      this.verifyPermission(91, 'Modify')
      this.editpopulate()
    } else {
      this.Header = 'Request - BANK PAYMENt - add';
      this.verifyPermission(91, 'Add')
    }

  }
  verifyPermission(formId, userMode) {
    this.loaderService.display(true);
    this._loginService.verifyRights(formId, '')
      .subscribe((data: any) => {
        // console.log(data)
        if (data.Table.length > "0") {
          this.fromright_dt = data.Table[0].rightsfrmdt;
         // this.onDisableRange();
        }
        this._loginService.checkVerify(userMode, data);
        this.loaderService.display(false);

      });
  }
  onDisableRange() {
    var date = new Date(this.fromright_dt);
    var newdate = new Date(date);
    let bdate = new Date();
    bdate = newdate
    let copy = this.getCopyOfOptions();
    bdate.setDate(bdate.getDate());
    copy.disableUntil = { year: bdate.getFullYear(), month: bdate.getMonth() + 1, day: bdate.getDate() };
    this.myDatePickerOptionsInv = copy;

    let d = new Date();
    d.setDate(d.getDate() + 1);
    let copy1 = this.getCopyOfOptions();
    copy1.disableSince = { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
    this.myDatePickerOptionsInv = copy1;
  }
  getCopyOfOptions(): IMyDpOptions {
    return JSON.parse(JSON.stringify(this.myDatePickerOptionsInv));
  }

  GetActName(Acctcode) {
    let splittedacctcode
    let codeacct
    // this.ACCTNAME=event.target.options[event.target.options.selectedIndex].text;
    this.codelistActt = this.AccountNameList.filter((code: any) => code.ACCTCODENAME === Acctcode);
    this.ACCTNAME = this.codelistActt[0].ACCTNAME;
    codeacct = this.codelistActt[0].ACCTCODENAME;
    this.ItemList = this.Allitemlist.filter((code: any) => code.ACCTCODE === Acctcode.split("|")[0]);
    this.PayeeName=this.ACCTNAME.split(",")[0];
    this.PAYEENAME=this.ACCTNAME;
    splittedacctcode=Acctcode.split("|")[0]

    if (((splittedacctcode.substring(0, 1) == "S") || (splittedacctcode.substring(0, 1) == "E")) && ((this.ChequeType != 'PO') && (this.ChequeType != 'DD') && (this.ChequeType != 'NEFT') && (this.ChequeType != 'RTGS'))) {
      this.PayeeName=this.ACCTNAME.split(",")[0];
      this.PAYEENAME="";
      this.HDlblname="";

     }
     else if (((splittedacctcode.substring(0, 1) == "S") || (splittedacctcode.substring(0, 1) == "E")) && ((this.ChequeType == 'PO') || (this.ChequeType == 'DD') || (this.ChequeType == 'NEFT') || (this.ChequeType == 'RTGS'))) {
     // document.getElementById("HDLBLCHQTYPE").value = document.getElementById("HDPOPAYEENAME").value + "-" + CHEQUETYPE + "-";

      this.PayeeName=this.ACCTNAME.split(",")[0];
      this.HDlblname=this.HDPayeeName + "-" + this.ChequeType  + "-";
     // this.PAYEENAME=  this.PayeeName;
      }
    else if (((splittedacctcode.substring(0, 1) == "G")) && ((this.ChequeType == 'PO') || (this.ChequeType == 'DD') || (this.ChequeType == 'NEFT') || (this.ChequeType == 'RTGS'))) {
    if ((splittedacctcode == 'G101436') || (splittedacctcode == 'G101438') || (splittedacctcode == 'G101437') || (splittedacctcode == 'G101439')) {
        // document.getElementById("HDLBLCHQTYPE").value = document.getElementById("HDPOPAYEENAME").value + "-" + CHEQUETYPE + "-";
        this.HDlblname=this.HDPayeeName + "-" + this.ChequeType  + "-";
        this.PayeeName= "MANILAL PATEL CLEARING FORWARDING PVT.LTD.";
        //this.PAYEENAME= this.HDPayeeName + "-" + this.ChequeType  + "-" + this.PayeeName;

    } else {
      this.HDlblname=this.HDPayeeName + "-" + this.ChequeType  + "-";
        this.PayeeName = "";
    }
  }
    else {
      this.HDlblname= "";
      this.PAYEENAME= "";
      }

    if (Acctcode.split("|")[0] == 'G100275') {
        this.PayeeName="SELF";
       }
       let supptds
       supptds = this.SuppliertdsList.filter((code: any) => code.VALUEFIELD === this.AccountName.split("|")[0])[0].TEXTFIELD;
       this.EnableDisableDtn(supptds);
  }
  GetDepartmentName(event) {
    this.DepartmentName = event.target.options[event.target.options.selectedIndex].text.split("|")[1];
  }
  GetOurBankName(event) {
    this.OurBankName = event.target.options[event.target.options.selectedIndex].text;
  }
  EnableDisableDtn(tds){
    if(tds=="1" && this.EntryNo == ' '){
      this.chktdslbl="TDS Applicable";
      this.chkIsTDS=true;
        }
    else  if(tds=="1" && this.EntryNo != ' '){
      this.chktdslbl="TDS Applicable";
      this.chkIsTDS=true;
       }
     if(tds=="0"){
       this.chktdslbl="Is Tds Applicable";
       this.disabletdsbtn=true;
       this.chkIsTDS=false;
       this.disableresetbtn=true;
    }

  }
  Addchildrcrd() {

    if (this.AccountName == "" || this.AccountName == undefined) {
      this._toasterService.toast('warning', 'warning', 'Please select Account  !');
      return false;
    }
    if (this.ItemList.length > 1) {
      if (this.Item == "" || this.Item == undefined) {
        this._toasterService.toast('warning', 'warning', 'Please select Item  !');
        return false;
      }
    }
    if (this.EntryType == "" || this.EntryType == undefined) {
      this._toasterService.toast('warning', 'warning', 'Please Select EntryType First !');
      return false;
    }
    if (this.EntryType == "AB" || this.EntryType == "AO" || this.EntryType == "PE") {
      if (this.BillNo == "") {
        this._toasterService.toast('warning', 'warning', 'Please Enter BillNo. !');
        return false;
      }
      if (this._loginService.getLogin()[0].CMPCODE == "20") {
        if (this.BillNo.length != 10) {
          this._toasterService.toast('warning', 'warning', 'Invalid BillNo - Please Check !');
          return false;
        }
      }
      else {
        if (this.BillNo.length < 15) {
          this._toasterService.toast('warning', 'warning', 'Invalid BillNo - Please Check !');
          return false;
        }
      }
    }
    if (this.EntryType == "AD" || this.EntryType == "JB") {
      if (this.JobNo == "") {
        this._toasterService.toast('warning', 'warning', 'Please Enter Job No. !');
        return false;
      }
    }
    if (this.JobNo.length > 0 && this.JobNo.length < 15) {
      this._toasterService.toast('warning', 'warning', 'Invalid JobNo - Please Check !');
      return false;
    }
    if (this.JobNo.length > 0 && this.JobNo.length == 15) {
      if (this.JobNo.substr(0, 2) != this._loginService.getLogin()[0].CMPCODE) {
        this._toasterService.toast("warning", "warning", 'You have entered Job No of different Company !');
        return false;
      }
      // if (this.JobNo.substr(2, 3) != this._loginService.getLogin()[0].CITYCODE1) {
      //   this._toasterService.toast("warning", "warning", 'You have entered Job No of different City !');
      //   return false;
      // }
    }

    if (this.JobNo == "" && this.BillNo == "") {
      if (this.Department == "" || this.Department == undefined || this.Department == "0") {
        this._toasterService.toast('warning', 'warning', 'Please Select Department !');
        return false;
      }
    }

    // if (this._loginService.getLogin()[0].CMPCODE == "20") {
    //   if (this.JobNo.length > 0 && this.JobNo.length != 10) {
    //     this._toasterService.toast('warning', 'warning', 'Invalid JobNo - Please Check !');
    //     return false;
    //   }

    // }
    if ((this.Amount == "" || this.Amount == "0") && (this.Deduction == "" || this.Deduction == "0")) {
      this._toasterService.toast('warning', 'warning', 'Both Deduction & Amount cannot be Left Blank !');
      return false;
    }
    if (this.Deduction.length > 0) {
      let tmpdeduction = this.Deduction;
      if (isNaN((Math.round(parseFloat(tmpdeduction) * 100) / 100))) {
        this._toasterService.toast('warning', 'warning', 'Deduction Entered not Valid !');
        return false;
      }
      if (parseFloat(tmpdeduction) <= 0) {
        this._toasterService.toast('warning', 'warning', 'Deduction Entered not Valid !');
        return false;
      }
    }
    if (this.Amount.length > 0) {
      let tmpamount = this.Amount;
      if (isNaN((Math.round(parseFloat(tmpamount) * 100) / 100))) {
        this._toasterService.toast('warning', 'warning', 'Amount Entered not Valid !');
        return false;
      }
      if (parseFloat(tmpamount) <= 0) {
        this._toasterService.toast('warning', 'warning', 'Amount Entered not Valid !');
        return false;
      }
    }
    let clientcodeval = this.AccountName.split("|")[1];
    if (clientcodeval == 'Y') {
      if (this.JobNo.length == 0) {
        this._toasterService.toast('warning', 'warning', 'Please Enter JobNo !');
        return false;
      }
    }
    this.loaderService.display(true);
    const jsonchild = {
      ID: this.ID, ENTRYNO: this.EntryNo, CLIENT: this.AccountName.split("|")[0],
      JOBNO: this.JobNo, BILLNO: this.BillNo,
      DEDUCTION: this.Deduction, AMOUNT: this.Amount,
      ENTRYTYPE: (this.EntryType == undefined) ? "" : this.EntryType,
      EMP_CODE: "", USERNAME: this._loginService.getLogin()[0].CMP_USERNAME,
      CRPARENTENTRYNO: this.CRPARENTENTRYNO,
      NARRATION: this.ShortNarration, IS_NOT_EDIT_ABLE: this.ISNOTEDITABLE,
      ITEMCODE: (this.Item == undefined) ? "" : this.Item.split("|")[0], DEPTID: this.Department,
      VGUID: this._loginService.getLogin()[0].GUID,
      ACCOUNT_NAME: this.ACCTNAME,
      ITEM: (this.Item == undefined || this.Item == "") ? "" : this.Item.split("|")[2],
      DEPARTMENT: (this.DepartmentName == undefined) ? "" : this.DepartmentName,
      ACC_BANKDTLS_ID: this.ACC_BANKDTLS_ID,
      STATUS: this.STATUS,
      ISJOBREPORT: this.AccountName.split("|")[1],
      EMP_CODE_VALUE: "", EMP_CODE_TEXT: "",
      ITEM_DATAVALUE: (this.Item == undefined) ? "" : this.Item,
      CMPCODE: this._loginService.getLogin()[0].CMPCODE,
      CITYCODE: this._loginService.getLogin()[0].CITYCODE,
      ISOLDENTRY: "0",
      CMPID:this._loginService.getLogin()[0].CMPID,
      IS_GST:(this.GSTApplicable=="")?"0":this.GSTApplicable,
      ISTDSCALC :(this.chkIsTDS == true) ? "0" : "0",
      IS_TDS:(this.TDSApplicable=="")?"N":this.TDSApplicable,
      GSTRATE:(this.gstrate=="")?"0":this.gstrate,
    }
    console.log(jsonchild);

    //this._dataService.Common("Accounts/ACC_BRBPCRCPCE_TMP_IU", jsonchild)
    this._dataService.Common("Accounts/ACC_BRBPCRCPCE_TMP_IU_NG", jsonchild)

      .subscribe((data: any) => {
        console.log(data);

        if (data.Table[0].STATUS== "100") {
          this.Accountlist = data.Table;
          this.TotalAmount = data.Table1[0].TOTAMOUNT;
          this.TotalDeduction = data.Table1[0].TOTDEDUCTION;
          this.NetTotal = data.Table1[0].NETTOTAL;
          this.tdsledgercnt=data.Table2[0].TDSAPPLICABLE;
          this.Resetchildrcrd();
          if(this.tdsledgercnt >="1"){
           this.disableresetbtn=false;
           this.disabletdsbtn=false;
          }
          else{
            this.disableresetbtn=true;
            this.disabletdsbtn=true;
          }
          this.Resetchildrcrd();
          this.loaderService.display(false);

        }
        else {
          this._toasterService.toast("warning", "warning", data.Table[0].STATUSTEXT);
          this.loaderService.display(false);
        }
      });

  }
  Resetchildrcrd() {
    this.ID = "0";
    this.AccountName = undefined;
    this.JobNo = "";
    this.Amount = "";
    this.Deduction = "";
    this.ShortNarration = "";
    this.Item = undefined;
    this.Department = "0";
    this.EntryType = "";
    this.txtchild = "Add";
    this.BillNo = "";
    this.ACC_BANKDTLS_ID = "0";
    this.GSTApplicable="";
    this.TDSApplicable="";
    this.gstrate="0";

  }

  Editchildrecd(id) {
    let filterData = this.Accountlist.filter((filter) => filter.ID == id)[0];
    if ( filterData.IS_NOT_EDIT_ABLE == "1") {
      alert("You cannot edit this record!")
      return false;
    }
    if ( filterData.ISTDSCALC == "1") {
      alert("You cannot edit this record!")
      return false;
    }
    else{
    this.ID = filterData.ID;
    this.AccountName = filterData.CLIENT + '|' + filterData.ISJOBREPORT;
    this.GetActName(this.AccountName);
    this.ItemList = this.Allitemlist.filter((code: any) => code.ACCTCODE === this.AccountName.split("|")[0]);
    this.Item = filterData.ITEM_DATAVALUE;
    this.Amount = filterData.AMOUNT;
    this.Deduction = filterData.DEDUCTION;
    this.EntryType = filterData.ENTRYTYPE;
    this.BillNo = filterData.BILLNO;
    this.JobNo = filterData.JOBNO;
    this.ShortNarration = filterData.NARRATION;
    this.txtchild = "Update";
    this.ACC_BANKDTLS_ID = filterData.ACC_BANKDTLS_ID;
    this.ACCTNAME = filterData.ACCOUNT_NAME;
    this.DepartmentName = filterData.DEPARTMENT;
    this.Department = filterData.DEPTID;
    this.ISNOTEDITABLE = filterData.IS_NOT_EDIT_ABLE;
    this.TDSApplicable=filterData.IS_TDS;
    this.GSTApplicable=filterData.IS_GST;
    this.gstrate=filterData.GSTRATE;
    }
  }

  deletechildrecd(id, brdtlsid) {

    if (this.ISNOTEDITABLE == "1") {
      this._toasterService.toast("warning", "warning", "You cannot delete this reocrd!")
    }
    else {
      if (confirm('Are you sure want to delete the record ?')) {
        this.loaderService.display(true);
        const jsondelete = { ID: id, VGUID: this._loginService.getLogin()[0].GUID, ACC_BANKDTLS_ID: brdtlsid }
        this._dataService.getData("Accounts/ACC_BRBPCRCPCE_TMP_DEL_NG", jsondelete)
          .subscribe((data: any) => {
            console.log(data);

            if (data.Table1 != undefined) {
              if (data.Table1[0].STATUS == "100") {
                this._toasterService.toast('info', 'Complete', data.Table1[0].STATUSTEXT);
                this.Accountlist = data.Table;
                this.TotalAmount = data.Table1[0].TOTAMOUNT;
                this.TotalDeduction = data.Table1[0].TOTDEDUCTION;
                this.NetTotal = data.Table1[0].NETTOTAL;
                this.tdsledgercnt=data.Table2[0].TDSAPPLICABLE;
                this.loaderService.display(false);
              }
            }
            else {
              this._toasterService.toast("warning", "warning", data.Table[0].STATUSTEXT);
              this.loaderService.display(false);
            }
          });

      }
      else { return false; this.loaderService.display(false); }
    }
  }

  isSaving: boolean = false; // FIX: double-click guard for Submit
  Add_Main() {
    // FIX: ignore repeat clicks while a save is already in progress
    if (this.isSaving) { return false; }

    if (this.ChequeType == "" || this.ChequeType == "0") {
      alert('Please select NOT OVER / PAY ORDER / DD / NEFT / RTGS ! \n');
      return false;
    }
    if ((this.ChequeType == 'NEFT') && (this.TotalAmount >= "200000")) {
      alert('NEFT Amount can be only between Rs.1 lakh to  1,99,999.99 , \n For Printing online Cheque !!');
      return false;
    }

    if (parseFloat(this.TotalAmount) < parseFloat(this.TotalDeduction)) {
      this._toasterService.toast('warning', 'warning', 'Total Deduction cannot be greater than Total Amount!');
      return false;
    }
    if (parseFloat(this.TotalAmount) <= 0) {
      this._toasterService.toast('warning', 'warning', 'Please enter amount greater then 0 !');
      return false;
    }

    if (this.EntryDate == "" || this.EntryDate == undefined) {
      this._toasterService.toast('warning', 'warning', 'Please Enter Entry Date !');
      return false;
    }

    if (this.OurBank == "" || this.OurBank == undefined) {
      this._toasterService.toast('warning', 'warning', 'Please select Our Bank !');
      return false;
    }

    if (this.PayeeName == "" || this.PayeeName == undefined) {
      this._toasterService.toast('warning', 'warning', ' Please Enter Payee Name! !');
      return false;
    }
    this.PAYEENAME=this.HDlblname + "" + this.PayeeName ;
    if(this.ChequeType=='Y'){
      this.NOTOVERFLAG='Y'
    }
    else{
      this.NOTOVERFLAG=''
    }
    const jsonmaster = {
      CMPID: this._loginService.getLogin()[0].CMPID,
      CMPCODE: this._loginService.getLogin()[0].CMPCODE,
      CITYCODE1: this._loginService.getLogin()[0].CITYCODE1,
      CITYCODE: this._loginService.getLogin()[0].CITYCODE,
      USERNAME: this._loginService.getLogin()[0].CMP_USERNAME,
      ENTRYNO: this.EntryNo,
      ENTRYDT: this.EntryDate,
      STATUS: this.STATUS,
      OURBANK: this.OurBank,
      OURBANKNM: "",
      CHEQUETYPE: this.ChequeType,
      CHEQUENO: this.ChequeNo,
      CHEQUEDT: this.ChequeDate,
      BANK: this.BankName,
      NARRATION: this.Narration,
      ACTUALAMOUNT: this.NetTotal,
      VGUID: this._loginService.getLogin()[0].GUID,
      MAKER_ID: this._loginService.getLogin()[0].CMPID,
      MAKER_IP: this._loginService.getLogin()[0].MAKERIP,
      NOTOVERFLAG: this.NOTOVERFLAG,
      ACTION: (this.EntryNo == " ") ? "INSERT" : "UPDATE",
      PAYEENAME: this.PAYEENAME,
      BANKREFNO:""
    }



    this.isSaving = true; // FIX: block further clicks until the save round-trip completes
    this.loaderService.display(true);
    this._dataService.Common("Accounts/ACC_BRBPCRCPCE_IU_NG", jsonmaster)
      .subscribe((data: any) => {
        this.isSaving = false;

        if (data.Table1 != undefined) {
          if (data.Table[0].STATUS  == "100") {
            this._toasterService.toast('info', 'Complete', data.Table[0].STATUSTEXT);
            this.print(data.Table1[0].ENTRYNO);
            this.loaderService.display(false);
            this.ResetMain();
          }
          else {
            // FIX: was silently ignored before - show the server message and release the loader
            this._toasterService.toast("warning", "warning", data.Table[0].STATUSTEXT);
            this.loaderService.display(false);
          }
        }
        else {

          this._toasterService.toast("warning", "warning", data.Table[0].STATUSTEXT);
          this.loaderService.display(false);
        }
      }, (err: any) => {
        // FIX: release the guard on HTTP failure so the user can retry
        this.isSaving = false;
        this.loaderService.display(false);
        this._toasterService.toast("warning", "warning", "Save failed. Please check and try again.");
      });
  }
  ResetMain() {
    this.Resetchildrcrd();
    this.EntryNo = " ";
    this.EntryDate = '';
    this.TotalAmount = '';
    this.TotalDeduction = '';
    this.NetTotal = '';
    this.text = "Submit";
    this.Accountlist = "";
    this.ChequeNo = '';
    this.ChequeDate = '';
    this.OurBank = "";
    this.BankName = '';
    this.Narration = '';
    this.PayeeName='';
    this.ChequeType='CHQ';
    this.labelbind="Normal Cheque Print"
    //this._router.navigate(['/accounts/voucher/ReqBP/Add/ ']);
    this._router.navigate(['/accounts/CompCheque/ReqBP/Add_reqBP/ ']);

  }
  editpopulate() {
    const jsonview = {
      CMPCODE: this._loginService.getLogin()[0].CMPCODE,
      CITYCODE: this._loginService.getLogin()[0].CITYCODE,
      EntryNo: this.EntryNo,
      VGUID: this._loginService.getLogin()[0].GUID,
      STATUS: this.STATUS,
      CMPID:this._loginService.getLogin()[0].CMPID,
    }
    this._dataService.getData("Accounts/ACC_BRBPCRCPCE_View_NG", jsonview)
      .subscribe((data: any) => {
     //   console.log(data);

        // if (data.Table[0].STATUS == "100") {

        this.EntryNo = data.Table[0].ENTRYNO;
        this.EntryDate = (data.Table[0].ENTRYDT != "") ? data.Table[0].ENTRYDT : "";
        this.Narration = data.Table[0].NARRATION;
        this.ChequeNo = data.Table[0].CHEQUENO;
        this.ChequeDate = (data.Table[0].CHEQUEDT != "") ? data.Table[0].CHEQUEDT : "";
        this.OurBank = data.Table[0].OURBANK;
        this.OurBankName = "";
        this.BankName = data.Table[0].BANK;
        this.NOTOVERFLAG = data.Table[0].NOTOVERFLAG;
        this.CompChequeFlag = data.Table[0].COMPCHEQUE;
        this.Accountlist = data.Table1;
        this.TotalAmount = data.Table2[0].TOTAMOUNT;
        this.TotalDeduction = data.Table2[0].TOTDEDUCTION;
        this.NetTotal = data.Table[0].ACTUALAMOUNT;
        this.ChequeType = data.Table[0].CHEQUETYPE
        this.PayeeName=data.Table[0].PAYEENAME;
        this.tdsledgercnt=data.Table3[0].TDSAPPLICABLE;
        if(this.tdsledgercnt >="1"){
            this.disableresetbtn=false;
           // this.disabletdsbtn=false;
           }
           else{
             this.disableresetbtn=true;
             this.disabletdsbtn=true;
           }
        this.chequeEvent(this.ChequeType);
        this.loaderService.display(false);

      })
    if (this.CompChequeFlag == "1" && this.NOTOVERFLAG != "Y") {
      this._toasterService.toast("warning", "warning", "You can not Update this Bank Payment because this is generated through Computerisd Cheque Print !");
      this.loaderService.display(false);
    }
    else if (this.CompChequeFlag == "1" && this.NOTOVERFLAG == "Y") {
      this._toasterService.toast("warning", "warning", "You can edit but net total should be less than or equal to BankPayment Amount=" + this.NetTotal);
      this.loaderService.display(false);
    }

  }

  Reset() {
    if (confirm('Are you sure you want to reset all data?')) {
      this.Resetchildrcrd();
      this.EntryNo = " ";
   //   this.EntryDate = '';
      this.Narration = '';
      this.ChequeNo = '';
     // this.ChequeDate = '';
      this.BankName = '';
      this.OurBank = '';
      this.TotalAmount = '';
      this.TotalDeduction = '';
      this.NetTotal = '';
      this.text = "Submit";
      this.PayeeName='';
      this.Accountlist = [];
      const jsonreset = { VGUID: this._loginService.getLogin()[0].GUID }
      this._dataService.getData("Accounts/ACC_BRBPCRCPCE_RESET_NG", jsonreset)
        .subscribe((data: any) => {

          this._toasterService.toast('info', 'success', "Clear all data");
          this.loaderService.display(false);
          this._router.navigate(['/accounts/CompCheque/ReqBP/Add_reqBP/ ']);
          this.OurBank = this.dfltourbank;
        });

    }
    else {
      return false;
      this.loaderService.display(false);
    }

  }

  ValidateJobNo() {
    //let deptcode= this.JobNo.substr(2, 3) +  this.JobNo.substr(5, 1);
    let deptcode= this.JobNo.substr(2, 2)

     this.Department = this.Departmentlist.filter((code: any) => code.VALUEFIELD == deptcode)[0].VALUEFIELD;
    if (this.JobNo.length > 0) {


      if (this._loginService.getLogin()[0].CMPCODE == "20") {
        if (this.JobNo.length > 0 && this.JobNo.length != 10) {
          this._toasterService.toast('warning', 'warning', 'Invalid JobNo - Please Check !');
          return false;
        }

      }
      else {
        if (this.JobNo.length > 0 && this.JobNo.length < 15) {
          this._toasterService.toast('warning', 'warning', 'Invalid JobNo - Please Check !');
          return false;
        }
        if (this.JobNo.length > 0 && this.JobNo.length == 15) {
          if (this.JobNo.substr(0, 2) != this._loginService.getLogin()[0].CMPCODE) {
            this._toasterService.toast("warning", "warning", 'You have entered Job No of different Company !');
            return false;
          }
          if (this.JobNo.substr(2, 3) != this._loginService.getLogin()[0].CITYCODE1) {
            this._toasterService.toast("warning", "warning", 'You have entered Job No of different City !');
            return false;
          }
        }

      }
    }
  }

  chequeEvent(ChqType) {
    if (ChqType == "CHQ") {
      this.HDlblname = "";
      this.labelbind = "Normal Cheque Print."
    } else if (ChqType == "Y") {
      this.labelbind = "Cheque will Print but amount is not over."
      this.HDlblname = "";
    } else if (ChqType == "PO") {
      this.HDlblname =  "YOURSELF-" + ChqType  + "-";
      this.labelbind = "Cheque print with Payee Name : Yourself - PO - PayeeName!"
    } else if (ChqType == "DD") {
      this.HDlblname =  "YOURSELF-" + ChqType  + "-";
      this.labelbind = "Cheque print with Payee Name : Yourself - PO - PayeeName!"
    } else if (ChqType == "NEFT") {
      this.HDlblname =  "YOURSELF-" + ChqType  + "-";
      this.labelbind = "Cheque Print Only when amt in between 1 Lakh and 1,99,999.99 !"
    } else if (ChqType == "RTGS") {
      this.HDlblname =  "YOURSELF-" + ChqType  + "-";
      this.labelbind = "Cheque Print Only when amt is Greater or Equal to 2 Lakh !"
    }
  }
  getchqdate(date) {
    console.log(date);

    this.ChequeDate = date.formatted
  }
  getentrydate(date) {
    this.EntryDate = date.formatted

  }
  cleardata() {
    const jsonreset = { VGUID: this._loginService.getLogin()[0].GUID }
    this._dataService.getData("Accounts/ACC_BRBPCRCPCE_RESET_NG", jsonreset)
      .subscribe((data: any) => {
      });
  }
  fnBillNoChk() {
    if(this.BillNo.length != 0) {
        if(this.EntryType=="PE" || this.EntryType=="AB") {
            if(this.AccountName.split("|")[0]=="0") {
                this._toasterService.toast("warning","warning",'Please select Acocunt Name.!');
                return false;
            }
            if(this._loginService.getLogin()[0].CMPCODE=="20" && (this._loginService.getLogin()[0].CITYCODE1=="201" || this._loginService.getLogin()[0].CITYCODE1=="202"))  {
                if(this.BillNo.length != 10) {
                this._toasterService.toast("warning","warning",'Bill No. should be 10 Digit.!');
                return false;
                }
            }
            else
            if(this.BillNo.length != 15)  {
                this._toasterService.toast("warning","warning",'Bill No. should be 15 Digit.!');
                return false;
            }
            //this.disable_BillNo=true;
            //this.disable_EntryType=true;
            // this.disable_cmdadd=true;
            // this.disable_cmdcancel=true;
        }
       }
    const jsonbill= {
        BILLNO: this.BillNo,
        ACC_CODE: this.AccountName.split("|")[0],
        ENTRYTYPE:this.EntryType,
        CMPCODE: this._loginService.getLogin()[0].CMPCODE,
        CITYCODE: this._loginService.getLogin()[0].CITYCODE
    };
    var str = '';
    this._dataService.getData("Accounts/ACC_CASHBOOK_BILLNO_VALIDATION", jsonbill)
    .subscribe((data: any) => {
        if(data.Table[0].STATUS.split("#")[0]=="104") {
            this._toasterService.toast("warning","warning" ,data.Table[0].STATUS.split("#")[1]);
            this.BillNo="";
            this.Amount="";
           // this.disable_cmdadd=false;
            return false;
        }
        else if(data.Table[0].STATUS.split("#")[0]=="100") {
            if(this.EntryType=="PE") {
            this.Amount=data.Table[0].STATUS.split("#")[2];
            this.Deduction=data.Table[0].STATUS.split("#")[3];
            // this.disable_BillNo=true;
            // this.disable_EntryType=true;
            // this.disable_cmdadd=false;
            return false;
            }
        }
    });

}
print(bprno){

    let theTop = (screen.height / 2) - (483 / 2);
    let theLeft = (screen.width / 2) - (780 / 2);
    let toolbar = 'resizable=no,scrollbars=no,width=800,height=450,status=no,left=' + theLeft + ',top=' + theTop;
    window.open('./#/popup/Account-CashBook-BankReceipt-print/' + 'CC'+ '/' + bprno + '/' , "Request Bank Payment Print", toolbar);
}
OpenTdsModal() {

  if(this.Accountlist =="" || this.Accountlist== undefined){
    this._toasterService.toast('warning', 'warning', 'Please Add Account Details !');
    return false;
  }
  let filteractcode = this.Accountlist.filter((filter: any) => filter.PUR_TDS == "Y");
  console.log(filteractcode);

      this.showModal_TDS = true
      this.str="";
      this.loaderService.display(true)
      const jsondata= {
         // SUPPCODE: filteractcode[0].CLIENT,
          ENTRYDT: this.EntryDate,
          VGUID: this._loginService.getLogin()[0].GUID,
          CMPCODE:this._loginService.getLogin()[0].CMPCODE,
          CMPID:this._loginService.getLogin()[0].CMPID,
          CITYCODE:this._loginService.getLogin()[0].CITYCODE,
          STATUS:"CC"
      }
      this._dataService.getData("Accounts/ACC_BP_TDSCAL", jsondata)
          .subscribe((data: any) => {
              if (data.Table[0].STATUS == "100") {
                  this.TDSList = data.Table
                 // this.tottdsamt=data.Table2[0].TOTTDSAMT;
                 this.totpiamt=data.Table1[0].TOTPIAMT;
                  this.TotalTDSList=data.Table2;
                  this.sectioncnt=data.Table3[0].CNT;
                  this.retsupcode='S00001';//data.Table5[0].SUP_CODE;
                  this.seltdsamt="0";
                  this.seltaxableamt="0";
                if(this.sectioncnt=="1")
             {
              for (let i = 0; i < this.TDSList.length; i++) {
                this.TDSList[i].Disabled =  true;
                this.TDSList[i].Checked =  true;
                this.str += this.TDSList[i].TDSACCTID + ' |' + this.TDSList[i].RATE + '|' + this.TDSList[i].TDSAMOUNT + '|'+ this.TDSList[i].AMOUNT
          + '|' + this.TDSList[i].ITEMCODE +  '|' + this.TDSList[i].NARRATION +  '|' + this.TDSList[i].RATETYPE +  '|'  + this.TDSList[i].LDCRATE +  '|' + this.TDSList[i].ACCTID +
           '|' + this.TDSList[i].OFFLAG + ";" ;
              }
              this.totpiamt=this.totpiamt;
              this.seltaxableamt=data.Table1[0].TOTPIAMT;
              }
                  this.loaderService.display(false)
              } else  if (data.Table[0].STATUS == "103"){
                  this.TDSList =[];
                  this.tottdsamt="";
                  this.seltdsamt="";
                  this.seltaxableamt="";
                  this._toasterService.toast('warning', 'warning', data.Table[0].STATUSTEXT);
                  this.loaderService.display(false)
              }
          })
    }
  closeTdsModal() {
    this.str="";
    this.newArray=[];
    this.showModal_TDS = false
}
getCheckedTDSData(event,tdsaccid, rate,TDSAmount,puramt,icode,narr,ratetype,ldcrate,accid,offlag){
    let Tdsamt
    this.sel_accid=accid;
    if(event){

      var selamt:number = parseFloat(this.selpiamt);
      var piamt:number = parseFloat(puramt);
      var newtot:number=(selamt+piamt);
      console.log(newtot.toFixed(2));
      this.selpiamt=newtot.toFixed(2);
      this.seltaxableamt=parseFloat(this.seltaxableamt) + parseFloat(puramt);
      let obj = {
        TDSACCTID: tdsaccid,
        RATE:rate,
        TDSAMOUNT:TDSAmount,
        PURAMT:puramt,
        ITEMCODE:icode,
        NARR:narr,
        RATETYPE:ratetype,
        LDCRATE:ldcrate,
        ACCTID:accid,
        OFFLAG:offlag
    }
    this.newArray.push(obj);
     }
    else {
      var index = this.newArray.findIndex(x => x.TDSACCTID == this.sel_accid);
          this.newArray.splice(index, 1);
          var selamt:number = parseFloat(this.seltaxableamt);
          var piamt:number = parseFloat(puramt);
          var newtot:number=(selamt-piamt);
          this.seltaxableamt=newtot.toFixed(2);
      }

    if (event) {

      for (let i = 0; i < this.TDSList.length; i++) {
        if (this.TDSList[i]["ACCTID"]==accid) {
          if(this.TDSList[i]["ITEMCODE"] !=icode){
            this.TDSList[i].Disabled =  true;
          }
            else if(this.TDSList[i]["ITEMCODE"] ==icode){
              this.TDSList[i].Disabled =  false ;
            }
             }
      }

  }
    else {
      for (let i = 0; i < this.TDSList.length; i++) {
        if (this.TDSList[i]["ACCTID"]==accid) {
          if(this.TDSList[i]["ITEMCODE"] !=icode){
            this.TDSList[i].Disabled =  false;
          }
            else if(this.TDSList[i]["ITEMCODE"] ==icode){
              this.TDSList[i].Disabled =  false ;
            }
             }
      }

  }
}

AddtdsDetails(){
          // var str = '';
     if(this.sectioncnt>1){
      if (this.newArray == "" || this.newArray == undefined) {
        this._toasterService.toast('warning', 'warning', 'Please select at least one record!');
        return false;

       }
      for (var i = 0, len = this.newArray.length; i < len; i++) {
        this.str += this.newArray[i].TDSACCTID + ' |' + this.newArray[i].RATE + '|' + this.newArray[i].TDSAMOUNT + '|'+ this.newArray[i].PURAMT
         + '|' + this.newArray[i].ITEMCODE +  '|' + this.newArray[i].NARR +  '|' + this.newArray[i].RATETYPE +  '|' + this.newArray[i].LDCRATE +  '|' + this.newArray[i].ACCTID +
          '|' + this.newArray[i].OFFLAG + ";" ;
     }
     }

     // console.log(this.str);
      const jsontdsdtl={
        cmpid:this._loginService.getLogin()[0].CMPID,
        STATUS:this.STATUS,
        VGUID:this._loginService.getLogin()[0].GUID,
       // SUPCODE:this.retsupcode,//this.suppliername.split("|")[0],
        STR: this.str
        }
        this._dataService.Common("Accounts/ACC_BPDIIDE_TDS_TMP_IU_NG", jsontdsdtl)
        .subscribe((data: any) => {
          if (data.Table[0].STATUS == "100") {
            this.Accountlist=data.Table;
            this.TotalAmount = data.Table1[0].TOTAMOUNT;
            this.TotalDeduction = data.Table1[0].TOTDEDUCTION;
            this.NetTotal = data.Table1[0].NETTOTAL;
            this.loaderService.display(false);
            this.str="";
            this.showModal_TDS=false;
            this.disabletdsbtn=true;
            this.disableresetbtn=false;
            this.disablesupplier=true;
            this.disablesupplieraddr=true;
            this.tdsaddflag="1"
            this.disablechildaddbtn=true;
            this.disablechildresetbtn=true;
          }
            });

}
ResetTDS(){
  if(confirm('Are you sure you want to reset TDS data?')){

  const jsonmaster={VGUID:this._loginService.getLogin()[0].GUID}
  this._dataService.getData("Accounts/ACC_BPDIIDE_TDS_RESET_NG", jsonmaster)
  .subscribe((data: any) => {
    if (data.Table[0].STATUS == "100") {
    this.Accountlist=data.Table;
    this.TotalAmount = data.Table1[0].TOTAMOUNT;
    this.TotalDeduction = data.Table1[0].TOTDEDUCTION;
    this.NetTotal = data.Table1[0].NETTOTAL;
    this.Resetchildrcrd();
    this.str="";
    this.newArray=[];
    this.disabletdsbtn=false;
    this.disablesupplier=false;
    this.disablesupplieraddr=false;
    this.disablechildaddbtn=false;
    this.disablechildresetbtn=false;
    }
  });
}
}
}

