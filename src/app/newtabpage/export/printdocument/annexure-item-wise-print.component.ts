import { Component, OnInit } from '@angular/core';
import { DataService } from '../../../shared/service/dataService';
import { LoginService } from '../../../shared/service/loginService';
import { ActivatedRoute } from '@angular/router';
import { LoaderService } from '../../../shared/service/loader.service';
@Component({
    selector: 'app-print-document-annexure-item-wise',
    templateUrl: 'annexure-item-wise-print.component.html'
})
export class AnnexureItemWisePrintComponent implements OnInit {

    dtItemDetail: Array<any> = [];
    constructor(
        private _dataService: DataService,
        private _route: ActivatedRoute,
        private _loginService: LoginService,
        private _loaderService: LoaderService) { }

    ngOnInit() {
        this._route.params.subscribe(params => {
            this.pageLoad(params["exptno"]);
        });
    }

    pageLoad(exptno) {
        this._loaderService.display(true);
        const _jsonData = {
            CmpCode: this._loginService.getLogin()[0].CMPCODE,
            CityCode: this._loginService.getLogin()[0].CITYCODE,
            ExptNo: exptno,
            GuId: this._loginService.getLogin()[0].GUID,
            Status: ""
        };
        this._dataService.Common("Export/AnnexureItemDetailPopulateData", _jsonData)
            .subscribe((data: any) => {
                this._loaderService.display(false);
                this.dtItemDetail = data.Table;
            });
    }

}