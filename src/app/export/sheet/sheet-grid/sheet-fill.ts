/*  Fill handle / Ctrl+D series (Google Sheets behaviour, kept conservative for an ops sheet):
    - dates: one date continues day by day; two or more dates continue their constant step
      (days, or months when every date sits on the same day of the month)
    - numbers: two or more numbers with a constant step continue it; one number is copied
    - anything else (text, notes, mixed, blanks) repeats the source pattern               */

import { SheetCellKind } from './sheet-grid.types';
import { addMonths, dayNumber, dayNumberToText, formatParts, parseDateText, DateParts } from './sheet-date';

export function parseNumber(v: string | null | undefined): number | null {
    if (v === null || v === undefined) {
        return null;
    }
    const s = String(v).trim().replace(/,/g, '');
    if (!s || !/^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(s)) {
        return null;
    }
    const n = parseFloat(s);
    return isFinite(n) ? n : null;
}

function decimals(v: string): number {
    const s = String(v).trim().replace(/,/g, '');
    const i = s.indexOf('.');
    return i < 0 ? 0 : s.length - i - 1;
}

function repeat(source: string[], count: number): string[] {
    const out: string[] = [];
    for (let i = 0; i < count; i++) {
        out.push(source.length ? source[i % source.length] : '');
    }
    return out;
}

function dateSeries(source: string[], count: number): string[] | null {
    const parts: DateParts[] = [];
    for (const v of source) {
        const p = parseDateText(v);
        if (!p) {
            return null;
        }
        parts.push(p);
    }
    if (!parts.length) {
        return null;
    }
    const out: string[] = [];
    if (parts.length === 1) {
        const d0 = dayNumber(source[0])!;
        for (let i = 1; i <= count; i++) {
            out.push(dayNumberToText(d0 + i));
        }
        return out;
    }
    // month series: same day of month, constant month step
    const sameDay = parts.every(p => p.d === parts[0].d);
    if (sameDay) {
        const idx = parts.map(p => p.y * 12 + p.m);
        const step = idx[1] - idx[0];
        if (step !== 0 && idx.every((v, i) => i === 0 || v - idx[i - 1] === step)) {
            const last = parts[parts.length - 1];
            for (let i = 1; i <= count; i++) {
                out.push(formatParts(addMonths(last, step * i)));
            }
            return out;
        }
    }
    const days = source.map(v => dayNumber(v)!);
    const step = days[1] - days[0];
    if (days.every((v, i) => i === 0 || v - days[i - 1] === step)) {
        const last = days[days.length - 1];
        for (let i = 1; i <= count; i++) {
            out.push(dayNumberToText(last + step * i));
        }
        return out;
    }
    return null;
}

function numberSeries(source: string[], count: number): string[] | null {
    if (source.length < 2) {
        return null;
    }
    const nums: number[] = [];
    for (const v of source) {
        const n = parseNumber(v);
        if (n === null) {
            return null;
        }
        nums.push(n);
    }
    const step = nums[1] - nums[0];
    const eps = 1e-9;
    if (!nums.every((v, i) => i === 0 || Math.abs(v - nums[i - 1] - step) < eps)) {
        return null;
    }
    const dec = Math.max(...source.map(decimals));
    const last = nums[nums.length - 1];
    const out: string[] = [];
    for (let i = 1; i <= count; i++) {
        const v = last + step * i;
        const s = dec ? v.toFixed(dec) : String(Math.round(v));
        out.push(/^-0(\.0+)?$/.test(s) ? s.slice(1) : s); // a tiny float error must not print "-0.0"
    }
    return out;
}

/**
 * Values for `count` new cells continuing `source` (in fill direction: for an upward / leftward
 * fill pass the source reversed and apply the result in that direction).
 * kind: the column kind; date series are only continued in date columns, number series in
 * number columns or when every source value is a number.
 */
export function fillSeries(source: string[], count: number, kind: SheetCellKind | undefined): string[] {
    if (count <= 0) {
        return [];
    }
    const src = source.map(v => (v === null || v === undefined ? '' : String(v)));
    if (src.length && src.every(v => v.trim() !== '')) {
        if (kind === 'date' || (kind !== 'num' && src.every(v => /^\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}$/.test(v.trim())))) {
            const d = dateSeries(src, count);
            if (d) {
                return d;
            }
        }
        if (kind !== 'date') {
            const n = numberSeries(src, count);
            if (n) {
                return n;
            }
        }
    }
    return repeat(src, count);
}
