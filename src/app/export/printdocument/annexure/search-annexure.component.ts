import { Component, OnInit, ViewChild, ElementRef, EventEmitter, Output } from '@angular/core';
import { DataService } from '../../../shared/service/dataService';
import { LoginService } from '../../../shared/service/loginService';
import { LoaderService } from '../../../shared/service/loader.service';
@Component({
    selector: 'app-print-document-annexure-search',
    templateUrl: 'search-annexure.component.html'
})
export class AnnexureSearchComponent implements OnInit {
    @ViewChild('searchButton', {static: false}) searchButton: ElementRef;
    @Output() result = new EventEmitter();
    ExptNo: any = ''; //011010310001256

    constructor(
        private _dataService: DataService,
        private _loginService: LoginService,
        private _loaderService: LoaderService) { }

    ngOnInit() { 
        this._loginService.verifyRights('191', '')
        .subscribe((data: any) => {
            this._loginService.checkVerify('View', data);  //For verify user access
        });
        // const _jsonData = {};
        // this._dataService.getData("Export/Generate_EpCopy_New", _jsonData)
        //     .subscribe((data: any) => {
        //         this._dataService.html_downloadFileByUrl(data,"EP_Copy_Coversheet.html");
        //     });
    }

    searchData() {
        if (this.ExptNo == '') {
            alert('Please Enter Export NO.');
        } else if (this.ExptNo.length != 15) {
            alert('Invalid Export NO.');
        } else {
            this._loaderService.display(true);
            // this.result.emit({exptno: this.ExptNo, view: 998});
            // this._loaderService.display(false);
            const _jsonData = {
                citycode: this._loginService.getLogin()[0].CITYCODE,
                exptno: this.ExptNo
            };
            this._dataService.getData("Export/AnnexureSearchList", _jsonData)
                .subscribe((data: any) => {
                    this._loaderService.display(false);
                    this.result.emit({ exptno: this.ExptNo, view: 998 })
                });
        }
    }
}