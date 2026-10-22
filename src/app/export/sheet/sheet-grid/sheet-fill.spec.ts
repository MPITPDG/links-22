import { fillSeries, parseNumber } from './sheet-fill';

describe('sheet-fill', () => {

    describe('parseNumber', () => {
        it('parses integers, decimals and signs', () => {
            expect(parseNumber('12')).toBe(12);
            expect(parseNumber('12.5')).toBe(12.5);
            expect(parseNumber('-3')).toBe(-3);
            expect(parseNumber('+3')).toBe(3);
            expect(parseNumber('0')).toBe(0);
            expect(parseNumber('.5')).toBe(0.5);
            expect(parseNumber('5.')).toBe(5);
            expect(parseNumber('007')).toBe(7);
        });

        it('trims whitespace', () => {
            expect(parseNumber('  42 ')).toBe(42);
            expect(parseNumber('\t1.5\n')).toBe(1.5);
        });

        it('accepts a thousands separator and exponent notation', () => {
            expect(parseNumber('1,234.5')).toBe(1234.5);
            expect(parseNumber('1,000,000')).toBe(1000000);
            expect(parseNumber('1e3')).toBe(1000);
            expect(parseNumber('2.5E-1')).toBe(0.25);
        });

        it('returns null for text, mixed text and blanks', () => {
            for (const v of ['', '   ', 'abc', '12abc', 'abc12', '1.2.3', '--1', '+-1', '1e', 'e5', '.', '-', '€5', '5 kg', '14-10-2026', '1/2']) {
                expect(parseNumber(v)).withContext(JSON.stringify(v)).toBeNull();
            }
        });

        it('returns null for null, undefined and non-finite numbers', () => {
            expect(parseNumber(null)).toBeNull();
            expect(parseNumber(undefined)).toBeNull();
            expect(parseNumber('1e999')).toBeNull();
            expect(parseNumber('NaN')).toBeNull();
            expect(parseNumber('Infinity')).toBeNull();
        });
    });

    describe('fillSeries', () => {
        describe('count', () => {
            it('returns nothing for count 0 and negative counts', () => {
                expect(fillSeries(['1', '2'], 0, 'num')).toEqual([]);
                expect(fillSeries(['14-10-2026'], 0, 'date')).toEqual([]);
                expect(fillSeries(['a'], 0, 'text')).toEqual([]);
                expect(fillSeries(['a'], -3, undefined)).toEqual([]);
            });

            it('returns exactly count values', () => {
                expect(fillSeries(['1', '2'], 7, 'num').length).toBe(7);
                expect(fillSeries(['14-10-2026'], 40, 'date').length).toBe(40);
                expect(fillSeries(['a', 'b', 'c'], 10, 'text').length).toBe(10);
            });
        });

        describe('a single date continues day by day', () => {
            it('continues a date', () => {
                expect(fillSeries(['14-10-2026'], 3, 'date')).toEqual(['15-10-2026', '16-10-2026', '17-10-2026']);
            });

            it('rolls over the month end', () => {
                expect(fillSeries(['30-10-2026'], 3, 'date')).toEqual(['31-10-2026', '01-11-2026', '02-11-2026']);
                expect(fillSeries(['29-04-2026'], 3, 'date')).toEqual(['30-04-2026', '01-05-2026', '02-05-2026']);
            });

            it('rolls over the year end', () => {
                expect(fillSeries(['30-12-2026'], 4, 'date')).toEqual(['31-12-2026', '01-01-2027', '02-01-2027', '03-01-2027']);
            });

            it('handles leap and non-leap February', () => {
                expect(fillSeries(['27-02-2028'], 3, 'date')).toEqual(['28-02-2028', '29-02-2028', '01-03-2028']);
                expect(fillSeries(['27-02-2027'], 3, 'date')).toEqual(['28-02-2027', '01-03-2027', '02-03-2027']);
            });

            it('fills a whole year consecutively', () => {
                const out = fillSeries(['01-01-2026'], 365, 'date');
                expect(out[0]).toBe('02-01-2026');
                expect(out[364]).toBe('01-01-2027');
                expect(out[58]).toBe('01-03-2026');
            });

            it('writes the result as dd-mm-yyyy whatever the source spelling', () => {
                expect(fillSeries(['14/10/2026'], 2, 'date')).toEqual(['15-10-2026', '16-10-2026']);
                expect(fillSeries(['2026-10-14'], 2, 'date')).toEqual(['15-10-2026', '16-10-2026']);
                expect(fillSeries(['14-Oct-2026'], 2, 'date')).toEqual(['15-10-2026', '16-10-2026']);
                expect(fillSeries(['14-10-26'], 2, 'date')).toEqual(['15-10-2026', '16-10-2026']);
            });

            it('also recognises a dd-mm-yyyy source in a text / unknown column', () => {
                expect(fillSeries(['14-10-2026'], 2, undefined)).toEqual(['15-10-2026', '16-10-2026']);
                expect(fillSeries(['14/10/2026'], 2, 'text')).toEqual(['15-10-2026', '16-10-2026']);
            });

            it('does not turn dates into a series in a number column', () => {
                expect(fillSeries(['14-10-2026'], 2, 'num')).toEqual(['14-10-2026', '14-10-2026']);
            });
        });

        describe('two or more dates continue their step', () => {
            it('continues a 7-day step', () => {
                expect(fillSeries(['01-10-2026', '08-10-2026'], 3, 'date')).toEqual(['15-10-2026', '22-10-2026', '29-10-2026']);
            });

            it('continues a 7-day step across a month end', () => {
                expect(fillSeries(['22-10-2026', '29-10-2026'], 3, 'date')).toEqual(['05-11-2026', '12-11-2026', '19-11-2026']);
            });

            it('continues a 2-day step from three dates', () => {
                expect(fillSeries(['01-10-2026', '03-10-2026', '05-10-2026'], 2, 'date')).toEqual(['07-10-2026', '09-10-2026']);
            });

            it('continues a consecutive-day pair', () => {
                expect(fillSeries(['14-10-2026', '15-10-2026'], 3, 'date')).toEqual(['16-10-2026', '17-10-2026', '18-10-2026']);
            });

            it('continues a backwards (negative) step', () => {
                expect(fillSeries(['10-10-2026', '03-10-2026'], 3, 'date')).toEqual(['26-09-2026', '19-09-2026', '12-09-2026']);
            });

            it('continues from the last source date, not the first', () => {
                expect(fillSeries(['01-01-2026', '02-01-2026', '03-01-2026', '04-01-2026'], 1, 'date')).toEqual(['05-01-2026']);
            });

            it('repeats an identical pair (step 0)', () => {
                expect(fillSeries(['14-10-2026', '14-10-2026'], 2, 'date')).toEqual(['14-10-2026', '14-10-2026']);
            });

            it('mixes spellings in the source', () => {
                expect(fillSeries(['01/10/2026', '2026-10-08'], 2, 'date')).toEqual(['15-10-2026', '22-10-2026']);
            });

            it('repeats the pattern when the steps are not constant', () => {
                expect(fillSeries(['01-10-2026', '08-10-2026', '20-10-2026'], 4, 'date'))
                    .toEqual(['01-10-2026', '08-10-2026', '20-10-2026', '01-10-2026']);
            });
        });

        describe('dates on the same day of the month continue as a month series', () => {
            it('continues a monthly pair', () => {
                expect(fillSeries(['15-01-2026', '15-02-2026'], 3, 'date')).toEqual(['15-03-2026', '15-04-2026', '15-05-2026']);
            });

            it('rolls the year', () => {
                expect(fillSeries(['15-11-2026', '15-12-2026'], 3, 'date')).toEqual(['15-01-2027', '15-02-2027', '15-03-2027']);
            });

            it('continues a quarterly step', () => {
                expect(fillSeries(['01-01-2026', '01-04-2026', '01-07-2026'], 2, 'date')).toEqual(['01-10-2026', '01-01-2027']);
            });

            it('continues a yearly step', () => {
                expect(fillSeries(['14-10-2025', '14-10-2026'], 2, 'date')).toEqual(['14-10-2027', '14-10-2028']);
            });

            it('continues a descending month series', () => {
                expect(fillSeries(['15-03-2026', '15-02-2026'], 3, 'date')).toEqual(['15-01-2026', '15-12-2025', '15-11-2025']);
            });

            it('clamps the 31st to the month length', () => {
                expect(fillSeries(['31-01-2026', '31-03-2026'], 3, 'date')).toEqual(['31-05-2026', '31-07-2026', '30-09-2026']);
                expect(fillSeries(['30-11-2027', '30-12-2027'], 3, 'date')).toEqual(['30-01-2028', '29-02-2028', '30-03-2028']);
            });
        });

        describe('numbers', () => {
            it('continues a step of 1', () => {
                expect(fillSeries(['1', '2'], 3, undefined)).toEqual(['3', '4', '5']);
                expect(fillSeries(['1', '2'], 3, 'num')).toEqual(['3', '4', '5']);
            });

            it('continues a larger constant step', () => {
                expect(fillSeries(['10', '20'], 3, 'num')).toEqual(['30', '40', '50']);
                expect(fillSeries(['5', '10', '15'], 2, 'num')).toEqual(['20', '25']);
            });

            it('continues a descending step through zero', () => {
                expect(fillSeries(['5', '3'], 4, 'num')).toEqual(['1', '-1', '-3', '-5']);
                expect(fillSeries(['2', '1'], 3, 'num')).toEqual(['0', '-1', '-2']);
            });

            it('works with negative sources', () => {
                expect(fillSeries(['-4', '-2'], 3, 'num')).toEqual(['0', '2', '4']);
            });

            it('continues decimals, keeping the decimal places', () => {
                expect(fillSeries(['0.5', '1.0'], 3, 'num')).toEqual(['1.5', '2.0', '2.5']);
                expect(fillSeries(['1.1', '1.2'], 3, 'num')).toEqual(['1.3', '1.4', '1.5']);
                expect(fillSeries(['0.25', '0.5'], 2, 'num')).toEqual(['0.75', '1.00']);
            });

            it('does not accumulate floating point noise', () => {
                expect(fillSeries(['0.1', '0.2', '0.3'], 3, 'num')).toEqual(['0.4', '0.5', '0.6']);
                const out = fillSeries(['0.1', '0.2'], 50, 'num');
                expect(out[49]).toBe('5.2');
            });

            it('uses the widest decimal count of the source', () => {
                expect(fillSeries(['1', '1.5'], 2, 'num')).toEqual(['2.0', '2.5']);
            });

            it('never prints a negative zero', () => {
                // 0.9, 0.6, 0.3 -> next is 0 - 5e-17 in floating point, which toFixed(1) would print as "-0.0"
                expect(fillSeries(['0.9', '0.6', '0.3'], 3, 'num')).toEqual(['0.0', '-0.3', '-0.6']);
                expect(fillSeries(['3', '2', '1'], 2, 'num')).toEqual(['0', '-1']);
            });

            it('accepts a thousands separator in the source (the result is plain)', () => {
                expect(fillSeries(['1,000', '2,000'], 2, 'num')).toEqual(['3000', '4000']);
            });

            it('trims whitespace around source numbers', () => {
                expect(fillSeries([' 1 ', ' 2 '], 2, 'num')).toEqual(['3', '4']);
            });

            it('continues numbers in a text / unknown column when every source value is a number', () => {
                expect(fillSeries(['7', '9'], 2, 'text')).toEqual(['11', '13']);
                expect(fillSeries(['7', '9'], 2, undefined)).toEqual(['11', '13']);
            });

            it('does not continue numbers in a date column', () => {
                expect(fillSeries(['1', '2'], 3, 'date')).toEqual(['1', '2', '1']);
            });

            it('repeats the pattern when the step is not constant', () => {
                expect(fillSeries(['1', '2', '4'], 4, 'num')).toEqual(['1', '2', '4', '1']);
            });

            it('copies a single number', () => {
                expect(fillSeries(['5'], 3, 'num')).toEqual(['5', '5', '5']);
                expect(fillSeries(['5'], 2, undefined)).toEqual(['5', '5']);
                expect(fillSeries(['2.50'], 2, 'num')).toEqual(['2.50', '2.50']);
            });

            it('repeats a pair with step 0', () => {
                expect(fillSeries(['4', '4'], 3, 'num')).toEqual(['4', '4', '4']);
            });
        });

        describe('everything else repeats the source pattern', () => {
            it('repeats a single text', () => {
                expect(fillSeries(['x'], 3, 'text')).toEqual(['x', 'x', 'x']);
                expect(fillSeries(['x'], 3, undefined)).toEqual(['x', 'x', 'x']);
            });

            it('repeats a text pattern in order', () => {
                expect(fillSeries(['a', 'b'], 5, 'text')).toEqual(['a', 'b', 'a', 'b', 'a']);
                expect(fillSeries(['a', 'b', 'c'], 7, 'text')).toEqual(['a', 'b', 'c', 'a', 'b', 'c', 'a']);
            });

            it('repeats a note in a date column', () => {
                expect(fillSeries(['Will be updated'], 2, 'date')).toEqual(['Will be updated', 'Will be updated']);
            });

            it('repeats a range in a date column', () => {
                expect(fillSeries(['26-08/27-08'], 2, 'date')).toEqual(['26-08/27-08', '26-08/27-08']);
            });

            it('repeats mixed numbers and text', () => {
                expect(fillSeries(['1', 'a'], 3, 'text')).toEqual(['1', 'a', '1']);
                expect(fillSeries(['1', 'a', '3'], 4, undefined)).toEqual(['1', 'a', '3', '1']);
            });

            it('repeats mixed dates and notes in a date column', () => {
                expect(fillSeries(['14-10-2026', 'TBC'], 3, 'date')).toEqual(['14-10-2026', 'TBC', '14-10-2026']);
            });

            it('repeats a pattern with a blank cell in it (blanks included)', () => {
                expect(fillSeries(['1', ''], 3, 'num')).toEqual(['1', '', '1']);
                expect(fillSeries(['', '2'], 3, 'num')).toEqual(['', '2', '']);
                expect(fillSeries(['14-10-2026', ''], 3, 'date')).toEqual(['14-10-2026', '', '14-10-2026']);
            });

            it('treats whitespace-only cells as blank, keeping them as typed', () => {
                expect(fillSeries(['1', '  '], 3, 'num')).toEqual(['1', '  ', '1']);
            });

            it('repeats an all-blank source', () => {
                expect(fillSeries([''], 3, 'text')).toEqual(['', '', '']);
                expect(fillSeries(['', ''], 3, 'num')).toEqual(['', '', '']);
            });

            it('fills blanks for an empty source', () => {
                expect(fillSeries([], 3, 'text')).toEqual(['', '', '']);
            });

            it('treats null / undefined source values as blank', () => {
                expect(fillSeries([null as any, undefined as any], 3, 'text')).toEqual(['', '', '']);
            });

            it('copies a text containing digits unchanged (no text-with-number series)', () => {
                expect(fillSeries(['Item 1', 'Item 2'], 2, 'text')).toEqual(['Item 1', 'Item 2']);
            });

            it('does not mutate the source array', () => {
                const src = ['1', '2'];
                fillSeries(src, 3, 'num');
                expect(src).toEqual(['1', '2']);
            });
        });
    });
});
