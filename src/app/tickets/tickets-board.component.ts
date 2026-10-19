import { ChangeDetectorRef, Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ToastCommonService } from '../shared/service/toastService';
import {
  TICKET_MAX_FILE_BYTES, TICKET_MAX_TOTAL_BYTES, TICKET_STATUSES, TicketCounts, TicketStats, TicketDetail, TicketEvent,
  TicketResult, TicketRow, TicketService, TicketStatus,
} from '../shared/service/ticket.service';

const COL_CAP = 50;
// Links: namespaced (MP uses 'mp_erp_ticket_dash').
const DASH_KEY = 'links_erp_ticket_dash';
const MAX_BYTES = TICKET_MAX_FILE_BYTES;
const MAX_TOTAL_FILES = TICKET_MAX_TOTAL_BYTES - 64 * 1024;
const EXT_OK = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'pdf'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/** Fallback "Acting as" list (LinksDB20 FN_TICKET_ASSIGNEES) until Bootstrap returns the real one. */
const ACTORS_FALLBACK = [{ code: 'P', name: 'Pranav Nair' }, { code: 'S', name: 'Sujit Sahoo' }, { code: 'N', name: 'Nalini G' }];

interface Shot { file: File; url: string; isImage: boolean; }

/**
 * /tickets - raise-ticket board: users see their own tickets, developers see all and move them.
 * Ported from MPERPNG-20. Links: ticket numbers read L-000001; uploads are capped at 5 MB a file
 * and 25 MB per ticket (the API's maxRequestLength); while the API does not answer the board
 * shows an inline notice instead of error toasts and Raise is disabled.
 */
@Component({
  selector: 'app-tickets-board',
  templateUrl: './tickets-board.component.html',
  styleUrls: ['./tickets-board.component.css'],
  standalone: false,
})
export class TicketsBoardComponent implements OnInit, OnDestroy {
  private readonly _svc = inject(TicketService);
  private readonly _toast = inject(ToastCommonService);
  private readonly _route = inject(ActivatedRoute);
  private readonly _router = inject(Router);
  private readonly _cdr = inject(ChangeDetectorRef);
  private _qpSub?: Subscription;

  public readonly statuses = TICKET_STATUSES;
  public readonly cap = COL_CAP;
  public readonly isDev = this._svc.isDeveloper;
  public readonly assignees = this._svc.assignees;
  public readonly actor = this._svc.actor;
  /** "Acting as" choices = the assignee list from Bootstrap (same codes), else the LinksDB20 default. */
  public readonly actors = computed(() => {
    const a = this.assignees();
    return a.length ? a.map(x => ({ code: x.code, name: x.display_name })) : ACTORS_FALLBACK;
  });
  public readonly me = this._svc.user();
  /** The ticket API did not answer (not deployed yet / offline): inline notice, no error toasts. */
  public unavailable = signal(false);

  // developer dashboard (Tickets/Stats); null = hidden
  public stats = signal<TicketStats | null>(null);
  public dashOpen = signal(TicketsBoardComponent.readDash());
  public readonly weekMax = computed(() => Math.max(1, ...(this.stats()?.weeks || []).map(w => Math.max(w.raised, w.resolved))));

  // filters (developer bar)
  public assignedTo = signal('');
  public branch = signal('');
  public show = signal<'open' | 'all' | 'discarded'>('open');
  public q = signal('');

  public loading = signal(true);
  public rows = signal<TicketRow[]>([]);
  public counts = signal<TicketCounts>({ RAISED: 0, INPROGRESS: 0, COMPLETED: 0, DISCARDED: 0 });
  public branches = signal<string[]>([]);

  public readonly columns = computed(() => {
    const rows = this.rows();
    return this.statuses.map(s => {
      const all = rows.filter(r => r.status === s.v);
      return { v: s.v, t: s.t, rows: all.slice(0, COL_CAP), more: Math.max(0, all.length - COL_CAP), n: Math.max(this.counts()[s.v] || 0, all.length) };
    });
  });

  // card move (select or drag) with optional remark
  public pending = signal<{ id: number; to: TicketStatus } | null>(null);
  public pendingRemark = signal('');
  public dragId = 0;
  public dragOver = signal<TicketStatus | ''>('');
  public busy = signal(false);

  // drawer
  public mode = signal<'' | 'raise' | 'detail'>('');
  // raise form
  public fAssign = signal('');
  public fSubject = signal('');
  public fPage = signal('');
  public fPageTitle = '';
  public fDesc = signal('');
  public shots = signal<Shot[]>([]);
  public fErr = signal('');
  public dropHot = signal(false);
  // detail
  public detail = signal<TicketDetail | null>(null);
  public detailLoading = signal(false);
  public mvTo = signal<TicketStatus>('RAISED');
  public mvRemark = signal('');
  public commentText = signal('');
  public reassignOpen = signal(false);
  public reassignTo = signal('');

  public readonly isOwner = computed(() => +(this.detail()?.ticket?.raised_by ?? 0) === this.me.userId);

  ngOnInit(): void {
    // Opening the board is a user action: lift the bell poll's back-off for one more try.
    this._svc.resume();
    this._svc.load(true).subscribe(() => { this.load(); this.loadStats(); });
    this._qpSub = this._route.queryParamMap.subscribe(p => {
      const id = +(p.get('open') || 0);
      if (id) { this.openDetail(id); }
    });
  }

  ngOnDestroy(): void {
    this._qpSub?.unsubscribe();
    this.shots().forEach(s => URL.revokeObjectURL(s.url));
  }

  private repaint(): void { this._cdr.markForCheck(); this._cdr.detectChanges(); }

  public load(): void {
    this.loading.set(true);
    const dev = this.isDev();
    this._svc.list({
      scope: dev ? 'dev' : 'mine',
      assignedTo: dev ? this.assignedTo() : '',
      cityCode: dev ? this.branch() : '',
      show: dev ? this.show() : 'open',
      q: dev ? this.q().trim() : '',
    }).subscribe(r => {
      this.unavailable.set(!r.ok);
      this.rows.set(r.rows);
      this.counts.set(r.counts);
      const b = new Set(this.branches());
      r.rows.forEach(x => { if (x.raised_city) { b.add(x.raised_city.trim()); } });
      this.branches.set([...b].filter(Boolean).sort());
      this.loading.set(false);
      this.repaint();
    });
  }

  public loadStats(): void {
    if (!this.isDev()) { this.stats.set(null); return; }
    this._svc.stats().subscribe(s => { this.stats.set(s); this.repaint(); });
  }
  private static readDash(): boolean {
    try { return localStorage.getItem(DASH_KEY) !== '0'; } catch { return true; }
  }
  public toggleDash(): void {
    const v = !this.dashOpen();
    this.dashOpen.set(v);
    try { localStorage.setItem(DASH_KEY, v ? '1' : '0'); } catch { /* storage blocked */ }
  }
  /** "22 Sep" */
  public wk(v: string): string {
    const d = v ? new Date(v) : null;
    return d && !isNaN(d.getTime()) ? d.getDate() + ' ' + MONTHS[d.getMonth()] : '';
  }
  public pct(n: number): number { return Math.round((n / this.weekMax()) * 100); }
  public hrs(v: number | null): string { return v === null || v === undefined ? '-' : String(v); }

  // ---------- helpers ----------
  public label(s: string | null | undefined): string { return TicketService.label(s); }
  public initial(name: string | null | undefined): string { return (String(name || '?').trim()[0] || '?').toUpperCase(); }
  public setActor(code: string): void { this._svc.setActor(code); }
  /**
   * Error toast for a failed write - except when the server did not answer at all:
   * then the inline "not available" notice is shown instead (no toast spam on 404/CORS).
   */
  private failToast(r: TicketResult, title: string, fallback: string): void {
    if (r.offline) { this.unavailable.set(true); return; }
    this._toast.toast('error', title, r.msg || fallback);
  }
  /** Developer writes need an "Acting as" choice. */
  private needActor(): boolean {
    if (this.isDev() && !this.actor()) { this._toast.toast('warning', 'Acting as', 'Choose who you are (Acting as) first'); return true; }
    return false;
  }
  public age(t: TicketRow): string {
    let m = t.age_minutes != null ? +t.age_minutes : NaN;
    if (isNaN(m)) { const d = Date.parse(t.raised_at || ''); m = isNaN(d) ? 0 : Math.max(0, Math.round((Date.now() - d) / 60000)); }
    if (m < 60) { return m + ' min'; }
    if (m < 60 * 24) { return Math.floor(m / 60) + ' h'; }
    return Math.floor(m / 1440) + ' d';
  }
  private two(n: number): string { return n < 10 ? '0' + n : String(n); }
  /** "29 Sep 2026 14:12" (year optional) */
  public dt(v: string | null | undefined, year = true): string {
    const d = v ? new Date(v) : null;
    if (!d || isNaN(d.getTime())) { return ''; }
    return d.getDate() + ' ' + MONTHS[d.getMonth()] + (year ? ' ' + d.getFullYear() : '') + ' ' + this.two(d.getHours()) + ':' + this.two(d.getMinutes());
  }
  public evText(e: TicketEvent): string {
    const by = e.by_name || 'someone';
    switch ((e.event_type || '').toUpperCase()) {
      case 'RAISED': return 'Raised by ' + by;
      case 'STATUS': return '';
      case 'ASSIGN': return 'Reassigned by ' + by;
      case 'COMMENT': return 'Comment by ' + by;
      default: return (e.event_type || '') + ' by ' + by;
    }
  }
  public isImg(ct: string | null | undefined, name: string): boolean {
    return /^image\//i.test(ct || '') || /\.(png|jpe?g|gif|webp)$/i.test(name || '');
  }
  public fileUrl(id: number): string { return this._svc.fileUrl(id); }

  // ---------- moves ----------
  public askMove(t: TicketRow, to: string, sel?: HTMLSelectElement): void {
    if (sel) { sel.value = ''; }
    if (!to || to === t.status) { return; }
    this.pending.set({ id: t.ticket_id, to: to as TicketStatus });
    this.pendingRemark.set('');
  }
  public cancelMove(): void { this.pending.set(null); }
  public confirmMove(): void {
    const p = this.pending();
    if (!p || this.needActor()) { return; }
    this.doMove(p.id, p.to, this.pendingRemark(), () => this.pending.set(null));
  }
  private doMove(id: number, to: TicketStatus, remark: string, done?: () => void): void {
    this.busy.set(true);
    this._svc.move(id, to, remark).subscribe(r => {
      this.busy.set(false);
      if (r.ok) {
        this._toast.toast('success', 'Ticket moved', 'Moved to ' + this.label(to));
        done?.();
        this.load();
        this.loadStats();
        if (this.mode() === 'detail' && +(this.detail()?.ticket?.ticket_id ?? 0) === +id) { this.openDetail(id, false); }
      } else {
        this.failToast(r, 'Move failed', 'Could not move the ticket');
      }
      this.repaint();
    });
  }

  // native HTML5 drag and drop (developers only)
  public onDragStart(ev: DragEvent, t: TicketRow): void {
    if (!this.isDev()) { ev.preventDefault(); return; }
    this.dragId = t.ticket_id;
    try { ev.dataTransfer?.setData('text/plain', String(t.ticket_id)); if (ev.dataTransfer) { ev.dataTransfer.effectAllowed = 'move'; } } catch { /* ignore */ }
  }
  public onDragEnd(): void { this.dragId = 0; this.dragOver.set(''); }
  public onColDragOver(ev: DragEvent, s: TicketStatus): void {
    if (!this.isDev() || !this.dragId) { return; }
    ev.preventDefault();
    if (ev.dataTransfer) { ev.dataTransfer.dropEffect = 'move'; }
    if (this.dragOver() !== s) { this.dragOver.set(s); }
  }
  public onColDragLeave(ev: DragEvent, s: TicketStatus): void {
    const rel = ev.relatedTarget as Node | null;
    if (rel && (ev.currentTarget as HTMLElement).contains(rel)) { return; }
    if (this.dragOver() === s) { this.dragOver.set(''); }
  }
  public onColDrop(ev: DragEvent, s: TicketStatus): void {
    ev.preventDefault();
    const id = this.dragId || +(ev.dataTransfer?.getData('text/plain') || 0);
    this.dragId = 0; this.dragOver.set('');
    const t = this.rows().find(r => +r.ticket_id === +id);
    if (t && t.status !== s) { this.askMove(t, s); }
  }

  // ---------- drawer: raise ----------
  public openRaise(): void {
    const lp = this._svc.lastPage();
    this.fAssign.set('');
    this.fSubject.set('');
    this.fPage.set(lp.url || '');
    this.fPageTitle = lp.title || '';
    this.fDesc.set('');
    this.clearShots();
    this.fErr.set('');
    this.mode.set('raise');
  }
  public closeDrawer(): void {
    this.clearShots();
    this.mode.set('');
    this.detail.set(null);
    if (this._route.snapshot.queryParamMap.get('open')) {
      this._router.navigate([], { relativeTo: this._route, queryParams: { open: null }, queryParamsHandling: 'merge', replaceUrl: true });
    }
  }
  private clearShots(): void { this.shots().forEach(s => URL.revokeObjectURL(s.url)); this.shots.set([]); }
  public removeShot(i: number): void {
    const l = [...this.shots()];
    const [s] = l.splice(i, 1);
    if (s) { URL.revokeObjectURL(s.url); }
    this.shots.set(l);
  }
  public addFiles(list: FileList | File[] | null | undefined): void {
    const files = Array.from(list || []);
    const bad: string[] = [];
    const add: Shot[] = [];
    // Links: the whole Create request is capped at 25 MB (API maxRequestLength); 64 KB is left for the text fields.
    let total = this.shotBytes();
    files.forEach((f, i) => {
      let name = f.name || '';
      const ext = (name.split('.').pop() || '').toLowerCase();
      const typeExt = (f.type || '').split('/')[1]?.toLowerCase() || '';
      let e = name.includes('.') ? ext : typeExt;
      if (e === 'jpeg' && !name.includes('.')) { e = 'jpg'; }
      if (!EXT_OK.includes(e)) { bad.push((name || 'file') + ' (type)'); return; }
      if (f.size > MAX_BYTES) { bad.push((name || 'file') + ' (over 5 MB)'); return; }
      if (total + f.size > MAX_TOTAL_FILES) { bad.push((name || 'file') + ' (over 25 MB together)'); return; }
      total += f.size;
      // pasted screenshots arrive as "image.png" or unnamed: give them a unique name
      if (!name || /^image\.(png|jpe?g|gif|webp)$/i.test(name)) {
        name = 'screenshot-' + new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14) + (i ? '-' + i : '') + '.' + e;
        f = new File([f], name, { type: f.type || 'image/png' });
      }
      add.push({ file: f, url: URL.createObjectURL(f), isImage: /^image\//.test(f.type) || e !== 'pdf' });
    });
    if (add.length) { this.shots.set([...this.shots(), ...add]); }
    if (bad.length) { this._toast.toast('warning', 'File skipped', bad.join(', ') + ' - PNG/JPG/GIF/WEBP/PDF up to 5 MB each, 25 MB per ticket'); }
    this.repaint();
  }
  /** Bytes of the files already attached to the raise form. */
  public shotBytes(): number { return this.shots().reduce((n, s) => n + (s.file?.size || 0), 0); }
  /** "3.4 MB" for the attachments line. */
  public mb(bytes: number): string { return (bytes / (1024 * 1024)).toFixed(1) + ' MB'; }
  public onPaste(ev: ClipboardEvent): void {
    if (this.mode() !== 'raise') { return; }
    const files: File[] = [];
    const items = ev.clipboardData?.items;
    if (items) { for (let i = 0; i < items.length; i++) { if (items[i].kind === 'file') { const f = items[i].getAsFile(); if (f) { files.push(f); } } } }
    if (!files.length) { return; }  // plain text paste goes to the focused field as usual
    ev.preventDefault();
    this.addFiles(files);
  }
  public onDropFiles(ev: DragEvent): void {
    ev.preventDefault();
    this.dropHot.set(false);
    this.addFiles(ev.dataTransfer?.files);
  }
  public onDropOver(ev: DragEvent): void { ev.preventDefault(); this.dropHot.set(true); }
  public onBrowse(input: HTMLInputElement): void { this.addFiles(input.files); input.value = ''; }

  public raise(): void {
    const subject = this.fSubject().trim(), desc = this.fDesc().trim();
    if (!this.fAssign()) { this.fErr.set('Choose who to assign the ticket to.'); return; }
    if (!subject) { this.fErr.set('Enter a subject.'); return; }
    if (!desc) { this.fErr.set('Describe the problem.'); return; }
    if (this.shotBytes() > MAX_TOTAL_FILES) { this.fErr.set('Attachments are too large together (max 25 MB per ticket).'); return; }
    this.fErr.set('');
    this.busy.set(true);
    const page = this.fPage().trim();
    this._svc.create({
      assignedTo: this.fAssign(), subject, description: desc, pageUrl: page,
      pageTitle: page === this._svc.lastPage().url ? this.fPageTitle : '', files: this.shots().map(s => s.file),
    }).subscribe(r => {
      this.busy.set(false);
      if (r.ok) {
        this._toast.toast('success', 'Ticket raised', (r.ticketNo ? r.ticketNo + ' - ' : '') + subject);
        this.clearShots();
        this.mode.set('');
        this.load();
      } else if (r.offline) {
        // Server did not answer: say so in the form, no toast; the board shows its notice too.
        this.unavailable.set(true);
        this.fErr.set('The ticket server is not reachable yet. Nothing was saved; try again later.');
      } else {
        this.fErr.set(r.msg || 'Could not raise the ticket.');
        this._toast.toast('error', 'Raise failed', r.msg || 'Could not raise the ticket');
      }
      this.repaint();
    });
  }

  // ---------- drawer: detail ----------
  public openDetail(id: number, reset = true): void {
    this.clearShots();
    this.mode.set('detail');
    if (reset) { this.detail.set(null); this.commentText.set(''); this.mvRemark.set(''); this.reassignOpen.set(false); }
    this.detailLoading.set(true);
    this._svc.get(id).subscribe(d => {
      this.detailLoading.set(false);
      if (!d.ticket) {
        if (d.offline) { this.unavailable.set(true); }
        else { this._toast.toast('error', 'Ticket', d.msg || 'Could not open the ticket'); }
        this.mode.set('');
      } else {
        this.detail.set(d);
        this.mvTo.set(d.ticket.status);
        this.reassignTo.set((d.ticket.assigned_code || '').trim());
        this._svc.events(false, 5).subscribe();   // refresh bell unread after Get marked seen
      }
      this.repaint();
    });
  }
  public updateMove(): void {
    const t = this.detail()?.ticket;
    if (!t || this.needActor()) { return; }
    if (this.mvTo() === t.status && !this.mvRemark().trim()) { this._toast.toast('info', 'Nothing to update', 'Pick another status or type a remark'); return; }
    if (this.mvTo() === t.status) {
      // same status + remark: record it as a comment
      this.sendComment(this.mvRemark().trim(), () => this.mvRemark.set(''));
      return;
    }
    this.doMove(t.ticket_id, this.mvTo(), this.mvRemark().trim(), () => this.mvRemark.set(''));
  }
  public discardOwn(): void {
    const t = this.detail()?.ticket;
    if (!t || t.status !== 'RAISED') { return; }
    if (!confirm('Discard ticket ' + t.ticket_no + '?')) { return; }
    this.doMove(t.ticket_id, 'DISCARDED', 'Discarded by the user');
  }
  public addComment(): void {
    const text = this.commentText().trim();
    if (!text || this.needActor()) { return; }
    this.sendComment(text, () => this.commentText.set(''));
  }
  private sendComment(text: string, done: () => void): void {
    const t = this.detail()?.ticket;
    if (!t) { return; }
    this.busy.set(true);
    this._svc.comment(t.ticket_id, text).subscribe(r => {
      this.busy.set(false);
      if (r.ok) { done(); this.openDetail(t.ticket_id, false); this.load(); }
      else { this.failToast(r, 'Comment failed', 'Could not add the comment'); }
      this.repaint();
    });
  }
  public doReassign(): void {
    const t = this.detail()?.ticket;
    const to = this.reassignTo();
    if (!t || !to || to === t.assigned_code) { this.reassignOpen.set(false); return; }
    if (this.needActor()) { return; }
    this.busy.set(true);
    this._svc.reassign(t.ticket_id, to).subscribe(r => {
      this.busy.set(false);
      if (r.ok) {
        this._toast.toast('success', 'Reassigned', t.ticket_no + ' reassigned');
        this.reassignOpen.set(false);
        this.openDetail(t.ticket_id, false);
        this.load();
        this.loadStats();
      } else { this.failToast(r, 'Reassign failed', 'Could not reassign'); }
      this.repaint();
    });
  }
  public openPage(url: string | undefined): void { if (url) { this._router.navigateByUrl(url); } }
}
