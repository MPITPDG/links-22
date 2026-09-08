import { Component, OnInit, EventEmitter, Input, Output } from '@angular/core';
import { DataService } from '../../../shared/service/dataService';
import { LoginService } from '../../../shared/service/loginService';
import { LoaderService } from '../../../shared/service/loader.service';
@Component({
    selector: 'app-print-document-annexure-drawback',
    templateUrl: 'drawback-annexure.component.html'
})
export class DrawbackAnnexureComponent implements OnInit {
    @Output() result = new EventEmitter();
    @Input() exptno: any;
    dtDrawback: Array<any> = [];
    constructor(
        private _dataService: DataService,
        private _loginService: LoginService,
        private _loaderService: LoaderService) { }

    ngOnInit() {
        this.pageLoad(this.exptno);
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
        this._dataService.Common("Export/AnnexureDrawbackPopulateData", _jsonData)
            .subscribe((data: any) => {
                this._loaderService.display(false);
                if (data.Table.length > 0) {
                    this.dtDrawback = data.Table;
                }
                else {
                    this.addRow();
                }
            });
    }

    addRow() {
        this.dtDrawback.push({
            ID: 0,
            JOBNO: this.exptno,
            INVSRNO: '',
            ITEMSRNO: '',
            DBKSRNO: '',
            QTY: '',
            RMSRNO: '',
            RSQTY: ''
        });
    }

    removeRow(index) {
        this.dtDrawback.splice(index, 1);
    }

    saveDrawbackDetails() {
        let strData = '';
        this.dtDrawback.forEach((key)=>{
            if(key["INVSRNO"]!=''){
                strData += this.exptno
                +'@'+  key["INVSRNO"]
                +'@'+  key["ITEMSRNO"]
                +'@'+  key["DBKSRNO"]
                +'@'+  key["QTY"]
                +'@'+  key["RMSRNO"]
                +'@'+  key["RSQTY"]
                + '|';
            }
        });
        this._loaderService.display(true);
        const _jsonData = {
            CmpCode: this._loginService.getLogin()[0].CMPCODE,
            CmpId: this._loginService.getLogin()[0].CMPID,
            ExptNo: this.exptno,
            StrData: strData
        };
        this._dataService.Common("Export/AnnexureDrawbackIU", _jsonData)
            .subscribe((data: any) => {
                this._loaderService.display(false);
                alert("Data Updated Successfully");
                this.result.emit({ exptno: this.exptno, view: 998});
            });
    }

    backToEdit() {
        this.result.emit({ exptno: this.exptno, view: 998 });
    }
}