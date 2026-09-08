import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { LoginService } from '../../../shared/service/loginService';
import { ToastCommonService } from '../../../shared/service/toastService';
import { IMyDpOptions } from 'mydatepicker';
import { LoaderService } from '../../../shared/service/loader.service';
import { HttpClient } from '@angular/common/http';
import { DataService } from 'src/app/shared/service/dataService';
import { ExportexcelService } from 'src/app/shared/service/exportexcel.service';

@Component({
  selector: 'app-invoice-register',
  templateUrl: './invoice-register.component.html',
  styles: [],
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
  PageType: any;
  PageName: string;
  constructor(
    private _dataService: DataService,
    private _toasterService: ToastCommonService,
    private loaderService: LoaderService,
    private _router: Router,
    private http: HttpClient, private exportser: ExportexcelService,
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
      this._dataService.getData("Accounts/fn_Acc_Rpt_Invoice_Register_XL_Search_Register", jsonmaster).subscribe((data: any) => {
        if (data.Table.length > 0){
          this.registerdata = data.Table
          this.registerdata.forEach((row: any) => {
            this.dataForExcel1.push(Object.values(row)) // array format push 
          })

          let reportData = {
            title: this.cmpnyname,
            subtitle: this.PageType + ' Search Register From ' + this.FromDate.formatted + ' To ' + this.ToDate.formatted,
            data: this.dataForExcel1,
            headers: Object.keys(this.registerdata[0]),
            pagetype: this.PageType
          }
          this.exportser.exportExceltry(reportData, "Report-Invoice Register");
      }
      else{
        this._toasterService.toast("warning","warning","No Record Found !")
        this.loaderService.display(false);
      }
      })
    
    } else if (this.PageType == "CashBook") {
      this._dataService.getData("Accounts/fn_Acc_Rpt_CashBook_Register_XL_Fill_CashBook", jsonmaster).subscribe((data: any) => {
        if (data.Table.length > 0){
          let cashbal = "", bankbal = ""
          cashbal = data.Table[0].Column1
          bankbal = data.Table1[0].Column1
          this.registerdata = data.Table2
          this.registerdata.forEach((row: any) => {
            this.dataForExcel1.push(Object.values(row))
          })

          let reportData = {
            title: this.cmpnyname,
            subtitle: this.PageType + ' Search Register From ' + this.FromDate.formatted + ' To ' + this.ToDate.formatted,
            data: this.dataForExcel1,
            headers: Object.keys(this.registerdata[0]),
            Bal1: cashbal,
            Bal2: bankbal,
            pagetype: this.PageType
          }
          this.exportser.exportExceltry(reportData, "Report-CashBook Register");
      }
      else{
        this._toasterService.toast("warning","warning","No Record Found !")
        this.loaderService.display(false);
      }
      })

    } else if (this.PageType == "Purchase") {
      this._dataService.getData("Accounts/fn_Acc_Rpt_Purchase_Register_XL_Fill", jsonmaster).subscribe((data: any) => {
        if (data.Table.length > 0){
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
            totalamount_text: data.Table1[0].HEADER,
            totalamount_value: data.Table1[0].TOTAL
          }
          this.exportser.exportExceltry(reportData, "Report-Purchase Register");
      }
      else{
        this._toasterService.toast("warning","warning","No Record Found !")
        this.loaderService.display(false);
      }
      })

    } else if (this.PageType == "Brokerage") {
      this._dataService.getData("Accounts/fn_frm_Acc_Rpt_Brokerage_Register_XL_Fill", jsonmaster).subscribe((data: any) => {
        if (data.Table.length > 0){
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
            totalamount_text: data.Table1[0].header,
            totalamount_value: data.Table1[0].Total
          }
          this.exportser.exportExceltry(reportData, "Report-Brokerage Register");
      }
      else{
        this._toasterService.toast("warning","warning","No Record Found !")
        this.loaderService.display(false);
      }
      })

    } else if (this.PageType == "CreditNote") {
      this._dataService.getData("Accounts/fn_Acc_Rpt_CN_Register_AcctDetail_XL", jsonmaster).subscribe((data: any) => {
        if (data.Table.length > 0){
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
          this.exportser.exportExceltry(reportData, "Report-CreditNote Register");
      }
      else{
        this._toasterService.toast("warning","warning","No Record Found !")
        this.loaderService.display(false);
      }
      })

    } else if (this.PageType == "Storage") {
      this._dataService.getData("Accounts/fn_Acc_Rpt_storage_Register_XL_Fill", jsonmaster).subscribe((data: any) => {
        if (data.Table.length > 0){
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
            totalamount_text: data.Table1[0].header,
            totalamount_value: data.Table1[0].Total
          }
          this.exportser.exportExceltry(reportData, "Report-Storage Register");
      }
      else{
        this._toasterService.toast("warning","warning","No Record Found !")
        this.loaderService.display(false);
      }
      })

    } else if (this.PageType == "EXPWOP") {
      this._dataService.getData("Accounts/fn_Acc_Rpt_EXPWOP_Register_XL", jsonmaster).subscribe((data: any) => {
        if (data.Table.length > 0){
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
        this._toasterService.toast("warning","warning","No Record Found !")
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
    this._dataService.getData("Accounts/fn_Acc_Rpt_Invoice_Register_ActDetail_XL_Search_Acct_details", jsonmaster).subscribe((data: any) => {
      if (data.Table.length > 0){
        this.registerdata_details = data.Table
        this.registerdata_details.forEach((row: any) => {
          this.dataForExcel2.push(Object.values(row))
        })

        let reportData = {
          title: this.cmpnyname,
          subtitle: this.PageType + ' Search Register From ' + this.FromDate.formatted + ' To ' + this.ToDate.formatted,
          data: this.dataForExcel2,
          headers: Object.keys(this.registerdata_details[0]),
          pagetype: this.PageType
        }

        this.exportser.exportExceltry(reportData, "Report-Invoice Register Details");
    }
    else{
      this._toasterService.toast("warning","warning","No Record Found !")
      this.loaderService.display(false);
    }
    })
  }
  clear() {
   this.FromDate="";
   this.ToDate="";
  }
}
