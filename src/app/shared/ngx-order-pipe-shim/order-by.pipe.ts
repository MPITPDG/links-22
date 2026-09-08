import { Pipe, PipeTransform } from '@angular/core';

// Drop-in replacement for ngx-order-pipe's OrderPipe. The logic is copied
// verbatim from the library (v3.0.0) so every existing `| orderBy` usage
// behaves identically -- with ONE deliberate change: the comparison now
// recognises dd/mm/yyyy (and dd/mm/yyyy hh:mm[:ss]) strings and sorts them
// as real dates. Without this, date columns sorted the raw text and ordered
// by day-of-month first (every 31/.. before every 28/.., ignoring the year).
// This matched the old Angular 8 app, so it's a fix, not a regression repair.

// Matches "d/m/yyyy" or "dd/mm/yyyy" with an optional " hh:mm" or " hh:mm:ss".
const DMY_RE = /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/;

// Returns a chronologically-sortable number for a dd/mm/yyyy(+time) string,
// or null if the value isn't such a date string.
function dmyKey(value: any): number | null {
    if (typeof value !== 'string' && !(value instanceof String)) { return null; }
    const m = DMY_RE.exec(String(value).trim());
    if (!m) { return null; }
    const day = +m[1], month = +m[2], year = +m[3];
    const hh = m[4] ? +m[4] : 0, mm = m[5] ? +m[5] : 0, ss = m[6] ? +m[6] : 0;
    if (month < 1 || month > 12 || day < 1 || day > 31) { return null; }
    return Date.UTC(year, month - 1, day, hh, mm, ss);
}

@Pipe({
    name: 'orderBy',
    pure: false,
    standalone: false
})
export class OrderPipe implements PipeTransform {
    static isString(value: any): boolean {
        return typeof value === 'string' || value instanceof String;
    }

    static caseInsensitiveSort(a: any, b: any): number {
        const ka = dmyKey(a), kb = dmyKey(b);
        if (ka !== null && kb !== null) { return ka === kb ? 0 : (ka > kb ? 1 : -1); }
        if (OrderPipe.isString(a) && OrderPipe.isString(b)) {
            return (a as string).localeCompare(b as string);
        }
        return OrderPipe.defaultCompare(a, b);
    }

    static defaultCompare(a: any, b: any): number {
        const ka = dmyKey(a), kb = dmyKey(b);
        if (ka !== null && kb !== null) { return ka === kb ? 0 : (ka > kb ? 1 : -1); }
        if (a && a instanceof Date) { a = a.getTime(); }
        if (b && b instanceof Date) { b = b.getTime(); }
        if (a === b) { return 0; }
        if (a == null) { return 1; }
        if (b == null) { return -1; }
        return a > b ? 1 : -1;
    }

    static parseExpression(expression: string): string[] {
        expression = expression.replace(/\[(\w+)\]/g, '.$1');
        expression = expression.replace(/^\./, '');
        return expression.split('.');
    }

    static getValue(object: any, expression: string[]): any {
        for (let i = 0, n = expression.length; i < n; ++i) {
            if (!object) { return; }
            const k = expression[i];
            if (!(k in object)) { return; }
            object = typeof object[k] === 'function' ? object[k]() : object[k];
        }
        return object;
    }

    static setValue(object: any, value: any, expression: string[]): void {
        let i;
        for (i = 0; i < expression.length - 1; i++) {
            object = object[expression[i]];
        }
        object[expression[i]] = value;
    }

    transform(value: any | any[], expression?: any, reverse?: boolean, isCaseInsensitive: boolean = false, comparator?: Function): any {
        if (!value) { return value; }
        if (Array.isArray(expression)) {
            return this.multiExpressionTransform(value, expression.slice(), reverse, isCaseInsensitive, comparator);
        }
        if (Array.isArray(value)) {
            return this.sortArray(value.slice(), expression, reverse, isCaseInsensitive, comparator);
        }
        if (typeof value === 'object') {
            return this.transformObject(Object.assign({}, value), expression, reverse, isCaseInsensitive, comparator);
        }
        return value;
    }

    private sortArray(array: any[], expression?: any, reverse?: boolean, isCaseInsensitive?: boolean, comparator?: Function): any[] {
        const isDeepLink = expression && expression.indexOf('.') !== -1;
        if (isDeepLink) { expression = OrderPipe.parseExpression(expression); }

        let compareFn: Function;
        if (comparator && typeof comparator === 'function') {
            compareFn = comparator;
        } else {
            compareFn = isCaseInsensitive ? OrderPipe.caseInsensitiveSort : OrderPipe.defaultCompare;
        }

        const sortedArray: any[] = array.sort((a: any, b: any): number => {
            if (!expression) { return compareFn(a, b); }
            if (!isDeepLink) {
                if (a && b) { return compareFn(a[expression], b[expression]); }
                return compareFn(a, b);
            }
            return compareFn(OrderPipe.getValue(a, expression), OrderPipe.getValue(b, expression));
        });

        return reverse ? sortedArray.reverse() : sortedArray;
    }

    private transformObject(value: any | any[], expression?: any, reverse?: boolean, isCaseInsensitive?: boolean, comparator?: Function): any {
        const parsedExpression = OrderPipe.parseExpression(expression);
        let lastPredicate: any = parsedExpression.pop();
        let oldValue = OrderPipe.getValue(value, parsedExpression);
        if (!Array.isArray(oldValue)) {
            parsedExpression.push(lastPredicate);
            lastPredicate = null;
            oldValue = OrderPipe.getValue(value, parsedExpression);
        }
        if (!oldValue) { return value; }
        OrderPipe.setValue(value, this.transform(oldValue, lastPredicate, reverse, isCaseInsensitive), parsedExpression);
        return value;
    }

    private multiExpressionTransform(value: any, expressions: any[], reverse?: boolean, isCaseInsensitive: boolean = false, comparator?: Function): any {
        return expressions.reverse().reduce((result: any, expression: any) => {
            return this.transform(result, expression, reverse, isCaseInsensitive, comparator);
        }, value);
    }
}
