import { MTD_LETTERHEADS, mtdLetterhead, pickSheetData, sameSheetData, sheetText, shippedOnBoardDate } from './mtd-sheet';

describe('mtd-sheet helpers', () => {

    describe('shippedOnBoardDate', () => {
        it('reads the dd/mm/yyyy date in Place and date of issue', () => {
            expect(shippedOnBoardDate('MUMBAI          16/07/2025')).toBe('16/07/2025');
        });

        it('pads d/m/yyyy and accepts - and . separators', () => {
            expect(shippedOnBoardDate('MUMBAI 6/7/2025')).toBe('06/07/2025');
            expect(shippedOnBoardDate('NHAVA SHEVA 16-07-2025')).toBe('16/07/2025');
            expect(shippedOnBoardDate('16.07.2025')).toBe('16/07/2025');
        });

        it('returns empty when there is no valid date', () => {
            expect(shippedOnBoardDate('MUMBAI')).toBe('');
            expect(shippedOnBoardDate('')).toBe('');
            expect(shippedOnBoardDate(null)).toBe('');
            expect(shippedOnBoardDate('32/13/2025')).toBe('');
            expect(shippedOnBoardDate('123/07/20251')).toBe('');
        });
    });

    describe('letterhead', () => {
        it('prints OCEAN LINKS for company 32 and LINKS CARGO for every other company', () => {
            expect(mtdLetterhead('32').name).toBe('OCEAN LINKS SHIPPING PVT. LTD.');
            expect(mtdLetterhead('30').name).toBe('LINKS CARGO AGENCIES PVT. LTD.');
            expect(mtdLetterhead('01')).toBe(MTD_LETTERHEADS.links);
            expect(mtdLetterhead(undefined)).toBe(MTD_LETTERHEADS.links);
            expect(MTD_LETTERHEADS.olspl.regd.join(' ')).not.toContain('FMC');
        });
    });

    describe('saved snapshot', () => {
        it('normalises null and CRLF and compares field by field', () => {
            const a = pickSheetData({ SHIPPER: 'A\r\nB', ITCDESC: null, FCRNO: 'COL1' });
            expect(a.SHIPPER).toBe('A\nB');
            expect(a.ITCDESC).toBe('');
            expect(sameSheetData(a, { SHIPPER: 'A\nB', FCRNO: 'COL1' })).toBe(true);
            expect(sameSheetData(a, { SHIPPER: 'A\nB', FCRNO: 'COL1', Rider: 'X' })).toBe(false);
            expect(sheetText(false)).toBe('');
        });
    });
});
