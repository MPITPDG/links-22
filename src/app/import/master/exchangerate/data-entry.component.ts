import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { DataService } from '../../../shared/service/dataService';
import { LoginService } from '../../../shared/service/loginService';
import { ToastCommonService } from '../../../shared/service/toastService';
import { IMyDpOptions } from 'mydatepicker';
import { LoaderService } from '../../../shared/service/loader.service';
@Component({
    selector: 'app-consignment-import-master-exchange-rate-data-entry',
    templateUrl: 'data-entry.component.html'
})
export class EntryExchangeRateMasterComponent implements OnInit {
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
    Header: string = "EXCHANGE RATE MASTER - ADD";
    Id: string = '0';
    CurrencyType: string = "0";
    Cities: string = "";
    FromDate: any = null;
    ToDate: any = null;
    ExchangeRate: string = '';

    CurrencyList: Array<any> = [];
    BranchList: Array<any> = [];

    constructor(
        private _dataService: DataService,
        private _loginService: LoginService,
        private _toasterService: ToastCommonService,
        private _router: Router,
        private _activatedRoute: ActivatedRoute,
        private _loaderService: LoaderService) { }

    ngOnInit() {
        this._activatedRoute.params.subscribe(params => {
            if (params["param"]) {
                this.Id = params["param"];
                this.Header = 'EXCHANGE RATE MASTER - UPDATE';
                this.verifyPermission(124, "Modify");
                this.populateForEdit(this.Id);
            }
            else {
                this.Header = 'EXCHANGE RATE MASTER - ADD';
                this.verifyPermission(124, "Add");
            }
        });
    }

    verifyPermission(formId, userMode) {
        this._loaderService.display(true);
        this._loginService.verifyRights(formId, '')
            .subscribe((data: any) => {
                if (this._loginService.checkVerify(userMode, data)) {
                    this.fillData();
                } else { this._loaderService.display(false); }
            });
    }

    fillData() {
        this._dataService.getData("Import/CurrencyAndCity", {})
            .subscribe((data: any) => {
                this._loaderService.display(false);
                this.CurrencyList = data.Table;
                this.BranchList = data.Table1;
                if (this.Id == '0') {
                    this.BranchList.forEach((key) => {
                        key["checked"] = true;
                    });
                }
            });
    }

    populateForEdit(id) {
        this._loaderService.display(true);
        this._dataService.getData("Import/CurrencyDetails", { id: id })
            .subscribe((data: any) => {
                this._loaderService.display(false);
                this.Id = data.Table[0]["pk_ExchangeRateId"];
                this.CurrencyType = data.Table[0]["Curr_Type"];
                this.Cities = data.Table[0]["Branch_Name"];
                this.FromDate = this._dataService.stringdttoArry(this._dataService.returnMonthMMFromMMM(data.Table[0]["From_date"]));
                this.ToDate = this._dataService.stringdttoArry(this._dataService.returnMonthMMFromMMM(data.Table[0]["To_date"]));
                this.ExchangeRate = data.Table[0]["ExchangeRate"];
            });
    }

    submit() {
        if (this.CurrencyType == '0') {
            alert("Please Select Currency Type.");
            return false;
        }
        if (this.FromDate == null) {
            alert("Please Select Date From ");
            return false;
        }
        if (this.ToDate == null) {
            alert("Please Select Date To ");
            return false;
        }
        if (this._dataService.DateFromAndToComparision(this._dataService.returnMonthMMFromMMM(this.ToDate.formatted), this._dataService.returnMonthMMFromMMM(this.FromDate.formatted))) {
            alert("To Date should be greater than From Date"); return false;
        }
        if (this.ExchangeRate == "") {
            alert("Please Provide Exchange Rate");
            return false;
        }
        if (Math.abs(Number(this.ExchangeRate)) == 0) {
            alert("Please enter Exch.Rate for Currency")
            return false;
        }
        this.Cities = '';
        this.BranchList.forEach((key) => {
            if (key["checked"]) {
                this.Cities += key.DATAVALUEFIELD + ",";
            }
        });
        let _jsonData = {
            Id: this.Id,
            CurrencyType: this.CurrencyType,
            Cities: this.Cities,
            FromDate: (this.FromDate) ? this.FromDate.formatted : "",
            ToDate: (this.ToDate) ? this.ToDate.formatted : "",
            ExchangeRate: this.ExchangeRate,
            MakerIp: this._loginService.getLogin()[0].MAKERIP,
            MakerId: this._loginService.getLogin()[0].CMPID
        }
        this._loaderService.display(true);
        this._dataService.Common("Import/Imp_Currency_IU", _jsonData)
            .subscribe((data: any) => {
                this._loaderService.display(false);
                if (data.Table[0]["STATUS"] == "100") {
                    if (this.Id == '0') {
                        var MSG1 = data.Table[0]["STATUS"].split("#")[0];
                        var MSG2 = data.Table[0]["STATUS"].split("#")[0];
                        if (MSG1 != '' && MSG2 == '') {
                            alert(MSG1);
                        }
                        else if (MSG1 == '' && MSG2 != '') {
                            alert(MSG2);
                        }
                        else {
                            alert(MSG1 + '\n\n' + MSG2);
                        }
                    }
                    else {
                        alert("Exchange Rate Details Updated Successfully!");
                    }
                    this.cancel();
                }
            });
    }

    cancel() {
        if (this.Id == '0') { this.reset(); }
        else { this._router.navigate(["./import/master/exchange-rate/search"]); }
    }

    reset() {
        this.Id = "0";
        this.CurrencyType = "0";
        this.Cities = "";
        this.FromDate = null;
        this.ToDate = null;
        this.ExchangeRate = "";
    }

}