import { Component, OnInit,ViewChild,ElementRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { LoginService } from '../../../shared/service/loginService';
import { ToastCommonService } from '../../../shared/service/toastService';
import { IMyDpOptions } from 'mydatepicker';
import { LoaderService } from '../../../shared/service/loader.service';
import { HttpClient } from '@angular/common/http';
import { DataService } from 'src/app/shared/service/dataService';
import { ExportexcelService } from 'src/app/shared/service/exportexcel.service';
import { networkInterfaces } from 'os';
@Component({
    selector: 'app-trialbalance-groupwise',
    templateUrl: './trialbal-groupwise.component.html',
    styles: []
  })
  export class TrialBalanceGroupwise implements OnInit {
   

    public myDatePickerOptionsInv: IMyDpOptions = {
      dateFormat: 'dd/mm/yyyy',
      inline: false,
      height: '20px',
      width: '180px',
      componentDisabled: false,
      selectionTxtFontSize: '12px',
      editableDateField: false,
      sunHighlight: true,
      satHighlight: true,
      firstDayOfWeek: 'su',
      openSelectorTopOfInput: false,
      openSelectorOnInputClick: true,
      selectorHeight: '180px',
      selectorWidth: '200px' , 
      disableUntil: {year: 0, month: 0, day: 0},
      disableSince: {year: 0, month: 0, day: 0}
  };
    
  
    
    Header:string="TRIAL BALANCE - GROUP WISE";
    AsonDate;
    FinalAsonDate;
    asondt;
    dataForExcel = [];
    trbldata = [];

     

    cmpnyname:string;
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
             this.AsonDate = new Date();
             this.AsonDate =  this._dataService.datechnge(this.AsonDate)
             this.FinalAsonDate = this._dataService.convertFromdd_mm_yyyTodd_mmm_yyy(this.AsonDate)
            // this.asondt=new Date();
            // this.asondt =  this._dataService.convertFromdd_mm_yyyTodd_mmm_yyy(this.asondt);//this._dataService.datechnge1(this.asondt)
            // if (this._dataService.date2Comparison(this._loginService.getLogin()[0].FINANCIAL_YEAR.ENDDATE,this.asondt) == false)
            //  {
            //   this.AsonDate = new Date();
            //   this.AsonDate =  this._dataService.datechnge(this.AsonDate)
              
            // }else
            // {
            //   this.AsonDate =  this._loginService.getLogin()[0].FINANCIAL_YEAR.ENDDATE
            // }
          
            this.verifyPermission('103','View')  
            this.FillCompany();
         
           }
           verifyPermission(formId, userMode) {
            this._loaderService.display(true);
            this._loginService.verifyRights(formId, '')
                .subscribe((data: any) => {          
                   this._loginService.checkVerify(userMode, data);
                   this._loaderService.display(false);
       });
        }
            FillCompany(){
            const jsonmaster = {
            CmpCode: this._loginService.getLogin()[0].CMPCODE,
            CityCode: this._loginService.getLogin()[0].CITYCODE,
                }
            this._dataService.getData("Accounts/fn_Acc_Rpt_Common_CompanyDetails", jsonmaster).subscribe((data: any) => {
            this.cmpnyname = data.Table[0].cmp_name
              })
          }
         
          AsOnDateChanged(ev){
            this.AsonDate=ev.formatted
            this.FinalAsonDate = this._dataService.convertFromdd_mm_yyyTodd_mmm_yyy(this.AsonDate)
            }
        
    ExportToExcel()
    {
        this.loaderService.display(true);
        //  this.FinalAsonDate = new Date();
        //  this.FinalAsonDate =  this._dataService.convertFromdd_mm_yyyTodd_mmm_yyy(this.asondt)
        if (this.AsonDate == "" || this.AsonDate == undefined) { 
        // if (asondt == "") { 
          this._toasterService.toast('warning', 'warning', "As On Date cannot be blank !.");
          this.loaderService.display(false);
          return false;
        }
        const jsonview = {
        FinStartDate:this._loginService.getLogin()[0].FINANCIAL_YEAR.STARTDATE,
        FinEndDate:this._loginService.getLogin()[0].FINANCIAL_YEAR.ENDDATE,
        cmp_code:this._loginService.getLogin()[0].CMPCODE,
        CityCode1:this._loginService.getLogin()[0].CITYCODE1,
        FinEndDate1:this.FinalAsonDate ,
        }
    this._dataService.getData("Accounts/Acc_Rpt_TrialBalance_GrpWiseDtls_All_ToExcel_TrialBalanceGroupDetail", jsonview)
        .subscribe((data: any) => {
        this.trbldata=data.Table;
        this.trbldata.forEach((row: any) => {
        this.dataForExcel.push(Object.values(row)) // array format push 
        })
        this.ExportToExcelData();
            });
        this.loaderService.display(false);
    }
    ExportToExcelData(){
    
        var date = new Date(this._loginService.getLogin()[0].FINANCIAL_YEAR.STARTDATE);
        var todate = new Date(this._loginService.getLogin()[0].FINANCIAL_YEAR.ENDDATE);
        var startshortYear = date.getFullYear(); 
        var startYear = startshortYear.toString().substr(-2);
        var toshortYear = todate.getFullYear(); 
        var endYear = toshortYear.toString().substr(-2);
          let reportData = {
            title: this.cmpnyname,
            subtitle:'Trial Balance As On ' + this.AsonDate ,
            data: this.dataForExcel,
            headers: Object.keys(this.trbldata[0]),
            pagetype: "TrialBalanceGrpwise"
          }
          this.exportser.exportExceltry(reportData,'Accounts_TrialBalanceAll_GRP_WiseDtls ' + startYear + ' - ' + endYear);
          this.dataForExcel= [];
    }   

}