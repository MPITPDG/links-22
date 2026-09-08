import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { DataService } from '../../shared/service/dataService';
import { LoginService } from '../../shared/service/loginService';
import { ToastCommonService } from '../../shared/service/toastService';
import { LoaderService } from '../../shared/service/loader.service';
@Component({
    selector: 'app-consignment-import-sea-docket-print-search',
    templateUrl: 'docket-print-search.component.html'
})
export class SeaDocketPrintSearchComponent implements OnInit {
    inputValue: any = '';
    constructor(
        private _dataService: DataService,
        private _loginService: LoginService,
        private _toasterService: ToastCommonService,
        private _router: Router,
        private _loaderService: LoaderService) { }

    ngOnInit() {
        this.verifyPermission(125, "View");
    }

    verifyPermission(formId, userMode) {
        this._loaderService.display(true);
        this._loginService.verifyRights(formId, '')
            .subscribe((data: any) => {
                this._loginService.checkVerify(userMode, data);
                this._loaderService.display(false);
            });
    }

    search() {
        if (this.inputValue == '') { this._toasterService.toast("warning", "Alert", "Please enter Import Code."); return false; }
        else if (this.inputValue.length != 15) { this._toasterService.toast("warning", "Alert", "Import Code should be 15 digit."); return false; }
        else {
            const _jsonData = {
                mode: 'Sea',
                importcode: this.inputValue
            };
            this._loaderService.display(true);
            this._dataService.getData("Import/SeaAirDocketPrint", _jsonData)
                .subscribe((data: any) => {
                    this._loaderService.display(false);
                    if (data.Table.length == 0) {
                        this._toasterService.toast("warning", "Alert", "No record Found.");
                    }else {
                        window.open("/#/new-tab/import-sea-docket-print/"+this.inputValue, "_blank");
                    }
                });
        }
    }
}