import { Injectable } from '@angular/core';

/**
 * What a stage child needs from the workspace that is hosting it.
 *
 * Implemented by SpWorkspaceComponent; the children never see the component
 * type, only this shape - so no import cycle between sp.component.ts and the
 * workspace.
 */
export interface SpWorkspaceHost {
    /** Shut the drawer and leave the workspace exactly as it was. */
    closeDrawer(): void;
    /** Shut the drawer and re-run the stage eligibility searches. */
    refreshAfterSave(): void;
}

/**
 * The bridge between the Shipment Progress workspace and the stage update
 * components it hosts in its drawer.
 *
 * Those components predate the workspace: each was a standalone page reached
 * from its own search screen, so Cancel and a successful Update both ended with
 * a navigate back to that search screen. Inside the drawer that is wrong - it
 * throws the operator out of the workspace and loses the job they searched.
 *
 * Rather than fork fifteen components, each one now asks here first: if a
 * workspace is registered we are running in its outlet, so close the drawer
 * (and refresh, after a save) and return true; if nothing is registered the
 * component is on its own route and navigates exactly as it always did.
 *
 * Registration is the workspace's job. Note that app.component sets
 * shouldReuseRoute = () => false, so the workspace is destroyed and rebuilt on
 * every child navigation - unregister() therefore only clears the slot when the
 * instance leaving is still the one holding it, which keeps a rebuild
 * (register-new, destroy-old, in either order) from emptying the slot.
 */
@Injectable({ providedIn: 'root' })
export class SpWorkspaceService {

    private host: SpWorkspaceHost = null;

    register(host: SpWorkspaceHost): void { this.host = host; }

    unregister(host: SpWorkspaceHost): void {
        if (this.host === host) { this.host = null; }
    }

    /** True while a stage is being rendered inside the workspace drawer. */
    get inWorkspace(): boolean { return this.host !== null; }

    /**
     * Cancel path. Returns false when there is no workspace, meaning the caller
     * should navigate away the way it used to.
     */
    close(): boolean {
        if (this.host === null) { return false; }
        this.host.closeDrawer();
        return true;
    }

    /** Save path: close the drawer and recompute the milestone chips. */
    closeAndRefresh(): boolean {
        if (this.host === null) { return false; }
        this.host.refreshAfterSave();
        return true;
    }
}
