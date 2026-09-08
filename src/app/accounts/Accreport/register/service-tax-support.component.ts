
import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { LoginService } from '../../../shared/service/loginService';
import { ToastCommonService } from '../../../shared/service/toastService';
import { IMyDpOptions } from 'mydatepicker';
import { LoaderService } from '../../../shared/service/loader.service';
import { HttpClient } from '@angular/common/http';
import { DataService } from 'src/app/shared/service/dataService';
 
@Component({
  selector: 'app-ServiceTax-register',
  templateUrl: './service-tax-support.component.html',
  styles: []
})
export class serviceTaxSupport implements OnInit {

    public myDatePickerOptions: IMyDpOptions = {
        dateFormat: 'dd/mm/yyyy',
        inline: false,
        height: '18px',
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
        selectorWidth: '180px',
        disableUntil: { year: 0, month: 0, day: 0 },
        disableSince: { year: 0, month: 0, day: 0 }
      };
      FromDate: any;
      ToDate: any;
      Branch:string="ALL"
      City: string="";
     
      constructor(
        private _dataService: DataService,
        private _toasterService: ToastCommonService,
        private loaderService: LoaderService,
        private _router: Router,
        private http: HttpClient,  
        private _activatedRoute: ActivatedRoute,
        private _loginService: LoginService,
      ) { }
      ngOnInit() {
        this.City=this._loginService.getLogin()[0].CITYNAME
        //368
      }
       ExportToExcel()
       {
        const jsonview = {
          Frmdt:this.FromDate.formatted,
          Todt:this.ToDate.formatted,
          FinFrndt:this._dataService.datechnge(this._loginService.getLogin()[0].FINANCIAL_YEAR.STARTDATE),
          FinTodt:this._dataService.datechnge(this._loginService.getLogin()[0].FINANCIAL_YEAR.ENDDATE),
          CMP_CODE:this._loginService.getLogin()[0].CMPCODE,
          CITYCODE1:(this.Branch=="ALL")?this.Branch :this._loginService.getLogin()[0].CITYCODE1,
          CMPID   :this._loginService.getLogin()[0].CMPID  ,
          
        }
        this._dataService.getData("Accounts/ServiceTaxRegSupport", jsonview)
          .subscribe((data: any) => {
         let pklogid=  data.Table1[0].PKID;   
              //this.loaderService.display(false);
              this._router.navigate(['/accounts/report/ReportDownload/' + pklogid]);
          });
         // /accounts/report/register/ServiceTaxRegistersupport
       }
       clear(){}
}
