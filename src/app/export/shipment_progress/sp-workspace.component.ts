import { Component, OnInit, OnDestroy, HostListener, ChangeDetectionStrategy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { UiStep } from '../../shared/ui';
import { DataService } from '../../shared/service/dataService';
import { LoginService } from '../../shared/service/loginService';
import { SpWorkspaceState, SpHit } from './sp-workspace.state';
import { SpWorkspaceService, SpWorkspaceHost } from './sp-workspace.service';

/** One rail entry: a shipment-progress stage the operator can open. */
interface SpStage {
    /** Route segment under `export/shipment-progress/` - unchanged from the old flow. */
    key: string;
    label: string;
    /** Form id passed to LoginService.verifyRights. */
    rights: number;
    /** `Type1` for Export/ShipmentCommonSearch. Null for the vessel-keyed screens. */
    valuetype?: string;
    /** 'number' stages are keyed by export no, 'vessel' stages pick a vessel themselves. */
    mode: 'number' | 'vessel';
    /** Filled in once a search has run: does this job appear in that stage's search? */
    eligible?: boolean;
}

/** One job the search matched, with the stages it turned up in. */
/**
 * One-screen Shipment Progress workspace.
 *
 * It used to take nineteen sidebar entries to move a job along: each stage had
 * its own search screen, you typed the export number again on every one, and
 * the only way from stage to stage was back out to the menu. Nothing about the
 * data changed - the same `Export/ShipmentCommonSearch` call with the same five
 * params, and the same per-stage update components doing the same writes - but
 * the operator now enters the number once on the left and every stage that job
 * is eligible for is one click away on the right.
 *
 * The stage bodies are the existing update components, hosted through a
 * <router-outlet> on CHILD routes of `workspace`. They read `:exptno` from the
 * route in their constructors, so a child route gives them exactly what a
 * top-level navigate gave them without a line changing in the shared
 * `sp.component.ts`.
 *
 * Two modes, because three of the screens are not keyed by an export number at
 * all. "By export number" is the twelve number-keyed stages. "By vessel" is
 * Job Vessel to Vessel Transfer, Carting Sea and Pending Shipment - those own
 * their own vessel pickers, so the left panel steps out of the way and the
 * screen picks the vessel itself. There is no number-to-vessel lookup here
 * because the API has none.
 *
 * Rights: `verifyRights` is called once per stage at init and the answer is
 * read here rather than handed to `checkVerify` - `checkVerify` redirects to
 * error/access-denied on failure, which is right for a single-purpose route and
 * wrong for a rail that has to *drop* the rows the user cannot open. The
 * pass/fail logic below mirrors `checkVerify('View', ...)` exactly, including
 * the ROLETYPE 'SA' bypass and the STATUS 100 / 104 split.
 */
@Component({
    selector: 'app-sp-workspace',
    templateUrl: 'sp-workspace.component.html',
    host: { class: 'kit-sp' },
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false,
})
export class SpWorkspaceComponent implements OnInit, OnDestroy, SpWorkspaceHost {

    constructor(
        private _router: Router,
        private _activatedRoute: ActivatedRoute,
        private _dataService: DataService,
        private _loginService: LoginService,
        private _state: SpWorkspaceState,
        private _workspace: SpWorkspaceService) {
        // Registered here rather than in ngOnInit: the hosted stage is activated
        // by the outlet while this view is being built, and it asks the service
        // on its very first Cancel - the slot has to be filled before that.
        this._workspace.register(this);
    }

    ngOnDestroy() { this._workspace.unregister(this); }

    // These live on SpWorkspaceState, not here. Opening a stage navigates to a
    // child route, and shouldReuseRoute = () => false rebuilds the parent too -
    // so anything held on the component is wiped the moment a stage is clicked.
    // Accessors keep the template and the logic below unchanged.
    get mode(): 'number' | 'vessel' { return this._state.mode; }
    set mode(v: 'number' | 'vessel') { this._state.mode = v; }

    get checkType(): string { return this._state.checkType; }
    set checkType(v: string) { this._state.checkType = v; }

    get SearchValue(): any { return this._state.searchValue; }
    set SearchValue(v: any) { this._state.searchValue = v; }

    get hits(): SpHit[] { return this._state.hits; }
    set hits(v: SpHit[]) { this._state.hits = v; }

    get current(): SpHit { return this._state.current; }
    set current(v: SpHit) { this._state.current = v; }

    get step(): string { return this._state.step; }
    set step(v: string) { this._state.step = v; }

    ErrorMessage: string = '';
    searching: boolean = false;
    searched: boolean = false;

    /**
     * Rail order for the number-keyed stages is the operator's, not the
     * workflow's: the first five are the ones touched on nearly every job, in
     * the order they are touched. The rest follow the physical sequence -
     * measure, clear customs, document, alert, and the sea-to-air exception last.
     */
    private readonly allStages: SpStage[] = [
        { key: 'reciept-of-cargo',        label: 'Receipt of Cargo',        rights: 217, valuetype: 'RECEIPT_OF_CARGO',       mode: 'number' },
        { key: 'approval-received',       label: 'Approval Received',       rights: 221, valuetype: 'APPROVAL_RECEIVED',      mode: 'number' },
        { key: 'carting-air',             label: 'Carting Air',             rights: 225, valuetype: 'CARTING_AIR',            mode: 'number' },
        { key: 'ship-bill',               label: 'Shipping Bill Details',   rights: 220, valuetype: 'SHIPPING_BILL_DETAILS',  mode: 'number' },
        { key: 'bl-details',              label: 'BL Details',              rights: 224, valuetype: 'BL_DETAILS',             mode: 'number' },
        { key: 'Prepaid-freight-apprvd',  label: 'Prepaid Frt Approved',    rights: 406, valuetype: 'PRPFRT_APPROV',          mode: 'number' },
        { key: 'Dimension',               label: 'Dimension',               rights: 265, valuetype: 'DIMENSSION',             mode: 'number' },
        { key: 'measurement',             label: 'Measurement',             rights: 222, valuetype: 'MEASUREMENT',            mode: 'number' },
        { key: 'out-of-charge',           label: 'Out Of Charge',           rights: 223, valuetype: 'OUT_OF_CHARGE',          mode: 'number' },
        { key: 'destination-document',    label: 'Destination Document',    rights: 227, valuetype: 'DESTINATION_DOCUMENTS',  mode: 'number' },
        { key: 'prealert-sent-on',        label: 'Pre Alert',               rights: 226, valuetype: 'PREALERT_SENT_ON',       mode: 'number' },
        { key: 'transfer-sea-to-air',     label: 'Transfer Sea To Air',     rights: 229, valuetype: 'SEA_TO_AIR',             mode: 'number' },
        { key: 'vesselTransfer',          label: 'Vessel to Vessel Transfer', rights: 277, mode: 'vessel' },
        { key: 'carting-sea',             label: 'Carting Sea',             rights: 277, mode: 'vessel' },
        { key: 'pending-shipment',        label: 'Pending Shipment',        rights: 230, mode: 'vessel' },
    ];

    /** Stages the logged-in user may view. Empty until the rights calls answer. */
    private granted: SpStage[] = [];

    ngOnInit() {
        // Already answered earlier this session - a stage click rebuilt us, it
        // did not change who is logged in.
        if (this._state.rightsResolved) {
            this.granted = this.allStages.filter(s => this._state.grantedRights.indexOf(s.rights) !== -1);
            this.searched = !!this._state.current;
            if (this.current) { this.stages.forEach(s => { s.eligible = !!this.current.stages[s.key]; }); }
            this.runPendingRefresh();
            return;
        }
        const codes: number[] = [];
        let answered = 0;
        this.allStages.forEach(stage => {
            this._loginService.verifyRights(stage.rights, '')
                .subscribe({
                    next: (data: any) => {
                        if (this.mayView(data)) { this.granted.push(stage); codes.push(stage.rights); }
                    },
                    complete: () => {
                        if (++answered === this.allStages.length) { this._state.grantedRights = codes; }
                    },
                    error: () => {
                        if (++answered === this.allStages.length) { this._state.grantedRights = codes; }
                    },
                });
        });
    }

    /**
     * The read-only half of LoginService.checkVerify('View', data): the same
     * branches, returning false where checkVerify would have redirected.
     */
    private mayView(vdata: any): boolean {
        if (this._loginService.getLogin()[0].ROLETYPE == 'SA') { return true; }
        if (vdata == null || vdata.Table == undefined) { return false; }
        if (vdata.Table.length > 0) {
            if (vdata.Table[0].STATUS == '100') {
                return !(vdata.Table[0].viewForm == 0 || vdata.Table[0].viewForm == false);
            }
            if (vdata.Table[0].STATUS == '104') { return false; }
            return true;
        }
        return false;
    }

    /** Rail contents for the mode in play, rights-filtered. */
    get stages(): SpStage[] {
        return this.granted.filter(s => s.mode === this.mode)
                           .sort((a, b) => this.allStages.indexOf(a) - this.allStages.indexOf(b));
    }

    get railSteps(): UiStep[] {
        return this.stages.map(s => {
            const open = s.key === this.step;
            const hint = this.mode === 'vessel'
                ? undefined
                : (!this.current ? 'Search first' : (s.eligible ? undefined : 'No record'));
            return {
                key: s.key,
                label: s.label,
                hint: hint,
                state: open ? 'current' : (this.mode === 'number' && this.current && s.eligible ? 'done' : 'pending'),
            } as UiStep;
        });
    }

    /** True while the rail is not usable - nothing searched yet in number mode. */
    get railLocked(): boolean {
        return this.mode === 'number' && !this.current;
    }

    setMode(mode: 'number' | 'vessel') {
        if (this.mode === mode) { return; }
        this.mode = mode;
        this.step = '';
        this.closeStage();
    }

    changeType(event: string) { this.checkType = event; }

    /**
     * One `Export/ShipmentCommonSearch` per visible number-keyed stage - same
     * endpoint, same five params as the old per-stage screens, only the Type1
     * form type differs. A job that comes back from a stage is eligible for it.
     */
    search(keepRoute: boolean = false) {
        if (this.SearchValue == '') {
            if (this.checkType == 'EXPORT_NO') { this.ErrorMessage = 'Please enter Export No'; return false; }
            else if (this.checkType == 'ORDER_NO') { this.ErrorMessage = 'Please enter Order No'; return false; }
            else if (this.checkType == 'REF_NO') { this.ErrorMessage = 'Please enter Ref. No'; return false; }
        } else { this.ErrorMessage = ''; }

        const stages = this.stages;
        if (stages.length === 0) { this.ErrorMessage = 'You have no rights to any shipment progress stage.'; return false; }

        if (!keepRoute) { this.closeStage(); }
        this.hits = [];
        this.current = null;
        this.searched = false;
        this.searching = true;
        let pending = stages.length;

        stages.forEach(stage => {
            stage.eligible = false;
            const _jsonData = {
                Type1: stage.valuetype,
                Type2: this.checkType,
                Type3: this.SearchValue,
                Type4: this._loginService.getLogin()[0].CITYCODE,
                Type5: this._loginService.getLogin()[0].CMPCODE
            };
            this._dataService.getData('Export/ShipmentCommonSearch', _jsonData)
                .subscribe((data: any) => {
                    (data && data.Table ? data.Table : []).forEach((row: any) => {
                        const no = row['M.P.REFERENCE'];
                        if (no == null) { return; }
                        let hit = this.hits.find(h => h.exptno === no);
                        if (!hit) {
                            hit = {
                                exptno: no,
                                view: row['exptno_view'],
                                shipper: row['SHIPPER NAME'],
                                consignee: row['CONSIGNEE NAME'],
                                stages: {}
                            };
                            this.hits.push(hit);
                        }
                        hit.stages[stage.key] = true;
                    });
                    if (--pending === 0) { this.onSearchDone(); }
                }, () => { if (--pending === 0) { this.onSearchDone(); } });
        });
        return true;
    }

    private onSearchDone() {
        this.searching = false;
        this.searched = true;
        // A refresh after a save must land back on the job the operator was
        // working, not on whatever the match list happens to start with.
        const rePick = this._state.rePick;
        this._state.rePick = null;
        if (rePick) {
            const same = this.hits.find(h => h.exptno === rePick);
            if (same) { this.pick(same, true); return; }
        }
        // A single match is what an export-number search gives; open it straight
        // away so the operator never clicks a one-row list.
        if (this.hits.length === 1) { this.pick(this.hits[0]); }
    }

    /** Point the rail at one job and mark which stages it turned up in. */
    pick(hit: SpHit, keepStep: boolean = false) {
        this.current = hit;
        this.stages.forEach(s => { s.eligible = !!hit.stages[s.key]; });
        // The post-save refresh re-picks the same job; it must not touch the
        // route, which the drawer close already settled.
        if (keepStep) { return; }
        this.step = '';
        this.closeStage();
    }

    /** Clear the search and go back to an empty left panel. */
    reset() {
        this.SearchValue = '';
        this.ErrorMessage = '';
        this.hits = [];
        this.current = null;
        this.searched = false;
        this.step = '';
        this.closeStage();
    }

    /**
     * Open a stage in the centre outlet. Number-keyed stages carry the resolved
     * export number as `:exptno`, which is the param their constructors read.
     */
    onStep(key: string) {
        this.step = key;
        const stage = this.allStages.find(s => s.key === key);
        if (!stage) { return; }
        if (stage.mode === 'vessel') {
            this._router.navigate([key], { relativeTo: this._activatedRoute });
        } else if (this.current) {
            this._router.navigate([key, this.current.exptno], { relativeTo: this._activatedRoute });
        }
    }

    /**
     * Drop the child route, if one is active. The guard matters: without it the
     * post-save refresh - which runs *after* the drawer already closed - would
     * navigate to the same URL again and, with shouldReuseRoute false, rebuild
     * this component in the middle of its own search.
     */
    private closeStage() {
        if (this._activatedRoute.firstChild === null) { return; }
        this._router.navigate(['.'], { relativeTo: this._activatedRoute });
    }

    /**
     * A stage saved in the drawer. Close the drawer and re-run the eligibility
     * searches so the milestone chips pick the new state up.
     *
     * Closing navigates, which rebuilds this component, so the search cannot be
     * started here - it is flagged on the state and the rebuilt instance runs it
     * (runPendingRefresh, from ngOnInit).
     */
    refreshAfterSave() {
        const hadChild = this._activatedRoute.firstChild !== null;
        this._state.rePick = this.current ? this.current.exptno : null;
        this._state.pendingRefresh = (this.mode === 'number' && !!this.SearchValue);
        this.closeDrawer();
        // No child route means no navigation, so no rebuild is coming: run it here.
        if (!hadChild) { this.runPendingRefresh(); }
    }

    private runPendingRefresh() {
        if (!this._state.pendingRefresh) { return; }
        this._state.pendingRefresh = false;
        if (this.mode !== 'number' || !this.SearchValue) { this._state.rePick = null; return; }
        this.search(true);
    }

    /** Escape closes the drawer, exactly as Cancel and the Close button do. */
    @HostListener('document:keydown.escape')
    onEscape() {
        if (this.step) { this.closeDrawer(); }
    }

    /** True once the rights calls have answered. */
    get rightsResolved(): boolean { return this._state.rightsResolved; }

    /**
     * Status chip for one milestone row. "Listed" means the job came back from
     * that stage's own Export/ShipmentCommonSearch - the same eligibility the
     * rail used - read from the hit so it survives the rebuild on navigation.
     */
    stageState(s: SpStage): 'open' | 'listed' | 'vessel' | 'search' | 'unlisted' {
        if (s.key === this.step) { return 'open'; }
        if (s.mode === 'vessel') { return 'vessel'; }
        if (!this.current) { return 'search'; }
        return this.current.stages[s.key] ? 'listed' : 'unlisted';
    }

    get listedCount(): number {
        return this.current ? this.stages.filter(s => !!this.current.stages[s.key]).length : 0;
    }

    get percentListed(): number {
        const n = this.stages.length;
        return n ? Math.round(this.listedCount * 100 / n) : 0;
    }

    /** Close the drawer: same as the old empty centre - no child route. */
    closeDrawer() {
        this.step = '';
        this.closeStage();
    }

    get openLabel(): string {
        const stage = this.allStages.find(s => s.key === this.step);
        return stage ? stage.label : '';
    }
}
