import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { LoginService } from '../../../shared/service/loginService';
import { ToastCommonService } from '../../../shared/service/toastService';
import { IMyDpOptions } from 'mydatepicker';
import { LoaderService } from '../../../shared/service/loader.service';
import { HttpClient } from '@angular/common/http';
import { DataService } from 'src/app/shared/service/dataService';
@Component({
    selector: 'app-invoiceprint',
    templateUrl: './invoiceprint.component.html',
    // Page kit is global (src/styles/kit); air-frt-inv-page.css is MP's area sheet, copied locally.
    styleUrls: ['./air-frt-inv-page.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class InvoiceprintComponent implements OnInit {
  Header:string="AirFreight-invoice-generate"
  tabledata0: any=[];
  loading: boolean = false;
  loadError: string = '';
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
    if (this._loginService.getLogin()[0].CMPCODE!="02"){
      this._toasterService.toast("warning", "warning", "Please Prepare Share of profit In Freight Service Login !!")
      this._router.navigateByUrl("/accounts")
      return false;
    }

    this.loaderService.display(true)
    const jsoncmp = {
      cmpid: this._loginService.getLogin()[0].CMPID,
      MakerIP: this._loginService.getLogin()[0].MAKERIP,
      cmpcode: this._loginService.getLogin()[0].CMPCODE,
      citycode: this._loginService.getLogin()[0].CITYCODE,
      citycode1: this._loginService.getLogin()[0].CITYCODE1,
    }
    this.verifyPermission('345','Add')
    this.loading = true
    this.loadError = ''
    this._dataService.getData("Accounts/ACC_INV_MAWB_AIRFRT_CONS_PUR_PAGELOAD", jsoncmp)
      .subscribe((data: any) => {  
          this.loading = false
          this.tabledata0=data.Table
          this.loaderService.display(false)
      }, (err: any) => {
          // no error arm before: a failed load left the loader spinning over an empty page
          this.loading = false
          this.loadError = (err && (err.message || err.statusText)) || 'request failed'
          this.loaderService.display(false)
      })
  }
  verifyPermission(formId, userMode) {
    this.loaderService.display(true);
    this._loginService.verifyRights(formId, '')
        .subscribe((data: any) => {               
           this._loginService.checkVerify(userMode, data);          
        });
}
  viewdetail(logID,MAWBNO){
   // if(FRT == "PP"){
    this.loaderService.display(true)
    const jsoncmp1 = {
      FK_LOGID: logID,
      MAWBNO:MAWBNO,
      CMPID: this._loginService.getLogin()[0].CMPID
    }
      
    this._dataService.getData("Accounts/ACC_INV_MAWB_AIRFRT_CN_SHAREOFPROFIT_CONS_PUR", jsoncmp1)
      .subscribe((data: any) => {      
       if (data.Table[0].STATUS == "100") {
          this.tabledata0=data.Table
          this.loaderService.display(false)
          this._router.navigateByUrl("/accounts/transaction/airfrtinvoice/airfrtinvoice-detailstab/"+ logID)
       }
       else {
          this._toasterService.toast("warning", "warning", data.Table[0].STATUSTEXT)
          this.loaderService.display(false);
          return false;
       }
      }) 
  }



  /* ---- kit pager + export (additive; data loading and actions unchanged) ---- */
  readonly pageSize = 10;
  page: number = 1;
  get allRows(): any[] { return (this.tabledata0) || []; }
  get pageCount(): number { return Math.max(1, Math.ceil(this.allRows.length / this.pageSize)); }
  get pg(): number { return Math.min(Math.max(1, this.page), this.pageCount); }
  get pageRows(): any[] { const st = (this.pg - 1) * this.pageSize; return this.allRows.slice(st, st + this.pageSize); }
  get rangeStart(): number { return this.allRows.length ? (this.pg - 1) * this.pageSize + 1 : 0; }
  get rangeEnd(): number { return Math.min(this.pg * this.pageSize, this.allRows.length); }
  get pageList(): number[] {
    const n = this.pageCount, p = this.pg;
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
  stripHtml(v: any): string { return String(v === null || v === undefined ? '' : v).replace(/<br\s*\/?>/gi, ' / ').replace(/<[^>]*>/g, '').trim(); }
  exportCsv() {
    const head = ['Invoice Date', 'EURO 1=INR', 'MAWB No.', 'MAWB DT', 'Plan Flt DT', 'MAWB FRT', 'MAWB GW', 'MAWB CW', 'MAWB Rate', 'HAWB No.', 'CW GW', 'HAWB Rate', 'Console No.'];
    const rows = this.allRows.map(r => [r.INV_DATE, r.EXCH_RATE, r.MAWBNO, r.MAWBDT, r.PLAN_FLIGHTDT, r.MAWB_FRT, r.MAWB_GW, r.MAWB_CW, r.MAWB_RATE, r.HAWBNO, r.HAWB_CW_GW, r.HAWB_RATE, r.CONSOLENO].map(v => this.stripHtml(v)));
    const q = (v: any) => '"' + String(v).replace(/"/g, '""') + '"';
    const csv = [head, ...rows].map(line => line.map(q).join(',')).join('\r\n');
    const d = new Date();
    const stamp = d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'air-freight-invoice-' + stamp + '.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}
