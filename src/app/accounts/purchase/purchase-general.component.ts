import { Component, OnInit, Input,Output,EventEmitter } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { DataService } from '../../shared/service/dataService';
import { LoginService } from '../../shared/service/loginService';
import { ToastCommonService } from '../../shared/service/toastService';
import { IMyDpOptions } from 'mydatepicker';
import { LoaderService } from '../../shared/service/loader.service';
import { HttpClient } from '@angular/common/http';
import { TruncatePipe } from 'angular-pipes';
@Component({
  selector: 'app-purchase-general',
  templateUrl: './purchase-general.component.html',
  styles: []
})
export class PurchaseGeneralComponent implements OnInit {
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
  NetAmount: string = "0";
  Netdeduction: string = "0";
  text: string = "Submit"; txtchild: string = "Add";
  ID: string = "0";
  ENTRYNO: string = "0";
  CLIENT: string = "";
  ISNOTEDITABLE: string = "0";
  ACCTNAME: string = "";
  ACCBANKDTLSID: string = "0";
  STATUS: string = "";
  Accountlist: any = [];
  billaddressList: any = []
  billaddressfilter:any=[]
  Itemslist: any = []
  NetAmt: string = "0"; Type: string = "";
  mawbno: string = ""
  SerchTypeMawb: string = "1"
  MAWABlist: any = []
  frieghtamt:string=""
  surcharge:string=""
  airfrightcomm:string=""
  frightrebate:string=""
  ams_enscharge:string=""
  mischarge:string=""
  documentcharge:string=""
  formid: string="";
  fromright_dt: any=null;
  public togglevno: boolean = true;
  public togglepassedby: boolean = true;
  public togglepamount: boolean = true;
  public toggleinvamount: boolean = true;
  public showModal_MAWB: boolean = false;
  public showModal_TDS: boolean = false;

  newArray: any = [];
  hdtdsArray:any=[];
  TDSList: any = [];
  TDSTYPE: string="";
  TDSTYPE1: string="";
  checkedList: any = [];
  unCheckedList: any = [];
  shouldCheckboxesBeDisabled  = false;
  public disablecheckbox:boolean=true;
  sel_accid : string;
  public disabletdsbtn:boolean=true;

  // @Input() disabletdsbtn: boolean = true;
  // @Output() btnClick = new EventEmitter();
  public disableresetbtn:boolean=true;
  chktdslbl:string="Is Tds Applicable";
  chkIsTDS:boolean=false;
  tottdsamt:any;
  seltdsamt: any = 0;;
  sectioncnt:any="0";
  str:string="";
  GSTApplicable:string="";
  TDSApplicable:string="";
  ISTDSAPP:string="";
  SuppliertdsList: any = []
  tdsaddflag:string="0";
  hdpurtds:any;
  public disablesupplier:boolean=false;
  public disablesupplieraddr:boolean=false;
  public disablechildaddbtn:boolean=false;
  public disablechildresetbtn:boolean=false;
  public disablepurchasedate:boolean=false;
  totpiamt:any;
    Ftotpiamt:any;
    selpiamt: any = 0;
    seltaxableamt: any = 0;
    TotalTDSList: any = [];

  //public disablechktds:boolean=false;
  //---validation
  hdPass: string="0";HDISCOMPBP_DONE: string="0";HDIsNotOver:string="0";HDISPURGENERATE: string="0";HDPURINVNO :string="0";
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
    selectorWidth: '200px' ,
    disableUntil: {year: 0, month: 0, day: 0},
    disableSince: {year: 0, month: 0, day: 0}
};
  constructor(
    private _dataService: DataService,
    private _toasterService: ToastCommonService,
    private loaderService: LoaderService,
    private _router: Router,
    private http: HttpClient,
    private _activatedRoute: ActivatedRoute,
    private _loginService: LoginService,

  ) { }
  ngOnInit() {

   this.PurchaseDate = new Date();
   this.PurchaseDate =  this._dataService.datechnge(this.PurchaseDate)
   this._activatedRoute.params.subscribe(params => {
      this.PurchaseNo = params["PurchaseNo"];
      this.STATUS = params["Status"];
      this.Type = params["Type"]
    })

    // if (this.STATUS=="PI"){this.formid='12' }else if(this.STATUS=="RPI") {this.formid='202'}
    if (this.STATUS=="PI"){this.formid='425' }else if(this.STATUS=="RPI") {this.formid='202'}
    if (this.PurchaseNo != ' ') {
      this.verifyPermission(this.formid,'Modify')
      this.text = 'Update';
    }else{
      this.verifyPermission(this.formid,'Add')
    }

    this.Clearall();
    const jsonparam = {
      cmp_code: this._loginService.getLogin()[0].CMPCODE,
      citycode: this._loginService.getLogin()[0].CITYCODE,
      citycode1: this._loginService.getLogin()[0].CITYCODE1,
      PSTATUS: this.STATUS
    }


     this.loaderService.display(true);
    // this._dataService.getData("Accounts/ACC_PURCHASE_PAGELOAD_TDS", jsonparam)
    this._dataService.getData("Accounts/ACC_PURCHASE_PAGELOAD", jsonparam)
      .subscribe((data: any) => {
        this.AccountNameList = data.Table;
        this.supplierlist = data.Table1;
        this.PassedBylist = data.Table2;
        this.Allitemlist = data.Table3;
        this.billaddressList = data.Table4;
        this.SuppliertdsList=data.Table5;

        if (this.PurchaseNo != ' ') {
          this.editpopulate()
          //this.GetSupplierName(this.suppliername)
          // if(this.disabletdsbtn==false){
          //   this.disabletdsbtn=true;
          // }

         this.text = 'Update';

        }
        if (this.PurchaseNo != ' ') {
          this.disabletdsbtn=true;
        }
      });

      if (this.Type == "2") {
        this.showModal_MAWB = true
        this.pageloadmawbdata()
      }


  }
  verifyPermission(formId, userMode) {
    this.loaderService.display(true);
    this._loginService.verifyRights(formId, '')
        .subscribe((data: any) => {
          if (this._loginService.getLogin()[0].ROLETYPE!='SA'){
          this.fromright_dt= data.Table[0].rightsfrmdt;
           this.onDisableRange();
          }
           this._loginService.checkVerify(userMode, data);
           this.loaderService.display(false);

        });
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
PurchaseDateChanged(ev){
  this.PurchaseDate=ev.formatted
console.log(ev)
}
  pageloadmawbdata() {
    const jsonparam = {
      CMPCODE: this._loginService.getLogin()[0].CMPCODE,
      CITYCODE: this._loginService.getLogin()[0].CITYCODE,
      CMPID: this._loginService.getLogin()[0].CMPID,
      TYPE: this.SerchTypeMawb,
      MAWBNO: this.mawbno
    }
    //console.log(jsonparam)
    this.loaderService.display(true);
    this._dataService.getData("Accounts/ACC_PURCHASE_MAWBNO_LIST", jsonparam)
      .subscribe((data: any) => {
       // console.log(data)
        this.loaderService.display(false);
        this.MAWABlist = data.Table

      });

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
    if(this.TDSApplicable=="" || this.TDSApplicable ==undefined){
      this._toasterService.toast('warning', 'warning', 'Please select TDS applicable or not.!');
      return false;
    }
    if(this.GSTApplicable=="" || this.GSTApplicable ==undefined){
      this._toasterService.toast('warning', 'warning', 'Please select GST applicable or not.!');
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


      let obj = {
        tdsapp:this.TDSApplicable
      }
      this.hdtdsArray.push(obj);

    //   this.hdtdsArray.push(this.TDSApplicable);
    //  //this.hdpurtds=(this.hdtdsArray.filter(x=> x.tdsapp == 'Y'))
    //  console.log(this.hdpurtds);

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
      SRPIPASSAMOUNT:( this.actpassedamount == "")? "0": this.actpassedamount,
      cmpid:this._loginService.getLogin()[0].CMPID,
      PUR_TAXABLE:(this.GSTApplicable=="")?"":this.GSTApplicable,
      ISTDSAPP:(this.chkIsTDS == true) ? "0" : "0",
      PUR_TDS:(this.TDSApplicable=="")?"0":this.TDSApplicable,
      MAWBFLAG:"0"
    }
   // console.log(jsonchild)
   this.loaderService.display(true);
    this._dataService.Common("Accounts/ACC_PURCHASE_TMP_IU_NG", jsonchild)
      .subscribe((data: any) => {
     //   console.log(data)
     if(data.Table.length >0){
        if (data.Table[0].STATUS == "100") {
          this._toasterService.toast("success", "success", data.Table[0].STATUSTEXT)
          this.Accountlist = data.Table;
          this.NetAmount = data.Table1[0].TOTAMOUNT;
          this.Netdeduction = data.Table1[0].TOTDEDUCTION;
          this.NetAmt = data.Table1[0].NETTOTAL;
          this.Resetchildrcrd();
          this.loaderService.display(false);

        }
        else if (data.Table[0].STATUS == "103") {
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
      }
        else if (data.Table.length==0){
          this._toasterService.toast("warning", "warning", data.Table1[0].STATUS.split("#")[1]);
          this.loaderService.display(false);
        }
        else{
          this._toasterService.toast("warning", "warning", data.Table[0].STATUSTEXT);
          this.loaderService.display(false);
        }
      });
  }

  getCheckboxValues(event, id) {
    var data = confirm('Are you sure want to Change the record ?')
    if (data == true) {
      $('.productlist').on('change', function () {
        $('#' + id).not(this).prop('checked', false);
        $('#' + 'frieghtamt' + id).not(this).prop('disabled',false);
        $('#' + 'airfrightcomm' + id).not(this).prop('disabled',false);
        $('#' + 'frightrebate' + id).not(this).prop('disabled',false);
        $('#' + 'surcharge' + id).not(this).prop('disabled',false);
        $('#' + 'ams_enscharge' + id).not(this).prop('disabled',false);
        $('#' + 'mischarge' + id).not(this).prop('disabled',false);
      });
    } else {
      return false
    }
  }


Voucher_validation()
{
  if (this.VoucherNo != '') {
    if (this.VoucherNo.length != 15) {
        alert('Invalid Voucher No. - Please Check');
        return false;
    }
    if (this.VoucherNo.substring(0, 2) != this._loginService.getLogin()[0].CMPCODE) {
        this._toasterService.toast('warning', 'warning','You have entered Purchase No of different Company !');
        alert('You have entered Purchase No of different Company !');
        this.VoucherNo="";
        return false;
    }
    if (this.VoucherNo.substring(2, 3) !=  this._loginService.getLogin()[0].CITYCODE1) {
        this._toasterService.toast('warning', 'warning','You have entered Purchase No of different City !');
        alert('You have entered Purchase No of different City !');
        this.VoucherNo="";
        return false;
    }
    if (this.VoucherNo.substring(11, 1) != '9') {
        this._toasterService.toast('warning', 'warning','The No. You have Entered Is not a Purchase No. !');
        alert('The No. You have Entered Is not a Purchase No. !');
        this.VoucherNo="";
        return false;
    }
    if (this.VoucherNo.substring(11, 1) != '6') {
        this._toasterService.toast('warning', 'warning','The No. You have Entered Is not a Journal Voucher No. !');
        alert('The No. You have Entered Is not a Journal Voucher No. !');
        this.VoucherNo="";
        return false;
    }
    const jsonview = {
      VoucherNo:this.VoucherNo
    }
    this._dataService.getData("Accounts/Acc_Purchase_Check_Input_VoucherNo", jsonview)
      .subscribe((data: any) => {
        if (data.Table[0].STATUS.split('#')[0] == "104") {
          this._toasterService.toast('warning', 'warning', data.Table[0].STATUS.split('#')[1]);
          alert(data.Table[0].STATUS.split('#')[1]);
          this.loaderService.display(false);
        }
      });
  }
}
job_validation(){
  if (this.JobNo.substring(0, 2) != this._loginService.getLogin()[0].CMPCODE) {
    alert("Entered Job No. is different company !");
    this._toasterService.toast('warning', 'warning','Entered Job No. is different company !');
    this.JobNo="";//01 101
    /*
 01 101 20 2

 this.JobNo.substring(0, 2)='01'//this always 01 +
  this.JobNo.substring(3, 3)='101' +
   this.JobNo.substring(6, 1)='01' = code
   */
    return false;
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
    this.GSTApplicable="",
    this.TDSApplicable="",
    this.txtchild = "Add";
    //this.ACCBANKDTLSID="0";
  }

  Editchildrecd(id) {
    let filterData = this.Accountlist.filter((filter) => filter.ID == id)[0];
    if ( filterData.IS_NOT_EDIT_ABLE == "1" ) {
      alert("You cannot edit this record !")
      return false;
    }
    if(this.tdsaddflag=="1"){
      alert("You cannot edit this record please reset the Tds Data !")
      return false;
    }
    if ( filterData.ISTDSAPP == "1") {
      alert("You cannot edit this record please reset the Tds Data!")
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
    this.TDSApplicable=filterData.PUR_TDS;
    this.GSTApplicable=filterData.PUR_TAXABLE;
    }
  }

  deletechildrecd(id,editflag) {
    if (editflag == "1") {
      alert("You cannot delete this record !")
      return false;
    }
    else {
      if (confirm('Are you sure want to delete the record ?')) {
        this.loaderService.display(true);
        const jsondelete = { ID: id, VGUID: this._loginService.getLogin()[0].GUID, ACC_PURCHASEDTLS_ID: this.ACCBANKDTLSID }
        this._dataService.getData("Accounts/ACC_PURCHASE_TMP_DEL_NG", jsondelete)
          .subscribe((data: any) => {
           // console.log(data)
           if(data.Table.length > 0){
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
          }
          else if (data.Table.length==0){
            this.Accountlist = data.Table;
            this.NetAmount=data.Table1[0].TOTAMOUNT;
            this.Netdeduction=data.Table1[0].TOTDEDUCTION;
            this.NetAmt=data.Table1[0].NETTOTAL;
            this._toasterService.toast("warning", "warning", data.Table1[0].STATUS.split("#")[1]);
            this.loaderService.display(false);
          }
          });
      }
      else { return false; this.loaderService.display(false); }
    }
  }

//let supin_valid :boolean
  supplier_validation() {
    if (this.suppliername == "" || this.suppliername == undefined) {
      this._toasterService.toast('warning', 'warning', 'Please select Supplier !');
      return false;
    }
    if (this.InvNo == "" || this.InvNo == undefined) {
      this._toasterService.toast('warning', 'warning', 'Supplier Invoice No cannot be left blank!');
      return false;
    }
    this.loaderService.display(true);
    const jsonview = {
      SUPCODE: this.suppliername.split("|")[0],
      SUPINVNO:this.InvNo,
      ENTRYNO: this.PurchaseNo
    }
    this._dataService.getData("Accounts/ACC_PURCHASE_SUPINVNO_VALIDATE", jsonview)
      .subscribe((data: any) => {
        if (data.Table[0].STATUS.split('#')[0] == '100') {
           this.Add_Main();
           this.loaderService.display(false);
         }
         else{
          var answer = confirm("Record with same supplier and invoice number already exists.\n Click Ok to Add & Cancel to Retry!");
          if (answer == false)  {return false; }
          else{  this.Add_Main();  }
          this.loaderService.display(false);
         }
      });

   }


  Add_Main() {

    if(this.STATUS=='RPI')
    {
    if(this.HDISPURGENERATE=='1')
    {
      alert('You can not Update this Purchase Request because Purchase is already Generated for this Request ');
      return false;
    }
  }
//   if(this.HDISPURGENERATE!='1'){
//     if(this.HDISCOMPBP_DONE=='1' && this.HDIsNotOver!='1'&& this.HDPURINVNO != 'WILL'){
//       alert("You can not update this purchase bill because it is already paid through computerised cheque print !!");
//       return false;
//     }
//     else if ((this.HDISCOMPBP_DONE == '1') && (this.HDIsNotOver == '1') && (this.HDPURINVNO == 'WILL')) {
//       alert("You can edit only the amount..not accounts and supplier invoice number and net total should be less than or equal to Purchase Amount=" + this.NetAmt + " !!");
//       return false;
//   }
//   else if ((this.HDISCOMPBP_DONE == '1') && (this.HDIsNotOver  != '1') && (this.HDPURINVNO == 'WILL')) {
//     alert("Computerised Cheuqe is generated for this Purchase Invoice. You can update only Supplier INV No.!!");
//     return false;
// }
//   }
  if (this.PurchaseDate== "" || this.PurchaseDate == undefined) {
    this._toasterService.toast('warning', 'warning', 'Purchase Date cannot be left blank!');
    return false;
  }
      if (this.suppliername == "" || this.suppliername == undefined) {
        this._toasterService.toast('warning', 'warning', 'Please select Supplier !');
        return false;
      }
      if(this.billaddress =="" || this.billaddress ==undefined){
        this._toasterService.toast('warning', 'warning', 'Please select Supplier address  !');
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
      // if(this.tdsaddflag=="0"  && this.PurchaseNo == ' ' ){
      //   this._toasterService.toast('warning', 'warning', 'Please enter tds details first !');
      //   this.loaderService.display(false);
      //   return false;
      // }
      let dataclient: any = []
      dataclient = this.hdtdsArray.filter((code: any) => code.tdsapp === 'Y');
      if(dataclient.length>0){
        this.hdpurtds = dataclient[0].tdsapp
      }
      else{
        this.hdpurtds = 0
      }

      if(this.chkIsTDS==true && this.hdpurtds== 'Y' &&  this.tdsaddflag=="0")
      {
        this._toasterService.toast('warning', 'warning', 'Please enter tds details first !');
        this.loaderService.display(false);
        return false;
      }

      this.loaderService.display(true);
      var data;
      data = this.supplierlist.filter((code: any) => code.VALUEFIELD === this.suppliername)[0].TEXTFIELD;
     //data = this.supplierlist.filter((code: any) => code.VALUEFIELD === this.suppliername);
      const jsonmaster = {
        CMPID: this._loginService.getLogin()[0].CMPID,
        CMPCODE: this._loginService.getLogin()[0].CMPCODE,
        CITYCODE1: this._loginService.getLogin()[0].CITYCODE1,
        CITYCODE: this._loginService.getLogin()[0].CITYCODE,
        USERNAME: this._loginService.getLogin()[0].CMPID,
        ENTRYNO: (this.PurchaseNo == undefined) ? "" : this.PurchaseNo,
        ENTRYDT: this.PurchaseDate,
        STATUS: this.STATUS,
        SUP_CODE: this.suppliername.split("|")[0],//this.suppliername,
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
        ACTION: (this.PurchaseNo == ' ' || this.PurchaseNo == undefined) ? "INSERT" : "UPDATE",
        DOCUMENTG100179: "0",
        FK_SUP_ADDR_ID:  this.billaddress.split("|")[0],
        AMSENSEXP_G102024: "0",
        MISCEXP_G102025: "0"
      }
      let url = "";
      if (this.PurchaseNo == ' ' || this.PurchaseNo == undefined) {
        url = "Accounts/ACC_PURCHASE_INSERT_NG"
      }
      else {
        url = "Accounts/ACC_PURCHASE_UPDATE_NG"
      }
      this._dataService.Common(url, jsonmaster)
        .subscribe((data: any) => {
         // console.log(data)
          if (data.Table[0].STATUS == "100") {
            this._toasterService.toast('success', 'success', data.Table[0].STATUSTEXT);
            this.print(data.Table1[0].ENTRYNO);
            this.RestMain();
            this.loaderService.display(false);
          }
          else if  (data.Table1!=undefined) {
           if (data.Table1[0].STATUS.split("#")[0] == "100"){
            this._toasterService.toast('success', 'success', data.Table1[0].STATUSTEXT);
            this.print(data.Table1[0].ENTRYNO);
            this.RestMain();
            this.loaderService.display(false);
          }
         }
          else
          {
            this._toasterService.toast('warning', 'warning', data.Table[0].STATUSTEXT);
            this.loaderService.display(false);
          }


        });
        this.loaderService.display(false);
    }

  GetActName(Acctcode) {
    this.Item=undefined;
    this.codelistActt = this.AccountNameList.filter((code: any) => code.ACCTCODENAME === Acctcode);
    //console.log(this.codelistActt)
    this.ACCTNAME = this.codelistActt[0].ACCTNAME;
    //console.log(Acctcode.split("|")[0])
    this.Itemslist = this.Allitemlist.filter((code: any) => code.ACCTCODE === Acctcode.split("|")[0]);

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

  editpopulate() {
   // this.loaderService.display(true);
    //console.log("******")
    const jsonview = {
      EntryNo: this.PurchaseNo,
      cmp_code: this._loginService.getLogin()[0].CMPCODE,
      citycode: this._loginService.getLogin()[0].CITYCODE,
      VGUID: this._loginService.getLogin()[0].GUID,
      STATUS: this.STATUS,
      CMPID:this._loginService.getLogin()[0].CMPID,
    }
       this._dataService.getData("Accounts/ACC_PURCHASE_VIEW_NG", jsonview)
      .subscribe((data: any) => {
       // console.log(data)
         this.DueDate = (data.Table[0].PUR_DUEDT != "") ? this._dataService.stringdttoArry(data.Table[0].PUR_DUEDT) : "";
         this.BillReceive = (data.Table[0].PUR_SUPBILLDATE != "") ? this._dataService.stringdttoArry(data.Table[0].PUR_SUPBILLDATE) : "";
        // this.DueDate = (data.Table[0].PUR_DUEDT != "") ? data.Table[0].PUR_DUEDT : "";
        // this.BillReceive = (data.Table[0].PUR_SUPBILLDATE != "") ? data.Table[0].PUR_SUPBILLDATE : "";
        this.InvDate = (data.Table[0].PUR_SUPINVDATE != "") ? this._dataService.stringdttoArry(data.Table[0].PUR_SUPINVDATE) : "";
        this.InvNo = data.Table[0].PUR_INVNO;
        this.PurchaseNo = data.Table[0].PUR_CODE;
    //    this.PurchaseDate = (data.Table[0].PUR_DATE != "") ? this._dataService.stringdttoArry(data.Table[0].PUR_DATE) : "";
        this.PurchaseDate = (data.Table[0].PUR_DATE != "") ? data.Table[0].PUR_DATE : "";
        this.suppliername = data.Table[0].PUR_SUPPLIER;
        this.Narration = data.Table[0].REMARKS;
        this.passedby = data.Table[0].PASSEDBY;
        this.VoucherNo = data.Table[0].VOUCHERNO;
        this.PassedAmount = data.Table[0].PASSEDAMOUNT;
        this.InvoiceAmount = data.Table[0].SUPINVAMT;
        this.IsPassed = (data.Table[0].PASS == 'Y') ? true : false;
        this.Accountlist = data.Table1;
        this.NetAmount = data.Table2[0].TOTAMOUNT;
        this.Netdeduction = data.Table2[0].TOTDEDUCTION;
        this.NetAmt = data.Table2[0].NETTOTAL;
        this.hdPass=(data.Table2[0].PASS !="")?data.Table2[0].PASS :'0';
        this.HDISCOMPBP_DONE=(data.Table2[0].ISCOMPBP_DONE !="0")?data.Table2[0].ISCOMPBP_DONE :'0';
        this.HDIsNotOver=(data.Table2[0].ISNotOverBill !="0")?data.Table2[0].ISNotOverBill :'0';
        this.HDISPURGENERATE=(data.Table[0].ISPURGENERATE !="0")?data.Table[0].ISPURGENERATE :'0';
        this.HDPURINVNO=(data.Table2[0].ISPURGENERATE !="0")?data.Table2[0].ISPURGENERATE :'0';
        // this.disablesupplier=true;
        // this.disablesupplieraddr=true;
        if(data.Table[0].FK_SUP_ADDR_ID!=""){
          var suppcode = data.Table[0].FK_SUP_ADDR_ID.split("|")[1];
         // console.log(suppcode)
           this.GetSupplierName(suppcode);

        }
        this.billaddress=data.Table[0].FK_SUP_ADDR_ID;
        for (let i = 0; i < this.Accountlist.length; i++) {
          let obj = {
            tdsapp:this.Accountlist[i].PUR_TDS
          }
          this.hdtdsArray.push(obj);
        }
        // let obj = {
        //   tdsapp:this.TDSApplicable
        // }

       // this.disabletdsbtn=true;
        //  if(this.PurchaseNo != ' '){
        //    if(this.disabletdsbtn==false){
        //     this.disabletdsbtn=true;
        //    }

        //  }
        if(this.STATUS=='RPI')
        {
        if(this.HDISPURGENERATE=='1')
        {
          this._toasterService.toast('warning', 'warning', 'You can not Update this Purchase Request because Purchase is already Generated for this Request ');
        }

      }
     // this.disabletdsbtn=true;

      })
     // this.disabletdsbtn=true;
      this.loaderService.display(false);
  }

  RestMain() {
    this.Resetchildrcrd();
    this.InvNo = "";
    this.InvDate = "";
    this.DueDate = "";
    this.BillReceive = ""
    this.PurchaseNo = ' ';
   // this.PurchaseDate = '';
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
    this.Accountlist=[];
    this.billaddressfilter=[];
    this.chktdslbl="Is Tds Applicable";
    this.chkIsTDS=false;
    this.disablesupplier=false;
    this.disablesupplieraddr=false;
    this.disablechildaddbtn=false;
    this.disablechildresetbtn=false;
    this.Clearall();
    if(this.STATUS=='PI'){
      this._router.navigate(['/accounts/purchase/Purchase/PI/1/ ' ]);
      }
      else if(this.STATUS=='RPI'){
        this._router.navigate(['/accounts/purchase/Purchase/RPI/1/ ']);
        }

  }
  Clearall(){
    const jsonmaster={CMPID:this._loginService.getLogin()[0].CMPID}
    this._dataService.getData("Accounts/ACC_PURCHASE_RESTALL", jsonmaster)
    .subscribe((data: any) => {
    });
  }
  GetSupplierName(Suppcode){
    this.billaddressfilter= this.billaddressList.filter((x: any) => x.SUPPCODE === Suppcode);

      if( this.billaddressfilter.length =="1"){
        this.billaddress= this.billaddressfilter[0].DATAVALUEFIELD
      }



      let supptds
      supptds = this.SuppliertdsList.filter((code: any) => code.VALUEFIELD === this.suppliername)[0].TEXTFIELD;
     // this.GetTDSType();
      this.EnableDisableDtn(supptds);


      // data = this.supplierlist.filter((code: any) => code.VALUEFIELD === this.suppliername)[0].TEXTFIELD;
      //onsole.log(supptds);
  }
  close() {
    this.showModal_MAWB = false
  }

  validate(mawbno) {
    if(this.SerchTypeMawb=="2"){
      return false
    }else{
    for (let i = 0; i < this.MAWABlist.length; i++) {
        if (this.MAWABlist[i].AEROBILLNO === mawbno) {
            this.MAWABlist[i]["Disabled"] = false;
        } else {
            this.MAWABlist[i]["Disabled"] = true;
        }

        if (this.MAWABlist[i]["Select"] === true) {
          this.MAWABlist[i]["Select"] = false;
          this.MAWABlist[i]["FRIEGHTAMT"] = "";
          this.MAWABlist[i]["AIRFRIGHTCOMM"] = "";
          this.MAWABlist[i]["FRIGHTREBATE"] = "";
          this.MAWABlist[i]["SURCHARGE"] = "";
          this.MAWABlist[i]["AMS_ENSCHARGE"] = "";
          this.MAWABlist[i]["MISCHARGE"] = "";
          this.MAWABlist[i]["DOCUMENTCHARGE"] = "";
      } else {
          this.MAWABlist[i]["Select"] = true;
      }
      let tempList = 0;
          tempList = this.MAWABlist.filter((searchlist: any) => searchlist.Select === false).length;
          if (tempList === this.MAWABlist.length) {
              for (let i = 0; i < this.MAWABlist.length; i++) {
                  this.MAWABlist[i]["Select"] = false;
                  this.MAWABlist[i]["Disabled"] = false;
              }
          }
        }
    }}

  mawb_submit(){
    var data;
    if(this.SerchTypeMawb=="1"){
    for (let i = 0; i < this.MAWABlist.length; i++) {
    //  console.log(this.MAWABlist[i]["Select"] )
      if (this.MAWABlist[i]["Disabled"] ==false) {
        //console.log(this.MAWABlist[i])
        data=this.MAWABlist[i]
      }
    }
    if(data.AIRFRIGHTCOMM=="0" && data.FRIGHTREBATE=="0"){
     this.air_freboth0()
    }else if(data.AIRFRIGHTCOMM=="0" && data.FRIGHTREBATE !="0"){
    this.air0()
    }else if(data.AIRFRIGHTCOMM !="0" && data.FRIGHTREBATE=="0"){
     this.fri0()
    }
  }else if(this.SerchTypeMawb=="2"){
    if(this.airfrightcomm=="0" && this.frightrebate=="0"){
      this.air_freboth0()
    }else if(this.airfrightcomm=="0" && this.frightrebate !="0"){
      this.air0()
    }else if(this.airfrightcomm !="0" && this.frightrebate=="0"){
     this.fri0()
    }
  }

    const jsonmaster={
    CMPID:this._loginService.getLogin()[0].CMPID,
    CMPCODE:this._loginService.getLogin()[0].CMPCODE,
    CITYCODE:this._loginService.getLogin()[0].CITYCODE,
    MAWBNO:(this.SerchTypeMawb=="1")?data.AEROBILLNO:this.mawbno,
    FREIGHT:(this.SerchTypeMawb=="1")?data.FRIEGHTAMT:this.frieghtamt,
    SURCHARGE:(this.SerchTypeMawb=="1")?data.SURCHARGE:this.surcharge,
    AIRFRTCOMM_G100153 :(this.SerchTypeMawb=="1")?data.AIRFRIGHTCOMM:this.airfrightcomm,
    FRTREBATE_G100186 :(this.SerchTypeMawb=="1")?data.FRIGHTREBATE:this.frightrebate,
    VGUID:this._loginService.getLogin()[0].GUID,
    STATUS: this.STATUS,
    DOCUMENT_G100179:(this.SerchTypeMawb=="1")?data.DOCUMENTCHARGE:this.documentcharge,
    AMSENSEXP_G102024: (this.SerchTypeMawb=="1")?data.AMS_ENSCHARGE:this.ams_enscharge,
    MISCEXP_G102025 : (this.SerchTypeMawb=="1")?data.MISCHARGE:this.mischarge
    }
    //console.log(jsonmaster)
    this.loaderService.display(true);
    this._dataService.getData("Accounts/ACC_PURCHASE_MAWBNO_PAGELOAD", jsonmaster)
    .subscribe((data: any) => {

      if(data.Table.length>0){
      if(data.Table[0].STATUS.split("#")[0]=="100" ){
        this.showModal_MAWB=false
        this._toasterService.toast("success", "success", data.Table[0].STATUSTEXT);
          this.PurchaseDate = (data.Table1[0].PUR_DATE != "") ? this._dataService.stringdttoArry(data.Table1[0].PUR_DATE) : ""
          this.InvNo=data.Table1[0].SUPLLIERINVNO
          this.PurchaseNo=data.Table[0].ENTRYNO
          this.DueDate= (data.Table1[0].DUE_DATE != "") ? this._dataService.stringdttoArry(data.Table1[0].DUE_DATE) : ""
          this.NetAmt=data.Table1[0].NETTOTAL
          this.NetAmount=data.Table1[0].TOTAMOUNT
          this.Netdeduction=data.Table1[0].TOTDEDUCTION
          this.JobNo=data.Table[0].JOBNO
          this.Accountlist=data.Table;
          this.loaderService.display(false);
      }else{
        this._toasterService.toast("error", "error", data.Table1[0].STATUS.split("#")[1]);
        this.loaderService.display(false);
      }
    }
      else{
        this._toasterService.toast("error", "error", data.Table1[0].STATUS.split("#")[1]);
        this.loaderService.display(false);
      }
    })
  }
  air_freboth0(){
    var answer = confirm("Please confrim... Freight Rebate is 0  and Air Freight Commission is 0 , \n Click on button Ok to continue and Cancel to Retry !");
    if (answer == false) { return false; }
  }
  air0(){
    var answer = confirm("Please confrim... Air Freight Commission is 0 , \n Click on button Ok to continue and Cancel to Retry !");
    if (answer == false) { return false; }
  }
  fri0(){
    var answer = confirm("Please confrim... Freight Rebate is 0 , Click on button Ok to continue and Cancel to Retry");
    if (answer == false) { return false; }
  }

  Reset() {
    if(confirm('Are you sure you want to reset all data?')){
      this.Narration = "";
    this.Resetchildrcrd();
    this.InvNo = "";
    this.InvDate = "";
    this.DueDate = "";
    this.BillReceive = ""
    this.PurchaseNo = ' ';
   // this.PurchaseDate = '';
    this.passedby = '';
    this.PassedAmount = '';
    this.InvoiceAmount = '';
    this.suppliername = undefined;
    this.VoucherNo = '';
    this.IsPassed = false;
    //this.Narration.nativeElement.value = "";

   // document.getElementById("autoresizing").VA = "";
        this.NetAmount = '';
    this.Netdeduction = '';
    this.NetAmt = '';
    this.text = "Submit";
    this.chktdslbl="";
    this.billaddress="";
    this.disablesupplier=false;
    this.disablesupplieraddr=false;
    this.chkIsTDS=false;
    this.Accountlist=[];
    this.Clearall();
    this.disablechildaddbtn=false;
    this.disablechildresetbtn=false;
    if(this.STATUS=='PI'){
       this._router.navigate(['/accounts/purchase/Purchase/PI/1/ ']);
       }
       else if(this.STATUS=='RPI'){
        this._router.navigate(['/accounts/purchase/Purchase/RPI/1/ ']);
         }
  }
  }
  print(pono)
  {
    let theTop = (screen.height / 2) - (483 / 2);
    let theLeft = (screen.width / 2) - (780 / 2);
    let toolbar = 'resizable=no,scrollbars=no,width=800,height=450,status=no,left=' + theLeft + ',top=' + theTop;
    window.open('./#/popup/Account-Purchase-print/' + pono + '/' + this.STATUS + '/', "Purchase Print", toolbar);
  }
  OpenTdsModal() {
    if (this.suppliername == "" || this.suppliername == undefined) {
      this._toasterService.toast('warning', 'warning', 'Please select Supplier  !');
      return false;
    }
    if(this.Accountlist =="" || this.Accountlist== undefined){
      this._toasterService.toast('warning', 'warning', 'Please Add Account Details !');
      return false;
    }

        this.showModal_TDS = true
        this.str="";
        this.loaderService.display(true)
        const jsondata= {
            SUPPCODE: this.suppliername,
            PURCHASEDT: this.PurchaseDate,
            VGUID: this._loginService.getLogin()[0].GUID,
            CMPCODE:this._loginService.getLogin()[0].CMPCODE,
            CMPID:this._loginService.getLogin()[0].CMPID,
            CITYCODE:this._loginService.getLogin()[0].CITYCODE,
        }
        this._dataService.getData("Accounts/ACC_PIBP_GET_TDSDATA_NG", jsondata)
            .subscribe((data: any) => {
                if (data.Table[0].STATUS == "100") {
                    this.TDSList = data.Table
                   // this.tottdsamt=data.Table2[0].TOTTDSAMT;
                   this.totpiamt=data.Table2[0].TOTPIAMT;
                    this.TotalTDSList=data.Table3;
                    this.sectioncnt=data.Table4[0].CNT;
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
                this.seltaxableamt=data.Table2[0].TOTPIAMT;
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
    GetTDSType()
    {
      this.loaderService.display(true)
      const jsondata= {
          SUPPCODE: this.suppliername,
          PURCHASEDT: this.PurchaseDate,
          CMPCODE:this._loginService.getLogin()[0].CMPCODE
    }
      this._dataService.getData("Accounts/ACC_PURCHASE_GETTDSTYPE", jsondata)
          .subscribe((data: any) => {
              if (data.Table[0].STATUS == "100") {
                  this.TDSTYPE = data.Table[0].TDS_TYPE.split(",")[0];
                  this.TDSTYPE1=data.Table[0].TDS_TYPE.split(",")[1];
                  //this.sectioncnt=data.Table[0].CNT
                  if(this.TDSTYPE=="EDC"){
                      this.disabletdsbtn=true;
                  }
                  else if(this.TDSTYPE=="LDC" || this.TDSTYPE=="BRC"){
                    this.disabletdsbtn=false;
                  }
                  this.loaderService.display(false)
              }else if (data.Table[0].STATUS == "102") {
                this._toasterService.toast('warning', 'warning', data.Table[0].STATUSTEXT);
                this.suppliername=undefined;
                this.chktdslbl="";
                this.chkIsTDS=false;
                this.loaderService.display(false)
             }
              else if (data.Table[0].STATUS == "103") {
                // this._toasterService.toast('warning', 'warning', data.Table[0].STATUSTEXT);
                 this.loaderService.display(false)
              }

          })

    }
//     getCheckedTDSData(e, accid,itemcode,id){

//       if(e.target.checked) {
//          this.checkedList.push(accid);
//     } else {
//         let index = this.checkedList.findIndex(obj => accid.value === obj.value);
//         if(index > -1) {
//             this.checkedList.splice(index,1);
//         }
//     }

//     if(this.checkedList.length > 4) {  // *change available slots*
//         let unCheckedList = this.TDSList.filter((obj) => {
//            let isCheck = this.checkedList.find((item) => {
//                 return item.value === obj.value
//             });
//             obj.Checked = !isCheck ? true : false;
//             return !isCheck;
//         });
//     } else {
//        this.TDSList.map((obj)=>{
//            obj.Checked = false;
//        });
//     }
// }
//     }

    getCheckedTDSData(event,tdsaccid, rate,TDSAmount,puramt,icode,narr,ratetype,ldcrate,accid,offlag){
      // let data1: any = []
      // let data2
      // data1 = this.TDSList.filter((code: any) => code.ACCTID == accid)
      // if(data1.length>"1"){
      //   data2 = this.TDSList.filter((code: any) => code.ITEMCODE == acccode)
      //   }
      //this.newArray=[];

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

          console.log(this.str);
          const jsontdsdtl={
            cmpid:this._loginService.getLogin()[0].CMPID,
            STATUS:this.STATUS,
            VGUID:this._loginService.getLogin()[0].GUID,
            SUPCODE:this.suppliername.split("|")[0],
            STR: this.str
            }
            this._dataService.Common("Accounts/ACC_PURCHASE_TMP_TDSMULTI_IU_NG", jsontdsdtl)
            .subscribe((data: any) => {
              if (data.Table[0].STATUS == "100") {
                this.Accountlist=data.Table;
                this.NetAmount = data.Table1[0].TOTAMOUNT;
                this.Netdeduction = data.Table1[0].TOTDEDUCTION;
                this.NetAmt = data.Table1[0].NETTOTAL;
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
      this._dataService.getData("Accounts/ACC_PURCHASE_TDS_RESET_NG", jsonmaster)
      .subscribe((data: any) => {
        if (data.Table[0].STATUS == "100") {
        this.Accountlist=data.Table;
        this.NetAmount = data.Table1[0].TOTAMOUNT;
        this.Netdeduction = data.Table1[0].TOTDEDUCTION;
        this.NetAmt = data.Table1[0].NETTOTAL;
        this.Resetchildrcrd();
        this.str="";
        this.newArray=[];
        this.disabletdsbtn=false;
        this.disablesupplier=false;
        this.disablesupplieraddr=false;
        this.disablechildaddbtn=false;
        this.disablechildresetbtn=false;
        this.tdsaddflag="0"
        }
      });
    }
    }
    EnableDisableDtn(tds){
      if(tds=="1" && this.PurchaseNo == ' '){
        this.chktdslbl="TDS Applicable for Selected Supplier";
        this.chkIsTDS=true;
        this.disableresetbtn=false;
        this.disabletdsbtn=false;
        this.disablechildaddbtn=false;
        this.disablechildresetbtn=false;
       // this.disablechktds=true;
      }
      else  if(tds=="1" && this.PurchaseNo != ' '){
        this.chktdslbl="TDS Applicable for Selected Supplier";
        this.chkIsTDS=true;
        this.disableresetbtn=false;
        this.disabletdsbtn=true;
        this.disablechildaddbtn=true;
        this.disablechildresetbtn=true;
        this.tdsaddflag="1"
        this.disablepurchasedate=true
       // this.disablechktds=true;
      }
       if(tds=="0"){
         this.chktdslbl="Is Tds Applicable";
         this.disabletdsbtn=true;
         this.chkIsTDS=false;
         this.disableresetbtn=true;
         this.disablepurchasedate=false
      }

    }
    fn_JobValidation(){
      let jobcmpcode=this.JobNo.substring(0, 2);
      let cmpcode=this._loginService.getLogin()[0].CMPCODE;
      if (jobcmpcode != cmpcode) {
        alert("Entered Job No. is of different company !");
        this.JobNo="";
        return false;
    }
    }
    TextareaValueChange(ev) {
      this.Narration = ev.target.value;
  }
}
