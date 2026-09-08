import { Component, OnInit, EventEmitter, Input, Output } from '@angular/core';
import { DataService } from '../../../shared/service/dataService';
import { LoginService } from '../../../shared/service/loginService';
import { LoaderService } from '../../../shared/service/loader.service';
@Component({
    selector: 'app-print-document-annexure-item-detail',
    templateUrl: 'item-detail-annexure.component.html'
})
export class ItemDetailAnnexureComponent implements OnInit {
    @Output() result = new EventEmitter();
    @Input() exptno: any;
    dtItemDetail: Array<any> = [];
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
        this._dataService.Common("Export/AnnexureItemDetailPopulateData", _jsonData)
            .subscribe((data: any) => {
                this._loaderService.display(false);
                if (data.Table.length > 0) {
                    this.dtItemDetail = data.Table;
                }
                else {
                    this.addRow();
                }
            });
    }

    addRow() {
        this.dtItemDetail.push({
            ID: 0,
            JOBNO: this.exptno,
            SRNO: '',
            RITCNO: '',
            IDESC: '',
            ACCRY: '',
            QTY: '',
            ACUNIT: '',
            ITEM: '',
            NOOFUNIT: '',
            UNITRATE: '',
            MKTVALUE: '',
            SCHEME: '',
            NFEI: '',
            THIRDPARTY: '',
            ENTRYDATE: ''
        });
    }

    removeRow(index) {
        this.dtItemDetail.splice(index, 1);
    }

    saveItemDetails() {
        let strData = '';
        this.dtItemDetail.forEach((key)=>{
            if(key["SRNO"]!=''){
                strData += this.exptno
                +'@'+  key["SRNO"]
                +'@'+  key["RITCNO"]
                +'@'+  key["IDESC"]
                +'@'+  key["ACCRY"]
                +'@'+  key["QTY"]
                +'@'+  key["ACUNIT"]
                +'@'+  key["ITEM"]
                +'@'+  key["NOOFUNIT"]
                +'@'+  key["UNITRATE"]
                +'@'+  key["MKTVALUE"]
                +'@'+  key["SCHEME"]
                +'@'+  key["NFEI"]
                +'@'+  key["THIRDPARTY"]
                +'@'+  this._dataService.getCurrentdate()
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
        this._dataService.Common("Export/AnnexureItemDetailIU", _jsonData)
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