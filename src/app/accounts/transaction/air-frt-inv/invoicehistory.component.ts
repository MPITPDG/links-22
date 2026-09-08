import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { LoginService } from '../../../shared/service/loginService';
import { ToastCommonService } from '../../../shared/service/toastService';
import { IMyDpOptions } from 'mydatepicker';
import { LoaderService } from '../../../shared/service/loader.service';
import { HttpClient } from '@angular/common/http';
import { DataService } from 'src/app/shared/service/dataService';
@Component({
  selector: 'app-invoicehistory',
  templateUrl: './invoicehistory.component.html',
  styles: [`
  .anchor-link{
    text-decoration:none !important
  }
  `]
})
export class InvoicehistoryComponent implements OnInit {
  Header:string="AIRFREIGHT - INVOICE - HISTORY"
  tablehistry: any;
  constructor(
    private _dataService: DataService,
    private _toasterService: ToastCommonService,
    private loaderService: LoaderService,
    private _router: Router,
    private http: HttpClient,
    private _activatedRoute: ActivatedRoute,
    private _loginService: LoginService,
  ) { }

  ngOnInit() {
  //  this.loaderService.display(true)
    const jsoncmp = {
      cmpid: this._loginService.getLogin()[0].CMPID,
      cmpcode: this._loginService.getLogin()[0].CMPCODE,
      citycode1: this._loginService.getLogin()[0].CITYCODE1,
    }
       console.log(jsoncmp)
    this._dataService.getData("Accounts/ACC_INV_MAWB_AIRFRT_CONS_PUR_LIST", jsoncmp)
      .subscribe((data: any) => {
        console.log(data)
          this.tablehistry=data.Table
         // this.loaderService.display(false)
      })
  }

  InvoicePrint(Invoiceno) {
    if(Invoiceno ==''||Invoiceno==undefined){
      alert(" Invoice No. cannot be Blank!")
      return false
    }
    let theTop = (screen.height / 2) - (483 / 2);
    let theLeft = (screen.width / 2) - (780 / 2);
    let toolbar = 'resizable=no,scrollbars=no,width=800,height=450,status=no,left=' + theLeft + ',top=' + theTop;
   // window.open('./#/popup/Account-Invoice-print/' + Invoiceno + '/' , "Invoice Print", toolbar);
   let URL = "http://180.179.207.163/Linkserp-ac/UI/Accounts/frm_Acc_Tran_Invoice_Print.aspx?" +
          "huhpnk=" + this._loginService.getLogin()[0].GUID
          + "&citycode=" + this._loginService.getLogin()[0].CITYCODE1
          + "&Userid=" + this._loginService.getLogin()[0].CMPID
          + "&cmp_code=" + this._loginService.getLogin()[0].CMPCODE
          + "&InvoiceNo=" + Invoiceno
          + "&DisplayMode=" + "0"
          +"&cmp_username=" + this._loginService.getLogin()[0].CMP_USERNAME
              window.open(URL,  "Invoice Print", toolbar);
              return false;
  }

  CreditNotePrint(creditno) {
    if(creditno ==''||creditno==undefined ){
      alert("CreditNote No. cannot be Blank !")
      return false
    }
    let theTop = (screen.height / 2) - (483 / 2);
    let theLeft = (screen.width / 2) - (780 / 2);
    let toolbar = 'resizable=no,scrollbars=no,width=800,height=450,status=no,left=' + theLeft + ',top=' + theTop;
    window.open('./#/popup/Account-CreditNote-print/' + creditno + '/' , "CreditNote Print", toolbar);
  }

  PurchasePrint(puchaseno) {
    if(puchaseno ==''||puchaseno==undefined){
      alert("Purchase No. cannot be Blank!")
      return false
    }
    let theTop = (screen.height / 2) - (483 / 2);
    let theLeft = (screen.width / 2) - (780 / 2);
    let toolbar = 'resizable=no,scrollbars=no,width=800,height=450,status=no,left=' + theLeft + ',top=' + theTop;
    window.open('./#/popup/Account-PurchasePrint-InvoiceHistory/' + puchaseno + '/' , "Console Purchase Print", toolbar);
  }
}
