import { HttpBackend, HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { ActivatedRouteSnapshot, NavigationEnd, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { Configuration } from '../../app.constants';
import { DataService } from './dataService';
import { LoginService } from './loginService';

/**
 * Raise-ticket module (ported from MPERPNG-20; Links API TicketController, api/Tickets/*,
 * branch feature/links-redesign-backend). Links ticket numbers read 'L-000001'.
 * Every call fails soft: errors become empty lists / a failed status row, no toast here.
 * Statuses: RAISED | INPROGRESS | COMPLETED | DISCARDED.
 *
 * Links: back-off. The bell polls Bootstrap + Events every 2 minutes. After MAX_FAILS
 * consecutive failures of those two calls for the same login, load() and events() stop
 * calling the API for the rest of the session, so an undeployed endpoint cannot fill the
 * console with 404s. Any successful call (e.g. the board's List) resets the count.
 */
export type TicketStatus = 'RAISED' | 'INPROGRESS' | 'COMPLETED' | 'DISCARDED';
export const TICKET_STATUSES: { v: TicketStatus; t: string }[] = [
  { v: 'RAISED', t: 'Raised' }, { v: 'INPROGRESS', t: 'In progress' }, { v: 'COMPLETED', t: 'Completed' }, { v: 'DISCARDED', t: 'Discarded' }];

/** Assignee is a label (fixed list in SQL FN_TICKET_ASSIGNEES), not a user. */
export interface TicketAssignee { code: string; display_name: string; }
// Links: namespaced (MP uses 'mp_erp_ticket_actor'); both ERPs can share an origin's localStorage.
const ACTOR_KEY = 'links_erp_ticket_actor';
export interface TicketRow {
  ticket_id: number; ticket_no: string; subject: string; status: TicketStatus;
  assigned_code: string; assigned_name?: string; raised_by: number; raised_by_name?: string; raised_city?: string;
  raised_at?: string; updated_at?: string; last_remark?: string | null; file_count?: number; comment_count?: number;
  page_url?: string; page_title?: string; order_index?: number; age_minutes?: number; description?: string;
}
export interface TicketFile { file_id: number; file_name: string; content_type?: string; size_bytes?: number; uploaded_at?: string; }
export interface TicketEvent {
  event_id: number; ticket_id?: number; ticket_no?: string; subject?: string; event_type: string;
  from_status?: string | null; to_status?: string | null; remark?: string | null; by_cmpid?: number; by_name?: string; at?: string; seen?: boolean | number;
}
export interface TicketCounts { RAISED: number; INPROGRESS: number; COMPLETED: number; DISCARDED: number; }
export interface TicketListReq { scope: 'mine' | 'dev'; assignedTo: string; cityCode: string; show: 'open' | 'all' | 'discarded'; q: string; }
/** offline = the server did not answer (or answered with an error envelope). */
export interface TicketDetail { ticket: TicketRow | null; files: TicketFile[]; events: TicketEvent[]; status: string; msg: string; offline?: boolean; }
export interface TicketStatsTotals {
  OPEN: number; RAISED: number; INPROGRESS: number; RESOLVED_7D: number; RESOLVED_30D: number; RESOLVED_ALL: number;
  DISCARDED_ALL: number; RAISED_7D: number; RAISED_30D: number; AVG_RESOLVE_HOURS_30D: number | null; OLDEST_OPEN_DAYS: number | null;
}
export interface TicketStatsPerson { code: string; display_name: string; open: number; inprogress: number; resolved_30d: number; resolved_all: number; avg_resolve_hours_30d: number | null; }
export interface TicketStatsWeek { week_start: string; raised: number; resolved: number; }
export interface TicketStatsBranch { raised_city: string; open: number; resolved_30d: number; }
export interface TicketStats { totals: TicketStatsTotals; people: TicketStatsPerson[]; weeks: TicketStatsWeek[]; branches: TicketStatsBranch[]; }
export interface TicketResult { ok: boolean; msg: string; ticketId?: number; ticketNo?: string; offline?: boolean; }

const CACHE_TTL_MS = 60 * 1000;
const EMPTY_COUNTS: TicketCounts = { RAISED: 0, INPROGRESS: 0, COMPLETED: 0, DISCARDED: 0 };
/** Consecutive failed Bootstrap/Events calls after which polling goes quiet for the session. */
const MAX_FAILS = 3;
/** Whole Create request cap: Links API Web.config httpRuntime maxRequestLength (25600 KB). */
export const TICKET_MAX_TOTAL_BYTES = 25 * 1024 * 1024;
/** Per file (TicketController.MaxFileBytes). */
export const TICKET_MAX_FILE_BYTES = 5 * 1024 * 1024;

@Injectable({ providedIn: 'root' })
export class TicketService {
  private readonly _data = inject(DataService);
  private readonly _login = inject(LoginService);
  private readonly _config = inject(Configuration);
  private readonly _router = inject(Router);
  /** Bypasses CustomInterceptor (it forces Content-Type: application/json, which breaks multipart). */
  private readonly _raw = new HttpClient(inject(HttpBackend));

  private readonly _isDeveloper = signal(false);
  private readonly _assignees = signal<TicketAssignee[]>([]);
  private readonly _actor = signal<string>(TicketService.readActor());
  private readonly _unread = signal(0);
  private readonly _events = signal<TicketEvent[]>([]);
  private readonly _lastPage = signal<{ url: string; title: string }>({ url: '', title: '' });
  private _loadedAt = 0;
  private _loadedFor = '';

  // back-off state (Links)
  private _fails = 0;
  private _failsFor = 0;
  private readonly _offline = signal(false);

  public readonly isDeveloper = this._isDeveloper.asReadonly();
  public readonly assignees = this._assignees.asReadonly();
  /** "Acting as" code (P/S/N) for the shared developer login; '' = not chosen. */
  public readonly actor = this._actor.asReadonly();
  /** Unread ticket events for the logged-in user (bell badge). */
  public readonly unread = this._unread.asReadonly();
  /** Newest events for the logged-in user (bell list). */
  public readonly recentEvents = this._events.asReadonly();
  /** Last page visited outside /tickets: {url, title} (title = deepest route data.title). */
  public readonly lastPage = this._lastPage.asReadonly();
  /** True while the last call failed (API not deployed, network, error envelope). */
  public readonly offline = this._offline.asReadonly();

  constructor() {
    this._router.events.subscribe(e => {
      if (!(e instanceof NavigationEnd)) { return; }
      const url = e.urlAfterRedirects || e.url || '';
      if (!url || url.startsWith('/tickets') || url.startsWith('/login') || url === '/') { return; }
      this._lastPage.set({ url, title: this.routeTitle(this._router.routerState.snapshot.root) });
    });
  }

  private routeTitle(snap: ActivatedRouteSnapshot | null): string {
    let title = '';
    while (snap) {
      const t = snap.data?.['title'];
      if (t) { title = String(t); }
      snap = snap.firstChild;
    }
    return title;
  }

  public user(): { userId: number; userName: string; cityCode: string } {
    try {
      const l = this._login.getLogin()?.[0];
      return { userId: +(l?.CMPID ?? 0) || 0, userName: String(l?.FULLNAME ?? l?.CMP_USERNAME ?? '').trim(), cityCode: String(l?.CITYCODE ?? '').trim() };
    } catch { return { userId: 0, userName: '', cityCode: '' }; }
  }

  // ---------- back-off ----------
  /** Allows one more try after the back-off went quiet (the user opened the board). */
  public resume(): void { this._fails = 0; }
  private noteOk(): void { this._fails = 0; this._offline.set(false); }
  private noteFail(): void { this._fails++; this._offline.set(true); }
  /** Background calls (bell poll / bell open) are skipped once MAX_FAILS is reached for this login. */
  private quiet(userId: number): boolean {
    if (this._failsFor !== userId) { this._failsFor = userId; this._fails = 0; this._offline.set(false); }
    return this._fails >= MAX_FAILS;
  }
  /** A {STATUS, MSG} error envelope instead of data rows (proc missing, SQL error). */
  private envelope(ds: any, idKey: string): boolean {
    const r = ds?.Table?.[0];
    return !ds || !Array.isArray(ds.Table) || (!!r && r[idKey] == null && r.STATUS != null && String(r.STATUS) !== '100');
  }

  private ok(ds: any): TicketResult {
    const r = ds?.Table?.[0] || {};
    return { ok: String(r.STATUS ?? '') === '100', msg: String(r.MSG ?? ''), ticketId: r.TICKET_ID != null ? +r.TICKET_ID : undefined, ticketNo: r.TICKET_NO };
  }
  private fail(): Observable<TicketResult> { this.noteFail(); return of({ ok: false, msg: 'Server not reachable', offline: true }); }
  private arr(v: any): any[] { return Array.isArray(v) ? v : []; }

  /** Bootstrap (developer flag, developer list, unread count) + 5 newest events; cached 60 s unless force. */
  public load(force = false): Observable<void> {
    const { userId } = this.user();
    if (!userId || this.quiet(userId)) { return of(void 0); }
    const key = String(userId);
    if (!force && this._loadedFor === key && Date.now() - this._loadedAt < CACHE_TTL_MS) { return of(void 0); }
    this._loadedAt = Date.now(); this._loadedFor = key;
    return this._data.Common<any>('Tickets/Bootstrap', { userId }).pipe(
      map((ds: any) => {
        // Bootstrap always returns Table1 (flags); without it this is an error envelope.
        if (!ds?.Table1) { throw new Error('Tickets/Bootstrap: no data'); }
        this._assignees.set(this.arr(ds?.Table).filter(r => r && r.code).map(r => ({ code: String(r.code).trim(), display_name: r.display_name })));
        const f = ds.Table1[0] || {};
        this._isDeveloper.set(+f.IS_DEVELOPER === 1);
        this._unread.set(+f.UNREAD_EVENTS || 0);
        this.noteOk();
        return true;
      }),
      catchError(() => { this.noteFail(); return of(false); }),
      // Bootstrap failed: do not also fire Events (it would fail the same way).
      switchMap(okd => okd ? this.events(false, 5) : of([])),
      map(() => void 0));
  }

  public list(req: TicketListReq): Observable<{ rows: TicketRow[]; counts: TicketCounts; ok: boolean }> {
    const { userId } = this.user();
    return this._data.Common<any>('Tickets/List', { userId, ...req }).pipe(
      map((ds: any) => {
        if (this.envelope(ds, 'ticket_id')) { throw new Error('Tickets/List: no data'); }
        this.noteOk();
        const c = ds?.Table1?.[0] || {};
        return {
          rows: this.arr(ds?.Table).filter(r => r && r.ticket_id) as TicketRow[],
          counts: { RAISED: +c.RAISED || 0, INPROGRESS: +c.INPROGRESS || 0, COMPLETED: +c.COMPLETED || 0, DISCARDED: +c.DISCARDED || 0 },
          ok: true,
        };
      }),
      catchError(() => { this.noteFail(); return of({ rows: [], counts: EMPTY_COUNTS, ok: false }); }));
  }

  /** multipart/form-data; files go under the `files` field. */
  public create(v: { assignedTo: string; subject: string; description: string; pageUrl: string; pageTitle: string; files: File[] }): Observable<TicketResult> {
    const { userId, userName, cityCode } = this.user();
    const fd = new FormData();
    fd.append('userId', String(userId)); fd.append('userName', userName); fd.append('cityCode', cityCode);
    fd.append('assignedTo', v.assignedTo); fd.append('subject', v.subject); fd.append('description', v.description);
    fd.append('pageUrl', v.pageUrl || ''); fd.append('pageTitle', v.pageTitle || '');
    (v.files || []).forEach(f => fd.append('files', f, f.name));
    return this._raw.post<any>(this._config.ServerWithApiUrl + 'Tickets/Create', fd).pipe(
      map(ds => { this.noteOk(); return this.ok(ds); }), catchError(() => this.fail()));
  }

  /** Also marks this user's unseen events on the ticket as seen (server side). */
  public get(ticketId: number): Observable<TicketDetail> {
    const { userId } = this.user();
    return this._data.Common<any>('Tickets/Get', { ticketId, userId }).pipe(
      map((ds: any) => {
        this.noteOk();
        const t = ds?.Table?.[0] || null;
        const denied = !!t && t.STATUS != null && !t.ticket_id;
        return {
          ticket: denied ? null : t, files: denied ? [] : this.arr(ds?.Table1), events: denied ? [] : this.arr(ds?.Table2),
          status: denied ? String(t.STATUS) : (t ? '100' : ''), msg: denied ? String(t.MSG || '') : (t ? '' : 'Ticket not found'),
        } as TicketDetail;
      }),
      tap(d => { if (d.ticket) { this.dropUnread(ticketId); } }),
      catchError(() => {
        this.noteFail();
        return of({ ticket: null, files: [], events: [], status: '', msg: 'Server not reachable', offline: true } as TicketDetail);
      }));
  }

  public move(ticketId: number, toStatus: TicketStatus, remark: string, orderIndex = 0): Observable<TicketResult> {
    const { userId } = this.user();
    return this._data.Common<any>('Tickets/Move', { ticketId, userId, toStatus, remark: remark || '', orderIndex, actorCode: this.actorCode() }).pipe(
      map(ds => { this.noteOk(); return this.ok(ds); }), catchError(() => this.fail()));
  }

  public reassign(ticketId: number, assignedTo: string): Observable<TicketResult> {
    const { userId } = this.user();
    return this._data.Common<any>('Tickets/Reassign', { ticketId, userId, assignedTo, actorCode: this.actorCode() }).pipe(
      map(ds => { this.noteOk(); return this.ok(ds); }), catchError(() => this.fail()));
  }

  public comment(ticketId: number, text: string): Observable<TicketResult> {
    const { userId, userName } = this.user();
    return this._data.Common<any>('Tickets/Comment', { ticketId, userId, userName, text, actorCode: this.actorCode() }).pipe(
      map(ds => { this.noteOk(); return this.ok(ds); }), catchError(() => this.fail()));
  }

  /** Developer dashboard (Tickets/Stats). null on any failure or non-developer. */
  public stats(): Observable<TicketStats | null> {
    const { userId } = this.user();
    if (!userId) { return of(null); }
    const num = (v: any) => +v || 0;
    const nul = (v: any) => (v === null || v === undefined || v === '') ? null : +v;
    return this._data.Common<any>('Tickets/Stats', { userId }).pipe(
      map((ds: any) => {
        const t = ds?.Table?.[0];
        if (!t || t.OPEN === undefined) { return null; }
        return {
          totals: {
            OPEN: num(t.OPEN), RAISED: num(t.RAISED), INPROGRESS: num(t.INPROGRESS), RESOLVED_7D: num(t.RESOLVED_7D),
            RESOLVED_30D: num(t.RESOLVED_30D), RESOLVED_ALL: num(t.RESOLVED_ALL), DISCARDED_ALL: num(t.DISCARDED_ALL),
            RAISED_7D: num(t.RAISED_7D), RAISED_30D: num(t.RAISED_30D),
            AVG_RESOLVE_HOURS_30D: nul(t.AVG_RESOLVE_HOURS_30D), OLDEST_OPEN_DAYS: nul(t.OLDEST_OPEN_DAYS),
          },
          people: this.arr(ds?.Table1).filter(r => r && r.code).map(r => ({
            code: String(r.code).trim(), display_name: r.display_name, open: num(r.open), inprogress: num(r.inprogress),
            resolved_30d: num(r.resolved_30d), resolved_all: num(r.resolved_all), avg_resolve_hours_30d: nul(r.avg_resolve_hours_30d) })),
          weeks: this.arr(ds?.Table2).filter(r => r && r.week_start).map(r => ({ week_start: r.week_start, raised: num(r.raised), resolved: num(r.resolved) })),
          branches: this.arr(ds?.Table3).filter(r => r && r.raised_city).map(r => ({ raised_city: String(r.raised_city).trim(), open: num(r.open), resolved_30d: num(r.resolved_30d) })),
        } as TicketStats;
      }),
      catchError(() => of(null)));
  }

  /** Newest first. Updates the recentEvents / unread signals. Skipped while backed off. */
  public events(unreadOnly = false, top = 5): Observable<TicketEvent[]> {
    const { userId } = this.user();
    if (!userId || this.quiet(userId)) { return of([]); }
    return this._data.Common<any>('Tickets/Events', { userId, unreadOnly, top }).pipe(
      map((ds: any) => {
        if (this.envelope(ds, 'event_id')) { throw new Error('Tickets/Events: no data'); }
        this.noteOk();
        const rows = this.arr(ds?.Table).filter(r => r && r.event_id) as TicketEvent[];
        this._events.set(rows);
        const u = ds?.Table1?.[0];
        if (u && u.UNREAD != null) { this._unread.set(+u.UNREAD || 0); }
        return rows;
      }),
      catchError(() => { this.noteFail(); return of([] as TicketEvent[]); }));
  }

  /** ticketId 0 = all. */
  public eventsSeen(ticketId = 0): Observable<boolean> {
    const { userId } = this.user();
    if (ticketId) { this.dropUnread(ticketId); } else { this._unread.set(0); this._events.update(l => l.map(e => ({ ...e, seen: 1 }))); }
    if (!userId || this.quiet(userId)) { return of(false); }
    return this._data.Common<any>('Tickets/EventsSeen', { userId, ticketId }).pipe(
      map(ds => this.ok(ds).ok), catchError(() => of(false)));
  }

  private dropUnread(ticketId: number): void {
    const n = this._events().filter(e => +(e.ticket_id ?? 0) === +ticketId && !+(e.seen ?? 0)).length;
    if (n) {
      this._events.update(l => l.map(e => +(e.ticket_id ?? 0) === +ticketId ? { ...e, seen: 1 } : e));
      this._unread.update(u => Math.max(0, u - n));
    }
  }

  /** Developers send the chosen actor; everyone else sends ''. */
  public actorCode(): string { return this._isDeveloper() ? this._actor() : ''; }

  public setActor(code: string): void {
    this._actor.set(code || '');
    try { localStorage.setItem(ACTOR_KEY, code || ''); } catch { /* storage blocked */ }
  }

  private static readActor(): string {
    try { const v = (localStorage.getItem(ACTOR_KEY) || '').trim(); return ['P', 'S', 'N'].includes(v) ? v : ''; } catch { return ''; }
  }

  /** GET api/Tickets/File/{id} - opened in a new tab / used as img src. */
  public fileUrl(fileId: number): string { return this._config.ServerWithApiUrl + 'Tickets/File/' + fileId; }

  public static label(s: string | null | undefined): string {
    return TICKET_STATUSES.find(x => x.v === s)?.t || String(s || '');
  }
}
