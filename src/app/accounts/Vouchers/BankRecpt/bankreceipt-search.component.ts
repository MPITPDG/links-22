
import { Component, OnInit,ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DataService } from '../../../shared/service/dataService';
//import { LoginService } from '../../authServiceshared/service/loginService';
import { LoginService } from '../../../shared/service/loginService';
import { ToastCommonService } from '../../../shared/service/toastService';
import { IMyDpOptions } from 'mydatepicker';
import { LoaderService } from '../../../shared/service/loader.service';
import { DatePipe } from '@angular/common';
import {environment}  from '../../../../environments/environment.prod'

@Component({
    selector: 'app-accounts-vouchers-receipt-bankreceipt-search',
    templateUrl: 'bankreceipt-search.component.html',
    // styleUrls: ['../../../../node_modules/@ng-select/ng-select/themes/default.theme.css'], 
    encapsulation: ViewEncapsulation.None,
    providers:[        DatePipe    ]
})
export class BankReceiptSearchComponent implements OnInit {
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
        selectorHeight: '198px',
        selectorWidth: '200px'
    };
    searchList: any = [];
    printarray:any=[]
    displayType: string = 'SEARCH';
    searchHeaderText: string = 'List of Vouchers';
    Display:string="0";
    Type: string = 'CODE';
    EntryNo: any = '';
    FromDate: any = null;
    ToDate: any = null;
    FrmDt: any = null;
    ToDt: any = null;
    ActFromDate:any = null;
    ActToDate:any = null;
    BankFromDate:any = null;
    BankToDate:any = null;
    VoucherDay: any = null;
    JobNo: any = '';
    Amount: any = '';
    Day:any = null;
    AccountList: any = [];
    OurBankList: any = [];
    Account: any = null;
    AccountName: string;
    ChequeNo: any = '';
    OurBank: string;
    STATUS: string='BR';
    PageType: any;
    VoucherType : any="0";
    frmdt:any;
    todt:any;
    constructor(
        private _dataService: DataService,private datePipe: DatePipe,
        private _loginService: LoginService,
        private _toasterService: ToastCommonService,
        private _router: Router,private _activatedRoute: ActivatedRoute,
        private _loaderService: LoaderService) { }

    ngOnInit() {
        this._activatedRoute.params.subscribe(params => {
         //  console.log(params)
            this.PageType=params["Type"]
            if (this.PageType=="BR"){ this.searchHeaderText="Bank Receipt" ;}
            else  if (this.PageType=="BP"){ this.searchHeaderText="Bank Payment" ;}
            else  if (this.PageType=="CR"){ this.searchHeaderText="Cash Receipt" ;}
            else  if (this.PageType=="CP"){ this.searchHeaderText="Cash Payment" ;}
            else  if (this.PageType=="CE"){ this.searchHeaderText="Cash Expense" ;}
            else  if (this.PageType=="CC"){ this.searchHeaderText="Request Bank Payment" ;}
            else { this.searchHeaderText="" ;}
            
         
        })
        const _jsonData = {
            CMPCODE: this._loginService.getLogin()[0].CMPCODE,
            CITYCODE: this._loginService.getLogin()[0].CITYCODE,
            CITYCODE1:this._loginService.getLogin()[0].CITYCODE1,
            PSTATUS:"BR"
        };
        this._dataService.getData("Accounts/ACC_CASHBOOK_BRBPCRCPCE_PAGELOAD", _jsonData)
            .subscribe((data: any) => {
                this._loaderService.display(false);
                this.AccountList= data.Table;
                this.OurBankList=data.Table2;
             });

            //  this._loginService.verifyRights(9, '')
            //  .subscribe((data: any) => { this._loginService.checkVerify('View', data); });
            if (this.PageType=="BR"){  this._loginService.verifyRights(5, '')
            .subscribe((data: any) => { this._loginService.checkVerify('View', data); });}
            else  if (this.PageType=="BP"){  this._loginService.verifyRights(6, '')
            .subscribe((data: any) => { this._loginService.checkVerify('View', data); });}
            else  if (this.PageType=="CR"){  this._loginService.verifyRights(7, '')
            .subscribe((data: any) => { this._loginService.checkVerify('View', data); });}
            else  if (this.PageType=="CP"){  this._loginService.verifyRights(8, '')
            .subscribe((data: any) => { this._loginService.checkVerify('View', data); });}
            else  if (this.PageType=="CE"){  this._loginService.verifyRights(29, '')
            .subscribe((data: any) => { this._loginService.checkVerify('View', data); });}
            else  if (this.PageType=="CC"){  this._loginService.verifyRights(91, '')
            .subscribe((data: any) => { this._loginService.checkVerify('View', data); });} 
    }
    frmDateChanged(ev){
        this.FromDate=ev.formatted
        this.frmdt = this._dataService.convertFromdd_mm_yyyTodd_mmm_yyy(this.FromDate)
    }
    toDateChanged(ev){
        this.ToDate=ev.formatted
        this.todt = this._dataService.convertFromdd_mm_yyyTodd_mmm_yyy(this.ToDate)
    }
    frmBankDateChanged(ev){
        this.BankFromDate=ev.formatted
        this.frmdt = this._dataService.convertFromdd_mm_yyyTodd_mmm_yyy(this.BankFromDate)
    }
    toBankDateChanged(ev){
        this.BankToDate=ev.formatted
        this.todt = this._dataService.convertFromdd_mm_yyyTodd_mmm_yyy(this.BankToDate)
    }
    frmActDateChanged(ev){
        this.ActFromDate=ev.formatted
        this.frmdt = this._dataService.convertFromdd_mm_yyyTodd_mmm_yyy(this.ActFromDate)
    }
    toactDateChanged(ev){
        this.ActToDate=ev.formatted
        this.todt = this._dataService.convertFromdd_mm_yyyTodd_mmm_yyy(this.ActToDate)
    }
    fnValidate_Code(): boolean {
        if (this.EntryNo.trim().length === 0) {
            alert("Please Enter Voucher No.");
            return false;
        } else if (this.EntryNo.trim().length != 15) {
            alert("Invalid Voucher No.");
            return false;
        }
        return true;
    }
    fnValidate_ChequeNo(): boolean {
        if (this.ChequeNo.trim().length === 0) {
            alert("Please Enter Cheque No.");
            return false;
         
        }
        return true;
    }
    fnValidate_JobNo(): boolean {
        if (this.JobNo.trim().length === 0) {
            alert("Please Enter Job No.");
            return false;
        } else if (this.JobNo.trim().length != 15) {
            alert("Invalid Job No.");
            return false;
        }
        return true;
    }
   
    fnValidate_Client(): boolean {
        if (!this.Account) {
            alert("Please select Client.");
            return false;
        }
        return true;
    }
    fnValidate_Ourbank(): boolean {
        if (!this.OurBank) {
            alert("Please select Our Bank.");
            return false;
        }
        return true;
    }
    fnValidate_Amount(): boolean {
        if (this.Amount.trim().length === 0) {
            alert("Please Enter Amount.");
            return false;
        
        }
        return true;
    }
    fnValidate_Date(): boolean {
        if (!this.FromDate) {
            alert("Please select From Date.");
            return false;
        }
        else if (!this.ToDate) {
            alert("Please select To Date.");
            return false;
        }
        else if (this.FromDate !="" && this.ToDate!=""){
            let intdtfrm ,intdtTo;
            intdtfrm=this._dataService.datechnge(this.FromDate.formatted)
            intdtTo=this._dataService.datechnge(this.ToDate.formatted)
            if (this._dataService.date2Comparison(intdtfrm,intdtTo) ==false)
            {
              this._toasterService.toast('warning', 'warning', 'To date should be greater than from date !');
              return false;
            }
      }
        return true;
    }
    fnValidate_Day(): boolean {
        if (!this.VoucherDay) {
            alert("Please select Date");
            return false;
        }
     
        return true;
    }
    SqlDate(strdateP) {
        if (strdateP != "" || strdateP != undefined) {
            let strdate = strdateP.split("/");
            let StrSqlDate = strdate[1] + "/" + strdate[0] + "/" + strdate[2];
            return StrSqlDate;
        }
        else return "";
    }


    search() {

        // this._loginService.verifyRights(9, '')
        // .subscribe((data: any) => { 
        //     this._loginService.checkVerify('View', data); 
                         
        // });
        let SearchType = ""; let Typevalue="";
        if (this.Type == 'CODE') { if (this.fnValidate_Code()) { SearchType = "ENTRYNO"; this.getData(SearchType); }; }
        else if (this.Type == 'CHEQUENO') { if (this.fnValidate_ChequeNo()) { SearchType = "CHQNO"; this.getData(SearchType); } }
        else if (this.Type == 'CLIENT') { if (this.fnValidate_Client()) { SearchType = "ACCOUNT";   this.getData(SearchType); } }
        else if (this.Type == 'OURBANK') { if (this.fnValidate_Ourbank()) { SearchType = "BANK";   this.getData(SearchType); } }
        else if (this.Type == 'JOBNO') { if (this.fnValidate_JobNo()) { SearchType = "JOBNO"; this.getData(SearchType); } }
        else if (this.Type == 'AMOUNT') { if (this.fnValidate_Amount()) { SearchType = "AMOUNT"; this.getData(SearchType); } }
        else if (this.Type == 'DATE') { if (this.fnValidate_Date()) { SearchType = "DATE";  this.getData(SearchType); } }
        else if (this.Type == 'PRINTAV') { if (this.fnValidate_Day()) { SearchType = "DAY";this.getDataofDay(SearchType) ; } }
        }

        getbankactdate(searchtype)
            {
        if(searchtype == 'BANK')
        {    
            // this.FrmDt= this.BankFromDate,
            // this.ToDt=this.BankToDate    
            this.frmdt=this._dataService.convertFromdd_mm_yyyTodd_mmm_yyy(this.BankFromDate)
            this.todt=this._dataService.convertFromdd_mm_yyyTodd_mmm_yyy(this.BankToDate)  
        }
        else
        if(searchtype == 'CLIENT')
        {    
            // this.FrmDt= this.ActFromDate,
            // this.ToDt=this.ActToDate   
            this.frmdt=this._dataService.convertFromdd_mm_yyyTodd_mmm_yyy(this.ActFromDate)
            this.todt=this._dataService.convertFromdd_mm_yyyTodd_mmm_yyy(this.ActToDate)  
        }
        else
        if(searchtype == 'DATE')
        {    
            // this.frmdt= this.FromDate.formatted,
            // this.todt=this.ToDate.formatted   
            this.frmdt=this._dataService.convertFromdd_mm_yyyTodd_mmm_yyy(this.FromDate)
            this.todt=this._dataService.convertFromdd_mm_yyyTodd_mmm_yyy(this.ToDate)
        }
            }
    getData(searchtype) {
        this.getbankactdate(searchtype)
        let API_Pass=""
        let _jsonData
        if(this.PageType=="CC"){
             _jsonData = {
                CMPCODE: this._loginService.getLogin()[0].CMPCODE,
                CITYCODE: this._loginService.getLogin()[0].CITYCODE,
                ENTRYNO:this.EntryNo,
                FROMDATE:(this.frmdt) ?this.frmdt : "",
                TODATE: (this.todt) ? this.todt : "",
                CLIENT:(this.Account==undefined)?"" :this.Account.split("|")[0],
                CHEQUENO:(this.ChequeNo==undefined)?"" :this.ChequeNo,
                OURBANK:(this.OurBank==undefined)?"" :this.OurBank,
                JOBNO:this.JobNo,
                AMOUNT:this.Amount,
                STATUS:"BP",
                MODE:"Search",
                DISPLAYTYPE:searchtype,
                YEARID:this._loginService.getLogin()[0].FINANCIAL_YEAR.YEARID ,  
                Cmpid:this._loginService.getLogin()[0].CMPID          
            }
            API_Pass="Accounts/ACC_ReqBP_SEARCH"
        }else{
             _jsonData = {
                CMPCODE: this._loginService.getLogin()[0].CMPCODE,
                CITYCODE: this._loginService.getLogin()[0].CITYCODE,
                ENTRYNO:this.EntryNo,
                // FROMDATE:(this.FrmDt) ?this.FrmDt.formatted : "",
                // TODATE: (this.ToDt) ? this.ToDt.formatted : "",
                FROMDATE:(this.frmdt) ?this.frmdt : "",
                TODATE: (this.todt) ? this.todt : "",
                CLIENT:(this.Account==undefined)?"" :this.Account.split("|")[0],
                CHEQUENO:(this.ChequeNo==undefined)?"" :this.ChequeNo,
                OURBANK:(this.OurBank==undefined)?"" :this.OurBank,
                JOBNO:this.JobNo,
                AMOUNT:this.Amount,
                STATUS:this.PageType,
                MODE:"SEARCH",
                DISPLAYTYPE:searchtype,
                YEARID:this._loginService.getLogin()[0].FINANCIAL_YEAR.YEARID ,               
            };
            API_Pass="Accounts/ACC_CASHBOOK_SEARCH"
        }

       // console.log(_jsonData)
        this._loaderService.display(true);
        this._dataService.getData(API_Pass, _jsonData)
            .subscribe((data: any) => {
           // console.log(data)
                this._loaderService.display(false);
                if (data.Table.length == 0) {
                    this._toasterService.toast("warning", "Alert", "No record found");
                }
                  else if (data.Table.length == 1) {  
                      if(this.PageType=="BR"){
                     this._router.navigate(["/accounts/Voucher/BankRecpt/Add/", data.Table[0].ENTRYNO]);
                      }else if(this.PageType=="BP"){
                        this._router.navigate(["/accounts/Voucher/BankPaymnt/Add/", data.Table[0].ENTRYNO]);
                      }else if(this.PageType=="CR"){
                     this._router.navigate(["/accounts/Voucher/cashrecipt/cashpayment/", data.Table[0].ENTRYNO]);
                      }else if(this.PageType=="CE"){
                        this._router.navigate(["accounts/Voucher/CashExpence/Add/CE/", data.Table[0].ENTRYNO]);
                      }
                      else if(this.PageType=="CP"){
                        this._router.navigate(["accounts/Voucher/CashPayment/Add/CP/", data.Table[0].ENTRYNO]);
                      }else if(this.PageType=="CC"){
                        this._router.navigate(["/accounts/CompCheque/ReqBP/Add_reqBP/", data.Table[0].ENTRYNO]);
                    }
                 }
                else if (data.Table.length >1) {
                    this.displayType = 'LIST';
                    this.searchList = data.Table;
                }
            });
    }

    getDataofDay(searchtype){
        console.log(this.VoucherDay)
       const _jsonData = {
            CMPCODE: this._loginService.getLogin()[0].CMPCODE,
            CITYCODE: this._loginService.getLogin()[0].CITYCODE,
            ENTRYNO:"",
            FROMDATE: "",
            TODATE:"",
            CLIENT:"",
            CHEQUENO:"",
            OURBANK:"",
            JOBNO:"",
            AMOUNT:"",
            STATUS:(this.PageType=="CC")?"BP":this.PageType,
            MODE:"search",
            DISPLAYTYPE:searchtype,
            DAY:this._dataService.convertFromdd_mm_yyyTodd_mmm_yyy(this.VoucherDay.formatted),
            YEARID:this._loginService.getLogin()[0].FINANCIAL_YEAR.YEARID ,  
        } 
        console.log(_jsonData)

        this._loaderService.display(true);
        this._dataService.getData("Accounts/ACC_BP_SEARCH_DAY", _jsonData)
            .subscribe((data: any) => {
            console.log(data)
                this._loaderService.display(false);
                if (data.Table.length == 0) {
                    this._toasterService.toast("warning", "Alert", "No record found");
                }
                  else if (data.Table.length == 1) {
                      if(this.PageType=="BR"){
                        this._router.navigate(["/accounts/Voucher/BankRecpt/Add/", data.Table[0].ENTRYNO]);
                      }else if(this.PageType=="BP"){
                        this._router.navigate(["accounts/Voucher/BankPaymnt/Add/", data.Table[0].ENTRYNO]);
                      }else if(this.PageType=="CR"){
                        this._router.navigate(["/accounts/Voucher/cashrecipt/cashpayment/", data.Table[0].ENTRYNO]);
                      }else if(this.PageType=="CE"){
                        this._router.navigate(["/accounts/Voucher/CashExpence/Add/CE/", data.Table[0].ENTRYNO]);}
                      else if(this.PageType=="CP"){
                        this._router.navigate(["/accounts/Voucher/CashPayment/Add/CP/", data.Table[0].ENTRYNO]);
                        } 
                      else if(this.PageType=="CC"){
                     // this._router.navigate(["/accounts/Voucher/ReqBP/Add/", data.Table[0].ENTRYNO]);
                     this._router.navigate(["/accounts/CompCheque/ReqBP/Add_reqBP/", data.Table[0].ENTRYNO]);
                    }

                 }
                else if (data.Table.length >1) {
                    this.displayType = 'LIST';
                    this.searchList = data.Table;
                }
            });
    }
    getCheckboxValues(event, data) {
        var index = this.printarray.findIndex(x => x.entryno == data);
        if (event) {
          let obj = {
            entryno: data
          }
          this.printarray.push(obj);
          console.log(  this.printarray)
    
        }
        else {
          this.printarray.splice(index, 1);
          console.log(  this.printarray)
    
        }
      }
      checkAll(ev) {
        this.printarray = []
        this.searchList.forEach(x => x.Checked = ev.target.checked)
        if (ev.target.checked == true) {
          for (var i = 0; i < this.searchList.length; i++) {
            let obj = {
                entryno: this.searchList[i].ENTRYNO
            }
            this.printarray.push(obj);
            console.log(  this.printarray)
          }
        } else {
          this.printarray = []
        }
      }
    Print_Multiple(){
        if(this.printarray.length=="0"){
            this._toasterService.toast("warning", "warning", "Select at least One Entry No to Print.");
            return false
          }
          var output = this.printarray.map(function (item) {
            return item.entryno;
          });
          var datatry = output.join(",")
          var printnolist = datatry
          console.log(printnolist)
          let URL = "http://180.179.207.163/erp/UI/Accounts/frm_Acc_Tran_BRBPCRCP_Print.aspx?" +
                        "huhpnk=" + this._loginService.getLogin()[0].GUID
                        + "&citycode=" + this._loginService.getLogin()[0].CITYCODE1
                        + "&Userid=" + this._loginService.getLogin()[0].CMPID
                        + "&cmp_code=" + this._loginService.getLogin()[0].CMPCODE
                        + "&entryno=" +printnolist                    
                        + "&CurLogInIP=" + environment.edocumentIp
                        window.open(URL, "_blank");
        }
    
    redirectToEdit(EntryNo) {
        if (confirm('Click Ok to Print or Click Cancel to Edit ?')) {
            let theTop = (screen.height / 2) - (483 / 2);
            let theLeft = (screen.width / 2) - (780 / 2);
            let toolbar = 'resizable=no,scrollbars=no,width=800,height=450,status=no,left=' + theLeft + ',top=' + theTop;
            window.open('./#/popup/Account-CashBook-BankReceipt-print/' + this.PageType + '/' + EntryNo + '/' , "CashBook BankReceipt Print", toolbar);
        } 
        else{

        if(this.PageType=="BR"){
            this._router.navigate(['/accounts/Voucher/BankRecpt/Add/'+EntryNo]);
        }else if(this.PageType=="BP"){
            this._router.navigate(["/accounts/Voucher/BankPaymnt/Add/", EntryNo]);
        }else if(this.PageType=="CR"){
            this._router.navigate(['/accounts/Voucher/cashrecipt/cashpayment/'+EntryNo]);
        }else if(this.PageType=="CE"){
                this._router.navigate(['/accounts/Voucher/CashExpence/Add/CE/'+EntryNo]);
        }else if(this.PageType=="CP"){
            this._router.navigate(['/accounts/Voucher/CashPayment/Add/CP/'+EntryNo]);
        }else if(this.PageType=="CC"){
           // this._router.navigate(["/accounts/voucher/ReqBP/Add/", EntryNo]);
           this._router.navigate(["/accounts/CompCheque/ReqBP/Add_reqBP/", EntryNo]);
          }
        } 
    }
    ResetAll(){
       
        this.EntryNo="",
        this.JobNo="",
        this.Amount="",
        this.Account="",
        this.FromDate="",
        this.ToDate="",
        this.VoucherDay="",
        this.Day="",
        this.OurBank="",
        this.ChequeNo=""
        this.BankFromDate="",
        this.BankToDate="",
        this.ActFromDate="",
        this.ActToDate="",
        this.FrmDt="",
        this.ToDt=""
    }

    printButton(){
        if(this.EntryNo ==''||this.EntryNo==undefined || this.EntryNo.length < 15){
            alert("Enter 15 digit No !")
            return false
          }
          let theTop = (screen.height / 2) - (483 / 2);
          let theLeft = (screen.width / 2) - (780 / 2);
          let toolbar = 'resizable=no,scrollbars=no,width=800,height=450,status=no,left=' + theLeft + ',top=' + theTop;
          window.open('./#/popup/Account-CashBook-BankReceipt-print/' + this.PageType + '/' + this.EntryNo + '/' , "CashBook BankReceipt Print", toolbar);
    }
}
// import { Component, OnInit,ViewEncapsulation } from '@angular/core';
// import { Router } from '@angular/router';
// import { DataService } from '../../../shared/service/dataService';
// //import { LoginService } from '../../authServiceshared/service/loginService';
// import { LoginService } from '../../../shared/service/loginService';
// import { ToastCommonService } from '../../../shared/service/toastService';
// import { IMyDpOptions } from 'mydatepicker';
// import { LoaderService } from '../../../shared/service/loader.service';
// import { iif } from 'rxjs';
// @Component({
//     selector: 'app-accounts-vouchers-receipt-bankreceipt-search',
//     templateUrl: 'bankreceipt-search.component.html',
//     // styleUrls: ['../../../../node_modules/@ng-select/ng-select/themes/default.theme.css'], 
//     encapsulation: ViewEncapsulation.None
// })
// export class BankReceiptSearchComponent implements OnInit {
//     public myDatePickerOptions: IMyDpOptions = {
//         dateFormat: 'dd/mm/yyyy',
//         inline: false,
//         height: '16px',
//         width: '120px',
//         componentDisabled: false,
//         selectionTxtFontSize: '12px',
//         editableDateField: false,
//         sunHighlight: true,
//         satHighlight: true,
//         firstDayOfWeek: 'su',
//         openSelectorTopOfInput: false,
//         openSelectorOnInputClick: true,
//         selectorHeight: '198px',
//         selectorWidth: '200px'
//     };
//     searchList: any = [];

//     displayType: string = 'SEARCH';
//     searchHeaderText: string = 'List of Vouchers';
//     Display:string="0";
//     Type: string = 'CODE';
//     EntryNo: any = '';
//     FromDate: any = null;
//     ToDate: any = null;
//     FrmDt: any = null;
//     ToDt: any = null;
//     ActFromDate:any = null;
//     ActToDate:any = null;
//     BankFromDate:any = null;
//     BankToDate:any = null;
//     VoucherDay: any = null;
//     JobNo: any = '';
//     Amount: any = '';
//     Day:any = null;
//     AccountList: any = [];
//     OurBankList: any = [];
//     Account: any = null;
//     AccountName: string;
//     ChequeNo: any = '';
//     OurBank: string;
//     STATUS: string='BR';
//     constructor(
//         private _dataService: DataService,
//         private _loginService: LoginService,
//         private _toasterService: ToastCommonService,
//         private _router: Router,
//         private _loaderService: LoaderService) { }

//     ngOnInit() {

//         const _jsonData = {
//             CMPCODE: this._loginService.getLogin()[0].CMPCODE,
//             CITYCODE: this._loginService.getLogin()[0].CITYCODE,
//             CITYCODE1:this._loginService.getLogin()[0].CITYCODE1,
//             PSTATUS:"BR"
//         };
//         this._dataService.getData("Accounts/ACC_CASHBOOK_BRBPCRCPCE_PAGELOAD", _jsonData)
//             .subscribe((data: any) => {
//                 this._loaderService.display(false);
//                 this.AccountList= data.Table;
//                 this.OurBankList=data.Table2;
//              });

//              this._loginService.verifyRights(9, '')
//              .subscribe((data: any) => { this._loginService.checkVerify('View', data); });
//     }
//     fnValidate_Code(): boolean {
//         if (this.EntryNo.trim().length === 0) {
//             alert("Please Enter Voucher No.");
//             return false;
//         } else if (this.EntryNo.trim().length != 15) {
//             alert("Invalid Voucher No.");
//             return false;
//         }
//         return true;
//     }
//     fnValidate_ChequeNo(): boolean {
//         if (this.ChequeNo.trim().length === 0) {
//             alert("Please Enter Cheque No.");
//             return false;
//         // } else if (this.EntryNo.trim().length != 15) {
//         //     alert("Invalid Voucher No.");
//         //     return false;
//         }
//         return true;
//     }
//     fnValidate_JobNo(): boolean {
//         if (this.JobNo.trim().length === 0) {
//             alert("Please Enter Job No.");
//             return false;
//         } else if (this.JobNo.trim().length != 15) {
//             alert("Invalid Job No.");
//             return false;
//         }
//         return true;
//     }
   
//     fnValidate_Client(): boolean {
//         if (!this.Account) {
//             alert("Please select Client.");
//             return false;
//         }
//         return true;
//     }
//     fnValidate_Ourbank(): boolean {
//         if (!this.OurBank) {
//             alert("Please select Our Bank.");
//             return false;
//         }
//         return true;
//     }
//     fnValidate_Amount(): boolean {
//         if (this.Amount.trim().length === 0) {
//             alert("Please Enter Amount.");
//             return false;
        
//         }
//         return true;
//     }
//     fnValidate_Date(): boolean {
//         if (!this.FromDate) {
//             alert("Please select From Date.");
//             return false;
//         }
//         else if (!this.ToDate) {
//             alert("Please select To Date.");
//             return false;
//         }
//         else if (!this._dataService.DateFromAndToComparision(this.FromDate.formatted, this.ToDate.formatted)) {
//             alert("To Date should be greater than From Date");
//             return false;
//         }
//         return true;
//     }
//     fnValidate_Day(): boolean {
//         if (!this.VoucherDay) {
//             alert("Please select Date");
//             return false;
//         }
     
//         return true;
//     }
//     SqlDate(strdateP) {
//         if (strdateP != "" || strdateP != undefined) {
//             let strdate = strdateP.split("/");
//             let StrSqlDate = strdate[1] + "/" + strdate[0] + "/" + strdate[2];
//             return StrSqlDate;
//         }
//         else return "";
//     }


//     search() {

//         this._loginService.verifyRights(9, '')
//         .subscribe((data: any) => { 
//             this._loginService.checkVerify('View', data); 
            
//         });
//         let SearchType = ""; let Typevalue="";
//         if (this.Type == 'CODE') { if (this.fnValidate_Code()) { SearchType = "ENTRYNO"; this.getData(SearchType); }; }
//         else if (this.Type == 'CHEQUENO') { if (this.fnValidate_ChequeNo()) { SearchType = "CHQNO"; this.getData(SearchType); } }
//         else if (this.Type == 'CLIENT') { if (this.fnValidate_Client()) { SearchType = "ACCOUNT";   this.getData(SearchType); } }
//         else if (this.Type == 'OURBANK') { if (this.fnValidate_Ourbank()) { SearchType = "BANK";   this.getData(SearchType); } }
//         else if (this.Type == 'JOBNO') { if (this.fnValidate_JobNo()) { SearchType = "JOBNO"; this.getData(SearchType); } }
//         else if (this.Type == 'AMOUNT') { if (this.fnValidate_Amount()) { SearchType = "AMOUNT"; this.getData(SearchType); } }
//         else if (this.Type == 'DATE') { if (this.fnValidate_Date()) { SearchType = "DATE";  this.getData(SearchType); } }
//         else if (this.Type == 'PRINTAV') { if (this.fnValidate_Day()) { SearchType = "DAY"; Typevalue=this.VoucherDay;""; } }
//         }

//         getbankactdate(searchtype)
//             {
//         if(searchtype == 'BANK')
//         {    
//             this.FrmDt= this.BankFromDate,
//             this.ToDt=this.BankToDate    
//         }
//         else
//         if(searchtype == 'CLIENT')
//         {    
//             this.FrmDt= this.ActFromDate,
//             this.ToDt=this.ActToDate   
//         }
//         else
//         if(searchtype == 'DATE')
//         {    
//             this.FrmDt= this.FromDate,
//             this.ToDt=this.ToDate   
//         }
//             }
//     getData(searchtype) {
//         this.getbankactdate(searchtype)
//         const _jsonData = {
//             CMPCODE: this._loginService.getLogin()[0].CMPCODE,
//             CITYCODE: this._loginService.getLogin()[0].CITYCODE,
//             ENTRYNO:this.EntryNo,
           
//             FROMDATE:(this.FrmDt) ?this.FrmDt.formatted : "",
//             TODATE: (this.ToDt) ? this.ToDt.formatted : "",
//             CLIENT:(this.Account==undefined)?"" :this.Account.split("|")[0],
//             CHEQUENO:(this.ChequeNo==undefined)?"" :this.ChequeNo,
//             OURBANK:(this.OurBank==undefined)?"" :this.OurBank,
//             JOBNO:this.JobNo,
//             AMOUNT:this.Amount,
//             STATUS:this.STATUS,
//             MODE:"SEARCH",
//             DISPLAYTYPE:searchtype,
//             YEARID:this._loginService.getLogin()[0].FINANCIAL_YEAR.YEARID
            
        
//         };
//         this._loaderService.display(true);
//         this._dataService.getData("Accounts/ACC_CASHBOOK_SEARCH", _jsonData)
//             .subscribe((data: any) => {
//                 this._loaderService.display(false);
//                // console.log(data);
//                 if (data.Table.length == 0) {
//                     this._toasterService.toast("warning", "Alert", "No record found");
//                 }
//                   else if (data.Table.length == 1) {
//                      this._router.navigate(["/accounts/Voucher/BankRecpt/Add/", data.Table[0].ENTRYNO]);
//                  }
//                 else if (data.Table.length >1) {
//                     this.displayType = 'LIST';
//                     this.searchList = data.Table;
//                 }
//             });
//     }
//     redirectToEdit(EntryNo) {
       
//         this._router.navigate(['/accounts/Voucher/BankRecpt/Add/'+EntryNo]);
//     }
//     ResetAll(){
       
//         this.EntryNo="",
//         this.JobNo="",
//         this.Amount="",
//         this.Account="",
//         this.FromDate="",
//         this.ToDate="",
//         this.VoucherDay="",
//         this.Day="",
//         this.OurBank="",
//         this.ChequeNo=""
//         this.BankFromDate="",
//         this.BankToDate="",
//         this.ActFromDate="",
//         this.ActToDate="",
//         this.FrmDt="",
//         this.ToDt=""
//     }
// }