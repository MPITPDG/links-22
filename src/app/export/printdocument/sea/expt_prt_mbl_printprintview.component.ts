import { Component, OnInit } from '@angular/core';
import { DataService } from '../../../shared/service/dataService';
import { AuthService } from '../../../shared/service/authService';
import { Router } from '@angular/router';
import { LoginService } from '../../../shared/service/loginService';
import { ToastCommonService } from '../../../shared/service/toastService';
import { mblsharedservice } from '../../export-share-data.service';
import { LoaderService } from '../../../shared/service/loader.service';

@Component({
    selector: 'app-mbl-printview',
    templateUrl: 'expt_prt_mbl_printprintview.component.html'
})
export class Exptmblprintview implements OnInit {

    SHIPPER: any = "";
    CONSIGNEE: any = "";
    NOTIFY: any = "";
    EXPNO: any = "";
    MBLNO: any = "";
    CARRIAGE: any = "";
    RECPTPLCE: any = "";
    VESSEL: any = "";
    POL: any = "";
    POD: any = false;
    PODEL: any = "";
    FRTPAIDAT: any = "";
    NUMOFBL: any = "";

    MARKSANDNOS: any = "";
    NOOFPKGS: any = "";
    ITCDESC: any = "";
    GRWT: any = "";
    VOL: any = "";
    PLACEDATE: any = "";
    MISC: any = "";
    exptno: any = "";
    MBLdet: any[];
    BLDt: any = "";
    APPLYTO: any = "";

    buttonStatus: boolean = false;
    constructor(
        private _router: Router,
        private _dataService: DataService,
        private _auth: AuthService,
        private _toasterService: ToastCommonService,
        private _loginService: LoginService,
        private _mblsharedservice: mblsharedservice,
        private loaderService: LoaderService,) {
    }

    ngOnInit(): void {
        this.loaderService.display(true);
        const jsonExport = { JOBNO: this._mblsharedservice.jobnoshared, MBLNO: this._mblsharedservice.mblnoshared };//'GOA103180016'
        this._dataService.Common('export/exp_printdoc_mb_printload', jsonExport)

            .subscribe((data: any) => {

                if (data.Table[0].STATUS == 100) {
                    this.MBLdet = data.Table;
                    this.SHIPPER = this.MBLdet[0].SHIPPER;
                    this.CONSIGNEE = this.MBLdet[0].CONSIGNEE;
                    this.NOTIFY = this.MBLdet[0].NOTIFY;
                    this.MBLNO = this.MBLdet[0].BLNO;
                    this.BLDt = this.MBLdet[0].BLDt;
                    this.CARRIAGE = this.MBLdet[0].CARRIAGE;
                    this.RECPTPLCE = this.MBLdet[0].RECPTPLCE;
                    this.VESSEL = this.MBLdet[0].VESSEL;
                    this.POL = this.MBLdet[0].POL;
                    this.POD = this.MBLdet[0].POD;
                    this.PODEL = this.MBLdet[0].PODEL;
                    this.FRTPAIDAT = this.MBLdet[0].FRTPAIDAT;
                    this.NUMOFBL = this.MBLdet[0].NUMOFBL;
                    this.MARKSANDNOS = this.MBLdet[0].MARKSANDNOS;
                    this.NOOFPKGS = this.MBLdet[0].NOOFPKGS;
                    this.ITCDESC = this.MBLdet[0].ITCDESC;
                    this.GRWT = this.MBLdet[0].GRWT;
                    this.VOL = this.MBLdet[0].VOL;
                    this.MISC = this.MBLdet[0].MISC;
                    this.PLACEDATE = this.MBLdet[0].PLACEDATE;
                    this.APPLYTO = this.MBLdet[0].APPLYTO;
                    this.EXPNO = this.MBLdet[0].EXPNO;
                    this.exptno = this.MBLdet[0].EXPTNO;
                    this.loaderService.display(false);
                }
                else{ this.loaderService.display(false);}
            });
    }
    printUpdate() {
        const jsonExport = { jobno: this._mblsharedservice.jobnoshared, shipper: this.SHIPPER, consignee: this.CONSIGNEE, notify: this.NOTIFY, expno: this.EXPNO, blno: this._mblsharedservice.mblnoshared, Carriage: this.CARRIAGE, RecptPlce: this.RECPTPLCE, Vessel: this.VESSEL, POL: this.POL, POD: this.POD, PODEL: this.PODEL, FrtPaidAt: this.FRTPAIDAT, MARKSANDNOS: this.MARKSANDNOS, NOOFPKGS: this.NOOFPKGS, ITCDESC: this.ITCDESC, GRWT: this.GRWT, VOL: this.VOL, PLACEDATE: this.PLACEDATE  ,MISC: this.MISC };
        this._dataService.Common('Export/exp_printdoc_mb_print_update', jsonExport)
            .subscribe((data: any) => {
                if (data.Table[0].STATUS == 100) {   
                    this._toasterService.toast('alert', 'Alert', "Update Successfully"); 
                }
             else {

                this._toasterService.toast('error', 'Error', data.Table[0].STATUSTEXT);
                this.loaderService.display(false); 
            }
            })
    }

    Print() {
        this._mblsharedservice.jobnoshared = this.exptno;
        this._mblsharedservice.mblnoshared = this.MBLNO;
        this._router.navigate(['export/print-document/sea/mbl/finalprint']);
    }
}