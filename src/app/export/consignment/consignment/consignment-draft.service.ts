import { Injectable } from '@angular/core';
import { LoginService } from '../../../shared/service/loginService';

/**
 * Ported from MPERPNG-20 (consignment-draft.service.ts).
 * One unsaved new-consignment draft per login, kept in this browser only.
 * Links storage key: `links_erp_consg_draft_<CMPID>`.
 */
export interface ConsignmentDraft {
    savedAt: string;
    page: 'start' | 'main';
    invoiceNo: string;
    exporter: string;
    fields: { start: any; main: any };
}

export type ConsignmentDraftBody = Omit<ConsignmentDraft, 'savedAt'>;

/**
 * Page-1 (ConsgStartComponent) properties a draft carries: every
 * [(ngModel)] in consg-start.component.html, plus the radio / toggle state
 * that template drives through (click) handlers rather than ngModel.
 */
export const DRAFT_START_FIELDS: string[] = [
    // [(ngModel)]
    'chknotify', 'drpAgent', 'drpBank', 'drpShipper', 'drpSubAgent', 'drpVessel', 'drpexpt_consignee',
    'hdexpt_billto', 'hdexpt_buyer', 'hdexpt_consignee', 'hdmanufacturer', 'hdshipper',
    'txtBuyername', 'txtConsignee', 'txtexpt_billto', 'txtmanufacturer', 'txtshipper',
    // radios / toggles (fill, fill1, onChangeNotify, vsl, subAir)
    'rbexporter', 'rbCons', 'rbConsDisabled', 'rbstuff', 'drpVesselDisabled', 'trSubAir', 'trSubSea',
    'rbsubair', 'shipmentMode', 'airShipmentType', 'rbsubsea', 'seaShipmentType', 'drpManufact',
];

/**
 * ConsgMainComponent properties a draft carries: every scalar [(ngModel)] in
 * consg_main.component.html (the doc.* radios live on the rows of
 * `documentlist`, so the list itself is kept). The Order / Package / ITC grids
 * are server-side TMP rows and are not kept. (MP's invoice-prefill queues are
 * not ported to Links.)
 */
export const DRAFT_MAIN_FIELDS: string[] = [
    'actualfltdt', 'actualfltno', 'addrsone', 'addrstwo', 'advlicenceno', 'agentname', 'airlinename',
    'arformcommfour', 'arformcommone', 'arformcommthree', 'arformcommtwo',
    'arformdivfour', 'arformdivone', 'arformdivthree', 'arformdivtwo',
    'arformdtfour', 'arformdtone', 'arformdtthree', 'arformdttwo',
    'arformnofour', 'arformnoone', 'arformnothree', 'arformnotwo',
    'arformratefour', 'arformrateone', 'arformratethree', 'arformratetwo',
    'billentrydt', 'billentryno', 'bookdt', 'bookno', 'cartingdt', 'cartingplace', 'chblwt', 'commission',
    'commissionpaidto', 'cssper', 'currency', 'currencyrate', 'customclr', 'destcity', 'discount',
    'docactualreceived', 'docrecdt', 'dutyamt', 'dutyper', 'emvone', 'emvthree', 'emvtwo',
    'etaonedt', 'etatwodt', 'etdonedt', 'etdtwodt', 'expinvno', 'exptinvdt', 'exwork', 'fltno1', 'fltno2',
    'fobinr', 'freightfrd', 'frieght', 'frtchrgs', 'goodsremark', 'gridt', 'grino', 'grosswt', 'groupcode',
    'houseawbdt', 'houseawbno', 'imptlbluse', 'incoterm', 'inrrate', 'insuramt', 'invamt',
    'itccode', 'itcconditionno', 'itcdescription', 'itcfobinr', 'itcgroupcode', 'itcnotice', 'itcpercent',
    'itcperunit', 'itcsrno', 'itctypeone', 'itctypetwo', 'itcunitone', 'itcunittwo',
    'lblsourceagent', 'loadingport', 'loadingportterminal', 'marketval', 'marksandnumbers',
    'mawbdest', 'mawbdt', 'mawbfreight', 'mawbno', 'natureofpayment', 'netwt', 'noofpackages', 'noofpieces',
    'orderchblwt', 'ordercneedept', 'ordercontainerno', 'ordercontractno', 'ordercurrency', 'orderdrndt',
    'orderexistno', 'orderfobval', 'ordergrwt', 'ordericshscode', 'ordericshsdescription', 'orderitemdesc',
    'orderlsddt', 'ordernetwt', 'orderno', 'orderpackage', 'orderpayment', 'orderpiece', 'orderreferenceno',
    'ordertypeofpiece', 'ordervolume', 'orderwarehouse', 'othrdeduction', 'packagealphabet', 'packagefrom',
    'packageto', 'passbookdt', 'passbookno', 'pkgothrs', 'plannedfltdt', 'plannedfltno', 'podchrg', 'portit',
    'prealertsentdt', 'quotacertnoone', 'quotacertnothree', 'quotacertnotwo', 'quotaexpirydt',
    'quotaobtaindt', 'quotavalidatedt', 'receiptdt', 'receiptno', 'remark', 'shprgrosswt', 'shprvolume',
    'sionno', 'transportone', 'transporttwo', 'typeofpackages', 'typeofpieces', 'typeshpnbill',
    'valueaddition', 'valueamt', 'volume',
    'documentlist',
];

@Injectable({ providedIn: 'root' })
export class ConsignmentDraftService {

    /** JSON of the last write (or of the state at the last clear), so unchanged state is never rewritten. */
    private lastJson: string = '';

    constructor(private _loginService: LoginService) { }

    private key(): string {
        let id = '';
        try { const l = this._loginService.getLogin(); id = (l && l[0]) ? l[0].CMPID : ''; } catch (e) { }
        return 'links_erp_consg_draft_' + (id || 'anon');
    }

    /** Copy the whitelisted properties off a component, as plain JSON-safe values. */
    pick(src: any, names: string[]): any {
        const out: any = {};
        if (!src) { return out; }
        for (const n of names) {
            const v = src[n];
            if (v !== undefined) { out[n] = v; }
        }
        try { return JSON.parse(JSON.stringify(out)); } catch (e) { return {}; }
    }

    /** Plain assignment back onto the component. */
    assign(dst: any, fields: any, names: string[]): void {
        if (!dst || !fields) { return; }
        for (const n of names) {
            if (Object.prototype.hasOwnProperty.call(fields, n)) { dst[n] = fields[n]; }
        }
    }

    load(): ConsignmentDraft | null {
        try {
            const raw = localStorage.getItem(this.key());
            if (!raw) { return null; }
            const d = JSON.parse(raw);
            return (d && d.fields) ? d : null;
        } catch (e) { return null; }
    }

    /** Writes only when the content (ignoring savedAt) differs from the last write. */
    save(d: ConsignmentDraftBody): void {
        let body = '';
        try { body = JSON.stringify(d); } catch (e) { return; }
        if (body === this.lastJson) { return; }
        this.lastJson = body;
        try {
            localStorage.setItem(this.key(), JSON.stringify({ savedAt: new Date().toISOString(), ...d }));
        } catch (e) { }
    }

    /** Bumped on every clear(), so the workspace can re-baseline its snapshots. */
    generation: number = 0;

    /** Remove the draft; `current` (the state at clear time) keeps it from being rewritten until something changes. */
    clear(current?: ConsignmentDraftBody): void {
        this.generation++;
        try { this.lastJson = current ? JSON.stringify(current) : ''; } catch (e) { this.lastJson = ''; }
        try { localStorage.removeItem(this.key()); } catch (e) { }
    }

    /** Forget the dedupe memory (a new workspace session). */
    reset(): void { this.lastJson = ''; }
}
