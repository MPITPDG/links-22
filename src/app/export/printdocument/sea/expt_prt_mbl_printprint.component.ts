import { Component, OnInit ,ElementRef,ViewChild } from '@angular/core';
import { DataService } from '../../../shared/service/dataService';
import { AuthService } from '../../../shared/service/authService';
import { Router} from '@angular/router';

import { LoginService } from '../../../shared/service/loginService';
import { ToastCommonService } from '../../../shared/service/toastService'; 
import { mblsharedservice } from '../../export-share-data.service';

@Component({
    selector: 'app-mbl-print',
    templateUrl: 'expt_prt_mbl_printprint.component.html'
})
export class Exptmblprint implements OnInit {
	@ViewChild("print", {static: false}) public MBL: ElementRef;
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
	
	MBLdet:any[];
	BLDt:any="";
    constructor(
        private _router: Router,
        private _dataService: DataService,
        private _auth: AuthService,
        private _toasterService: ToastCommonService,
        private _loginService: LoginService,
        private _mblsharedservice: mblsharedservice ) {
    }

    ngOnInit(): void {
        const jsonExport = { JOBNO: this._mblsharedservice.jobnoshared ,MBLNO: this._mblsharedservice.mblnoshared};//'GOA103180016'
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
                    this.FRTPAIDAT = this.MBLdet[0].FRTPAIDAT   ;
                    this.NUMOFBL = this.MBLdet[0].NUMOFBL   ;
                    this.MARKSANDNOS = this.MBLdet[0].MARKSANDNOS   ;
                    this.NOOFPKGS = this.MBLdet[0].NOOFPKGS;
                    this.ITCDESC = this.MBLdet[0].ITCDESC;
                    this.GRWT = this.MBLdet[0].GRWT;
                    this.VOL = this.MBLdet[0].VOL;
                    this.MISC = this.MBLdet[0].MISC;                   
                    this.PLACEDATE = this.MBLdet[0].PLACEDATE;
                    this.EXPNO = this.MBLdet[0].EXPNO   ;
            }
        })
    }
    finalMblPrint()
    {
        //let PrintFCRData = this.FCR.nativeElement.InnerHTML;
        //console.log("DivPrint ", this.MBL.nativeElement);
        var content = this.MBL.nativeElement.innerHTML;
        var mywindow = window.open('', 'Print', 'height=600,width=800');

        mywindow.document.write('<html><head><title>Print</title>');
        mywindow.document.write('</head><body >');
        mywindow.document.write(content);
        mywindow.document.write('</body></html>');

        mywindow.document.close();
        mywindow.focus()
        mywindow.print();
        mywindow.close();
        
    }

}

      
    