const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function pad2(n: number): string {
    return n < 10 ? '0' + n : '' + n;
}

export function formatMyDate(date: Date, format: string): string {
    if (!date) { return ''; }
    const fmt = format || 'dd/mm/yyyy';
    const dd = pad2(date.getDate());
    const mm = pad2(date.getMonth() + 1);
    const mmm = MONTH_ABBR[date.getMonth()];
    const yyyy = String(date.getFullYear());
    return fmt
        .replace(/yyyy/i, yyyy)
        .replace(/mmm/i, mmm)
        .replace(/mm/i, mm)
        .replace(/dd/i, dd);
}

export function parseMyDate(value: string, format: string): Date | null {
    if (!value) { return null; }
    const fmt = format || 'dd/mm/yyyy';
    const sep = fmt.indexOf('-') >= 0 ? '-' : '/';
    const fmtParts = fmt.split(sep);
    const valParts = value.split(sep);
    if (fmtParts.length !== 3 || valParts.length !== 3) { return null; }
    let day = NaN;
    let month = NaN;
    let year = NaN;
    for (let i = 0; i < 3; i++) {
        const token = fmtParts[i].toLowerCase();
        const part = valParts[i];
        if (token === 'dd') { day = parseInt(part, 10); }
        else if (token === 'mmm') { month = MONTH_ABBR.findIndex(m => m.toLowerCase() === part.toLowerCase()); }
        else if (token === 'mm') { month = parseInt(part, 10) - 1; }
        else if (token === 'yyyy') { year = parseInt(part, 10); }
    }
    if (isNaN(day) || isNaN(year) || isNaN(month) || month < 0) { return null; }
    const d = new Date(year, month, day);
    return isNaN(d.getTime()) ? null : d;
}

export function toMomentFormat(format: string): string {
    const fmt = format || 'dd/mm/yyyy';
    return fmt
        .replace(/yyyy/i, 'YYYY')
        .replace(/mmm/i, 'MMM')
        .replace(/mm/i, 'MM')
        .replace(/dd/i, 'DD');
}
