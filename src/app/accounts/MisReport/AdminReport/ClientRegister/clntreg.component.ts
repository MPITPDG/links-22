import { Component, OnInit } from '@angular/core';
import { IMyDpOptions } from 'mydatepicker';
import { DataService } from '../../../../shared/service/dataService';
import { LoginService } from '../../../../shared/service/loginService';
import { ToastCommonService } from '../../../../shared/service/toastService';
import { LoaderService } from '../../../../shared/service/loader.service';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { ExportexcelService } from 'src/app/shared/service/exportexcel.service';
import { DatePipe } from '@angular/common';

@Component({
    selector: 'app-Client-register',
    templateUrl: './clntreg.component.html',
    styles: []
  })
  export class ClientRegisterComponent implements OnInit {
    registerdata_details = []
    registerdata = []
    cmpnyname: any;
    PageType: any;
    PageName: string;
    dataForExcel1 = [];
    Ondate: any;
    Ondatetime: any;
    ErrorMessage: string = '';
    Header:string='Client Register';
    Type:string;
    url:string;
    displayType:string="SEARCH"
    constructor(
      private _dataService: DataService,
      private _toasterService: ToastCommonService,
      private loaderService: LoaderService,
      private _router: Router,private datePipe: DatePipe,
      private http: HttpClient, private exportser: ExportexcelService,
      private _activatedRoute: ActivatedRoute,
      private _loginService: LoginService,
    ) { }
    ngOnInit() {
      this._activatedRoute.params.subscribe(params => {
        this.Type = params["Type"]})
        this.Ondate=new Date();
        this.Ondatetime=new Date();
        this.Ondate=this._dataService.datechnge1(this.Ondate)
        this.ExporttoExcel();
    }

    ExporttoExcel() {
        this.loaderService.display(true);
        this.ErrorMessage = 'Please Wait Exporting Data....';
        if(this.Type=='Client') {
         this.url='Accounts/ACCT_MST_RPT_CLIENT_REGISTER'
      } else{ 
         this.url='Accounts/ACCT_USP_MST_RPT_SUPPLIER_REGISTER'
      }
        this._dataService.getData(this.url, {})
        .subscribe((data: any) => {
            if (data.Table.length > 0){
            this.registerdata = data.Table;
            if(this.Type=='Supp') {
              this.registerdata.forEach(function(x){delete x.STATUS});
              this.registerdata.forEach(function(x){delete x.SUP_CODE});
            }
            this.registerdata.forEach((row: any) => {
                this.dataForExcel1.push(Object.values(row))
              })
                   
    let reportData = {
        data: this.dataForExcel1,
        headers: Object.keys(this.registerdata[0]),
        pagetype: "ClientRegister"
      }
      if(this.Type=='Client') {
        this.exportser.exportExceltry(reportData, "Client Register_" +  this.Ondate + ' ' + this.datePipe.transform(this.Ondatetime, 'hh:mm'));
      }else {
      this.exportser.exportExceltry(reportData, this._loginService.getLogin()[0].CMP_USERNAME + "_Supplier_Register" );
    }
      this.dataForExcel1=[];
    }
    else{
      this._toasterService.toast("warning","warning","No Record Found !")
      this.loaderService.display(false);
    }
  })
  }
}