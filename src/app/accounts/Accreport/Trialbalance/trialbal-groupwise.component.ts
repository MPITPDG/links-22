import { Component, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectionStrategy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { LoginService } from '../../../shared/service/loginService';
import { ToastCommonService } from '../../../shared/service/toastService';
import { IMyDpOptions } from 'mydatepicker';
import { LoaderService } from '../../../shared/service/loader.service';
import { HttpClient } from '@angular/common/http';
import { DataService } from 'src/app/shared/service/dataService';
import { ExportexcelService } from 'src/app/shared/service/exportexcel.service';
import { networkInterfaces } from 'os';
import { ExportexcelTrialBalanceGroupWise } from 'src/app/shared/service/exportexcel_trialbalance_grp';
import { catchError } from 'rxjs/operators';
import { EMPTY, Subscription } from 'rxjs';
@Component({
    selector: 'app-trialbalance-groupwise',
    templateUrl: './trialbal-groupwise.component.html',
    host: { class: 'kit-accreport' },
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
  export class TrialBalanceGroupwise implements OnInit, OnDestroy {
   

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
    private fySub: Subscription;
       constructor(
        private _dataService: DataService,
        private _toasterService: ToastCommonService,
        private loaderService: LoaderService,
        private _router: Router,
        private http: HttpClient, private exportser: ExportexcelService,
        private _activatedRoute: ActivatedRoute,
        private _loginService: LoginService,
        private _loaderService: LoaderService,
        private tbExcel: ExportexcelTrialBalanceGroupWise,
      ) { }
          ngOnInit() {
             this.setAsOnDate()
             /* the financial year is changed from the header dropdown without reloading this page: follow it */
             this.fySub = LoginService.financialYearChanged.subscribe((fy: any) => { if (fy) { this.setAsOnDate() } })
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
          ngOnDestroy() {
            if (this.fySub) { this.fySub.unsubscribe() }
          }
          /* As on date: today when the selected financial year contains today, otherwise the last day of that financial year */
          setAsOnDate() {
            const fy = this._loginService.getLogin()[0].FINANCIAL_YEAR
            const now = new Date()
            let asOn = new Date(now.getFullYear(), now.getMonth(), now.getDate())
            if (fy) {
              const start = this.parseFyDate(fy.STARTDATE)
              const end = this.parseFyDate(fy.ENDDATE)
              if (end && start && (asOn < start || asOn > end)) { asOn = end }
            }
            this.AsonDate = this._dataService.datechnge(asOn)
            this.FinalAsonDate = this._dataService.convertFromdd_mm_yyyTodd_mmm_yyy(this.AsonDate)
          }
          /* financial year dates look like 01-Apr-2025 */
          private parseFyDate(s: any): Date | null {
            const m = /^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/.exec((s || '').toString().trim())
            if (!m) { const d = new Date(s); return isNaN(d.getTime()) ? null : new Date(d.getFullYear(), d.getMonth(), d.getDate()) }
            const mon = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'].indexOf(m[2].toLowerCase())
            return mon < 0 ? null : new Date(+m[3], mon, +m[1])
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
            this.cmpnyname = (data.Table[0].cmp_name || '') + ' - ' + (data.Table[0].city_name || '')   // as the .NET export: <company> - <city>
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
    const asOn = this.FinalAsonDate;
    this._dataService.getData("Accounts/Acc_Rpt_TrialBalance_GrpWiseDtls_All_ToExcel_TrialBalanceGroupDetail", jsonview)
        .pipe(catchError((err: any) => {
          /* the server could not answer (HTTP 500, endpoint missing, network): stop the loader and say so */
          this.loaderService.display(false);
          this._toasterService.toast('error', 'error', 'The server could not return this report (service unavailable or server error). Please contact support.');
          return EMPTY;
        }))
        .subscribe((data: any) => {
        this.loaderService.display(false);
        /* an empty reply (no Table) means the stored procedure failed on the server */
        if (!data || !data.Table || data.Table.length == 0) {
          this._toasterService.toast('warning', 'warning', (data && data.Table) ? 'No Record Found !' : 'The report could not be generated on the server (stored procedure error). Please contact support.');
          return;
        }
        // each download is built from its own reply only, never from rows kept from an earlier download
        this.trbldata = data.Table;
        this.ExportToExcelData(this.trbldata, asOn);
            });
    }
    ExportToExcelData(rows: any[], asOn: string){
        var date = new Date(this._loginService.getLogin()[0].FINANCIAL_YEAR.STARTDATE);
        var todate = new Date(this._loginService.getLogin()[0].FINANCIAL_YEAR.ENDDATE);
        var startYear = date.getFullYear().toString().substr(-2);
        var endYear = todate.getFullYear().toString().substr(-2);
        /* file name as the .NET page: Accounts_TrialBalanceAll_GRP_WiseDtls-<ClientCode>-<from yy>-<to yy>; the client code is empty there, hence the double dash */
        this.tbExcel.download({
          titleLines: [this.cmpnyname, 'Trial Balance As On ' + asOn],
          rows: rows,
          fileName: 'Accounts_TrialBalanceAll_GRP_WiseDtls--' + startYear + '-' + endYear
        });
    }

}
