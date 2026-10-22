import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { filter } from 'rxjs/operators';
import { LoginService } from '../../../shared/service/loginService';

/**
 * Pre-fill for the new consignment form (Export Master, /export/Consignment/start).
 *
 * Export > Sheet view > Convert to job hands the form a payload built from one
 * sheet row (or several rows with the same WO): `set(payload)`, then navigate to
 * /export/Consignment/start. The workspace `take()`s it on init and drives it
 * through the form's own change handlers (ConsgStartComponent.applyPrefill on
 * page 1, ConsgMainComponent.applyPrefill once the master is open). The admin
 * reviews, completes and saves through the normal Submit.
 *
 * Completion: the form calls `onSaved(exptno)` on a successful Submit (before it
 * navigates to `source.returnUrl`) and `onAborted(reason)` on Abort, on
 * "Discard pre-fill" and when the page is left without either. Subscribers get
 * `result$` / `saved$` / `aborted$`; a caller that was not alive at that moment
 * (the Sheet view is destroyed while the form is open) reads `consumeResult()`
 * when it comes back.
 *
 * A sessionStorage copy (per login) keeps the session across a browser refresh
 * during review. It is removed when the session ends. Nothing here talks to the
 * server, and the user's own consignment draft (ConsignmentDraftService) is never
 * read or written while a session is active.
 *
 * Every code in the payload is already resolved by the caller. Any field may be
 * missing; a value the form cannot use (not in its list, not a date ...) is left
 * blank and noted in the workspace banner.
 */

export interface ConsignmentPrefillSource {
    kind: 'sheet';
    /** Sheet row ids (TBL_EXPT_SHEET_ROW) the job is converted from. */
    rowIds: number[];
    monthId?: any;
    tabCode?: string;
    /** In-app URL to open after a successful Submit or an Abort (instead of the search page / a fresh form). */
    returnUrl?: string;
}

export interface ConsignmentPrefillStart {
    /** Exporter / shipper code (exporter list VALUEFIELD). Bill To follows it, as when picked by hand. */
    exporterCode?: string;
    /** Only when it differs from the exporter. */
    billToCode?: string;
    consigneeCode?: string;
    /** true ticks "Same as consignee" (buyer = consignee). */
    buyerSameAsConsignee?: boolean;
    agentCode?: string;
    /** "Sales Person" (drpSubAgent). */
    subAgentCode?: string;
    /** Vessel list VALUEFIELD, 'VSL_RTNO|PORT'. */
    vesselValue?: string;
    /** 1 factory, 2 docks / godown, 3 air. null / missing: nothing selected, the admin must choose. */
    stuffingMode?: 1 | 2 | 3 | null;
}

export interface ConsignmentPrefillOrder {
    orderNo: string;
    /** Numeric. */
    pieces: any;
    /** Numeric or missing. */
    packages?: any;
}

export interface ConsignmentPrefillMain {
    /** A missing key leaves that box unticked. */
    services?: { exwork?: boolean; customclr?: boolean; freightfrd?: boolean };
    noOfPackages?: any;
    /** One of the form's package types (PKG, CARTONS, PALLETS, ...). */
    typeOfPackages?: string;
    noOfPieces?: any;
    /** One of the form's piece types (PIECES, SETS, NOS, UNIT, ...). */
    typeOfPieces?: string;
    /** CITY_CODE. */
    loadingPortCode?: string;
    /** PORT_TERMINAL id, or the form's 'id|port' value. Needs loadingPortCode. */
    terminalId?: any;
    /** CITY_CODE; also sets Dest. City / Country, as the select does. */
    podCode?: string;
    /** CITY_CODE, when it differs from the port of discharge. */
    destCityCode?: string;
    /** dd/mm/yyyy, not in the future. */
    docRecdDate?: string;
    /** Max 20 characters (EXPT_INVNO). */
    invoiceNo?: string;
    /** dd/mm/yyyy, on or before docRecdDate. */
    invoiceDate?: string;
    /** '(LC)Letter of credit', ... or the two-letter code ('LC', 'DA', 'DP', 'AP', 'NA'). */
    natureOfPayment?: string;
    /** Optional: CUR_MASTER code (CR115) or name. Applied through changeCurrency. */
    currencyCode?: string;
    goodsRemark?: string;
    marks?: string;
    /** Vessel agent (agent list of the chosen vessel), sea only. */
    vesselAgentCode?: string;
    /** Posted as Order no. lines before Submit, through Export/ConsignmentOrder. */
    orders?: ConsignmentPrefillOrder[];
    /** Posted as one Package no. range, last, through Export/ConsignmentPackage. */
    packageRange?: { from: any; to: any };
}

export interface ConsignmentPrefill {
    source: ConsignmentPrefillSource;
    start?: ConsignmentPrefillStart;
    main?: ConsignmentPrefillMain;
    /** Shown to the admin in the workspace banner, e.g. 'Consignee VIPAR has no alias - pick it'. */
    notes?: string[];
}

export interface ConsignmentPrefillResult {
    status: 'saved' | 'aborted';
    /** The new export no. (status 'saved'). */
    exptno?: string;
    /** status 'aborted': Abort pressed, pre-fill discarded, or the page left without Submit. */
    reason?: 'abort' | 'discard' | 'left';
    source: ConsignmentPrefillSource;
    at: string;
}

@Injectable({ providedIn: 'root' })
export class ConsignmentPrefillService {

    private _active: ConsignmentPrefill = null;
    /** Payload notes + notes the form added while applying; one array, so the banner binds a stable reference. */
    private _notes: string[] = [];
    private _lastResult: ConsignmentPrefillResult = null;

    private _result = new Subject<ConsignmentPrefillResult>();
    /** Every completion of a session. */
    readonly result$: Observable<ConsignmentPrefillResult> = this._result.asObservable();
    /** Successful Submit: `exptno` is the new export no. */
    readonly saved$: Observable<ConsignmentPrefillResult> = this.result$.pipe(filter(r => r.status === 'saved'));
    /** Abort, Discard pre-fill, or the page left without Submit. */
    readonly aborted$: Observable<ConsignmentPrefillResult> = this.result$.pipe(filter(r => r.status === 'aborted'));

    constructor(private _loginService: LoginService) { }

    private key(suffix: string): string {
        let id = '';
        try { const l = this._loginService.getLogin(); id = (l && l[0]) ? l[0].CMPID : ''; } catch (e) { }
        return 'links_erp_consg_prefill' + suffix + '_' + (id || 'anon');
    }

    private static valid(p: any): boolean {
        return !!(p && typeof p === 'object' && p.source && typeof p.source === 'object');
    }

    private resetNotes(): void {
        const given = (this._active && Array.isArray(this._active.notes)) ? this._active.notes : [];
        this._notes = given.filter(n => n !== null && n !== undefined && String(n).trim() !== '').map(n => String(n));
    }

    // ------------------------------------------------------------------
    // Caller (Sheet view)
    // ------------------------------------------------------------------

    /** Start a session: the next /export/Consignment/start opens pre-filled. Replaces any earlier one. */
    set(payload: ConsignmentPrefill): void {
        if (!ConsignmentPrefillService.valid(payload)) { return; }
        let copy: ConsignmentPrefill;
        try { copy = JSON.parse(JSON.stringify(payload)); } catch (e) { return; }
        this._active = copy;
        this.resetNotes();
        // A result nobody read belongs to an earlier session.
        this._lastResult = null;
        try { sessionStorage.removeItem(this.key('_result')); } catch (e) { }
        try { sessionStorage.setItem(this.key(''), JSON.stringify(copy)); } catch (e) { }
    }

    /**
     * The last completion, for a caller that was not subscribed when it happened
     * (also kept in sessionStorage until read). Reading it clears it.
     */
    consumeResult(): ConsignmentPrefillResult | null {
        let r = this._lastResult;
        if (!r) {
            try { const raw = sessionStorage.getItem(this.key('_result')); r = raw ? JSON.parse(raw) : null; } catch (e) { r = null; }
        }
        this._lastResult = null;
        try { sessionStorage.removeItem(this.key('_result')); } catch (e) { }
        return (r && r.status && r.source) ? r : null;
    }

    // ------------------------------------------------------------------
    // Form (consignment workspace and its two halves)
    // ------------------------------------------------------------------

    /**
     * The workspace picks the session up on init: the one in memory, else the
     * sessionStorage copy (a browser refresh during review). null = no session,
     * the form behaves exactly as without this service. The copy stays stored
     * until the session ends, so a further refresh still finds it.
     */
    take(): ConsignmentPrefill | null {
        if (!this._active) {
            try {
                const raw = sessionStorage.getItem(this.key(''));
                const p = raw ? JSON.parse(raw) : null;
                this._active = ConsignmentPrefillService.valid(p) ? p : null;
            } catch (e) { this._active = null; }
        }
        this.resetNotes();
        return this._active;
    }

    /** The session in progress, or null. */
    get active(): ConsignmentPrefill | null { return this._active; }

    get isActive(): boolean { return !!this._active; }

    /** source.returnUrl when it is an in-app URL, else null. */
    get returnUrl(): string | null {
        const u = (this._active && this._active.source) ? this._active.source.returnUrl : null;
        if (typeof u !== 'string') { return null; }
        const s = u.trim();
        if (!s || s.indexOf('://') >= 0 || s.indexOf('//') === 0) { return null; }
        return s;
    }

    /** What the banner lists: the caller's notes, then what the form could not apply. */
    get notes(): string[] { return this._notes; }

    /** Add a note for the admin (no duplicates; a re-applied half does not repeat itself). */
    note(text: string): void {
        if (!this._active || !text) { return; }
        const t = String(text);
        if (this._notes.indexOf(t) < 0) { this._notes = this._notes.concat([t]); }
    }

    /** Successful Submit, with the new export no. Ends the session. */
    onSaved(exptno: string): void {
        this.finish('saved', exptno ? String(exptno) : '', undefined);
    }

    /** Abort / Discard pre-fill / page left without Submit. Ends the session; the sheet row stays unconverted. */
    onAborted(reason: 'abort' | 'discard' | 'left' = 'abort'): void {
        this.finish('aborted', undefined, reason);
    }

    private finish(status: 'saved' | 'aborted', exptno: string, reason: 'abort' | 'discard' | 'left'): void {
        const p = this._active;
        if (!p) { return; }
        this._active = null;
        this._notes = [];
        try { sessionStorage.removeItem(this.key('')); } catch (e) { }
        const r: ConsignmentPrefillResult = { status: status, source: p.source, at: new Date().toISOString() };
        if (status === 'saved') { r.exptno = exptno; } else { r.reason = reason; }
        this._lastResult = r;
        try { sessionStorage.setItem(this.key('_result'), JSON.stringify(r)); } catch (e) { }
        // Called from inside the form's save / abort replies: a subscriber must never break them.
        try { this._result.next(r); } catch (e) { }
    }
}
