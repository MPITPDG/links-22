import { Component, OnInit } from '@angular/core';
import { DataService } from '../../shared/service/dataService';
import { ActivatedRoute } from '@angular/router';
import { LoaderService } from '../../shared/service/loader.service';
@Component({
    selector: 'app-import-docket-print-air',
    templateUrl: 'docket-print-air.component.html',
    styles: [`
            div.inline-one {
                display: inline-block;
                border: 1px solid black;        
                }
                
                .data-value{
                   font-size: 7pt;
                   color: #000000;
                   font-family: Verdana;
                   font-weight: normal;
                }
                
                table{
                   padding: 7px;
                }
                
                table, td{
                   padding-top: 3px;
                }
                hr{
                   z-index: 30;
                   border-color: #808080;
                   border-style: solid;
                   border-width: 0px;
                   border-top-width: 1px;
                   padding-top: 2px;
                }
                .td-border{
                   border: 1px solid black;
                }
                .td-border-not-left{
                   border-top: 1px solid black;
                   border-right: 1px solid black;
                   border-bottom: 1px solid black;
                }
                .td-border-not-right{
                   border-top: 1px solid black;
                   border-left: 1px solid black;
                   border-bottom: 1px solid black;
                }
                
                tr.border_right td {
                 border-bottom:1pt solid black;
               }
    `]
})
export class ImportAirDocketPrintComponent implements OnInit {
    dtData: Array<any> = [];
    constructor(
        private _dataService: DataService,
        private _route: ActivatedRoute,
        private _loaderService: LoaderService) { }

    ngOnInit() {
        this._route.params.subscribe(params => {
            this.pageLoad(params["importcode"]);
        });
    }

    pageLoad(importcode) {
        this._loaderService.display(true);
        const _jsonData = {
            mode: 'Air',
            importcode: importcode
        };
        this._dataService.getData("Import/SeaAirDocketPrint", _jsonData)
            .subscribe((data: any) => {
                this._loaderService.display(false);
                this.dtData = data.Table[0];
                setTimeout(() => {
                    window.print();
                }, 1000);

            });
    }
}