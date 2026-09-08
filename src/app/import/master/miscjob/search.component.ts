import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DataService } from '../../../shared/service/dataService';
import { LoginService } from '../../../shared/service/loginService';
import { LoaderService } from '../../../shared/service/loader.service';
@Component({
    selector: 'app-consignment-import-master-misc-job-search',
    templateUrl: 'search.component.html'
})
export class SearchMiscJobMasterComponent implements OnInit {
    Input: string = '';
    constructor(
        private _dataService: DataService,
        private _loginService: LoginService,
        private _router: Router,
        private _loaderService: LoaderService) { }

    ngOnInit() {
        this.verifyPermission(348, "View");
    }

    verifyPermission(formId, userMode) {
        this._loaderService.display(true);
        this._loginService.verifyRights(formId, '')
            .subscribe((data: any) => {
                this._loaderService.display(false);
                this._loginService.checkVerify(userMode, data);
            });
    }

    search() {
        this.populateForEdit(this.Input);
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
                if(data.Table.length > 0){
                    this._router.navigate(["./import/master/misc-job/update-entry", jobno]);
                }else{
                    alert("No job found!!!!!");
                }
            });
    }
}