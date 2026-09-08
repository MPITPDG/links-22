import { Component, OnInit} from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { LoginService } from '../../../shared/service/loginService';
import { ToastCommonService } from '../../../shared/service/toastService';
import { IMyDpOptions } from 'mydatepicker';
import { LoaderService } from '../../../shared/service/loader.service';
import { HttpClient } from '@angular/common/http';
import { DataService } from 'src/app/shared/service/dataService';
import { ExportexcelService } from 'src/app/shared/service/exportexcel.service';
@Component({
    selector: 'app-trialbalance-datewise',
    templateUrl: './trialbal-datewise.component.html',
    styles: []
  })
  export class TrialBalanceDatewise implements OnInit {
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
    
    Branch:string="1";
    City:string;
    Header:string="TRIAL BALANCE - DATE WISE";
    dataForExcel = [];
    FromDate;
    ToDate;
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
          this.City=this._loginService.getLogin()[0].CITYNAME
          this.FromDate=this._dataService.datechnge(this._loginService.getLogin()[0].FINANCIAL_YEAR.STARTDATE);
          this.ToDate = this._dataService.datechnge(this._loginService.getLogin()[0].FINANCIAL_YEAR.ENDDATE);
          this.verifyPermission('189','View')
          this._loaderService.display(false)
     }
      verifyPermission(formId, userMode) {
        this._loaderService.display(true);
        this._loginService.verifyRights(formId, '')
            .subscribe((data: any) => {          
              this._loginService.checkVerify(userMode, data);
              this._loaderService.display(false);

            });
        }
        FromDateChanged(ev){
          this.FromDate=ev.formatted
        }
        ToDateChanged(ev){
        this.ToDate=ev.formatted
        }
        ExportToExcel()
        {
          this.loaderService.display(true);
              if (this.FromDate == "" || this.FromDate == undefined) { 
              this._toasterService.toast('warning', 'warning', "From Date cannot be blank !.");
              this.loaderService.display(false);
              return false;
             }
            if (this.ToDate == "" || this.ToDate == undefined) { 
              this._toasterService.toast('warning', 'warning', "To Date cannot be blank !.");
              this.loaderService.display(false);
              return false; }
        
            const jsonview = {
            Frmdt:this.FromDate,
            Todt:this.ToDate,
            FinFrndt:this._dataService.datechnge(this._loginService.getLogin()[0].FINANCIAL_YEAR.STARTDATE),
            FinTodt:this._dataService.datechnge(this._loginService.getLogin()[0].FINANCIAL_YEAR.ENDDATE),
            CMP_CODE:this._loginService.getLogin()[0].CMPCODE,
            CITYCODE1:(this.Branch=="ALL")?this.Branch :this._loginService.getLogin()[0].CITYCODE1,
            CMPID   :this._loginService.getLogin()[0].CMPID ,
            CityName:this.City,
            chkcity:this.Branch
            }
            this._dataService.getData("Accounts/TrialBalance_Datewise", jsonview)
           .subscribe((data: any) => {
            let pklogid=  data.Table1[0].PKID;   
            this._router.navigate(['/accounts/report/ReportDownload/'+pklogid]);
             });
            this.loaderService.display(false);
        }
        DownLoad(){}
/*  ExportToExcel()
{
  this.loaderService.display(true);
      if (this.FromDate == "" || this.FromDate == undefined) { 
      this._toasterService.toast('warning', 'warning', "From Date cannot be blank !.");
      this.loaderService.display(false);
      return false;
     }
    if (this.ToDate == "" || this.ToDate == undefined) { 
      this._toasterService.toast('warning', 'warning', "To Date cannot be blank !.");
      this.loaderService.display(false);
      return false; }

    const jsonview = {
    Frmdt:this._dataService.datechnge(this.FromDate.formatted),
    Todt:this._dataService.datechnge(this.ToDate.formatted),
    FinFrndt:this._dataService.datechnge(this._loginService.getLogin()[0].FINANCIAL_YEAR.STARTDATE),
    FinTodt:this._dataService.datechnge(this._loginService.getLogin()[0].FINANCIAL_YEAR.ENDDATE),
    CMP_CODE:this._loginService.getLogin()[0].CMPCODE,
    CITYCODE1:(this.Branch=="ALL")?this.Branch :this._loginService.getLogin()[0].CITYCODE1,
    CMPID   :this._loginService.getLogin()[0].CMPID ,
    CityName:this.City,
    chkcity:this.Branch
    }
    this._dataService.getData("Accounts/TrialBalance_Datewise", jsonview)
   .subscribe((data: any) => {
    let pklogid=  data.Table1[0].PKID;   
    this._router.navigate(['/accounts/report/ReportDownload/'+pklogid]);
     });
    this.loaderService.display(false);
}*/
}