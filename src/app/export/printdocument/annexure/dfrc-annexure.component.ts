import { Component, OnInit, EventEmitter, Input, Output } from '@angular/core';
import { DataService } from '../../../shared/service/dataService';
import { LoginService } from '../../../shared/service/loginService';
import { LoaderService } from '../../../shared/service/loader.service';
@Component({
    selector: 'app-print-document-annexure-dfrc',
    templateUrl: 'dfrc-annexure.component.html'
})
export class DfrcAnnexureComponent implements OnInit {
    @Output() result = new EventEmitter();
    @Input() exptno: any;
    dtDfrc: Array<any> = [];
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
        this._dataService.Common("Export/AnnexureDfrcPopulateData", _jsonData)
            .subscribe((data: any) => {
                this._loaderService.display(false);
                if (data.Table.length > 0) {
                    this.dtDfrc = data.Table;
                }
                else {
                    this.addRow();
                }
            });
    }

    addRow() {
        this.dtDfrc.push({
            ID: 0,
            JOBNO: this.exptno,
            SRNO: '',
            ITEMNO: '',
            REGNO: '',
            SRNOE: '',
            SRNOC: '',
            QTY: '',
            UNIT: '',
            INDI: '',
            SRNON: ''
        });
    }

    removeRow(index) {
        this.dtDfrc.splice(index, 1);
    }

    saveDrawbackDetails() {
        let strData = '';
        this.dtDfrc.forEach((key)=>{
            if(key["SRNO"]!=''){
                strData += this.exptno
                +'@'+  key["SRNO"]
                +'@'+  key["ITEMNO"]
                +'@'+  key["REGNO"]
                +'@'+  key["SRNOE"]
                +'@'+  key["SRNOC"]
                +'@'+  key["QTY"]
                +'@'+  key["UNIT"]
                +'@'+  key["INDI"]
                +'@'+  key["SRNON"]
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
        this._dataService.Common("Export/AnnexureDfrcIU", _jsonData)
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