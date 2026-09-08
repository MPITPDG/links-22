import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DataService } from '../../../shared/service/dataService';
import { LoginService } from '../../../shared/service/loginService';
import { LoaderService } from '../../../shared/service/loader.service';
@Component({
    selector: 'app-consignment-import-master-vessel-search',
    templateUrl: 'search.component.html'
})
export class SearchVesselMasterComponent implements OnInit {
    Input: string = '';
    List: Array<any> = [];
    constructor(
        private _dataService: DataService,
        private _loginService: LoginService,
        private _router: Router,
        private _loaderService: LoaderService) { }

    ngOnInit() {
        this.verifyPermission(121, "View");
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
        this._loaderService.display(true);
        let _jsonData = {
            search: this.Input
        }
        this._dataService.getData("Import/Imp_Vessel_Search", _jsonData)
            .subscribe((data: any) => {
                this._loaderService.display(false);
                this.List = data.Table;
            });
    }

    goTo(id){
        this._router.navigate(["./import/master/vessel/update-entry", id]);
    }

}