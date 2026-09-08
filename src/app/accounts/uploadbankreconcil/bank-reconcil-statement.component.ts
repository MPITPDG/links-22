import { Component, OnInit } from '@angular/core';
import { DataService } from '../../shared/service/dataService';
import { LoginService } from '../../shared/service/loginService';
import { ToastCommonService } from '../../shared/service/toastService';
import { LoaderService } from '../../shared/service/loader.service';
import { BankReconcilStatementExportService } from './bank-reconcil-statement-export.service';
import { IMyDpOptions } from 'mydatepicker';

@Component({
    selector: 'app-bankreconcil-statement',
    templateUrl: './bank-reconcil-statement.component.html',
    styleUrls: ['./bank-reconcil-statement.component.css']
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

    get outstandingList() {
      return (this.bankreconcilList || []).filter(d => !d.CLEARANCEDATE);
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

    get selectedBankName(): string {
      const match = (this.BankList || []).find(b => b.acctcodename === this.Bank);
      return match ? match.acctname : '';
    }

    get displayList() {
      if (this.activeView === 'OUTSTANDING') {
        return this.outstandingList;
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
          this._loaderService.display(false);
        }, () => {
          this._loaderService.display(false);
        });
    }

    Reset() {
      this.Bank = "";
      this.FromDate = "";
      this.ToDate = "";
      this.bankreconcilList = [];
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
      if (!this.displayList.length) {
        this._toasterService.toast('warning', 'warning', 'Nothing to export !');
        return;
      }

      const headers = ['Entry No', 'Date', 'Type', 'Party / Reference', 'Chq Type', 'Cheque No', 'Cheque Dt', 'Debit', 'Credit', 'Clearance Status'];

      const stripHtml = (val: any): string => (val || '').toString().replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

      const rows = this.displayList.map(d => [
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
        sectionTitle: this.activeView === 'OUTSTANDING'
          ? `Outstanding Items (${this.outstandingCount})`
          : `All Entries (${this.bankreconcilList.length})`,
        headers: headers,
        data: rows,
        debitTotal: this.displayDebitTotal,
        creditTotal: this.displayCreditTotal
      };

      this._exportService.export(excelData, 'BankReconciliationStatement');
    }

}
