import { Component, TemplateRef, OnInit } from '@angular/core';
import { DataService } from '../../shared/service/dataService';
import { AuthService } from '../../shared/service/authService';
import { Router } from '@angular/router';
import { ToasterService } from 'angular2-toaster';
import { LoginService } from '../../shared/service/loginService';

import { ToastCommonService } from '../../shared/service/toastService';
import { LoaderService } from '../../shared/service/loader.service';
import { OrderPipe } from 'ngx-order-pipe';
import { FilterPipe } from 'ngx-filter-pipe';
import { BsModalService, BsModalRef } from 'ngx-bootstrap';

@Component({
  templateUrl: 'Invoice-UnAuth.component.html',
})
export class invoiceUnAuth implements OnInit {
  aaa: any = []
  unauthtable: any = []
  newArray: any = []
  order: string = 'CLIENTNAME';
  reverse: boolean = false;
  public searchString: string;
  // userFilter: any = { INV_CRTNO: '',TOTAL_AMT:'' };
  sortedCollection: any[];
  PageActual: number = 1;
  checkbox: boolean;
  modalRef: BsModalRef;

  inv_jobno: string = ""
  inv_pkgs: string = ""
  inv_grwt: string = ""
  INV_NO: string = ""
  INV_DATE: string = ""
  CLIENTNAME: string = ""
  BILLTO_INVADDR: string = ""
  INV_BILLTYPE: string = ""
  CUR_NAME: string = ""
  NARRATION: string = ""
  INV_GOODS: string = ""
  INV_WT: string = ""
  INV_VOL: string = ""
  INV_TAX: string = ""
  PAYBLEBYDT: string = ""
  INV_NOOFPCS: string = ""
  INV_PKGS: string = ""
  INV_HAWBDT: string = ""
  INV_HAWBNO: string = ""
  INV_CARRIER: string = ""
  INV_ADVANCE: string = ""
  INV_CLIENTREF: String = ""
  INV_CURRATE: String = ""
  datatabl_1 = []
  datatabl_2 = []
  datatabl_3 = []
  datatabl_4 = []
  datatabl_5 = []
  datatabl_6 = []
  datatabl_7 = []
  datatabl_8 = []
  datatabl_9 = []
  datatabl_10 = []
  pass = []
  constructor(
    private _router: Router,
    private _dataService: DataService,
    private _auth: AuthService,
    private _toasterService: ToastCommonService,
    private _loginService: LoginService,
    private modalService: BsModalService,
    private loaderService: LoaderService, private orderPipe: OrderPipe, private filterPipe: FilterPipe

  ) { }
  ngOnInit(): void {
   // console.log(this._loginService.getLogin()[0])
    this.loaderService.display(true)
    this.verifyPermission('415','Add')
    this.getunauthdata()
  }
  verifyPermission(formId, userMode) {
    this.loaderService.display(true);
    this._loginService.verifyRights(formId, '')
        .subscribe((data: any) => {         
           this._loginService.checkVerify(userMode, data);
           this.loaderService.display(false);

        });
}
  getunauthdata() {
    const jsonmaster = {
      cmpid: this._loginService.getLogin()[0].CMPID,
      cmp_code: this._loginService.getLogin()[0].CMPCODE,
      RoleType: this._loginService.getLogin()[0].ROLETYPE,
      Type: "II"
    }
    this._dataService.getData("Accounts/ACC_invoice_unauth_list", jsonmaster)
      .subscribe((data: any) => {
        console.log(data)
        this.unauthtable = data.Table
        this.loaderService.display(false)
      })
  }
  getCheckboxValues(event, data) {
    console.log(event)
    var index = this.newArray.findIndex(x => x.inoiceno == data);
    if (event) {
      let obj = {
        inoiceno: data
      }
      this.newArray.push(obj);
    }
    else {
      this.newArray.splice(index, 1);
    }
  }

  unauthdata() {
    if (this.newArray == "" || this.newArray == undefined) {
      this._toasterService.toast('info', 'info', 'Select At Least One Invoice No!');
      return false;
    }
    var output = this.newArray.map(function (item) {
      return item.inoiceno;
    });
    var datatry = output.join(",")
    var output1 = datatry
    const adddata = {
      NOSTR: output1,
      CMPID: this._loginService.getLogin()[0].CMPID,
      cmp_code: this._loginService.getLogin()[0].CMPCODE,
      citycode: this._loginService.getLogin()[0].CITYCODE,
      CHKAuthorityFlag: "1",
    }
    this._dataService.Common("Accounts/ACC_invoice_UnAuthorisation_Update", adddata)
      .subscribe((data: any) => {
        console.log(data)
        if (data.Table1[0].STATUSMSG != "") {
          this._toasterService.toast('success', 'success', data.Table1[0].STATUSMSG);
          this.getunauthdata()
        }
      })

  }

  InvoicePrint(Invoiceno) {
    if(Invoiceno ==''||Invoiceno==undefined || Invoiceno.length < 15){
      alert("Enter 15 digit Invoice No !")
      return false
    }
    let theTop = (screen.height / 2) - (483 / 2);
    let theLeft = (screen.width / 2) - (780 / 2);
    let toolbar = 'resizable=no,scrollbars=no,width=800,height=450,status=no,left=' + theLeft + ',top=' + theTop;
   // window.open('./#/popup/Account-Invoice-print/' + Invoiceno + '/' , "Invoice Print", toolbar);
   let URL = "http://180.179.207.163/Linkserp-ac/UI/Accounts/frm_Acc_Tran_Invoice_Print.aspx?" +
   "huhpnk=" + this._loginService.getLogin()[0].GUID
   + "&citycode=" + this._loginService.getLogin()[0].CITYCODE1
   + "&Userid=" + this._loginService.getLogin()[0].CMPID
   + "&cmp_code=" + this._loginService.getLogin()[0].CMPCODE
   + "&InvoiceNo=" + Invoiceno
   + "&DisplayMode=" + "0"
   +"&cmp_username=" + this._loginService.getLogin()[0].CMP_USERNAME
       window.open(URL,  "Invoice Print", toolbar);
       return false;
}


  setOrder(value: string) {
    if (this.order === value) {
      this.reverse = !this.reverse;
    }
    this.order = value;
  }
  checkAll(ev) {
    this.newArray = []
    this.unauthtable.forEach(x => x.Checked = ev.target.checked)
    if (ev.target.checked == true) {
      for (var i = 0; i < this.unauthtable.length; i++) {
        let obj = {
          inoiceno: this.unauthtable[i].INV_CRTNO
        }
        this.newArray.push(obj);
      }
    } else {
      this.newArray = []
    }
    console.log(this.newArray)
  }

  abortdata() {
    this.unauthtable.forEach(obj => {
      obj.Checked = false
    })
    this.checkbox = false;
    this.newArray = []
  }
  datapopup(Invoiceno) {
    let theTop = (screen.height / 2) - (483 / 2);
    let theLeft = (screen.width / 2) - (780 / 2);
    let toolbar = 'resizable=no,scrollbars=no,width=800,height=450,status=no,left=' + theLeft + ',top=' + theTop;
    window.open('./#/popup/Account-Invoice-View/' + Invoiceno + '/' , "Invoice View", toolbar);
}
  // datapopup(datainv,template: TemplateRef<any>){
  //   this.modalRef = this.modalService.show(template, {
  //     animated: true,
  //     backdrop: 'static',
  //     class: 'modal-lg'
  //   });
  //   this.loaderService.display(true)
  //   const jsonmaster = {
  //     invoiceno: datainv,
  //     cmp_code: this._loginService.getLogin()[0].CMPCODE,
  //   }
  //   console.log(jsonmaster)
  //   this._dataService.getData("Accounts/ACC_invoice_view", jsonmaster)
  //     .subscribe((data: any) => {
  //      if(data.Table[0].STATUS=="#100"){
  //       this.datatabl_1=data.Table1
  //        this.datatabl_2=data.Table2
  //        this.datatabl_3=data.Table3
  //        this.datatabl_4=data.Table4
  //        this.datatabl_5=data.Table5
  //        this.datatabl_6=data.Table6
  //        this.datatabl_7=data.Table7
  //        this.datatabl_8=data.Table8
  //        this.datatabl_9=data.Table9
  //        this.datatabl_10=data.Table10

  //        this.INV_NO=data.Table2[0].INV_NO
  //        this.INV_DATE=data.Table2[0].INV_DATE
  //        this.CLIENTNAME=data.Table2[0].CLIENTNAME
  //        this.BILLTO_INVADDR=data.Table2[0].BILLTO_INVADDR
  //        this.INV_BILLTYPE=data.Table2[0].INV_BILLTYPE
  //        this.CUR_NAME=data.Table2[0].CUR_NAME
  //        this.INV_CLIENTREF=data.Table2[0].INV_CLIENTREF
  //        this.NARRATION=data.Table2[0].NARRATION
  //        this.INV_GOODS=data.Table2[0].INV_GOODS
  //        this.INV_CURRATE=data.Table2[0].INV_CURRATE
  //        this.INV_WT=data.Table2[0].INV_WT
  //        this.INV_VOL=data.Table2[0].INV_VOL
  //        this.INV_TAX=data.Table2[0].INV_TAX
  //        this.PAYBLEBYDT=data.Table2[0].PAYBLEBYDT
  //        this.INV_NOOFPCS=data.Table2[0].INV_NOOFPCS
  //        this.INV_PKGS=data.Table2[0].INV_PKGS
  //        this.INV_HAWBDT=data.Table2[0].INV_HAWBDT
  //        this.INV_HAWBNO=data.Table2[0].INV_HAWBNO
  //        this.INV_CARRIER=data.Table2[0].INV_CARRIER
  //        this.INV_ADVANCE=data.Table2[0].INV_ADVANCE

  //        this.loaderService.display(false)
  //        }
  //     })
  // }

}


