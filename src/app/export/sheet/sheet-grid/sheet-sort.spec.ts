import { SheetCellKind, SheetFilter, SheetRow } from './sheet-grid.types';
import {
    compareCells, compileFilters, distinctValues, isFilterActive, matchCondition, selectionStats, sortRows
} from './sheet-sort';

function row(id: number | string, v: string | undefined, key = 'k'): SheetRow {
    return { id, values: v === undefined ? {} : { [key]: v } };
}

function ids(rows: SheetRow[]): (number | string)[] {
    return rows.map(r => r.id);
}

function rowsOf(...vals: string[]): SheetRow[] {
    return vals.map((v, i) => row(i + 1, v));
}

const sign = (n: number) => Math.sign(n);

describe('sheet-sort', () => {

    describe('compareCells', () => {
        describe('date columns', () => {
            it('orders dates chronologically, not as text', () => {
                expect(sign(compareCells('09-01-2027', '31-12-2026', 'date'))).toBe(1);
                expect(sign(compareCells('31-12-2026', '09-01-2027', 'date'))).toBe(-1);
                expect(sign(compareCells('15-10-2026', '15-10-2026', 'date'))).toBe(0);
                expect(sign(compareCells('01-03-2026', '30-01-2026', 'date'))).toBe(1);
            });

            it('compares different spellings of dates by their value', () => {
                expect(sign(compareCells('2026-10-14', '15-10-2026', 'date'))).toBe(-1);
                expect(sign(compareCells('14/10/2026', '14-10-2026', 'date'))).toBe(0);
                expect(sign(compareCells('14-Oct-2026', '13/10/2026', 'date'))).toBe(1);
            });

            it('puts real dates before notes and ranges', () => {
                expect(sign(compareCells('14-10-2026', 'Will be updated', 'date'))).toBe(-1);
                expect(sign(compareCells('Will be updated', '14-10-2026', 'date'))).toBe(1);
                expect(sign(compareCells('14-10-2026', '26-08/27-08', 'date'))).toBe(-1);
                expect(sign(compareCells('31-02-2026', '14-10-2026', 'date'))).toBe(1);
            });

            it('orders two notes as text', () => {
                expect(sign(compareCells('ETA unknown', 'Will be updated', 'date'))).toBe(-1);
                expect(sign(compareCells('Will be updated', 'ETA unknown', 'date'))).toBe(1);
                expect(sign(compareCells('tbc', 'TBC', 'date'))).toBe(0);
            });
        });

        describe('number columns', () => {
            it('orders numbers numerically, not as text', () => {
                expect(sign(compareCells('9', '10', 'num'))).toBe(-1);
                expect(sign(compareCells('100', '20', 'num'))).toBe(1);
                expect(sign(compareCells('1.5', '1.25', 'num'))).toBe(1);
                expect(sign(compareCells('-3', '2', 'num'))).toBe(-1);
                expect(sign(compareCells('1,000', '999', 'num'))).toBe(1);
                expect(sign(compareCells('2.0', '2', 'num'))).toBe(0);
            });

            it('puts numbers before anything else', () => {
                expect(sign(compareCells('5', 'n/a', 'num'))).toBe(-1);
                expect(sign(compareCells('n/a', '5', 'num'))).toBe(1);
            });

            it('orders non-numbers as text', () => {
                expect(sign(compareCells('abc', 'abd', 'num'))).toBe(-1);
            });
        });

        describe('text columns', () => {
            it('orders naturally (embedded numbers by value)', () => {
                expect(sign(compareCells('item2', 'item10', 'text'))).toBe(-1);
                expect(sign(compareCells('item2', 'item10', undefined))).toBe(-1);
            });

            it('ignores case', () => {
                expect(sign(compareCells('a', 'A', 'text'))).toBe(0);
                expect(sign(compareCells('apple', 'Banana', 'text'))).toBe(-1);
                expect(sign(compareCells('Banana', 'apple', 'text'))).toBe(1);
            });

            it('does not treat dates as dates', () => {
                // day first when read as text: 09 < 31
                expect(sign(compareCells('09-01-2027', '31-12-2026', 'text'))).toBe(-1);
            });
        });

        it('trims both sides', () => {
            expect(sign(compareCells(' 5 ', '5', 'num'))).toBe(0);
            expect(sign(compareCells(' a', 'a ', 'text'))).toBe(0);
            expect(sign(compareCells('  14-10-2026 ', '14-10-2026', 'date'))).toBe(0);
        });

        it('treats null / undefined as empty text', () => {
            expect(sign(compareCells(undefined as any, 'a', 'text'))).toBe(-1);
            expect(sign(compareCells(null as any, '', 'text'))).toBe(0);
        });
    });

    describe('sortRows', () => {
        it('sorts dates as dates (not text), ascending', () => {
            const rows = rowsOf('09-01-2027', '31-12-2026', '15-10-2026', '01-03-2026');
            expect(ids(sortRows(rows, 'k', 'asc', 'date'))).toEqual([4, 3, 2, 1]);
        });

        it('sorts dates as dates, descending', () => {
            const rows = rowsOf('09-01-2027', '31-12-2026', '15-10-2026', '01-03-2026');
            expect(ids(sortRows(rows, 'k', 'desc', 'date'))).toEqual([1, 2, 3, 4]);
        });

        it('sorts dates written in different formats by value', () => {
            const rows = rowsOf('2026-10-14', '13/10/2026', '15-Oct-2026', '14-10-2026');
            expect(ids(sortRows(rows, 'k', 'asc', 'date'))).toEqual([2, 1, 4, 3]);
        });

        it('differs from a plain text sort for dd-mm-yyyy dates (regression guard)', () => {
            const rows = rowsOf('09-01-2027', '31-12-2026');
            expect(ids(sortRows(rows, 'k', 'asc', 'date'))).toEqual([2, 1]);
            expect(ids(sortRows(rows, 'k', 'asc', 'text'))).toEqual([1, 2]);
        });

        it('sorts notes and ranges after the dates when ascending', () => {
            const rows = rowsOf('Will be updated', '14-10-2026', '26-08/27-08', '01-01-2026');
            expect(ids(sortRows(rows, 'k', 'asc', 'date'))).toEqual([4, 2, 3, 1]);
        });

        it('reverses the groups too when descending: notes, then dates newest first', () => {
            const rows = rowsOf('14-10-2026', 'Will be updated', '01-01-2026', '');
            expect(ids(sortRows(rows, 'k', 'desc', 'date'))).toEqual([2, 1, 3, 4]);
        });

        it('sorts numbers as numbers', () => {
            const rows = rowsOf('10', '9', '100', '1.5', '-2');
            expect(ids(sortRows(rows, 'k', 'asc', 'num'))).toEqual([5, 4, 2, 1, 3]);
            expect(ids(sortRows(rows, 'k', 'desc', 'num'))).toEqual([3, 1, 2, 4, 5]);
        });

        it('sorts text naturally and ignores case', () => {
            const rows = rowsOf('item10', 'Item2', 'banana', 'Apple');
            expect(ids(sortRows(rows, 'k', 'asc', 'text'))).toEqual([4, 3, 2, 1]);
            expect(ids(sortRows(rows, 'k', 'asc', undefined))).toEqual([4, 3, 2, 1]);
            expect(ids(sortRows(rows, 'k', 'desc', 'text'))).toEqual([1, 2, 3, 4]);
        });

        describe('blanks', () => {
            it('stay last when ascending', () => {
                const rows = rowsOf('', 'b', 'a', 'c');
                expect(ids(sortRows(rows, 'k', 'asc', 'text'))).toEqual([3, 2, 4, 1]);
            });

            it('stay last when descending', () => {
                const rows = rowsOf('', 'b', 'a', 'c');
                expect(ids(sortRows(rows, 'k', 'desc', 'text'))).toEqual([4, 2, 3, 1]);
            });

            it('stay last for dates in both directions', () => {
                const rows = rowsOf('', '14-10-2026', '', '01-01-2026');
                expect(ids(sortRows(rows, 'k', 'asc', 'date'))).toEqual([4, 2, 1, 3]);
                expect(ids(sortRows(rows, 'k', 'desc', 'date'))).toEqual([2, 4, 1, 3]);
            });

            it('stay last for numbers in both directions', () => {
                const rows = rowsOf('', '5', '-1', '');
                expect(ids(sortRows(rows, 'k', 'asc', 'num'))).toEqual([3, 2, 1, 4]);
                expect(ids(sortRows(rows, 'k', 'desc', 'num'))).toEqual([2, 3, 1, 4]);
            });

            it('include whitespace-only values and keep their original order', () => {
                const rows = rowsOf('  ', 'b', '', 'a', '\t');
                expect(ids(sortRows(rows, 'k', 'asc', 'text'))).toEqual([4, 2, 1, 3, 5]);
                expect(ids(sortRows(rows, 'k', 'desc', 'text'))).toEqual([2, 4, 1, 3, 5]);
            });

            it('include rows with a missing key or no values at all', () => {
                const rows: SheetRow[] = [row(1, undefined), row(2, 'b'), ({ id: 3 } as any), row(4, 'a')];
                expect(ids(sortRows(rows, 'k', 'asc', 'text'))).toEqual([4, 2, 1, 3]);
                expect(ids(sortRows(rows, 'k', 'desc', 'text'))).toEqual([2, 4, 1, 3]);
            });

            it('are all-blank columns left in the original order', () => {
                const rows = rowsOf('', '', '');
                expect(ids(sortRows(rows, 'k', 'asc', 'text'))).toEqual([1, 2, 3]);
                expect(ids(sortRows(rows, 'k', 'desc', 'text'))).toEqual([1, 2, 3]);
            });
        });

        describe('stability', () => {
            it('keeps the original order of equal values when ascending', () => {
                const rows = rowsOf('b', 'a', 'b', 'a', 'b');
                expect(ids(sortRows(rows, 'k', 'asc', 'text'))).toEqual([2, 4, 1, 3, 5]);
            });

            it('keeps the original order of equal values when descending', () => {
                const rows = rowsOf('b', 'a', 'b', 'a', 'b');
                expect(ids(sortRows(rows, 'k', 'desc', 'text'))).toEqual([1, 3, 5, 2, 4]);
            });

            it('keeps the original order of equal dates spelt differently', () => {
                const rows = rowsOf('14/10/2026', '14-10-2026', '2026-10-14', '13-10-2026');
                expect(ids(sortRows(rows, 'k', 'asc', 'date'))).toEqual([4, 1, 2, 3]);
                expect(ids(sortRows(rows, 'k', 'desc', 'date'))).toEqual([1, 2, 3, 4]);
            });

            it('keeps the original order of values equal ignoring case and padding', () => {
                const rows = rowsOf('a', 'A', ' a ');
                expect(ids(sortRows(rows, 'k', 'asc', 'text'))).toEqual([1, 2, 3]);
                expect(ids(sortRows(rows, 'k', 'desc', 'text'))).toEqual([1, 2, 3]);
            });

            it('keeps the original order of numerically equal values', () => {
                const rows = rowsOf('2', '2.0', '02', '1');
                expect(ids(sortRows(rows, 'k', 'asc', 'num'))).toEqual([4, 1, 2, 3]);
            });

            it('sorting an already sorted list changes nothing', () => {
                const rows = rowsOf('a', 'b', 'c', '');
                expect(ids(sortRows(rows, 'k', 'asc', 'text'))).toEqual([1, 2, 3, 4]);
            });

            it('sorts a large list stably', () => {
                const rows: SheetRow[] = [];
                for (let i = 0; i < 500; i++) {
                    rows.push(row(i, String(i % 7)));
                }
                const out = sortRows(rows, 'k', 'asc', 'num');
                for (let i = 1; i < out.length; i++) {
                    const a = +out[i - 1].values['k'];
                    const b = +out[i].values['k'];
                    expect(a <= b).toBe(true);
                    if (a === b) {
                        expect(+out[i - 1].id < +out[i].id).toBe(true);
                    }
                }
            });
        });

        it('does not mutate the input array and returns the same row objects', () => {
            const rows = rowsOf('b', 'a');
            const copy = rows.slice();
            const out = sortRows(rows, 'k', 'asc', 'text');
            expect(rows).toEqual(copy);
            expect(rows[0]).toBe(copy[0]);
            expect(out).not.toBe(rows);
            expect(out[0]).toBe(copy[1]);
            expect(out[1]).toBe(copy[0]);
        });

        it('sorts by the requested key only', () => {
            const rows: SheetRow[] = [
                { id: 1, values: { a: '2', b: 'x' } },
                { id: 2, values: { a: '1', b: 'z' } },
                { id: 3, values: { a: '3', b: 'y' } }
            ];
            expect(ids(sortRows(rows, 'a', 'asc', 'num'))).toEqual([2, 1, 3]);
            expect(ids(sortRows(rows, 'b', 'asc', 'text'))).toEqual([1, 3, 2]);
        });

        it('copes with an empty list', () => {
            expect(sortRows([], 'k', 'asc', 'text')).toEqual([]);
        });

        it('keeps extra properties of a subtype', () => {
            interface Ext extends SheetRow { extra: string; }
            const rows: Ext[] = [{ id: 1, values: { k: 'b' }, extra: 'one' }, { id: 2, values: { k: 'a' }, extra: 'two' }];
            expect(sortRows(rows, 'k', 'asc', 'text').map(r => r.extra)).toEqual(['two', 'one']);
        });
    });

    describe('matchCondition', () => {
        const m = (value: string, op: string, arg?: string, kind?: SheetCellKind) =>
            matchCondition(value, { op, value: arg }, kind);

        it('matches everything without a usable condition', () => {
            expect(matchCondition('x', null, 'text')).toBe(true);
            expect(matchCondition('x', undefined, 'text')).toBe(true);
            expect(matchCondition('x', { op: '' }, 'text')).toBe(true);
            expect(matchCondition('x', { op: 'noSuchOp', value: 'y' }, 'text')).toBe(true);
        });

        describe('empty / notEmpty', () => {
            it('empty', () => {
                expect(m('', 'empty')).toBe(true);
                expect(m('   ', 'empty')).toBe(true);
                expect(m(undefined as any, 'empty')).toBe(true);
                expect(m('x', 'empty')).toBe(false);
            });

            it('notEmpty', () => {
                expect(m('x', 'notEmpty')).toBe(true);
                expect(m(' x ', 'notEmpty')).toBe(true);
                expect(m('', 'notEmpty')).toBe(false);
                expect(m('  ', 'notEmpty')).toBe(false);
            });
        });

        describe('text operators', () => {
            it('contains is case-insensitive and trims', () => {
                expect(m('Hello World', 'contains', 'lo wo')).toBe(true);
                expect(m('Hello World', 'contains', ' WORLD ')).toBe(true);
                expect(m('Hello World', 'contains', 'xyz')).toBe(false);
                expect(m('', 'contains', 'x')).toBe(false);
            });

            it('notContains', () => {
                expect(m('Hello World', 'notContains', 'xyz')).toBe(true);
                expect(m('Hello World', 'notContains', 'WORLD')).toBe(false);
                expect(m('', 'notContains', 'x')).toBe(true);
            });

            it('startsWith', () => {
                expect(m('Hello World', 'startsWith', 'hello')).toBe(true);
                expect(m('Hello World', 'startsWith', 'world')).toBe(false);
                expect(m('  Hello', 'startsWith', 'He')).toBe(true);
            });

            it('endsWith', () => {
                expect(m('Hello World', 'endsWith', 'WORLD')).toBe(true);
                expect(m('Hello World', 'endsWith', 'hello')).toBe(false);
                expect(m('Hello  ', 'endsWith', 'llo')).toBe(true);
            });

            it('equals', () => {
                expect(m('Hello', 'equals', 'hello')).toBe(true);
                expect(m(' Hello ', 'equals', 'HELLO ')).toBe(true);
                expect(m('Hello World', 'equals', 'hello')).toBe(false);
                expect(m('', 'equals', '')).toBe(true);
            });
        });

        describe('date operators', () => {
            it('dateIs compares the date value whatever the spelling', () => {
                expect(m('14-10-2026', 'dateIs', '14-10-2026', 'date')).toBe(true);
                expect(m('14-10-2026', 'dateIs', '2026-10-14', 'date')).toBe(true);
                expect(m('14/10/2026', 'dateIs', '14-Oct-2026', 'date')).toBe(true);
                expect(m('14-10-2026', 'dateIs', '15-10-2026', 'date')).toBe(false);
            });

            it('dateBefore is strict', () => {
                expect(m('13-10-2026', 'dateBefore', '14-10-2026', 'date')).toBe(true);
                expect(m('14-10-2026', 'dateBefore', '14-10-2026', 'date')).toBe(false);
                expect(m('15-10-2026', 'dateBefore', '14-10-2026', 'date')).toBe(false);
            });

            it('dateAfter is strict', () => {
                expect(m('15-10-2026', 'dateAfter', '14-10-2026', 'date')).toBe(true);
                expect(m('14-10-2026', 'dateAfter', '14-10-2026', 'date')).toBe(false);
                expect(m('13-10-2026', 'dateAfter', '14-10-2026', 'date')).toBe(false);
            });

            it('compares across month and year boundaries as dates', () => {
                expect(m('31-12-2026', 'dateBefore', '01-01-2027', 'date')).toBe(true);
                expect(m('09-01-2027', 'dateAfter', '31-12-2026', 'date')).toBe(true);
                expect(m('09-01-2027', 'dateBefore', '31-12-2026', 'date')).toBe(false);
            });

            it('never matches a value that is not a date (note, range, blank)', () => {
                for (const op of ['dateIs', 'dateBefore', 'dateAfter']) {
                    expect(m('Will be updated', op, '14-10-2026', 'date')).withContext(op).toBe(false);
                    expect(m('26-08/27-08', op, '14-10-2026', 'date')).withContext(op).toBe(false);
                    expect(m('', op, '14-10-2026', 'date')).withContext(op).toBe(false);
                }
            });

            it('never matches when the comparison date is not a date', () => {
                for (const op of ['dateIs', 'dateBefore', 'dateAfter']) {
                    expect(m('14-10-2026', op, 'soon', 'date')).withContext(op).toBe(false);
                    expect(m('14-10-2026', op, '', 'date')).withContext(op).toBe(false);
                    expect(m('14-10-2026', op, undefined, 'date')).withContext(op).toBe(false);
                }
            });

            it('trims the value and the argument', () => {
                expect(m(' 14-10-2026 ', 'dateIs', ' 14/10/2026 ', 'date')).toBe(true);
            });
        });

        describe('number operators', () => {
            it('gt compares numerically', () => {
                expect(m('10', 'gt', '9', 'num')).toBe(true);
                expect(m('9', 'gt', '10', 'num')).toBe(false);
                expect(m('9', 'gt', '9', 'num')).toBe(false);
                expect(m('-1', 'gt', '-2', 'num')).toBe(true);
                expect(m('1,000', 'gt', '999', 'num')).toBe(true);
            });

            it('lt compares numerically', () => {
                expect(m('9', 'lt', '10', 'num')).toBe(true);
                expect(m('10', 'lt', '9', 'num')).toBe(false);
                expect(m('9', 'lt', '9', 'num')).toBe(false);
                expect(m('1.5', 'lt', '1.75', 'num')).toBe(true);
            });

            it('eqNum compares numerically', () => {
                expect(m('1.0', 'eqNum', '1', 'num')).toBe(true);
                expect(m('2.5', 'eqNum', '2.5', 'num')).toBe(true);
                expect(m('2.5', 'eqNum', '2.6', 'num')).toBe(false);
                expect(m(' 7 ', 'eqNum', ' 7', 'num')).toBe(true);
            });

            it('never matches a value that is not a number', () => {
                for (const op of ['gt', 'lt', 'eqNum']) {
                    expect(m('abc', op, '5', 'num')).withContext(op).toBe(false);
                    expect(m('', op, '5', 'num')).withContext(op).toBe(false);
                }
            });

            it('never matches when the argument is not a number', () => {
                for (const op of ['gt', 'lt', 'eqNum']) {
                    expect(m('5', op, 'abc', 'num')).withContext(op).toBe(false);
                    expect(m('5', op, '', 'num')).withContext(op).toBe(false);
                    expect(m('5', op, undefined, 'num')).withContext(op).toBe(false);
                }
            });

            it('does not depend on the column kind', () => {
                expect(m('10', 'gt', '9', undefined)).toBe(true);
                expect(m('14-10-2026', 'dateIs', '14-10-2026', undefined)).toBe(true);
            });
        });
    });

    describe('isFilterActive', () => {
        it('is false without a filter', () => {
            expect(isFilterActive(null)).toBe(false);
            expect(isFilterActive(undefined)).toBe(false);
            expect(isFilterActive({})).toBe(false);
        });

        it('is true for a values list, even an empty one', () => {
            expect(isFilterActive({ values: ['a'] })).toBe(true);
            expect(isFilterActive({ values: [] })).toBe(true);
        });

        it('is false for null values and a cleared condition', () => {
            expect(isFilterActive({ values: null })).toBe(false);
            expect(isFilterActive({ cond: null })).toBe(false);
            expect(isFilterActive({ cond: { op: '' as any } })).toBe(false);
        });

        it('is true for a condition', () => {
            expect(isFilterActive({ cond: { op: 'empty' } })).toBe(true);
            expect(isFilterActive({ cond: { op: 'contains', value: 'x' } })).toBe(true);
        });
    });

    describe('compileFilters', () => {
        const kindOf = (key: string): SheetCellKind | undefined =>
            key === 'date' ? 'date' : key === 'num' ? 'num' : undefined;

        const data: SheetRow[] = [
            { id: 1, values: { name: 'Alpha', date: '14-10-2026', num: '5' } },
            { id: 2, values: { name: 'alpine', date: '01-01-2026', num: '12' } },
            { id: 3, values: { name: 'Beta', date: 'Will be updated', num: '' } },
            { id: 4, values: { name: '', date: '', num: 'n/a' } },
            { id: 5, values: { name: ' Alpha ', date: '31-12-2026', num: '100' } },
            { id: 6, values: {} }
        ];

        function run(filters: { [k: string]: SheetFilter } | null | undefined, except?: string): number[] | null {
            const f = compileFilters(filters, kindOf, except);
            return f ? data.filter(f).map(r => +r.id) : null;
        }

        it('returns null when there is nothing to filter', () => {
            expect(compileFilters(null, kindOf)).toBeNull();
            expect(compileFilters(undefined, kindOf)).toBeNull();
            expect(compileFilters({}, kindOf)).toBeNull();
            expect(compileFilters({ name: {} }, kindOf)).toBeNull();
            expect(compileFilters({ name: { values: null, cond: null } }, kindOf)).toBeNull();
        });

        describe('values list', () => {
            it('keeps only rows whose value is in the list', () => {
                expect(run({ name: { values: ['Beta'] } })).toEqual([3]);
                expect(run({ name: { values: ['Beta', 'alpine'] } })).toEqual([2, 3]);
            });

            it('is case-sensitive for list values (they are display values)', () => {
                expect(run({ name: { values: ['alpha'] } })).toEqual([]);
            });

            it('trims the row values and the list values', () => {
                expect(run({ name: { values: ['Alpha'] } })).toEqual([1, 5]);
                expect(run({ name: { values: [' Alpha '] } })).toEqual([1, 5]);
            });

            it('uses "" for blanks, including rows without that key', () => {
                expect(run({ name: { values: [''] } })).toEqual([4, 6]);
                expect(run({ name: { values: ['', 'Beta'] } })).toEqual([3, 4, 6]);
            });

            it('an empty list lets no row through', () => {
                expect(run({ name: { values: [] } })).toEqual([]);
            });

            it('works for date text values as they are displayed', () => {
                expect(run({ date: { values: ['14-10-2026', 'Will be updated'] } })).toEqual([1, 3]);
            });
        });

        describe('condition', () => {
            it('applies a text condition', () => {
                expect(run({ name: { cond: { op: 'startsWith', value: 'al' } } })).toEqual([1, 2, 5]);
                expect(run({ name: { cond: { op: 'equals', value: 'alpha' } } })).toEqual([1, 5]);
                expect(run({ name: { cond: { op: 'empty' } } })).toEqual([4, 6]);
                expect(run({ name: { cond: { op: 'notEmpty' } } })).toEqual([1, 2, 3, 5]);
            });

            it('applies a date condition with the column\'s kind', () => {
                expect(run({ date: { cond: { op: 'dateBefore', value: '2026-10-14' } } })).toEqual([2]);
                expect(run({ date: { cond: { op: 'dateAfter', value: '14/10/2026' } } })).toEqual([5]);
                expect(run({ date: { cond: { op: 'dateIs', value: '14-Oct-2026' } } })).toEqual([1]);
            });

            it('applies a number condition', () => {
                expect(run({ num: { cond: { op: 'gt', value: '10' } } })).toEqual([2, 5]);
                expect(run({ num: { cond: { op: 'lt', value: '10' } } })).toEqual([1]);
                expect(run({ num: { cond: { op: 'eqNum', value: '12' } } })).toEqual([2]);
            });
        });

        describe('values list and condition together', () => {
            it('require both', () => {
                const r = run({ name: { values: ['Alpha', 'alpine', 'Beta'], cond: { op: 'startsWith', value: 'alp' } } });
                expect(r).toEqual([1, 2, 5]);
            });

            it('give nothing when they contradict each other', () => {
                expect(run({ name: { values: ['Beta'], cond: { op: 'startsWith', value: 'al' } } })).toEqual([]);
            });
        });

        describe('several columns', () => {
            it('require every column\'s filter', () => {
                expect(run({
                    name: { values: ['Alpha', 'alpine'] },
                    num: { cond: { op: 'gt', value: '10' } }
                })).toEqual([2, 5]);
            });

            it('ignores inactive columns', () => {
                expect(run({ name: { values: ['Beta'] }, num: {}, date: { values: null } })).toEqual([3]);
            });
        });

        describe('exceptKey (for the filter menu of that column)', () => {
            it('leaves that column\'s own filter out and still applies the others', () => {
                const filters: { [k: string]: SheetFilter } = {
                    name: { values: ['Beta'] },
                    num: { cond: { op: 'gt', value: '10' } }
                };
                expect(run(filters)).toEqual([]);
                expect(run(filters, 'name')).toEqual([2, 5]);
                expect(run(filters, 'num')).toEqual([3]);
            });

            it('returns null when the excepted column is the only active filter', () => {
                expect(run({ name: { values: ['Beta'] } }, 'name')).toBeNull();
            });

            it('ignores an exceptKey that has no filter', () => {
                expect(run({ name: { values: ['Beta'] } }, 'other')).toEqual([3]);
            });
        });

        it('asks kindOf for the filtered columns only', () => {
            const spy = jasmine.createSpy('kindOf').and.callFake(kindOf);
            compileFilters({ name: { values: ['x'] }, num: { cond: { op: 'gt', value: '1' } }, date: {} }, spy, 'name');
            expect(spy).toHaveBeenCalledWith('num');
            expect(spy).not.toHaveBeenCalledWith('name');
            expect(spy).not.toHaveBeenCalledWith('date');
        });

        it('treats a row without a values object as blank', () => {
            const f = compileFilters({ name: { values: [''] } }, kindOf)!;
            expect(f(({ id: 99 } as any))).toBe(true);
            const g = compileFilters({ name: { values: ['x'] } }, kindOf)!;
            expect(g(({ id: 99 } as any))).toBe(false);
        });
    });

    describe('distinctValues', () => {
        it('counts trimmed distinct values', () => {
            const rows = rowsOf('a', 'b', 'a', ' a ', 'b', 'c');
            expect(distinctValues(rows, 'k', 'text')).toEqual([
                { value: 'a', count: 3 },
                { value: 'b', count: 2 },
                { value: 'c', count: 1 }
            ]);
        });

        it('sorts text ascending, naturally, case-insensitively', () => {
            const rows = rowsOf('item10', 'Item2', 'banana', 'Apple');
            expect(distinctValues(rows, 'k', 'text').map(d => d.value)).toEqual(['Apple', 'banana', 'Item2', 'item10']);
        });

        it('sorts dates chronologically with notes after them', () => {
            const rows = rowsOf('09-01-2027', 'Will be updated', '31-12-2026', '15-10-2026', '09-01-2027');
            expect(distinctValues(rows, 'k', 'date')).toEqual([
                { value: '15-10-2026', count: 1 },
                { value: '31-12-2026', count: 1 },
                { value: '09-01-2027', count: 2 },
                { value: 'Will be updated', count: 1 }
            ]);
        });

        it('sorts numbers numerically', () => {
            const rows = rowsOf('10', '9', '100', '9');
            expect(distinctValues(rows, 'k', 'num').map(d => d.value)).toEqual(['9', '10', '100']);
        });

        it('puts blanks last with their count, counting whitespace-only, missing key and missing values', () => {
            const rows: SheetRow[] = [row(1, ''), row(2, 'b'), row(3, '   '), row(4, undefined), ({ id: 5 } as any), row(6, 'a')];
            expect(distinctValues(rows, 'k', 'text')).toEqual([
                { value: 'a', count: 1 },
                { value: 'b', count: 1 },
                { value: '', count: 4 }
            ]);
        });

        it('keeps values that differ only in case apart (they are different display values)', () => {
            const rows = rowsOf('a', 'A');
            expect(distinctValues(rows, 'k', 'text').length).toBe(2);
        });

        it('gives an empty list for no rows', () => {
            expect(distinctValues([], 'k', 'text')).toEqual([]);
        });
    });

    describe('selectionStats', () => {
        it('summarises plain numbers', () => {
            expect(selectionStats(['1', '2', '3'])).toEqual({ cells: 3, count: 3, numbers: 3, sum: 6, avg: 2, min: 1, max: 3 });
        });

        it('counts non-blank cells separately from numbers', () => {
            expect(selectionStats(['5', 'abc', '', '  ', '2.5'])).toEqual({
                cells: 5, count: 3, numbers: 2, sum: 7.5, avg: 3.75, min: 2.5, max: 5
            });
        });

        it('has no average, min or max when there are no numbers', () => {
            expect(selectionStats(['a', 'b'])).toEqual({ cells: 2, count: 2, numbers: 0, sum: 0, avg: null, min: null, max: null });
            expect(selectionStats(['', ' '])).toEqual({ cells: 2, count: 0, numbers: 0, sum: 0, avg: null, min: null, max: null });
        });

        it('copes with an empty selection', () => {
            expect(selectionStats([])).toEqual({ cells: 0, count: 0, numbers: 0, sum: 0, avg: null, min: null, max: null });
        });

        it('handles negative numbers, decimals and a thousands separator', () => {
            const s = selectionStats(['-3', '1,000', '0.5', ' 2 ']);
            expect(s.numbers).toBe(4);
            expect(s.sum).toBe(999.5);
            expect(s.min).toBe(-3);
            expect(s.max).toBe(1000);
            expect(s.avg).toBe(999.5 / 4);
        });

        it('handles a single value, including zero as min and max', () => {
            expect(selectionStats(['0'])).toEqual({ cells: 1, count: 1, numbers: 1, sum: 0, avg: 0, min: 0, max: 0 });
        });

        it('does not take dates for numbers', () => {
            expect(selectionStats(['14-10-2026', '5'])).toEqual({ cells: 2, count: 2, numbers: 1, sum: 5, avg: 5, min: 5, max: 5 });
        });

        it('treats null / undefined cells as blank', () => {
            expect(selectionStats([null as any, undefined as any, '4'])).toEqual({
                cells: 3, count: 1, numbers: 1, sum: 4, avg: 4, min: 4, max: 4
            });
        });
    });
});

describe('sheet-sort: exclude filter (Sheets "filter by values" semantics)', () => {
    const rows = [{ id: 1, values: { T: 'CKD' } }, { id: 2, values: { T: 'SKD' } }, { id: 3, values: { T: '' } }, { id: 4, values: { T: 'PLP' } }];
    it('hides only the excluded values, so values added later stay visible', () => {
        const pred = compileFilters({ T: { exclude: ['SKD', ''] } }, () => 'text')!;
        expect(rows.filter(pred).map(r => r.id)).toEqual([1, 4]);
    });
    it('an empty exclude list is not an active filter', () => {
        expect(isFilterActive({ exclude: [] })).toBeFalse();
        expect(isFilterActive({ exclude: ['X'] })).toBeTrue();
    });
});

