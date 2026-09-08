import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DataService } from '../../../shared/service/dataService';
import { LoginService } from '../../../shared/service/loginService';
import { LoaderService } from '../../../shared/service/loader.service';
import { ToastCommonService } from '../../../shared/service/toastService';
import { IMyDpOptions } from 'mydatepicker';
@Component({
    selector: 'app-consignment-import-master-exchange-rate-search',
    templateUrl: 'search.component.html'
})
export class SearchExchangeRateMasterComponent implements OnInit {
    CurrencyType: string = "0";
    BranchName: string = "0";
    FromDate: any = null;
    ToDate: any = null;
    ExchangeRate: string = '';
    Input: string='';

    CurrencyList: Array<any> = [];
    BranchList: Array<any> = [];
    DisplayList: Array<any> = [];
    public myDatePickerOptions: IMyDpOptions = {
        dateFormat: 'dd-mmm-yyyy',
        inline: false,
        height: '16px',
        width: '120px',
        componentDisabled: false,
        selectionTxtFontSize: '12px',
        editableDateField: false,
        sunHighlight: true,
        satHighlight: true,
        firstDayOfWeek: 'su',
        openSelectorTopOfInput: false,
        openSelectorOnInputClick: true,
        selectorHeight: '198px',
        selectorWidth: '200px'
    };
    constructor(
        private _dataService: DataService,
        private _loginService: LoginService,
        private _router: Router,
        private _loaderService: LoaderService,
        private _toaster: ToastCommonService) { }

    ngOnInit() {
        this.verifyPermission(124, "View");
    }

    verifyPermission(formId, userMode) {
        this._loaderService.display(true);
        this._loginService.verifyRights(formId, '')
            .subscribe((data: any) => {
                this._loaderService.display(false);
                if (this._loginService.checkVerify(userMode, data)) { this.fillData(); }
            });
    }

    fillData() {
        this._dataService.getData("Import/CurrencyAndCity", {})
            .subscribe((data: any) => {
                this._loaderService.display(false);
                this.CurrencyList = data.Table;
                this.BranchList = data.Table1;
            });
    }

    search() {
        if (this.FromDate && !this.ToDate) { alert("Please provide to date."); return false; }
        if (!this.FromDate && this.ToDate) { alert("Please provide from date."); return false; }
        if (this.FromDate && this.ToDate) {
            if (this._dataService.DateFromAndToComparision(this._dataService.returnMonthMMFromMMM(this.ToDate.formatted), this._dataService.returnMonthMMFromMMM(this.FromDate.formatted))) {
                alert("To Date should be greater than From Date"); return false;
            }
        }
        this._loaderService.display(true);
        let _jsonData = {
            CurrencyType: this.CurrencyType,
            Cities: this.BranchName,
            FromDate: (this.FromDate) ? this.FromDate.formatted : "",
            ToDate: (this.ToDate) ? this.ToDate.formatted : "",
            ExchangeRate: this.ExchangeRate
        }
        this._dataService.Common("Import/Imp_Currency_Search", _jsonData)
            .subscribe((data: any) => {
                this._loaderService.display(false);
                if (data.Table.length == 0) {
                    this._toaster.toast("warning", "Message", "No Data Found");
                }
                this.DisplayList = data.Table;
            });
    }

    goTo(id) {
        this._router.navigate(["./import/master/exchange-rate/update-entry", id]);
    }

}