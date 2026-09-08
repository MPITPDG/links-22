import { Component, ViewChild, ElementRef, OnInit } from '@angular/core';
import { DataService } from '../../../shared/service/dataService';
import { LoginService } from '../../../shared/service/loginService';
import { ToastCommonService } from '../../../shared/service/toastService';
import {
    ButtonService
} from '../../../shared/common-font-changer.directive';

@Component({
    templateUrl: 'pss.component.html'
})
export class PSSComponent implements OnInit {
    @ViewChild('searchButton', {static: false}) searchButton: ElementRef;
    @ViewChild('submitButton', {static: false}) submitButton: ElementRef;
    ExptNo: any = '';
    Pss: any = '';
    ErrorMessage: any = '';
    IsDisabled: Boolean = false;
    constructor(
        private _dataService: DataService,
        private _toasterService: ToastCommonService,
        private _loginService: LoginService,
        private _disable: ButtonService) { }
    ngOnInit() {
        this._loginService.verifyRights('272', '')
            .subscribe((data: any) => {
                this._loginService.checkVerify('Modify', data);
            });
    }
    search() {
        if (this.ExptNo == '') {
            this.ErrorMessage = "Please enter Export No.";
        } else if (this.ExptNo.length != 15) {
            this.ErrorMessage = "Export No. length should be 15.";
        } else {
            this.ErrorMessage = "";
            this._disable.disableButton(this.searchButton);
            const jsonExport = {
                Type1: 'SEARCH',
                Type2: this.ExptNo
            };
            this._dataService.Common('Export/PssManage', jsonExport)
                .subscribe((data: any) => {
                    this._disable.enableButton(this.searchButton);
                    if (data.Table.length > 0) {
                        this.IsDisabled = true;
                        this.Pss = data.Table[0].EXPT_PSS;
                    } else {
                        this.IsDisabled = false;
                        this._toasterService.toast('info', 'Alert', "Data Not Found!!!!");
                    }
                });
        }
    }

    submit() {
        this._disable.disableButton(this.submitButton);
        const jsonExport = {
            Type1: 'SUBMIT',
            Type2: this.ExptNo,
            Type3: this.Pss,
            Type4: this._loginService.getLogin()[0].CMPID,
            Type5: this._loginService.getLogin()[0].CMPID,  //Change later to IP
        };
        this._dataService.Common('Export/PssManage', jsonExport)
            .subscribe((data: any) => {
                this._disable.enableButton(this.submitButton);
                if (data.Table[0].STATUS == 100) {
                    this._toasterService.toast('success', 'Alert', "Export No [" + this.ExptNo + "] Updated Successfully!");
                } else {
                    this._toasterService.toast('info', 'Alert', data.Table[0].STATUSTEXT);
                }
            });
    }

    reset() {
        this.ExptNo = '';
        this.Pss = '';
        this.IsDisabled = false;
    }

}