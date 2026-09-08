import { Injectable, Pipe, PipeTransform } from '@angular/core';

@Injectable()
@Pipe({
    name: 'filter',
    pure: false,
    standalone: false
})
export class Ng2SearchPipe implements PipeTransform {
    transform(items: any, term: string): any {
        if (!term || !items) {
            return items;
        }
        return Ng2SearchPipe.filter(items, term);
    }

    static filter(items: Array<{ [key: string]: any }>, term: string): Array<{ [key: string]: any }> {
        const toCompare = term.toLowerCase();

        function checkInside(item: any, term: string): boolean {
            for (const property in item) {
                if (item[property] === null || item[property] === undefined) {
                    continue;
                }
                if (typeof item[property] === 'object') {
                    if (checkInside(item[property], term)) {
                        return true;
                    }
                }
                if (item[property].toString().toLowerCase().includes(toCompare)) {
                    return true;
                }
            }
            return false;
        }

        return items.filter(item => checkInside(item, term));
    }
}
