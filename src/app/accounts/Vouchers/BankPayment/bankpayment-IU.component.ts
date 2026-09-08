import { Component, OnInit } from '@angular/core';
import { IMyDpOptions } from 'mydatepicker';
///import{DataService} from '../../..authServiceshared/service/dataService';
import{DataService} from '../../../shared/service/dataService';
import { LoginService } from '../../../shared/service/loginService';
import { ToastCommonService } from '../../../shared/service/toastService';
import { LoaderService } from '../../../shared/service/loader.service';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Configuration } from '../../../app.constants';

@Component({
    templateUrl: 'bankpayment-IU.component.html'
    // ,
    // styles:[` table, tr, td, th{
    //           border: none;
    //        }`]
})
export class BankPaymentComponent implements OnInit {
    EntryNo: string="";
    EntryDate: any="";
    Narration: string="";
    client:string="";
    AccountName: string;
    Allitemlist:any=[];
    AllDepartmentlist:any=[];
    codelistActt :any=[] ;
    AccountNameList:any=[];
    Departmentlist:any=[];
    Department:string="0";
    codelistDept :any=[] ;
    DepartmentName:string;
    OurBankList:any=[];
    AllOurBankList:any=[];
    OurBank:string;
    OurBankName:string;
    ChqType:string="CHQ";
    ChkTypeList :any=[];
    Item: string;
    ItemList:any=[];
    EntryType:string="0";
    EntryTypeList:any=[];
    BillNo: string="";
    JobNo: string="";
    Amount: string="";
    Deduction: string="";
    ShortNarration: string="";
    TotalAmount: string="0";
    TotalDeduction: string="0";
    NetTotal: string="0";
    OldNetTotal:string="0";
    NewnetAmt:string="0";
    ID:string="0";
    ISNOTEDITABLE:string="0";
    ACC_BANKDTLS_ID:string="0";
    Header: string="BANK PAYMENT";
    text: string="Submit";txtchild : string ="Add";txtadd:string ="Add";
    Accountlist:any=[];
    ACCTNAME:string="";
    STATUS:string="BP";
    NOTOVERFLAG:string="";
    PAYEENAME:string="";
    CRPARENTENTRYNO:string="0";
    ChequeNo: string="";
    ChequeDate: any= '';
    BankName: string;
    CompChequeFlag:string="0";
    dfltourbank  :string="";
    public showModal_ChqList: boolean = false;
    public showModal_ChqValidate: boolean = false;
    ListChq: any=[];
    Msg:any;
    public Conf: string ="";
    strmsg:string="";
    public disable_BillNo: boolean = false;
    public disable_EntryType: boolean = false;
    public disable_cmdadd: boolean = false;
    public disable_cmdcancel: boolean = false;
    public disable_chequetype: boolean = false;
    public disable_chequeno: boolean = false;
    public disable_deduction: boolean = false;
    public toggledebit: boolean = false;
    public showModal_ListBill: boolean = false;
    public disableEntryType: boolean=false;
    ListBill: any=[];
    newArray: any = [];
    sel_inv_no : string;
    sel_jobno : string;
    sel_client: string;
    sel_amount: string;
    BillNoList: string = "";
    STRTXT:any=[];
    chequelabel:string="Normal cheque print";
    confirmsave: string="";
    BankRefNo:string="";
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
        private _loginService:LoginService,
        private _configuration: Configuration ) { }
    ngOnInit() {
        this.ChequeDate=this._dataService.getCurrentdate();
        this._activatedRoute.params.subscribe(params => {
        this.EntryNo = params["EntryNo"];
        })
            this.EntryDate = new Date();
            this.EntryDate =  this._dataService.datechnge(this.EntryDate)
            this.ChequeDate = new Date();
            this.ChequeDate =  this._dataService.datechnge(this.ChequeDate)
            const jsonparam= {  CMPCODE:this._loginService.getLogin()[0].CMPCODE,
            CITYCODE:this._loginService.getLogin()[0].CITYCODE,
            CITYCODE1:this._loginService.getLogin()[0].CITYCODE1,
            PSTATUS:"BP" }

            this._dataService.getData("Accounts/ACC_CASHBOOK_BRBPCRCPCE_PAGELOAD",jsonparam)
            .subscribe((data: any) => {
            this.AccountNameList=data.Table;
            ///this.Departmentlist=data.Table1;
            this.OurBankList=data.Table2;
            this.Allitemlist=data.Table5;
            this.EntryTypeList=data.Table6;
            this.AllDepartmentlist=data.Table1;
            this.Departmentlist=data.Table1;
            let defCode=data.Table3[0].ACCTCODE
            this.OurBank=defCode;
            this.dfltourbank=data.Table3[0].ACCTCODE
            this.SuppliertdsList=data.Table7;
            this.gstratelist=data.Table8;
        });
        const jsonreset = { VGUID :this._loginService.getLogin()[0].GUID}
        this._dataService.getData("Accounts/ACC_BRBPCRCPCE_RESET", jsonreset)
        .subscribe((data: any) => {
            });

        if (this.EntryNo !=' ') {

            this.verifyPermission('6','Modify');
            this.Header='BANK PAYMENT - UPDATE ';
            this.editpopulate();
        }
        if (this.EntryNo ==' ' )  {

            this.verifyPermission('6','Add');
            this.Header= 'BANK PAYMENT  - ADD';

        }

    }
    verifyPermission(formId, userMode) {
        this.loaderService.display(true);
        this._loginService.verifyRights(formId, '')
            .subscribe((data: any) => {
               this._loginService.checkVerify(userMode, data);
               this.loaderService.display(false);

            });
    }
    EntryDateChanged(ev){
        this.EntryDate=ev.formatted
      }
    ChequeDateChanged(ev){
        this.ChequeDate=ev.formatted
      }
    GetActName(Acctcode){
        let codeacct
    // this.ACCTNAME=event.target.options[event.target.options.selectedIndex].text;
        this.codelistActt = this.AccountNameList.filter((code: any) => code.ACCTCODENAME === Acctcode);
        this.ACCTNAME=this.codelistActt[0].ACCTNAME;
        codeacct=this.codelistActt[0].ACCTCODENAME;
        this.ItemList = this.Allitemlist.filter((code: any) => code.ACCTCODE === Acctcode.split("|")[0]);
        let supptds
       supptds = this.SuppliertdsList.filter((code: any) => code.VALUEFIELD === this.AccountName.split("|")[0])[0].TEXTFIELD;
     // this.GetTDSType();
      this.EnableDisableDtn(supptds);
    }
    FillDepartment() {
        this.codelistDept=  this.AllDepartmentlist.filter((code: any) => code.CODE === (this.JobNo.substr(0, 2)  + this.JobNo.substr(2, 3)  + this.JobNo.substr(6, 1)) )
        this.Departmentlist= this.AllDepartmentlist.filter((code: any) => code.CODE === (this.JobNo.substr(0, 2)  + this.JobNo.substr(2, 3)  + this.JobNo.substr(6, 1)) )
        this.Department=this.codelistDept[0].VALUEFIELD;
        this.DepartmentName=this.codelistDept[0].TEXTFIELD;
    }
    GetBankName(){
    // this.ACCTNAME=event.target.options[event.target.options.selectedIndex].text;
       this.AllOurBankList = this.OurBankList.filter((code: any) => code.ACCTCODENAME === this.OurBank);
       this.OurBankName=this.AllOurBankList[0].ACCTNAME;
    }
    GetDepartmentName(event) {
     this.DepartmentName=event.target.options[event.target.options.selectedIndex].text;//.split("|")[1];
    }
    GetOurBankName(event) {
     this.OurBankName=event.target.options[event.target.options.selectedIndex].text;
    }
    Addchildrcrd() {
        if(this.AccountName=="" || this.AccountName==undefined) {
            this._toasterService.toast('warning', 'warning', 'Please select Account  !');
            return false;
         }
        if(this.ItemList.length>1){
            if(this.Item=="" || this.Item==undefined){
                this._toasterService.toast('warning', 'warning', 'Please select Item  !');
                return false;
            }
         }
         if (this.EntryType=="0" || this.EntryType==undefined || this.EntryType=="") {
            this._toasterService.toast('warning', 'warning', 'Please Select EntryType First !');
            return false;
            }

         if (this.EntryType == "AB" || this.EntryType == "AO" || this.EntryType == "PE")  {
                if(this.BillNo=="")  {
                    this._toasterService.toast('warning', 'warning', 'Please Enter BillNo. !');
                    return false;
                }
                if(this._loginService.getLogin()[0].CMPCODE=="20") {
                    if(this.BillNo.length != 10)  {
                    this._toasterService.toast('warning', 'warning', 'Invalid BillNo - Please Check !');
                    return false;
                    }
                }
                else {
                    if(this.BillNo.length < 15)  {
                    this._toasterService.toast('warning', 'warning', 'Invalid BillNo - Please Check !');
                    return false;
                    }
                }
            }
            if (this.EntryType == "AD" || this.EntryType == "JB")  {
                if(this.JobNo=="")  {
                    this._toasterService.toast('warning', 'warning', 'Please Enter Job No. !');
                    return false;
                }
            }


        if(this.JobNo.length > 0 && this.JobNo.length < 15) {
            this._toasterService.toast('warning', 'warning', 'Invalid JobNo - Please Check !');
            return false;
         }
         if(this.JobNo.length > 0 && this.JobNo.length == 15) {
            if (this.JobNo.substr(0, 2) != this._loginService.getLogin()[0].CMPCODE) {
            this._toasterService.toast("warning","warning",'You have entered Job No of different Company !');
             return false;
             }
        // if (this.JobNo.substr(2, 3) != this._loginService.getLogin()[0].CITYCODE1) {
        //     this._toasterService.toast("warning","warning",'You have entered Job No of different City !');
        //     return false;
        //     }
        }
        if(this.JobNo=="" && this.BillNo=="") {
            if(this.Department=="" || this.Department==undefined || this.Department=="0"){
                this._toasterService.toast('warning', 'warning', 'Please Select Department !');
                return false;
            }
        }
       
            if(this.JobNo.length != 15 && this.JobNo.length >0 )  {
                this._toasterService.toast('warning', 'warning', 'Invalid JobNo - Please Check !');
                return false;
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
                if(this.JobNo.length==0) {
                this._toasterService.toast('warning', 'warning', 'Please Enter JobNo !');
                return false;
                }
            }

            const jsonchild= {ID:this.ID,ENTRYNO:this.EntryNo,CLIENT:this.AccountName.split("|")[0],
            JOBNO:this.JobNo,BILLNO:this.BillNo,
            DEDUCTION:this.Deduction,AMOUNT:this.Amount,
            ENTRYTYPE:(this.EntryType==undefined)?"" :this.EntryType,
            EMP_CODE:"",USERNAME:this._loginService.getLogin()[0].CMP_USERNAME,
            CRPARENTENTRYNO:this.CRPARENTENTRYNO,
            NARRATION:this.ShortNarration,IS_NOT_EDIT_ABLE:this.ISNOTEDITABLE,
            ITEMCODE:(this.Item==undefined)?"" :this.Item.split("|")[0],DEPTID:this.Department,
            VGUID:this._loginService.getLogin()[0].GUID,
            ACCOUNT_NAME:this.ACCTNAME,
            ITEM: (this.Item==undefined || this.Item=="" )?"" :this.Item.split("|")[2],
            DEPARTMENT:(this.DepartmentName==undefined)?"" :this.DepartmentName,
            ACC_BANKDTLS_ID:this.ACC_BANKDTLS_ID,
            STATUS:this.STATUS,
            ISJOBREPORT:this.AccountName.split("|")[1],
            EMP_CODE_VALUE:"",EMP_CODE_TEXT:"",
            ITEM_DATAVALUE: (this.Item==undefined)?"" :this.Item,
            CMPCODE:this._loginService.getLogin()[0].CMPCODE,
            CITYCODE:this._loginService.getLogin()[0].CITYCODE,
            ISOLDENTRY:"0",
            CMPID:this._loginService.getLogin()[0].CMPID,
            IS_GST:(this.GSTApplicable=="")?"0":this.GSTApplicable,
            ISTDSCALC :(this.chkIsTDS == true) ? "0" : "0",
            IS_TDS:(this.TDSApplicable=="")?"N":this.TDSApplicable,
            GSTRATE:(this.gstrate=="")?"0":this.gstrate,
         }
         this.loaderService.display(true);
            this._dataService.Common("Accounts/ACC_BRBPCRCPCE_TMP_IU_NG", jsonchild)
            .subscribe((data: any) => {
              if (data.Table[0].STATUS == "100") {
                     this.Accountlist=data.Table;
                     this.TotalAmount=data.Table1[0].TOTAMOUNT;
                      this.TotalDeduction=data.Table1[0].TOTDEDUCTION;
                      this.NetTotal=data.Table1[0].NETTOTAL;
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
                      this.loaderService.display(false);
                 }
                else{   this._toasterService.toast("warning","warning" ,data.Table[0].STATUSTEXT);
                          this.loaderService.display(false);
                 }
              });

        }
    Resetchildrcrd(){
            this.ID ="0";
            //this.AccountName=undefined;
            this.JobNo="";
            this.Amount="";
            this.Deduction="";
            this.ShortNarration="";
            this.Item=undefined;
            ///this.Department="";
            //this.EntryType="";
            this.txtchild="Add";
            this.BillNo="";
            this.ACC_BANKDTLS_ID="0";
            this.disable_BillNo=false;
            this.disable_EntryType=false;
            this.disable_cmdadd=false;
            this.GSTApplicable="";
            this.TDSApplicable="";
            this.gstrate="0";
        }
    Editchildrecd(id) {
        if (this.CompChequeFlag!="1")
        {
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
                this.ID=filterData.ID;
                this.AccountName=filterData.CLIENT + '|' + filterData.ISJOBREPORT;
               // this.ItemList = this.Allitemlist.filter((code: any) => code.ACCTCODE === this.AccountName.split("|")[0]);
               this.GetActName(this.AccountName);
                this.Item=filterData.ITEM_DATAVALUE;
                this.Amount=filterData.AMOUNT;
                this.Deduction=(filterData.DEDUCTION== null) ?"":filterData.DEDUCTION;
                this.EntryType=filterData.ENTRYTYPE;
                this.BillNo=filterData.BILLNO;
                this.JobNo=filterData.JOBNO;
                this.ShortNarration=filterData.NARRATION;
                this.txtchild="Update";
                this.ACC_BANKDTLS_ID=filterData.ACC_BANKDTLS_ID;
                this.ACCTNAME=filterData.ACCOUNT_NAME;
                this.Departmentlist= this.AllDepartmentlist;
               // this.Departmentlist= this.AllDepartmentlist.filter((code: any) => code.CODE === (this.JobNo.substr(0, 2)  + this.JobNo.substr(2, 3)  + this.JobNo.substr(6, 1)) )
                this.DepartmentName=filterData.DEPARTMENT;
                this.Department=filterData.DEPTID;
                this.ISNOTEDITABLE=filterData.IS_NOT_EDIT_ABLE;
                this.TDSApplicable=filterData.IS_TDS;
                this.GSTApplicable=filterData.IS_GST;
                this.gstrate=filterData.GSTRATE;
              }
                if(id !="0" && this.EntryType=="AB1") {
                    this.disableEntryType=true;
                    }
            }
            else{
                this._toasterService.toast("warning","warning" ,"You can not Update this Bank Payment because this is generated through Computerisd Cheque Print !" );
                this.loaderService.display(false);
                return false;
            }
        }
    deletechildrecd(id,brdtlsid,clnt,edtflag){

            if (this.CompChequeFlag!="1"){
                if(edtflag=="1") {
                    this._toasterService.toast("warning","warning","You cannot delete this record!")
                }
                else{
                     if(confirm('Are you sure want to delete the record ?')) {
                        this.loaderService.display(true);
                        const jsondelete = { ID  : id,VGUID :this._loginService.getLogin()[0].GUID,ACC_BANKDTLS_ID:brdtlsid}
                        this._dataService.getData("Accounts/ACC_BRBPCRCPCE_TMP_DEL_NG", jsondelete)
                            .subscribe((data: any) => {
                                if(data.Table1!=undefined){
                                    if (data.Table1[0].STATUS.split("#")[0]== "100"){
                                        this._toasterService.toast('info', 'Complete', data.Table1[0].STATUSTEXT );
                                        this.Accountlist=data.Table;
                                        this.TotalAmount=data.Table1[0].TOTAMOUNT;
                                        this.TotalDeduction=data.Table1[0].TOTDEDUCTION;
                                        this.NetTotal=data.Table1[0].NETTOTAL;
                                        this.tdsledgercnt=data.Table2[0].TDSAPPLICABLE;
                                        this.loaderService.display(false);
                                    }
                                }
                                else {
                                    this._toasterService.toast("warning","warning" ,data.Table1[0].STATUSTEXT);
                                    this.loaderService.display(false);
                                }
                            });
                    }
                    else{return false;  this.loaderService.display(false);}
                }
            }
            else{
                this._toasterService.toast("warning","warning" ,"You can not Update this Bank Payment because this is generated through Computerisd Cheque Print !" );
                this.loaderService.display(false);
                return false;
            }
        }
    Add_Main(){

            // if (this.CompChequeFlag!="1"){
                 if(this.EntryDate==""){
                    this._toasterService.toast('warning', 'warning', 'Please Enter Entry Date !');
                    return false;
                    }
                if (this.ChqType=="" || this.ChqType==undefined) {
                    this._toasterService.toast('warning', 'warning', 'Please select NOT OVER / PAY ORDER / DD / NEFT / RTGS ! ');
                    return false;
                }
                if ((this.ChqType == 'NEFT') && (this.NetTotal >= "200000")) {
                    this._toasterService.toast('warning', 'warning', 'NEFT Amount can be only between Rs.1 lakh to  1,99,999.99 , \n For Printing online Cheque !');
                    return false;
                }
                /* commented on 21/09/2023 for not allowing update direct bank payment  */
                // if(this.ChqType!="" && this.EntryNo !=' '){
                //     var tot:number = parseFloat(this.TotalAmount);
                //     var ded:number = parseFloat(this.TotalDeduction);
                //     var newtot:number=(tot-ded);
                //     // this.NewnetAmt=(newtot).toString(2);
                //     if (newtot > (parseFloat(this.OldNetTotal)))   {
                //         this._toasterService.toast('warning','warning','Original Net Total =' + this.OldNetTotal + ' \nNew Net Total =' + this.NewnetAmt + ' \nBankPayment Net total should  be Less Than  or equal to Original BankPayment Net Total\n');
                //         return false;
                //     }
                // }
                // if (this.ChqType != "PO"  ) {
                //     if (this.ChequeNo == "") {
                //         var answer = window.confirm("ChequeNo is Blank - Please Check \n Click Yes to Accept and No To Retry");
                //         if (answer==false) {
                //             return false;
                //         }else {this.confirmsave="Y";}
                //     }
                // }
                if(this.ChqType =="Y") {
                    this.NOTOVERFLAG=this.ChqType;
                }
                else { this.NOTOVERFLAG="";  }
                if(this.OurBank=="" || this.OurBank==undefined){
                    this._toasterService.toast('warning', 'warning', 'Please select Our Bank !');
                    return false;
                }
                if(this.BankRefNo=="" || this.BankRefNo==undefined){
                    this._toasterService.toast('warning', 'warning', 'Please enter Bank Ref.No. !');
                    return false;
                }
                if (parseFloat(this.TotalAmount) < parseFloat(this.TotalDeduction)){
                    this._toasterService.toast('warning', 'warning', 'Total Deduction cannot be greater than Total Amount !');
                    return false;
                }
                if (parseFloat(this.TotalAmount) <= 0)  {
                    this._toasterService.toast('warning', 'warning', 'Please enter Account Details !');
                    return false;
                }
                if (this.ChqType != "PO"  ) {
                    if (this.ChequeNo == "") {
                        var answer = window.confirm("ChequeNo is Blank - Please Check \n Click Yes to Accept and No To Retry");
                        if (answer==false) {
                            return false;
                        }else {this.confirmsave="Y";}
                    }
                }
                if(this.EntryNo!=" ")
                { this.validateEdit(); }
                this.chequevalidate();
            //      }
            //  else{
            //      this._toasterService.toast("warning","warning" ,"You can not Update this Bank Payment because this is generated through Computerisd Cheque Print !" );
            //      this.loaderService.display(false);
            //      return false;
            //  }

        }
    SaveUpdate() {
        this.loaderService.display(true);
            const jsonmaster = {
            CMPID: this._loginService.getLogin()[0].CMPID,
            CMPCODE:this._loginService.getLogin()[0].CMPCODE,
            CITYCODE1:this._loginService.getLogin()[0].CITYCODE1,
            CITYCODE:this._loginService.getLogin()[0].CITYCODE,
            USERNAME:this._loginService.getLogin()[0].CMP_USERNAME,
            ENTRYNO:this.EntryNo,
            ENTRYDT:this.EntryDate ,
            STATUS:this.STATUS,
            OURBANK:this.OurBank,
            OURBANKNM:"",
            CHEQUETYPE:this.ChqType,
            CHEQUENO:this.ChequeNo,
            CHEQUEDT:this.ChequeDate.formatted,
            BANK:this.BankName,
            NARRATION:this.Narration,
            ACTUALAMOUNT:this.NetTotal,
            VGUID:this._loginService.getLogin()[0].GUID,
            MAKER_ID:this._loginService.getLogin()[0].CMPID,
            MAKER_IP:this._loginService.getLogin()[0].MAKERIP,
            NOTOVERFLAG:this.NOTOVERFLAG,
            ACTION:(this.EntryNo==" ")?"INSERT" :"UPDATE",
            PAYEENAME:this.PAYEENAME,
            BANKREFNO:this.BankRefNo
        }

        this._dataService.Common("Accounts/ACC_BRBPCRCPCE_IU_NG", jsonmaster)
        .subscribe((data: any) => {
            if (data.Table[0].STATUS == "100") {
                this._toasterService.toast('info', 'Complete', data.Table[0].STATUSTEXT );
                this.Print(data.Table1[0].ENTRYNO );
                this.loaderService.display(false);
                this.ResetMain();

            }
            else {
                this._toasterService.toast("warning","warning" ,data.Table[0].STATUSTEXT  );
                this.loaderService.display(false);
            }
        });
    }
    Print(entryno){
        let theTop = (screen.height / 2) - (483 / 2);
        let theLeft = (screen.width / 2) - (780 / 2);
        let toolbar = 'resizable=no,scrollbars=no,width=800,height=450,status=no,left=' + theLeft + ',top=' + theTop;
        window.open('./#/popup/Account-CashBook-BankReceipt-print/' + 'BP' + '/' + entryno + '/' , "CashBook BankPayment Print", toolbar);
    }
    ResetMain()   {
        this.Resetchildrcrd();
        this.EntryNo =" ";
        this.EntryDate ='';
        this.TotalAmount ='';
        this.TotalDeduction ='';
        this.NetTotal ='';
        this.text="Submit";
        this.Accountlist="";
        this.ChequeNo = '';
        this.ChequeDate = '';
        //this.OurBank = "";
        this.BankName = '';
        this.Narration='';
        this.BankRefNo='';
        this.TDSApplicable="";
        this.GSTApplicable="";
        this.chktdslbl="";
        this.chkIsTDS=false;
        this._router.navigate(["/accounts/Voucher/BankPaymnt/Add/ "]);

    }
    editpopulate() {
        const jsonview = { EntryNo  : this.EntryNo,
        CMPCODE:this._loginService.getLogin()[0].CMPCODE,
        CITYCODE:this._loginService.getLogin()[0].CITYCODE,
        VGUID:this._loginService.getLogin()[0].GUID,
        STATUS:this.STATUS,
        CMPID:this._loginService.getLogin()[0].CMPID,
        }
        this.loaderService.display(true);
        this._dataService.getData("Accounts/ACC_BRBPCRCPCE_View_NG", jsonview)
        .subscribe((data: any) => {
            this.EntryNo  = data.Table[0].ENTRYNO    ;
            this.EntryDate=(data.Table[0].ENTRYDT != "") ? (data.Table[0].ENTRYDT) : "";
            this.Narration=data.Table[0].NARRATION;
            this.ChqType=data.Table[0].CHEQUETYPE;
            this.ChequeNo=data.Table[0].CHEQUENO;
            this.ChequeDate=(data.Table[0].CHEQUEDT != "") ? (data.Table[0].CHEQUEDT) : "";
            this.OurBank=data.Table[0].OURBANK    ;
            this.OurBankName=""   ;
            this.BankName=data.Table[0].BANK    ;
            this.NOTOVERFLAG=data.Table[0].NOTOVERFLAG;
            this.CompChequeFlag=data.Table[0].COMPCHEQUE;
            this.Accountlist=data.Table1;
            this.TotalAmount=data.Table2[0].TOTAMOUNT;
            this.TotalDeduction=data.Table2[0].TOTDEDUCTION;
            this.NetTotal  =data.Table[0].ACTUALAMOUNT;
            this.OldNetTotal=data.Table[0].ACTUALAMOUNT;
            this.CompChequeFlag=data.Table[0].COMPCHEQUE;
            this.BankRefNo=data.Table[0].BANKREFNO;
            this.tdsledgercnt=data.Table3[0].TDSAPPLICABLE;
            if(this.tdsledgercnt >="1"){
                this.disableresetbtn=false;
               // this.disabletdsbtn=false;
               }
               else{
                 this.disableresetbtn=true;
                 this.disabletdsbtn=true;
               }
            if(this.CompChequeFlag=="1")  {
                this.ChequeNo=data.Table[0].CHEQUENO;
                if(this.ChqType=="Y") {  this.disable_chequetype=false;  }
                else { this.disable_chequetype=false;  }
                this.disable_chequeno=true;
                this._toasterService.toast("warning","warning" ,"You cant update this entry no.Because it is Computerised Cheque! !" );
                this.fnchequeType();
                this.loaderService.display(false);
            }
            else {  this.ChequeNo=data.Table[0].CHEQUENO;   }
            this.loaderService.display(false);

          if(this.CompChequeFlag=="1" && this.NOTOVERFLAG != "Y" )  {
                this._toasterService.toast("warning","warning" ,"You can not Update this Bank Payment because this is generated through Computerisd Cheque Print !" );
                  this.loaderService.display(false);
            }
            else if(this.CompChequeFlag=="1" && this.NOTOVERFLAG == "Y")  {
                this._toasterService.toast("warning","warning" ,"You can edit but net total should be less than or equal to BankPayment Amount=" + this.NetTotal );
                this.loaderService.display(false);
            }
        })


    }
    Reset()  {
        if(confirm('Are you sure you want to reset all data?')){
            this.Resetchildrcrd();
            this.EntryNo = " ";
            //this.EntryDate ='';
            this.Narration ='';
            this.ChequeNo='';
            this.ChequeDate='';
            this.BankName='';
            // this.OurBank='';
            this.TotalAmount ='';
            this.TotalDeduction ='';
            this.NetTotal ='';
            this.text="Submit";
            this.ChqType="CHQ";
            this.BankRefNo='';
            this.Accountlist=[];
            this.Department='0';
            this.AccountName=undefined;
            this.EntryType='0';
            const jsonreset = { VGUID :this._loginService.getLogin()[0].GUID}
             this._dataService.getData("Accounts/ACC_BRBPCRCPCE_RESET_NG", jsonreset)
             .subscribe((data: any) => {
                 this._toasterService.toast('info', 'success', "Clear all data");
                 this.loaderService.display(false);
                this._router.navigate(['/accounts/Voucher/BankPaymnt/Add/ ']);
                this.OurBank=this.dfltourbank;
             });
        }
        else{
            return false;
            this.loaderService.display(false);
        }
    }
    ValidateJobNo(jbno)  {
        if (this.JobNo.length > 0 ) {
            if(this._loginService.getLogin()[0].CMPCODE=="20"){
                if(this.JobNo.length > 0 && this.JobNo.length != 10)   {
                    this._toasterService.toast('warning', 'warning', 'Invalid JobNo - Please Check !');
                    return false;
                }
            }
            else{
                if(this.JobNo.length > 0 && this.JobNo.length < 15) {
                    this._toasterService.toast('warning', 'warning', 'Invalid JobNo - Please Check !');
                    return false;
                }
                if(this.JobNo.length > 0 && this.JobNo.length == 15) {
                    if (this.JobNo.substr(0, 2) != this._loginService.getLogin()[0].CMPCODE) {
                        this._toasterService.toast("warning","warning",'You have entered Job No of different Company !');
                        return false;
                    }
                    if (this.JobNo.substr(2, 3) != this._loginService.getLogin()[0].CITYCODE1) {
                    this._toasterService.toast("warning","warning",'You have entered Job No of different City !');
                    return false;
                    }
                }

            }
        }
    }
    fnChqValidate()  {
        if (this.ChequeNo.length < 6) {
            alert("Enter Valid Cheque No. ");
            return false;
        }
        else if (this.OurBank == "0" || this.OurBank == "") {
            alert("Please Select Ourbank. ");
            return false;
        }
        else  {
            this.showModal_ChqList = true
            this.loaderService.display(true)
            this.GetBankName();
            const jsonchqdtl= {
                CMPCODE: this._loginService.getLogin()[0].CMPCODE,
                CITYCODE: this._loginService.getLogin()[0].CITYCODE,
                CHQNO:this.ChequeNo,
                STATUS:this.STATUS,
                OURBANK:this.OurBank,
                ENTRYNO:this.EntryNo

            };
            this._dataService.getData("Accounts/ACC_CASHBOOK_VALIDATECHQ", jsonchqdtl)
            .subscribe((data: any) => {
                    this.ListChq = data.Table
                    this.loaderService.display(false)
            });
        }
    }
    chequevalidate()  {
        this.Msg= "";
            const jsonchqdtl1= {
                CMPCODE: this._loginService.getLogin()[0].CMPCODE,
                CITYCODE: this._loginService.getLogin()[0].CITYCODE,
                CHQNO:this.ChequeNo,
                STATUS:this.STATUS,
                OURBANK:this.OurBank,
                ENTRYNO:this.EntryNo
            }
            this._dataService.getData("Accounts/ACC_CASHBOOK_VALIDATECHQ", jsonchqdtl1)
            .subscribe((data: any) => {
                if(data.Table1[0].ALLENTRY=="")  {
                var answer1 = window.confirm("Click  Ok to enter with Cheque No." + this.ChequeNo );
            }
            else {
                var answer1 = window.confirm("Cheque No." + this.ChequeNo + " Already Entered For Entry No." +  data.Table1[0].ALLENTRY + "Are you sure, Want to add same Cheque No.");
            }
            if (answer1==false) {
                this.Conf="N" ; }

            else {
            this.Conf="Y" ;
            this.SaveUpdate();
            }
        });
    }
                //     if (confirm("Cheque No." + this.ChequeNo + " Already Entered For Entry No." +  data.Table1[0].ALLENTRY + "Are you sure, Want to add same Cheque No."))
                //     {
                //     this.Conf="Y" ;
                //     return false;
                //    }
                //    else
                //    {
                //       this.Conf="N" ;
                //       return false;
                //       }



                //this.Msg= "Cheque No." + this.ChequeNo + " Already Entered For Entry No." + this.strmsg  + "Are you sure, Want to add same Cheque No."



                //  for (var i = 0, len = data.Table.length; i < len; i++) {
                //      this.strmsg +=  data.Table[i].entryno + "," ;
                //  }

                //  this.Msg= "Cheque No." + this.ChequeNo + " Already Entered For Entry No." + this.strmsg  + "Are you sure, Want to add same Cheque No."
                //   if (confirm(this.Msg))
                //   {
                //     this.Conf="Y" ;
                //     return false;
                //  }
                //  else
                //  {
                //      this.Conf="N" ;
                //      return false;
                //  }

    close() {
        this.showModal_ChqList = false;
    }
    closeBill(){
        this.showModal_ListBill = false;
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
                this.disable_EntryType=true;
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
                this.disable_cmdadd=false;
                return false;
            }
            else if(data.Table[0].STATUS.split("#")[0]=="100") {
                if(this.EntryType=="PE") {
                this.Amount=data.Table[0].STATUS.split("#")[2];
                this.Deduction=data.Table[0].STATUS.split("#")[3];
                this.disable_BillNo=true;
                this.disable_EntryType=true;
                this.disable_cmdadd=false;
                return false;
                }
            }
        });

    }
    fnchequeType()
    {
        if(this.ChqType=="CHQ"){  this.chequelabel="Normal cheque print"; }
        if(this.ChqType=="Y")
            {  this.chequelabel="Cheque will print but amt is Not Over !"; }
        if(this.ChqType=="PO")
            {  this.chequelabel="Cheque print with Payee Name : Yourself - PO - PayeeName!";  }
        if(this.ChqType=="DD")
            {  this.chequelabel="Cheque print with Payee Name : Yourself - DD - PayeeName!";}
        if(this.ChqType=="NEFT")
            {   this.chequelabel="Cheque Print Only when amt in between 1 Lakh and 1,99,999.99!"; }
        if(this.ChqType=="RTGS")
            {   this.chequelabel="Cheque Print Only when amt is Greater or Equal to 2 Lakh !";  }
    }
    validateEdit()
    {
        if(this.CompChequeFlag != '1' && this.NOTOVERFLAG != "Y" && this.ChqType=="PO" && this.EntryNo != " ")
            {
            alert("You can not Update this Bank Payment because this is Pay Order. !!");
            return false;
        }
        else if(this.CompChequeFlag == '1' && this.NOTOVERFLAG != "Y" && this.ChqType=="PO")   {
            alert("You can not Update this Bank Payment \n Because this is computerised Pay Order. !!");
            return false;
        }
        else if(this.CompChequeFlag == '1' && this.NOTOVERFLAG != "Y" && this.ChqType!="PO")   {
            alert("You can not Update this Bank Payment \n Because this is generated through Computerised Cheque Print !!");
            return false;
        }
        else if(this.CompChequeFlag == '1' && this.NOTOVERFLAG == "Y" && this.ChqType!="PO")        {
        return true;
        }
    }
    EntryTypeChg(entrytypeval) {
        if (entrytypeval == "AD")   {
            this.Deduction="";
            this.disable_deduction=true;
        }
            else   {
            this.disable_deduction=false;  }
        if (entrytypeval == "PE")   {
            this.BillNo="";
            this.Amount="";
        }
        if (entrytypeval == "AB")  {
            this.BillNo="";
        }
    }
    listbillpopup(entrytypeval) {
        if (entrytypeval == "AD")  {
            this.Deduction="";
            this.disable_deduction=true;
        }
         else{
           this.disable_deduction=false;
         }
        if (entrytypeval == "PE") {
            this.BillNo="";
            this.Amount="";
        }
        if (entrytypeval == "AB")   {
            this.BillNo="";
        }
        if(this.EntryType=="AB1") {
            if(this.AccountName=="" || this.AccountName==undefined) {
                this._toasterService.toast("warning", "warning", "Select Account Name first")
                this.EntryType="0";
                return false;
            }
            else {
                this.showModal_ListBill = true
                this.loaderService.display(true)
                const jsoninvdtl= {
                    SUPPLIER: this.AccountName.split("|")[0],
                    FINSTARTDATE:this._loginService.getLogin()[0].FINANCIAL_YEAR.STARTDATE,
                    FINENDDATE:this._loginService.getLogin()[0].FINANCIAL_YEAR.ENDDATE,
                    CMPCODE: this._loginService.getLogin()[0].CMPCODE,
                    CITYCODE: this._loginService.getLogin()[0].CITYCODE
                };
                this._dataService.getData("Accounts/ACC_PAYMENT_POPULATE_SUPPLIERBILL", jsoninvdtl)
                .subscribe((data: any) => {
                    if (data.Table.length >"0")  {
                        this.ListBill = data.Table
                        console.log(this.ListBill);
                        this.client=data.Table1[0].SUPPLIER
                        this.loaderService.display(false)
                    }
                    else{
                        this._toasterService.toast("warning", "warning", "No record found")
                        this.client=data.Table1[0].SUPPLIER
                        this.loaderService.display(false)
                    }
                })
            }
            this.loaderService.display(false)
        }
    }
    getCheckboxValues(event, invno, jobno, amt,acctname) {
        for (let i = 0; i < this.ListBill.length; i++) {
            if (this.ListBill[i].INV_NO === invno && this.ListBill[i].INV_JOBNO === jobno) {
                if(event==false)
                {this.ListBill[i]["NARRATION"] = "";}
                this.ListBill[i]["Disabled"] = false;
            }
        }
        this.sel_jobno=jobno;
        this.sel_inv_no=invno;
        var index = this.newArray.findIndex(x => x.BILLNO == invno);
        if (event) {
                let  obj = {
                BILLNO: invno,
                    JOBNO: jobno,
                    AMOUNT:amt,
                    ///ENTRYTYPE:"AB1",
                    ACCOUNT_NAME:acctname,
                    ISJOBREPORT:this.AccountName.split("|")[1]
            }
            //this.STRTXT=this.STRTXT + invno +  "|" + jobno +  "|" +  amt +  "|" + ded +  "|" + narration  +  "|" + acctname + "|" + this.AccountName.split("|")[1] +";"
            this.newArray.push(obj);
        }
        else {
            var index = this.newArray.findIndex(x => x.BILLNO == this.sel_inv_no);
                this.newArray.splice(index, 1);
            }

    }
    popup_listbill() {
        if (this.newArray == "") {
            this._toasterService.toast('warning', 'warning', 'Please Select Bill!');
            return false;
        }
        var str = '';
        for (var i = 0, len = this.newArray.length; i < len; i++) {
            str += this.newArray[i].BILLNO + ' |' + this.newArray[i].JOBNO + '|' + this.newArray[i].AMOUNT + '|'+ this.newArray[i].ACCOUNT_NAME + '|' + this.newArray[i].ISJOBREPORT + ";" ;
        }

        this.showModal_ListBill = false
        const jsonbilldtl={
                CLIENT:this.AccountName.split("|")[0],
                ITEMCODE:(this.Item==undefined)?"" :this.Item.split("|")[0],
                STATUS:this.STATUS,
                CMPCODE:this._loginService.getLogin()[0].CMPCODE,
                CITYCODE: this._loginService.getLogin()[0].CITYCODE,
                VGUID:this._loginService.getLogin()[0].GUID,
                USERNAME:this._loginService.getLogin()[0].CMP_USERNAME,
                STRINGTEXT:str
                }
                this._dataService.Common("Accounts/ACC_BR_BLHELP_TMP_IU", jsonbilldtl)
                .subscribe((data: any) => {
                    this.Accountlist=data.Table;
                        this.TotalAmount=data.Table1[0].TOTAMOUNT;
                        this.TotalDeduction=data.Table1[0].TOTDEDUCTION;
                        this.NetTotal=data.Table1[0].NETTOTAL
                        this.loaderService.display(false);
                    });
        this.newArray = []
        this.close();
}
TextareaValueChange(ev) {
    this.Narration = ev.target.value;
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
            STATUS:"BP"
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
  EnableDisableDtn(tds){
    if(tds=="1" && this.EntryNo == ' '){
      this.chktdslbl="TDS Applicable";
      this.chkIsTDS=true;
    //   this.disableresetbtn=false;
    //   this.disabletdsbtn=false;
     // this.disablechktds=true;
    }
    else  if(tds=="1" && this.EntryNo != ' '){
      this.chktdslbl="TDS Applicable";
      this.chkIsTDS=true;
    //   this.disableresetbtn=false;
    //   this.disabletdsbtn=true;
     // this.disablechktds=true;
    }
     if(tds=="0"){
       this.chktdslbl="Is Tds Applicable";
       this.disabletdsbtn=true;
       this.chkIsTDS=false;
       this.disableresetbtn=true;
    }

  }
}