import { Component, OnInit, Input, Output, EventEmitter, ViewChild, OnChanges, ElementRef} from '@angular/core';
import { DataService } from '../../shared/service/dataService';
import { AuthService } from '../../shared/service/authService';
import { Router} from '@angular/router';
import { ToasterService } from 'angular2-toaster';
import { LoginService } from '../../shared/service/loginService'; 
import { ToastCommonService } from '../../shared/service/toastService';
import { FcrSharedDataService } from '../export-share-data.service';
 
@Component({
    selector: 'app-fcr-print',
    // templateUrl: 'exp_prt_fcr_printview.component.html'  style="white-space: pre;"
    template: `      <button name="btnPrint"   (click)="finalFCRPrint()">Print</button>
                    <div id="divFcr" #print>
                    <p style="FONT-SIZE: 14px;font-family: Verdana;position:absolute;top: 20px;left: 20px;color:black;z-index:1;white-space: pre;">{{SHIPPER}}</p>
					<p style="FONT-SIZE: 14px;font-family: Verdana;position:absolute;top: 30px;left: 430px;color:black;z-index:1;white-space: pre;">{{BOOKINGNO}}</p>
					<p style="FONT-SIZE: 14px;font-family: Verdana;position:absolute;top: -9px;left: 872px;color:black;z-index:1;white-space: pre;">{{FCRNO}}</p>
					<p style="FONT-SIZE: 14px;font-family: Verdana;position:absolute;top: 445px;left: 633px;color:black;z-index:1;white-space: pre;">{{APPLYTO}}</p>
					<p style="FONT-SIZE: 14px;font-family: Verdana;position:absolute;top: 158px;left: 20px;color:black;z-index:0;white-space: pre;">{{CONSIGNEE}}</p>
					<p style="FONT-SIZE: 14px;font-family: Verdana;position:absolute;top: 157px;left: 610px;color:black;z-index:0;white-space: pre;">{{EXPNO}}</p>
					<p style="FONT-SIZE: 14px;font-family: Verdana;position:absolute;top: 321px;left: 20px;color:black;z-index:0;white-space: pre;">{{NOTIFYPARTY}}</p>
					<p style="FONT-SIZE: 14px;font-family: Verdana;position:absolute;top: 445px;left: 30px;color:black;z-index:0;white-space: pre;">{{CARRIER}}</p>
					<p style="FONT-SIZE: 14px;font-family: Verdana;position:absolute;top: 445px;left: 331px;color:black;z-index:0;white-space: pre;">{{RECPTPLACE}}</p>
					<p style="FONT-SIZE: 14px;font-family: Verdana;position:absolute;top: 495px;left: 30px;color:black;z-index:0;white-space: pre;">{{VESSEL}}</p>
					<p style="FONT-SIZE: 14px;font-family: Verdana;position:absolute;top: 495px;left: 331px;color:black;z-index:0;white-space: pre;">{{POL}}</p>
					<p style="FONT-SIZE: 14px;font-family: Verdana;position:absolute;top: 541px;left: 30px;color:black;z-index:0;white-space: pre;">{{POD}}</p>
					<p style="FONT-SIZE: 14px;font-family: Verdana;position:absolute;top: 541px;left: 331px;color:black;z-index:0;white-space: pre;">{{PODEL}}</p>
					<p style="FONT-SIZE: 14px;font-family: Verdana;position:absolute;top: 650px;left: 30px;color:black;z-index:0;white-space: pre;">{{MARKSANDNOS}}</p>
					<p style="FONT-SIZE: 14px;font-family: Verdana;position:absolute;top: 650px;left: 192px;color:black;z-index:0;white-space: pre;">{{NOOFPKGS}}</p>
					<p style="FONT-SIZE: 14px;font-family: Verdana;position:absolute;top: 650px;left: 339px;color:black;z-index:0;white-space: pre;">{{ITCDESC}}</p>
					<p style="FONT-SIZE: 14px;font-family: Verdana;position:absolute;top: 650px;left: 854px;color:black;z-index:0;white-space: pre;">{{GRWT}}</p>
					<p style="FONT-SIZE: 14px;font-family: Verdana;position:absolute;top: 650px;left: 989px;color:black;z-index:0;white-space: pre;">{{VOL}}</p>
					<p style="FONT-SIZE: 14px;font-family: Verdana;position:absolute;top: 700px;left: 30px;color:black;z-index:0;white-space: pre;">{{MISC}}</p>
					<p style="FONT-SIZE: 14px;font-family: Verdana;position:absolute;top: 1227px;left: 300px;color:black;z-index:0;white-space: pre;">{{PP}}</p>
					<p style="FONT-SIZE: 14px;font-family: Verdana;position:absolute;top: 1227px;left: 380px;color:black;z-index:0;white-space: pre;">{{CC}}</p>
					<p style="FONT-SIZE: 14px;font-family: Verdana;position:absolute;top: 1227px;left: 300px;color:black;z-index:0;white-space: pre;">{{TOTPP}}</p>
					<p style="FONT-SIZE: 14px;font-family: Verdana;position:absolute;top: 1227px;left: 380px;color:black;z-index:0;white-space: pre;">{{TOTCC}}</p>
					<p style="FONT-SIZE: 14px;font-family: Verdana;position:absolute;top: 1307px;left: 837px;color:black;z-index:0;white-space: pre;">{{PLACEDATE}}</p> 
                     </div>
        `
})

export class ExptFCRPrint implements OnInit,OnChanges {

    private baseUrl: string = 'Export/Export_FCR_PRINTPREVIEW';
    @Input() hbltype: string;

    @ViewChild("print", {static: false}) public FCR: ElementRef;

    SHIPPER: any = "";
	BOOKINGNO: any = "";
    CONSIGNEE: any = "";
    NOTIFYPARTY: any = "";
    FCRNO: any = "";
    FCRDT: any = "";
    APPLYTO: any = "";
    CARRIER: any = "";
    RECPTPLACE: any = "";
    VESSEL: any = "";
    POL: any = "";
    POD: any = "";
    PODEL: any = "";
    APPLYTO1: any = "";
    MARKSANDNOS: any = "";

    NOOFPKGS: any = "";
    ITCDESC: any = "";
    GRWT: any = "";
    VOL: any = "";
    MISC: any = "";
    PP: any = "";
    CC: any = "";
    TOTPP: any = "";
    TOTCC: any = "";
    PLACEDATE: any = "";
    EXPNO: any = "";

    Bltype: any = "";
    FCRDET: any;
    buttonStatus = false;

    constructor(
        private _router: Router,
        private _dataService: DataService,
        private _auth: AuthService,
        private _toasterService: ToastCommonService,
        private _loginService: LoginService,
        private _fcrsharedvataSerice: FcrSharedDataService,
        private _fcrHbltypesharedvataSerice: FcrSharedDataService) {
    }
    ngOnChanges()
    {
        this.hbltype = this._fcrsharedvataSerice.fcrHbltypesharedData;
        //  this.hbltype = 'F';

        const jsonExport = { FCRNO: this._fcrsharedvataSerice.fcrsharedData };
        this._dataService.Common(this.baseUrl, jsonExport)
            .subscribe((data: any) => {
                if (data.Table[0].STATUS == 100) {
                    this.FCRDET = data.Table;

                    this.SHIPPER = this.FCRDET[0].SHIPPER;
                    this.CONSIGNEE = this.FCRDET[0].CONSIGNEE;
                    this.NOTIFYPARTY = this.FCRDET[0].NOTIFYPARTY;
                    this.FCRNO = this.FCRDET[0].FCRNO;
                    this.FCRDT = this.FCRDET[0].FCRDT;
                    this.APPLYTO = this.FCRDET[0].APPLYTO;
                    this.CARRIER = this.FCRDET[0].CARRIER;
                    this.RECPTPLACE = this.FCRDET[0].RECPTPLACE;
                    this.VESSEL = this.FCRDET[0].VESSEL;
                    this.POL = this.FCRDET[0].POL;
                    this.POD = this.FCRDET[0].POD;
                    this.PODEL = this.FCRDET[0].PODEL;
                    this.APPLYTO1 = this.FCRDET[0].APPLYTO;
                    this.MARKSANDNOS = this.FCRDET[0].MARKSANDNOS;
                    this.NOOFPKGS = this.FCRDET[0].NOOFPKGS;
                    this.ITCDESC = this.FCRDET[0].ITCDESC;
                    this.GRWT = this.FCRDET[0].GRWT;
                    this.VOL = this.FCRDET[0].VOL;
                    this.MISC = this.FCRDET[0].MISC;
                    this.PP = this.FCRDET[0].PP;
                    this.CC = this.FCRDET[0].CC;
                    this.TOTPP = this.FCRDET[0].TOTPP;
                    this.TOTCC = this.FCRDET[0].TOTCC;
                    this.PLACEDATE = this.FCRDET[0].PLACEDATE;
                    this.EXPNO = this.FCRDET[0].EXPNO;




                    this._toasterService.toast('info', 'Complete', 'Data filled successfully');
                } else {

                    this._toasterService.toast('error', 'Error', data.Table[0].statusText);
                }

            },
            (error) => {
                this._toasterService.toast('error', 'Error', error.status + '<br/>' + error.statusText);
            },
            () => {
            });
    }
    ngOnInit(): void {

    }

    finalFCRPrint()
    {
        //let PrintFCRData = this.FCR.nativeElement.InnerHTML;
        const jsonExport = { fcr: this._fcrsharedvataSerice.fcrsharedData ,citycode: this._loginService.getLogin()[0].CITYCODE ,userid: this._loginService.getLogin()[0].CMPID};
        this._dataService.getData("Export/FCR_printflagUpdate", jsonExport)
            .subscribe((data: any) => {
                 
                });
        var content = this.FCR.nativeElement.innerHTML;
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

@Component({
    selector: 'app-mto-print',
    // templateUrl: 'exp_prt_fcr_printview.component.html'
    template: `
                <button name="btnMtoPrint"   (click)="finalMTOPrint()">Print</button>
                    <div id="divMTO" #print>
                <p style="FONT-SIZE: 14px;font-family: Verdana;position:absolute;top:20px;left:20px;color:black;z-index:1;white-space: pre;">{{SHIPPER}}</p>
				<p style="FONT-SIZE: 14px;font-family: Verdana;position:absolute;top:30px;left:430px;color:black;z-index:1;white-space: pre;">{{BOOKINGNO}}</p>
				<p style="FONT-SIZE: 14px;font-family: Verdana;position:absolute;top:-9px;left:790px;color:black;z-index:1;white-space: pre;">{{FCRNO}}</p>
				<p style="FONT-SIZE: 14px;font-family: Verdana;position:absolute;top:31px;left:790px;color:black;z-index:1;white-space: pre;">{{EXPNO}}</p>
				<p style="FONT-SIZE: 14px;font-family: Verdana;position:absolute;top: 1314px;left:20px;color:black;z-index:1;white-space: pre;">{{APPLYTO}}</p>
				<p style="FONT-SIZE: 14px;font-family: Verdana;position:absolute;top: 162px;left:20px;color:black;z-index:0;white-space: pre;">{{CONSIGNEE}}</p>
				<p style="FONT-SIZE: 14px;font-family: Verdana;position:absolute;top: 337px;left:20px;color:black;z-index:0;white-space: pre;">{{NOTIFYPARTY}}</p>
				<p style="FONT-SIZE: 14px;font-family: Verdana;position:absolute;top: 498px;left:30px;color:black;z-index:0;white-space: pre;">{{CARRIER}}</p>
				<p style="FONT-SIZE: 14px;font-family: Verdana;position:absolute;top: 335px;left:260px;color:black;z-index:0;white-space: pre;">{{RECPTPLACE}}</p>
				<p style="FONT-SIZE: 14px;font-family: Verdana;position:absolute;top: 580px;left:555px;color:black;z-index:0;white-space: pre;">{{VESSEL}}</p>
				<p style="FONT-SIZE: 14px;font-family: Verdana;position:absolute;top: 580px;left:885px;color:black;z-index:0;white-space: pre;">{{POL}}</p>
				<p style="FONT-SIZE: 14px;font-family: Verdana;position:absolute;top: 610px;left:30px;color:black;z-index:0;white-space: pre;">{{POD}}</p>
				<p style="FONT-SIZE: 14px;font-family: Verdana;position:absolute;top: 610px;left:341px;color:black;z-index:0;white-space: pre;"></p>
				<p style="FONT-SIZE: 14px;font-family: Verdana;position:absolute;top: 670px;left:30px;color:black;z-index:0;white-space: pre;">{{MARKSANDNOS}}</p>
				<p style="FONT-SIZE: 14px;font-family: Verdana;position:absolute;top: 670px;left:180px;color:black;z-index:0;white-space: pre;">{{NOOFPKGS}}</p>
				<p style="FONT-SIZE: 14px;font-family: Verdana;position:absolute;top: 670px;left:365px;color:black;z-index:0;white-space: pre;">{{ITCDESC}}</p>
				<p style="FONT-SIZE: 14px;font-family: Verdana;position:absolute;top: 670px;left:793px;color:black;z-index:0;white-space: pre;">{{GRWT}}</p>
				<p style="FONT-SIZE: 14px;font-family: Verdana;position:absolute;top: 670px;left:935px;color:black;z-index:0;white-space: pre;">{{VOL}}</p>
				<p style="FONT-SIZE: 14px;font-family: Verdana;position:absolute;top: 845px;left:30px;color:black;z-index:0;white-space: pre;">{{MISC}}</p>
				<p style="FONT-SIZE: 14px;font-family: Verdana;position:absolute;top: 1227px;left:367px;color:black;z-index:0;white-space: pre;">{{PP}}</p>
				<p style="FONT-SIZE: 14px;font-family: Verdana;position:absolute;top: 1227px;left:542px;color:black;z-index:0;white-space: pre;">{{CC}}</p>
				<p style="FONT-SIZE: 14px;font-family: Verdana;position:absolute;top: 1227px;left:810px;color:black;z-index:0;white-space: pre;">{{PLACEDATE}}</p>
                </div>
        `
})

export class ExptMTOprint implements OnInit, OnChanges {
    private baseUrl: string = 'Export/Export_FCR_PRINTPREVIEW';
    @Input() hbltype: string;

    @ViewChild("print", {static: false}) public MTO: ElementRef;

    SHIPPER: any = "";
	BOOKINGNO: any = "";
    CONSIGNEE: any = "";
    NOTIFYPARTY: any = "";
    FCRNO: any = "";
    FCRDT: any = "";
    APPLYTO: any = "";
    CARRIER: any = "";
    RECPTPLACE: any = "";
    VESSEL: any = "";
    POL: any = "";
    POD: any = "";
    PODEL: any = "";
    APPLYTO1: any = "";
    MARKSANDNOS: any = "";

    NOOFPKGS: any = "";
    ITCDESC: any = "";
    GRWT: any = "";
    VOL: any = "";
    MISC: any = "";
    PP: any = "";
    CC: any = "";
    TOTPP: any = "";
    TOTCC: any = "";
    PLACEDATE: any = "";
    EXPNO: any = "";

    Bltype: any = "";
    FCRDET: any;
    buttonStatus = false;

    constructor(
        private _router: Router,
        private _dataService: DataService,
        private _auth: AuthService,
        private _toasterService: ToastCommonService,
        private _loginService: LoginService,
        private _fcrsharedvataSerice: FcrSharedDataService,
        private _fcrHbltypesharedvataSerice: FcrSharedDataService) {
    }
    ngOnChanges()
    {
        this.hbltype = this._fcrsharedvataSerice.fcrHbltypesharedData;

        //
        const jsonExport = { FCRNO: this._fcrsharedvataSerice.fcrsharedData };
        this._dataService.Common(this.baseUrl, jsonExport)
            .subscribe((data: any) => {
                if (data.Table[0].STATUS == 100) {
                    this.FCRDET = data.Table;

                    this.SHIPPER = this.FCRDET[0].SHIPPER;
                    this.CONSIGNEE = this.FCRDET[0].CONSIGNEE;
                    this.NOTIFYPARTY = this.FCRDET[0].NOTIFYPARTY;
                    this.FCRNO = this.FCRDET[0].FCRNO;
                    this.FCRDT = this.FCRDET[0].FCRDT;
                    this.APPLYTO = this.FCRDET[0].APPLYTO;
                    this.CARRIER = this.FCRDET[0].CARRIER;
                    this.RECPTPLACE = this.FCRDET[0].RECPTPLACE;
                    this.VESSEL = this.FCRDET[0].VESSEL;
                    this.POL = this.FCRDET[0].POL;
                    this.POD = this.FCRDET[0].POD;
                    this.PODEL = this.FCRDET[0].PODEL;
                    this.APPLYTO1 = this.FCRDET[0].APPLYTO;
                    this.MARKSANDNOS = this.FCRDET[0].MARKSANDNOS;
                    this.NOOFPKGS = this.FCRDET[0].NOOFPKGS;
                    this.ITCDESC = this.FCRDET[0].ITCDESC;
                    this.GRWT = this.FCRDET[0].GRWT;
                    this.VOL = this.FCRDET[0].VOL;
                    this.MISC = this.FCRDET[0].MISC;
                    this.PP = this.FCRDET[0].PP;
                    this.CC = this.FCRDET[0].CC;
                    this.TOTPP = this.FCRDET[0].TOTPP;
                    this.TOTCC = this.FCRDET[0].TOTCC;
                    this.PLACEDATE = this.FCRDET[0].PLACEDATE;
                    this.EXPNO = this.FCRDET[0].EXPNO;




                    this._toasterService.toast('info', 'Complete', 'Data filled successfully');
                } else {

                    this._toasterService.toast('error', 'Error', data.Table[0].statusText);
                }

            },
            (error) => {
                this._toasterService.toast('error', 'Error', error.status + '<br/>' + error.statusText);
            },
            () => {
            });

    }
    finalMTOPrint() {
        //let PrintFCRData = this.FCR.nativeElement.InnerHTML;
        const jsonExport = { fcr: this._fcrsharedvataSerice.fcrsharedData ,citycode: this._loginService.getLogin()[0].CITYCODE ,userid: this._loginService.getLogin()[0].CMPID};
        this._dataService.getData("Export/FCR_printflagUpdate", jsonExport)
            .subscribe((data: any) => {
                 
                });
        var content = this.MTO.nativeElement.innerHTML;
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

    ngOnInit(): void {        
    }
}

@Component({
    selector: 'app-seablprint',
    templateUrl: 'exp_prt_print.component.html'

})
export class ExptPrint implements OnInit {
    PType: any = "";
    constructor(
        private _router: Router,
        private _dataService: DataService,
        private _auth: AuthService,
        private _toasterService: ToastCommonService,
        private _loginService: LoginService,
        private _fcrsharedvataSerice: FcrSharedDataService,
        private _fcrHbltypesharedvataSerice: FcrSharedDataService) {
    }
    ngOnInit(): void {
        this.PType = this._fcrsharedvataSerice.fcrHbltypesharedData;

    }

}
