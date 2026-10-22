import { ChangeDetectionStrategy, Component, HostListener, NgZone, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { SheetService, SheetResult, SHEET_FORM_VIEW, SHEET_FORM_CONVERT, SHEET_FORM_SETTINGS } from '../sheet.service';
import { LoginService } from '../../../shared/service/loginService';
import { DataService } from '../../../shared/service/dataService';
import { ToastCommonService } from '../../../shared/service/toastService';
import { ConsignmentPrefillService, ConsignmentPrefill } from '../../consignment/consignment/consignment-prefill.service';
import { SheetGridComponent } from '../sheet-grid/sheet-grid.component';
import {
    SheetCanEdit, SheetColumn, SheetContextAction, SheetContextItem, SheetEdit, SheetFmtChange, SheetLayout, SheetRow,
    SheetRowOp, SheetSelectionInfo, SheetStatus, SheetViewState
} from '../sheet-grid/sheet-grid.types';
import { GRID_TABS } from '../sheet-registry';
import { buildPrefill, rowsForWo, ConvertAlias, ConvertVessel } from '../sheet-convert';
import {
    Access, Conflict, EditQueue, HelperCombo, LegendEntry, MonthTab, PersonalLayout, RecMap, RowCtx, SheetRec, TabMeta,
    accessFrom, applyFmtLocally, applySaveResult, asOfOf, batchOf, convertRow, dateTimeText, dropQueued, enqueueEdits,
    fmtEdits, gridColumns, gridShape, hazColour, headerOf, helperCombos, layoutFrom, legendFrom, mergeChanges,
    mergeServerRows, monthLabel, monthTabs, newMonthTabs, nextMonth, orderRecs, ownerCheck, ownerLocks, parseJson, qkey, reasonText,
    rebaseQueue, resolveConflict, rowOpArgs, settingsLogLabel, statusOnly, str, tabCodeOf, toSheetRow, woColumns
} from './sheet-view.logic';

/**
 * Export › Sheet view (/export/sheet): the Bajaj monthly Google workbook inside Links (docs/SHEET_VIEW_SPEC.md,
 * SHEET_VIEW_CONTRACT.md section 6). Month picker, the workbook's tabs in order, one row per WO line, connected
 * to api/Export/Sheet/* (SheetService), and Convert to job into the normal Export Master form.
 *
 * Rights (tbl_mst_form): 448 view / modify (edit cells, row operations; add rows needs Add), 449 Convert / Link /
 * Unlink, 450 settings (Colour CODE, Column Access, aliases editable). SA has everything.
 * Column ownership is a hard lock (MY_ROLES), Links-owned columns of linked rows show the Links value, locked.
 *
 * Data flow on a WO tab: the grid emits intents; edits are applied to the rows at once (optimistic) and sent in
 * ~400 ms batches (SaveCells with the row version); refusals roll back, conflicts open the keep mine / take theirs
 * prompt. Changes (GridChanges on grid / free tabs) are polled every 10 s while the page is visible. State per tab lives in a TabState; switching tab
 * or month retires it (its last batch is still sent). The pure parts are in sheet-view.logic.ts.
 *
 * Fail soft: the API and tables are deployed last. Every failed call leaves an in-page notice; when Months fails the
 * page says the server part is not deployed yet and calls nothing else; polling stops after a failure until Retry.
 */

interface MonthRow { id: number; month: string; title: string; rowVer: number; tabs: any; }

interface TabState {
    kind: 'wo' | 'grid';
    monthId: number;
    tab: MonthTab;
    loading: boolean;
    error: string;
    recs: RecMap;
    rows: SheetRow[];
    queue: EditQueue;
    inFlight: boolean;
    /** a Changes / refresh call is out (polls never overlap) */
    polling: boolean;
    /** a write (save, row op, format, link) is out or came back: a poll answer computed before it is stale */
    writeSeq: number;
    asOf: string;
    lastFull: number;
    meta: TabMeta | null;
    metaVer: number;
    /** last save problem that kept the user's edits (server unreachable) */
    unsaved: string;
    savedAt: string;
}

interface ViewRow { id: number; name: string; kind: 'layout' | 'filter'; monthId: number | null; data: any; }
interface HistoryRow { id: number; at: string; who: string; action: string; col: string; oldV: string; newV: string; canRestore: boolean; }
interface Notice { id: string; kind: 'warn' | 'info'; text: string; action?: string; }

const SAVE_DEBOUNCE_MS = 400;
const POLL_MS = 10000;
const FULL_RELOAD_MS = 5 * 60 * 1000;
const LAYOUT_SAVE_MS = 1000;
const LAYOUT_VIEW_NAME = 'My layout';

const TAG_LABELS: { [tag: string]: string } = {
    links: 'Links value - locked once the job has it',
    pending: 'Not in Links yet - the sheet value, still editable',
    flag: 'Check the link to the job',
    note: 'Not a single date - kept as typed'
};

@Component({
    selector: 'app-sheet-view',
    templateUrl: './sheet-view.component.html',
    styleUrls: ['./sheet-view.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class SheetViewComponent implements OnInit, OnDestroy {
    private _api = inject(SheetService);
    private _login = inject(LoginService);
    private _data = inject(DataService);
    private _toast = inject(ToastCommonService);
    private _prefill = inject(ConsignmentPrefillService);
    private _router = inject(Router);
    private _route = inject(ActivatedRoute);
    private _location = inject(Location);
    private _zone = inject(NgZone);

    @ViewChild(SheetGridComponent) grid?: SheetGridComponent;

    readonly tagLabels = TAG_LABELS;
    readonly monthLabel = monthLabel;

    /** rights -> months -> ready; or one of the stop states */
    phase: 'rights' | 'rightsFailed' | 'denied' | 'months' | 'down' | 'empty' | 'ready' = 'rights';
    downText = '';
    canView = false;
    canModify = false;
    canAdd = false;
    canConvert = false;
    canSettings = false;

    months: MonthRow[] = [];
    monthId = 0;
    tabs: MonthTab[] = [];
    tab: MonthTab | null = null;
    tabCounts: { [code: string]: number } = {};
    /** one key per opened grid tab: a new key re-creates <app-sheet-grid> (its undo stack belongs to that tab) */
    gridKeys: string[] = [];

    st: TabState | null = null;
    columns: SheetColumn[] = [];
    frozenCols = 1;
    readOnly = true;
    canEditCell: SheetCanEdit = () => true;
    viewState: SheetViewState | null = null;
    contextItems: SheetContextItem[] = [];
    selection: SheetSelectionInfo = { rowIds: [], keys: [], active: null };
    exportName = 'Sheet';

    legend: LegendEntry[] = [];
    statuses: SheetStatus[] = [];
    readonly noStatuses: SheetStatus[] = [];
    private ctx: RowCtx = { kind: 'wo', statusBy: new Map(), hazFg: '#c62828' };
    private legendDirty = false;
    access: Access = { state: 'loading', admin: false, roles: new Set(), cols: null };

    views: ViewRow[] = [];
    filterViewId = 0;
    private layoutView: ViewRow | null = null;
    private lastLayout: SheetLayout | null = null;
    private layoutTimer: any = null;

    notices: Notice[] = [];
    livePaused = '';
    linkedCount = 0;
    /** grid / free tabs: the workbook's pinned top rows and merged cells (GRID_TABS, TABMETA on top) */
    gridFrozenRows = 0;
    gridMerges: string[] = [];
    private readonly noMerges: string[] = [];

    // panels
    settingsOpen = false;
    settingsView: 'alias' | 'history' = 'alias';
    /** the settings drawer's history: 'settings' = History('M', 0), 'month' = History('M', month id) */
    setHist: { scope: 'settings' | 'month'; loading: boolean; error: string; rows: HistoryRow[] } | null = null;
    helperOpen = false;
    helper: HelperCombo[] = [];
    history: { rowId: number; title: string; loading: boolean; error: string; rows: HistoryRow[] } | null = null;

    // dialogs
    newMonth: { month: string; title: string; copyFrom: number; carry: boolean; nigeria: boolean; busy: boolean; error: string; existingId: number } | null = null;
    linkDlg: { rowIds: number[]; exptno: string; relink: number; busy: boolean; error: string } | null = null;
    unlinkDlg: { rowIds: number[]; jobs: string; busy: boolean } | null = null;
    convertDlg: { rows: SheetRec[]; wo: string; busy: boolean; error: string } | null = null;
    conflictDlg: { items: (Conflict & { where: string; header: string })[] } | null = null;
    saveViewDlg: { name: string; busy: boolean; error: string } | null = null;

    private saveTimer: any = null;
    private pollTimer: any = null;
    private destroyed = false;
    private convertDone: { rowIds: number[]; exptno: string } | null = null;
    private wantMonth = 0;
    private wantTab = '';

    // ================================================================ lifecycle

    ngOnInit(): void {
        // Back from the consignment form opened by Convert to job (this page was destroyed meanwhile).
        const res = this._prefill.consumeResult();
        if (res && res.status === 'saved' && res.exptno && res.source && res.source.kind === 'sheet' && (res.source.rowIds || []).length) {
            this.convertDone = { rowIds: res.source.rowIds.map(x => +x).filter(x => x > 0), exptno: String(res.exptno) };
        }
        const q = this._route.snapshot.queryParamMap;
        this.wantMonth = +(q.get('month') || 0) || 0;
        this.wantTab = tabCodeOf(q.get('tab'));
        this.checkRights();
        this._zone.runOutsideAngular(() => {
            this.pollTimer = setInterval(() => {
                if (!document.hidden && this.mayPoll()) { this._zone.run(() => this.poll()); }
            }, POLL_MS);
        });
    }

    ngOnDestroy(): void {
        this.destroyed = true;
        clearInterval(this.pollTimer);
        clearTimeout(this.histTimer);
        clearTimeout(this.layoutTimer);
        clearTimeout(this.saveTimer);
        // the last edits still go out (their answer only reports problems)
        if (this.st) { this.flush(this.st, true); }
    }

    /** back to a visible page after a while: refresh the tab (Links values of untouched rows included) */
    @HostListener('document:visibilitychange')
    onVisibility(): void {
        const st = this.st;
        if (!document.hidden && st && st.kind === 'wo' && !this.livePaused && Date.now() - st.lastFull > 60000) {
            this.loadTab(st, true);
        }
    }

    @HostListener('document:keydown.escape')
    onEsc(): void {
        if (this.conflictDlg) { return; } // must be answered
        this.newMonth = null; this.linkDlg = null; this.unlinkDlg = null; this.convertDlg = null; this.saveViewDlg = null;
        if (this.settingsOpen) { this.settingsOpen = false; }
    }

    // ================================================================ rights

    checkRights(): void {
        this.phase = 'rights';
        const today = this._data.getCurrentdate();
        const role = (this._login.getLogin() || [])[0]?.ROLETYPE;
        const ask = (id: number) => this._login.verifyRights(id, today).pipe(catchError(() => of(null)));
        forkJoin([ask(SHEET_FORM_VIEW), ask(SHEET_FORM_CONVERT), ask(SHEET_FORM_SETTINGS)]).subscribe(([v, c, s]: any[]) => {
            if (!v && role !== 'SA') { this.phase = 'rightsFailed'; return; }
            const r = (mode: string, d: any) => this._login.returnRights(mode, d || {}, role);
            this.canView = r('View', v);
            this.canModify = this.canView && r('Modify', v);
            this.canAdd = this.canModify && r('Add', v);
            this.canConvert = this.canView && r('View', c);
            this.canSettings = this.canView && r('Modify', s);
            this.readOnly = !this.canModify;
            if (!this.canView) { this.phase = 'denied'; return; }
            this.afterRights();
        });
    }

    private afterRights(): void {
        const done = this.convertDone;
        if (done && this.canConvert) {
            this.convertDone = null;
            this.phase = 'months';
            this._api.convertDone(done.rowIds, done.exptno).subscribe(r => {
                if (r.ok) {
                    this._toast.toast('success', 'Convert to job', 'Job ' + done.exptno + ' linked to ' + done.rowIds.length + ' row' + (done.rowIds.length === 1 ? '' : 's') + '.');
                } else {
                    this.notice('convert', 'warn', 'Job ' + done.exptno + ' was saved, but the sheet row could not be linked to it: ' + (r.text || 'no answer') +
                        '. Use Link to job with ' + done.exptno + ' on the row.', '');
                }
                this.loadMonths();
            });
            return;
        }
        if (done) {
            this.notice('convert', 'warn', 'Job ' + done.exptno + ' was saved; linking it to the sheet row needs the Convert / Link right (form 449).', '');
            this.convertDone = null;
        }
        this.loadMonths();
    }

    // ================================================================ months

    loadMonths(selectId = 0): void {
        this.phase = 'months';
        this._api.months().subscribe(r => {
            if (!r.ok) {
                // the first call of the page: no API / tables yet, or the server is down
                this.phase = 'down';
                // '000' = no answer at all (the service's text is about kept edits, not for this page)
                this.downText = r.status === '000' ? '' : str(r.text).trim().replace(/\.+$/, '');
                this.stopTab();
                return;
            }
            this.months = this._api.rows(r.ds).filter((m: any) => m && m.ID !== undefined).map((m: any) => ({
                id: +m.ID, month: str(m.SHEET_MONTH).trim(), title: str(m.TITLE).trim(), rowVer: +m.ROWVER || 0, tabs: m.TABS
            }));
            if (!this.months.length) { this.phase = 'empty'; this.stopTab(); return; }
            this.phase = 'ready';
            if (this.access.state !== 'ok') { this.loadAccess(); }
            if (!this.legend.length) { this.loadLegend(); }
            const want = selectId || this.wantMonth || this.monthId;
            const now = new Date();
            const cur = now.getFullYear() + '-' + ('0' + (now.getMonth() + 1)).slice(-2);
            const m = this.months.find(x => x.id === want) || this.months.find(x => x.month === cur) || this.months[0];
            this.wantMonth = 0;
            this.openMonth(m.id);
        });
    }

    retryServer(): void { this.loadMonths(); }

    get month(): MonthRow | undefined { return this.months.find(m => m.id === this.monthId); }

    pickMonth(id: number): void {
        if (id && id !== this.monthId) { this.openMonth(id); }
    }

    private openMonth(id: number): void {
        const m = this.months.find(x => x.id === id);
        if (!m) { return; }
        this.retireTab();
        this.monthId = m.id;
        this.tabs = monthTabs(m.tabs);
        this.tabCounts = {};
        const want = this.wantTab || (this.tab ? this.tab.code : '');
        this.wantTab = '';
        const t = this.tabs.find(x => x.code === want) || this.tabs.find(x => x.kind === 'wo') || this.tabs[0];
        this.tab = null;
        this.openTab(t);
    }

    // ---- new month --------------------------------------------------------------------------------

    openNewMonth(): void {
        const ym = nextMonth(this.months.map(m => m.month), new Date());
        const src = this.months[0];
        this.newMonth = {
            month: ym, title: this.defaultTitle(ym),
            copyFrom: src ? src.id : 0, carry: !!src, nigeria: !!(src && monthTabs(src.tabs).some(t => t.code === 'NIGERIA')), busy: false, error: '', existingId: 0
        };
    }

    newMonthTitle(ym: string): void {
        if (this.newMonth) { this.newMonth.month = ym; this.newMonth.title = this.defaultTitle(ym); }
    }

    /** the workbook's name: "Bajaj October Sheet 2026" */
    private defaultTitle(ym: string): string { return 'Bajaj ' + monthLabel(ym).replace(' ', ' Sheet '); }

    saveNewMonth(): void {
        const d = this.newMonth;
        if (!d || d.busy) { return; }
        if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(d.month)) { d.error = 'Pick the month.'; return; }
        d.busy = true; d.error = ''; d.existingId = 0;
        const tabs = newMonthTabs(d.nigeria);
        this._api.monthSave({
            Id: 0, SheetMonth: d.month, Title: str(d.title).trim().slice(0, 100) || ('Bajaj ' + monthLabel(d.month)),
            Tabs: JSON.stringify(tabs), RowVer: 0, CopyFromId: +d.copyFrom || 0, CarryRows: !!d.carry && +d.copyFrom > 0
        }).subscribe(r => {
            d.busy = false;
            const row = this._api.rows(r.ds)[0] || {};
            if (r.ok) {
                this.newMonth = null;
                const carried = +row.CARRIED_ROWS || 0;
                this._toast.toast('success', 'New month', monthLabel(d.month) + ' created' + (carried ? ', ' + carried + ' unfinished row' + (carried === 1 ? '' : 's') + ' carried over.' : '.'));
                this.loadMonths(+row.ID || 0);
            } else {
                d.error = r.text || 'The month was not created.';
                if (r.status === '102' && +row.ID) { d.existingId = +row.ID; }
            }
        });
    }

    openExisting(): void {
        const id = this.newMonth ? this.newMonth.existingId : 0;
        this.newMonth = null;
        if (id) { this.loadMonths(id); }
    }

    // ================================================================ tabs

    openTab(t: MonthTab | undefined): void {
        if (!t || (this.tab && this.tab.code === t.code && this.st && this.st.monthId === this.monthId)) { return; }
        this.retireTab();
        const fromSettings = this.tab && this.tab.kind === 'legend';
        this.tab = t;
        this.history = null;
        this.helperOpen = !!t.helper;
        this.selection = { rowIds: [], keys: [], active: null };
        this.exportName = t.title;
        this._location.replaceState('/export/sheet', 'month=' + this.monthId + '&tab=' + encodeURIComponent(t.code));
        if (t.kind === 'wo' || t.kind === 'grid' || t.kind === 'free') {
            if (fromSettings || this.legendDirty) { this.loadLegend(); }
            const st: TabState = {
                kind: t.kind === 'wo' ? 'wo' : 'grid', monthId: this.monthId, tab: t, loading: true, error: '', recs: new Map(), rows: [],
                queue: new Map(), inFlight: false, polling: false, writeSeq: 0, asOf: '', lastFull: 0, meta: null, metaVer: 0, unsaved: '', savedAt: ''
            };
            this.st = st;
            this.ctx = { ...this.ctx, kind: st.kind, ownerLocks: null };
            this.views = []; this.filterViewId = 0; this.layoutView = null; this.lastLayout = null;
            this.viewState = null;
            this.applyColumns(null);
            this.gridKeys = [this.monthId + '|' + t.code];
            this.livePaused = '';
            this.updateContextItems();
            this.loadTab(st, false);
            if (st.kind === 'wo') { this.loadViews(st); this.rebindAccess(); }
        } else {
            this.gridKeys = [];
            if (t.kind === 'legend') { this.legendDirty = true; }
        }
    }

    /** the tab being left: its queued edits still go out, its answers no longer touch the page */
    private retireTab(): void {
        clearTimeout(this.saveTimer);
        clearTimeout(this.layoutTimer);
        if (this.lastLayout && this.layoutTimer) { this.saveLayout(); }
        this.layoutTimer = null;
        if (this.st) { this.flush(this.st, true); }
        this.st = null;
        this.conflictDlg = null;
    }

    private stopTab(): void { this.retireTab(); this.tab = null; this.gridKeys = []; }

    get isGridTab(): boolean { return !!this.tab && (this.tab.kind === 'wo' || this.tab.kind === 'grid' || this.tab.kind === 'free'); }

    private applyColumns(layout: PersonalLayout | null): void {
        const st = this.st;
        if (!st) { return; }
        if (st.kind === 'wo') {
            this.columns = woColumns(st.tab, layout);
            this.frozenCols = layout && layout.frozenCols !== null ? layout.frozenCols : (st.tab.frozenCols ?? 1);
            this.gridFrozenRows = 0;
            this.gridMerges = this.noMerges;
        } else {
            this.columns = gridColumns(st.tab.code, st.meta);
            this.frozenCols = st.meta && st.meta.frozenCols !== undefined ? +st.meta.frozenCols || 0 : 0;
            this.canEditCell = () => true;
            const shape = gridShape(st.tab.code, st.meta);
            this.gridFrozenRows = shape.frozenRows;
            if (shape.merges.join('|') !== this.gridMerges.join('|')) { this.gridMerges = shape.merges.length ? shape.merges : this.noMerges; }
        }
    }

    // ---- load / poll --------------------------------------------------------------------------------

    private loadTab(st: TabState, refresh: boolean): void {
        if (!refresh) { st.loading = true; }
        st.error = '';
        const call = st.kind === 'wo' ? this._api.load(st.monthId, st.tab.code) : this._api.gridLoad(st.monthId, st.tab.code);
        const seq = st.writeSeq;
        if (refresh) { st.polling = true; }
        call.subscribe(r => {
            if (refresh) { st.polling = false; }
            if (st !== this.st) { return; }
            st.loading = false;
            if (!r.ok || statusOnly(r.ds)) {
                if (refresh) { this.pauseLive(st, r.text); } else { st.error = r.text || 'The tab could not be loaded.'; }
                return;
            }
            if (refresh && seq !== st.writeSeq) { return; } // a write came back meanwhile: the next refresh catches up
            const m = mergeServerRows(st.recs, this._api.rows(r.ds), st.kind === 'wo' ? this._api.rows(r.ds, 'Table1') : null, st.kind, true);
            if (m.removed.length) { st.queue = dropQueued(st.queue, m.removed); }
            st.recs = m.recs;
            st.asOf = asOfOf(r.ds) || st.asOf;
            st.lastFull = Date.now();
            if (st.kind === 'grid') {
                const meta = this._api.rows(r.ds, 'Table1')[0];
                st.meta = meta ? parseJson<TabMeta>(meta.META, null) : null;
                st.metaVer = meta ? +meta.ROWVER || 0 : 0;
                if (!refresh) { this.applyColumns(null); }
            }
            this.publish(st, true);
        });
    }

    private mayPoll(): boolean {
        const st = this.st;
        return !!st && !st.loading && !st.error && !st.inFlight && !st.polling && !!st.asOf && !this.livePaused && !this.destroyed;
    }

    /**
     * Changes / GridChanges since the last AS_OF. On WO tabs every few minutes a full Load instead: Changes does not
     * see Links-side changes of rows nobody touched in the sheet.
     */
    poll(): void {
        const st = this.st;
        if (!st || !this.mayPoll()) { return; }
        if (st.kind === 'wo' && Date.now() - st.lastFull > FULL_RELOAD_MS) { this.loadTab(st, true); return; }
        const seq = st.writeSeq;
        st.polling = true;
        const call = st.kind === 'wo' ? this._api.changes(st.monthId, st.tab.code, st.asOf) : this._api.gridChanges(st.monthId, st.tab.code, st.asOf);
        call.subscribe(r => {
            st.polling = false;
            if (st !== this.st) { return; }
            if (!r.ok || statusOnly(r.ds)) { this.pauseLive(st, r.text); return; }
            if (seq !== st.writeSeq) { return; } // stale against our own write: keep Since, ask again next time
            const m = mergeChanges(st.recs, r.ds, st.kind);
            if (m.removed.length) {
                const lost = m.removed.filter(id => Array.from(st.queue.values()).some(e => e.rowId === id));
                if (lost.length) { this._toast.toast('warning', 'Sheet view', 'A row you were editing was deleted by someone else; your change to it was dropped.'); }
                st.queue = dropQueued(st.queue, m.removed);
            }
            st.recs = m.recs;
            st.asOf = m.asOf || st.asOf;
            if (m.meta) {
                // someone changed the tab's shared layout (widths, hidden, frozen, merges)
                st.meta = parseJson<TabMeta>(m.meta.META, st.meta);
                st.metaVer = +m.meta.ROWVER || st.metaVer;
                this.applyColumns(null);
            }
            if (m.touched.length || m.removed.length) { this.publish(st, false); }
        });
    }

    /** after a failed call: no more polls / saves until Retry */
    private pauseLive(_st: TabState, text: string): void {
        this.livePaused = 'Live updates paused: ' + (text || 'the server did not answer') + '.';
    }

    resumeLive(): void {
        this.livePaused = '';
        const st = this.st;
        if (st && st.error) { this.loadTab(st, false); return; }
        if (st) { this.poll(); }
        if (st && st.unsaved) { st.unsaved = ''; this.scheduleSave(st, 0); }
    }

    /** records -> grid rows (unchanged records keep their row object, the grid re-renders only the others) */
    private rowCache = new WeakMap<SheetRec, SheetRow>();
    private publish(st: TabState, all: boolean): void {
        if (st !== this.st) { return; }
        if (all) { this.rowCache = new WeakMap(); }
        const ordered = orderRecs(st.recs);
        let linked = 0;
        st.rows = ordered.map(rec => {
            if (rec.srv.exptno) { linked++; }
            let row = this.rowCache.get(rec);
            if (!row) {
                row = toSheetRow(rec, this.ctx);
                this.rowCache.set(rec, row);
            }
            return row;
        });
        this.linkedCount = linked;
        this.tabCounts = { ...this.tabCounts, [st.tab.code]: st.rows.length };
        if (this.helperOpen && st.tab.helper) { this.helper = helperCombos(st.rows); }
        this.updateContextItems();
    }

    // ---- legend / access / views ---------------------------------------------------------------------

    private loadLegend(): void {
        this.legendDirty = false;
        this._api.legend().subscribe(r => {
            if (!r.ok) { this.notice('legend', 'warn', 'Row colours (Colour CODE) could not be loaded: ' + (r.text || 'no answer') + '.', ''); return; }
            this.dropNotice('legend');
            this.legend = legendFrom(this._api.rows(r.ds));
            this.statuses = this.legend.filter(l => l.active && l.code !== 'HAZ').map(l => ({ code: l.code, label: l.label, bg: l.bg, fg: l.fg }));
            this.ctx = { ...this.ctx, statusBy: new Map(this.legend.map(l => [l.code, l] as [string, LegendEntry])), hazFg: hazColour(this.legend) };
            if (this.st) { this.publish(this.st, true); }
        });
    }

    private loadAccess(): void {
        this.access = { state: 'loading', admin: this._api.isSa(), roles: new Set(), cols: null };
        this.rebindAccess();
        this._api.myRoles().subscribe(r => {
            if (!r.ok) {
                this.access = { state: 'failed', admin: this._api.isSa(), roles: new Set(), cols: null };
                if (!this.access.admin) { this.notice('access', 'warn', 'Your column access could not be loaded (' + (r.text || 'no answer') + '): cells stay locked.', 'access'); }
            } else {
                this.dropNotice('access');
                this.access = accessFrom(r.ds, this._api.isSa());
            }
            this.rebindAccess();
        });
    }

    retryAccess(): void { this.dropNotice('access'); this.loadAccess(); }

    /** a new canEditCell function makes the grid re-check its cells; the padlocks follow */
    private rebindAccess(): void {
        const acc = this.access, st = this.st;
        if (!st || st.kind !== 'wo') { return; }
        this.canEditCell = (_row: SheetRow, key: string) => ownerCheck(key, acc);
        const locks = this.canModify ? ownerLocks(woColumns(st.tab, null).map(c => c.key), acc) : null;
        this.ctx = { ...this.ctx, ownerLocks: locks };
        this.publish(st, true);
    }

    get roleNames(): string {
        if (this.access.admin) { return 'Admin - every column'; }
        const names = Array.from(this.access.roles).filter(r => r !== 'ALL');
        return names.length ? names.join(', ') : 'no sheet role yet';
    }

    private loadViews(st: TabState): void {
        this._api.views(st.tab.code).subscribe(r => {
            if (st !== this.st) { return; }
            if (!r.ok) { this.views = []; return; } // layouts are a convenience: the tab works without them
            this.views = this._api.rows(r.ds).filter((v: any) => v && v.ID !== undefined)
                .map((v: any) => ({ id: +v.ID, name: str(v.NAME).trim(), kind: str(v.KIND).trim().toLowerCase() === 'filter' ? 'filter' : 'layout',
                    monthId: v.MONTH_ID === null || v.MONTH_ID === undefined ? null : +v.MONTH_ID, data: v.DATA } as ViewRow))
                .filter((v: ViewRow) => v.monthId === null || v.monthId === st.monthId);
            this.layoutView = this.views.find(v => v.kind === 'layout' && v.monthId === st.monthId)
                || this.views.find(v => v.kind === 'layout') || null;
            const lay = this.layoutView ? layoutFrom(this.layoutView.data) : null;
            if (lay) { this.applyColumns(lay); }
        });
    }

    get filterViews(): ViewRow[] { return this.views.filter(v => v.kind === 'filter'); }

    pickFilterView(id: number): void {
        this.filterViewId = +id || 0;
        const v = this.views.find(x => x.id === this.filterViewId);
        const d = v ? parseJson<any>(v.data, {}) : {};
        this.viewState = { sort: d.sort || null, filters: d.filters && typeof d.filters === 'object' ? d.filters : {} };
    }

    transporterFirst(): void {
        // the workbook's Apps Script order: grouped by TRANSPORTER, sheet order inside a group
        this.filterViewId = 0;
        this.viewState = { sort: { key: 'TRANSPORTER', dir: 'asc' }, filters: this.lastLayout ? this.lastLayout.filters : {} };
    }

    onLayout(l: SheetLayout): void {
        this.lastLayout = l;
        const st = this.st;
        if (!st || l.reason === 'sort' || l.reason === 'filter') { return; }
        clearTimeout(this.layoutTimer);
        this.layoutTimer = setTimeout(() => this.saveLayout(), LAYOUT_SAVE_MS);
    }

    /** WO tabs: the user's own layout (Views). Grid tabs: the tab's layout for everyone (TABMETA), editors only. */
    private saveLayout(): void {
        this.layoutTimer = null;
        const st = this.st, l = this.lastLayout;
        if (!st || !l) { return; }
        if (st.kind === 'wo') {
            const data = JSON.stringify({ widths: l.widths, hidden: l.hidden, frozenCols: l.frozenCols });
            const v = this.layoutView;
            this._api.viewSave({ Id: v ? v.id : 0, MonthId: null, TabCode: st.tab.code, Name: LAYOUT_VIEW_NAME, Kind: 'layout', Data: data }).subscribe(r => {
                if (r.ok && st === this.st) {
                    const id = +(this._api.rows(r.ds)[0] || {}).ID || (v ? v.id : 0);
                    this.layoutView = { id, name: LAYOUT_VIEW_NAME, kind: 'layout', monthId: null, data };
                }
            });
            return;
        }
        if (!this.canModify) { return; }
        const shape = gridShape(st.tab.code, st.meta);
        const meta: TabMeta = { ...(st.meta || {}), widths: l.widths, hidden: l.hidden, frozenCols: l.frozenCols, frozenRows: shape.frozenRows, merges: shape.merges };
        this._api.tabMetaSave(st.monthId, st.tab.code, JSON.stringify(meta), st.metaVer).subscribe(r => {
            if (st !== this.st) { return; }
            const row = this._api.rows(r.ds)[0] || {};
            if (r.ok) { st.meta = meta; st.metaVer = +row.ROWVER || st.metaVer + 1; return; }
            if (r.status === '102') {
                st.metaVer = +row.ROWVER || st.metaVer;
                const m = this._api.rows(r.ds, 'Table1')[0];
                if (m) { st.meta = parseJson<TabMeta>(m.META, st.meta); }
                this._toast.toast('info', 'Sheet view', 'Someone else changed this tab\'s column layout meanwhile; yours was not saved.');
            }
        });
    }

    openSaveView(): void {
        const cur = this.views.find(v => v.id === this.filterViewId);
        this.saveViewDlg = { name: cur ? cur.name : '', busy: false, error: '' };
    }

    saveFilterView(): void {
        const d = this.saveViewDlg, st = this.st;
        if (!d || !st || d.busy) { return; }
        const name = str(d.name).trim().slice(0, 60);
        if (!name) { d.error = 'Give the view a name.'; return; }
        const l = this.lastLayout;
        const data = JSON.stringify({ sort: (l && l.sort) || (this.viewState && this.viewState.sort) || null, filters: (l && l.filters) || (this.viewState && this.viewState.filters) || {} });
        const same = this.filterViews.find(v => v.name.toUpperCase() === name.toUpperCase());
        d.busy = true; d.error = '';
        this._api.viewSave({ Id: same ? same.id : 0, MonthId: null, TabCode: st.tab.code, Name: name, Kind: 'filter', Data: data }).subscribe(r => {
            d.busy = false;
            if (!r.ok) { d.error = r.text || 'The view was not saved.'; return; }
            const id = +(this._api.rows(r.ds)[0] || {}).ID || 0;
            this.views = [...this.views.filter(v => v.id !== id && v !== same), { id, name, kind: 'filter', monthId: null, data }];
            this.filterViewId = id;
            this.saveViewDlg = null;
        });
    }

    deleteFilterView(): void {
        const v = this.views.find(x => x.id === this.filterViewId);
        if (!v) { return; }
        this._api.viewDelete(v.id).subscribe(r => {
            if (!r.ok) { this._toast.toast('error', 'Filter views', r.text || 'The view was not deleted.'); return; }
            this.views = this.views.filter(x => x.id !== v.id);
            this.filterViewId = 0;
        });
    }

    // ================================================================ grid intents

    onEdits(list: SheetEdit[]): void {
        const st = this.st;
        if (!st || !list || !list.length) { return; }
        if (!this.canModify) { return; }
        const recs: RecMap = new Map(st.recs);
        for (const e of list) {
            const id = +e.rowId, r = recs.get(id);
            if (r) { recs.set(id, { ...r, local: { ...r.local, [e.key]: str(e.newValue) } }); }
        }
        st.recs = recs;
        st.queue = enqueueEdits(st.queue, list, id => { const r = st.recs.get(id); return r ? r.srv.ver : 0; });
        this.publish(st, false);
        this.scheduleSave(st, SAVE_DEBOUNCE_MS);
    }

    private scheduleSave(st: TabState, ms: number): void {
        clearTimeout(this.saveTimer);
        this.saveTimer = setTimeout(() => this.flush(st, false), ms);
    }

    /** sends the queue (one batch at a time); retired = the tab was left, the answer only reports problems */
    private flush(st: TabState, retired: boolean): void {
        if (!st.queue.size || st.inFlight || (st.unsaved && !retired)) { return; }
        const { sent, edits } = batchOf(st.queue);
        st.queue = new Map();
        st.inFlight = true;
        st.writeSeq++;
        const call = st.kind === 'wo' ? this._api.saveCells(st.monthId, st.tab.code, edits) : this._api.gridSave(st.monthId, st.tab.code, edits);
        call.subscribe(r => {
            st.inFlight = false;
            st.writeSeq++;
            const live = st === this.st && !this.destroyed;
            const hasAnswer = !!(r.ds && (Array.isArray(r.ds.Table1) || Array.isArray(r.ds.Table2)));
            if (!r.ok && !hasAnswer) {
                if (r.status === '000' || !r.ds) {
                    // not reached: keep the user's values and the edits, wait for Retry
                    const back: EditQueue = new Map(st.queue);
                    sent.forEach(e => { if (!back.has(qkey(e.rowId, e.key))) { back.set(qkey(e.rowId, e.key), e); } });
                    st.queue = back;
                    st.unsaved = r.text || 'The server could not be reached.';
                    if (live) { this.pauseLive(st, st.unsaved); }
                    if (!live) { this._toast.toast('error', 'Sheet view', 'Your last changes on ' + st.tab.title + ' were not saved: ' + st.unsaved); }
                    return;
                }
                // refused as a whole (bad request, server error): roll the cells back
                const recs: RecMap = new Map(st.recs);
                sent.forEach(e => { const rec = recs.get(e.rowId); if (rec && rec.local[e.key] === e.value) { const l = { ...rec.local }; delete l[e.key]; recs.set(e.rowId, { ...rec, local: l }); } });
                st.recs = recs;
                this._toast.toast('error', 'Not saved', (r.text || 'The server refused the change') + ' - the cell' + (sent.length === 1 ? ' was' : 's were') + ' put back.');
                if (live) { this.publish(st, false); }
                return;
            }
            const out = applySaveResult(st.recs, sent, r.ds, st.kind);
            st.recs = out.recs;
            st.queue = rebaseQueue(dropQueued(st.queue, out.removed), sent, out.newVer, out.conflicted);
            st.unsaved = '';
            st.savedAt = new Date().toTimeString().slice(0, 5);
            if (out.refused.length) { this.toastRefused(st, out.refused); }
            if (live) {
                this.publish(st, false);
                if (out.conflicts.length) { this.openConflicts(st, out.conflicts); }
                if (st.queue.size) { this.scheduleSave(st, SAVE_DEBOUNCE_MS); }
            } else {
                if (out.conflicts.length) {
                    this._toast.toast('warning', 'Sheet view', out.conflicts.length + ' change(s) on ' + st.tab.title + ' were not saved: someone else changed those rows meanwhile.');
                }
                // edits typed on a tab that was left while its last batch was out
                if (st.queue.size) { this.flush(st, true); }
            }
        });
    }

    private toastRefused(st: TabState, refused: { rowId: number; key: string; reason: string }[]): void {
        const by = new Map<string, string[]>();
        refused.forEach(x => { const t = reasonText(x.reason); by.set(t, [...(by.get(t) || []), headerOf(x.key, st.tab.code)]); });
        const parts = Array.from(by.entries()).map(([why, cols]) => Array.from(new Set(cols)).join(', ') + ': ' + why);
        this._toast.toast('warning', 'Not saved - put back', parts.join(' · '));
    }

    private rowNo(st: TabState, id: number): number { return st.rows.findIndex(r => +r.id === id) + 1; }

    private openConflicts(st: TabState, list: Conflict[]): void {
        const items = list.map(c => ({ ...c, header: headerOf(c.key, st.tab.code), where: 'Row ' + (this.rowNo(st, c.rowId) || '?') }));
        const prev = this.conflictDlg ? this.conflictDlg.items.filter(p => !items.some(i => i.rowId === p.rowId && i.key === p.key)) : [];
        this.conflictDlg = { items: [...prev, ...items] };
    }

    resolveConflicts(choice: 'mine' | 'theirs'): void {
        const st = this.st, d = this.conflictDlg;
        this.conflictDlg = null;
        if (!st || !d) { return; }
        let recs = st.recs, queue = st.queue;
        for (const c of d.items) { const r = resolveConflict(recs, queue, c, choice); recs = r.recs; queue = r.queue; }
        st.recs = recs; st.queue = queue;
        this.publish(st, false);
        if (choice === 'mine') { this.scheduleSave(st, 0); }
    }

    onRowOp(op: SheetRowOp): void {
        const st = this.st;
        if (!st || !this.canModify) { return; }
        if ((op.op === 'insert' || op.op === 'duplicate') && !this.canAdd) {
            this._toast.toast('warning', 'Sheet view', 'Adding rows needs the Add right on Sheet view (form 448).');
            return;
        }
        const a = rowOpArgs(op);
        st.writeSeq++;
        const call = st.kind === 'wo' ? this._api.rowsOp(st.monthId, st.tab.code, a.op, a.ids, a.afterId, a.count)
            : this._api.gridRows(st.monthId, st.tab.code, a.op, a.ids, a.afterId, a.count);
        call.subscribe(r => {
            st.writeSeq++;
            if (st !== this.st) { return; }
            if (!r.ok) { this._toast.toast('error', 'Rows not changed', r.text || 'The server did not answer.'); return; }
            const m = mergeServerRows(st.recs, this._api.rows(r.ds, 'Table1'), st.kind === 'wo' ? this._api.rows(r.ds, 'Table2') : null, st.kind);
            if (m.removed.length) { st.queue = dropQueued(st.queue, m.removed); }
            st.recs = m.recs;
            this.publish(st, false);
        });
    }

    onFmt(ch: SheetFmtChange): void {
        const st = this.st;
        if (!st || !this.canModify) { return; }
        if (st.kind !== 'wo' && ch.kind === 'row') { return; } // no row status on grid tabs (no legend offered there)
        const before = st.recs;
        st.recs = applyFmtLocally(st.recs, ch);
        this.publish(st, false);
        st.writeSeq++;
        // SaveFormat: Table1 refused, Table2 rows, Table3 Links values; GridSaveFormat: Table1 refused, Table2 rows
        const call = st.kind === 'wo' ? this._api.saveFormat(st.monthId, st.tab.code, fmtEdits(ch)) : this._api.gridSaveFormat(st.monthId, st.tab.code, fmtEdits(ch));
        call.subscribe(r => {
            st.writeSeq++;
            if (st !== this.st) { return; }
            const rows = this._api.rows(r.ds, 'Table2');
            if (!r.ok && !rows.length) {
                // put the touched rows back as they were, keep everything else
                const recs: RecMap = new Map(st.recs);
                const ids = ch.kind === 'row' ? ch.rowIds.map(x => +x) : ch.cells.map(c => +c.rowId);
                ids.forEach(id => { const b = before.get(id); if (b) { recs.set(id, b); } });
                st.recs = recs;
                this._toast.toast('error', 'Colour not saved', r.text || 'The server did not answer.');
            } else {
                st.recs = mergeServerRows(st.recs, rows, st.kind === 'wo' ? this._api.rows(r.ds, 'Table3') : null, st.kind).recs;
                const refused = this._api.rows(r.ds, 'Table1');
                if (!r.ok || refused.length) {
                    this._toast.toast('warning', 'Colour partly saved', (r.text || 'Some cells were refused') + (refused.length ? ' (' + refused.length + ' cell' + (refused.length === 1 ? '' : 's') + ' put back)' : '') + '.');
                }
            }
            this.publish(st, false);
        });
    }

    private histTimer: any = null;
    onSelection(s: SheetSelectionInfo): void {
        this.selection = s;
        this.updateContextItems();
        // an open history panel follows the active row (after the cursor settles)
        clearTimeout(this.histTimer);
        if (this.history && s.active && +s.active.rowId !== this.history.rowId) {
            const id = +s.active.rowId;
            this.histTimer = setTimeout(() => { if (this.history) { this.openHistory(id); } }, 400);
        }
    }

    private selectedRecs(ids?: (string | number)[]): SheetRec[] {
        const st = this.st;
        if (!st) { return []; }
        return (ids || this.selection.rowIds).map(id => st.recs.get(+id)).filter((r): r is SheetRec => !!r);
    }

    private ctxSig = '';
    selUnlinked = 0;
    selLinked = 0;
    /** row-menu items; a new array only when what they offer changes */
    private updateContextItems(): void {
        const st = this.st;
        const recs = this.selectedRecs();
        const unlinked = recs.filter(r => !r.srv.exptno).length, linked = recs.length - unlinked;
        this.selUnlinked = unlinked;
        this.selLinked = linked;
        const wo = !!st && st.kind === 'wo';
        const sig = [wo, this.canConvert, unlinked > 0, linked > 0].join('|');
        if (sig === this.ctxSig) { return; }
        this.ctxSig = sig;
        const items: SheetContextItem[] = [];
        if (wo && this.canConvert) {
            items.push({ action: 'convert', label: 'Convert to job…', divider: true, disabled: !unlinked });
            items.push({ action: 'link', label: 'Link to existing job…' });
            items.push({ action: 'unlink', label: 'Unlink from job', disabled: !linked });
        }
        items.push({ action: 'history', label: 'Show cell history', single: true, divider: !(wo && this.canConvert) });
        this.contextItems = items;
    }

    onContext(a: SheetContextAction): void {
        const ids = (a.rowIds || []).map(x => +x).filter(x => x > 0);
        switch (a.action) {
            case 'convert': this.startConvert(ids); break;
            case 'link': this.startLink(ids); break;
            case 'unlink': this.startUnlink(ids); break;
            case 'history': if (ids.length) { this.openHistory(ids[0]); } break;
        }
    }

    get selCount(): number { return this.selection.rowIds.length; }
    get busySaving(): boolean { return !!this.st && (this.st.inFlight || this.st.queue.size > 0); }

    toolbarConvert(): void { this.startConvert(this.selection.rowIds.map(x => +x)); }
    toolbarLink(): void { this.startLink(this.selection.rowIds.map(x => +x)); }
    toolbarUnlink(): void { this.startUnlink(this.selection.rowIds.map(x => +x)); }
    toolbarHistory(): void { const a = this.selection.active; if (a) { this.openHistory(+a.rowId); } }

    exportExcel(): void {
        if (this.grid) { this.grid.exportExcel((this.month ? this.month.title || monthLabel(this.month.month) : 'Sheet') + ' - ' + (this.tab ? this.tab.title : '')); }
    }

    // ================================================================ Convert / Link / Unlink

    private startConvert(ids: number[]): void {
        const st = this.st;
        if (!st || st.kind !== 'wo' || !this.canConvert) { return; }
        if (this.busySaving) { this._toast.toast('info', 'Convert to job', 'Your last changes are still being saved - try again in a moment.'); return; }
        const picked = this.selectedRecs(ids).filter(r => !r.srv.exptno);
        if (!picked.length) { this._toast.toast('info', 'Convert to job', 'The selected rows are already linked to a job.'); return; }
        const wos = Array.from(new Set(picked.map(r => str(r.srv.values['WO']).trim().toUpperCase())));
        if (wos.length > 1) { this._toast.toast('warning', 'Convert to job', 'Pick the rows of one WO: one WO becomes one Links job.'); return; }
        const all = orderRecs(st.recs);
        const rows = rowsForWo(all.map(convertRow), picked.map(convertRow));
        const recs = rows.map((x: any) => st.recs.get(+x.ID)).filter((r: any): r is SheetRec => !!r);
        this.convertDlg = { rows: recs, wo: str(picked[0].srv.values['WO']).trim(), busy: false, error: '' };
    }

    rowLabel(rec: SheetRec): string {
        const st = this.st;
        const v = rec.srv.values;
        return 'Row ' + (st ? this.rowNo(st, rec.srv.id) : '?') + ' · ' + [str(v['VEH']).replace(/\s+/g, ' ').trim(), v['QTY'] ? 'Qty ' + v['QTY'] : '', v['CONT'] ? v['CONT'] + ' cont.' : '', str(v['CNTR_TYPE'])].filter(Boolean).join(' · ');
    }

    confirmConvert(): void {
        const d = this.convertDlg, st = this.st;
        if (!d || !st || d.busy) { return; }
        const ids = d.rows.map(r => r.srv.id);
        d.busy = true; d.error = '';
        this._api.convertDraft(ids).subscribe(r => {
            d.busy = false;
            if (!r.ok || statusOnly(r.ds)) { d.error = 'The rows could not be prepared for the form: ' + (r.text || 'no answer') + '.'; return; }
            const draft = this._api.rows(r.ds).filter((x: any) => x && x.ID !== undefined);
            const aliases = this._api.rows(r.ds, 'Table1') as ConvertAlias[];
            // voyages whose ETD matches the row first (buildPrefill picks the first match)
            const vessels = (this._api.rows(r.ds, 'Table2') as any[]).slice().sort((a, b) => (+b.ETD_MATCH || 0) - (+a.ETD_MATCH || 0)) as ConvertVessel[];
            const returnUrl = '/export/sheet?month=' + st.monthId + '&tab=' + encodeURIComponent(st.tab.code);
            const payload = buildPrefill(draft.length ? draft : d.rows.map(convertRow), aliases, vessels, { monthId: st.monthId, tabCode: st.tab.code, returnUrl });
            // the admin chooses these on every convert (decision 2026-10-21)
            payload.start.stuffingMode = null;
            delete payload.main.services;
            this._prefill.set(payload as unknown as ConsignmentPrefill);
            this.convertDlg = null;
            this._router.navigateByUrl('/export/Consignment/start');
        });
    }

    private startLink(ids: number[]): void {
        if (!this.canConvert || !ids.length) { return; }
        const recs = this.selectedRecs(ids);
        this.linkDlg = { rowIds: recs.map(r => r.srv.id), exptno: '', relink: recs.filter(r => !!r.srv.exptno).length, busy: false, error: '' };
    }

    confirmLink(): void {
        const d = this.linkDlg, st = this.st;
        if (!d || !st || d.busy) { return; }
        const no = str(d.exptno).trim();
        if (!no) { d.error = 'Type the export no. of the job.'; return; }
        if (no.length > 25) { d.error = 'An export no. has at most 25 characters.'; return; }
        d.busy = true; d.error = '';
        st.writeSeq++;
        this._api.link(d.rowIds, no).subscribe(r => {
            st.writeSeq++;
            d.busy = false;
            if (!r.ok) { d.error = r.text || 'The rows were not linked.'; return; }
            this.linkDlg = null;
            this.mergeJobAnswer(st, r);
            this._toast.toast('success', 'Link to job', d.rowIds.length + ' row' + (d.rowIds.length === 1 ? '' : 's') + ' linked to ' + no + '.');
        });
    }

    private startUnlink(ids: number[]): void {
        if (!this.canConvert) { return; }
        const recs = this.selectedRecs(ids).filter(r => !!r.srv.exptno);
        if (!recs.length) { this._toast.toast('info', 'Unlink', 'The selected rows are not linked to a job.'); return; }
        this.unlinkDlg = { rowIds: recs.map(r => r.srv.id), jobs: Array.from(new Set(recs.map(r => r.srv.exptno))).join(', '), busy: false };
    }

    confirmUnlink(): void {
        const d = this.unlinkDlg, st = this.st;
        if (!d || !st || d.busy) { return; }
        d.busy = true;
        st.writeSeq++;
        this._api.unlink(d.rowIds).subscribe(r => {
            st.writeSeq++;
            d.busy = false;
            if (!r.ok) { this._toast.toast('error', 'Unlink', r.text || 'The rows were not unlinked.'); return; }
            this.unlinkDlg = null;
            this.mergeJobAnswer(st, r);
        });
    }

    /** Link / Unlink answer: Table1 rows, Table2 Links values */
    private mergeJobAnswer(st: TabState, r: SheetResult): void {
        if (st !== this.st) { return; }
        st.recs = mergeServerRows(st.recs, this._api.rows(r.ds, 'Table1'), this._api.rows(r.ds, 'Table2'), 'wo').recs;
        this.publish(st, false);
    }

    // ================================================================ history

    /** HISTORY rows for a panel; settings / month entries ('M') get their label from the log key */
    private historyRows(ds: any, tabCode: string, restorable: boolean): HistoryRow[] {
        const title = (c: string) => { const t = this.tabs.find(x => x.code === c); return t ? t.title : c; };
        return this._api.rows(ds).filter((x: any) => x && x.ID !== undefined).map((x: any) => ({
            id: +x.ID, at: dateTimeText(x.LOG_DT), who: str(x.USER_NAME).trim() || str(x.USER_ID).trim(), action: str(x.ACTION).trim(),
            col: str(x.ROW_KIND).trim().toUpperCase() === 'M' ? settingsLogLabel(x.COL_KEY, title) : (x.COL_KEY ? headerOf(x.COL_KEY, tabCode) : ''),
            oldV: str(x.OLD_VALUE), newV: str(x.NEW_VALUE), canRestore: restorable && +x.CAN_RESTORE === 1
        }));
    }

    openSettings(): void {
        this.settingsOpen = !this.settingsOpen;
        if (this.settingsOpen && this.settingsView === 'history') { this.loadSettingsHistory(this.setHist ? this.setHist.scope : 'settings'); }
    }

    showSettingsView(v: 'alias' | 'history'): void {
        this.settingsView = v;
        if (v === 'history') { this.loadSettingsHistory(this.setHist ? this.setHist.scope : 'settings'); }
    }

    /** History('M', 0) = Colour CODE, Column Access, aliases; History('M', month id) = the month (title, tabs, column layouts) */
    loadSettingsHistory(scope: 'settings' | 'month'): void {
        const h = { scope, loading: true, error: '', rows: [] as HistoryRow[] };
        this.setHist = h;
        this._api.history('M', scope === 'settings' ? 0 : this.monthId).subscribe(r => {
            if (this.setHist !== h) { return; }
            h.loading = false;
            if (!r.ok || statusOnly(r.ds)) { h.error = 'The history could not be loaded: ' + (r.text || 'no answer') + '.'; return; }
            h.rows = this.historyRows(r.ds, '', this.canSettings || this.canModify);
        });
    }

    restoreSetting(h: HistoryRow): void {
        if (!h.canRestore || !this.setHist) { return; }
        const scope = this.setHist.scope;
        this._api.restoreValue(h.id).subscribe(r => {
            const rej = this._api.rows(r.ds, 'Table1');
            if (!r.ok && !this._api.rows(r.ds, 'Table2').length) { this._toast.toast('error', 'Restore', r.text || 'The value was not restored.'); }
            else if (rej.length) { this._toast.toast('warning', 'Not restored', reasonText(rej[0].REASON)); }
            else { this._toast.toast('success', 'Restore', h.col + ' set back to "' + (h.oldV || '(empty)') + '".'); }
            if (scope === 'settings') { this.loadLegend(); }
            this.loadSettingsHistory(scope);
        });
    }

    openHistory(rowId: number): void {
        const st = this.st;
        if (!st || !rowId) { return; }
        const title = 'Row ' + (this.rowNo(st, rowId) || '?') + (st.kind === 'wo' && st.recs.get(rowId) ? ' · WO ' + (str(st.recs.get(rowId)!.srv.values['WO']).trim() || '-') : '');
        const h = { rowId, title, loading: true, error: '', rows: [] as HistoryRow[] };
        this.history = h;
        this._api.history(st.kind === 'wo' ? 'W' : 'G', rowId).subscribe(r => {
            if (this.history !== h) { return; }
            h.loading = false;
            if (!r.ok || statusOnly(r.ds)) { h.error = 'History could not be loaded: ' + (r.text || 'no answer') + '.'; return; }
            h.rows = this.historyRows(r.ds, st.tab.code, st.kind === 'wo');
        });
    }

    restore(h: HistoryRow): void {
        const st = this.st;
        if (!st || !this.canModify || !this.history) { return; }
        const rowId = this.history.rowId;
        st.writeSeq++;
        this._api.restoreValue(h.id).subscribe(r => {
            st.writeSeq++;
            if (st !== this.st) { return; }
            if (!r.ok && !this._api.rows(r.ds, 'Table2').length) { this._toast.toast('error', 'Restore', r.text || 'The value was not restored.'); return; }
            st.recs = mergeServerRows(st.recs, this._api.rows(r.ds, 'Table2'), this._api.rows(r.ds, 'Table3'), 'wo').recs;
            const rej = this._api.rows(r.ds, 'Table1');
            if (rej.length) { this._toast.toast('warning', 'Not restored', reasonText(rej[0].REASON)); } else { this._toast.toast('success', 'Restore', h.col + ' set back to "' + (h.oldV || '(empty)') + '".'); }
            this.publish(st, false);
            this.openHistory(rowId);
        });
    }

    // ================================================================ panels / notices

    toggleHelper(): void {
        this.helperOpen = !this.helperOpen;
        if (this.helperOpen && this.st) { this.helper = helperCombos(this.st.rows); }
    }

    private notice(id: string, kind: 'warn' | 'info', text: string, action: string): void {
        this.notices = [...this.notices.filter(n => n.id !== id), { id, kind, text, action: action || undefined }];
    }

    dropNotice(id: string): void { this.notices = this.notices.filter(n => n.id !== id); }

    noticeAction(n: Notice): void {
        if (n.action === 'access') { this.retryAccess(); }
    }

    get liveText(): string {
        const st = this.st;
        if (!st) { return ''; }
        if (st.unsaved) { return 'Not saved yet - your changes are kept on this page'; }
        if (st.inFlight || st.queue.size) { return 'Saving…'; }
        const saved = st.savedAt ? 'saved ' + st.savedAt : 'all changes saved';
        return 'Live · ' + saved;
    }
}
