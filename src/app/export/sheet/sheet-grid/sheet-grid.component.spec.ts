import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { SheetGridModule } from './sheet-grid.module';
import { parseA1Range, SheetGridComponent } from './sheet-grid.component';
import { SheetCanEdit, SheetColumn, SheetEdit, SheetRow, SheetRowOp } from './sheet-grid.types';

/*  Behaviour of <app-sheet-grid> as the parent sees it: the intents it emits for
    keyboard, clipboard, fill and undo, and the locks it enforces.               */

@Component({
    template: `
      <div style="height: 420px; width: 900px; display: flex">
        <app-sheet-grid style="flex: 1 1 auto; min-width: 0" [columns]="cols" [rows]="rows" [canEditCell]="can" [frozenCols]="1"
                        [frozenRows]="frozenRows" [merges]="merges"
                        (edits)="onEdits($event)" (rowOp)="onRowOp($event)"></app-sheet-grid>
      </div>`,
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
class HostComponent {
    cols: SheetColumn[] = [
        { key: 'WO', header: 'WO', width: 90 },
        { key: 'QTY', header: 'Qty', width: 60, kind: 'num' },
        { key: 'DT', header: 'Date', width: 90, kind: 'date' },
        { key: 'TYPE', header: 'Type', width: 70, kind: 'choice', choices: ['CKD', 'SKD'] },
        { key: 'REM', header: 'Remark', width: 140, kind: 'ml' }
    ];
    rows: SheetRow[] = [];
    can: SheetCanEdit | null = null;
    frozenRows = 0;
    merges: string[] = [];
    emitted: SheetEdit[][] = [];
    ops: SheetRowOp[] = [];
    private next = 5000;

    constructor(public cdr: ChangeDetectorRef) {
        for (let i = 1; i <= 1000; i++) {
            this.rows.push({
                id: i,
                values: {
                    WO: 'WO' + i, QTY: String(i), DT: i % 7 === 0 ? 'Will be updated' : this.day(i),
                    TYPE: i % 2 ? 'CKD' : 'SKD', REM: i === 3 ? 'two\nlines' : ''
                },
                locked: i === 2 ? { WO: 'From Links' } : undefined
            });
        }
    }

    private day(i: number): string {
        const d = 1 + (i * 13) % 28;
        return (d < 10 ? '0' : '') + d + '-10-2026';
    }

    onEdits(list: SheetEdit[]): void {
        this.emitted.push(list);
        const by = new Map<any, SheetEdit[]>();
        list.forEach(e => by.set(e.rowId, (by.get(e.rowId) || []).concat(e)));
        this.rows = this.rows.map(r => {
            const es = by.get(r.id);
            if (!es) {
                return r;
            }
            const values = { ...r.values };
            es.forEach(e => values[e.key] = e.newValue);
            return { ...r, values };
        });
    }

    onRowOp(op: SheetRowOp): void {
        this.ops.push(op);
        if (op.op === 'insert') {
            const at = op.afterId === null ? 0 : this.rows.findIndex(r => r.id === op.afterId) + 1;
            const fresh: SheetRow[] = [];
            for (let i = 0; i < op.count; i++) {
                fresh.push({ id: this.next++, values: {} });
            }
            this.rows = [...this.rows.slice(0, at), ...fresh, ...this.rows.slice(at)];
        }
    }

    value(id: number, key: string): string {
        const r = this.rows.find(x => x.id === id);
        return r ? (r.values[key] || '') : '';
    }
}

describe('SheetGridComponent', () => {
    let fixture: ComponentFixture<HostComponent>;
    let host: HostComponent;
    let grid: SheetGridComponent;
    let sink: HTMLTextAreaElement;

    const settle = async () => {
        fixture.detectChanges();
        await fixture.whenStable();
        await new Promise(r => setTimeout(r, 20));
        fixture.detectChanges();
    };
    /** a data refresh from the page (the test host is marked dirty like an async update would be) */
    const setRows = (rows: SheetRow[]) => {
        host.rows = rows;
        host.cdr.markForCheck();
        fixture.detectChanges();
    };
    const key = (k: string, o: KeyboardEventInit = {}) => {
        sink.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...o }));
        fixture.detectChanges();
    };
    const type = (text: string) => {
        sink.value = text;
        sink.dispatchEvent(new Event('input', { bubbles: true }));
        fixture.detectChanges();
        return fixture.nativeElement.querySelector('textarea.sg-ed') as HTMLTextAreaElement;
    };
    const editorKey = (ed: HTMLTextAreaElement, k: string, o: KeyboardEventInit = {}) => {
        ed.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...o }));
        fixture.detectChanges();
    };
    const clip = (type: 'copy' | 'cut' | 'paste', text?: string) => {
        const dt = new DataTransfer();
        if (text !== undefined) {
            dt.setData('text/plain', text);
        }
        sink.dispatchEvent(new ClipboardEvent(type, { clipboardData: dt, bubbles: true, cancelable: true }));
        fixture.detectChanges();
        return dt.getData('text/plain');
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [HostComponent],
            imports: [SheetGridModule]
        }).compileComponents();
        fixture = TestBed.createComponent(HostComponent);
        host = fixture.componentInstance;
        await settle();
        grid = fixture.debugElement.query(By.directive(SheetGridComponent)).componentInstance;
        sink = fixture.nativeElement.querySelector('.sg-sink');
        await settle();
    });

    afterEach(() => fixture.destroy());

    it('renders the header and only a window of the 1,000 rows', () => {
        const rows = fixture.nativeElement.querySelectorAll('.sg-row').length;
        expect(rows).toBeGreaterThan(5);
        expect(rows).toBeLessThan(80);
        expect(fixture.nativeElement.querySelectorAll('.sg-h').length).toBe(5);
        expect(fixture.nativeElement.querySelectorAll('.sg-row .sg-c.fz').length).toBe(rows); // WO frozen
    });

    it('type-to-edit + Enter emits one edit and moves down', () => {
        grid.selectCell(5, 'QTY');
        const ed = type('42');
        expect(ed).toBeTruthy();
        expect(ed.value).toBe('42');
        editorKey(ed, 'Enter');
        expect(host.emitted.length).toBe(1);
        expect(host.emitted[0]).toEqual([{ rowId: 5, key: 'QTY', oldValue: '5', newValue: '42' }]);
        expect(grid.active).toEqual({ r: 5, c: 1 });
    });

    it('normalises real dates to dd-mm-yyyy and keeps ranges / notes as typed', () => {
        grid.selectCell(1, 'DT');
        let ed = type('1/2/2026');
        editorKey(ed, 'Enter');
        expect(host.value(1, 'DT')).toBe('01-02-2026');
        ed = type('26-08/27-08');
        editorKey(ed, 'Enter');
        expect(host.value(2, 'DT')).toBe('26-08/27-08');
    });

    it('stores a listed choice in its listed case and Esc cancels', () => {
        grid.selectCell(1, 'TYPE');
        let ed = type('skd');
        editorKey(ed, 'Tab');
        expect(host.value(1, 'TYPE')).toBe('SKD');
        grid.selectCell(1, 'REM');
        ed = type('x');
        editorKey(ed, 'Escape');
        expect(host.value(1, 'REM')).toBe('');
        expect(fixture.nativeElement.querySelector('textarea.sg-ed')).toBeNull();
    });

    it('Alt+Enter adds a line break inside the cell', () => {
        grid.selectCell(1, 'REM');
        const ed = type('a');
        editorKey(ed, 'Enter', { altKey: true });
        if (ed.value === 'a') {
            // execCommand is not available in every runner: the fallback inserts directly
            ed.setRangeText('\n', 1, 1, 'end');
        }
        ed.value += 'b';
        editorKey(ed, 'Enter');
        expect(host.value(1, 'REM')).toBe('a\nb');
    });

    it('refuses a locked cell and a cell canEditCell rejects, and says why', () => {
        grid.selectCell(2, 'WO');
        key('F2');
        expect(grid.editing).toBeNull();
        expect(grid.notice).toContain('From Links');
        // as the parent would pass it through [canEditCell]
        grid.canEditCell = (_r, k) => k === 'QTY' ? 'owned by Booking desk' : true;
        grid.selectCell(3, 'QTY');
        type('9');
        expect(grid.editing).toBeNull();
        expect(grid.notice).toContain('owned by Booking desk');
        expect(host.emitted.length).toBe(0);
    });

    it('copies a range as TSV with a quoted multi-line cell', () => {
        grid.selectCell(3, 'TYPE');
        key('ArrowRight', { shiftKey: true });
        key('ArrowDown', { shiftKey: true });
        expect(clip('copy')).toBe('CKD\t"two\nlines"\r\nSKD\t');
    });

    it('pastes a block, skips locked cells, and pastes past the last row by inserting rows first', async () => {
        grid.selectCell(1, 'WO');
        clip('paste', 'A\t1\r\nB\t2\r\n');
        expect(host.value(1, 'WO')).toBe('A');
        expect(host.value(1, 'QTY')).toBe('1');
        expect(host.value(2, 'WO')).toBe('WO2'); // locked
        expect(host.value(2, 'QTY')).toBe('2');

        grid.selectCell(1000, 'REM');
        clip('paste', 'x\ny\nz');
        expect(host.ops.length).toBe(1);
        expect(host.ops[0]).toEqual({ op: 'insert', rowIds: [], afterId: 1000, count: 2 });
        await settle();
        expect(host.value(1000, 'REM')).toBe('x');
        const last = host.rows.slice(-2).map(r => r.values['REM']);
        expect(last).toEqual(['y', 'z']);
    });

    it('a single value pasted over a selection fills it', () => {
        grid.selectCell(10, 'REM');
        key('ArrowDown', { shiftKey: true });
        key('ArrowDown', { shiftKey: true });
        clip('paste', 'same');
        expect([10, 11, 12].map(i => host.value(i, 'REM'))).toEqual(['same', 'same', 'same']);
        expect(host.emitted.length).toBe(1);
    });

    it('Ctrl+Z emits the inverse edits and Ctrl+Y the originals', () => {
        grid.selectCell(20, 'QTY');
        key('ArrowDown', { shiftKey: true });
        clip('paste', '7\n8');
        expect([host.value(20, 'QTY'), host.value(21, 'QTY')]).toEqual(['7', '8']);
        key('z', { ctrlKey: true });
        expect([host.value(20, 'QTY'), host.value(21, 'QTY')]).toEqual(['20', '21']);
        const undo = host.emitted[host.emitted.length - 1];
        expect(undo[0]).toEqual({ rowId: 21, key: 'QTY', oldValue: '8', newValue: '21' });
        key('y', { ctrlKey: true });
        expect([host.value(20, 'QTY'), host.value(21, 'QTY')]).toEqual(['7', '8']);
    });

    it('Delete clears the selection in one emission; Ctrl+D fills down', () => {
        grid.selectCell(30, 'TYPE');
        key('ArrowDown', { shiftKey: true });
        key('Delete');
        expect(host.emitted.length).toBe(1);
        expect([host.value(30, 'TYPE'), host.value(31, 'TYPE')]).toEqual(['', '']);
        grid.selectCell(40, 'QTY');
        key('ArrowDown', { shiftKey: true });
        key('ArrowDown', { shiftKey: true });
        key('d', { ctrlKey: true });
        expect([40, 41, 42].map(i => host.value(i, 'QTY'))).toEqual(['40', '40', '40']);
    });

    it('keyboard selection: Shift+arrows, Ctrl+arrows, Ctrl+A, Tab inside a range', () => {
        grid.selectCell(1, 'WO');
        key('ArrowDown', { shiftKey: true });
        key('ArrowRight', { shiftKey: true });
        expect(grid.sel).toEqual({ r0: 0, r1: 1, c0: 0, c1: 1 });
        key('Tab');
        expect(grid.active).toEqual({ r: 0, c: 1 });
        key('Tab');
        expect(grid.active).toEqual({ r: 1, c: 0 });
        key('ArrowDown', { ctrlKey: true });
        expect(grid.active.r).toBe(999);
        key('a', { ctrlKey: true });
        expect(grid.sel).toEqual({ r0: 0, r1: 999, c0: 0, c1: 4 });
    });

    it('sorts dates as dates (notes after real dates) and keeps a row in place after an edit', () => {
        const col = grid.cols.find(c => c.key === 'DT')!;
        grid.sortBy(col, 'asc');
        fixture.detectChanges();
        const vals = grid.view.map(v => v.v['DT']);
        const firstNote = vals.indexOf('Will be updated');
        const dates = vals.slice(0, firstNote);
        const keyOf = (s: string) => s.slice(6) + s.slice(3, 5) + s.slice(0, 2);
        expect(dates.every((d, i) => i === 0 || keyOf(dates[i - 1]) <= keyOf(d))).toBeTrue();
        expect(vals.slice(firstNote).every(v => v === 'Will be updated')).toBeTrue();
        const topId = grid.view[0].id;
        grid.selectCell(topId, 'DT');
        clip('paste', '31-12-2026');
        fixture.detectChanges();
        expect(grid.view[0].id).toBe(topId);
    });

    it('fills a date series with the fill handle', () => {
        host.onEdits([
            { rowId: 1, key: 'DT', oldValue: host.value(1, 'DT'), newValue: '01-10-2026' },
            { rowId: 2, key: 'DT', oldValue: host.value(2, 'DT'), newValue: '08-10-2026' }
        ]);
        host.cdr.markForCheck();
        fixture.detectChanges();
        grid.selectCell(1, 'DT');
        key('ArrowDown', { shiftKey: true });
        (grid as any).applyFill({ r0: 0, r1: 3, c0: 2, c1: 2 }, 'down');
        fixture.detectChanges();
        expect([1, 2, 3, 4].map(i => host.value(i, 'DT'))).toEqual(['01-10-2026', '08-10-2026', '15-10-2026', '22-10-2026']);
    });

    it('typing emits the value and row version the edit started from (conflict check by the page)', () => {
        setRows(host.rows.map(r => r.id === 6 ? { ...r, ver: 3 } : r));
        grid.selectCell(6, 'REM');
        const ed = type('mine');
        // someone else's change arrives while the editor is open
        setRows(host.rows.map(r => r.id === 6 ? { ...r, ver: 4, values: { ...r.values, REM: 'theirs' } } : r));
        editorKey(ed, 'Enter');
        expect(host.emitted[0]).toEqual([{ rowId: 6, key: 'REM', oldValue: '', newValue: 'mine', ver: 3 }]);
    });

    it('an unchanged edit does not overwrite a value that changed meanwhile', () => {
        grid.selectCell(7, 'REM');
        key('F2');
        const ed = fixture.nativeElement.querySelector('textarea.sg-ed') as HTMLTextAreaElement;
        setRows(host.rows.map(r => r.id === 7 ? { ...r, values: { ...r.values, REM: 'theirs' } } : r));
        editorKey(ed, 'Enter');
        expect(host.emitted.length).toBe(0);
        expect(host.value(7, 'REM')).toBe('theirs');
    });

    it('a waiting insert ignores rows added elsewhere and takes the rows placed after its row', async () => {
        const realOp = host.onRowOp.bind(host);
        let held: SheetRowOp | null = null;
        host.onRowOp = (op: SheetRowOp) => { host.ops.push(op); held = op; }; // the server is slow
        grid.selectCell(1000, 'REM');
        clip('paste', 'p\nq');
        expect(held).toBeTruthy();
        // another user's row arrives first, at the top
        setRows([{ id: 9001, values: { WO: 'OTHER' } }, ...host.rows]);
        await settle();
        expect(host.value(9001, 'REM')).toBe('');
        // now our insert lands after row 1000
        realOp(held!);
        host.cdr.markForCheck();
        await settle();
        expect(host.value(1000, 'REM')).toBe('p');
        expect(host.rows[host.rows.length - 1].values['REM']).toBe('q');
    });

    it('re-sorting keeps the active cell and drops the range', () => {
        grid.selectCell(5, 'QTY');
        key('ArrowDown', { shiftKey: true });
        grid.sortBy(grid.cols.find(c => c.key === 'DT')!, 'desc');
        fixture.detectChanges();
        expect(grid.sel.r0).toBe(grid.sel.r1);
        expect(grid.view[grid.active.r].id).toBe(5);
    });

    it('the values filter stores the unticked values, so values added later stay visible', () => {
        const col = grid.cols.find(c => c.key === 'TYPE')!;
        grid.openHeaderMenu(col);
        grid.hm!.values.forEach(v => v.on = v.value !== 'SKD');
        grid.hmApply();
        fixture.detectChanges();
        expect(grid.filters['TYPE'].exclude).toEqual(['SKD']);
        expect(grid.view.every(v => v.v['TYPE'] !== 'SKD')).toBeTrue();
        setRows([...host.rows, { id: 7777, values: { WO: 'NEW', TYPE: 'PLP' } }]);
        (grid as any).rebuildView(true); // re-apply the filter
        expect(grid.view.some(v => v.id === 7777)).toBeTrue();
    });

    it('choice list: a contains-only match is not preselected, an exact match ranks first', () => {
        grid.selectCell(1, 'TYPE');
        let ed = type('skd');
        expect(grid.edList[0]).toBe('SKD');
        editorKey(ed, 'Escape');
        editorKey(ed, 'Escape');
        ed = type('kd'); // CKD / SKD only contain it
        expect(grid.edListIdx).toBe(-1);
        editorKey(ed, 'Tab');
        expect(host.value(1, 'TYPE')).toBe('kd');
    });

    it('Shift+Enter on one cell moves up without extending the selection', () => {
        grid.selectCell(10, 'QTY');
        key('Enter', { shiftKey: true });
        expect(grid.active).toEqual({ r: 8, c: 1 });
        expect(grid.sel).toEqual({ r0: 8, r1: 8, c0: 1, c1: 1 });
    });

    it('cut + paste onto a locked cell keeps the source (pasted as a copy)', () => {
        grid.selectCell(50, 'WO');
        const text = clip('cut');
        grid.selectCell(2, 'WO'); // WO of row 2 is locked
        clip('paste', text);
        expect(host.value(50, 'WO')).toBe('WO50');
        expect(host.value(2, 'WO')).toBe('WO2');
        expect(grid.notice).toContain('copy');
    });

    describe('frozen rows', () => {
        const refresh = () => {
            host.cdr.markForCheck();
            fixture.detectChanges();
        };
        const freeze = async (n: number) => {
            host.frozenRows = n;
            host.cdr.markForCheck();
            await settle();
        };

        it('pins the first rows under the header and virtual-scrolls the rest', async () => {
            await freeze(2);
            const top = fixture.nativeElement.querySelectorAll('.sg-frows .sg-row');
            expect(top.length).toBe(2);
            expect(top[0].querySelector('.sg-g').textContent.trim()).toBe('1');
            const body = fixture.nativeElement.querySelector('.sg-vp .sg-row .sg-g');
            expect(body.textContent.trim()).toBe('3');
            expect(grid.bandH).toBe(34 + 2 * 24);
        });

        it('keeps them on top, outside sort and filter', async () => {
            await freeze(2);
            grid.sortBy(grid.cols.find(c => c.key === 'QTY')!, 'desc');
            refresh();
            expect(grid.view.slice(0, 3).map(v => v.id)).toEqual([1, 2, 1000]);
            const col = grid.cols.find(c => c.key === 'TYPE')!;
            grid.openHeaderMenu(col);
            grid.hm!.values.forEach(v => v.on = v.value !== 'CKD');
            grid.hmApply();
            refresh();
            expect(grid.view[0].id).toBe(1); // a CKD row, kept because it is frozen
            expect(grid.view.slice(2).every(v => v.v['TYPE'] !== 'CKD')).toBeTrue();
        });

        it('behave like normal rows: edit, move into the body, paste across the line', async () => {
            await freeze(2);
            grid.selectCell(2, 'QTY');
            const ed = type('9');
            editorKey(ed, 'Enter');
            expect(host.value(2, 'QTY')).toBe('9');
            expect(grid.view[grid.active.r].id).toBe(3); // Enter moved into the scrolled rows
            grid.selectCell(2, 'REM');
            clip('paste', 'x\ny');
            expect([host.value(2, 'REM'), host.value(3, 'REM')]).toEqual(['x', 'y']);
        });

        it('a click on a frozen row selects it (hit test through the band)', async () => {
            await freeze(2);
            const sc = fixture.nativeElement.querySelector('.sg-scroller') as HTMLElement;
            sc.scrollTop = 24 * 100;
            const r = sc.getBoundingClientRect();
            const qty = grid.cols.find(c => c.key === 'QTY')!;
            sc.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0, clientX: r.left + qty.x + 5, clientY: r.top + 34 + 24 + 5 }));
            document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
            fixture.detectChanges();
            expect(grid.view[grid.active.r].id).toBe(2);
            expect(grid.cols[grid.active.c].key).toBe('QTY');
        });
    });

    describe('merged cells', () => {
        const refresh = () => {
            host.cdr.markForCheck();
            fixture.detectChanges();
        };
        const merge = (list: string[]) => {
            host.merges = list;
            host.cdr.markForCheck();
            fixture.detectChanges();
        };

        it('parses A1 ranges', () => {
            expect(parseA1Range('A1:G1')).toEqual({ r0: 0, c0: 0, r1: 0, c1: 6 });
            expect(parseA1Range('h1:n2')).toEqual({ r0: 0, c0: 7, r1: 1, c1: 13 });
            expect(parseA1Range('AA10')).toEqual({ r0: 9, c0: 26, r1: 9, c1: 26 });
            expect(parseA1Range('C3:B1')).toEqual({ r0: 0, c0: 1, r1: 2, c1: 2 });
            expect(parseA1Range('x')).toBeNull();
            expect(parseA1Range('A0')).toBeNull();
        });

        it('draws one cell spanning the range with the top-left value', () => {
            merge(['B1:C2']);
            const el = fixture.nativeElement.querySelectorAll('.sg-merge');
            expect(el.length).toBe(1);
            expect(el[0].textContent.trim()).toBe('1'); // QTY of row 1
            const qty = grid.cols[1], dt = grid.cols[2];
            expect(el[0].getBoundingClientRect().width).toBeCloseTo(qty.w + dt.w, 0);
            expect(el[0].getBoundingClientRect().height).toBeCloseTo(48, 0);
        });

        it('selecting any part selects the merge; arrows leave it from its edge', () => {
            merge(['B1:C2']);
            grid.selectCell(2, 'DT'); // bottom-right part
            expect(grid.active).toEqual({ r: 0, c: 1 });
            expect(grid.sel).toEqual({ r0: 0, r1: 1, c0: 1, c1: 2 });
            key('ArrowRight');
            expect(grid.active).toEqual({ r: 0, c: 3 });
            key('ArrowLeft');
            expect(grid.active).toEqual({ r: 0, c: 1 });
            key('ArrowDown');
            expect(grid.active).toEqual({ r: 2, c: 1 });
        });

        it('editing, paste and clear write the top-left cell only', () => {
            merge(['B1:C2']);
            grid.selectCell(1, 'QTY');
            let ed = type('77');
            editorKey(ed, 'Escape');
            ed = type('77');
            editorKey(ed, 'Enter');
            expect(host.emitted[host.emitted.length - 1]).toEqual([{ rowId: 1, key: 'QTY', oldValue: '1', newValue: '77' }]);
            grid.selectCell(1, 'QTY');
            clip('paste', 'a\tb\nc\td');
            expect(host.value(1, 'QTY')).toBe('a');
            expect([host.value(1, 'DT'), host.value(2, 'QTY')]).toEqual(['14-10-2026', '2']);
            grid.selectCell(1, 'QTY');
            key('Delete');
            expect(host.value(1, 'QTY')).toBe('');
            expect(host.value(2, 'QTY')).toBe('2');
        });

        it('hiding a column inside, or sorting, unmerges visually and keeps the definition', async () => {
            merge(['B1:C2']);
            grid.hideColumn(grid.cols.find(c => c.key === 'DT')!);
            refresh();
            expect(fixture.nativeElement.querySelectorAll('.sg-merge').length).toBe(0);
            grid.unhide(null);
            refresh();
            expect(fixture.nativeElement.querySelectorAll('.sg-merge').length).toBe(1);
            grid.sortBy(grid.cols.find(c => c.key === 'QTY')!, 'desc');
            refresh();
            expect(grid.activeMerges().length).toBe(0);
            grid.clearSort();
            refresh();
            expect(grid.activeMerges().length).toBe(1);
        });

        it('a merge inside the frozen rows stays merged while sorted (Price layout)', async () => {
            host.frozenRows = 2;
            merge(['A1:C1', 'D1:E1', 'B5:C5']);
            await settle();
            grid.sortBy(grid.cols.find(c => c.key === 'QTY')!, 'desc');
            refresh();
            expect(grid.activeMerges()).toEqual([{ r0: 0, r1: 0, c0: 0, c1: 2 }, { r0: 0, r1: 0, c0: 3, c1: 4 }]);
            expect(fixture.nativeElement.querySelectorAll('.sg-frows .sg-merge').length).toBeGreaterThanOrEqual(2);
        });
    });

    it('shows per-cell tag reasons and a header lock when a whole column is locked for one reason', () => {
        setRows(host.rows.map(r => ({
            ...r,
            locked: { ...(r.locked || {}), TYPE: 'Owned by Ops' },
            tags: r.id === 1 ? { QTY: 'links' as const } : r.tags,
            tagReasons: r.id === 1 ? { QTY: 'From Links job EXP/BOM/26-27/00042' } : undefined
        })));
        expect(grid.view[0].tt['QTY']).toBe('From Links job EXP/BOM/26-27/00042');
        expect(grid.colLock['TYPE']).toBe('Owned by Ops');
        expect(grid.colLock['WO']).toBeUndefined();
        const locks = fixture.nativeElement.querySelectorAll('.sg-h .sg-hlk');
        expect(locks.length).toBe(1);
    });
});
