import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'chqstockFilter'
})
export class ChqstockFilterPipe implements PipeTransform {

  transform(value: any[], searchString: string) {
    console.log(searchString);
    
    if (!searchString) {
      return value
    }
    return value.filter(it => {
      const ChequeNo = it.ChequeNo.toString().includes(searchString.toLowerCase())
     const BP_Num = it.BP_Num.toString().includes(searchString)

     const bank_code = it.bank_code.toLowerCase().includes(searchString.toLowerCase())

     const BP_EntryNo = it.BP_EntryNo.toString().includes(searchString.toLowerCase())
     const Status = it.Status.toLowerCase().includes(searchString.toLowerCase())
     const PrintedBY = it.PrintedBY.toLowerCase().includes(searchString.toLowerCase())

     const PrintedOn = it.PrintedOn.toLowerCase().includes(searchString.toLowerCase())
     const Reason = it.Reason.toLowerCase().includes(searchString.toLowerCase())
   
      return (ChequeNo + BP_Num  + bank_code + BP_EntryNo + Status + PrintedBY+PrintedOn+Reason);
    })
  }
}



@Pipe({
  name: 'ReqBPFilter'
})
export class ReqBPFilterPipe implements PipeTransform {

  transform(value: any[], searchString: string) {
    console.log(searchString);
    
    if (!searchString) {
      return value
    }
    return value.filter(it => {
     const ENTRYNO = it.ENTRYNO.toString().includes(searchString.toLowerCase())
     const CREATEDBY = it.CREATEDBY.toLowerCase().includes(searchString.toLowerCase())
     const ENTRYDT = it.ENTRYDT.toLowerCase().includes(searchString.toLowerCase())
     const CHEQUEDT = it.CHEQUEDT.toLowerCase().includes(searchString.toLowerCase())
     const PAYEENAME = it.PAYEENAME.toLowerCase().includes(searchString.toLowerCase())
     const AMOUNT = it.AMOUNT.toString().includes(searchString.toLowerCase())
     const TYPE = it.TYPE.toLowerCase().includes(searchString.toLowerCase())
      return (ENTRYNO+CREATEDBY+ENTRYDT+CHEQUEDT+PAYEENAME+AMOUNT+TYPE);
    })
  }
}

