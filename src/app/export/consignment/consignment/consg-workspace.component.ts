import { Component, ChangeDetectionStrategy, ViewChild, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { ToastCommonService } from '../../../shared/service/toastService';
import { ConsignmentDraftService, ConsignmentDraft, ConsignmentDraftBody, DRAFT_START_FIELDS, DRAFT_MAIN_FIELDS } from './consignment-draft.service';
import { UiStep } from '../../../shared/ui';
import { SharedDataSerice } from '../../export-share-data.service';
import { ConsgStartComponent } from './consg-start.component';
import { ConsgMainComponent } from './consg_main.component';

/**
 * One-page consignment workspace (ported from MPERPNG-20, page kit "W").
 *
 * It used to take two routes to open an export job: `start` (parties,
 * consignee, shipment), then a navigate to `main` (the tabbed master). Nothing
 * about the data changed - page 1 still writes only to SharedDataService and the
 * master's Submit is still the single write to the server - but every section
 * now sits on one scrolling page under a sticky header and a section nav.
 *
 * ConsgStartComponent stays mounted throughout. Once Continue is pressed it is
 * locked in place rather than hidden: the mode of shipment cannot be changed
 * after the master is loaded. The embedded master is mounted from the first
 * second as well, locked (`[locked]="!started"`); its data load runs on the
 * lock -> unlock transition, i.e. exactly once per Continue. "Edit parties &
 * shipment" bumps `mainKey`, which destroys and rebuilds the master.
 *
 * Links: MP's "Prefill from invoice" drawer is NOT ported (it needs an external
 * service with a hard-coded key; deferred). The draft band (per-login
 * localStorage, `links_` key prefix) is ported.
 */
@Component({
    selector: 'app-consg-workspace',
    templateUrl: 'consg-workspace.component.html',
    // Page kit is global (src/styles/kit); kit-consignment scopes consignment-page.css.
    host: { class: 'kit-consignment' },
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false,
})
export class ConsgWorkspaceComponent implements OnInit, OnDestroy {

    constructor(private _sharedconsig: SharedDataSerice,
                private _draftSvc: ConsignmentDraftService,
                private _router: Router,
                private _toaster: ToastCommonService,
                private _cdr: ChangeDetectorRef) { }

    // ------------------------------------------------------------------
    // Draft. One draft per login in localStorage. Snapshotted every 1.5 s
    // while the page is open and right before Submit; written only when it
    // differs. While an older draft is offered in the band nothing is
    // written, so it cannot be overwritten before Restore / Discard.
    // ------------------------------------------------------------------

    /** The stored draft on offer in the band; null once restored / discarded. */
    draft: ConsignmentDraft = null;
    private draftTimer: any = null;
    private seenGeneration: number = 0;
    /** Main-page fields of a restored draft, applied on Continue. */
    private pendingDraftMain: any = null;

    @ViewChild(ConsgStartComponent) startChild: ConsgStartComponent;
    @ViewChild(ConsgMainComponent) mainChild: ConsgMainComponent;

    ngOnInit(): void {
        this._draftSvc.reset();
        this.seenGeneration = this._draftSvc.generation;
        this.draft = this._draftSvc.load();
        this.draftTimer = setInterval(() => this.snapshotDraft(), 1500);
    }

    ngOnDestroy(): void {
        if (this.draftTimer) { clearInterval(this.draftTimer); this.draftTimer = null; }
    }

    get draftWhen(): string {
        if (!this.draft || !this.draft.savedAt) { return ''; }
        const d = new Date(this.draft.savedAt);
        if (isNaN(d.getTime())) { return ''; }
        const p = (n: number) => ('0' + n).slice(-2);
        return p(d.getDate()) + '/' + p(d.getMonth() + 1) + '/' + d.getFullYear() + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
    }

    private draftBody(): ConsignmentDraftBody {
        const s: any = this.startChild;
        const m: any = this.mainChild;
        return {
            page: this.started ? 'main' : 'start',
            invoiceNo: (this.started && m && m.expinvno) ? String(m.expinvno) : '',
            exporter: (s && s.txtshipper) ? String(s.txtshipper) : '',
            fields: {
                start: this._draftSvc.pick(s, DRAFT_START_FIELDS),
                main: this.started ? this._draftSvc.pick(m, DRAFT_MAIN_FIELDS) : {},
            },
        };
    }

    /** Anything worth keeping typed yet? (A blank page never becomes a draft.) */
    private draftWorthKeeping(b: ConsignmentDraftBody): boolean {
        const st = b.fields.start || {};
        return this.started || !!(st.txtshipper || st.txtexpt_billto || st.txtConsignee || st.txtBuyername || st.drpAgent);
    }

    snapshotDraft(force: boolean = false): void {
        if (this.draft) { return; }                         // band still open
        if (!this.startChild) { return; }
        if (this.mainChild && this.mainChild.saving && !force) { return; }
        const body = this.draftBody();
        if (this._draftSvc.generation !== this.seenGeneration) {
            // cleared elsewhere (Abort / successful save): start over from here
            this.seenGeneration = this._draftSvc.generation;
            this._draftSvc.clear(body);
            this.seenGeneration = this._draftSvc.generation;
            return;
        }
        if (!this.draftWorthKeeping(body)) { return; }
        this._draftSvc.save(body);
    }

    discardDraft(): void {
        this.draft = null;
        this._draftSvc.clear(this.draftBody());
        this.seenGeneration = this._draftSvc.generation;
    }

    /**
     * Page-1 fields are assigned straight into ConsgStartComponent. A draft
     * taken after Continue then goes through the very same Continue
     * (finalSubmit -> continued -> onContinued); its main-page half is held in
     * pendingDraftMain and handed to the master there, and the master holds it
     * until its lists have arrived.
     */
    restoreDraft(): void {
        const d = this.draft;
        const s: any = this.startChild;
        if (!d || !s) { return; }
        if (!s.exporters || !s.exporters.length) {
            this._toaster.toast('info', 'Draft', 'The page lists are still loading, press Restore again in a moment.');
            return;
        }
        if (this.started) {
            this._toaster.toast('info', 'Draft', 'Use Edit parties & shipment first, then Restore.');
            return;
        }
        this.draft = null;
        this._draftSvc.assign(s, d.fields ? d.fields.start : null, DRAFT_START_FIELDS);
        if (d.page === 'main' && d.fields && d.fields.main) {
            this.pendingDraftMain = d.fields.main;
            s.finalSubmit();
        }
        try { this._cdr.markForCheck(); this._cdr.detectChanges(); } catch (e) { }
    }

    /** Save bar "Keep as draft": write the draft now and leave. */
    keepDraftAndLeave(): void {
        this.draft = null;
        this.snapshotDraft(true);
        this._toaster.toast('info', 'Draft', 'Draft kept in this browser. Open Export Master to restore it.');
        this._router.navigate(['export/Consignment/search']);
    }

    /** True once page-1 validated and handed over through SharedDataService. */
    started: boolean = false;

    step: string = 'main';

    /**
     * One-item list whose value identifies the mounted ConsgMainComponent.
     * Bumping this key is what "Edit parties & shipment" uses: a brand new
     * master whose load runs again on the next Continue.
     */
    mainKey: number[] = [0];

    /** Same eight sections, same order, as ConsgMainComponent.steps. */
    readonly sections: UiStep[] = [
        { key: 'main', label: 'Main', hint: 'Exporter, consignee, service scope and the sourcing agent' },
        { key: 'vessel', label: 'Transport, port & goods', hint: 'Vessel or flight, ports, and the goods' },
        { key: 'invoice', label: 'Invoice', hint: 'Exporter invoice and valuation' },
        { key: 'documents', label: 'Documents', hint: 'Documents received / called for' },
        { key: 'itc', label: 'ITC code', hint: 'ITC code lines' },
        { key: 'order', label: 'Order no.', hint: 'Contract and order no. lines' },
        { key: 'package', label: 'Package no.', hint: 'Package no. ranges' },
        { key: 'marks', label: 'Marks & numbers', hint: 'Marks & numbers' },
    ];

    /** Header title: there is no export no. until Submit writes the consignment. */
    get headline(): string {
        return 'New consignment';
    }

    /** Section nav for the three page-1 groups, which carry cst-* anchor ids. */
    goAnchor(id: string): void {
        const el = document.getElementById(id);
        if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    }

    /**
     * What page 1 handed over, for the chip strip. Read straight from
     * SharedDataService - the same object ConsgMainComponent reads.
     */
    get summary(): { k: string; v: string }[] {
        const d: any = this._sharedconsig.sharedData;
        if (!d || !this.started) { return []; }
        const isAir = String(d.modeofship || '').toUpperCase() === 'AIR';
        const mode = isAir
            ? (d.airshipmode == 0 ? 'Normal air' : d.airshipmode == 1 ? 'Differed air' : 'Sea-air')
            : (d.airshipmode == 2 ? 'Sea-air' : 'Sea');
        const rows = [
            { k: 'Shipper',   v: d.exportername },
            { k: 'Bill to',   v: d.billtoname },
            { k: 'Consignee', v: d.consigneename },
            { k: 'Buyer',     v: d.buyername },
            { k: 'Agent',     v: d.agentname },
            { k: 'Mode',      v: mode },
            { k: 'Vessel',    v: d.vesselname },
            { k: 'Pcs',       v: d.pcs },
        ];
        return rows.filter(r => r.v !== undefined && r.v !== null && String(r.v).trim() !== '')
                   .map(r => ({ k: r.k, v: String(r.v) }));
    }

    /** Section nav: every section is on the page, so this scrolls to its card. */
    goSection(key: string): void {
        this.step = key;
        const el = document.getElementById('cs-' + key);
        if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    }

    onContinued(): void {
        this.step = 'main';
        this.started = true;
        // The master's own load starts on this lock -> unlock transition; it
        // holds the draft until its lists arrive. Cleared so it can never be
        // written twice.
        if (this.pendingDraftMain && this.mainChild) {
            this.mainChild.applyDraft(this.pendingDraftMain);
            this.pendingDraftMain = null;
        }
    }

    /**
     * Links: the master's Abort used to navigate main -> start (a fresh page 1).
     * Here that would be the same URL, so the workspace rebuilds both halves
     * instead (startKey / mainKey), which re-runs page 1's own load exactly like
     * the old navigate did. The draft was already cleared by abort().
     */
    startKey: number[] = [0];

    onAborted(): void {
        this.draft = null;
        this.started = false;
        this.step = 'main';
        this.startKey = [this.startKey[0] + 1];
        this.mainKey = [this.mainKey[0] + 1];
        window.scrollTo(0, 0);
    }

    /** Unlock page 1 - and throw away the master that was built from it. */
    editParties(): void {
        if (!confirm('Editing the parties and shipment discards the consignment details entered so far. Continue?')) { return; }
        this.started = false;
        this.step = 'main';
        this.mainKey = [this.mainKey[0] + 1];
    }
}
