/*  Clipboard text for Excel / Google Sheets.
    Both put tab-separated text on the clipboard (text/plain). Rows end with CRLF (Excel)
    or LF (Sheets), a cell holding a tab, a line break or a double quote is wrapped in
    double quotes with inner quotes doubled (RFC 4180 style), and Excel ends the block
    with one extra line break.                                                        */

/**
 * Parses clipboard text into a rectangular block (short rows are padded with '').
 * - CRLF, LF and CR line endings; line breaks inside quoted cells stay as '\n'
 * - one trailing line break (Excel) is ignored, so "a\r\n" is one cell
 * - a quote that does not open a proper quoted cell is kept as typed (5" pipe, "abc)
 */
export function parseTsv(text: string | null | undefined): string[][] {
    if (text === null || text === undefined || text === '') {
        return [];
    }
    const rows: string[][] = [];
    const n = text.length;
    let row: string[] = [];
    let i = 0;
    while (true) {
        let field: string;
        let j = i;
        let quoted = false;
        if (text.charCodeAt(i) === 34 /* " */) {
            // try a quoted field: up to a closing quote followed by tab / line break / end
            let buf = '';
            let k = i + 1;
            let from = k;
            let ok = false;
            while (k < n) {
                const q = text.indexOf('"', k);
                if (q < 0) {
                    break;
                }
                if (text.charCodeAt(q + 1) === 34) {
                    buf += text.slice(from, q) + '"';
                    k = q + 2;
                    from = k;
                    continue;
                }
                const after = q + 1 < n ? text.charAt(q + 1) : '';
                if (after === '' || after === '\t' || after === '\n' || after === '\r') {
                    buf += text.slice(from, q);
                    j = q + 1;
                    ok = true;
                }
                break;
            }
            if (ok) {
                field = buf.replace(/\r\n?/g, '\n');
                quoted = true;
            } else {
                field = '';
            }
        } else {
            field = '';
        }
        if (!quoted) {
            j = i;
            while (j < n) {
                const ch = text.charCodeAt(j);
                if (ch === 9 || ch === 10 || ch === 13) {
                    break;
                }
                j++;
            }
            field = text.slice(i, j);
        }
        row.push(field);
        if (j >= n) {
            rows.push(row);
            break;
        }
        const d = text.charCodeAt(j);
        if (d === 9) {
            i = j + 1;
            continue;
        }
        // line break
        rows.push(row);
        row = [];
        i = j + (d === 13 && text.charCodeAt(j + 1) === 10 ? 2 : 1);
        if (i >= n) {
            break; // trailing line break: no extra empty row
        }
    }
    let width = 0;
    for (const r of rows) {
        if (r.length > width) {
            width = r.length;
        }
    }
    for (const r of rows) {
        while (r.length < width) {
            r.push('');
        }
    }
    return rows;
}

export function quoteTsvField(v: string | null | undefined): string {
    const s = v === null || v === undefined ? '' : String(v);
    return /[\t\r\n"]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

/**
 * Block -> clipboard text: tabs between cells, CRLF between rows, no trailing line break -
 * except when the last row is one empty cell: then a CRLF is added (as Excel does), because
 * the parser drops one trailing line break and the empty last row would be lost.
 */
export function toTsv(block: string[][]): string {
    const text = block.map(r => r.map(quoteTsvField).join('\t')).join('\r\n');
    const last = block.length ? block[block.length - 1] : null;
    return last && last.length <= 1 && !(last[0] || '') ? text + '\r\n' : text;
}

function escHtml(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Block -> a plain HTML table (text/html flavour, keeps multi-line cells as <br>). */
export function toHtmlTable(block: string[][]): string {
    const body = block.map(r => '<tr>' + r.map(v =>
        '<td style="white-space:pre-wrap">' + escHtml(v || '').replace(/\n/g, '<br>') + '</td>').join('') + '</tr>').join('');
    return '<meta charset="utf-8"><table><tbody>' + body + '</tbody></table>';
}
