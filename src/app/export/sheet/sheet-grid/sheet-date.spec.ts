import {
    addMonths, dateKey, dayNumber, dayNumberToText, daysInMonth, excelSerialToParts, EXCEL_SERIAL_MAX,
    EXCEL_SERIAL_MIN, formatParts, isCanonicalDate, isValidParts, normaliseDateOrNote, parseDateText,
    partsToExcelSerial, todayText
} from './sheet-date';

describe('sheet-date', () => {

    describe('daysInMonth', () => {
        it('knows the month lengths', () => {
            expect(daysInMonth(2026, 1)).toBe(31);
            expect(daysInMonth(2026, 4)).toBe(30);
            expect(daysInMonth(2026, 12)).toBe(31);
        });

        it('knows leap Februaries (2028 yes, 2027 no, 2100 no, 2000 yes)', () => {
            expect(daysInMonth(2028, 2)).toBe(29);
            expect(daysInMonth(2027, 2)).toBe(28);
            expect(daysInMonth(2100, 2)).toBe(28);
            expect(daysInMonth(2000, 2)).toBe(29);
        });
    });

    describe('isValidParts / formatParts', () => {
        it('rejects null and impossible parts', () => {
            expect(isValidParts(null)).toBe(false);
            expect(isValidParts({ d: 0, m: 1, y: 2026 })).toBe(false);
            expect(isValidParts({ d: 1, m: 0, y: 2026 })).toBe(false);
            expect(isValidParts({ d: 1, m: 13, y: 2026 })).toBe(false);
            expect(isValidParts({ d: 31, m: 4, y: 2026 })).toBe(false);
            expect(isValidParts({ d: 29, m: 2, y: 2027 })).toBe(false);
        });

        it('accepts years 1900..2199 only', () => {
            expect(isValidParts({ d: 1, m: 1, y: 1900 })).toBe(true);
            expect(isValidParts({ d: 31, m: 12, y: 2199 })).toBe(true);
            expect(isValidParts({ d: 31, m: 12, y: 1899 })).toBe(false);
            expect(isValidParts({ d: 1, m: 1, y: 2200 })).toBe(false);
        });

        it('formats dd-mm-yyyy with zero padding', () => {
            expect(formatParts({ d: 5, m: 3, y: 2026 })).toBe('05-03-2026');
            expect(formatParts({ d: 14, m: 10, y: 2026 })).toBe('14-10-2026');
        });
    });

    describe('parseDateText', () => {
        const D = (d: number, m: number, y: number) => ({ d, m, y });

        const valid: [string, { d: number; m: number; y: number }][] = [
            // numeric day first
            ['14-10-2026', D(14, 10, 2026)],
            ['14/10/2026', D(14, 10, 2026)],
            ['14.10.2026', D(14, 10, 2026)],
            ['1-2-2026', D(1, 2, 2026)],
            ['01/02/2026', D(1, 2, 2026)],
            ['9.3.2026', D(9, 3, 2026)],
            // year first
            ['2026-10-14', D(14, 10, 2026)],
            ['2026/10/14', D(14, 10, 2026)],
            ['2026.10.14', D(14, 10, 2026)],
            ['2026-1-5', D(5, 1, 2026)],
            // ISO date-time from an API
            ['2026-10-14T10:30:00Z', D(14, 10, 2026)],
            ['2026-10-14T10:30:00.123+02:00', D(14, 10, 2026)],
            ['2026-10-14 10:30', D(14, 10, 2026)],
            // two-digit years: < 70 -> 20xx, otherwise 19xx
            ['14-10-26', D(14, 10, 2026)],
            ['14/10/26', D(14, 10, 2026)],
            ['14.10.26', D(14, 10, 2026)],
            ['1/2/03', D(1, 2, 2003)],
            ['14-10-69', D(14, 10, 2069)],
            ['14-10-70', D(14, 10, 1970)],
            ['1/2/99', D(1, 2, 1999)],
            // month names
            ['14-Oct-2026', D(14, 10, 2026)],
            ['14-oct-2026', D(14, 10, 2026)],
            ['14-OCT-2026', D(14, 10, 2026)],
            ['14 Oct 2026', D(14, 10, 2026)],
            ['14/Oct/2026', D(14, 10, 2026)],
            ['14-Oct-26', D(14, 10, 2026)],
            ['14 Oct 26', D(14, 10, 2026)],
            ['14 October 2026', D(14, 10, 2026)],
            ['14-October-2026', D(14, 10, 2026)],
            ['1-Jan-2026', D(1, 1, 2026)],
            ['14 Sep 2026', D(14, 9, 2026)],
            ['14 Sept 2026', D(14, 9, 2026)],
            ['14 September 2026', D(14, 9, 2026)],
            ['14 Oct. 2026', D(14, 10, 2026)],
            ['14 Oct, 2026', D(14, 10, 2026)],
            ['31-Dec-2026', D(31, 12, 2026)],
            ['Oct 14, 2026', D(14, 10, 2026)],
            ['Oct 14 2026', D(14, 10, 2026)],
            ['October 14, 2026', D(14, 10, 2026)],
            ['Oct. 14, 2026', D(14, 10, 2026)],
            // leap days
            ['29-02-2028', D(29, 2, 2028)],
            ['29/02/2000', D(29, 2, 2000)],
            ['29-Feb-2028', D(29, 2, 2028)],
            ['2028-02-29', D(29, 2, 2028)],
            ['29-02-28', D(29, 2, 2028)],
            // surrounding whitespace
            ['  14-10-2026  ', D(14, 10, 2026)],
            ['\t14/10/2026\n', D(14, 10, 2026)]
        ];
        for (const [text, parts] of valid) {
            it('parses ' + JSON.stringify(text), () => {
                expect(parseDateText(text)).toEqual(parts);
            });
        }

        const invalid: string[] = [
            '', '   ',
            // impossible dates
            '31-02-2026', '30-02-2026', '29-02-2027', '29-02-2100', '31-04-2026', '32-01-2026', '00-01-2026',
            '14-13-2026', '14-00-2026', '29-02-27', '2026-02-30', '31-Feb-2026', '31 Apr 2026',
            // out of the 1900..2199 window
            '01-01-1899', '01-01-2200',
            // ranges, partial dates and notes
            '26-08/27-08', '26-08', '26/08', '26.08', '26-08-2026/27-08-2026', 'Aug 2026', 'August',
            'Will be updated', 'TBC', 'n/a', '14', '2026', 'Mon 14 Oct 2026',
            // unsupported shapes
            '14-10/2026', '14 - 10 - 2026', '14-10-202', '14-10-20266', '1/2/3', '14102026',
            '14-Foo-2026', '14Oct2026', '14-10-2026 10:30', '10/14/2026'
        ];
        for (const text of invalid) {
            it('does not parse ' + JSON.stringify(text), () => {
                expect(parseDateText(text)).toBeNull();
            });
        }

        it('returns null for null and undefined', () => {
            expect(parseDateText(null)).toBeNull();
            expect(parseDateText(undefined)).toBeNull();
        });

        it('treats a 2-digit-year leap day by the resolved century', () => {
            expect(parseDateText('29-02-00')).toEqual({ d: 29, m: 2, y: 2000 });
            expect(parseDateText('29-02-27')).toBeNull();
        });
    });

    describe('normaliseDateOrNote', () => {
        const dates: [string, string][] = [
            ['14-10-2026', '14-10-2026'],
            ['14/10/2026', '14-10-2026'],
            ['14.10.2026', '14-10-2026'],
            ['2026-10-14', '14-10-2026'],
            ['2026/10/14', '14-10-2026'],
            ['14-Oct-2026', '14-10-2026'],
            ['14 October 2026', '14-10-2026'],
            ['Oct 14, 2026', '14-10-2026'],
            ['14-10-26', '14-10-2026'],
            ['14/10/26', '14-10-2026'],
            ['1/2/26', '01-02-2026'],
            ['1-2-2026', '01-02-2026'],
            ['5.3.2026', '05-03-2026'],
            ['2026-10-14T08:00:00Z', '14-10-2026'],
            ['29-02-2028', '29-02-2028'],
            ['29/02/28', '29-02-2028'],
            ['  14/10/2026  ', '14-10-2026']
        ];
        for (const [input, out] of dates) {
            it('normalises ' + JSON.stringify(input) + ' to ' + out, () => {
                expect(normaliseDateOrNote(input)).toEqual({ value: out, isDate: true });
            });
        }

        it('returns an empty non-date for empty, blank, null and undefined', () => {
            expect(normaliseDateOrNote('')).toEqual({ value: '', isDate: false });
            expect(normaliseDateOrNote('   ')).toEqual({ value: '', isDate: false });
            expect(normaliseDateOrNote('\t\n')).toEqual({ value: '', isDate: false });
            expect(normaliseDateOrNote(null)).toEqual({ value: '', isDate: false });
            expect(normaliseDateOrNote(undefined)).toEqual({ value: '', isDate: false });
        });

        describe('invalid dates stay as typed', () => {
            it('31-02-2026', () => {
                expect(normaliseDateOrNote('31-02-2026')).toEqual({ value: '31-02-2026', isDate: false });
            });

            it('32/01/2026 and 14-13-2026', () => {
                expect(normaliseDateOrNote('32/01/2026')).toEqual({ value: '32/01/2026', isDate: false });
                expect(normaliseDateOrNote('14-13-2026')).toEqual({ value: '14-13-2026', isDate: false });
            });

            it('31-Apr-2026', () => {
                expect(normaliseDateOrNote('31-Apr-2026')).toEqual({ value: '31-Apr-2026', isDate: false });
            });
        });

        describe('leap years', () => {
            it('accepts 29-02-2028', () => {
                expect(normaliseDateOrNote('29-02-2028')).toEqual({ value: '29-02-2028', isDate: true });
            });

            it('rejects 29-02-2027 and keeps it as typed', () => {
                expect(normaliseDateOrNote('29-02-2027')).toEqual({ value: '29-02-2027', isDate: false });
            });

            it('treats 2000 as a leap year and 2100 as not', () => {
                expect(normaliseDateOrNote('29-02-2000').isDate).toBe(true);
                expect(normaliseDateOrNote('29-02-2100').isDate).toBe(false);
            });

            it('accepts 28-02-2027 and 01-03-2027', () => {
                expect(normaliseDateOrNote('28/02/2027')).toEqual({ value: '28-02-2027', isDate: true });
                expect(normaliseDateOrNote('1/3/2027')).toEqual({ value: '01-03-2027', isDate: true });
            });
        });

        describe('ranges, partial dates and notes stay as typed (trimmed)', () => {
            it('keeps a range exactly', () => {
                expect(normaliseDateOrNote('26-08/27-08')).toEqual({ value: '26-08/27-08', isDate: false });
                expect(normaliseDateOrNote('26/08 - 27/08')).toEqual({ value: '26/08 - 27/08', isDate: false });
            });

            it('keeps a partial date exactly', () => {
                expect(normaliseDateOrNote('26-08')).toEqual({ value: '26-08', isDate: false });
                expect(normaliseDateOrNote('26/08')).toEqual({ value: '26/08', isDate: false });
            });

            it('keeps a note and trims its outer whitespace', () => {
                expect(normaliseDateOrNote('Will be updated')).toEqual({ value: 'Will be updated', isDate: false });
                expect(normaliseDateOrNote('  Will be updated \n')).toEqual({ value: 'Will be updated', isDate: false });
            });

            it('does not touch inner whitespace or case of a note', () => {
                expect(normaliseDateOrNote('  ETA   next  WEEK ')).toEqual({ value: 'ETA   next  WEEK', isDate: false });
            });

            it('keeps a date with trailing words as a note', () => {
                expect(normaliseDateOrNote('14-10-2026 approx')).toEqual({ value: '14-10-2026 approx', isDate: false });
            });

            it('is idempotent: a stored canonical date or note normalises to itself', () => {
                for (const v of ['14-10-2026', '26-08/27-08', 'Will be updated', '']) {
                    const once = normaliseDateOrNote(v);
                    expect(normaliseDateOrNote(once.value)).toEqual(once);
                }
            });
        });

        describe('Excel serial numbers', () => {
            it('converts 46309 (14-10-2026) only when pasting', () => {
                expect(normaliseDateOrNote('46309', { paste: true })).toEqual({ value: '14-10-2026', isDate: true });
            });

            it('keeps 46309 as a plain value when typed (no opts, paste false, empty opts)', () => {
                expect(normaliseDateOrNote('46309')).toEqual({ value: '46309', isDate: false });
                expect(normaliseDateOrNote('46309', { paste: false })).toEqual({ value: '46309', isDate: false });
                expect(normaliseDateOrNote('46309', {})).toEqual({ value: '46309', isDate: false });
            });

            it('ignores the time fraction of a serial', () => {
                expect(normaliseDateOrNote('46309.75', { paste: true })).toEqual({ value: '14-10-2026', isDate: true });
                expect(normaliseDateOrNote('46309.0', { paste: true })).toEqual({ value: '14-10-2026', isDate: true });
            });

            it('trims whitespace around a pasted serial', () => {
                expect(normaliseDateOrNote(' 46309 ', { paste: true })).toEqual({ value: '14-10-2026', isDate: true });
            });

            // NOTE: the source comment says the window ends 31-12-2099, but serial 73415 is 31-12-2100 (73050 is 31-12-2099).
            it('accepts the window edges 25569 (01-01-1970) and 73415 (31-12-2100, see note)', () => {
                expect(normaliseDateOrNote('25569', { paste: true })).toEqual({ value: '01-01-1970', isDate: true });
                expect(normaliseDateOrNote('73415', { paste: true })).toEqual({ value: '31-12-2100', isDate: true });
                expect(normaliseDateOrNote('73050', { paste: true })).toEqual({ value: '31-12-2099', isDate: true });
            });

            it('rejects numbers just outside the window', () => {
                expect(normaliseDateOrNote('25568', { paste: true })).toEqual({ value: '25568', isDate: false });
                expect(normaliseDateOrNote('73416', { paste: true })).toEqual({ value: '73416', isDate: false });
            });

            it('rejects other numbers: small quantities, 4 digits, 6 digits, negatives, decimals', () => {
                for (const v of ['12', '4630', '100000', '-46309', '46309,5', '4.6309', '0']) {
                    expect(normaliseDateOrNote(v, { paste: true })).toEqual({ value: v, isDate: false });
                }
            });

            it('rejects a serial with text around it', () => {
                expect(normaliseDateOrNote('46309 ETA', { paste: true })).toEqual({ value: '46309 ETA', isDate: false });
            });

            it('still prefers a real date text when pasting', () => {
                expect(normaliseDateOrNote('14/10/2026', { paste: true })).toEqual({ value: '14-10-2026', isDate: true });
            });

            it('keeps notes and ranges as typed when pasting', () => {
                expect(normaliseDateOrNote('26-08/27-08', { paste: true })).toEqual({ value: '26-08/27-08', isDate: false });
                expect(normaliseDateOrNote(' Will be updated ', { paste: true })).toEqual({ value: 'Will be updated', isDate: false });
            });

            it('exposes the documented window', () => {
                expect(EXCEL_SERIAL_MIN).toBe(25569);
                expect(EXCEL_SERIAL_MAX).toBe(73415);
            });
        });
    });

    describe('isCanonicalDate', () => {
        it('accepts a real dd-mm-yyyy date', () => {
            expect(isCanonicalDate('14-10-2026')).toBe(true);
            expect(isCanonicalDate('29-02-2028')).toBe(true);
            expect(isCanonicalDate('01-01-1900')).toBe(true);
        });

        it('rejects impossible dates', () => {
            expect(isCanonicalDate('31-02-2026')).toBe(false);
            expect(isCanonicalDate('29-02-2027')).toBe(false);
            expect(isCanonicalDate('00-01-2026')).toBe(false);
            expect(isCanonicalDate('14-13-2026')).toBe(false);
        });

        it('rejects anything not in exact dd-mm-yyyy shape', () => {
            expect(isCanonicalDate('4-10-2026')).toBe(false);
            expect(isCanonicalDate('14/10/2026')).toBe(false);
            expect(isCanonicalDate('14.10.2026')).toBe(false);
            expect(isCanonicalDate('2026-10-14')).toBe(false);
            expect(isCanonicalDate('14-10-26')).toBe(false);
            expect(isCanonicalDate(' 14-10-2026')).toBe(false);
            expect(isCanonicalDate('14-Oct-2026')).toBe(false);
            expect(isCanonicalDate('26-08/27-08')).toBe(false);
        });

        it('rejects empty, null and undefined', () => {
            expect(isCanonicalDate('')).toBe(false);
            expect(isCanonicalDate(null)).toBe(false);
            expect(isCanonicalDate(undefined)).toBe(false);
        });

        it('rejects years outside 1900..2199', () => {
            expect(isCanonicalDate('01-01-1899')).toBe(false);
            expect(isCanonicalDate('01-01-2200')).toBe(false);
        });
    });

    describe('dateKey', () => {
        it('gives yyyymmdd for a canonical date', () => {
            expect(dateKey('14-10-2026')).toBe(20261014);
            expect(dateKey('01-01-1900')).toBe(19000101);
        });

        it('gives the same key for any parseable spelling', () => {
            expect(dateKey('14/10/2026')).toBe(20261014);
            expect(dateKey('2026-10-14')).toBe(20261014);
            expect(dateKey('14-Oct-2026')).toBe(20261014);
            expect(dateKey('14-10-26')).toBe(20261014);
        });

        it('gives null for notes, ranges, partial dates, invalid dates and blanks', () => {
            expect(dateKey('Will be updated')).toBeNull();
            expect(dateKey('26-08/27-08')).toBeNull();
            expect(dateKey('26-08')).toBeNull();
            expect(dateKey('31-02-2026')).toBeNull();
            expect(dateKey('')).toBeNull();
            expect(dateKey(null)).toBeNull();
            expect(dateKey(undefined)).toBeNull();
        });

        it('orders chronologically across month, year and day-of-month (not as text)', () => {
            const texts = ['09-01-2027', '31-12-2026', '15-10-2026', '01-03-2026', '30-01-2026', '29-02-2028', '01-01-2028'];
            const sorted = texts.slice().sort((a, b) => dateKey(a)! - dateKey(b)!);
            expect(sorted).toEqual(['30-01-2026', '01-03-2026', '15-10-2026', '31-12-2026', '09-01-2027', '01-01-2028', '29-02-2028']);
            // plain text order would be wrong
            expect(texts.slice().sort()).not.toEqual(sorted);
        });

        it('orders consecutive days over month, year and leap-day boundaries', () => {
            const seq = ['30-04-2026', '01-05-2026', '31-12-2026', '01-01-2027', '28-02-2028', '29-02-2028', '01-03-2028'];
            for (let i = 1; i < seq.length; i++) {
                expect(dateKey(seq[i])!).toBeGreaterThan(dateKey(seq[i - 1])!);
            }
        });
    });

    describe('Excel serials', () => {
        it('excelSerialToParts maps 46309 to 14-10-2026', () => {
            expect(excelSerialToParts(46309)).toEqual({ d: 14, m: 10, y: 2026 });
        });

        it('excelSerialToParts ignores the time-of-day fraction', () => {
            expect(excelSerialToParts(46309.999)).toEqual({ d: 14, m: 10, y: 2026 });
            expect(excelSerialToParts(46309.5)).toEqual({ d: 14, m: 10, y: 2026 });
        });

        it('excelSerialToParts maps the unix epoch and the window end (see note on 2100)', () => {
            expect(excelSerialToParts(25569)).toEqual({ d: 1, m: 1, y: 1970 });
            expect(excelSerialToParts(73415)).toEqual({ d: 31, m: 12, y: 2100 });
            expect(excelSerialToParts(73050)).toEqual({ d: 31, m: 12, y: 2099 });
        });

        it('excelSerialToParts matches Excel from 01-03-1900 on (serial 61)', () => {
            expect(excelSerialToParts(61)).toEqual({ d: 1, m: 3, y: 1900 });
            expect(excelSerialToParts(44927)).toEqual({ d: 1, m: 1, y: 2023 });
        });

        it('excelSerialToParts handles 29-02-2028', () => {
            const s = partsToExcelSerial({ d: 29, m: 2, y: 2028 });
            expect(excelSerialToParts(s)).toEqual({ d: 29, m: 2, y: 2028 });
            expect(excelSerialToParts(s + 1)).toEqual({ d: 1, m: 3, y: 2028 });
        });

        it('excelSerialToParts returns null for NaN and infinities', () => {
            expect(excelSerialToParts(NaN)).toBeNull();
            expect(excelSerialToParts(Infinity)).toBeNull();
            expect(excelSerialToParts(-Infinity)).toBeNull();
        });

        it('partsToExcelSerial is the inverse', () => {
            expect(partsToExcelSerial({ d: 14, m: 10, y: 2026 })).toBe(46309);
            expect(partsToExcelSerial({ d: 1, m: 1, y: 1970 })).toBe(25569);
            expect(partsToExcelSerial({ d: 31, m: 12, y: 2099 })).toBe(73050);
            expect(partsToExcelSerial({ d: 31, m: 12, y: 2100 })).toBe(73415);
            expect(partsToExcelSerial({ d: 1, m: 3, y: 1900 })).toBe(61);
        });

        it('round-trips every serial in the paste window through parts and dd-mm-yyyy text', () => {
            const bad: string[] = [];
            let prevKey = 0;
            for (let n = EXCEL_SERIAL_MIN; n <= EXCEL_SERIAL_MAX; n++) {
                const p = excelSerialToParts(n)!;
                const text = formatParts(p);
                if (!isValidParts(p) || partsToExcelSerial(p) !== n || !isCanonicalDate(text) ||
                    JSON.stringify(parseDateText(text)) !== JSON.stringify(p)) {
                    bad.push(n + ' -> ' + text);
                }
                const key = dateKey(text)!;
                if (key <= prevKey) {
                    bad.push(n + ' not increasing: ' + text);
                }
                prevKey = key;
                if (bad.length > 5) {
                    break;
                }
            }
            expect(bad).toEqual([]);
        });
    });

    describe('dayNumber / dayNumberToText', () => {
        it('counts days since 01-01-1970', () => {
            expect(dayNumber('01-01-1970')).toBe(0);
            expect(dayNumber('02-01-1970')).toBe(1);
            expect(dayNumber('31-12-1969')).toBe(-1);
            expect(dayNumber('14-10-2026')).toBe(46309 - 25569);
        });

        it('accepts any parseable spelling and returns null for non-dates', () => {
            expect(dayNumber('14/10/2026')).toBe(dayNumber('14-10-2026'));
            expect(dayNumber('Will be updated')).toBeNull();
            expect(dayNumber('')).toBeNull();
            expect(dayNumber(null)).toBeNull();
            expect(dayNumber(undefined)).toBeNull();
        });

        it('dayNumberToText is the inverse, across a leap day and year end', () => {
            expect(dayNumberToText(0)).toBe('01-01-1970');
            expect(dayNumberToText(dayNumber('28-02-2028')! + 1)).toBe('29-02-2028');
            expect(dayNumberToText(dayNumber('29-02-2028')! + 1)).toBe('01-03-2028');
            expect(dayNumberToText(dayNumber('28-02-2027')! + 1)).toBe('01-03-2027');
            expect(dayNumberToText(dayNumber('31-12-2026')! + 1)).toBe('01-01-2027');
            expect(dayNumberToText(dayNumber('01-01-2027')! - 1)).toBe('31-12-2026');
        });
    });

    describe('todayText', () => {
        it('formats a given date in local time as dd-mm-yyyy', () => {
            expect(todayText(new Date(2026, 9, 21, 23, 59, 59))).toBe('21-10-2026');
            expect(todayText(new Date(2026, 0, 5, 0, 0, 1))).toBe('05-01-2026');
            expect(todayText(new Date(2028, 1, 29, 12, 0, 0))).toBe('29-02-2028');
        });

        it('defaults to now and is a canonical date', () => {
            const t = todayText();
            expect(isCanonicalDate(t)).toBe(true);
            const now = new Date();
            expect(t.slice(6)).toBe(String(now.getFullYear()));
        });
    });

    describe('addMonths', () => {
        it('keeps the day when it fits', () => {
            expect(addMonths({ d: 15, m: 1, y: 2026 }, 1)).toEqual({ d: 15, m: 2, y: 2026 });
            expect(addMonths({ d: 15, m: 1, y: 2026 }, 0)).toEqual({ d: 15, m: 1, y: 2026 });
        });

        it('rolls the year forward and back', () => {
            expect(addMonths({ d: 15, m: 11, y: 2026 }, 3)).toEqual({ d: 15, m: 2, y: 2027 });
            expect(addMonths({ d: 15, m: 12, y: 2026 }, 1)).toEqual({ d: 15, m: 1, y: 2027 });
            expect(addMonths({ d: 15, m: 1, y: 2026 }, -1)).toEqual({ d: 15, m: 12, y: 2025 });
            expect(addMonths({ d: 15, m: 1, y: 2026 }, -13)).toEqual({ d: 15, m: 12, y: 2024 });
            expect(addMonths({ d: 15, m: 6, y: 2026 }, 24)).toEqual({ d: 15, m: 6, y: 2028 });
        });

        it('clamps the day to the length of the target month', () => {
            expect(addMonths({ d: 31, m: 1, y: 2026 }, 1)).toEqual({ d: 28, m: 2, y: 2026 });
            expect(addMonths({ d: 31, m: 1, y: 2028 }, 1)).toEqual({ d: 29, m: 2, y: 2028 });
            expect(addMonths({ d: 31, m: 3, y: 2026 }, -1)).toEqual({ d: 28, m: 2, y: 2026 });
            expect(addMonths({ d: 31, m: 12, y: 2026 }, 2)).toEqual({ d: 28, m: 2, y: 2027 });
            expect(addMonths({ d: 31, m: 10, y: 2026 }, 1)).toEqual({ d: 30, m: 11, y: 2026 });
        });

        it('does not mutate its input', () => {
            const p = { d: 31, m: 1, y: 2026 };
            addMonths(p, 1);
            expect(p).toEqual({ d: 31, m: 1, y: 2026 });
        });
    });
});
