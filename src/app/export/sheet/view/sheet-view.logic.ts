import {
    CellFmt, SheetColumn, SheetEdit, SheetFmtChange, SheetRow, SheetRowOp, SheetStatus, SheetTag
} from '../sheet-grid/sheet-grid.types';
import {
    COL_BY_KEY, DEFAULT_TABS, GRID_TABS, OPTIONAL_WO_TABS, SHEET_COLUMNS, SheetColDef, SheetTabKind, TAB_WIDTHS, layoutKeys
} from '../sheet-registry';
import { CellEdit, FmtEdit } from '../sheet.service';

/*  Export › Sheet view: the page's pure logic (no Angular, no API), so it can be specced on its own.
    - server rows (LOAD / CHANGES / SAVE_CELLS / ROWS_OP / LINK / GRID_* DataSets) -> one record per row:
      the server's copy + the Links values + the user's unsent local edits, and from that the grid's SheetRow
      (Links lock / tag rules, row colour from the Colour CODE legend, HAZ red, CELL_FMT)
    - the column-ownership hard lock (MY_ROLES)
    - edit batching (queue, batch, rebase after our own save), the SaveCells / GridSave answer
      (rejections roll back, conflicts are collected for the prompt, saved rows merge their new ROWVER)
    - the Changes merge (replace by ID, ISDELETED drops the row, local edits are never overwritten)
    - tabs / columns / personal layouts / the Sri Lanka helper list.
    Records are immutable: a change makes a new record, so the grid re-renders only the rows that changed. */

/** CELL_FMT key of the row format (SAVE_FMT k="*ROW") */
export const ROW_KEY = '*ROW';

export const str = (v: any): string => (v === null || v === undefined) ? '' : String(v);
const code = (v: any): string => str(v).trim();

export function truthy(v: any): boolean {
    return v === true || v === 1 || v === '1' || code(v).toLowerCase() === 'true';
}

export function parseJson<T>(text: any, fallback: T): T {
    if (text === null || text === undefined || text === '') { return fallback; }
    if (typeof text === 'object') { return text as T; }
    try {
        const v = JSON.parse(String(text));
        return v === null || v === undefined ? fallback : v;
    } catch (e) {
        return fallback;
    }
}

/** A procedure answer that is only a status row (an error / not-found table, no data rows). */
export function statusOnly(ds: any): boolean {
    const t = ds && Array.isArray(ds.Table) ? ds.Table : null;
    return !!(t && t.length === 1 && t[0] && t[0].STATUS !== undefined && t[0].ID === undefined);
}

function colour(v: any): string | null {
    const s = code(v);
    return /^#[0-9a-fA-F]{6}$/.test(s) ? s.toLowerCase() : null;
}

/** CELL_FMT `{"KEY":{"bg":"#ff00ff","fg":"#305496","b":1}}` -> the grid's `{KEY: {bg, fg, bold}}`. Junk is skipped. */
export function parseCellFmt(json: any): { [key: string]: CellFmt } {
    const raw = parseJson<any>(json, null);
    const out: { [key: string]: CellFmt } = {};
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) { return out; }
    for (const k of Object.keys(raw)) {
        const f = raw[k];
        if (!f || typeof f !== 'object') { continue; }
        const bg = colour(f.bg), fg = colour(f.fg), bold = truthy(f.b);
        if (!bg && !fg && !bold) { continue; }
        const c: CellFmt = {};
        if (bg) { c.bg = bg; }
        if (fg) { c.fg = fg; }
        if (bold) { c.bold = true; }
        out[k.toUpperCase()] = c;
    }
    return out;
}

// ---- Colour CODE ------------------------------------------------------------------------------

export interface LegendEntry extends SheetStatus { meaning: string; sort: number; active: boolean; }

export function legendFrom(rows: any[]): LegendEntry[] {
    return (rows || []).filter(r => r && code(r.CODE)).map(r => ({
        code: code(r.CODE).toUpperCase(), label: code(r.LABEL) || code(r.CODE), meaning: code(r.MEANING),
        bg: colour(r.BG), fg: colour(r.FG), sort: +r.SORT || 0, active: r.ACTIVE === undefined ? true : truthy(r.ACTIVE)
    })).sort((a, b) => a.sort - b.sort || (a.code < b.code ? -1 : a.code > b.code ? 1 : 0));
}

/** Text colour of a HAZ = YES row: the legend's HAZ entry, else red. */
export function hazColour(legend: LegendEntry[]): string {
    const h = legend.find(l => l.code === 'HAZ');
    return (h && h.fg) || '#c62828';
}

// ---- server rows -> records ---------------------------------------------------------------------

/** One server row, normalised (WO row or grid row). */
export interface SrvRow {
    id: number;
    sort: number;
    ver: number;
    values: { [key: string]: string };
    fmt: { [key: string]: CellFmt };
    /** CELL_FMT["*ROW"]: the row's own colours (bold is not drawn: the grid's rowFmt has bg / fg only) */
    rowFmt: CellFmt | null;
    status: string | null;
    exptno: string;
    deleted: boolean;
}

/** CELL_FMT split into the cells' formats and the row format (key "*ROW"). */
function splitFmt(json: any): { fmt: { [key: string]: CellFmt }; rowFmt: CellFmt | null } {
    const fmt = parseCellFmt(json);
    const rowFmt = fmt[ROW_KEY] || null;
    delete fmt[ROW_KEY];
    return { fmt, rowFmt };
}

/** Live Links values of a linked row (LOAD Table1 / SAVE_CELLS Table3 / ROWS_OP, LINK Table2), keyed like the registry. */
export interface LinksVals { exptno: string; found: boolean; cancelled: boolean; values: { [key: string]: string }; }

export interface SheetRec {
    srv: SrvRow;
    links: LinksVals | null;
    /** unsent or unconfirmed edits of this user (optimistic): shown instead of the server value */
    local: { [key: string]: string };
}

export type RecMap = Map<number, SheetRec>;
export type TabKindRows = 'wo' | 'grid';

const LINKS_COLS: SheetColDef[] = SHEET_COLUMNS.filter(c => c.links);

export function woFromDb(db: any): SrvRow {
    const values: { [key: string]: string } = {};
    for (const c of SHEET_COLUMNS) { values[c.key] = str(db[c.key]); }
    return {
        id: +db.ID || 0, sort: +db.SORT_ORDER || 0, ver: +db.ROWVER || 0, values, ...splitFmt(db.CELL_FMT),
        status: code(db.STATUS_CODE).toUpperCase() || null, exptno: code(db.EXPTNO), deleted: truthy(db.ISDELETED)
    };
}

/** Grid / free tab row: DATA is JSON keyed by column letter. */
export function gridFromDb(db: any): SrvRow {
    const data = parseJson<any>(db.DATA, {});
    const values: { [key: string]: string } = {};
    if (data && typeof data === 'object' && !Array.isArray(data)) {
        for (const k of Object.keys(data)) { values[k.toUpperCase()] = typeof data[k] === 'string' ? data[k] : str(data[k]); }
    }
    return {
        id: +db.ID || 0, sort: +db.SORT_ORDER || 0, ver: +db.ROWVER || 0, values, ...splitFmt(db.CELL_FMT),
        status: null, exptno: '', deleted: truthy(db.ISDELETED)
    };
}

export function linksFromDb(l: any): LinksVals {
    const values: { [key: string]: string } = {};
    for (const c of LINKS_COLS) {
        const v = str(l['L_' + c.key]);
        if (v.trim()) { values[c.key] = v; }
    }
    return {
        exptno: code(l.EXPTNO), values,
        found: l.JOB_FOUND === undefined || l.JOB_FOUND === null ? true : truthy(l.JOB_FOUND),
        cancelled: truthy(l.JOB_CANCELLED)
    };
}

export interface MergeResult { recs: RecMap; removed: number[]; touched: number[]; }

/**
 * Server rows into the records, replaced by ID (never "the copy with the higher ROWVER": moves, formats and
 * row status do not bump it). ISDELETED rows drop out. `links` = the Links table that came with the rows
 * (a returned linked row without an entry has no Links values); null = none came, keep what we had.
 * full = the complete tab (LOAD): rows not in it are gone. The user's local edits always stay.
 */
export function mergeServerRows(recs: RecMap, rows: any[], links: any[] | null, kind: TabKindRows, full = false): MergeResult {
    const out: RecMap = new Map(recs);
    const lk = new Map<number, LinksVals>();
    for (const l of links || []) {
        const id = l ? +l.ID : 0;
        if (id) { lk.set(id, linksFromDb(l)); }
    }
    const seen = new Set<number>();
    const removed: number[] = [], touched: number[] = [];
    for (const db of rows || []) {
        if (!db || db.ID === undefined || db.ID === null) { continue; }
        const srv = kind === 'wo' ? woFromDb(db) : gridFromDb(db);
        if (!srv.id) { continue; }
        seen.add(srv.id);
        const prev = out.get(srv.id);
        if (srv.deleted) {
            if (prev) { out.delete(srv.id); removed.push(srv.id); }
            continue;
        }
        let lv: LinksVals | null = null;
        if (kind === 'wo' && srv.exptno) {
            lv = links === null ? (prev ? prev.links : null) : (lk.get(srv.id) || null);
        }
        out.set(srv.id, { srv, links: lv, local: prev ? prev.local : {} });
        touched.push(srv.id);
    }
    if (full) {
        for (const id of Array.from(out.keys())) {
            if (!seen.has(id)) { out.delete(id); removed.push(id); }
        }
    }
    return { recs: out, removed, touched };
}

/** Sheet order: SORT_ORDER, then ID (as LOAD orders them). */
export function orderRecs(recs: RecMap): SheetRec[] {
    return Array.from(recs.values()).sort((a, b) => a.srv.sort - b.srv.sort || a.srv.id - b.srv.id);
}

export function withLocal(rec: SheetRec, key: string, value: string | null): SheetRec {
    const local = { ...rec.local };
    if (value === null) { delete local[key]; } else { local[key] = value; }
    return { ...rec, local };
}

export interface RowCtx {
    kind: TabKindRows;
    statusBy: Map<string, LegendEntry>;
    hazFg: string;
    /** columns this user does not own: key -> reason (drawn as a padlock on every row; see ownerLocks) */
    ownerLocks?: { [key: string]: string } | null;
}

/** Display values: the server's, the user's local edits on top. */
export function displayValues(rec: SheetRec): { [key: string]: string } {
    const v = { ...rec.srv.values };
    for (const k of Object.keys(rec.local)) { v[k] = rec.local[k]; }
    return v;
}

/**
 * The grid row of a record.
 * Linked rows (EXPTNO set): a Links-owned column with a Links value shows that value, locked ("From Links, job
 * <exptno>"), tag 'links'; without a Links value the sheet's own value stays, editable, tag 'pending'. FF JOB is
 * locked (Link / Unlink change it) and flagged when the job is not found or cancelled in Links. Every corner mark
 * carries its own tooltip (tagReasons).
 * Row colour, per colour: the row's own format (CELL_FMT "*ROW") wins over the status colour from the legend, which
 * applies where the row has none; HAZ = YES turns the row text red whatever else is set.
 */
export function toSheetRow(rec: SheetRec, ctx: RowCtx): SheetRow {
    const srv = rec.srv;
    const values = displayValues(rec);
    const row: SheetRow = { id: srv.id, ver: srv.ver, values };
    if (Object.keys(srv.fmt).length) { row.fmt = srv.fmt; }
    const own = srv.rowFmt;
    if (ctx.kind !== 'wo') {
        if (own && (own.bg || own.fg)) { row.rowFmt = { bg: own.bg || null, fg: own.fg || null }; }
        return row;
    }
    row.status = srv.status;
    const st = srv.status ? ctx.statusBy.get(srv.status) : undefined;
    const haz = code(values['HAZ']).toUpperCase() === 'YES';
    const bg = (own && own.bg) || (st && st.bg) || null;
    const fg = haz ? ctx.hazFg : ((own && own.fg) || (st && st.fg) || null);
    if (bg || fg) { row.rowFmt = { bg, fg }; }
    const owner = ctx.ownerLocks && Object.keys(ctx.ownerLocks).length ? ctx.ownerLocks : null;
    if (owner) { row.locked = owner; }
    if (srv.exptno) {
        const job = srv.exptno;
        const locked: { [key: string]: string } = { ...(owner || {}) };
        const tags: { [key: string]: SheetTag } = {};
        const reasons: { [key: string]: string } = {};
        for (const c of LINKS_COLS) {
            const lv = rec.links ? rec.links.values[c.key] : undefined;
            if (lv !== undefined) {
                values[c.key] = lv;
                locked[c.key] = 'From Links, job ' + job;
                tags[c.key] = 'links';
                reasons[c.key] = 'change it on the job in Links';
            } else {
                tags[c.key] = 'pending';
                reasons[c.key] = 'Not in Links yet: job ' + job + ' has no value, the sheet value stays editable';
            }
        }
        locked['FF_JOB'] = 'Linked to job ' + job + ' - use Link to job / Unlink to change it';
        if (rec.links && !rec.links.found) {
            tags['FF_JOB'] = 'flag';
            reasons['FF_JOB'] = 'Job ' + job + ' was not found in Links - check it, then Unlink or Link to the right job';
        } else if (rec.links && rec.links.cancelled) {
            tags['FF_JOB'] = 'flag';
            reasons['FF_JOB'] = 'Job ' + job + ' is cancelled in Links - Unlink it or Link to the right job';
        }
        row.locked = locked;
        row.tags = tags;
        row.tagReasons = reasons;
    }
    return row;
}

// ---- column ownership (hard lock) -----------------------------------------------------------------

export const ROLE_LABELS: { [code: string]: string } = {
    OPS: 'Ops / Planning', BOOKING: 'Booking desk', OPSLEAD: 'Ops lead', DOCS: 'Documentation', BLDESK: 'BL desk',
    YARD: 'Yard / CFS', ALL: 'Everyone', ADMIN: 'Admins'
};

export interface Access {
    state: 'loading' | 'ok' | 'failed';
    /** ADMIN role or Links SA: every column */
    admin: boolean;
    roles: Set<string>;
    /** MY_ROLES Table1: the columns this user may edit (null when the server did not send the list) */
    cols: Set<string> | null;
}

export function accessFrom(ds: any, isSa: boolean): Access {
    const roles = new Set<string>(((ds && ds.Table) || []).map((r: any) => code(r.ROLE_CODE).toUpperCase()).filter(Boolean));
    const cols = ds && Array.isArray(ds.Table1)
        ? new Set<string>(ds.Table1.map((r: any) => code(r.COL_KEY).toUpperCase()).filter(Boolean)) : null;
    return { state: 'ok', admin: isSa || roles.has('ADMIN'), roles, cols };
}

/** canEditCell for WO tabs: true, or why not (naming the owning role). Admins / SA edit everything. */
export function ownerCheck(key: string, acc: Access): true | string {
    if (acc.admin) { return true; }
    const col = COL_BY_KEY[key];
    if (!col) { return true; }
    if (acc.state === 'loading') { return 'your column access is still loading - try again in a moment.'; }
    if (acc.state === 'failed') { return 'your column access (Column Access) could not be loaded - reload the page.'; }
    const ok = acc.cols ? acc.cols.has(key) : (col.owner === 'ALL' || acc.roles.has(col.owner));
    if (ok) { return true; }
    if (acc.roles.has(col.owner)) { return 'Column Access gives this column to another role - only that role and Admins can edit it.'; }
    return 'owned by ' + (ROLE_LABELS[col.owner] || col.owner) + ' - only that role and Admins can edit it (Column Access).';
}

/** The padlocks of the hard lock: every column of the tab the user cannot edit, with the reason. Admins: none. */
export function ownerLocks(keys: string[], acc: Access): { [key: string]: string } {
    const out: { [key: string]: string } = {};
    if (acc.admin || acc.state !== 'ok') { return out; }
    for (const k of keys) {
        const r = ownerCheck(k, acc);
        if (r !== true) { out[k] = r; }
    }
    return out;
}

// ---- edit batching -----------------------------------------------------------------------------------

export interface QueuedEdit {
    rowId: number;
    key: string;
    value: string;
    /** what the user saw before the first change in this batch */
    oldValue: string;
    /** row version the change is based on (SAVE_CELLS version check) */
    ver: number;
}

export type EditQueue = Map<string, QueuedEdit>;

export const qkey = (rowId: number, key: string): string => rowId + '|' + key.toUpperCase();

/** Grid edits into the queue: one entry per cell, the latest value wins, the first old value and version stay. */
export function enqueueEdits(q: EditQueue, edits: SheetEdit[], verOf: (rowId: number) => number): EditQueue {
    const out: EditQueue = new Map(q);
    for (const e of edits || []) {
        const id = +e.rowId;
        if (!id || !e.key) { continue; }
        const k = qkey(id, e.key);
        const prev = out.get(k);
        if (prev) {
            out.set(k, { ...prev, value: str(e.newValue) });
        } else {
            const ver = typeof e.ver === 'number' && e.ver > 0 ? e.ver : verOf(id);
            out.set(k, { rowId: id, key: e.key, value: str(e.newValue), oldValue: str(e.oldValue), ver: ver || 0 });
        }
    }
    return out;
}

/** Everything queued, as the SaveCells / GridSave body. */
export function batchOf(q: EditQueue): { sent: QueuedEdit[]; edits: CellEdit[] } {
    const sent = Array.from(q.values());
    return { sent, edits: sent.map(e => ({ RowId: e.rowId, RowVer: e.ver, Key: e.key, Value: e.value })) };
}

/**
 * After our own save bumped a row's version, edits queued meanwhile on the same base version now stand on the
 * new one (they were typed on top of our saved change). Rows with a conflict keep their old base: someone else
 * changed them, so those edits must meet the conflict prompt too.
 */
export function rebaseQueue(q: EditQueue, sent: QueuedEdit[], newVer: Map<number, number>, conflicted: Set<number>): EditQueue {
    const base = new Map<number, number>();
    for (const e of sent) { base.set(e.rowId, Math.max(base.get(e.rowId) || 0, e.ver)); }
    const out: EditQueue = new Map();
    q.forEach((e, k) => {
        const nv = newVer.get(e.rowId);
        out.set(k, nv !== undefined && !conflicted.has(e.rowId) && base.get(e.rowId) === e.ver ? { ...e, ver: nv } : e);
    });
    return out;
}

export function dropQueued(q: EditQueue, rowIds: number[]): EditQueue {
    if (!rowIds.length) { return q; }
    const gone = new Set(rowIds);
    const out: EditQueue = new Map();
    q.forEach((e, k) => { if (!gone.has(e.rowId)) { out.set(k, e); } });
    return out;
}

export interface Conflict { rowId: number; key: string; mine: string; theirs: string; }
export interface Refused { rowId: number; key: string; value: string; reason: string; }

export interface SaveOutcome {
    recs: RecMap;
    removed: number[];
    confirmed: number;
    refused: Refused[];
    conflicts: Conflict[];
    /** new ROWVER of every returned row */
    newVer: Map<number, number>;
    conflicted: Set<number>;
}

/**
 * The SaveCells (WO: Table1 rejected, Table2 rows, Table3 Links values) / GridSave (Table1 rejected, KEY '*' =
 * the whole row, Table2 rows) answer applied to the records:
 * saved cells drop their local copy (the server row is the truth: dates normalised, new ROWVER); refused cells
 * roll back to the server value; conflicts keep the local value for the prompt (unless theirs equals mine).
 * A cell typed again while the batch was out keeps the newer local value (it is still queued).
 */
export function applySaveResult(recs: RecMap, sent: QueuedEdit[], ds: any, kind: TabKindRows): SaveOutcome {
    const links = kind === 'wo' ? ((ds && ds.Table3) || []) : null;
    const m = mergeServerRows(recs, (ds && ds.Table2) || [], links, kind);
    const out = m.recs;
    const byCell = new Map<string, string>(), byRow = new Map<number, string>(), byKey = new Map<string, string>();
    for (const r of (ds && ds.Table1) || []) {
        const reason = code(r.REASON).toLowerCase() || 'invalid';
        const key = code(r.KEY).toUpperCase();
        const id = r.ID === null || r.ID === undefined ? 0 : +r.ID;
        if (id && (key === '*' || !key)) { byRow.set(id, reason); } else if (id) { byCell.set(qkey(id, key), reason); } else if (key) { byKey.set(key, reason); }
    }
    const refused: Refused[] = [], conflicts: Conflict[] = [];
    const conflicted = new Set<number>();
    let confirmed = 0;
    for (const e of sent) {
        const reason = byCell.get(qkey(e.rowId, e.key)) || byRow.get(e.rowId) || byKey.get(e.key.toUpperCase());
        const rec = out.get(e.rowId);
        const mineStill = !!rec && rec.local[e.key] === e.value;
        if (!reason) {
            confirmed++;
            if (mineStill) { out.set(e.rowId, withLocal(rec!, e.key, null)); }
        } else if (reason === 'conflict') {
            conflicted.add(e.rowId);
            const theirs = rec ? str(rec.srv.values[e.key]) : '';
            if (rec && theirs === e.value) {
                if (mineStill) { out.set(e.rowId, withLocal(rec, e.key, null)); }
            } else if (rec && mineStill) {
                conflicts.push({ rowId: e.rowId, key: e.key, mine: e.value, theirs });
            }
        } else {
            refused.push({ rowId: e.rowId, key: e.key, value: e.value, reason });
            if (mineStill) { out.set(e.rowId, withLocal(rec!, e.key, null)); }
        }
    }
    const newVer = new Map<number, number>();
    for (const id of m.touched) { const r = out.get(id); if (r) { newVer.set(id, r.srv.ver); } }
    return { recs: out, removed: m.removed, confirmed, refused, conflicts, newVer, conflicted };
}

/** The conflict prompt's answer. mine = send it again on the row's current version; theirs = drop the local value. */
export function resolveConflict(recs: RecMap, q: EditQueue, c: Conflict, choice: 'mine' | 'theirs'): { recs: RecMap; queue: EditQueue } {
    const rec = recs.get(c.rowId);
    const outQ: EditQueue = new Map(q);
    const outR: RecMap = new Map(recs);
    if (!rec) { outQ.delete(qkey(c.rowId, c.key)); return { recs: outR, queue: outQ }; }
    if (choice === 'theirs') {
        outR.set(c.rowId, withLocal(rec, c.key, null));
        outQ.delete(qkey(c.rowId, c.key));
        return { recs: outR, queue: outQ };
    }
    const ver = rec.srv.ver;
    // the user accepted the row as it is now: queued edits of the row stand on that version too
    outQ.forEach((e, k) => { if (e.rowId === c.rowId) { outQ.set(k, { ...e, ver }); } });
    const prev = outQ.get(qkey(c.rowId, c.key));
    outQ.set(qkey(c.rowId, c.key), { rowId: c.rowId, key: c.key, value: prev ? prev.value : c.mine, oldValue: c.theirs, ver });
    if (rec.local[c.key] === undefined) { outR.set(c.rowId, withLocal(rec, c.key, c.mine)); }
    return { recs: outR, queue: outQ };
}

export const REASON_TEXT: { [reason: string]: string } = {
    conflict: 'someone else changed the row meanwhile',
    owner: 'the column belongs to another role (Column Access)',
    locked: 'the value comes from Links (or the row is linked to a job)',
    notfound: 'the row was deleted meanwhile',
    invalid: 'not a column of this tab',
    'too long': 'too long (500 characters, 2,000 for Veh / REMARK 1 / CONTAINER NO)'
};

export function reasonText(reason: string): string {
    return REASON_TEXT[code(reason).toLowerCase()] || code(reason) || 'refused by the server';
}

/**
 * Changes (WO, LOAD shape: Table rows, Table1 Links values) / GridChanges (Table grid rows, Table1 the TABMETA row
 * only when it changed) into the records; AS_OF for the next Since. Rows may arrive twice: replaced by ID.
 */
export function mergeChanges(recs: RecMap, ds: any, kind: TabKindRows = 'wo'): MergeResult & { asOf: string; meta: any | null } {
    const t1 = (ds && Array.isArray(ds.Table1)) ? ds.Table1 : [];
    const m = mergeServerRows(recs, (ds && ds.Table) || [], kind === 'wo' ? t1 : null, kind);
    return { ...m, asOf: asOfOf(ds), meta: kind === 'grid' && t1.length ? t1[0] : null };
}

export function asOfOf(ds: any): string {
    const t = ds && Array.isArray(ds.Table2) && ds.Table2.length ? ds.Table2[0] : null;
    return t ? code(t.AS_OF) : '';
}

// ---- formats and row operations ------------------------------------------------------------------

/**
 * fmtChange -> SaveFormat / GridSaveFormat edits. A row status (key '*ROW', '' clears) also clears the row's own
 * colours: a status picked from the menu must show its colour (the row format would win). A cell format sends all
 * three parts ('' / false clear).
 */
export function fmtEdits(ch: SheetFmtChange): FmtEdit[] {
    if (ch.kind === 'row') {
        return ch.rowIds.map(id => ({ RowId: +id, Key: ROW_KEY, Status: ch.status || '', Bg: '', Fg: '' }));
    }
    return ch.cells.map(c => ({ RowId: +c.rowId, Key: c.key, Bg: (c.fmt && c.fmt.bg) || '', Fg: (c.fmt && c.fmt.fg) || '', Bold: !!(c.fmt && c.fmt.bold) }));
}

/** The same change applied to the records right away (the SaveFormat answer replaces it). */
export function applyFmtLocally(recs: RecMap, ch: SheetFmtChange): RecMap {
    const out: RecMap = new Map(recs);
    if (ch.kind === 'row') {
        for (const id of ch.rowIds) {
            const r = out.get(+id);
            const rowFmt: CellFmt | null = r && r.srv.rowFmt && r.srv.rowFmt.bold ? { bold: true } : null;
            if (r) { out.set(+id, { ...r, srv: { ...r.srv, status: ch.status ? ch.status.toUpperCase() : null, rowFmt } }); }
        }
        return out;
    }
    for (const c of ch.cells) {
        const r = out.get(+c.rowId);
        if (!r) { continue; }
        const fmt = { ...r.srv.fmt };
        if (c.fmt && (c.fmt.bg || c.fmt.fg || c.fmt.bold)) { fmt[c.key] = { ...c.fmt }; } else { delete fmt[c.key]; }
        out.set(+c.rowId, { ...r, srv: { ...r.srv, fmt } });
    }
    return out;
}

/** rowOp -> Rows / GridRows arguments (AfterId 0 = top, insert count 1..1000). */
export function rowOpArgs(op: SheetRowOp): { op: string; ids: number[]; afterId: number; count: number } {
    const ids = (op.rowIds || []).map(x => +x).filter(x => x > 0);
    const afterId = op.afterId === null || op.afterId === undefined ? 0 : (+op.afterId || 0);
    const count = Math.max(1, Math.min(1000, (op.count | 0) || (op.op === 'insert' ? 1 : ids.length) || 1));
    return { op: op.op, ids: op.op === 'insert' ? [] : ids, afterId, count };
}

// ---- tabs, columns, layouts -----------------------------------------------------------------------

export interface MonthTab {
    code: string;
    title: string;
    kind: SheetTabKind;
    layout?: 'A' | 'B';
    helper?: boolean;
    widths?: { [key: string]: number };
    frozenCols?: number;
}

const KINDS: SheetTabKind[] = ['legend', 'access', 'wo', 'grid', 'free', 'kpi'];

/** A tab code as every API action takes it: upper case, A-Z 0-9 _, at most 20 ('' when nothing is left). */
export function tabCodeOf(v: any): string {
    return code(v).toUpperCase().replace(/[^A-Z0-9_]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 20);
}

/** The month's TABS JSON -> its tabs in order; unknown entries get their kind from the registry; empty -> the workbook's tabs. */
export function monthTabs(tabs: any): MonthTab[] {
    const list = parseJson<any>(tabs, null);
    const known = [...DEFAULT_TABS, ...OPTIONAL_WO_TABS];
    const out: MonthTab[] = [];
    const seen = new Set<string>();
    for (const t of Array.isArray(list) ? list : []) {
        const c = tabCodeOf(t && t.code);
        if (!c || seen.has(c)) { continue; }
        const def = known.find(k => k.code === c);
        let kind = code(t.kind).toLowerCase() as SheetTabKind;
        if (KINDS.indexOf(kind) < 0) { kind = def ? def.kind : (GRID_TABS[c] ? (GRID_TABS[c].headerRow ? 'grid' : 'free') : 'wo'); }
        const tab: MonthTab = { code: c, title: code(t.title) || (def ? def.title : c), kind };
        if (kind === 'wo') {
            tab.layout = code(t.layout).toUpperCase() === 'B' || (!t.layout && def && def.layout === 'B') ? 'B' : 'A';
            tab.helper = t.helper === undefined ? !!(def && def.helper) : truthy(t.helper);
            if (t.widths && typeof t.widths === 'object') { tab.widths = t.widths; }
            if (t.frozenCols !== undefined && t.frozenCols !== null && isFinite(+t.frozenCols)) { tab.frozenCols = Math.max(0, Math.min(10, +t.frozenCols | 0)); }
        }
        seen.add(c);
        out.push(tab);
    }
    return out.length ? out : DEFAULT_TABS.map(t => ({ ...t }));
}

/** TABS of a new month: the workbook's tabs, plus Nigeria after Triumph when asked for. */
export function newMonthTabs(withNigeria: boolean): MonthTab[] {
    const out: MonthTab[] = [];
    for (const t of DEFAULT_TABS) {
        out.push(t.kind === 'wo' ? { ...t, frozenCols: 1 } : { ...t });
        if (t.code === 'TRIUMPH' && withNigeria) { OPTIONAL_WO_TABS.forEach(o => out.push({ ...o, frozenCols: 1 })); }
    }
    return out;
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function monthLabel(ym: string): string {
    const m = /^(\d{4})-(\d{2})$/.exec(code(ym));
    return m && +m[2] >= 1 && +m[2] <= 12 ? MONTH_NAMES[+m[2] - 1] + ' ' + m[1] : code(ym);
}

/** Default for "New month": the month after the newest one, else this month. */
export function nextMonth(existing: string[], today: Date): string {
    const ym = (y: number, m: number) => y + '-' + ('0' + m).slice(-2);
    const sorted = existing.filter(x => /^\d{4}-\d{2}$/.test(x)).sort();
    if (!sorted.length) { return ym(today.getFullYear(), today.getMonth() + 1); }
    const [y, m] = sorted[sorted.length - 1].split('-').map(x => +x);
    return m === 12 ? ym(y + 1, 1) : ym(y, m + 1);
}

export interface PersonalLayout { widths: { [key: string]: number }; hidden: string[]; frozenCols: number | null; }

export function layoutFrom(data: any): PersonalLayout | null {
    const d = parseJson<any>(data, null);
    if (!d || typeof d !== 'object') { return null; }
    const widths: { [key: string]: number } = {};
    if (d.widths && typeof d.widths === 'object') {
        for (const k of Object.keys(d.widths)) { const w = +d.widths[k]; if (w >= 20 && w <= 2000) { widths[k] = Math.round(w); } }
    }
    const hidden = Array.isArray(d.hidden) ? d.hidden.map((x: any) => code(x)).filter(Boolean) : [];
    const frozenCols = d.frozenCols === undefined || d.frozenCols === null || !isFinite(+d.frozenCols) ? null : Math.max(0, Math.min(10, +d.frozenCols | 0));
    return { widths, hidden, frozenCols };
}

/** Columns of a WO tab: layout A / B, widths of the tab (month TABS, else the October workbook), the user's layout on top. */
export function woColumns(tab: MonthTab, layout: PersonalLayout | null): SheetColumn[] {
    const tabW = tab.widths || TAB_WIDTHS[tab.code] || TAB_WIDTHS['VIPAR'];
    const hidden = new Set(layout ? layout.hidden : []);
    return layoutKeys(tab.layout).map(k => {
        const c = COL_BY_KEY[k];
        const col: SheetColumn = {
            key: k, header: c.header, kind: c.kind,
            width: (layout && layout.widths[k]) || +tabW[k] || 80,
            hidden: hidden.has(k)
        };
        if (c.choices) { col.choices = c.choices; }
        return col;
    });
}

export interface TabMeta {
    headers?: { [key: string]: string };
    widths?: { [key: string]: number };
    hidden?: string[];
    frozenCols?: number;
    frozenRows?: number;
    merges?: string[];
}

/** Columns of a grid / free tab (GRID_TABS) with the tab's stored META (headers, widths, hidden) on top. Free tabs show letters. */
export function gridColumns(tabCode: string, meta: TabMeta | null): SheetColumn[] {
    const def = GRID_TABS[tabCode];
    if (!def) { return []; }
    const m = meta || {};
    const hidden = new Set(Array.isArray(m.hidden) ? m.hidden : []);
    return def.cols.map(c => {
        const header = (m.headers && code(m.headers[c.key])) || code(c.header) || c.key;
        const col: SheetColumn = {
            key: c.key, header: def.headerRow ? header : (code(c.header) || c.key), kind: c.kind,
            width: (m.widths && +m.widths[c.key]) || c.width, hidden: hidden.has(c.key)
        };
        if (c.choices) { col.choices = c.choices; }
        return col;
    });
}

/** Frozen rows and merges of a grid tab: the stored META, else the workbook's definition. */
export function gridShape(tabCode: string, meta: TabMeta | null): { frozenRows: number; merges: string[] } {
    const def = GRID_TABS[tabCode];
    const m = meta || {};
    const frozenRows = m.frozenRows !== undefined && isFinite(+m.frozenRows) ? +m.frozenRows : (def ? def.frozenRows : 0);
    const merges = Array.isArray(m.merges) ? m.merges.map(x => code(x)).filter(Boolean) : ((def && def.merges) || []);
    return { frozenRows: Math.max(0, frozenRows | 0), merges };
}

// ---- Sri Lanka helper list --------------------------------------------------------------------------

export interface HelperCombo { type: string; veh: string; plant: string; count: number; }

/** The workbook's UNIQUE(FILTER(type, veh, plant)): distinct container type / vehicle / plant combinations, live. */
export function helperCombos(rows: SheetRow[]): HelperCombo[] {
    const norm = (v: any) => code(v).replace(/\s*\n\s*/g, ' / ').replace(/\s+/g, ' ');
    const by = new Map<string, HelperCombo>();
    for (const r of rows || []) {
        const v = r.values || {};
        const type = norm(v['CNTR_TYPE']), veh = norm(v['VEH']), plant = norm(v['PLANT']);
        if (!type && !veh && !plant) { continue; }
        const k = [type, veh, plant].map(x => x.toUpperCase()).join('\u0001');
        const hit = by.get(k);
        if (hit) { hit.count++; } else { by.set(k, { type, veh, plant, count: 1 }); }
    }
    const cmp = (a: string, b: string) => a.localeCompare(b, undefined, { sensitivity: 'base', numeric: true });
    return Array.from(by.values()).sort((a, b) => cmp(a.type, b.type) || cmp(a.veh, b.veh) || cmp(a.plant, b.plant));
}

// ---- misc ---------------------------------------------------------------------------------------------

/** `2026-10-21T17:53:00.123` -> `21-10-2026 17:53`; anything else as it came. */
export function dateTimeText(v: any): string {
    const m = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/.exec(code(v));
    return m ? m[3] + '-' + m[2] + '-' + m[1] + ' ' + m[4] + ':' + m[5] : code(v);
}

/** Column header for a key of a WO tab (registry) or a grid tab (definition / letter). */
export function headerOf(key: string, tabCode: string): string {
    const k = code(key).toUpperCase();
    if (COL_BY_KEY[k]) { return COL_BY_KEY[k].header; }
    const def = GRID_TABS[tabCode];
    const c = def ? def.cols.find(x => x.key === k) : undefined;
    if (c && c.header) { return c.header; }
    if (k === '*ROW') { return 'Row colour'; }
    if (k === 'SORT_ORDER') { return 'Position'; }
    return k;
}

/** The DB-shaped row Convert to job works on (sheet-convert.ts): ID, EXPTNO and the values shown. */
export function convertRow(rec: SheetRec): any {
    return { ID: rec.srv.id, EXPTNO: rec.srv.exptno, STATUS_CODE: rec.srv.status, ...displayValues(rec) };
}

// ---- settings history ----------------------------------------------------------------------------------

const ALIAS_LABELS: { [kind: string]: string } = {
    CONSIGNEE: 'Consignee', AGENT: 'Agent', SLINE: 'Shipping line', PORT: 'Port of discharge', COUNTRY: 'Destination country',
    CLEARANCE: 'Clearance point', POLGATE: 'POL gate', VESSEL: 'Vessel'
};

/** What a settings / month log entry (HISTORY 'M') changed, in words: LEGEND.HOLD -> "Colour CODE · HOLD", ... */
export function settingsLogLabel(colKey: any, tabTitle: (tabCode: string) => string = c => c): string {
    const k = code(colKey).toUpperCase();
    if (!k) { return 'Month'; }
    const parts = k.split('.');
    switch (parts[0]) {
        case 'LEGEND': return 'Colour CODE · ' + (parts[1] || '');
        case 'ROLE': return 'Column Access · ' + (ROLE_LABELS[parts[1]] || parts[1] || '') + (parts[2] === 'USERS' ? ' users' : parts[2] === 'COLS' ? ' columns' : '');
        case 'ALIAS': return parts[1] === 'SEED' ? 'Aliases · learned from linked rows' : 'Alias · ' + (ALIAS_LABELS[parts[1]] || parts[1] || '');
        case 'META': return 'Column layout · ' + tabTitle(parts[1] || '');
        case 'TITLE': return 'Month title';
        case 'TABS': return 'Month tabs';
        default: return k;
    }
}
