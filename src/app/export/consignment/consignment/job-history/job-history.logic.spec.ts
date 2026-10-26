import {
    alignValues, buildHistory, defaultFilter, fieldInfo, filterSessions, groupSessions, HistEvent, isBlank, sameValue, SECTIONS,
    splitColumns, toEvent, userLabel, wallClock
} from './job-history.logic';

// Synthetic fixtures only: no real job numbers, users, customers or vessels.
const JOB = 'TEST-JOB-1';

/** a Table1 row as USP_EXPT_JOB_HISTORY returns it */
function row(extra: any = {}): any {
    return {
        SRC: 'JOB', EVENT_ID: 1, EVENT_DT: '2026-03-04T10:00:00.000', USER_ID: '7', USER_NAME: 'Alice Admin', MODE: 'EDIT',
        TABLENAME: 'EXPT_MASTER', COLUMNNAME: null, ORIGINALDATA: null, MODIFIEDDATA: null, IP: '10.0.0.1', RECORD_ID: '11', ...extra
    };
}

function ev(extra: any = {}): HistEvent {
    const e = toEvent(row(extra), JOB);
    if (!e) { throw new Error('event dropped'); }
    return e;
}

function ds(rows: any[], head: any = {}): any {
    return {
        Table: [{ STATUS: '100', STATUSTEXT: '', EXPTNO: JOB, CMPCODE: '9', CITYCODE: 'TST', CREATED_BY: '7', CREATED_BY_NAME: 'Alice  Admin', DOCRECD: '04-03-2026', EVENTS: rows.length, ...head }],
        Table1: rows
    };
}

/** job-screen column names seen in recent ADD and EDIT audit rows (schema names, checked read-only on LinksDB20 2026-10-24) */
const SEEN_JOB_COLUMNS = (
    'EXPTNO EXPT_MODE EXPT_EXPORTER EXPT_BILLTO EXPT_CONSIGNEE EXPT_DOCRECD EXPT_LDGPORT EXPT_GRINO EXPT_GRIDATE EXPT_INVNO EXPT_INVDATE ' +
    'EXPT_INVTYPE EXPT_CUR EXPT_CURNAME EXPT_CURRATE EXPT_CURINRRATE EXPT_INVAMT EXPT_INSAMT EXPT_FREIGHT EXPT_FOB EXPT_SHIPBILLTYPE ' +
    'EXPT_NOOFPKGS EXPT_TYPEOFPKGS EXPT_NOOFPCS EXPT_TYPEOFPCS EXPT_GRWT EXPT_NETWT EXPT_VOLUME EXPT_MKTVALUE EXPT_VESSEL EXPT_VSLAGENT ' +
    'EXPT_POD EXPT_IT EXPT_DESTCITY EXPT_DESTCOUNTRY EXPT_FRT EXPT_REMARKS CITYCODE CMPCODE INVCOMMISSION INVDISCOUNT INVDEDUCTAMT ' +
    'INVDEDUCTDESC IMPLABLE BILLENTRYNO BILLENTRYDT SBVALUE SBAMOUNT SBBOOKTYPE ARFORMNO ARFORMDT SBPRORECPTNO SBPRORECPTDT SBEXEMPT1 ' +
    'SBEXEMPT2 SBEXEMPT3 SBDEECBOOKNO SBDEECBOOKDT SBDEECLICNO SBGROUPCODE SBSIONNO SBEXPBOOKNO SBEXPBOOKDT SBDUTY SBDUTYAMT SBCESS ' +
    'NOTIFYBUYER EXPT_BUYER NATUREOFPAYMENT EXPT_PACKING COMMNAME COMMADDR1 COMMADDR2 COMMISSIONRATE DIVISION RANGE ARFORMNO1 ARFORMDT1 ' +
    'COMMISSIONRATE1 DIVISION1 RANGE1 ARFORMNO2 ARFORMDT2 COMMISSIONRATE2 DIVISION2 RANGE2 ARFORMNO3 ARFORMDT3 COMMISSIONRATE3 DIVISION3 ' +
    'RANGE3 EXPTCONTRACTNO PERIODOFPAYMENT EXPT_QUOTAVALIDDT EXPT_QUOTAOBTAINDT EXPT_QUOTAEXPIRYDT MANUFACTURER QUOTACERTNO QUOTACERTNO1 ' +
    'QUOTACERTNO2 YR EXPT_GRWTSHIPPER EXPT_VOLUMESHIPPER EXPT_CARTPLACE CLEARANCE EXPT_BANK EXPT_SRCAGT EXPT_CHBLWT VSL_PORT USERNAME ID ' +
    'EXPT_BLDT EXPT_BLTYPE EXPT_HBLDT EXPT_HBLNO EXPT_MBLFRT EXPT_BLNO FK_TERMINALID EXPT_SHIPBILLDT EXPT_SHIPCUSTOM1 EXPT_SHIPBILLDT1 ' +
    'EXPT_SHIPCUSTOM EXPT_SHIPCCNO EXPT_SHIPBILLNO OBJECTION OUTCHARGEDT CONREMARK FREIGHT_FRD CUSTOM_CLR EXPTAPPDT EXPTAPPWM EXWORKS ' +
    'CARTEDDT PREALERTDT AIRLINENAME FLIGHTNO FLIGHTDT ACTUALFLIGHTNO ACTUALFLIGHTDT MAWBDEST MAWBFRT TRANSPORT1 FLIGHTNO1 ETDPORT1 ETAPORT1 ' +
    'TRANSPORT2 FLIGHTNO2 ETDPORT2 ETAPORT2 EXPT_AGENT JOBNO CLIENT_CODE NOOFPKGS NARRATION MAKER_ID MAKER_IP ORDERNO DIMLENGH DIMWIDTH ' +
    'DIMHEIGHT DIMVOLUME DIMCBM DIMCHBLWT'
).split(' ');

describe('Job history logic', () => {

    describe('pipe lists', () => {
        it('splits the column list, trimming names and dropping the trailing empty item', () => {
            expect(splitColumns('EXPTNO|EXPT_VESSEL| VSL_PORT |')).toEqual(['EXPTNO', 'EXPT_VESSEL', 'VSL_PORT']);
            expect(splitColumns('EXPTNO')).toEqual(['EXPTNO']);
            expect(splitColumns('')).toEqual([]);
            expect(splitColumns(null)).toEqual([]);
        });

        it('pairs values with or without the trailing pipe, and refuses lists that do not line up', () => {
            const cols = ['A', 'B', 'C'];
            expect(alignValues(cols, '1|2|3|')).toEqual(['1', '2', '3']);
            expect(alignValues(cols, '1|2|3')).toEqual(['1', '2', '3']);
            expect(alignValues(cols, '1||')).toEqual(['1', '', '']);          // three items: the last one is a real (empty) value
            expect(alignValues(cols, '1|2|x|y')).toBeNull();                   // a value holding a pipe
            expect(alignValues(cols, '1|2')).toBeNull();                       // truncated
            expect(alignValues(cols, '1|2|3|4')).toBeNull();                   // one more, but not empty
            expect(alignValues(cols, null)).toBeNull();
            expect(alignValues([], '1')).toBeNull();
        });
    });

    describe('values', () => {
        it('treats trimmed, blank-equivalent and re-formatted decimals as unchanged', () => {
            expect(sameValue(' ABC ', 'ABC')).toBe(true);
            expect(sameValue('0', '')).toBe(true);
            expect(sameValue('0.00', null)).toBe(true);
            expect(sameValue(',,', '')).toBe(true);
            expect(sameValue('1852.000', '1852')).toBe(true);
            expect(sameValue('30090.00', '30090.000')).toBe(true);
        });

        it('keeps real changes', () => {
            expect(sameValue('0012', '12')).toBe(false);         // codes without a decimal point
            expect(sameValue('abc', 'ABC')).toBe(false);
            expect(sameValue('', 'X')).toBe(false);
            expect(sameValue('10.5', '10.50')).toBe(true);
            expect(sameValue('10.5', '10.6')).toBe(false);
            expect(isBlank(' ')).toBe(true);
            expect(isBlank('0.5')).toBe(false);
        });

        it('reads the stored time as wall-clock time, without a time-zone shift', () => {
            const a = wallClock('2026-01-02T03:04:05.678')!;
            expect(a.text).toBe('02-01-2026 03:04');
            expect(a.full).toBe('02-01-2026 03:04:05');
            const b = wallClock('2026-01-02T03:05:05')!;
            expect(b.ms - a.ms).toBe(59322);
            expect(wallClock('2026-01-02 03:04')!.text).toBe('02-01-2026 03:04');
            expect(wallClock('not a date')).toBeNull();
            expect(wallClock(null)).toBeNull();
        });

        it('names users, and the system for user 0', () => {
            expect(userLabel('7', 'Alice Admin')).toBe('Alice Admin (7)');
            expect(userLabel('8', '')).toBe('User 8');
            expect(userLabel('0', '')).toBe('System');
            expect(userLabel('', '')).toBe('System');
        });
    });

    describe('labels', () => {
        it('labels every job column seen in recent ADD and EDIT rows', () => {
            const missing = SEEN_JOB_COLUMNS.filter(c => !fieldInfo('JOB', c).known);
            expect(missing).toEqual([]);
            expect(fieldInfo('JOB', 'EXPT_CONSIGNEE')).toEqual({ label: 'Consignee', section: 'parties', known: true });
            expect(fieldInfo('JOB', 'expt_blno').section).toBe('customs');
            expect(fieldInfo('JOB', 'EXPT_GRWT').section).toBe('packages');
        });

        it('shows unknown columns by name under Other', () => {
            expect(fieldInfo('JOB', 'NEW_COL_X')).toEqual({ label: 'NEW_COL_X', section: 'other', known: false });
        });

        it('labels tracking and sheet fields in their own sections', () => {
            expect(fieldInfo('TRACKING', 'STUFFING_DT')).toEqual({ label: 'Stuffing date', section: 'tracking', known: true });
            expect(fieldInfo('SHEET', 'BOOKING_NO')).toEqual({ label: 'Booking no.', section: 'sheet', known: true });
            expect(fieldInfo('SHEET', '*ROW').label).toBe('Row status');
            expect(SECTIONS.map(s => s.label)).toEqual(['Parties', 'Shipment', 'Vessel & ports', 'BL / SB & customs', 'Invoice & value',
                'Packages & weights', 'Tracking', 'Sheet view', 'Other']);
        });
    });

    describe('job audit rows', () => {
        it('shows only the fields that changed, with labels, and never the keys', () => {
            const e = ev({ COLUMNNAME: 'ID|EXPTNO|EXPT_VESSEL|EXPT_VSLAGENT|VSL_PORT|', ORIGINALDATA: '11|TEST-JOB-1|VSL-1|AG-1|P1|', MODIFIEDDATA: '11|TEST-JOB-1|VSL-2|AG-1|P1' });
            expect(e.kind).toBe('changes');
            expect(e.changes.map(c => [c.label, c.before, c.after, c.section])).toEqual([['Vessel (rotation no.)', 'VSL-1', 'VSL-2', 'vessel']]);
        });

        it('drops blank-equivalent and re-formatted values', () => {
            const e = ev({ COLUMNNAME: 'EXPTNO|FK_TERMINALID|EXPT_GRWT|EXPT_NETWT|', ORIGINALDATA: 'TEST-JOB-1|0|100.000|5|', MODIFIEDDATA: 'TEST-JOB-1||100|6|' });
            expect(e.changes.map(c => c.column)).toEqual(['EXPT_NETWT']);
        });

        it('calls a save of key columns only "no field details recorded"', () => {
            const a = ev({ COLUMNNAME: 'ID|EXPTNO', ORIGINALDATA: '11|TEST-JOB-1', MODIFIEDDATA: '11|TEST-JOB-1' });
            expect(a.kind).toBe('nodetail');
            expect(a.note).toBe('Saved (no field details recorded)');
            const b = ev({ COLUMNNAME: 'EXPTNO|', ORIGINALDATA: 'TEST-JOB-1|', MODIFIEDDATA: 'TEST-JOB-1|' });
            expect(b.kind).toBe('nodetail');
            expect(ev({ COLUMNNAME: '', ORIGINALDATA: '', MODIFIEDDATA: '' }).kind).toBe('nodetail');
        });

        it('calls a save whose fields kept their values "no values changed"', () => {
            const e = ev({ TABLENAME: 'EXPT_CARTING', COLUMNNAME: 'EXPTNO|EXPT_VESSEL|EXPT_AGENT|', ORIGINALDATA: 'TEST-JOB-1|VSL-1|AG-1|', MODIFIEDDATA: 'TEST-JOB-1|VSL-1|AG-1|' });
            expect(e.kind).toBe('nochange');
            expect(e.note).toBe('Saved, no values changed');
        });

        it('shows lists that do not line up as raw text, never paired', () => {
            const e = ev({ COLUMNNAME: 'EXPTNO|EXPT_REMARKS|EXPT_POD|', ORIGINALDATA: 'TEST-JOB-1|old|P1|', MODIFIEDDATA: 'TEST-JOB-1|new | with pipe|P2|' });
            expect(e.kind).toBe('raw');
            expect(e.changes).toEqual([]);
            expect(e.raw).toEqual({ columns: 'EXPTNO|EXPT_REMARKS|EXPT_POD|', before: 'TEST-JOB-1|old|P1|', after: 'TEST-JOB-1|new | with pipe|P2|' });
        });

        it('treats lists whose export-number item is not this job as not lining up', () => {
            // same item count, but shifted: the EXPTNO position holds another value in both lists
            const e = ev({ COLUMNNAME: 'EXPTNO|EXPT_INVNO|EXPT_POD|', ORIGINALDATA: 'X|TEST-JOB-1|P1|', MODIFIEDDATA: 'Y|TEST-JOB-1|P2|' });
            expect(e.kind).toBe('raw');
        });

        it('treats lists whose ID item is not the row\'s record id as not lining up', () => {
            expect(ev({ COLUMNNAME: 'ID|EXPTNO|EXPT_POD|', ORIGINALDATA: '11|' + JOB + '|P1|', MODIFIEDDATA: '11|' + JOB + '|P2|' }).kind).toBe('changes');
            expect(ev({ COLUMNNAME: 'ID|EXPTNO|EXPT_POD|', ORIGINALDATA: '12|' + JOB + '|P1|', MODIFIEDDATA: '12|' + JOB + '|P2|' }).kind).toBe('raw');
            // no record id on the row: nothing to compare with
            expect(ev({ RECORD_ID: null, COLUMNNAME: 'ID|EXPTNO|EXPT_POD|', ORIGINALDATA: '12|' + JOB + '|P1|', MODIFIEDDATA: '12|' + JOB + '|P2|' }).kind).toBe('changes');
        });

        it('shows a database fix of the export number (the after list names the job)', () => {
            const e = ev({ MODE: 'DBFIX', USER_ID: '0', USER_NAME: null, IP: 'DB-SCRIPT', COLUMNNAME: 'EXPTNO', ORIGINALDATA: 'TEST-JOB-0', MODIFIEDDATA: 'TEST-JOB-1' });
            expect(e.kind).toBe('changes');
            expect(e.modeLabel).toBe('Database fix');
            expect(e.changes.map(c => [c.label, c.before, c.after])).toEqual([['Export no.', 'TEST-JOB-0', 'TEST-JOB-1']]);
        });

        it('marks values whose "before" was not recorded', () => {
            const e = ev({ COLUMNNAME: 'EXPTNO|EXPT_VESSEL|EXPT_VSLAGENT|VSL_PORT|', ORIGINALDATA: null, MODIFIEDDATA: 'TEST-JOB-1|VSL-3|AG-2|' });
            expect(e.kind).toBe('changes');
            expect(e.changes.map(c => [c.column, c.after, c.beforeUnknown])).toEqual([['EXPT_VESSEL', 'VSL-3', true], ['EXPT_VSLAGENT', 'AG-2', true]]);
        });

        it('reads an ADD row as the creation snapshot: non-blank day-1 values, keys and zeros left out', () => {
            const e = ev({ MODE: 'ADD', COLUMNNAME: 'EXPTNO|EXPT_MODE|EXPT_CONSIGNEE|EXPT_INSAMT|EXPT_GRWT|EXPT_REMARKS|ID|', ORIGINALDATA: 'TEST-JOB-1|SEA|CON-A|0|12.500||11|', MODIFIEDDATA: '' });
            expect(e.kind).toBe('created');
            expect(e.modeLabel).toBe('Created');
            expect(e.values.map(v => [v.label, v.value, v.section])).toEqual([
                ['Mode of shipment', 'SEA', 'shipment'], ['Consignee', 'CON-A', 'parties'], ['Gross weight', '12.500', 'packages']]);
        });

        it('reads an AUTOJOB row the same way', () => {
            const e = ev({ MODE: 'AUTOJOB', COLUMNNAME: 'EXPTNO|EXPT_MODE|USERNAME|ID', ORIGINALDATA: 'TEST-JOB-1|SEA|7|11', MODIFIEDDATA: '' });
            expect(e.kind).toBe('created');
            expect(e.modeLabel).toBe('Created by Auto job');
            expect(e.values.map(v => v.column)).toEqual(['EXPT_MODE', 'USERNAME']);
        });

        it('shows a creation snapshot that does not line up as raw text', () => {
            const e = ev({ MODE: 'ADD', COLUMNNAME: 'EXPTNO|EXPT_MODE|EXPT_REMARKS|', ORIGINALDATA: 'TEST-JOB-1|SEA|a|b|c', MODIFIEDDATA: '' });
            expect(e.kind).toBe('raw');
        });
    });

    describe('tracking and sheet rows', () => {
        it('reads tracking changes and marks the Sheet view mirror', () => {
            const e = ev({ SRC: 'TRACKING', TABLENAME: 'EXPT_JOB_TRACKING', COLUMNNAME: 'STUFFING_DT', ORIGINALDATA: null, MODIFIEDDATA: '05/03/2026', IP: 'EXPORT SHEET VIEW', RECORD_ID: null });
            expect(e.changes.map(c => [c.label, c.before, c.after, c.where, c.section])).toEqual([['Stuffing date', '', '05/03/2026', 'via Sheet view', 'tracking']]);
            expect(ev({ SRC: 'TRACKING', COLUMNNAME: 'PLANT', ORIGINALDATA: 'P1', MODIFIEDDATA: 'P1 ' }).kind).toBe('nochange');
        });

        it('reads sheet edits, links and row events, and leaves formatting and moves out', () => {
            const edit = ev({ SRC: 'SHEET', MODE: 'edit', TABLENAME: 'TBL_EXPT_SHEET_ROW', COLUMNNAME: 'BOOKING_NO', ORIGINALDATA: 'B-1', MODIFIEDDATA: 'B-2', RECORD_ID: '5' });
            expect(edit.changes.map(c => [c.label, c.before, c.after, c.where])).toEqual([['Booking no.', 'B-1', 'B-2', 'Sheet row 5']]);
            const link = ev({ SRC: 'SHEET', MODE: 'link', TABLENAME: 'TBL_EXPT_SHEET_ROW', COLUMNNAME: 'FF_JOB', ORIGINALDATA: '', MODIFIEDDATA: JOB, RECORD_ID: '5' });
            expect(link.modeLabel).toBe('Link to job');
            expect(link.changes[0].label).toBe('FF job (linked job)');
            const ins = ev({ SRC: 'SHEET', MODE: 'insert', TABLENAME: 'TBL_EXPT_SHEET_ROW', COLUMNNAME: null, MODIFIEDDATA: 'duplicate of row 4', RECORD_ID: '5' });
            expect(ins.kind).toBe('note');
            expect(ins.note).toBe('Sheet row added (row 5): duplicate of row 4');
            expect(toEvent(row({ SRC: 'SHEET', MODE: 'fmt', COLUMNNAME: 'WO', ORIGINALDATA: '{}', MODIFIEDDATA: '{"b":1}' }), JOB)).toBeNull();
            expect(toEvent(row({ SRC: 'SHEET', MODE: 'move', COLUMNNAME: 'SORT_ORDER', ORIGINALDATA: '1', MODIFIEDDATA: '2' }), JOB)).toBeNull();
            expect(toEvent(row({ SRC: 'OTHER' }), JOB)).toBeNull();
        });
    });

    describe('sessions', () => {
        const v1 = (id: number, at: string, user: string, before: string, after: string, col = 'EXPT_POD') =>
            ev({ EVENT_ID: id, EVENT_DT: at, USER_ID: user, USER_NAME: user === '7' ? 'Alice Admin' : 'Bob Booker',
                COLUMNNAME: 'EXPTNO|' + col + '|', ORIGINALDATA: JOB + '|' + before + '|', MODIFIEDDATA: JOB + '|' + after + '|' });

        it('groups one user\'s events less than 60 s apart, even with another user in between', () => {
            const s = groupSessions([
                v1(1, '2026-03-04T10:00:00', '7', 'P1', 'P2'),
                v1(2, '2026-03-04T10:00:20', '8', 'X', 'Y', 'EXPT_INVNO'),
                v1(3, '2026-03-04T10:00:50', '7', 'A', 'B', 'EXPT_BLNO'),
                v1(4, '2026-03-04T10:02:00', '7', 'C', 'D', 'EXPT_BLNO')
            ]);
            expect(s.map(x => [x.userId, x.events.map(e => e.id)])).toEqual([
                ['7', ['JOB:1', 'JOB:3']], ['8', ['JOB:2']], ['7', ['JOB:4']]]);
            expect(s[0].who).toBe('Alice Admin (7)');
            expect(s[0].whenText).toBe('04-03-2026 10:00');
            expect(s[0].sources).toEqual(['JOB']);
        });

        it('chains the gap from the previous event, not from the session start', () => {
            const s = groupSessions([
                v1(1, '2026-03-04T10:00:00', '7', 'P1', 'P2'),
                v1(2, '2026-03-04T10:00:50', '7', 'A', 'B', 'EXPT_BLNO'),
                v1(3, '2026-03-04T10:01:40', '7', 'X', 'Y', 'EXPT_INVNO')
            ]);
            expect(s.length).toBe(1);
            expect(s[0].whenText).toBe('04-03-2026 10:00 – 10:01');
        });

        it('merges a field changed twice into first before → last after, and flags a change back', () => {
            const s = groupSessions([
                v1(1, '2026-03-04T10:00:00', '7', 'P1', 'P2'),
                v1(2, '2026-03-04T10:00:10', '7', 'P2', 'P3'),
                v1(3, '2026-03-04T10:00:20', '7', 'A', 'B', 'EXPT_BLNO'),
                v1(4, '2026-03-04T10:00:30', '7', 'B', 'A', 'EXPT_BLNO')
            ]);
            const c = s[0].changes;
            // section order: Vessel & ports (POD) before BL / SB & customs (BL no.)
            expect(c.map(x => [x.column, x.before, x.after, x.times, x.back])).toEqual([
                ['EXPT_POD', 'P1', 'P3', 2, false], ['EXPT_BLNO', 'A', 'A', 2, true]]);
        });
    });

    describe('the answer', () => {
        it('reports a non-admin, an unknown job and a missing procedure', () => {
            expect(buildHistory({ Table: [{ STATUS: '104', STATUSTEXT: 'Only administrators can see job history.' }] }).state).toBe('denied');
            expect(buildHistory({ Table: [{ STATUS: '104', STATUSTEXT: 'Only administrators can see job history.' }] }).text).toBe('Only administrators can see job history.');
            expect(buildHistory({ Table: [{ STATUS: '103', STATUSTEXT: 'Export job X not found.' }] }).state).toBe('notfound');
            const nd = buildHistory({ Table: [{ STATUS: 101, STATUSTEXT: 'Could not find stored procedure \'USP_EXPT_JOB_HISTORY\'.', url: 'Export/JobHistory' }] });
            expect([nd.state, nd.text]).toEqual(['undeployed', 'History is not deployed yet.']);
            expect(buildHistory({ Table: [{ STATUS: 101, STATUSTEXT: 'Timeout expired.' }] }).state).toBe('error');
            expect(buildHistory(null).state).toBe('error');
            expect(buildHistory({}).state).toBe('error');
        });

        it('reports a job without history', () => {
            const m = buildHistory(ds([]));
            expect([m.state, m.text]).toEqual(['empty', 'No history recorded for this job.']);
            expect(m.header!.createdWho).toBe('Alice Admin (7)');
        });

        it('puts the creation snapshot first and the rest into sessions', () => {
            const m = buildHistory(ds([
                row({ EVENT_ID: 1, MODE: 'ADD', COLUMNNAME: 'EXPTNO|EXPT_MODE|EXPT_POD|', ORIGINALDATA: JOB + '|SEA|P1|', MODIFIEDDATA: '' }),
                row({ EVENT_ID: 2, EVENT_DT: '2026-03-04T10:00:30', COLUMNNAME: 'ID|EXPTNO', ORIGINALDATA: '11|' + JOB, MODIFIEDDATA: '11|' + JOB }),
                row({ EVENT_ID: 3, EVENT_DT: '2026-03-05T09:00:00', USER_ID: '8', USER_NAME: 'Bob Booker', COLUMNNAME: 'EXPTNO|EXPT_POD|EXPT_GRWT|', ORIGINALDATA: JOB + '|P1|1|', MODIFIEDDATA: JOB + '|P2|2|' }),
                row({ SRC: 'TRACKING', EVENT_ID: 1, EVENT_DT: '2026-03-05T09:00:10', USER_ID: '8', USER_NAME: null, TABLENAME: 'EXPT_JOB_TRACKING', COLUMNNAME: 'PLANT', ORIGINALDATA: '', MODIFIEDDATA: 'P-9' })
            ]));
            expect(m.state).toBe('ready');
            expect(m.created!.id).toBe('JOB:1');
            expect(m.createdGroups.map(g => [g.label, g.values.map(v => v.value)])).toEqual([['Shipment', ['SEA']], ['Vessel & ports', ['P1']]]);
            expect(m.sessions.map(s => [s.who, s.events.length, s.sources])).toEqual([
                ['Alice Admin (7)', 1, ['JOB']], ['Bob Booker (8)', 2, ['JOB', 'TRACKING']]]);
            expect(m.sessions[0].items.map(e => e.kind)).toEqual(['nodetail']);
            expect(m.users.map(u => u.label)).toEqual(['Alice Admin (7)', 'Bob Booker (8)']);
            expect(m.sections.map(s => s.id)).toEqual(['vessel', 'packages', 'tracking']);
            expect(m.changeCount).toBe(3);
        });

        it('keeps the creation snapshot of a job a database fix renumbered (the snapshot names the old number)', () => {
            const m = buildHistory(ds([
                row({ EVENT_ID: 1, MODE: 'ADD', COLUMNNAME: 'EXPTNO|EXPT_MODE|ID|', ORIGINALDATA: 'TEST-JOB-0|SEA|11|', MODIFIEDDATA: '' }),
                row({ EVENT_ID: 2, EVENT_DT: '2026-03-05T09:00:00', MODE: 'DBFIX', USER_ID: '0', USER_NAME: null, COLUMNNAME: 'EXPTNO', ORIGINALDATA: 'TEST-JOB-0', MODIFIEDDATA: JOB })
            ]));
            expect(m.created!.values.map(v => v.value)).toEqual(['SEA']);
            expect(m.sessions[0].who).toBe('System');
            expect(m.sessions[0].modes).toEqual(['Database fix']);
            // a snapshot naming an unrelated job is still not trusted
            const x = buildHistory(ds([row({ MODE: 'ADD', COLUMNNAME: 'EXPTNO|EXPT_MODE|', ORIGINALDATA: 'OTHER-JOB|SEA|', MODIFIEDDATA: '' })]));
            expect(x.created).toBeNull();
            expect(x.sessions[0].items[0].kind).toBe('raw');
        });

        it('folds repeated saves without changes into one line', () => {
            const m = buildHistory(ds([
                row({ EVENT_ID: 1, COLUMNNAME: 'ID|EXPTNO', ORIGINALDATA: '11|' + JOB, MODIFIEDDATA: '11|' + JOB }),
                row({ EVENT_ID: 2, EVENT_DT: '2026-03-04T10:00:05', COLUMNNAME: 'EXPTNO|EXPT_POD|', ORIGINALDATA: JOB + '|P1|', MODIFIEDDATA: JOB + '|P1|' }),
                row({ EVENT_ID: 3, EVENT_DT: '2026-03-04T10:00:10', COLUMNNAME: 'EXPTNO|EXPT_POD|', ORIGINALDATA: JOB + '|P1|', MODIFIEDDATA: JOB + '|P1|' }),
                row({ EVENT_ID: 4, EVENT_DT: '2026-03-04T10:00:15', COLUMNNAME: 'EXPTNO|EXPT_POD|', ORIGINALDATA: JOB + '|P1|', MODIFIEDDATA: JOB + '|P1|' })
            ]));
            expect(m.sessions.length).toBe(1);
            expect(m.sessions[0].events.length).toBe(4);
            expect(m.sessions[0].items.map(e => [e.kind, e.repeat])).toEqual([['nodetail', 1], ['nochange', 3]]);
        });

        it('copes with a job that has no creation snapshot', () => {
            const m = buildHistory(ds([row({ COLUMNNAME: 'EXPTNO|EXPT_POD|', ORIGINALDATA: JOB + '|P1|', MODIFIEDDATA: JOB + '|P2|' })]));
            expect(m.created).toBeNull();
            expect(m.sessions.length).toBe(1);
        });
    });

    describe('filters', () => {
        const model = () => buildHistory(ds([
            row({ EVENT_ID: 1, EVENT_DT: '2026-03-04T10:00:00', COLUMNNAME: 'EXPTNO|EXPT_POD|EXPT_GRWT|', ORIGINALDATA: JOB + '|P1|1|', MODIFIEDDATA: JOB + '|P2|2|' }),
            row({ EVENT_ID: 2, EVENT_DT: '2026-03-04T10:00:10', COLUMNNAME: 'ID|EXPTNO', ORIGINALDATA: '11|' + JOB, MODIFIEDDATA: '11|' + JOB }),
            row({ EVENT_ID: 3, EVENT_DT: '2026-03-06T08:00:00', USER_ID: '8', USER_NAME: 'Bob Booker', COLUMNNAME: 'EXPTNO|EXPT_BLNO|', ORIGINALDATA: JOB + '||', MODIFIEDDATA: JOB + '|BL-77|' })
        ]));

        it('shows everything newest first by default, with section headings', () => {
            const v = filterSessions(model().sessions, defaultFilter());
            expect(v.map(x => x.s.userId)).toEqual(['8', '7']);
            expect(v[1].rows.map(r => r.kind === 'section' ? 'h:' + r.label : r.kind === 'change' ? 'c:' + r.c.column : 'i:' + r.e.kind)).toEqual([
                'h:Vessel & ports', 'c:EXPT_POD', 'h:Packages & weights', 'c:EXPT_GRWT', 'i:nodetail']);
        });

        it('filters by section, user and text, and can hide saves without details', () => {
            const s = model().sessions;
            const f = defaultFilter();
            expect(filterSessions(s, { ...f, newestFirst: false }).map(x => x.s.userId)).toEqual(['7', '8']);
            const bySec = filterSessions(s, { ...f, section: 'packages' });
            expect(bySec.length).toBe(1);
            expect(bySec[0].rows.map(r => r.kind)).toEqual(['section', 'change']);       // no other sections, no notes
            expect(filterSessions(s, { ...f, user: '8' }).map(x => x.s.userId)).toEqual(['8']);
            const byText = filterSessions(s, { ...f, q: 'bl-77' });
            expect(byText.map(x => x.changes)).toEqual([1]);
            expect(filterSessions(s, { ...f, q: 'bob' })[0].s.userId).toBe('8');        // a user match keeps all their rows
            const bare = filterSessions(s, { ...f, hideBare: true });
            expect(bare[1].rows.some(r => r.kind === 'item')).toBe(false);
            expect(filterSessions(s, { ...f, q: 'nothing like this' })).toEqual([]);
        });
    });
});
