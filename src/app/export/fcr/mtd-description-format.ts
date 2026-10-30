/**
 * Description of goods: auto-format for the printed B/L / MTD description column.
 *
 * Text pasted from an invoice, e-mail or Excel arrives with tabs, runs of spaces, indented lines,
 * stacks of blank lines and lines far wider than the printed column. formatDescription() tidies it:
 *   1. tabs and runs of spaces become one space;
 *   2. every line is trimmed, so it starts at the left edge;
 *   3. at most one blank line in a row (none at the start or the end);
 *   4. lines longer than the column (46 characters) wrap at word boundaries; a token is never split,
 *      and a single token longer than the column stays whole on its own line;
 *   5. short lines and the line breaks the user typed are kept;
 *   6. optionally UPPERCASE.
 * Pure functions, no Angular: used by the description field (paste / Auto-format button / fit meter)
 * and by the MTD print sheet, which prints the description wrapped exactly as the meter counts it.
 */

/** characters per line of the printed description column (the MTD sheet's column is sized to fit this) */
export const DESC_COLUMN_CHARS = 46;
/** lines of the description column that fit on the printed MTD */
export const DESC_FIT_LINES = 24;

export interface DescFormatOptions {
    /** characters per printed line, default DESC_COLUMN_CHARS */
    width?: number;
    /** convert to capitals, default false */
    uppercase?: boolean;
}

/** tabs, no-break and the other horizontal spaces (not newlines) */
const SPACE_RUN = /[ \t\f\v   -   　]+/g;
/** zero-width characters Office / browsers leave in copied text */
const ZERO_WIDTH = /[​‌‍⁠﻿]/g;

/** CRLF / CR to LF; null and undefined to '' */
export function normaliseNewlines(text: any): string {
    return (text === null || text === undefined || text === false ? '' : String(text)).replace(/\r\n?/g, '\n');
}

/**
 * One line wrapped at word boundaries to at most `width` characters per piece. Words are separated by
 * whitespace; a word longer than `width` is never split and sits alone on its line. A line that already
 * fits comes back unchanged (spacing kept); a wrapped line comes back single-spaced.
 */
export function wrapLine(line: string, width: number = DESC_COLUMN_CHARS): string[] {
    const src = line === null || line === undefined ? '' : String(line);
    if (src.length <= width) {
        return [src];
    }
    const words = src.split(/\s+/).filter(w => w !== '');
    const out: string[] = [];
    let cur = '';
    for (const w of words) {
        if (cur === '') {
            cur = w;
        } else if (cur.length + 1 + w.length <= width) {
            cur += ' ' + w;
        } else {
            out.push(cur);
            cur = w;
        }
    }
    if (cur !== '') {
        out.push(cur);
    }
    return out.length ? out : [''];
}

/** the auto-format described at the top of this file */
export function formatDescription(text: any, opts: DescFormatOptions = {}): string {
    const width = opts.width && opts.width > 0 ? opts.width : DESC_COLUMN_CHARS;
    let src = normaliseNewlines(text).replace(ZERO_WIDTH, '');
    if (opts.uppercase) {
        src = src.toUpperCase();
    }
    const out: string[] = [];
    for (const raw of src.split('\n')) {
        const line = raw.replace(SPACE_RUN, ' ').trim();
        if (line === '') {
            // at most one blank line in a row, and none before the first text line
            if (out.length && out[out.length - 1] !== '') {
                out.push('');
            }
            continue;
        }
        out.push(...wrapLine(line, width));
    }
    while (out.length && out[out.length - 1] === '') {
        out.pop();
    }
    return out.join('\n');
}

/**
 * The lines the description prints as: the text as typed, with only the lines wider than the column
 * re-wrapped at word boundaries (nothing else is tidied). Trailing blank lines do not print and are
 * dropped. Empty text prints no lines.
 */
export function printLines(text: any, width: number = DESC_COLUMN_CHARS): string[] {
    const src = normaliseNewlines(text);
    if (src.trim() === '') {
        return [];
    }
    const lines: string[] = [];
    for (const line of src.split('\n')) {
        if (line.length > width) {
            lines.push(...wrapLine(line, width));
        } else {
            lines.push(line);
        }
    }
    while (lines.length && lines[lines.length - 1].trim() === '') {
        lines.pop();
    }
    return lines;
}

/** number of printed lines (the fit meter's "N of 24 lines") */
export function countPrintedLines(text: any, width: number = DESC_COLUMN_CHARS): number {
    return printLines(text, width).length;
}

/**
 * Splits the description after `keepLines` printed lines: `keep` is what fits on the MTD, `rest` the
 * lines past it (blank lines at the cut are dropped from both sides). When everything fits, `rest` is ''
 * and `keep` is the text unchanged.
 */
export function splitAtPrintedLine(text: any, keepLines: number = DESC_FIT_LINES,
                                   width: number = DESC_COLUMN_CHARS): { keep: string; rest: string } {
    const lines = printLines(text, width);
    if (lines.length <= keepLines) {
        return { keep: normaliseNewlines(text), rest: '' };
    }
    const head = lines.slice(0, keepLines);
    const tail = lines.slice(keepLines);
    while (head.length && head[head.length - 1].trim() === '') {
        head.pop();
    }
    while (tail.length && tail[0].trim() === '') {
        tail.shift();
    }
    return { keep: head.join('\n'), rest: tail.join('\n') };
}
