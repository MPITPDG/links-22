import { Component, OnInit,ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { DataService } from '../../../shared/service/dataService';
import { LoginService } from '../../../shared/service/loginService';
import { ToastCommonService } from '../../../shared/service/toastService';
import { IMyDpOptions } from 'mydatepicker';
import { LoaderService } from '../../../shared/service/loader.service';
import { ActivatedRoute } from '@angular/router';
@Component({
    selector: 'app-accounts-vouchers-jv-journalvoucher-search',
    templateUrl: 'journalvoucher_search.component.html',
    // styleUrls: ['../../../../node_modules/@ng-select/ng-select/themes/default.theme.css'], 
    encapsulation: ViewEncapsulation.None
})
export class JournalVoucherSearchComponent implements OnInit {
    public myDatePickerOptions: IMyDpOptions = {
        dateFormat: 'dd-mmm-yyyy',
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

    displayType: string = 'SEARCH';
    searchHeaderText: string = 'List of Vouchers';
    Display:string="0";
    Type: string = 'CODE';
    VoucherNo: any = '';
    FromDate: any = null;
    ToDate: any = null;
    VoucherDay: any = null;
    JobNo: any = '';
    Amount: any = '';
    InvoiceNo: any = '';
    Day:any = null;
    AccountList: any = [];
    Account: any = null;
    STATUS:string="";
    constructor(
        private _dataService: DataService,
        private _loginService: LoginService,
        private _toasterService: ToastCommonService,
        private _router: Router,
        private _activatedRoute: ActivatedRoute,
        private _loaderService: LoaderService) { }

    ngOnInit() {
        this._activatedRoute.params.subscribe(params => {
            this.STATUS = params["Status"];
               
        });
        const _jsonData = {
            cmp_code: this._loginService.getLogin()[0].CMPCODE,
            citycode: this._loginService.getLogin()[0].CITYCODE,
            citycode1:this._loginService.getLogin()[0].CITYCODE1,
            PSTATUS:this.STATUS
        };
        this._dataService.getData("Accounts/ACC_JV_PAGELOAD", _jsonData)
            .subscribe((data: any) => {
                this._loaderService.display(false);
                this.AccountList= data.Table;
             });

             if (this.STATUS=="JVREQ"){  this._loginService.verifyRights(192, '')
             .subscribe((data: any) => { this._loginService.checkVerify('View', data); });}
             else  if (this.STATUS=="JV"){  this._loginService.verifyRights(9, '')
             .subscribe((data: any) => { this._loginService.checkVerify('View', data); });}
    }

    fnValidate_Code(): boolean {
        if (this.VoucherNo.trim().length === 0) {
            alert("Please Enter Voucher No.");
            return false;
        } else if (this.VoucherNo.trim().length != 15) {
            alert("Invalid Voucher No.");
            this.VoucherNo="";
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
            this.JobNo="";
            return false;
        }
        return true;
    }
    fnValidate_InvoiceNo(): boolean {
        if (this.InvoiceNo.trim().length === 0) {
            alert("Please Enter Invoice No.");
            return false;
        } else if (this.InvoiceNo.trim().length != 15) {
            alert("Invalid Invoice No.");
            this.InvoiceNo="";
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
        if (this.Type == 'CODE') { if (this.fnValidate_Code()) { SearchType = "CODE"; Typevalue=this.VoucherNo;this.getData(SearchType,Typevalue); }; }
        else if (this.Type == 'JOBNO') { if (this.fnValidate_JobNo()) { SearchType = "JOBNO"; Typevalue=this.JobNo;this.getData(SearchType,Typevalue); } }
        else if (this.Type == 'INVOICENO') { if (this.fnValidate_InvoiceNo()) { SearchType = "INVNO";  Typevalue=this.InvoiceNo; this.getData(SearchType,Typevalue); } }
        else if (this.Type == 'CLIENT') { if (this.fnValidate_Client()) { SearchType = "CLIENT";  Typevalue=this.Account.split("|")[0]; this.getData(SearchType,Typevalue); } }
        else if (this.Type == 'AMOUNT') { if (this.fnValidate_Amount()) { SearchType = "AMOUNT"; Typevalue=this.Amount;this.getData(SearchType,Typevalue); } }
        else if (this.Type == 'DATE') { if (this.fnValidate_Date()) { SearchType = "DATE"; Typevalue=""; this.getData(SearchType,Typevalue); } }
        else if (this.Type == 'PRINTAV') { if (this.fnValidate_Day()) { SearchType = "DAY"; Typevalue=this.VoucherDay;""; } }
       

       }

    getData(searchtype,Typevalue) {
        const _jsonData = {
           
            CODE: searchtype,
            FROMDATE: (this.FromDate) ? (this.FromDate.formatted) : "",
            TODATE:  (this.ToDate) ? (this.ToDate.formatted) : "",
            TYPEVALUE: Typevalue,
            TYPE:this.STATUS,
            Details_flag:"FALSE",
            DISPLAYTYPE:this.Display,
            CITYCODE: this._loginService.getLogin()[0].CITYCODE,
            CMP_CODE: this._loginService.getLogin()[0].CMPCODE,
            YEAR_ID:this._loginService.getLogin()[0].FINANCIAL_YEAR.YEARID,
            FIN_STARTDATE:this._loginService.getLogin()[0].FINANCIAL_YEAR.STARTDATE,
            FIN_ENDDATE:this._loginService.getLogin()[0].FINANCIAL_YEAR.ENDDATE,
            USERID:this._loginService.getLogin()[0].CMPID
        
        };
        this._loaderService.display(true);
        this._dataService.getData("Accounts/ACC_JV_SEARCH", _jsonData)
            .subscribe((data: any) => {
                this._loaderService.display(false);
               // console.log(data);
                if (data.Table.length == 0) {
                    this._toasterService.toast("warning", "Alert", "No record found");
                    return false;
                }
                  else if (data.Table.length == 1) {
                      if(this.STATUS=='JVREQ')
                      {
                        this._router.navigate(["/accounts/Voucher/JV/Add/JVREQ/", data.Table[0].JVCODE]);
                 } 
                 else{
                    this._router.navigate(["/accounts/Voucher/JV/Add/JV/", data.Table[0].JVCODE]);
                 }
                }
                else if (data.Table.length > 1) {
                    this.displayType = 'LIST';
                    this.searchList = data.Table;
                }
            });
    }

    redirectToEdit(EntryNo) {
        let theTop = (screen.height / 2) - (483 / 2);
        let theLeft = (screen.width / 2) - (780 / 2);
        let toolbar = 'resizable=no,scrollbars=no,width=800,height=450,status=no,left=' + theLeft + ',top=' + theTop;
        var c = confirm("Click OK to Print and cancel to Edit?"); 
        if(c==true) {  
            if(this.STATUS=='JV'){
                window.open('./#/popup/Account-JV-Print/' +  EntryNo + '/' +  "JV" + '/', "Journal Voucher Print", toolbar);
              }
            else if(this.STATUS=='JVREQ'){
                window.open('./#/popup/Account-JV-Print/' +  EntryNo + '/' +  "JVREQ" + '/', "Journal Voucher Request Print", toolbar);
                } 
        } 
            else{ 
            if(this.STATUS=="JVREQ")
            {
            this._router.navigate(['/accounts/Voucher/JV/Add/JVREQ/'+ EntryNo]);
            }
            else  if(this.STATUS=="JV")
            {
             this._router.navigate(['/accounts/Voucher/JV/Add/JV/'+ EntryNo]);
            }
    } 
    }
    ResetAll(){
        this.VoucherNo="",
        this.JobNo="",
        this.Amount="",
        this.Account="",
        this.FromDate="",
        this.ToDate="",
        this.VoucherDay="",
        this.Day="",
        this.InvoiceNo=""
    }
    Print()
    {
        if(this.VoucherNo ==''||this.VoucherNo==undefined || this.VoucherNo.length < 15){
            alert("Enter 15 digit No !")
            return false;
          }
          let theTop = (screen.height / 2) - (483 / 2);
          let theLeft = (screen.width / 2) - (780 / 2);
          let toolbar = 'resizable=no,scrollbars=no,width=800,height=450,status=no,left=' + theLeft + ',top=' + theTop;
          if(this.STATUS=='JV'){
          window.open('./#/popup/Account-JV-Print/' +  this.VoucherNo + '/' +  "JV" + '/', "Journal Voucher Print", toolbar);
            }
          else if(this.STATUS=='JVREQ'){
          window.open('./#/popup/Account-JV-Print/' +  this.VoucherNo + '/' +  "JVREQ" + '/', "Journal Voucher Request Print", toolbar);
          }
    }   
}