import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'userfilerpipe'
})
export class UserfilerpipePipe implements PipeTransform {

  transform(value:any[],searchString:string) {
    if(!searchString){
  
      return value  
    }
  return value.filter(it=>{   
      
        const FULLNAME = it.FULLNAME.toLowerCase().includes(searchString.toLowerCase())
        const CMP_USERNAME = it.CMP_USERNAME.toLowerCase().includes(searchString.toLowerCase())
        const MAIL = it.MAIL.toLowerCase().includes(searchString.toLowerCase())
        return ( FULLNAME+CMP_USERNAME+MAIL);      
    }) 
  }

}
