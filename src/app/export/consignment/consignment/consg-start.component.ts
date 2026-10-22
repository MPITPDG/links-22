import { Component, OnInit, ViewEncapsulation, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { DataService } from '../../../shared/service/dataService';
import { AuthService } from '../../../shared/service/authService';
import { Router } from '@angular/router';
import { ToastCommonService } from '../../../shared/service/toastService';
import { LoginService } from '../../../shared/service/loginService';
import { SharedDataSerice } from '../../export-share-data.service';
import { LoaderService } from '../../../shared/service/loader.service';
import { ConsignmentPrefillService, ConsignmentPrefillStart } from './consignment-prefill.service';

@Component({
    selector: 'app-consg-start',
    templateUrl: 'consg-start.component.html',
    // Page kit is global (src/styles/kit); kit-consignment scopes consignment-page.css.
    host: { class: 'kit-consignment' },
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class ConsgStartComponent implements OnInit {
    private baseUrl: string = 'Export/GetExportConsignment';

    /**
     * Hosted in ConsgWorkspaceComponent instead of owning a page (ported from
     * MPERPNG-20): the header is dropped. Nothing is written to the server here
     * either way - the handoff is still SharedDataService, only the navigate is
     * replaced by `continued`.
     */
    @Input() embedded: boolean = false;

    /**
     * True once Continue has been pressed and the consignment details are open
     * below. The mode-of-shipment radios and the vessel are disabled and the
     * Continue bar is gone until "Edit parties & shipment" unlocks them again.
     * No validation, payload or handler changes.
     */
    @Input() locked: boolean = false;

    @Output() continued = new EventEmitter<void>();

    // ---- presentation (MP) -----------------------------------------------
    readonly groups: { key: string; label: string; hint: string }[] = [
        { key: 'parties', label: 'Parties', hint: 'Exporter / shipper, bill to, manufacturer, agents' },
        { key: 'consignee', label: 'Consignee & buyer', hint: 'Consignee, buyer and the bank consigned to' },
        { key: 'shipment', label: 'Shipment', hint: 'Mode of shipment and the vessel - locked after Continue' },
    ];

    /** Key of the group last opened; '' means none. Purely presentational. */
    openSection: string = '';

    private filled(v: any): boolean {
        return v !== undefined && v !== null && String(v).trim() !== '';
    }

    groupFilled(key: string): boolean {
        switch (key) {
            case 'parties': return this.filled(this.txtshipper) || this.filled(this.txtexpt_billto);
            case 'consignee': return this.filled(this.txtConsignee) || this.filled(this.txtBuyername);
            case 'shipment': return this.rbstuff != null;
            default: return false;
        }
    }

    get filledCount(): number {
        return this.groups.filter(g => this.groupFilled(g.key)).length;
    }

    exporters:Array<any> = [];
    agents: Array<any> = [];
    subagents: Array<any> = [];
    consignees: Array<any> = [];
    banks: Array<any> = [];
    vessels: Array<any> = [];

    commondrpselected: string;
    dateNow: any;
    rbexptshipper: boolean = false;
    rbbillto: boolean = false;
    rbmanufaturer: boolean = false;

    rbexporter: number;
    rbCons: number;
    rbConsDisabled: number;
    hdshipper: string;
    hdexpt_billto: string;
    hdmanufacturer: string;
    hdexpt_consignee: any;
    hdexpt_buyer: any;
    txtshipper;
    txtexpt_billto;
    txtmanufacturer;
    drpShipper: any;
    drpexpt_consignee: any;
    drpManufact: any;
    drpAgent: any = null;
    drpSubAgent: any = null;
    chknotify: boolean;
    drpBank: any = null;
    drpVessel: any = null;
    txtConsignee: any;
    txtBuyername: any;
    rbstuff: number;
    drpVesselDisabled: number;
    trSubAir: string;
    rbsubair: number = 0;
    shipmentMode: string = 'SEA';
    airShipmentType: string;
    trSubSea: string;
    rbsubsea: number = 0;
    seaShipmentType: string;
    City: string = '';

    constructor(
        private _router: Router,
        private _dataService: DataService,
        private _auth: AuthService,
        private _toasterService: ToastCommonService,
        private _loginService: LoginService,
        private _sharedconsig: SharedDataSerice,
        private _loaderService: LoaderService,
        private _prefill: ConsignmentPrefillService) {
        this.commondrpselected = '-1';
        this.drpShipper = "";
        this.drpManufact = "";
        this.drpexpt_consignee = "";
        this.chknotify = false;
        this.drpVessel = null;
        this.rbstuff = 2;
        this.drpVesselDisabled = 0;
        this.trSubAir = 'N';
        this.trSubSea = 'Y'
        this.City = this._loginService.getLogin()[0].CITYCODE;
    }

    ngOnInit(): void {
        this._loginService.verifyRights('214', '')
            .subscribe((data: any) => {
                this._loginService.checkVerify('Add', data);
            });
        this.rbexporter = 1;
        this.rbCons = 1;
         this._toasterService.toast('info', 'New feature...', '1. Please select [Differed Air] , Air [Normal Air] or SEA- AIR for AIR SHIPMENT  !!!');

     // this._toasterService.toast('info', 'New feature...', '1. Please select [Sea-Air] or Sea [Normal Sea] for SEA SHIPMENT !!!');
        const jcitycode = {
            citycode: this._loginService.getLogin()[0].CITYCODE,
            cmpcode: this._loginService.getLogin()[0].CMPCODE
        };
        this._loaderService.display(true);
        this._dataService.Common(this.baseUrl, jcitycode)
            .subscribe((data: any) => {
                this._loaderService.display(false);
                this.exporters = data.Table;
                this.agents = data.Table1;
                     
                if (this._loginService.getLogin()[0].CITYCODE == 'DAC') {
                    //this.subagents = data.Table2;
                    this.consignees = data.Table2;
                    this.banks = data.Table3;
                    this.vessels = data.Table4;
                } else {
                    this.consignees = data.Table2;
                    this.banks = data.Table3;
                    this.vessels = data.Table4;
                    this.subagents=data.Table5;
                }
                // Sheet view pre-fill waits for exactly these lists.
                this._listsLoaded = true;
                this.flushPrefill();
            },
                (error) => {
                    this._toasterService.toast('error', 'Error', error.status + '<br/>' + error.statusText);
                },
                () => {
                });
    }

    fill(check): void {
        this.rbexporter = check;
        if (check == 1) {
            if (this.hdshipper != "") {
                this.drpShipper = this.hdshipper;
            }
            else {
                this.drpShipper = "";
            }
        } else if (check == 2) {
            if (this.hdexpt_billto != "") {
                this.drpShipper = this.hdexpt_billto;
            }
            else {
                this.drpShipper = "";
            }
        } else if (check == 3) {
            if (this.hdmanufacturer != "") {
                this.drpShipper = this.hdmanufacturer;
            }
            else {
                this.drpShipper = "";
            }
        }

    }

    drpfill(drpShipper: any): void {
        if (drpShipper != null || drpShipper != "") {
            if (this.rbexporter == 1) {
                this.txtshipper = this.exporters.filter((exporter: any) => exporter.VALUEFIELD === drpShipper)[0].TEXTFIELD;
                this.txtexpt_billto = this.exporters.filter((exporter: any) => exporter.VALUEFIELD === drpShipper)[0].TEXTFIELD;
                this.hdshipper = drpShipper;
                this.hdexpt_billto = drpShipper;
                this.rbexporter = 2;
            } else if (this.rbexporter == 2) {
                this.txtexpt_billto = this.exporters.filter((exporter: any) => exporter.VALUEFIELD === drpShipper)[0].TEXTFIELD;
                this.hdexpt_billto = drpShipper;
            } else if (this.rbexporter == 3) {
                this.txtmanufacturer = this.exporters.filter((exporter: any) => exporter.VALUEFIELD === drpShipper)[0].TEXTFIELD;
                this.hdmanufacturer = drpShipper;
            }
        }
    }

    onChangeNotify(chk: any): void {
        if (chk) {
            this.rbConsDisabled = 2;
            this.rbCons = 1;
            this.hdexpt_buyer = "";
            this.txtBuyername = "";
        } else {
            this.rbConsDisabled = 0;
            this.rbCons = 0;
        }
        this.drpexpt_consignee = "";
        this.hdexpt_consignee = "";
    }

    fill1(check: any): void {
        this.rbCons = check;
        if (check == 1) {
            if (this.hdexpt_consignee != "") {
                this.drpexpt_consignee = this.hdexpt_consignee;
            }
            else {
                this.drpexpt_consignee = "";
            }
        }
        else if (check == 2) {
            if (this.hdexpt_buyer != "") {
                this.drpexpt_consignee = this.hdexpt_buyer;
            }
            else {
                this.drpexpt_consignee = "";
            }
        }
    }

    consfill(drpconsig: any): void {
        if (drpconsig != null || drpconsig != "") {
            if (this.rbCons == 1) {
                if (this.chknotify) {
                    this.hdexpt_consignee = drpconsig;
                    this.txtConsignee = this.consignees.filter((consignee: any) => consignee.VALUEFIELD === drpconsig)[0].TEXTFIELD;
                    this.hdexpt_buyer = drpconsig;
                    this.txtBuyername = this.consignees.filter((consignee: any) => consignee.VALUEFIELD === drpconsig)[0].TEXTFIELD;
                } else {
                    this.hdexpt_consignee = drpconsig;
                    this.txtConsignee = this.consignees.filter((consignee: any) => consignee.VALUEFIELD === drpconsig)[0].TEXTFIELD;
                }
            }
            else if (this.rbCons == 2) {
                this.hdexpt_buyer = drpconsig;
                this.txtBuyername = this.consignees.filter((consignee: any) => consignee.VALUEFIELD === drpconsig)[0].TEXTFIELD;
            }
        }
    }

    vsl(chk, shpttype): void {
        this.rbstuff = chk;
        this.shipmentMode = shpttype;
        if (chk == 1) {
            this.drpVesselDisabled = 0;
        }
        if (chk == 2) {
            this.drpVesselDisabled = 0;
        }
        if (chk == 3) {
            this.drpVesselDisabled = 1;
            this.drpVessel = null;
        }
        //this.rbsubair = null; //  null= nothing selected 

        if (chk == 3) {
            this.trSubAir = 'Y';
        } else { this.trSubAir = 'N'; }
       if (chk != 3) {
            this.trSubSea = 'Y';
        } else { this.trSubSea = 'N'; }
    }

    subAir(chk: any): void {
        this.rbsubair = chk;
        this.airShipmentType = chk;
        if (chk==2){
        this.drpVesselDisabled = 0;}
    }
    // subSea(chk: any): void {
    //     this.rbsubsea = chk;
    //     this.seaShipmentType = chk;
    // }

    // ------------------------------------------------------------------
    // Pre-fill (Export > Sheet view > Convert to job; MPERPNG-20 applyPrefill
    // pattern). The workspace hands over the page-1 half; it is held until
    // Export/GetExportConsignment has returned, then applied through the same
    // handlers a click runs (fill / drpfill, onChangeNotify / fill1 / consfill,
    // vsl). A code that is not in the loaded list is left blank and noted in the
    // workspace banner. Continue stays the admin's: nothing here calls
    // finalSubmit(). Without a pre-fill none of this runs.
    // ------------------------------------------------------------------
    private _pendingPrefill: ConsignmentPrefillStart = null;
    private _listsLoaded: boolean = false;
    /** Set by a pre-fill that left the mode of shipment to the admin: Continue then insists on one. */
    private _prefillNeedsMode: boolean = false;

    applyPrefill(p: ConsignmentPrefillStart): void {
        if (!p) { return; }
        this._pendingPrefill = p;
        if (this._listsLoaded) { this.flushPrefill(); }
    }

    private flushPrefill(): void {
        const p = this._pendingPrefill;
        if (!p) { return; }
        this._pendingPrefill = null;
        const has = (v: any) => v !== null && v !== undefined && String(v).trim() !== '';
        const find = (list: Array<any>, code: any) =>
            (list || []).filter((x: any) => x && String(x.VALUEFIELD).trim() === String(code).trim())[0];
        const note = (t: string) => this._prefill.note(t);

        // Exporter / shipper: the "Exporter / Shipper" radio, then the party select.
        // drpfill sets Bill To to the same party and moves the radio to Bill To.
        if (has(p.exporterCode)) {
            const x = find(this.exporters, p.exporterCode);
            if (x) { this.fill(1); this.drpShipper = x.VALUEFIELD; this.drpfill(this.drpShipper); }
            else { note('Exporter ' + p.exporterCode + ' is not in the exporter list - pick it.'); }
        }
        // A different Bill To: the "Bill To" radio, then the same select.
        if (has(p.billToCode) && String(p.billToCode).trim() !== String(this.hdexpt_billto || '').trim()) {
            const x = find(this.exporters, p.billToCode);
            if (x) { this.fill(2); this.drpShipper = x.VALUEFIELD; this.drpfill(this.drpShipper); }
            else { note('Bill To ' + p.billToCode + ' is not in the exporter list - pick it.'); }
        }

        // "Same as consignee" first: its handler clears the consignee select.
        if (p.buyerSameAsConsignee === true && !this.chknotify) {
            this.chknotify = true;
            this.onChangeNotify(this.chknotify);
        }
        if (has(p.consigneeCode)) {
            const x = find(this.consignees, p.consigneeCode);
            if (x) { this.fill1(1); this.drpexpt_consignee = x.VALUEFIELD; this.consfill(this.drpexpt_consignee); }
            else { note('Consignee ' + p.consigneeCode + ' is not in the consignee list - pick it.'); }
        }
        if (!this.chknotify && !has(this.txtBuyername)) {
            note('Buyer is not filled - tick Same as consignee or pick the buyer.');
        }

        // The agent selects have no change handler.
        if (has(p.agentCode)) {
            const x = find(this.agents, p.agentCode);
            if (x) { this.drpAgent = x.VALUEFIELD; }
            else { note('Agent ' + p.agentCode + ' is not in the agent list - pick it.'); }
        }
        if (has(p.subAgentCode)) {
            const x = find(this.subagents, p.subAgentCode);
            if (x) { this.drpSubAgent = x.VALUEFIELD; }
            else { note('Sales person ' + p.subAgentCode + ' is not in the list - pick it.'); }
        }

        // Mode of shipment through its radio handler, only when the caller chose
        // one. Otherwise nothing is pre-selected (not even the Docks / Godown
        // default) and Continue asks for it.
        if (!this.locked) {
            const m = (p.stuffingMode == null) ? 0 : Number(p.stuffingMode);
            if (m === 1) { this.vsl(1, 'SEA'); }
            else if (m === 2) { this.vsl(2, 'SEA'); }
            else if (m === 3) { this.vsl(3, 'AIR'); }
            else { this.rbstuff = null; this._prefillNeedsMode = true; }
        }

        if (has(p.vesselValue)) {
            const x = find(this.vessels, p.vesselValue);
            if (!x) { note('Vessel ' + p.vesselValue + ' is not in the open vessel list - pick it.'); }
            else if (this.locked || this.drpVesselDisabled == 1) { note('Vessel not set: the mode of shipment is Air.'); }
            else { this.drpVessel = x.VALUEFIELD; }
        }
    }

    finalSubmit() {

        // Sheet view pre-fill only (the flag is never set otherwise): no mode of shipment chosen yet.
        if (this._prefillNeedsMode && this.rbstuff == null) { this._toasterService.toast('error', 'Error', "Please choose the mode of shipment"); return false; }

        if (this.txtshipper == undefined || this.txtshipper == "") { this._toasterService.toast('error', 'Error', "Exporter can not be blank"); return false; }
        else if (this.txtexpt_billto == undefined || this.txtexpt_billto == "") { this._toasterService.toast('error', 'Error', "Bill To can not be blank"); return false; }
        else if (this.drpAgent == undefined || this.drpAgent == -1) { this._toasterService.toast('error', 'Error', "Agent can not be blank"); return false; } //Agent can not be blank
        else if (this.txtConsignee == undefined || this.txtConsignee == "") { this._toasterService.toast('error', 'Error', "Consignee can not be blank"); return false; }
        else if (!this.chknotify) { if (this.txtBuyername == undefined || this.txtBuyername == "") { this._toasterService.toast('error', 'Error', "Buyer can not be blank"); return false; } }
        else if (this.rbstuff == 1) {
            if (this.drpVessel == null) {
                this._toasterService.toast('error', 'Error', "Please select vessel");
                return false;
            }
            else if (this.drpVessel.substring(3, 7) == "2099") {
                this._toasterService.toast('error', 'Error', "Please select the correct vessel");
                return false;
            }
        }
        else if (this.rbstuff == 2) {
            if (this.drpVessel == null) {
                this._toasterService.toast('error', 'Error', "Please select vessel");
                return false;
            }
        }
        // else if (this.rbstuff != 3) {
        //     if (this.rbsubsea == null) {
        //         this._toasterService.toast('error', 'Error', "Please select at least One \n 1. Sea [ Normal Sea ] \n 2.SEA - AIR [Air from Transhipment port] !");
        //         return false;
        //     }
        //     else {
        //         if (this.rbsubsea == 0) {
        //             SubAirSTR = "SEA [Normal SEA]";
        //             strmsg = "You have selected " + SubAirSTR + " ! \n Mode of Shipment Cannot be modified later !! \n\n If Selection is ok, Click OK to Continue and Cancel To Retry !!!"
        //         }
        //         if (this.rbsubair == 1) {
        //             SubAirSTR = "SEA - AIR ";
        //             strmsg = "You have selected " + SubAirSTR + "  !\n Mode of Shipment Cannot be modified later !! \n\n If Selection is ok, Click OK to Continue and Cancel To Retry !!!"
        //         }
        //         var confirm1 = confirm(strmsg);
        //         if (confirm1 == false) {
        //             return false;
        //         }
        //     }
        // }
        else if (this.rbstuff == 3) {
            var strmsg = "";

            var SubAirSTR = "";

            if (this.rbsubair == null) {
                this._toasterService.toast('error', 'Error', "Please select at least One \n 1. Air [ Normal Air ] \n 2. Diff Air [Differed Air] \n 3. SEA- AIR !");
                return false;
            }
            else {
                if (this.rbsubair == 0) {
                    SubAirSTR = "AIR [Normal Air]";
                    strmsg = "You have selected " + SubAirSTR + " ! \n Mode of Shipment Cannot be modified later !! \n\n If Selection is ok, Click OK to Continue and Cancel To Retry !!!"
                }
                if (this.rbsubair == 1) {
                    SubAirSTR = "DIFFERED AIR ";
                    strmsg = "You have selected " + SubAirSTR + "  !\n Mode of Shipment Cannot be modified later !! \n\n If Selection is ok, Click OK to Continue and Cancel To Retry !!!"
                }
                if (this.rbsubair == 2) {
                    SubAirSTR = "SEA-AIR ";
                    strmsg = "You have selected " + SubAirSTR + "  !\n Mode of Shipment Cannot be modified later !! \n\n If Selection is ok, Click OK to Continue and Cancel To Retry !!!"
                }
                var confirm1 = confirm(strmsg);
                if (confirm1 == false) {
                    return false;
                }
            }
        }
       
         let vesselcode ="",vesselport=""
         vesselcode = (this.rbstuff != 3) ? (this.drpVessel != null) ? this.drpVessel.split("|")[0] : '' : '';
         vesselport = (this.rbstuff != 3) ? (this.drpVessel != null) ? this.drpVessel.split("|")[1] : '' : '';
         if (this.rbstuff == 3)
         {
             if (this.rbsubair==2){
                  vesselcode =   (this.drpVessel != null) ? this.drpVessel.split("|")[0] : ''  ;
                  vesselport =  (this.drpVessel != null) ? this.drpVessel.split("|")[1] : ''  ;
             }
         }      
        
        let vesselid = (this.drpVessel != null) ? this.vessels.filter((vessel: any) => vessel.VALUEFIELD === this.drpVessel)[0].VALUEFIELD : '';
        let vesselname = (this.drpVessel != null) ? this.vessels.filter((vessel: any) => vessel.VALUEFIELD === this.drpVessel)[0].TEXTFIELD : '';
        if(this.rbsubair == 2)
        {
           if(vesselid =='')
           {
            this._toasterService.toast('error', 'Error', "Please select the correct vessel");
            return false;
           }
        }
        this._sharedconsig.sharedData = {
            exporterid: this.hdshipper,
            exportername: this.txtshipper,
            billtoid: this.hdexpt_billto,
            billtoname: this.txtexpt_billto,
            manufacturerid: (this.hdmanufacturer != undefined) ? this.hdmanufacturer : '',
            manufacturername: (this.txtmanufacturer != undefined) ? this.txtmanufacturer : '',
            agentid: (this.drpAgent) ? this.drpAgent : '',
            agentname: (this.drpAgent != null) ? this.agents.filter((filter) => filter.VALUEFIELD == this.drpAgent)[0].TEXTFIELD : '',
            subagentid: (this.drpSubAgent != null) ? this.drpSubAgent : '',
            subagentname: (this.drpSubAgent != null) ? this.subagents.filter((filter) => filter.VALUEFIELD == this.drpSubAgent)[0].TEXTFIELD : '',
            consigneeid: this.hdexpt_consignee,
            consigneename: this.txtConsignee,
            consigneetobankid: (this.drpBank != null) ? this.drpBank : '',
            consigneetobankname: (this.drpBank != null) ? this.banks.filter((filter) => filter.VALUEFIELD == this.drpBank)[0].TEXTFIELD : '',
            notifybuyer: (this.chknotify == true) ? "yes" : "",
            buyerid: this.hdexpt_buyer,
            buyername: this.txtBuyername,
            modeofship: (this.rbsubair == 2) ? "SEA" : this.shipmentMode,
            airshipmode: this.rbsubair,
            vesselcode: vesselcode,
            vesselport: vesselport,
            vesselid: vesselid,
            vesselname: vesselname,
            pcs: 0,
            seashipmode:this.rbsubsea,
            modeofshipment:this.rbstuff
        };

        //this._sharedconsig.sharedData =
        //    {
        //        agentid: "S101715",
        //        agentname: "2W SINOTRANS - BEJING AIRTRANS NORTHERN BRANCH",
        //        billtoid: "E100966",
        //        billtoname: "2ND IN BUILDING MATERIALS INC.",
        //        notifybuyer: "yes",
        //        buyerid: "C106326",
        //        buyername: "3Z CORPORATIONS.",
        //        consigneeid: "C100057",
        //        consigneename: "LA REDOUTE",
        //        exporterid: "E100966",
        //        exportername: "2ND IN BUILDING MATERIALS INC.",
        //        consigneetobankid: "B100043",
        //        consigneetobankname: "HSBC -CCF, TRADE SERVICES",
        //        manufacturerid: "E100185",
        //        manufacturername: "3 `A` INC.",
        //        modeofship: "AIR",
        //        airshipmode: 0,
        //        vesselcode: "MUM20024178",
        //        vesselport: "MUM",
        //        vesselid: null,
        //        vesselname: null,
        //        pcs: 0
        //    };
        if (this.embedded) { this.continued.emit(); return; }
        this._loaderService.display(true);
        this._router.navigate(['export/Consignment/main']);
       // if (this._loginService.getLogin()[0].CMPTYPE === 'FRT') {
         //    this._router.navigate(['export/consignment/order-booking-list']);
       // } else {
        //    this._router.navigate(['export/consignment/main']);
      //  }
        this._loaderService.display(false);
    }
}  