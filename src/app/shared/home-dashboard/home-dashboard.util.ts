import { Observable } from 'rxjs';

/*  Small helpers shared by the module home dashboards (Import, Import France, Accounts France).
    The Export home predates this file and keeps its own copies.                              */

/*  Local midnight today. */
export function today(): Date {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}

export function addDays(d: Date, days: number): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate() + days);
}

/*  Whole days from b to a (a - b), both taken at midnight. */
export function dayDiff(a: Date, b: Date): number {
    return Math.round((a.getTime() - b.getTime()) / 86400000);
}

/*  dd/MM/yyyy (anything after the date, e.g. a time, is ignored) -> Date, or null.
    Never hand these strings to new Date(): it reads them as MM/dd.                  */
export function parseDmy(s: string): Date {
    const m = /^\s*(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(s || '');
    if (!m) { return null; }
    const d = new Date(+m[3], +m[2] - 1, +m[1]);
    return (d.getMonth() === +m[2] - 1) ? d : null;
}

function pad(n: number): string { return (n < 10 ? '0' : '') + n; }

/*  Date -> dd/MM/yyyy, MM/dd/yyyy or dd/MMM/yyyy, the three formats these APIs expect. */
export function dmy(d: Date): string { return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear(); }
export function mdy(d: Date): string { return pad(d.getMonth() + 1) + '/' + pad(d.getDate()) + '/' + d.getFullYear(); }
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export function dMonY(d: Date): string { return pad(d.getDate()) + '/' + MON[d.getMonth()] + '/' + d.getFullYear(); }

export function num(v: any): number {
    const n = parseFloat(String(v == null ? '' : v).replace(/\s/g, '').replace(',', '.'));
    return isNaN(n) ? 0 : n;
}

/*  Top-n counts (or sums of weight) of a key, largest first. */
export function top<T>(rows: T[], key: (r: T) => string, n: number = 5, weight?: (r: T) => number): { name: string; n: number }[] {
    const m: { [k: string]: number } = {};
    rows.forEach(r => {
        const k = (key(r) || '').trim();
        if (k) { m[k] = (m[k] || 0) + (weight ? weight(r) : 1); }
    });
    return Object.keys(m).map(k => ({ name: k, n: m[k] }))
        .sort((a, b) => b.n - a.n || (a.name < b.name ? -1 : 1))
        .slice(0, n);
}

/*  1 2 … 18 19 around the current page; null marks a gap. */
export function pageLinks(page: number, count: number): number[] {
    const set: number[] = [];
    [1, 2, page - 1, page, page + 1, count - 1, count].forEach(x => {
        if (x >= 1 && x <= count && set.indexOf(x) < 0) { set.push(x); }
    });
    set.sort((a, b) => a - b);
    const out: number[] = [];
    set.forEach((x, i) => {
        if (i > 0 && x - set[i - 1] > 1) { out.push(null); }
        out.push(x);
    });
    return out;
}

/*  Bucket start for a chart: the Monday of the week, or the 1st of the month. */
export function bucketStart(d: Date, monthly: boolean): Date {
    if (monthly) { return new Date(d.getFullYear(), d.getMonth(), 1); }
    const dow = (d.getDay() + 6) % 7;   // Monday = 0
    return addDays(d, -dow);
}

/*  Every bucket between from and to, so empty weeks/months still show as a gap. */
export function buckets(from: Date, to: Date, monthly: boolean): Date[] {
    const out: Date[] = [];
    let b = bucketStart(from, monthly);
    const end = bucketStart(to, monthly).getTime();
    while (b.getTime() <= end) {
        out.push(b);
        b = monthly ? new Date(b.getFullYear(), b.getMonth() + 1, 1) : addDays(b, 7);
    }
    return out;
}

/*  Axis maximum for a bar chart drawn with 4 equal steps (5 tick lines): each step is a round
    number (1, 2, 2.5, 3, 4, 5, 6, 8 x 10^n), so the ticks read 0 10 20 30 40, never
    0 8 15 23 30, and the top stays close to the tallest bar. 2.5 is skipped for small counts
    so a job count never gets a 2.5 tick.                                                     */
export function niceMax(max: number): number {
    const raw = Math.max(1, max) / 4;
    const p = Math.pow(10, Math.floor(Math.log(raw) / Math.LN10));
    const mult = p < 10 ? [1, 2, 3, 4, 5, 6, 8, 10] : [1, 2, 2.5, 3, 4, 5, 6, 8, 10];
    const step = mult.map(s => s * p).find(s => s >= raw) || 10 * p;
    return Math.max(4, step * 4);
}

/*  Chart bucket label: "Sep" for a month, "14 Sep" for a week (fixed English month names -
    toLocaleString gives "Sept" in some browsers).                                           */
export function bucketLabel(b: Date, monthly: boolean): string {
    return monthly ? MON[b.getMonth()] : b.getDate() + ' ' + MON[b.getMonth()];
}

/*  Same rule as the Accounts and Export homes: SA sees everything; anyone else needs View on
    the form. verifyRights only reports - checkVerify (which redirects) is deliberately not used,
    so a user without the right lands on a blank home with a working menu.                    */
export function checkHomeRights(login: any, verify: (formId: string) => Observable<any>, formId: string,
                                done: (ok: boolean) => void) {
    if (login && login.ROLETYPE == 'SA') { done(true); return; }
    verify(formId).subscribe((data: any) => {
        let ok = false;
        if (data && data.Table && data.Table.length > 0 && data.Table[0].STATUS == '100') {
            const v = data.Table[0].viewForm;
            ok = (v == 1 || v === true || v == '1' || v == 'true');
        }
        done(ok);
    }, () => done(false));
}

export function greeting(): string {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : (h < 17 ? 'Good afternoon' : 'Good evening');
}

/*  Look mode shared by the three homes. */
const DARK_KEY = 'MODULE_HOME_DARK';
export function readDark(): boolean { try { return localStorage.getItem(DARK_KEY) == '1'; } catch (e) { return false; } }
export function saveDark(on: boolean) { try { localStorage.setItem(DARK_KEY, on ? '1' : '0'); } catch (e) { } }
