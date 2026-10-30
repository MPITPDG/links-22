import {
    countPrintedLines, DESC_COLUMN_CHARS, DESC_FIT_LINES, formatDescription, normaliseNewlines, printLines,
    splitAtPrintedLine, wrapLine
} from './mtd-description-format';

describe('mtd-description-format', () => {

    it('prints a 46-character column, 24 lines deep', () => {
        expect(DESC_COLUMN_CHARS).toBe(46);
        expect(DESC_FIT_LINES).toBe(24);
    });

    describe('normaliseNewlines', () => {
        it('turns CRLF and CR into LF and null into empty', () => {
            expect(normaliseNewlines('A\r\nB\rC\nD')).toBe('A\nB\nC\nD');
            expect(normaliseNewlines(null)).toBe('');
            expect(normaliseNewlines(undefined)).toBe('');
        });
    });

    describe('wrapLine', () => {
        it('leaves a line that fits untouched, spacing included', () => {
            expect(wrapLine('A  B', 46)).toEqual(['A  B']);
            expect(wrapLine('x'.repeat(46), 46)).toEqual(['x'.repeat(46)]);
        });

        it('wraps at word boundaries without passing the width', () => {
            const out = wrapLine('264 UNITS OF CT 100 ES, NEW MOTORCYCLE FRAMES FOR LOCAL ASSEMBLY OF MOTORCYCLES', 46);
            expect(out).toEqual(['264 UNITS OF CT 100 ES, NEW MOTORCYCLE FRAMES', 'FOR LOCAL ASSEMBLY OF MOTORCYCLES']);
            out.forEach(l => expect(l.length).toBeLessThanOrEqual(46));
        });

        it('never splits a token; a token wider than the column sits alone, whole', () => {
            const long = 'NO.' + '1234567890'.repeat(5);
            expect(wrapLine('LICENCE ' + long + ' VALID', 46)).toEqual(['LICENCE', long, 'VALID']);
        });
    });

    describe('formatDescription', () => {
        it('turns tabs and runs of spaces into one space and trims every line', () => {
            expect(formatDescription('  A\t\tB   C  \n\t  D')).toBe('A B C\nD');
        });

        it('treats no-break and other wide spaces as spaces and drops zero-width characters', () => {
            expect(formatDescription('A  B C​D﻿')).toBe('A B CD');
        });

        it('keeps at most one blank line in a row and none at the start or the end', () => {
            expect(formatDescription('\n\n  \nA\n\n\n\nB\n \t \nC\n\n\n')).toBe('A\n\nB\n\nC');
        });

        it('keeps short lines and the user\'s own line breaks', () => {
            const src = 'CONTAINER NO:\nTGHU0815770\n\nLINE SEAL NO:\nIN1561796';
            expect(formatDescription(src)).toBe(src);
        });

        it('wraps lines longer than 46 characters at word boundaries', () => {
            const out = formatDescription('FOB NHAVA SHEVA SEA PORT IN INDIA INCOTERM 2020 THE HS CODE NO 8714.10.10 AND IMPORT LICENCE');
            expect(out).toBe('FOB NHAVA SHEVA SEA PORT IN INDIA INCOTERM\n2020 THE HS CODE NO 8714.10.10 AND IMPORT\nLICENCE');
            out.split('\n').forEach(l => expect(l.length).toBeLessThanOrEqual(46));
            expect(out.split('\n').join(' ')).toBe('FOB NHAVA SHEVA SEA PORT IN INDIA INCOTERM 2020 THE HS CODE NO 8714.10.10 AND IMPORT LICENCE');
        });

        it('collapses spaces before measuring, so a tab-joined line of exactly 46 stays one line', () => {
            expect(formatDescription('1X40\'HC FCL CONTAINER STC\tTOTAL 132 CASES ONLY'))
                .toBe('1X40\'HC FCL CONTAINER STC TOTAL 132 CASES ONLY');
        });

        it('keeps a token longer than the column whole on its own line', () => {
            const token = 'PIPLP-212402526-1/LOR1372025040063/IM-I-02-2350-2025';
            expect(token.length).toBeGreaterThan(46);
            expect(formatDescription('AS PER INVOICE ' + token + ' DATED 09-04-2025'))
                .toBe('AS PER INVOICE\n' + token + '\nDATED 09-04-2025');
        });

        it('converts to UPPERCASE only when asked', () => {
            expect(formatDescription('264 Units of Frames')).toBe('264 Units of Frames');
            expect(formatDescription('264 Units of Frames', { uppercase: true })).toBe('264 UNITS OF FRAMES');
        });

        it('handles CRLF text, null and blank input', () => {
            expect(formatDescription('A \r\n\r\n\r\n B')).toBe('A\n\nB');
            expect(formatDescription(null)).toBe('');
            expect(formatDescription(' \t \n\n ')).toBe('');
        });

        it('honours a custom width', () => {
            expect(formatDescription('AAA BBB CCC', { width: 7 })).toBe('AAA BBB\nCCC');
        });

        it('tidies a typical invoice paste to the printed column', () => {
            const raw = '1X40\'HC FCL CONTAINER STC\n(TOTAL ONE HUNDRED THIRTY TWO CASES ONLY)\n\n\n\n'
                + '         264 Units of CT 100 ES, New Motorcycle Frames for local assembly of motorcycles   '
                + 'As per Proforma Invoice No PI-2124-0526-1 Dated 09-04-2025\n'
                + '\t\tFOB Nhava Sheva Sea Port in India  Incoterm 2020\n\n'
                + '(Under DUTY DRAW BACK Scheme)\n           S.B NO: 3445266 DT: 10-07-2025\n\n\nFREIGHT COLLECT';
            const out = formatDescription(raw, { uppercase: true });
            expect(out).toBe([
                '1X40\'HC FCL CONTAINER STC',
                '(TOTAL ONE HUNDRED THIRTY TWO CASES ONLY)',
                '',
                '264 UNITS OF CT 100 ES, NEW MOTORCYCLE FRAMES',
                'FOR LOCAL ASSEMBLY OF MOTORCYCLES AS PER',
                'PROFORMA INVOICE NO PI-2124-0526-1 DATED',
                '09-04-2025',
                'FOB NHAVA SHEVA SEA PORT IN INDIA INCOTERM',
                '2020',
                '',
                '(UNDER DUTY DRAW BACK SCHEME)',
                'S.B NO: 3445266 DT: 10-07-2025',
                '',
                'FREIGHT COLLECT'
            ].join('\n'));
            out.split('\n').forEach(l => expect(l.length).toBeLessThanOrEqual(46));
        });

        it('is idempotent', () => {
            const once = formatDescription('  a  b \n\n\n c\t' + ' word'.repeat(30), { uppercase: true });
            expect(formatDescription(once, { uppercase: true })).toBe(once);
        });
    });

    describe('printLines / countPrintedLines', () => {
        it('counts nothing for empty text and ignores trailing blank lines', () => {
            expect(countPrintedLines('')).toBe(0);
            expect(countPrintedLines(null)).toBe(0);
            expect(countPrintedLines('A\nB\n\n\n')).toBe(2);
        });

        it('keeps short lines as typed and re-wraps only the wide ones', () => {
            const text = '  INDENTED\n\n' + 'WORD '.repeat(20).trim();
            const lines = printLines(text);
            expect(lines[0]).toBe('  INDENTED');
            expect(lines[1]).toBe('');
            expect(lines.length).toBe(2 + 3);
            lines.forEach(l => expect(l.length).toBeLessThanOrEqual(46));
        });
    });

    describe('splitAtPrintedLine', () => {
        const numbered = (n: number) => Array.from({ length: n }, (_, i) => 'LINE ' + (i + 1)).join('\n');

        it('returns the text unchanged with no rest when it fits', () => {
            expect(splitAtPrintedLine(numbered(24))).toEqual({ keep: numbered(24), rest: '' });
        });

        it('keeps the first 24 printed lines and moves the rest', () => {
            const r = splitAtPrintedLine(numbered(30));
            expect(r.keep).toBe(numbered(24));
            expect(r.rest).toBe('LINE 25\nLINE 26\nLINE 27\nLINE 28\nLINE 29\nLINE 30');
        });

        it('drops blank lines at the cut', () => {
            const r = splitAtPrintedLine('A\nB\n\nC\nD', 2);
            expect(r).toEqual({ keep: 'A\nB', rest: 'C\nD' });
            const r2 = splitAtPrintedLine('A\n\nB\nC', 2);
            expect(r2).toEqual({ keep: 'A', rest: 'B\nC' });
        });

        it('cuts wrapped lines where they print', () => {
            const r = splitAtPrintedLine('WORD '.repeat(20).trim(), 1);
            expect(r.keep.length).toBeLessThanOrEqual(46);
            expect((r.keep + ' ' + r.rest.replace(/\n/g, ' '))).toBe('WORD '.repeat(20).trim());
        });
    });
});
