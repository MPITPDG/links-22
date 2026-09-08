import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IMyDpOptions } from 'mydatepicker';
import { DataService } from 'src/app/shared/service/dataService';
import { LoaderService } from 'src/app/shared/service/loader.service';
import { LoginService } from 'src/app/shared/service/loginService';
import { ToastCommonService } from 'src/app/shared/service/toastService';

@Component({
  selector: 'app-invoiceprint-tabs',
  templateUrl: './invoiceprint-tabs.component.html',
  styles: [`
  .form-control {
     padding:0px !important;
     margin:0px !important;
     height:20px !important;
  }
  a:hover,a:focus{
      text-decoration: none;
      outline: none;
  }
  .tab .nav-tabs {
      border-bottom:0 none;
  }
  .tab .nav-tabs li{
      margin-right: 10px;
  }
  .tab .nav-tabs li a{
      position: relative;
      padding: 5px;
      color: #fff;
      font-size: 11px;
      z-index: 1;
      font-family:verdana;
      font-weight:bold
  }
  .tab .nav-tabs li a:hover{
      background:transparent;
      border:1px solid transparent;
      color: #444;
  }
   .tab .nav-tabs li a:before{
      content: "";
      width:100%;
      height:100%;
      position:absolute;
      bottom: 6px;
      left:-1px;
      font-size:11px;

      background-color: #536c79;
      border: 1px solid #d3d3d3;
      border-bottom: 0px none;
      border-radius: 10px 10px 0 0;
      transform-origin: left center 0;
      transform: perspective(3px) rotateX(5deg);
      z-index:-1;
  } 
  .tab .nav-tabs li a.active:before{
      background: #fff;
  }
  .tab .nav-tabs li a.active,
  .tab .nav-tabs li a.active:focus,
  .tab .nav-tabs li a.active:hover{
      border:1px solid transparent;
      background:transparent;
      color: #212529;
      z-index: 2;
  }
  `],
})
export class InvoiceprintTabsComponent implements OnInit {
  Header: string = "proforama airfreight invoice and share of profit Credit Note"
  SubHeader: string = "view invoice details"
  inv_no: "TRTRR"
  public myDatePickerOptions: IMyDpOptions = {
    dateFormat: 'dd/mm/yyyy',
    inline: false,
    height: '18px',
    width: '150px',
    componentDisabled: false,
    selectionTxtFontSize: '12px',
    editableDateField: false,
    sunHighlight: true,
    satHighlight: true,
    firstDayOfWeek: 'su',
    openSelectorTopOfInput: false,
    openSelectorOnInputClick: true,
    selectorHeight: '180px',
    selectorWidth: '200px',
    disableUntil: { year: 0, month: 0, day: 0 },
    disableSince: { year: 0, month: 0, day: 0 }
  };
  jobdetailtable: any = [];
  accountdetailtable: any = [];
  enclosuredetailtable: any = [];
  despatchdetailtable: any = [];
  detailtable: any = [];
  LOGID: any;
  jobdetailtable_CN: any = [];
  accountdetailtable_CN: any = [];
  detailtable_CN: any = [];
  amountable_CN: any = [];
  detail_pur1: any = [];
  detail_pur2: any = [];
  account_pur1: any = [];
  account_pur2: any = [];
  payable_euro: any = "";
  receive_euro: any = "";
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
    this._activatedRoute.params.subscribe(params => {
      this.LOGID = params["ID"];
    })
    this.loaderService.display(true)

    this.invoicedetail()
    this.creditnotedetail()
    this.consolepurchasedetail()
  }

  invoicedetail() {
    const jsoncmp = {
      INVCNCONPI_LOGID: this.LOGID,
      INVTYPE: "II",

    }
    //    console.log(jsoncmp)
    this._dataService.getData("Accounts/ACC_INV_MAWB_AIRFRT_CN_SHAREOFPROFIT_INV_VIEW", jsoncmp)
      .subscribe((data: any) => {
        // console.log(data)
        this.loaderService.display(false)

        this.jobdetailtable = data.Table
        this.detailtable = data.Table1[0]
        this.accountdetailtable = data.Table3
        this.enclosuredetailtable = data.Table4
        this.despatchdetailtable = data.Table5
      })

  }

  creditnotedetail() {

    const jsoncmp1 = {
      INVCNCONPI_LOGID: this.LOGID
    }
    // console.log(jsoncmp1)
    this._dataService.getData("Accounts/ACC_INV_MAWB_AIRFRT_CN_SHAREOFPROFIT_CN_VIEW", jsoncmp1)
      .subscribe((data: any) => {
        //  console.log(data)
        this.loaderService.display(false)
        if (data.Table.length == "0") {
          const jsoncmp = {
            INVCNCONPI_LOGID: this.LOGID,
            INVTYPE: "II",
      
          }
          //    console.log(jsoncmp)
          this._dataService.getData("Accounts/ACC_INV_MAWB_AIRFRT_CN_SHAREOFPROFIT_INV_VIEW", jsoncmp)
            .subscribe((data: any) => {
              this.jobdetailtable_CN = data.Table
              this.detailtable_CN = data.Table1[0]
              this.accountdetailtable_CN = data.Table2
              this.amountable_CN = data.Table3[0]
            })
        } else {
          this.jobdetailtable_CN = data.Table
          this.detailtable_CN = data.Table1[0]
          this.accountdetailtable_CN = data.Table2
          this.amountable_CN = data.Table3[0]
        }
      })

  }

  consolepurchasedetail() {

    const jsoncmp2 = {
      INVCNCONPI_LOGID: this.LOGID
    }
    //  console.log(jsoncmp1)
    this._dataService.getData("Accounts/ACCT_INV_CN_MAWB_AIRFREIGHT_CONSOLE_PURCAHSE_VIEW", jsoncmp2)
      .subscribe((data: any) => {
        //   console.log(data)
        this.loaderService.display(false)
        this.detail_pur1 = data.Table1[0]
        this.detail_pur2 = data.Table4[0]
        this.account_pur1 = data.Table2
        this.account_pur2 = data.Table5
        this.payable_euro = data.Table3[0].INVOICEEURO
        this.receive_euro = data.Table6[0].DEDUCTIONEURO
      })
  }


  headerdata(subtitle) {
    this.SubHeader = subtitle
  }
  abort() {
    this.loaderService.display(true)
    const jsoncmp3 = {
      FK_LOGID: this.LOGID
    }
  //  console.log(jsoncmp3)
    this._dataService.getData("Accounts/ACC_INV_MAWB_AIRFRT_CN_SOF_INVCN_REST", jsoncmp3)
      .subscribe((data: any) => {
       // console.log(data)
        this.loaderService.display(false)
        if (data.Table[0].STATUS == "100") {
          this._toasterService.toast('success', 'success', 'Successfully aborted details.');
          this.detail_pur1 = []
          this.detail_pur2 = []
          this.account_pur1 = []
          this.account_pur2 = []
          this.payable_euro = ""
          this.receive_euro = ""
          this._router.navigateByUrl("/accounts/transaction/AirfrtInv/airfrtinvoiceList")
        }
      })
  }


  generate() {
    this.loaderService.display(true)
    const jsoncmp4 = {
      CMPID: this._loginService.getLogin()[0].CMPID,
      CMPCODE: this._loginService.getLogin()[0].CMPCODE,
      CITYCODE1: this._loginService.getLogin()[0].CITYCODE1,
      CITYCODE: this._loginService.getLogin()[0].CITYCODE,
      FK_LOGID: this.LOGID,
      LOCALIPADD: this._loginService.getLogin()[0].MAKERIP,
      ROUTERIPADD: this._loginService.getLogin()[0].MAKERIP
    }
  //  console.log(jsoncmp4)
    this._dataService.getData("Accounts/ACC_INV_MAWB_AIRFRT_CN_SOF_CONS_PUR_GENERATE", jsoncmp4)
      .subscribe((data: any) => {
     //   console.log(data)
        if (data.Table[0].STATUS == "103") {
          this._toasterService.toast('error', 'error', 'Not Generated.');
        }
        this.loaderService.display(false)

      })
  }
}
