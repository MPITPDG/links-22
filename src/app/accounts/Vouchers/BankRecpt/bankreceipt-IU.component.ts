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
import { getDate } from 'ngx-bootstrap/chronos/utils/date-getters';
import { isNull } from '@angular/compiler/src/output/output_ast';

@Component({
    templateUrl: 'bankreceipt-IU.component.html'
})
export class BankReceiptComponent implements OnInit {
    EntryNo: string="";
    EntryDate: any="";
    Narration: string="";
    client:string="";
    AccountName: string;
    Allitemlist:any=[];
    codelistActt :any=[] ;
    AccountNameList:any=[];    
    Departmentlist:any=[];
    Department:string="0";
    DepartmentName:string;
    OurBankList:any=[];
    OurBank:string; 
    OurBankName:string; 
   
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
    ID:string="0";
    ISNOTEDITABLE:string="0";
    ACC_BANKDTLS_ID:string="0";
    Header: string="BANK RECEIPT";
    text: string="Submit";txtchild : string ="Add";txtadd:string ="Add";
    Accountlist:any=[];
    ACCTNAME:string="";
    STATUS:string="BR";
    NOTOVERFLAG:string="";
    PAYEENAME:string="";
    CRPARENTENTRYNO:string="0";
    ChequeNo: string="";
    ChequeDate: any= '';
    BankName: string;
    CompChequeFlag:string="0";
    public togglededuction: boolean = false;
    public toggleentrydate :boolean=false;
    public showModal_ListBill: boolean = false; 
    public toggledebit: boolean = false;
    public disableEntryType: boolean=false;
    ListBill: any=[]; 
    newArray: any = [];
    sel_inv_no : string;
    sel_jobno : string;
    sel_client: string;
    sel_amount: string;
    BillNoList: string = ""; 
    STRTXT:any=[]; 
    billstr: string="";
    NARRATION :string="";
    dfltourbank  :string="";
    BankRefNo:string="";
    public myDatePickerOptions: IMyDpOptions = {
        dateFormat: 'dd/mm/yyyy',
        inline: false,
        height: '16px',
        width: '140px',
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
        
        this._activatedRoute.params.subscribe(params => {
            this.EntryNo = params["EntryNo"];                 
            this.EntryDate = new Date();
            this.EntryDate =  this._dataService.datechnge(this.EntryDate)    
            this.ChequeDate = new Date();
            this.ChequeDate =  this._dataService.datechnge(this.ChequeDate)    
            })
             
        const jsonparam= {  CMPCODE:this._loginService.getLogin()[0].CMPCODE,
            CITYCODE:this._loginService.getLogin()[0].CITYCODE,
            CITYCODE1:this._loginService.getLogin()[0].CITYCODE1,
            PSTATUS:"BR" }
    
        this._dataService.getData("Accounts/ACC_CASHBOOK_BRBPCRCPCE_PAGELOAD",jsonparam)
        .subscribe((data: any) => {
            this.AccountNameList=data.Table;
            this.Departmentlist=data.Table1;
            this.OurBankList=data.Table2;
            this.Allitemlist=data.Table5;
            let defCode=data.Table3[0].ACCTCODE
            this.OurBank=defCode;
            this.dfltourbank=data.Table3[0].ACCTCODE
        });
           
        const jsonreset = { VGUID :this._loginService.getLogin()[0].GUID}
        this._dataService.getData("Accounts/ACC_BRBPCRCPCE_RESET", jsonreset)
        .subscribe((data: any) => {
            });
           
        if (this.EntryNo !=' ')
        {
            this.verifyPermission('5','Modify');
            this.Header='BANK RECEIPT - UPDATE ';
            this.editpopulate();
        }
        if (this.EntryNo ==' ' )
        {
            this.verifyPermission('5','Add');
            this.Header= 'BANK RECEIPT  - ADD';
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
    GetActName(Acctcode)  {   
        let codeacct
    // this.ACCTNAME=event.target.options[event.target.options.selectedIndex].text;
        this.codelistActt = this.AccountNameList.filter((code: any) => code.ACCTCODENAME === Acctcode);
        this.ACCTNAME=this.codelistActt[0].ACCTNAME;
        codeacct=this.codelistActt[0].ACCTCODENAME;
        this.ItemList = this.Allitemlist.filter((code: any) => code.ACCTCODE === Acctcode.split("|")[0]);
    }
    GetDepartmentName(event)  {
     this.DepartmentName=event.target.options[event.target.options.selectedIndex].text;//.split("|")[1];
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
            if (this.EntryType=="0" || this.EntryType==undefined || this.EntryType=="")  {
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
            // if (this.JobNo.substr(2, 3) != this._loginService.getLogin()[0].CITYCODE1)   {
            //     this._toasterService.toast("warning","warning",'You have entered Job No of different City !');
            //     return false;
            //     }
        }
        if(this.JobNo=="" && this.BillNo=="")  {
            if(this.Department=="0" || this.Department==undefined || this.Department=="") {
                this._toasterService.toast('warning', 'warning', 'Please Select Department !');
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
         ISOLDENTRY:"0"
         }
        this._dataService.Common("Accounts/ACC_BRBPCRCPCE_TMP_IU", jsonchild)
        .subscribe((data: any) => {
            if (data.Table[0].STATUS == "100") {
                    this.Accountlist=data.Table;
                    this.TotalAmount=data.Table1[0].TOTAMOUNT;
                    this.TotalDeduction=data.Table1[0].TOTDEDUCTION;
                    this.NetTotal=data.Table1[0].NETTOTAL;
                    this.Resetchildrcrd();
                    this.loaderService.display(false);                
                }
            else{   this._toasterService.toast("warning","warning" ,data.Table[0].STATUSTEXT);
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
    } 
    Resetchildrcrd(){
        this.ID ="0";
       // this.AccountName=undefined;
        this.JobNo="";
        this.Amount="";
        this.Deduction="";
        this.ShortNarration="";
        this.Item=undefined;
        ///this.Department="";
       // this.EntryType="";
        this.txtchild="Add";
        this.BillNo="";
        this.ACC_BANKDTLS_ID="0";
     }

     Editchildrecd(id) {
            let filterData = this.Accountlist.filter((filter) => filter.ID == id)[0];
            this.ID=filterData.ID;
            this.AccountName=filterData.CLIENT + '|' + filterData.ISJOBREPORT;
            this.ItemList = this.Allitemlist.filter((code: any) => code.ACCTCODE === this.AccountName.split("|")[0]);
            this.Item=filterData.ITEM_DATAVALUE;
            this.Amount=filterData.AMOUNT;
            this.Deduction= (filterData.DEDUCTION== null) ?"":filterData.DEDUCTION;
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

        Add_Main()
    {   
      
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
        this.loaderService.display(true); 
        this._dataService.Common("Accounts/ACC_BRBPCRCPCE_IU", jsonmaster)
        .subscribe((data: any) => {            
                if (data.Table[0].STATUS == "100") {
                    this._toasterService.toast('info', 'Complete', data.Table[0].STATUSTEXT);
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
            window.open('./#/popup/Account-CashBook-BankReceipt-print/' + 'BR' + '/' + entryno + '/' , "CashBook BankPayment Print", toolbar);
        }   
        ResetMain()  {
            this.Resetchildrcrd();
            this.EntryNo =" ";
           // this.EntryDate ='';
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
            this.EntryType='';
            this.AccountName=undefined
            this.Department='';
            this._router.navigate(['/accounts/Voucher/BankRecpt/Add/ ']); 
        }       
        editpopulate()  {
              const jsonview = { EntryNo  : this.EntryNo,
              CMPCODE:this._loginService.getLogin()[0].CMPCODE,
              CITYCODE:this._loginService.getLogin()[0].CITYCODE,
              VGUID:this._loginService.getLogin()[0].GUID,
              STATUS:this.STATUS
                 }
          this._dataService.getData("Accounts/ACC_BRBPCRCPCE_View", jsonview)
           .subscribe((data: any) => {             
              this.EntryNo  = data.Table[0].ENTRYNO    ;
              this.EntryDate=(data.Table[0].ENTRYDT != "") ? (data.Table[0].ENTRYDT) : "";
              this.Narration=data.Table[0].NARRATION;
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
              this.toggleentrydate =true;
              this.BankRefNo  =data.Table[0].BANKREFNO;
              this.loaderService.display(false);
                    
          })
          if(this.CompChequeFlag=="1" && this.NOTOVERFLAG != "Y" )  {
            this._toasterService.toast("warning","warning" ,"You can not Update this Bank Payment because this is generated through Computerisd Cheque Print !" );
                    this.loaderService.display(false);
          }  
          else if(this.CompChequeFlag=="1" && this.NOTOVERFLAG == "Y")   {
            this._toasterService.toast("warning","warning" ,"You can edit but net total should be less than or equal to BankPayment Amount=" + this.NetTotal );
                    this.loaderService.display(false);
          }  
        }   
      
    Reset() {
        if(confirm('Are you sure you want to reset all data?'))    {
            this.Resetchildrcrd();
            this.EntryNo = " ";
           // this.EntryDate ='';
            this.Narration ='';
            this.ChequeNo='';
            //this.ChequeDate='';
            this.BankName='';
            this.OurBank='';
            this.TotalAmount ='';
            this.TotalDeduction ='';
            this.NetTotal ='';
            this.BankRefNo='';
            this.text="Submit";
            this.Accountlist=[];
            this.EntryType='';
            this.Department='';
            this.AccountName=undefined;
            const jsonreset = { VGUID :this._loginService.getLogin()[0].GUID}
            this._dataService.getData("Accounts/ACC_BRBPCRCPCE_RESET", jsonreset)
            .subscribe((data: any) => {               
                this._toasterService.toast('info', 'success', "Clear all data");
                this.loaderService.display(false);
                this._router.navigate(['/accounts/Voucher/BankRecpt/Add/ ']);
                this.OurBank=this.dfltourbank;
           });               
        }  
        else {   
            return false;
            this.loaderService.display(false);
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

    EntryTypeChg(entrytypeval)  {        
        if (entrytypeval == "AD")   {
            this.Deduction="";
            this.togglededuction=true;
        }
         else   {
           this.togglededuction=false;
         }
        if (entrytypeval == "PE") {
            this.BillNo="";
            this.Amount="";
        }
        if (entrytypeval == "AB") {
            this.BillNo="";
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
                        this.disableEntryType=true;
                        this.loaderService.display(false);
                    });
        this.newArray = []
        this.close();
}
    close() {
        this.showModal_ListBill = false
    }
    TextareaValueChange(ev) {
        this.Narration = ev.target.value;
    } 
    }
  