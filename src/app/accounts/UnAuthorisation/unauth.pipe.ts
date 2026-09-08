import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'accountpipefilter'
})
export class AccountpipefilterPipe implements PipeTransform {

  transform(value: any[], searchString: string) {
    if (!searchString) {
      return value
    }
    return value.filter(it => {
      const TRNS_TYPE = it.TRNS_TYPE.toLowerCase().includes(searchString.toLowerCase())

      const INV_CRTNO = it.INV_CRTNO.toString().includes(searchString.toLowerCase())
      const INV_CRTDT = it.INV_CRTDT.toLowerCase().includes(searchString.toLowerCase())
      const CREATEDBY = it.CREATEDBY.toLowerCase().includes(searchString.toLowerCase())
      const INV_CRT_DAT = it.INV_CRT_DAT.toLowerCase().includes(searchString.toLowerCase())

      const CLIENTNAME = it.CLIENTNAME.toLowerCase().includes(searchString.toLowerCase())
      const TOTAL_AMT = it.TOTAL_AMT.toString().includes(searchString)

      return (TRNS_TYPE + INV_CRTNO + INV_CRTDT + CREATEDBY + INV_CRT_DAT + CLIENTNAME + TOTAL_AMT);
    })
  }
}