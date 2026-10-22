/*  Undo / redo for the grid. The grid never changes data itself: an undo is emitted as
    inverse `edits` (newValue -> oldValue, last cell first), a redo re-emits the original.
    A cell somebody else changed in the meantime is skipped rather than overwritten.     */

import { SheetEdit, SheetRowId } from './sheet-grid.types';

export type CurrentValue = (rowId: SheetRowId, key: string) => string | undefined;

export interface UndoResult {
    /** edits to emit (oldValue = the cell's current value) */
    edits: SheetEdit[];
    /** cells left alone because their value is no longer the one this step produced (or the row is gone) */
    skipped: number;
    label: string;
}

export interface UndoEntry {
    edits: SheetEdit[];
    label: string;
}

/** The edits that undo `edits`: reverse order, old and new swapped. */
export function invertEdits(edits: SheetEdit[]): SheetEdit[] {
    const out: SheetEdit[] = [];
    for (let i = edits.length - 1; i >= 0; i--) {
        const e = edits[i];
        out.push({ rowId: e.rowId, key: e.key, oldValue: e.newValue, newValue: e.oldValue });
    }
    return out;
}

/**
 * Keeps only the edits that can be applied cleanly: the cell must still hold `oldValue`
 * (the value the step expects to replace). Cells already at `newValue` are dropped silently.
 */
export function applicableEdits(edits: SheetEdit[], current: CurrentValue): { edits: SheetEdit[]; skipped: number } {
    const out: SheetEdit[] = [];
    let skipped = 0;
    for (const e of edits) {
        const cur = current(e.rowId, e.key);
        if (cur === undefined) {
            skipped++;
            continue;
        }
        const c = cur || '';
        if (c === (e.newValue || '')) {
            continue; // already there
        }
        if (c !== (e.oldValue || '')) {
            skipped++;
            continue;
        }
        out.push({ rowId: e.rowId, key: e.key, oldValue: c, newValue: e.newValue });
    }
    return { edits: out, skipped };
}

export class SheetUndoStack {
    private undoList: UndoEntry[] = [];
    private redoList: UndoEntry[] = [];

    constructor(public readonly limit = 200) { }

    get canUndo(): boolean {
        return this.undoList.length > 0;
    }

    get canRedo(): boolean {
        return this.redoList.length > 0;
    }

    get undoLabel(): string {
        return this.undoList.length ? this.undoList[this.undoList.length - 1].label : '';
    }

    get redoLabel(): string {
        return this.redoList.length ? this.redoList[this.redoList.length - 1].label : '';
    }

    /** Records one user action. Clears the redo list. Returns the step (for extendEntry), or null when nothing changed. */
    push(edits: SheetEdit[], label = 'edit'): UndoEntry | null {
        const list = (edits || []).filter(e => (e.oldValue || '') !== (e.newValue || ''));
        if (!list.length) {
            return null;
        }
        const entry: UndoEntry = { edits: list.map(e => ({ ...e })), label };
        this.undoList.push(entry);
        if (this.undoList.length > this.limit) {
            this.undoList.shift();
        }
        this.redoList = [];
        return entry;
    }

    /**
     * Adds edits to a step recorded earlier (the second part of a paste that ran past the last
     * row). Returns false when that step has been undone meanwhile: the caller drops the edits.
     * A step that fell off the bottom of the list is recorded as a new step.
     */
    extendEntry(entry: UndoEntry | null, edits: SheetEdit[]): boolean {
        const list = (edits || []).filter(e => (e.oldValue || '') !== (e.newValue || ''));
        if (!entry) {
            this.push(list);
            return true;
        }
        if (this.redoList.indexOf(entry) >= 0) {
            return false;
        }
        if (this.undoList.indexOf(entry) < 0) {
            this.push(list, entry.label);
            return true;
        }
        entry.edits = entry.edits.concat(list.map(e => ({ ...e })));
        return true;
    }

    /** True while the step can still be undone (it was not undone and not dropped). */
    isLive(entry: UndoEntry | null): boolean {
        return !!entry && this.undoList.indexOf(entry) >= 0;
    }

    undo(current: CurrentValue): UndoResult | null {
        const entry = this.undoList.pop();
        if (!entry) {
            return null;
        }
        this.redoList.push(entry);
        const r = applicableEdits(invertEdits(entry.edits), current);
        return { edits: r.edits, skipped: r.skipped, label: entry.label };
    }

    redo(current: CurrentValue): UndoResult | null {
        const entry = this.redoList.pop();
        if (!entry) {
            return null;
        }
        this.undoList.push(entry);
        const r = applicableEdits(entry.edits, current);
        return { edits: r.edits, skipped: r.skipped, label: entry.label };
    }

    clear(): void {
        this.undoList = [];
        this.redoList = [];
    }
}
