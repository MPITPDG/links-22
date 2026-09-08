import { Component, OnInit } from '@angular/core';
import { DataService } from '../../shared/service/dataService';
import { LoaderService } from '../../shared/service/loader.service';
import { ActivatedRoute } from '@angular/router';
import { LoginService } from '../../shared/service/loginService';

@Component({
  selector: 'app-invoice-print',
  templateUrl: './invoice-print.component.html',
  styles: [`
  p .MsoNormal{
    padding:0rem !important;
    margin:0rem !important
  }
  .Rpt_Label_content {
    font-size: 8pt;
    color: black;
    font-family: Verdana,Arial;
  }
  .Rpt_Label {
    font-weight: bold;
    font-size: 8pt;
    color: black;
    font-family: Verdana,Arial;
}
.Rpt_CodeDate {
  font-weight: bold;
  font-size: 9pt;
  color: black;
  font-family: Verdana,Arial;
}
  `]
})
export class InvoicePrintComponent implements OnInit {
  currencyname
  balance
  sum: any = 0
  sum_words
  INV_ADVANCE1
  NARRATION1: string = ""
  INV_CARRIER1: string = ""
  INV_GOODS1: string = ""
  GSTIN1: string = ""
  ESIC_REGD1: string = ""
  INCOMETAXNO1: string = ""
  CINNO_REG1: string = ""
  PAYBLEBYDT1: string = ""
  DOCTHROUGH1: string = ""
  INV_CLIENTREF1: string = ""
  INV_NO1: string = ""
  INV_HAWBNO1: string = ""
  INV_DATE1: string = ""
  INV_HAWBDT1: string = ""
  INV_JOBNO1: string = ""
  EXP_INVADD11: string = ""
  CITY_COUNTRY1: string = ""
  EXP_INVADD2: string = ""
  EXP_INVADD3: string = ""
  EXP_INVCITY: string = ""
  EXP_INVPINCODE: string = ""
  EXP_NAME1: string = ""
  CMPADDRESS1: string = ""
  CMP_FULLNAME1: string = ""
  CMP_IMAGE: string = ""
  table0:any=[]
  enclosuretable
  chargestable
  dispatchtable
  gsttable
  datattable5
  dattable9
  datatable8
  Narr
  inv_number: string = ""
  showModal: boolean = false
  printmodal: boolean = false
  exampleRadios1
  inrtype: string = ""
  SUPPLYTYPE: string = ""
  constructor(public _dataService: DataService,
    private _route: ActivatedRoute, public _loginService: LoginService,
    private _loaderService: LoaderService) { }

  ngOnInit() {
    this._route.params.subscribe(params => {
      this.inv_number = params["InvNo"]
      this.chevkauthorize(params["InvNo"]);
    });
  }
  chevkauthorize(invoiceno) {

    const jsonmaster = {
      invno: invoiceno,
      cmp_code: this._loginService.getLogin()[0].CMPCODE,
    }
   // console.log(jsonmaster)
    this._dataService.getData("Accounts/ACC_invoice_AUTHORISATION_CHECK", jsonmaster)
      .subscribe((res: any) => {
        //console.log(res)
        if (res.Table[0].AUTHORISEDTOPRINT == "1") {
          this.checkinv();
        
        } else if (res.Table[0].AUTHORISEDTOPRINT == "0") {// Authorised can take print
          alert('You can not Print Invoice No. ' + this.inv_number + '\n  Because Authorisation is Pending !!')
            
        } else {
          alert('No Records Found')
        }
      })
  }
  checkinv() {
    const jsonmaster = {
      invno: this.inv_number,
      cmp_code: this._loginService.getLogin()[0].CMPCODE,
      citycode: this._loginService.getLogin()[0].CITYCODE
    }
    //console.log(jsonmaster)
    this._dataService.getData("Accounts/ACC_invoice_Chk_Inv_NONINR", jsonmaster)
      .subscribe((res: any) => {
        //console.log(res)
        this.inrtype = res.Table[0].Column1
        this.showModal = true;
      })
  }
  currencyType(d) {
    this.inrtype = d
    this.showModal = false;
    this.printmodal = true
    this.print()
  }
  print() {
    const jsonmaster = {
      invno: this.inv_number,
      cmp_code: this._loginService.getLogin()[0].CMPCODE,
      citycode: this._loginService.getLogin()[0].CITYCODE
    }
   // console.log(jsonmaster)
    //console.log(jsonmaster)
    this._dataService.getData("Accounts/ACC_invoice_Print", jsonmaster)
      .subscribe((res: any) => {
     //   console.log(res)
        this.GSTIN1 = res.Table[0].GSTIN
        this.ESIC_REGD1 = res.Table[0].ESIC_REGD
        this.INCOMETAXNO1 = res.Table[0].INCOMETAXNO
        this.CMPADDRESS1 = res.Table[0].CMPADDRESS
        this.CMP_FULLNAME1 = res.Table[0].CMP_FULLNAME
        this.CMP_IMAGE= "assets/img/" + res.Table[0].CMP_IMAGE
        this.currencyname = res.Table1[0].currencyname
        this.NARRATION1 = res.Table1[0].NARRATION
        this.INV_CARRIER1 = res.Table1[0].INV_CARRIER
        this.INV_GOODS1 = res.Table1[0].INV_GOODS
        this.CINNO_REG1 = res.Table1[0].CINNO_REG
        this.PAYBLEBYDT1 = res.Table1[0].PAYBLEBYDT
        this.DOCTHROUGH1 = res.Table1[0].DOCTHROUGH
        this.INV_CLIENTREF1 = res.Table1[0].INV_CLIENTREF
        this.INV_NO1 = res.Table1[0].INV_NO
        this.INV_HAWBNO1 = res.Table1[0].INV_HAWBNO
        this.INV_DATE1 = res.Table1[0].INV_DATE
        this.INV_ADVANCE1 = res.Table1[0].INV_ADVANCE
        this.INV_HAWBDT1 = res.Table1[0].INV_HAWBDT
        this.EXP_INVADD11 = res.Table1[0].EXP_INVADD1
        this.CITY_COUNTRY1 = res.Table1[0].CITY_COUNTRY
        this.EXP_NAME1 = res.Table1[0].EXP_NAME
        this.EXP_INVADD2 = res.Table1[0].EXP_INVADD2
        this.EXP_INVADD3 = res.Table1[0].EXP_INVADD3
        this.EXP_INVCITY = res.Table1[0].EXP_INVCITY
        this.EXP_INVPINCODE = res.Table1[0].EXP_INVPINCODE
        this.INV_JOBNO1 = res.Table2[0].INV_JOBNO
        this.table0=res.Table
        this.enclosuretable = res.Table3
        this.chargestable = res.Table4
        this.dispatchtable = res.Table6
        this.datattable5 = res.Table5
        this.gsttable = res.Table7
        this.datatable8 = res.Table8
        this.dattable9 = res.Table9
        this._loaderService.display(false)
        if (this.NARRATION1 != "") {
          var html = this.NARRATION1.replace(/<p[^>]*>/g, '').replace(/<\/p>/g, '<br />');
          this.NARRATION1 = html
        }
        if (this.inrtype == "0") {
          for (var i = 0; i < res.Table7.length; i++) {
            this.sum = this.sum + res.Table7[i].INV_INRAMT
          }
          this.sum = (this.sum + this.datattable5[0].TOT_INV_INRAMT_Y + this.datattable5[0].TOT_INV_INRAMT_N) + this.dattable9[0].ROUNDVALUE
          this.sum_words = this._dataService.ConvertNumberToWordsNew(this.sum)
          this.balance = this.sum - this.INV_ADVANCE1
        } else if (this.inrtype == "1") {
          for (var i = 0; i < res.Table7.length; i++) {
            this.sum = this.sum + res.Table7[i].INV_AMOUNT
          }
          this.sum = (this.sum + this.datattable5[0].TOT_INV_AMOUNT_Y + this.datattable5[0].TOT_INV_AMOUNT_N) + this.dattable9[0].ROUNDVALUE
          this.sum_words = this._dataService.ConvertNumberToWordsNew(this.sum)
          this.balance = this.sum - this.INV_ADVANCE1
        }
      })
  }

  PrintElem() {
    var data = document.getElementById('demo').innerHTML;
    var mywindow = window.open('', 'Accounts - Invoice Print', 'height=400,width=600');
    mywindow.document.write('<html><head><title>Accounts - Invoice Print</title>');
    mywindow.document.write('<link rel="stylesheet" href="assets/css/invoice.css" type="text/css" />');
    mywindow.document.write('</head><body >');
    mywindow.document.write(data);
    mywindow.document.write('</body></html>');
    mywindow.document.close(); // necessary for IE >= 10

    mywindow.onload = function () { // necessary if the div contain images

      mywindow.focus(); // necessary for IE >= 10
      mywindow.print();
      mywindow.close();
    };
    return true;
  }

}

