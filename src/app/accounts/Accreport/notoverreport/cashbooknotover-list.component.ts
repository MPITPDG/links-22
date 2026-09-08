import { Component, OnInit,ViewChild,ElementRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { LoginService } from '../../../shared/service/loginService';
import { ToastCommonService } from '../../../shared/service/toastService';
import { LoaderService } from '../../../shared/service/loader.service';
import { HttpClient } from '@angular/common/http';
import { DataService } from 'src/app/shared/service/dataService';
import { ExportexcelService } from 'src/app/shared/service/exportexcel.service';


@Component({
    selector: 'app-CashBookNotOver-search',
    templateUrl: './cashbooknotover-list.component.html',
    styles: []
  })
  export class NotOverReport implements OnInit {
    NotOverList:any = [];
    exceldata_list: any = [];
    dataForExcel = [];
    exceltotdata_list: any = [];
    dataForTotExcel = [];
    Compname:string;
    TotLable:string;
    total:string;
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
        this.verifyPermission('161','View')

        this.getCompanyName();
        const jsonList = {
            cmpcode: this._loginService.getLogin()[0].CMPCODE,
            citycode: this._loginService.getLogin()[0].CITYCODE
                 }
              this._dataService.getData("Accounts/Acc_Rpt_NotOver_List", jsonList)
              .subscribe((data: any) => {
               this.NotOverList = data.Table
               this.exceldata_list= data.Table1;
                this.TotLable=data.Table2[0].TOTALAMOUNT;
                this.total=data.Table2[0].Totactualamount;
               //this.exceltotdata_list=data.Table2;
               this.exceldata_list.forEach(function(x){delete x.status});
               this.exceldata_list.forEach((row: any) => {
                 this.dataForExcel.push(Object.values(row))
               this._loaderService.display(false)
            })
        //     this.exceltotdata_list.forEach((row: any) => {
        //         this.dataForTotExcel.push(Object.values(row))
        //       this._loaderService.display(false)
        //    })
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

ExportNotOver()
{
    let reportData = {
        data: this.dataForExcel,
        headers:Object.keys(this.exceldata_list[0]),
        novertotal:['','','','','','TOTAL AMOUNT',this.total],
        pagetype: "NotOverReport",
        title:this.Compname
    }
      this.exportser.exportExceltry(reportData, "NotOverReport");
      //this.dataForExcel=[];
}   
getCompanyName()
{
this.loaderService.display(true)
var jsoncmp = {
  CmpCode:this._loginService.getLogin()[0].CMPCODE,
  CityCode:this._loginService.getLogin()[0].CITYCODE

}
 this._dataService.getData("Accounts/fn_Acc_Rpt_Common_CompanyDetails", jsoncmp)
  .subscribe((data: any) => {
  this.Compname=data.Table[0].cmp_name
   this.loaderService.display(false)
   })
  }
  OpenPrint(No,Type)
  {
    let theTop = (screen.height / 2) - (483 / 2);
    let theLeft = (screen.width / 2) - (780 / 2);
    let toolbar = 'resizable=no,scrollbars=no,width=800,height=450,status=no,left=' + theLeft + ',top=' + theTop;
    
    if(confirm('Click OK to Print ')) { 
      if(Type=="PI")
       {       window.open('./#/popup/Account-Purchase-Print/' + No + '/' , "PI Print", toolbar);      }
      if(Type=="JV")
      { window.open('./#/popup/Account-JV-Print/' + No + '/' + "JV" + '/' , "JV Print", toolbar);  }
      if(Type=="CN")
      {  window.open('./#/popup/Account-CreditNote-Print/' + No + '/' , "CN Print", toolbar);  }
      if(Type=="II")
      {
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
      if(Type=="SI")
      {  return false;  }
      if(Type=="BI")
      {  return false;   }
      else    
     //{  window.open('./#/popup/Account-BP-Print/' + No + '/' + Type + '/', "BR Print", toolbar);  }
     window.open('./#/popup/Account-CashBook-BankReceipt-print/' + Type + '/' + No + '/' , "CASH BOOK - Bank Payment", toolbar);
     
    }
    else
    {  return false;   }
  } 


}