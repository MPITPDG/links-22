import { Component,  OnInit } from '@angular/core';
import { DataService } from '../../shared/service/dataService';
import { LoginService } from '../../shared/service/loginService';
import { ToastCommonService } from '../../shared/service/toastService';
import { ActivatedRoute } from '@angular/router';
import { LoaderService } from '../../shared/service/loader.service';
@Component({
    selector: 'app-consignment-invoice-view',
    templateUrl: 'invoice-details.component.html' 
})
export class InvoiceDetailsComponent implements OnInit {

    exptno: string;
    invData: any;
    itcData: any = [];
    constructor(private _dataService: DataService,
        private _loginService: LoginService,
        private _toasterService: ToastCommonService,
        private _route: ActivatedRoute,
        private _loaderService: LoaderService) {
        this.exptno = this.exptno;
    }
    ngOnInit() {
        this._route.params.subscribe(params => {
            this.exptno=params["exptno"];
            this.setInvoiceData(params["exptno"]);
        });
    }

    setInvoiceData(exptno) {
        const _jsonData = {
            Type1: exptno,
            Type2: this._loginService.getLogin()[0].CMPCODE,
            Type3: this._loginService.getLogin()[0].CITYCODE
        };
        this._loaderService.display(true);
        this._dataService.Common("Export/ConsignmentInvoiceView", _jsonData)
            .subscribe((data: any) => {
              
                this.invData = (data.Table[0] != undefined) ? data.Table[0] : null;
                this.itcData = data.Table1;
                this._loaderService.display(false);
            },
                (error) => { this._toasterService.toast('error', 'Error', error.status + '<br/>' + error.statusText);   this._loaderService.display(false);},
                () => { });
    }
}