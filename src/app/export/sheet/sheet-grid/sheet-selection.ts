/*  Selection maths. Positions are indices into the grid's current view:
    r = visible (filtered / sorted) row, c = visible (not hidden) column.          */

export interface CellPos {
    r: number;
    c: number;
}

/** Inclusive, normalised (r0 <= r1, c0 <= c1). */
export interface CellRange {
    r0: number;
    c0: number;
    r1: number;
    c1: number;
}

export function rangeOf(a: CellPos, b: CellPos): CellRange {
    return {
        r0: Math.min(a.r, b.r), r1: Math.max(a.r, b.r),
        c0: Math.min(a.c, b.c), c1: Math.max(a.c, b.c)
    };
}

export function inRange(g: CellRange | null, r: number, c: number): boolean {
    return !!g && r >= g.r0 && r <= g.r1 && c >= g.c0 && c <= g.c1;
}

export function rangeRows(g: CellRange): number {
    return g.r1 - g.r0 + 1;
}

export function rangeCols(g: CellRange): number {
    return g.c1 - g.c0 + 1;
}

export function rangeCells(g: CellRange): number {
    return rangeRows(g) * rangeCols(g);
}

export function isSingleCell(g: CellRange): boolean {
    return g.r0 === g.r1 && g.c0 === g.c1;
}

export function sameRange(a: CellRange | null, b: CellRange | null): boolean {
    return !!a && !!b && a.r0 === b.r0 && a.r1 === b.r1 && a.c0 === b.c0 && a.c1 === b.c1;
}

export function clamp(v: number, lo: number, hi: number): number {
    return v < lo ? lo : v > hi ? hi : v;
}

export function clampPos(p: CellPos, nRows: number, nCols: number): CellPos {
    return { r: clamp(p.r, 0, Math.max(0, nRows - 1)), c: clamp(p.c, 0, Math.max(0, nCols - 1)) };
}

export function clampRange(g: CellRange, nRows: number, nCols: number): CellRange {
    const a = clampPos({ r: g.r0, c: g.c0 }, nRows, nCols);
    const b = clampPos({ r: g.r1, c: g.c1 }, nRows, nCols);
    return rangeOf(a, b);
}

export function isWholeRows(g: CellRange, nCols: number): boolean {
    return g.c0 === 0 && g.c1 === nCols - 1;
}

export function isWholeCols(g: CellRange, nRows: number): boolean {
    return g.r0 === 0 && g.r1 === nRows - 1;
}

/**
 * Next active cell inside a multi-cell selection (Tab / Shift+Tab move along the row,
 * Enter / Shift+Enter down the column, both wrap inside the selection like Sheets / Excel).
 */
export function moveWithin(g: CellRange, p: CellPos, dir: 'right' | 'left' | 'down' | 'up'): CellPos {
    let { r, c } = p;
    if (dir === 'right' || dir === 'left') {
        const s = dir === 'right' ? 1 : -1;
        c += s;
        if (c > g.c1) {
            c = g.c0;
            r = r + 1 > g.r1 ? g.r0 : r + 1;
        } else if (c < g.c0) {
            c = g.c1;
            r = r - 1 < g.r0 ? g.r1 : r - 1;
        }
    } else {
        const s = dir === 'down' ? 1 : -1;
        r += s;
        if (r > g.r1) {
            r = g.r0;
            c = c + 1 > g.c1 ? g.c0 : c + 1;
        } else if (r < g.r0) {
            r = g.r1;
            c = c - 1 < g.c0 ? g.c1 : c - 1;
        }
    }
    return { r, c };
}

/**
 * Ctrl+arrow (data edge jump, Excel / Sheets rules):
 * - from a filled cell whose neighbour is filled: to the last filled cell before a blank
 * - otherwise: to the next filled cell, or the edge of the sheet
 */
export function edgeJump(p: CellPos, dr: number, dc: number, nRows: number, nCols: number,
    isEmpty: (r: number, c: number) => boolean): CellPos {
    const inside = (r: number, c: number) => r >= 0 && r < nRows && c >= 0 && c < nCols;
    let r = p.r;
    let c = p.c;
    if (!inside(r + dr, c + dc)) {
        return { r, c };
    }
    const curFilled = !isEmpty(r, c);
    const nextFilled = !isEmpty(r + dr, c + dc);
    if (curFilled && nextFilled) {
        while (inside(r + dr, c + dc) && !isEmpty(r + dr, c + dc)) {
            r += dr;
            c += dc;
        }
        return { r, c };
    }
    r += dr;
    c += dc;
    while (inside(r, c) && isEmpty(r, c)) {
        if (!inside(r + dr, c + dc)) {
            return { r, c };
        }
        r += dr;
        c += dc;
    }
    return { r, c };
}

/**
 * Paste target size: the copied block is tiled over the selection when the selection is an
 * exact multiple of it (a single value fills the whole selection), otherwise it is pasted once
 * from the selection's top-left cell.
 */
export function pasteSize(blockRows: number, blockCols: number, sel: CellRange): { rows: number; cols: number } {
    const sr = rangeRows(sel);
    const sc = rangeCols(sel);
    if (blockRows > 0 && blockCols > 0 && (sr > 1 || sc > 1) &&
        sr >= blockRows && sc >= blockCols && sr % blockRows === 0 && sc % blockCols === 0) {
        return { rows: sr, cols: sc };
    }
    return { rows: blockRows, cols: blockCols };
}

export type FillDir = 'down' | 'up' | 'right' | 'left';

/**
 * Fill-handle drag: the range the selection grows to when the pointer is over `p`,
 * along the axis the pointer has moved further on (Sheets fills one axis at a time).
 * Returns null while the pointer is still inside the selection.
 */
export function fillTarget(sel: CellRange, p: CellPos): { range: CellRange; dir: FillDir } | null {
    const down = p.r - sel.r1;
    const up = sel.r0 - p.r;
    const right = p.c - sel.c1;
    const left = sel.c0 - p.c;
    const v = Math.max(down, up, 0);
    const h = Math.max(right, left, 0);
    if (v === 0 && h === 0) {
        return null;
    }
    if (v >= h) {
        return down > 0
            ? { range: { ...sel, r1: p.r }, dir: 'down' }
            : { range: { ...sel, r0: p.r }, dir: 'up' };
    }
    return right > 0
        ? { range: { ...sel, c1: p.c }, dir: 'right' }
        : { range: { ...sel, c0: p.c }, dir: 'left' };
}
