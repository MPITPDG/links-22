import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { DataService } from '../../shared/service/dataService';
import { LoginService } from '../../shared/service/loginService';
import { ToastCommonService } from '../../shared/service/toastService';
import { LoaderService } from '../../shared/service/loader.service';
import { BankReconcilStatementExportService } from './bank-reconcil-statement-export.service';
import { IMyDpOptions } from 'mydatepicker';

@Component({
    selector: 'app-bankreconcil-statement',
    templateUrl: './bank-reconcil-statement.component.html',
    // MPERPNG-20 layout: the page kit (import-page / accreport-page) is GLOBAL in Links; the host class opts in.
    styleUrls: [],
    host: { class: 'kit-accreport' },
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
  export class BankReconcilStatement implements OnInit {

    public myDatePickerOptions: IMyDpOptions = {
      dateFormat: 'dd/mm/yyyy',
      inline: false,
      height: '30px',
      width: '120px',
      componentDisabled: false,
      selectionTxtFontSize: '12px',
      editableDateField: false,
      sunHighlight: true,
      satHighlight: true,
      firstDayOfWeek: 'su',
      openSelectorTopOfInput: false,
      openSelectorOnInputClick: true,
      selectorHeight: '200px',
      selectorWidth: '220px',
      alignSelectorRight: true
    };

    FromDate;
    ToDate;

    Bank: string;
    BankList: any = [];
    bankreconcilList: any = [];
    showResult = false;

    // Lines present on the uploaded bank statement that never matched a ledger
    // entry -- bank charges, interest, direct debits/credits. Without these the
    // statement is one-directional: it can only ever show book entries the bank
    // hasn't cleared, never bank activity nobody has booked.
    bankOnlyList: any = [];
    // Set when the bank-statement fetch fails, so the UI can say "couldn't
    // check" rather than silently implying the bank side is clean.
    bankOnlyUnavailable = false;

    activeView: string = 'OUTSTANDING';

    OpBalDr: string;
    OpBalCr: string;
    BalanceDr: string;
    BalanceCr: string;
    DrNotRef: string;
    CrNotRef: string;
    DrRef: string;
    CrRef: string;

    constructor(
        private _dataService: DataService,
        private _toasterService: ToastCommonService,
        private _loginService: LoginService,
        private _loaderService: LoaderService,
        private _exportService: BankReconcilStatementExportService
      ) { }

    ngOnInit() {
      this._loaderService.display(true);
      this.FillAccount();
      this._loaderService.display(false);
    }

    // Nil-value rows (cancelled / wrongly-entered vouchers) carry no debit or
    // credit, so they can never be "outstanding" in any accounting sense -- they
    // only inflated the count away from Payments Not Presented + Deposits In
    // Transit. They remain visible under All Entries.
    get outstandingList() {
      return (this.bankreconcilList || []).filter(d =>
        !d.CLEARANCEDATE &&
        ((parseFloat(d.DRAMT) || 0) > 0 || (parseFloat(d.CRAMT) || 0) > 0));
    }

    get outstandingCount(): number {
      return this.outstandingList.length;
    }

    get outstandingDebitCount(): number {
      return this.outstandingList.filter(d => parseFloat(d.DRAMT) > 0).length;
    }

    get outstandingCreditCount(): number {
      return this.outstandingList.filter(d => parseFloat(d.CRAMT) > 0).length;
    }

    get outstandingDebitTotal(): number {
      return this.outstandingList.reduce((total, d) => total + (parseFloat(d.DRAMT) || 0), 0);
    }

    get outstandingCreditTotal(): number {
      return this.outstandingList.reduce((total, d) => total + (parseFloat(d.CRAMT) || 0), 0);
    }

    get crossCheckOk(): boolean {
      const debitDiff = Math.abs(this.outstandingDebitTotal - this.toNumber(this.DrNotRef));
      const creditDiff = Math.abs(this.outstandingCreditTotal - this.toNumber(this.CrNotRef));
      return debitDiff < 0.01 && creditDiff < 0.01;
    }

    // ===== Bank side: statement lines with no ledger counterpart =====

    get bankOnlyCount(): number {
      return (this.bankOnlyList || []).length;
    }

    // Money the bank credited that the books don't know about (e.g. interest).
    get bankOnlyDepositTotal(): number {
      return (this.bankOnlyList || [])
        .reduce((total, d) => total + (parseFloat(d.DEPOSIT) || 0), 0);
    }

    // Money the bank debited that the books don't know about (e.g. charges).
    get bankOnlyWithdrawalTotal(): number {
      return (this.bankOnlyList || [])
        .reduce((total, d) => total + (parseFloat(d.WITHDRAWAL) || 0), 0);
    }

    get bankOnlyNet(): number {
      return this.bankOnlyDepositTotal - this.bankOnlyWithdrawalTotal;
    }

    // What the screen used to label "Balance as per Bank": Books ± outstanding.
    // It is derived from the ledger alone, so it ties by construction.
    get derivedBankBalance(): number {
      const dr = this.toNumber(this.DrRef);
      if (dr) { return dr; }
      return -this.toNumber(this.CrRef);
    }

    // The figure that should actually equal the bank's closing balance.
    get bankClosingBalance(): number {
      return this.derivedBankBalance + this.bankOnlyNet;
    }

    // True only when nothing on the bank statement is missing from the books.
    // This is the check the old "Verified" badge never performed.
    get agreesWithBank(): boolean {
      return Math.abs(this.bankOnlyNet) < 0.01;
    }

    // Formats a signed figure using the Dr/Cr convention the rest of the
    // statement uses (positive = Dr), so the new lines read like the old ones.
    formatDrCr(val: number): string {
      if (!val || Math.abs(val) < 0.01) { return '0.00'; }
      return Math.abs(val).toFixed(2) + (val > 0 ? ' Dr' : ' Cr');
    }

    get selectedBankName(): string {
      const match = (this.BankList || []).find(b => b.acctcodename === this.Bank);
      return match ? match.acctname : '';
    }

    // Book-entry rows only. The BANKONLY view renders from bankOnlyList instead,
    // because bank statement lines have a different column shape.
    get displayList() {
      if (this.activeView === 'OUTSTANDING') {
        return this.outstandingList;
      }
      if (this.activeView === 'BANKONLY') {
        return [];
      }
      return this.bankreconcilList || [];
    }

    get displayDebitTotal(): number {
      return this.displayList.reduce((total, d) => total + (parseFloat(d.DRAMT) || 0), 0);
    }

    get displayCreditTotal(): number {
      return this.displayList.reduce((total, d) => total + (parseFloat(d.CRAMT) || 0), 0);
    }

    private toNumber(val: any): number {
      if (!val) { return 0; }
      const n = parseFloat((val + '').replace(/[^0-9.\-]/g, ''));
      return isNaN(n) ? 0 : n;
    }

    setActiveView(view: string) {
      this.activeView = view;
    }

    FillAccount() {
      const jsonBank = {
        cmpcode: this._loginService.getLogin()[0].CMPCODE,
        citycode: this._loginService.getLogin()[0].CITYCODE,
        citycode1: this._loginService.getLogin()[0].CITYCODE1
      };
      this._dataService.getData("Accounts/Acc_CashBook_FillOurbank", jsonBank)
        .subscribe((data: any) => {
          const rawList = (data && data.Table) ? data.Table : [];
          this.BankList = rawList.map(item => ({
            ...item,
            acctname: item.acctname || item.ACCTNAME || '',
            acctcodename: item.acctcodename || item.ACCTCODENAME || ''
          }));
        });
    }

    FromDateChanged(ev) {
      this.FromDate = ev.formatted;
    }
    ToDateChanged(ev) {
      this.ToDate = ev.formatted;
    }

    SearchData() {
      this._loaderService.display(true);
      if (this.Bank == "" || this.Bank == undefined) {
        this._toasterService.toast('warning', 'warning', 'Please select Our Bank !');
        this._loaderService.display(false);
        return false;
      }
      if (this.FromDate == "" || this.FromDate == undefined) {
        this._toasterService.toast('warning', 'warning', "From Date cannot be blank !.");
        this._loaderService.display(false);
        return false;
      }
      if (this.ToDate == "" || this.ToDate == undefined) {
        this._toasterService.toast('warning', 'warning', "As On Date cannot be blank !.");
        this._loaderService.display(false);
        return false;
      }

      const jsonData = {
        _ourbank: this.Bank,
        _FromDt: this.FromDate,
        _ToDt: this.ToDate,
        cmpcode: this._loginService.getLogin()[0].CMPCODE,
        citycode: this._loginService.getLogin()[0].CITYCODE,
        citycode1: this._loginService.getLogin()[0].CITYCODE1,
        Fin_StartDate: this._loginService.getLogin()[0].FINANCIAL_YEAR.STARTDATE,
        Fin_EndDate: this._loginService.getLogin()[0].FINANCIAL_YEAR.ENDDATE
      };

      this._dataService.getData("Accounts/Acc_CashBook_BankRecousillation", jsonData)
        .subscribe((data: any) => {
          this.bankreconcilList = data.Table;
          this.activeView = 'OUTSTANDING';

          this.OpBalDr = ""; this.OpBalCr = "";
          this.BalanceDr = ""; this.BalanceCr = "";
          this.DrNotRef = ""; this.CrNotRef = "";
          this.DrRef = ""; this.CrRef = "";

          if (data.Table1[0].BALANCE > 0) {
            this.BalanceDr = data.Table1[0].BALANCE + " Dr";
          } else {
            this.BalanceCr = (data.Table1[0].BALANCE == "0.00") ? "" : Math.abs(data.Table1[0].BALANCE) + " Cr";
          }
          if (data.Table2[0].CRAMTNOTREFLECTED > 0) {
            this.CrNotRef = (data.Table2[0].CRAMTNOTREFLECTED == "0.00") ? "" : Math.abs(data.Table2[0].CRAMTNOTREFLECTED) + " Cr";
          }
          if (data.Table2[0].DRAMTNOTREFLECTED > 0) {
            this.DrNotRef = (data.Table2[0].DRAMTNOTREFLECTED == "0.00") ? "" : Math.abs(data.Table2[0].DRAMTNOTREFLECTED) + " Dr";
          }
          if (data.Table3[0].AMTREFLECTED > 0) {
            this.DrRef = data.Table3[0].AMTREFLECTED + " Dr";
          } else {
            this.CrRef = (data.Table3[0].AMTREFLECTED == "0.00") ? "" : Math.abs(data.Table3[0].AMTREFLECTED) + " Cr";
          }
          if (data.Table4[0].OPENINGBALANCE > 0) {
            this.OpBalDr = data.Table4[0].OPENINGBALANCE + " Dr";
          } else {
            this.OpBalCr = (data.Table4[0].OPENINGBALANCE == "0.00") ? "" : Math.abs(data.Table4[0].OPENINGBALANCE) + " Cr";
          }

          this.showResult = true;
          this.LoadBankOnlyItems();
        }, () => {
          this._loaderService.display(false);
        });
    }

    // Second leg of the reconciliation: the unmatched lines from the uploaded
    // bank statement. Reuses the same procedure the "Search Upload Statement"
    // screen reads (Table2 = UnReconcil), so both screens can never disagree.
    // Nested rather than forkJoin to match the RxJS-5-compat style used here.
    LoadBankOnlyItems() {
      const jsonBank = {
        OURBANK: this.Bank,
        FROMDATE: this.FromDate,
        TODATE: this.ToDate
      };

      this._dataService.getData("Accounts/ACC_BANKRECONCILLATION_UPLOAD_GETDATA", jsonBank)
        .subscribe((data: any) => {
          this.bankOnlyList = (data && data.Table2) ? data.Table2 : [];
          this.bankOnlyUnavailable = false;
          this._loaderService.display(false);
        }, () => {
          // Leave the ledger-side statement intact — losing the bank leg must
          // not blank a statement the user can still read, but it must not be
          // mistaken for "bank side is clean" either.
          this.bankOnlyList = [];
          this.bankOnlyUnavailable = true;
          this._loaderService.display(false);
        });
    }

    Reset() {
      this.Bank = "";
      this.FromDate = "";
      this.ToDate = "";
      this.bankreconcilList = [];
      this.bankOnlyList = [];
      this.bankOnlyUnavailable = false;
      this.activeView = 'OUTSTANDING';
      this.OpBalDr = ""; this.OpBalCr = "";
      this.BalanceDr = ""; this.BalanceCr = "";
      this.DrNotRef = ""; this.CrNotRef = "";
      this.DrRef = ""; this.CrRef = "";
    }

    BackToSearch() {
      this.showResult = false;
    }

    exportToExcel() {
      if (!this.displayList.length && !this.bankOnlyCount) {
        this._toasterService.toast('warning', 'warning', 'Nothing to export !');
        return;
      }

      const headers = ['Entry No', 'Date', 'Type', 'Party / Reference', 'Chq Type', 'Cheque No', 'Cheque Dt', 'Debit', 'Credit', 'Clearance Status'];

      const stripHtml = (val: any): string => (val || '').toString().replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

      // On the bank-only tab displayList is empty by design, but the export is
      // the whole statement — fall back to the outstanding items so the book
      // leg is never silently dropped from the workbook.
      const bookList = this.activeView === 'BANKONLY' ? this.outstandingList : this.displayList;

      const rows = bookList.map(d => [
        d.ENTRYNO || '',
        d.ENTRYDT || '',
        d.STATUS || '',
        stripHtml(d.PARTYNAME) + (d.CHEQUENO ? ` (${d.CHEQUETYPE || ''} | ${d.CHEQUENO})` : ''),
        d.CHEQUETYPE || '',
        d.CHEQUENO || '',
        d.CHEQUEDT || '',
        d.DRAMT ? parseFloat(d.DRAMT) : '',
        d.CRAMT ? parseFloat(d.CRAMT) : '',
        d.CLEARANCEDATE ? d.CLEARANCEDATE : 'Not Cleared'
      ]);

      const excelData = {
        title: 'Bank Reconciliation Statement',
        bankName: this.selectedBankName,
        period: `For the period ${this.FromDate} to ${this.ToDate}`,
        openingBalance: this.OpBalDr || this.OpBalCr || '-',
        booksBalance: this.BalanceDr || this.BalanceCr || '-',
        addLabel: 'Add : Payments issued but not yet presented at bank'
          + (this.outstandingCreditCount ? ` (${this.outstandingCreditCount} items)` : ''),
        addValue: this.CrNotRef || '-',
        lessLabel: 'Less : Deposits / receipts not yet credited by bank'
          + (this.outstandingDebitCount ? ` (${this.outstandingDebitCount} items)` : ''),
        lessValue: this.DrNotRef || '-',
        bankBalance: this.DrRef || this.CrRef || 'Pending',

        // Bank leg of the reconciliation.
        bankAddLabel: 'Add : Amounts credited by bank, not in books'
          + (this.bankOnlyList.filter(d => parseFloat(d.DEPOSIT) > 0).length
            ? ` (${this.bankOnlyList.filter(d => parseFloat(d.DEPOSIT) > 0).length} items)` : ''),
        bankAddValue: this.bankOnlyDepositTotal
          ? this.bankOnlyDepositTotal.toFixed(2) + ' Dr' : '-',
        bankLessLabel: 'Less : Amounts debited by bank, not in books'
          + (this.bankOnlyList.filter(d => parseFloat(d.WITHDRAWAL) > 0).length
            ? ` (${this.bankOnlyList.filter(d => parseFloat(d.WITHDRAWAL) > 0).length} items)` : ''),
        bankLessValue: this.bankOnlyWithdrawalTotal
          ? this.bankOnlyWithdrawalTotal.toFixed(2) + ' Cr' : '-',
        closingBalance: this.bankOnlyUnavailable
          ? 'Not verified (bank statement unavailable)'
          : this.formatDrCr(this.bankClosingBalance),
        bankOnlyUnavailable: this.bankOnlyUnavailable,
        bankOnlyHeaders: ['Bank Ref No', 'Deposit', 'Withdrawal', 'Clearance Dt'],
        bankOnlyTitle: `Items on Bank Statement Not in Books (${this.bankOnlyCount})`,
        bankOnlyData: (this.bankOnlyList || []).map(d => [
          d.BANKREFNO || '',
          d.DEPOSIT ? parseFloat(d.DEPOSIT) : '',
          d.WITHDRAWAL ? parseFloat(d.WITHDRAWAL) : '',
          d.CLEARANCEDT || ''
        ]),
        bankOnlyDepositTotal: this.bankOnlyDepositTotal,
        bankOnlyWithdrawalTotal: this.bankOnlyWithdrawalTotal,

        sectionTitle: this.activeView === 'ALL'
          ? `All Entries (${this.bankreconcilList.length})`
          : `Outstanding Items (${this.outstandingCount})`,
        headers: headers,
        data: rows,
        debitTotal: rows.reduce((t, r) => t + (parseFloat(r[7] as any) || 0), 0),
        creditTotal: rows.reduce((t, r) => t + (parseFloat(r[8] as any) || 0), 0)
      };

      this._exportService.export(excelData, 'BankReconciliationStatement');
    }

}
