import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { LoginService } from '../../../shared/service/loginService';
import { ToastCommonService } from '../../../shared/service/toastService';
import { IMyDpOptions } from 'mydatepicker';
import { LoaderService } from '../../../shared/service/loader.service';
import { HttpClient } from '@angular/common/http';
import { DataService } from 'src/app/shared/service/dataService';
import { ExportexcelService } from 'src/app/shared/service/exportexcel.service';
import { DatePipe } from '@angular/common';
@Component({
  selector: 'app-Gst-register',
  templateUrl: './gst-register.component.html',
  styles: []
})
export class GstRegisterComponent implements OnInit {

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
  FromDate;
  ToDate;
  cmpnyname: any;
  PageType: any;
  PageName: string="Gst Register";
  Branch:string="ALL";
  City:string;
  constructor(
    private _dataService: DataService,
    private _toasterService: ToastCommonService,
    private loaderService: LoaderService,
    private _router: Router,
    private http: HttpClient, private exportser: ExportexcelService,
    private _activatedRoute: ActivatedRoute,
    private _loginService: LoginService,private datePipe: DatePipe,
  ) { }
  ngOnInit() {
    this.City=this._loginService.getLogin()[0].CITYNAME
    }
  ExportToExcel()
    {
    this.loaderService.display(true);  
   
    if (this.FromDate == "" || this.FromDate == undefined) { 
      this._toasterService.toast('error', 'Error', "From Date cannot be blank !.");
      this.loaderService.display(false);
      return false;
    }
    if (this.ToDate == "" || this.ToDate == undefined) { 
      this._toasterService.toast('error', 'Error', "To Date cannot be blank !.");
      this.loaderService.display(false);
      return false; }
      const jsondata= {
        Frmdt:this._dataService.datechnge(this.FromDate.formatted),
        Todt:this._dataService.datechnge(this.ToDate.formatted),
        FinFrndt:this._dataService.datechnge(this._loginService.getLogin()[0].FINANCIAL_YEAR.STARTDATE),
        FinTodt:this._dataService.datechnge(this._loginService.getLogin()[0].FINANCIAL_YEAR.ENDDATE),
        CMP_CODE:this._loginService.getLogin()[0].CMPCODE,
        CITYCODE:(this.Branch=="ALL")?this.Branch :this._loginService.getLogin()[0].CITYCODE,
        CMPID   :this._loginService.getLogin()[0].CMPID  ,
        }
        this._dataService.getData("Accounts/GstRegister", jsondata)
        .subscribe((data: any) => {
        let pklogid=  data.Table1[0].PKID;   
        this._router.navigate(['/accounts/report/ReportDownload/' + pklogid]);
    });
        this.loaderService.display(false);
  }
  clear() {
    this.FromDate="";
    this.ToDate="";
  }
}