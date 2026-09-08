import { Component, OnInit, EventEmitter, Input, Output } from '@angular/core';
import { DataService } from '../../../shared/service/dataService';
import { LoginService } from '../../../shared/service/loginService';
import { ActivatedRoute } from '@angular/router';
import { LoaderService } from '../../../shared/service/loader.service';
@Component({
    selector: 'app-print-document-annexure-deec-epcg-print',
    templateUrl: 'annexure-deec-epcg-print.component.html'
})
export class AnnexureDeecEpcgPrintComponent implements OnInit {
    dtDeecEpcg: Array<any> = [];
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
        this._dataService.Common("Export/AnnexureDeecEpcgPopulateData", _jsonData)
            .subscribe((data: any) => {
                this._loaderService.display(false);
                this.dtDeecEpcg = data.Table;
            });
    }
}