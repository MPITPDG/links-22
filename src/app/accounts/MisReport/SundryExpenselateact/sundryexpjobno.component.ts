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
    selector: 'app-SundryExpenses',
    templateUrl: './sundryexpense.component.html',
    styles: []
  })
  export class SundryExpensesjob implements OnInit {

    public myDatePickerOptions: IMyDpOptions = {
        dateFormat: 'dd-mmm-yyyy',
        inline: false,
        height: '20px',
        width: '140px',
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
    Department:string;
    DepartmentName:string;
    Departmentlist:any = [];
    dataForExcel = [];
    displayType: string = 'SEARCH';
    PageType:string ='SUNDRY EXPENSES LATE A/C';
    AccountName:string;
    Ondate: any;
    Ondatetime: any;
    Header:string= 'SUNDRY EXPENSES LATE ACCOUNTING';
    SundryexpenseList:  any = [];
    DelayDays:string="120";  
      constructor(private _dataService: DataService,
        private _toasterService: ToastCommonService,
        private loaderService: LoaderService,
        private http: HttpClient, private datePipe: DatePipe,
        private _activatedRoute: ActivatedRoute,private _router:Router,
        private _loginService: LoginService,
        private exportser: ExportexcelService,
      ) { }

      ngOnInit() {
        const jsonparam= {  CMPCODE:this._loginService.getLogin()[0].CMPCODE,
            CITYCODE:this._loginService.getLogin()[0].CITYCODE,
            CITYCODE1:this._loginService.getLogin()[0].CITYCODE1,
            PSTATUS:"BR" }
    
        this._dataService.getData("Accounts/ACC_CASHBOOK_BRBPCRCPCE_PAGELOAD",jsonparam)
        .subscribe((data: any) => {
            this.Departmentlist=data.Table1;
         });
         this.Department="0";
    }
    FromDateChanged(ev){
      this.FromDate=ev.formatted
    }
    ToDateChanged(ev){
    this.ToDate=ev.formatted
    }
    GenerateData() {
    if (!this.FromDate) {
      alert("Please select From Date.");
      return false;
  }
  else if (!this.ToDate) {
      alert("Please select To Date.");
      return false;
  }
   
      const jsonparam= {  FromDate:this.datePipe.transform(this.FromDate, 'dd/MM/yyyy '),
          ToDate:this.datePipe.transform(this.ToDate, 'dd/MM/yyyy'),
          NoOfDays:this.DelayDays,
          Department:this.Department,
          cmpcitycode:this._loginService.getLogin()[0].CMPCODE +this._loginService.getLogin()[0].CITYCODE1
          }
  
      this._dataService.getData("Accounts/ACC_MIS_SUNDRY_EXPENSES",jsonparam)
      .subscribe((data: any) => {
          this.displayType='LIST'
          this.SundryexpenseList=data.Table;
          this.SundryexpenseList.forEach((row: any) => {
            this.dataForExcel.push(Object.values(row))
            });
       });
  }
  ExportData() {
    let reportData = {
      title:  'From Date:' + this.FromDate + '- To Date: '  + this.ToDate,
      subtitle:'No Of Days : ' + this.DelayDays,
      subtitle1: 'Department ' + this.DepartmentName,
      data: this.dataForExcel,
      headers: ['JOB NO','CLIENT','','VOUCHER NO.','VOUCHER DATE','ACCOUNT','AMOUNT'],
      pagetype: "SundryExpenses"
    }
    this.exportser.exportExceltry(reportData, this._loginService.getLogin()[0].USERNAME + "_SUNDRYEXPENSES_RPT");
    this.dataForExcel= [];
  }
  GetDepartmentName(event)
    {
        this.DepartmentName=event.target.options[event.target.options.selectedIndex].text///.split("|")[1];
    }
    Openprint(No,Type)
    {
     let theTop = (screen.height / 2) - (483 / 2);
     let theLeft = (screen.width / 2) - (780 / 2);
     let toolbar = 'resizable=no,scrollbars=no,width=800,height=450,status=no,left=' + theLeft + ',top=' + theTop;
    
     { 
     if(Type=="PI"){
     window.open('./#/popup/Account-Purchase-Print/' + No + '/' , "PI Print", toolbar);
     }
     if(Type=="JV") {
     return false;
     }
      if(Type=="CN"){
     window.open('./#/popup/Account-CreditNote-Print/' + No + '/' , "CN Print", toolbar);
     }
     if(Type=="II") {
    // window.open('./#/popup/Account-Invoice-Print/' + No + '/' , "INV Print", toolbar);
    let URL = "http://180.179.207.163/Linkserp-ac/UI/Accounts/frm_Acc_Tran_Invoice_Print.aspx?" +
          "huhpnk=" + this._loginService.getLogin()[0].GUID
          + "&citycode=" + this._loginService.getLogin()[0].CITYCODE1
          + "&Userid=" + this._loginService.getLogin()[0].CMPID
          + "&cmp_code=" + this._loginService.getLogin()[0].CMPCODE
          + "&InvoiceNo=" + No
          + "&DisplayMode=" + "0"
          +"&cmp_username=" + this._loginService.getLogin()[0].CMP_USERNAME
              window.open(URL,  "Invoice Print", toolbar);
              return false;
     
     }
     if(Type=="SI"){
     return false;
     }
     if(Type=="BI") {
     return false;
     }
     else {
     window.open('./#/popup/Account-BP-Print/' + No + '/' + Type + '/', "BR Print", toolbar);
     }
       }
     
   }
   PrintJob(jobno)  {
    let frdt=this.FromDate.replace('/','-')
    let todt=this.ToDate.replace('/','-')
    let theTop = (screen.height / 2) - (483 / 2);
    let theLeft = (screen.width / 2) - (780 / 2);
    let toolbar = 'resizable=no,scrollbars=no,width=800,height=450,status=no,left=' + theLeft + ',top=' + theTop;
    window.open('././#/popup/Account-Job-Profit-Report/' +  jobno + '/', "Job Print",  toolbar);
  }
}