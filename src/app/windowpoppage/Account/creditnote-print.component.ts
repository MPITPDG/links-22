import { Component, OnInit } from '@angular/core';
import { LoaderService } from '../../shared/service/loader.service';
import { ActivatedRoute } from '@angular/router';
import { LoginService } from '../../shared/service/loginService';
import { DataService } from '../../shared/service/dataService';

@Component({
  selector: 'app-creditnote-print',
  templateUrl: './creditnote-print.component.html',
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
export class CreditnotePrintComponent implements OnInit {
  currencyname
  balance
  sum: any = 0
  sum_words
  INV_ADVANCE1
  CRT_jobno: string = ""
  CRT_pkgs: string = ""
  CRT_grwt: string = ""
  CRT_NO: string = ""
  CRT_DATE: string = ""
  CLIENTNAME: string = ""
  BILLTO_CRTADDR: string = ""
  CRT_BILLTYPE: string = ""
  CUR_NAME: string = ""
  NARRATION: string = ""
  CRT_GOODS: string = ""
  CRT_WT: string = ""
  CRT_VOL: string = ""
  CRT_TAX: string = ""
  PAYBLEBYDT: string = ""
  CRT_NOOFPCS: string = ""
  CRT_PKGS: string = ""
  CRT_HAWBDT: string = ""
  CRT_HAWBNO: string = ""
  CRT_CARRIER: string = ""
  CRT_ADVANCE: string = ""
  CRT_CLIENTREF: String = ""
  CRT_CURRATE: String = ""
  NARRATION1: string = ""
  EXP_ADD1: string = ""
  EXP_ADD2: string = ""
  EXP_ADD3: string = ""
  EXP_CITY: string = ""
  EXP_COUNTRY: string = ""
  EXP_NAME: string = ""
  EXP_PINCODE: string = ""
  desptchtable
  chargestable
  datatable6
  gsttable
  datattable5
  dattable9
  datatable8
  dattable10
  datatable4
  Narr
  showModal: boolean = false
  printmodal: boolean = false
  exampleRadios1
  inrtype: string = ""
  crt_number: string = ""
  CMP_IMAGE: string = ""
  constructor(public _dataService: DataService,
    private _route: ActivatedRoute, public _loginService: LoginService,
    private loaderService: LoaderService) { }

  ngOnInit() {
    this._route.params.subscribe(params => {
      this.crt_number = params["CrtNo"]
      this.checkcrt(params["CrtNo"]);
    });
  }
  checkcrt(crtno) {
    const jsonmaster = {
      invno: crtno,
      cmp_code: this._loginService.getLogin()[0].CMPCODE,
      citycode: this._loginService.getLogin()[0].CITYCODE
    }
    console.log(jsonmaster)
    this._dataService.getData("Accounts/ACC_creditNote_Chk_Inv_NONINR", jsonmaster)
      .subscribe((res: any) => {
        console.log(res)
        if (res.Table[0].AUTHORISEDTOPRINT == "0") {
          alert('You can not Print Invoice No. ' + this.crt_number + '\n  Because Authorisation is Pending !!')
        } else if (res.Table[0].AUTHORISEDTOPRINT == "1") {
          this.showModal = true;
          this.inrtype = res.Table[0].PRINT1
        }
      })
  }
  currencyType(d) {
    this.inrtype = d
    this.showModal = false;
    this.printmodal = true
    this.printdata()
  }

  printdata() {
   // console.log(this.inrtype)
    const jsonmaster = {
      CNno: this.crt_number,
      cmp_code: this._loginService.getLogin()[0].CMPCODE,
      citycode: this._loginService.getLogin()[0].CITYCODE,
      type: "Print",
      finstartdt: this._loginService.getLogin()[0].FINANCIAL_YEAR.STARTDATE,
      fin_enddt: this._loginService.getLogin()[0].FINANCIAL_YEAR.ENDDATE
    }
   // console.log(jsonmaster)

    this._dataService.getData("Accounts/ACC_CN_view", jsonmaster)
      .subscribe((data: any) => {
      //  console.log(data)
        this.CRT_NO = data.Table[0].CRT_NO
        this.CRT_DATE = data.Table[0].CRT_DATE
        this.CLIENTNAME = data.Table[0].CLIENTNAME
        this.BILLTO_CRTADDR = data.Table[0].BILLTO_CRTADDR
        this.CRT_BILLTYPE = data.Table[0].CRT_BILLTYPE
        this.CUR_NAME = data.Table[0].CUR_NAME
        this.CRT_CLIENTREF = data.Table[0].CRT_CLIENTREF
        this.NARRATION = data.Table[0].NARRATION
        this.CRT_GOODS = data.Table[0].CRT_GOODS
        this.CRT_CURRATE = data.Table[0].CRT_CURRATE
        this.CRT_WT = data.Table[0].CRT_WT
        this.CRT_VOL = data.Table[0].CRT_VOL
        this.CRT_TAX = data.Table[0].CRT_TAX
        this.PAYBLEBYDT = data.Table[0].PAYBLEBYDT
        this.CRT_NOOFPCS = data.Table[0].CRT_NOOFPCS
        this.CRT_PKGS = data.Table[0].CRT_PKGS
        this.CRT_HAWBDT = data.Table[0].CRT_HAWBDT
        this.CRT_HAWBNO = data.Table[0].CRT_HAWBNO
        this.CRT_CARRIER = data.Table[0].CRT_CARRIER
        this.CRT_ADVANCE = data.Table[0].CRT_ADVANCE
        this.NARRATION1 = data.Table[0].NARRATION
        this.EXP_ADD1 = data.Table[0].EXP_ADD1
        this.EXP_ADD2 = data.Table[0].EXP_ADD2
        this.EXP_ADD3 = data.Table[0].EXP_ADD3
        this.EXP_CITY = data.Table[0].EXP_CITY
        this.EXP_COUNTRY = data.Table[0].EXP_COUNTRY
        this.EXP_NAME = data.Table[0].EXP_NAME
        this.EXP_PINCODE = data.Table[0].EXP_PINCODE
        this.desptchtable = data.Table3
        this.chargestable = data.Table2
        this.datatable4 = data.Table4
        this.datatable6 = data.Table6
        this.datattable5 = data.Table5
        this.gsttable = data.Table8
        this.dattable9 = data.Table9
        this.dattable10 = data.Table10
        this.CMP_IMAGE= "assets/img/" + this.datattable5[0].CMP_IMAGE
        this.loaderService.display(false)
        // if (this.NARRATION1 != "") {
        //   var html = this.NARRATION1.replace(/<p[^>]*>/g, '').replace(/<\/p>/g, '<br />');
        //   this.NARRATION1 = html
        // }
        if (this.inrtype == "0") {
          // for (var i = 0; i < data.Table7.length; i++) {
          //   this.sum = this.sum + data.Table7[i].INV_INRAMT
          // }
          this.sum = (this.sum + this.datatable6[0].TAXAMT_INR + this.datatable6[0].NONTAXABLEAMT_INR) + this.dattable10[0].ROUNDVALUE
          console.log(this.sum )
          this.sum_words = this._dataService.toWords(data.Table4[0].TOTINRAMT)
          this.balance = this.sum - this.INV_ADVANCE1
        } else if (this.inrtype == "1") {
          // for (var i = 0; i < data.Table7.length; i++) {
          //   this.sum = this.sum + data.Table7[i].INV_AMOUNT
          // }
          this.sum = (this.sum + this.datatable6[0].TAXAMT + this.datatable6[0].NONTAXABLEAMT) + this.dattable10[0].ROUNDVALUE
          console.log(this.sum )
          this.sum_words = this._dataService.toWords(data.Table4[0].TOTAMT)
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
