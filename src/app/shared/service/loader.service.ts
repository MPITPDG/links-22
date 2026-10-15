import { Injectable, NgZone } from '@angular/core';
import { Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

/**
 * Global "something is loading" flag.
 *
 * display(true/false) is called from thousands of places, often unbalanced
 * (true twice, false once; or no false on an error path). It used to push the
 * raw value straight into `status`, and the old full-window overlay in
 * app.component then locked the whole UI until some later false arrived.
 *
 * Now:
 *  - nested calls are counted, clamped at zero;
 *  - unbalanced callers self-heal: if a false leaves the count above zero and
 *    no new true arrives within SETTLE_MS, the count is dropped to zero;
 *  - a hard safety timeout clears it after MAX_MS no matter what;
 *  - leaving a page (NavigationStart) drops whatever the old page left behind,
 *    and route navigation itself is tracked separately so it can never stick.
 *
 * `status` keeps its old shape (BehaviorSubject<boolean>) so nothing else
 * has to change. The indicator it drives is non-blocking - see
 * shared/content-loader.component.ts.
 */
@Injectable()
export class LoaderService {
    static readonly MAX_MS = 30000;
    static readonly SETTLE_MS = 1500;

    public status: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

    /**
     * Number of mounted <app-content-loader> hosts (the layouts' content
     * areas). When none is mounted - login, popups, simple layout - app.component
     * falls back to a thin, non-blocking bar at the top of the window.
     */
    public contentHosts = 0;

    private count = 0;
    private navigating = false;
    private lastTrueAt = 0;
    private maxTimer: any = null;
    private settleTimer: any = null;

    constructor(router: Router, private zone: NgZone) {
        router.events.subscribe(e => {
            if (e instanceof NavigationStart) {
                this.count = 0;              // leaving a page clears what it left on
                this.navigating = true;
                this.emit();
            } else if (e instanceof NavigationEnd) {
                this.navigating = false;
                this.emit();
            } else if (e instanceof NavigationCancel || e instanceof NavigationError) {
                this.navigating = false;
                this.count = 0;
                this.emit();
            }
        });
    }

    display(value: boolean) {
        if (value) {
            this.count++;
            this.lastTrueAt = Date.now();
        } else {
            this.count = Math.max(0, this.count - 1);
            if (this.count > 0) this.scheduleSettle();
        }
        this.emit();
    }

    /** Force the indicator off. */
    reset() {
        this.count = 0;
        this.navigating = false;
        this.emit();
    }

    private scheduleSettle() {
        clearTimeout(this.settleTimer);
        const since = this.lastTrueAt;
        this.settleTimer = setTimeout(() => {
            if (this.count > 0 && this.lastTrueAt === since) {
                this.zone.run(() => { this.count = 0; this.emit(); });
            }
        }, LoaderService.SETTLE_MS);
    }

    private emit() {
        const on = this.navigating || this.count > 0;
        clearTimeout(this.maxTimer);
        if (on) {
            this.maxTimer = setTimeout(() => this.zone.run(() => this.reset()), LoaderService.MAX_MS);
        } else {
            clearTimeout(this.settleTimer);
        }
        if (this.status.value !== on) this.status.next(on);
    }
}
