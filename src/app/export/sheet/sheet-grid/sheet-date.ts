/*  Date-or-note cells (SHEET_VIEW_SPEC.md 1, "Date cells").
    Anything that parses as a real date is stored as dd-mm-yyyy; ranges (26-08/27-08),
    partial dates (26-08) and notes ("Will be updated") stay exactly as typed and are
    flagged in the grid. Excel serial numbers are only turned into dates on paste.   */

export interface DateParts {
    d: number;
    m: number;
    y: number;
}

export interface DateOrNote {
    /** the value to store */
    value: string;
    /** true when value is a canonical dd-mm-yyyy date */
    isDate: boolean;
}

const MONTHS: { [k: string]: number } = {
    jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12,
    january: 1, february: 2, march: 3, april: 4, june: 6, july: 7, august: 8, september: 9,
    october: 10, november: 11, december: 12
};

/** Excel day 0 = 1899-12-30 (keeps Excel's 1900 leap-year bug for serials > 60). */
const EXCEL_EPOCH_UTC = Date.UTC(1899, 11, 30);
const DAY_MS = 86400000;
/** 01-01-1970 .. 31-12-2100: a plain number outside this window is never taken for a date */
export const EXCEL_SERIAL_MIN = 25569;
export const EXCEL_SERIAL_MAX = 73415;

export function daysInMonth(y: number, m: number): number {
    return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

export function isValidParts(p: DateParts | null): boolean {
    return !!p && p.y >= 1900 && p.y <= 2199 && p.m >= 1 && p.m <= 12 && p.d >= 1 && p.d <= daysInMonth(p.y, p.m);
}

function pad2(n: number): string {
    return n < 10 ? '0' + n : String(n);
}

export function formatParts(p: DateParts): string {
    return pad2(p.d) + '-' + pad2(p.m) + '-' + p.y;
}

function year2(y: string): number {
    const n = parseInt(y, 10);
    return y.length === 2 ? (n < 70 ? 2000 + n : 1900 + n) : n;
}

/** Parses a typed / pasted text as a date. Returns null for ranges, partial dates and notes. */
export function parseDateText(raw: string | null | undefined): DateParts | null {
    if (raw === null || raw === undefined) {
        return null;
    }
    const s = String(raw).trim();
    if (!s) {
        return null;
    }
    let m: RegExpMatchArray | null;
    let p: DateParts | null = null;
    // dd-mm-yyyy, dd/mm/yyyy, dd.mm.yyyy (1-2 digit day / month, 2 or 4 digit year)
    if ((m = s.match(/^(\d{1,2})([-/.])(\d{1,2})\2(\d{4}|\d{2})$/))) {
        p = { d: +m[1], m: +m[3], y: year2(m[4]) };
    } else if ((m = s.match(/^(\d{4})([-/.])(\d{1,2})\2(\d{1,2})(?:[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?)?$/))) {
        // yyyy-mm-dd, yyyy/mm/dd, ISO date-time from an API
        p = { d: +m[4], m: +m[3], y: +m[1] };
    } else if ((m = s.match(/^(\d{1,2})[-/. ]([A-Za-z]{3,9})\.?[-/. ,]+(\d{4}|\d{2})$/))) {
        // 14-Oct-2026, 14 Oct 26, 14 October 2026
        const mo = MONTHS[m[2].toLowerCase()];
        p = mo ? { d: +m[1], m: mo, y: year2(m[3]) } : null;
    } else if ((m = s.match(/^([A-Za-z]{3,9})\.? (\d{1,2}),? (\d{4})$/))) {
        // Oct 14, 2026
        const mo = MONTHS[m[1].toLowerCase()];
        p = mo ? { d: +m[2], m: mo, y: +m[3] } : null;
    }
    return isValidParts(p) ? p : null;
}

/** Excel serial (1-based days since 1899-12-30, fraction = time of day) -> date parts. */
export function excelSerialToParts(serial: number): DateParts | null {
    if (!isFinite(serial)) {
        return null;
    }
    const d = new Date(EXCEL_EPOCH_UTC + Math.floor(serial) * DAY_MS);
    return { d: d.getUTCDate(), m: d.getUTCMonth() + 1, y: d.getUTCFullYear() };
}

export function partsToExcelSerial(p: DateParts): number {
    return Math.round((Date.UTC(p.y, p.m - 1, p.d) - EXCEL_EPOCH_UTC) / DAY_MS);
}

/**
 * Normalises a value for a date-or-note column.
 * opts.paste: also accept an Excel serial number (25569..73415, i.e. 01-01-1970..31-12-2100).
 */
export function normaliseDateOrNote(raw: string | null | undefined, opts?: { paste?: boolean }): DateOrNote {
    const s = raw === null || raw === undefined ? '' : String(raw);
    const t = s.trim();
    if (!t) {
        return { value: '', isDate: false };
    }
    const p = parseDateText(t);
    if (p) {
        return { value: formatParts(p), isDate: true };
    }
    if (opts && opts.paste && /^\d{5}(\.\d+)?$/.test(t)) {
        const n = parseFloat(t);
        if (n >= EXCEL_SERIAL_MIN && n <= EXCEL_SERIAL_MAX) {
            const q = excelSerialToParts(n);
            if (q && isValidParts(q)) {
                return { value: formatParts(q), isDate: true };
            }
        }
    }
    // a note, a range or a partial date: kept exactly as typed (only outer whitespace trimmed)
    return { value: t, isDate: false };
}

/** True when the stored value is a canonical dd-mm-yyyy date. */
export function isCanonicalDate(v: string | null | undefined): boolean {
    if (!v || v.length !== 10 || !/^\d{2}-\d{2}-\d{4}$/.test(v)) {
        return false;
    }
    return isValidParts({ d: +v.slice(0, 2), m: +v.slice(3, 5), y: +v.slice(6) });
}

/** Sort key yyyymmdd for anything that parses as a date, else null. */
export function dateKey(v: string | null | undefined): number | null {
    const p = isCanonicalDate(v) ? { d: +v!.slice(0, 2), m: +v!.slice(3, 5), y: +v!.slice(6) } : parseDateText(v);
    return p ? p.y * 10000 + p.m * 100 + p.d : null;
}

/** Day number (days since 1970-01-01) of a date value, else null. */
export function dayNumber(v: string | null | undefined): number | null {
    const p = parseDateText(v);
    return p ? Math.round(Date.UTC(p.y, p.m - 1, p.d) / DAY_MS) : null;
}

export function dayNumberToText(n: number): string {
    const d = new Date(n * DAY_MS);
    return formatParts({ d: d.getUTCDate(), m: d.getUTCMonth() + 1, y: d.getUTCFullYear() });
}

export function todayText(now?: Date): string {
    const d = now || new Date();
    return formatParts({ d: d.getDate(), m: d.getMonth() + 1, y: d.getFullYear() });
}

/** Adds months keeping the day (clamped to the month's length). */
export function addMonths(p: DateParts, n: number): DateParts {
    const idx = p.y * 12 + (p.m - 1) + n;
    const y = Math.floor(idx / 12);
    const m = idx - y * 12 + 1;
    return { d: Math.min(p.d, daysInMonth(y, m)), m, y };
}
