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

@Component({
    selector: 'app-InvoicingDelay',
    templateUrl: './invdelay.component.html',
    styles: []
  })
  export class InvDelay implements OnInit {

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
      ClientList:any = [];
      DataList = [];
      dataForExcel = [];
      cmpnyname:string;
      Header:string="MIS - INVOICING DELAY";
      DataHeader= [];
      frmdtlbl :string="Sailing Date From";
      todtlbl :string="Sailing Date To";
      rdbtype:string="SEAEXPORT";
      Ondate: any;
      Ondatetime: any;PageType:string="MIS - Invoicing Delay";

    constructor(private _dataService: DataService,
        private _toasterService: ToastCommonService,
        private loaderService: LoaderService,
        private http: HttpClient, private datePipe: DatePipe,
        private _activatedRoute: ActivatedRoute,private _router:Router,
        private _loginService: LoginService,
        private exportser: ExportexcelService,
        private _loaderService: LoaderService
      ) { }
      ngOnInit() { 
        this.Ondate=new Date();
        this.Ondatetime=new Date();
         this.Ondate=this._dataService.datechnge1(this.Ondate)
         this.FillCompany();
        }
      lblchange(val){
         if(val.target.value=="SEAEXPORT"){
            this.frmdtlbl="Sailing Date From"
            this.todtlbl="Sailing Date To" 
          }
          else if(val.target.value=="SEAIMPORT"){
            this.frmdtlbl="Mbl Date From"
            this.todtlbl="Mbl Date To"  
          }
          else if(val.target.value=="AIREXPORT"){
              this.frmdtlbl="Flight Date From"
              this.todtlbl="Flight Date To"  
            }
          else if(val.target.value=="AIRIMPORT"){
              this.frmdtlbl="Flight Date From"
              this.todtlbl="Flight Date To"  }
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

      FromDateChanged(ev){
        this.FromDate=ev.formatted
      }
      
      ToDateChanged(ev){
      this.ToDate=ev.formatted
      }
       
      ExportData()  {
        if (!this.FromDate) {
            alert("Please select From Date.");
            return false;
        }
        else if (!this.ToDate) {
            alert("Please select To Date.");
            return false;
        }
        
        const jsonItem = {
          FromDate:this.FromDate,//this.datePipe.transform(this.FromDate, 'dd/MM/yyyy '),
          ToDate:this.ToDate,//this.datePipe.transform(this.ToDate, 'dd/MM/yyyy'),
          Mode: this.rdbtype,
          cmpcode: this._loginService.getLogin()[0].CMPCODE,
          citycode:this._loginService.getLogin()[0].CITYCODE,
        }
        this._dataService.getData("Accounts/ACC_MIS_INVOICE_DELAY", jsonItem)
        .subscribe((data: any) => {        
              this.DataList = data.Table
              this.DataList.forEach(function(x){delete x.STATUS});
              this.DataList.forEach(function(x){delete x.STATUS1});
              this.DataList.forEach((row: any) => {
              this.dataForExcel.push(Object.values(row)) // array format push 
            })
          
          this.ExportReportData();
        })
      
    }

    ExportReportData()      {
           this._loaderService.display(true);
          if(this.rdbtype=='SEAEXPORT')  {
            this.DataHeader=['JOB NO','SAILING DT','INV NO','INV DATE','INV AMOUNT','DELAY DAYS','INV CLIENT']
            //  this.DataList[0].forEach(x=>(x.FLIGHTDT==='FLIGHTDT')?'SAILING DT':x.FLIGHTDT)
            }
          else  if(this.rdbtype=='AIREXPORT')  {
              this.DataHeader=['JOB NO','AEROBILL DT','INV NO','INV DATE','INV AMOUNT','DELAY DAYS','INV CLIENT']
            }  
          else  if(this.rdbtype=='AIRIMPORT')  {
          this.DataHeader=['JOB NO','FLIGHT DT','INV NO','INV DATE','INV AMOUNT','DELAY DAYS','INV CLIENT']
            } 
          else {
          this.DataHeader=['JOB NO','MBL DT','INV NO','INV DATE','INV AMOUNT','DELAY DAYS','INV CLIENT']
            }         
          let reportData = {
            title: this.cmpnyname,
            subtitle:'INVOICEING DELAY REPORT ' ,
            clntname: ' Period From:  ' + this.FromDate + ' - ' + this.ToDate,
            data: this.dataForExcel,
            headers: this.DataHeader,
            subtitle1: ' FOR -  ' + this.rdbtype,
            subtitle2: ' Timeline:  ' + this.FromDate + ' - ' + this.ToDate,
            subtitle3:  ' Report Generated by : ' + this._loginService.getLogin()[0].FULLNAME,
            subtitle4:  ' Report Generate on  : ' + this.Ondate + ' ' + this.datePipe.transform(this.Ondatetime, 'hh:mm'),
            pagetype: "InvoicingDelay"
          }
          this.exportser.exportExceltry(reportData, this.rdbtype + ' INVOICEING DELAY');
          this.dataForExcel= [];
          this._loaderService.display(false);
        } 
      Reset() {
        this.FromDate="";
        this.ToDate="";
      } 
  } 
         
     