import { Component, OnInit, ViewChild, ElementRef, Input, ChangeDetectionStrategy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { DataService } from '../../../shared/service/dataService';
import { LoginService } from '../../../shared/service/loginService';
import { ToastCommonService } from '../../../shared/service/toastService';
import { ButtonService } from '../../../shared/common-font-changer.directive';
import { IMyDpOptions } from 'mydatepicker';

/**
 * Export - air shipment & CO2 (/export/Consignment/edit-co2/:exptno). Ported from
 * MPERPNG-20 (expt-master-edit-co2). Reads Export/ExportEditActualFlightDateData and
 * writes Export/ExportEditCo2Update. The update endpoint is being added to the Links
 * API: until it exists every failure is reported once and the page stays usable
 * (fail soft). A missing data.Table / Table4 is treated as empty.
 */
@Component({
    changeDetection: ChangeDetectionStrategy.Eager,
    selector: 'app-edit-co2',
    templateUrl: 'expt-master-edit-co2.html',
    // Page kit is global (src/styles/kit); kit-consignment scopes consignment-page.css.
    host: { class: 'kit-consignment' },
    standalone: false
})
export class EditCo2Component implements OnInit {
    // Lets the edit-hub drawer host this editor inline instead of routing to it.
    /** True when hosted inline (edit-hub drawer): the drawer owns closing, so no Abort here. */
    inline: boolean = false;
    @Input() set exptnoInput(value: string) {
        if (value) { this.inline = true; this.ExptNo = value; this.loadError = ''; this.pageLoad(value); }
    }
    @ViewChild('submitButton', {static: false}) submitButton: ElementRef;
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

    ExptNo: string;
    CityCode: string = '';
    displayData: any;
    exptNoList: Array<any> = [];
    dhakaSubAgentList: Array<any> = [];
    dhakaSubAgent: any = null;
    FlightDate: any = null;
    CoEmissionLevel: number;

    MAWBDEST: string = "";
    MAWBFRT: string = "";
    commoncities: any = [];
    transtype: any = "Direct";
    transportone: any = null;
    transporttwo: any = null;
    etdonedt: any = null;
    etdtwodt: any = null;
    etaonedt: any = null;
    etatwodt: any = null;
    fltno1: string = "";
    fltno2: string = "";
    ACTUALFLIGHTNO: any = "";
    ACTUALFLIGHTDT: any = null;
    CONTAINERNO: string;
    CONTAINERNO_ETA: string;
    isBold: boolean = true;
    ACTUAL_FLIGHTDT: string = "";
    strexptno: string = '';
    loadError: string = '';
    saving: boolean = false;

    constructor(
        private _dataService: DataService,
        private _loginService: LoginService,
        private _toasterService: ToastCommonService,
        private _router: Router,
        private _route: ActivatedRoute,
        private _disable: ButtonService) {
        this.CityCode = this._loginService.getLogin()[0].CITYCODE;
        this._route.params.subscribe(params => {
            // Skip when hosted inline (edit-hub drawer): the exptno then arrives via @Input.
            if (!params["exptno"]) { return; }
            this.ExptNo = params["exptno"];
            this.pageLoad(params["exptno"]);
        });
    }

    ngOnInit() {

    }

    pageLoad(exptno) {
        const _jsonData = {
            ExptNo: exptno,
            Citycode: this._loginService.getLogin()[0].CITYCODE
        };
        this._dataService.getData("Export/ExportEditActualFlightDateData", _jsonData)
            .subscribe((data: any) => {
                const rows: any[] = (data && Array.isArray(data.Table)) ? data.Table : [];
                const row = rows.length ? rows[0] : null;
                if (row && row.AEROBILLNO != undefined) {
                    this.displayData = row;
                    this.MAWBDEST = this.displayData.MAWBDEST;
                    this.MAWBFRT = this.displayData.MAWBFRT;
                    this.fltno1 = this.displayData.FLIGHTNO1;
                    this.ACTUALFLIGHTNO = this.displayData.ACTUALFLIGHTNO;
                    if (this.displayData.ACTUALFLIGHTDT != '') {
                        this.ACTUALFLIGHTDT = this.displayData.ACTUALFLIGHTDT;
                        this.ACTUAL_FLIGHTDT = this.displayData.ACTUALFLIGHTDT;
                    }
                    if (this.displayData.TRANSPORT1 != "") {
                        this.transtype = "Trans";
                        this.transportone = this.displayData.TRANSPORT1;
                        this.etdonedt = (this.displayData.ETDPORT1 != '') ? this._dataService.stringdttoArry(this.displayData.ETDPORT1) : null;
                        this.etaonedt = (this.displayData.ETAPORT1 != '') ? this._dataService.stringdttoArry(this.displayData.ETAPORT1) : null;
                        this.fltno2 = this.displayData.FLIGHTNO2;
                        this.transporttwo = this.displayData.TRANSPORT2;
                        this.etdtwodt = (this.displayData.ETDPORT2 != '') ? this._dataService.stringdttoArry(this.displayData.ETDPORT2) : null;
                        this.etatwodt = (this.displayData.ETAPORT2 != '') ? this._dataService.stringdttoArry(this.displayData.ETAPORT2) : null;
                    } else {
                        this.transtype = "Direct";
                    }
                    this.CoEmissionLevel = this.displayData.CO2_EMITION_LVL;
                    this.CONTAINERNO = this.displayData.CONTAINERNO;
                    this.CONTAINERNO_ETA = this.displayData.CONTAINERNO_ETA;
                    this.exptNoList = (data && data.Table1) ? data.Table1 : [];
                    this.dhakaSubAgentList = (data && data.Table2) ? data.Table2 : [];
                    this.commoncities = (data && data.Table3) ? data.Table3 : [];
                    // MP reads a pre-joined list from Table4; the Links proc may not return it,
                    // so fall back to the linked export nos. from Table1.
                    this.strexptno = (data && data.Table4 && data.Table4.length && data.Table4[0].CommaSeparatedExptNo)
                        ? data.Table4[0].CommaSeparatedExptNo
                        : this.exptNoList.map((o: any) => o && o.EXPTNO).filter((x: any) => !!x).join(', ');
                } else {
                    this.loadError = 'No air shipment details are available for this consignment. Generate the MAWB first.';
                    if (row && (row.status || row.statusText)) {
                        this._toasterService.toast('error', 'Alert', row.status + '<br/>' + row.statusText);
                    }
                }
            },
            (error) => {
                this.loadError = 'Air shipment details could not be loaded.';
                this._toasterService.toast('error', 'Error', (error && error.status) + '<br/>' + (error && error.statusText));
            });
    }

    submit() {
        if (this.saving) { return; }
        const _jsonData = {
            ExptNo: this.ExptNo,
            Co2EmissionLevel: this.CoEmissionLevel,
            CmpCode: this._loginService.getLogin()[0].CMPCODE,
            Citycode: this._loginService.getLogin()[0].CITYCODE,
            MakerId: this._loginService.getLogin()[0].CMPID,
        };

        this.saving = true;
        this._disable.disableButton(this.submitButton);
        this._dataService.Common("Export/ExportEditCo2Update", _jsonData)
            .subscribe((data: any) => {
                this.saving = false;
                this._disable.enableButton(this.submitButton);
                const row = (data && Array.isArray(data.Table) && data.Table.length) ? data.Table[0] : null;
                if (row && row.STATUS == "100") {
                    alert('Data Updated Successfully');
                } else if (row && row.STATUS == "101") {
                    alert(row.STATUSTEXT);
                } else {
                    this._toasterService.toast('error', 'Error', (row && row.STATUSTEXT) ? row.STATUSTEXT : 'CO2 update is not available yet. Nothing was saved.');
                }
            },
            (error) => {
                this.saving = false;
                this._disable.enableButton(this.submitButton);
                const missing = error && (error.status == 404 || error.status == 0);
                this._toasterService.toast('error', 'Error', missing
                    ? 'CO2 update is not available yet. Nothing was saved.'
                    : (error && error.status) + '<br/>' + (error && error.statusText));
            });
    }

    transType(check): void {
        this.transtype = check;
        if (check == "Direct") {
            this.transportone = null;
            this.transporttwo = null;
            this.etdonedt = null;
            this.etdtwodt = null;
            this.etatwodt = null;
        } else if (check == "Trans") { }
    }

}
