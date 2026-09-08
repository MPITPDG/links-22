import { Component, OnInit } from '@angular/core';
import { IMyDpOptions } from 'mydatepicker';
import{DataService} from '../../../shared/service/dataService';
import { LoginService } from '../../../shared/service/loginService';
import { ToastCommonService } from '../../../shared/service/toastService';
import { LoaderService } from '../../../shared/service/loader.service'; 
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Configuration } from '../../../app.constants';
@Component({
    templateUrl: 'bankreceipt-IUOld.component.html'
})
export class BankReceiptOEComponent implements OnInit {
    EntryNo: string="";
    EntryDate: any="";
    Narration: string="";
    client:string="";
    AccountName: string;
    Allitemlist:any=[];
    OriginalAccountlist:any=[];
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
    EntryType:string;
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
    Header: string="BANK RECEIPT - UPDATE OLD ENTRY";
    text: string="Submit";txtchild : string ="Add";txtadd:string ="Add";
    Accountlist:any=[];
    Accountwiselist:any=[];
    ACCTNAME:string="";
    STATUS:string="BR";
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
    public showModal_ListBill: boolean = false; 
    public toggledebit: boolean = false;
    ListBill: any=[]; 
    newArray: any = [];
    chequelabel:string="Normal cheque print";
    confirmsave: string="";
    BankRefNo:string="";
    chkrules:string="N";
    public chkoriginactdtl:boolean=false;
    public chkactwisedtl:boolean=false;
    IsOldEntry:string="1";
    lblNetSummary="2. Net Amount will be same.";
    public showhidebtn:boolean=false;
    public disableentryno:boolean=false;
    public togglededuction: boolean = false;
    public disableEntryType: boolean=false;
    sel_inv_no : string;
    sel_jobno : string;
    OLD_NETAMOUNT:any;
    OLD_DEDUCTION:any;
    NEW_NETAMOUNT:any;
    NEW_DEDUCTION:any;
    OLDNETTOTAMT:any;
    NEWNETTOTAMT:any;
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
             
            this.EntryDate = new Date();
            this.EntryDate =  this._dataService.datechnge(this.EntryDate) 
            this.ChequeDate = new Date();
            this.ChequeDate =  this._dataService.datechnge(this.ChequeDate) 
        const jsonparam= {  CMPCODE:this._loginService.getLogin()[0].CMPCODE,
            CITYCODE:this._loginService.getLogin()[0].CITYCODE,
            CITYCODE1:this._loginService.getLogin()[0].CITYCODE1,
            PSTATUS:"BR" }
    
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
        });
        const jsonreset = { VGUID :this._loginService.getLogin()[0].GUID}
        this._dataService.getData("Accounts/ACC_BRBPCRCPCE_RESET", jsonreset)
        .subscribe((data: any) => {
            });
    }
    ShowoldData()
    {
        if (this.Validate_BRBPCRCPCE_OldEntryNo() == false) {
            return false;
        }
        else
        {
        const jsonview = { 
            CMPCODE:this._loginService.getLogin()[0].CMPCODE,
            CITYCODE:this._loginService.getLogin()[0].CITYCODE,
            ENTRYNO  : this.EntryNo,
            VGUID:this._loginService.getLogin()[0].GUID,
            STATUS:this.STATUS
            }
            this._dataService.getData("Accounts/ACC_BRBPCRCPCE_View_OLD", jsonview)
            .subscribe((data: any) => { 
                this.EntryNo  = data.Table2[0].ENTRYNO    ;
                this.EntryDate=(data.Table2[0].ENTRYDT != "") ? (data.Table2[0].ENTRYDT) : "";
                this.Narration=data.Table2[0].NARRATION;
                this.ChqType=data.Table2[0].CHEQUETYPE;
                this.ChequeNo=data.Table2[0].CHEQUENO;
                this.ChequeDate=(data.Table2[0].CHEQUEDT != "") ? (data.Table2[0].CHEQUEDT) : "";
                this.OurBank=data.Table2[0].OURBANK    ;
                this.OurBankName=""   ;
                this.BankName=data.Table2[0].BANK    ;
                this.NOTOVERFLAG=data.Table2[0].NOTOVERFLAG;
                this.CompChequeFlag=data.Table2[0].COMPCHEQUE;
                this.Accountlist=data.Table;
                this.OriginalAccountlist=data.Table;
                this.Accountwiselist=data.Table1;
                this.TotalAmount=data.Table3[0].TOTAMOUNT;
                this.TotalDeduction=data.Table3[0].TOTDEDUCTION;
                this.NetTotal  =data.Table3[0].NETTOTAL;
                this.OldNetTotal=data.Table[0].ACTUALAMOUNT;
                this.BankRefNo=data.Table2[0].BANKREFNO;
                this.lblNetSummary=data.Table3[0].MSG_LINE2;
                this.chkrules='Y'
                this.showhidebtn=true;
                this.disableentryno=true;
                this.OLD_NETAMOUNT=data.Table3[0].TOTAMOUNT;
                this.OLD_DEDUCTION=data.Table3[0].TOTDEDUCTION;
                this.OLDNETTOTAMT=data.Table3[0].NETTOTAL;

            })  
        }
    } 
    GetActName(Acctcode)  {   
        let codeacct
    // this.ACCTNAME=event.target.options[event.target.options.selectedIndex].text;
        this.codelistActt = this.AccountNameList.filter((code: any) => code.ACCTCODENAME === Acctcode);
        this.ACCTNAME=this.codelistActt[0].ACCTNAME;
        codeacct=this.codelistActt[0].ACCTCODENAME;
        this.ItemList = this.Allitemlist.filter((code: any) => code.ACCTCODE === Acctcode.split("|")[0]);
    }
      GetDepartmentName(event)  {
        this.DepartmentName=event.target.options[event.target.options.selectedIndex].text//.split("|")[1];
      }
      GetOurBankName(event) {
        this.OurBankName=event.target.options[event.target.options.selectedIndex].text;
      }
    Addchildrcrd(){
        if(this.AccountName=="" || this.AccountName==undefined){
            this._toasterService.toast('warning', 'warning', 'Please select Account  !');
            return false;
        }
        if(this.ItemList.length>1)  {
            if(this.Item=="" || this.Item==undefined)  {
                this._toasterService.toast('warning', 'warning', 'Please select Item  !');
                return false;
                }
            } 
        if (this.EntryType=="" || this.EntryType==undefined)  {
             this._toasterService.toast('warning', 'warning', 'Please Select EntryType First !');
             return false;
           }
        if (this.EntryType == "AB" || this.EntryType == "AO" || this.EntryType == "PE")  {
            if(this.BillNo=="") {
                this._toasterService.toast('warning', 'warning', 'Please Enter BillNo. !');
                return false;
        }
        if(this._loginService.getLogin()[0].CMPCODE=="20"){
                if(this.BillNo.length != 10)   {
                this._toasterService.toast('warning', 'warning', 'Invalid BillNo - Please Check !');
                return false;
                }   
        }
            else {
                if(this.BillNo.length < 15)    {
                this._toasterService.toast('warning', 'warning', 'Invalid BillNo - Please Check !');
                return false;
                }    
            }  
        }     
        if (this.EntryType == "AD" || this.EntryType == "JB")  {
            if(this.JobNo=="")   {      
                this._toasterService.toast('warning', 'warning', 'Please Enter Job No. !');
                return false;
            }
        }  
        if(this.JobNo.length > 0 && this.JobNo.length < 15) {
            this._toasterService.toast('warning', 'warning', 'Invalid JobNo - Please Check !');
            return false;
         }
        if(this.JobNo.length > 0 && this.JobNo.length == 15)  {
            if (this.JobNo.substr(0, 2) != this._loginService.getLogin()[0].CMPCODE)  {
                this._toasterService.toast("warning","warning",'You have entered Job No of different Company !');
                return false;
             }
            if (this.JobNo.substr(2, 3) != this._loginService.getLogin()[0].CITYCODE1)   {
                this._toasterService.toast("warning","warning",'You have entered Job No of different City !');
                return false;
                }
        }
        if(this.JobNo=="" && this.BillNo=="")  {
            if(this.Department=="" || this.Department==undefined) {
                this._toasterService.toast('warning', 'warning', 'Please Select Department !');
                return false;
            }
        }
        if(this._loginService.getLogin()[0].CMPCODE=="20")   {
            if(this.JobNo.length > 0 && this.JobNo.length != 10) {
                this._toasterService.toast('warning', 'warning', 'Invalid JobNo - Please Check !');
                return false;
          } 
         }
         if((this.Amount=="" || this.Amount=="0") && (this.Deduction=="" || this.Deduction=="0") )   {
            this._toasterService.toast('warning', 'warning', 'Both Deduction & Amount cannot be Left Blank !');
            return false;   
        } 
         if(parseFloat(this.Amount) > 0 && parseFloat(this.Deduction) > 0)  {
            this._toasterService.toast('warning', 'warning', 'Either Deduction or Amount can be Entered !');
            return false;   
        }
        if(this.Deduction.length>0)     {
        let tmpdeduction =this.Deduction;
            if(isNaN((Math.round(parseFloat(tmpdeduction) * 100) / 100))) {
                    this._toasterService.toast('warning', 'warning', 'Deduction Entered not Valid !');
                    return false; 
            } 
            if(parseFloat(tmpdeduction) <=0)    {
                this._toasterService.toast('warning', 'warning', 'Deduction Entered not Valid !');
                    return false; 
            } 
        }    
        if(this.Amount.length>0)  {
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
        if(clientcodeval=='Y')  {
            if(this.JobNo.length==0)
            {
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
         ISOLDENTRY:this.IsOldEntry
         }
     
        this._dataService.Common("Accounts/ACC_BRBPCRCPCE_TMP_IU", jsonchild)
        .subscribe((data: any) => {
            if (data.Table1[0].STATUS.split("#")[0]== "100") {
                    this.Accountlist=data.Table;
                    this.TotalAmount=data.Table1[0].TOTAMOUNT;
                    this.TotalDeduction=data.Table1[0].TOTDEDUCTION;
                    this.NetTotal=data.Table1[0].NETTOTAL;
                    this.Resetchildrcrd();
                    this.loaderService.display(false);                
                }
            else{   this._toasterService.toast("warning","warning" ,data.Table1[0].STATUS.split("#")[1]);
                        this.loaderService.display(false);
                }
            });
     
    } 
    Resetchild(){
        this.AccountName=undefined;
        this.JobNo="";
        this.Amount="";
        this.Deduction="";
        this.ShortNarration="";
        this.Item=undefined;
        this.Department="";
        this.EntryType="";
        this.txtchild="Add";
        this.BillNo="";
        this.disable_BillNo=false;
        this.disable_EntryType=false;
        this.disable_cmdadd=false;
     } 
    Editchildrecd(id) {
        let filterData = this.Accountlist.filter((filter) => filter.ID == id)[0];
            this.ID=filterData.ID;
            this.AccountName=filterData.CLIENT + '|' + filterData.ISJOBREPORT;
            this.ItemList = this.Allitemlist.filter((code: any) => code.ACCTCODE === this.AccountName.split("|")[0]);
            this.Item=filterData.ITEM_DATAVALUE;
            this.Amount=filterData.AMOUNT;
            this.Deduction=filterData.DEDUCTION;
            this.EntryType=filterData.ENTRYTYPE;
            this.BillNo=filterData.BILLNO;
            this.JobNo=filterData.JOBNO;
            this.ShortNarration=filterData.NARRATION;
            this.txtchild="Update";
            this.ACC_BANKDTLS_ID=filterData.ACC_BANKDTLS_ID;
            this.ACCTNAME=filterData.ACCOUNT_NAME;
            this.DepartmentName=filterData.DEPARTMENT;
            this.Department=filterData.DEPTID;
            this.ISNOTEDITABLE=filterData.IS_NOT_EDIT_ABLE;
            if(id !="0"&& this.EntryType=="AB1") {
                this.disableEntryType=true;
                }
        }
        deletechildrecd(id,brdtlsid){
            if(this.ISNOTEDITABLE=="1")  {
                this._toasterService.toast("warning","warning","You cannot delete this reocrd!")
            } 
            else {  
                if(confirm('Are you sure want to delete the record ?')) { 
                    this.loaderService.display(true);      
                    const jsondelete = { ID  : id,VGUID :this._loginService.getLogin()[0].GUID,ACC_BANKDTLS_ID:brdtlsid}
                    this._dataService.getData("Accounts/ACC_BRBPCRCPCE_TMP_DEL", jsondelete)
                        .subscribe((data: any) => {              
                        if (data.Table1[0].STATUS.split("#")[0]== "100") {
                            this._toasterService.toast('info', 'Complete', data.Table1[0].STATUSTEXT );
                            this.Accountlist=data.Table;
                            this.TotalAmount=data.Table1[0].TOTAMOUNT;
                            this.TotalDeduction=data.Table1[0].TOTDEDUCTION;
                            this.NetTotal=data.Table1[0].NETTOTAL;
                            this.loaderService.display(false);
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
        Validate_OLD_NEW_NETAMT_IU() {   
            this.NEW_NETAMOUNT=this.TotalAmount
            this.NEW_DEDUCTION=this.TotalDeduction
            this.NEWNETTOTAMT=this.NEW_NETAMOUNT-this.NEW_DEDUCTION;
            this.OLDNETTOTAMT=parseFloat(this.OLDNETTOTAMT).toFixed(2);
            if ((this.NEWNETTOTAMT) != (this.OLDNETTOTAMT)) {
             alert('Failed to Submit!\n\nOriginal Net Total [' + this.OLDNETTOTAMT + '] (i.e., Total Amount [' + this.OLD_NETAMOUNT + '] less Total Deduction [' + this.OLD_DEDUCTION + ']) is not equal to Current Net Total [' + this.NEWNETTOTAMT + '] (i.e., Total Amount [' + this.NEW_NETAMOUNT + '] less total Deduction [' + this.NEW_DEDUCTION + '])\n');
                   return false;
          }
            }   
    Add_Main()
    {   
        if(this.IsOldEntry=="1")   {
            if (this.Validate_OLD_NEW_NETAMT_IU() == false) {
              return false;
          }
        }
        if(this.EntryDate=="") {
            this._toasterService.toast('warning', 'warning', 'Please Enter Entry Date !');
            return false;
            }                   
            if(this.OurBank=="" || this.OurBank==undefined){
                this._toasterService.toast('warning', 'warning', 'Please select Our Bank !');
                return false;
            }  
            if(this.BankRefNo=="" || this.BankRefNo==undefined){
                this._toasterService.toast('warning', 'warning', 'Please Enter Bank Ref. No. !');
                return false;
            }  
            if (parseFloat(this.TotalAmount) < parseFloat(this.TotalDeduction))  {
                this._toasterService.toast('warning', 'warning', 'Total Deduction cannot be greater than Total Amount !');
                return false;
            }
            if (parseFloat(this.TotalAmount) <= 0) {
                this._toasterService.toast('warning', 'warning', 'Please enter Account Details !');
                return false;            
            }   
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
            CHEQUETYPE:"",
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
        
        this._dataService.Common("Accounts/ACC_BRBPCRCPCE_IU", jsonmaster)
        .subscribe((data: any) => {            
                if (data.Table[0].STATUS == "100") {
                    this._toasterService.toast('info', 'Complete', data.Table[0].STATUSTEXT);
                    this.Print(data.Table1[0].ENTRYNO );
                    this.loaderService.display(false);
                    this.ResetMain();
                    this.showhidebtn=false;
                    this.EntryType="";
                    this.Department="";
                    this.AccountName=undefined;
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
            window.open('./#/popup/Account-CashBook-BankReceipt-print/' + 'BR' + '/' + entryno + '/' , "CashBook BankPayment Print", toolbar);
        }   
        ResetMain()  {
            this.Resetchildrcrd();
            this.EntryNo =" ";
            this.disableentryno=false;
            this.EntryDate ='';
            this.TotalAmount ='';
            this.TotalDeduction ='';
            this.NetTotal ='';
            this.text="Submit";
            this.Accountlist="";
            this.ChequeNo = '';
            this.ChequeDate = '';
            this.OurBank = "";
            this.BankName = '';
            this.Narration='';
            this.BankRefNo='';
            this.lblNetSummary='2. Net Amount will be same.';
            this.OriginalAccountlist=[];
            this.Accountwiselist=[];
            this._router.navigate(['/accounts/OldEntry/OEBankReceipt/Add/ ']); 
        }       
    Validate_BRBPCRCPCE_OldEntryNo()
    {
        if (this.EntryNo.substring(11, 12) != '1') {
            alert("You have entered Entryno. is not Bank Receipt No. !!");
            return false;
        }
        if (this.EntryNo.substring(2, 5) != this._loginService.getLogin()[0].CITYCODE1) {
            alert("You have entered Entryno. is not for current city !!");
            return false;
        }
    }   
    Reset()  {
        if(confirm('Are you sure you want to reset all data?')){
            this.Resetchildrcrd();
            this.EntryNo = " ";
            this.disableentryno=false;
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
            this.Accountlist=[];
            this.showhidebtn=false;
            this.lblNetSummary='2. Net Amount will be same.';
            this.BankRefNo='';
            this.OriginalAccountlist=[];
            this.Accountwiselist=[];
            this.EntryType="";
            this.AccountName=undefined;
            this.Department="";
            const jsonreset = { VGUID :this._loginService.getLogin()[0].GUID}
            // this._dataService.getData("Accounts/ACC_BRBPCRCPCE_RESET", jsonreset)
            // .subscribe((data: any) => {                         
            //     this._toasterService.toast('info', 'success', "Clear all data");
            //     this.loaderService.display(false);
                this._router.navigate(['/accounts/OldEntry/OEBankReceipt/Add/ ']);
                this.OurBank=this.dfltourbank;
           //  });                    
        }  
        else{   
            return false;
            this.loaderService.display(false);
        }                  
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
    }
    EntryTypeChg(entrytypeval)  {        
        if (entrytypeval == "AD")   {
            this.Deduction="";
            this.disable_deduction=true;
        }
         else   {
           this.disable_deduction=false;
         }
        if (entrytypeval == "PE") {
            this.BillNo="";
            this.Amount="";
        }
        if (entrytypeval == "AB") {
            this.BillNo="";
        }
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
listbillpopup(entrytypeval) {
    if (entrytypeval == "AD")  {
        this.Deduction="";
        this.togglededuction=true;
    }
     else{
       this.togglededuction=false;
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
                CLIENT: this.AccountName.split("|")[0],
                FINSTARTDATE:this._loginService.getLogin()[0].FINANCIAL_YEAR.STARTDATE,
                FINENDDATE:this._loginService.getLogin()[0].FINANCIAL_YEAR.ENDDATE,
                CMPCODE: this._loginService.getLogin()[0].CMPCODE,
                CITYCODE: this._loginService.getLogin()[0].CITYCODE
            };
            this._dataService.getData("Accounts/ACC_RECEIPT_POPULATE_CLIENTBILL", jsoninvdtl)
            .subscribe((data: any) => {
                if (data.Table.length >"0")  {
                    this.ListBill = data.Table
                    console.log(this.ListBill);
                    this.client=data.Table1[0].CLIENT
                    this.loaderService.display(false)
                }
                else{
                    this._toasterService.toast("warning", "warning", "No record found")
                    this.client=data.Table1[0].CLIENT
                    this.loaderService.display(false)
                }
            })        
        }

    }
}
popup_listbill() {
    if (this.newArray == "") {
        this._toasterService.toast('warning', 'warning', 'Please Select Bill!');
        return false;
    }
    var str = '';
    for (var i = 0, len = this.newArray.length; i < len; i++) {
        str += this.newArray[i].BILLNO + ' |' + this.newArray[i].JOBNO + '|' + this.newArray[i].AMOUNT + '|' + this.newArray[i].DEDUCTION + '|' + this.newArray[i].NARRATION + '|' + this.newArray[i].ACCOUNT_NAME + '|' + this.newArray[i].ISJOBREPORT + ";" ;
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
close() {
    this.showModal_ListBill = false
}
getCheckboxValues(event, invno, jobno, amt,ded,narration,acctname) {  
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
                DEDUCTION:ded,
                NARRATION:narration,
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
ValidateJobNo(jbno) {
    if (this.JobNo.length > 0 ){  
        if(this._loginService.getLogin()[0].CMPCODE=="20")  {
            if(this.JobNo.length > 0 && this.JobNo.length != 10) {
                this._toasterService.toast('warning', 'warning', 'Invalid JobNo - Please Check !');
                return false;
            }                    
        }
        else {
            if(this.JobNo.length > 0 && this.JobNo.length < 15)  {
                this._toasterService.toast('warning', 'warning', 'Invalid JobNo - Please Check !');
                return false;
            }
            if(this.JobNo.length > 0 && this.JobNo.length == 15)   {
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
}