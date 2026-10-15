import { Component, OnInit, ViewChild, ElementRef, ChangeDetectionStrategy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { LoginService } from '../../../shared/service/loginService';
import { ToastCommonService } from '../../../shared/service/toastService';
import { LoaderService } from '../../../shared/service/loader.service';
import { HttpClient } from '@angular/common/http';
import { DataService } from 'src/app/shared/service/dataService';
import { ExportexcelService } from 'src/app/shared/service/exportexcel.service';

import { FinPager, FinChart, finBars, finNum, finAmt } from '../fin-kit';
@Component({
    selector: 'app-advancefromClient',
    templateUrl: './advancefromclient.component.html',
    host: { class: 'kit-accreport' },
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
  export class AdvanceFromClient implements OnInit {
    ExporterList:any = [];
    ClAdvList:any = [];
    exceldata_list: any = [];
    dataForExcel = [];
    excelHeaders:any=[];
    JobNo:string;
    displayType: string = 'SEARCH';
    Type: string = 'JOBNO';
    Compname:string;
    Exporter:string;
    All:string="";
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
        this.verifyPermission('183','View')
        const jsonList = {
            cmpcode: this._loginService.getLogin()[0].CMPCODE,
            citycode: this._loginService.getLogin()[0].CITYCODE,
            citycode1: this._loginService.getLogin()[0].CITYCODE1,
                 }
              this._dataService.getData("Accounts/Acc_Fill_Export", jsonList)
              .subscribe((data: any) => {
               this.ExporterList = data.Table             
               this._loaderService.display(false)
            })
         
        }
        verifyPermission(formId, userMode) {
          this._loaderService.display(true);
          this._loginService.verifyRights(formId, '')
              .subscribe((data: any) => {          
                 this._loginService.checkVerify(userMode, data);
                 this._loaderService.display(false);
      
              });
      }
          
    GetClientAdvanceData()  {
      this.dataForExcel=[]; 
      if(this.Type=="JOBNO")  {
        if(this.JobNo=="" || this.JobNo== undefined)  {      
          this._toasterService.toast('warning', 'warning', 'Please Enter Job No. !');
          return false;
        }
        if(this.JobNo.length > 0 && this.JobNo.length < 15) {
          this._toasterService.toast('warning', 'warning', 'Invalid JobNo - Please Check !');
          return false;
       }
    }
      if(this.Type=="CLIENT")  {
        if (!this.Exporter) {
          this._toasterService.toast('warning', 'warning', 'Please Select Client!');
          return false;
        }
      }
      if(this.Type=="All") {
        this.All="T";  }
       else   {
        this.All="";  }

      const jsonData = {
        Jobno:(this.JobNo==undefined)?"" :this.JobNo,
        ClientCode:(this.Exporter==undefined)?"" :this.Exporter,
        All:this.All,
        cmpcode: this._loginService.getLogin()[0].CMPCODE,
        citycode: this._loginService.getLogin()[0].CITYCODE,
    
        };
      this._loaderService.display(true);
      this._dataService.getData("Accounts/Acc_Rpt_Receivable_AdvFromClients", jsonData)
        .subscribe((data: any) => {
          this.displayType="LIST";
          this.ClAdvList=data.Table;
         // this.exceldata_list= data.Table1;
          this.ClAdvList.forEach(function(x){delete x.PK_ID});
          this.ClAdvList.forEach((row: any) => {
           this.dataForExcel.push(Object.values(row))
           this._loaderService.display(false)
          })
          this._loaderService.display(false); // also clear the loader when no rows come back
          this.failed = false; this.buildView();
           }, () => { this._loaderService.display(false); this.failed = true; })
    }    
    
   
    OpenPrint(No,Type)  {
      let theTop = (screen.height / 2) - (483 / 2);
      let theLeft = (screen.width / 2) - (780 / 2);
      let toolbar = 'resizable=no,scrollbars=no,width=800,height=450,status=no,left=' + theLeft + ',top=' + theTop;
      
      if(confirm('Click OK to Print ')) { 
        if(Type=="PI")
         {       window.open('./#/popup/Account-Purchase-Print/' + No.replace("'", "") + '/' , "PI Print", toolbar);      }
        if(Type=="JV")
        {   window.open('./#/popup/Account-JV-Print/' + No + '/' + "JV" + '/' , "JV Print", toolbar);    }
        if(Type=="CN")
        {  window.open('./#/popup/Account-CreditNote-Print/' + No.replace("'", "") + '/' , "CN Print", toolbar);  }
        if(Type=="II")
        { 
         // window.open('./#/popup/Account-Invoice-Print/' + No.replace("'", "") + '/' , "INV Print", toolbar);   
         let URL = "http://180.179.207.163/Linkserp-ac/UI/Accounts/frm_Acc_Tran_Invoice_Print.aspx?" +
         "huhpnk=" + this._loginService.getLogin()[0].GUID
         + "&citycode=" + this._loginService.getLogin()[0].CITYCODE1
         + "&Userid=" + this._loginService.getLogin()[0].CMPID
         + "&cmp_code=" + this._loginService.getLogin()[0].CMPCODE
         + "&InvoiceNo=" + No.replace("'", "")
         + "&DisplayMode=" + "0"
         +"&cmp_username=" + this._loginService.getLogin()[0].CMP_USERNAME
             window.open(URL,  "Invoice Print", toolbar);
             return false;
        }
        if(Type=="SI")
        {  return false;  }
        if(Type=="BI")
        {  return false;   }
        else    
       // {  window.open('./#/popup/Account-BP-Print/' + No.replace("'", "") + '/' + Type + '/', "BR Print", toolbar);  }
           window.open('./#/popup/Account-CashBook-BankReceipt-print/' + Type + '/' + No + '/' , "CASH BOOK - Bank Payment", toolbar);
      }
      else
      {  return false;   }
    } 
    OpenJobPrint(jobno)
    { 
      let theTop = (screen.height / 2) - (483 / 2);
      let theLeft = (screen.width / 2) - (780 / 2);
      let toolbar = 'resizable=no,scrollbars=no,width=800,height=450,status=no,left=' + theLeft + ',top=' + theTop;
      window.open('./#/popup/Account-Job-Profit-Report/' + jobno.replace("'", "") + '/' , "JOB Print", toolbar);  
    }
    ExportAdvfrmClnt()
    { 
      this.excelHeaders= ["Client Name","Job No","Type","Voucher Code","Voucher Date","Dr Amt","Cr Amt"];
      let reportData = {
        data: this.dataForExcel,
        headers:this.excelHeaders,
        pagetype: "AdvFrmClient",
        title:"Advance From Client"
    }
      this.exportser.exportExceltry(reportData, "AdvanceFromClient");
     /// this.dataForExcel=[]; 
    }
    ResetAll()
    {
      this.JobNo="";
      this.Exporter="";
      this.Type="JOBNO";
    }  

    // ---- redesign: KPIs, chart and pager (display only; subtotal rows have TYPE == '') ----
    failed = false;
    pager = new FinPager<any>(10);
    kpiDr = 0;
    kpiCr = 0;
    kpiClients = 0;
    chart: FinChart | null = null;
    fmt = finAmt;
    buildView() {
        const rows = this.ClAdvList || [];
        this.pager.set(rows);
        const lines = rows.filter(r => r.TYPE !== '');
        this.kpiDr = lines.reduce((a, r) => a + finNum(r.DRAMT), 0);
        this.kpiCr = lines.reduce((a, r) => a + finNum(r.CRAMT), 0);
        const by = new Map<string, number>();
        lines.forEach(r => { const k = (r.CLIENTNAME || '—').toString(); by.set(k, (by.get(k) || 0) + finNum(r.CRAMT) - finNum(r.DRAMT)); });
        this.kpiClients = by.size;
        const items = Array.from(by.entries()).map(([label, value]) => ({ label, value })).sort((a, b) => Math.abs(b.value) - Math.abs(a.value)).slice(0, 12);
        this.chart = items.length ? finBars(items) : null;
    }
}