import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { DataService } from '../../shared/service/dataService';
import { LoginService } from '../../shared/service/loginService';
import { ToastCommonService } from '../../shared/service/toastService';
import { IMyDpOptions } from 'mydatepicker';
import { LoaderService } from '../../shared/service/loader.service';
import { HttpClient } from '@angular/common/http';
@Component({
  selector: 'app-multicontainer-purchase',
  templateUrl: './multicontainer-purchase.component.html',
  styles: [`
  a:hover,a:focus{
      text-decoration: none;
      outline: none;
  }
  .tab .nav-tabs {
      border-bottom:0 none;
  }
  .tab .nav-tabs li{
      margin-right: 10px;
  }
  .tab .nav-tabs li a{
      position: relative;
      padding: 4px;
      color: #fff;
      font-size: 11px;
      z-index: 1;
      font-family:verdana;
      font-weight:bold
  }
  .tab .nav-tabs li a:hover{
      background:transparent;
      border:1px solid transparent;
      color: #444;
  }
   .tab .nav-tabs li a:before{
      content: "";
      width:100%;
      height:100%;
      position:absolute;
      bottom: 3px;
      left:0px;
      font-size:11px;
      background-color: #379b50;
      border: 1px solid #d3d3d3;
      border-bottom: 0px none;
      border-radius: 10px 10px 0 0;
      transform-origin: left center 0;
      transform: perspective(6px) rotateX(6deg);
      z-index:-1;
  } 
  .tab .nav-tabs li a.active:before{
      background: #fff;
  }
  .tab .nav-tabs li a.active,
  .tab .nav-tabs li a.active:focus,
  .tab .nav-tabs li a.active:hover{
      border:1px solid transparent;
      background:transparent;
      color: #212529;
      z-index: 2;
  }
  `],
})
export class MulticontainerPurchaseComponent implements OnInit {
  purchasedate_step1: any = null; purchasedate_step2: any = null
  public disablepurchasedate_step2:boolean=false;
  ID: string = "0";
  ENTRYNO: string = "0";
  ISNOTEDITABLE: string = "0";
  ACCTNAME: string = "";
  PURCHASEDTLS_ID: string = "0";
  seltaxableamt: any = 0;
  MultiContNo: string = ""; STATUS: string = ""; Type: string = ""; 
  fromright_dt: any = null;toright_dt: any=null;
  text: string = "Submit"; txtchild: string = "Add";
  AccountNameList: any = []; Allitemlist: any = []; Itemslist: any = []

  AcctAmount_step1: string = ""; ActNarration_step1: string = ""; NetAmount_step1: string = ""; NetTotal_step1: string = ""; AccountName_step1: string;
  ContainerNo_step1: string = ""; Item_step1: string; Accountlist_step1: any = []

  Deduction_step2: string = ""; Accountlist_step2: any = []; AcctAmount_step2: string = ""; ActNarration_step2: string = ""; NetAmount_step2: string = "";
  NetTotal_step2: string = ""; AccountName_step2: string ; ContainerNo_step2: string = ""; Item_step2: string; PurchaseNo_step2: string = ""; Narration_step2: string = "";
  PassedAmount: string = "";
  InvoiceAmount: string = "";
  VoucherNo: string = "";
  supplierlist: any = [];
  PassedBylist: any = [];
  billaddress: string = "";
  billaddress_step1: string = "";
  InvNo: string = "";
  InvDate: any = "";
  BillReceive: any = "";
  DueDate: any = "";
  suppliername: string;
  step1suppliername: string;
  passedby: string = "";
  IsPassed: boolean = false;
  JobNo_step2: string = ""; Amount_step2: string = ""; actpassedamount_step2: string = "0"; ACCBANKDTLSID: string = "0"; Netdeduction_step2: string = "";
  NetAmt_step2: string = ""
  public togglevno: boolean = true;
  public togglepassedby: boolean = true;
  public togglepamount: boolean = true;
  public toggleinvamount: boolean = true;
  billaddressList: any = []
  billaddressList_step1: any = []
  billaddressfilter: any = []
  billaddressfilter_step1: any = []
  buttonStatus = false;
  public yes: boolean = true;
  chktdslbl_step1:string="Is Tds Applicable";
  chkIsTDS_step1:boolean=false;
  chktdslbl_step2:string="Is Tds Applicable";
  chkIsTDS_step2:boolean=false;
  SuppliertdsList: any = []
  TDSTYPE: string="";
  TDSTYPE1:string="";
  sectioncnt:any="0";
  GSTApplicable_step1:string="";
  TDSApplicable_step1:string="";
  GSTApplicable_step2:string="";
  TDSApplicable_step2:string="";
  disabletdsbtn=true;
  disableresetbtn=true;
  public showModal_TDS: boolean = false; 
  str:string="";
  TDSList: any = [];
  tottdsamt:any;
  seltdsamt: any = 0;
  newArray: any = [];
  sel_accid : string;
  tdsaddflag:string="0";
  public disablecheckbox:boolean=true;
//---validation 
hdPass: string="0";HDISCOMPBP_DONE: string="0";HDIsNotOver:string="0";HDISPURGENERATE: string="0";HDPURINVNO :string="0";
totpiamt:any;
    Ftotpiamt:any;
    selpiamt: any = 0;
    TotalTDSList: any = [];
    public disablechildaddbtn:boolean=false;
    public disablechildresetbtn:boolean=false;
  multicontainestep1: boolean = true; multicontainestep2: boolean = false; multicontainstep: string = "STEP 1"
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
    selectorWidth: '200px',
    disableUntil: { year: 0, month: 0, day: 0 },
    disableSince: { year: 0, month: 0, day: 0 }
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
     //console.log(this._loginService.getLogin())
    var todaydate = new Date();
    this.purchasedate_step1 = this._dataService.datechnge(todaydate)
    this.purchasedate_step2 = this._dataService.datechnge(todaydate)

    this._activatedRoute.params.subscribe(params => {
      //console.log(params)
      this.PurchaseNo_step2 = params["PurchaseNo"];
      this.STATUS = params["Status"];
      this.Type = params["Type"]
    })
    this.ClearMulticontainerTemp();
    if (this.PurchaseNo_step2 == ' ') {
      //this.verifyPermission('102','Add')
      this.verifyPermission('427','Add')
    } else {
      //this.verifyPermission('102','Modify')    
      this.verifyPermission('427','Modify')       
      this.text = 'Update';         
    }

    const jsonparam = {
      cmp_code: this._loginService.getLogin()[0].CMPCODE,
      citycode: this._loginService.getLogin()[0].CITYCODE,
      citycode1: this._loginService.getLogin()[0].CITYCODE1,
      PSTATUS: this.STATUS
    }
     
    this._dataService.getData("Accounts/ACC_PURCHASE_PAGELOAD", jsonparam)
      .subscribe((data: any) => {
        this.AccountNameList = data.Table;
        this.Allitemlist = data.Table3;
        this.supplierlist = data.Table1;
        this.PassedBylist = data.Table2;
        this.billaddressList = data.Table4;
        this.billaddressList_step1=data.Table4;
        this.SuppliertdsList=data.Table5;
      });


  }
  verifyPermission(formId, userMode) {
        this.loaderService.display(true);
        this._loginService.verifyRights(formId,'')
          .subscribe((data: any) => {
        if(data.Table.length >"0" && (this._loginService.getLogin().ROLETYPE)!="SA"){
        this.fromright_dt = data.Table[0].rightsfrmdt;
        this.toright_dt=data.Table[0].rightstodt;
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

    let todt = new Date(this.toright_dt);
    var newtodate = new Date(todt);
    let d=new Date();
    d=newtodate;
    let copy1 = this.getCopyOfOptions();
    copy1.disableSince = {year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate()+1};
    this.myDatePickerOptionsInv = copy1;
}
  // onDisableRange() {
  //   var date = new Date(this.fromright_dt);
  //   var newdate = new Date(date);
  //   let bdate = new Date();
  //   bdate = newdate
  //   let copy = this.getCopyOfOptions();
  //   bdate.setDate(bdate.getDate());
  //   copy.disableUntil = { year: bdate.getFullYear(), month: bdate.getMonth() + 1, day: bdate.getDate() };
  //   this.myDatePickerOptionsInv = copy;

  //   let d = new Date();
  //   d.setDate(d.getDate() + 1);
  //   let copy1 = this.getCopyOfOptions();
  //   copy1.disableSince = { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
  //   this.myDatePickerOptionsInv = copy1;
  // }
  getCopyOfOptions(): IMyDpOptions {
    return JSON.parse(JSON.stringify(this.myDatePickerOptionsInv));
  }
  puchasedatestep1(ev) {
    this.purchasedate_step1 = ev.formatted
    //console.log(ev)
  }
  puchasedatestep2(ev) {
    this.purchasedate_step2 = ev.formatted
  }
  GetActName(Acctcode) {
    this.Item_step1=undefined;
    this.ACCTNAME = this.AccountNameList.filter((code: any) => code.ACCTCODENAME === Acctcode)[0].ACCTNAME;
    this.Itemslist = this.Allitemlist.filter((code: any) => code.ACCTCODE === Acctcode.split("|")[0]);
  }
  GetSupplierName(Suppcode) {
    this.billaddressfilter = this.billaddressList.filter((x: any) => x.SUPPCODE === Suppcode);
    if (this.billaddressfilter.length == "1") {
      this.billaddress = this.billaddressfilter[0].DATAVALUEFIELD
    }
    let supptds
    supptds = this.SuppliertdsList.filter((code: any) => code.VALUEFIELD === this.suppliername)[0].TEXTFIELD;
   // this.GetTDSType();
    this.EnableDisableDtn(supptds);
  }
  GetStep1SupplierName(Suppcode) {
    this.billaddress_step1="";
    this.billaddressfilter_step1 = this.billaddressList_step1.filter((x: any) => x.SUPPCODE === Suppcode);
    if (this.billaddressfilter_step1.length == "1") {
      this.billaddress_step1 = this.billaddressfilter_step1[0].DATAVALUEFIELD
    }
    let supptds
    supptds = this.SuppliertdsList.filter((code: any) => code.VALUEFIELD === this.step1suppliername)[0].TEXTFIELD;
    //this.GetTDSType();
    this.EnableDisableDtn(supptds);
  }
  GetTDSType()
  {
    this.loaderService.display(true)
    const jsondata= {
        SUPPCODE: this.step1suppliername,
        PURCHASEDT: this.purchasedate_step1,
        CMPCODE:this._loginService.getLogin()[0].CMPCODE
  }
    this._dataService.getData("Accounts/ACC_PURCHASE_GETTDSTYPE", jsondata)
        .subscribe((data: any) => {
            if (data.Table[0].STATUS == "100") {
              this.TDSTYPE = data.Table[0].TDS_TYPE.split(",")[0];
              this.TDSTYPE1=data.Table[0].TDS_TYPE.split(",")[1];
              this.sectioncnt=data.Table[0].CNT
                // if(this.TDSTYPE=="EDC"){
                //     this.disabletdsbtn=true;
                // }
                // else if(this.TDSTYPE=="LDC" || this.TDSTYPE=="BRC"){
                //   this.disabletdsbtn=false;
                // }
                this.loaderService.display(false)
            }else if (data.Table[0].STATUS == "102") {
              this._toasterService.toast('warning', 'warning', data.Table[0].STATUSTEXT);
              this.step1suppliername=undefined;
              this.billaddress_step1=undefined;
              this.chktdslbl_step1="";
              this.chkIsTDS_step1=false;
              this.loaderService.display(false)
           } 
            else if (data.Table[0].STATUS == "103") {
              // this._toasterService.toast('warning', 'warning', data.Table[0].STATUSTEXT);
               this.loaderService.display(false)
            }
          })
      }
  EnableDisableDtn(tds){
    if(tds=="1"){
      this.chktdslbl_step1="TDS Applicable for Selected Supplier";
      this.disabletdsbtn=false;
      this.chkIsTDS_step1=true;
      this.disableresetbtn=true;
      }
     if(tds=="0"){
      this.chktdslbl_step1="Is Tds Applicable";
      this.disabletdsbtn=true;
      this.chkIsTDS_step1=false;
      this.disableresetbtn=true;
    }
  }
  Addchildrcrdstep1() {
    if(this.step1suppliername =="" || this.step1suppliername==undefined){
      this._toasterService.toast('warning', 'warning', 'Please select Supplier  !');
       return false;
      }
    if (this.AccountName_step1 == "" || this.AccountName_step1 == undefined) {
      this._toasterService.toast('warning', 'warning', 'Please select Account  !');
       return false;
    }
    if(this.TDSApplicable_step1=="" || this.TDSApplicable_step1 ==undefined){
      this._toasterService.toast('warning', 'warning', 'Please select TDS applicable or not.!');
      return false;
    }
    if(this.GSTApplicable_step1=="" || this.GSTApplicable_step1 ==undefined){
      this._toasterService.toast('warning', 'warning', 'Please select GST applicable or not.!');
       return false;
    }
    if (this.ContainerNo_step1 == "" || this.ContainerNo_step1 == undefined) {
      this._toasterService.toast('warning', 'warning', 'Container No. could not be blank !');
      return false;
    }
    else if (this.ContainerNo_step1.length < 11 ) {
      this._toasterService.toast('warning', 'warning', 'Please enter 11 digit Container No ! ');
      return false;
    }
    if (this.AcctAmount_step1 == "" || this.AcctAmount_step1 == undefined || this.AcctAmount_step1 == "0" ) {
      this._toasterService.toast('warning', 'warning', 'Amount could not be blank !');
      return false;
    }
    else  if (parseFloat(this.AcctAmount_step1) < 0) {
      this._toasterService.toast('warning', 'warning', 'Invalid Amount - Please Check !');
     return false;
    } 
    if (this.Itemslist.length>0){
      if (this.Item_step1 == "" || this.Item_step1 == undefined) {
        this._toasterService.toast('warning', 'warning', 'Please select Item  !');
        return false;
      }
    }
    this.loaderService.display(true);
    //console.log(this.Item_step1)
    const jsonparam = {
      ID: this.ID,
      ENTRYNO: this.ENTRYNO,
      VGUID: this._loginService.getLogin()[0].GUID,
      CLIENT: this.AccountName_step1.split("|")[0],
      ACCOUNT_NAME: this.ACCTNAME,
      JOBNO: this.ContainerNo_step1,
      AMOUNT: this.AcctAmount_step1,
      DEDUCTION: "0",
      NARRATION: this.ActNarration_step1,
      ITEMCODE: (this.Item_step1==undefined)?"" :this.Item_step1.split("|")[0],//this.Item_step1.split("|")[0],
      ITEM_DATAVALUE: (this.Item_step1==undefined)?"" :this.Item_step1 ,//this.Item_step1,
      ACC_PURCHASEDTLS_ID: this.PURCHASEDTLS_ID,
      IsJobReport: this.AccountName_step1.split("|")[1],
      CMPID: this._loginService.getLogin()[0].CMPID,
      PUR_TAXABLE:(this.GSTApplicable_step1=="")?"":this.GSTApplicable_step1,
      ISTDSAPP:(this.chkIsTDS_step1 == true) ? "0" : "0",
      PUR_TDS:(this.TDSApplicable_step1=="")?"0":this.TDSApplicable_step1,
    }
  //  console.log(jsonparam)
    this._dataService.Common("Accounts/ACC_PURCHASE_MULTICONTAINER_TMP_IU_NG", jsonparam)
      .subscribe((data: any) => {
     //   console.log(data)
        if (data.Table[0].STATUS == "100") {
          this._toasterService.toast("success", "success", data.Table[0].STATUSTEXT)
          this.Accountlist_step1 = data.Table;
          this.NetAmount_step1 = data.Table1[0].TOTAMOUNT;
          this.NetTotal_step1 = data.Table1[0].NETTOTAL;
          this.Resetchildrcrdstep1();
          this.loaderService.display(false);
        }
        else {
          this._toasterService.toast("warning", "warning", data.Table[0].STATUSTEXT);
          this.loaderService.display(false);
        }
        })
     }
  Resetchildrcrdstep1() {
    this.ID = "0";
    this.AccountName_step1 = undefined;
    this.ContainerNo_step1 = "";
    this.AcctAmount_step1 = "";
    this.ActNarration_step1 = "";
    this.Item_step1 = undefined;
    this.txtchild = "Add";
    this.ENTRYNO = "0";
    this.PURCHASEDTLS_ID = "0"
    this.TDSApplicable_step1="";
    this.GSTApplicable_step1="";
  }

  Editchildrecdstep1(id) {
    let filterData = this.Accountlist_step1.filter((filter) => filter.ID == id)[0];
    //console.log(filterData)
    this.ID = filterData.ID;
    this.AccountName_step1 = filterData.CLIENT + '|' + filterData.ISJOBREPORT;
    this.AcctAmount_step1 = filterData.AMOUNT;
    this.Item_step1 = filterData.ITEM_DATAVALUE;
    this.ContainerNo_step1 = filterData.JOBNO;
    this.ActNarration_step1 = filterData.NARRATION;
    this.txtchild = "Update";
    this.PURCHASEDTLS_ID = filterData.ACC_PUR_MCONT_ID;
    this.TDSApplicable_step1=filterData.PUR_TDS;
    this.GSTApplicable_step1=filterData.PUR_TAXABLE;
  }
  Add_Mainstep1() {
 
    if(this.step1suppliername =="" || this.step1suppliername==undefined){
      this._toasterService.toast('warning', 'warning', 'Please select Supplier  !');
      return false;
    }
    if(this.billaddress_step1 =="" || this.billaddress_step1 ==undefined){
      this._toasterService.toast('warning', 'warning', 'Please select Supplier address  !');
      return false;
    }
    if(this.Accountlist_step1.length==0){
      this._toasterService.toast('warning', 'warning', 'Please enter Container Details  !');
      return false;
    }
    this.loaderService.display(true);
    const jsonparam = {
      CMPCODE: this._loginService.getLogin()[0].CMPCODE,
      CITYCODE1: this._loginService.getLogin()[0].CITYCODE1,
      VGUID: this._loginService.getLogin()[0].GUID,
      Type: "PI",
      CMPID: this._loginService.getLogin()[0].CMPID,
      // PUR_TAXABLE:(this.GSTApplicable=="")?"":this.GSTApplicable,
      // ISTDSAPP:(this.chkIsTDS == true) ? "0" : "0",
      // PUR_TDS:(this.TDSApplicable=="")?"0":this.TDSApplicable,
    }
    
    this._dataService.getData("Accounts/ACC_PURCHASE_MULTICONTAINER_IU_NG", jsonparam)
      .subscribe((data: any) => {
     //  console.log(data)
      //  this.Accountlist_step1 = data.Table;
        this.Accountlist_step2 = data.Table;
        this.suppliername=this.step1suppliername;
        this.GetSupplierName(this.suppliername);
        this.billaddress=this.billaddress_step1;
        this.chkIsTDS_step2=this.chkIsTDS_step1;
        this.chktdslbl_step2=this.chktdslbl_step1;
        this.NetAmount_step2 = data.Table1[0].TOTAMOUNT;
        this.Netdeduction_step2 = data.Table1[0].TOTDEDUCTION;
        this.NetAmt_step2 = data.Table1[0].NETTOTAL;    
        this.buttonStatus =true;                          
        $("#data-step2").removeClass("disabled");
        (<any>$('.nav a').filter('a[href="#step2"]')).tab('show');
        this.loaderService.display(false);
      })
  }
  ClearMulticontainerTemp() {
    const jsonmaster = { VGUID: this._loginService.getLogin()[0].GUID }
    this._dataService.getData("Accounts/ACC_PURCHASE_RESETMULTICONTAINER_NG", jsonmaster)
      .subscribe((data: any) => {
      });
  }
  RestMain_step1() {
    this.loaderService.display(true);
    if(confirm('Are you sure you want to reset all data?'))     {
    this.Resetchildrcrdstep1()
    this.Accountlist_step1 = []
    this.NetAmount_step1 = ""
    this.NetTotal_step1 = ""
    this.chktdslbl_step1="Is Tds Applicable";
    this.chkIsTDS_step1=false;
    this.step1suppliername=undefined;
    this.billaddress_step1="";
    $("#data-step2").addClass("disabled");
       (<any>$('.nav a').filter('a[href="#step1"]')).tab('show');
      const jsonreset = { VGUID :this._loginService.getLogin()[0].GUID}
      this._dataService.getData("Accounts/ACC_PURCHASE_MULTICONTAINER_RESET_STEP1", jsonreset)
     .subscribe((data: any) => {
        this._toasterService.toast('info', 'success', "Clear all data");
        this._router.navigate(["/accounts/purchase/multicontainer/PI/3/ "]);
      });
      this.loaderService.display(false);
    }  
    else   {   
      this.loaderService.display(false);
      return false;
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
  if (this.JobNo_step2.substring(0, 2) != this._loginService.getLogin()[0].CMPCODE) {
    alert("Entered Job No. is different company !");
    this._toasterService.toast('warning', 'warning','Entered Job No. is different company !');
    this.JobNo_step2="";
    return false;
  }
}
  Addchildrcrdstep2() {
    if (this.AccountName_step2 == "" || this.AccountName_step2 == undefined) {
      this._toasterService.toast('warning', 'warning', 'Please select Account  !');
      this.loaderService.display(false);
      return false;
    }
    if (this.Itemslist.length>0){
      if (this.Item_step2 == "" || this.Item_step2 == undefined) {
        this._toasterService.toast('warning', 'warning', 'Please select Item  !');
        return false;
      }
    }
    if (this.suppliername==this.AccountName_step2.split('|')[0])
    {
      this._toasterService.toast('warning', 'warning', 'Supplier and Account Name Should be different .!');     
      return false; 
    }
    if(this.TDSApplicable_step2=="" || this.TDSApplicable_step2 ==undefined){
      this._toasterService.toast('warning', 'warning', 'Please select TDS applicable or not.!');
    
       return false;
    }
    if(this.GSTApplicable_step2=="" || this.GSTApplicable_step2 ==undefined){
      this._toasterService.toast('warning', 'warning', 'Please select GST applicable or not.!');
        return false;
    }
    if ((this.Amount_step2 == "" || this.Amount_step2 == undefined ||  this.Amount_step2 == '0' ) && (this.Deduction_step2 == "" || this.Deduction_step2 == undefined  || this.Deduction_step2 == '0')) {
      this._toasterService.toast('warning', 'warning', 'Please enter Amount or Deduction.!');
       return false;
    }

    if (parseFloat(this.Amount_step2) >0 && parseFloat(this.Deduction_step2 )>0) {
      this._toasterService.toast('warning', 'warning', 'Invalid Amount - Please Check !');
      return false;
    }
    if (parseFloat(this.Amount_step2) < 0 && parseFloat(this.Deduction_step2 )>0) {
      this._toasterService.toast('warning', 'warning', 'Invalid Amount - Please Check !');
       return false;
    }
    if (parseFloat(this.Deduction_step2) < 0) {
      this._toasterService.toast('warning', 'warning', 'Invalid Amount - Please Check !');
       return false;
    }
   // console.log(this.AccountName_step2)
  //  console.log(this.Item_step2)
  this.loaderService.display(true);
  let ITEMCODEvl; let ITEMvl; let ITEMDT
   ITEMCODEvl= (this.Item_step2 == null)? "" : this.Item_step2.split("|")[0];
   ITEMvl= (this.Item_step2 == null)? "" : this.Item_step2.split("|")[2];
   ITEMDT =(this.Item_step2 == null)? "" : this.Item_step2;
    if(ITEMCODEvl==null){ITEMCODEvl=""}
    if(ITEMvl==null){ITEMvl=""}
    if(ITEMDT==null){ITEMDT=""}
    const jsonchild = {
      ID: this.ID,
      ENTRYNO: this.ENTRYNO,
      CLIENT: this.AccountName_step2.split("|")[0],
      JOBNO: this.JobNo_step2,
      DEDUCTION: this.Deduction_step2,
      AMOUNT: this.Amount_step2,
      USERNAME: this._loginService.getLogin()[0].CMPID,
      NARRATION: this.ActNarration_step2,
      IS_NOT_EDIT_ABLE: this.ISNOTEDITABLE,
      ITEMCODE:ITEMCODEvl,// this.Item_step2.split("|")[0],
      VGUID: this._loginService.getLogin()[0].GUID,
      ACCOUNT_NAME: this.ACCTNAME,
      ITEM: ITEMvl,//this.Item_step2.split("|")[2],
      ACC_PURCHASEDTLS_ID: this.ACCBANKDTLSID,
      STATUS: this.STATUS,
      IsJobReport: this.AccountName_step2.split("|")[1],
      ITEM_DATAVALUE: ITEMDT,//this.Item_step2,
      SRPIPASSAMOUNT: this.actpassedamount_step2,
      CMPID: this._loginService.getLogin()[0].CMPID,
      PUR_TAXABLE:(this.GSTApplicable_step2=="")?"":this.GSTApplicable_step2,
      ISTDSAPP:(this.chkIsTDS_step2 == true) ? "0" : "0",
      PUR_TDS:(this.TDSApplicable_step2=="")?"0":this.TDSApplicable_step2,
      MAWBFLAG:"1" 
    }
  //  console.log(jsonchild)
    this._dataService.Common("Accounts/ACC_PURCHASE_TMP_IU_NG", jsonchild)
      .subscribe((data: any) => {
          if (data.Table[0].STATUS== "100") {
          this._toasterService.toast("success", "success", data.Table[0].STATUSTEXT)
          this.Accountlist_step2 = data.Table;
          this.NetAmount_step2 = data.Table1[0].TOTAMOUNT;
          this.Netdeduction_step2 = data.Table1[0].TOTDEDUCTION;
          this.NetAmt_step2 = data.Table1[0].NETTOTAL;
          this.Resetchildrcrdstep2();
          this.loaderService.display(false);
        }
        else {
          this._toasterService.toast("warning", "warning", data.Table[0].STATUSTEXT);
          this.loaderService.display(false);
        }
      });
  }
  Resetchildrcrdstep2() {
    this.ID = "0";
    this.AccountName_step2 = undefined;
    this.JobNo_step2 = "";
    this.Deduction_step2 = "";
    this.Amount_step2 = "";
    this.ActNarration_step2 = "";
    this.Item_step2 = undefined;
    this.actpassedamount_step2 = "0";
    this.txtchild = "Add";
    this.TDSApplicable_step2="";
    this.GSTApplicable_step2="";
    this.ACCBANKDTLSID="0";
  }
  Editchildrecdstep2(id) {
    let filterData = this.Accountlist_step2.filter((filter) => filter.ID == id)[0];
    if ( filterData.IS_NOT_EDIT_ABLE == "1") {
      alert("You cannot edit this record!")
      return false;
    }
    else{
    this.ID = filterData.ID;
    this.AccountName_step2 = filterData.CLIENT + '|' + filterData.ISJOBREPORT;
    this.Amount_step2 = filterData.AMOUNT;
    this.Deduction_step2 = filterData.DEDUCTION;
    this.actpassedamount_step2 = filterData.SRPIPASSAMOUNT;
    this.Item_step2 = filterData.ITEM_DATAVALUE;
    this.JobNo_step2 = filterData.JOBNO;
    this.ActNarration_step2 = filterData.NARRATION;
    this.txtchild = "Update";
    this.ACCBANKDTLSID = filterData.ACC_PURCHASEDTLS_ID;
    this.ISNOTEDITABLE = filterData.IS_NOT_EDIT_ABLE;
    this.TDSApplicable_step2=filterData.PUR_TDS;
    this.GSTApplicable_step2=filterData.PUR_TAXABLE;
    }
  }
  deletechildrecdstep2(id,editflag) {
    if (editflag == "1") {
      alert("You cannot delete this record!")
      return false;
    }
    else {
      if (confirm('Are you sure want to delete the record ?')) {
        this.loaderService.display(true);
        const jsondelete = { ID: id, VGUID: this._loginService.getLogin()[0].GUID, ACC_PURCHASEDTLS_ID: this.ACCBANKDTLSID }
        this._dataService.getData("Accounts/ACC_PURCHASE_TMP_DEL_NG", jsondelete)
          .subscribe((data: any) => {
         if (data.Table1[0].STATUS.split("#")[0] == "100") {
              this.Accountlist_step2 = data.Table;
              this._toasterService.toast('info', 'Complete', data.Table1[0].STATUS.split("#")[1]);
              this.loaderService.display(false);
            }
            else {
              this._toasterService.toast("warning", "warning", "Error in Deleting");
              this.loaderService.display(false);
            }
          });
      }
      else { return false;  }
    }
    this.loaderService.display(false);
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
  /*
  valid():boolean {  
    if (this.STATUS == 'PI')  {
      if (this.HDISPURGENERATE !='1'){
      if (this.HDISCOMPBP_DONE== '1' && this.HDIsNotOver!= '1' && this.HDPURINVNO != 'WILL') {
        alert("You can not update this purchase bill because it is already paid through computerised cheque print !!");
        return false;
      }
      else if ((this.HDISCOMPBP_DONE == '1') && (this.HDIsNotOver == '1') && (this.HDPURINVNO == 'WILL')) {
        alert("You can edit only the amount..not accounts and supplier invoice number and net total should be less than or equal to Purchase Amount=" +  this.NetAmt + " !!");
        return false;
    }
    else if ((this.HDISCOMPBP_DONE == '1') && (this.HDIsNotOver  != '1') && (this.HDPURINVNO == 'WILL')) {
        alert("Computerised Cheuqe is generated for this Purchase Invoice. You can update only Supplier INV No.!!");
        return false;
      }
      else {return true;}
      }
      else {return true;} 
  }
  else
  {
     if (this.HDISPURGENERATE == '1') {
      alert("You can not Update this Purchase Request because Purchase is already Generated for this Request !!");
      return false;
     } else { 
         return false;
     }      
  }  
} */
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
    SUPCODE: this.suppliername,
    SUPINVNO:this.InvNo,
    ENTRYNO: this.PurchaseNo_step2
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
    this.loaderService.display(false);
 }

  Add_Main() {
    if (this.purchasedate_step2== "" || this.purchasedate_step2 == undefined) {
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
    if (this.InvDate== "" || this.InvDate == undefined) {
      this._toasterService.toast('warning', 'warning', 'Supplier Invoice Date cannot be left blank!');
       return false;
    }
    if(this._dataService.date2Comparison(this.DueDate.formatted,this.purchasedate_step2.formatted)==false)
    {
      this._toasterService.toast('warning', 'warning', 'Due date Cannot be Less than Purchase Entry date');
      return false;
    }
    // if(this.tdsaddflag=="0" && this.chkIsTDS_step2==true){
    //   this._toasterService.toast('warning', 'warning', 'Please enter tds details first !');
    //   return false;
    // }
    this.loaderService.display(true);
    var data;
    data = this.supplierlist.filter((code: any) => code.VALUEFIELD === this.suppliername)[0].TEXTFIELD;
     const jsonmaster = {
      CMPID: this._loginService.getLogin()[0].CMPID,
      CMPCODE: this._loginService.getLogin()[0].CMPCODE,
      CITYCODE1: this._loginService.getLogin()[0].CITYCODE1,
      CITYCODE: this._loginService.getLogin()[0].CITYCODE,
      USERNAME: this._loginService.getLogin()[0].CMPID,
      ENTRYNO: (this.PurchaseNo_step2 == undefined) ? "" : this.PurchaseNo_step2,
      ENTRYDT: this.purchasedate_step2,
      STATUS: this.STATUS,
      SUP_CODE: this.suppliername,
      SUP_NAME: data,
      SUP_INVNO: (this.InvNo == "") ? "" : this.InvNo,
      SUP_INVDT: (this.InvDate) ?this.InvDate.formatted : "",
      SUP_BILLRECEIVEDDT:  (this.BillReceive) ?this.BillReceive.formatted : "",
      SUP_DUEDT: (this.DueDate) ?this.DueDate.formatted : "",
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
      NARRATION: this.Narration_step2,
      ACTUALAMOUNT: this.NetAmt_step2,
      VGUID: this._loginService.getLogin()[0].GUID,
      MAKER_ID: this._loginService.getLogin()[0].CMPID,
      MAKER_IP: this._loginService.getLogin()[0].MAKERIP,
      ACTION: (this.PurchaseNo_step2 == "" || this.PurchaseNo_step2 == ' ' ||  this.PurchaseNo_step2 == undefined) ? "INSERT" : "UPDATE",
      DOCUMENTG100179: "0",
      FK_SUP_ADDR_ID: this.billaddress.split("|")[0],
      AMSENSEXP_G102024: "0",
      MISCEXP_G102025: "0"
    }
    let url = "";
    if (this.PurchaseNo_step2 == ' ' || this.PurchaseNo_step2 == undefined) {
      url = "Accounts/ACC_PURCHASE_INSERT_NG"
    }
    else {
      url = "Accounts/ACC_PURCHASE_UPDATE_NG"
    }
    this._dataService.Common(url, jsonmaster)
      .subscribe((data: any) => {
       if (data.Table[0].STATUS == "100") {
          this._toasterService.toast('success', 'success', data.Table[0].STATUSTEXT);
          this.print(data.Table1[0].ENTRYNO);
          this.RestMain();
          this.loaderService.display(false);
        }
        else {
          this._toasterService.toast('warning', 'warning', data.Table[0].STATUSTEXT);
          this.RestMain();
          this.loaderService.display(false);
        }
      });
  }
  RestMain(){
    this.Resetchildrcrdstep2()
    this.InvNo = "";
    this.InvDate = "";
    this.DueDate = "";
    this.BillReceive = ""
    this.PurchaseNo_step2 = ' ';
    //this.purchasedate_step2 = '';
    this.passedby = '';
    this.PassedAmount = '';
    this.InvoiceAmount = '';
    this.suppliername = undefined;
    this.VoucherNo = '';
    this.IsPassed = false;
    this.Narration_step2 = '';
    this.NetAmount_step2 = '';
    this.Netdeduction_step2 = '';
    this.NetAmt_step2 = '';
    this.text = "Submit";
    this.billaddress='';
    this.Accountlist_step1=[];
    this.Accountlist_step2=[];
    $("#data-step2").addClass("disabled");
   (<any>$('.nav a').filter('a[href="#step1"]')).tab('show');
   this._router.navigate(["/accounts/purchase/multicontainer/PI/3/ "]);
   this.Accountlist_step1 = []
   this.NetAmount_step1 = "";
   this.NetTotal_step1 = "";
   this.step1suppliername = undefined;
   this.buttonStatus=false;
   this.chktdslbl_step1="Is Tds Applicable";
   this.chkIsTDS_step1=false;
   this.step1suppliername=undefined;
   this.billaddress_step1=undefined;
  }
  fn_Validate_ContainerNo(ContNo)  {
      this.loaderService.display(true)
      const jsoncontainer= {                   
        CMPCODE: this._loginService.getLogin()[0].CMPCODE,
        CITYCODE: this._loginService.getLogin()[0].CITYCODE1,
        CONTAINERNO:ContNo,
        };
      this._dataService.getData("Accounts/ACC_PURCHASE_MContainer_Validate", jsoncontainer)
      .subscribe((data: any) => {                    
            if(data.Table[0].STATUS.split("#")[0]== "103"){   
            var Msg = data.Table[0].STATUS.split("#")[1];
            alert(Msg);
           // this.ContainerNo_step1.ena = false;
            this.ContainerNo_step1 = "";
            return false;
        }
     });
    this.loaderService.display(false)
  }
Reset(){
  this.loaderService.display(true);
  if(confirm('Are you sure you want to reset all data?'))     {
  this.Resetchildrcrdstep2()
  this.InvNo = "";
  this.InvDate = "";
  this.DueDate = "";
  this.BillReceive = ""
  this.PurchaseNo_step2 = ' ';
 // this.purchasedate_step2 = '';
  this.passedby = '';
  this.PassedAmount = '';
  this.InvoiceAmount = '';
  this.suppliername = undefined;
  this.VoucherNo = '';
  this.IsPassed = false;
  this.Narration_step2 = '';
  this.NetAmount_step2 = '';
  this.Netdeduction_step2 = '';
  this.NetAmt_step2 = '';
  this.NetAmount_step1 = '';
  this.NetTotal_step1 = '';
  this.text = "Submit";
  this.Accountlist_step1=[];
  this.Accountlist_step2=[];
  this.buttonStatus=false;
  this.chktdslbl_step2="Is Tds Applicable";
  this.chkIsTDS_step2=false;
  this.chktdslbl_step1="Is Tds Applicable";
  this.chkIsTDS_step1=false;
  this.step1suppliername=undefined;
  this.billaddress_step1=undefined
  this.billaddress=undefined
  this.disablechildaddbtn=false;
  this.disablechildresetbtn=false;
  $("#data-step2").addClass("disabled");
   (<any>$('.nav a').filter('a[href="#step1"]')).tab('show');
  const jsonreset = { VGUID :this._loginService.getLogin()[0].GUID}
  this._dataService.getData("Accounts/ACC_PURCHASE_MULTICONTAINER_NG_RESET", jsonreset)
 .subscribe((data: any) => {
    this._toasterService.toast('info', 'success', "Clear all data");
     this._router.navigate(["/accounts/purchase/multicontainer/PI/3/ "]);
  });
  this.loaderService.display(false);
}  
else   {   
 return false;
 }
this.loaderService.display(false);
}
OpenTdsModal() {
  if (this.suppliername == "" || this.suppliername == undefined) {
    this._toasterService.toast('warning', 'warning', 'Please select Supplier  !');
    return false;
  }
      this.showModal_TDS = true
      this.str="";
      this.loaderService.display(true)
      const jsondata= {
          SUPPCODE: this.suppliername,
          PURCHASEDT: this.purchasedate_step2,
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
                         + '|' + this.TDSList[i].ITEMCODE +  '|' + this.TDSList[i].NARRATION +  '|' + this.TDSList[i].RATETYPE +  '|' + this.TDSList[i].ACCTID + 
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
getCheckedTDSData(event,tdsaccid, rate,TDSAmount,puramt,icode,narr,ratetype,accid,offlag){
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
                  + '|' + this.newArray[i].ITEMCODE +  '|' + this.newArray[i].NARR +  '|' + this.newArray[i].RATETYPE +  '|' + this.newArray[i].ACCTID 
                  +  '|' + this.newArray[i].OFFLAG +  ";" ;
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
            this.Accountlist_step2=data.Table;
            this.NetAmount_step2 = data.Table1[0].TOTAMOUNT;
            this.Netdeduction_step2 = data.Table1[0].TOTDEDUCTION;
            this.NetAmt_step2 = data.Table1[0].NETTOTAL;
            this.loaderService.display(false);
            this.str="";
            this.showModal_TDS=false;
            this.disabletdsbtn=true;
            this.disableresetbtn=false;
            this.disablepurchasedate_step2=true;
            this.tdsaddflag="1"
            this.disablepurchasedate_step2=true;  
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
    this.Accountlist_step2=data.Table;
    this.NetAmount_step2 = data.Table1[0].TOTAMOUNT;
    this.Netdeduction_step2 = data.Table1[0].TOTDEDUCTION;
    this.NetAmt_step2 = data.Table1[0].NETTOTAL;
    this.Resetchildrcrdstep2();
    this.str="";  
    this.newArray=[];
    this.disabletdsbtn=false;
    this.tdsaddflag="0"
    this.disablechildaddbtn=false;
    this.disablechildresetbtn=false; 
    this.disablepurchasedate_step2=false; 
    }
  });
}
}
print(pono)
  {
    let theTop = (screen.height / 2) - (483 / 2);
    let theLeft = (screen.width / 2) - (780 / 2);
    let toolbar = 'resizable=no,scrollbars=no,width=800,height=450,status=no,left=' + theLeft + ',top=' + theTop;
    window.open('./#/popup/Account-Purchase-print/' + pono + '/' + this.STATUS + '/', "Purchase Print", toolbar);
  }
  TextareaValueChange(ev) {
    this.Narration_step2 = ev.target.value;
  } 
}
