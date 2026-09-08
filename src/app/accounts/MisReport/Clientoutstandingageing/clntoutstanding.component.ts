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
import { FilterPipe } from 'ngx-filter-pipe';
@Component({
    selector: 'app-clntoutstanding',
    templateUrl: './clntoutstanding.component.html',
    styles: []
  })
  export class ClientOutstanding implements OnInit {
    expandContent = true;
    cloutList= [];
    CHECK:string;
    ASSIGNED_ON:string;
    FOLLOW_ASSIGNED_TO:string;
    dataForExcel = [];
    filteredData= [];
    cmpnyname:string;
    Ondate: any;
    Ondatetime: any;
    ClntName:string;
    HeaderText:string="OUTSTANDING - AGEING"
    public searchString: string;
      constructor(private _dataService: DataService,
        private _toasterService: ToastCommonService,
        private loaderService: LoaderService,
        private http: HttpClient, private datePipe: DatePipe,
        private _activatedRoute: ActivatedRoute,private _router:Router,
        private _loginService: LoginService,
        private exportser: ExportexcelService,
        private filterPipe: FilterPipe
      ) { }
      ngOnInit() { 
                this.verifyPermission('190','View')
                this.getOutstandingData();
                this.GetCompanyName();
                this.Ondate=new Date();
                this.Ondatetime=new Date();
                this.Ondate=this._dataService.datechnge1(this.Ondate)
                // this._loginService.verifyRights(190, 'View')
                // .subscribe((data: any) => { this._loginService.checkVerify('View', data); });
              
            }
            verifyPermission(formId, userMode) {
              this.loaderService.display(true);
              this._loginService.verifyRights(formId, '')
                  .subscribe((data: any) => {         
                     this._loginService.checkVerify(userMode, data);
                     this.loaderService.display(false);
          
                  });
          }
            getOutstandingData()
            {
              this.loaderService.display(true)
              var jsoncmp = {
              cmpcode:this._loginService.getLogin()[0].CMPCODE  }
                this._dataService.getData("Accounts/ACC_RPT_CLIENTOUTSTANDING_AGEING", jsoncmp)
                .subscribe((data: any) => {
                this.cloutList=data.Table1
                this.loaderService.display(false)
            })
          }
            GetCompanyName()
            {
            const jsonmaster = {
                CmpCode: this._loginService.getLogin()[0].CMPCODE,
                CityCode: this._loginService.getLogin()[0].CITYCODE,
              }
              this._dataService.getData("Accounts/fn_Acc_Rpt_Common_CompanyDetails", jsonmaster).subscribe((data: any) => {
              this.cmpnyname = data.Table[0].cmp_name
              })
            }
            showrow(chk,asgon,assignto)
            { 
              this.CHECK=chk;
              this.ASSIGNED_ON=asgon;
              this.FOLLOW_ASSIGNED_TO=assignto;
          }
          findDetails(data) {
            return this.cloutList.filter(x => x.ACCTCODE === data.ACCTCODE);
          }
          ExportOutstandingData()  { 
            const array = this.cloutList.map(({ ACCTCODE, ACCTNAME ,DOCCITY,CLIENT_STATUS,FOLLOW_ASSIGNED_TO,ASSIGNED_ON,
              RECEIVABLE_AS_ON,DAYS_000_030,DAYS_031_060,DAYS_061_090,DAYS_091_120,DAYS_121_180,DAYS_181_365,
              DAYS_366_730,DAYS_731_1095,DAYS_1096_9999,INVOICES_OUTSTANDING,UNADJUSTED_RECEIPTS,ADVANCE,ADVANCE_PAIDBYUS,CITYNAME
            }) => [ACCTCODE, ACCTNAME,DOCCITY,CLIENT_STATUS,FOLLOW_ASSIGNED_TO,ASSIGNED_ON,RECEIVABLE_AS_ON,DAYS_000_030,
              DAYS_031_060,DAYS_061_090,DAYS_091_120,DAYS_121_180,DAYS_181_365,DAYS_366_730,DAYS_731_1095,DAYS_1096_9999,INVOICES_OUTSTANDING
              ,UNADJUSTED_RECEIPTS,ADVANCE,ADVANCE_PAIDBYUS,CITYNAME]);
               let reportData = {
                title:this.cmpnyname,
                subtitle:"CLIENT OUTSTANDING AGEING AS ON " + this.Ondate,
                data: array,
                headers: ['CODE','CLIENT NAME','DOC CITY','CLIENT STATUS','FOLLOW UP ASSIGNED TO','ASSIGNED ON','RECEIVABLE AS ON','LESS THAN 30 DAYS','31 TO 60 DAYS',
               '61 TO 90 DAYS','91 TO 120 DAYS','120 TO 180 DAYS','181 to 365 Days','1 TO 2 Years','2 TO 3 Years','MORE THAN 3 Year',
              'TOTAL OF ALL INVOICES OUTSTANDING','UNADJUSTED RECEIPTS','ADVANCE','ADVANCE PAID ON BEHALF','INVOICE CITY'],
                pagetype: "CLOutstandingAgeing"
              }
              this.exportser.exportExceltry(reportData, this._loginService.getLogin()[0].CMP_USERNAME + "_" + "MIS_ACC_" + this.cmpnyname  );
              this.dataForExcel= [];
            }
            FilterData(searchValue: any)   {
             // this.filteredData = this.cloutList.filter((x => x.ACCTNAME) => {
             //   return x.ACCTNAME.toLowerCase().includes(searchValue.toLowerCase());
               // this.cloutList=this.filteredData;
            }    
        }       