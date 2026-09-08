import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'src/app/shared/service/authService';
import { DataService } from 'src/app/shared/service/dataService';
import { LoaderService } from 'src/app/shared/service/loader.service';
import { LoginService } from 'src/app/shared/service/loginService';
import { ToastCommonService } from 'src/app/shared/service/toastService';
import { environment } from 'src/environments/environment';
@Component({
  selector: 'app-cheque-review',
  templateUrl: './cheque-review.component.html',
  styles: [`
 
  .space{
    padding:0px;
    margin:0px
  }
  hr {
    border: 0.2px dotted gray;  
  }

  .footerbtn{
    position: absolute;
    bottom: 0;
    margin-bottom: 30px;
    right:0
  }
  `]
})
export class ChequeReviewComponent implements OnInit {
  Header: string = "cheque preview"
  EntryNo: any;
  PrintCount: any;
  AMOUNT: any;
  table6: any;
  table5: any;
  AMOUNT_words: string;
  chequeno: any;
  printentryno: any;
  constructor(
    private _router: Router,
    private _dataService: DataService,
    private _auth: AuthService, private _activatedRoute: ActivatedRoute,
    private _toasterService: ToastCommonService,
    private _loginService: LoginService,
    private _loaderService: LoaderService,
  ) { }

  ngOnInit() {
    this._activatedRoute.params.subscribe(params => {
      console.log(params)
      this.EntryNo = params["entryno"];
      this.PrintCount = params["printcount"];
    })
    this._loaderService.display(true)
    const jsoncmp = {
      CMPID: this._loginService.getLogin()[0].CMPID,
      CMPCODE: this._loginService.getLogin()[0].CMPCODE,
      CITYCODE1: this._loginService.getLogin()[0].CITYCODE1,
      COUNT: this.PrintCount,
      ENTRYNO: this.EntryNo,
      MAKERIP: this._loginService.getLogin()[0].MAKERIP
    }
   // console.log(jsoncmp)
    this._dataService.getData("Accounts/ACC_CHEQUE_PREVIEWPRINT_PAGELOAD", jsoncmp)
      .subscribe((data: any) => {
      //  console.log(data)
        this.table5 = data.Table6[0]
        this.table6 = data.Table7
        this.AMOUNT = data.Table8[0].AMOUNT

        this.AMOUNT_words = this._dataService.convertNumberToWords(this.AMOUNT)
        this.chequeno = data.Table6[0].CHQNO
        this.printentryno = data.Table6[0].ACC_BANK_ENTRYNO
        this._loaderService.display(false)

      })
  }
  printchq() {
    let URL = "http://180.179.207.163/erp/UI/Accounts/frm_Acc_CompCheq_PrintCheque_Print.aspx?" +
      "huhpnk=" + this._loginService.getLogin()[0].GUID
      + "&citycode=" + this._loginService.getLogin()[0].CITYCODE1
      + "&Userid=" + this._loginService.getLogin()[0].CMPID
      + "&cmp_code=" + this._loginService.getLogin()[0].CMPCODE
      + "&entryno=" + this.chequeno
      + "&CurLogInIP=" + environment.edocumentIp
    window.open(URL, "_blank");
  }

  BPprint() {
    let theTop = (screen.height / 2) - (483 / 2);
    let theLeft = (screen.width / 2) - (780 / 2);
    let toolbar = 'resizable=no,scrollbars=no,width=800,height=450,status=no,left=' + theLeft + ',top=' + theTop;
    window.open('./#/popup/Account-CashBook-BankReceipt-print/' + 'BR' + '/' + this.printentryno + '/', "CashBook BankReceipt Print", toolbar);
  }
}
