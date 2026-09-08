import { Component, OnInit } from '@angular/core';
import { IMyDpOptions } from 'mydatepicker';
import { DataService } from '../../../shared/service/dataService';
import { LoginService } from '../../../shared/service/loginService';
import { ToastCommonService } from '../../../shared/service/toastService';
import { LoaderService } from '../../../shared/service/loader.service';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { ExportexcelService } from 'src/app/shared/service/exportexcel.service';
import { DatePipe } from '@angular/common';
@Component({
    selector: 'app-ClientSupplierActWiseList',
    templateUrl: './clientsuppactwiseList.component.html',
    styles: []
  })
  export class ClientSupplierActWiseList implements OnInit {

    public myDatePickerOptions: IMyDpOptions = {
        dateFormat: 'dd-mmm-yyyy',
        inline: false,
        height: '20px',
        width: '130px',
        componentDisabled: false,
        selectionTxtFontSize: '12px',
        editableDateField: false,
        sunHighlight: true,
        satHighlight: true,
        firstDayOfWeek: 'su',
        openSelectorTopOfInput: false,
        openSelectorOnInputClick: true,
        selectorHeight: '180px',
        selectorWidth: '200px'
      };
    FromDate;
    ToDate;
    ClientList:any = [];
    DataList = [];
    dataForExcel = [];
    cmpnyname:string;
    ClientName:string;
    Client:string;
    rptopbal:string;
     rptclbal:string;
     rptcrtotdr:any;
     rptcrtotcr:any;
     rptadvtotdr:any;
     rptadvtotcr:any;
     Header:string;
    constructor(private _dataService: DataService,
        private _toasterService: ToastCommonService,
        private loaderService: LoaderService,
        private http: HttpClient, private datePipe: DatePipe,
        private _activatedRoute: ActivatedRoute,private _router:Router,
        private _loginService: LoginService,
        private exportser: ExportexcelService,
      ) { }
      ngOnInit() {
          this.FillAccount();
          this.Header="Client Supplier Account Wise List"
        this.FromDate=this._loginService.getLogin()[0].FINANCIAL_YEAR.STARTDATE///this._dataService.datechnge(this._loginService.getLogin()[0].FINANCIAL_YEAR.STARTDATE)
        this.ToDate = new Date();
         this.ToDate =  this._dataService.datechnge1(this.ToDate)
        const jsonmaster = {
          CmpCode: this._loginService.getLogin()[0].CMPCODE,
          CityCode: this._loginService.getLogin()[0].CITYCODE,
        }
        this._dataService.getData("Accounts/fn_Acc_Rpt_Common_CompanyDetails", jsonmaster).subscribe((data: any) => {
          this.cmpnyname = data.Table[0].cmp_name
        })
        this._loginService.verifyRights(376, '')
              .subscribe((data: any) => { this._loginService.checkVerify('View', data); });
       }
    FillAccount(){
        const jsonAccount = {
        cmpcode: this._loginService.getLogin()[0].CMPCODE,
        citycode: this._loginService.getLogin()[0].CITYCODE,
        citycode1: this._loginService.getLogin()[0].CITYCODE1
      }
        this._dataService.getData("Accounts/CMP_FillClient", jsonAccount)
        .subscribe((data: any) => {
        this.ClientList = data.Table
        })
      }
      
    GetAccountName(icode){
        let updateItem = this.ClientList.find(item => item.acctcodename === icode);
        this.ClientName=updateItem.acctname;
    }
    FromDateChanged(ev){
      this.FromDate=ev.formatted
    }
    ToDateChanged(ev){
    this.ToDate=ev.formatted
    }
     

    ExportData(){
      this.loaderService.display(true)
      const jsonItem = {
            ClientCode:this.Client,
            cmpcode: this._loginService.getLogin()[0].CMPCODE,
            FromDate:this.FromDate,//this.datePipe.transform(this.FromDate, 'dd/MM/yyyy '),
            ToDate:this.ToDate,//this.datePipe.transform(this.ToDate, 'dd/MM/yyyy'),
            Fin_StartDate:this._loginService.getLogin()[0].FINANCIAL_YEAR.STARTDATE,
            Fin_EndDate:this._loginService.getLogin()[0].FINANCIAL_YEAR.ENDDATE,
          }
          this._dataService.getData("Accounts/ACC_RPT_CLIENT_OUTSTANDING_ALLCITY_ACCOUNT_WISE", jsonItem)
          .subscribe((data: any) => {
              if (data.Table.length > 0){
              this.DataList = data.Table
              this.DataList.forEach((row: any) => {
                this.dataForExcel.push(Object.values(row)) // array format push 
              })
              if(data.Table1[0].OPBAL >0)  {
                this.rptopbal=data.Table1[0].OPBAL  + " Dr"; }
              else{
                  this.rptopbal=(data.Table1[0].OPBAL=="0.00")?"0.0" :Math.abs(data.Table1[0].OPBAL) + " Cr";
              }
              if(data.Table1[0].CLBAL >0) {
                this.rptclbal=data.Table1[0].CLBAL  + " Dr";}
              else {
                this.rptclbal=(data.Table1[0].CLBAL=="0.00")?"" :Math.abs(data.Table1[0].CLBAL) + " Cr"; }
              if(data.Table1[0].TLDR >0) {
                 this.rptcrtotdr=data.Table1[0].TLDR + " Dr"; }
              else{
                 this.rptcrtotdr=(data.Table1[0].TLDR=="0.00")?"" :Math.abs(data.Table1[0].TLDR)+ "Dr"; }
              if(data.Table1[0].TLCR >0){
                 this.rptcrtotcr=data.Table1[0].TLCR +" Cr" ; }
              else {this.rptcrtotcr=(data.Table1[0].TLCR=="0.00")?"" :Math.abs(data.Table1[0].TLCR) 
              }
              if(data.Table2[0].ADVTOTALDR >0) {
                this.rptadvtotdr=data.Table2[0].ADVTOTALDR ;
              }
              else{
                this.rptadvtotdr=(data.Table2[0].ADVTOTALDR=="0.00")?"" :Math.abs(data.Table2[0].ADVTOTALDR) ;
              }
              if(data.Table2[0].ADVTOTALCR >0) {
                this.rptadvtotcr=data.Table2[0].ADVTOTALCR ;
              }
              else {
                this.rptadvtotcr=(data.Table2[0].ADVTOTALCR=="0.00")?"" :Math.abs(data.Table2[0].ADVTOTALCR) ;
              }
                let reportData = {
                  title: 'CLIENT OUTSTANDING ACCOUNTWISE LIST',
                  subtitle:' ACCOUNT:- ' + this.ClientName,
                  clntname: ' Period From:  ' + this.FromDate + ' To ' + this.ToDate,
                  data: this.dataForExcel,
                  headers: Object.keys(this.DataList[0]),
                  opbal:"Opening: " + this.rptopbal,
                  currenttot:"Current Total : " + this.rptcrtotdr + " " + this.rptcrtotcr,
                  closing:"Closing : " + this.rptclbal,
                  advance:"Advance : " + this.rptadvtotdr + this.rptadvtotcr,
                  pagetype: "ClSuppAcList"
                }
                this.exportser.exportExceltry(reportData, 'CLIENTOUTSTANDING_ACCOUNTWISE');
                this.dataForExcel= [];
            }
            else{
                this._toasterService.toast("warning","warning","No Record Found !")
                this.loaderService.display(false);
              }
          })
    }

}