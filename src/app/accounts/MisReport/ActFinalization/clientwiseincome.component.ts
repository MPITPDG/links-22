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
    selector: 'app-ClientwiseIncome',
    templateUrl: './clientwiseincome.component.html',
    styles: []
  })

  export class ClientwiseIncomeComponent implements OnInit {

    public myDatePickerOptions: IMyDpOptions = {
        dateFormat:  'dd/mm/yyyy',
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
    AccountList:any = [];
    IncomeTaxList = [];
    dataForExcel = [];
    displayType: string = 'SEARCH';
    Compname:string;
    Type: string = 'CODE';
    Account:string;
    cmpnyname:string;
    PageType:string;
    AccountName:string;
    Ondate: any;
    Ondatetime: any;
    CITYCODE:string="ALL";
    Mode:string;
    subtitletype:string;
    rptname:string;
    Header:string;
    CITYNAME: string;

      constructor(private _dataService: DataService,
        private _toasterService: ToastCommonService,
        private loaderService: LoaderService,
        private http: HttpClient, private datePipe: DatePipe,
        private _activatedRoute: ActivatedRoute,private _router:Router,
        private _loginService: LoginService,
        private exportser: ExportexcelService,
      ) { }

      ngOnInit() {
        this._activatedRoute.params.subscribe(params => {
          this.Mode = params["Mode"]})
       //   console.log(this._loginService.getLogin())
       this.CITYNAME= this._loginService.getLogin()[0].CITYNAME;
          if(this.Mode=="INCOME") {
            this.Header = "Clientwise Income Tax"
            this.PageType= "Clientwise Income Tax"
            this.verifyPermission('281','View')
          }
        else {
          this.Header = "Supplierwise Expense"
          this.PageType= "Supplierwise Expense"
          this.verifyPermission('380','View')
        }
        this.FillAccount()
        this.FromDate=this._dataService.datechnge(this._loginService.getLogin()[0].FINANCIAL_YEAR.STARTDATE);
        this.ToDate = this._dataService.datechnge(this._loginService.getLogin()[0].FINANCIAL_YEAR.ENDDATE);
        this.Ondate=new Date();
        this.Ondatetime=new Date();
        this.Ondate=this._dataService.datechnge1(this.Ondate)
        
        const jsonmaster = {
          CmpCode: this._loginService.getLogin()[0].CMPCODE,
          CityCode: this._loginService.getLogin()[0].CITYCODE,
        }
        this._dataService.getData("Accounts/fn_Acc_Rpt_Common_CompanyDetails", jsonmaster).subscribe((data: any) => {
          this.cmpnyname = data.Table[0].cmp_name
        })
       
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
        const jsonAccount = {
          cmpcode: this._loginService.getLogin()[0].CMPCODE,
          citycode: this._loginService.getLogin()[0].CITYCODE,
          citycode1: this._loginService.getLogin()[0].CITYCODE1
        }
        this._dataService.getData("Accounts/ACC_FILL_UNDERGROUP_ACCOUNTS", jsonAccount)
        .subscribe((data: any) => {
        this.AccountList = data.Table
        })
      }

      FromDateChanged(ev){
        this.FromDate=ev.formatted
      }
      
      ToDateChanged(ev){
      this.ToDate=ev.formatted
      }

    ExportData(){

      if(this.CITYCODE=="ALL")  {
        this.CITYCODE="ALL"
      }
      else {
        this.CITYCODE=this._loginService.getLogin()[0].CITYCODE1
      } 
      if( this.Mode=="INCOME")   { 
        this.subtitletype=this.AccountName + ' Income from Client ';
        this.rptname="Income from Client"
       } 
       else{
         this.subtitletype=this.AccountName + ' Paid To Supplier ';
         this.rptname= 'Expenses Paid To Supplier '
        } 
      const jsonItem = {
        AccountCode:this.Account,
        FromDate:this.FromDate,
        ToDate:this.ToDate,
        cmpcode: this._loginService.getLogin()[0].CMPCODE,
        citycode: this.CITYCODE,
        mode: this.Mode   
       }
      this._dataService.getData("Accounts/ACC_MIS_INCOME_TAX", jsonItem)
      .subscribe((data: any) => {
        if (data.Table.length > 0){
            this.IncomeTaxList = data.Table
            this.IncomeTaxList.forEach(function(x){delete x.CLIENTCODE});
            this.IncomeTaxList.forEach(function(x){delete x.DR_AMOUNT});
            this.IncomeTaxList.forEach(function(x){delete x.CR_AMOUNT});
            this.IncomeTaxList.forEach((row: any) => {
              this.dataForExcel.push(Object.values(row)) // array format push 
            })
      
          let reportData = {
            title: this.cmpnyname,
            subtitle:this.subtitletype ,
            subtitle1: ' Account Name ' + this.AccountName,
            subtitle2: ' Timeline:  ' + this.FromDate + ' - ' + this.ToDate,
            subtitle3:  ' Report Generated by : ' + this._loginService.getLogin()[0].FULLNAME,
            subtitle4:  ' Report Generate on  : ' + this.Ondate + ' ' + this.datePipe.transform(this.Ondatetime, 'hh:mm'),
            data: this.dataForExcel,
            headers: ['NAME','AMOUNT','CITY','ADDRESS','PANNO'],
            pagetype: "ClientIncomeTax"
          }
        this.exportser.exportExceltry(reportData, this.rptname + "-" + this.AccountName + "(" + this.Account + ")");
        this.dataForExcel= [];
     }
      else{
        this._toasterService.toast("warning","warning","No Record Found !")
        this.loaderService.display(false);
      }
    })
  }
  
  GetAccountName(icode){
      let updateItem = this.AccountList.find(item => item.ACCTCODE === icode);
      this.AccountName=updateItem.ACCTNAME;
  }

}