import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DataService } from 'src/app/shared/service/dataService';
import { LoaderService } from 'src/app/shared/service/loader.service';
import { LoginService } from 'src/app/shared/service/loginService';
import { ToastCommonService } from 'src/app/shared/service/toastService';
@Component({
  selector: 'app-reqbp-bill-list',
  templateUrl: './reqbp-bill-list.component.html',
  styles: []
})
export class ReqbpBillListComponent implements OnInit {
  bill_list: any;
  billno: any;

  constructor(
    private _dataService: DataService,
    private _toasterService: ToastCommonService,
    private _loaderService: LoaderService,
    private _router: Router,
    private http: HttpClient,
    private _route: ActivatedRoute,     private _loginService: LoginService,
  ) { }



  ngOnInit() {
    this._route.params.subscribe(params => {
      //  console.log(params)
        this.billno=params["BillNo"]    
        this.billlist()    });
    
  }
 billlist(){
  
    const jsoncmp = {
     // EntryNo: '455555554555555'
      EntryNo: this.billno
    }
    console.log(jsoncmp)
    //this._loaderService.display(true);
    this._dataService.getData("Accounts/Acc_CMPBP_BPlISTView", jsoncmp)
      .subscribe((data: any) => {
      // console.log(data)
       this.bill_list=data.Table
      })
  }
}
