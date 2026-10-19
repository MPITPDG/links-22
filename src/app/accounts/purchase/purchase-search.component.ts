import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { DataService } from '../../shared/service/dataService';
import { LoginService } from '../../shared/service/loginService';
import { ToastCommonService } from '../../shared/service/toastService';
import { IMyDpOptions } from 'mydatepicker';
import { LoaderService } from '../../shared/service/loader.service';
import { HttpClient } from '@angular/common/http';
import {environment}  from '../../../environments/environment.prod'
import { DatePipe } from '@angular/common';
@Component({
  selector: 'app-purchase-search',
  templateUrl: './purchase-search.component.html',
    styleUrls: ['./purchase-page.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class PurchaseSearchComponent implements OnInit {
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
    selectorHeight: '180px',
    selectorWidth: '200px'
  };
  SupplierList: any = [];
  searchList: any = [];
  printarray: any = [];
  displayType: string = 'SEARCH';
  searchHeaderText: string = 'List of Purchase';
  Display: string = "1";
  Type: string = 'purno';
  PurchaseNo: any = '';
  PurchaseFromDate: any = null;
  PurchaseToDate: any = null;
  SuppFromDt: any = null;
  SupptoDt: any = null;
  PurchaseofDay: any = null;
  JobNo: any = '';
  Amount: any = '';
  Day: any = null;
  Supplier: any = null;
  STATUS
  // template members the legacy form bound without declaring (not sent to the API)
  SuppInvNo: any = '';
  SuppFromDate: any = null;
  SuppToDate: any = null;
  checkbox: boolean = false;

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
    private _toasterService: ToastCommonService,
    private _loaderService: LoaderService,
    private _router: Router,private datePipe: DatePipe,
    private http: HttpClient,
    private _activatedRoute: ActivatedRoute,
    private _loginService: LoginService,
  ) { }
  ngOnInit() {
   // console.log(this._loginService.getLogin())
   this._loaderService.display(true);
    this._activatedRoute.params.subscribe(params => {
     // console.log(params)
      // this.PurchaseNo = params["EntryNo"];
       this.STATUS = params["Status"];
      // this.Type = params["Type"]
    })
    // this.verifyPermission('12','Modify')
    this.verifyPermission('425','Modify')
    const jsonparam = {
      cmp_code: this._loginService.getLogin()[0].CMPCODE,
      citycode: this._loginService.getLogin()[0].CITYCODE,
      citycode1: this._loginService.getLogin()[0].CITYCODE1,
      PSTATUS: this.STATUS
    }
 
    this._dataService.getData("Accounts/ACC_PURCHASE_PAGELOAD", jsonparam)
      .subscribe((data: any) => {
    
        this.SupplierList = data.Table1;
        this._loaderService.display(false);
        this.loadDefaultList();
      }, () => {
        this._loaderService.display(false);
      });
  }
 verifyPermission(formId, userMode) {
       
        this._loginService.verifyRights(formId, '')
            .subscribe((data: any) => {         
               this._loginService.checkVerify(userMode, data);
              

            });
    }
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
    // was this.JobNo (checked the wrong field)
    if (String(this.Amount || '').trim().length === 0) {
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
    else if (this.PurchaseFromDate !="" && this.PurchaseToDate!=""){
      let intdtfrm ,intdtTo;
      intdtfrm=this._dataService.datechnge(this.PurchaseFromDate.formatted)
      intdtTo=this._dataService.datechnge(this.PurchaseToDate.formatted)
      if (this._dataService.date2Comparison(intdtfrm,intdtTo) ==false)
      {
        this._toasterService.toast('warning', 'warning', 'To date should be greater than from date !');
        return false;
      }
    }
    return true;
  }
  fnValidate_Supplier(): boolean {
    if (!this.Supplier) {
      alert("Please select Supplier.");
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
         if(this.STATUS=='PI') {
    if (this.Type == 'purno') { if (this.fnValidate_Code()) { SearchType = "purno"; this.getData(SearchType); }; }
    else if (this.Type == 'Date') { if (this.fnValidate_Date()) { SearchType = "Date"; this.getData(SearchType); } }
    else if (this.Type == 'Supplier') { if (this.fnValidate_Supplier()) { SearchType = "Supplier"; this.getData(SearchType); } }
    else if (this.Type == 'JobNo') { if (this.fnValidate_JobNo()) { SearchType = "JobNo"; this.getData(SearchType); } }
    else if (this.Type == 'Amount') { if (this.fnValidate_Amount()) { SearchType = "Amount"; this.getData(SearchType); } }
    else if (this.Type == 'PRINTAV') {   SearchType = "PRINTAV"; this.getAllVoucherofday(SearchType);  }
  }     
  else if(this.STATUS=='RPI') {
    if (this.Type == 'purno') { if (this.fnValidate_Code()) { SearchType = "purno"; this.getRPIData(SearchType); }; }
    else if (this.Type == 'Date') { if (this.fnValidate_Date()) { SearchType = "Date"; this.getRPIData(SearchType); } }
    else if (this.Type == 'Supplier') { if (this.fnValidate_Supplier()) { SearchType = "Supplier"; this.getRPIData(SearchType); } }
    else if (this.Type == 'JobNo') { if (this.fnValidate_JobNo()) { SearchType = "JobNo"; this.getRPIData(SearchType); } }
    else if (this.Type == 'Amount') { if (this.fnValidate_Amount()) { SearchType = "Amount"; this.getRPIData(SearchType); } }
    else if (this.Type == 'PRINTAV') {   SearchType = "PRINTAV"; this.getAllVoucherofday(SearchType);  }
  }        
    }
  getAllVoucherofday(searchtype) {
    const jsonofday = {
      cmp_code: this._loginService.getLogin()[0].CMPCODE,
      citycode: this._loginService.getLogin()[0].CITYCODE,
      TYPE:searchtype,
      FIN_STARTDATE:this._loginService.getLogin()[0].FINANCIAL_YEAR.STARTDATE,
      FIN_ENDDATE: this._loginService.getLogin()[0].FINANCIAL_YEAR.ENDDATE,
      DAY:(this.PurchaseofDay) ? this.SqlDate(this.PurchaseofDay.formatted) : ""
    }
    //console.log(jsonofday)
    
    this._dataService.getData("Accounts/ACC_PURCHASE_SEARCH_PERDAY", jsonofday)
      .subscribe((data: any) => {
        this._loaderService.display(false);
        console.log(data);
        if (data.Table.length == 0) {
          this._toasterService.toast("warning", "Alert", "No record found");
        }
        else if (data.Table.length == 1) {
          this._router.navigate(["/accounts/purchase/Purchase/PI/1/", data.Table[0].pur_code]);
        }
        else if (data.Table.length > 1) {
          this.displayType = 'LIST';
          this.searchList = data.Table;
          this.afterResults();
         // console.log(this.searchList)
        }
      }, () => {
        this._loaderService.display(false);
      });
  }
  getRPIData(searchtype) {
    this._loaderService.display(true);
    // let frmdt :any =this.datePipe.transform(this.PurchaseFromDate, 'dd/MMM/yyyy ')
    // let todt:any =this.datePipe.transform(this.PurchaseToDate, 'dd/MMM/yyyy ')
    const _jsonData = {
      PUR_CODE: (this.PurchaseNo) ? this.PurchaseNo : "",
      PUR_SUPPLIER: (this.Supplier) ? this.Supplier : "0",
      PUR_INVNO: "",
      PUR_JOBNO: (this.JobNo) ? this.JobNo : "",
      AMOUNT: (this.Amount) ? this.Amount : "",
      FROMDATE:(this.PurchaseFromDate) ? this.PurchaseFromDate.formatted : "",
      TODATE:(this.PurchaseToDate) ? this.PurchaseToDate.formatted : "",
      // STATUS: "PI",
      citycode: this._loginService.getLogin()[0].CITYCODE,
      cmp_code: this._loginService.getLogin()[0].CMPCODE,
      TYPE: searchtype,
      DISPLAYTYPE: this.Display,
      YEAR_ID: this._loginService.getLogin()[0].FINANCIAL_YEAR.YEARID,
      FIN_STARTDATE: this._loginService.getLogin()[0].FINANCIAL_YEAR.STARTDATE,
      FIN_ENDDATE: this._loginService.getLogin()[0].FINANCIAL_YEAR.ENDDATE,
      USERID: this._loginService.getLogin()[0].CMPID,
      STATUS: this.STATUS,
    };
   
      this._dataService.getData("Accounts/ACC_PURCHASE_SEARCH_RPI", _jsonData)
      .subscribe((data: any) => {
        this._loaderService.display(false);
      
        if (data.Table.length == 0) {
          this._toasterService.toast("warning", "Alert", "No record found");
        }
        else if (data.Table.length == 1) {
          this._router.navigate(["/accounts/purchase/Purchase/RPI/1/", data.Table[0].PUR_CODE]);
        }
        else if (data.Table.length > 1) {
          this.displayType = 'LIST';
          this.searchList = data.Table;
          this.afterResults();
        }
      }, () => {
        this._loaderService.display(false);
      });
        
  }
  getData(searchtype) {
    this._loaderService.display(true);
    const _jsonData = {
      PUR_CODE: (this.PurchaseNo) ? this.PurchaseNo : "",
      PUR_SUPPLIER: (this.Supplier) ? this.Supplier : "0",
      PUR_INVNO: "",
      PUR_JOBNO: (this.JobNo) ? this.JobNo : "",
      AMOUNT: (this.Amount) ? this.Amount : "",
      FROMDATE: (this.PurchaseFromDate) ? this.PurchaseFromDate.formatted : "",
      TODATE: (this.PurchaseToDate) ? this.PurchaseToDate.formatted : "",
      // STATUS: "PI",
      citycode: this._loginService.getLogin()[0].CITYCODE,
      cmp_code: this._loginService.getLogin()[0].CMPCODE,
      TYPE: searchtype,
      DISPLAYTYPE: this.Display,
      YEAR_ID: this._loginService.getLogin()[0].FINANCIAL_YEAR.YEARID,
      FIN_STARTDATE: this._loginService.getLogin()[0].FINANCIAL_YEAR.STARTDATE,
      FIN_ENDDATE: this._loginService.getLogin()[0].FINANCIAL_YEAR.ENDDATE,
      /// USERID: this._loginService.getLogin()[0].CMPID

    };
   
      this._dataService.getData("Accounts/ACC_PURCHASE_SEARCH_PI", _jsonData)
      .subscribe((data: any) => {
        this._loaderService.display(false);
      
        if (data.Table.length == 0) {
          this._toasterService.toast("warning", "Alert", "No record found");
        }
        else if (data.Table.length == 1) {
          this._router.navigate(["/accounts/purchase/Purchase/PI/1/", data.Table[0].pur_code]);
        }
        else if (data.Table.length > 1) {
          this.displayType = 'LIST';
          this.searchList = data.Table;
          this.afterResults();
        }
      }, () => {
        this._loaderService.display(false);
      });
        
  }

  redirectToEdit(EntryNo) {
    if (confirm('Click Ok to Print or Click Cancel to Edit ?')) {
      let theTop = (screen.height / 2) - (483 / 2);
      let theLeft = (screen.width / 2) - (780 / 2);
      let toolbar = 'resizable=no,scrollbars=no,width=800,height=450,status=no,left=' + theLeft + ',top=' + theTop;
      window.open('./#/popup/Account-Purchase-print/' + EntryNo + '/' + this.STATUS + '/', "Purchase Print", toolbar);
  } 
  else{

   if(this.STATUS=='PI'){
    this._router.navigate(['/accounts/purchase/Purchase/PI/1/' + EntryNo]);
    }
    else if(this.STATUS=='RPI'){
      this._router.navigate(['/accounts/purchase/Purchase/RPI/1/' + EntryNo]);
      }
    } 
  }
  getCheckboxValues(event, data) {
    var index = this.printarray.findIndex(x => x.printno == data);
    if (event) {
      let obj = {
        printno: data
      }
      this.printarray.push(obj);
      

    }
    else {
      this.printarray.splice(index, 1);
      

    }
  }
  checkAll(ev) {
    this.printarray = []
    this.searchList.forEach(x => x.Checked = false)
    // select-all covers every row matching the quick filter (all rows when it is empty)
    const rows = this.Filtered;
    rows.forEach(x => x.Checked = ev.target.checked)
    if (ev.target.checked == true) {
      for (var i = 0; i < rows.length; i++) {
        let obj = {
          // RPI / SRPI rows carry PUR_CODE (upper case); pur_code alone pushed undefined for them
          printno: rows[i].pur_code || rows[i].PUR_CODE
        }
        this.printarray.push(obj);
         
      }
    } else {
      this.printarray = []
    }
  }
  PrintSupplier(){
    if(this.printarray.length=="0"){
      this._toasterService.toast("warning", "warning", "Select at least One Purchase No to Print.");

      return false
    }
    var output = this.printarray.map(function (item) {
      return item.printno;
    });
    var datatry = output.join(",")
    var printnolist = datatry
   
    let URL = "http://manilal.com/erp/UI/Accounts/frm_Acc_Tran_Purchase_BulkPrint.aspx?" +
                  "huhpnk=" + this._loginService.getLogin()[0].GUID
                  + "&citycode=" + this._loginService.getLogin()[0].CITYCODE1
                  + "&Userid=" + this._loginService.getLogin()[0].CMPID
                  + "&cmp_code=" + this._loginService.getLogin()[0].CMPCODE
                  + "&entryno=" +printnolist                    
                  + "&CurLogInIP=" + environment.edocumentIp
                  window.open(URL, "_blank");
  }
  SupplierSinglePrint(suppno) {
    if(suppno==""||suppno==undefined || suppno.length < 15){
      this._toasterService.toast("warning", "warning", "Enter Supplier No to Print.");
      return false
    }
    let theTop = (screen.height / 2) - (483 / 2);
    let theLeft = (screen.width / 2) - (780 / 2);
    let toolbar = 'resizable=no,scrollbars=no,width=800,height=450,status=no,left=' + theLeft + ',top=' + theTop;
    window.open('./#/popup/Account-Purchase-print/' + suppno + '/' + this.STATUS + '/', "Purchase Print", toolbar);
  }
  ResetAll(){
    this.PurchaseNo="",
    this.JobNo="",
    this.Amount="",
    this.Supplier="",
    this.PurchaseFromDate="",
    this.PurchaseToDate="",
    this.Day="",
    this.PurchaseofDay=""
}

  // ---------- default list on open ----------
  /** Loads the last 30 days through the same Date search the form uses (same endpoint and
      payload shape), without the single-result redirect, so the page never opens empty.
      PI and RPI only: search() has no SRPI branch. */
  loadDefaultList() {
    if (this.STATUS != 'PI' && this.STATUS != 'RPI') { return; }
    const to = new Date();
    const from = new Date(to.getFullYear(), to.getMonth(), to.getDate() - 30);
    const _jsonData: any = {
      PUR_CODE: "",
      PUR_SUPPLIER: "0",
      PUR_INVNO: "",
      PUR_JOBNO: "",
      AMOUNT: "",
      FROMDATE: this.fmtDate(from),
      TODATE: this.fmtDate(to),
      citycode: this._loginService.getLogin()[0].CITYCODE,
      cmp_code: this._loginService.getLogin()[0].CMPCODE,
      TYPE: "Date",
      DISPLAYTYPE: this.Display,
      YEAR_ID: this._loginService.getLogin()[0].FINANCIAL_YEAR.YEARID,
      FIN_STARTDATE: this._loginService.getLogin()[0].FINANCIAL_YEAR.STARTDATE,
      FIN_ENDDATE: this._loginService.getLogin()[0].FINANCIAL_YEAR.ENDDATE,
    };
    let api = "Accounts/ACC_PURCHASE_SEARCH_PI";
    if (this.STATUS == 'RPI') {
      _jsonData.USERID = this._loginService.getLogin()[0].CMPID;
      _jsonData.STATUS = this.STATUS;
      api = "Accounts/ACC_PURCHASE_SEARCH_RPI";
    }
    this.loading = true;
    this.loadError = false;
    this._dataService.getData(api, _jsonData)
      .subscribe((data: any) => {
        this.loading = false;
        this.searchList = (data && data.Table) ? data.Table : [];
        this.afterResults(true);
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

  private afterResults(isDefault: boolean = false) {
    this.isDefaultList = isDefault;
    this.loadError = false;
    this.printarray = [];
    this.checkbox = false;
    this.Quick = '';
    this.page = 1;
  }

  clearResults() {
    this.displayType = 'SEARCH';
    this.searchList = [];
    this.printarray = [];
    this.checkbox = false;
    this.Quick = '';
    this.page = 1;
    this.isDefaultList = false;
  }

  // ---------- row accessors (PI rows are lower-case, RPI / SRPI rows upper-case) ----------
  rowCode(r: any) { return r.pur_code || r.PUR_CODE || ''; }
  rowDate(r: any) { return r.pur_date || r.PUR_DATE || ''; }
  rowSupplier(r: any) { return r.supplier || r.SUPPLIER || ''; }
  rowInvNo(r: any) { return r.pur_invno || r.PUR_INVNO || ''; }
  rowAmount(r: any) { return (r.totalamt !== undefined && r.totalamt !== null) ? r.totalamt : r.TOTALAMT; }

  get Filtered(): Array<any> {
    const list: Array<any> = Array.isArray(this.searchList) ? this.searchList : [];
    const q = (this.Quick || '').trim().toLowerCase();
    if (!q) { return list; }
    return list.filter(r =>
      [this.rowCode(r), this.rowDate(r), this.rowSupplier(r), this.rowInvNo(r), this.rowAmount(r)]
        .some(v => String(v === undefined || v === null ? '' : v).toLowerCase().indexOf(q) >= 0));
  }

  onQuick() {
    this.page = 1;
  }

  // ---------- pagination ----------
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

  // ---------- export ----------
  exportCsv() {
    const head = ['Purchase code', 'Purchase date', this.STATUS == 'SRPI' ? 'Staff' : 'Supplier', 'Supp inv no', 'Amount'];
    const rows = this.Filtered.map(r => [this.rowCode(r), this.rowDate(r), this.rowSupplier(r), this.rowInvNo(r), this.rowAmount(r)]);
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
    a.download = 'purchases-' + stamp + '.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}