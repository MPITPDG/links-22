import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { DataService } from '../../../shared/service/dataService';
import { LoginService } from '../../../shared/service/loginService';
import { LoaderService } from '../../../shared/service/loader.service';
@Component({
    templateUrl: 'dossier-job-view.component.html'   
})
export class DossierJobViewConsolidationComponent implements OnInit {
    displayTblOne: any = {};
    displayTblTwo: any = {};
    constructor(
        private _dataService: DataService,
        private _loginService: LoginService,
        private _router: Router,
        private _activatedRoute: ActivatedRoute,
        private _loaderService: LoaderService) { }

    ngOnInit() {
      //  console.log(this._loginService.getLogin());
        this._activatedRoute.params.subscribe(params => {
            if (params["param"]) {
                this.pageLoad(params["param"]);
            }
            else {
                //this._router.navigate([]);
            }
        });
    }

    pageLoad(jobno) {
        this._loaderService.display(true);
        this._dataService.getData("Importfra/GetConsoleDossierJobView", {jobno: jobno})
            .subscribe((data: any) => {
                this._loaderService.display(false);
           //     console.log("Importfra/GetConsoleDossierJobView", data);
                this.displayTblOne = data.Table[0];
                this.displayTblTwo = data.Table1[0];
            });
    }
}