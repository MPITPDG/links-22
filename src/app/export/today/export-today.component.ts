import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { JobStateAlert, AlertSeverity, JobStateService } from '../../shared/service/jobstate.service';

const PAGE_SIZE = 10;

interface Tile { k: AlertSeverity; label: string; }

/**
 * Export > Today: the logged-in user's open job-state alerts
 * (api/Export/JobState/Alerts via JobStateService, shared with the header bell).
 *
 * Ported from MPERPNG-20. Links has no CSD (France) approval module and no vessel
 * suggester, so MP's Approval filter, CSD reply box and vessel-suggest popup are not
 * here: every row action opens the job (export/Consignment/view/:expt_no).
 * Page kit: global import-page.css + consignment-page.css (host class kit-consignment).
 */
@Component({
    selector: 'app-export-today',
    templateUrl: './export-today.component.html',
    styleUrls: ['./export-today.css'],
    host: { class: 'kit-consignment' },
    standalone: false,
})
export class ExportTodayComponent implements OnInit {
    private readonly _jobState = inject(JobStateService);
    private readonly _router = inject(Router);

    public readonly tiles: Tile[] = [
        { k: 'CRIT', label: 'Critical' },
        { k: 'WARN', label: 'Warning' },
        { k: 'INFO', label: 'Info' },
    ];

    public loading = signal(true);
    public severity = signal('');
    public rule = signal('');
    public mineOnly = signal(true);
    public text = signal('');
    public page = signal(1);

    /** The Alerts endpoint did not answer (not deployed yet, offline): the empty state says so. */
    public readonly offline = this._jobState.offline;

    public readonly counts = computed(() => this.mineOnly() ? this._jobState.counts() : this._jobState.branchCounts());
    private readonly source = computed(() => this.mineOnly() ? this._jobState.alerts() : this._jobState.branchAlerts());
    private readonly total = computed(() => this.counts().CRIT + this.counts().WARN + this.counts().INFO);

    public readonly rules = computed(() =>
        Array.from(new Set(this.source().map(a => a.rule_code).filter(Boolean))).sort());

    public readonly rows = computed(() => {
        const sev = this.severity(), rule = this.rule(), q = this.text().trim().toUpperCase();
        return JobStateService.sort(this.source().filter(a =>
            (!sev || a.severity === sev) &&
            (!rule || a.rule_code === rule) &&
            (!q || String(a.exptno || '').toUpperCase().includes(q) ||
                   String(a.consignee_name || '').toUpperCase().includes(q))));
    });

    public readonly pageCount = computed(() => Math.max(1, Math.ceil(this.rows().length / PAGE_SIZE)));
    private readonly curPage = computed(() => Math.min(this.page(), this.pageCount()));
    public readonly pageRows = computed(() =>
        this.rows().slice((this.curPage() - 1) * PAGE_SIZE, this.curPage() * PAGE_SIZE));
    public readonly rangeStart = computed(() => this.rows().length ? (this.curPage() - 1) * PAGE_SIZE + 1 : 0);
    public readonly rangeEnd = computed(() => Math.min(this.rows().length, (this.curPage() - 1) * PAGE_SIZE + PAGE_SIZE));
    public readonly pageList = computed(() => Array.from({ length: this.pageCount() }, (_, i) => i + 1));

    ngOnInit(): void { this.refresh(); }

    /** Set when "mine" came back empty on first load and the page fell back to the branch. */
    public autoBranch = signal(false);
    /** Only the very first load may fall back; a scope the user picked is respected as is. */
    private firstLoad = true;

    /** manual = the Refresh button: lifts the service's back-off for one more try. */
    public refresh(manual = false): void {
        if (manual) { this._jobState.resume(); }
        this.loading.set(true);
        const scope = this.mineOnly() ? 'mine' : 'branch';
        this._jobState.load(true, scope).subscribe({
            complete: () => {
                // A user who has not opened any jobs would see nothing: show the branch instead and say so.
                // Not when the call failed - the branch call would fail the same way.
                const mayFallBack = this.firstLoad; this.firstLoad = false;
                if (mayFallBack && scope === 'mine' && !this.offline() && this._jobState.alerts().length === 0) {
                    this.autoBranch.set(true);
                    this.mineOnly.set(false);
                    this._jobState.load(true, 'branch').subscribe({ complete: () => this.loading.set(false) });
                } else {
                    this.loading.set(false);
                }
            }
        });
    }

    public count(k: AlertSeverity): number { return this.counts()[k]; }
    public pct(k: AlertSeverity): number {
        const t = this.total();
        return t ? Math.round((this.count(k) / t) * 100) : 0;
    }

    public toggleSeverity(k: string): void { this.severity.set(this.severity() === k ? '' : k); this.page.set(1); }
    public setSeverity(v: string): void { this.severity.set(v || ''); this.page.set(1); }
    public setRule(v: string): void { this.rule.set(v || ''); this.page.set(1); }
    public setScope(v: string): void { this.autoBranch.set(false); this.mineOnly.set(v !== 'branch'); this.page.set(1); this.refresh(); }
    public setText(v: string): void { this.text.set(v || ''); this.page.set(1); }

    public clear(): void {
        const reload = !this.mineOnly();
        this.severity.set(''); this.rule.set(''); this.mineOnly.set(true); this.text.set(''); this.page.set(1);
        if (reload) { this.refresh(); }
    }

    /** dd Mon yyyy for the grey sub-lines; '' when absent or unparsable. */
    public day(v: string | null | undefined): string {
        const d = v ? new Date(v) : null;
        if (!d || isNaN(d.getTime())) { return ''; }
        const m = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return (d.getDate() < 10 ? '0' : '') + d.getDate() + ' ' + m[d.getMonth()] + ' ' + d.getFullYear();
    }

    public goPage(p: number): void { this.page.set(Math.min(Math.max(1, p), this.pageCount())); }

    /**
     * Row button label per rule. Rules enabled on LinksDB20: SB_BEFORE_ETD, NO_MOVEMENT_7D,
     * BL_MISSING_AFTER_SAIL, NOT_INVOICED_AFTER_SAIL; the disabled ones keep MP's labels.
     */
    public actionLabel(a: JobStateAlert): string {
        switch (a.rule_code) {
            case 'VESSEL_UNASSIGNED': return 'Assign vessel';
            case 'BL_MISSING_AFTER_SAIL': return 'Enter BL';
            case 'NOT_INVOICED_AFTER_SAIL':
            case 'NOT_INVOICED_AFTER_DELIVERY': return 'Raise invoice';
            default: return 'Open job';
        }
    }

    /** Tooltip for the row button: where it actually goes. */
    public actionHint(a: JobStateAlert): string {
        switch (a.rule_code) {
            case 'NOT_INVOICED_AFTER_SAIL':
            case 'NOT_INVOICED_AFTER_DELIVERY':
                return 'Opens job ' + a.exptno + ' to check the charges; the invoice itself is raised in Finance > Invoice > Add';
            default: return 'Open job ' + a.exptno;
        }
    }

    /**
     * Every action opens the job. The consignment view has no documents-tab route, and
     * Finance's invoice screen is behind the financial-year guard and takes an invoice
     * number, not a job, so "Raise invoice" opens the job as well.
     */
    public openJob(a: JobStateAlert): void {
        this._router.navigate(['export/Consignment/view', a.exptno]);
    }

    public act(a: JobStateAlert): void { this.openJob(a); }

    public acknowledge(a: JobStateAlert): void {
        this._jobState.acknowledge(a).subscribe();
    }
}
