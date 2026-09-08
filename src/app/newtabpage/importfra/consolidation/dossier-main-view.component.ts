import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { DataService } from '../../../shared/service/dataService';
import { LoginService } from '../../../shared/service/loginService';
import { LoaderService } from '../../../shared/service/loader.service';

@Component({
    templateUrl: 'dossier-main-view.component.html'   
})
export class DossierMainViewConsolidationComponent implements OnInit {
    mainData: any = {};
    consoleList: Array<any> = [];
    constructor(
        private _dataService: DataService,
        private _loginService: LoginService,
        private _router: Router,
        private _activatedRoute: ActivatedRoute,
        private _loaderService: LoaderService) { }

    ngOnInit() {
       // console.log(this._loginService.getLogin());
        this._activatedRoute.params.subscribe(params => {
            if (params["param"]) {
                this.pageLoad(params["param"]);
            }
            else {
                //this._router.navigate([]);
            }
        });
    }

    pageLoad(consoleno) {
        this._loaderService.display(true);
        this._dataService.getData("Importfra/GetConsoleDossierMainView", {consoleno: consoleno})
            .subscribe((data: any) => {
               // console.log("Importfra/GetConsoleDossierMainView", data);
                this.mainData = data.Table1[0];
                this.consoleList = data.Table2;
                this._loaderService.display(false);
            });
    }
}