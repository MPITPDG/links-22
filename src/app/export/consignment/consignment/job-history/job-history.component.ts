import {
    AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, NgZone, OnChanges, OnDestroy, SimpleChanges
} from '@angular/core';
import { Subscription } from 'rxjs';
import { DataService } from '../../../../shared/service/dataService';
import { LoginService } from '../../../../shared/service/loginService';
import {
    buildHistory, defaultFilter, FieldChange, filterSessions, HistEvent, HistFilter, HistoryModel, SessionView, SOURCE_LABELS, tableLabel
} from './job-history.logic';

type CardState = 'idle' | 'loading' | 'ready' | 'empty' | 'denied' | 'notfound' | 'undeployed' | 'error';

/**
 * Export job view › History card body (phase 1, read-only). The job view page shows the card to Links SA users only;
 * the procedure checks the role again (STATUS 104 for anyone else).
 *
 * Loads once per job, the first time the card scrolls into view or the page sets [open] (History nav entry) - never on
 * page load. POST api/Export/JobHistory { ExptNo, UserId } -> USP_EXPT_JOB_HISTORY; job-history.logic.ts turns the
 * answer into the Created card and the save-session timeline. Fails soft: a failed call (API or procedure not deployed
 * yet) shows "History is not deployed yet", no toast.
 */
@Component({
    selector: 'app-job-history',
    templateUrl: 'job-history.component.html',
    styleUrls: ['job-history.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class JobHistoryComponent implements OnChanges, AfterViewInit, OnDestroy {

    @Input() exptno: string = '';
    /** The page sets this when the History nav entry is used: load now (the card also loads when it scrolls into view). */
    @Input() open: boolean = false;

    state: CardState = 'idle';
    message: string = '';
    model: HistoryModel = null;
    filter: HistFilter = defaultFilter();
    view: SessionView[] = [];
    shownChanges: number = 0;
    readonly sourceLabels = SOURCE_LABELS;

    private visible = false;
    private loadedFor = '';
    private sub: Subscription = null;
    private io: IntersectionObserver = null;

    constructor(private _dataService: DataService,
        private _loginService: LoginService,
        private _host: ElementRef<HTMLElement>,
        private _zone: NgZone,
        private _cd: ChangeDetectorRef) { }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['exptno'] && !changes['exptno'].firstChange) { this.reset(); }
        if (this.open || this.visible) { this.ensureLoaded(); }
    }

    ngAfterViewInit() {
        if (typeof IntersectionObserver === 'undefined') { return; }      // the History nav entry / button still load it
        this._zone.runOutsideAngular(() => {
            this.io = new IntersectionObserver(entries => {
                const v = entries.some(e => e.isIntersecting);
                if (v === this.visible) { return; }
                this.visible = v;
                if (v) { this._zone.run(() => this.ensureLoaded()); }
            });
            this.io.observe(this._host.nativeElement);
        });
    }

    ngOnDestroy() {
        if (this.io) { this.io.disconnect(); }
        if (this.sub) { this.sub.unsubscribe(); }
    }

    /** Loads the history of the current job unless it is loaded or loading already. */
    ensureLoaded() {
        const no = String(this.exptno ?? '').trim();
        if (!no || this.loadedFor === no) { return; }
        this.load(no);
    }

    retry() {
        this.loadedFor = '';
        this.ensureLoaded();
    }

    private load(no: string) {
        if (this.sub) { this.sub.unsubscribe(); }
        const login = (this._loginService.getLogin() || [])[0] || {};
        this.loadedFor = no;
        this.state = 'loading';
        this.message = '';
        this.sub = this._dataService.Common<any>('Export/JobHistory', { ExptNo: no, UserId: String(login.CMPID ?? '').trim() })
            .subscribe({
                next: (ds: any) => {
                    const m = buildHistory(ds);
                    this.model = m;
                    this.state = m.state;
                    this.message = m.text;
                    this.applyFilter();
                    this._cd.markForCheck();
                },
                error: () => {
                    // the route (API not published) or the procedure is not there yet: fail soft
                    this.model = null;
                    this.state = 'undeployed';
                    this.message = 'History is not deployed yet.';
                    this._cd.markForCheck();
                }
            });
    }

    private reset() {
        if (this.sub) { this.sub.unsubscribe(); this.sub = null; }
        this.loadedFor = '';
        this.state = 'idle';
        this.message = '';
        this.model = null;
        this.filter = defaultFilter();
        this.view = [];
        this.shownChanges = 0;
    }

    applyFilter() {
        this.view = this.model ? filterSessions(this.model.sessions, this.filter) : [];
        this.shownChanges = this.view.reduce((n, v) => n + v.changes, 0);
    }

    toggleOrder() {
        this.filter.newestFirst = !this.filter.newestFirst;
        this.applyFilter();
    }

    clearFilters() {
        const newest = this.filter.newestFirst;
        this.filter = defaultFilter();
        this.filter.newestFirst = newest;
        this.applyFilter();
    }

    get filtered(): boolean {
        return !!(this.filter.section || this.filter.user || this.filter.q || this.filter.hideBare);
    }

    /** "Name (id)" of an event's user. */
    who(e: HistEvent): string {
        if (!e) { return ''; }
        if (e.userName) { return e.userId ? e.userName + ' (' + e.userId + ')' : e.userName; }
        return !e.userId || e.userId === '0' ? 'System' : 'User ' + e.userId;
    }

    tableText(e: HistEvent): string {
        return tableLabel(e.table);
    }

    valuesText(e: HistEvent): string {
        return e.values.map(v => v.label + ': ' + v.value).join(' · ');
    }

    trackRow(i: number, r: any): string {
        return r.kind === 'change' ? 'c' + (r.c as FieldChange).key : r.kind === 'item' ? 'i' + r.e.id : 's' + i;
    }
}
