import { Component, OnInit,ViewChild,ElementRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { LoginService } from '../../../shared/service/loginService';
import { ToastCommonService } from '../../../shared/service/toastService';
import { IMyDpOptions } from 'mydatepicker';
import { LoaderService } from '../../../shared/service/loader.service';
import { HttpClient } from '@angular/common/http';
import { DataService } from 'src/app/shared/service/dataService';
import { ExportexcelService } from 'src/app/shared/service/exportexcel.service';
@Component({
    selector: 'app-OutstandingOverseasClient',
    templateUrl: './rcbl-overseasagent.component.html',
    styles: []
  })
  export class OutstandingOverseasClient implements OnInit {
    NetOutstanding:string
    AccountList:any = [];
    Client:string;
    ClientName:string;
    Status:string="All"
    Header:string="OUTSTANDING - OVERSEAS CLIENT ";
    searchHeaderText:string;
    Compname:string;
    Ondate: any;
    dataForExcel = [];
    outstandList= [];
    totpendList:any = [];
    recList:any = [];
    UnAdjAmtList:any = [];
    netoutstandList:any = [];
    advList:any = [];
    totadvList:any = [];
    actstmtallList:any = [];
    actstmtalltotList:any = [];
    workingList:any = [];
    constructor(
        private _dataService: DataService,
        private _toasterService: ToastCommonService,
        private _router: Router,
        private http: HttpClient, private exportser: ExportexcelService,
        private _activatedRoute: ActivatedRoute,
        private _loginService: LoginService,
        private loaderService: LoaderService,
      ) { }
        ngOnInit() {
          this.loaderService.display(true)
          this.Ondate=new Date();
          //this.Ondatetime=new Date();
          this.Ondate=this._dataService.datechnge1(this.Ondate)
          this.FillAccount();
          this.getCompanyName();
          this._loginService.verifyRights(182, '')
          .subscribe((data: any) => { this._loginService.checkVerify('View', data); });
          this.loaderService.display(false)
  }

  FillAccount(){
    const jsonItem = {
    cmpcode: this._loginService.getLogin()[0].CMPCODE,
    citycode: this._loginService.getLogin()[0].CITYCODE,
    citycode1: this._loginService.getLogin()[0].CITYCODE1,
    }
    this._dataService.getData("Accounts/ACC_FILLEXPOTERCITY_OVERSEAS_AGENT", jsonItem)
    .subscribe((data: any) => {
    this.AccountList = data.Table
    this.loaderService.display(false)
    })
  }
  ExportToExcel()
  {
    if (this.Client == "" || this.Client == undefined) { 
      this._toasterService.toast('error', 'Error', "Please Select Client !.");
      this.loaderService.display(false);
      return false;
     }
   const jsonview = {
    ClientName:this.ClientName, 
    ClientCode:this.Client,
    CmpCode:this._loginService.getLogin()[0].CMPCODE,
    CmpId   :this._loginService.getLogin()[0].CMPID ,
     
   }
   this._dataService.getData("Accounts/OutstandingReceivableOverseasAgent", jsonview)
     .subscribe((data: any) => {
    let pklogid=  data.Table1[0].PKID;   
         //this.loaderService.display(false);
         this._router.navigate(['/accounts/report/ReportDownload/' + pklogid]);
     });
    // /accounts/report/register/ServiceTaxRegistersupport
  }
  AdvSearch(){
    if (this.Client == "" || this.Client == undefined) { 
      this._toasterService.toast('error', 'Error', "Please Select Client !.");
      this.loaderService.display(false);
      return false;
     }
    const jsonvdata = {
      ClientCode:this.Client,
      cmp_code:this._loginService.getLogin()[0].CMPCODE,
      citycode1   :this._loginService.getLogin()[0].CITYCODE1  ,
       
     }
     this._dataService.getData("Accounts/Acc_Rpt_Receivable_AnyOneClient_XL_Client_Oustanding_ClientBill_35_Branch", jsonvdata)
       .subscribe((data: any) => {
        this.outstandList=data.Table;   
        this.totpendList=data.Table1;
        this.recList=data.Table2;
        this.UnAdjAmtList=data.Table3;
        this.netoutstandList  =data.Table4;
        this.advList=data.Table5;
        this.totadvList=data.Table6;
        this.actstmtallList=data.Table8;
        this.actstmtalltotList=data.Table9; 
        this.workingList=data.Table10;  
        this.workingList.forEach((row: any) => {
           this.dataForExcel.push(Object.values(row))
        });
        if(data.Table4[0].TOTALNetOutAMT>0)  {
          this.NetOutstanding = data.Table4[0].TOTALNetOutAMT +  " Dr";
        }else  {
          this.NetOutstanding = data.Table4[0].TOTALNetOutAMT +  " Cr";
        }
        this.ExportToExcelAdv();
      }); 
      
  }
  ExportToExcelAdv(){
    var date = new Date(this._loginService.getLogin()[0].FINANCIAL_YEAR.STARTDATE);
    var todate = new Date(this._loginService.getLogin()[0].FINANCIAL_YEAR.ENDDATE);
    var startshortYear = date.getFullYear(); 
    var startYear = startshortYear.toString().substr(-2);
    var toshortYear = todate.getFullYear(); 
    var endYear = toshortYear.toString().substr(-2);
    const arroutdata = this.outstandList.map(({ BILLTYPE,TRANSCODE, BILLDATE ,INVOICEAMT,RECEIVEDAMT,PENDINGAMT }) => 
         [BILLTYPE,TRANSCODE, BILLDATE ,INVOICEAMT,RECEIVEDAMT,PENDINGAMT]);
    const arrtotpenddata = this.totpendList.map(({ BILLTYPE,BILLNO, BILLDATE ,INVOICEAMT,ADJUSTEDAMT,TOTALPENDINGAMT}) => 
        [BILLTYPE,BILLNO, BILLDATE ,INVOICEAMT,ADJUSTEDAMT,TOTALPENDINGAMT]);
    const arrrecdata = this.recList.map(({ BILLTYPE,TRANSCODE, BILLDATE ,RECEIPTAMT,ADJUSTEDAMT,UNADJUSTEDAMT }) => 
        [BILLTYPE,TRANSCODE, BILLDATE,RECEIPTAMT,ADJUSTEDAMT,UNADJUSTEDAMT]);
    const arrunadjamtdata = this.UnAdjAmtList.map(({ BILLTYPE,BILLNO, BILLDATE ,RECEIPTAMT,ADJUSTEDAMT,TOTALUNADJUSTEDAMT }) => 
        [BILLTYPE,BILLNO, BILLDATE,RECEIPTAMT,ADJUSTEDAMT,TOTALUNADJUSTEDAMT]);
    const arrnetoutdata = this.netoutstandList.map(({ BILLTYPE,BILLNO, BILLDATE ,RECEIPTAMT,ADJUSTEDAMT,TOTALNetOutAMT }) => 
        [BILLTYPE,BILLNO, BILLDATE,RECEIPTAMT,ADJUSTEDAMT,TOTALNetOutAMT]);
    const arradvdata = this.advList.map(({ BILLTYPE,BILLNO, BILLDATE ,ADCRAMT }) => 
        [BILLTYPE,BILLNO, BILLDATE,ADCRAMT]);
    const arrtotadvdata = this.totadvList.map(({ BILLTYPE,BILLNO, ADDRAMT ,TOTALADVAMT }) => 
        [BILLTYPE,BILLNO, ADDRAMT,TOTALADVAMT]);
    const arractstmtall = this.actstmtallList.map(({ TRANSTYPE,TRANSCODE, TRANSDATE ,DRAMT,CRAMT,BILLNO,ENTRYTYPE }) => 
        [TRANSTYPE,TRANSCODE, TRANSDATE,DRAMT,CRAMT,BILLNO,ENTRYTYPE]);
    const arractstmttotall = this.actstmtalltotList.map(({ DRTOTAL,CRTOTAL, CLBAL }) => 
       [DRTOTAL,CRTOTAL, CLBAL]);
    
      let reportData = {
            data: arroutdata,
            totpenddata:arrtotpenddata,
            recdata:arrrecdata,
            UnAdjAmtdata:arrunadjamtdata,
            netoutstanddata:arrnetoutdata,
            advdata:arradvdata,
            totadvdata:arrtotadvdata,
            actstmtalldata:arractstmtall,
            actstmtalltotdata:arractstmttotall,
            workingdata:this.dataForExcel,
            headers: ["BillType","Bill No","Date","InvoiceAmt","ReceivedAmt","PendingAmt"],
            totpendheaders: ["BillType","Bill No","Date","InvoiceAmt","ReceivedAmt","PendingAmt"],
            recdataheaders: ["BillType","Bill No","Date","Receipt Amt","AdjustedAmt","UnAdjustedAmt"],
            unadjamtheaders: ["BillType","Bill No","Date","Receipt Amt","AdjustedAmt","UnAdjustedAmt"],
            netoutstandheaders: ["BillType","Bill No","Date","InvoiceAmt","ReceivedAmt","PendingAmt"],
            advheaders: ["BillType","Bill No","Date","Amount"],
            totadvheaders: ["BillType","Bill No","Date","Total"],
            actstmtheaders: ["Trans Type","Trans Code","Date","Dr Amount","Cr Amount","Bill No",'Entry Type'],
            actstmttotheaders: ["Dr Total ","Cr Total","Closing Balance"],
            workingheaders:Object.keys(this.workingList[0]),
            pagetype: "ReceivableAnyOneClient",
            title:this.Compname,
            subtitle:" Bill Outstanding As On " + this.Ondate,
            subtitle1:this.ClientName,
            clntname:"Total Receivable Rs. " + this.NetOutstanding,
      }
      this.exportser.exportExceltry(reportData, "Bills Outstanding-receivables-"+ this.ClientName + '('+ this.Client + ')' + startYear + ' - ' + endYear );  
  }  
  
  
   

  GetAccountName(icode){
    let updateItem = this.AccountList.find(item => item.EXP_CODE === icode);
    this.ClientName=updateItem.EXP_NAME_CITY;
  }
  getCompanyName()
  {
   
    var jsoncmp = {
      CmpCode:this._loginService.getLogin()[0].CMPCODE,
      CityCode:this._loginService.getLogin()[0].CITYCODE
    }
      this._dataService.getData("Accounts/fn_Acc_Rpt_Common_CompanyDetails", jsoncmp)
      .subscribe((data: any) => {
      this.Compname=data.Table[0].cmp_name
     })
  }
  Download()
  {
    let pklogid=  '276'  ;   
    this._router.navigate(['/accounts/report/ReportDownload/' + pklogid]);
  }
}