import { Component, OnChanges, Input, Output, EventEmitter } from '@angular/core';
import { DataService } from '../../../shared/service/dataService';
import { AuthService } from '../../../shared/service/authService';
import { Router } from '@angular/router';
import { ToastCommonService } from '../../../shared/service/toastService';
import { LoginService } from '../../../shared/service/loginService';
import { LoaderService } from '../../../shared/service/loader.service';
@Component({
    selector: 'app-print-air-mawb-update1',
    templateUrl: 'mawb.update.component.html' 
})
export class PrintDocumentMawbUpdateComponent implements OnChanges {
    @Input()
    mawbno;
    @Input()
    mawbdate;
    @Input()
    exptnos;
    @Output()
    result: EventEmitter<any> = new EventEmitter<any>();
    @Output()
    abort: EventEmitter<any> = new EventEmitter<any>();
    currencyList: any = [];
    destinationList: any = [];
    mawbnoList: any = [];
    FreightType: any = null;
    Fcurrency: any = null;
    FreightAmount: any = 0;
    ShipType: any = '0';
    ShipDest: any = '0';
    totalGrwt: any = 0;
    totalChblwt: any = 0;
    constructor(private _router: Router, private _dataService: DataService, private _auth: AuthService, private _toasterService: ToastCommonService, private _loginService: LoginService, private _loaderService: LoaderService) {
        this.mawbno = this.mawbno;
        this.mawbdate = this.mawbdate;
        this.exptnos = this.exptnos;
    }
    ngOnChanges() {
        this.pageLoad(this.exptnos, this.mawbno);
    }
    pageLoad(exptno, mawbno) {
        this._loaderService.display(true);
        const _jsonData = {
            Type1: exptno,
            Type2: mawbno,
            Type3: this._loginService.getLogin()[0].CITYCODE
        };
        this._dataService.getData("Export/PrintDocumentAirMawbUpdatePageload", _jsonData)
            .subscribe((data: any) => {
                this._loaderService.display(false);
                this.currencyList = data.Table;
                this.destinationList = data.Table1;
                this.mawbnoList = data.Table2;
                if (this.mawbnoList.length > 0) {
                    for (let i = 0; i < this.mawbnoList.length; i++) {
                        this.totalGrwt += this.mawbnoList[i].GRWT;
                        this.totalChblwt += this.mawbnoList[i].CHBLWT;
                    }
                }
                this.FreightType = this.mawbnoList[0].FRT_TYPE;
                this.Fcurrency = this.mawbnoList[0].FRT_CUR;
                this.ShipType = (this.mawbnoList[0].IsDDX == 0) ? '0' : '1';
                this.ShipDest = this.mawbnoList[0].DdxDestWhId;
                this.FreightAmount = this.mawbnoList[0].FRT_AMT;
            });
    }
    submit() {
        this._loaderService.display(true);
        const _jsonData = {
            MAWBNO: this.mawbno,
            MAWBDT: this.mawbdate,
            EXPTNO: this.exptnos,
            GRWT: this.totalGrwt,
            CHBL_WT: this.totalChblwt,
            FRT_TYPE: (this.FreightType != null) ? this.FreightType : '0',
            FRT_CUR: (this.Fcurrency != null) ? this.Fcurrency : '0',
            FRT_AMT: (this.FreightAmount == '') ? this.FreightAmount : '0',
            CityCode: this._loginService.getLogin()[0].CITYCODE,
            CmpId: this._loginService.getLogin()[0].CMPID,
            CmpCode: this._loginService.getLogin()[0].CMPCODE,
            ISDDX: (this.ShipType != null) ? this.ShipType : '0',
            DDXWAREHSE: (this.ShipType != null && this.ShipType == '1') ? ((this.ShipDest != null) ? this.ShipDest : '0') : '0'
        };
        this._dataService.Common("Export/PrintDocumentAirMawbUpdateIU", _jsonData)
            .subscribe((data: any) => {
                this._loaderService.display(false);
                alert("MAWBNO Details saved successfully !");
                // this.result.emit(true);
                //print-document/air/air-Mawbprint-update/:param
                this._router.navigate(['/export/print-document/air/air-Mawbprint-update', this.mawbno]);
            });
    }
    cancel() {
        this.abort.emit(true);
    }
    ddx_Onchange(ddxType) {
        this.ShipDest = null;
    }
}
