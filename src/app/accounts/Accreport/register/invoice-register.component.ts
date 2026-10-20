import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { LoginService } from '../../../shared/service/loginService';
import { ToastCommonService } from '../../../shared/service/toastService';
import { IMyDpOptions } from 'mydatepicker';
import { LoaderService } from '../../../shared/service/loader.service';
import { HttpClient } from '@angular/common/http';
import { DataService } from 'src/app/shared/service/dataService';
import { ExportexcelService } from 'src/app/shared/service/exportexcel.service';
import { RegisterExportService } from './register-export.service';
import { catchError } from 'rxjs/operators';
import { EMPTY } from 'rxjs';

import { FIN_PERIODS, FinPeriod, finRange, finDp } from '../fin-kit';
@Component({
  selector: 'app-invoice-register',
  templateUrl: './invoice-register.component.html',
  host: { class: 'kit-accreport' },
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class InvoiceRegisterComponent implements OnInit {

  public myDatePickerOptions: IMyDpOptions = {
    dateFormat: 'dd-mmm-yyyy',
    inline: false,
    height: '18px',
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
    selectorWidth: '200px',
    disableUntil: { year: 0, month: 0, day: 0 },
    disableSince: { year: 0, month: 0, day: 0 }
  };
  FromDate: any;
  ToDate: any;
  InvoiceData: any = [];
  dataForExcel1 = [];
  dataForExcel2 = [];

  registerdata_details = []
  registerdata = []
  cmpnyname: any;
  cmpFullName: string = "";   // "<company> - <city>", the second title line of the .NET exports
  PageType: any;
  PageName: string;
  constructor(
    private _dataService: DataService,
    private _toasterService: ToastCommonService,
    private loaderService: LoaderService,
    private _router: Router,
    private http: HttpClient, private exportser: ExportexcelService,
    private regExport: RegisterExportService,
    private _activatedRoute: ActivatedRoute,
    private _loginService: LoginService,
  ) { }
  ngOnInit() {
  //  console.log(this._loginService.getLogin())
    
    this.loaderService.display(true);
    this._activatedRoute.params.subscribe(params => {
      this.PageType = params["PageType"]
    })
    if (this.PageType == "Invoice") {
      this.PageName = "Invoice Register"
    } else if (this.PageType == "CashBook") {
      this.PageName = "CashBook Register"
    } else if (this.PageType == "Purchase") {
      this.PageName = "Purchase Register"
    } else if (this.PageType == "Brokerage") {
      this.PageName = "Brokerage Register"
    } else if (this.PageType == "Storage") {
      this.PageName = "Storage Register"
    } else if (this.PageType == "CreditNote") {
      this.PageName = "Credit Note Register"
    } else if (this.PageType == "EXPWOP") {
      this.PageName = "EXPWOP Register"
    }
    const jsonmaster = {
      CmpCode: this._loginService.getLogin()[0].CMPCODE,
      CityCode: this._loginService.getLogin()[0].CITYCODE,
    }
    this._dataService.getData("Accounts/fn_Acc_Rpt_Common_CompanyDetails", jsonmaster).subscribe((data: any) => {
      this.cmpnyname = data.Table[0].cmp_name
      this.cmpFullName = (data.Table[0].cmp_name || '') + ' - ' + (data.Table[0].city_name || '')
    })
    this.loaderService.display(false);
  }
  InvoiceDateChanged(dt,Type)
  {
    let INdt=this._dataService.datechnge(dt.formatted);
    let fin_frmdt=this._dataService.datechnge(this._loginService.getLogin()[0].FINANCIAL_YEAR.STARTDATE);
    
    let fin_tdt=this._dataService.datechnge(this._loginService.getLogin()[0].FINANCIAL_YEAR.ENDDATE);

    if (Type=='F')
    {     
      if (this._dataService.DateFromAndToComparision_exp(fin_frmdt,INdt) == false) { 
        this._toasterService.toast('error', 'Error', "From Date Should be greater than or Equal to Financial from Date.");    
        this.FromDate="";  
         return false; }
    }   
    if (Type=='T')  {  
      if (this._dataService.DateFromAndToComparision_exp(INdt,fin_tdt) == false) { 
        this._toasterService.toast('error', 'Error', "TO Date Should be less than or Equal to Financial To Date.");
        this.ToDate="";
        return false; }

      if (this._dataService.DateFromAndToComparision_exp(fin_frmdt,INdt) == false) { 
          this._toasterService.toast('error', 'Error', "From Date Should be greater than or Equal to Financial from Date.");
          this.ToDate="";
          return false; }
      }
}
  expt_exl() {
    this.loaderService.display(true);
    let frmdt=this._dataService.datechnge(this.FromDate.formatted);
    let fin_frmdt=this._dataService.datechnge(this._loginService.getLogin()[0].FINANCIAL_YEAR.STARTDATE);
    let tdt=this._dataService.datechnge(this.FromDate.formatted);
    let fin_tdt=this._dataService.datechnge(this._loginService.getLogin()[0].FINANCIAL_YEAR.ENDDATE);

    if (frmdt == "") { 
      this._toasterService.toast('error', 'Error', "From Date cannot be blank !.");
      this.loaderService.display(false);
       return false;
    }
    if (tdt == "") { 
      this._toasterService.toast('error', 'Error', "To Date cannot be blank !.");
      this.loaderService.display(false);
       return false; }


    if (this._dataService.DateFromAndToComparision_exp(fin_frmdt,frmdt) == false) { 
      this._toasterService.toast('error', 'Error', "From Date Should be greater than or Equal to Financial from Date.");
      this.loaderService.display(false);
       return false; }

   if (this._dataService.DateFromAndToComparision_exp(tdt,fin_tdt) == false) { 
        this._toasterService.toast('error', 'Error', "TO Date Should be less than or Equal to Financial To Date.");
        this.loaderService.display(false);
         return false; }

  if (this._dataService.DateFromAndToComparision_exp(fin_frmdt,tdt) == false) { 
          this._toasterService.toast('error', 'Error', "From Date Should be greater than or Equal to Financial from Date.");
          this.loaderService.display(false);
           return false; }

    const jsonmaster = {
      _FromDt: this.FromDate.formatted,
      _ToDt: this.ToDate.formatted,
      cmp_code: this._loginService.getLogin()[0].CMPCODE,
      citycode: this._loginService.getLogin()[0].CITYCODE,
      FINSTARTDATE: this._loginService.getLogin()[0].FINANCIAL_YEAR.STARTDATE,
      FINENDDATE: this._loginService.getLogin()[0].FINANCIAL_YEAR.ENDDATE
    }
   
    if (this.PageType == "Invoice") {
      this.api("Accounts/fn_Acc_Rpt_Invoice_Register_XL_Search_Register", jsonmaster).subscribe((data: any) => {
        if (data && data.Table && data.Table.length > 0){
          this.registerdata = data.Table

          /* the .NET export lists every job number of each invoice: fetch them in one call */
          const invNos = this.registerdata.map((r: any) => r.INV_NO)
          const exportInvoice = (jobs: any) => {
            this.regExport.exportInvoice({
              header: 'Invoice Search Register From ' + this.FromDate.formatted + ' To ' + this.ToDate.formatted,
              company: this.cmpFullName
            }, this.registerdata, jobs, "Invoice Register");
            this.loaderService.display(false);
          }
          this._dataService.Common("Accounts/fn_Acc_Rpt_Invoice_Register_XL_Search_JobNos", { InvNos: invNos }).subscribe((jd: any) => {
            const jobs: any = {}
            const rows = (jd && jd.Table) ? jd.Table : []
            rows.forEach((j: any) => {
              const k = (j.INV_NO + '').replace(/^'/, '')
              const v = (j.INV_JOBNO + '').replace(/^'/, '').trim()
              if (v !== '') { (jobs[k] = jobs[k] || []).push(v) }
            })
            exportInvoice(jobs)
          }, () => {
            /* job numbers could not be fetched (for example the API has not been updated yet): still export the register */
            this._toasterService.toast("warning", "warning", "Job numbers could not be loaded; exporting without them.")
            exportInvoice({})
          })
      }
      else{
        this._toasterService.toast("warning","warning", this.noDataMessage(data))
        this.loaderService.display(false);
      }
      })
    
    } else if (this.PageType == "CashBook") {
      this.api("Accounts/fn_Acc_Rpt_CashBook_Register_XL_Fill_CashBook", jsonmaster).subscribe((data: any) => {
        if (data && data.Table && data.Table.length > 0){
          let cashbal = "", bankbal = ""
          cashbal = data.Table[0].Column1
          bankbal = data.Table1[0].Column1
          this.registerdata = data.Table2

          this.regExport.exportCashBook({
            header: 'Cash Book Register From ' + this.FromDate.formatted + ' To ' + this.ToDate.formatted,
            company: this.cmpFullName
          }, cashbal, bankbal, this.registerdata, ((this._loginService.getLogin()[0].CMP_USERNAME || "") + "").trim() + "_Accounts_CashBook_Register");
          this.loaderService.display(false);
      }
      else{
        this._toasterService.toast("warning","warning", this.noDataMessage(data))
        this.loaderService.display(false);
      }
      })

    } else if (this.PageType == "Purchase") {
      this.api("Accounts/fn_Acc_Rpt_Purchase_Register_XL_Fill", jsonmaster).subscribe((data: any) => {
        if (data && data.Table && data.Table.length > 0){
          this.registerdata = data.Table

          this.regExport.exportPurchase({
            header: 'Purchase Register From ' + this.FromDate.formatted + ' To ' + this.ToDate.formatted,
            company: this.cmpFullName
          }, this.registerdata, data.Table1 && data.Table1[0], ((this._loginService.getLogin()[0].CMP_USERNAME || "") + "").trim() + "_Accounts_Purchase_Register");
          this.loaderService.display(false);
      }
      else{
        this._toasterService.toast("warning","warning", this.noDataMessage(data))
        this.loaderService.display(false);
      }
      })

    } else if (this.PageType == "Brokerage") {
      this.api("Accounts/fn_frm_Acc_Rpt_Brokerage_Register_XL_Fill", jsonmaster).subscribe((data: any) => {
        if (data && data.Table && data.Table.length > 0){
          this.registerdata = data.Table

          this.regExport.exportBrokerage({
            header: 'Brokerage Register From ' + this.FromDate.formatted + ' To ' + this.ToDate.formatted,
            company: this.cmpFullName
          }, this.registerdata, data.Table1 && data.Table1[0], ((this._loginService.getLogin()[0].CMP_USERNAME || "") + "").trim() + "_Accounts_Brokerage_Register");
          this.loaderService.display(false);
      }
      else{
        this._toasterService.toast("warning","warning", this.noDataMessage(data))
        this.loaderService.display(false);
      }
      })

    } else if (this.PageType == "CreditNote") {
      // This API action binds FromDate/ToDate/CmpCode/CityCode/Fin_StartDate/Fin_EndDate, not the
      // _FromDt/cmp_code/FINSTARTDATE names the other registers use, so the shared jsonmaster
      // never matched it (the request was rejected before the proc ran). Same values, its own names.
      const cnParams = {
        FromDate: jsonmaster._FromDt,
        ToDate: jsonmaster._ToDt,
        CmpCode: jsonmaster.cmp_code,
        CityCode: jsonmaster.citycode,
        Fin_StartDate: jsonmaster.FINSTARTDATE,
        Fin_EndDate: jsonmaster.FINENDDATE
      }
      this.api("Accounts/fn_Acc_Rpt_CN_Register_AcctDetail_XL", cnParams).subscribe((data: any) => {
        if (data && data.Table && data.Table.length > 0){
          this.registerdata = data.Table

          this.regExport.exportAutoGrid({
            header: 'Credit Note Register Accounts Detail From ' + this.FromDate.formatted + ' To ' + this.ToDate.formatted,
            company: this.cmpFullName
          }, this.registerdata, ((this._loginService.getLogin()[0].CMP_USERNAME || "") + "").trim() + "_Accounts_CreditNote_Register");
          this.loaderService.display(false);
      }
      else{
        this._toasterService.toast("warning","warning", this.noDataMessage(data))
        this.loaderService.display(false);
      }
      })

    } else if (this.PageType == "Storage") {
      this.api("Accounts/fn_Acc_Rpt_storage_Register_XL_Fill", jsonmaster).subscribe((data: any) => {
        if (data && data.Table && data.Table.length > 0){
          this.registerdata = data.Table

          this.regExport.exportStorage({
            header: 'Storage Register From ' + this.FromDate.formatted + ' To ' + this.ToDate.formatted,
            company: this.cmpFullName
          }, this.registerdata, data.Table1 && data.Table1[0], ((this._loginService.getLogin()[0].CMP_USERNAME || "") + "").trim() + "_Accounts_Storage_Register");
          this.loaderService.display(false);
      }
      else{
        this._toasterService.toast("warning","warning", this.noDataMessage(data))
        this.loaderService.display(false);
      }
      })

    } else if (this.PageType == "EXPWOP") {
      this.api("Accounts/fn_Acc_Rpt_EXPWOP_Register_XL", jsonmaster).subscribe((data: any) => {
        if (data && data.Table && data.Table.length > 0){
          this.registerdata = data.Table
          this.registerdata.forEach((row: any) => {
            this.dataForExcel1.push(Object.values(row))
          })

          let reportData = {
            title: this.cmpnyname,
            subtitle: this.PageType + ' Search Register From ' + this.FromDate.formatted + ' To ' + this.ToDate.formatted,
            data: this.dataForExcel1,
            headers: Object.keys(this.registerdata[0]),
            pagetype: this.PageType,
          }
          this.exportser.exportExceltry(reportData, "Report-EXPWOP Register");
      }
      else{
        this._toasterService.toast("warning","warning", this.noDataMessage(data))
        this.loaderService.display(false);
      }
      })

    }


  }

  expt_exl_details() {
    this.loaderService.display(true);
    let frmdt=this._dataService.datechnge(this.FromDate.formatted);
    let fin_frmdt=this._dataService.datechnge(this._loginService.getLogin()[0].FINANCIAL_YEAR.STARTDATE);
    let tdt=this._dataService.datechnge(this.FromDate.formatted);
    let fin_tdt=this._dataService.datechnge(this._loginService.getLogin()[0].FINANCIAL_YEAR.ENDDATE);

    if (frmdt == "") { 
      this._toasterService.toast('error', 'Error', "From Date cannot be blank !.");
      this.loaderService.display(false);
       return false;
    }
    if (tdt == "") { 
      this._toasterService.toast('error', 'Error', "To Date cannot be blank !.");
      this.loaderService.display(false);
       return false; }


    if (this._dataService.DateFromAndToComparision_exp(fin_frmdt,frmdt) == false) { 
      this._toasterService.toast('error', 'Error', "From Date Should be greater than or Equal to Financial from Date.");
      this.loaderService.display(false);
       return false; }

   if (this._dataService.DateFromAndToComparision_exp(tdt,fin_tdt) == false) { 
        this._toasterService.toast('error', 'Error', "TO Date Should be less than or Equal to Financial To Date.");
        this.loaderService.display(false);
         return false; }

  if (this._dataService.DateFromAndToComparision_exp(fin_frmdt,tdt) == false) { 
          this._toasterService.toast('error', 'Error', "From Date Should be greater than or Equal to Financial from Date.");
          this.loaderService.display(false);
           return false; }
           
    const jsonmaster = {
      _FromDt: this.FromDate.formatted,
      _ToDt: this.ToDate.formatted,
      cmp_code: this._loginService.getLogin()[0].CMPCODE,
      citycode: this._loginService.getLogin()[0].CITYCODE,
      Fin_StartDate: this._loginService.getLogin()[0].FINANCIAL_YEAR.STARTDATE,
      Fin_EndDate: this._loginService.getLogin()[0].FINANCIAL_YEAR.ENDDATE
    }
    this.api("Accounts/fn_Acc_Rpt_Invoice_Register_ActDetail_XL_Search_Acct_details", jsonmaster).subscribe((data: any) => {
      if (data && data.Table && data.Table.length > 0){
        this.registerdata_details = data.Table

        this.regExport.exportAutoGrid({
          header: 'Invoice Register Account Detail From ' + this.FromDate.formatted + ' To ' + this.ToDate.formatted,
          company: this.cmpFullName
        }, this.registerdata_details, "Report-Invoice Register Details");
        this.loaderService.display(false);
    }
    else{
      this._toasterService.toast("warning","warning", this.noDataMessage(data))
      this.loaderService.display(false);
    }
    })
  }
  /* report call with error handling: when the server cannot answer (endpoint missing on the live API, HTTP 500, network)
     stop the loader and say so, instead of leaving the screen waiting */
  api(name: string, json: any) {
    return this._dataService.getData(name, json).pipe(catchError((err: any) => {
      this.loaderService.display(false);
      this._toasterService.toast('error', 'Error', 'The server could not return this report (service unavailable or server error). Please contact support.');
      return EMPTY;
    }))
  }
  /* the API answers an empty result (no Table at all) when the stored procedure itself fails; an empty Table means no data */
  noDataMessage(data: any): string {
    return (data && data.Table) ? "No Record Found !" : "The report could not be generated on the server (stored procedure error). Please contact support."
  }
  clear() {
   this.FromDate="";
   this.ToDate="";
  }

    // ---- redesign: quick period presets (same my-date-picker model shape the pickers emit) ----
    periods = FIN_PERIODS.filter(p => p.key !== 'custom');
    period: string = '';
    setPeriod(k: FinPeriod) {
        const r = finRange(k);
        if (!r) { return; }
        this.period = k;
        this.FromDate = finDp(r.from, this.myDatePickerOptions.dateFormat);
        this.ToDate = finDp(r.to, this.myDatePickerOptions.dateFormat);
        // run the legacy financial-year checks exactly as a manual pick would
        this.InvoiceDateChanged(this.FromDate, 'F');
        this.InvoiceDateChanged(this.ToDate, 'T');
    }
}
