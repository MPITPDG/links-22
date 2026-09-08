import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { DataService } from '../../../shared/service/dataService';
import { LoginService } from '../../../shared/service/loginService';
import { LoaderService } from '../../../shared/service/loader.service';
@Component({
    selector: 'app-consignment-import-master-misc-job-data-entry',
    templateUrl: 'data-entry.component.html'
})
export class EntryMiscJobMasterComponent implements OnInit {
    Header: string = "VESSEL MASTER - ADD";
    Id: string = '0';
    JobNo: string = "";
    ClientName: string = "0";
    NoOfPkgs: string = '';
    Narration: string = '';

    ClientList: Array<any> = [];
    ErrorType: string = null;
    constructor(
        private _dataService: DataService,
        private _loginService: LoginService,
        private _router: Router,
        private _route: ActivatedRoute,
        private _loaderService: LoaderService) { }

    ngOnInit() {
        this._route.params.subscribe(params => {
            if (params["param"]) {
                this.JobNo = params["param"];
                this.Header = 'IMPORT MISCELLANEOUS JOBNO - UPDATE';
                this.verifyPermission(348, "Modify");
            }
            else {
                this.Header = 'IMPORT MISCELLANEOUS JOBNO - ADD';
                this.verifyPermission(348, "Add");
            }
        });
    }

    verifyPermission(formId, userMode) {
        this._loaderService.display(true);
        this._loginService.verifyRights(formId, '')
            .subscribe((data: any) => {
                this._loaderService.display(false);
                if (this._loginService.checkVerify(userMode, data)) {
                    this.fillData();
                    if (this.JobNo != '') {
                        this.populateForEdit(this.JobNo);
                    }
                }
            });
    }

    fillData() {
        this._loaderService.display(true);
        this._dataService.getData("Import/GetClient", { citycode: this._loginService.getLogin()[0].CITYCODE })
            .subscribe((data: any) => {
                this._loaderService.display(false);
                this.ClientList = data.Table;
            });
    }

    populateForEdit(jobno) {
        this._loaderService.display(true);
        let _jsonData = {
            JobNo: jobno,
            CmpCode: this._loginService.getLogin()[0].CMPCODE,
            CityCode: this._loginService.getLogin()[0].CITYCODE
        }
        this._dataService.getData("Import/MiscellaneousDetails", _jsonData)
            .subscribe((data: any) => {
                this._loaderService.display(false);
                this.Id = data.Table[0]["PK_ID"];
                this.JobNo = data.Table[0]["JOBNO"];
                this.ClientName = data.Table[0]["CLIENT_CODE"];
                this.NoOfPkgs = data.Table[0]["NOOFPKGS"];
                this.Narration = data.Table[0]["NARRATION"];
            });
    }

    submit() {
        if (this.ClientName == '0') { this.ErrorType = '1'; return false; }
        if (this.NoOfPkgs.trim().length == 0) { this.ErrorType = '2'; return false; }
        this.ErrorType = null;
        let _jsonData = {
            Id: this.Id,
            JobNo: this.JobNo,
            ClientName: this.ClientName,
            NoOfPkgs: this.NoOfPkgs,
            Narration: this.Narration,
            MakerIp: this._loginService.getLogin()[0].MAKERIP,
            MakerId: this._loginService.getLogin()[0].CMPID,
            CmpCode: this._loginService.getLogin()[0].CMPCODE,
            CityCode: this._loginService.getLogin()[0].CITYCODE,
            CityCode1: this._loginService.getLogin()[0].CITYCODE1
        }
        this._loaderService.display(true);
        this._dataService.Common("Import/Imp_Miscellaneous_IU", _jsonData)
            .subscribe((data: any) => {
                this._loaderService.display(false);
                if (data.Table[0]["STATUS"].split("#")[0] == "100") {
                    alert(data.Table[0]["STATUS"].split("#")[1]);
                    this.cancel();
                } else if (data.Table[0]["STATUS"].split("#")[0] == "200") {
                    alert('Import Jobno is already Exists.');
                }else{
                    alert(data.Table[0]["STATUSMSG"]);
                }
            });
    }

    cancel() {
        if (this.Id == '0') { this.reset(); }
        else { this._router.navigate(["./import/master/misc-job/search"]); }
    }

    reset() {
        this.Id = "0";
        this.JobNo = "";
        this.ClientName = "0";
        this.NoOfPkgs = "";
        this.Narration = "";
    }

}