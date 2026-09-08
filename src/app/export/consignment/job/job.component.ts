import { Component, OnInit, ViewChild, ElementRef ,OnChanges,ViewEncapsulation} from '@angular/core';
import { DataService } from '../../../shared/service/dataService';
import { LoginService } from '../../../shared/service/loginService';
import { ToastCommonService } from '../../../shared/service/toastService';
import { ActivatedRoute } from '@angular/router';
import {
    ButtonService
} from '../../../shared/common-font-changer.directive';

@Component({
    templateUrl: 'job.component.html',
    styleUrls: ['../../../../../node_modules/@ng-select/ng-select/themes/default.theme.css'], 
    encapsulation: ViewEncapsulation.None
})
export class JobComponent implements OnInit {
    @ViewChild('searchButton', {static: false}) searchButton: ElementRef;
    @ViewChild('submitButton', {static: false}) submitButton: ElementRef;
    Header: string = '';
    SearchJobNo: any = '';

    Id: any = '0';
    JobNo: any = '';
    ClientName: any = null;
    ClientNameList: Array<any> = [];
    NoOfPackages = '';
    Narration: any = '';
    JobType: any = '';

    ErrorMessage: any = '';
    viewType: string = 'Search';

    paramType: string = '';
    constructor(
        private _dataService: DataService,
        private _toasterService: ToastCommonService,
        private _loginService: LoginService,
        private _disable: ButtonService,
        private _route: ActivatedRoute) { 
            
        }

 

    ngOnInit() {
        //this.reset();
        this._route.params.subscribe(params => {
            this.paramType = params["job-type"];
            if (this.paramType == 'misc') {
                this.Header = 'MISCELLANEOUS JOBNO';
                this.viewType = 'MISC';
                this._loginService.verifyRights(311, '')
                    .subscribe((data: any) => {
                        this._loginService.checkVerify('View', data);  //For verify user access
                    });
                } else if (this.paramType == 'Add') {
                    this.Header = 'MISCELLANEOUS JOBNO';
                    this.viewType = 'Add';
                    this._loginService.verifyRights(311, '')
                        .subscribe((data: any) => {
                            this._loginService.checkVerify('Add', data);  //For verify user access
                        });
                } 
             else if (this.paramType == 'whs') {
                this.Header = 'WAREHOUSE JOBNO';
                this.viewType = 'WHS';
                this._loginService.verifyRights(311, '')
                    .subscribe((data: any) => {
                        this._loginService.checkVerify('Add', data);  //For verify user access
                    });
            } else {
                this.viewType = '';
            } 
            this.JobType =   (this.viewType== "Add"  )? "MISC"  :this.viewType   ;
            this.getClientData();
        });
    }

    getClientData() {
        const jsonExport = {
            citycode: this._loginService.getLogin()[0].CITYCODE
        };
        this._dataService.getData('Export/GetExportConsignmentJobClientData', jsonExport)
            .subscribe((data: any) => {
                this.ClientNameList = data.Table;
            });
    }

    search() {
      //  console.log(this.ClientNameList.filter((filterby) => filterby.VALUEFIELD == 'E105055'));
        if (this.SearchJobNo.length != 15) {
            this.ErrorMessage = "Invalid JobNo -- Please Check";
        } else {
            this.ErrorMessage = "";
            this._disable.disableButton(this.searchButton);
            const jsonExport = {
                jobno: this.SearchJobNo,
                cmpcode: this._loginService.getLogin()[0].CMPCODE,
                citycode: this._loginService.getLogin()[0].CITYCODE
            };
            this._dataService.getData('Export/ExportConsignmentJobSearch', jsonExport)
                .subscribe((data: any) => {
                    this.viewType = 'WHS';
                    this._disable.enableButton(this.searchButton);
                    if (data.Table.length > 0) {
                        this.SearchJobNo = '';
                        this.Id = data.Table[0].PK_ID;
                        this.JobNo = data.Table[0].JOBNO;
                        this.ClientName = data.Table[0].CLIENT_CODE;
                        this.NoOfPackages = data.Table[0].NOOFPKGS;
                        this.Narration = data.Table[0].NARRATION;
                    } else {
                        this._toasterService.toast('info', 'Alert', "Data Not Found!!!!");
                    }
                });
        }
    }

    submit() {
        if (this.ClientName == null) {
            this._toasterService.toast('error', 'Alert', 'Please select client name!');
        } else {
            this._disable.disableButton(this.submitButton);
            const jsonExport = {
                Id: this.Id,
                JobNo: this.JobNo,
                ClientName: this.ClientName,
                NoOfPackages: this.NoOfPackages,
                Narration: this.Narration,
                JobType: this.JobType,
                MakerId: this._loginService.getLogin()[0].CMPID,
                MakerIp: this._loginService.getLogin()[0].CMPID,   //Change later to IP
                CmpCode: this._loginService.getLogin()[0].CMPCODE,
                CityCode: this._loginService.getLogin()[0].CITYCODE,
                CityCode1: this._loginService.getLogin()[0].CITYCODE1
            };
            this._dataService.Common('Export/ExportConsignmentJobIU', jsonExport)
                .subscribe((data: any) => {
                    this._disable.enableButton(this.submitButton);
                  //  console.log(data);
                    if (data.Table[0].STATUS.split('#')[0] == 100) {
                        alert(data.Table[0].STATUS.split('#')[1]);
                        this._toasterService.toast('success', 'Alert', data.Table[0].STATUS.split('#')[1]);
                    } else if (data.Table[0].STATUS.split('#')[0] == 200) {
                        this._toasterService.toast('info', 'Alert', 'Jobno is already Exists.');
                    }
                });
        }
    }

    reset() {
        this.SearchJobNo = '';
        this.JobNo="";
        this.ClientName=null;
        this.NoOfPackages="";
        this.Narration="";
    }

}