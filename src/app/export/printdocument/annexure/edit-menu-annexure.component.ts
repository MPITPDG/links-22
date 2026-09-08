import { Component, OnInit, EventEmitter, Input, Output } from '@angular/core';
import { DataService } from '../../../shared/service/dataService';
import { LoginService } from '../../../shared/service/loginService';
import { LoaderService } from '../../../shared/service/loader.service';
import { Router } from '@angular/router';
@Component({
    selector: 'app-print-document-annexure-edit-menu',
    templateUrl: 'edit-menu-annexure.component.html'
})
export class EditMenuAnnexureComponent implements OnInit {
    @Output() result = new EventEmitter();
    @Input() exptno: any;

    EditMenuList: Array<any> = [];
    constructor(
        private _dataService: DataService,
        private _loginService: LoginService,
        private _loaderService: LoaderService,
        private _route: Router) { }

    ngOnInit() {
        this._loaderService.display(true);
        const _jsonData = {
            exptno: this.exptno,
            citycode: this._loginService.getLogin()[0].CITYCODE
        };
        this._dataService.getData("Export/AnnexureSearchList", _jsonData)
            .subscribe((data: any) => {
                this._loaderService.display(false);
                this.EditMenuList = this.displayMenu(data.Table1.length, 'EDIT');
            });
    }

    displayMenu(length, vtype): Array<any> {
        let array = [
            { id: 1, type: 'EDIT', name: 'EDIT ANNEXURE' },
            { id: 2, type: 'EDIT', name: 'EDIT (28. COL) ITEM WISE DETAILS' },
            { id: 3, type: 'EDIT', name: 'EDIT (29. COL) DRAWBACK PARTICULARS' },
            { id: 4, type: 'EDIT', name: 'EDIT (30. COL) DEEC/EPCG LICENSES PARTICULAR' },
            { id: 5, type: 'EDIT', name: 'EDIT (31. COL) DFRC LICENSES PARTICULAR' },
            { id: 8, type: 'PRINT', name: 'ANNEXURE Page 1' },
            { id: 9, type: 'PRINT', name: '	ANNEXURE Page 2' },
            { id: 10, type: 'PRINT', name: 'ANNEXURE Page 3' },
            { id: 11, type: 'PRINT', name: 'ANNEXURE Page 4 (Declaration)' },
            { id: 13, type: 'PRINT', name: 'Col 28. ITEM WISE DETAILS/DBK/DEEC/EPCG' },
            { id: 14, type: 'PRINT', name: 'Col 29. DRAWBACK PARTICULARS' },
            { id: 15, type: 'PRINT', name: 'Col 30. DEEC/EPCG Licenses Particulars' },
            { id: 16, type: 'PRINT', name: 'Col 31. DFRC Licenses Particulars' }
        ];
        if (length == 0) {
            array = array.filter((filterby) => filterby.type === vtype);
        }
        return array;
    }

    backButton() {
        this.result.emit({ exptno: this.exptno, view: 999 });
    }

    redirectTo(id, type) {
        if (type == 'EDIT') {
            this.result.emit({ exptno: this.exptno, view: id });
        } else if (type == 'PRINT') {
            if (id == 8) { window.open("./#/new-tab/annexure-page-one-print/" + this.exptno + "/" + this._loginService.getLogin()[0].CITYCODE, "_blank"); }
            else if (id == 9) { window.open("./#/new-tab/annexure-page-two-print/" + this.exptno + "/" + this._loginService.getLogin()[0].CITYCODE, "_blank"); }
            else if (id == 10) { window.open("./#/new-tab/annexure-page-three-print/" + this.exptno + "/" + this._loginService.getLogin()[0].CITYCODE, "_blank"); }
            else if (id == 11) { window.open("./#/new-tab/annexure-page-four-print/" + this.exptno + "/" + this._loginService.getLogin()[0].CITYCODE, "_blank"); }
            else if (id == 13) { window.open("./#/new-tab/annexure-item-wise-print/" + this.exptno + "/" + this._loginService.getLogin()[0].CITYCODE, "_blank"); }
            else if (id == 14) { window.open("./#/new-tab/annexure-drawback-print/" + this.exptno + "/" + this._loginService.getLogin()[0].CITYCODE, "_blank"); }
            else if (id == 15) { window.open("./#/new-tab/annexure-deec-epcg-print/" + this.exptno + "/" + this._loginService.getLogin()[0].CITYCODE, "_blank"); }
            else if (id == 16) { window.open("./#/new-tab/annexure-dfrc-print/" + this.exptno + "/" + this._loginService.getLogin()[0].CITYCODE, "_blank"); }
        }
    }
}