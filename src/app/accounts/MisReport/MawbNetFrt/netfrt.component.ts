import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { IMyDpOptions } from 'mydatepicker';
import { DataService } from '../../../shared/service/dataService';
import { LoginService } from '../../../shared/service/loginService';
import { ToastCommonService } from '../../../shared/service/toastService';
import { LoaderService } from '../../../shared/service/loader.service';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { ExportexcelService } from 'src/app/shared/service/exportexcel.service';
import { DatePipe } from '@angular/common';
import { FIN_PERIODS, FinPeriod, finRange, finDp } from '../../Accreport/fin-kit';
@Component({
    selector: 'app-MAWBNetfrt',
    templateUrl: './netfrt.component.html',
    host: { class: 'kit-accreport' }, // Links: import-page + accreport-page are global (src/styles/kit)
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
  export class MAWBFRT implements OnInit {

    public myDatePickerOptionsRpt: IMyDpOptions = {
      dateFormat: 'dd/mm/yyyy',
      inline: false,
      height: '20px',
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
      selectorWidth: '200px'
    };

    FromDate;
    ToDate;
    DataList = [];
    dataForExcel = [];
    Branch:string="";
    BranchName:string="";
    City:string="";
    Header:string="MAWB NET FREIGHT ";
    DataHeader= [];
    PageType:string="MAWB NET FREIGHT ";
    constructor(private _dataService: DataService,
        private _toasterService: ToastCommonService,
        private loaderService: LoaderService,
        private http: HttpClient, private datePipe: DatePipe,
        private _activatedRoute: ActivatedRoute,private _router:Router,
        private _loginService: LoginService,
        private exportser: ExportexcelService,
      ) { }
      ngOnInit() { 
          this.City=this._loginService.getLogin()[0].CITYNAME
          this.FromDate=this._dataService.datechnge(this._loginService.getLogin()[0].FINANCIAL_YEAR.STARTDATE)
          //this.ToDate = new Date();
          this.ToDate =  this._dataService.datechnge(this._loginService.getLogin()[0].FINANCIAL_YEAR.ENDDATE)
          this.verifyPermission('337','View')  
        }
        
      verifyPermission(formId, userMode) {
        this.loaderService.display(true);
        this._loginService.verifyRights(formId, '')
            .subscribe((data: any) => {          
              this._loginService.checkVerify(userMode, data);
              this.loaderService.display(false);

            });
      }
      FromDateChanged(ev){
          this.FromDate=ev.formatted
        }

      ToDateChanged(ev){
        this.ToDate=ev.formatted
        }

    ExportData(){
          if (!this.FromDate) {
            alert("Please select From Date.");
            return false;
          }
         else if (!this.ToDate) {
            alert("Please select To Date.");
            return false;
         }
          if(this.Branch=="ALL") {
            this.BranchName="All"
          }
          else  {
            this.BranchName=""
          } 
          const jsonItem = {
          cmpcode: this._loginService.getLogin()[0].CMPCODE,
          citycode1:this._loginService.getLogin()[0].CITYCODE1,
          FromDate:this.FromDate,//this.datePipe.transform(this.FromDate, 'dd/MM/yyyy '),
          ToDate:this.ToDate,//this.datePipe.transform(this.ToDate, 'dd/MM/yyyy'),
          Branch:this.BranchName}
          this._dataService.getData("Accounts/ACC_MIS_MAWB_NET_FREGHT", jsonItem)
          .subscribe((data: any) => {
            if (data.Table.length > 0){
              this.DataList = data.Table
              this.DataList.forEach((row: any) => {
                this.dataForExcel.push(Object.values(row)) // array format push 
              })
              let reportData = {
                title:"MAWB Net Freight DateWise",
                data: this.dataForExcel,
                headers: Object.keys(this.DataList[0]),
                pagetype: "MAWBNetFreight"
              }
              this.exportser.exportExceltry(reportData, "MAWB_Net_Freight_DateWise" + " - " + this.FromDate + " - " +  this.ToDate  );
              this.dataForExcel= [];
          }
          else{
            this._toasterService.toast("warning","warning","No Record Found !")
            this.loaderService.display(false);
          }
        })
    }

    // ---- redesign: quick period presets (same selDate string format the pickers emit) ----
    periods = FIN_PERIODS.filter(p => p.key !== 'custom');
    period: string = '';
    setPeriod(k: FinPeriod) {
        const r = finRange(k);
        if (!r) { return; }
        this.period = k;
        this.FromDate = finDp(r.from, this.myDatePickerOptionsRpt.dateFormat).formatted;
        this.ToDate = finDp(r.to, this.myDatePickerOptionsRpt.dateFormat).formatted;
    }
}
