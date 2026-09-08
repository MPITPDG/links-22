import { Component, OnInit,ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { DataService } from '../../../shared/service/dataService';
import { LoginService } from '../../../shared/service/loginService';
import { ToastCommonService } from '../../../shared/service/toastService';
import { IMyDpOptions } from 'mydatepicker';
import { LoaderService } from '../../../shared/service/loader.service';
@Component({
    selector: 'app-accounts-transaction-purchase-search',
    templateUrl: 'staffpurchase_search.component.html',
    
})
export class StaffPurchaseSearchComponent implements OnInit {
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
    Stafflist: any = [];
    searchList: any = [];

    displayType: string = 'SEARCH';
    searchHeaderText: string = 'List of Purchase';
    Display:string="0";
    Type: string = 'CODE';
    PurchaseNo: any = '';
    PurchaseFromDate: any = null;
    PurchaseToDate: any = null;
    PurchaseDay: any = null;
    SuppFromDt: any = null;
    SupptoDt: any = null;
    JobNo: any = '';
    Amount: any = '';
    Day:any = null;
    Staff: any = null;
    constructor(
        private _dataService: DataService,
        private _loginService: LoginService,
        private _toasterService: ToastCommonService,
        private _router: Router,
        private _loaderService: LoaderService) { }

    ngOnInit() {
      ///  console.log(this._loginService.getLogin()[0].FINANCIAL_YEAR.STARTDATE)
        // this.verifyPermission(202, "Modify");


        const _jsonData = {
            cmp_code: this._loginService.getLogin()[0].CMPCODE,
            citycode: this._loginService.getLogin()[0].CITYCODE,
            citycode1:this._loginService.getLogin()[0].CITYCODE1,
            PSTATUS:"SRPI"
        };
        this._dataService.getData("Accounts/ACC_PURCHASE_PAGELOAD", _jsonData)
            .subscribe((data: any) => {
                this._loaderService.display(false);
                this.Stafflist= data.Table1;
                          });
   
    }

    // verifyPermission(formId, userMode) {
    //     this._loaderService.display(true);
    //     this._loginService.verifyRights(formId, '')
    //         .subscribe((data: any) => {
    //             if (this._loginService.checkVerify(userMode, data)) {
    //                 this.fillCommonDropdownList();
    //             } else { this._loaderService.display(false); }
    //         });
    // }

   
       

    fnValidate_Code(): boolean {
        if (this.PurchaseNo.trim().length === 0) {
            alert("Please Enter Purchase No.");
            return false;
        } else if (this.PurchaseNo.trim().length != 15) {
            alert("Invalid Purchase No.");
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
    fnValidate_Amount(): boolean {
        if (this.Amount.trim().length === 0) {
            alert("Please Enter Amount.");
            return false;
        
        }
        return true;
    }
    fnValidate_Date(): boolean {
        if (!this.PurchaseFromDate) {
            alert("Please select From Date.");
            return false;
        }
        else if (!this.PurchaseToDate) {
            alert("Please select To Date.");
            return false;
        }
        else if (!this._dataService.DateFromAndToComparision(this.PurchaseFromDate.formatted, this.PurchaseToDate.formatted)) {
            alert("To Date should be greater than From Date");
            return false;
        }
        return true;
    }
    fnValidate_Supplier(): boolean {
        if (!this.Staff) {
            alert("Please select Staff.");
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
        let SearchType = "";
        if (this.Type == 'CODE') { if (this.fnValidate_Code()) { SearchType = "PurNo"; this.getData(SearchType); }; }
        else if (this.Type == 'DATE') { if (this.fnValidate_Date()) { SearchType = "Date"; this.getData(SearchType); } }
        else if (this.Type == 'STAFF') { if (this.fnValidate_Supplier()) { SearchType = "Supplier"; this.getData(SearchType); } }
        else if (this.Type == 'JOBNO') { if (this.fnValidate_JobNo()) { SearchType = "JobNo"; this.getData(SearchType); } }
        else if (this.Type == 'AMOUNT') { if (this.fnValidate_Amount()) { SearchType = "Amount"; this.getData(SearchType); } }
      
    }

    getData(searchtype) {
        const _jsonData = {
           
            PUR_CODE: this.PurchaseNo,
            FROMDATE: (this.PurchaseFromDate) ? this.SqlDate(this.PurchaseFromDate.formatted) : "",
            TODATE: (this.PurchaseToDate) ? this.SqlDate(this.PurchaseToDate.formatted) : "",
            PUR_SUPPLIER: (this.Staff) ? this.Staff : "0",
            PUR_INVNO:"",
            PUR_JOBNO:(this.JobNo) ? this.JobNo : "",
            AMOUNT:(this.Amount) ? this.Amount : "",
            DISPLAYTYPE:this.Display,
            Type: searchtype,
            STATUS:"SRPI",
            citycode: this._loginService.getLogin()[0].CITYCODE,
            cmp_code: this._loginService.getLogin()[0].CMPCODE,
            year_id:this._loginService.getLogin()[0].FINANCIAL_YEAR.YEARID,
            Fin_StartDate:this._loginService.getLogin()[0].FINANCIAL_YEAR.STARTDATE,
            Fin_EndDate:this._loginService.getLogin()[0].FINANCIAL_YEAR.ENDDATE,
            USERID:this._loginService.getLogin()[0].CMPID
        
        };
        this._loaderService.display(true);
        this._dataService.getData("Accounts/ACC_PURCHASE_SEARCH_RPI", _jsonData)
            .subscribe((data: any) => {
                this._loaderService.display(false);
               // console.log(data);
                if (data.Table.length == 0) {
                    this._toasterService.toast("warning", "Alert", "No record found");
                }
                 else if (data.Table.length == 1) {
                     this._router.navigate(["/accounts/purchase/StaffPurchase/", data.Table[0].PUR_CODE]);
                }
                else if (data.Table.length > 1) {
                    this.displayType = 'LIST';
                    this.searchList = data.Table;
                }
            });
    }

    redirectToEdit(EntryNo) {
       
        this._router.navigate(['/accounts/purchase/StaffPurchase/'+ EntryNo]);
    }
    ResetAll(){
       
        this.PurchaseNo="",
        this.JobNo="",
        this.Amount="",
        this.Staff="",
        this.PurchaseFromDate="",
        this.PurchaseToDate="",
        this.Day="",
        this.PurchaseDay=""
    }


}