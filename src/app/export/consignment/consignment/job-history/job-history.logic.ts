/**
 * Export job view › History (phase 1, read-only, Links SA only).
 *
 * Turns what USP_EXPT_JOB_HISTORY returns (POST api/Export/JobHistory, _DB_FIX/EXPORT_JOB_HISTORY_LINKSDB20_20261024.sql)
 * into what the History card shows. Pure functions, no Angular: covered by job-history.logic.spec.ts.
 *
 * Table  = STATUS ('100' / '103' unknown job / '104' not an admin) + the job header.
 * Table1 = events, oldest first: SRC, EVENT_ID, EVENT_DT, USER_ID, USER_NAME, MODE, TABLENAME, COLUMNNAME, ORIGINALDATA,
 *          MODIFIEDDATA, IP, RECORD_ID.
 *   JOB      TBL_USERTRACK_EXPTMASTER. COLUMNNAME / ORIGINALDATA / MODIFIEDDATA are parallel pipe-delimited lists, often
 *            with one trailing '|' (on some lists and not on others). ADD / AUTOJOB rows are the day-1 snapshot (values in
 *            ORIGINALDATA). EDIT rows list the fields the screen saved, changed or not.
 *   TRACKING EXPT_JOB_TRACKING_LOG, one field per row.
 *   SHEET    TBL_EXPT_SHEET_LOG (ROW_KIND 'W'), one field per row; MODE is the sheet ACTION.
 *
 * Rules
 *   - Pairing: a value list pairs with the column list when it has as many items, or one more that is empty (the trailing
 *     '|'). Anything else is shown as the raw stored text, never paired by guess. Lists whose EXPTNO / JOBNO item names
 *     another job (in both lists; a number a database fix replaced counts as this job), or whose ID item is not the row's
 *     RECORD_ID, are treated as not lining up either.
 *   - Unchanged values are never shown as changes: equal after trimming, both blank ('', zeros, only commas), or the same
 *     decimal number written differently (1852.000 / 1852).
 *   - A save that lists only key columns (ID, EXPTNO, JOBNO) is "Saved (no field details recorded)"; one whose fields
 *     all kept their values is "Saved, no values changed".
 *   - ADD / AUTOJOB on the job table is the Created card: its non-blank values by section.
 *   - Sessions: events of the same user less than 60 s apart (from the previous event of that user). Within a session a
 *     field changed twice shows first-before → last-after, and repeated saves without changes fold into one line.
 *   - Sheet formatting ('fmt') and row moves ('move') are not job data and are left out.
 */

export type HistSrc = 'JOB' | 'TRACKING' | 'SHEET';
export type SectionId = 'parties' | 'shipment' | 'vessel' | 'customs' | 'invoice' | 'packages' | 'tracking' | 'sheet' | 'other';
export interface SectionDef { id: SectionId; label: string; }

export const SECTIONS: SectionDef[] = [
    { id: 'parties', label: 'Parties' },
    { id: 'shipment', label: 'Shipment' },
    { id: 'vessel', label: 'Vessel & ports' },
    { id: 'customs', label: 'BL / SB & customs' },
    { id: 'invoice', label: 'Invoice & value' },
    { id: 'packages', label: 'Packages & weights' },
    { id: 'tracking', label: 'Tracking' },
    { id: 'sheet', label: 'Sheet view' },
    { id: 'other', label: 'Other' }
];
const SECTION_ORDER: { [id: string]: number } = {};
SECTIONS.forEach((s, i) => SECTION_ORDER[s.id] = i);

/** Session gap: events of one user closer than this belong to one save session. */
export const SESSION_GAP_MS = 60 * 1000;

// ---- labels ----------------------------------------------------------------------------------------------------

type L = [string, SectionId];

/** Job-screen columns (TBL_USERTRACK_EXPTMASTER): expt_master, plus the carting / misc-job / dimension / container rows. */
const JOB_FIELDS: { [col: string]: L } = {
    // parties
    EXPT_EXPORTER: ['Exporter / shipper', 'parties'], EXPT_BILLTO: ['Bill to', 'parties'], EXPT_CONSIGNEE: ['Consignee', 'parties'],
    EXPT_BUYER: ['Buyer', 'parties'], NOTIFYBUYER: ['Notify buyer', 'parties'], MANUFACTURER: ['Manufacturer', 'parties'],
    EXPT_BANK: ['Consignee bank', 'parties'], EXPT_SRCAGT: ['Sourcing agent', 'parties'], COMMNAME: ['Commission paid to', 'parties'],
    COMMADDR1: ['Commission agent address 1', 'parties'], COMMADDR2: ['Commission agent address 2', 'parties'],
    CLIENT_CODE: ['Client', 'parties'],
    // shipment
    EXPTNO: ['Export no.', 'shipment'], ID: ['Record id', 'shipment'], JOBNO: ['Job no.', 'shipment'],
    EXPT_MODE: ['Mode of shipment', 'shipment'], EXPT_DOCRECD: ['Doc. received date', 'shipment'], CITYCODE: ['Branch', 'shipment'],
    CMPCODE: ['Company', 'shipment'], USERNAME: ['Job owner (user id)', 'shipment'], YR: ['Year', 'shipment'],
    CLEARANCE: ['Clearance', 'shipment'], EXPT_IT: ['I / T', 'shipment'], EXPT_FRT: ['Freight terms (PP / CC)', 'shipment'],
    EXPT_REMARKS: ['Remarks', 'shipment'], CONREMARK: ['Consignment remark', 'shipment'], EXPT_CARTPLACE: ['Carting place', 'shipment'],
    CARTEDDT: ['Carted date', 'shipment'], PREALERTDT: ['Pre-alert date', 'shipment'], EXWORKS: ['Ex-works', 'shipment'],
    FREIGHT_FRD: ['Freight forwarding', 'shipment'], CUSTOM_CLR: ['Customs clearance', 'shipment'],
    EXPTAPPDT: ['Approval date', 'shipment'], EXPTAPPWM: ['Approval (WM)', 'shipment'], ORDERNO: ['Order no.', 'shipment'],
    NARRATION: ['Narration', 'shipment'], MAKER_ID: ['Entered by (user id)', 'shipment'], MAKER_IP: ['Entered from', 'shipment'],
    // vessel & ports
    EXPT_VESSEL: ['Vessel (rotation no.)', 'vessel'], EXPT_VSLAGENT: ['Vessel agent', 'vessel'], EXPT_AGENT: ['Vessel agent', 'vessel'],
    VSL_PORT: ['Vessel port', 'vessel'], EXPT_LDGPORT: ['Loading port', 'vessel'], EXPT_POD: ['Port of discharge', 'vessel'],
    EXPT_DESTCITY: ['Destination city', 'vessel'], EXPT_DESTCOUNTRY: ['Destination country', 'vessel'], FK_TERMINALID: ['Terminal', 'vessel'],
    AIRLINENAME: ['Airline', 'vessel'], FLIGHTNO: ['Planned flight no.', 'vessel'], FLIGHTDT: ['Planned flight date', 'vessel'],
    ACTUALFLIGHTNO: ['Actual flight no.', 'vessel'], ACTUALFLIGHTDT: ['Actual flight date', 'vessel'], MAWBDEST: ['MAWB destination', 'vessel'],
    MAWBFRT: ['MAWB freight', 'vessel'], TRANSPORT1: ['Transhipment port 1', 'vessel'], FLIGHTNO1: ['Flight no. (port 1)', 'vessel'],
    ETDPORT1: ['ETD (port 1)', 'vessel'], ETAPORT1: ['ETA (port 1)', 'vessel'], TRANSPORT2: ['Transhipment port 2', 'vessel'],
    FLIGHTNO2: ['Flight no. (port 2)', 'vessel'], ETDPORT2: ['ETD (port 2)', 'vessel'], ETAPORT2: ['ETA (port 2)', 'vessel'],
    CONTAINERNO: ['Container no.', 'vessel'], SHPGLINE: ['Shipping line', 'vessel'], LOADDT: ['Load date', 'vessel'],
    PORT1LOADDT: ['Load date (port 1)', 'vessel'], PORT2LOADDT: ['Load date (port 2)', 'vessel'], CONVESSEL1: ['Connecting vessel 1', 'vessel'],
    ETA1: ['ETA (vessel 1)', 'vessel'], CONVESSEL2: ['Connecting vessel 2', 'vessel'], ETA2: ['ETA (vessel 2)', 'vessel'],
    DIRECTVSL: ['Direct vessel', 'vessel'], OLDVESSEL: ['Previous vessel', 'vessel'],
    // BL / SB & customs
    EXPT_BLNO: ['B/L no.', 'customs'], EXPT_BLDT: ['B/L date', 'customs'], EXPT_BLTYPE: ['B/L type', 'customs'],
    EXPT_HBLNO: ['HBL no.', 'customs'], EXPT_HBLDT: ['HBL date', 'customs'], EXPT_MBLFRT: ['MBL freight', 'customs'],
    EXPT_SHIPBILLTYPE: ['Type of shipping bill', 'customs'], EXPT_SHIPBILLNO: ['Shipping bill no.', 'customs'],
    EXPT_SHIPBILLDT: ['Shipping bill date', 'customs'], EXPT_SHIPBILLDT1: ['Customs date', 'customs'],
    EXPT_SHIPCUSTOM1: ['Customs examined on', 'customs'], EXPT_SHIPCCNO: ['CC no.', 'customs'], EXPT_SHIPCUSTOM: ['Customs cleared on', 'customs'],
    OBJECTION: ['Customs objection', 'customs'], OUTCHARGEDT: ['Out of charge date', 'customs'],
    EXPT_GRINO: ['GRI no.', 'customs'], EXPT_GRIDATE: ['GRI date', 'customs'],
    BILLENTRYNO: ['Bill of entry no.', 'customs'], BILLENTRYDT: ['Bill of entry date', 'customs'],
    SBVALUE: ['SB value addition %', 'customs'], SBAMOUNT: ['SB amount', 'customs'], SBBOOKTYPE: ['SB book type', 'customs'],
    SBPRORECPTNO: ['SB receipt no.', 'customs'], SBPRORECPTDT: ['SB receipt date', 'customs'],
    SBEXEMPT1: ['Exempted material value 1', 'customs'], SBEXEMPT2: ['Exempted material value 2', 'customs'], SBEXEMPT3: ['Exempted material value 3', 'customs'],
    SBDEECBOOKNO: ['DEEC passbook no.', 'customs'], SBDEECBOOKDT: ['DEEC passbook date', 'customs'], SBDEECLICNO: ['Advance licence no.', 'customs'],
    SBGROUPCODE: ['SB group code', 'customs'], SBSIONNO: ['SION no.', 'customs'], SBEXPBOOKNO: ['SB book no.', 'customs'], SBEXPBOOKDT: ['SB book date', 'customs'],
    SBDUTY: ['Duty %', 'customs'], SBDUTYAMT: ['Duty amount', 'customs'], SBCESS: ['Cess %', 'customs'],
    ARFORMNO: ['AR4 form no.', 'customs'], ARFORMDT: ['AR4 form date', 'customs'], COMMISSIONRATE: ['Excise commissionerate', 'customs'],
    DIVISION: ['Excise division', 'customs'], RANGE: ['Excise range', 'customs'],
    ARFORMNO1: ['AR4 form no. (2)', 'customs'], ARFORMDT1: ['AR4 form date (2)', 'customs'], COMMISSIONRATE1: ['Excise commissionerate (2)', 'customs'],
    DIVISION1: ['Excise division (2)', 'customs'], RANGE1: ['Excise range (2)', 'customs'],
    ARFORMNO2: ['AR4 form no. (3)', 'customs'], ARFORMDT2: ['AR4 form date (3)', 'customs'], COMMISSIONRATE2: ['Excise commissionerate (3)', 'customs'],
    DIVISION2: ['Excise division (3)', 'customs'], RANGE2: ['Excise range (3)', 'customs'],
    ARFORMNO3: ['AR4 form no. (4)', 'customs'], ARFORMDT3: ['AR4 form date (4)', 'customs'], COMMISSIONRATE3: ['Excise commissionerate (4)', 'customs'],
    DIVISION3: ['Excise division (4)', 'customs'], RANGE3: ['Excise range (4)', 'customs'],
    EXPT_QUOTAVALIDDT: ['Quota valid date', 'customs'], EXPT_QUOTAOBTAINDT: ['Quota obtained date', 'customs'],
    EXPT_QUOTAEXPIRYDT: ['Quota expiry date', 'customs'], QUOTACERTNO: ['Quota certificate no.', 'customs'],
    QUOTACERTNO1: ['Quota certificate no. (2)', 'customs'], QUOTACERTNO2: ['Quota certificate no. (3)', 'customs'],
    // invoice & value
    EXPT_INVNO: ['Invoice no.', 'invoice'], EXPT_INVDATE: ['Invoice date', 'invoice'], EXPT_INVTYPE: ['Incoterm', 'invoice'],
    EXPT_CUR: ['Currency', 'invoice'], EXPT_CURNAME: ['Currency name', 'invoice'], EXPT_CURRATE: ['Currency rate', 'invoice'],
    EXPT_CURINRRATE: ['INR rate', 'invoice'], EXPT_INVAMT: ['Invoice amount', 'invoice'], EXPT_INSAMT: ['Insurance amount', 'invoice'],
    EXPT_FREIGHT: ['Freight charges', 'invoice'], EXPT_FOB: ['FOB value', 'invoice'], EXPT_MKTVALUE: ['Market value', 'invoice'],
    EXPT_PACKING: ['Packing & others', 'invoice'], INVCOMMISSION: ['Commission', 'invoice'], INVDISCOUNT: ['Discount', 'invoice'],
    INVDEDUCTAMT: ['Other deduction', 'invoice'], INVDEDUCTDESC: ['Other deduction description', 'invoice'],
    IMPLABLE: ['Import label used', 'invoice'], NATUREOFPAYMENT: ['Nature of payment', 'invoice'],
    PERIODOFPAYMENT: ['Period of payment', 'invoice'], EXPTCONTRACTNO: ['Export contract no.', 'invoice'],
    // packages & weights
    EXPT_NOOFPKGS: ['No. of packages', 'packages'], EXPT_TYPEOFPKGS: ['Type of packages', 'packages'], EXPT_NOOFPCS: ['No. of pieces', 'packages'],
    EXPT_TYPEOFPCS: ['Type of pieces', 'packages'], EXPT_GRWT: ['Gross weight', 'packages'], EXPT_NETWT: ['Net weight', 'packages'],
    EXPT_VOLUME: ['Volume (CBM)', 'packages'], EXPT_CHBLWT: ['Chargeable weight', 'packages'], EXPT_GRWTSHIPPER: ['Gross weight (shipper)', 'packages'],
    EXPT_VOLUMESHIPPER: ['Volume (shipper)', 'packages'], NOOFPKGS: ['No. of packages', 'packages'],
    DIMLENGH: ['Length', 'packages'], DIMWIDTH: ['Width', 'packages'], DIMHEIGHT: ['Height', 'packages'], DIMVOLUME: ['Dimension volume', 'packages'],
    DIMCBM: ['CBM', 'packages'], DIMCHBLWT: ['Chargeable weight (dimensions)', 'packages']
};

/** Tracking module fields (EXPT_JOB_TRACKING_LOG.FIELD_NAME = EXPT_JOB_TRACKING columns). */
const TRACKING_FIELDS: { [col: string]: string } = {
    TRACKING_STATUS: 'Tracking status', SHIPMENT_CATEGORY: 'Shipment category', VEHICLE_MODEL: 'Vehicle model', STUFFING_DT: 'Stuffing date',
    DO_ETD: 'DO ETD', DO_RECEIVE_DT: 'DO received date', TRANSPORTER: 'Transporter', CARGO_TYPE: 'Cargo type', PLANT: 'Plant',
    LC_NO: 'LC no.', LC_DATE: 'LC date', HAZ: 'Hazardous', REMARK1: 'Remark', DO_GIVEN_DT: 'D/O given date', POL_GATE: 'POL gate',
    GATE_OPEN_DT: 'Gate open', GATE_CUTOFF_DT: 'Gate cut-off', SI_CUTOFF_DT: 'SI cut-off', VGM_SUBMITTED_DT: 'VGM submitted',
    SI_SUBMITTED_DT: 'SI submitted', BL_HANDOVER_DT: 'BL handed over', SLINE_PAYMENT_STATUS: 'Shipping line payment',
    CLEARANCE_POINT: 'Clearance point', OPEN_ORDER: 'Open order', BUFFER_YARD: 'Buffer yard', PICKUP_DT: 'Pick-up date',
    CNTR_DISPATCH_DT: 'Container dispatched', CNTR_REPORT_NS_DT: 'Container reported at NS', CNTR_GATEDIN_DT: 'Container gated in'
};

/** Sheet view WO-row columns (sheet-registry.ts keys) and the row-level keys the sheet log uses. */
const SHEET_FIELDS: { [col: string]: string } = {
    WO: 'WO', PORT: 'Port', COUNTRY: 'Country', VEH: 'Vehicle', QTY: 'Qty', CONT: 'Containers', CNTR_TYPE: 'Container type',
    STUFFING_DT: 'Stuffing date', VSL_NAME: 'Vessel name', DO_ETD: 'DO ETD', SLINE: 'Shipping line', AGENT: 'Agent',
    DO_RECEIVE_DT: 'DO received date', BOOKING_NO: 'Booking no.', TRANSPORTER: 'Transporter', CARGO_TYPE: 'Cargo type', PLANT: 'Plant',
    PO_NO: 'PO no.', LC_NO: 'LC no.', LC_DATE: 'LC date', HAZ: 'Hazardous', CONSIGNEE: 'Consignee', REMARK1: 'Remark 1',
    DO_GIVEN_DT: 'D/O given date', CONTAINER_NO: 'Container no.', POL_GATE: 'POL gate', GATE_OPEN_DT: 'Gate open',
    GATE_CUTOFF_DT: 'Gate cut-off', SI_CUTOFF_DT: 'SI cut-off', DO_ETD2: 'DO ETD 2', CURRENT_ETD: 'Current ETD', ETA_DEST: 'ETA destination',
    FINAL_VSL_SOB: 'Final vessel SOB', VGM_SUBMITTED_DT: 'VGM submitted', SI_SUBMITTED_DT: 'SI submitted', BL_NO: 'BL no.', BL_DT: 'BL date',
    BL_HANDOVER_DT: 'BL handed over', FF_JOB: 'FF job (linked job)', SLINE_PAYMENT_STATUS: 'Shipping line payment',
    CLEARANCE_POINT: 'Clearance point', OPEN_ORDER: 'Open order', BUFFER_YARD: 'Buffer yard', EDOC_STATUS: 'E-doc status',
    COURIER_DT: 'Courier date', PICKUP_DT: 'Pick-up date', CNTR_DISPATCH_DT: 'Container dispatched', CNTR_REPORT_NS_DT: 'Container reported at NS',
    CNTR_GATEDIN_DT: 'Container gated in', SB_NO: 'SB no.', SB_DT: 'SB date', FOR_HBL: 'For HBL',
    '*ROW': 'Row status', EXPTNO: 'Linked job', SORT_ORDER: 'Position'
};

const TABLE_LABELS: { [t: string]: string } = {
    EXPT_MASTER: '', EXPT_CARTING: 'Carting', EXPT_MASTER_MISC: 'Misc. job', EXPT_JOB_DIMENSION: 'Dimensions',
    EXPT_CONTAINER: 'Container', EXPT_CONTAINER1: 'Container', EXPT_JOB_TRACKING: '', TBL_EXPT_SHEET_ROW: 'Sheet row'
};

const MODE_LABELS: { [m: string]: string } = {
    ADD: 'Created', AUTOJOB: 'Created by Auto job', EDIT: 'Edit', DBFIX: 'Database fix', DELETE: 'Delete',
    edit: 'Edit', restore: 'Restore', status: 'Row status', link: 'Link to job', convert: 'Convert to job', unlink: 'Unlink',
    insert: 'Row added', delete: 'Row deleted'
};

export const SOURCE_LABELS: { [s: string]: string } = { JOB: 'Job', TRACKING: 'Tracking', SHEET: 'Sheet view' };

const KEY_COLUMNS = ['ID', 'EXPTNO', 'JOBNO'];

export interface FieldInfo { label: string; section: SectionId; known: boolean; }

/** Label + section of a column. Unknown columns keep their name, under Other. */
export function fieldInfo(src: HistSrc, column: string): FieldInfo {
    const c = text(column).toUpperCase();
    if (src === 'TRACKING') {
        return TRACKING_FIELDS[c] ? { label: TRACKING_FIELDS[c], section: 'tracking', known: true } : { label: text(column), section: 'tracking', known: false };
    }
    if (src === 'SHEET') {
        return SHEET_FIELDS[c] ? { label: SHEET_FIELDS[c], section: 'sheet', known: true } : { label: text(column), section: 'sheet', known: false };
    }
    const f = JOB_FIELDS[c];
    return f ? { label: f[0], section: f[1], known: true } : { label: text(column) || '(no name)', section: 'other', known: false };
}

export function sectionLabel(id: string): string {
    const s = SECTIONS.find(x => x.id === id);
    return s ? s.label : id;
}

export function modeLabel(mode: string): string {
    const m = text(mode);
    return MODE_LABELS[m] || MODE_LABELS[m.toUpperCase()] || m;
}

export function tableLabel(table: string): string {
    const t = text(table).toUpperCase();
    return TABLE_LABELS[t] !== undefined ? TABLE_LABELS[t] : t;
}

// ---- values ----------------------------------------------------------------------------------------------------

/** The value as shown: trimmed text ('' for null / undefined). */
export function text(v: any): string {
    return v === null || v === undefined ? '' : String(v).trim();
}

/** '', only zeros ('0', '0.00') or only separators (',,') - no value. */
export function isBlank(v: any): boolean {
    const s = text(v);
    return s === '' || /^0+(\.0+)?$/.test(s) || /^[,\s]+$/.test(s);
}

const DECIMAL = /^-?\d+(\.\d+)?$/;

/** True when a field did not really change. */
export function sameValue(a: any, b: any): boolean {
    const x = text(a), y = text(b);
    if (x === y) { return true; }
    if (isBlank(x) && isBlank(y)) { return true; }
    // the same number written with a different number of decimals (1852.000 / 1852); codes without a decimal point
    // ('0012' / '12') stay different
    return DECIMAL.test(x) && DECIMAL.test(y) && (x.indexOf('.') >= 0 || y.indexOf('.') >= 0) && Number(x) === Number(y);
}

// ---- pipe lists ------------------------------------------------------------------------------------------------

/** The column list: trimmed names, without the empty item a trailing '|' leaves. */
export function splitColumns(columns: any): string[] {
    const s = columns === null || columns === undefined ? '' : String(columns);
    if (s.trim() === '') { return []; }
    const parts = s.split('|').map(p => p.trim());
    if (parts.length > 1 && parts[parts.length - 1] === '') { parts.pop(); }
    return parts;
}

/** The values paired with `cols`, or null when the list does not line up (or is missing). */
export function alignValues(cols: string[], values: any): string[] | null {
    if (values === null || values === undefined || !cols.length) { return null; }
    const parts = String(values).split('|');
    if (parts.length === cols.length + 1 && parts[parts.length - 1].trim() === '') { parts.pop(); }
    return parts.length === cols.length ? parts : null;
}

function isKey(col: string): boolean { return KEY_COLUMNS.indexOf(text(col).toUpperCase()) >= 0; }

/**
 * Sanity check of paired lists against what the row itself says: false when the EXPTNO / JOBNO item names another job
 * in every given list (`jobNos` = this job and its earlier numbers), or when an ID item differs from the row's
 * RECORD_ID. Either is a sign the lists are shifted although their item counts match.
 */
function anchorOk(cols: string[], lists: (string[] | null)[], jobNos: string[], recordId: string): boolean {
    const given = lists.filter(l => !!l) as string[][];
    const nos = jobNos.map(text).filter(x => !!x);
    const ix = cols.findIndex(c => { const u = c.toUpperCase(); return u === 'EXPTNO' || u === 'JOBNO'; });
    if (ix >= 0 && nos.length) {
        const named = given.filter(l => text(l[ix]) !== '');
        if (named.length && !named.some(l => nos.indexOf(text(l[ix])) >= 0)) { return false; }
    }
    const id = cols.findIndex(c => c.toUpperCase() === 'ID');
    if (id >= 0 && /^\d+$/.test(text(recordId))) {
        if (given.some(l => text(l[id]) !== '' && text(l[id]) !== text(recordId))) { return false; }
    }
    return true;
}

// ---- events ----------------------------------------------------------------------------------------------------

export type EventKind = 'created' | 'changes' | 'raw' | 'nodetail' | 'nochange' | 'note';

export interface FieldChange {
    key: string;              // src|table|record|column - what merges within a session
    src: HistSrc;
    column: string;
    label: string;
    section: SectionId;
    where: string;            // '' for the job itself; 'Carting', 'Sheet row 12', 'via Sheet view', ...
    before: string;
    after: string;
    beforeUnknown: boolean;   // the audit row has no "before" list
    times: number;            // changes merged into this one
    back: boolean;            // changed and changed back within the session
}

export interface FieldValue { column: string; label: string; section: SectionId; value: string; }
export interface ValueGroup { section: SectionId; label: string; values: FieldValue[]; }

export interface HistEvent {
    id: string;
    src: HistSrc;
    ms: number;               // wall-clock time as stored (no time-zone shift), for ordering / sessions
    atText: string;           // dd-mm-yyyy hh:mm
    atFull: string;           // dd-mm-yyyy hh:mm:ss
    userId: string;
    userName: string;
    mode: string;
    modeLabel: string;
    table: string;
    ip: string;
    recordId: string;
    kind: EventKind;
    changes: FieldChange[];
    values: FieldValue[];
    raw: { columns: string; before: string; after: string } | null;
    note: string;
    repeat: number;           // in a session: identical saves without changes folded into one line
}

export interface WallClock { ms: number; text: string; full: string; }

/** EVENT_DT as stored: '2026-10-24T11:38:05.123' (Web API) or a Date. Never shifted by the browser's time zone. */
export function wallClock(v: any): WallClock | null {
    let p: number[] | null = null;
    if (v instanceof Date) {
        if (!isNaN(v.getTime())) { p = [v.getFullYear(), v.getMonth() + 1, v.getDate(), v.getHours(), v.getMinutes(), v.getSeconds(), v.getMilliseconds()]; }
    } else {
        const s = text(v);
        const m = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,7}))?)?/.exec(s);
        if (m) {
            p = [+m[1], +m[2], +m[3], +m[4], +m[5], +(m[6] || 0), m[7] ? Math.round(Number('0.' + m[7]) * 1000) : 0];
        } else {
            const d = /\/Date\((-?\d+)/.exec(s);
            if (d) { const x = new Date(Number(d[1])); p = [x.getFullYear(), x.getMonth() + 1, x.getDate(), x.getHours(), x.getMinutes(), x.getSeconds(), x.getMilliseconds()]; }
        }
    }
    if (!p) { return null; }
    const two = (n: number) => (n < 10 ? '0' : '') + n;
    const txt = two(p[2]) + '-' + two(p[1]) + '-' + p[0] + ' ' + two(p[3]) + ':' + two(p[4]);
    return { ms: Date.UTC(p[0], p[1] - 1, p[2], p[3], p[4], p[5], p[6]), text: txt, full: txt + ':' + two(p[5]) };
}

function userNameOf(raw: any): string { return text(raw.USER_NAME).replace(/\s+/g, ' '); }

/** "Name (id)", "User 12" when no name was found, "System" for user 0 / none (database scripts). */
export function userLabel(id: string, name: string): string {
    if (name) { return id ? name + ' (' + id + ')' : name; }
    return !id || id === '0' ? 'System' : 'User ' + id;
}

function change(src: HistSrc, table: string, recordId: string, column: string, where: string, before: any, after: any, beforeUnknown: boolean): FieldChange {
    const f = fieldInfo(src, column);
    return {
        key: src + '|' + text(table).toUpperCase() + '|' + text(recordId) + '|' + text(column).toUpperCase(), src, column: text(column),
        label: f.label, section: f.section, where, before: beforeUnknown ? '' : text(before), after: text(after), beforeUnknown, times: 1, back: false
    };
}

/**
 * One row of Table1 as an event, or null when it is not job history (sheet formatting / moves, rows without a source).
 * `jobNo` is the job the history is for, or the list of its numbers (current first, then numbers a database fix
 * replaced) - the pairing sanity check.
 */
export function toEvent(raw: any, jobNo: string | string[]): HistEvent | null {
    const jobNos = Array.isArray(jobNo) ? jobNo : [jobNo];
    if (!raw) { return null; }
    const src = text(raw.SRC).toUpperCase() as HistSrc;
    if (src !== 'JOB' && src !== 'TRACKING' && src !== 'SHEET') { return null; }
    const mode = text(raw.MODE);
    if (src === 'SHEET' && (mode === 'fmt' || mode === 'move')) { return null; }
    const at = wallClock(raw.EVENT_DT);
    const table = text(raw.TABLENAME).toUpperCase();
    const recordId = text(raw.RECORD_ID);
    const ev: HistEvent = {
        id: src + ':' + text(raw.EVENT_ID), src, ms: at ? at.ms : 0, atText: at ? at.text : '', atFull: at ? at.full : '',
        userId: text(raw.USER_ID), userName: userNameOf(raw), mode, modeLabel: modeLabel(mode), table, ip: text(raw.IP), recordId,
        kind: 'changes', changes: [], values: [], raw: null, note: '', repeat: 1
    };

    if (src === 'TRACKING') {
        const where = ev.ip.toUpperCase() === 'EXPORT SHEET VIEW' ? 'via Sheet view' : '';
        if (!sameValue(raw.ORIGINALDATA, raw.MODIFIEDDATA)) {
            ev.changes.push(change(src, table, '', raw.COLUMNNAME, where, raw.ORIGINALDATA, raw.MODIFIEDDATA, false));
        }
        if (!ev.changes.length) { ev.kind = 'nochange'; ev.note = 'Saved, no values changed'; }
        return ev;
    }

    if (src === 'SHEET') {
        const where = recordId ? 'Sheet row ' + recordId : 'Sheet row';
        const col = text(raw.COLUMNNAME);
        if (mode === 'insert' || mode === 'delete') {
            ev.kind = 'note';
            ev.note = (mode === 'insert' ? 'Sheet row added' : 'Sheet row deleted') + (recordId ? ' (row ' + recordId + ')' : '')
                + (text(raw.MODIFIEDDATA) ? ': ' + text(raw.MODIFIEDDATA) : '');
            return ev;
        }
        if (!col) {
            ev.kind = 'note';
            ev.note = ev.modeLabel + (recordId ? ' (row ' + recordId + ')' : '');
            return ev;
        }
        if (!sameValue(raw.ORIGINALDATA, raw.MODIFIEDDATA)) {
            ev.changes.push(change(src, table, recordId, col, where, raw.ORIGINALDATA, raw.MODIFIEDDATA, false));
        }
        if (!ev.changes.length) { ev.kind = 'nochange'; ev.note = 'Saved, no values changed'; }
        return ev;
    }

    // ---- JOB: pipe-delimited lists ----
    const cols = splitColumns(raw.COLUMNNAME);
    const where = tableLabel(table);
    const oMissing = raw.ORIGINALDATA === null || raw.ORIGINALDATA === undefined;
    const o = alignValues(cols, raw.ORIGINALDATA);
    const m = alignValues(cols, raw.MODIFIEDDATA);
    const upMode = mode.toUpperCase();

    if (!cols.length) {
        ev.kind = 'nodetail';
        ev.note = upMode === 'DELETE' ? 'Deleted' + (where ? ' (' + where + ')' : '') : 'Saved (no field details recorded)';
        return ev;
    }

    if (upMode === 'ADD' || upMode === 'AUTOJOB') {
        // the snapshot sits in ORIGINALDATA (MODIFIEDDATA is empty); take the paired list with more values
        const count = (l: string[] | null) => (l ? l.filter(x => !isBlank(x)).length : -1);
        const v = count(m) > count(o) ? m : o;
        if (!v || !anchorOk(cols, [v], jobNos, recordId)) {
            ev.kind = 'raw';
            ev.raw = { columns: cols.join('|'), before: text(raw.ORIGINALDATA), after: text(raw.MODIFIEDDATA) };
            return ev;
        }
        ev.kind = 'created';
        ev.values = cols.map((c, i) => { const f = fieldInfo('JOB', c); return { column: c, label: f.label, section: f.section, value: text(v[i]) }; })
            .filter(x => !isKey(x.column) && !isBlank(x.value));
        return ev;
    }

    if (upMode === 'DELETE') {
        ev.kind = 'nodetail';
        ev.note = 'Deleted' + (where ? ' (' + where + ')' : '') + ': ' + cols.join(', ');
        return ev;
    }

    // EDIT, DBFIX and any other mode: before → after per field
    if (!m || (!oMissing && !o) || !anchorOk(cols, [o, m], jobNos, recordId)) {
        ev.kind = 'raw';
        ev.raw = { columns: text(raw.COLUMNNAME), before: oMissing ? '' : text(raw.ORIGINALDATA), after: text(raw.MODIFIEDDATA) };
        return ev;
    }
    cols.forEach((c, i) => {
        if (oMissing) {
            // no "before" list stored (e.g. vessel assignment): show what was set, not the keys
            if (!isKey(c) && !isBlank(m[i])) { ev.changes.push(change('JOB', table, '', c, where, null, m[i], true)); }
        } else if (!sameValue(o![i], m[i])) {
            ev.changes.push(change('JOB', table, '', c, where, o![i], m[i], false));
        }
    });
    if (!ev.changes.length) {
        if (cols.every(isKey)) { ev.kind = 'nodetail'; ev.note = 'Saved (no field details recorded)'; }
        else { ev.kind = 'nochange'; ev.note = 'Saved, no values changed'; }
    }
    return ev;
}

/** Values of a created event grouped by section, in section order. */
export function groupValues(values: FieldValue[]): ValueGroup[] {
    const out: ValueGroup[] = [];
    SECTIONS.forEach(s => {
        const v = values.filter(x => x.section === s.id);
        if (v.length) { out.push({ section: s.id, label: s.label, values: v }); }
    });
    return out;
}

// ---- sessions --------------------------------------------------------------------------------------------------

export interface Session {
    id: string;
    userId: string;
    userName: string;
    who: string;
    start: number;
    end: number;
    whenText: string;         // dd-mm-yyyy hh:mm[ - hh:mm]
    whenFull: string;
    sources: HistSrc[];
    modes: string[];          // mode labels other than plain edits
    ips: string[];
    events: HistEvent[];
    changes: FieldChange[];   // merged per field, in section order
    items: HistEvent[];       // everything that is not a field change, in time order
}

function sortEvents(a: HistEvent, b: HistEvent): number {
    const so: { [s: string]: number } = { JOB: 0, TRACKING: 1, SHEET: 2 };
    return a.ms - b.ms || so[a.src] - so[b.src] || cmpId(a.id, b.id);
}

function cmpId(a: string, b: string): number {
    const x = Number(a.split(':')[1]), y = Number(b.split(':')[1]);
    return isNaN(x) || isNaN(y) ? (a < b ? -1 : a > b ? 1 : 0) : x - y;
}

/** Same user, less than `gapMs` after that user's previous event: one session. Oldest first. */
export function groupSessions(events: HistEvent[], gapMs: number = SESSION_GAP_MS): Session[] {
    const sorted = events.slice().sort(sortEvents);
    const sessions: Session[] = [];
    const open: { [user: string]: Session } = {};
    for (const e of sorted) {
        const u = e.userId || '(none)';
        let s = open[u];
        if (!s || e.ms - s.end > gapMs) {
            s = {
                id: e.id, userId: e.userId, userName: e.userName, who: userLabel(e.userId, e.userName), start: e.ms, end: e.ms,
                whenText: '', whenFull: '', sources: [], modes: [], ips: [], events: [], changes: [], items: []
            };
            sessions.push(s);
            open[u] = s;
        }
        s.events.push(e);
        s.end = e.ms;
        if (!s.userName && e.userName) { s.userName = e.userName; s.who = userLabel(s.userId, e.userName); }
    }
    sessions.forEach(finishSession);
    return sessions;
}

function finishSession(s: Session): void {
    const first = s.events[0], last = s.events[s.events.length - 1];
    s.whenText = first.atText + (last.atText && last.atText !== first.atText ? ' – ' + last.atText.slice(last.atText.slice(0, 10) === first.atText.slice(0, 10) ? 11 : 0) : '');
    s.whenFull = first.atFull + (last.atFull !== first.atFull ? ' – ' + last.atFull : '');
    const merged: { [k: string]: FieldChange } = {};
    const order: string[] = [];
    for (const e of s.events) {
        if (s.sources.indexOf(e.src) < 0) { s.sources.push(e.src); }
        // 'EXPORT SHEET VIEW' is the Sheet view mirror's marker, shown on its tracking rows ("via Sheet view"), not an address
        if (e.ip && e.ip.toUpperCase() !== 'EXPORT SHEET VIEW' && s.ips.indexOf(e.ip) < 0) { s.ips.push(e.ip); }
        const ml = e.modeLabel;
        if (ml && ml !== 'Edit' && s.modes.indexOf(ml) < 0) { s.modes.push(ml); }
        if (e.kind !== 'changes') {
            // repeated saves without changes (a screen saving several times) read as one line "... ×n"
            const same = e.kind === 'nodetail' || e.kind === 'nochange'
                ? s.items.find(x => x.kind === e.kind && x.note === e.note && x.table === e.table) : undefined;
            if (same) { same.repeat++; } else { s.items.push({ ...e, repeat: 1 }); }
            continue;
        }
        for (const c of e.changes) {
            const had = merged[c.key];
            if (!had) { merged[c.key] = { ...c }; order.push(c.key); continue; }
            had.after = c.after;
            had.times++;
            had.back = !had.beforeUnknown && sameValue(had.before, had.after);
        }
    }
    s.changes = order.map(k => merged[k])
        .map((c, i) => ({ c, i }))
        .sort((a, b) => SECTION_ORDER[a.c.section] - SECTION_ORDER[b.c.section] || a.i - b.i)
        .map(x => x.c);
}

// ---- the whole answer ------------------------------------------------------------------------------------------

export interface HistoryHeader {
    exptNo: string; cmpCode: string; cityCode: string; createdBy: string; createdByName: string; createdWho: string; docRecd: string;
}

export type HistoryState = 'ready' | 'empty' | 'denied' | 'notfound' | 'undeployed' | 'error';

export interface HistoryModel {
    state: HistoryState;
    text: string;
    header: HistoryHeader | null;
    created: HistEvent | null;
    createdGroups: ValueGroup[];
    sessions: Session[];                      // oldest first
    users: { id: string; label: string }[];
    sections: SectionDef[];                   // sections that have changes
    changeCount: number;
}

/** The procedure missing on the database (API deployed before the SQL) reads as "not deployed yet". */
function notDeployed(t: string): boolean {
    return /could not find stored procedure/i.test(t);
}

/** Builds the card's model from the API answer (a DataSet as JSON). A missing / odd answer is an error, not an exception. */
export function buildHistory(ds: any): HistoryModel {
    const empty = (state: HistoryState, t: string): HistoryModel =>
        ({ state, text: t, header: null, created: null, createdGroups: [], sessions: [], users: [], sections: [], changeCount: 0 });
    const head = ds && Array.isArray(ds.Table) && ds.Table.length ? ds.Table[0] : null;
    if (!head) { return empty('error', 'The server returned no answer.'); }
    const status = text(head.STATUS);
    const t = text(head.STATUSTEXT);
    if (status === '104') { return empty('denied', t || 'Only administrators can see job history.'); }
    if (status === '103') { return empty('notfound', t || 'This job was not found.'); }
    if (status !== '100') { return notDeployed(t) ? empty('undeployed', 'History is not deployed yet.') : empty('error', t || 'The history could not be loaded.'); }

    const header: HistoryHeader = {
        exptNo: text(head.EXPTNO), cmpCode: text(head.CMPCODE), cityCode: text(head.CITYCODE), createdBy: text(head.CREATED_BY),
        createdByName: text(head.CREATED_BY_NAME).replace(/\s+/g, ' '), createdWho: '', docRecd: text(head.DOCRECD)
    };
    header.createdWho = header.createdBy || header.createdByName ? userLabel(header.createdBy, header.createdByName) : '';
    const rows: any[] = Array.isArray(ds.Table1) ? ds.Table1 : [];
    // the job's numbers: the current one, then any a database fix replaced (its creation snapshot still names the old one)
    const jobNos = [header.exptNo];
    rows.forEach(r => {
        if (text(r.SRC).toUpperCase() !== 'JOB' || text(r.MODE).toUpperCase() !== 'DBFIX') { return; }
        const cols = splitColumns(r.COLUMNNAME), o = alignValues(cols, r.ORIGINALDATA);
        const ix = cols.findIndex(c => c.toUpperCase() === 'EXPTNO');
        if (o && ix >= 0 && text(o[ix]) && jobNos.indexOf(text(o[ix])) < 0) { jobNos.push(text(o[ix])); }
    });
    const events = rows.map(r => toEvent(r, jobNos)).filter(e => !!e) as HistEvent[];
    events.sort(sortEvents);

    // the job's creation snapshot: the first ADD / AUTOJOB of the job table
    const created = events.find(e => e.kind === 'created' && e.src === 'JOB' && (e.table === 'EXPT_MASTER' || e.table === '')) || null;
    const rest = events.filter(e => e !== created);
    const sessions = groupSessions(rest);
    const users: { id: string; label: string }[] = [];
    sessions.forEach(s => { if (!users.some(u => u.id === s.userId)) { users.push({ id: s.userId, label: s.who }); } });
    users.sort((a, b) => a.label.localeCompare(b.label));
    const used: { [id: string]: boolean } = {};
    let changeCount = 0;
    sessions.forEach(s => s.changes.forEach(c => { used[c.section] = true; changeCount++; }));

    const model: HistoryModel = {
        state: events.length ? 'ready' : 'empty', text: events.length ? '' : 'No history recorded for this job.', header, created,
        createdGroups: created ? groupValues(created.values) : [], sessions, users, sections: SECTIONS.filter(s => used[s.id]), changeCount
    };
    return model;
}

// ---- filters ---------------------------------------------------------------------------------------------------

export interface HistFilter {
    section: string;          // '' = all
    user: string;             // '' = all, else a USER_ID
    q: string;                // text search
    hideBare: boolean;        // hide saves without field details / without changes
    newestFirst: boolean;
}

export type SessionRow =
    | { kind: 'section'; label: string }
    | { kind: 'change'; c: FieldChange }
    | { kind: 'item'; e: HistEvent };

export interface SessionView { s: Session; rows: SessionRow[]; changes: number; }

export function defaultFilter(): HistFilter { return { section: '', user: '', q: '', hideBare: false, newestFirst: true }; }

function changeHay(c: FieldChange): string { return [c.label, c.column, c.where, c.before, c.after, sectionLabel(c.section)].join(' ').toLowerCase(); }

function itemHay(e: HistEvent): string {
    return [e.note, e.modeLabel, tableLabel(e.table), e.raw ? e.raw.columns + ' ' + e.raw.before + ' ' + e.raw.after : '',
        e.values.map(v => v.label + ' ' + v.value).join(' ')].join(' ').toLowerCase();
}

/** The sessions the card shows for a filter: matching field rows (with section headings) and matching other entries. */
export function filterSessions(sessions: Session[], f: HistFilter): SessionView[] {
    const q = text(f.q).toLowerCase();
    const out: SessionView[] = [];
    for (const s of sessions) {
        if (f.user && s.userId !== f.user) { continue; }
        const whoHit = !!q && (s.who + ' ' + s.ips.join(' ') + ' ' + s.sources.map(x => SOURCE_LABELS[x]).join(' ')).toLowerCase().indexOf(q) >= 0;
        const changes = s.changes.filter(c => (!f.section || c.section === f.section) && (!q || whoHit || changeHay(c).indexOf(q) >= 0));
        const items = f.section ? [] : s.items.filter(e =>
            !(f.hideBare && (e.kind === 'nodetail' || e.kind === 'nochange')) && (!q || whoHit || itemHay(e).indexOf(q) >= 0));
        if (!changes.length && !items.length) { continue; }
        const rows: SessionRow[] = [];
        let sec = '';
        for (const c of changes) {
            if (c.section !== sec) { sec = c.section; rows.push({ kind: 'section', label: sectionLabel(sec) }); }
            rows.push({ kind: 'change', c });
        }
        items.forEach(e => rows.push({ kind: 'item', e }));
        out.push({ s, rows, changes: changes.length });
    }
    return f.newestFirst ? out.reverse() : out;
}
