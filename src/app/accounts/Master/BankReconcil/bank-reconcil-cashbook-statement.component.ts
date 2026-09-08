import { Component, OnInit } from '@angular/core';
import{DataService} from '../../../shared/service/dataService';
import { LoginService } from '../../../shared/service/loginService';
import { ToastCommonService } from '../../../shared/service/toastService';
import { LoaderService } from '../../../shared/service/loader.service';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { IMyDpOptions } from 'mydatepicker';
import { ExportexcelService } from 'src/app/shared/service/exportexcel.service';
import { BankReconcilCashbookStatementExportService } from './bank-reconcil-cashbook-statement-export.service';

// Modernized reskin of bank-reconcil-rpt.component — same accounting logic,
// same backend calls (Fill_CashBook_BankRecRpt / Fill_CashBook_BankRecRptNew1),
// just the "br-" card design instead of the old bordered-table layout. Kept
// as a separate page rather than editing bank-reconcil-rpt.component
// directly, since that one is live and already proven — this is
// intentionally a parallel, low-risk copy.
//
// Excel export uses a NEW dedicated service, not exportser.exportExceltry —
// that shared service has no branch for pagetype "BankRecStatement" /
// "BankRecOutStatement", so the reconciliation summary (Opening/Closing/Bank
// Balance/Difference) was being silently dropped from the exported file even
// though this component computed and sent it.
@Component({
    selector: 'app-BankReconcil-cashbook-statement',
    templateUrl: './bank-reconcil-cashbook-statement.component.html',
    styleUrls: ['./bank-reconcil-cashbook-statement.component.css']
  })
  export class BankReconcilCashbookStatementComponent implements OnInit {
    public myDatePickerOptions: IMyDpOptions = {
         dateFormat: 'dd/mm/yyyy',
        inline: false,
        height: '30px',
        width: '120px',
        componentDisabled: false,
        selectionTxtFontSize: '12px',
        editableDateField: false,
        sunHighlight: true,
        satHighlight: true,
        firstDayOfWeek: 'su',
        openSelectorTopOfInput: false,
        openSelectorOnInputClick: true,
        selectorHeight: '200px',
        selectorWidth: '220px',
        alignSelectorRight: true
      };

    FromDate;
    ToDate;
    ClearingDate;
    Balance:string;
    bankpayList:any = [];
    bankrecList:any = [];
    BankList:any = [];
    displayType: string = 'SEARCH';
    Bank:string;
    BankName:string;
    OurBankName:string;
    Header:string="Bank Reconciliation Statement"
    OpBal:any;
    lblOpBal:any;
    DrBalance:any;
    CrBalance:any;
    CurrentCrbal:any;
    CurrentDrBal:any;
    DrRef:string;
    CrRef:string;
    IssueTotal:any;
    RecTotal:any;
    exIssueTotal:any;
    exRecTotal:any;
    Compname:string;
    dataForExcel = [];
    recdataForExcel = [];
    tbl10dataForExcel = [];
    tbl11dataForExcel = [];
    tbl12dataForExcel = [];
    tbl1:any = [];
    tbl2:any = [];
    tbl10:any = [];
    tbl11:any = [];
    tbl12:any = [];
    Payoutstand:any;
    Payoutstandtotal:any;
    recoutstand:any;
    closing:any;
    Bankbal:any;
    BankBalance:any;
    Diff:any;
    rptDrBalance:any;
    rptCrBalance:any;
    rptCurrentCrbal:any;
    rptCurrentDrBal:any;
    tempcr:any;
    tempdr:any;
    rptopbal:any;
    lblclbal:any;
    lbldiff:any;
    showResult = false;
    constructor(private _dataService: DataService,
        private _toasterService: ToastCommonService,
        private loaderService: LoaderService,
        private http: HttpClient,
        private _activatedRoute: ActivatedRoute,private _router:Router,
        private _loginService: LoginService,
        private _loaderService: LoaderService,
        private exportser: ExportexcelService,
        private cashbookExportser: BankReconcilCashbookStatementExportService

      ) { }

      ngOnInit() {
        this._loaderService.display(true)
        this.FillAccount()
        this.getCompanyName()
        this.verifyPermission('45','View')
        this._loaderService.display(false)
      }

      verifyPermission(formId, userMode) {
        this._loaderService.display(true);
        this._loginService.verifyRights(formId, '')
        .subscribe((data: any) => {
        this._loginService.checkVerify(userMode, data);
        this._loaderService.display(false);
              });
            }

            FillAccount(){
                const jsonBank= {
                cmpcode: this._loginService.getLogin()[0].CMPCODE,
                citycode: this._loginService.getLogin()[0].CITYCODE,
                citycode1: this._loginService.getLogin()[0].CITYCODE1
                }
                this._dataService.getData("Accounts/Acc_CashBook_FillOurbank", jsonBank)
                .subscribe((data: any) => {
                this.BankList = data.Table
                this._loaderService.display(false)
                })
                }
                SearchData()
                {
                  this.loaderService.display(true);
                  if(this.Bank=="" || this.Bank==undefined || this.Bank=="--Select OurBank--"){
                    this._toasterService.toast('warning', 'warning', 'Please select Our Bank  !');
                    this.loaderService.display(false);
                    return false;
                 }
                 if (this.FromDate == "" || this.FromDate == undefined) {
                  this._toasterService.toast('warning', 'warning', "From Date cannot be blank !.");
                  this.loaderService.display(false);
                  return false;
                 }
                if (this.ToDate == "" || this.ToDate == undefined) {
                  this._toasterService.toast('warning', 'warning', "To Date cannot be blank !.");
                  this.loaderService.display(false);
                  return false; }
                  if (this.BankBalance == ""|| this.BankBalance == undefined ) {
                    this._toasterService.toast('warning', 'warning', "Please Enter Bank Balance!.");
                    this.loaderService.display(false);
                    return false; }
                  const jsonData = {
                      _ourbank:(this.Bank==undefined)?"" :this.Bank,
                      _FromDt:this._dataService.convertFromdd_mm_yyyTodd_mmm_yyy(this.FromDate),
                      _ToDt:this._dataService.convertFromdd_mm_yyyTodd_mmm_yyy(this.ToDate),
                      cmpcode:this._loginService.getLogin()[0].CMPCODE,
                      citycode1:this._loginService.getLogin()[0].CITYCODE1,
                      citycode:this._loginService.getLogin()[0].CITYCODE,
                      Fin_StartDate:this._loginService.getLogin()[0].FINANCIAL_YEAR.STARTDATE,
                      Fin_EndDate:this._loginService.getLogin()[0].FINANCIAL_YEAR.ENDDATE
                   }
                   this._dataService.getData("Accounts/Fill_CashBook_BankRecRpt", jsonData)
                   .subscribe((data: any) => {
                    this.bankpayList=data.Table;
                    this.bankrecList=data.Table2;
                    this.IssueTotal=(data.Table1[0].TOTAL=="0.00")?"" :(data.Table1[0].TOTAL) ;
                    this.RecTotal=(data.Table3[0].TOTAL=="0.00")?"" :(data.Table3[0].TOTAL) ;
                    this.OurBankName=data.Table9[0].acctname
                    if(data.Table4[0].OPENINGBAL >=0)
                    {
                       this.OpBal=(data.Table4[0].OPENINGBAL=="0.00")?"0" :Math.abs(data.Table4[0].OPENINGBAL) ;
                    }
                    if(data.Table5[0].CRAMT >=0)
                    {
                      this.CrBalance=(data.Table5[0].CRAMT=="0.00")?"0" :Math.abs(data.Table5[0].CRAMT) ;
                    }
                    if(data.Table6[0].DRAMT >=0)
                    {
                      this.DrBalance=(data.Table6[0].DRAMT=="0.00")?"0" :Math.abs(data.Table6[0].DRAMT) ;
                    }
                    if(data.Table7[0].CURRENTCRAMT >=0)
                    {
                      this.CurrentCrbal=(data.Table7[0].CURRENTCRAMT=="0.00")?"" :Math.abs(data.Table7[0].CURRENTCRAMT) ;
                    }
                    if(data.Table8[0].CURRENTDRAMT >=0)
                    {
                      this.CurrentDrBal=(data.Table8[0].CURRENTDRAMT=="0.00")?"" :Math.abs(data.Table8[0].CURRENTDRAMT) ;
                    }
                    this.lblOpBal=this.OpBal+this.DrBalance-this.CrBalance;
                    this.lblclbal=this.lblOpBal + this.CurrentDrBal - this.CurrentCrbal;
                    this.lbldiff=this.BankBalance - this.lblclbal;
                    this.showResult = true;
                });
                this.OutstandingData();
                this.loaderService.display(false);
              } FromDateChanged(ev){
                this.FromDate=ev.formatted
                }
              ToDateChanged(ev){
                this.ToDate=ev.formatted
                }

                Openprint(No,Type)
                {
                  let theTop = (screen.height / 2) - (483 / 2);
                  let theLeft = (screen.width / 2) - (780 / 2);
                  let toolbar = 'resizable=no,scrollbars=no,width=800,height=450,status=no,left=' + theLeft + ',top=' + theTop;

                  if(confirm('Click OK to Print and Cancel to Edit')) {
                    if(Type=="PI")
                     {       window.open('./#/popup/Account-Purchase-Print/' + No + '/' , "PI Print", toolbar);      }
                    else if(Type=="JV")
                    {   window.open('./#/popup/Account-JV-Print/' + No + '/' + "JV" + '/' , "JV Print", toolbar); }
                    else if(Type=="CN")
                    {  window.open('./#/popup/Account-CreditNote-Print/' + No + '/' , "CN Print", toolbar);  }
                    else if(Type=="II")
                    {
                    //  window.open('./#/popup/Account-Invoice-Print/' + No + '/' , "INV Print", toolbar);
                    let URL = "http://180.179.207.163/Linkserp-ac/UI/Accounts/frm_Acc_Tran_Invoice_Print.aspx?" +
                    "huhpnk=" + this._loginService.getLogin()[0].GUID
                    + "&citycode=" + this._loginService.getLogin()[0].CITYCODE1
                    + "&Userid=" + this._loginService.getLogin()[0].CMPID
                    + "&cmp_code=" + this._loginService.getLogin()[0].CMPCODE
                    + "&InvoiceNo=" + No
                    + "&DisplayMode=" + "0"
                    +"&cmp_username=" + this._loginService.getLogin()[0].CMP_USERNAME
                        window.open(URL,  "Invoice Print", toolbar);
                        return false;
                    }
                    else if(Type=="SI")
                    {  return false;  }
                    else if(Type=="BI")
                    {  return false;   }
                    else
                    {  window.open('./#/popup/Account-CashBook-BankReceipt-print/' + Type + '/' + No + '/', "BR Print", toolbar);  }
                  }
                  else{
                    if(Type=="JV")
                    { this._router.navigate(['/accounts/Voucher/JV/Add/JV/' + No]);  }
                    else if(Type=="BR")
                    {  this._router.navigate(['/accounts/Voucher/BankRecpt/Add/' + No]); }
                    else if(Type=="BP")
                    { this._router.navigate(['/accounts/Voucher/BankRecpt/Add/' + No]); }
                    else if(Type=="SI")
                    { return false;  }
                    else if(Type=="II")
                    {  return false;  }
                    else if(Type=="PI")
                    {  this._router.navigate(['/accounts/Voucher/JV/Add/JV/' + No]);   }
                    return false;
                  }
               }
               OutstandingData()
               {
                const jsonData = {
                  _ourbank:(this.Bank==undefined)?"" :this.Bank,
                  _FromDt: this._dataService.convertFromdd_mm_yyyTodd_mmm_yyy(this.FromDate),
                  _ToDt:this._dataService.convertFromdd_mm_yyyTodd_mmm_yyy(this.ToDate),
                  cmpcode:this._loginService.getLogin()[0].CMPCODE,
                  citycode1:this._loginService.getLogin()[0].CITYCODE1,
                  citycode:this._loginService.getLogin()[0].CITYCODE,
                  Fin_StartDate:this._loginService.getLogin()[0].FINANCIAL_YEAR.STARTDATE,
                  Fin_EndDate:this._loginService.getLogin()[0].FINANCIAL_YEAR.ENDDATE
               }
               this._dataService.getData("Accounts/Fill_CashBook_BankRecRptNew1", jsonData)
               .subscribe((data: any) => {
                this.tbl1=data.Table;
                this.tbl2=data.Table2;
                this.tbl10=data.Table10;
                this.tbl11=data.Table11;
                this.tbl12=data.Table12;
                this.exIssueTotal=(data.Table1[0].Total=="0.00")?"" :(data.Table1[0].Total) ;
                this.exRecTotal=(data.Table3[0].Total=="0.00")?"" :(data.Table3[0].Total) ;
                this.Payoutstand=(data.Table10[0].CrAmtNotRef=="0.00")?"" :(data.Table10[0].CrAmtNotRef) ;
                this.Payoutstandtotal=(data.Table11[0].DrAmtNotRef=="0.00")?"" :(data.Table11[0].DrAmtNotRef) ;
                this.recoutstand=(data.Table12[0].ClBalance=="0.00")?"" :(data.Table12[0].ClBalance) ;
                this.OurBankName=data.Table9[0].acctname
                this.tempcr=(data.Table12[0].ClBalance=="0.00")?"" :(data.Table12[0].ClBalance) ;
                this.tempdr=(data.Table11[0].DrAmtNotRef=="0.00")?"" :(data.Table11[0].DrAmtNotRef) ;
                this.rptCurrentCrbal=(data.Table7[0].CurrentCrAmt=="0.00")?"" :(data.Table7[0].CurrentCrAmt) ;
                this.rptCurrentDrBal=(data.Table8[0].CurrentDrAmt=="0.00")?"" :(data.Table8[0].CurrentDrAmt) ;
                this.rptCrBalance=(data.Table5[0].CrAmt=="0.00")?"" :(data.Table5[0].CrAmt) ;
                this.rptDrBalance=(data.Table6[0].DrAmt=="0.00")?"" :(data.Table6[0].DrAmt) ;
                this.rptopbal=(data.Table4[0].OpeningBal=="0.00")?"" :(data.Table4[0].OpeningBal) ;

              });
              }
               // Export Outstanding — same polished visual format as the
               // Reconciliation Statement page's export (merged schedule, blue
               // header, single combined table, totals row), using this page's
               // own already-correct cleared-only figures. bankpayList/bankrecList
               // are the exact lists shown on screen, so the file always matches
               // what the user is looking at.
               ExportOutstand()
               {
                 this.cashbookExportser.exportOutstanding({
                   bankName: this.OurBankName,
                   fromDt: this.FromDate,
                   toDt: this.ToDate,
                   bankpayList: this.bankpayList,
                   bankrecList: this.bankrecList,
                   openingBalance: this.lblOpBal,
                   currentDrBal: this.CurrentDrBal,
                   currentCrbal: this.CurrentCrbal,
                   closingBalance: this.lblclbal,
                   bankBalance: this.BankBalance,
                   difference: this.lbldiff
                 }, "Bankrecout");
               }
               Exportrecstatement()
               {
                 this.cashbookExportser.export({
                   companyName: this.Compname,
                   bankName: this.OurBankName,
                   fromDt: this.FromDate,
                   toDt: this.ToDate,
                   bankpayList: this.bankpayList,
                   bankrecList: this.bankrecList,
                   issueTotal: this.IssueTotal,
                   recTotal: this.RecTotal,
                   openingBalance: this.lblOpBal,
                   currentDrBal: this.CurrentDrBal,
                   currentCrbal: this.CurrentCrbal,
                   closingBalance: this.lblclbal,
                   bankBalance: this.BankBalance,
                   difference: this.lbldiff
                 }, "bankrecstatement");
                 this.dataForExcel=[];
               }
               getCompanyName()
               {
                 this.loaderService.display(true)
                 var jsoncmp = {
                   CmpCode:this._loginService.getLogin()[0].CMPCODE,
                   CityCode:this._loginService.getLogin()[0].CITYCODE
                 }
                 this._dataService.getData("Accounts/fn_Acc_Rpt_Common_CompanyDetails", jsoncmp)
                   .subscribe((data: any) => {
                   this.Compname=data.Table[0].cmp_name
                   this.loaderService.display(false)
                   })
               }

               // Additive convenience — original component has no reset; this just
               // clears the form/result state, no change to any existing logic above.
               Reset() {
                 this.Bank = undefined;
                 this.FromDate = "";
                 this.ToDate = "";
                 this.BankBalance = undefined;
                 this.bankpayList = [];
                 this.bankrecList = [];
                 this.tbl1 = [];
                 this.tbl2 = [];
                 this.tbl10 = [];
                 this.tbl11 = [];
                 this.tbl12 = [];
                 this.showResult = false;
               }

               BackToSearch() {
                 this.showResult = false;
               }
        }
