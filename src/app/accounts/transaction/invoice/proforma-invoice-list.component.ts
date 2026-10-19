import { Component, OnInit, TemplateRef, ChangeDetectionStrategy } from '@angular/core';
import { DataService } from '../../../shared/service/dataService';
import { AuthService } from '../../../shared/service/authService';
import { Router } from '@angular/router';
import { LoginService } from '../../../shared/service/loginService';
import { ToastCommonService } from '../../../shared/service/toastService';
import { LoaderService } from '../../../shared/service/loader.service';
import { OrderPipe } from 'ngx-order-pipe';
import { FilterPipe } from 'ngx-filter-pipe';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { ProformaInvfilterpipe } from './proformainvfilterpipe.pipe';
@Component({
  templateUrl: 'proforma-invoice-list.component.html',
    // Page kit recipe 1 (ported from MPERPNG-20): global .im-page kit + component-local invoice-page.css.
    styleUrls: ['./invoice-page.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class ProformaInvoicePrintList implements OnInit {
  public searchString: string;

  invoicedata: any = []
  newArray: any = [];
  order: string = 'CLIENTNAME';
  reverse: boolean = false;
  // userFilter: any = { INV_CRTNO: '' };
  sortedCollection: any[];
  PageActual: number = 1;
  modalRef: BsModalRef;
  checkbox: boolean;

  inv_jobno:string=""
  inv_pkgs:string=""
  inv_grwt:string=""
  INV_NO:string=""
 INV_DATE:string=""
  CLIENTNAME:string=""
  BILLTO_INVADDR:string=""
  INV_BILLTYPE:string=""
  CUR_NAME:string=""
  NARRATION:string=""
  INV_GOODS:string=""
  INV_WT:string=""
  INV_VOL:string=""
  INV_TAX:string=""
  PAYBLEBYDT:string=""
  INV_NOOFPCS:string=""
  INV_PKGS:string=""
  INV_HAWBDT:string=""
  INV_HAWBNO:string=""
  INV_CARRIER:string=""
  INV_ADVANCE:string=""
  INV_CLIENTREF:String=""
  INV_CURRATE:String=""
       datatabl_1=[]
       datatabl_2=[]
       datatabl_3=[]
       datatabl_4=[]
       datatabl_5=[]
      datatabl_6=[]
       datatabl_7=[]
      datatabl_8=[]
       datatabl_9=[]
       datatabl_10=[]
  constructor(
    private _router: Router,
    private _dataService: DataService,
    private _auth: AuthService,
    private _toasterService: ToastCommonService,
    private _loginService: LoginService,
    private modalService: BsModalService,
    private loaderService: LoaderService, private orderPipe: OrderPipe, private filterPipe: FilterPipe

  ) {
    this.sortedCollection = orderPipe.transform(this.invoicedata, this.invoicedata.CLIENTNAME);
  }
  ngOnInit(): void {
    // console.log(this._loginService.getLogin()[0])
    this.loaderService.display(true)
    this.verifyPermission('422','View')

    this.getdataforauth()
  }
  verifyPermission(formId, userMode) {
    this.loaderService.display(true);
    this._loginService.verifyRights(formId, '')
        .subscribe((data: any) => {
           this._loginService.checkVerify(userMode, data);
           this.loaderService.display(false);

        });
}
  getdataforauth(){
    const jsonmaster = {
      cmpid: this._loginService.getLogin()[0].CMPID,
      cmp_code: this._loginService.getLogin()[0].CMPCODE,
      RoleType:(this._loginService.getLogin()[0].ROLETYPE=='')? 'USER':this._loginService.getLogin()[0].ROLETYPE,
      Type: "II"
    }
    this._dataService.getData("Accounts/ACC_invoice_Proforma_Print_list", jsonmaster)
      .subscribe((data: any) => {
        console.log(data)
        this.invoicedata = data.Table;
        this.loaderService.display(false)
      })
  }
  getCheckboxValues(event, data) {
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

  authorisedata() {
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
    console.log(adddata)
    this._dataService.Common("Accounts/ACC_invoice_Authorisation_Update", adddata)
      .subscribe((data: any) => {
        if (data.Table1[0].STATUSMSG !="") {
          this._toasterService.toast('success', 'success', data.Table1[0].STATUSMSG);
          this.getdataforauth()
        }
      })

  }

  setOrder(value: string) {
    if (this.order === value) {
      this.reverse = !this.reverse;
    }
    this.order = value;
  }
  setOrderDate(value: string) {
    //this.invoicedata.sort((x, y) => +new Date(x.INV_CRTDT) - +new Date(y.INV_CRTDT));
    //this.invoicedata.sort((a, b) => b.INV_CRTDT - a.INV_CRTDT)
    this.invoicedata.filter=value

    this.order = value;
  }
  checkAll(ev) {
    this.newArray = []
    this.invoicedata.forEach(x => x.Checked = ev.target.checked)
    if (ev.target.checked == true) {
      for (var i = 0; i < this.invoicedata.length; i++) {
        let obj = {
          inoiceno: this.invoicedata[i].INV_CRTNO
        }
        this.newArray.push(obj);

      }
    } else {
      this.newArray = []
    }
  }

  abortdata(){
    this.invoicedata.forEach(obj => {
      obj.Checked = false
    })
    this.checkbox=false;
    this.newArray=[]
  }
  invoiceviewdata(Invoiceno) {
    // if(Invoiceno ==''||Invoiceno==undefined || Invoiceno.length < 15){
    //   alert("Enter 15 digit Invoice No !")
    //   return false
    // }
    let theTop = (screen.height / 2) - (483 / 2);
    let theLeft = (screen.width / 2) - (780 / 2);
    let toolbar = 'resizable=no,scrollbars=no,width=800,height=450,status=no,left=' + theLeft + ',top=' + theTop;
    window.open('./#/popup/Account-ProformaInvoice-Print/' + Invoiceno + '/' , "Invoice View", toolbar);
}
  /* ---- kit pager + export (from MPERPNG-20, additive; the list, its search and sort are
     unchanged). Links keeps its 25-row page and its PageActual page number. ---- */
  readonly pageSize = 25;
  private readonly proformaFilterPipe = new ProformaInvfilterpipe();
  get filteredRows(): any[] {
    return this.proformaFilterPipe.transform(this.invoicedata || [], this.searchString) || [];
  }
  get sortedRows(): any[] {
    return this.orderPipe.transform(this.filteredRows, this.order, this.reverse, true) || [];
  }
  get pageCount(): number { return Math.max(1, Math.ceil(this.filteredRows.length / this.pageSize)); }
  get pg(): number { return Math.min(Math.max(1, this.PageActual || 1), this.pageCount); }
  get pageRows(): any[] { const st = (this.pg - 1) * this.pageSize; return this.sortedRows.slice(st, st + this.pageSize); }
  get rangeStart(): number { return this.filteredRows.length ? (this.pg - 1) * this.pageSize + 1 : 0; }
  get rangeEnd(): number { return Math.min(this.pg * this.pageSize, this.filteredRows.length); }
  get pageList(): number[] {
    const n = this.pageCount, p = this.pg;
    if (n <= 7) { return Array.from({ length: n }, (_, i) => i + 1); }
    const out: number[] = [1];
    const lo = Math.max(2, p - 1), hi = Math.min(n - 1, p + 1);
    if (lo > 2) { out.push(0); }
    for (let i = lo; i <= hi; i++) { out.push(i); }
    if (hi < n - 1) { out.push(0); }
    out.push(n);
    return out;
  }
  goPage(p: number) { if (p >= 1 && p <= this.pageCount) { this.PageActual = p; } }
  exportCsv() {
    const head = ['Trans Type', 'Inv No', 'Inv Date', 'Prepared By', 'Prepared On', 'Client', 'Amount'];
    const rows = this.sortedRows.map(r => [r.TRNS_TYPE, r.INV_CRTNO, r.INV_CRTDT, r.CREATEDBY, r.INV_CRT_DAT, r.CLIENTNAME, r.TOTAL_AMT]);
    const q = (v: any) => '"' + ((v === null || v === undefined) ? '' : String(v)).replace(/"/g, '""') + '"';
    const csv = [head, ...rows].map(line => line.map(q).join(',')).join('\r\n');
    const d = new Date();
    const stamp = d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'proforma-invoices-' + stamp + '.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
  }
