import {
    Access, LegendEntry, RecMap, RowCtx, SheetRec, accessFrom, applyFmtLocally, applySaveResult, batchOf, dateTimeText,
    dropQueued, enqueueEdits, fmtEdits, gridColumns, gridShape, hazColour, headerOf, helperCombos, layoutFrom, legendFrom,
    mergeChanges, mergeServerRows, monthLabel, monthTabs, newMonthTabs, nextMonth, orderRecs, ownerCheck, ownerLocks,
    parseCellFmt, qkey, reasonText, rebaseQueue, resolveConflict, rowOpArgs, settingsLogLabel, statusOnly, tabCodeOf,
    toSheetRow, woColumns
} from './sheet-view.logic';

/** a WO row as LOAD returns it (only the columns a test needs) */
function db(id: number, extra: any = {}): any {
    return { ID: id, MONTH_ID: 1, TAB_CODE: 'VIPAR', SORT_ORDER: id * 10, STATUS_CODE: null, EXPTNO: null, CELL_FMT: null, ROWVER: 1, ISDELETED: false, ...extra };
}

function recs(rows: any[], links: any[] = []): RecMap {
    return mergeServerRows(new Map(), rows, links, 'wo').recs;
}

const LEGEND: LegendEntry[] = legendFrom([
    { CODE: 'COMPLETE', LABEL: 'Shipment complete', BG: '#FFF6BF', FG: null, SORT: 1, ACTIVE: true },
    { CODE: 'HAZ', LABEL: 'HAZ', BG: null, FG: '#ff0000', SORT: 4, ACTIVE: true },
    { CODE: 'HOLD', LABEL: 'Hold', BG: '#fcebc2', FG: '#5a3d00', SORT: 9, ACTIVE: false }
]);

function ctx(extra: Partial<RowCtx> = {}): RowCtx {
    return { kind: 'wo', statusBy: new Map(LEGEND.map(l => [l.code, l] as [string, LegendEntry])), hazFg: hazColour(LEGEND), ...extra };
}

const ACC = (over: Partial<Access> = {}): Access => ({ state: 'ok', admin: false, roles: new Set(['OPS', 'ALL']), cols: null, ...over });

describe('Sheet view logic', () => {

    describe('parsing', () => {
        it('reads CELL_FMT into grid formats and skips junk', () => {
            const f = parseCellFmt('{"VSL_NAME":{"bg":"#FF00FF","fg":"#305496","b":1},"QTY":{"b":0},"PORT":"x","WO":{"bg":"red"}}');
            expect(f).toEqual({ VSL_NAME: { bg: '#ff00ff', fg: '#305496', bold: true } });
            // the row format comes out of the cells' map
            const r = mergeServerRows(new Map(), [db(1, { CELL_FMT: '{"*ROW":{"bg":"#d9ead3","b":1},"WO":{"fg":"#c62828"}}' })], [], 'wo').recs;
            expect(r.get(1)!.srv.rowFmt).toEqual({ bg: '#d9ead3', bold: true });
            expect(r.get(1)!.srv.fmt).toEqual({ WO: { fg: '#c62828' } });
            expect(parseCellFmt(null)).toEqual({});
            expect(parseCellFmt('not json')).toEqual({});
            expect(parseCellFmt('[1,2]')).toEqual({});
        });

        it('orders the legend and finds the HAZ text colour', () => {
            expect(LEGEND.map(l => l.code)).toEqual(['COMPLETE', 'HAZ', 'HOLD']);
            expect(LEGEND[0].bg).toBe('#fff6bf');
            expect(LEGEND[2].active).toBe(false);
            expect(hazColour(LEGEND)).toBe('#ff0000');
            expect(hazColour([])).toBe('#c62828');
        });

        it('tells a status-only answer from data', () => {
            expect(statusOnly({ Table: [{ STATUS: '103', STATUSTEXT: 'Month not found.' }] })).toBe(true);
            expect(statusOnly({ Table: [db(1)] })).toBe(false);
            expect(statusOnly({ Table: [] })).toBe(false);
            expect(statusOnly(null)).toBe(false);
        });

        it('puts reasons in plain words', () => {
            expect(reasonText('owner')).toContain('another role');
            expect(reasonText('TOO LONG')).toContain('500');
            expect(reasonText('Not saved: deadlock')).toBe('Not saved: deadlock');
        });
    });

    describe('server rows -> records', () => {
        it('replaces rows by ID even when the new copy has a lower ROWVER (moves do not bump it)', () => {
            let r = recs([db(1, { WO: 'A', ROWVER: 5 })]);
            r = mergeServerRows(r, [db(1, { WO: 'B', ROWVER: 4, SORT_ORDER: 99 })], [], 'wo').recs;
            expect(r.get(1)!.srv.values['WO']).toBe('B');
            expect(r.get(1)!.srv.ver).toBe(4);
            expect(r.get(1)!.srv.sort).toBe(99);
        });

        it('drops ISDELETED rows and, on a full load, rows that are no longer there', () => {
            let r = recs([db(1), db(2), db(3)]);
            const m = mergeServerRows(r, [db(2, { ISDELETED: true })], [], 'wo');
            expect(m.removed).toEqual([2]);
            expect(Array.from(m.recs.keys())).toEqual([1, 3]);
            const full = mergeServerRows(m.recs, [db(3)], [], 'wo', true);
            expect(Array.from(full.recs.keys())).toEqual([3]);
            expect(full.removed).toEqual([1]);
            r = full.recs;
            expect(r.size).toBe(1);
        });

        it('keeps the user\'s local edits through a merge', () => {
            let r = recs([db(1, { REMARK1: 'server' })]);
            r.set(1, { ...r.get(1)!, local: { REMARK1: 'mine' } });
            r = mergeServerRows(r, [db(1, { REMARK1: 'theirs', ROWVER: 2 })], [], 'wo').recs;
            expect(r.get(1)!.local).toEqual({ REMARK1: 'mine' });
            expect(toSheetRow(r.get(1)!, ctx()).values['REMARK1']).toBe('mine');
        });

        it('takes Links values from the table that came with the rows, keeps them when none came', () => {
            let r = recs([db(1, { EXPTNO: 'J1', FF_JOB: 'J1' })], [{ ID: 1, EXPTNO: 'J1', JOB_FOUND: true, L_VSL_NAME: 'EVER LYRIC 077E', L_PORT: '' }]);
            expect(r.get(1)!.links!.values).toEqual({ VSL_NAME: 'EVER LYRIC 077E' });
            r = mergeServerRows(r, [db(1, { EXPTNO: 'J1', ROWVER: 2 })], null, 'wo').recs;
            expect(r.get(1)!.links!.values['VSL_NAME']).toBe('EVER LYRIC 077E');
            r = mergeServerRows(r, [db(1, { EXPTNO: null, ROWVER: 3 })], [], 'wo').recs; // Unlink
            expect(r.get(1)!.links).toBeNull();
        });

        it('reads grid rows from DATA by column letter', () => {
            const r = mergeServerRows(new Map(), [{ ID: 7, SORT_ORDER: 1, ROWVER: 2, DATA: '{"a":"REF1","B":"BKG 9","C":5}', ISDELETED: 0 }], null, 'grid').recs;
            expect(r.get(7)!.srv.values).toEqual({ A: 'REF1', B: 'BKG 9', C: '5' });
            expect(r.get(7)!.links).toBeNull();
        });

        it('orders by SORT_ORDER then ID', () => {
            const r = recs([db(3, { SORT_ORDER: 1 }), db(1, { SORT_ORDER: 2 }), db(2, { SORT_ORDER: 1 })]);
            expect(orderRecs(r).map(x => x.srv.id)).toEqual([2, 3, 1]);
        });
    });

    describe('grid rows (lock / tag rules, colours)', () => {
        it('shows a Links value locked and tagged, an empty one as the sheet value tagged pending', () => {
            const r = recs([db(1, { EXPTNO: '301102610004227', FF_JOB: '301102610004227', VSL_NAME: 'SHEET VSL', PORT: 'YANGON', BOOKING_NO: 'B1' })],
                [{ ID: 1, EXPTNO: '301102610004227', JOB_FOUND: true, JOB_CANCELLED: false, L_VSL_NAME: 'EVER LADEN V-077E', L_PORT: '', L_BOOKING_NO: '  ' }]);
            const row = toSheetRow(r.get(1)!, ctx());
            expect(row.values['VSL_NAME']).toBe('EVER LADEN V-077E');
            expect(row.locked!['VSL_NAME']).toBe('From Links, job 301102610004227');
            expect(row.tags!['VSL_NAME']).toBe('links');
            expect(row.values['PORT']).toBe('YANGON');
            expect(row.locked!['PORT']).toBeUndefined();
            expect(row.tags!['PORT']).toBe('pending');
            expect(row.tags!['BOOKING_NO']).toBe('pending');
            expect(row.locked!['FF_JOB']).toContain('Linked to job 301102610004227');
            expect(row.tags!['FF_JOB']).toBeUndefined();
            expect(row.tags!['AGENT']).toBeUndefined(); // AGENT is not Links-owned
        });

        it('flags FF JOB when the linked job is not found or cancelled, with the reason as the mark\'s tooltip', () => {
            let row = toSheetRow(recs([db(1, { EXPTNO: 'X9' })], [{ ID: 1, EXPTNO: 'X9', JOB_FOUND: false }]).get(1)!, ctx());
            expect(row.tags!['FF_JOB']).toBe('flag');
            expect(row.tagReasons!['FF_JOB']).toContain('X9 was not found');
            expect(row.locked!['FF_JOB']).toContain('Linked to job X9');
            row = toSheetRow(recs([db(1, { EXPTNO: 'X9' })], [{ ID: 1, EXPTNO: 'X9', JOB_FOUND: true, JOB_CANCELLED: true }]).get(1)!, ctx());
            expect(row.tags!['FF_JOB']).toBe('flag');
            expect(row.tagReasons!['FF_JOB']).toContain('cancelled');
            row = toSheetRow(recs([db(1, { EXPTNO: 'X9' })], [{ ID: 1, EXPTNO: 'X9', JOB_FOUND: true }]).get(1)!, ctx());
            expect(row.tags!['FF_JOB']).toBeUndefined();
            expect(row.tagReasons!['FF_JOB']).toBeUndefined();
        });

        it('gives the links / pending marks their own tooltips', () => {
            const row = toSheetRow(recs([db(1, { EXPTNO: 'J7', PORT: 'YANGON' })], [{ ID: 1, EXPTNO: 'J7', L_VSL_NAME: 'V1' }]).get(1)!, ctx());
            expect(row.tagReasons!['VSL_NAME']).toContain('in Links');
            expect(row.tagReasons!['PORT']).toContain('job J7 has no value');
        });

        it('takes the row format (*ROW) over the status colour, the status where the row has none, HAZ red over both', () => {
            const r = recs([
                db(1, { STATUS_CODE: 'HOLD', CELL_FMT: '{"*ROW":{"bg":"#d9ead3"},"WO":{"b":1}}' }),
                db(2, { STATUS_CODE: 'HOLD', CELL_FMT: '{"*ROW":{"fg":"#1565c0"}}' }),
                db(3, { HAZ: 'YES', CELL_FMT: '{"*ROW":{"bg":"#d9ead3","fg":"#1565c0"}}' })
            ]);
            const one = toSheetRow(r.get(1)!, ctx());
            expect(one.rowFmt).toEqual({ bg: '#d9ead3', fg: '#5a3d00' });
            expect(one.fmt).toEqual({ WO: { bold: true } });
            expect(toSheetRow(r.get(2)!, ctx()).rowFmt).toEqual({ bg: '#fcebc2', fg: '#1565c0' });
            expect(toSheetRow(r.get(3)!, ctx()).rowFmt).toEqual({ bg: '#d9ead3', fg: '#ff0000' });
            const g = mergeServerRows(new Map(), [{ ID: 4, DATA: '{}', ROWVER: 1, CELL_FMT: '{"*ROW":{"bg":"#eeeeee"}}' }], null, 'grid').recs;
            expect(toSheetRow(g.get(4)!, ctx({ kind: 'grid' })).rowFmt).toEqual({ bg: '#eeeeee', fg: null });
        });

        it('leaves unlinked rows unlocked and untagged', () => {
            const row = toSheetRow(recs([db(1, { VSL_NAME: 'V' })]).get(1)!, ctx());
            expect(row.locked).toBeUndefined();
            expect(row.tags).toBeUndefined();
        });

        it('colours the row from the legend and turns HAZ = YES rows red', () => {
            const r = recs([db(1, { STATUS_CODE: 'complete' }), db(2, { HAZ: 'yes' }), db(3, { STATUS_CODE: 'COMPLETE', HAZ: 'YES' }), db(4, { STATUS_CODE: 'GONE' })]);
            expect(toSheetRow(r.get(1)!, ctx()).rowFmt).toEqual({ bg: '#fff6bf', fg: null });
            expect(toSheetRow(r.get(1)!, ctx()).status).toBe('COMPLETE');
            expect(toSheetRow(r.get(2)!, ctx()).rowFmt).toEqual({ bg: null, fg: '#ff0000' });
            expect(toSheetRow(r.get(3)!, ctx()).rowFmt).toEqual({ bg: '#fff6bf', fg: '#ff0000' });
            expect(toSheetRow(r.get(4)!, ctx()).rowFmt).toBeUndefined();
        });

        it('takes HAZ from the local edit (the row turns red while typing)', () => {
            const r = recs([db(1, { HAZ: 'NO' })]);
            const rec: SheetRec = { ...r.get(1)!, local: { HAZ: 'YES' } };
            expect(toSheetRow(rec, ctx()).rowFmt!.fg).toBe('#ff0000');
        });

        it('passes cell formats and adds the owner padlocks', () => {
            const r = recs([db(1, { CELL_FMT: '{"WO":{"bg":"#f6d3f0"}}', EXPTNO: 'J', VSL_NAME: 'S' })], [{ ID: 1, EXPTNO: 'J', L_VSL_NAME: 'L' }]);
            const row = toSheetRow(r.get(1)!, ctx({ ownerLocks: { VSL_NAME: 'owned by Booking desk', BL_NO: 'owned by BL desk' } }));
            expect(row.fmt).toEqual({ WO: { bg: '#f6d3f0' } });
            expect(row.locked!['BL_NO']).toBe('owned by BL desk');
            expect(row.locked!['VSL_NAME']).toBe('From Links, job J'); // the Links lock wins
        });

        it('has no locks / colours on grid tabs', () => {
            const r = mergeServerRows(new Map(), [{ ID: 1, DATA: '{"A":"x"}', ROWVER: 1 }], null, 'grid').recs;
            const row = toSheetRow(r.get(1)!, ctx({ kind: 'grid', ownerLocks: { A: 'no' } }));
            expect(row).toEqual({ id: 1, ver: 1, values: { A: 'x' } });
        });
    });

    describe('column ownership (hard lock)', () => {
        it('lets Admins and SA edit everything', () => {
            expect(ownerCheck('BL_NO', ACC({ admin: true }))).toBe(true);
            expect(accessFrom({ Table: [{ ROLE_CODE: 'OPS' }], Table1: [] }, true).admin).toBe(true);
            expect(accessFrom({ Table: [{ ROLE_CODE: 'admin' }] }, false).admin).toBe(true);
        });

        it('uses MY_ROLES Table1 as the editable columns and names the owning role otherwise', () => {
            const acc = accessFrom({ Table: [{ ROLE_CODE: 'OPS' }, { ROLE_CODE: 'ALL', IMPLICIT: 1 }], Table1: [{ COL_KEY: 'WO' }, { COL_KEY: 'remark1' }] }, false);
            expect(ownerCheck('WO', acc)).toBe(true);
            expect(ownerCheck('REMARK1', acc)).toBe(true);
            expect(ownerCheck('VSL_NAME', acc)).toContain('Booking desk');
            // the user is in the registry owner role, but Column Access moved the column
            expect(ownerCheck('PORT', acc)).toContain('another role');
        });

        it('falls back to the registry owners when the server sent no column list', () => {
            const acc = ACC({ cols: null, roles: new Set(['DOCS']) });
            expect(ownerCheck('VGM_SUBMITTED_DT', acc)).toBe(true);
            expect(ownerCheck('REMARK1', acc)).toBe(true); // ALL
            expect(ownerCheck('WO', acc)).toContain('Ops / Planning');
        });

        it('refuses while loading or after a failure, and builds the padlocks', () => {
            expect(ownerCheck('WO', ACC({ state: 'loading' }))).toContain('loading');
            expect(ownerCheck('WO', ACC({ state: 'failed' }))).toContain('could not be loaded');
            expect(ownerLocks(['WO', 'BL_NO', 'REMARK1'], ACC())).toEqual({ BL_NO: jasmine.stringMatching('BL desk') });
            expect(ownerLocks(['BL_NO'], ACC({ admin: true }))).toEqual({});
            expect(ownerLocks(['BL_NO'], ACC({ state: 'loading' }))).toEqual({});
        });
    });

    describe('edit batching', () => {
        it('keeps one entry per cell: the latest value, the first old value and version', () => {
            let q = enqueueEdits(new Map(), [{ rowId: 1, key: 'REMARK1', oldValue: 'a', newValue: 'b', ver: 3 }], () => 9);
            q = enqueueEdits(q, [{ rowId: 1, key: 'REMARK1', oldValue: 'b', newValue: 'c', ver: 4 }, { rowId: '2', key: 'QTY', oldValue: '', newValue: '5' }], () => 7);
            expect(q.size).toBe(2);
            expect(q.get(qkey(1, 'REMARK1'))).toEqual({ rowId: 1, key: 'REMARK1', value: 'c', oldValue: 'a', ver: 3 });
            expect(q.get(qkey(2, 'QTY'))!.ver).toBe(7);
            const b = batchOf(q);
            expect(b.edits).toEqual([{ RowId: 1, RowVer: 3, Key: 'REMARK1', Value: 'c' }, { RowId: 2, RowVer: 7, Key: 'QTY', Value: '5' }]);
        });

        it('rebases edits queued during our own save, not those of a conflicted row', () => {
            const sent = [{ rowId: 1, key: 'WO', value: 'x', oldValue: '', ver: 3 }, { rowId: 2, key: 'WO', value: 'y', oldValue: '', ver: 5 }];
            let q = enqueueEdits(new Map(), [
                { rowId: 1, key: 'QTY', oldValue: '', newValue: '1', ver: 3 },
                { rowId: 2, key: 'QTY', oldValue: '', newValue: '2', ver: 5 },
                { rowId: 3, key: 'QTY', oldValue: '', newValue: '3', ver: 1 }
            ], () => 0);
            q = rebaseQueue(q, sent, new Map([[1, 4], [2, 6]]), new Set([2]));
            expect(q.get(qkey(1, 'QTY'))!.ver).toBe(4);
            expect(q.get(qkey(2, 'QTY'))!.ver).toBe(5);
            expect(q.get(qkey(3, 'QTY'))!.ver).toBe(1);
            expect(dropQueued(q, [1, 3]).size).toBe(1);
        });
    });

    describe('SaveCells answer', () => {
        const base = (): RecMap => {
            const r = recs([db(1, { REMARK1: 'old', DO_ETD: '' }), db(2, { REMARK1: 'r2' }), db(3, { WO: 'W3' })]);
            r.set(1, { ...r.get(1)!, local: { REMARK1: 'new', DO_ETD: '14-10-2026' } });
            r.set(2, { ...r.get(2)!, local: { REMARK1: 'mine' } });
            r.set(3, { ...r.get(3)!, local: { WO: 'W3X' } });
            return r;
        };
        const sent = [
            { rowId: 1, key: 'REMARK1', value: 'new', oldValue: 'old', ver: 1 },
            { rowId: 1, key: 'DO_ETD', value: '14-10-2026', oldValue: '', ver: 1 },
            { rowId: 2, key: 'REMARK1', value: 'mine', oldValue: 'r2', ver: 1 },
            { rowId: 3, key: 'WO', value: 'W3X', oldValue: 'W3', ver: 1 }
        ];

        it('confirms saved cells, rolls refused ones back and collects conflicts', () => {
            const ds = {
                Table: [{ STATUS: '102', APPLIED: 2 }],
                Table1: [{ ID: 2, KEY: 'REMARK1', REASON: 'conflict' }, { ID: 3, KEY: 'wo', REASON: 'owner' }],
                Table2: [db(1, { REMARK1: 'new', DO_ETD: '14-10-2026', ROWVER: 2 }), db(2, { REMARK1: 'theirs', ROWVER: 7 }), db(3, { WO: 'W3' })],
                Table3: []
            };
            const out = applySaveResult(base(), sent, ds, 'wo');
            expect(out.confirmed).toBe(2);
            expect(out.recs.get(1)!.local).toEqual({});
            expect(out.recs.get(1)!.srv.ver).toBe(2);
            expect(out.conflicts).toEqual([{ rowId: 2, key: 'REMARK1', mine: 'mine', theirs: 'theirs' }]);
            expect(out.recs.get(2)!.local).toEqual({ REMARK1: 'mine' });
            expect(out.refused).toEqual([{ rowId: 3, key: 'WO', value: 'W3X', reason: 'owner' }]);
            expect(out.recs.get(3)!.local).toEqual({});
            expect(toSheetRow(out.recs.get(3)!, ctx()).values['WO']).toBe('W3');
            expect(out.newVer.get(2)).toBe(7);
            expect(Array.from(out.conflicted)).toEqual([2]);
        });

        it('does not prompt when theirs equals mine, keeps a value typed again meanwhile', () => {
            const r = base();
            r.set(1, { ...r.get(1)!, local: { REMARK1: 'newer', DO_ETD: '14-10-2026' } });
            const ds = {
                Table: [{ STATUS: '102' }], Table1: [{ ID: 2, KEY: 'REMARK1', REASON: 'conflict' }],
                Table2: [db(1, { REMARK1: 'new', DO_ETD: '14-10-2026', ROWVER: 2 }), db(2, { REMARK1: 'mine', ROWVER: 7 })], Table3: []
            };
            const out = applySaveResult(r, sent.slice(0, 3), ds, 'wo');
            expect(out.conflicts.length).toBe(0);
            expect(out.recs.get(2)!.local).toEqual({});
            expect(out.recs.get(1)!.local).toEqual({ REMARK1: 'newer' });
        });

        it('merges the saved rows\' Links values (Table3) and drops deleted rows', () => {
            const ds = {
                Table: [{ STATUS: '103' }], Table1: [{ ID: 3, KEY: 'WO', REASON: 'notfound' }],
                Table2: [db(1, { EXPTNO: 'J1', ROWVER: 2 }), db(3, { ISDELETED: true })],
                Table3: [{ ID: 1, EXPTNO: 'J1', L_WO: 'INV1' }]
            };
            const out = applySaveResult(base(), [sent[0], sent[3]], ds, 'wo');
            expect(out.removed).toEqual([3]);
            expect(out.recs.has(3)).toBe(false);
            expect(out.recs.get(1)!.links!.values['WO']).toBe('INV1');
            expect(out.refused[0].reason).toBe('notfound');
        });

        it('applies a GridSave whole-row rejection (KEY *) to every cell of the row', () => {
            let r = mergeServerRows(new Map(), [{ ID: 5, DATA: '{"A":"1"}', ROWVER: 1 }], null, 'grid').recs;
            r.set(5, { ...r.get(5)!, local: { A: '2', B: 'x' } });
            const s = [{ rowId: 5, key: 'A', value: '2', oldValue: '1', ver: 1 }, { rowId: 5, key: 'B', value: 'x', oldValue: '', ver: 1 }];
            const out = applySaveResult(r, s, { Table: [{ STATUS: '102' }], Table1: [{ ID: 5, KEY: '*', REASON: 'conflict' }], Table2: [{ ID: 5, DATA: '{"A":"9"}', ROWVER: 3 }] }, 'grid');
            expect(out.conflicts.map(c => c.key)).toEqual(['A', 'B']);
            expect(out.conflicts[0].theirs).toBe('9');
        });
    });

    describe('conflict prompt', () => {
        const setup = () => {
            const r = recs([db(2, { REMARK1: 'theirs', QTY: '1', ROWVER: 7 })]);
            r.set(2, { ...r.get(2)!, local: { REMARK1: 'mine' } });
            const q = enqueueEdits(new Map(), [{ rowId: 2, key: 'QTY', oldValue: '1', newValue: '2', ver: 6 }], () => 6);
            return { r, q, c: { rowId: 2, key: 'REMARK1', mine: 'mine', theirs: 'theirs' } };
        };

        it('keep mine: queued again on the current version, the row\'s other edits too', () => {
            const { r, q, c } = setup();
            const out = resolveConflict(r, q, c, 'mine');
            expect(out.queue.get(qkey(2, 'REMARK1'))).toEqual({ rowId: 2, key: 'REMARK1', value: 'mine', oldValue: 'theirs', ver: 7 });
            expect(out.queue.get(qkey(2, 'QTY'))!.ver).toBe(7);
            expect(out.recs.get(2)!.local['REMARK1']).toBe('mine');
        });

        it('take theirs: the local value goes, nothing is sent for the cell', () => {
            const { r, q, c } = setup();
            const out = resolveConflict(r, q, c, 'theirs');
            expect(out.queue.has(qkey(2, 'REMARK1'))).toBe(false);
            expect(out.recs.get(2)!.local['REMARK1']).toBeUndefined();
            expect(toSheetRow(out.recs.get(2)!, ctx()).values['REMARK1']).toBe('theirs');
        });
    });

    describe('Changes merge', () => {
        it('never overwrites unsent local edits, drops deleted rows, returns AS_OF', () => {
            let r = recs([db(1, { REMARK1: 'a', QTY: '1' }), db(2)]);
            r.set(1, { ...r.get(1)!, local: { REMARK1: 'typing' } });
            const m = mergeChanges(r, {
                Table: [db(1, { REMARK1: 'b', QTY: '2', ROWVER: 2 }), db(2, { ISDELETED: 1 }), db(9, { WO: 'new row' })],
                Table1: [], Table2: [{ AS_OF: '2026-10-21T17:53:00.123' }]
            });
            r = m.recs;
            expect(m.asOf).toBe('2026-10-21T17:53:00.123');
            expect(m.removed).toEqual([2]);
            const row = toSheetRow(r.get(1)!, ctx());
            expect(row.values['REMARK1']).toBe('typing');
            expect(row.values['QTY']).toBe('2');
            expect(row.ver).toBe(2);
            expect(r.get(9)!.srv.values['WO']).toBe('new row');
        });
    });

    describe('GridChanges merge', () => {
        it('replaces grid rows by ID, drops deleted ones and hands over a changed TABMETA', () => {
            let r = mergeServerRows(new Map(), [{ ID: 1, DATA: '{"A":"x"}', ROWVER: 1 }, { ID: 2, DATA: '{"A":"y"}', ROWVER: 1 }], null, 'grid').recs;
            r.set(1, { ...r.get(1)!, local: { B: 'typing' } });
            const m = mergeChanges(r, {
                Table: [{ ID: 1, DATA: '{"A":"x2"}', ROWVER: 2 }, { ID: 1, DATA: '{"A":"x2"}', ROWVER: 2 }, { ID: 2, DATA: '{}', ROWVER: 2, ISDELETED: true }],
                Table1: [{ MONTH_ID: 12, TAB_CODE: 'PRICE', META: '{"frozenRows":1}', ROWVER: 4 }],
                Table2: [{ AS_OF: '2026-10-21T19:00:00' }]
            }, 'grid');
            expect(m.removed).toEqual([2]);
            expect(m.recs.get(1)!.srv.values).toEqual({ A: 'x2' });
            expect(m.recs.get(1)!.local).toEqual({ B: 'typing' });
            expect(m.meta.ROWVER).toBe(4);
            expect(m.asOf).toBe('2026-10-21T19:00:00');
            expect(mergeChanges(r, { Table: [], Table1: [], Table2: [] }, 'grid').meta).toBeNull();
            expect(mergeChanges(r, { Table: [], Table1: [{ ID: 1, EXPTNO: 'J' }], Table2: [] }).meta).toBeNull(); // WO: Table1 = Links values
        });
    });

    describe('formats and row operations', () => {
        it('maps row status and cell formats to SaveFormat edits', () => {
            // a status from the menu also clears the row's own colours (they would hide it)
            expect(fmtEdits({ kind: 'row', rowIds: [1, '2'], status: 'HOLD' })).toEqual([
                { RowId: 1, Key: '*ROW', Status: 'HOLD', Bg: '', Fg: '' }, { RowId: 2, Key: '*ROW', Status: 'HOLD', Bg: '', Fg: '' }]);
            expect(fmtEdits({ kind: 'row', rowIds: [1], status: null })).toEqual([{ RowId: 1, Key: '*ROW', Status: '', Bg: '', Fg: '' }]);
            expect(fmtEdits({ kind: 'cell', cells: [{ rowId: 3, key: 'WO', fmt: { bg: '#FFF2CC', bold: true } }, { rowId: 3, key: 'QTY', fmt: null }] }))
                .toEqual([{ RowId: 3, Key: 'WO', Bg: '#FFF2CC', Fg: '', Bold: true }, { RowId: 3, Key: 'QTY', Bg: '', Fg: '', Bold: false }]);
        });

        it('applies them to the records right away', () => {
            let r = recs([db(1, { CELL_FMT: '{"QTY":{"b":1},"*ROW":{"bg":"#d9ead3","b":1}}' })]);
            r = applyFmtLocally(r, { kind: 'row', rowIds: [1], status: 'hold' });
            expect(r.get(1)!.srv.status).toBe('HOLD');
            expect(r.get(1)!.srv.rowFmt).toEqual({ bold: true });
            r = applyFmtLocally(r, { kind: 'cell', cells: [{ rowId: 1, key: 'WO', fmt: { fg: '#c62828' } }, { rowId: 1, key: 'QTY', fmt: null }] });
            expect(r.get(1)!.srv.fmt).toEqual({ WO: { fg: '#c62828' } });
        });

        it('maps grid row operations to Rows arguments', () => {
            expect(rowOpArgs({ op: 'insert', rowIds: [], afterId: null, count: 3 })).toEqual({ op: 'insert', ids: [], afterId: 0, count: 3 });
            expect(rowOpArgs({ op: 'insert', rowIds: [], afterId: 12, count: 5000 })).toEqual({ op: 'insert', ids: [], afterId: 12, count: 1000 });
            expect(rowOpArgs({ op: 'duplicate', rowIds: [4, '5'], afterId: 5, count: 2 })).toEqual({ op: 'duplicate', ids: [4, 5], afterId: 5, count: 2 });
            expect(rowOpArgs({ op: 'move', rowIds: [7], afterId: null, count: 1 })).toEqual({ op: 'move', ids: [7], afterId: 0, count: 1 });
        });
    });

    describe('tabs, columns, layouts', () => {
        it('reads the month\'s TABS, falls back to the workbook tabs', () => {
            const t = monthTabs('[{"code":"vipar","title":"Vipar","kind":"wo","layout":"A","frozenCols":2},{"code":"SLPF"},{"code":"PRICE"},{"code":"NIGERIA"},{"code":"VIPAR"}]');
            expect(t.map(x => x.code)).toEqual(['VIPAR', 'SLPF', 'PRICE', 'NIGERIA']);
            expect(t[0].frozenCols).toBe(2);
            expect(t[1].layout).toBe('B');
            expect(t[1].title).toBe('Sri Lanka parts and frames');
            expect(t[2].kind).toBe('free');
            expect(t[3].kind).toBe('wo');
            expect(monthTabs(null).length).toBe(13);
            expect(monthTabs(null)[4].helper).toBe(true);
        });

        it('sends tab codes the API takes: upper case, A-Z 0-9 _, max 20', () => {
            expect(tabCodeOf(' sri-lanka parts ')).toBe('SRI_LANKA_PARTS');
            expect(tabCodeOf('a'.repeat(30)).length).toBe(20);
            expect(tabCodeOf('--')).toBe('');
            expect(monthTabs('[{"code":"Vip-ar","title":"Vipar","kind":"wo"},{"code":"%%"}]').map(t => t.code)).toEqual(['VIP_AR']);
            [...newMonthTabs(true), ...monthTabs(null)].forEach(t => expect(/^[A-Z0-9_]{1,20}$/.test(t.code)).toBe(true));
        });

        it('builds a new month\'s tabs with or without Nigeria', () => {
            expect(newMonthTabs(false).length).toBe(13);
            const n = newMonthTabs(true);
            expect(n.map(x => x.code).indexOf('NIGERIA')).toBe(n.map(x => x.code).indexOf('TRIUMPH') + 1);
            expect(n.find(x => x.code === 'VIPAR')!.frozenCols).toBe(1);
        });

        it('builds WO columns per layout with the tab widths and the user\'s layout on top', () => {
            const tab = monthTabs(null).find(x => x.code === 'SLPF')!;
            const cols = woColumns(tab, null);
            expect(cols.length).toBe(50);
            expect(cols.some(c => c.key === 'CONT' || c.key === 'DO_ETD2')).toBe(false);
            expect(cols[0]).toEqual(jasmine.objectContaining({ key: 'WO', header: 'WO', width: 69, hidden: false }));
            const lay = layoutFrom('{"widths":{"WO":150,"PORT":5},"hidden":["VEH"],"frozenCols":3}')!;
            expect(lay.frozenCols).toBe(3);
            const mine = woColumns(tab, lay);
            expect(mine[0].width).toBe(150);
            expect(mine[1].width).toBe(68);
            expect(mine.find(c => c.key === 'VEH')!.hidden).toBe(true);
            expect(woColumns({ code: 'NIGERIA', title: 'Nigeria', kind: 'wo', layout: 'A' }, null)[0].width).toBe(72);
        });

        it('builds grid columns: headers for header tabs, letters for free tabs, META on top', () => {
            const b = gridColumns('BOOKINGS', { widths: { B: 200 }, headers: { A: 'REF' } });
            expect(b[0].header).toBe('REF');
            expect(b[1]).toEqual(jasmine.objectContaining({ key: 'B', header: 'BKG NO', width: 200 }));
            expect(gridColumns('DGD', null)[0].header).toBe('A');
            expect(gridColumns('NOPE', null)).toEqual([]);
            expect(gridShape('PRICE', null)).toEqual({ frozenRows: 2, merges: ['A1:G1', 'H1:N1'] });
            expect(gridShape('PRICE', { frozenRows: 1, merges: [] })).toEqual({ frozenRows: 1, merges: [] });
        });

        it('names columns for history and messages', () => {
            expect(headerOf('vsl_name', 'VIPAR')).toBe('VSL NAME');
            expect(headerOf('E', 'BOOKINGS')).toBe('PLACE /REQUIRE BKG ON VSL');
            expect(headerOf('C', 'DGD')).toBe('C');
            expect(headerOf('*ROW', 'VIPAR')).toBe('Row colour');
        });
    });

    describe('misc', () => {
        it('lists the Sri Lanka helper combinations live', () => {
            const rows = [
                { id: 1, values: { CNTR_TYPE: "40'HC", VEH: 'BOXER\n100', PLANT: 'WA10' } },
                { id: 2, values: { CNTR_TYPE: "40'HC", VEH: 'BOXER / 100', PLANT: 'wa10' } },
                { id: 3, values: { CNTR_TYPE: '20FT', VEH: 'RE4S', PLANT: '' } },
                { id: 4, values: {} }
            ];
            expect(helperCombos(rows)).toEqual([
                { type: '20FT', veh: 'RE4S', plant: '', count: 1 },
                { type: "40'HC", veh: 'BOXER / 100', plant: 'WA10', count: 2 }
            ]);
        });

        it('names and steps months', () => {
            expect(monthLabel('2026-10')).toBe('October 2026');
            expect(monthLabel('junk')).toBe('junk');
            expect(nextMonth(['2026-09', '2026-12', 'x'], new Date(2026, 9, 21))).toBe('2027-01');
            expect(nextMonth([], new Date(2026, 9, 21))).toBe('2026-10');
        });

        it('names settings and month log entries', () => {
            expect(settingsLogLabel('LEGEND.HOLD')).toBe('Colour CODE · HOLD');
            expect(settingsLogLabel('ROLE.BLDESK.USERS')).toBe('Column Access · BL desk users');
            expect(settingsLogLabel('ROLE.OPS.COLS')).toBe('Column Access · Ops / Planning columns');
            expect(settingsLogLabel('ALIAS.SLINE')).toBe('Alias · Shipping line');
            expect(settingsLogLabel('alias.seed')).toBe('Aliases · learned from linked rows');
            expect(settingsLogLabel('META.PRICE', c => c === 'PRICE' ? 'Price' : c)).toBe('Column layout · Price');
            expect(settingsLogLabel(null)).toBe('Month');
            expect(settingsLogLabel('SOMETHING')).toBe('SOMETHING');
        });

        it('formats log times', () => {
            expect(dateTimeText('2026-10-21T17:53:00.123')).toBe('21-10-2026 17:53');
            expect(dateTimeText('')).toBe('');
        });
    });
});
