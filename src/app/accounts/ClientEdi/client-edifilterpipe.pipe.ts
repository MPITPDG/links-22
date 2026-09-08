import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'clientedifilterpipe',
    standalone: false
})
export class ClientedifilterpipePipe implements PipeTransform {
  transform(value: any[], searchString: string) {
    if (!searchString) {
      return value
    }
    return value.filter(it => {
     

     const WORKORDERNO = it.WORKORDERNO
  .toString()
  .toLowerCase()
  .includes(searchString.toLowerCase()) || false;
    


      return ( WORKORDERNO );
    })
  }
}