import {
    ChangeDetectionStrategy, ChangeDetectorRef, Component, DoCheck, ElementRef, EventEmitter, HostListener, Input,
    NgZone, OnChanges, OnDestroy, AfterViewInit, Output, SimpleChanges, ViewChild, ViewEncapsulation
} from '@angular/core';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';

import {
    CellFmt, SheetCanEdit, SheetCellKind, SheetColumn, SheetContextAction, SheetContextItem, SheetEdit,
    SheetFilter, SheetFilterOp, SheetFmtChange, SheetLayout, SheetRow, SheetRowId, SheetRowOp, SheetSelectionInfo,
    SheetSort, SheetStatus, SheetViewState
} from './sheet-grid.types';
import { parseTsv, toHtmlTable, toTsv } from './sheet-tsv';
import { isCanonicalDate, normaliseDateOrNote, parseDateText, formatParts, todayText } from './sheet-date';
import { fillSeries } from './sheet-fill';
import { SheetUndoStack, UndoEntry } from './sheet-undo';
import {
    CellPos, CellRange, FillDir, clamp, edgeJump, fillTarget, inRange, isSingleCell, moveWithin, pasteSize,
    rangeCells, rangeOf, rangeRows
} from './sheet-selection';
import { compileFilters, distinctValues, isFilterActive, selectionStats, SelectionStats, sortRows } from './sheet-sort';
import { exportSheetToExcel } from './sheet-excel';

/*  <app-sheet-grid> - generic spreadsheet grid (SHEET_VIEW_SPEC.md section 3, CONTRACT section 6).

    Rendering
    - one scroller (cdkVirtualScrollingElement) holds a sticky header and a CDK virtual viewport;
      rows have a fixed height, only the rendered range (+ buffer) is in the DOM
    - horizontally only the frozen columns plus the columns inside the visible window (+ buffer)
      are rendered; frozen cells are position:sticky, the others absolutely placed at their x
    - selection, active cell, fill handle, copy marquee and the editor are drawn in two overlay
      layers projected into the viewport (a sticky one over the frozen columns, a plain one over
      the rest), so a cell never re-renders because the selection moved
    - all keyboard input goes through one hidden textarea ("sink") that also receives the
      copy / cut / paste events; typing into it opens the editor with the typed text
    The grid never changes data: it emits edits / rowOp / fmtChange / contextAction and the
    parent feeds updated rows back (keyed by id).                                              */

const ROW_H = 24;
const HEAD_H = 34;
const GUTTER_W = 46;
const DEFAULT_W = 100;
const MIN_W = 30;
const MAX_FIT_W = 480;
const H_BUFFER = 360;
const NOTICE_MS = 4500;
/** how long an insert waits for the parent's new rows */
const PENDING_MS = 30000;
/** placeholder kept selected in the focus textarea (zero-width space) */
const SINK_MARK = String.fromCharCode(0x200B);

const EMPTY: { [k: string]: any } = Object.freeze({}) as any;

/** one SheetEdit; `ver` only when the row carries one */
function mkEdit(rowId: SheetRowId, key: string, oldValue: string, newValue: string, ver: number | undefined): SheetEdit {
    const e: SheetEdit = { rowId, key, oldValue, newValue };
    if (ver !== undefined && ver !== null) {
        e.ver = ver;
    }
    return e;
}

interface GCol {
    key: string;
    header: string;
    kind: SheetCellKind;
    w: number;
    x: number;
    i: number;
    frozen: boolean;
    right: boolean;
    center: boolean;
    src: SheetColumn;
    /** hidden columns right before this one / after it (last column only) */
    hb: string[] | null;
    ha: string[] | null;
}

export interface SheetRowVM {
    row: SheetRow;
    id: SheetRowId;
    v: { [k: string]: string };
    f: { [k: string]: CellFmt };
    lk: { [k: string]: string };
    tg: { [k: string]: string };
    tt: { [k: string]: string };
    bg: string | null;
    fg: string | null;
    /** row number shown in the gutter (position in `rows`, 1-based) */
    n: number;
    cv: number;
}

interface Rect { x: number; y: number; w: number; h: number; }

/** overlay content of one pane: top (frozen rows) / body x frozen / scrolling columns */
interface PaneGeo {
    /** subtracted from merge y (body panes: the CDK rendered-content offset) */
    off: number;
    merges: MergePart[];
    gut: Rect | null;
    sel: Rect | null;
    selCls: string;
    act: Rect | null;
    actCls: string;
    mark: Rect | null;
    markCls: string;
    fill: Rect | null;
    fillCls: string;
    hdl: { x: number; y: number } | null;
    ed: Rect | null;
}

type PaneKey = 'tf' | 'ts' | 'bf' | 'bs';

/** one drawn piece of a merged cell (a merge across panes is drawn in several pieces) */
interface MergePart {
    k: string;
    x: number;
    y: number;
    w: number;
    h: number;
    text: string;
    bg: string | null;
    fg: string | null;
    bold: boolean;
    right: boolean;
    center: boolean;
    multi: boolean;
    tip: string | null;
}

function emptyPane(): PaneGeo {
    return {
        off: 0, merges: [], gut: null, sel: null, selCls: '', act: null, actCls: '', mark: null, markCls: '',
        fill: null, fillCls: '', hdl: null, ed: null
    };
}

/** 'A1:G1' -> zero-based inclusive range over (columns order, rows order); null when invalid */
export function parseA1Range(a1: string): CellRange | null {
    const m = String(a1 || '').trim().toUpperCase().match(/^([A-Z]{1,3})(\d+)(?::([A-Z]{1,3})(\d+))?$/);
    if (!m) {
        return null;
    }
    const col = (l: string) => l.split('').reduce((n, ch) => n * 26 + (ch.charCodeAt(0) - 64), 0) - 1;
    const c0 = col(m[1]);
    const r0 = parseInt(m[2], 10) - 1;
    const c1 = m[3] ? col(m[3]) : c0;
    const r1 = m[4] ? parseInt(m[4], 10) - 1 : r0;
    if (r0 < 0 || r1 < 0) {
        return null;
    }
    return rangeOf({ r: r0, c: c0 }, { r: r1, c: c1 });
}

interface EditState {
    r: number;
    c: number;
    rowId: SheetRowId;
    key: string;
    kind: SheetCellKind;
    frozen: boolean;
    mode: 'enter' | 'edit';
    initial: string;
    header: string;
    /** the cell value and row version when the editor opened (conflict detection) */
    startValue: string;
    ver: number | undefined;
}

/** a rowOp insert waiting for the parent's new rows (to select them / to finish a paste) */
interface Pending {
    kind: 'paste' | 'select';
    afterId: SheetRowId | null;
    count: number;
    expires: number;
    /** paste: values for the new rows (row-major) starting at column c0 */
    values?: string[][];
    c0?: number;
    r0?: number;
    /** paste: the undo step of the first part of the paste */
    entry?: UndoEntry | null;
    col?: number;
}

type DragMode = 'cells' | 'rows' | 'cols' | 'fill';
type Move = 'down' | 'up' | 'right' | 'left' | 'none';

const TAG_TIP: { [k: string]: string } = {
    links: 'From Links',
    pending: 'Not in Links yet',
    flag: 'Flagged',
    note: 'Not a date - kept as typed'
};

const COND_OPS: { op: SheetFilterOp | ''; label: string; arg: boolean }[] = [
    { op: '', label: 'None', arg: false },
    { op: 'empty', label: 'Is empty', arg: false },
    { op: 'notEmpty', label: 'Is not empty', arg: false },
    { op: 'contains', label: 'Text contains', arg: true },
    { op: 'notContains', label: 'Text does not contain', arg: true },
    { op: 'startsWith', label: 'Text starts with', arg: true },
    { op: 'endsWith', label: 'Text ends with', arg: true },
    { op: 'equals', label: 'Text is exactly', arg: true },
    { op: 'dateIs', label: 'Date is', arg: true },
    { op: 'dateBefore', label: 'Date is before', arg: true },
    { op: 'dateAfter', label: 'Date is after', arg: true },
    { op: 'gt', label: 'Greater than', arg: true },
    { op: 'lt', label: 'Less than', arg: true },
    { op: 'eqNum', label: 'Is equal to', arg: true }
];

const TEXT_COLOURS = ['#0A0A0A', '#6B6B6B', '#C62828', '#EF6C00', '#2E7D32', '#1565C0', '#6A1B9A'];
const FILL_COLOURS = ['#EFEFEF', '#FFF2CC', '#FCE5CD', '#F4CCCC', '#EAD1DC', '#D9D2E9', '#CFE2F3', '#D9EAD3', '#FFFF00', '#00FFFF'];

@Component({
    selector: 'app-sheet-grid',
    templateUrl: './sheet-grid.component.html',
    styleUrls: ['./sheet-grid.component.css'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false,
    host: { class: 'sg-host', '[class.sg-ro]': 'readOnly', '[class.sg-editing]': '!!editing' }
})
export class SheetGridComponent implements OnChanges, DoCheck, AfterViewInit, OnDestroy {

    /* ------------------------------------------------------------------ inputs */
    @Input() columns: SheetColumn[] = [];
    @Input() rows: SheetRow[] = [];
    /** leading visible columns kept in view (null: the columns flagged `frozen`) */
    @Input() frozenCols: number | null = null;
    /** first rows of `rows` pinned under the header; they stay on top, outside sort and filter */
    @Input() frozenRows = 0;
    /**
     * merged cells in A1 notation, columns = the `columns` order, row 1 = the first of `rows`
     * (e.g. 'A1:G1'). A merge is drawn only while all its columns are visible and, unless it lies
     * within the frozen rows, while no sort / filter is on; the definition itself is kept.
     */
    @Input() merges: string[] = [];
    @Input() readOnly = false;
    @Input() canEditCell: SheetCanEdit | null = null;
    /** row colour legend offered in the row menu */
    @Input() statuses: SheetStatus[] = [];
    /** extra row-menu items passed through as contextAction (e.g. Convert to job) */
    @Input() contextItems: SheetContextItem[] = [];
    /** sort / filters to apply (e.g. a saved filter view) */
    @Input() viewState: SheetViewState | null = null;
    /** Excel file / sheet name */
    @Input() exportName = 'Sheet';
    @Input() showToolbar = true;
    /** tooltip per corner mark ('links', 'pending', 'flag', 'note' = date column holding a note) */
    @Input() tagLabels: { [tag: string]: string } = TAG_TIP;

    /* ----------------------------------------------------------------- outputs */
    @Output() edits = new EventEmitter<SheetEdit[]>();
    @Output() rowOp = new EventEmitter<SheetRowOp>();
    @Output() fmtChange = new EventEmitter<SheetFmtChange>();
    @Output() contextAction = new EventEmitter<SheetContextAction>();
    @Output() layoutChange = new EventEmitter<SheetLayout>();
    @Output() selectionChange = new EventEmitter<SheetSelectionInfo>();

    @ViewChild('scroller', { static: true }) scrollerRef!: ElementRef<HTMLDivElement>;
    @ViewChild('sink', { static: true }) sinkRef!: ElementRef<HTMLTextAreaElement>;
    @ViewChild(CdkVirtualScrollViewport, { static: true }) vp!: CdkVirtualScrollViewport;
    @ViewChild('guide', { static: true }) guideRef!: ElementRef<HTMLDivElement>;

    @ViewChild('ed') set edRef(r: ElementRef<HTMLTextAreaElement> | undefined) {
        const el = r ? r.nativeElement : null;
        if (el === this.edEl) {
            return;
        }
        this.detachEditor();
        this.edEl = el;
        if (el && this.editing) {
            this.attachEditor(el);
        }
    }

    readonly rowH = ROW_H;
    readonly headH = HEAD_H;
    readonly gutterW = GUTTER_W;
    readonly condOps = COND_OPS;
    readonly textColours = TEXT_COLOURS;
    readonly fillColours = FILL_COLOURS;

    /* ------------------------------------------------------------------ state */
    cols: GCol[] = [];
    fcols: GCol[] = [];
    scols: GCol[] = [];
    nF = 0;
    frozenW = GUTTER_W;
    totalW = GUTTER_W;
    view: SheetRowVM[] = [];
    /** frozen rows (view 0 .. nFR-1) and the virtual-scrolled rest */
    topView: SheetRowVM[] = [];
    bodyView: SheetRowVM[] = [];
    nFR = 0;
    /** column key -> reason, when every row locks that column for the same reason (header lock) */
    colLock: { [key: string]: string } = {};

    sel: CellRange = { r0: 0, c0: 0, r1: 0, c1: 0 };
    active: CellPos = { r: 0, c: 0 };
    private anchor: CellPos = { r: 0, c: 0 };
    private ext: CellPos = { r: 0, c: 0 };
    selMode: 'cells' | 'rows' | 'cols' = 'cells';
    private selKeys: { a: [SheetRowId | null, string]; e: [SheetRowId | null, string]; p: [SheetRowId | null, string] } | null = null;

    editing: EditState | null = null;
    edList: string[] = [];
    edListIdx = -1;
    edListOpen = false;
    edPreview = '';
    edListUp = false;

    sort: SheetSort | null = null;
    filters: { [key: string]: SheetFilter } = {};
    private widths: { [key: string]: number } = {};
    private hidden = new Set<string>();
    private seenKeys = new Set<string>();
    frozen = 0;

    notice: string | null = null;
    noticeLock = false;
    /** rows added by the "Add N more rows at the bottom" footer */
    addN = 1;
    /** open the row-menu submenus to the left (menu close to the right edge) */
    cmSubLeft = false;
    /** open the row-menu submenus upwards (menu in the lower part of the window) */
    cmSubUp = false;
    stats: SelectionStats | null = null;

    // menus
    hm: {
        col: GCol; x: number; y: number; values: { value: string; count: number; on: boolean }[];
        search: string; op: SheetFilterOp | ''; arg: string; more: number;
    } | null = null;
    cm: { x: number; y: number; rowIds: SheetRowId[]; sub: 'status' | 'fmt' | null; canMove: boolean } | null = null;
    confirmDel: { rowIds: SheetRowId[] } | null = null;

    // find
    findOpen = false;
    findQ = '';
    findHits: CellPos[] = [];
    findIdx = -1;

    // overlays: 4 persistent panes, their geometry recomputed on every check (a few numbers)
    readonly panes: { tf: PaneGeo; ts: PaneGeo; bf: PaneGeo; bs: PaneGeo } =
        { tf: emptyPane(), ts: emptyPane(), bf: emptyPane(), bs: emptyPane() };

    // merges: parsed definitions, the ones drawn now (view coordinates) and the cells they cover
    private mergeDefs: CellRange[] = [];
    private mActive: CellRange[] = [];
    private mCover = new Map<number, number>();

    fillPrev: { range: CellRange; dir: FillDir } | null = null;
    private mark: { ids: SheetRowId[]; keys: string[]; text: string; cut: boolean } | null = null;

    private undoStack = new SheetUndoStack(200);
    private rowById = new Map<SheetRowId, SheetRow>();
    private vmById = new Map<SheetRowId, SheetRowVM>();
    private viewIndex = new Map<SheetRowId, number>();
    private modelIndex = new Map<SheetRowId, number>();
    private vmCache = new WeakMap<SheetRow, SheetRowVM>();
    private colsVer = 1;
    private dateKeys: string[] = [];
    private prevIds = new Set<SheetRowId>();
    private pendings: Pending[] = [];
    /** last `columns` input value of width / hidden per key (an input change wins over the user's change) */
    private colInput = new Map<string, { w: number | undefined; h: boolean | undefined }>();
    private tabStart: number | null = null;
    private followActive = false;

    private edEl: HTMLTextAreaElement | null = null;
    private edCleanup: (() => void) | null = null;
    private keepEditOnBlur = false;
    private noticeTimer: any = null;
    private statsTimer: any = null;
    private findTimer: any = null;
    private ro: ResizeObserver | null = null;
    private winL = -1;
    private winR = -1;
    private destroyed = false;
    private dragCleanup: (() => void) | null = null;
    private measureCtx: CanvasRenderingContext2D | null = null;
    /** last emitted selection info, to emit only on change */
    private lastSelSig = '';

    constructor(private zone: NgZone, private cdr: ChangeDetectorRef, private host: ElementRef<HTMLElement>) { }

    /** a click anywhere outside an open menu closes it (the column-menu button toggles on its own) */
    @HostListener('document:mousedown', ['$event'])
    onDocDown(e: MouseEvent): void {
        if (!this.cm && !this.hm) {
            return;
        }
        const t = e.target as HTMLElement | null;
        if (t && t.closest && t.closest('.sg-menu, .sg-hb')) {
            return;
        }
        this.closeMenus();
    }

    /* ================================================================ lifecycle */

    ngOnChanges(ch: SimpleChanges): void {
        this.saveSelKeys();
        let colsChanged = false;
        if (ch['frozenCols'] && this.frozenCols !== null && this.frozenCols !== undefined) {
            this.frozen = Math.max(0, this.frozenCols | 0);
            colsChanged = true;
        }
        if (ch['columns']) {
            this.initColumns();
            colsChanged = true;
        }
        if (ch['viewState'] && !(ch['viewState'].firstChange && !this.viewState)) {
            // a saved view applied (or reset with null)
            this.sort = (this.viewState && this.viewState.sort) || null;
            this.filters = { ...((this.viewState && this.viewState.filters) || {}) };
        }
        if (colsChanged) {
            this.buildCols();
        }
        if (ch['tagLabels'] && !ch['tagLabels'].firstChange) {
            this.colsVer++; // tooltips are part of the cached row models
        }
        if (ch['merges']) {
            this.mergeDefs = (this.merges || []).map(parseA1Range).filter(x => !!x) as CellRange[];
        }
        if (ch['rows'] || ch['columns'] || ch['viewState'] || ch['tagLabels'] || ch['frozenRows']) {
            const full = !!(ch['viewState'] || ch['columns'] || ch['frozenRows'] || (ch['rows'] && ch['rows'].firstChange));
            this.rebuildView(full, true);
        } else if (colsChanged || ch['merges']) {
            this.buildMerges();
            this.remapSelection();
        }
    }

    ngDoCheck(): void {
        this.computeGeo();
    }

    ngAfterViewInit(): void {
        const sc = this.scrollerRef.nativeElement;
        this.zone.runOutsideAngular(() => {
            sc.addEventListener('scroll', this.onScroll, { passive: true });
            if (typeof ResizeObserver !== 'undefined') {
                this.ro = new ResizeObserver(() => {
                    // the grid can change size without a window resize (side panels): re-measure both axes
                    this.vp.checkViewportSize();
                    this.updateWindow(true);
                });
                this.ro.observe(sc);
            }
        });
        Promise.resolve().then(() => this.updateWindow(true));
    }

    ngOnDestroy(): void {
        this.destroyed = true;
        const sc = this.scrollerRef && this.scrollerRef.nativeElement;
        if (sc) {
            sc.removeEventListener('scroll', this.onScroll);
        }
        if (this.ro) {
            this.ro.disconnect();
        }
        this.detachEditor();
        if (this.dragCleanup) {
            this.dragCleanup();
        }
        clearTimeout(this.noticeTimer);
        clearTimeout(this.statsTimer);
        clearTimeout(this.findTimer);
    }

    /* ================================================================ public API */

    focus(): void {
        this.focusSink();
    }

    undo(): void {
        this.doUndo(false);
    }

    redo(): void {
        this.doUndo(true);
    }

    get canUndo(): boolean {
        return this.undoStack.canUndo && !this.readOnly;
    }

    get canRedo(): boolean {
        return this.undoStack.canRedo && !this.readOnly;
    }

    /** Selects one cell and scrolls it into view. */
    selectCell(rowId: SheetRowId, key: string): boolean {
        const r = this.viewIndex.get(rowId);
        const c = this.cols.findIndex(x => x.key === key);
        if (r === undefined || c < 0) {
            return false;
        }
        this.setSel({ r, c }, { r, c }, { r, c }, 'cells', true);
        return true;
    }

    scrollToRow(rowId: SheetRowId): void {
        const r = this.viewIndex.get(rowId);
        if (r !== undefined) {
            this.scrollIntoView(r, -1);
        }
    }

    getSelection(): SheetSelectionInfo {
        return this.selInfo();
    }

    clearFilters(): void {
        if (!Object.keys(this.filters).some(k => isFilterActive(this.filters[k]))) {
            return;
        }
        this.filters = {};
        this.rebuildView(true);
        this.emitLayout('filter');
    }

    clearSort(): void {
        if (!this.sort) {
            return;
        }
        this.sort = null;
        this.rebuildView(true);
        this.emitLayout('sort');
    }

    openFind(): void {
        this.findOpen = true;
        this.cdr.detectChanges();
        const inp = this.host.nativeElement.querySelector('.sg-find input') as HTMLInputElement | null;
        if (inp) {
            inp.focus();
            inp.select();
        }
        if (this.findQ) {
            this.runFind(false);
        }
    }

    closeFind(): void {
        this.findOpen = false;
        this.findHits = [];
        this.findIdx = -1;
        this.focusSink();
    }

    /** Excel file of the visible (sorted / filtered) rows and visible columns, with colours. */
    async exportExcel(fileName?: string): Promise<void> {
        const name = fileName || this.exportName || 'Sheet';
        try {
            await exportSheetToExcel(this.cols.map(c => ({ ...c.src, width: c.w })), this.view.map(v => v.row),
                { fileName: name, sheetName: this.exportName, frozenCols: this.nF, frozenRows: this.nFR, merges: this.activeMerges() });
        } catch (e) {
            this.zone.run(() => this.flash('Excel export failed: ' + ((e && (e as any).message) || e)));
        }
    }

    /* ================================================================ columns */

    private initColumns(): void {
        const keys = new Set<string>();
        for (const c of this.columns || []) {
            keys.add(c.key);
            const prev = this.colInput.get(c.key);
            // hidden / width from the input apply when first seen or when the input value changed
            // (a restored personal layout); otherwise the user's change in this session stays
            if (!prev || prev.h !== c.hidden) {
                if (c.hidden === true) {
                    this.hidden.add(c.key);
                } else if (c.hidden === false || !prev) {
                    this.hidden.delete(c.key);
                }
            }
            if (prev && prev.w !== c.width) {
                delete this.widths[c.key];
            }
            this.colInput.set(c.key, { w: c.width, h: c.hidden });
            this.seenKeys.add(c.key);
        }
        for (const k of Array.from(this.hidden)) {
            if (!keys.has(k)) {
                this.hidden.delete(k);
            }
        }
        if (this.frozenCols === null || this.frozenCols === undefined) {
            let n = 0;
            for (const c of this.columns || []) {
                if (!c.frozen) {
                    break;
                }
                if (!this.hidden.has(c.key)) {
                    n++;
                }
            }
            this.frozen = n;
        }
    }

    private buildCols(): void {
        const out: GCol[] = [];
        let x = GUTTER_W;
        let pendingHidden: string[] = [];
        for (const src of this.columns || []) {
            if (this.hidden.has(src.key)) {
                pendingHidden.push(src.key);
                continue;
            }
            const kind: SheetCellKind = src.kind || 'text';
            const w = Math.max(MIN_W, Math.round(this.widths[src.key] || src.width || DEFAULT_W));
            const align = src.align || (kind === 'num' ? 'right' : 'left');
            out.push({
                key: src.key, header: src.header, kind, w, x, i: out.length, frozen: false,
                right: align === 'right', center: align === 'center', src,
                hb: pendingHidden.length ? pendingHidden : null, ha: null
            });
            pendingHidden = [];
            x += w;
        }
        if (pendingHidden.length && out.length) {
            out[out.length - 1].ha = pendingHidden;
        }
        const nF = Math.min(this.frozen, out.length);
        for (let i = 0; i < nF; i++) {
            out[i].frozen = true;
        }
        this.cols = out;
        this.nF = nF;
        this.fcols = out.slice(0, nF);
        if (this.editing) {
            const ec = out.findIndex(x => x.key === this.editing!.key);
            if (ec < 0) {
                this.closeEditor();
                this.flash('The column you were editing was hidden or removed - the edit was not saved.');
            } else {
                this.editing.c = ec;
                this.editing.frozen = ec < nF;
            }
        }
        this.frozenW = nF ? out[nF - 1].x + out[nF - 1].w : GUTTER_W;
        this.totalW = x;
        this.colsVer++;
        this.dateKeys = (this.columns || []).filter(c => c.kind === 'date').map(c => c.key);
        if (this.view.length) {
            this.buildMerges();
        }
        this.winL = this.winR = -1;
        this.updateWindow(false);
    }

    private colByKey(key: string): GCol | undefined {
        for (const c of this.cols) {
            if (c.key === key) {
                return c;
            }
        }
        return undefined;
    }

    private srcColumn(key: string): SheetColumn | undefined {
        return (this.columns || []).find(c => c.key === key);
    }

    private kindOf = (key: string): SheetCellKind | undefined => {
        const c = this.srcColumn(key);
        return c ? (c.kind || 'text') : undefined;
    }

    /** horizontal window: frozen columns + the scrolling columns that intersect the visible area +- buffer */
    private updateWindow(runZone: boolean): void {
        const sc = this.scrollerRef && this.scrollerRef.nativeElement;
        const sl = sc ? sc.scrollLeft : 0;
        const cw = sc && sc.clientWidth ? sc.clientWidth : 1600;
        const visL = sl + this.frozenW;
        const visR = sl + cw;
        if (this.winL >= 0 && visL - H_BUFFER / 3 >= this.winL && visR + H_BUFFER / 3 <= this.winR) {
            return;
        }
        const L = visL - H_BUFFER;
        const R = visR + H_BUFFER;
        const list: GCol[] = [];
        for (let i = this.nF; i < this.cols.length; i++) {
            const c = this.cols[i];
            if (c.x + c.w > L && c.x < R) {
                list.push(c);
            }
        }
        const apply = () => {
            this.winL = L;
            this.winR = R;
            const same = list.length === this.scols.length && list.every((c, i) => c === this.scols[i]);
            if (!same) {
                this.scols = list;
            }
        };
        if (runZone) {
            this.zone.run(apply);
        } else {
            apply();
        }
    }

    private onScroll = () => {
        this.updateWindow(true);
    }

    /* ================================================================ rows / view */

    private toVm(row: SheetRow): SheetRowVM {
        const cached = this.vmCache.get(row);
        if (cached && cached.cv === this.colsVer) {
            return cached;
        }
        const v = row.values || (EMPTY as any);
        let tg: { [k: string]: string } = (row.tags as any) || EMPTY;
        let tt: { [k: string]: string } = EMPTY;
        const lk = row.locked || EMPTY;
        // date-or-note flag: a non-empty value in a date column that is not a real date
        let copied = false;
        for (const key of this.dateKeys) {
            const s = v[key];
            if (s && !tg[key] && !isCanonicalDate(s)) {
                if (!copied) {
                    tg = { ...tg };
                    copied = true;
                }
                tg[key] = 'note';
            }
        }
        const tipKeys = Object.keys(lk).concat(Object.keys(tg));
        if (tipKeys.length) {
            tt = {};
            const reasons = row.tagReasons || EMPTY;
            for (const k of Object.keys(tg)) {
                const t = reasons[k] || (this.tagLabels || TAG_TIP)[tg[k]];
                if (t) {
                    tt[k] = t;
                }
            }
            for (const k of Object.keys(lk)) {
                tt[k] = 'Locked: ' + (lk[k] || 'read-only') + (tt[k] ? ' - ' + tt[k] : '');
            }
        }
        const vm: SheetRowVM = {
            row, id: row.id, v, f: row.fmt || EMPTY, lk, tg, tt,
            bg: (row.rowFmt && row.rowFmt.bg) || null,
            fg: (row.rowFmt && row.rowFmt.fg) || null,
            n: 0, cv: this.colsVer
        };
        this.vmCache.set(row, vm);
        return vm;
    }

    get filterCount(): number {
        let n = 0;
        for (const k of Object.keys(this.filters)) {
            if (isFilterActive(this.filters[k])) {
                n++;
            }
        }
        return n;
    }

    get sortLabel(): string {
        if (!this.sort) {
            return '';
        }
        const c = this.srcColumn(this.sort.key);
        return (c ? c.header : this.sort.key) + (this.sort.dir === 'asc' ? ' A→Z' : ' Z→A');
    }

    /**
     * full = re-apply sort and filters. Otherwise (rows refreshed while a sort / filter is on) the
     * current order is kept: rows stay where they are, new rows appear after their predecessor,
     * removed rows drop out - like a Sheets filter view, which does not re-sort while you type.
     */
    private rebuildView(full: boolean, keysSaved = false): void {
        if (!keysSaved) {
            this.saveSelKeys();
        }
        const rows = this.rows || [];
        this.rowById.clear();
        this.modelIndex.clear();
        rows.forEach((r, i) => {
            this.rowById.set(r.id, r);
            this.modelIndex.set(r.id, i);
        });
        const ordered = !!this.sort || this.filterCount > 0;
        // frozen rows: the first `frozenRows` of `rows`, always on top in sheet order
        const nFR = Math.max(0, Math.min(this.frozenRows | 0, rows.length));
        const topRows = nFR ? rows.slice(0, nFR) : [];
        const rest = nFR ? rows.slice(nFR) : rows;
        const topIds = new Set(topRows.map(r => r.id));
        const wasTop = new Set(this.topView.map(v => v.id));
        let list: SheetRow[];
        if (!ordered) {
            list = rest;
        } else if (full || !this.view.length) {
            const pred = compileFilters(this.filters, this.kindOf);
            list = pred ? rest.filter(pred) : rest.slice();
            if (this.sort) {
                list = sortRows(list, this.sort.key, this.sort.dir, this.kindOf(this.sort.key));
            }
        } else {
            const present = new Set<SheetRowId>();
            const kept: SheetRowId[] = [];
            for (const vm of this.view) {
                if (this.rowById.has(vm.id) && !topIds.has(vm.id) && !wasTop.has(vm.id)) {
                    kept.push(vm.id);
                    present.add(vm.id);
                }
            }
            // new rows (and rows that left the frozen block): right after their predecessor in `rows`
            const after = new Map<SheetRowId | null, SheetRowId[]>();
            let prev: SheetRowId | null = null;
            for (const r of rest) {
                if (!present.has(r.id) && (!this.prevIds.has(r.id) || wasTop.has(r.id))) {
                    const k = prev;
                    if (!after.has(k)) {
                        after.set(k, []);
                    }
                    after.get(k)!.push(r.id);
                    present.add(r.id);
                    continue; // a run of new rows stays after the same predecessor
                }
                if (present.has(r.id)) {
                    prev = r.id;
                }
            }
            const ids: SheetRowId[] = [];
            const top = after.get(null);
            if (top) {
                ids.push(...top);
            }
            for (const id of kept) {
                ids.push(id);
                const a = after.get(id);
                if (a) {
                    ids.push(...a);
                }
            }
            list = ids.map(id => this.rowById.get(id)!);
        }
        if (nFR) {
            list = topRows.concat(list);
        }
        const view: SheetRowVM[] = new Array(list.length);
        this.vmById.clear();
        this.viewIndex.clear();
        for (let i = 0; i < list.length; i++) {
            const vm = this.toVm(list[i]);
            vm.n = (this.modelIndex.get(vm.id) || 0) + 1;
            view[i] = vm;
            this.vmById.set(vm.id, vm);
            this.viewIndex.set(vm.id, i);
        }
        this.view = view;
        this.nFR = nFR;
        this.topView = nFR ? view.slice(0, nFR) : [];
        this.bodyView = nFR ? view.slice(nFR) : view;
        this.computeColLocks(rows);

        // rows that appeared since the last update (for a pending insert)
        const newIds: SheetRowId[] = [];
        for (const r of rows) {
            if (!this.prevIds.has(r.id)) {
                newIds.push(r.id);
            }
        }
        this.prevIds = new Set(rows.map(r => r.id));
        this.buildMerges();
        if (full && this.selKeys && ordered) {
            // a new sort / filter order: keep the active cell, drop the range (its ends may now be far apart)
            this.selKeys.a = this.selKeys.p;
            this.selKeys.e = this.selKeys.p;
        }
        this.remapSelection();
        if (this.editing && !this.vmById.has(this.editing.rowId)) {
            this.closeEditor();
            this.flash('The row you were editing was removed (or filtered out) - the edit was not saved.');
            this.focusSink();
        } else if (this.editing) {
            this.editing.r = this.viewIndex.get(this.editing.rowId)!;
        }
        if (this.findOpen && this.findQ) {
            this.runFind(true);
        }
        if (this.followActive) {
            this.followActive = false;
            Promise.resolve().then(() => this.scrollIntoView(this.active.r, -1));
        }
        if (this.pendings.length && newIds.length) {
            const ids = new Set(newIds);
            Promise.resolve().then(() => this.zone.run(() => this.completePendings(ids)));
        }
        // side panels follow the active row when rows move / disappear (emitted after this check)
        Promise.resolve().then(() => {
            if (!this.destroyed) {
                this.zone.run(() => this.emitSelection());
            }
        });
        this.scheduleStats();
    }

    /* ================================================================ selection */

    private saveSelKeys(): void {
        const key = (p: CellPos): [SheetRowId | null, string] => {
            const vm = this.view[p.r];
            const c = this.cols[p.c];
            return [vm ? vm.id : null, c ? c.key : ''];
        };
        if (this.view.length && this.cols.length) {
            this.selKeys = { a: key(this.anchor), e: key(this.ext), p: key(this.active) };
        }
    }

    private remapSelection(): void {
        const nR = this.view.length;
        const nC = this.cols.length;
        const back = (k: [SheetRowId | null, string] | undefined, fb: CellPos): CellPos => {
            if (!k) {
                return fb;
            }
            let r = k[0] !== null && this.viewIndex.has(k[0]) ? this.viewIndex.get(k[0])! : fb.r;
            let c = this.cols.findIndex(x => x.key === k[1]);
            if (c < 0) {
                c = fb.c;
            }
            r = clamp(r, 0, Math.max(0, nR - 1));
            c = clamp(c, 0, Math.max(0, nC - 1));
            return { r, c };
        };
        const s = this.selKeys;
        let a = back(s ? s.a : undefined, this.anchor);
        let e = back(s ? s.e : undefined, this.ext);
        const p = back(s ? s.p : undefined, this.active);
        if (this.selMode === 'rows') {
            a = { r: a.r, c: 0 };
            e = { r: e.r, c: Math.max(0, nC - 1) };
        } else if (this.selMode === 'cols') {
            a = { r: 0, c: a.c };
            e = { r: Math.max(0, nR - 1), c: e.c };
        }
        this.anchor = a;
        this.ext = e;
        this.active = this.snap(p);
        this.sel = this.expandMerges(rangeOf(a, e));
        if (!inRange(this.sel, this.active.r, this.active.c)) {
            this.active = this.snap({ ...a });
        }
    }

    private setSel(anchor: CellPos, ext: CellPos, active: CellPos, mode: 'cells' | 'rows' | 'cols', scroll: boolean | 'ext'): void {
        const nR = this.view.length;
        const nC = this.cols.length;
        const cl = (p: CellPos): CellPos => ({ r: clamp(p.r, 0, Math.max(0, nR - 1)), c: clamp(p.c, 0, Math.max(0, nC - 1)) });
        this.anchor = cl(anchor);
        this.ext = cl(ext);
        this.active = this.snap(cl(active));
        this.selMode = mode;
        // a selection touching a merged cell covers the whole merge
        this.sel = this.expandMerges(rangeOf(this.anchor, this.ext));
        this.saveSelKeys();
        if (scroll === 'ext') {
            this.scrollIntoView(mode === 'cols' ? -1 : this.ext.r, mode === 'rows' ? -1 : this.ext.c);
        } else if (scroll) {
            this.scrollIntoView(this.active.r, this.active.c);
        }
        if (this.mark && !this.mark.cut) {
            // Sheets keeps the copy marquee until Esc or an edit; nothing to do
        }
        this.scheduleStats();
        this.emitSelection();
    }

    private emitSelection(): void {
        const info = this.selInfo();
        const sig = (info.active ? info.active.rowId + '|' + info.active.key : '') + '|' +
            this.sel.r0 + ',' + this.sel.c0 + ',' + this.sel.r1 + ',' + this.sel.c1;
        if (sig !== this.lastSelSig) {
            this.lastSelSig = sig;
            this.selectionChange.emit(info);
        }
    }

    private selInfo(): SheetSelectionInfo {
        const rowIds: SheetRowId[] = [];
        for (let r = this.sel.r0; r <= this.sel.r1 && r < this.view.length; r++) {
            rowIds.push(this.view[r].id);
        }
        const keys: string[] = [];
        for (let c = this.sel.c0; c <= this.sel.c1 && c < this.cols.length; c++) {
            keys.push(this.cols[c].key);
        }
        const vm = this.view[this.active.r];
        const col = this.cols[this.active.c];
        return { rowIds, keys, active: vm && col ? { rowId: vm.id, key: col.key } : null };
    }

    selectAll(): void {
        if (!this.view.length || !this.cols.length) {
            return;
        }
        this.setSel({ r: 0, c: 0 }, { r: this.view.length - 1, c: this.cols.length - 1 }, this.active, 'cells', false);
    }

    private selectedRowIds(): SheetRowId[] {
        return this.selInfo().rowIds;
    }

    private scheduleStats(): void {
        clearTimeout(this.statsTimer);
        if (rangeCells(this.sel) < 2 || !this.view.length) {
            this.stats = null;
            return;
        }
        this.zone.runOutsideAngular(() => {
            this.statsTimer = setTimeout(() => this.zone.run(() => {
                const vals: string[] = [];
                for (let r = this.sel.r0; r <= this.sel.r1 && r < this.view.length; r++) {
                    const v = this.view[r].v;
                    for (let c = this.sel.c0; c <= this.sel.c1 && c < this.cols.length; c++) {
                        if (!this.isCovered(r, c)) {
                            vals.push(v[this.cols[c].key] || '');
                        }
                    }
                }
                this.stats = selectionStats(vals);
            }), 60);
        });
    }

    fmtNum(n: number | null): string {
        if (n === null || n === undefined || !isFinite(n)) {
            return '';
        }
        const r = Math.round(n * 100) / 100;
        return r.toLocaleString('en-IN', { maximumFractionDigits: 2 });
    }

    /* ================================================================ geometry */

    /** height of the sticky band: header + frozen rows */
    get bandH(): number {
        return HEAD_H + this.nFR * ROW_H;
    }

    private rOff(): number {
        const o = this.vp ? this.vp.getOffsetToRenderedContentStart() : 0;
        return o || 0;
    }

    /**
     * The pieces of a range per pane (frozen rows / body x frozen / scrolling columns), in each
     * pane's coordinates. cls trims the borders where a piece continues in the next pane.
     */
    private pieces(g: CellRange, off: number): { pane: PaneKey; rect: Rect; cls: string }[] {
        const cols = this.cols;
        const out: { pane: PaneKey; rect: Rect; cls: string }[] = [];
        if (!cols.length || !this.view.length) {
            return out;
        }
        const nFR = this.nFR;
        const nF = this.nF;
        const rp: { z: 't' | 'b'; a: number; b: number }[] = [];
        if (g.r0 < nFR) {
            rp.push({ z: 't', a: g.r0, b: Math.min(g.r1, nFR - 1) });
        }
        if (g.r1 >= nFR) {
            rp.push({ z: 'b', a: Math.max(g.r0, nFR), b: g.r1 });
        }
        const cp: { z: 'f' | 's'; a: number; b: number }[] = [];
        if (g.c0 < nF) {
            cp.push({ z: 'f', a: g.c0, b: Math.min(g.c1, nF - 1) });
        }
        if (g.c1 >= nF) {
            cp.push({ z: 's', a: Math.max(g.c0, nF), b: g.c1 });
        }
        for (const r of rp) {
            for (const c of cp) {
                const ca = cols[c.a];
                const cb = cols[c.b];
                if (!ca || !cb) {
                    continue;
                }
                const y = r.z === 't' ? r.a * ROW_H : (r.a - nFR) * ROW_H - off;
                const cls = (rp.length > 1 ? (r.z === 't' ? 'nb ' : 'nt ') : '') + (cp.length > 1 ? (c.z === 'f' ? 'nr' : 'nl') : '');
                out.push({ pane: (r.z + c.z) as PaneKey, rect: { x: ca.x, y, w: cb.x + cb.w - ca.x, h: (r.b - r.a + 1) * ROW_H }, cls });
            }
        }
        return out;
    }

    private computeGeo(): void {
        const P = this.panes;
        const off = this.rOff();
        for (const k of ['tf', 'ts', 'bf', 'bs'] as PaneKey[]) {
            const q = P[k];
            q.off = k[0] === 'b' ? off : 0;
            q.gut = q.sel = q.act = q.mark = q.fill = q.ed = null;
            q.hdl = null;
            q.selCls = q.actCls = q.markCls = q.fillCls = '';
        }
        if (!this.cols.length || !this.view.length) {
            return;
        }
        const nFR = this.nFR;
        const sel = this.sel;
        for (const x of this.pieces(sel, off)) {
            P[x.pane].sel = x.rect;
            P[x.pane].selCls = x.cls;
        }
        const a = this.active;
        const am = this.mergeAt(a.r, a.c) || { r0: a.r, r1: a.r, c0: a.c, c1: a.c };
        for (const x of this.pieces(am, off)) {
            P[x.pane].act = x.rect;
            P[x.pane].actCls = x.cls;
        }
        if (this.editing) {
            const ec = this.cols[this.editing.c];
            const er = this.editing.r;
            if (ec) {
                const em = this.mergeAt(er, this.editing.c);
                const w = em ? this.cols[em.c1].x + this.cols[em.c1].w - ec.x : ec.w;
                const pane = ((er < nFR ? 't' : 'b') + (this.editing.c < this.nF ? 'f' : 's')) as PaneKey;
                P[pane].ed = { x: ec.x, y: er < nFR ? er * ROW_H : (er - nFR) * ROW_H - off, w, h: ROW_H };
            }
        } else if (!this.readOnly) {
            const hc = this.cols[sel.c1];
            const pane = ((sel.r1 < nFR ? 't' : 'b') + (sel.c1 < this.nF ? 'f' : 's')) as PaneKey;
            P[pane].hdl = { x: hc.x + hc.w, y: sel.r1 < nFR ? (sel.r1 + 1) * ROW_H : (sel.r1 + 1 - nFR) * ROW_H - off };
        }
        // gutter highlight of the selected rows
        if (sel.r0 < nFR) {
            const b = Math.min(sel.r1, nFR - 1);
            P.tf.gut = { x: 0, y: sel.r0 * ROW_H, w: GUTTER_W, h: (b - sel.r0 + 1) * ROW_H };
        }
        if (sel.r1 >= nFR) {
            const t = Math.max(sel.r0, nFR);
            P.bf.gut = { x: 0, y: (t - nFR) * ROW_H - off, w: GUTTER_W, h: (sel.r1 - t + 1) * ROW_H };
        }
        if (this.mark) {
            const mr = this.markRange();
            if (mr) {
                for (const x of this.pieces(mr, off)) {
                    P[x.pane].mark = x.rect;
                    P[x.pane].markCls = x.cls;
                }
            }
        }
        if (this.fillPrev) {
            for (const x of this.pieces(this.fillPrev.range, off)) {
                P[x.pane].fill = x.rect;
                P[x.pane].fillCls = x.cls;
            }
        }
    }

    /* ================================================================ merges */

    private mergeAt(r: number, c: number): CellRange | null {
        if (!this.mActive.length) {
            return null;
        }
        const i = this.mCover.get(r * 1024 + c);
        return i === undefined ? null : this.mActive[i];
    }

    /** true for a cell hidden under a merge (every merged cell but the top-left one) */
    private isCovered(r: number, c: number): boolean {
        const m = this.mergeAt(r, c);
        return !!m && (m.r0 !== r || m.c0 !== c);
    }

    /** a position inside a merge -> the merge's top-left cell */
    private snap(p: CellPos): CellPos {
        const m = this.mergeAt(p.r, p.c);
        return m ? { r: m.r0, c: m.c0 } : p;
    }

    /** grows a range until it covers every merge it touches */
    private expandMerges(g: CellRange): CellRange {
        if (!this.mActive.length) {
            return g;
        }
        let out = g;
        let changed = true;
        while (changed) {
            changed = false;
            for (const m of this.mActive) {
                const hit = m.r0 <= out.r1 && m.r1 >= out.r0 && m.c0 <= out.c1 && m.c1 >= out.c0;
                if (hit && (m.r0 < out.r0 || m.r1 > out.r1 || m.c0 < out.c0 || m.c1 > out.c1)) {
                    out = {
                        r0: Math.min(out.r0, m.r0), r1: Math.max(out.r1, m.r1),
                        c0: Math.min(out.c0, m.c0), c1: Math.max(out.c1, m.c1)
                    };
                    changed = true;
                }
            }
        }
        return out;
    }

    /** one step from p, leaving a merge from its edge (arrow keys, Enter, Tab) */
    private step(p: CellPos, dr: number, dc: number): CellPos {
        const m = this.mergeAt(p.r, p.c);
        const r = m ? (dr > 0 ? m.r1 : dr < 0 ? m.r0 : p.r) : p.r;
        const c = m ? (dc > 0 ? m.c1 : dc < 0 ? m.c0 : p.c) : p.c;
        return {
            r: clamp(r + dr, 0, Math.max(0, this.view.length - 1)),
            c: clamp(c + dc, 0, Math.max(0, this.cols.length - 1))
        };
    }

    /** moveWithin that skips the hidden cells of merges */
    private moveWithinMerged(g: CellRange, p: CellPos, dir: 'right' | 'left' | 'down' | 'up'): CellPos {
        let q = p;
        const n = rangeCells(g);
        for (let i = 0; i < n; i++) {
            q = moveWithin(g, q, dir);
            if (!this.isCovered(q.r, q.c)) {
                return q;
            }
        }
        return q;
    }

    /**
     * Resolves the merge definitions against the current columns / view. A merge is drawn when its
     * columns are all visible and its rows are in sheet order (inside the frozen rows, or no sort /
     * filter). Overlapping definitions: the first one wins.
     */
    private buildMerges(): void {
        const act: CellRange[] = [];
        this.mCover.clear();
        const parts: { [k: string]: MergePart[] } = { tf: [], ts: [], bf: [], bs: [] };
        const srcCols = this.columns || [];
        const nRows = (this.rows || []).length;
        if (this.mergeDefs.length && this.cols.length && this.view.length) {
            const ordered = !!this.sort || this.filterCount > 0;
            const visIdx = new Map(this.cols.map(c => [c.key, c.i]));
            for (const d of this.mergeDefs) {
                if (d.c1 >= srcCols.length || d.r1 >= nRows || (d.r0 === d.r1 && d.c0 === d.c1)) {
                    continue;
                }
                const vis = srcCols.slice(d.c0, d.c1 + 1).map(c => visIdx.get(c.key));
                if (vis.some(v => v === undefined)) {
                    continue; // a hidden column inside: drawn unmerged
                }
                if (ordered && d.r1 >= this.nFR) {
                    continue; // sorted / filtered rows: drawn unmerged
                }
                const g: CellRange = { r0: d.r0, r1: d.r1, c0: vis[0]!, c1: vis[vis.length - 1]! };
                let clash = false;
                for (let r = g.r0; r <= g.r1 && !clash; r++) {
                    for (let c = g.c0; c <= g.c1; c++) {
                        if (this.mCover.has(r * 1024 + c)) {
                            clash = true;
                            break;
                        }
                    }
                }
                if (clash) {
                    continue;
                }
                const idx = act.length;
                act.push(g);
                for (let r = g.r0; r <= g.r1; r++) {
                    for (let c = g.c0; c <= g.c1; c++) {
                        this.mCover.set(r * 1024 + c, idx);
                    }
                }
                // pieces to draw (positions without the rendered-content offset; the template applies it)
                const vm = this.view[g.r0];
                const col = this.cols[g.c0];
                const f = vm.f[col.key] || {};
                const pcs = this.pieces(g, 0);
                pcs.forEach((x, i) => {
                    const first = x.rect.x === col.x && (x.pane[0] === 't' || g.r0 >= this.nFR);
                    parts[x.pane].push({
                        k: idx + ':' + i, x: x.rect.x, y: x.rect.y, w: x.rect.w, h: x.rect.h,
                        text: first ? (vm.v[col.key] || '') : '',
                        bg: f.bg || vm.bg || null, fg: f.fg || vm.fg || null, bold: !!f.bold,
                        right: col.right, center: col.center, multi: g.r1 > g.r0, tip: first ? (vm.tt[col.key] || null) : null
                    });
                });
            }
        }
        this.mActive = act;
        this.panes.tf.merges = parts['tf'];
        this.panes.ts.merges = parts['ts'];
        this.panes.bf.merges = parts['bf'];
        this.panes.bs.merges = parts['bs'];
    }

    /** the merges drawn now, in view coordinates (rows = view index, columns = visible index) */
    activeMerges(): CellRange[] {
        return this.mActive.slice();
    }

    private computeColLocks(rows: SheetRow[]): void {
        const out: { [key: string]: string } = {};
        if (rows.length) {
            for (const c of this.cols) {
                const first = rows[0].locked && rows[0].locked[c.key];
                if (!first) {
                    continue;
                }
                let all = true;
                for (let i = 1; i < rows.length; i++) {
                    const l = rows[i].locked;
                    if (!l || l[c.key] !== first) {
                        all = false;
                        break;
                    }
                }
                if (all) {
                    out[c.key] = first;
                }
            }
        }
        this.colLock = out;
    }

    private markRange(): CellRange | null {
        const m = this.mark;
        if (!m) {
            return null;
        }
        let r0 = Infinity, r1 = -1, c0 = Infinity, c1 = -1;
        for (const id of m.ids) {
            const r = this.viewIndex.get(id);
            if (r !== undefined) {
                r0 = Math.min(r0, r);
                r1 = Math.max(r1, r);
            }
        }
        for (const k of m.keys) {
            const c = this.cols.findIndex(x => x.key === k);
            if (c >= 0) {
                c0 = Math.min(c0, c);
                c1 = Math.max(c1, c);
            }
        }
        return r1 < 0 || c1 < 0 ? null : { r0, r1, c0, c1 };
    }

    hdrOn(c: GCol): boolean {
        return c.i >= this.sel.c0 && c.i <= this.sel.c1;
    }

    get colFull(): boolean {
        return this.selMode === 'cols' || (this.sel.r0 === 0 && this.sel.r1 === this.view.length - 1 && this.view.length > 1);
    }

    get activeLabel(): string {
        const vm = this.view[this.active.r];
        const c = this.cols[this.active.c];
        return vm && c ? c.header + ' · ' + vm.n : '';
    }

    get activeValue(): string {
        const vm = this.view[this.active.r];
        const c = this.cols[this.active.c];
        return vm && c ? (vm.v[c.key] || '') : '';
    }

    get activeTip(): string {
        const vm = this.view[this.active.r];
        const c = this.cols[this.active.c];
        return vm && c ? (vm.tt[c.key] || '') : '';
    }

    get viewInfo(): string {
        const n = this.view.length;
        const t = (this.rows || []).length;
        return n === t ? n + (n === 1 ? ' row' : ' rows') : n + ' of ' + t + ' rows';
    }

    trackVm = (_: number, vm: SheetRowVM) => vm.id;

    /* ================================================================ scrolling */

    private scrollIntoView(r: number, c: number): void {
        const sc = this.scrollerRef.nativeElement;
        if (r >= this.nFR) {
            const band = this.bandH;
            const top = band + (r - this.nFR) * ROW_H;
            const bottom = top + ROW_H;
            const viewTop = sc.scrollTop + band;
            const viewBottom = sc.scrollTop + sc.clientHeight;
            if (top < viewTop) {
                sc.scrollTop = top - band;
            } else if (bottom > viewBottom) {
                sc.scrollTop = bottom - sc.clientHeight;
            }
        }
        if (c >= this.nF && c < this.cols.length) {
            const col = this.cols[c];
            const vl = sc.scrollLeft + this.frozenW;
            const vr = sc.scrollLeft + sc.clientWidth;
            if (col.x < vl) {
                sc.scrollLeft = col.x - this.frozenW;
            } else if (col.x + col.w > vr) {
                sc.scrollLeft = Math.min(col.x - this.frozenW, col.x + col.w - sc.clientWidth);
            }
            this.updateWindow(false);
        }
    }

    private pageRows(): number {
        const sc = this.scrollerRef.nativeElement;
        return Math.max(1, Math.floor((sc.clientHeight - this.bandH) / ROW_H) - 1);
    }

    /** cell under a client point. clampToBody: pointer outside the body is clamped to the nearest cell (drag). */
    private hit(clientX: number, clientY: number, clampToBody: boolean):
        { zone: 'cell' | 'gutter' | 'none'; r: number; c: number } | null {
        const sc = this.scrollerRef.nativeElement;
        const rect = sc.getBoundingClientRect();
        let bx = clientX - rect.left;
        let by = clientY - rect.top;
        if (!clampToBody && (bx >= sc.clientWidth || by >= sc.clientHeight || bx < 0 || by < 0)) {
            return null; // scrollbar or outside
        }
        if (clampToBody) {
            bx = clamp(bx, 0, sc.clientWidth - 1);
            by = clamp(by, HEAD_H, sc.clientHeight - 1);
        }
        if (by < HEAD_H) {
            return { zone: 'none', r: -1, c: -1 };
        }
        const band = this.bandH;
        const r = by < band
            ? Math.floor((by - HEAD_H) / ROW_H)                              // a frozen row
            : this.nFR + Math.floor((by - band + sc.scrollTop) / ROW_H);   // a scrolled row
        const cx = bx < this.frozenW ? bx : bx + sc.scrollLeft;
        if (cx < GUTTER_W) {
            return { zone: 'gutter', r, c: 0 };
        }
        let lo = 0, hi = this.cols.length - 1, c = hi;
        while (lo <= hi) {
            const mid = (lo + hi) >> 1;
            const col = this.cols[mid];
            if (cx < col.x) {
                hi = mid - 1;
            } else if (cx >= col.x + col.w) {
                lo = mid + 1;
            } else {
                c = mid;
                break;
            }
        }
        if (lo > this.cols.length - 1) {
            c = this.cols.length - 1;
        }
        if (r >= this.view.length && !clampToBody) {
            return { zone: 'none', r, c };
        }
        return { zone: 'cell', r: clamp(r, 0, Math.max(0, this.view.length - 1)), c };
    }

    /* ================================================================ mouse */

    onBodyDown(e: MouseEvent): void {
        const t = e.target as HTMLElement;
        if (t.closest('.sg-head, .sg-ed, .sg-list, .sg-hdl, .sg-foot, .sg-empty')) {
            return;
        }
        const h = this.hit(e.clientX, e.clientY, false);
        if (!h) {
            return; // scrollbar
        }
        e.preventDefault();
        if (this.editing) {
            this.commitEdit('none');
        }
        this.closeMenus();
        if (h.zone === 'none' || !this.view.length) {
            this.focusSink();
            return;
        }
        this.tabStart = null;
        const lastC = Math.max(0, this.cols.length - 1);
        if (e.button === 2) {
            // right click: keep the selection when clicking inside it
            const inside = h.zone === 'gutter'
                ? this.selMode === 'rows' && h.r >= this.sel.r0 && h.r <= this.sel.r1
                : inRange(this.sel, h.r, h.c);
            if (!inside) {
                if (h.zone === 'gutter') {
                    this.setSel({ r: h.r, c: 0 }, { r: h.r, c: lastC }, { r: h.r, c: 0 }, 'rows', false);
                } else {
                    this.setSel({ r: h.r, c: h.c }, { r: h.r, c: h.c }, { r: h.r, c: h.c }, 'cells', false);
                }
            }
            this.focusSink();
            return;
        }
        if (h.zone === 'gutter') {
            if (e.shiftKey) {
                const ar = this.selMode === 'rows' ? this.anchor.r : this.active.r;
                this.setSel({ r: ar, c: 0 }, { r: h.r, c: lastC }, { r: ar, c: 0 }, 'rows', false);
            } else {
                this.setSel({ r: h.r, c: 0 }, { r: h.r, c: lastC }, { r: h.r, c: 0 }, 'rows', false);
            }
            this.focusSink();
            this.startDrag('rows');
            return;
        }
        if (e.shiftKey) {
            this.setSel(this.anchor, { r: h.r, c: h.c }, this.active, 'cells', false);
        } else {
            this.setSel({ r: h.r, c: h.c }, { r: h.r, c: h.c }, { r: h.r, c: h.c }, 'cells', false);
        }
        this.focusSink();
        this.startDrag('cells');
    }

    onBodyDbl(e: MouseEvent): void {
        const t = e.target as HTMLElement;
        if (t.closest('.sg-head, .sg-ed, .sg-list, .sg-foot, .sg-empty')) {
            return;
        }
        if (t.closest('.sg-hdl')) {
            this.fillToEdge();
            return;
        }
        const h = this.hit(e.clientX, e.clientY, false);
        if (h && h.zone === 'cell') {
            this.setSel({ r: h.r, c: h.c }, { r: h.r, c: h.c }, { r: h.r, c: h.c }, 'cells', false);
            this.startEdit('edit');
        }
    }

    onBodyMenu(e: MouseEvent): void {
        const t = e.target as HTMLElement;
        if (t.closest('.sg-ed, .sg-list')) {
            return; // the browser menu in the editor
        }
        e.preventDefault();
        if (t.closest('.sg-head')) {
            return;
        }
        const h = this.hit(e.clientX, e.clientY, false);
        if (!h || h.zone === 'none' || !this.view.length) {
            return;
        }
        this.openContextMenu(e.clientX, e.clientY);
    }

    onHeaderDown(e: MouseEvent, c: GCol): void {
        if (e.button !== 0 && e.button !== 2) {
            return;
        }
        e.preventDefault();
        e.stopPropagation();
        if (this.editing) {
            this.commitEdit('none');
        }
        this.closeMenus();
        const lastR = Math.max(0, this.view.length - 1);
        if (e.button === 2) {
            if (!(this.colFull && c.i >= this.sel.c0 && c.i <= this.sel.c1)) {
                this.setSel({ r: 0, c: c.i }, { r: lastR, c: c.i }, { r: 0, c: c.i }, 'cols', false);
            }
            this.focusSink();
            return;
        }
        if (e.shiftKey) {
            const ac = this.selMode === 'cols' ? this.anchor.c : this.active.c;
            this.setSel({ r: 0, c: ac }, { r: lastR, c: c.i }, { r: this.active.r, c: ac }, 'cols', false);
        } else {
            const top = this.firstVisibleRow();
            this.setSel({ r: 0, c: c.i }, { r: lastR, c: c.i }, { r: top, c: c.i }, 'cols', false);
        }
        this.focusSink();
        this.startDrag('cols');
    }

    onHeaderMenu(e: MouseEvent, c: GCol): void {
        e.preventDefault();
        e.stopPropagation();
        this.openHeaderMenu(c, e.clientX, e.clientY);
    }

    onCornerDown(e: MouseEvent): void {
        e.preventDefault();
        e.stopPropagation();
        if (this.editing) {
            this.commitEdit('none');
        }
        this.closeMenus();
        this.selectAll();
        this.focusSink();
    }

    private firstVisibleRow(): number {
        const sc = this.scrollerRef.nativeElement;
        return clamp(this.nFR + Math.ceil(sc.scrollTop / ROW_H), 0, Math.max(0, this.view.length - 1));
    }

    onHandleDown(e: MouseEvent): void {
        if (e.button !== 0) {
            return;
        }
        e.preventDefault();
        e.stopPropagation();
        this.closeMenus();
        this.focusSink();
        this.startDrag('fill');
    }

    /** mouse drag: selection, row / column selection or the fill handle; auto-scrolls past the edges */
    private startDrag(mode: DragMode): void {
        if (this.dragCleanup) {
            this.dragCleanup();
        }
        const sc = this.scrollerRef.nativeElement;
        let lastX = 0, lastY = 0, raf = 0;
        let lastKey = '';
        const apply = () => {
            const h = this.hit(lastX, lastY, true);
            if (!h || h.zone === 'none') {
                return;
            }
            const key = h.r + ':' + h.c;
            if (key === lastKey) {
                return;
            }
            lastKey = key;
            this.zone.run(() => {
                const lastC = Math.max(0, this.cols.length - 1);
                const lastR = Math.max(0, this.view.length - 1);
                if (mode === 'cells') {
                    this.setSel(this.anchor, { r: h.r, c: h.c }, this.active, 'cells', false);
                } else if (mode === 'rows') {
                    this.setSel(this.anchor, { r: h.r, c: lastC }, this.active, 'rows', false);
                } else if (mode === 'cols') {
                    this.setSel(this.anchor, { r: lastR, c: h.c }, this.active, 'cols', false);
                } else {
                    this.fillPrev = fillTarget(this.sel, { r: h.r, c: h.c });
                }
            });
        };
        const edgeStep = () => {
            raf = 0;
            const rect = sc.getBoundingClientRect();
            let dy = 0, dx = 0;
            if (lastY < rect.top + HEAD_H) {
                dy = -Math.min(40, rect.top + HEAD_H - lastY);
            } else if (lastY > rect.top + sc.clientHeight) {
                dy = Math.min(40, lastY - rect.top - sc.clientHeight);
            }
            if (mode !== 'rows') {
                if (lastX < rect.left + this.frozenW && sc.scrollLeft > 0 && lastX < rect.left + this.frozenW - 4) {
                    dx = -Math.min(40, rect.left + this.frozenW - lastX);
                } else if (lastX > rect.left + sc.clientWidth) {
                    dx = Math.min(40, lastX - rect.left - sc.clientWidth);
                }
            }
            if (mode === 'cols') {
                dy = 0;
            }
            if (dx || dy) {
                sc.scrollTop += dy;
                sc.scrollLeft += dx;
                apply();
                raf = requestAnimationFrame(edgeStep);
            }
        };
        const move = (ev: MouseEvent) => {
            lastX = ev.clientX;
            lastY = ev.clientY;
            apply();
            if (!raf) {
                raf = requestAnimationFrame(edgeStep);
            }
        };
        const up = () => {
            cleanup();
            if (mode === 'fill') {
                this.zone.run(() => {
                    const fp = this.fillPrev;
                    this.fillPrev = null;
                    if (fp) {
                        this.applyFill(fp.range, fp.dir);
                    }
                });
            }
        };
        const cleanup = () => {
            document.removeEventListener('mousemove', move);
            document.removeEventListener('mouseup', up);
            if (raf) {
                cancelAnimationFrame(raf);
            }
            this.dragCleanup = null;
        };
        this.zone.runOutsideAngular(() => {
            document.addEventListener('mousemove', move);
            document.addEventListener('mouseup', up);
        });
        this.dragCleanup = cleanup;
    }

    /* ------------------------------------------------------------ column resize */

    onResizeDown(e: MouseEvent, c: GCol): void {
        e.preventDefault();
        e.stopPropagation();
        const guide = this.guideRef.nativeElement;
        const hostRect = this.host.nativeElement.getBoundingClientRect();
        const sc = this.scrollerRef.nativeElement;
        const scRect = sc.getBoundingClientRect();
        const startX = e.clientX;
        const colLeftClient = scRect.left + (c.frozen ? c.x : c.x - sc.scrollLeft);
        let w = c.w;
        const place = () => {
            guide.style.display = 'block';
            guide.style.left = (colLeftClient + w - hostRect.left) + 'px';
            guide.style.top = (scRect.top - hostRect.top) + 'px';
            guide.style.height = sc.clientHeight + 'px';
        };
        place();
        const move = (ev: MouseEvent) => {
            w = Math.max(MIN_W, Math.round(c.w + ev.clientX - startX));
            place();
        };
        const up = () => {
            document.removeEventListener('mousemove', move);
            document.removeEventListener('mouseup', up);
            guide.style.display = 'none';
            if (w !== c.w) {
                this.zone.run(() => this.setWidth(c.key, w));
            }
        };
        this.zone.runOutsideAngular(() => {
            document.addEventListener('mousemove', move);
            document.addEventListener('mouseup', up);
        });
    }

    onResizeDbl(e: MouseEvent, c: GCol): void {
        e.preventDefault();
        e.stopPropagation();
        this.autoFit(c.key);
    }

    private setWidth(key: string, w: number): void {
        this.saveSelKeys();
        this.widths[key] = w;
        this.buildCols();
        this.remapSelection();
        this.emitLayout('resize');
    }

    autoFit(key: string): void {
        const c = this.colByKey(key);
        if (!c) {
            return;
        }
        if (!this.measureCtx) {
            const cv = document.createElement('canvas');
            this.measureCtx = cv.getContext('2d');
        }
        const ctx = this.measureCtx;
        if (!ctx) {
            return;
        }
        const font = getComputedStyle(this.host.nativeElement).fontFamily || 'Inter, system-ui, sans-serif';
        ctx.font = '600 11.5px ' + font;
        let max = ctx.measureText(c.header).width + 34;
        ctx.font = '400 12.5px ' + font;
        const seen = new Set<string>();
        for (const vm of this.view) {
            const v = vm.v[key];
            if (!v || seen.has(v)) {
                continue;
            }
            seen.add(v);
            const line = v.indexOf('\n') >= 0 ? v.split('\n').reduce((a, b) => (a.length >= b.length ? a : b)) : v;
            const w = ctx.measureText(line).width + 20;
            if (w > max) {
                max = w;
            }
            if (seen.size > 5000) {
                break;
            }
        }
        this.setWidth(key, clamp(Math.ceil(max), 40, MAX_FIT_W));
    }

    /* ================================================================ keyboard */

    onSinkKey(e: KeyboardEvent): void {
        if (this.editing) {
            return;
        }
        if (this.confirmDel) {
            if (e.key === 'Escape') {
                this.confirmDel = null;
                e.preventDefault();
            } else if (e.key === 'Enter') {
                this.doDelete();
                e.preventDefault();
            }
            return;
        }
        if (this.cm || this.hm) {
            if (e.key === 'Escape') {
                e.preventDefault();
                this.closeMenus();
            } else if (this.cm && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
                // keyboard into the row menu
                e.preventDefault();
                const items = this.menuItems(this.host.nativeElement.querySelector('.sg-cm'), false);
                const it = e.key === 'ArrowDown' ? items[0] : items[items.length - 1];
                if (it) {
                    it.focus();
                }
            }
            return;
        }
        const ctrl = e.ctrlKey || e.metaKey;
        const shift = e.shiftKey;
        const k = e.key;
        const nR = this.view.length;
        const nC = this.cols.length;
        if (!nR || !nC) {
            if (ctrl && (k === 'v' || k === 'V')) {
                return; // let the paste event through (an empty sheet accepts a paste as new rows)
            }
            return;
        }
        const lastR = nR - 1;
        const lastC = nC - 1;
        const isEmpty = (r: number, c: number) => !(this.view[r].v[this.cols[c].key] || '').trim();

        const arrow = (dr: number, dc: number) => {
            e.preventDefault();
            this.tabStart = null;
            if (shift) {
                const from = this.ext;
                let to: CellPos = ctrl ? edgeJump(from, dr, dc, nR, nC, isEmpty) : this.step(from, dr, dc);
                if (this.selMode === 'rows') {
                    if (dc) {
                        return;
                    }
                    to = { r: to.r, c: lastC };
                } else if (this.selMode === 'cols') {
                    if (dr) {
                        return;
                    }
                    to = { r: lastR, c: to.c };
                }
                this.setSel(this.anchor, to, this.active, this.selMode, 'ext');
            } else {
                const to = ctrl ? edgeJump(this.active, dr, dc, nR, nC, isEmpty) : this.step(this.active, dr, dc);
                this.setSel(to, to, to, 'cells', true);
            }
        };

        if (ctrl && !e.altKey) {
            switch (k.toLowerCase()) {
                case 'a': e.preventDefault(); this.selectAll(); return;
                case 'z':
                    e.preventDefault();
                    this.doUndo(shift);
                    return;
                case 'y': e.preventDefault(); this.doUndo(true); return;
                case 'd': e.preventDefault(); this.fillDown(); return;
                case 'r': e.preventDefault(); this.fillRight(); return;
                case 'f': e.preventDefault(); this.openFind(); return;
                case 'b': e.preventDefault(); this.toggleBold(); return;
                case ';': e.preventDefault(); this.writeCells([{ r: this.active.r, c: this.active.c, value: todayText() }], 'date', true); return;
                case ' ':
                    e.preventDefault();
                    this.setSel({ r: 0, c: this.sel.c0 }, { r: lastR, c: this.sel.c1 }, this.active, 'cols', false);
                    return;
                case 'c': case 'x': case 'v':
                    return; // copy / cut / paste events
                case 'home':
                    e.preventDefault();
                    this.moveOrExtend({ r: 0, c: 0 }, shift);
                    return;
                case 'end':
                    e.preventDefault();
                    this.moveOrExtend({ r: lastR, c: lastC }, shift);
                    return;
            }
        }
        switch (k) {
            case 'ArrowUp': arrow(-1, 0); return;
            case 'ArrowDown':
                if (e.altKey) {
                    e.preventDefault();
                    if (this.cols[this.active.c].kind === 'choice') {
                        this.startEdit('edit', undefined, true);
                    }
                    return;
                }
                arrow(1, 0);
                return;
            case 'ArrowLeft': arrow(0, -1); return;
            case 'ArrowRight': arrow(0, 1); return;
            case 'Tab': {
                e.preventDefault();
                if (!isSingleCell(this.sel) && !this.isWholeMerge(this.sel)) {
                    const p = this.moveWithinMerged(this.sel, this.active, shift ? 'left' : 'right');
                    this.setSel(this.anchor, this.ext, p, this.selMode, true);
                } else {
                    const p = this.step(this.active, 0, shift ? -1 : 1);
                    this.setSel(p, p, p, 'cells', true);
                }
                return;
            }
            case 'Enter': {
                e.preventDefault();
                if (!isSingleCell(this.sel) && !this.isWholeMerge(this.sel)) {
                    const p = this.moveWithinMerged(this.sel, this.active, shift ? 'up' : 'down');
                    this.setSel(this.anchor, this.ext, p, this.selMode, true);
                } else if (shift) {
                    this.moveOrExtend(this.step(this.active, -1, 0), false);
                } else {
                    this.startEdit('edit');
                }
                return;
            }
            case 'F2': e.preventDefault(); this.startEdit('edit'); return;
            case 'Home': e.preventDefault(); this.moveOrExtend({ r: (shift ? this.ext : this.active).r, c: 0 }, shift); return;
            case 'End': e.preventDefault(); this.moveOrExtend({ r: (shift ? this.ext : this.active).r, c: lastC }, shift); return;
            case 'PageDown':
            case 'PageUp': {
                e.preventDefault();
                const n = this.pageRows() * (k === 'PageDown' ? 1 : -1);
                const sc = this.scrollerRef.nativeElement;
                sc.scrollTop += n * ROW_H;
                const from = shift ? this.ext : this.active;
                this.moveOrExtend({ r: clamp(from.r + n, 0, lastR), c: from.c }, shift);
                return;
            }
            case 'Delete':
            case 'Backspace':
                e.preventDefault();
                this.clearSelection();
                return;
            case 'Escape':
                e.preventDefault();
                if (this.mark) {
                    this.mark = null;
                } else if (this.findOpen) {
                    this.closeFind();
                }
                return;
            case 'ContextMenu':
                e.preventDefault();
                this.openMenuFromKeyboard();
                return;
            case 'F10':
                if (shift) {
                    e.preventDefault();
                    this.openMenuFromKeyboard();
                }
                return;
            case ' ':
                if (shift) {
                    e.preventDefault();
                    this.setSel({ r: this.sel.r0, c: 0 }, { r: this.sel.r1, c: lastC }, this.active, 'rows', false);
                    return;
                }
                break;
        }
        // anything else: printable keys reach the sink's input event (type-to-edit)
    }

    /** the selection is exactly one merged cell (behaves like a single cell) */
    private isWholeMerge(g: CellRange): boolean {
        const m = this.mergeAt(g.r0, g.c0);
        return !!m && m.r0 === g.r0 && m.c0 === g.c0 && m.r1 === g.r1 && m.c1 === g.c1;
    }

    private moveOrExtend(p: CellPos, extend: boolean): void {
        this.tabStart = null;
        if (extend) {
            this.setSel(this.anchor, p, this.active, 'cells', 'ext');
        } else {
            this.setSel(p, p, p, 'cells', true);
        }
    }

    /** text typed while the grid had focus: open the editor with it (type-to-edit, replaces the cell) */
    onSinkInput(e: Event): void {
        if ((e as InputEvent).isComposing) {
            return; // wait for compositionend
        }
        this.takeSinkText();
    }

    onSinkCompositionEnd(): void {
        this.takeSinkText();
    }

    onSinkFocus(): void {
        this.resetSink();
    }

    private takeSinkText(): void {
        const sink = this.sinkRef.nativeElement;
        const text = sink.value.split(SINK_MARK).join('');
        this.resetSink();
        if (this.cm || this.hm || this.confirmDel) {
            return; // keys belong to the open menu / dialog
        }
        if (text && !this.editing && this.view.length) {
            this.startEdit('enter', text);
        }
    }

    /**
     * The sink keeps one selected zero-width character, so the browser always has a selection
     * to copy / cut (the copy and cut events then reliably reach onCopy / onCut) and a typed
     * character simply replaces it.
     */
    private resetSink(): void {
        const s = this.sinkRef && this.sinkRef.nativeElement;
        if (!s) {
            return;
        }
        if (s.value !== SINK_MARK) {
            s.value = SINK_MARK;
        }
        if (document.activeElement === s) {
            s.setSelectionRange(0, s.value.length);
        }
    }

    private focusSink(): void {
        const s = this.sinkRef && this.sinkRef.nativeElement;
        if (s && document.activeElement !== s) {
            s.focus({ preventScroll: true });
        }
        this.resetSink();
    }

    /* ================================================================ editing */

    /** why the cell cannot be edited, or null */
    blockReason(vm: SheetRowVM, col: GCol): string | null {
        if (this.readOnly) {
            return 'This sheet is read-only.';
        }
        const lk = vm.lk[col.key];
        if (lk) {
            return lk;
        }
        if (this.canEditCell) {
            const r = this.canEditCell(vm.row, col.key);
            if (r === true || r === undefined || r === null) {
                return null;
            }
            if (typeof r === 'string') {
                return r || null;
            }
            return 'You cannot edit ' + col.header + '.';
        }
        return null;
    }

    startEdit(mode: 'enter' | 'edit', initial?: string, openList = false): void {
        const vm = this.view[this.active.r];
        const col = this.cols[this.active.c];
        if (!vm || !col) {
            return;
        }
        const reason = this.blockReason(vm, col);
        if (reason) {
            this.flash(col.header + ': ' + reason, true);
            return;
        }
        this.mark = this.mark && this.mark.cut ? this.mark : null;
        const value = initial !== undefined ? initial : (vm.v[col.key] || '');
        this.editing = {
            r: this.active.r, c: this.active.c, rowId: vm.id, key: col.key, kind: col.kind,
            frozen: this.active.c < this.nF, mode, initial: value, header: col.header,
            startValue: vm.v[col.key] || '', ver: vm.row.ver
        };
        this.scrollIntoView(this.active.r, this.active.c);
        this.edListIdx = -1;
        this.edPreview = '';
        this.edListOpen = false;
        this.edList = [];
        if (col.kind === 'choice') {
            this.buildChoiceList(mode === 'enter' ? value : '', openList || mode === 'enter');
        }
        if (col.kind === 'date') {
            this.updatePreview(value);
        }
        const sc = this.scrollerRef.nativeElement;
        const cellBottom = this.active.r < this.nFR
            ? HEAD_H + (this.active.r + 1) * ROW_H
            : this.bandH + (this.active.r - this.nFR + 1) * ROW_H - sc.scrollTop;
        this.edListUp = cellBottom + 200 > sc.clientHeight && cellBottom > 240;
        this.computeGeo();
        this.cdr.detectChanges(); // render the editor now so it takes the next keystroke
    }

    private attachEditor(el: HTMLTextAreaElement): void {
        const ed = this.editing;
        if (!ed) {
            return;
        }
        el.value = ed.initial;
        const onKey = (e: KeyboardEvent) => this.onEditorKey(e, el);
        const onInput = () => this.onEditorInput(el);
        const onBlur = () => {
            // switching to another window / tab blurs too: keep the edit, the browser gives focus back
            if (!document.hasFocus()) {
                return;
            }
            if (this.editing && !this.keepEditOnBlur && !this.destroyed) {
                this.zone.run(() => this.commitEdit('none', false));
            }
        };
        this.zone.runOutsideAngular(() => {
            el.addEventListener('keydown', onKey);
            el.addEventListener('input', onInput);
            el.addEventListener('blur', onBlur);
        });
        this.edCleanup = () => {
            el.removeEventListener('keydown', onKey);
            el.removeEventListener('input', onInput);
            el.removeEventListener('blur', onBlur);
        };
        el.focus({ preventScroll: true });
        const n = el.value.length;
        el.setSelectionRange(n, n);
        this.autosize(el);
    }

    private detachEditor(): void {
        if (this.edCleanup) {
            this.edCleanup();
            this.edCleanup = null;
        }
    }

    private autosize(el: HTMLTextAreaElement): void {
        const ed = this.editing;
        const col = ed ? this.cols[ed.c] : null;
        if (!col) {
            return;
        }
        const minW = col.w + 1;
        if (!this.measureCtx) {
            this.measureCtx = document.createElement('canvas').getContext('2d');
        }
        let w = minW;
        if (this.measureCtx) {
            const cs = getComputedStyle(el);
            this.measureCtx.font = cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily;
            for (const line of el.value.split('\n')) {
                w = Math.max(w, this.measureCtx.measureText(line).width + 22);
            }
        }
        el.style.width = Math.min(Math.max(minW, w), Math.max(minW, 460)) + 'px';
        el.style.height = ROW_H + 'px';
        const h = Math.min(Math.max(ROW_H, el.scrollHeight + 2), 260);
        el.style.height = h + 'px';
    }

    private onEditorKey(e: KeyboardEvent, el: HTMLTextAreaElement): void {
        const ed = this.editing;
        if (!ed) {
            return;
        }
        const k = e.key;
        const ctrl = e.ctrlKey || e.metaKey;
        if (k === 'Escape') {
            e.preventDefault();
            if (this.edListOpen && ed.kind === 'choice' && this.edList.length) {
                this.zone.run(() => this.edListOpen = false);
                return;
            }
            this.zone.run(() => this.cancelEdit());
            return;
        }
        if (k === 'Enter') {
            e.preventDefault();
            if (e.altKey || ctrl) {
                this.insertAtCaret(el, '\n');
                return;
            }
            if (this.edListOpen && this.edListIdx >= 0 && this.edList[this.edListIdx] !== undefined) {
                el.value = this.edList[this.edListIdx];
            }
            this.zone.run(() => this.commitEdit(e.shiftKey ? 'up' : 'down'));
            return;
        }
        if (k === 'Tab') {
            e.preventDefault();
            if (this.edListOpen && this.edListIdx >= 0 && this.edList[this.edListIdx] !== undefined) {
                el.value = this.edList[this.edListIdx];
            }
            this.zone.run(() => this.commitEdit(e.shiftKey ? 'left' : 'right'));
            return;
        }
        if (this.edListOpen && this.edList.length && (k === 'ArrowDown' || k === 'ArrowUp')) {
            e.preventDefault();
            this.zone.run(() => {
                const n = this.edList.length;
                this.edListIdx = k === 'ArrowDown' ? (this.edListIdx + 1) % n : (this.edListIdx <= 0 ? n - 1 : this.edListIdx - 1);
                this.scrollListIntoView();
            });
            return;
        }
        if (ed.kind === 'choice' && e.altKey && k === 'ArrowDown') {
            e.preventDefault();
            this.zone.run(() => this.buildChoiceList('', true));
            return;
        }
        if (ed.mode === 'enter' && !e.shiftKey && !ctrl && !e.altKey &&
            (k === 'ArrowUp' || k === 'ArrowDown' || k === 'ArrowLeft' || k === 'ArrowRight')) {
            e.preventDefault();
            const m: Move = k === 'ArrowUp' ? 'up' : k === 'ArrowDown' ? 'down' : k === 'ArrowLeft' ? 'left' : 'right';
            this.zone.run(() => this.commitEdit(m, true, true));
            return;
        }
        if (k === 'F2') {
            e.preventDefault();
            ed.mode = ed.mode === 'enter' ? 'edit' : 'enter';
            return;
        }
        if (ctrl && k === ';') {
            e.preventDefault();
            this.insertAtCaret(el, todayText());
            return;
        }
    }

    private insertAtCaret(el: HTMLTextAreaElement, text: string): void {
        let done = false;
        try {
            done = document.execCommand && document.execCommand('insertText', false, text);
        } catch {
            done = false;
        }
        if (!done) {
            el.setRangeText(text, el.selectionStart, el.selectionEnd, 'end');
            this.onEditorInput(el);
        }
    }

    private onEditorInput(el: HTMLTextAreaElement): void {
        const ed = this.editing;
        if (!ed) {
            return;
        }
        this.autosize(el);
        if (ed.kind === 'choice') {
            const v = el.value;
            this.zone.run(() => this.buildChoiceList(v, true));
        } else if (ed.kind === 'date') {
            const v = el.value;
            this.zone.run(() => this.updatePreview(v));
        }
    }

    private updatePreview(v: string): void {
        const t = (v || '').trim();
        if (!t) {
            this.edPreview = 'dd-mm-yyyy · a range or a note is kept as typed';
            return;
        }
        const p = parseDateText(t);
        this.edPreview = p ? '→ ' + formatParts(p) : 'Not a date · kept as typed';
    }

    private buildChoiceList(typed: string, open: boolean): void {
        const ed = this.editing;
        const col = ed ? this.cols[ed.c] : null;
        if (!col) {
            return;
        }
        const seen = new Set<string>();
        const all: string[] = [];
        for (const ch of col.src.choices || []) {
            const s = (ch || '').trim();
            if (s && !seen.has(s.toUpperCase())) {
                seen.add(s.toUpperCase());
                all.push(s);
            }
        }
        // values already used in the column (most used first)
        const counts = new Map<string, number>();
        for (const r of this.rows || []) {
            const s = ((r.values && r.values[col.key]) || '').trim();
            if (s && s.indexOf('\n') < 0 && !seen.has(s.toUpperCase())) {
                counts.set(s, (counts.get(s) || 0) + 1);
            }
        }
        const used = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 200).map(x => x[0]);
        for (const s of used) {
            if (!seen.has(s.toUpperCase())) {
                seen.add(s.toUpperCase());
                all.push(s);
            }
        }
        const q = (typed || '').trim().toLowerCase();
        let list = q ? all.filter(s => s.toLowerCase().indexOf(q) >= 0) : all;
        if (q) {
            const rank = (v: string) => {
                const l = v.toLowerCase();
                return l === q ? 0 : l.startsWith(q) ? 1 : 2;
            };
            list = list.slice().sort((a, b) => rank(a) - rank(b));
        }
        this.edList = list.slice(0, 60);
        this.edListOpen = open && this.edList.length > 0 && !(this.edList.length === 1 && this.edList[0].toLowerCase() === q);
        // Enter / Tab take the highlighted value: only highlight what the typed text starts
        this.edListIdx = q && this.edList.length && this.edList[0].toLowerCase().startsWith(q) ? 0 : -1;
    }

    private scrollListIntoView(): void {
        setTimeout(() => {
            const li = this.host.nativeElement.querySelector('.sg-list .on') as HTMLElement | null;
            if (li && (li as any).scrollIntoView) {
                li.scrollIntoView({ block: 'nearest' });
            }
        });
    }

    onListDown(e: MouseEvent, v: string): void {
        e.preventDefault();
        e.stopPropagation();
        if (this.edEl) {
            this.edEl.value = v;
        }
        this.commitEdit('down');
    }

    private normalise(raw: string, col: GCol, paste: boolean): string {
        const s = raw === null || raw === undefined ? '' : String(raw);
        if (col.kind === 'date') {
            return normaliseDateOrNote(s, { paste }).value;
        }
        if (col.kind === 'num') {
            return s.trim();
        }
        if (col.kind === 'choice') {
            // a listed choice typed in another case is stored as listed (skd -> SKD)
            const t = s.trim();
            const u = t.toUpperCase();
            const hit = (col.src.choices || []).find(ch => (ch || '').toUpperCase() === u);
            return hit !== undefined ? hit : t;
        }
        return s.replace(/\r\n?/g, '\n');
    }

    /**
     * Ends the edit. move: where the active cell goes next (Sheets: Enter down, Tab right ...).
     * arrowMove: the edit ended with an arrow key in enter mode (moves without the Tab/Enter rules).
     */
    commitEdit(move: Move, refocus = true, arrowMove = false): void {
        const ed = this.editing;
        if (!ed) {
            return;
        }
        const raw = this.edEl ? this.edEl.value : ed.initial;
        this.closeEditor();
        const vm = this.vmById.get(ed.rowId);
        const col = this.colByKey(ed.key);
        if (vm && col) {
            const value = this.normalise(raw, col, false);
            // compared with the value the user started from: a change made meanwhile by someone
            // else is not reverted, and the page sees the old value / version it can check
            if (value !== ed.startValue) {
                const reason = this.blockReason(vm, col);
                if (reason) {
                    this.flash(col.header + ': ' + reason, true);
                } else {
                    this.mark = null;
                    this.emitEdits([mkEdit(ed.rowId, ed.key, ed.startValue, value, ed.ver)], 'typing');
                }
            }
        }
        const r = this.viewIndex.has(ed.rowId) ? this.viewIndex.get(ed.rowId)! : ed.r;
        const c = col ? col.i : ed.c;
        const lastR = Math.max(0, this.view.length - 1);
        const lastC = Math.max(0, this.cols.length - 1);
        if (move === 'none') {
            this.tabStart = null;
        } else if (!arrowMove && !isSingleCell(this.sel) && !this.isWholeMerge(this.sel)) {
            // typing into a selected range: Enter / Tab walk inside it
            const p = this.moveWithinMerged(this.sel, { r, c }, move);
            this.setSel(this.anchor, this.ext, p, this.selMode, true);
        } else {
            let p: CellPos;
            if (move === 'right' || move === 'left') {
                // Tab, Tab, Enter returns to the column where the Tabs started (Sheets / Excel)
                this.tabStart = arrowMove ? null : (this.tabStart === null ? c : this.tabStart);
                p = this.step({ r, c }, 0, move === 'right' ? 1 : -1);
            } else {
                const back = move === 'down' && !arrowMove && this.tabStart !== null ? this.tabStart : c;
                this.tabStart = null;
                const q = this.step({ r, c }, move === 'down' ? 1 : -1, 0);
                p = { r: q.r, c: clamp(back, 0, lastC) };
            }
            this.setSel(p, p, p, 'cells', true);
        }
        if (refocus) {
            this.focusSink();
        }
    }

    cancelEdit(): void {
        this.closeEditor();
        this.focusSink();
    }

    private closeEditor(): void {
        this.detachEditor();
        this.editing = null;
        this.edList = [];
        this.edListOpen = false;
        this.edListIdx = -1;
        this.edPreview = '';
    }

    /* ================================================================ writes */

    /**
     * Turns target cells into edits, skipping cells that cannot be edited or do not change.
     * One call = one user action = one `edits` emission = one undo step.
     */
    private collect(cells: { r: number; c: number; value: string }[]): { edits: SheetEdit[]; blocked: number; reason: string } {
        const out: SheetEdit[] = [];
        let blocked = 0;
        let reason = '';
        for (const x of cells) {
            const vm = this.view[x.r];
            const col = this.cols[x.c];
            if (!vm || !col || this.isCovered(x.r, x.c)) {
                continue; // a cell hidden under a merge: only the merge's top-left cell is written
            }
            const old = vm.v[col.key] || '';
            if (old === x.value) {
                continue;
            }
            const why = this.blockReason(vm, col);
            if (why) {
                blocked++;
                if (!reason) {
                    reason = col.header + ': ' + why;
                }
                continue;
            }
            out.push(mkEdit(vm.id, col.key, old, x.value, vm.row.ver));
        }
        return { edits: out, blocked, reason };
    }

    /** emits one user action and records it as one undo step (returned) */
    private emitEdits(list: SheetEdit[], label: string): UndoEntry | null {
        const real = list.filter(e => (e.oldValue || '') !== (e.newValue || ''));
        if (!real.length) {
            return null;
        }
        const entry = this.undoStack.push(real, label);
        this.edits.emit(real);
        return entry;
    }

    private withVer(list: SheetEdit[]): SheetEdit[] {
        return list.map(e => {
            const row = this.rowById.get(e.rowId);
            return row && row.ver !== undefined ? { ...e, ver: row.ver } : e;
        });
    }

    private writeCells(cells: { r: number; c: number; value: string }[], label: string, normalise: boolean): void {
        if (this.readOnly) {
            this.flash('This sheet is read-only.');
            return;
        }
        const list = normalise ? cells.map(x => ({ ...x, value: this.normalise(x.value, this.cols[x.c], false) })) : cells;
        const res = this.collect(list);
        this.mark = null;
        this.emitEdits(res.edits, label);
        this.reportBlocked(res.blocked, res.reason, res.edits.length);
    }

    private reportBlocked(blocked: number, reason: string, done: number): void {
        if (!blocked) {
            return;
        }
        if (!done && blocked === 1) {
            this.flash(reason, true);
        } else {
            this.flash(blocked + (blocked === 1 ? ' cell was' : ' cells were') + ' not changed (locked). ' + reason, true);
        }
    }

    clearSelection(): void {
        if (this.readOnly) {
            this.flash('This sheet is read-only.');
            return;
        }
        const cells: { r: number; c: number; value: string }[] = [];
        for (let r = this.sel.r0; r <= this.sel.r1 && r < this.view.length; r++) {
            const v = this.view[r].v;
            for (let c = this.sel.c0; c <= this.sel.c1 && c < this.cols.length; c++) {
                if (v[this.cols[c].key]) {
                    cells.push({ r, c, value: '' });
                }
            }
        }
        this.writeCells(cells, 'clear', false);
    }

    fillDown(): void {
        const s = this.sel;
        const cells: { r: number; c: number; value: string }[] = [];
        const srcR = s.r0 === s.r1 ? s.r0 - 1 : s.r0;
        if (srcR < 0) {
            return;
        }
        const from = s.r0 === s.r1 ? s.r0 : s.r0 + 1;
        for (let c = s.c0; c <= s.c1; c++) {
            const v = this.view[srcR].v[this.cols[c].key] || '';
            for (let r = from; r <= s.r1; r++) {
                cells.push({ r, c, value: v });
            }
        }
        this.writeCells(cells, 'fill', false);
    }

    fillRight(): void {
        const s = this.sel;
        const cells: { r: number; c: number; value: string }[] = [];
        const srcC = s.c0 === s.c1 ? s.c0 - 1 : s.c0;
        if (srcC < 0) {
            return;
        }
        const from = s.c0 === s.c1 ? s.c0 : s.c0 + 1;
        for (let r = s.r0; r <= s.r1; r++) {
            const vr = this.view[r].v;
            const v = vr[this.cols[srcC].key] || '';
            for (let c = from; c <= s.c1; c++) {
                // a date copied into a non-date column stays text; into a date column it is normalised
                cells.push({ r, c, value: this.normalise(v, this.cols[c], false) });
            }
        }
        this.writeCells(cells, 'fill', false);
    }

    private applyFill(range: CellRange, dir: FillDir): void {
        const s = this.sel;
        const cells: { r: number; c: number; value: string }[] = [];
        if (dir === 'down' || dir === 'up') {
            const n = dir === 'down' ? range.r1 - s.r1 : s.r0 - range.r0;
            for (let c = s.c0; c <= s.c1; c++) {
                const key = this.cols[c].key;
                const src: string[] = [];
                for (let r = s.r0; r <= s.r1; r++) {
                    src.push(this.view[r].v[key] || '');
                }
                const vals = fillSeries(dir === 'down' ? src : src.slice().reverse(), n, this.cols[c].kind);
                for (let k = 0; k < n; k++) {
                    cells.push({ r: dir === 'down' ? s.r1 + 1 + k : s.r0 - 1 - k, c, value: vals[k] });
                }
            }
        } else {
            const n = dir === 'right' ? range.c1 - s.c1 : s.c0 - range.c0;
            for (let r = s.r0; r <= s.r1; r++) {
                const v = this.view[r].v;
                const src: string[] = [];
                for (let c = s.c0; c <= s.c1; c++) {
                    src.push(v[this.cols[c].key] || '');
                }
                const kinds = new Set(this.cols.slice(s.c0, s.c1 + 1).map(x => x.kind));
                const kind = kinds.size === 1 ? this.cols[s.c0].kind : 'text';
                const vals = fillSeries(dir === 'right' ? src : src.slice().reverse(), n, kind);
                for (let k = 0; k < n; k++) {
                    const c = dir === 'right' ? s.c1 + 1 + k : s.c0 - 1 - k;
                    cells.push({ r, c, value: this.normalise(vals[k], this.cols[c], false) });
                }
            }
        }
        this.writeCells(cells, 'fill', false);
        this.setSel({ r: range.r0, c: range.c0 }, { r: range.r1, c: range.c1 }, this.active, 'cells', false);
    }

    /** double-click on the fill handle: fill down as far as the neighbouring column has data */
    private fillToEdge(): void {
        const s = this.sel;
        const nR = this.view.length;
        const filled = (r: number, c: number) => c >= 0 && c < this.cols.length && !!(this.view[r].v[this.cols[c].key] || '').trim();
        let end = s.r1;
        for (const c of [s.c0 - 1, s.c1 + 1]) {
            let r = s.r1;
            while (r + 1 < nR && filled(r + 1, c)) {
                r++;
            }
            if (r > end) {
                end = r;
                break;
            }
        }
        if (end > s.r1) {
            this.applyFill({ ...s, r1: end }, 'down');
        }
    }

    /* ---------------------------------------------------------------- undo */

    private doUndo(redo: boolean): void {
        if (this.readOnly) {
            return;
        }
        const cur = (rowId: SheetRowId, key: string) => {
            const row = this.rowById.get(rowId);
            return row ? ((row.values && row.values[key]) || '') : undefined;
        };
        const res = redo ? this.undoStack.redo(cur) : this.undoStack.undo(cur);
        if (!res) {
            this.flash(redo ? 'Nothing to redo.' : 'Nothing to undo.');
            return;
        }
        this.mark = null;
        if (res.edits.length) {
            this.edits.emit(this.withVer(res.edits));
            // select what changed
            let r0 = Infinity, r1 = -1, c0 = Infinity, c1 = -1;
            for (const e of res.edits) {
                const r = this.viewIndex.get(e.rowId);
                const c = this.cols.findIndex(x => x.key === e.key);
                if (r !== undefined && c >= 0) {
                    r0 = Math.min(r0, r); r1 = Math.max(r1, r);
                    c0 = Math.min(c0, c); c1 = Math.max(c1, c);
                }
            }
            if (r1 >= 0) {
                this.setSel({ r: r0, c: c0 }, { r: r1, c: c1 }, { r: r0, c: c0 }, 'cells', true);
            }
        }
        if (res.skipped) {
            this.flash((redo ? 'Redo' : 'Undo') + ': ' + res.skipped + (res.skipped === 1 ? ' cell was' : ' cells were') +
                ' changed since (or the row is gone) and left as is.');
        } else if (!res.edits.length) {
            this.flash(redo ? 'Nothing left to redo in that step.' : 'Nothing left to undo in that step.');
        }
    }

    /* ================================================================ clipboard */

    private selBlock(g: CellRange = this.sel): string[][] {
        const out: string[][] = [];
        for (let r = g.r0; r <= g.r1 && r < this.view.length; r++) {
            const v = this.view[r].v;
            const line: string[] = [];
            for (let c = g.c0; c <= g.c1 && c < this.cols.length; c++) {
                line.push(this.isCovered(r, c) ? '' : (v[this.cols[c].key] || ''));
            }
            out.push(line);
        }
        return out;
    }

    private markSelection(text: string, cut: boolean): void {
        const info = this.selInfo();
        this.mark = { ids: info.rowIds, keys: info.keys, text, cut };
    }

    onCopy(e: ClipboardEvent): void {
        if (this.editing || !this.view.length) {
            return;
        }
        e.preventDefault();
        const block = this.selBlock();
        const text = toTsv(block);
        if (e.clipboardData) {
            e.clipboardData.setData('text/plain', text);
            e.clipboardData.setData('text/html', toHtmlTable(block));
        }
        this.markSelection(text, false);
    }

    onCut(e: ClipboardEvent): void {
        if (this.editing || !this.view.length) {
            return;
        }
        e.preventDefault();
        if (this.readOnly) {
            this.onCopy(e);
            return;
        }
        const block = this.selBlock();
        const text = toTsv(block);
        if (e.clipboardData) {
            e.clipboardData.setData('text/plain', text);
            e.clipboardData.setData('text/html', toHtmlTable(block));
        }
        this.markSelection(text, true);
    }

    onPaste(e: ClipboardEvent): void {
        if (this.editing) {
            return;
        }
        e.preventDefault();
        const text = e.clipboardData ? e.clipboardData.getData('text/plain') : '';
        this.pasteText(text);
    }

    copyViaMenu(cut: boolean): void {
        this.closeMenus();
        const block = this.selBlock();
        const text = toTsv(block);
        const nav: any = navigator;
        const done = () => this.zone.run(() => {
            this.markSelection(text, cut && !this.readOnly);
        });
        const fail = () => this.zone.run(() => this.flash('The browser blocked the clipboard - use Ctrl+' + (cut ? 'X' : 'C') + '.'));
        try {
            const W: any = (window as any).ClipboardItem;
            if (nav.clipboard && nav.clipboard.write && W) {
                const item = new W({
                    'text/plain': new Blob([text], { type: 'text/plain' }),
                    'text/html': new Blob([toHtmlTable(block)], { type: 'text/html' })
                });
                nav.clipboard.write([item]).then(done, () => nav.clipboard.writeText(text).then(done, fail));
            } else if (nav.clipboard && nav.clipboard.writeText) {
                nav.clipboard.writeText(text).then(done, fail);
            } else {
                fail();
            }
        } catch {
            fail();
        }
        this.focusSink();
    }

    pasteViaMenu(): void {
        this.closeMenus();
        const nav: any = navigator;
        if (!nav.clipboard || !nav.clipboard.readText) {
            this.flash('Use Ctrl+V to paste.');
            return;
        }
        nav.clipboard.readText().then(
            (t: string) => this.zone.run(() => this.pasteText(t)),
            () => this.zone.run(() => this.flash('The browser blocked the clipboard - use Ctrl+V to paste.')));
        this.focusSink();
    }

    /** Paste a TSV block at the selection (tiling over a larger selection; rows past the end are inserted first). */
    pasteText(text: string): void {
        const block = parseTsv(text);
        if (!block.length || !block[0].length) {
            return;
        }
        if (this.readOnly) {
            this.flash('This sheet is read-only.');
            return;
        }
        const nC = this.cols.length;
        if (!nC) {
            return;
        }
        const sel = this.view.length ? this.sel : { r0: 0, c0: 0, r1: 0, c1: 0 };
        const size = pasteSize(block.length, block[0].length, sel);
        const r0 = sel.r0;
        const c0 = sel.c0;
        const ncols = Math.min(size.cols, nC - c0);
        const inView = Math.max(0, Math.min(size.rows, this.view.length - r0));
        const overflow = size.rows - inView;
        const bw = block[0].length;
        const valueAt = (i: number, j: number) => block[i % block.length][j % bw] || '';
        const cells: { r: number; c: number; value: string }[] = [];
        for (let i = 0; i < inView; i++) {
            for (let j = 0; j < ncols; j++) {
                cells.push({ r: r0 + i, c: c0 + j, value: this.normalise(valueAt(i, j), this.cols[c0 + j], true) });
            }
        }
        const res = this.collect(cells);
        const notes: string[] = [];
        // cut + paste = move: clear the source cells the paste did not overwrite - only when the whole
        // block landed (nothing locked, nothing cut off, no rows still to be added), else it stays a copy
        const isMove = !!(this.mark && this.mark.cut && this.mark.text === text);
        if (isMove && (res.blocked > 0 || ncols < size.cols || overflow > 0)) {
            notes.push('Pasted as a copy - the cut cells were kept because not all of them could be moved.');
            this.mark = null;
        } else if (isMove && this.mark) {
            const dest = new Set(cells.map(x => this.view[x.r].id + '\u0001' + this.cols[x.c].key));
            for (const id of this.mark.ids) {
                const vm = this.vmById.get(id);
                if (!vm) {
                    continue;
                }
                for (const key of this.mark.keys) {
                    const col = this.colByKey(key);
                    if (!col || dest.has(id + '\u0001' + key) || !vm.v[key]) {
                        continue;
                    }
                    if (this.blockReason(vm, col)) {
                        continue; // a locked source simply stays (its value was copied)
                    }
                    res.edits.push(mkEdit(id, key, vm.v[key] || '', '', vm.row.ver));
                }
            }
            this.mark = null;
        } else if (this.mark && !this.mark.cut) {
            // Sheets keeps the copy marquee after a paste, so the block can be pasted again
        }
        let pend: Pending | null = null;
        if (overflow > 0) {
            const afterId = this.view.length ? this.view[this.view.length - 1].id : null;
            const vals: string[][] = [];
            for (let i = inView; i < size.rows; i++) {
                const line: string[] = [];
                for (let j = 0; j < ncols; j++) {
                    line.push(this.normalise(valueAt(i, j), this.cols[c0 + j], true));
                }
                vals.push(line);
            }
            pend = { kind: 'paste', afterId, count: overflow, expires: Date.now() + PENDING_MS, values: vals, c0, r0, entry: null };
            this.addPending(pend);
            this.rowOp.emit({ op: 'insert', rowIds: [], afterId, count: overflow });
        }
        const entry = this.emitEdits(res.edits, 'paste');
        if (pend) {
            pend.entry = entry;
        }
        if (this.view.length) {
            this.setSel({ r: r0, c: c0 }, { r: r0 + Math.max(0, inView - 1), c: c0 + ncols - 1 }, { r: r0, c: c0 }, 'cells', false);
        }
        if (ncols < size.cols) {
            notes.push((size.cols - ncols) + ' column(s) did not fit and were left out.');
        }
        if (overflow > 0) {
            notes.push('Adding ' + overflow + (overflow === 1 ? ' row' : ' rows') + ' for the rest of the paste.');
        }
        if (res.blocked) {
            notes.push(res.blocked + (res.blocked === 1 ? ' locked cell was' : ' locked cells were') + ' skipped. ' + res.reason);
        }
        if (notes.length) {
            this.flash(notes.join(' '), res.blocked > 0);
        }
    }

    private addPending(p: Pending): void {
        this.pendings.push(p);
        // the rows never came (insert refused / failed): say so instead of applying them to other rows later
        this.zone.runOutsideAngular(() => setTimeout(() => {
            if (this.destroyed || this.pendings.indexOf(p) < 0) {
                return;
            }
            this.zone.run(() => {
                this.pendings = this.pendings.filter(x => x !== p);
                if (p.kind === 'paste') {
                    this.flash('The new rows for the paste did not arrive - ' + p.count + ' pasted row(s) were not applied.');
                }
            });
        }, PENDING_MS + 50));
    }

    /**
     * New rows arrived after rowOp inserts. A waiting insert takes only the run of new rows placed
     * right after its afterId (rows someone else added elsewhere are left alone) and keeps waiting
     * when its rows are not there yet.
     */
    private completePendings(newIds: Set<SheetRowId>): void {
        const rows = this.rows || [];
        const claimed = new Set<SheetRowId>();
        const now = Date.now();
        for (const p of this.pendings.slice()) {
            if (now > p.expires) {
                this.pendings = this.pendings.filter(x => x !== p);
                continue;
            }
            const start = p.afterId === null ? 0 : (this.modelIndex.has(p.afterId) ? this.modelIndex.get(p.afterId)! + 1 : -1);
            if (start < 0) {
                continue;
            }
            const run: SheetRowVM[] = [];
            for (let i = start; i < rows.length && run.length < p.count; i++) {
                const id = rows[i].id;
                if (!newIds.has(id) || claimed.has(id)) {
                    break;
                }
                const vm = this.vmById.get(id);
                if (vm) {
                    run.push(vm);
                }
                claimed.add(id);
            }
            if (!run.length) {
                continue; // not these rows: keep waiting
            }
            this.pendings = this.pendings.filter(x => x !== p);
            this.finishPending(p, run);
        }
    }

    private finishPending(p: Pending, use: SheetRowVM[]): void {
        if (p.kind === 'select') {
            const r = this.viewIndex.get(use[0].id)!;
            const c = clamp(p.col || 0, 0, Math.max(0, this.cols.length - 1));
            const r1 = this.viewIndex.get(use[use.length - 1].id)!;
            this.setSel({ r, c }, { r: r1, c }, { r, c }, 'cells', true);
            return;
        }
        const out: SheetEdit[] = [];
        let blocked = 0;
        let reason = '';
        use.forEach((vm, i) => {
            const line = p.values![i] || [];
            line.forEach((value, j) => {
                const col = this.cols[p.c0! + j];
                if (!col) {
                    return;
                }
                const old = vm.v[col.key] || '';
                if (old === value) {
                    return;
                }
                const why = this.blockReason(vm, col);
                if (why) {
                    blocked++;
                    reason = reason || col.header + ': ' + why;
                    return;
                }
                out.push(mkEdit(vm.id, col.key, old, value, vm.row.ver));
            });
        });
        const real = out.filter(e => e.oldValue !== e.newValue);
        if (real.length) {
            // same undo step as the first part of the paste; dropped if that step was undone meanwhile
            if (!this.undoStack.extendEntry(p.entry || null, real)) {
                return;
            }
            this.edits.emit(real);
        }
        const lastR = this.viewIndex.get(use[use.length - 1].id)!;
        const ncols = p.values![0] ? p.values![0].length : 1;
        if (p.r0! < this.view.length) {
            this.setSel({ r: p.r0!, c: p.c0! }, { r: Math.max(lastR, p.r0!), c: p.c0! + ncols - 1 }, { r: p.r0!, c: p.c0! }, 'cells', false);
        }
        this.reportBlocked(blocked, reason, real.length);
    }

    /* ================================================================ rows */

    private modelOrdered(ids: SheetRowId[]): SheetRowId[] {
        return ids.slice().sort((a, b) => (this.modelIndex.get(a) || 0) - (this.modelIndex.get(b) || 0));
    }

    insertRows(where: 'above' | 'below'): void {
        this.closeMenus();
        if (this.readOnly) {
            return;
        }
        const ids = this.selectedRowIds();
        const count = Math.max(1, ids.length);
        let afterId: SheetRowId | null;
        if (!this.view.length) {
            afterId = null;
        } else if (where === 'below') {
            afterId = ids.length ? ids[ids.length - 1] : this.view[this.view.length - 1].id;
        } else {
            const first = this.modelOrdered(ids)[0];
            const mi = this.modelIndex.get(first) || 0;
            afterId = mi > 0 ? this.rows[mi - 1].id : null;
        }
        this.addPending({ kind: 'select', afterId, count, expires: Date.now() + PENDING_MS, col: this.active.c });
        this.rowOp.emit({ op: 'insert', rowIds: [], afterId, count });
        this.focusSink();
    }

    addRowsAtEnd(n: number): void {
        if (this.readOnly) {
            return;
        }
        const count = Math.max(1, Math.min(500, n | 0));
        const afterId = this.rows && this.rows.length ? this.rows[this.rows.length - 1].id : null;
        this.addPending({ kind: 'select', afterId, count, expires: Date.now() + PENDING_MS, col: this.active.c });
        this.rowOp.emit({ op: 'insert', rowIds: [], afterId, count });
        this.focusSink();
    }

    duplicateRows(): void {
        this.closeMenus();
        if (this.readOnly) {
            return;
        }
        const ids = this.selectedRowIds();
        if (!ids.length) {
            return;
        }
        this.rowOp.emit({ op: 'duplicate', rowIds: ids, afterId: ids[ids.length - 1], count: ids.length });
        this.focusSink();
    }

    askDelete(): void {
        this.closeMenus();
        if (this.readOnly) {
            return;
        }
        const ids = this.selectedRowIds();
        if (ids.length) {
            this.confirmDel = { rowIds: ids };
        }
        this.focusSink();
    }

    doDelete(): void {
        const d = this.confirmDel;
        this.confirmDel = null;
        if (d && d.rowIds.length) {
            this.rowOp.emit({ op: 'delete', rowIds: d.rowIds, afterId: null, count: d.rowIds.length });
        }
        this.focusSink();
    }

    get canMoveRows(): boolean {
        return !this.readOnly && !this.sort && this.filterCount === 0 && this.view.length > 1;
    }

    moveRows(dir: 'up' | 'down'): void {
        this.closeMenus();
        if (!this.canMoveRows) {
            return;
        }
        const ids = this.modelOrdered(this.selectedRowIds());
        if (!ids.length) {
            return;
        }
        const first = this.modelIndex.get(ids[0])!;
        const last = this.modelIndex.get(ids[ids.length - 1])!;
        let afterId: SheetRowId | null;
        if (dir === 'up') {
            if (first === 0) {
                return;
            }
            afterId = first - 2 >= 0 ? this.rows[first - 2].id : null;
        } else {
            if (last >= this.rows.length - 1) {
                return;
            }
            afterId = this.rows[last + 1].id;
        }
        this.rowOp.emit({ op: 'move', rowIds: ids, afterId, count: ids.length });
        // the selection is keyed by row id, so it follows the rows when the parent feeds them back
        this.followActive = true;
        this.focusSink();
    }

    setStatus(code: string | null): void {
        this.closeMenus();
        const ids = this.selectedRowIds();
        if (ids.length && !this.readOnly) {
            this.fmtChange.emit({ kind: 'row', rowIds: ids, status: code });
        }
        this.focusSink();
    }

    runContext(item: SheetContextItem): void {
        if (item.disabled) {
            return;
        }
        this.closeMenus();
        const col = this.cols[this.active.c];
        this.contextAction.emit({ action: item.action, rowIds: this.selectedRowIds(), key: col ? col.key : null });
        this.focusSink();
    }

    /* ---------------------------------------------------------------- formats */

    private selCellsFmt(apply: (cur: CellFmt) => CellFmt | null): void {
        if (this.readOnly) {
            this.flash('This sheet is read-only.');
            return;
        }
        const cells: { rowId: SheetRowId; key: string; fmt: CellFmt | null }[] = [];
        for (let r = this.sel.r0; r <= this.sel.r1 && r < this.view.length; r++) {
            const vm = this.view[r];
            for (let c = this.sel.c0; c <= this.sel.c1 && c < this.cols.length; c++) {
                const key = this.cols[c].key;
                const cur = vm.f[key] || {};
                const next = apply(cur);
                const clean = next && (next.bg || next.fg || next.bold) ? next : null;
                const same = (!clean && !cur.bg && !cur.fg && !cur.bold) ||
                    (!!clean && (clean.bg || null) === (cur.bg || null) && (clean.fg || null) === (cur.fg || null) && !!clean.bold === !!cur.bold);
                if (!same) {
                    cells.push({ rowId: vm.id, key, fmt: clean });
                }
            }
        }
        if (cells.length) {
            this.fmtChange.emit({ kind: 'cell', cells });
        }
    }

    toggleBold(): void {
        let allBold = true;
        for (let r = this.sel.r0; r <= this.sel.r1 && r < this.view.length && allBold; r++) {
            for (let c = this.sel.c0; c <= this.sel.c1 && c < this.cols.length; c++) {
                const f = this.view[r].f[this.cols[c].key];
                if (!f || !f.bold) {
                    allBold = false;
                    break;
                }
            }
        }
        this.selCellsFmt(cur => ({ ...cur, bold: !allBold }));
    }

    setCellColour(which: 'bg' | 'fg', colour: string | null): void {
        this.closeMenus();
        this.selCellsFmt(cur => ({ ...cur, [which]: colour }));
        this.focusSink();
    }

    clearFormat(): void {
        this.closeMenus();
        this.selCellsFmt(() => null);
        this.focusSink();
    }

    /* ================================================================ menus */

    closeMenus(): void {
        this.cm = null;
        this.hm = null;
    }

    private hostPoint(clientX: number, clientY: number, w: number, h: number): { x: number; y: number } {
        const r = this.host.nativeElement.getBoundingClientRect();
        let x = clientX - r.left;
        let y = clientY - r.top;
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        if (clientX + w > vw - 8) {
            x = Math.max(4, x - w);
        }
        if (clientY + h > vh - 8) {
            y = Math.max(4, y - Math.min(h, clientY - 8));
        }
        return { x, y };
    }

    private openContextMenu(clientX: number, clientY: number): void {
        this.hm = null;
        const p = this.hostPoint(clientX, clientY, 240, 420);
        this.cm = { x: p.x, y: p.y, rowIds: this.selectedRowIds(), sub: null, canMove: this.canMoveRows };
        this.cmSubLeft = clientX + 240 + 240 > window.innerWidth;
        this.cmSubUp = clientY > window.innerHeight * 0.55;
        this.fitMenu('.sg-cm', this.cm);
    }

    /** after the menu is drawn: move it up / left so it stays inside the window */
    private fitMenu(selector: string, state: { x: number; y: number }): void {
        setTimeout(() => {
            const el = this.host.nativeElement.querySelector(selector) as HTMLElement | null;
            if (!el || (selector === '.sg-cm' ? this.cm !== state : this.hm !== state)) {
                return;
            }
            const r = el.getBoundingClientRect();
            let dy = 0;
            let dx = 0;
            if (r.bottom > window.innerHeight - 4) {
                dy = Math.min(r.bottom - window.innerHeight + 4, r.top - 4);
            }
            if (r.right > window.innerWidth - 4) {
                dx = Math.min(r.right - window.innerWidth + 4, r.left - 4);
            }
            if (dx > 0 || dy > 0) {
                this.zone.run(() => {
                    state.x -= Math.max(0, dx);
                    state.y -= Math.max(0, dy);
                });
            }
        });
    }

    private menuItems(root: Element | null, inSub: boolean): HTMLElement[] {
        if (!root) {
            return [];
        }
        const sel = inSub ? '.sg-sub > .mi:not(:disabled)' : ':scope > .mi:not(:disabled)';
        return Array.from(root.querySelectorAll(sel)) as HTMLElement[];
    }

    /** arrows / Esc inside a menu (Enter and Space click the focused item natively) */
    onMenuKey(e: KeyboardEvent): void {
        const menu = e.currentTarget as HTMLElement;
        const t = e.target as HTMLElement;
        if (e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            this.closeMenus();
            this.focusSink();
            return;
        }
        if (t.tagName === 'INPUT' || t.tagName === 'SELECT') {
            return;
        }
        const inSub = !!t.closest('.sg-sub');
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            const items = this.menuItems(inSub ? t.closest('.sub') : menu, inSub);
            const i = items.indexOf(t);
            const next = items[(i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length];
            if (next) {
                next.focus();
            }
        } else if ((e.key === 'ArrowRight' || e.key === 'Enter' || e.key === ' ') && t.classList.contains('sub') && this.cm) {
            e.preventDefault();
            this.cm.sub = t.getAttribute('data-sub') as any;
            this.cdr.detectChanges();
            const first = this.menuItems(t, true)[0];
            if (first) {
                first.focus();
            }
        } else if (e.key === 'ArrowLeft' && inSub && this.cm) {
            e.preventDefault();
            const parent = t.closest('.sub') as HTMLElement | null;
            this.cm.sub = null;
            if (parent) {
                parent.focus();
            }
        }
    }

    /** ContextMenu key / Shift+F10: the column menu on a column selection, else the row menu */
    private openMenuFromKeyboard(): void {
        if (this.selMode === 'cols') {
            const c = this.cols[this.active.c];
            if (c) {
                this.openHeaderMenu(c);
                return;
            }
        }
        this.openContextMenuAtActive();
    }

    hmClearSort(): void {
        this.hm = null;
        this.clearSort();
        this.focusSink();
    }

    hmFit(key: string): void {
        this.hm = null;
        this.autoFit(key);
        this.focusSink();
    }

    private openContextMenuAtActive(): void {
        const sc = this.scrollerRef.nativeElement;
        const rect = sc.getBoundingClientRect();
        const col = this.cols[this.active.c];
        const x = rect.left + (col.frozen ? col.x : col.x - sc.scrollLeft) + Math.min(col.w, 40);
        const y = this.active.r < this.nFR
            ? rect.top + HEAD_H + (this.active.r + 1) * ROW_H
            : rect.top + this.bandH + (this.active.r - this.nFR + 1) * ROW_H - sc.scrollTop;
        this.openContextMenu(x, y);
    }

    get cmRowCount(): number {
        return this.cm ? this.cm.rowIds.length : 0;
    }

    get cmRowsLabel(): string {
        const n = this.cmRowCount;
        return n === 1 ? '1 row' : n + ' rows';
    }

    get cmItems(): SheetContextItem[] {
        const n = this.cmRowCount;
        return (this.contextItems || []).filter(i => !i.single || n === 1);
    }

    get currentStatus(): string | null {
        if (!this.cm || !this.cm.rowIds.length) {
            return null;
        }
        const r = this.rowById.get(this.cm.rowIds[0]);
        return r ? (r.status || null) : null;
    }

    openHeaderMenu(c: GCol, clientX?: number, clientY?: number): void {
        if (this.editing) {
            this.commitEdit('none');
        }
        this.cm = null;
        const sc = this.scrollerRef.nativeElement;
        const rect = sc.getBoundingClientRect();
        const left = rect.left + (c.frozen ? c.x : c.x - sc.scrollLeft);
        const cx = clientX !== undefined ? clientX : left;
        const cy = clientY !== undefined ? clientY : rect.top + HEAD_H;
        const p = this.hostPoint(cx, cy, 280, 520);
        // values list: rows that pass the other columns' filters (like Sheets)
        const pred = compileFilters(this.filters, this.kindOf, c.key);
        const base = pred ? (this.rows || []).filter(pred) : (this.rows || []);
        const f = this.filters[c.key];
        const allowed = f && Array.isArray(f.values) ? new Set(f.values) : null;
        const excluded = f && Array.isArray(f.exclude) ? new Set(f.exclude) : null;
        const values = distinctValues(base, c.key, c.kind)
            .map(x => ({ ...x, on: (!allowed || allowed.has(x.value)) && (!excluded || !excluded.has(x.value)) }));
        this.hm = {
            col: c, x: p.x, y: p.y, values, search: '',
            op: (f && f.cond && f.cond.op) || '', arg: (f && f.cond && f.cond.value) || '', more: 0
        };
        this.fitMenu('.sg-hm', this.hm);
    }

    onHeaderMenuBtn(e: MouseEvent, c: GCol): void {
        e.preventDefault();
        e.stopPropagation();
        if (this.hm && this.hm.col.key === c.key) {
            this.hm = null;
            return;
        }
        const t = e.currentTarget as HTMLElement;
        const r = t.getBoundingClientRect();
        this.openHeaderMenu(c, r.left, r.bottom + 2);
    }

    get hmList(): { value: string; count: number; on: boolean }[] {
        if (!this.hm) {
            return [];
        }
        const q = this.hm.search.trim().toLowerCase();
        const list = q ? this.hm.values.filter(v => v.value.toLowerCase().indexOf(q) >= 0) : this.hm.values;
        return list.length > 300 ? list.slice(0, 300) : list;
    }

    get hmMore(): number {
        if (!this.hm) {
            return 0;
        }
        const q = this.hm.search.trim().toLowerCase();
        const n = q ? this.hm.values.filter(v => v.value.toLowerCase().indexOf(q) >= 0).length : this.hm.values.length;
        return Math.max(0, n - 300);
    }

    get hmCondArg(): boolean {
        const o = this.hm ? COND_OPS.find(x => x.op === this.hm!.op) : null;
        return !!o && o.arg;
    }

    hmAll(on: boolean): void {
        if (!this.hm) {
            return;
        }
        const q = this.hm.search.trim().toLowerCase();
        for (const v of this.hm.values) {
            if (!q || v.value.toLowerCase().indexOf(q) >= 0) {
                v.on = on;
            }
        }
    }

    hmApply(): void {
        const hm = this.hm;
        if (!hm) {
            return;
        }
        const f: SheetFilter = {};
        const off = hm.values.filter(v => !v.on).map(v => v.value);
        if (off.length) {
            // like Sheets: remember what is hidden, so values added later stay visible
            f.exclude = off;
        }
        if (hm.op) {
            f.cond = { op: hm.op as SheetFilterOp, value: hm.arg };
        }
        const next = { ...this.filters };
        if (isFilterActive(f)) {
            next[hm.col.key] = f;
        } else {
            delete next[hm.col.key];
        }
        this.filters = next;
        this.hm = null;
        this.rebuildView(true);
        this.emitLayout('filter');
        this.focusSink();
    }

    hmClearFilter(): void {
        if (!this.hm) {
            return;
        }
        const next = { ...this.filters };
        delete next[this.hm.col.key];
        this.filters = next;
        this.hm = null;
        this.rebuildView(true);
        this.emitLayout('filter');
        this.focusSink();
    }

    isFiltered(c: GCol): boolean {
        return isFilterActive(this.filters[c.key]);
    }

    sortBy(c: GCol, dir: 'asc' | 'desc'): void {
        this.hm = null;
        this.sort = { key: c.key, dir };
        this.rebuildView(true);
        this.emitLayout('sort');
        this.focusSink();
    }

    hideColumn(c: GCol): void {
        this.hm = null;
        const keys = this.colFull && c.i >= this.sel.c0 && c.i <= this.sel.c1
            ? this.cols.slice(this.sel.c0, this.sel.c1 + 1).map(x => x.key)
            : [c.key];
        if (keys.length >= this.cols.length) {
            this.flash('At least one column must stay visible.');
            return;
        }
        this.saveSelKeys();
        const frozenKeys = new Set(this.fcols.map(x => x.key));
        for (const k of keys) {
            this.hidden.add(k);
            if (frozenKeys.has(k)) {
                this.frozen = Math.max(0, this.frozen - 1);
            }
        }
        this.buildCols();
        this.remapSelection();
        this.emitLayout('hide');
        this.focusSink();
    }

    unhide(keys: string[] | null, e?: MouseEvent): void {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        this.hm = null;
        const list = keys || Array.from(this.hidden);
        if (!list.length) {
            return;
        }
        this.saveSelKeys();
        for (const k of list) {
            this.hidden.delete(k);
        }
        this.buildCols();
        this.remapSelection();
        this.emitLayout('show');
        this.focusSink();
    }

    get hiddenCount(): number {
        return this.hidden.size;
    }

    freezeTo(c: GCol | null): void {
        this.hm = null;
        const n = c ? c.i + 1 : 0;
        if (c) {
            const w = c.x + c.w;
            const sc = this.scrollerRef.nativeElement;
            if (sc.clientWidth && w > sc.clientWidth * 0.7) {
                this.flash('Cannot freeze up to ' + c.header + ': the frozen columns would be wider than the window.');
                return;
            }
        }
        this.saveSelKeys();
        this.frozen = n;
        this.buildCols();
        this.remapSelection();
        this.emitLayout('freeze');
        this.focusSink();
    }

    private emitLayout(reason: SheetLayout['reason']): void {
        const widths: { [k: string]: number } = {};
        for (const c of this.columns || []) {
            widths[c.key] = Math.max(MIN_W, Math.round(this.widths[c.key] || c.width || DEFAULT_W));
        }
        this.layoutChange.emit({
            reason, widths, hidden: Array.from(this.hidden), frozenCols: this.frozen,
            sort: this.sort, filters: { ...this.filters }
        });
    }

    /* ================================================================ find */

    onFindInput(q: string): void {
        this.findQ = q;
        clearTimeout(this.findTimer);
        this.zone.runOutsideAngular(() => {
            this.findTimer = setTimeout(() => this.zone.run(() => this.runFind(false)), 120);
        });
    }

    private runFind(keepIdx: boolean): void {
        const q = (this.findQ || '').trim().toLowerCase();
        const hits: CellPos[] = [];
        if (q) {
            for (let r = 0; r < this.view.length && hits.length < 20000; r++) {
                const v = this.view[r].v;
                for (let c = 0; c < this.cols.length; c++) {
                    const s = v[this.cols[c].key];
                    if (s && s.toLowerCase().indexOf(q) >= 0 && !this.isCovered(r, c)) {
                        hits.push({ r, c });
                    }
                }
            }
        }
        this.findHits = hits;
        if (!hits.length) {
            this.findIdx = -1;
            return;
        }
        if (keepIdx) {
            // a data refresh: recount, but never move the user's cursor
            this.findIdx = this.findIdx >= 0 ? Math.min(this.findIdx, hits.length - 1) : -1;
            return;
        }
        // first hit at or after the active cell
        const a = this.active;
        let idx = hits.findIndex(h => h.r > a.r || (h.r === a.r && h.c >= a.c));
        if (idx < 0) {
            idx = 0;
        }
        this.findIdx = idx;
        const h = hits[idx];
        this.setSel(h, h, h, 'cells', true);
    }

    findStep(d: number): void {
        if (!this.findHits.length) {
            this.runFind(false);
            return;
        }
        const n = this.findHits.length;
        this.findIdx = ((this.findIdx < 0 ? 0 : this.findIdx + d) % n + n) % n;
        const h = this.findHits[this.findIdx];
        this.setSel(h, h, h, 'cells', true);
    }

    onFindKey(e: KeyboardEvent): void {
        if (e.key === 'Enter') {
            e.preventDefault();
            clearTimeout(this.findTimer);
            if (!this.findHits.length || this.findQ.trim().toLowerCase() === '') {
                this.runFind(false);
            } else {
                this.findStep(e.shiftKey ? -1 : 1);
            }
        } else if (e.key === 'Escape') {
            e.preventDefault();
            this.closeFind();
        }
    }

    /* ================================================================ misc */

    flash(msg: string, lock = false): void {
        this.notice = msg;
        this.noticeLock = lock;
        clearTimeout(this.noticeTimer);
        this.zone.runOutsideAngular(() => {
            this.noticeTimer = setTimeout(() => this.zone.run(() => this.notice = null), NOTICE_MS);
        });
    }

    onBarValueClick(): void {
        if (this.view.length) {
            this.startEdit('edit');
        }
    }

    /** DOM counts for performance checks (rows / cells currently rendered) */
    renderStats(): { rows: number; cells: number; cols: number } {
        const el = this.host.nativeElement;
        return {
            rows: el.querySelectorAll('.sg-row').length,
            cells: el.querySelectorAll('.sg-row .sg-c').length,
            cols: this.fcols.length + this.scols.length
        };
    }
}
