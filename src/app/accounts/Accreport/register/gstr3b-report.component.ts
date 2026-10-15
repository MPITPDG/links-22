import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { LoginService } from '../../../shared/service/loginService';
import { ToastCommonService } from '../../../shared/service/toastService';
import { IMyDpOptions } from 'mydatepicker';
import { LoaderService } from '../../../shared/service/loader.service';
import { DataService } from 'src/app/shared/service/dataService';
import { ExportexcelService } from 'src/app/shared/service/exportexcel.service';
import { DatePipe } from '@angular/common';

import { FIN_PERIODS, FinPeriod, finRange, finDp } from '../fin-kit';
@Component({
  selector: 'app-gstr3b-report',
  templateUrl: './gstr3b-report.component.html',
    styleUrls: ['./gstr3b-report.component.css'],
    host: { class: 'kit-accreport' },
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class Gstr3bReportComponent implements OnInit {

  public myDatePickerOptions: IMyDpOptions = {
    dateFormat: 'dd-mmm-yyyy',
    inline: false,
    height: '18px',
    width: '180px',
    componentDisabled: false,
    selectionTxtFontSize: '12px',
    editableDateField: false,
    sunHighlight: true,
    satHighlight: true,
    firstDayOfWeek: 'su',
    openSelectorTopOfInput: false,
    openSelectorOnInputClick: true,
    selectorHeight: '180px',
    selectorWidth: '200px',
    disableUntil: { year: 0, month: 0, day: 0 },
    disableSince: { year: 0, month: 0, day: 0 }
  };

  FromDate;
  ToDate;
  Header: string = 'GSTR-3B Report';
  City: string;
  CmpName: string;
  cmpnyname: string;
  PeriodLabel: string = '';

  // result sets returned by USP_ACC_RPT_GSTR3B_BRANCHWISE
  Summary: any[] = [];      // Table  - section wise, per branch
  NetPosition: any[] = [];  // Table1 - liability vs set-off
  LedgerDetail: any[] = []; // Table2 - ledger wise
  Warnings: any[] = [];     // Table3 - reconciliation
  RcmDeferred: any[] = [];  // Table4 - RCM credit availed next month

  Branches: string[] = [];
  EntryTypes: string[] = [];
  ActiveTab: string = 'SUMMARY';
  Searched: boolean = false;

  /* ---------------- filter / sort ----------------
     One entry per tab so switching tabs keeps what was set. The View* arrays are the
     filtered+sorted copies actually bound in the template; they are recomputed on change
     rather than by a method call in *ngFor, which would re-run on every change-detection
     pass. */
  /* branch is a STRING ARRAY - the branch pickers are multiselect. etype is the extra
     multiselect on the warnings tab (PI / II / CN / JV / bank / RCM). */
  Filters: any = {
    SUMMARY: { q: '', branch: [] },
    NET: { q: '', branch: [] },
    RCM: { q: '', branch: [] },
    LEDGER: { q: '', branch: [] },
    WARN: { q: '', branch: [], etype: [] }
  };
  Sorts: any = {
    SUMMARY: { field: '', dir: 1 },
    NET: { field: '', dir: 1 },
    RCM: { field: '', dir: 1 },
    LEDGER: { field: '', dir: 1 },
    WARN: { field: '', dir: 1 }
  };

  /* ---------------- filing archive ---------------- */
  Filings: any[] = [];          // past filings for this company
  OpenFiling: any = null;       // header of the filing being viewed
  FilingLedger: any[] = [];     // its ledger statement, filed vs live
  FilingSummary: any[] = [];    // the 3B figures as filed
  FilingOnlyChanged: boolean = false;

  ViewSummary: any[] = [];
  ViewNet: any[] = [];
  ViewRcm: any[] = [];
  ViewLedger: any[] = [];
  ViewWarn: any[] = [];

  constructor(
    private _dataService: DataService,
    private _toasterService: ToastCommonService,
    private loaderService: LoaderService,
    private _router: Router,
    private exportser: ExportexcelService,
    private _loginService: LoginService,
    private datePipe: DatePipe,
  ) { }

  ngOnInit() {
    this.City = this._loginService.getLogin()[0].CITYNAME;
    this.CmpName = this._loginService.getLogin()[0].CMPNAME;
    this.cmpnyname = this.CmpName;
    this.verifyPermission('419', 'View');
  }

  /* Page rights. Same pattern as the other Accreport pages (specialledger, item-search,
     clientoutstanding-allcity-search): verifyRights is called with an EMPTY entry date, and
     checkVerify redirects to error/access-denied when the right is missing. */
  verifyPermission(formId, userMode) {
    this.loaderService.display(true);
    this._loginService.verifyRights(formId, '')
      .subscribe((data: any) => {
        this._loginService.checkVerify(userMode, data);
        this.loaderService.display(false);
      });
  }

  /** true when both dates are supplied and From is not after To */
  private validate(): boolean {
    if (this.FromDate == '' || this.FromDate == undefined) {
      this._toasterService.toast('error', 'Error', 'From Date cannot be blank !.');
      return false;
    }
    if (this.ToDate == '' || this.ToDate == undefined) {
      this._toasterService.toast('error', 'Error', 'To Date cannot be blank !.');
      return false;
    }
    const f = new Date(this.FromDate.jsdate ? this.FromDate.jsdate : this.FromDate.formatted);
    const t = new Date(this.ToDate.jsdate ? this.ToDate.jsdate : this.ToDate.formatted);
    if (f > t) {
      this._toasterService.toast('error', 'Error', 'From Date cannot be later than To Date !.');
      return false;
    }
    return true;
  }

  /** search screen -> result screen, same flow as the Balance Sheet / P&L pages */
  Submit() {
    if (!this.validate()) { return false; }
    this.loaderService.display(true);
    this.PeriodLabel = this.FromDate.formatted + ' to ' + this.ToDate.formatted;

    // dd-MMM-yyyy is unambiguous - dd/MM/yyyy would be read as MM/dd/yyyy by SQL Server
    const jsondata = {
      FROMDATE: this._dataService.datechnge1(this.FromDate.formatted),
      TODATE: this._dataService.datechnge1(this.ToDate.formatted),
      CMPCODE: this._loginService.getLogin()[0].CMPCODE,
    };

    this._dataService.getData('Accounts/ACC_RPT_GSTR3B_BRANCHWISE', jsondata)
      .subscribe((data: any) => {
        this.Summary = (data && data.Table) ? data.Table : [];
        this.NetPosition = (data && data.Table1) ? data.Table1 : [];
        this.LedgerDetail = (data && data.Table2) ? data.Table2 : [];
        this.Warnings = (data && data.Table3) ? data.Table3 : [];
        this.RcmDeferred = (data && data.Table4) ? data.Table4 : [];

        this.Branches = [];
        this.Summary.forEach(r => {
          if (this.Branches.indexOf(r.BRANCH) === -1) { this.Branches.push(r.BRANCH); }
        });

        // entry types present in this period, for the warnings multiselect
        this.EntryTypes = [];
        this.Warnings.forEach(r => {
          if (r.ENTRY_TYPE && this.EntryTypes.indexOf(r.ENTRY_TYPE) === -1) {
            this.EntryTypes.push(r.ENTRY_TYPE);
          }
        });

        // a fresh search starts from an unfiltered, unsorted view
        ['SUMMARY', 'NET', 'RCM', 'LEDGER', 'WARN'].forEach(k => this.clearFilter(k));

        // land on the warnings when there are any - they change the figures on every other
        // tab, so they should not have to be gone looking for
        this.ActiveTab = this.Warnings.length > 0 ? 'WARN' : 'SUMMARY';
        this.loaderService.display(false);

        // stay on the search screen when there is nothing to show, rather than
        // opening an empty result page
        if (this.Summary.length === 0) {
          this.Searched = false;
          this._toasterService.toast('warning', 'No Data', 'No GST transactions found for this period.');
        } else {
          this.Searched = true;
        }
      }, () => {
        this.loaderService.display(false);
        this._toasterService.toast('error', 'Error', 'Could not load the GSTR-3B report.');
      });
  }

  /* ============================================================================
     FILTER / SORT
     ============================================================================ */

  /** recompute every tab's visible rows - call after a search or any filter/sort change */
  refreshAll() {
    this.ViewSummary = this.apply(this.Summary, 'SUMMARY');
    this.ViewNet = this.apply(this.NetPosition, 'NET');
    this.ViewRcm = this.apply(this.RcmDeferred, 'RCM');
    this.ViewLedger = this.apply(this.LedgerDetail, 'LEDGER');
    this.ViewWarn = this.apply(this.Warnings, 'WARN');
  }

  /** branch filter, then free-text across all columns, then the active sort */
  private apply(rows: any[], key: string): any[] {
    const f = this.Filters[key];
    const s = this.Sorts[key];
    let out = rows || [];

    if (f.branch && f.branch.length) {
      out = out.filter(r => f.branch.indexOf(r.BRANCH) > -1);
    }
    if (f.etype && f.etype.length) {
      out = out.filter(r => f.etype.indexOf(r.ENTRY_TYPE) > -1);
    }

    const q = (f.q || '').trim().toLowerCase();
    if (q) {
      out = out.filter(r => Object.keys(r).some(k =>
        r[k] !== null && r[k] !== undefined && String(r[k]).toLowerCase().indexOf(q) > -1));
    }

    if (s.field) {
      // slice() so the source array keeps the order the report returned it in
      out = out.slice().sort((a, b) => this.compare(a[s.field], b[s.field]) * s.dir);
    }
    return out;
  }

  /** numeric when both sides are numeric, otherwise text - so amounts sort by value */
  private compare(a: any, b: any): number {
    const ae = (a === null || a === undefined || a === '');
    const be = (b === null || b === undefined || b === '');
    if (ae && be) { return 0; }
    if (ae) { return -1; }
    if (be) { return 1; }
    const an = Number(a), bn = Number(b);
    if (!isNaN(an) && !isNaN(bn)) { return an - bn; }
    return String(a).localeCompare(String(b));
  }

  /** click a header: first click ascending, click again to flip, third clears the sort */
  sortBy(key: string, field: string) {
    const s = this.Sorts[key];
    if (s.field !== field) {
      this.Sorts[key] = { field: field, dir: 1 };
    } else if (s.dir === 1) {
      s.dir = -1;
    } else {
      this.Sorts[key] = { field: '', dir: 1 };
    }
    this.refreshAll();
  }

  /** font-awesome class for the little arrow in a sortable header */
  sortIcon(key: string, field: string): string {
    const s = this.Sorts[key];
    if (s.field !== field) { return 'fa fa-sort g3-sort-idle'; }
    return s.dir === 1 ? 'fa fa-sort-asc g3-sort-on' : 'fa fa-sort-desc g3-sort-on';
  }

  clearFilter(key: string) {
    this.Filters[key] = (key === 'WARN')
      ? { q: '', branch: [], etype: [] }
      : { q: '', branch: [] };
    this.Sorts[key] = { field: '', dir: 1 };
    this.refreshAll();
  }

  hasFilter(key: string): boolean {
    const f = this.Filters[key], s = this.Sorts[key];
    return !!(f.q || (f.branch && f.branch.length) || (f.etype && f.etype.length) || s.field);
  }

  /** the summary repeats a branch name only when it changes, so the default (unsorted)
      order still reads as branch blocks, and a sort on another column labels every row */
  showBranch(i: number): boolean {
    return i === 0 || this.ViewSummary[i].BRANCH !== this.ViewSummary[i - 1].BRANCH;
  }

  /** row tint by nature - same colours as the exported workbook */
  rowClass(section: string): string {
    if (!section) { return ''; }
    if (section.indexOf('MEMO') === 0) { return 'g3-memo'; }
    if (section.indexOf('[LIABILITY]') > -1) { return 'g3-liab'; }
    return 'g3-setoff';
  }

  /** total of the rows currently VISIBLE, so it agrees with a branch filter */
  total(field: string): number {
    let t = 0;
    this.ViewNet.forEach(r => t += (r[field] ? Number(r[field]) : 0));
    return t;
  }

  ExportToExcel() {
    if (!this.Searched || this.Summary.length === 0) {
      this._toasterService.toast('error', 'Error', 'Please search the report before exporting.');
      return false;
    }
    this.loaderService.display(true);

    const period = this.FromDate.formatted + ' to ' + this.ToDate.formatted;
    const excelData = {
      title: this.CmpName,
      subtitle: 'GSTR-3B Working (Branch wise)   Period : ' + period,
      summaryHeaders: ['BRANCH', 'SECTION', 'TAXABLE VALUE', 'IGST', 'CGST', 'SGST', 'TOTAL TAX'],
      summaryData: this.Summary.map(r => [r.BRANCH, r.SECTION, r.TAXABLE_VALUE, r.IGST, r.CGST, r.SGST, r.TOTAL_TAX]),

      netHeaders: ['BRANCH', 'LIAB IGST', 'LIAB CGST', 'LIAB SGST', 'LIAB TOTAL',
        'SETOFF IGST', 'SETOFF CGST', 'SETOFF SGST', 'SETOFF TOTAL', 'NET PAYABLE'],
      netData: this.NetPosition.map(r => [r.BRANCH, r.LIAB_IGST, r.LIAB_CGST, r.LIAB_SGST, r.LIAB_TOTAL,
      r.SETOFF_IGST, r.SETOFF_CGST, r.SETOFF_SGST, r.SETOFF_TOTAL, r.NET_PAYABLE]),

      rcmHeaders: ['BRANCH', 'RCM LIABILITY PAID', 'DEFER IGST', 'DEFER CGST', 'DEFER SGST',
        'DEFER TOTAL', 'AVAIL IN MONTH', 'B/F FROM LAST MONTH', 'B/F MONTH'],
      rcmData: this.RcmDeferred.map(r => [r.BRANCH, r.RCM_LIABILITY_PAID, r.DEFER_IGST, r.DEFER_CGST,
      r.DEFER_SGST, r.DEFER_TOTAL, r.AVAIL_IN_MONTH, r.BF_FROM_LAST_MONTH, r.BF_MONTH]),

      ledgerHeaders: ['BRANCH', 'NATURE', 'RCM', 'ACCTCODE', 'LEDGER', 'AMOUNT'],
      ledgerData: this.LedgerDetail.map(r => [r.BRANCH, r.NATURE, r.RCM, r.ACCTCODE, r.LEDGER, r.AMOUNT]),

      warnHeaders: ['TYPE', 'ENTRY NO', 'ENTRY DATE', 'BRANCH', 'PARTY', 'ISSUE', 'SEVERITY',
        'CGST', 'SGST', 'IGST', 'DIFF', 'DETAIL'],
      warnData: this.Warnings.map(r => [r.ENTRY_TYPE, r.ENTRY_NO, r.ENTRY_DATE, r.BRANCH, r.PARTY,
      r.ISSUE, r.SEVERITY, r.CGST, r.SGST, r.IGST, r.DIFF, r.DETAIL]),
    };

    this.exportser.exportGstr3b(excelData, 'GSTR3B_' + this.FromDate.formatted + '_to_' + this.ToDate.formatted);
  }

  /* ============================================================================
     FILING ARCHIVE - proof of what was filed
     ============================================================================ */

  /** archive the period exactly as the server recomputes it */
  MarkAsFiled() {
    if (!this.Searched || this.Summary.length === 0) {
      this._toasterService.toast('error', 'Error', 'Please search the report before marking it filed.');
      return false;
    }
    if (this.Warnings.length > 0 &&
        !confirm('This period still has ' + this.Warnings.length +
                 ' item(s) on Check Before Filing.\n\nFile ' + this.PeriodLabel + ' anyway?')) {
      return false;
    }
    if (!confirm('Archive GSTR-3B for ' + this.PeriodLabel + ' as filed?\n\n' +
                 'The ledger statement is stored as it stands now, so any later change to a ' +
                 'document can be seen against it.')) {
      return false;
    }

    this.loaderService.display(true);
    const jsondata = {
      FROMDATE: this._dataService.datechnge1(this.FromDate.formatted),
      TODATE: this._dataService.datechnge1(this.ToDate.formatted),
      CMPCODE: this._loginService.getLogin()[0].CMPCODE,
      FILEDBY: this._loginService.getLogin()[0].CMP_USERNAME,
      REMARKS: ''
    };

    this._dataService.Common('Accounts/ACC_GSTR3B_FILING_SAVE', jsondata)
      .subscribe((data: any) => {
        this.loaderService.display(false);
        const r = (data && data.Table && data.Table.length) ? data.Table[0] : null;
        if (r) {
          this._toasterService.toast('success', 'Filed',
            'Archived as filing #' + r.FILING_ID + ' (' + r.LEDGER_ROWS + ' ledger rows).');
          this.LoadFilings();
          this.ActiveTab = 'FILED';
        } else {
          this._toasterService.toast('error', 'Error', 'The filing was not archived.');
        }
      }, () => {
        this.loaderService.display(false);
        this._toasterService.toast('error', 'Error', 'Could not archive the filing.');
      });
  }

  LoadFilings() {
    const jsondata = { CMPCODE: this._loginService.getLogin()[0].CMPCODE };
    this._dataService.getData('Accounts/ACC_GSTR3B_FILING_LIST', jsondata)
      .subscribe((data: any) => {
        this.Filings = (data && data.Table) ? data.Table : [];
      });
  }

  /** open one filing beside a live recomputation of the same period */
  ViewFiling(f: any) {
    this.loaderService.display(true);
    this._dataService.getData('Accounts/ACC_GSTR3B_FILING_VIEW', { FILINGID: f.FILING_ID })
      .subscribe((data: any) => {
        this.OpenFiling = (data && data.Table && data.Table.length) ? data.Table[0] : null;
        this.FilingLedger = (data && data.Table1) ? data.Table1 : [];
        this.FilingSummary = (data && data.Table2) ? data.Table2 : [];
        this.loaderService.display(false);
      }, () => {
        this.loaderService.display(false);
        this._toasterService.toast('error', 'Error', 'Could not open the filing.');
      });
  }

  CloseFiling() {
    this.OpenFiling = null;
    this.FilingLedger = [];
    this.FilingSummary = [];
    this.FilingOnlyChanged = false;
  }

  /** the comparison rows currently shown - all of them, or only the differences */
  get FilingRows(): any[] {
    return this.FilingOnlyChanged
      ? this.FilingLedger.filter(l => l.STATUS !== 'UNCHANGED')
      : this.FilingLedger;
  }

  /** download the filed statement beside live data, so the two can be compared offline */
  ExportFiling() {
    if (!this.OpenFiling || this.FilingLedger.length === 0) {
      this._toasterService.toast('error', 'Error', 'Open a filing before exporting it.');
      return false;
    }
    this.loaderService.display(true);
    const f = this.OpenFiling;
    this.exportser.exportGstr3bFiling({
      title: this.CmpName,
      subtitle: 'GSTR-3B filed statement   Filing #' + f.FILING_ID + '   Period ' + f.PERIOD_FROM
        + ' to ' + f.PERIOD_TO + '   Filed by ' + f.FILED_BY + ' on ' + f.FILED_ON
        + '   |   changed since filing: ' + f.CHANGED_ROWS,
      headers: ['TYPE', 'ENTRY NO', 'ENTRY DATE', 'BRANCH', 'A/C CODE', 'LEDGER', 'NATURE',
        'FILED DR', 'FILED CR', 'LIVE DR', 'LIVE CR', 'DIFFERENCE', 'STATUS'],
      data: this.FilingRows.map(l => [l.ENTRY_TYPE, l.ENTRY_NO, l.ENTRY_DATE, l.BRANCH, l.ACCTCODE,
      l.LEDGER, l.NATURE, l.FILED_DR, l.FILED_CR, l.LIVE_DR, l.LIVE_CR, l.DIFFERENCE, l.STATUS]),
      statusCol: 13
    }, 'GSTR3B_FILED_' + f.FILING_ID + '_' + f.PERIOD_FROM + '_to_' + f.PERIOD_TO);
  }

  clear() {
    this.FromDate = '';
    this.ToDate = '';
    this.Summary = [];
    this.NetPosition = [];
    this.LedgerDetail = [];
    this.Warnings = [];
    this.RcmDeferred = [];
    this.Branches = [];
    this.EntryTypes = [];
    this.Searched = false;
    ['SUMMARY', 'NET', 'RCM', 'LEDGER', 'WARN'].forEach(k => this.clearFilter(k));
  }

    // ---- redesign: quick period presets (same my-date-picker model shape the pickers emit) ----
    periods = FIN_PERIODS.filter(p => p.key !== 'custom');
    period: string = '';
    setPeriod(k: FinPeriod) {
        const r = finRange(k);
        if (!r) { return; }
        this.period = k;
        this.FromDate = finDp(r.from, this.myDatePickerOptions.dateFormat);
        this.ToDate = finDp(r.to, this.myDatePickerOptions.dateFormat);
    }
}
