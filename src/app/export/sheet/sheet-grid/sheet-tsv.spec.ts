import { parseTsv, quoteTsvField, toHtmlTable, toTsv } from './sheet-tsv';

describe('sheet-tsv', () => {

    describe('parseTsv', () => {
        it('returns an empty block for empty, null and undefined input', () => {
            expect(parseTsv('')).toEqual([]);
            expect(parseTsv(null)).toEqual([]);
            expect(parseTsv(undefined)).toEqual([]);
        });

        it('parses a single cell', () => {
            expect(parseTsv('abc')).toEqual([['abc']]);
        });

        it('splits cells on tabs and rows on LF (Google Sheets)', () => {
            expect(parseTsv('a\tb\nc\td')).toEqual([['a', 'b'], ['c', 'd']]);
        });

        it('splits rows on CRLF (Excel)', () => {
            expect(parseTsv('a\tb\r\nc\td')).toEqual([['a', 'b'], ['c', 'd']]);
        });

        it('splits rows on CR-only line endings', () => {
            expect(parseTsv('a\tb\rc\td\re\tf')).toEqual([['a', 'b'], ['c', 'd'], ['e', 'f']]);
        });

        it('copes with mixed line endings in one text', () => {
            expect(parseTsv('a\r\nb\nc\rd')).toEqual([['a'], ['b'], ['c'], ['d']]);
        });

        it('keeps the value untouched: no trimming of spaces, no number or date conversion', () => {
            expect(parseTsv(' lead \t 007 \t14/10/2026')).toEqual([[' lead ', ' 007 ', '14/10/2026']]);
        });

        it('keeps unicode text', () => {
            expect(parseTsv('é\t日本語\t😀')).toEqual([['é', '日本語', '😀']]);
        });

        describe('trailing line break and Excel quirks', () => {
            it('ignores one trailing CRLF (Excel), so "a\\r\\n" is one cell', () => {
                expect(parseTsv('a\r\n')).toEqual([['a']]);
            });

            it('ignores one trailing LF and one trailing CR', () => {
                expect(parseTsv('a\n')).toEqual([['a']]);
                expect(parseTsv('a\r')).toEqual([['a']]);
            });

            it('ignores the trailing CRLF of a multi-row Excel block', () => {
                expect(parseTsv('a\tb\r\nc\td\r\n')).toEqual([['a', 'b'], ['c', 'd']]);
            });

            it('turns a single empty cell copied from Excel ("\\r\\n") into [[""]]', () => {
                expect(parseTsv('\r\n')).toEqual([['']]);
            });

            it('turns "\\n" and "\\r" into one empty cell too', () => {
                expect(parseTsv('\n')).toEqual([['']]);
                expect(parseTsv('\r')).toEqual([['']]);
            });

            it('keeps a second trailing line break as one real empty row', () => {
                expect(parseTsv('a\r\n\r\n')).toEqual([['a'], ['']]);
                expect(parseTsv('a\n\n')).toEqual([['a'], ['']]);
            });

            it('Excel copy of [a ; blank] ("a\\r\\n\\r\\n") keeps the blank second row', () => {
                expect(parseTsv('a\r\n\r\n')).toEqual([['a'], ['']]);
            });

            it('Excel copy of a row with a trailing blank cell ("a\\t\\r\\n")', () => {
                expect(parseTsv('a\t\r\n')).toEqual([['a', '']]);
            });

            it('treats a leading line break as an empty first row', () => {
                expect(parseTsv('\nabc')).toEqual([[''], ['abc']]);
            });
        });

        describe('empty cells and ragged rows', () => {
            it('keeps empty cells at the start, middle and end of a row', () => {
                expect(parseTsv('\tb\t')).toEqual([['', 'b', '']]);
                expect(parseTsv('a\t\tc')).toEqual([['a', '', 'c']]);
            });

            it('parses only tabs as a row of empty cells', () => {
                expect(parseTsv('\t')).toEqual([['', '']]);
                expect(parseTsv('\t\t')).toEqual([['', '', '']]);
            });

            it('keeps an empty line in the middle as an empty row', () => {
                expect(parseTsv('a\n\nb')).toEqual([['a'], [''], ['b']]);
            });

            it('pads short rows with empty strings up to the widest row', () => {
                expect(parseTsv('a\tb\tc\nd\ne\tf')).toEqual([
                    ['a', 'b', 'c'],
                    ['d', '', ''],
                    ['e', 'f', '']
                ]);
            });

            it('pads when the widest row comes later', () => {
                expect(parseTsv('a\nb\tc\td')).toEqual([['a', '', ''], ['b', 'c', 'd']]);
            });

            it('returns rows that are separate arrays (padding does not alias rows)', () => {
                const b = parseTsv('a\tb\nc');
                b[1][1] = 'x';
                expect(b[0]).toEqual(['a', 'b']);
            });
        });

        describe('quoted cells', () => {
            it('unwraps a quoted cell', () => {
                expect(parseTsv('"abc"')).toEqual([['abc']]);
            });

            it('keeps a tab inside a quoted cell', () => {
                expect(parseTsv('"a\tb"\tc')).toEqual([['a\tb', 'c']]);
            });

            it('keeps an LF inside a quoted cell (Google Sheets multi-line cell)', () => {
                expect(parseTsv('"line1\nline2"\tx\ny\tz')).toEqual([['line1\nline2', 'x'], ['y', 'z']]);
            });

            it('normalises CRLF inside a quoted cell to LF (Excel multi-line cell)', () => {
                expect(parseTsv('"line1\r\nline2"\tx\r\ny\tz\r\n')).toEqual([['line1\nline2', 'x'], ['y', 'z']]);
            });

            it('normalises a lone CR inside a quoted cell to LF', () => {
                expect(parseTsv('"a\rb"')).toEqual([['a\nb']]);
            });

            it('keeps several lines and blank lines inside a quoted cell', () => {
                expect(parseTsv('"a\n\nb\nc"')).toEqual([['a\n\nb\nc']]);
            });

            it('turns doubled quotes into one quote', () => {
                expect(parseTsv('"say ""hi"""')).toEqual([['say "hi"']]);
            });

            it('parses a quoted cell that is just one quote ("""")', () => {
                expect(parseTsv('""""')).toEqual([['"']]);
            });

            it('parses a quoted empty cell as empty', () => {
                expect(parseTsv('""')).toEqual([['']]);
                expect(parseTsv('""\t""\n"a"\t""')).toEqual([['', ''], ['a', '']]);
            });

            it('handles a quoted cell as the first, middle and last cell of a row', () => {
                expect(parseTsv('"a\nb"\tc\td\t"e\nf"')).toEqual([['a\nb', 'c', 'd', 'e\nf']]);
                expect(parseTsv('x\t"a\tb"\ty')).toEqual([['x', 'a\tb', 'y']]);
            });

            it('handles a quoted cell closed right before CRLF and before the trailing CRLF', () => {
                expect(parseTsv('"a\nb"\r\nc\r\n')).toEqual([['a\nb'], ['c']]);
            });

            it('does not mistake a closing quote followed by a tab inside another cell for a delimiter', () => {
                expect(parseTsv('"a ""b""\tc"\td')).toEqual([['a "b"\tc', 'd']]);
            });

            it('parses an Excel block with a multi-line cell, quotes and a trailing CRLF', () => {
                const text = 'Ref\tNote\r\n' +
                    'A1\t"Call John\r\nthen ""Mary"""\r\n' +
                    'A2\tplain\r\n';
                expect(parseTsv(text)).toEqual([
                    ['Ref', 'Note'],
                    ['A1', 'Call John\nthen "Mary"'],
                    ['A2', 'plain']
                ]);
            });
        });

        describe('quotes that do not open a proper quoted cell stay literal', () => {
            it('keeps a quote inside an unquoted cell (5" pipe)', () => {
                expect(parseTsv('5" pipe')).toEqual([['5" pipe']]);
            });

            it('keeps a quote at the end of an unquoted cell (12")', () => {
                expect(parseTsv('12"')).toEqual([['12"']]);
                expect(parseTsv('12"\tx')).toEqual([['12"', 'x']]);
            });

            it('keeps an opening quote that is never closed ("abc)', () => {
                expect(parseTsv('"abc')).toEqual([['"abc']]);
            });

            it('does not let an unclosed opening quote swallow following cells', () => {
                expect(parseTsv('"abc\tdef')).toEqual([['"abc', 'def']]);
            });

            it('does not let an unclosed opening quote swallow following rows', () => {
                expect(parseTsv('"abc\r\nx\ty')).toEqual([['"abc', ''], ['x', 'y']]);
            });

            it('keeps text after a closing quote literally ("abc"def)', () => {
                expect(parseTsv('"abc"def')).toEqual([['"abc"def']]);
                expect(parseTsv('"abc" def\tx')).toEqual([['"abc" def', 'x']]);
            });

            it('keeps a lone quote cell literally', () => {
                expect(parseTsv('"')).toEqual([['"']]);
                expect(parseTsv('"\tb')).toEqual([['"', 'b']]);
            });

            it('mixes literal quotes with ordinary cells in several rows', () => {
                expect(parseTsv('5" pipe\t12"\nok\t"abc')).toEqual([['5" pipe', '12"'], ['ok', '"abc']]);
            });

            it('falls back to literal when the next quote is mid-text rather than a closer', () => {
                expect(parseTsv('"abc\r\nsay "hi" there')).toEqual([['"abc'], ['say "hi" there']]);
            });
        });
    });

    describe('quoteTsvField', () => {
        it('leaves plain text alone', () => {
            expect(quoteTsvField('abc')).toBe('abc');
            expect(quoteTsvField(' padded ')).toBe(' padded ');
            expect(quoteTsvField('14-10-2026')).toBe('14-10-2026');
        });

        it('turns null, undefined and empty into an empty string', () => {
            expect(quoteTsvField(null)).toBe('');
            expect(quoteTsvField(undefined)).toBe('');
            expect(quoteTsvField('')).toBe('');
        });

        it('wraps a cell with a tab', () => {
            expect(quoteTsvField('a\tb')).toBe('"a\tb"');
        });

        it('wraps a cell with LF, CRLF or CR', () => {
            expect(quoteTsvField('a\nb')).toBe('"a\nb"');
            expect(quoteTsvField('a\r\nb')).toBe('"a\r\nb"');
            expect(quoteTsvField('a\rb')).toBe('"a\rb"');
        });

        it('wraps a cell with a quote and doubles the inner quotes', () => {
            expect(quoteTsvField('5" pipe')).toBe('"5"" pipe"');
            expect(quoteTsvField('say "hi"')).toBe('"say ""hi"""');
            expect(quoteTsvField('"')).toBe('""""');
        });
    });

    describe('toTsv', () => {
        it('joins cells with tabs and rows with CRLF, with no trailing line break', () => {
            expect(toTsv([['a', 'b'], ['c', 'd']])).toBe('a\tb\r\nc\td');
        });

        it('serialises a single cell without any separator', () => {
            expect(toTsv([['abc']])).toBe('abc');
        });

        it('serialises an empty block as an empty string', () => {
            expect(toTsv([])).toBe('');
        });

        it('keeps empty cells as empty fields', () => {
            expect(toTsv([['a', '', 'c'], ['', '', '']])).toBe('a\t\tc\r\n\t\t');
        });

        it('treats undefined / null cells as empty', () => {
            expect(toTsv([['a', undefined, null]])).toBe('a\t\t');
        });

        it('quotes cells holding a tab, a line break or a quote', () => {
            expect(toTsv([['a\tb', 'c\nd', 'e"f']])).toBe('"a\tb"\t"c\nd"\t"e""f"');
        });

        it('keeps LF inside a multi-line cell as it is', () => {
            expect(toTsv([['l1\nl2', 'x']])).toBe('"l1\nl2"\tx');
        });
    });

    describe('round trips', () => {
        const blocks: { name: string; block: string[][] }[] = [
            { name: 'plain', block: [['a', 'b'], ['c', 'd']] },
            { name: 'single row', block: [['a', 'b', 'c']] },
            { name: 'single column', block: [['a'], ['b'], ['c']] },
            { name: 'single cell', block: [['abc']] },
            { name: 'multi-line cells', block: [['l1\nl2', 'x'], ['y', 'a\n\nb\nc']] },
            { name: 'cell that is only a line break', block: [['\n', 'x']] },
            { name: 'quotes and inch marks', block: [['say "hi"', '5" pipe'], ['"abc', 'abc"']] },
            { name: 'cells that are only quotes', block: [['"', '""'], ['"""', 'x']] },
            { name: 'tabs inside cells', block: [['a\tb', 'c'], ['\t', 'd\t']] },
            { name: 'tab, quote and newline in one cell', block: [['a\t"b"\nc', 'x']] },
            { name: 'empty cells', block: [['', '', ''], ['', 'x', ''], ['y', '', '']] },
            { name: 'empty middle cell in a single row', block: [['a', '', 'c']] },
            { name: 'empty rows between rows (wide)', block: [['a', 'b'], ['', ''], ['c', 'd']] },
            { name: 'empty row in the middle of a single column', block: [['a'], [''], ['b']] },
            { name: 'last row of empty cells (wide)', block: [['a', 'b'], ['', '']] },
            { name: 'leading and trailing spaces', block: [[' lead', 'trail '], ['  ', ' ']] },
            { name: 'unicode', block: [['é', '日本語'], ['😀', 'Ünï']] },
            { name: 'date-like and number-like text', block: [['14-10-2026', '007'], ['1,5', '=SUM(A1)']] },
            { name: 'wide block', block: [Array.from({ length: 30 }, (_, i) => 'c' + i)] }
        ];

        for (const { name, block } of blocks) {
            it('parseTsv(toTsv(block)) gives the block back: ' + name, () => {
                expect(parseTsv(toTsv(block))).toEqual(block);
            });
        }

        const texts = [
            'a\tb\r\nc\td',
            '"l1\nl2"\tx\r\ny\tz',
            '"5"" pipe"\t"say ""hi"""\r\n"a\tb"\tc',
            '\t\r\n\t'
        ];
        for (const text of texts) {
            it('toTsv(parseTsv(x)) gives x back for canonical text ' + JSON.stringify(text), () => {
                expect(toTsv(parseTsv(text))).toBe(text);
            });
        }

        it('toTsv(parseTsv(x)) normalises LF / CR / a trailing break to the canonical form', () => {
            expect(toTsv(parseTsv('a\tb\nc\td\n'))).toBe('a\tb\r\nc\td');
            expect(toTsv(parseTsv('a\rb'))).toBe('a\r\nb');
        });

        it('turns CRLF and CR inside a cell into LF on the way back', () => {
            expect(parseTsv(toTsv([['a\r\nb', 'c\rd'], ['x', 'y']]))).toEqual([['a\nb', 'c\nd'], ['x', 'y']]);
        });

        it('survives an Excel style text (CRLF rows, trailing CRLF, quoted multi-line)', () => {
            const excel = 'A\tB\r\n"x\r\ny"\t""""\r\n';
            const block = parseTsv(excel);
            expect(block).toEqual([['A', 'B'], ['x\ny', '"']]);
            expect(parseTsv(toTsv(block))).toEqual(block);
        });

        it('survives a deterministic fuzz of cells made of tricky fragments', () => {
            const fragments = ['a', 'b', '', ' ', '"', '""', '\t', '\n', 'x y', '5"', '1,5', '😀'];
            let seed = 12345;
            const rnd = (n: number) => {
                seed = (Math.imul(seed, 1103515245) + 12345) & 0x7fffffff;
                return seed % n;
            };
            const failures: string[] = [];
            for (let round = 0; round < 300; round++) {
                const rows = 1 + rnd(6);
                const cols = 2 + rnd(5); // 2+ columns: a lone empty last cell is the one shape the text cannot carry
                const block: string[][] = [];
                for (let r = 0; r < rows; r++) {
                    const row: string[] = [];
                    for (let c = 0; c < cols; c++) {
                        let cell = '';
                        const parts = rnd(4);
                        for (let p = 0; p < parts; p++) {
                            cell += fragments[rnd(fragments.length)];
                        }
                        row.push(cell);
                    }
                    block.push(row);
                }
                const back = parseTsv(toTsv(block));
                if (JSON.stringify(back) !== JSON.stringify(block)) {
                    failures.push(JSON.stringify(block) + ' -> ' + JSON.stringify(back));
                }
            }
            expect(failures).toEqual([]);
        });

        // A one-column block whose last row is empty gets Excel's trailing CRLF, so the parser
        // (which drops exactly one trailing break) still sees the empty last row.
        it('keeps a one-column block ending in an empty cell, and a lone empty cell, intact', () => {
            expect(toTsv([['a'], ['']])).toBe('a\r\n\r\n');
            expect(parseTsv(toTsv([['a'], ['']]))).toEqual([['a'], ['']]);
            expect(toTsv([['']])).toBe('\r\n');
            expect(parseTsv(toTsv([['']]))).toEqual([['']]);
            expect(toTsv([])).toBe('');
        });
    });

    describe('toHtmlTable', () => {
        const TD = (inner: string) => '<td style="white-space:pre-wrap">' + inner + '</td>';
        const HEAD = '<meta charset="utf-8"><table><tbody>';
        const TAIL = '</tbody></table>';

        it('renders rows and cells', () => {
            expect(toHtmlTable([['a', 'b'], ['c', 'd']]))
                .toBe(HEAD + '<tr>' + TD('a') + TD('b') + '</tr><tr>' + TD('c') + TD('d') + '</tr>' + TAIL);
        });

        it('renders an empty block as an empty table', () => {
            expect(toHtmlTable([])).toBe(HEAD + TAIL);
        });

        it('renders empty, null and undefined cells as empty cells', () => {
            expect(toHtmlTable([['', undefined, null]])).toBe(HEAD + '<tr>' + TD('') + TD('') + TD('') + '</tr>' + TAIL);
        });

        it('escapes & < > and quotes', () => {
            expect(toHtmlTable([['<b>"R&D"</b>']]))
                .toBe(HEAD + '<tr>' + TD('&lt;b&gt;&quot;R&amp;D&quot;&lt;/b&gt;') + '</tr>' + TAIL);
        });

        it('escapes & first, so existing entities are not left half-escaped', () => {
            expect(toHtmlTable([['&lt;']])).toBe(HEAD + '<tr>' + TD('&amp;lt;') + '</tr>' + TAIL);
        });

        it('turns line breaks into <br>', () => {
            expect(toHtmlTable([['l1\nl2\n\nl4']])).toBe(HEAD + '<tr>' + TD('l1<br>l2<br><br>l4') + '</tr>' + TAIL);
        });

        it('keeps tabs and spaces in the cell text', () => {
            expect(toHtmlTable([[' a\tb ']])).toBe(HEAD + '<tr>' + TD(' a\tb ') + '</tr>' + TAIL);
        });
    });
});
