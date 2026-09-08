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
    selector: 'app-receivable-anyoneclient-ageing',
    templateUrl: './rcbl-anyoneClnt-ageing.component.html',
    styles: []
  })
  export class ReceivableAnyOneClientAgeing implements OnInit {
  
    AccountList:any = [];
    Client:string;
    ClientName:string;
    Header:string="BILL OUTSTANDING - RECEIVABLE AGEWISE";
    Ondate: any;
    dataForExcel = [];
    outstandList= [];
    UnAdjAmtList:any = [];
    advList:any = [];
    constructor(
        private _dataService: DataService,
        private _toasterService: ToastCommonService,
        private loaderService: LoaderService,
        private _router: Router,
        private http: HttpClient, private exportser: ExportexcelService,
        private _activatedRoute: ActivatedRoute,
        private _loginService: LoginService,
        private _loaderService: LoaderService,
      ) { }
        ngOnInit() {

          this._loaderService.display(true)
          this.verifyPermission('153','View')
          this.Ondate=new Date();
          this.Ondate=this._dataService.datechnge1(this.Ondate)
          this.FillAccount();
          // this._loginService.verifyRights(153, '')
          // .subscribe((data: any) => { this._loginService.checkVerify('View', data); });
          this._loaderService.display(false)
  }
  verifyPermission(formId, userMode) {
    this.loaderService.display(true);
    this._loginService.verifyRights(formId, '')
        .subscribe((data: any) => {         
           this._loginService.checkVerify(userMode, data);
           this.loaderService.display(false);

        });
}
  FillAccount(){
    const jsonItem = {
    cmpcode: this._loginService.getLogin()[0].CMPCODE,
    citycode: this._loginService.getLogin()[0].CITYCODE,
    citycode1: this._loginService.getLogin()[0].CITYCODE1,
    }
    this._dataService.getData("Accounts/Acc_Fill_Export", jsonItem)
    .subscribe((data: any) => {
    this.AccountList = data.Table
    this._loaderService.display(false)
    })
  }
  GetAccountName(icode){
    let updateItem = this.AccountList.find(item => item.EXP_CODE === icode);
    this.ClientName=updateItem.EXP_NAME_CITY;
  }
  ExportToExcel()
{
  const jsonvdata = {
    ClientCode:this.Client,
    FinStartDate:this._loginService.getLogin()[0].FINANCIAL_YEAR.STARTDATE,
    FinEndDate:this._loginService.getLogin()[0].FINANCIAL_YEAR.ENDDATE   ,
    cmpcode:this._loginService.getLogin()[0].CMPCODE,
    citycode1   :this._loginService.getLogin()[0].CITYCODE1  ,
     
   }
   this._dataService.getData("Accounts/Acc_Rpt_Receivable_AgeWise_XL_35", jsonvdata)
     .subscribe((data: any) => {
    this.outstandList=data.Table1;   
    this.UnAdjAmtList=data.Table3;
    this.advList=data.Table5;
    this.outstandList.forEach((row: any) => {
        this.dataForExcel.push(Object.values(row))
        });
        this.ExportToExcelAdv();
      }); 
    }
    

    ExportToExcelAdv(){

        const arrunadjamtdata = this.UnAdjAmtList.map(({ BILLTYPE,TRANSCODE, BILLDATE ,RECEIPTAMT,ADJUSTEDAMT,UNADJUSTEDAMT }) => 
        [BILLTYPE,TRANSCODE, BILLDATE,RECEIPTAMT,ADJUSTEDAMT,UNADJUSTEDAMT]);
        const arradvdata = this.advList.map(({ BILLTYPE,BILLNO, BILLDATE ,ADDRAMT ,ADCRAMT}) => 
        [BILLTYPE,BILLNO, BILLDATE,ADDRAMT,ADCRAMT]);
       
      let reportData = {
        data: this.dataForExcel,
        UnAdjAmtdata:arrunadjamtdata,
        advdata:arradvdata,
        headers: ['BILLTYPE','BILL NO','BILL DATE','INVOICE AMT','RECEIVED AMT','PENDING AMT','Less Than 30 days',
                    '31 To 60 days','61 To 90 days','91 To 120 days','121 To 180 days','More Than 180 days'],
        unadjamtheaders: ["BillType","Bill No","Date","Receipt Amt","AdjustedAmt","UnAdjustedAmt"],
        advheaders: ["BillType","Bill No","Date","Amount"],
        pagetype: "ReceivableAnyOneClientAgeing",
        title:' Bills Outstanding - Receivable Ageing As on' +  this.Ondate,
        subtitle:this.ClientName,
         }
       this.exportser.exportExceltry(reportData, "Bills Outstanding - Receivable Ageing-"+ this.ClientName + '('+ this.Client + ')' );  
      }  

}

