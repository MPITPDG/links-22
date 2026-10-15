import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { DataService } from '../../../shared/service/dataService';
import { LoginService } from '../../../shared/service/loginService';
import { ToastCommonService } from '../../../shared/service/toastService';
import { prealertshareservice } from '../../export-share-data.service';

/*
  Send Pre-Alert (/export/print-documents/prealert/sendprealert). Ported from MPERPNG-20
  send-prealert.component.ts. It calls Export/PrintDocumentPrealertSending, which exists in the
  Links API (ExportController) and is the same call the Links "sending through" view already makes
  after Auto Prealert, with the same parameters. Rights check 350 (Send Auto Prealert), as in MP.
  Fail soft: a missing data.Table or an HTTP error shows the error state instead of throwing.
*/
@Component({
    templateUrl: 'send-prealert.component.html',
    styleUrls: ['prealert-page.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class SendPrealertComponent implements OnInit {
    MAWBNO: string = ""; setLoader: number = 0;
    constructor(
        private _dataService: DataService,
        private _toasterService: ToastCommonService,
        private _loginService: LoginService,
        private _mawbnoshrd: prealertshareservice) { }

    ngOnInit(): void {
        this._loginService.verifyRights('350', '')
            .subscribe((data: any) => {
                this._loginService.checkVerify('View', data);  //For verify user access
            });
    }

    submit() {
        const _jsonData = {
            Type1: this.MAWBNO,
            Type2: this._loginService.getLogin()[0].CITYCODE,
            Type3: this._loginService.getLogin()[0].CMP_USERNAME,
            Type4: this._loginService.getLogin()[0].CMP_USERNAME  //Change later by Router Ip
        };
        this._dataService.Common("Export/PrintDocumentPrealertSending", _jsonData)
            .subscribe((data: any) => {
                if (data && data.Table && data.Table[0] && data.Table[0].status == 100) {
                    this.setLoader = 1;
                } else {
                    this.setLoader = 2;
                }
            },
            (error) => {
                this.setLoader = 2;
            });
    }
}
