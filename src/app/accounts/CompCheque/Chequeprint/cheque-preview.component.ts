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
    templateUrl: './cheque-preview.component.html',
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
  export class ChequePreviewComponent implements OnInit {
    Header: string = "cheque preview"
    EntryNo: any;
    PrintCount: any;
    AMOUNT: any;
    table6: any;
    table8: any = [];
    table5: any;
    AMOUNT_words: string;
    chequeno: any;
    printentryno: any;
    strchqno:any;
    ourbank:any;
    strval:any;
    chkprntstrval:any="";
    Print_List: any = []
    CHEQUENO:any;
    CHEQUEDT:any;
    CHQNO:any;
    CHEQUEDT1:any;
    ACC_BANK_ENTRYNO:any;
    CHEQUEAMOUNT:any;
    NOTOVERFLAG:any;
    PAYEENAME:any;
    NOTOVERAMT:any;
    NARRATION:any;
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
        this.strchqno=params["strchequeno"];
        this.ourbank=params["ourbank"]
        this.strval=params["strvalue"]
      })

        this.PageLoad();

    }
     PageLoad(){
      this._loaderService.display(true)

      const jsoncmp = {
        CMPID: this._loginService.getLogin()[0].CMPID,
        CMPCODE: this._loginService.getLogin()[0].CMPCODE,
        CITYCODE1: this._loginService.getLogin()[0].CITYCODE1,
        STRCHEQUENO:this.strchqno,
        COUNT: this.PrintCount,
        OURBANK:this.ourbank,
        ENTRYNO: this.EntryNo,
        STRVALUE:this.strval,
        MAKERIP: this._loginService.getLogin()[0].MAKERIP
      }

      this._dataService.getData("Accounts/ACC_CHEQUE_PREVIEWPRINT_PAGELOAD_NG", jsoncmp)
        .subscribe((data: any) => {
          this.table5 = data.Table5[0]
          this.CHEQUEDT=data.Table5[0].CHEQUEDT
          this.PAYEENAME=data.Table5[0].PAYEENAME
          this.CHEQUEAMOUNT=data.Table5[0].CHEQUEAMOUNT
          //this.NOTOVERFLAG=data.Table5[0].NOTOVERFLAG
          this.NOTOVERAMT=data.Table5[0].ACTUALAMOUNT
          this.CHEQUENO=data.Table5[0].CHEQUENO
          this.NARRATION=data.Table5[0].NARRATION
          this.table6 = data.Table6
          this.AMOUNT = data.Table7[0].AMOUNT
          this.AMOUNT_words = this._dataService.toWords(data.Table5[0].ACTUALAMOUNT)
          this.chequeno = data.Table5[0].CHQNO
          this.printentryno = data.Table5[0].ACC_BANK_ENTRYNO
          this.table8=data.Table8;
          this._loaderService.display(false)

        })
        this._loaderService.display(false)
     }
    printchq() {
      //let URL = "http://localhost:50709/UI/Accounts/frm_Acc_CompCheq_PrintCheque_Print.aspx?" +
      let URL = "http://180.179.207.163/linkserp-ac/UI/Accounts/frm_Acc_CompCheq_PrintCheque_Print.aspx?" +
        "huhpnk=" + this._loginService.getLogin()[0].GUID
        + "&citycode=" + this._loginService.getLogin()[0].CITYCODE1
        + "&Userid=" + this._loginService.getLogin()[0].CMPID
        + "&cmp_code=" + this._loginService.getLogin()[0].CMPCODE
        + "&Entryno=" + this.chequeno
        + "&CurLogInIP=" + environment.edocumentIp
      window.open(URL, "_blank");
    }

    BPprint() {
      let theTop = (screen.height / 2) - (483 / 2);
      let theLeft = (screen.width / 2) - (780 / 2);
      let toolbar = 'resizable=no,scrollbars=no,width=800,height=450,status=no,left=' + theLeft + ',top=' + theTop;
      window.open('./#/popup/Account-CashBook-BankReceipt-print/' + 'BR' + '/' + this.printentryno + '/', "CashBook BankReceipt Print", toolbar);
    }
    Acc_BP_CMP_Cheque_ReadyTo_Print_List_35(){
      this._loaderService.display(true);
      const jsoncmp = {
        strentryNo: this.strval,
      }

      this._dataService.getData("Accounts/ACC_BP_CMP_CHEQUE_READYTO_PRINT_LIST_35", jsoncmp)
        .subscribe((data: any) => {
        this.Print_List=data.Table;

      })
      this._loaderService.display(false);
    }
  }
