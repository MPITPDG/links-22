import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'filter',
    pure: false
})
export class FilterPipe implements PipeTransform {
    transform(items: any[], keys: string, term: string): any[] {
        if (!items) return [];
        if (!term) return items;
        if (term == '' || term == null) return [];
        return (items || []).filter((item) => keys.split(',').some(key => item.hasOwnProperty(key) && new RegExp(term, 'gi').test(item[key])));
    }
}

@Pipe({
    name: 'sortBy'
})
export class SortByPipe implements PipeTransform {
    transform(items: any[], sortedBy: string): any {
        return items.sort((a, b) => { return b[sortedBy] - a[sortedBy] });
    }
}