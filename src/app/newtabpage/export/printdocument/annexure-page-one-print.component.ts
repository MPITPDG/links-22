import { Component, OnInit, ViewChild, ElementRef, EventEmitter, Output } from '@angular/core';
import { DataService } from '../../../shared/service/dataService';
import { ActivatedRoute } from '@angular/router';
import { LoaderService } from '../../../shared/service/loader.service';
@Component({
    selector: 'app-print-document-annexure-page-one',
    templateUrl: 'annexure-page-one-print.component.html'
})
export class AnnexurePageOnePrintComponent implements OnInit {

    dataTable: Array<any> = [];
    dataTable1: Array<any> = [];
    dataTable2: Array<any> = [];
    dataTable3: Array<any> = [];
    dataTable4: Array<any> = [];
    constructor(
        private _dataService: DataService,
        private _route: ActivatedRoute,
        private _loaderService: LoaderService) { }

    ngOnInit() { 
        this._route.params.subscribe(params => {
            this.pageLoad(params["exptno"], params["citycode"]);
        });
    }

    pageLoad(exptno, citycode) {
        this._loaderService.display(true);
        const _jsonData = {
            exptno: exptno,
            citycode: citycode,
            type: 'AP1'
        };
        this._dataService.getData("Export/AnnexurePrintPage", _jsonData)
            .subscribe((data: any) => {
                this._loaderService.display(false);
                this.dataTable = data.Table;
                this.dataTable1 = data.Table1;
                this.dataTable2 = data.Table2;
                this.dataTable3 = data.Table3;
                this.dataTable4 = data.Table4;
            });
    }

}