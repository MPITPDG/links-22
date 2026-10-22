/*  Sort and filter of the grid's view (the data order itself is the parent's).
    Sort: dates as dates, numbers as numbers, text naturally; blanks always last (Sheets).
    Filter: a values list ('' = blanks) and / or one condition, per column.            */

import { SheetCellKind, SheetFilter, SheetRow } from './sheet-grid.types';
import { dateKey } from './sheet-date';
import { parseNumber } from './sheet-fill';

const collator = typeof Intl !== 'undefined'
    ? new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })
    : null;

function textCompare(a: string, b: string): number {
    return collator ? collator.compare(a, b) : (a < b ? -1 : a > b ? 1 : 0);
}

/**
 * Ascending comparison of two cell values of a column of `kind`.
 * date: real dates first (chronological), then notes / ranges (text order).
 * num : numbers first (numeric), then anything else (text order).
 */
export function compareCells(a: string, b: string, kind: SheetCellKind | undefined): number {
    const x = (a || '').trim();
    const y = (b || '').trim();
    if (kind === 'date') {
        const dx = dateKey(x);
        const dy = dateKey(y);
        if (dx !== null && dy !== null) {
            return dx - dy;
        }
        if (dx !== null) {
            return -1;
        }
        if (dy !== null) {
            return 1;
        }
    } else if (kind === 'num') {
        const nx = parseNumber(x);
        const ny = parseNumber(y);
        if (nx !== null && ny !== null) {
            return nx - ny;
        }
        if (nx !== null) {
            return -1;
        }
        if (ny !== null) {
            return 1;
        }
    }
    return textCompare(x, y);
}

/** Stable sort of rows by one column; blanks stay last in both directions. */
export function sortRows<T extends SheetRow>(rows: T[], key: string, dir: 'asc' | 'desc', kind: SheetCellKind | undefined): T[] {
    const s = dir === 'desc' ? -1 : 1;
    const idx = rows.map((r, i) => ({ r, i, v: ((r.values && r.values[key]) || '').trim() }));
    idx.sort((p, q) => {
        const pe = p.v === '';
        const qe = q.v === '';
        if (pe || qe) {
            return pe && qe ? p.i - q.i : pe ? 1 : -1;
        }
        const c = compareCells(p.v, q.v, kind) * s;
        return c !== 0 ? c : p.i - q.i;
    });
    return idx.map(x => x.r);
}

export function matchCondition(value: string, cond: { op: string; value?: string } | null | undefined,
    kind: SheetCellKind | undefined): boolean {
    if (!cond || !cond.op) {
        return true;
    }
    const v = (value || '').trim();
    const lv = v.toLowerCase();
    const arg = (cond.value || '').trim();
    const la = arg.toLowerCase();
    switch (cond.op) {
        case 'empty': return v === '';
        case 'notEmpty': return v !== '';
        case 'contains': return lv.indexOf(la) >= 0;
        case 'notContains': return lv.indexOf(la) < 0;
        case 'startsWith': return lv.startsWith(la);
        case 'endsWith': return lv.endsWith(la);
        case 'equals': return lv === la;
        case 'dateIs':
        case 'dateBefore':
        case 'dateAfter': {
            const dv = dateKey(v);
            const da = dateKey(arg);
            if (dv === null || da === null) {
                return false;
            }
            return cond.op === 'dateIs' ? dv === da : cond.op === 'dateBefore' ? dv < da : dv > da;
        }
        case 'gt':
        case 'lt':
        case 'eqNum': {
            const nv = parseNumber(v);
            const na = parseNumber(arg);
            if (nv === null || na === null) {
                return false;
            }
            return cond.op === 'gt' ? nv > na : cond.op === 'lt' ? nv < na : nv === na;
        }
    }
    return true;
}

export function isFilterActive(f: SheetFilter | null | undefined): boolean {
    return !!f && (Array.isArray(f.values) || (Array.isArray(f.exclude) && f.exclude.length > 0) || !!(f.cond && f.cond.op));
}

/** Compiled filters: a fast predicate over rows. */
export function compileFilters(filters: { [key: string]: SheetFilter } | null | undefined,
    kindOf: (key: string) => SheetCellKind | undefined, exceptKey?: string): ((row: SheetRow) => boolean) | null {
    const parts: ((row: SheetRow) => boolean)[] = [];
    for (const key of Object.keys(filters || {})) {
        const f = filters![key];
        if (key === exceptKey || !isFilterActive(f)) {
            continue;
        }
        const kind = kindOf(key);
        const set = Array.isArray(f.values) ? new Set(f.values.map(x => (x || '').trim())) : null;
        const out = Array.isArray(f.exclude) && f.exclude.length ? new Set(f.exclude.map(x => (x || '').trim())) : null;
        const cond = f.cond && f.cond.op ? f.cond : null;
        parts.push(row => {
            const v = ((row.values && row.values[key]) || '').trim();
            if (set && !set.has(v)) {
                return false;
            }
            if (out && out.has(v)) {
                return false;
            }
            return cond ? matchCondition(v, cond, kind) : true;
        });
    }
    if (!parts.length) {
        return null;
    }
    return row => {
        for (const p of parts) {
            if (!p(row)) {
                return false;
            }
        }
        return true;
    };
}

/** Distinct trimmed values of a column with counts, in ascending column order (blanks last). */
export function distinctValues(rows: SheetRow[], key: string, kind: SheetCellKind | undefined): { value: string; count: number }[] {
    const m = new Map<string, number>();
    for (const r of rows) {
        const v = ((r.values && r.values[key]) || '').trim();
        m.set(v, (m.get(v) || 0) + 1);
    }
    const list = Array.from(m.entries()).map(([value, count]) => ({ value, count }));
    list.sort((a, b) => {
        if (a.value === '' || b.value === '') {
            return a.value === '' ? (b.value === '' ? 0 : 1) : -1;
        }
        return compareCells(a.value, b.value, kind);
    });
    return list;
}

export interface SelectionStats {
    cells: number;
    count: number;
    numbers: number;
    sum: number;
    avg: number | null;
    min: number | null;
    max: number | null;
}

/** Status-bar figures for the selected values (Sheets: Sum, Average, Min, Max, Count). */
export function selectionStats(values: string[]): SelectionStats {
    let count = 0;
    let numbers = 0;
    let sum = 0;
    let min: number | null = null;
    let max: number | null = null;
    for (const raw of values) {
        const v = (raw || '').trim();
        if (!v) {
            continue;
        }
        count++;
        const n = parseNumber(v);
        if (n !== null) {
            numbers++;
            sum += n;
            min = min === null || n < min ? n : min;
            max = max === null || n > max ? n : max;
        }
    }
    return { cells: values.length, count, numbers, sum, avg: numbers ? sum / numbers : null, min, max };
}
