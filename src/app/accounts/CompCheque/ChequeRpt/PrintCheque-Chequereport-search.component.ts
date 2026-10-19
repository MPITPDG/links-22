import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { IMyDpOptions } from 'mydatepicker';
import { DataService } from '../../../shared/service/dataService';
import { AuthService } from '../../../shared/service/authService';
import { LoginService } from '../../../shared/service/loginService';
import { ToastCommonService } from '../../../shared/service/toastService';
import { LoaderService } from '../../../shared/service/loader.service';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { ExportexcelService } from 'src/app/shared/service/exportexcel.service';
@Component({
    selector: 'app-PrintCheque-Chequereport-search',
    templateUrl: './PrintCheque-Chequereport-search.component.html',
    // Page kit is global (src/styles/kit); kit-cheque scopes cheque-page.css.
    host: { class: 'kit-cheque' },
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})

  export class ChequeReportSearchComponent implements OnInit {
    exampleRadios1: string = 'No';
    exampleRadios2: string = 'B';
    chequeno: string;
    FromNo:string;
    ToNo:string;
    startdate;
    fromvalue;
    tovalue;
    chequetype;
    enddate;Searchdata_list: any = [];
    searchHeaderText: string = '';
    displayType: string = 'SEARCH';
    MSG: string = '';
    dataForExcel = [];
    readonly pageSize = 10;
    page: number = 1;
    Quick: string = '';
    loading: boolean = false;
    loadError: boolean = false;
    public myDatePickerOptions: IMyDpOptions = {
      dateFormat: 'dd-mmm-yyyy',
      inline: false,
      height: '20px',
      width: '130px',
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
  
    constructor(private _dataService: DataService,
      private _toasterService: ToastCommonService,
      private loaderService: LoaderService,
      private http: HttpClient,
      private _activatedRoute: ActivatedRoute,private _router:Router,
      private _loginService: LoginService,
      private exportser: ExportexcelService,
    ) { }
    ngOnInit() {
      // default list on open: date-wise, all cheques, last 30 days (the same report call)
      const mk = (d: Date) => {
        const m = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        return { date: { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() },
                 formatted: String(d.getDate()).padStart(2, '0') + '-' + m[d.getMonth()] + '-' + d.getFullYear() };
      };
      const from = new Date(); from.setDate(from.getDate() - 30);
      this.exampleRadios1 = 'Date';
      this.exampleRadios2 = 'B';
      this.startdate = mk(from);
      this.enddate = mk(new Date());
      this.searchlist();
    }

    searchlist() {
      if (this.exampleRadios1 == "No") {
        if (this.FromNo == "" || this.FromNo == undefined  ) {
          this._toasterService.toast('warning', 'warning', "Please enter From Cheque No to Search !");
          return false;
        }
        else if (this.ToNo == ""  || this.ToNo == undefined ) {
          this._toasterService.toast('warning', 'warning', "Please enter To Cheque No to Search !");
          return false;
        }
      } 
      else if (this.exampleRadios1 == "Date") {
        if (this.startdate ==""  || this.startdate ==undefined)
        {
          this._toasterService.toast('warning', 'warning', "Please select start Date !");
          return false;
        }
        if ( this.enddate=="" || this.enddate==undefined)
        {
          this._toasterService.toast('warning', 'warning', "Please select to Date !");
          return false;
        }
        
  }
  if ( this.exampleRadios1 == "No")
  {
      this.fromvalue=this.FromNo;
      this.tovalue=this.ToNo;
    }   
    if ( this.exampleRadios1 == "Date")
    {
        this.fromvalue=this.startdate.formatted;
        this.tovalue=this.enddate.formatted;
      } 
      this.chequetype=this.exampleRadios2; 
      if(this.chequetype=="P")
      {
      this.searchHeaderText="CHEQUE - REPORT" + " - " + this.fromvalue + " - " + this.tovalue + " [PRINTED]"
      } 
      if(this.chequetype=="B")
      {
      this.searchHeaderText="CHEQUE - REPORT" + " - " + this.fromvalue + " - " + this.tovalue + " [ALL]"
      } 
      if(this.chequetype=="CN")
      {
      this.searchHeaderText="CHEQUE - REPORT" + " - " + this.fromvalue + " - " + this.tovalue + " [CANCELLED BUT NOT PRINTED]"
      } 
      if(this.chequetype=="CR")
      {
      this.searchHeaderText="CHEQUE - REPORT" + " - " + this.fromvalue + " - " + this.tovalue + " [CANCELLED AND REPRINTED]"
      } 
      if(this.chequetype=="C")
      {
      this.searchHeaderText="CHEQUE - REPORT" + " - " + this.fromvalue + " - " + this.tovalue + "  [CANCELLED]"
      } 
      this.loaderService.display(true)
      this.loading = true
      this.loadError = false
      var jsonmaster = {
        SearchType:this.exampleRadios1,
        FromVal:this.fromvalue,
        ToVal:this.tovalue,
        Type:this.exampleRadios2,
        CMPCODE: this._loginService.getLogin()[0].CMPCODE,
        
      }
     // console.log(jsonmaster)
      this._dataService.getData("Accounts/Acc_CMPBP_Cheque_Report", jsonmaster)
        .subscribe((data: any) => {
        //  console.log(data)
        this.displayType = 'LIST';
          this.Searchdata_list = data.Table1
          this.page = 1
          this.loading = false
          this.loaderService.display(false)
        }, () => {
          this.loading = false
          this.loadError = true
          this.loaderService.display(false)
        })
    }

    resetlist()
    {
      this.startdate="";
      this.enddate="";
      this.FromNo="";
      this.ToNo="";
      this.exampleRadios2="B";
      this.exampleRadios1="No";
    }
    ViewReqBPPrint(ReqBPNo)
    {
      if(ReqBPNo.length >=15)
      {
      let theTop = (screen.height / 2) - (483 / 2);
      let theLeft = (screen.width / 2) - (780 / 2);
      let toolbar = 'resizable=no,scrollbars=no,width=800,height=450,status=no,left=' + theLeft + ',top=' + theTop;
      window.open('./#/popup/Account-Request-Bank-Payment-print/' + ReqBPNo + '/' , " Computerised BP View", toolbar);
    } 
    } 
    ViewBPPrint(BPNo)
    {
      if(BPNo.length >=15)
      {
      let theTop = (screen.height / 2) - (483 / 2);
      let theLeft = (screen.width / 2) - (780 / 2);
      let toolbar = 'resizable=no,scrollbars=no,width=800,height=450,status=no,left=' + theLeft + ',top=' + theTop;
      window.open('./#/popup/Account-CashBook-BankReceipt-print/' + 'BP' + '/' + BPNo.slice(1) + '/' , "", toolbar); 
    } 
   } 
   ExportToExcel()
   {
       // start from an empty sheet each time (rows used to pile up on every export)
       this.dataForExcel = [];
       this.Searchdata_list.forEach((row: any) => {
           this.dataForExcel.push(Object.values(row))
           });
           let reportData = {
             data: this.dataForExcel,
             headers: ['CHEQUE NO','CHEQUE DATE','PAYEE NAME','CHEQUE AMOUNT','TYPE','REQ BP NO','REQ BP DATE',
             'BP NO','BP DATE','REQUESTED BY','AUTHORISED BY','AUTHORISED DATE','PRINTED BY','PRINTED ON',
             'REASON','PRINTED CHEQUE','REPRINTED BY','REPRINTED ON','STATUS'
                       ],
             pagetype: "CHEQUEREPORT",
             title:'CHEQUE REPORT FROM ' + this.fromvalue + '  TO '+ this.tovalue   ,
             subtitle:'',
              }
            this.exportser.exportExceltry(reportData, "Chequereport-"+ this.fromvalue + '('+ this.tovalue + ')' );  
       }
  
    get showCancelCols(): boolean { return this.chequetype == 'C' || this.chequetype == 'CR' || this.chequetype == 'B'; }
    // ---------- list: quick filter + 10/page pager (presentation only; Export stays the Excel export) ----------
    get Filtered(): Array<any> {
      const q = (this.Quick || '').trim().toLowerCase();
      const list: Array<any> = this.Searchdata_list || [];
      if (!q) { return list; }
      return list.filter((r: any) => [r.CHEQUENO, r.PAYEENAME, r.REQBPNO, r.BPNO, r.REQUESTEDBY, r.PRINTEDBY, r.STATUS, r.TYPE]
        .some(v => String(v == null ? '' : v).toLowerCase().indexOf(q) >= 0));
    }
    get pageCount(): number { return Math.max(1, Math.ceil(this.Filtered.length / this.pageSize)); }
    get curPage(): number { return Math.min(this.page, this.pageCount); }
    get pageRows(): Array<any> { const s = (this.curPage - 1) * this.pageSize; return this.Filtered.slice(s, s + this.pageSize); }
    get rangeStart(): number { return this.Filtered.length ? (this.curPage - 1) * this.pageSize + 1 : 0; }
    get rangeEnd(): number { return Math.min(this.curPage * this.pageSize, this.Filtered.length); }
    get pageList(): number[] {
      const n = this.pageCount, p = this.curPage;
      if (n <= 7) { return Array.from({ length: n }, (_, i) => i + 1); }
      const out: number[] = [1];
      const lo = Math.max(2, p - 1), hi = Math.min(n - 1, p + 1);
      if (lo > 2) { out.push(0); }
      for (let i = lo; i <= hi; i++) { out.push(i); }
      if (hi < n - 1) { out.push(0); }
      out.push(n);
      return out;
    }
    goPage(p: number) { if (p >= 1 && p <= this.pageCount) { this.page = p; } }
  }
