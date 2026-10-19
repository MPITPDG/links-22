import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IMyDpOptions } from 'mydatepicker';
import { AuthService } from 'src/app/shared/service/authService';
import { DataService } from 'src/app/shared/service/dataService';
import { LoaderService } from 'src/app/shared/service/loader.service';
import { LoginService } from 'src/app/shared/service/loginService';
import { ToastCommonService } from 'src/app/shared/service/toastService';

@Component({
    selector: 'app-cheque-stock-search',
    templateUrl: './Cheque-Stock-search.component.html',
    // Page kit is global (src/styles/kit); kit-cheque scopes cheque-page.css.
    host: { class: 'kit-cheque' },
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class ChequeStockSearchComponent implements OnInit {
  public searchString: string;
  Header: string = "cheque printing - search"
  OurBankList: any = []       
  OurBank: string = ""
  Searchdata_list: any = []
  displayType = "SEARCH"
  searchHeaderText: string = "Cheque Stock List"
  readonly pageSize = 10;
  page: number = 1;
  loading: boolean = false;
  loadError: boolean = false;
  constructor(
    private _router: Router,
    private _dataService: DataService,
    private _auth: AuthService, private _activatedRoute: ActivatedRoute,
    private _toasterService: ToastCommonService,
    private _loginService: LoginService,
    private _loaderService: LoaderService,
  ) { }
  ngOnInit() {
    //console.log( this._loginService.getLogin())
    this._loaderService.display(true)

    this.verifyPermission('90', 'View')
    const jsoncmp = {
      cmpcode: this._loginService.getLogin()[0].CMPCODE,
      citycode: this._loginService.getLogin()[0].CITYCODE,
      citycode1: this._loginService.getLogin()[0].CITYCODE1,
    }
    // console.log(jsoncmp)
    this._dataService.getData("Accounts/ACC_CHEQUESTOCK_FILLOURBANK", jsoncmp)
      .subscribe((data: any) => {
        //      console.log(data)
        this.OurBankList = data.Table
        this._loaderService.display(false)
        // default list on open: the stock of the first of our banks (the list API needs a bank)
        if (!this.OurBank && this.OurBankList && this.OurBankList.length) {
          this.OurBank = this.OurBankList[0].ACCTCODENAME
          this.searchchq(true)
        }
      })

  }
  verifyPermission(formId, userMode) {
    this._loaderService.display(true);
    this._loginService.verifyRights(formId, '')
      .subscribe((data: any) => {
        this._loginService.checkVerify(userMode, data);
        this._loaderService.display(false);

      });
  }
  searchchq(isDefault: boolean = false) {

    if (this.OurBank == "" || this.OurBank == undefined) {
      alert("Please Select Our Bank.")
      return false
    }
    this._loaderService.display(true)
    this.loading = true
    this.loadError = false
    const jsoncmp = {
      CMPCODE: this._loginService.getLogin()[0].CMPCODE,
      CITYCODE: this._loginService.getLogin()[0].CITYCODE,
      CHEQUNO: this.OurBank,
      BANK:"",
    }
    //  console.log(jsoncmp)
    this._dataService.getData("Accounts/ACC_CHEQUESTOCK_LIST", jsoncmp)
      .subscribe((data: any) => {
        //   console.log(data)
        this._loaderService.display(false)
        this.loading = false
        this.page = 1
        if (data.Table.length == "0") {
          this.Searchdata_list = []
          if (!isDefault) { this._toasterService.toast("success", "success", "No Records Found") }
             return false
        } else {
          this.Searchdata_list = data.Table
          this.displayType = "LIST"
        }
      }, () => {
        this._loaderService.display(false)
        this.loading = false
        this.loadError = true
      })
  }

  resetchequestock() {
    this.OurBank = ""
  }

  get Quick(): string { return this.searchString; }
  set Quick(v: string) { this.searchString = v; }

  // ---------- list: quick filter, 10/page pager, CSV export (presentation only) ----------
  get Filtered(): Array<any> {
      const q = (this.Quick || '').trim().toLowerCase();
      const list: Array<any> = (this.Searchdata_list) || [];
      if (!q) { return list; }
      return list.filter((r: any) => [r.ChequeNo, r.bank_code, r.BP_Num, r.BP_EntryNo, r.Status, r.Reason, r.PrintedBY, r.PrintedOn].some(v => String(v == null ? '' : v).toLowerCase().indexOf(q) >= 0));
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
  exportCsv() {
      const head = ['Cheque no', 'Bank code', 'Request BP no', 'BP entry no', 'Status', 'Reason', 'Printed by', 'Printed on'];
      const rows = this.Filtered.map((r: any) => [r.ChequeNo, r.bank_code, r.BP_Num, r.BP_EntryNo, r.Status, r.Reason, r.PrintedBY, r.PrintedOn]);
      const q = (v: any) => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
      const csv = [head, ...rows].map((l: any[]) => l.map(q).join(',')).join('\r\n');
      const d = new Date();
      const stamp = d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'cheque-stock' + '-' + stamp + '.csv';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}
