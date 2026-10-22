import {
    CellPos, CellRange, clamp, clampPos, clampRange, edgeJump, fillTarget, inRange, isSingleCell, isWholeCols,
    isWholeRows, moveWithin, pasteSize, rangeCells, rangeCols, rangeOf, rangeRows, sameRange
} from './sheet-selection';

const R = (r0: number, c0: number, r1: number, c1: number): CellRange => ({ r0, c0, r1, c1 });
const P = (r: number, c: number): CellPos => ({ r, c });

describe('sheet-selection', () => {

    describe('rangeOf', () => {
        it('normalises a drag from top-left to bottom-right', () => {
            expect(rangeOf(P(1, 2), P(4, 6))).toEqual(R(1, 2, 4, 6));
        });

        it('normalises a drag from bottom-right to top-left', () => {
            expect(rangeOf(P(4, 6), P(1, 2))).toEqual(R(1, 2, 4, 6));
        });

        it('normalises a drag from top-right to bottom-left and the other diagonal', () => {
            expect(rangeOf(P(1, 6), P(4, 2))).toEqual(R(1, 2, 4, 6));
            expect(rangeOf(P(4, 2), P(1, 6))).toEqual(R(1, 2, 4, 6));
        });

        it('gives a single cell for equal corners', () => {
            expect(rangeOf(P(3, 3), P(3, 3))).toEqual(R(3, 3, 3, 3));
        });

        it('gives a single row or column', () => {
            expect(rangeOf(P(2, 0), P(2, 5))).toEqual(R(2, 0, 2, 5));
            expect(rangeOf(P(0, 3), P(7, 3))).toEqual(R(0, 3, 7, 3));
        });

        it('does not depend on the argument order', () => {
            const a = P(9, 1);
            const b = P(2, 8);
            expect(rangeOf(a, b)).toEqual(rangeOf(b, a));
        });
    });

    describe('range helpers', () => {
        const g = R(2, 3, 5, 7);

        it('inRange is inclusive on every edge', () => {
            expect(inRange(g, 2, 3)).toBe(true);
            expect(inRange(g, 5, 7)).toBe(true);
            expect(inRange(g, 2, 7)).toBe(true);
            expect(inRange(g, 5, 3)).toBe(true);
            expect(inRange(g, 3, 5)).toBe(true);
        });

        it('inRange is false just outside', () => {
            expect(inRange(g, 1, 5)).toBe(false);
            expect(inRange(g, 6, 5)).toBe(false);
            expect(inRange(g, 3, 2)).toBe(false);
            expect(inRange(g, 3, 8)).toBe(false);
        });

        it('inRange is false for a null range', () => {
            expect(inRange(null, 0, 0)).toBe(false);
        });

        it('counts rows, columns and cells', () => {
            expect(rangeRows(g)).toBe(4);
            expect(rangeCols(g)).toBe(5);
            expect(rangeCells(g)).toBe(20);
            expect(rangeCells(R(0, 0, 0, 0))).toBe(1);
        });

        it('isSingleCell', () => {
            expect(isSingleCell(R(1, 1, 1, 1))).toBe(true);
            expect(isSingleCell(R(1, 1, 1, 2))).toBe(false);
            expect(isSingleCell(R(1, 1, 2, 1))).toBe(false);
        });

        it('sameRange compares all four edges and is false for nulls', () => {
            expect(sameRange(R(1, 2, 3, 4), R(1, 2, 3, 4))).toBe(true);
            expect(sameRange(R(1, 2, 3, 4), R(0, 2, 3, 4))).toBe(false);
            expect(sameRange(R(1, 2, 3, 4), R(1, 0, 3, 4))).toBe(false);
            expect(sameRange(R(1, 2, 3, 4), R(1, 2, 0, 4))).toBe(false);
            expect(sameRange(R(1, 2, 3, 4), R(1, 2, 3, 0))).toBe(false);
            expect(sameRange(null, R(1, 2, 3, 4))).toBe(false);
            expect(sameRange(R(1, 2, 3, 4), null)).toBe(false);
            expect(sameRange(null, null)).toBe(false);
        });

        it('isWholeRows / isWholeCols', () => {
            expect(isWholeRows(R(2, 0, 4, 9), 10)).toBe(true);
            expect(isWholeRows(R(2, 1, 4, 9), 10)).toBe(false);
            expect(isWholeRows(R(2, 0, 4, 8), 10)).toBe(false);
            expect(isWholeCols(R(0, 3, 19, 5), 20)).toBe(true);
            expect(isWholeCols(R(1, 3, 19, 5), 20)).toBe(false);
            expect(isWholeCols(R(0, 3, 18, 5), 20)).toBe(false);
        });
    });

    describe('clamp helpers', () => {
        it('clamp keeps a value within the bounds', () => {
            expect(clamp(5, 0, 10)).toBe(5);
            expect(clamp(-1, 0, 10)).toBe(0);
            expect(clamp(11, 0, 10)).toBe(10);
            expect(clamp(0, 0, 10)).toBe(0);
            expect(clamp(10, 0, 10)).toBe(10);
        });

        it('clampPos keeps a position inside the grid', () => {
            expect(clampPos(P(5, 2), 10, 4)).toEqual(P(5, 2));
            expect(clampPos(P(-3, -1), 10, 4)).toEqual(P(0, 0));
            expect(clampPos(P(50, 50), 10, 4)).toEqual(P(9, 3));
        });

        it('clampPos on an empty grid gives (0, 0)', () => {
            expect(clampPos(P(5, 5), 0, 0)).toEqual(P(0, 0));
        });

        it('clampRange clips to the grid and keeps the range normalised', () => {
            expect(clampRange(R(-3, -1, 100, 50), 10, 5)).toEqual(R(0, 0, 9, 4));
            expect(clampRange(R(2, 1, 3, 2), 10, 5)).toEqual(R(2, 1, 3, 2));
            expect(clampRange(R(8, 3, 20, 9), 10, 5)).toEqual(R(8, 3, 9, 4));
        });

        it('clampRange of a range wholly outside collapses onto the edge', () => {
            expect(clampRange(R(20, 20, 30, 30), 10, 5)).toEqual(R(9, 4, 9, 4));
        });
    });

    describe('moveWithin (Tab / Enter inside a multi-cell selection)', () => {
        // 2 rows (1..2) x 3 columns (1..3)
        const g = R(1, 1, 2, 3);

        describe('right (Tab)', () => {
            it('moves one cell right', () => {
                expect(moveWithin(g, P(1, 1), 'right')).toEqual(P(1, 2));
                expect(moveWithin(g, P(2, 2), 'right')).toEqual(P(2, 3));
            });

            it('wraps to the first column of the next row at the right edge', () => {
                expect(moveWithin(g, P(1, 3), 'right')).toEqual(P(2, 1));
            });

            it('wraps to the top-left cell from the bottom-right cell', () => {
                expect(moveWithin(g, P(2, 3), 'right')).toEqual(P(1, 1));
            });
        });

        describe('left (Shift+Tab)', () => {
            it('moves one cell left', () => {
                expect(moveWithin(g, P(1, 3), 'left')).toEqual(P(1, 2));
                expect(moveWithin(g, P(2, 2), 'left')).toEqual(P(2, 1));
            });

            it('wraps to the last column of the previous row at the left edge', () => {
                expect(moveWithin(g, P(2, 1), 'left')).toEqual(P(1, 3));
            });

            it('wraps to the bottom-right cell from the top-left cell', () => {
                expect(moveWithin(g, P(1, 1), 'left')).toEqual(P(2, 3));
            });
        });

        describe('down (Enter)', () => {
            it('moves one cell down', () => {
                expect(moveWithin(g, P(1, 2), 'down')).toEqual(P(2, 2));
            });

            it('wraps to the top of the next column at the bottom edge', () => {
                expect(moveWithin(g, P(2, 1), 'down')).toEqual(P(1, 2));
                expect(moveWithin(g, P(2, 2), 'down')).toEqual(P(1, 3));
            });

            it('wraps to the top-left cell from the bottom-right cell', () => {
                expect(moveWithin(g, P(2, 3), 'down')).toEqual(P(1, 1));
            });
        });

        describe('up (Shift+Enter)', () => {
            it('moves one cell up', () => {
                expect(moveWithin(g, P(2, 2), 'up')).toEqual(P(1, 2));
            });

            it('wraps to the bottom of the previous column at the top edge', () => {
                expect(moveWithin(g, P(1, 3), 'up')).toEqual(P(2, 2));
                expect(moveWithin(g, P(1, 2), 'up')).toEqual(P(2, 1));
            });

            it('wraps to the bottom-right cell from the top-left cell', () => {
                expect(moveWithin(g, P(1, 1), 'up')).toEqual(P(2, 3));
            });
        });

        it('visits every cell exactly once going right, then comes back to the start', () => {
            const seen: string[] = [];
            let p = P(1, 1);
            for (let i = 0; i < 6; i++) {
                seen.push(p.r + ',' + p.c);
                p = moveWithin(g, p, 'right');
            }
            expect(seen).toEqual(['1,1', '1,2', '1,3', '2,1', '2,2', '2,3']);
            expect(p).toEqual(P(1, 1));
        });

        it('visits every cell exactly once going down, column by column', () => {
            const seen: string[] = [];
            let p = P(1, 1);
            for (let i = 0; i < 6; i++) {
                seen.push(p.r + ',' + p.c);
                p = moveWithin(g, p, 'down');
            }
            expect(seen).toEqual(['1,1', '2,1', '1,2', '2,2', '1,3', '2,3']);
            expect(p).toEqual(P(1, 1));
        });

        it('left is the exact reverse of right and up of down', () => {
            for (let r = 1; r <= 2; r++) {
                for (let c = 1; c <= 3; c++) {
                    expect(moveWithin(g, moveWithin(g, P(r, c), 'right'), 'left')).toEqual(P(r, c));
                    expect(moveWithin(g, moveWithin(g, P(r, c), 'down'), 'up')).toEqual(P(r, c));
                }
            }
        });

        it('wraps inside a single-row selection', () => {
            const row = R(4, 2, 4, 5);
            expect(moveWithin(row, P(4, 5), 'right')).toEqual(P(4, 2));
            expect(moveWithin(row, P(4, 2), 'left')).toEqual(P(4, 5));
            // Enter in a single row cycles through the columns
            expect(moveWithin(row, P(4, 3), 'down')).toEqual(P(4, 4));
            expect(moveWithin(row, P(4, 5), 'down')).toEqual(P(4, 2));
        });

        it('wraps inside a single-column selection', () => {
            const col = R(1, 6, 4, 6);
            expect(moveWithin(col, P(4, 6), 'down')).toEqual(P(1, 6));
            expect(moveWithin(col, P(1, 6), 'up')).toEqual(P(4, 6));
            // Tab in a single column cycles through the rows
            expect(moveWithin(col, P(2, 6), 'right')).toEqual(P(3, 6));
            expect(moveWithin(col, P(4, 6), 'right')).toEqual(P(1, 6));
        });

        it('stays on a single cell in every direction', () => {
            const one = R(3, 3, 3, 3);
            for (const dir of ['right', 'left', 'down', 'up'] as const) {
                expect(moveWithin(one, P(3, 3), dir)).toEqual(P(3, 3));
            }
        });

        it('does not mutate the position', () => {
            const p = P(1, 3);
            moveWithin(g, p, 'right');
            expect(p).toEqual(P(1, 3));
        });
    });

    describe('edgeJump (Ctrl+arrow)', () => {
        /** grid of strings, '' = empty */
        function jumper(grid: string[][]) {
            const nRows = grid.length;
            const nCols = grid[0].length;
            const isEmpty = (r: number, c: number) => grid[r][c] === '';
            return (r: number, c: number, dr: number, dc: number) => edgeJump(P(r, c), dr, dc, nRows, nCols, isEmpty);
        }

        // one column, 10 rows:   0 a | 1 b | 2 c | 3 _ | 4 _ | 5 d | 6 e | 7 _ | 8 f | 9 _
        const col = ['a', 'b', 'c', '', '', 'd', 'e', '', 'f', ''].map(v => [v]);
        const down = jumper(col);

        describe('down a column', () => {
            it('filled -> filled: jumps to the end of the run', () => {
                expect(down(0, 0, 1, 0)).toEqual(P(2, 0));
                expect(down(1, 0, 1, 0)).toEqual(P(2, 0));
                expect(down(5, 0, 1, 0)).toEqual(P(6, 0));
            });

            it('filled -> blank: jumps to the next filled cell', () => {
                expect(down(2, 0, 1, 0)).toEqual(P(5, 0));
                expect(down(6, 0, 1, 0)).toEqual(P(8, 0));
            });

            it('blank -> blank: jumps to the next filled cell', () => {
                expect(down(3, 0, 1, 0)).toEqual(P(5, 0));
            });

            it('blank start with a filled neighbour: lands on that neighbour', () => {
                expect(down(4, 0, 1, 0)).toEqual(P(5, 0));
            });

            it('filled -> blank with nothing filled after: jumps to the sheet edge', () => {
                expect(down(8, 0, 1, 0)).toEqual(P(9, 0));
            });

            it('stays put at the edge', () => {
                expect(down(9, 0, 1, 0)).toEqual(P(9, 0));
            });
        });

        describe('up a column', () => {
            it('filled -> filled: jumps to the start of the run', () => {
                expect(down(2, 0, -1, 0)).toEqual(P(0, 0));
                expect(down(6, 0, -1, 0)).toEqual(P(5, 0));
            });

            it('filled -> blank: jumps to the previous filled cell', () => {
                expect(down(5, 0, -1, 0)).toEqual(P(2, 0));
                expect(down(8, 0, -1, 0)).toEqual(P(6, 0));
            });

            it('blank -> blank: jumps to the previous filled cell', () => {
                expect(down(4, 0, -1, 0)).toEqual(P(2, 0));
            });

            it('blank start with a filled neighbour: lands on that neighbour', () => {
                expect(down(9, 0, -1, 0)).toEqual(P(8, 0));
                expect(down(7, 0, -1, 0)).toEqual(P(6, 0));
            });

            it('stays put at the edge', () => {
                expect(down(0, 0, -1, 0)).toEqual(P(0, 0));
            });
        });

        describe('along a row', () => {
            // one row, 6 columns:  a b _ c _ _
            const row = jumper([['a', 'b', '', 'c', '', '']]);

            it('right: run end, then next filled, then the edge', () => {
                expect(row(0, 0, 0, 1)).toEqual(P(0, 1));
                expect(row(0, 1, 0, 1)).toEqual(P(0, 3));
                expect(row(0, 3, 0, 1)).toEqual(P(0, 5));
                expect(row(0, 5, 0, 1)).toEqual(P(0, 5));
            });

            it('left: run start, then previous filled, then the edge', () => {
                expect(row(0, 5, 0, -1)).toEqual(P(0, 3));
                expect(row(0, 3, 0, -1)).toEqual(P(0, 1));
                expect(row(0, 1, 0, -1)).toEqual(P(0, 0));
                expect(row(0, 0, 0, -1)).toEqual(P(0, 0));
            });
        });

        describe('blank areas', () => {
            const empty = jumper([[''], [''], [''], [''], ['']]);

            it('an all-blank column jumps to the far edge', () => {
                expect(empty(2, 0, 1, 0)).toEqual(P(4, 0));
                expect(empty(2, 0, -1, 0)).toEqual(P(0, 0));
            });

            it('an all-blank column stays put on the edge', () => {
                expect(empty(4, 0, 1, 0)).toEqual(P(4, 0));
                expect(empty(0, 0, -1, 0)).toEqual(P(0, 0));
            });
        });

        describe('whole filled areas', () => {
            const full = jumper([['a'], ['b'], ['c'], ['d']]);

            it('a fully filled column jumps to the far end', () => {
                expect(full(0, 0, 1, 0)).toEqual(P(3, 0));
                expect(full(2, 0, 1, 0)).toEqual(P(3, 0));
                expect(full(3, 0, -1, 0)).toEqual(P(0, 0));
            });
        });

        describe('small shapes', () => {
            it('a single filled cell between blanks jumps over the blanks to the next filled cell', () => {
                const j = jumper([['', 'x', '', '', 'y']]);
                expect(j(0, 1, 0, 1)).toEqual(P(0, 4));
                expect(j(0, 4, 0, -1)).toEqual(P(0, 1));
                expect(j(0, 0, 0, 1)).toEqual(P(0, 1));
            });

            it('a filled cell with a filled neighbour at the very edge stops on the edge', () => {
                const j = jumper([['x', 'y']]);
                expect(j(0, 0, 0, 1)).toEqual(P(0, 1));
                expect(j(0, 1, 0, -1)).toEqual(P(0, 0));
            });

            it('a 1x1 grid never moves', () => {
                const j = jumper([['x']]);
                expect(j(0, 0, 1, 0)).toEqual(P(0, 0));
                expect(j(0, 0, 0, 1)).toEqual(P(0, 0));
                expect(j(0, 0, -1, 0)).toEqual(P(0, 0));
                expect(j(0, 0, 0, -1)).toEqual(P(0, 0));
            });
        });

        it('only looks along the pressed direction in a 2D grid', () => {
            const grid = [
                ['a', 'b', ''],
                ['', 'c', 'd'],
                ['e', '', '']
            ];
            const j = jumper(grid);
            expect(j(0, 0, 0, 1)).toEqual(P(0, 1)); // a b _  -> end of run
            expect(j(0, 1, 1, 0)).toEqual(P(1, 1)); // b over c, then blank
            expect(j(1, 1, 0, 1)).toEqual(P(1, 2));
            expect(j(2, 0, -1, 0)).toEqual(P(0, 0)); // e, blank, a -> next filled upward
            expect(j(1, 0, 0, 1)).toEqual(P(1, 1)); // blank start, filled neighbour
        });

        it('never asks isEmpty about a cell outside the grid', () => {
            const seen: string[] = [];
            const isEmpty = (r: number, c: number) => {
                seen.push(r + ',' + c);
                return r === 1; // rows 0 and 2 filled, row 1 blank, grid is 3 x 1
            };
            edgeJump(P(0, 0), 1, 0, 3, 1, isEmpty);
            edgeJump(P(2, 0), 1, 0, 3, 1, isEmpty);
            edgeJump(P(2, 0), -1, 0, 3, 1, isEmpty);
            edgeJump(P(0, 0), -1, 0, 3, 1, isEmpty);
            edgeJump(P(1, 0), 1, 0, 3, 1, isEmpty);
            edgeJump(P(1, 0), -1, 0, 3, 1, isEmpty);
            expect(seen.length).toBeGreaterThan(0);
            for (const s of seen) {
                const [r, c] = s.split(',').map(Number);
                expect(r >= 0 && r < 3 && c === 0).withContext(s).toBe(true);
            }
        });
    });

    describe('pasteSize', () => {
        it('pastes the block once into a single selected cell', () => {
            expect(pasteSize(3, 2, R(4, 4, 4, 4))).toEqual({ rows: 3, cols: 2 });
            expect(pasteSize(1, 1, R(4, 4, 4, 4))).toEqual({ rows: 1, cols: 1 });
        });

        it('fills the whole selection with a single copied value', () => {
            expect(pasteSize(1, 1, R(0, 0, 2, 3))).toEqual({ rows: 3, cols: 4 });
            expect(pasteSize(1, 1, R(2, 1, 2, 5))).toEqual({ rows: 1, cols: 5 });
            expect(pasteSize(1, 1, R(0, 3, 6, 3))).toEqual({ rows: 7, cols: 1 });
        });

        it('tiles the block when the selection is an exact multiple (rows)', () => {
            expect(pasteSize(2, 1, R(0, 0, 3, 0))).toEqual({ rows: 4, cols: 1 });
            expect(pasteSize(2, 1, R(0, 0, 5, 0))).toEqual({ rows: 6, cols: 1 });
        });

        it('tiles the block when the selection is an exact multiple (columns)', () => {
            expect(pasteSize(1, 3, R(0, 0, 0, 5))).toEqual({ rows: 1, cols: 6 });
        });

        it('tiles the block when the selection is an exact multiple in both directions', () => {
            expect(pasteSize(2, 2, R(0, 0, 3, 5))).toEqual({ rows: 4, cols: 6 });
        });

        it('tiles a one-row block down several rows and a one-column block across several columns', () => {
            expect(pasteSize(1, 3, R(0, 0, 1, 2))).toEqual({ rows: 2, cols: 3 });
            expect(pasteSize(3, 1, R(0, 0, 2, 3))).toEqual({ rows: 3, cols: 4 });
        });

        it('pastes once when the selection is not a multiple of the block', () => {
            expect(pasteSize(2, 1, R(0, 0, 2, 0))).toEqual({ rows: 2, cols: 1 });
            expect(pasteSize(2, 2, R(0, 0, 2, 2))).toEqual({ rows: 2, cols: 2 });
            expect(pasteSize(2, 2, R(0, 0, 3, 2))).toEqual({ rows: 2, cols: 2 }); // rows fit, columns do not
            expect(pasteSize(2, 2, R(0, 0, 2, 3))).toEqual({ rows: 2, cols: 2 }); // columns fit, rows do not
        });

        it('pastes once when the selection is smaller than the block', () => {
            expect(pasteSize(3, 2, R(0, 0, 1, 0))).toEqual({ rows: 3, cols: 2 });
            expect(pasteSize(3, 2, R(0, 0, 4, 0))).toEqual({ rows: 3, cols: 2 }); // wide enough in rows only
            expect(pasteSize(2, 4, R(0, 0, 3, 1))).toEqual({ rows: 2, cols: 4 });
        });

        it('pastes exactly the block when the selection has the same size', () => {
            expect(pasteSize(2, 3, R(5, 5, 6, 7))).toEqual({ rows: 2, cols: 3 });
        });

        it('returns the (empty) block size for an empty block', () => {
            expect(pasteSize(0, 0, R(0, 0, 3, 3))).toEqual({ rows: 0, cols: 0 });
        });

        it('does not depend on where the selection sits', () => {
            expect(pasteSize(1, 1, R(10, 10, 11, 11))).toEqual({ rows: 2, cols: 2 });
        });
    });

    describe('fillTarget (fill handle drag)', () => {
        const sel = R(2, 2, 4, 3); // 3 rows x 2 columns

        it('is null while the pointer is inside the selection', () => {
            for (let r = 2; r <= 4; r++) {
                for (let c = 2; c <= 3; c++) {
                    expect(fillTarget(sel, P(r, c))).toBeNull();
                }
            }
        });

        it('extends downward', () => {
            expect(fillTarget(sel, P(7, 3))).toEqual({ range: R(2, 2, 7, 3), dir: 'down' });
            expect(fillTarget(sel, P(5, 2))).toEqual({ range: R(2, 2, 5, 3), dir: 'down' });
        });

        it('extends upward', () => {
            expect(fillTarget(sel, P(0, 2))).toEqual({ range: R(0, 2, 4, 3), dir: 'up' });
            expect(fillTarget(sel, P(1, 3))).toEqual({ range: R(1, 2, 4, 3), dir: 'up' });
        });

        it('extends to the right', () => {
            expect(fillTarget(sel, P(3, 6))).toEqual({ range: R(2, 2, 4, 6), dir: 'right' });
            expect(fillTarget(sel, P(2, 4))).toEqual({ range: R(2, 2, 4, 4), dir: 'right' });
        });

        it('extends to the left', () => {
            expect(fillTarget(sel, P(3, 0))).toEqual({ range: R(2, 0, 4, 3), dir: 'left' });
            expect(fillTarget(sel, P(4, 1))).toEqual({ range: R(2, 1, 4, 3), dir: 'left' });
        });

        it('picks the axis the pointer moved further on: horizontal wins', () => {
            // 2 rows below the selection, 4 columns to the right
            expect(fillTarget(sel, P(6, 7))).toEqual({ range: R(2, 2, 4, 7), dir: 'right' });
            // 1 row above, 3 columns to the left
            expect(fillTarget(sel, P(1, -1))).toEqual({ range: R(2, -1, 4, 3), dir: 'left' });
        });

        it('picks the axis the pointer moved further on: vertical wins', () => {
            // 5 rows below, 1 column to the right
            expect(fillTarget(sel, P(9, 4))).toEqual({ range: R(2, 2, 9, 3), dir: 'down' });
            // 3 rows above, 2 columns to the left
            expect(fillTarget(sel, P(-1, 0))).toEqual({ range: R(-1, 2, 4, 3), dir: 'up' });
        });

        it('prefers the vertical axis on a tie', () => {
            expect(fillTarget(sel, P(6, 5))).toEqual({ range: R(2, 2, 6, 3), dir: 'down' }); // 2 down, 2 right
            expect(fillTarget(sel, P(0, 0))).toEqual({ range: R(0, 2, 4, 3), dir: 'up' }); // 2 up, 2 left
        });

        it('only grows along one axis: the other axis keeps the selection\'s extent', () => {
            const t = fillTarget(sel, P(8, 4))!;
            expect(t.range.c0).toBe(sel.c0);
            expect(t.range.c1).toBe(sel.c1);
            const h = fillTarget(sel, P(3, 9))!;
            expect(h.range.r0).toBe(sel.r0);
            expect(h.range.r1).toBe(sel.r1);
        });

        it('follows the one axis the pointer has left when it is still inside on the other', () => {
            // pointer left of the selection but within its rows -> horizontal
            expect(fillTarget(sel, P(3, 1))).toEqual({ range: R(2, 1, 4, 3), dir: 'left' });
            // pointer below the selection but within its columns -> vertical
            expect(fillTarget(sel, P(5, 3))).toEqual({ range: R(2, 2, 5, 3), dir: 'down' });
        });

        it('works from a single-cell selection', () => {
            const one = R(3, 3, 3, 3);
            expect(fillTarget(one, P(3, 3))).toBeNull();
            expect(fillTarget(one, P(6, 3))).toEqual({ range: R(3, 3, 6, 3), dir: 'down' });
            expect(fillTarget(one, P(3, 0))).toEqual({ range: R(3, 0, 3, 3), dir: 'left' });
            expect(fillTarget(one, P(0, 3))).toEqual({ range: R(0, 3, 3, 3), dir: 'up' });
            expect(fillTarget(one, P(3, 8))).toEqual({ range: R(3, 3, 3, 8), dir: 'right' });
        });

        it('does not mutate the selection', () => {
            const s = R(2, 2, 4, 3);
            fillTarget(s, P(9, 9));
            expect(s).toEqual(R(2, 2, 4, 3));
        });
    });
});
