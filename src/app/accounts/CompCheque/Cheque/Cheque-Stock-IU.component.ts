import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IMyDpOptions } from 'mydatepicker';
import { AuthService } from 'src/app/shared/service/authService';
import { DataService } from 'src/app/shared/service/dataService';
import { LoaderService } from 'src/app/shared/service/loader.service';
import { LoginService } from 'src/app/shared/service/loginService';
import { ToastCommonService } from 'src/app/shared/service/toastService';

@Component({
  selector: 'app-cheque-stock-iu',
  templateUrl: './cheque-stock-iu.component.html',
  styles: []
})
export class ChequeStockIUComponent implements OnInit {
  Header: string = "Cheque - Stock"
  OurBank: string = ""
  OurBankList: any = []
  chqcrete_id: string = "0"
  from_chqno: string = "";
  to_chqno: string = "";
  cheque_create_date: any;
  PageActual: number = 1;
  public myDatePickerOptions: IMyDpOptions = {
    dateFormat: 'dd/mm/yyyy',
    inline: false,
    height: '16px',
    width: '120px',
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

  constructor(
    private _router: Router,
    private _dataService: DataService,
    private _auth: AuthService, private _activatedRoute: ActivatedRoute,
    private _toasterService: ToastCommonService,
    private _loginService: LoginService,
    private _loaderService: LoaderService,
  ) { }
  ngOnInit() {
   // console.log(this._loginService.getLogin())
    this._loaderService.display(true)

    this.verifyPermission('90','Add')
    const jsoncmp = {
      cmpcode: this._loginService.getLogin()[0].CMPCODE,
      citycode: this._loginService.getLogin()[0].CITYCODE,
      citycode1: this._loginService.getLogin()[0].CITYCODE1,
    }
  
    this._dataService.getData("Accounts/ACC_CHEQUESTOCK_FILLOURBANK", jsoncmp)
      .subscribe((data: any) => {
       // console.log(data)
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
  addchequestock() {
    if (this.cheque_create_date == "" || this.cheque_create_date == undefined) {
      alert("Please Enter Cheque Entry date.")
      return false
    }
    if (this.OurBank == "" || this.OurBank == undefined) {
      alert("Please Select Our Bank.")
      return false
    }
    if (this.from_chqno == "" || this.from_chqno == undefined) {
      alert("Please Enter From Cheque No.")
      return false
    }
    if (this.to_chqno == "" || this.to_chqno == undefined) {
      alert("Please Enter To Cheque Entry datNo.")
      return false
    }
    this._loaderService.display(true);

    const jsoncmp = {
      CHQ_CREATER_ID: this._loginService.getLogin()[0].CMPID,
      USER_IP: this._loginService.getLogin()[0].MAKERIP,
      CHQ_CREATED_DATE: this.cheque_create_date.formatted,
      CMP_CODE: this._loginService.getLogin()[0].CMPCODE,
      CITY_CODE: this._loginService.getLogin()[0].CITYCODE1,
      OURBANK: this.OurBank,
      STCHEQUENO: this.from_chqno,
      ENDCHEQUENO: this.to_chqno
    }
    //console.log(jsoncmp)

    this._dataService.Common("Accounts/ACC_CHEQUESTOCK_IU", jsoncmp)
      .subscribe((data: any) => {
       // console.log(data)
       this._loaderService.display(false);

       if (data.Table[0].Column1 == "0") {
        this._toasterService.toast("success", "success", "Added Successfully")
        this.resetchequestock()
      } else {
        this._toasterService.toast("error", "error", "Already Exist Cheques:")
      }
      })
  }

  resetchequestock() {
    this.OurBank = ""
    this.from_chqno = ""
    this.to_chqno = ""
    this.cheque_create_date = ""
  }
}
