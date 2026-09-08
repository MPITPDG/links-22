import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { LoginService } from '../../../shared/service/loginService';
import { ToastCommonService } from '../../../shared/service/toastService';
import { IMyDpOptions } from 'mydatepicker';
import { LoaderService } from '../../../shared/service/loader.service';
import { HttpClient } from '@angular/common/http';
import { DataService } from 'src/app/shared/service/dataService';
@Component({
  selector: 'app-invoiceprint',
  templateUrl: './invoiceprint.component.html',
  styles: [`
  // table tbody { display:block; max-height:500px; overflow-y:scroll; }
  // table thead, table tbody tr { display:table; width:100%; table-layout:fixed; }
  `]
})
export class InvoiceprintComponent implements OnInit {
  Header:string="AirFreight-invoice-generate"
  tabledata0: any=[];
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
    if (this._loginService.getLogin()[0].CMPCODE!="02"){
      this._toasterService.toast("warning", "warning", "Please Prepare Share of profit In Freight Service Login !!")
      this._router.navigateByUrl("/accounts")
      return false;
    }

    this.loaderService.display(true)
    const jsoncmp = {
      cmpid: this._loginService.getLogin()[0].CMPID,
      MakerIP: this._loginService.getLogin()[0].MAKERIP,
      cmpcode: this._loginService.getLogin()[0].CMPCODE,
      citycode: this._loginService.getLogin()[0].CITYCODE,
      citycode1: this._loginService.getLogin()[0].CITYCODE1,
    }
    this.verifyPermission('345','Add')
    this._dataService.getData("Accounts/ACC_INV_MAWB_AIRFRT_CONS_PUR_PAGELOAD", jsoncmp)
      .subscribe((data: any) => {  
          this.tabledata0=data.Table
          this.loaderService.display(false)
      })
  }
  verifyPermission(formId, userMode) {
    this.loaderService.display(true);
    this._loginService.verifyRights(formId, '')
        .subscribe((data: any) => {               
           this._loginService.checkVerify(userMode, data);          
        });
}
  viewdetail(logID,MAWBNO){
   // if(FRT == "PP"){
    this.loaderService.display(true)
    const jsoncmp1 = {
      FK_LOGID: logID,
      MAWBNO:MAWBNO,
      CMPID: this._loginService.getLogin()[0].CMPID
    }
      
    this._dataService.getData("Accounts/ACC_INV_MAWB_AIRFRT_CN_SHAREOFPROFIT_CONS_PUR", jsoncmp1)
      .subscribe((data: any) => {      
       if (data.Table[0].STATUS == "100") {
          this.tabledata0=data.Table
          this.loaderService.display(false)
          this._router.navigateByUrl("/accounts/transaction/airfrtinvoice/airfrtinvoice-detailstab/"+ logID)
       }
       else {
          this._toasterService.toast("warning", "warning", data.Table[0].STATUSTEXT)
          this.loaderService.display(false);
          return false;
       }
      }) 
  }


}
