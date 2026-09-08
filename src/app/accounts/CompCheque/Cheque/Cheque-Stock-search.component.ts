import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IMyDpOptions } from 'mydatepicker';
import { AuthService } from 'src/app/shared/service/authService';
import { DataService } from 'src/app/shared/service/dataService';
import { LoaderService } from 'src/app/shared/service/loader.service';
import { LoginService } from 'src/app/shared/service/loginService';
import { ToastCommonService } from 'src/app/shared/service/toastService';

@Component({
  selector: 'app-cheque-stock-search',
  templateUrl: './Cheque-Stock-search.component.html',
  styles: []
})
export class ChequeStockSearchComponent implements OnInit {
  public searchString: string;
  Header: string = "cheque printing - search"
  OurBankList: any = []       
  OurBank: string = ""
  Searchdata_list: any = []
  displayType = "SEARCH"
  searchHeaderText: string = "Cheque Stock List"
  constructor(
    private _router: Router,
    private _dataService: DataService,
    private _auth: AuthService, private _activatedRoute: ActivatedRoute,
    private _toasterService: ToastCommonService,
    private _loginService: LoginService,
    private _loaderService: LoaderService,
  ) { }
  ngOnInit() {
    //console.log( this._loginService.getLogin())
    this._loaderService.display(true)

    this.verifyPermission('90', 'View')
    const jsoncmp = {
      cmpcode: this._loginService.getLogin()[0].CMPCODE,
      citycode: this._loginService.getLogin()[0].CITYCODE,
      citycode1: this._loginService.getLogin()[0].CITYCODE1,
    }
    // console.log(jsoncmp)
    this._dataService.getData("Accounts/ACC_CHEQUESTOCK_FILLOURBANK", jsoncmp)
      .subscribe((data: any) => {
        //      console.log(data)
        this.OurBankList = data.Table
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
  searchchq() {

    if (this.OurBank == "" || this.OurBank == undefined) {
      alert("Please Select Our Bank.")
      return false
    }
    this._loaderService.display(true)

    const jsoncmp = {
      CMPCODE: this._loginService.getLogin()[0].CMPCODE,
      CITYCODE: this._loginService.getLogin()[0].CITYCODE,
      CHEQUNO: this.OurBank,
      BANK:"",
    }
    //  console.log(jsoncmp)
    this._dataService.getData("Accounts/ACC_CHEQUESTOCK_LIST", jsoncmp)
      .subscribe((data: any) => {
        //   console.log(data)
        this._loaderService.display(false)
        if (data.Table.length == "0") {
          this._toasterService.toast("success", "success", "No Records Found")
             return false
        } else {
          this.Searchdata_list = data.Table
          this.displayType = "LIST"
        }
      })
  }

  resetchequestock() {
    this.OurBank = ""
  }
}
