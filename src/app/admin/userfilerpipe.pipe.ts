import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'userfilerpipe',
    standalone: false
})
export class UserfilerpipePipe implements PipeTransform {

  // User List quick filter: user name, full name or e-mail contains the text.
  // Null-safe: a user with no FULLNAME / MAIL, or a list that failed to load,
  // no longer throws while typing.
  transform(value:any[],searchString:string) {
    if(!searchString || !Array.isArray(value)){
      return value
    }
    const q = searchString.toLowerCase();
    return value.filter(it=>{
        const FULLNAME = String(it?.FULLNAME ?? '').toLowerCase().includes(q)
        const CMP_USERNAME = String(it?.CMP_USERNAME ?? '').toLowerCase().includes(q)
        const MAIL = String(it?.MAIL ?? '').toLowerCase().includes(q)
        return FULLNAME || CMP_USERNAME || MAIL;
    })
  }

}
