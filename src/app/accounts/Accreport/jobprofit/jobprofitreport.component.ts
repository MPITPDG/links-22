import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { LoginService } from '../../../shared/service/loginService';
import { ToastCommonService } from '../../../shared/service/toastService';
import { IMyDpOptions } from 'mydatepicker';
import { LoaderService } from '../../../shared/service/loader.service';
import { HttpClient } from '@angular/common/http';
import { DataService } from 'src/app/shared/service/dataService';
import { JobprofitserviceService } from 'src/app/shared/service/jobprofitservice.service';
import { environment } from 'src/environments/environment';
@Component({
  selector: 'app-jobprofitreport',
  templateUrl: './jobprofitreport.component.html',
  styles: []
})
export class JobprofitreportComponent implements OnInit {

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
  PageName: string = "job profit report"
  singlejob1: string = ""
  AccountTableList: any = []
  accountcode: string = ""
  branch: any;
  paydate: any;
  fromdt_acct: any = "";
  todt_acct: any = "";
  report_table1: any = [];
  report_table2: any = [];
  dataFortable1: any = [];
  dataFortable2: any = [];
  searchtype: string = "singlejob"
  mode_subtype: string = "";
  modetype: string = "";
  modetypeFinal: string = "";
  multi_tojobno: string = "";
  multi_fromjobno: string = "";
  to_datewise: any = "";
  from_datewise: any = "";
  single_jobno: string = "";
  detaildata_of: any;
  cityname: string="";
  constructor(
    private _dataService: DataService,
    private _toasterService: ToastCommonService,
    private loaderService: LoaderService,
    private _router: Router,
    private http: HttpClient, private exportser: JobprofitserviceService,
    private _activatedRoute: ActivatedRoute,
    private _loginService: LoginService,
  ) { }

  ngOnInit() {
    this.cityname=this._loginService.getLogin()[0].CITYNAME
    const jsoncmp = {
      CmpCode: this._loginService.getLogin()[0].CMPCODE,
      CityCode: this._loginService.getLogin()[0].CITYCODE,
      CityCode1: this._loginService.getLogin()[0].CITYCODE1,
    }
    //   console.log(jsoncmp)
    this._dataService.getData("Accounts/ACC_ACCOUNT_FILL_JOBPROFIT_Fill", jsoncmp)
      .subscribe((data: any) => {
        //  console.log(data)
        this.AccountTableList = data.Table
      })
  }
  print() {
    if (this.single_jobno == '' || this.single_jobno == undefined || this.single_jobno.length < 15) {
      alert("Enter 15 digit CreditNote No !")
      return false
    }
    let theTop = (screen.height / 2) - (483 / 2);
    let theLeft = (screen.width / 2) - (780 / 2);
    let toolbar = 'resizable=no,scrollbars=no,width=800,height=450,status=no,left=' + theLeft + ',top=' + theTop;
    window.open('./#/popup/Account-Job-Profit-Report/' + this.single_jobno + '/', "Job Profit Report", toolbar);
    this.Reset()

  }
  expt_excl() {
    if (this.searchtype == "acctwise") {
      this.acctwisesearch()
    } else if (this.searchtype == "DATE" || this.searchtype == "MJOB") {
      this.date_mjobtypeserch()
    }
  }
  acctwisesearch() {
    this.loaderService.display(true);
    const jsoncmp = {
      ACCTCODE: this.accountcode,
      BRANCH_CODE: this.branch,
      DATE_TYPE: this.paydate,
      FRDATE_U: this.fromdt_acct.formatted,
      TODATE_U: this.todt_acct.formatted,
      CmpCode: this._loginService.getLogin()[0].CMPCODE,
      CityCode: this._loginService.getLogin()[0].CITYCODE,
      cmpid: this._loginService.getLogin()[0].CMPID
    }
    this._dataService.getData("Accounts/ACCT_RPT_JOBWISE_ACCOUNT_JOBNO", jsoncmp)
      .subscribe((data: any) => {
        // console.log(data)
        // console.log(data.Table.length, data.Table1.length);

        if (data.Table.length > "0") {
          this.report_table1 = data.Table
          this.report_table1.forEach((row: any) => {
            this.dataFortable1.push(Object.values(row))
          })
        }
        if (data.Table1.length > "0") {
          this.report_table2 = data.Table1

          this.report_table2.forEach((row: any) => {
            this.dataFortable2.push(Object.values(row))
          })
        }
        //   console.log(this.report_table2);

        let reportData = {
          data1: this.dataFortable1,
          headers2: this.report_table2 != "" ? Object.keys(this.report_table2[0]) : "",
          data2: this.dataFortable2 != "" ? this.dataFortable2 : "",
          pagetype: "acctwise"
        }
        // console.log(reportData);
        this.exportser.exportExceltry(reportData, "AccountsWise Job Report");
        this.loaderService.display(false);
        this.Reset()
      })

  }
  clearDateControls() {
    this.from_datewise = null;
    this.to_datewise = null;
  }
  date_mjobtypeserch() {
    this.loaderService.display(true);
    if (this.searchtype == "DATE") {
      if (this.modetype == "AIR_exp" || this.modetype == "AIR_imp") {
        this.modetypeFinal = "AIR"
      } else if (this.modetype == "SEA_exp" || this.modetype == "SEA_imp") {
        this.modetypeFinal = "SEA"
      }
      else if (this.modetype == "ALL" || this.modetype == "ALL") {
        this.modetypeFinal = "ALL"
      }
    }

    const jsoncmp1 = {
      FromDate: this.from_datewise != "" ? this.from_datewise.formatted : "",
      ToDate: this.to_datewise != "" ? this.to_datewise.formatted : "",
      JobNoFrom: this.multi_fromjobno != "" ? this.multi_fromjobno : "",
      JobNoTo: this.multi_tojobno != "" ? this.multi_tojobno : "",
      SearchType: this.searchtype,
      DateType: this.mode_subtype != "" ? this.mode_subtype : "",
      Mode: this.modetypeFinal!=""? this.modetypeFinal:"",//this.modetype != "" ? this.modetype : "",
      citycode1: this._loginService.getLogin()[0].CITYCODE1,
      CityCode: this._loginService.getLogin()[0].CITYCODE,
      CmpCode: this._loginService.getLogin()[0].CMPCODE,
      con_code: ""
    }
    // console.log(jsoncmp1);
    
    this._dataService.getData("Accounts/ACC_RPT_JOBPROFITS_NEW", jsoncmp1)
      .subscribe((data: any) => {
        // console.log(data)
        let headrarray = ["[G100236] CUSTOM DUTY ", "", "TOTAL"]
        if (data.Table5.length > "0") {
          this.report_table1 = data.Table5
          this.report_table1.forEach((row: any) => {
            this.dataFortable1.push(Object.values(row))
          })
          for (var i = 0; i < this.report_table1.length; i++) {
            headrarray.push(this.report_table1[i].ACCTCODENAME)
          }
        }
        if (data.Table2.length > "0") {
          this.report_table2 = data.Table2
          this.report_table2.forEach((row: any) => {
            this.dataFortable2.push(Object.values(row))
          })
        }

        let reportData = {
          detail: (this.searchtype == "DATE") ? ("Timeline: " + this.from_datewise.formatted + " - " + this.from_datewise.formatted + " TYPE: " + this.modetype) : ("JOB No" + this.multi_fromjobno + "-" + this.multi_tojobno),
          data1: this.dataFortable1,
          headers2: this.report_table2 != "" ? Object.keys(this.report_table2[0]) : "",
          headers1: this.report_table1 != "" ? headrarray : "",
          data2: this.dataFortable2 != "" ? this.dataFortable2 : "",
          pagetype: "date_multijob"
        }
        // console.log(reportData);
        this.exportser.exportExceltry(reportData, "JOb Profit Report");
        this.loaderService.display(false);
        this.Reset()
      })

  }

  Reset() {
    this.single_jobno = ""
    this.multi_tojobno = ""
    this.multi_fromjobno = ""
    this.fromdt_acct = ""
    this.to_datewise = ""
    this.todt_acct = ""
    this.from_datewise = ""
    this.modetype = ""
    this.mode_subtype = ""
    this.accountcode = ""
    this.branch = ""
    this.paydate = ""
    this.searchtype= "singlejob"
  }
}
