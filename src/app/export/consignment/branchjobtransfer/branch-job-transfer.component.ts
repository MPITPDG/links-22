import { Component, OnInit, ViewChild, ElementRef,ViewEncapsulation } from '@angular/core';
import { DataService } from '../../../shared/service/dataService';
import { LoginService } from '../../../shared/service/loginService';
import { ToastCommonService } from '../../../shared/service/toastService';
import {
    ButtonService
} from '../../../shared/common-font-changer.directive';

@Component({
    templateUrl: 'branch-job-transfer.component.html' ,
    styleUrls: ['../../../../../node_modules/@ng-select/ng-select/themes/default.theme.css'], 
    encapsulation: ViewEncapsulation.None
  
})
export class BranchJobTransferComponent implements OnInit {
    @ViewChild('submitButton', {static: false}) submitButton: ElementRef;
    TransferJobList: Array<any> = [];

    OldJobNo: any = '';
    Branch: any = null;
    BranchList: Array<any> = [];
    UserRemarks = '';

    ErrorMessage: any = '';

    constructor(       
        private _dataService: DataService,
        private _toasterService: ToastCommonService,
        private _loginService: LoginService,
        private _disable: ButtonService) { }


    ngOnInit() {
        this._loginService.verifyRights(323, '')
            .subscribe((data: any) => {
                this._loginService.checkVerify('Add', data);  //For verify user access
            });
        this.getBranchData();
    }

    getBranchData() {
        const jsonExport = {
            citycode1: this._loginService.getLogin()[0].CITYCODE1
        };
        this._dataService.getData('Export/GetExportConsignmentBranchFillDropdown', jsonExport)
            .subscribe((data: any) => {
                this.BranchList = data.Table;
            });
    }

    submit() {
        if (this.OldJobNo.length != 15) {
            this._toasterService.toast('error', 'Alert', 'Invalid JOB No. !');
        } else if (this.Branch == null) {
            this._toasterService.toast('error', 'Alert', 'Please Select Transfer Branch !');
        } else if (this.UserRemarks == '') {
            this._toasterService.toast('error', 'Alert', 'Please Enter Remark !');
        }
        else {
            let Mode = (this.OldJobNo.substring(8, 7) == '1') ? 'Sea' : 'Air';
            let BranchName = this.BranchList.filter((filterby) => filterby.VALUEFIELD == this.Branch)[0].TEXTFIELD;
            if (confirm("Are you sure you want to Transfer " + Mode + " Job No. [" + this.OldJobNo + "] \n from [" + this._loginService.getLogin()[0].CITYNAME + "] to Selected Branch [" + BranchName + "] ?")) {
                this._disable.disableButton(this.submitButton);
                const jsonExport = {
                    OldJobNo: this.OldJobNo,
                    Branch: this.Branch,
                    UserRemarks: this.UserRemarks,
                    CmpCode: this._loginService.getLogin()[0].CMPCODE,
                    MakerId: this._loginService.getLogin()[0].CMPID,
                    MakerIp: this._loginService.getLogin()[0].CMPID,   //Change later to IP
                    CityCode: this._loginService.getLogin()[0].CITYCODE
                };
                this._dataService.Common('Export/ExportConsignmentBranchJobTransferI', jsonExport)
                    .subscribe((data: any) => {
                        this._disable.enableButton(this.submitButton);
                        if (data.Table.length > 0) {
                            if (data.Table[0].STATUS == '100') {
                                this.TransferJobList = data.Table1;
                                this._toasterService.toast('success', 'Alert', data.Table[0].STATUMSG);
                            } else {
                                this._toasterService.toast('warning', 'Alert', data.Table[0].STATUMSG);
                            }
                        }
                        else {
                            this._toasterService.toast('error', 'Alert', 'No Record Found.');
                        }
                    });
            }
        }
    }
    reset() {
        this.OldJobNo = '';
        this.Branch = null;
        this.UserRemarks = '';
    }
}