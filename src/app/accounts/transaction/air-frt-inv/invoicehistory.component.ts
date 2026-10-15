import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { LoginService } from '../../../shared/service/loginService';
import { ToastCommonService } from '../../../shared/service/toastService';
import { IMyDpOptions } from 'mydatepicker';
import { LoaderService } from '../../../shared/service/loader.service';
import { HttpClient } from '@angular/common/http';
import { DataService } from 'src/app/shared/service/dataService';
@Component({
    selector: 'app-invoicehistory',
    templateUrl: './invoicehistory.component.html',
    // Page kit is global (src/styles/kit); air-frt-inv-page.css is MP's area sheet, copied locally.
    styleUrls: ['./air-frt-inv-page.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class InvoicehistoryComponent implements OnInit {
  Header:string="AIRFREIGHT - INVOICE - HISTORY"
  tablehistry: any = [];
  loading: boolean = true;
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
  //  this.loaderService.display(true)
    const jsoncmp = {
      cmpid: this._loginService.getLogin()[0].CMPID,
      cmpcode: this._loginService.getLogin()[0].CMPCODE,
      citycode1: this._loginService.getLogin()[0].CITYCODE1,
    }
       console.log(jsoncmp)
    this._dataService.getData("Accounts/ACC_INV_MAWB_AIRFRT_CONS_PUR_LIST", jsoncmp)
      .subscribe((data: any) => {
        console.log(data)
          this.loading = false
          this.tablehistry=data.Table
         // this.loaderService.display(false)
      }, (err: any) => {
          this.loading = false
          this.loadError = (err && (err.message || err.statusText)) || 'request failed'
      })
  }

  InvoicePrint(Invoiceno) {
    if(Invoiceno ==''||Invoiceno==undefined){
      alert(" Invoice No. cannot be Blank!")
      return false
    }
    let theTop = (screen.height / 2) - (483 / 2);
    let theLeft = (screen.width / 2) - (780 / 2);
    let toolbar = 'resizable=no,scrollbars=no,width=800,height=450,status=no,left=' + theLeft + ',top=' + theTop;
   // window.open('./#/popup/Account-Invoice-print/' + Invoiceno + '/' , "Invoice Print", toolbar);
   let URL = "http://180.179.207.163/Linkserp-ac/UI/Accounts/frm_Acc_Tran_Invoice_Print.aspx?" +
          "huhpnk=" + this._loginService.getLogin()[0].GUID
          + "&citycode=" + this._loginService.getLogin()[0].CITYCODE1
          + "&Userid=" + this._loginService.getLogin()[0].CMPID
          + "&cmp_code=" + this._loginService.getLogin()[0].CMPCODE
          + "&InvoiceNo=" + Invoiceno
          + "&DisplayMode=" + "0"
          +"&cmp_username=" + this._loginService.getLogin()[0].CMP_USERNAME
              window.open(URL,  "Invoice Print", toolbar);
              return false;
  }

  CreditNotePrint(creditno) {
    if(creditno ==''||creditno==undefined ){
      alert("CreditNote No. cannot be Blank !")
      return false
    }
    let theTop = (screen.height / 2) - (483 / 2);
    let theLeft = (screen.width / 2) - (780 / 2);
    let toolbar = 'resizable=no,scrollbars=no,width=800,height=450,status=no,left=' + theLeft + ',top=' + theTop;
    window.open('./#/popup/Account-CreditNote-print/' + creditno + '/' , "CreditNote Print", toolbar);
  }

  PurchasePrint(puchaseno) {
    if(puchaseno ==''||puchaseno==undefined){
      alert("Purchase No. cannot be Blank!")
      return false
    }
    let theTop = (screen.height / 2) - (483 / 2);
    let theLeft = (screen.width / 2) - (780 / 2);
    let toolbar = 'resizable=no,scrollbars=no,width=800,height=450,status=no,left=' + theLeft + ',top=' + theTop;
    window.open('./#/popup/Account-PurchasePrint-InvoiceHistory/' + puchaseno + '/' , "Console Purchase Print", toolbar);
  }

  /* ---- kit pager + export (additive; data loading and actions unchanged) ---- */
  readonly pageSize = 10;
  page: number = 1;
  get allRows(): any[] { return (this.tablehistry) || []; }
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
    const head = ['Frt.Inv No', 'Frt.Inv Dt', 'Profit Share No', 'Profit Share Dt', 'Frt.Pur No', 'Profit Share Pur No', 'Pur Dt', 'Exch. Rate', 'Console No', 'MAWB No', 'MAWB Dt', 'Created By', 'Created On'];
    const rows = this.allRows.map(r => [r.IND_INV_NO, r.INV_DATE, r.IND_CN_NO, r.CN_DATE, r.CONS_PURCODE, r.CN_CONS_PURCODE, r.CONS_PURDT, r.EXCH_RATE, r.CONSOLENO, r.MAWBNO, r.MAWBDT, r.FULLNAME, r.CREATEDON].map(v => this.stripHtml(v)));
    const q = (v: any) => '"' + String(v).replace(/"/g, '""') + '"';
    const csv = [head, ...rows].map(line => line.map(q).join(',')).join('\r\n');
    const d = new Date();
    const stamp = d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'air-freight-invoice-history-' + stamp + '.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}
