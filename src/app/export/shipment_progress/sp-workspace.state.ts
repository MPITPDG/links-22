import { Injectable } from '@angular/core';

/** One row of Export/ShipmentCommonSearch, as the workspace uses it. */
export interface SpHit {
    exptno: string;
    view: string;
    shipper: string;
    consignee: string;
    /** stage key -> the job appears in that stage's search */
    stages: { [key: string]: boolean };
}

/**
 * Everything the Shipment Progress workspace needs to survive a navigation.
 *
 * app.component sets
 *   routeReuseStrategy.shouldReuseRoute = () => false
 * so every navigation rebuilds the whole route tree - including a PARENT when
 * only a child changes. The workspace hosts each stage as a child route, so
 * opening a stage destroyed and recreated the workspace itself: the searched
 * job, the rights answers and the rail all reset, and the screen appeared to
 * empty itself the moment you clicked a stage.
 *
 * Holding that state here, root-provided, makes the rebuild invisible. It also
 * makes it free: the twelve verifyRights calls and the eligibility searches run
 * once for the session rather than once per stage click - which, at fifteen
 * stages, was two dozen requests every time an operator moved between them.
 *
 * Same reason UiSidebarService holds the expanded branches and the menu scroll
 * offset. Clearing is explicit: reset() on a new search, clearAll() when the
 * user leaves the workspace entirely.
 */
@Injectable({ providedIn: 'root' })
export class SpWorkspaceState {

    /** Which half of the screen is in play - number-keyed stages, or vessel-keyed. */
    mode: 'number' | 'vessel' = 'number';

    /** EXPORT_NO | ORDER_NO | REF_NO, mirroring the old per-stage search. */
    checkType: string = 'EXPORT_NO';
    searchValue: string = '';

    /** Matches for the last search, and the one whose stages the rail shows. */
    hits: SpHit[] = [];
    current: SpHit = null;

    /** Route segment of the stage open in the centre; '' when none is. */
    step: string = '';

    /** Rights codes the user may view. Null until the rights calls have answered. */
    grantedRights: number[] = null;

    /**
     * Set when a stage in the drawer saved: the drawer closes, the workspace is
     * rebuilt by that navigation, and the fresh instance re-runs the stage
     * searches so the milestone chips show the stage as listed. The flag has to
     * live here for the same reason everything else does - the instance that
     * asked for the refresh is gone by the time it happens.
     */
    pendingRefresh: boolean = false;

    /** Export no. to re-select once that refresh search comes back. */
    rePick: string = null;

    /** True once the rights fan-out has completed, so it is never repeated. */
    get rightsResolved(): boolean { return this.grantedRights !== null; }

    /** A new search invalidates the resolved job and everything derived from it. */
    reset(): void {
        this.hits = [];
        this.current = null;
        this.step = '';
        this.pendingRefresh = false;
        this.rePick = null;
    }

    /** Full teardown - rights included. Used when the workspace is left behind. */
    clearAll(): void {
        this.reset();
        this.mode = 'number';
        this.checkType = 'EXPORT_NO';
        this.searchValue = '';
        this.grantedRights = null;
    }
}
