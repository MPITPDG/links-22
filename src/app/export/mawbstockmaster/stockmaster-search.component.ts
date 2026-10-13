import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { DataService } from '../../shared/service/dataService';
import { LoginService } from '../../shared/service/loginService';
import { ToastCommonService } from '../../shared/service/toastService';
import { LoaderService } from '../../shared/service/loader.service';
import { IMyDpOptions } from 'mydatepicker';

@Component({
    selector: 'app-mawbstock-search',
    templateUrl: 'stockmaster-search.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class MawbStockSearchComponent implements OnInit {

    public myDatePickerOptions: IMyDpOptions = {
        dateFormat: 'dd/mm/yyyy',
        inline: false,
        height: '16px',
        width: '120px',
        componentDisabled: false,
        selectionTxtFontSize: '12px',
        editableDateField: false,
        sunHighlight: true,
        satHighlight: true,
        firstDayOfWeek: 'su',
        openSelectorTopOfInput: false,
        openSelectorOnInputClick: true,
        selectorHeight: '180px',
        selectorWidth: '200px'
    };

    airlinelist: any = [];
    airline = '';
    mawbNo = '';
    docNo = '';
    fromDate: any = '';
    toDate: any = '';
    status = '';

    Searchlist: any = [];
    searched = false;
    totalCount = 0;
    usedCount = 0;
    availableCount = 0;

    constructor(
        private _router: Router,
        private _dataService: DataService,
        private _toasterService: ToastCommonService,
        private loaderService: LoaderService,
        private _loginService: LoginService,
    ) { }

    ngOnInit() {
        this._loginService.verifyRights(428, '')
            .subscribe((data: any) => { this._loginService.checkVerify('View', data); });

        const _jsonGet = {
            CITYCODE: this._loginService.getLogin()[0].CITYCODE,
            CMPCODE: this._loginService.getLogin()[0].CMPCODE
        };
        this._dataService.getData('Export/EXP_MAWB_STOCK_PAGELOAD', _jsonGet)
            .subscribe((data: any) => {
                this.airlinelist = data.Table1 || [];
            });
    }

    FromDateChanged(ev: any) { this.fromDate = ev.formatted; }
    ToDateChanged(ev: any) { this.toDate = ev.formatted; }

    serchList() {
        const login = this._loginService.getLogin()[0];
        const jsonGet = {
            CMPCODE: login.CMPCODE,
            CITYCODE: login.CITYCODE1,
            AIRLINE_CD: this.airline || '',
            MAWBNO: (this.mawbNo || '').trim(),
            DOC_NO: (this.docNo || '').trim(),
            FROMDT: this.fromDate || '',
            TODT: this.toDate || '',
            STATUS: this.status || ''
        };
        this.loaderService.display(true);
        this._dataService.getData('Export/EXP_MAWB_STOCK_SEARCH', jsonGet)
            .subscribe((data: any) => {
                this.loaderService.display(false);
                this.searched = true;
                this.Searchlist = (data && data.Table) ? data.Table : [];
                this.totalCount = this.Searchlist.length;
                this.usedCount = this.Searchlist.filter((r: any) => r.STOCK_STATUS === 'Used').length;
                this.availableCount = this.totalCount - this.usedCount;
                if (this.Searchlist.length === 0) {
                    this._toasterService.toast('warning', 'warning', 'No MAWB stock found for the given criteria !');
                }
            },
            (error) => {
                this.loaderService.display(false);
                this._toasterService.toast('error', 'Error', error.status + '<br/>' + error.statusText);
            });
    }

    RestMain() {
        this.airline = '';
        this.mawbNo = '';
        this.docNo = '';
        this.fromDate = '';
        this.toDate = '';
        this.status = '';
        this.Searchlist = [];
        this.searched = false;
        this.totalCount = this.usedCount = this.availableCount = 0;
    }

    AddNew() {
        this._router.navigate(['/export/mawbstock/Add']);
    }
}
