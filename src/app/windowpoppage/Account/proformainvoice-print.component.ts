import { Component, OnInit } from '@angular/core';
import { DataService } from '../../shared/service/dataService';
import { LoaderService } from '../../shared/service/loader.service';
import { ActivatedRoute } from '@angular/router';
import { LoginService } from '../../shared/service/loginService';

@Component({
  selector: 'app-proformainvoice-print',
  templateUrl: './proformainvoice-print.component.html',
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
export class ProformaInvoicePrintComponent implements OnInit {
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
  INV_PKGS: string = ""
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
  exampleRadios1:any;
  inrtype: string = ""
  SUPPLYTYPE: string = ""
  CURNAME:string="";
  amt_y:string="";
  amt_n:string="";
  TotalTaxableAmt:any;
  totamtfinal:any;
  balanceduelbl:any;
  cmpname:string="";
  qrdata:string;
  SAXNOTIFY:string = ""
  IRNNO:string="";
  datatablebank;
  datatable10;
  BillNo:string="";
  Pod:string="";
  Pol:string="";

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
       // if (res.Table[0].AUTHORISEDTOPRINT == "1") {
          this.checkinv();

        // } else if (res.Table[0].AUTHORISEDTOPRINT == "0") {// Authorised can take print
        //   alert('You can not Print Invoice No. ' + this.inv_number + '\n  Because Authorisation is Pending !!')

        // } else {
        //   alert('No Records Found')
        // }
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
        if(this.inrtype=="1"){
          this.showModal = true;
        }
        else
        {
          this.showModal = false;
          this.printmodal = true
          this.print()
        }
      })
  }
  currencyType(d) {
    if(this.exampleRadios1=="" || this.exampleRadios1==undefined){
      alert('Please select at least one currency type');
      return false;
    }
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
        this.cmpname=res.Table[0].CMPNAME
        this.CMP_IMAGE= "assets/img/" + res.Table[0].CMP_IMAGE
        this.currencyname = res.Table1[0].currencyname
        this.CURNAME= res.Table1[0].CUR_NAME
        this.NARRATION1 = res.Table1[0].NARRATION
        this.INV_CARRIER1 = res.Table1[0].INV_CARRIER
        this.INV_GOODS1 = res.Table1[0].INV_GOODS
        this.CINNO_REG1 = res.Table1[0].CINNO_REG
        this.PAYBLEBYDT1 = res.Table1[0].PAYBLEBYDT
        this.DOCTHROUGH1 = res.Table1[0].DOCTHROUGH
        this.INV_CLIENTREF1 = res.Table1[0].INV_CLIENTREF
        this.INV_PKGS=res.Table1[0].INV_PKGS
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
        this.SAXNOTIFY=res.Table1[0].STAXNOTIFY
        this.INV_JOBNO1 = res.Table2[0].INV_JOBNO
        this.BillNo=res.Table11[0].BILLNO
        this.Pol=res.Table11[0].POL
        this.Pod=res.Table11[0].POD
        this.table0=res.Table
        this.enclosuretable = res.Table3
        this.chargestable = res.Table4
        this.dispatchtable = res.Table6
        this.datattable5 = res.Table5
        this.gsttable = res.Table7
        this.datatable8 = res.Table8
        this.dattable9 = res.Table9
        this.datatable10=res.Table10
        this.datatablebank=res.Table12
        this._loaderService.display(false)
        if (this.NARRATION1 != "") {
          var html = this.NARRATION1.replace(/<p[^>]*>/g, '').replace(/<\/p>/g, '<br />');
          this.NARRATION1 = html
        }
        if (this.inrtype == "0") {
          for (var i = 0; i < res.Table7.length; i++) {
            this.sum = this.sum + res.Table7[i].INV_INRAMT
          }
          this.sum = (this.sum + this.datattable5[0].TOT_INV_INRAMT_Y + this.datattable5[0].TOT_INV_INRAMT_N) //+ this.dattable9[0].ROUNDVALUE
          this.sum_words = this._dataService.ConvertNumberToWordsNew(this.sum)
          this.balance = this.sum - this.INV_ADVANCE1
        } else if (this.inrtype == "1") {
          for (var i = 0; i < res.Table7.length; i++) {
            this.sum = this.sum + res.Table7[i].INV_AMOUNT
          }
          this.sum = (this.sum + this.datattable5[0].TOT_INV_AMOUNT_Y + this.datattable5[0].TOT_INV_AMOUNT_N) ///+ this.dattable9[0].ROUNDVALUE
          this.sum_words = this._dataService.ConvertNumberToWordsNew(this.sum)
          this.balance = this.sum - this.INV_ADVANCE1
          console.log(this.sum);
        }
        if(this.datatable8.length>0){
          if (this.inrtype == "1") {
            this.TotalTaxableAmt=this.datatable8[0].TOTALTAXABLEAMT
            if(this.TotalTaxableAmt!="0.00"){
              this.TotalTaxableAmt=this.TotalTaxableAmt-this.dattable9[0].ROUNDVALUE
            }
          }
          else
          {
            this.TotalTaxableAmt=this.datatable8[0].TOTALTAXABLEAMTINR
          }
        }
       // var totamt
        this.totamtfinal=this.amt_y + this.amt_n +this.TotalTaxableAmt
        if(this.inrtype=="1"){
          this.totamtfinal=this.totamtfinal
        }
        else{
          this.totamtfinal=Math.round(this.totamtfinal)
          if(this.totamtfinal-this.INV_ADVANCE1>0){
            this.balanceduelbl="Balance due to us"
          }
          else if (this.totamtfinal-this.INV_ADVANCE1<0){
            this.balanceduelbl="Balance due to you"
          }
          else if (this.totamtfinal-this.INV_ADVANCE1==0){
            this.balanceduelbl="Zero Balance"
          }
        }
        if(res.Table10[0].IRNNO!=""){
          this.IRNNO="IRN NO. :"+res.Table10[0].IRNNO
        }else
        {
          this.IRNNO=res.Table10[0].IRNNO
        }
        //this.QrImage='data:image/jpg;base64,'+ atob(res.Table10[0].QRCODE);
        this.qrdata=res.Table10[0].QRCODE
        if(this.inrtype=="0"){
          this.CURNAME='INDIAN RUPEES'
        }else{
          this.CURNAME=this.CURNAME
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

