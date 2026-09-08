import { Component, OnInit } from '@angular/core';
import { DataService } from '../../shared/service/dataService';
import { LoginService } from '../../shared/service/loginService';
import { ToastCommonService } from '../../shared/service/toastService';
import { LoaderService } from '../../shared/service/loader.service';
import { IMyDpOptions } from 'mydatepicker';

@Component({
    selector: 'app-bankreconcil-showstatement',
    templateUrl: './bank-reconcil-showstatement.component.html',
    styleUrls: ['./bank-reconcil-showstatement.component.css']
  })
  export class BankReconcilShowStatement implements OnInit {

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
        private _loaderService: LoaderService
      ) { }

    ngOnInit() {
      this._loaderService.display(true);
      this.FillAccount();
      this._loaderService.display(false);
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
      this.OpBalDr = ""; this.OpBalCr = "";
      this.BalanceDr = ""; this.BalanceCr = "";
      this.DrNotRef = ""; this.CrNotRef = "";
      this.DrRef = ""; this.CrRef = "";
    }

    BackToSearch() {
      this.showResult = false;
    }

}
