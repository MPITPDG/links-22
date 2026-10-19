import { Component, OnInit, ViewEncapsulation, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { DataService } from '../../../shared/service/dataService';
import { LoginService } from '../../../shared/service/loginService';
import { ToastCommonService } from '../../../shared/service/toastService';
import { IMyDpOptions } from 'mydatepicker';
import { LoaderService } from '../../../shared/service/loader.service';
@Component({
    selector: 'app-accounts-transaction-purchase-search',
    templateUrl: 'staffpurchase_search.component.html',
    styleUrls: ['../../purchase/purchase-page.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class StaffPurchaseSearchComponent implements OnInit {
    public myDatePickerOptions: IMyDpOptions = {
        dateFormat: 'dd-mmm-yyyy',
        inline: false,
        height: '30px',
        width: '100%',
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

    // ---------- page state (additive: default list, filter, pager, export) ----------
    readonly pageSize = 10;
    page: number = 1;
    loading: boolean = false;
    loadError: boolean = false;
    /** true while the list shows the default "last 30 days" load, not a user search */
    isDefaultList: boolean = false;
    Quick: string = '';
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
                this.loadDefaultList();
                          }, () => {
                this._loaderService.display(false);
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
            FROMDATE:(this.PurchaseFromDate) ? this.PurchaseFromDate.formatted : "",
            TODATE: (this.PurchaseToDate) ? this.PurchaseToDate.formatted : "",
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
                     this._router.navigate(["/accounts/Request/staff/StaffPurchaseReq/", data.Table[0].PUR_CODE]);
                }
                else if (data.Table.length > 1) {
                    this.displayType = 'LIST';
                    this.searchList = data.Table;
                    this.isDefaultList = false;
                    this.Quick = '';
                    this.page = 1;
                }
            }, () => {
                this._loaderService.display(false);
            });
    }

    redirectToEdit(EntryNo) {
       
        this._router.navigate(['/accounts/Request/staff/StaffPurchaseReq/'+ EntryNo]);
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

    Print(no){
        if(this.PurchaseNo ==''||this.PurchaseNo==undefined || this.PurchaseNo.length < 15){
            alert("Enter 15 digit No !")
            return false;
          }
        let theTop = (screen.height / 2) - (483 / 2);
        let theLeft = (screen.width / 2) - (780 / 2);
        let toolbar = 'resizable=no,scrollbars=no,width=800,height=450,status=no,left=' + theLeft + ',top=' + theTop;
        window.open('./#/popup/Account-Purchase-print/' + no + '/' + 'SRPI' + '/', "Staff Purchase Print", toolbar);
    }

    // ---------- default list on open ----------
    /** Last 30 days through the same Date search (same endpoint and payload shape), without the
        single-result redirect, so the page never opens empty. */
    loadDefaultList() {
        const to = new Date();
        const from = new Date(to.getFullYear(), to.getMonth(), to.getDate() - 30);
        const _jsonData = {
            PUR_CODE: "",
            FROMDATE: this.fmtDate(from),
            TODATE: this.fmtDate(to),
            PUR_SUPPLIER: "0",
            PUR_INVNO: "",
            PUR_JOBNO: "",
            AMOUNT: "",
            DISPLAYTYPE: this.Display,
            Type: "Date",
            STATUS: "SRPI",
            citycode: this._loginService.getLogin()[0].CITYCODE,
            cmp_code: this._loginService.getLogin()[0].CMPCODE,
            year_id: this._loginService.getLogin()[0].FINANCIAL_YEAR.YEARID,
            Fin_StartDate: this._loginService.getLogin()[0].FINANCIAL_YEAR.STARTDATE,
            Fin_EndDate: this._loginService.getLogin()[0].FINANCIAL_YEAR.ENDDATE,
            USERID: this._loginService.getLogin()[0].CMPID
        };
        this.loading = true;
        this.loadError = false;
        this._dataService.getData("Accounts/ACC_PURCHASE_SEARCH_RPI", _jsonData)
            .subscribe((data: any) => {
                this.loading = false;
                this.searchList = (data && data.Table) ? data.Table : [];
                this.isDefaultList = true;
                this.Quick = '';
                this.page = 1;
            }, () => {
                this.loading = false;
                this.loadError = true;
            });
    }

    /** same text the date picker's .formatted gives (dd-mmm-yyyy) */
    private fmtDate(d: Date): string {
        const m = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return String(d.getDate()).padStart(2, '0') + '-' + m[d.getMonth()] + '-' + d.getFullYear();
    }

    clearResults() {
        this.displayType = 'SEARCH';
        this.searchList = [];
        this.Quick = '';
        this.page = 1;
        this.isDefaultList = false;
    }

    get Filtered(): Array<any> {
        const list: Array<any> = Array.isArray(this.searchList) ? this.searchList : [];
        const q = (this.Quick || '').trim().toLowerCase();
        if (!q) { return list; }
        return list.filter(r => [r.PUR_CODE, r.PUR_DATE, r.SUPPLIER]
            .some(v => String(v === undefined || v === null ? '' : v).toLowerCase().indexOf(q) >= 0));
    }

    exportCsv() {
        this.downloadCsv('staff-purchases', ['Purchase code', 'Purchase date', 'Staff'],
            this.Filtered.map(r => [r.PUR_CODE, r.PUR_DATE, r.SUPPLIER]));
    }

    // ---------- pagination (10 / page) ----------
    get pageCount(): number {
        return Math.max(1, Math.ceil(this.Filtered.length / this.pageSize));
    }

    get pageRows(): Array<any> {
        const start = (this.page - 1) * this.pageSize;
        return this.Filtered.slice(start, start + this.pageSize);
    }

    get rangeStart(): number {
        return this.Filtered.length ? (this.page - 1) * this.pageSize + 1 : 0;
    }

    get rangeEnd(): number {
        return Math.min(this.page * this.pageSize, this.Filtered.length);
    }

    /** page numbers with 0 standing in for an ellipsis */
    get pageList(): number[] {
        const n = this.pageCount, p = this.page;
        if (n <= 7) { return Array.from({ length: n }, (_, i) => i + 1); }
        const out: number[] = [1];
        const lo = Math.max(2, p - 1), hi = Math.min(n - 1, p + 1);
        if (lo > 2) { out.push(0); }
        for (let i = lo; i <= hi; i++) { out.push(i); }
        if (hi < n - 1) { out.push(0); }
        out.push(n);
        return out;
    }

    goPage(p: number) {
        if (p >= 1 && p <= this.pageCount) { this.page = p; }
    }

    /** client-side CSV of every filtered row: UTF-8 BOM, quoted */
    private downloadCsv(name: string, head: string[], rows: any[][]) {
        const q = (v: any) => {
            const s = (v === null || v === undefined) ? '' : String(v);
            return '"' + s.replace(/"/g, '""') + '"';
        };
        const csv = [head, ...rows].map(line => line.map(q).join(',')).join('\r\n');
        const d = new Date();
        const stamp = d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = name + '-' + stamp + '.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 0);
    }
}