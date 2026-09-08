import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'clntoutageingfilterpipe'
})
export class Clntoutageingfilterpipe implements PipeTransform {
  transform(value: any[], searchString: string) {
    if (!searchString) {
      return value
    }
    return value.filter(it => {
      const ACCTNAME = it.ACCTNAME.toLowerCase().includes(searchString.toLowerCase())
     return (ACCTNAME);
    })
  }
}
