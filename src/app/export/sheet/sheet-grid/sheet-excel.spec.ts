import { buildSheetWorkbook, cssColorToArgb, loadExcelJs } from './sheet-excel';
import { SheetColumn, SheetRow } from './sheet-grid.types';

describe('sheet-excel: cssColorToArgb', () => {
    it('converts a 6-digit hex colour to opaque ARGB', () => {
        expect(cssColorToArgb('#aabbcc')).toBe('FFAABBCC');
        expect(cssColorToArgb('#AABBCC')).toBe('FFAABBCC');
        expect(cssColorToArgb('#000000')).toBe('FF000000');
        expect(cssColorToArgb('#ffffff')).toBe('FFFFFFFF');
        expect(cssColorToArgb('#f4cccc')).toBe('FFF4CCCC');
    });

    it('expands a 3-digit hex colour', () => {
        expect(cssColorToArgb('#abc')).toBe('FFAABBCC');
        expect(cssColorToArgb('#ABC')).toBe('FFAABBCC');
        expect(cssColorToArgb('#000')).toBe('FF000000');
        expect(cssColorToArgb('#fff')).toBe('FFFFFFFF');
        expect(cssColorToArgb('#f0a')).toBe('FFFF00AA');
    });

    it('converts rgb(r, g, b)', () => {
        expect(cssColorToArgb('rgb(255, 0, 128)')).toBe('FFFF0080');
        expect(cssColorToArgb('rgb(0,0,0)')).toBe('FF000000');
        expect(cssColorToArgb('rgb(255,255,255)')).toBe('FFFFFFFF');
        expect(cssColorToArgb('RGB(10, 20, 30)')).toBe('FF0A141E');
    });

    it('pads single-digit hex components with a zero', () => {
        expect(cssColorToArgb('rgb(1, 2, 3)')).toBe('FF010203');
        expect(cssColorToArgb('rgb(15, 16, 0)')).toBe('FF0F1000');
    });

    it('tolerates extra spaces inside rgb()', () => {
        expect(cssColorToArgb('rgb( 10 , 20 , 30 )')).toBe('FF0A141E');
    });

    it('converts rgba() and ignores the alpha (the result is opaque)', () => {
        expect(cssColorToArgb('rgba(1, 2, 3, 0.5)')).toBe('FF010203');
        expect(cssColorToArgb('rgba(255,0,0,1)')).toBe('FFFF0000');
        expect(cssColorToArgb('rgba(255,0,0,0)')).toBe('FFFF0000');
    });

    it('clamps components above 255', () => {
        expect(cssColorToArgb('rgb(300, 0, 999)')).toBe('FFFF00FF');
    });

    it('trims surrounding whitespace', () => {
        expect(cssColorToArgb('  #abc  ')).toBe('FFAABBCC');
        expect(cssColorToArgb('\t#aabbcc\n')).toBe('FFAABBCC');
        expect(cssColorToArgb(' rgb(1,2,3) ')).toBe('FF010203');
    });

    it('returns null for empty, null and undefined', () => {
        expect(cssColorToArgb('')).toBeNull();
        expect(cssColorToArgb(null)).toBeNull();
        expect(cssColorToArgb(undefined)).toBeNull();
        expect(cssColorToArgb('   ')).toBeNull();
    });

    it('returns null for colours it does not understand', () => {
        for (const c of ['red', 'transparent', 'inherit', 'hsl(0, 100%, 50%)', 'aabbcc', '#abcd', '#12345', '#1234567', '#ggg', 'rgb(1,2)', 'rgb()', '#']) {
            expect(cssColorToArgb(c)).withContext(c).toBeNull();
        }
    });
});

describe('sheet-excel: buildSheetWorkbook', () => {
    it('writes the visible columns and rows with values, colours, bold and frozen panes', async () => {
        const columns: SheetColumn[] = [
            { key: 'WO', header: 'WO', width: 90 },
            { key: 'QTY', header: 'Qty', width: 50, kind: 'num' },
            { key: 'DT', header: 'Stuffing', width: 90, kind: 'date' },
            { key: 'REM', header: 'Remark', width: 140, kind: 'ml' }
        ];
        const rows: SheetRow[] = [
            { id: 1, values: { WO: 'WO1', QTY: '12', DT: '14-10-2026', REM: 'a\nb' }, rowFmt: { bg: '#FFF59D', fg: '#C62828' } },
            { id: 2, values: { WO: 'WO2', QTY: 'n/a', DT: 'Will be updated', REM: '' }, fmt: { WO: { bold: true, bg: '#cfe2f3' } } }
        ];
        const buf = await buildSheetWorkbook(columns, rows, { fileName: 'Test', sheetName: 'Vipar', frozenCols: 1 });
        expect(buf.byteLength).toBeGreaterThan(1000);
        const ExcelJS = await loadExcelJs();
        const wb = new ExcelJS.Workbook();
        await wb.xlsx.load(buf);
        const ws = wb.getWorksheet('Vipar');
        expect(ws).toBeTruthy();
        expect(ws.getRow(1).values.slice(1)).toEqual(['WO', 'Qty', 'Stuffing', 'Remark']);
        expect(ws.getCell('B2').value).toBe(12);                        // number column -> number
        expect(ws.getCell('B3').value).toBe('n/a');                     // not a number -> text
        const d = ws.getCell('C2').value as Date;                       // real date -> Excel date
        expect(d instanceof Date).toBeTrue();
        expect([d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate()]).toEqual([2026, 10, 14]);
        expect(ws.getCell('C3').value).toBe('Will be updated');         // note stays text
        expect(ws.getCell('D2').value).toBe('a\nb');
        expect(ws.getCell('A2').fill.fgColor.argb).toBe('FFFFF59D');    // row colour
        expect(ws.getCell('A2').font.color.argb).toBe('FFC62828');      // row text colour
        expect(ws.getCell('A3').fill.fgColor.argb).toBe('FFCFE2F3');    // cell colour
        expect(ws.getCell('A3').font.bold).toBeTrue();
        expect(ws.views[0].state).toBe('frozen');
        expect(ws.views[0].xSplit).toBe(1);
        expect(ws.views[0].ySplit).toBe(1);
    });
});

describe('sheet-excel: frozen rows and merges', () => {
    it('freezes the header plus the frozen rows and merges the given ranges', async () => {
        const columns: SheetColumn[] = [{ key: 'A', header: 'A' }, { key: 'B', header: 'B' }, { key: 'C', header: 'C' }];
        const rows: SheetRow[] = [
            { id: 1, values: { A: 'Rate card', B: '', C: '' } },
            { id: 2, values: { A: 'Line', B: 'ONE', C: 'MSC' } },
            { id: 3, values: { A: 'Colombo', B: '100', C: '120' } }
        ];
        const buf = await buildSheetWorkbook(columns, rows, { fileName: 'Price', frozenRows: 2, merges: [{ r0: 0, c0: 0, r1: 0, c1: 2 }] });
        const ExcelJS = await loadExcelJs();
        const wb = new ExcelJS.Workbook();
        await wb.xlsx.load(buf);
        const ws = wb.worksheets[0];
        expect(ws.views[0].ySplit).toBe(3);
        expect(ws.getCell('C2').isMerged).toBeTrue();
        expect(ws.getCell('C2').master.address).toBe('A2');
        expect(ws.getCell('A3').isMerged).toBeFalse();
    });
});

