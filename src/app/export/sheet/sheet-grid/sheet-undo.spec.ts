import { SheetEdit, SheetRowId } from './sheet-grid.types';
import { applicableEdits, invertEdits, SheetUndoStack } from './sheet-undo';

/** A tiny model of the parent's data: the grid only emits edits, the "parent" applies them here. */
class Model {
    private cells = new Map<string, string>();

    constructor(rows: { [rowId: string]: { [key: string]: string } }) {
        for (const r of Object.keys(rows)) {
            for (const k of Object.keys(rows[r])) {
                this.cells.set(r + '|' + k, rows[r][k]);
            }
        }
    }

    current = (rowId: SheetRowId, key: string): string | undefined => this.cells.get(rowId + '|' + key);

    get(rowId: SheetRowId, key: string): string | undefined {
        return this.current(rowId, key);
    }

    set(rowId: SheetRowId, key: string, v: string): void {
        this.cells.set(rowId + '|' + key, v);
    }

    removeRow(rowId: SheetRowId): void {
        for (const k of Array.from(this.cells.keys())) {
            if (k.startsWith(rowId + '|')) {
                this.cells.delete(k);
            }
        }
    }

    apply(edits: SheetEdit[]): void {
        for (const e of edits) {
            this.set(e.rowId, e.key, e.newValue);
        }
    }
}

function edit(rowId: SheetRowId, key: string, oldValue: string, newValue: string): SheetEdit {
    return { rowId, key, oldValue, newValue };
}

describe('sheet-undo', () => {

    describe('invertEdits', () => {
        it('swaps old and new and reverses the order', () => {
            const edits = [edit(1, 'a', '', 'x'), edit(2, 'b', 'y', 'z'), edit(3, 'c', 'p', 'q')];
            expect(invertEdits(edits)).toEqual([
                edit(3, 'c', 'q', 'p'),
                edit(2, 'b', 'z', 'y'),
                edit(1, 'a', 'x', '')
            ]);
        });

        it('returns an empty list for an empty list', () => {
            expect(invertEdits([])).toEqual([]);
        });

        it('does not mutate its input and returns new objects', () => {
            const edits = [edit(1, 'a', '1', '2'), edit(2, 'a', '3', '4')];
            const copy = JSON.parse(JSON.stringify(edits));
            const inv = invertEdits(edits);
            expect(edits).toEqual(copy);
            expect(inv[0]).not.toBe(edits[1]);
        });

        it('inverting twice gives the original edits back', () => {
            const edits = [edit(1, 'a', '1', '2'), edit('r2', 'b', '', 'x')];
            expect(invertEdits(invertEdits(edits))).toEqual(edits);
        });
    });

    describe('applicableEdits', () => {
        it('keeps an edit whose cell still holds oldValue, with oldValue = the current value', () => {
            const m = new Model({ 1: { a: 'old' } });
            expect(applicableEdits([edit(1, 'a', 'old', 'new')], m.current)).toEqual({
                edits: [edit(1, 'a', 'old', 'new')],
                skipped: 0
            });
        });

        it('skips (and counts) an edit whose cell was changed by somebody else', () => {
            const m = new Model({ 1: { a: 'someone else' } });
            expect(applicableEdits([edit(1, 'a', 'old', 'new')], m.current)).toEqual({ edits: [], skipped: 1 });
        });

        it('skips (and counts) an edit whose row is gone', () => {
            const m = new Model({ 1: { a: 'old' } });
            expect(applicableEdits([edit(2, 'a', 'old', 'new')], m.current)).toEqual({ edits: [], skipped: 1 });
        });

        it('drops silently, without counting, an edit whose cell already holds newValue', () => {
            const m = new Model({ 1: { a: 'new' } });
            expect(applicableEdits([edit(1, 'a', 'old', 'new')], m.current)).toEqual({ edits: [], skipped: 0 });
        });

        it('treats an empty string and a missing value of an existing cell alike', () => {
            const m = new Model({ 1: { a: '' } });
            expect(applicableEdits([edit(1, 'a', undefined as any, 'x')], m.current).edits.length).toBe(1);
            expect(applicableEdits([edit(1, 'a', '', undefined as any)], m.current)).toEqual({ edits: [], skipped: 0 });
        });

        it('mixes applicable, skipped and already-applied edits and keeps the order', () => {
            const m = new Model({ 1: { a: '1' }, 2: { a: 'changed' }, 3: { a: '33' } });
            const r = applicableEdits([
                edit(1, 'a', '1', '11'),
                edit(2, 'a', '2', '22'),
                edit(3, 'a', '3', '33'),
                edit(4, 'a', '4', '44')
            ], m.current);
            expect(r.edits).toEqual([edit(1, 'a', '1', '11')]);
            expect(r.skipped).toBe(2);
        });
    });

    describe('SheetUndoStack', () => {
        let model: Model;
        let stack: SheetUndoStack;

        beforeEach(() => {
            model = new Model({ 1: { a: '', b: 'y' }, 2: { a: 'p', b: 'q' }, 3: { a: '', b: '' } });
            stack = new SheetUndoStack();
        });

        /** Records a user action the way the grid does: the parent applies it, the stack remembers it. */
        function act(edits: SheetEdit[], label?: string): void {
            model.apply(edits);
            stack.push(edits, label);
        }

        it('starts empty', () => {
            expect(stack.canUndo).toBe(false);
            expect(stack.canRedo).toBe(false);
            expect(stack.undoLabel).toBe('');
            expect(stack.redoLabel).toBe('');
            expect(stack.undo(model.current)).toBeNull();
            expect(stack.redo(model.current)).toBeNull();
        });

        it('has a default limit of 200', () => {
            expect(stack.limit).toBe(200);
        });

        it('enables undo after a push, with the label (default "edit")', () => {
            act([edit(1, 'a', '', 'x')]);
            expect(stack.canUndo).toBe(true);
            expect(stack.canRedo).toBe(false);
            expect(stack.undoLabel).toBe('edit');
            act([edit(2, 'a', 'p', 'P')], 'paste');
            expect(stack.undoLabel).toBe('paste');
        });

        it('undo emits the inverse edits in reverse order', () => {
            act([edit(1, 'a', '', 'x'), edit(1, 'b', 'y', 'z'), edit(2, 'a', 'p', 'P')], 'paste');
            const r = stack.undo(model.current)!;
            expect(r.label).toBe('paste');
            expect(r.skipped).toBe(0);
            expect(r.edits).toEqual([
                edit(2, 'a', 'P', 'p'),
                edit(1, 'b', 'z', 'y'),
                edit(1, 'a', 'x', '')
            ]);
        });

        it('applying the emitted undo edits restores the data', () => {
            act([edit(1, 'a', '', 'x'), edit(2, 'b', 'q', 'Q')]);
            model.apply(stack.undo(model.current)!.edits);
            expect(model.get(1, 'a')).toBe('');
            expect(model.get(2, 'b')).toBe('q');
        });

        it('moves the step to the redo side after an undo', () => {
            act([edit(1, 'a', '', 'x')], 'type');
            stack.undo(model.current);
            expect(stack.canUndo).toBe(false);
            expect(stack.canRedo).toBe(true);
            expect(stack.redoLabel).toBe('type');
            expect(stack.undoLabel).toBe('');
        });

        it('redo re-emits the original edits in the original order', () => {
            const original = [edit(1, 'a', '', 'x'), edit(1, 'b', 'y', 'z'), edit(2, 'a', 'p', 'P')];
            act(original, 'paste');
            model.apply(stack.undo(model.current)!.edits);
            const r = stack.redo(model.current)!;
            expect(r.label).toBe('paste');
            expect(r.skipped).toBe(0);
            expect(r.edits).toEqual(original);
            expect(stack.canUndo).toBe(true);
            expect(stack.canRedo).toBe(false);
        });

        it('undo then redo then undo is consistent for several steps', () => {
            act([edit(1, 'a', '', 'one')], 's1');
            act([edit(1, 'a', 'one', 'two')], 's2');
            act([edit(1, 'a', 'two', 'three'), edit(3, 'b', '', 'B')], 's3');

            const u3 = stack.undo(model.current)!;
            expect(u3.label).toBe('s3');
            model.apply(u3.edits);
            expect(model.get(1, 'a')).toBe('two');
            expect(model.get(3, 'b')).toBe('');

            const u2 = stack.undo(model.current)!;
            expect(u2.label).toBe('s2');
            model.apply(u2.edits);
            expect(model.get(1, 'a')).toBe('one');

            const r2 = stack.redo(model.current)!;
            expect(r2.label).toBe('s2');
            model.apply(r2.edits);
            expect(model.get(1, 'a')).toBe('two');

            const r3 = stack.redo(model.current)!;
            expect(r3.label).toBe('s3');
            model.apply(r3.edits);
            expect(model.get(1, 'a')).toBe('three');
            expect(model.get(3, 'b')).toBe('B');
            expect(stack.redo(model.current)).toBeNull();
        });

        it('undoes steps newest first', () => {
            act([edit(1, 'a', '', 'one')], 's1');
            act([edit(2, 'a', 'p', 'two')], 's2');
            expect(stack.undo(model.current)!.label).toBe('s2');
            expect(stack.undo(model.current)!.label).toBe('s1');
            expect(stack.undo(model.current)).toBeNull();
        });

        it('returns null from undo / redo when there is nothing left', () => {
            act([edit(1, 'a', '', 'x')]);
            expect(stack.undo(model.current)).not.toBeNull();
            expect(stack.undo(model.current)).toBeNull();
            expect(stack.redo(model.current)).not.toBeNull();
            expect(stack.redo(model.current)).toBeNull();
        });

        describe('cells changed meanwhile', () => {
            it('skips a cell that somebody else edited and reports it', () => {
                act([edit(1, 'a', '', 'x'), edit(2, 'a', 'p', 'P')]);
                model.set(1, 'a', 'edited elsewhere');
                const r = stack.undo(model.current)!;
                expect(r.skipped).toBe(1);
                expect(r.edits).toEqual([edit(2, 'a', 'P', 'p')]);
            });

            it('skips a cell whose row is gone and reports it', () => {
                act([edit(1, 'a', '', 'x'), edit(2, 'a', 'p', 'P')]);
                model.removeRow(1);
                const r = stack.undo(model.current)!;
                expect(r.skipped).toBe(1);
                expect(r.edits).toEqual([edit(2, 'a', 'P', 'p')]);
            });

            it('skips everything and reports all of it when every cell changed', () => {
                act([edit(1, 'a', '', 'x'), edit(2, 'a', 'p', 'P')]);
                model.set(1, 'a', 'm1');
                model.removeRow(2);
                const r = stack.undo(model.current)!;
                expect(r.skipped).toBe(2);
                expect(r.edits).toEqual([]);
            });

            it('does not count a cell that already holds the target value', () => {
                act([edit(1, 'a', '', 'x'), edit(2, 'a', 'p', 'P')]);
                model.set(1, 'a', ''); // somebody already reverted it
                const r = stack.undo(model.current)!;
                expect(r.skipped).toBe(0);
                expect(r.edits).toEqual([edit(2, 'a', 'P', 'p')]);
            });

            it('skips on redo too when the cell changed after the undo', () => {
                act([edit(1, 'a', '', 'x'), edit(2, 'a', 'p', 'P')]);
                model.apply(stack.undo(model.current)!.edits);
                model.set(2, 'a', 'typed after the undo');
                const r = stack.redo(model.current)!;
                expect(r.skipped).toBe(1);
                expect(r.edits).toEqual([edit(1, 'a', '', 'x')]);
            });

            it('skips on redo when the row is gone', () => {
                act([edit(1, 'a', '', 'x')]);
                model.apply(stack.undo(model.current)!.edits);
                model.removeRow(1);
                const r = stack.redo(model.current)!;
                expect(r.skipped).toBe(1);
                expect(r.edits).toEqual([]);
            });

            it('judges each undo against the live values, so an earlier step can be undone after a later one changed another cell', () => {
                act([edit(1, 'a', '', 'one')], 's1');
                act([edit(2, 'a', 'p', 'two')], 's2');
                const u2 = stack.undo(model.current)!;
                model.apply(u2.edits);
                const u1 = stack.undo(model.current)!;
                expect(u1.skipped).toBe(0);
                expect(u1.edits).toEqual([edit(1, 'a', 'one', '')]);
            });
        });

        describe('no-op edits', () => {
            it('ignores a push of edits that change nothing', () => {
                stack.push([edit(1, 'a', 'same', 'same')]);
                expect(stack.canUndo).toBe(false);
            });

            it('treats empty / missing values as equal', () => {
                stack.push([edit(1, 'a', '', ''), edit(1, 'b', undefined as any, ''), edit(1, 'b', null as any, undefined as any)]);
                expect(stack.canUndo).toBe(false);
            });

            it('ignores an empty or missing list', () => {
                stack.push([]);
                stack.push(null as any);
                stack.push(undefined as any);
                expect(stack.canUndo).toBe(false);
            });

            it('filters no-op edits out of a mixed push', () => {
                act([edit(1, 'a', '', 'x'), edit(1, 'b', 'y', 'y'), edit(2, 'a', 'p', 'P')]);
                const r = stack.undo(model.current)!;
                expect(r.edits).toEqual([edit(2, 'a', 'P', 'p'), edit(1, 'a', 'x', '')]);
            });

            it('does not clear the redo list when the pushed edits are all no-ops', () => {
                act([edit(1, 'a', '', 'x')]);
                stack.undo(model.current);
                stack.push([edit(2, 'a', 'p', 'p')]);
                expect(stack.canRedo).toBe(true);
            });

            it('does not add an undo step for a no-op push', () => {
                act([edit(1, 'a', '', 'x')], 'real');
                stack.push([edit(2, 'a', 'p', 'p')], 'noop');
                expect(stack.undoLabel).toBe('real');
            });
        });

        describe('redo list', () => {
            it('is cleared by a new push', () => {
                act([edit(1, 'a', '', 'x')], 's1');
                act([edit(2, 'a', 'p', 'P')], 's2');
                model.apply(stack.undo(model.current)!.edits);
                expect(stack.canRedo).toBe(true);
                expect(stack.redoLabel).toBe('s2');
                act([edit(3, 'a', '', 'new')], 's3');
                expect(stack.canRedo).toBe(false);
                expect(stack.redoLabel).toBe('');
                expect(stack.redo(model.current)).toBeNull();
                expect(stack.undoLabel).toBe('s3');
            });

            it('keeps several undone steps redoable in the right order until a new push', () => {
                act([edit(1, 'a', '', 'one')], 's1');
                act([edit(1, 'a', 'one', 'two')], 's2');
                model.apply(stack.undo(model.current)!.edits);
                model.apply(stack.undo(model.current)!.edits);
                expect(stack.redoLabel).toBe('s1');
                expect(stack.redo(model.current)!.label).toBe('s1');
                expect(stack.redo(model.current)!.label).toBe('s2');
            });
        });

        describe('limit', () => {
            it('keeps only the newest `limit` steps', () => {
                const small = new SheetUndoStack(3);
                const m = new Model({ 1: { a: '0' } });
                for (let i = 1; i <= 5; i++) {
                    const e = edit(1, 'a', String(i - 1), String(i));
                    m.apply([e]);
                    small.push([e], 's' + i);
                }
                expect(small.limit).toBe(3);
                const labels: string[] = [];
                let r = small.undo(m.current);
                while (r) {
                    labels.push(r.label);
                    m.apply(r.edits);
                    r = small.undo(m.current);
                }
                expect(labels).toEqual(['s5', 's4', 's3']);
                expect(m.get(1, 'a')).toBe('2'); // s1 and s2 are no longer undoable
            });

            it('keeps exactly `limit` steps, not one fewer', () => {
                const small = new SheetUndoStack(2);
                small.push([edit(1, 'a', '0', '1')], 's1');
                small.push([edit(1, 'a', '1', '2')], 's2');
                const m = new Model({ 1: { a: '2' } });
                expect(small.undo(m.current)!.label).toBe('s2');
                m.set(1, 'a', '1');
                expect(small.undo(m.current)!.label).toBe('s1');
                expect(small.undo(m.current)).toBeNull();
            });

            it('honours the default limit of 200', () => {
                const m = new Model({ 1: { a: '0' } });
                for (let i = 1; i <= 205; i++) {
                    const e = edit(1, 'a', String(i - 1), String(i));
                    m.apply([e]);
                    stack.push([e], 's' + i);
                }
                let n = 0;
                let last = '';
                let r = stack.undo(m.current);
                while (r) {
                    n++;
                    last = r.label;
                    m.apply(r.edits);
                    r = stack.undo(m.current);
                }
                expect(n).toBe(200);
                expect(last).toBe('s6');
            });
        });

        it('stores a copy of the edits (later changes to the caller\'s objects do not leak in)', () => {
            const e = edit(1, 'a', '', 'x');
            act([e]);
            e.newValue = 'tampered';
            e.oldValue = 'tampered';
            const r = stack.undo(model.current)!;
            expect(r.edits).toEqual([edit(1, 'a', 'x', '')]);
        });

        it('clear() forgets both lists', () => {
            act([edit(1, 'a', '', 'x')]);
            act([edit(2, 'a', 'p', 'P')]);
            stack.undo(model.current);
            expect(stack.canUndo).toBe(true);
            expect(stack.canRedo).toBe(true);
            stack.clear();
            expect(stack.canUndo).toBe(false);
            expect(stack.canRedo).toBe(false);
            expect(stack.undo(model.current)).toBeNull();
            expect(stack.redo(model.current)).toBeNull();
        });

        it('works with string row ids as well as numeric ones', () => {
            const m = new Model({ 'r-1': { a: 'old' } });
            const e = edit('r-1', 'a', 'old', 'new');
            m.apply([e]);
            stack.push([e]);
            expect(stack.undo(m.current)!.edits).toEqual([edit('r-1', 'a', 'new', 'old')]);
        });
    });
});

describe('SheetUndoStack.extendEntry', () => {
    const e = (rowId: number, oldValue: string, newValue: string) => ({ rowId, key: 'K', oldValue, newValue });
    it('adds to the given step, even when other steps were pushed after it', () => {
        const st = new SheetUndoStack();
        const first = st.push([e(1, 'a', 'b')], 'paste');
        st.push([e(2, 'x', 'y')], 'typing');
        expect(st.extendEntry(first, [e(3, '', 'c')])).toBeTrue();
        st.undo(id => id === 2 ? 'y' : id === 1 ? 'b' : 'c');
        const r = st.undo(id => id === 1 ? 'b' : id === 3 ? 'c' : 'x')!;
        expect(r.edits.map(x => x.rowId)).toEqual([3, 1]);
    });
    it('refuses (returns false) when the step was undone meanwhile', () => {
        const st = new SheetUndoStack();
        const first = st.push([e(1, 'a', 'b')], 'paste');
        st.undo(() => 'b');
        expect(st.extendEntry(first, [e(3, '', 'c')])).toBeFalse();
        expect(st.isLive(first)).toBeFalse();
    });
    it('records a new step when there is no step to extend', () => {
        const st = new SheetUndoStack();
        expect(st.extendEntry(null, [e(3, '', 'c')])).toBeTrue();
        expect(st.canUndo).toBeTrue();
    });
});

