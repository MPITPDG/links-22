/*  Public types of <app-sheet-grid> (SHEET_VIEW_CONTRACT.md section 6).
    The grid knows nothing about Links: it renders `rows` and emits user intents
    (edits, row operations, format changes, context actions, layout changes).
    The parent applies them and feeds updated rows back, keyed by `id`.          */

export type SheetCellKind = 'text' | 'num' | 'date' | 'ml' | 'choice';

export type SheetRowId = string | number;

export interface CellFmt {
    bg?: string | null;
    fg?: string | null;
    bold?: boolean;
}

/** Corner marks. 'links' = value comes from Links, 'pending' = not in Links yet, 'flag' = attention. */
export type SheetTag = 'links' | 'pending' | 'flag';

export interface SheetColumn {
    key: string;
    header: string;
    /** px, default 100 */
    width?: number;
    /** default 'text' */
    kind?: SheetCellKind;
    /** suggested values for kind 'choice' (free entry stays allowed) */
    choices?: string[];
    /** leading frozen columns (used when the frozenCols input is not given) */
    frozen?: boolean;
    hidden?: boolean;
    /** default: 'right' for num, else 'left' */
    align?: 'left' | 'right' | 'center';
}

export interface SheetRow {
    id: SheetRowId;
    ver?: number;
    values: { [key: string]: string };
    fmt?: { [key: string]: CellFmt };
    rowFmt?: { bg?: string | null; fg?: string | null };
    /** key -> reason. A locked cell shows a lock glyph, the reason as tooltip, and refuses edits. */
    locked?: { [key: string]: string };
    tags?: { [key: string]: SheetTag };
    /** per-cell tooltip for a tag (e.g. which Links job the value comes from); falls back to tagLabels */
    tagReasons?: { [key: string]: string };
    /** current status code (from `statuses`), only used to tick the row colour menu */
    status?: string | null;
}

/**
 * One cell change. `edits` emits an array of these once per user action.
 * oldValue is the value the user saw when the action started (for typing: when the editor
 * opened) and ver the row's `ver` at that moment, so the page can detect that someone else
 * changed the cell in the meantime (SAVE_CELLS version check / conflict prompt).
 * The page is expected to apply emitted edits to `rows` right away (optimistic update, rolled
 * back if the server refuses): undo and the next edit read the current `rows`.
 */
export interface SheetEdit {
    rowId: SheetRowId;
    key: string;
    oldValue: string;
    newValue: string;
    ver?: number;
}

export type SheetRowOpKind = 'insert' | 'duplicate' | 'delete' | 'move';

/**
 * insert    : `count` empty rows after `afterId` (null = at the top). rowIds = [] .
 * duplicate : copies of rowIds (in this order) inserted as one block after afterId (= the last of rowIds).
 * delete    : rowIds (the grid has already asked for confirmation).
 * move      : place rowIds (in this order) after afterId (null = at the top).
 */
export interface SheetRowOp {
    op: SheetRowOpKind;
    rowIds: SheetRowId[];
    afterId: SheetRowId | null;
    count: number;
}

/** Row status from the legend, or per-cell formats (fmt = the full resulting format, null = clear). */
export type SheetFmtChange =
    | { kind: 'row'; rowIds: SheetRowId[]; status: string | null }
    | { kind: 'cell'; cells: { rowId: SheetRowId; key: string; fmt: CellFmt | null }[] };

/** Row colour legend entry (Colour CODE). */
export interface SheetStatus {
    code: string;
    label: string;
    bg?: string | null;
    fg?: string | null;
}

/** Pass-through item of the row context menu (e.g. "Convert to job"). */
export interface SheetContextItem {
    action: string;
    label: string;
    /** draw a separator above the item */
    divider?: boolean;
    disabled?: boolean;
    /** only offered when exactly one row is selected */
    single?: boolean;
}

export interface SheetContextAction {
    action: string;
    rowIds: SheetRowId[];
    key: string | null;
}

export type SheetFilterOp =
    | 'empty' | 'notEmpty'
    | 'contains' | 'notContains' | 'startsWith' | 'endsWith' | 'equals'
    | 'dateIs' | 'dateBefore' | 'dateAfter'
    | 'gt' | 'lt' | 'eqNum';

export interface SheetFilter {
    /** values hidden by the "filter by values" list ('' = blanks), like Google Sheets (new values stay visible) */
    exclude?: string[] | null;
    /** alternatively: the only values shown ('' = blanks); null / undefined = every value */
    values?: string[] | null;
    cond?: { op: SheetFilterOp; value?: string } | null;
}

export interface SheetSort {
    key: string;
    dir: 'asc' | 'desc';
}

export interface SheetViewState {
    sort?: SheetSort | null;
    filters?: { [key: string]: SheetFilter };
}

export interface SheetLayout {
    reason: 'resize' | 'hide' | 'show' | 'freeze' | 'sort' | 'filter';
    widths: { [key: string]: number };
    hidden: string[];
    frozenCols: number;
    sort: SheetSort | null;
    filters: { [key: string]: SheetFilter };
}

export interface SheetSelectionInfo {
    rowIds: SheetRowId[];
    keys: string[];
    active: { rowId: SheetRowId; key: string } | null;
}

/** canEditCell(row, key): true = editable; a string = refused, the string is the reason shown to the user. */
export type SheetCanEdit = (row: SheetRow, key: string) => boolean | string;
