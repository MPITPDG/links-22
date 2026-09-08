import { Component, OnInit } from '@angular/core';
import { DataService } from '../../shared/service/dataService';
import { AuthService } from '../../shared/service/authService';
import { Router } from '@angular/router';
import { LoginService } from '../../shared/service/loginService';
import { IMyDpOptions } from 'mydatepicker';
import { ToastCommonService } from '../../shared/service/toastService';
import { LoaderService } from '../../shared/service/loader.service';
import { TabHeadingDirective } from 'ngx-bootstrap';
@Component({
    selector: 'app-epcopy-exl-rpt',
    templateUrl: 'exp-rpt-epcopy-search.component.html'

})
export class ExptRptEpCopyExl implements OnInit{
    checkWise: string = "1";
    rpttype: string = "-1";
    city: string = "-1";
    exporter: string = "-1";
    dtfrmt: any = "";
    dtto: any = "";

    listExporter: any = [];
    listCity: any = [];
    constructor(
        private _router: Router,
        private _dataService: DataService,
        private _auth: AuthService,
        private _toasterService: ToastCommonService,
        private _loginService: LoginService,
        private loaderService: LoaderService

    ) {
    }

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
    
    onexcelGeneration() {
        this._toasterService.toast('info', 'inprocess', "Start generating Ep-Copy Excel");
        this.loaderService.display(true);
        let dtfrom, todt, mode;
        if (this.checkWise == "1") { mode = "SEA"; }
        else { mode = "AIR"; }
        dtfrom = this.dtfrmt.formatted;
        todt = this.dtto.formatted;
        let login_name = this._loginService.getLogin()[0].CMPID;
     //   console.log(this._loginService.getLogin()[0]);
        const jsonExport = { Mode: mode, Type: this.rpttype, Exporter: this.exporter, DateType: "DOCUMENT_RECEIVED", FromDate: dtfrom, ToDate: todt, City: this.city, cmp_code: this._loginService.getLogin()[0].CMPCODE, CityCode: this._loginService.getLogin()[0].CITYCODE, Username: this._loginService.getLogin()[0].CMPID };
        this._dataService.getDownload("Export/exp_Rpt_EpCopy", jsonExport, { responseType: 'arraybuffer' })
            .subscribe((data: any) => {
                this._dataService.common_downloadFileByUrl(data, "Ep_copy_" + login_name + ".xls");
                this.loaderService.display(false);

            });
    }
    mainCheck(ctype) {
        this.checkWise = ctype;
    }
    ngOnInit(): void {
        this._loginService.verifyRights(19, '')
        .subscribe((data: any) => { this._loginService.checkVerify('View', data); });

        const jsonExport = { Cmpid: this._loginService.getLogin()[0].CMPID, Citycode: this._loginService.getLogin()[0].CITYCODE, Citycode1: this._loginService.getLogin()[0].CITYCODE1 };
        this._dataService.getData("Export/Fill_Exporter", jsonExport)
            .subscribe((data: any) => {
                this.listExporter = data.Table;
            });

        this._dataService.getAll("Export/Fill_City")
            .subscribe((data: any) => {
                this.listCity = data.Table;

            });
    }

}

@Component({
    selector: 'app-dsr-exl-rpt',
    templateUrl: 'exp-rpt-dsr.component.html'

})

export class ExptDSRExl implements OnInit {

    checkWise: string = "1";

    city: string = "-1";
    concode:any  = null;//string = "-1";
    SAgent: string = "-1";
    Shipper: string= "-1";
    Mode : string="-1"

    dtfrmt: any = "";
    condisable: boolean = false;
    agtdisable: boolean = true;
    shpdisable: boolean= true;
    listconcode: any = [];
    listSAgent: any = [];
    listShipper:any=[];

    constructor(
        private _router: Router,
        private _dataService: DataService,
        private _auth: AuthService,
        private _toasterService: ToastCommonService,
        private _loginService: LoginService,
        private loaderService: LoaderService

    ) {
    }

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

    ngOnInit(): void {
        this._loginService.verifyRights(93, '')
        .subscribe((data: any) => { this._loginService.checkVerify('View', data); });


        this._dataService.getAll("Export/Fill_dsr_PAGELOAD")
            .subscribe((data: any) => {
                this.listconcode = data.Table;
                this.listSAgent = data.Table1;
                this.listShipper=data.Table3
            });
    }
    mainCheck(ctype) {
        this.checkWise = ctype;
        if (ctype == "1") {
            this.condisable = false;
            this.agtdisable = true;
            this.shpdisable=true;
            this.SAgent="-1"
            this.Shipper="-1"
        }
       else if (ctype == "2") {
            this.condisable = true;
            this.agtdisable = false;
            this.shpdisable=true;
            this.concode="-1"
            this.Shipper="-1"
        }
        else {
            this.condisable = true;
            this.agtdisable = true;
            this.shpdisable= false;
            this.concode="-1"
            this.SAgent="-1"
        }
    }

    onexcelGeneration() {
        this._toasterService.toast('info', 'inprocess', "Start generating DSR Excel");
        this.loaderService.display(true);
        let dtfrom, todt, mode, consignee, SourcAgent,shipper;
        if (this.checkWise == "1") {
            if (this.concode == "-1"  || this.concode == null) {
                this._toasterService.toast('error', 'Error', "Please select consignee");
                this.loaderService.display(false);
                return false;
            }
        } 
        else if (this.checkWise == "2") {
            if (this.SAgent == "-1") {
                this._toasterService.toast('error', 'Error', "Please select Sourcing Agent");
                this.loaderService.display(false);
                return false;
            }
        }
        else {
            if (this.Shipper == "-1") {
                this._toasterService.toast('error', 'Error', "Please select Shipper");
                this.loaderService.display(false);
                return false;
            }
        }
        if (this.Mode == "-1") {
            this._toasterService.toast('error', 'Error', "Please select Shipment Mode");
            this.loaderService.display(false);
            return false;
        }
        dtfrom = this.dtfrmt.formatted;
        if (this.concode == "-1" || this.concode == null) { consignee = "0"; } else { consignee = this.concode; }

        if (this.SAgent == "-1") { SourcAgent = "0"; } else { SourcAgent = this.SAgent; }
        
        if (this.Shipper == "-1") { shipper = "0"; } else { shipper = this.Shipper; }

        if (this.checkWise == "1")

        {
           
            consignee = this.concode;
        }
        else   if (this.checkWise == "2")

         {
            SourcAgent = this.SAgent; 
            consignee="AGT" ;   
         }
         else  if (this.checkWise == "3")

         {
            SourcAgent = this.Shipper; 
            consignee="SHP" ;  
         }
        const jsonExport = { concode: consignee,  expcode: SourcAgent, FromDate: dtfrom, origin: this.city, cmp_id: this._loginService.getLogin()[0].CMPID, cmpcode: this._loginService.getLogin()[0].CMPCODE,Mode:this.Mode };
        this._dataService.getDownload("Export/exp_Rpt_DSR", jsonExport, { responseType: 'arraybuffer' })
            .subscribe((data: any) => {
                this._dataService.common_downloadFileByUrl(data, "DSR_Report.xls");
                this.loaderService.display(false);

            });

    }

}


@Component({
    selector: 'app-tonnage-exl-rpt',
    templateUrl: 'exp-rpt-tonnage-search.component.html'
})
export class ExptTonnage implements OnInit {
    checkmode: string = "1";
    checkdate: string = "1";
    checkSub: string = "1";
    fddisable: boolean = false;
    wkdisable: boolean = true;
    condisable: boolean = false;
    aldisable: boolean = true;
    agtdisable: boolean = true;
    destdisable: boolean = true;
    aldisableR: boolean = false;
    dtfrmt: any = "";
    dtto: any = "";
    dtwkfrmt: any = "";
    origin :any [];
    dest : any [];

    concode = "-1";
    
    aline = "-1";
    SAgent = "-1"
     

    listconcode: any[];
    listAline: any[];
    listAgent: any[];
    listSAgent: any[];
    listorigin :any [];
    listdetport : any[];

    constructor(
        private _router: Router,
        private _dataService: DataService,
        private _auth: AuthService,
        private _toasterService: ToastCommonService,
        private _loginService: LoginService,
        private loaderService: LoaderService

    ) {
    }

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
    ModeCheck(ctype) {
        if (ctype == "1") { this.aldisableR = true; 
            this.destdisable=false;}
        else { this.aldisableR = false; }
    }
    mainchkDate(ctype) {
        if (ctype == "1") {
            this.fddisable = false;
            this.wkdisable = true;
        }

        else {
            this.fddisable = true;
            this.wkdisable = false;
        }
    }
    mainSub(ctype) {
        if (ctype == "1") {
            this.condisable = false;
            this.agtdisable = true;
            this.aldisable = true
        }
        else if (ctype == "2") {
            this.condisable = true;
            this.agtdisable = false;
            this.aldisable = true
        }
        else if (ctype == "3") {
            this.condisable = true;
            this.agtdisable = false;
            this.aldisable = true
        }

    }
    ngOnInit(): void {

        this._loginService.verifyRights(62, '')
        .subscribe((data: any) => { this._loginService.checkVerify('View', data); });

        this._dataService.getAll("Export/Fill_Tonnage_PAGELOAD")
            .subscribe((data: any) => {
                this.listconcode = data.Table;
                this.listAline = data.Table1;
                this.listAgent = data.Table2;
            });

            this._dataService.getAll("Export/Fill_Tonnage_PAGELOAD_origin_India_Air")
            .subscribe((data: any) => {
                this.listorigin = data.Table;                 
            });

            this._dataService.getAll("Export/Fill_Tonnage_PAGELOAD_Dest_India_SeaAir")
            .subscribe((data: any) => {
                this.listdetport = data.Table;                 
            });
    }
    onexcelGeneration() {
        this._toasterService.toast('info', 'inprocess', "Start generating Cargo on Hand Excel");
        this.loaderService.display(true);
        let filname, mode, dtfrom, TOdt, wkdt, RType, SearchVal;


        if (this.checkdate == "1") {
            RType = 'Date';
            dtfrom = this.dtfrmt.formatted;
            TOdt = this.dtto.formatted;
            if (dtfrom == "") {
                this._toasterService.toast('warning', 'warning', "Please select From date");
                this.loaderService.display(false);
                return false;
            }
            if (TOdt == "") {
                this._toasterService.toast('warning', 'warning', "Please select Todate");
                this.loaderService.display(false);
                return false;
            }
        }
        if (this.checkdate == "2") {
            RType = 'Day';
            wkdt = this.dtwkfrmt.formatted;

            if (wkdt == "") {
                this._toasterService.toast('warning', 'warning', "Please select Week date");
                this.loaderService.display(false);
                return false;
            }
        }

        if (this.checkSub == "1") {
            RType = 'DATECON';
            if (this.concode == "-1") {

                this._toasterService.toast('warning', 'warning', "Please select consignee");
                this.loaderService.display(false);
                return false;
            }
            else { SearchVal = this.concode; }
            if (this.checkSub == "1" && this.checkdate == "2") { RType = 'DATECON'; }
            else { RType = 'DATECON'; }
        }
        else if (this.checkSub == "2") {

            if (this.aline == "-1") {
                this._toasterService.toast('warning', 'warning', "Please select AirLine");
                this.loaderService.display(false);
                return false;
            }
            else { SearchVal = this.aline; }
            if (this.checkSub == "2" && this.checkdate == "2") { RType = 'DATESUP'; }
            else { RType = 'DAYSUP'; }
        }

        else if (this.checkSub == "3") {
            if (this.SAgent == "-1") {
                this._toasterService.toast('warning', 'warning', "Please select Agent");
                this.loaderService.display(false);
                return false;
            }
            else { SearchVal = this.SAgent; }
            if (this.checkSub == "3" && this.checkdate == "2") { RType = 'DATEAGT'; }
            else { RType = 'DAYAGT'; }
        }

        if (this.checkmode == "1") {
            mode = "SEA";
            filname = "SEA_TONNAGE.XLS"
        }
        else {
            mode = "AIR";
            filname = "AIR_TONNAGE.XLS"
        }
         const jsonShip = { FromDate: dtfrom, ToDate: TOdt, Mode: mode, Origin: this.origin.toString(), Consignee: SearchVal, Type: RType, WeekDay: wkdt, cmpid: this._loginService.getLogin()[0].CMPID, cmpcode: this._loginService.getLogin()[0].CMPCODE, destination: this.dest.toString(), };
        this._dataService.getDownload("Export/exp_Rpt_AirTonnage", jsonShip, { responseType: 'arraybuffer' })
             .subscribe((data: any) => {
                 this._dataService.common_downloadFileByUrl(data, filname);
                 this.loaderService.display(false);
            });


    }
}


@Component({
    selector: 'app-shipment-status',
    templateUrl: 'exp-rpt-shipment-status.html'

})

export class Exptshipmentstatus implements OnInit {
    concode : any  = null;//= "-1";
    SAgent = "-1";
    Busass = "-1";
    city = "All";
    dtfrmt: any = "";

    listconcode: any[];
    listSAgent: any[];
    listBusAss: any[];
    checkWise: string = "1";
    checkmode: string = "1";

    condisable: boolean = false;
    agtdisable: boolean = true;
    Badisable: boolean = true;
    Namelist: any;

    constructor(
        private _router: Router,
        private _dataService: DataService,
        private _auth: AuthService,
        private _toasterService: ToastCommonService,
        private _loginService: LoginService,
        private loaderService: LoaderService

    ) {
    }

    public myDatePickerOptions: IMyDpOptions = {
        dateFormat: 'dd-mmm-yyyy',
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

    ngOnInit(): void {
        this._loginService.verifyRights(76, '')
        .subscribe((data: any) => { this._loginService.checkVerify('View', data); });

        this._dataService.getAll("Export/Fill_Tonnage_PAGELOAD")
            .subscribe((data: any) => {
                this.listconcode = data.Table;
            });
        this._dataService.getAll("Export/Fill_ship_status_source_agent")
            .subscribe((data: any) => {
                this.listSAgent = data.Table;
            });

        this._dataService.getAll("Export/Fill_ship_status_business_associate")
            .subscribe((data: any) => {
                this.listBusAss = data.Table;
            });
    }
    mainCheck(ctype) {
        this.checkWise = ctype;
        if (ctype == "1") {
            this.condisable = false;
            this.agtdisable = true;
            this.Badisable = true;
        }
        if (ctype == "2") {
            this.condisable = true;
            this.agtdisable = false;
            this.Badisable = true;
        }
        if (ctype == "3") {
            this.condisable = true;
            this.agtdisable = true;
            this.Badisable = false;
        }
    }

    ModeCheck(ctype) {
        this.checkmode = ctype;
    }

    onexcelGeneration() {
        this._toasterService.toast('info', 'inprocess', "Start generating shipment Status Excel");
        this.loaderService.display(true);
        let dtfrom, mode, client, ReportType, clientname, type;
        type = "0";
        dtfrom = this.dtfrmt.formatted;


        if (this.checkWise == "1") {
            ReportType = "Consignee";
            if (this.concode == "-1" || this.concode == null) {
                this._toasterService.toast('warning', 'warning', "Please select consignee");
                this.loaderService.display(false);
                return false;
            }
            else {
                client = this.concode;

                this.Namelist = this.listconcode.filter((linerlist: any) => linerlist.con_code == this.concode);
                clientname = this.Namelist[0].con_name;

            }

        }
        if (this.checkWise == "2") {
            ReportType = "SourcingAgent";
            if (this.SAgent == "-1") {
                this._toasterService.toast('warning', 'warning', "Please select Sourcing Agent");
                this.loaderService.display(false);
                return false;
            }
            else {
                client = this.SAgent;

                this.Namelist = this.listSAgent.filter((linerlist: any) => linerlist.exp_code == this.SAgent);
                clientname = this.Namelist[0].con_name;

            }
        }
        if (this.checkWise == "3") {
            ReportType = "BusinessAssociate";
            if (this.Busass == "-1") {
                this._toasterService.toast('warning', 'warning', "Please select Bussiness Associate");
                this.loaderService.display(false);
                return false;
            }
            else {
                client = this.Busass;

                this.Namelist = this.listBusAss.filter((linerlist: any) => linerlist.SUP_CODE == this.Busass);
                clientname = this.Namelist[0].SUP_NAME;
            }
        }

        if (dtfrom == "") {

            this._toasterService.toast('warning', 'warning', "Please select date");
            this.loaderService.display(false);
            return false;
        }
        if (this.checkmode == "1") { mode = "SEA"; }
        else { mode = "AIR"; }

        const jsonShip = { ClientType: ReportType, Client: client, Origin: this.city, Mode: mode, FromDate: dtfrom, cmpcode: this._loginService.getLogin()[0].CMPCODE, Nameclient: clientname };
        this._dataService.getDownload("Export/exp_Rpt_shipment_Status", jsonShip, { responseType: 'arraybuffer' })
            .subscribe((data: any) => {
                this._dataService.common_downloadFileByUrl(data, "Shipment_status.xls");
                this.loaderService.display(false);

            });
    }
}

@Component({
    selector: 'app-cargo-onhand',
    templateUrl: 'exp_rpt_cargo_onhand.component.html'

})

export class ExptRptCargoOnHand implements OnInit {
    concode = "-1";
    listconcode: any[];
    checkmode: string = "1";
    condisable: boolean = false;
    constructor(
        private _router: Router,
        private _dataService: DataService,
        private _auth: AuthService,
        private _toasterService: ToastCommonService,
        private _loginService: LoginService,
        private loaderService: LoaderService

    ) {
    }
    ngOnInit(): void {

        this._loginService.verifyRights(216, '')
        .subscribe((data: any) => { this._loginService.checkVerify('View', data); });


        //console.log(this._loginService.getLogin()[0]);

        this._dataService.getAll("Export/Fill_consignee_cargo_onhand")
            .subscribe((data: any) => {
                this.listconcode = data.Table;
            });
    }
    onexcelGeneration() {
        this._toasterService.toast('info', 'inprocess', "Start generating Cargo on Hand Excel");
        this.loaderService.display(true);
        let filname, mode;


        if (this.concode == "-1") {
            this._toasterService.toast('warning', 'warning', "Please select consignee");
            this.loaderService.display(false);
            return false;
        }


        if (this.checkmode == "1") {
            mode = "SEA";
            filname = "SEA_CARGOONHAND.XLS"
        }
        else {
            mode = "AIR";
            filname = "AIR_CARGOONHAND.XLS"
        }
        const jsonShip = { CONCODE: this.concode, citycode: this._loginService.getLogin()[0].CITYCODE, cmp_code: this._loginService.getLogin()[0].CMPCODE, Mode: mode };
        this._dataService.getDownload("Export/exp_Rpt_Cargo_onhand", jsonShip, { responseType: 'arraybuffer' })
            .subscribe((data: any) => {
                this._dataService.common_downloadFileByUrl(data, filname);
                this.loaderService.display(false);

            });
    }
}