import { HttpClient } from '@angular/common/http';
import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DataService } from 'src/app/shared/service/dataService';
import { LoaderService } from 'src/app/shared/service/loader.service';
import { LoginService } from 'src/app/shared/service/loginService';
import { ToastCommonService } from 'src/app/shared/service/toastService';

/*
 * Job Profit statement (popup) - /popup/Account-Job-Profit-Report/:jobno
 *
 * Same API and proc as before (Accounts/ACC_RPT_JOBPROFITS_JOBWISE -> USP_ACCT_RPT_JOB_PROFIT);
 * every figure shown is the proc's own figure. The page only re-arranges them:
 *   Table  : company heading lines          Table1 : job / invoice header
 *   Table2 : expense-head groups + totals   Table3 : voucher lines (TACCTCODE -> group)
 *   Table4 : grand totals + Gain/Loss       Table5/6 : per-company summary
 */
@Component({
  selector: 'app-singlejobno-report',
  templateUrl: './singlejobno-report.component.html',
  styleUrls: ['./singlejobno-report.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class SinglejobnoReportComponent implements OnInit {
  JobNo: any = '';
  table0: any = {};
  table1: any = {};
  table2: any[] = [];
  table3: any[] = [];
  table4: any = {};
  table5: any[] = [];
  table6: any[] = [];

  Loaded = false;
  NoData = false;

  /* voucher lines pre-grouped by expense head, sorted by date then voucher no */
  LinesByGroup: { [acct: string]: any[] } = {};
  GroupOpen: { [acct: string]: boolean } = {};

  /* KPI strip, derived once from Table4 */
  Income = 0;
  Expense = 0;
  Profit = 0;
  MarginPct: number = null;

  /* status + plain-language insights (derived, nothing recomputed from the proc) */
  Status: 'PROVISIONAL' | 'NOT-BILLED' | 'LOSS' | 'HEALTHY' | 'EMPTY' = 'EMPTY';
  Insights: { kind: 'warn' | 'bad' | 'ok' | 'info', text: string }[] = [];

  constructor(
    private _dataService: DataService,
    private _toasterService: ToastCommonService,
    private _loaderService: LoaderService,
    private _router: Router,
    private http: HttpClient,
    private _route: ActivatedRoute,
    private _loginService: LoginService,
  ) { }

  ngOnInit() {
    this._route.params.subscribe(params => {
      this.JobNo = params['jobno'];
      this.getData();
    });
  }

  getData() {
    const jsoncmp = { JOBNO: this.JobNo };
    this.Loaded = false;
    this.NoData = false;
    this._dataService.getData('Accounts/ACC_RPT_JOBPROFITS_JOBWISE', jsoncmp).subscribe((data: any) => {
      this.Loaded = true;
      if (!data || !data.Table || data.Table.length === 0) { this.NoData = true; return; }

      this.table0 = data.Table[0] || {};
      this.table1 = (data.Table1 && data.Table1.length) ? data.Table1[0] : {};
      this.table2 = data.Table2 || [];
      this.table3 = data.Table3 || [];
      this.table4 = (data.Table4 && data.Table4.length) ? data.Table4[0] : {};
      this.table5 = data.Table5 || [];
      this.table6 = data.Table6 || [];

      /* group the lines ONCE (the old template filtered the whole list inside every group) */
      this.LinesByGroup = {};
      for (const l of this.table3) {
        const k = (l.TACCTCODE || '').toString().trim();
        if (!this.LinesByGroup[k]) { this.LinesByGroup[k] = []; }
        this.LinesByGroup[k].push(l);
      }
      for (const k of Object.keys(this.LinesByGroup)) {
        this.LinesByGroup[k].sort((a, b) =>
          this.ymd(a.TDATE).localeCompare(this.ymd(b.TDATE))
          || (a.TTYPE || '').localeCompare(b.TTYPE || '')
          || (a.TCODE || '').toString().localeCompare((b.TCODE || '').toString()));
      }
      this.GroupOpen = {};
      for (const g of this.table2) { this.GroupOpen[(g.ACCTCODE || '').toString().trim()] = true; }

      this.Income = this.num(this.table4.GRAND_RECOVERYAMT);
      this.Expense = this.num(this.table4.GRAND_PAIDAMT);
      this.Profit = this.num(this.table4.GRAND_DIFFAMT);
      this.MarginPct = this.Income !== 0 ? (this.Profit / this.Income) * 100 : null;
      this.buildInsights();
    }, () => {
      this.Loaded = true;
      this.NoData = true;
    });
  }

  /* ---------- status & insights ---------- */
  private buildInsights() {
    const ins: any[] = [];
    const heads = this.table2 || [];
    const costOnly  = heads.filter(g => this.num(g.PAIDAMT) > 0.01 && this.num(g.RECOVERYAMT) <= 0.01);
    const billOnly  = heads.filter(g => this.num(g.RECOVERYAMT) > 0.01 && this.num(g.PAIDAMT) <= 0.01);
    const lossHeads = heads.filter(g => this.isLoss(g.REMARKS) || this.groupDiff(g) < -0.01);

    if (this.Income <= 0.01 && this.Expense <= 0.01) {
      this.Status = 'EMPTY';
      ins.push({ kind: 'info', text: 'Nothing has been billed or booked on this job yet.' });
    } else if (this.Expense <= 0.01 && this.Income > 0.01) {
      this.Status = 'PROVISIONAL';
      ins.push({ kind: 'warn', text: 'No expense has been booked on this job yet. The profit and margin shown are PROVISIONAL - '
        + 'they will fall once purchase / payment vouchers for this job are entered.' });
    } else if (this.Income <= 0.01 && this.Expense > 0.01) {
      this.Status = 'NOT-BILLED';
      ins.push({ kind: 'warn', text: 'Cost of ' + this.fmt(this.Expense) + ' is booked but nothing has been invoiced yet - this job is UNBILLED.' });
    } else if (this.Profit < -0.01) {
      this.Status = 'LOSS';
      ins.push({ kind: 'bad', text: 'This job is running at a LOSS of ' + this.fmt(Math.abs(this.Profit)) + ' (' + this.fmtPct(this.MarginPct) + ').' });
    } else {
      this.Status = 'HEALTHY';
      if (this.MarginPct !== null && this.MarginPct >= 90) {
        ins.push({ kind: 'warn', text: 'Margin of ' + this.fmtPct(this.MarginPct) + ' is unusually high - check whether all costs for this job have been booked.' });
      } else {
        ins.push({ kind: 'ok', text: 'Profit of ' + this.fmt(this.Profit) + ' (' + this.fmtPct(this.MarginPct) + ' margin) on income of ' + this.fmt(this.Income) + '.' });
      }
    }
    if (this.Status !== 'PROVISIONAL' && billOnly.length) {
      ins.push({ kind: 'warn', text: billOnly.length + ' head' + (billOnly.length > 1 ? 's' : '') + ' billed with no cost booked yet: '
        + billOnly.slice(0, 4).map(g => (g.ACCTNAME || '').toString().trim()).join(', ') + (billOnly.length > 4 ? ' ...' : '') + '.' });
    }
    if (this.Status !== 'NOT-BILLED' && costOnly.length) {
      ins.push({ kind: 'warn', text: costOnly.length + ' head' + (costOnly.length > 1 ? 's' : '') + ' with cost but nothing billed: '
        + costOnly.slice(0, 4).map(g => (g.ACCTNAME || '').toString().trim()).join(', ') + (costOnly.length > 4 ? ' ...' : '') + '.' });
    }
    if (lossHeads.length && this.Status !== 'LOSS') {
      ins.push({ kind: 'bad', text: lossHeads.length + ' loss-making head' + (lossHeads.length > 1 ? 's' : '') + ': '
        + lossHeads.slice(0, 4).map(g => (g.ACCTNAME || '').toString().trim()).join(', ') + (lossHeads.length > 4 ? ' ...' : '') + '.' });
    }
    this.Insights = ins;
  }
  /* ------------------------------------------------------------------
     Parties on the job.

     A job has an EXPORTER / IMPORTER and a BILL-TO party from the moment it is
     opened, long before anyone raises an invoice. Until today this page could only
     show EXP_NAME, which comes off the invoice - so an unbilled job showed a blank
     where the customer's name should be, on the one report the accounts team opens
     BEFORE posting entries. These read the job master fields (EXPT_MASTER
     expt_exporter / expt_billto, TBL_IMP_IMPORT fk_Imp_Code / fk_BillTo) that the
     proc now returns alongside the invoice block.

     Every one degrades to '-' if the proc has not been redeployed yet.
  ------------------------------------------------------------------ */
  private txt(v): string { return (v === null || v === undefined) ? '' : v.toString().trim(); }

  ExporterName(): string { return this.txt(this.table1.EXPORTER_NAME); }
  BillToName(): string   { return this.txt(this.table1.BILLTO_NAME); }

  /* The name to headline. The invoice client is the truth once a bill exists;
     before that the bill-to party is who we intend to charge, and the exporter is
     the last resort. */
  ClientName(): string {
    return this.txt(this.table1.EXP_NAME) || this.BillToName() || this.ExporterName() || '-';
  }
  /* Where that name came from, so the page never passes off a job-master name as an
     invoiced one. */
  ClientSource(): string {
    if (this.txt(this.table1.EXP_NAME)) { return ''; }
    if (this.BillToName())   { return 'from job - bill to party'; }
    if (this.ExporterName()) { return 'from job - exporter'; }
    return '';
  }
  IsBilled(): boolean { return !!this.txt(this.table1.INV_NO); }

  /* JOB_SOURCE tells us which master the job came from, so the party gets its real
     name instead of the "Exporter / Importer" hedge. */
  PartyLabel(): string {
    switch (this.txt(this.table1.JOB_SOURCE).toUpperCase()) {
      case 'EXPORT': return 'Exporter';
      case 'IMPORT': return 'Importer';
      default:       return 'Exporter / Importer';
    }
  }

  /* exporter and bill-to are the same party on most jobs - only worth two lines
     when they actually differ */
  ShowBothParties(): boolean {
    const e = this.ExporterName(), b = this.BillToName();
    return !!e && !!b && e.toUpperCase() !== b.toUpperCase();
  }

  statusLabel(): string {
    switch (this.Status) {
      case 'PROVISIONAL': return 'Provisional - costs pending';
      case 'NOT-BILLED':  return 'Unbilled - costs booked';
      case 'LOSS':        return 'Loss';
      case 'HEALTHY':     return 'Profitable';
      default:            return 'No activity';
    }
  }
  statusClass(): string {
    switch (this.Status) {
      case 'PROVISIONAL': case 'NOT-BILLED': return 'jp-status--warn';
      case 'LOSS':    return 'jp-status--bad';
      case 'HEALTHY': return 'jp-status--ok';
      default:        return 'jp-status--muted';
    }
  }
  /* share of income kept as profit / spent as expense, for the proportion bar (clamped 0..100) */
  expenseShare(): number {
    if (this.Income <= 0) { return this.Expense > 0 ? 100 : 0; }
    const p = (this.Expense / this.Income) * 100;
    return p < 0 ? 0 : p > 100 ? 100 : p;
  }
  /* per-head mini bar: expense as % of the bigger of the two */
  headBar(g: any): { exp: number, inc: number } {
    const e = this.num(g.PAIDAMT), i = this.num(g.RECOVERYAMT), m = Math.max(e, i, 0.01);
    return { exp: (e / m) * 100, inc: (i / m) * 100 };
  }
  fmt(v: any): string {
    return this.num(v).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  fmtPct(v: any): string { return v === null || v === undefined ? '-' : this.num(v).toFixed(1) + ' %'; }
  fmtQty(v: any): string {
    const n = this.num(v);
    return n === 0 && (v === null || v === undefined || v === '') ? '-' : n.toLocaleString('en-IN', { maximumFractionDigits: 2 });
  }

  /* ---------- "pending only" filter: heads where billing or cost entry is still missing ---------- */
  PendingOnly = false;
  isPending(g: any): boolean { return this.num(g.PAIDAMT) <= 0.01 || this.num(g.RECOVERYAMT) <= 0.01; }
  pendingCount(): number { return (this.table2 || []).filter(g => this.isPending(g)).length; }
  visibleHeads(): any[] { return this.PendingOnly ? (this.table2 || []).filter(g => this.isPending(g)) : (this.table2 || []); }

  /* ---------- template helpers ---------- */
  linesFor(acct: any): any[] {
    return this.LinesByGroup[(acct || '').toString().trim()] || [];
  }
  isOpen(acct: any): boolean { return this.GroupOpen[(acct || '').toString().trim()] !== false; }
  toggle(acct: any) {
    const k = (acct || '').toString().trim();
    this.GroupOpen[k] = !this.isOpen(k);
  }
  setAll(open: boolean) {
    for (const g of this.table2) { this.GroupOpen[(g.ACCTCODE || '').toString().trim()] = open; }
  }
  allOpen(): boolean { return this.table2.every(g => this.isOpen(g.ACCTCODE)); }

  /* the proc writes "Gain: 3750.00" / "Loss: 300.00" in REMARKS */
  isLoss(remarks: any): boolean { return (remarks || '').toString().toUpperCase().indexOf('LOSS') >= 0; }
  isGain(remarks: any): boolean { return (remarks || '').toString().toUpperCase().indexOf('GAIN') >= 0; }
  groupDiff(g: any): number { return this.num(g.RECOVERYAMT) - this.num(g.PAIDAMT); }

  num(v: any): number {
    if (v === null || v === undefined || v === '') { return 0; }
    const n = parseFloat(v.toString().replace(/,/g, ''));
    return isNaN(n) ? 0 : n;
  }
  /* dd/MM/yyyy -> yyyyMMdd for sorting */
  private ymd(d: any): string {
    const s = (d || '').toString();
    return s.length === 10 ? s.substr(6, 4) + s.substr(3, 2) + s.substr(0, 2) : s;
  }

  /* ERP voucher-type abbreviations -> full name (tooltip on the pill) */
  vchName(t: any): string {
    switch ((t || '').toString().toUpperCase().trim()) {
      case 'II': return 'Invoice';
      case 'SI': return 'Storage Invoice';
      case 'BI': return 'Brokerage Invoice';
      case 'CN': return 'Credit Note';
      case 'PI': return 'Purchase Invoice';
      case 'BP': return 'Bank Payment';
      case 'BR': return 'Bank Receipt';
      case 'CP': return 'Cash Payment';
      case 'CR': return 'Cash Receipt';
      case 'CE': return 'Cash Expense';
      case 'JV': return 'Journal Voucher';
      default:   return (t || '').toString();
    }
  }
  vchClass(t: any): string {
    switch ((t || '').toString().toUpperCase().trim()) {
      case 'II': case 'SI': case 'BI': return 'jp-pill--income';
      case 'CN':                       return 'jp-pill--cn';
      case 'PI':                       return 'jp-pill--pi';
      case 'JV':                       return 'jp-pill--jv';
      default:                         return 'jp-pill--bank';
    }
  }

  /* the @media print rules in the component CSS do the layout */
  Print() { window.print(); }

  invoiceprint(No, Type) {
    let theTop = (screen.height / 2) - (483 / 2);
    let theLeft = (screen.width / 2) - (780 / 2);
    let toolbar = 'resizable=no,scrollbars=no,width=800,height=450,status=no,left=' + theLeft + ',top=' + theTop;

    if (Type == "II") {
     // window.open('./#/popup/Account-Invoice-print/' + No + '/' , "Invoice Print", toolbar);
     let URL = "http://180.179.207.163/Linkserp-ac/UI/Accounts/frm_Acc_Tran_Invoice_Print.aspx?" +
        "huhpnk=" + this._loginService.getLogin()[0].GUID
        + "&citycode=" + this._loginService.getLogin()[0].CITYCODE1
        + "&Userid=" + this._loginService.getLogin()[0].CMPID
        + "&cmp_code=" + this._loginService.getLogin()[0].CMPCODE
        + "&InvoiceNo=" + No
        + "&DisplayMode=" + "0"
        + "&cmp_username=" + this._loginService.getLogin()[0].CMP_USERNAME
            window.open(URL,  "Invoice Print", toolbar);
            return false;
    }
    else if (Type == "PI") {
      window.open('./#/popup/Account-Purchase-print/' + No.replace("'", "") + '/'  + "PI" + '/', "PI Print", toolbar);
    }
    else if (Type == "JV") {
      window.open('./#/popup/Account-JV-Print/' + No + '/' + "JV" + '/' , "JV Print", toolbar);
    }
    else if (Type == "CN") {
      window.open('./#/popup/Account-CreditNote-Print/' + No.replace("'", "") + '/' , "CN Print", toolbar);
    }
    else if (Type == "SI") {  return false;  }
    else if (Type == "BI") {  return false;  }
    else
        window.open('./#/popup/Account-CashBook-BankReceipt-print/' + Type + '/' + No + '/' , "CASH BOOK - Bank Payment", toolbar);
  }
}
