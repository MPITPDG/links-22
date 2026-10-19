import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { DataService } from './dataService';
import { LoginService } from './loginService';

/**
 * Export job-state alerts (ported from MPERPNG-20; Links API JobStateController,
 * branch feature/links-redesign-backend).
 *
 *   POST api/Export/JobState/Alerts      {userId, cityCode, includeResolved, scope: 'mine'|'branch'}
 *        Table  = alerts (open first, CRIT -> WARN -> INFO, last_seen desc)
 *        Table1 = counts {OPEN_TOTAL, CRIT, WARN, INFO, UNACKNOWLEDGED}
 *   POST api/Export/JobState/Acknowledge {alertId, userId}
 *        Table[0].STATUS '100' on success
 *
 * userId is the login's CMPID (what the consignment save writes to
 * expt_master.username = alert owner); cityCode is the three-letter CITYCODE.
 *
 * Rules enabled on LinksDB20: SB_BEFORE_ETD, NO_MOVEMENT_7D, BL_MISSING_AFTER_SAIL and the
 * Links-only NOT_INVOICED_AFTER_SAIL. Links has no CSD approval module, so the API's
 * csd_status / csd_remark columns are always NULL and are not read here.
 *
 * Fail soft: any error (API not deployed, 404, CORS, error envelope) yields an empty
 * list and zero counts. No toast. The last good result is cached in memory and
 * shared by the header bell and the Today page.
 *
 * Links: back-off. After MAX_FAILS consecutive failures for the same login the service
 * stops calling the API for the rest of the session (the bell's 2-minute poll then costs
 * nothing), so an undeployed endpoint cannot fill the console with 404s. resume() - the
 * Today page's Refresh button - allows one more try; a page reload starts afresh.
 */
export type AlertSeverity = 'INFO' | 'WARN' | 'CRIT';

export interface JobStateAlert {
  alert_id: number;
  rule_code: string;
  rule_description?: string;
  exptno: string;
  severity: AlertSeverity;
  message: string;
  owner: string;
  citycode?: string;
  first_seen?: string;
  last_seen?: string;
  resolved_at?: string | null;
  acknowledged_by?: string | null;
  acknowledged_at?: string | null;
  stage?: string;
  consignee_name?: string;
  mode?: string;
  days_since_activity?: number | null;
  vessel_unassigned?: boolean | number | null;
  vessel_name?: string | null;
  etd?: string | null;
  cargo_expected_dt?: string | null;
  docs_pending_list?: string | null;
}

export type AlertScope = 'mine' | 'branch';

export interface JobStateCounts { OPEN_TOTAL: number; CRIT: number; WARN: number; INFO: number; UNACKNOWLEDGED: number; }

const EMPTY_COUNTS: JobStateCounts = { OPEN_TOTAL: 0, CRIT: 0, WARN: 0, INFO: 0, UNACKNOWLEDGED: 0 };
const CACHE_TTL_MS = 60 * 1000;
const SEV_RANK: Record<string, number> = { CRIT: 0, WARN: 1, INFO: 2 };
/** Consecutive failed Alerts calls after which the service goes quiet for the session. */
const MAX_FAILS = 3;

@Injectable({ providedIn: 'root' })
export class JobStateService {
  private readonly _data = inject(DataService);
  private readonly _login = inject(LoginService);

  // 'mine' feeds the bell; 'branch' is only loaded by the Today page.
  private readonly _alerts = signal<JobStateAlert[]>([]);
  private readonly _counts = signal<JobStateCounts>(EMPTY_COUNTS);
  private readonly _branchAlerts = signal<JobStateAlert[]>([]);
  private readonly _branchCounts = signal<JobStateCounts>(EMPTY_COUNTS);
  private readonly _loadedAt: Record<AlertScope, number> = { mine: 0, branch: 0 };
  private readonly _loadedFor: Record<AlertScope, string> = { mine: '', branch: '' };
  private readonly _acked = new Set<number>();

  // back-off state (Links)
  private _fails = 0;
  private _failsFor = '';
  private readonly _offline = signal(false);

  /** Open alerts, CRIT -> WARN -> INFO then last_seen desc. */
  public readonly alerts = this._alerts.asReadonly();
  public readonly counts = this._counts.asReadonly();
  public readonly branchAlerts = this._branchAlerts.asReadonly();
  public readonly branchCounts = this._branchCounts.asReadonly();
  /** True while the last Alerts call failed (API missing, network, error envelope). */
  public readonly offline = this._offline.asReadonly();
  /** Bell badge: open WARN + CRIT. */
  public readonly urgentCount = computed(() =>
    this._alerts().filter(a => a.severity === 'WARN' || a.severity === 'CRIT').length);

  public currentUser(): { userId: string; cityCode: string } {
    try {
      const l = this._login.getLogin()?.[0];
      // Alert owner = expt_master.username, which holds the numeric user id (= login CMPID).
      // Some logins carry the branch only in CITYCODE1.
      const userId = String(l?.CMPID ?? '').trim();
      const cityCode = String(l?.CITYCODE || l?.CITYCODE1 || '').trim();
      return { userId, cityCode };
    } catch { return { userId: '', cityCode: '' }; }
  }

  /** Allows one more try after the back-off stopped the calls (user pressed Refresh). */
  public resume(): void { this._fails = 0; }

  /** Loads (or returns the cached) open alerts for the logged-in user. Never errors. */
  public load(force = false, scope: AlertScope = 'mine'): Observable<JobStateAlert[]> {
    const { userId, cityCode } = this.currentUser();
    const list = scope === 'branch' ? this._branchAlerts : this._alerts;
    // 'branch' needs cityCode (the API refuses it otherwise). No login = logged out: stay quiet.
    if (!userId || (scope === 'branch' && !cityCode)) { this.set([], EMPTY_COUNTS, scope); return of([]); }
    if (this._failsFor !== userId) { this._failsFor = userId; this._fails = 0; this._offline.set(false); }
    if (this._fails >= MAX_FAILS) { return of(list()); }
    const key = userId + '|' + cityCode;
    if (!force && key === this._loadedFor[scope] && Date.now() - this._loadedAt[scope] < CACHE_TTL_MS) {
      return of(list());
    }
    return this._data.Common<any>('Export/JobState/Alerts', { userId, cityCode, includeResolved: false, scope }).pipe(
      map((ds: any) => {
        const rows: any[] = Array.isArray(ds?.Table) ? ds.Table : [];
        // ErrorLog envelopes come back as Table[0].STATUS - not alert rows. Treated as a failure.
        if (!Array.isArray(ds?.Table) || (rows.length && rows[0]?.alert_id == null && rows[0]?.STATUS != null)) {
          throw new Error('JobState/Alerts: no data');
        }
        // Acknowledged alerts stay open server-side until the rule clears; the
        // bell and Today page treat them as handled and hide them.
        const alerts = rows.filter(r => r && r.alert_id != null && !r.resolved_at && !r.acknowledged_at
            && !this._acked.has(+r.alert_id))
          .map(r => ({ ...r, severity: String(r.severity || 'INFO').toUpperCase() }) as JobStateAlert);
        // Table1 (OPEN_TOTAL/CRIT/WARN/INFO/UNACKNOWLEDGED) includes acknowledged
        // rows, so the tiles are counted from the visible list instead.
        const counts = this.countOf(alerts);
        return { alerts: JobStateService.sort(alerts), counts };
      }),
      tap(r => {
        this._fails = 0; this._offline.set(false);
        this.set(r.alerts, r.counts, scope); this._loadedFor[scope] = key; this._loadedAt[scope] = Date.now();
      }),
      map(r => r.alerts),
      catchError(() => {
        this._fails++; this._offline.set(true);
        if (key !== this._loadedFor[scope]) { this.set([], EMPTY_COUNTS, scope); }
        return of(list());
      }),
    );
  }

  /** Records the acknowledgement and drops the alert locally. Never errors. */
  public acknowledge(alert: JobStateAlert): Observable<boolean> {
    const { userId } = this.currentUser();
    this._acked.add(+alert.alert_id);
    for (const sc of ['mine', 'branch'] as AlertScope[]) {
      const cur = sc === 'branch' ? this._branchAlerts() : this._alerts();
      const rest = cur.filter(a => a.alert_id !== alert.alert_id);
      this.set(rest, this.countOf(rest), sc);
    }
    if (!userId || !alert?.alert_id) { return of(false); }
    return this._data.Common<any>('Export/JobState/Acknowledge', { alertId: alert.alert_id, userId }).pipe(
      map((ds: any) => String(ds?.Table?.[0]?.STATUS ?? '') === '100'),
      catchError(() => of(false)),
    );
  }

  public static sort(list: JobStateAlert[]): JobStateAlert[] {
    return [...list].sort((a, b) =>
      (SEV_RANK[a.severity] ?? 3) - (SEV_RANK[b.severity] ?? 3) ||
      (Date.parse(b.last_seen || '') || 0) - (Date.parse(a.last_seen || '') || 0));
  }

  private countOf(list: JobStateAlert[]): JobStateCounts {
    const n = (s: string) => list.filter(a => a.severity === s).length;
    return { OPEN_TOTAL: list.length, CRIT: n('CRIT'), WARN: n('WARN'), INFO: n('INFO'),
      UNACKNOWLEDGED: list.filter(a => !a.acknowledged_at).length };
  }

  private set(alerts: JobStateAlert[], counts: JobStateCounts, scope: AlertScope = 'mine'): void {
    (scope === 'branch' ? this._branchAlerts : this._alerts).set(alerts);
    (scope === 'branch' ? this._branchCounts : this._counts).set(counts);
  }
}
