import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IMyDpOptions } from 'mydatepicker';
import { DataService } from 'src/app/shared/service/dataService';
import { LoaderService } from 'src/app/shared/service/loader.service';
import { LoginService } from 'src/app/shared/service/loginService';
import { ToastCommonService } from 'src/app/shared/service/toastService';
import { DatePipe } from '@angular/common'

@Component({
  selector: 'app-gen-cash-receipt',
  templateUrl: './Gen-Cash-Receipt.component.html',
  styles: [],
  providers: [DatePipe]

})
export class GenCashReceiptComponent implements OnInit {
  Header: string = " Generate Cash Receipt from Cash Expenses"
  EntryNo: string = ""
  SelectDate: any = ""
  details: any = [];
  totalamount: any;
  narration: any;
  txtsave : string ="Generate Cash Receipt";
  public disable_generatebtn: boolean = false;
  constructor(public datepipe: DatePipe, private _dataService: DataService, private _activatedRoute: ActivatedRoute, private _toasterService: ToastCommonService,

    private _loginService: LoginService, private loaderService: LoaderService) { }

  public myDatePickerOptionsInv: IMyDpOptions = {
    dateFormat: 'dd-mmm-yyyy',
    inline: false,
    height: '18px',
    width: '180px',
    componentDisabled: false,
    selectionTxtFontSize: '12px',
    editableDateField: false,
    sunHighlight: true,
    satHighlight: true,
    firstDayOfWeek: 'su',
    openSelectorTopOfInput: false,
    openSelectorOnInputClick: true,
    selectorHeight: '180px',
    selectorWidth: '200px',
    disableUntil: { year: 0, month: 0, day: 0 },
    disableSince: { year: 0, month: 0, day: 0 }
  };
  ngOnInit() {
    //console.log(this._loginService.getLogin());
    this.SelectDate = new Date();
    this.SelectDate = this._dataService.datechnge1(this.SelectDate)
    this.verifyPermission('29','Add')
    this.populatedata();
  }
  verifyPermission(formId, userMode) {
    this.loaderService.display(true);
    this._loginService.verifyRights(formId, '')
        .subscribe((data: any) => {          
           this._loginService.checkVerify(userMode, data);
           this.loaderService.display(false);

        });
}
  populatedata() {
    if (this.SelectDate == "" || this.SelectDate == undefined) {
      alert("Select date First.")
      return false
    }
    this.loaderService.display(true)
    const jsonmaster = {
      CMPCODE: this._loginService.getLogin()[0].CMPCODE,
      CITYCODE: this._loginService.getLogin()[0].CITYCODE,
      FRDT: this.SelectDate
    }
    //  console.log(jsonmaster);
    this._dataService.getData("Accounts/CASHBOOK_AUTOGENERATE_BIND", jsonmaster).subscribe((data: any) => {
      //console.log(data)
      this.loaderService.display(false)

      if (data.Table.length == "0") {
        this.details ="";
        this.totalamount = ""
        this.EntryNo=""
        this.narration=""
        this.txtsave="Generate Cash Receipt"
        this.disable_generatebtn=true;
        this._toasterService.toast('success', 'success', "No Records Found.")

      } else {
        this.details = data.Table
        this.totalamount = data.Table1[0].amount
        if (data.Table2.length > "0") {
        this.EntryNo=data.Table2[0].entryno
        this.narration=data.Table2[0].narration
        this.txtsave="Update Cash Receipt"
      }
      else{
      this.EntryNo=""
      this.narration=""
      this.txtsave="Generate Cash Receipt"
    }
      this.disable_generatebtn=false;
       
      }
    })
  }
  generate_CR() {
    if (this.SelectDate == "" || this.SelectDate == undefined) {
      alert("Select date First.")
      return false
    }
    this.loaderService.display(true)

    const jsonmaster = {
      CMPID: this._loginService.getLogin()[0].CMPID,
      CMPCODE: this._loginService.getLogin()[0].CMPCODE,
      CITYCODE1: this._loginService.getLogin()[0].CITYCODE1,
      CITYCODE: this._loginService.getLogin()[0].CITYCODE,
      USERNAME: this._loginService.getLogin()[0].CMP_USERNAME,
      ENTRYNO: this.EntryNo,
      ENTRYDT: this.SelectDate.formatted,
      STATUS: "CR",
      NARRATION: this.narration,
      MAKER_IP: this._loginService.getLogin()[0].CMPCODE,
      MAKERIP: this._loginService.getLogin()[0].MAKERIP
    }
    //console.log(jsonmaster);
    this._dataService.Common("Accounts/ACC_BRBPCRCPCE_CE_AutoGenerateCR", jsonmaster).subscribe((data: any) => {
      //console.log(data)
      this.loaderService.display(false)
      if(this.EntryNo==""){
        this._toasterService.toast('success', 'success', "Cash Receipt No: '" + data.Table[0].RESULT  +"' Generated Successfully.")  
      }
      else {
        this._toasterService.toast('error', 'error', "Cash Receipt No: '" + data.Table[0].RESULT  +"' updated Successfully.")
      }
      this.populatedata();
      let theTop = (screen.height / 2) - (483 / 2);
          let theLeft = (screen.width / 2) - (780 / 2);
          let toolbar = 'resizable=no,scrollbars=no,width=800,height=450,status=no,left=' + theLeft + ',top=' + theTop;
          window.open('./#/popup/Account-CashBook-BankReceipt-print/' + "CR" + '/' + data.Table[0].RESULT + '/' , "CashBook BankReceipt Print", toolbar);
    })
  }
  getdate(date) {
    this.SelectDate = date.formatted
  }
}
