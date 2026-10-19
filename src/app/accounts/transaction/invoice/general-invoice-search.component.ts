import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { IMyDpOptions } from 'mydatepicker';
import { DataService } from '../../../shared/service/dataService';
import { AuthService } from '../../../shared/service/authService';
import { LoginService } from '../../../shared/service/loginService';
import { ToastCommonService } from '../../../shared/service/toastService';
import { LoaderService } from '../../../shared/service/loader.service';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { HostListener } from '@angular/core';
import {environment}  from '../../../../environments/environment.prod'
import { OrderPipe } from 'ngx-order-pipe';
import { FilterPipe } from 'ngx-filter-pipe';
@Component({
  selector: 'app-general-invoice-search',
  templateUrl: './general-invoice-search.component.html',
  // Page kit recipe 1 (ported from MPERPNG-20): global .im-page kit (src/styles/kit) plus the
  // component-local invoice-page.css. This page no longer uses the x-page theme (accounts-theme.css).
  styleUrls: ['./invoice-page.css'],
  styles: [`
    /* ---- invoice detail drawer (monochrome) ---- */
    .iv-backdrop {
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(10, 10, 10, .45);
        z-index: 1040;
    }
    .iv-drawer {
        position: fixed;
        top: 0; right: 0; bottom: 0;
        width: 74%;
        min-width: 620px;
        max-width: 1240px;
        background: var(--mp-band, #FAFAFA);
        box-shadow: -8px 0 28px rgba(10, 10, 10, .18);
        z-index: 1041;
        overflow-y: auto;
    }
    @media (max-width: 1100px) {
        .iv-drawer { width: 94%; min-width: 0; }
    }
`],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class GeneralInvoiceSearchComponent implements OnInit {
  /*  Client-side filter over the rows already fetched. Fine at this list
      size; if the result sets grow this is what moves to the server.   */
  term: string = '';

  /*  ngx-pagination page number, named as everywhere else in this app. */
  PageActual: number = 1;

  /*  Select-all in the 'Print all of a day' grid. The template has always bound
      to this; it was never declared, which AOT can reject.                   */
  checkbox: boolean = false;

  order: string = 'CLIENTNAME';
  reverse: boolean = false;
  sortedCollection: any[];
  clientable: any = []; exampleRadios1: string = 'INVOICENO'; client: string = ""; invoiceno: string = "";
  client_startdate; client_enddate; jobno: string = ""; amount: string = ""; printall_date;
  datewise_startdate; datewise_enddate; Searchdata_list: any = [];printarray:any = [];
   
  public myDatePickerOptions: IMyDpOptions = {
    dateFormat: 'dd-mmm-yyyy',
    inline: false,
    height: '20px',
    width: '130px',
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

  constructor(private _dataService: DataService,
    private _toasterService: ToastCommonService,
    private loaderService: LoaderService,
    private http: HttpClient,
    private _activatedRoute: ActivatedRoute,private _router:Router,
    private _loginService: LoginService,private orderPipe: OrderPipe, private filterPipe: FilterPipe
  ) { this.sortedCollection = orderPipe.transform(this.Searchdata_list, this.Searchdata_list.CLIENTNAME);}

  ngOnInit() {
    //console.log(this._loginService.getLogin())
      // this.verifyPermission('3','Add')
      this.verifyPermission('423','Add')

    const jsonmaster = {
      cmpid: this._loginService.getLogin()[0].CMPID,
      cmp_code: this._loginService.getLogin()[0].CMPCODE,
      citycode: this._loginService.getLogin()[0].CITYCODE,
      citycode1: this._loginService.getLogin()[0].CITYCODE1
    }
    this._dataService.getData("Accounts/ACC_INVOICE_Search_Pageloag", jsonmaster)
      .subscribe((data: any) => {
      //  console.log(data)
        this.clientable = data.Table
      })
  }
  verifyPermission(formId, userMode) {
    this.loaderService.display(true);
    this._loginService.verifyRights(formId, '')
        .subscribe((data: any) => {         
           this._loginService.checkVerify(userMode, data);
           this.loaderService.display(false);

        });
}
  searchlist() {
    if (this.exampleRadios1 == "INVOICENO") {
      if (this.invoiceno == "") {
        this._toasterService.toast('warning', 'warning', "Please enter Invoice No to serach !");
        return false;
      }
    } else if (this.exampleRadios1 == "CLIENT") {
     // console.log( this.client_startdate)
      if (this.client == "" || this.client_startdate == "" || this.client_enddate == "" ||this.client_startdate == undefined ||this.client_enddate == undefined) {
        this._toasterService.toast('warning', 'warning', "Please select Client and Enter Start & End Date to Search !");
        return false;
      }else if (this.client_startdate !="" && this.client_enddate!=""){
        let intdtfrm1 ,intdtTo1;
        intdtfrm1=this._dataService.datechnge(this.client_startdate.formatted)
        intdtTo1=this._dataService.datechnge(this.client_enddate.formatted)
        if (this._dataService.date2Comparison(intdtfrm1,intdtTo1)==false){ 
          this._toasterService.toast('warning', 'warning', 'To date should be greater than from date !');
          return false;
        }
      }
    } else if (this.exampleRadios1 == "JOBNO") {
      if (this.jobno == "") {
        this._toasterService.toast('warning', 'warning', "Please enter Job No to serach !");
        return false;
      }
    } else if (this.exampleRadios1 == "AMOUNT") {
      if (this.amount == "") {
        this._toasterService.toast('warning', 'warning', "Please enter Amount No to serach  !");
        return false;
      }
    } else if (this.exampleRadios1 == "DATE") {
      if (this.datewise_startdate =="" || this.datewise_startdate == undefined )
      {
        this._toasterService.toast('warning', 'warning', "Please select start Date !");
        return false;
      }
      if ( this.datewise_enddate==""  || this.datewise_enddate == undefined  )
      {
        this._toasterService.toast('warning', 'warning', "Please select to Date !");
        return false;
      }
      if (this.datewise_startdate !="" && this.datewise_enddate!=""){
        let intdtfrm ,intdtTo;
        intdtfrm=this._dataService.datechnge(this.datewise_startdate.formatted)
        intdtTo=this._dataService.datechnge(this.datewise_enddate.formatted)
        if (this._dataService.date2Comparison(intdtfrm,intdtTo) ==false) 
        {
          this._toasterService.toast('warning', 'warning', 'To date should be greater than from date !');
          return false;
        }
}
    } else if (this.exampleRadios1 == "6") {
      if (this.printall_date == "" || this.printall_date == undefined) {
        this._toasterService.toast('warning', 'warning', "Please select start Date !");
        return false;
      }else{
        this.getinvoiceofday()
        return false
      }
    }
    this.loaderService.display(true)
    var jsonmaster = {
      InvoiceNo:this.invoiceno,
      Client:this.client,
      JobNo:this.jobno,
      Amount:this.amount,
      FromDate:this.exampleRadios1=="CLIENT" ? this.client_startdate.formatted :this.exampleRadios1=="DATE" ? this.datewise_startdate.formatted:"" ,
      ToDate:this.exampleRadios1=="CLIENT" ? this.client_enddate.formatted:this.exampleRadios1=="DATE"?this.datewise_enddate.formatted:"",
      cmp_code: this._loginService.getLogin()[0].CMPCODE,
      citycode:this._loginService.getLogin()[0].CITYCODE,
      Fin_StartDate:this._loginService.getLogin()[0].FINANCIAL_YEAR.STARTDATE,
      Fin_EndDate:this._loginService.getLogin()[0].FINANCIAL_YEAR.ENDDATE,
      cmpid:this._loginService.getLogin()[0].CMPID,
      TYPE:this.exampleRadios1
    }
   // console.log(jsonmaster)
    this._dataService.getData("Accounts/ACC_INVOICE_Search_List", jsonmaster)
      .subscribe((data: any) => {
        this.loaderService.display(false)
        if(data.Table.length=="0"){
          this._toasterService.toast("Alert", "Alert", "No record found");
        }else if(data.Table.length=="1"){
          this.Searchdata_list = data.Table
          this.ListOnclick(data.Table[0].INV_NO)
        }else{
        this.Searchdata_list = data.Table
        }
      })
  }
  InvoiceView(Invoiceno) {
    if(Invoiceno ==''||Invoiceno==undefined || Invoiceno.length < 15){
      alert("Enter 15 digit Invoice No !")
      return false
    }
    /*  A drawer over the results rather than a popup window: the list you came from stays
        behind it, and the detached window is one click away inside the drawer. The popup
        component is untouched and still serves Authorisation, UnAuthorisation, Credit Note
        and E-Invoice.                                                                    */
    this.DrawerInvNo = Invoiceno;
}

/*  Invoice detail drawer. */
DrawerInvNo: string = '';

CloseDrawer() {
    this.DrawerInvNo = '';
}

@HostListener('document:keydown.escape')
onEsc() {
    if (this.DrawerInvNo) { this.CloseDrawer(); }
}
// InvoicePrint(Invoiceno) {
//   if(Invoiceno ==''||Invoiceno==undefined || Invoiceno.length < 15){
//     alert("Enter 15 digit Invoice No !")
//     return false
//   }
//   let theTop = (screen.height / 2) - (483 / 2);
//   let theLeft = (screen.width / 2) - (780 / 2);
//   let toolbar = 'resizable=no,scrollbars=no,width=800,height=450,status=no,left=' + theLeft + ',top=' + theTop;
//   window.open('./#/popup/Account-Invoice-print/' + Invoiceno + '/' , "Invoice Print", toolbar);
// }
InvoicePrint(Invoiceno) {
  if(Invoiceno ==''||Invoiceno==undefined || Invoiceno.length < 15){
    alert("Enter 15 digit Invoice No !")
    return false
  }
  // let theTop = (screen.height / 2) - (483 / 2);
  // let theLeft = (screen.width / 2) - (780 / 2);
  // let toolbar = 'resizable=no,scrollbars=no,width=800,height=450,status=no,left=' + theLeft + ',top=' + theTop;
  // window.open('./#/popup/Account-Invoice-print/' + Invoiceno + '/' , "Invoice Print", toolbar);
  let theTop = (screen.height / 2) - (483 / 2);
  let theLeft = (screen.width / 2) - (780 / 2);
  let toolbar = 'resizable=no,scrollbars=no,width=800,height=450,status=no,left=' + theLeft + ',top=' + theTop;
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
ListOnclick(INVOICENO) {
  let  authby ;
   let updateItem = this.Searchdata_list.find(item => item.INV_NO === INVOICENO);
   authby=updateItem.AUTHORISEDBY.trim();
   let theTop = (screen.height / 2) - (483 / 2);
  let theLeft = (screen.width / 2) - (780 / 2);
  let toolbar = 'resizable=no,scrollbars=no,width=800,height=450,status=no,left=' + theLeft + ',top=' + theTop;
   if (confirm('Click Ok to Print or Click Cancel to Edit ?')) {
     let URL = "http://180.179.207.163/Linkserp-ac/UI/Accounts/frm_Acc_Tran_Invoice_Print.aspx?" +
     "huhpnk=" + this._loginService.getLogin()[0].GUID
     + "&citycode=" + this._loginService.getLogin()[0].CITYCODE1
     + "&Userid=" + this._loginService.getLogin()[0].CMPID
     + "&cmp_code=" + this._loginService.getLogin()[0].CMPCODE
     + "&InvoiceNo=" + INVOICENO
     + "&DisplayMode=" + "0"
     +"&cmp_username=" + this._loginService.getLogin()[0].CMP_USERNAME
         window.open(URL,  "Invoice Print", toolbar);
         return false;
     }
     else
     {
       if(authby == "undefined" || authby == "0" || authby == ""){
            this._router.navigate(['/accounts/transaction/invoice/general/' + INVOICENO]);
         }
          else{
            alert("You can not update But print the Invoice No.["+INVOICENO +"] Because Invoice is Already Authorised !!");
            this.InvoiceView(INVOICENO)
            return false;
          }
     }
 }
  SqlDate(strdateP) {
    if (strdateP != "" || strdateP != undefined) {
      let strdate = strdateP.split("/");
      let StrSqlDate = strdate[1] + "/" + strdate[0] + "/" + strdate[2];
      return StrSqlDate;
    }
    else return "";
  }

  getinvoiceofday(){
    this.loaderService.display(true)
    var jsonmaster = {
      cmp_code: this._loginService.getLogin()[0].CMPCODE,
      citycode:this._loginService.getLogin()[0].CITYCODE,
      Fin_StartDate:this._loginService.getLogin()[0].FINANCIAL_YEAR.STARTDATE,
      Fin_EndDate:this._loginService.getLogin()[0].FINANCIAL_YEAR.ENDDATE,
      DAY:this.printall_date.formatted
    }
   // console.log(jsonmaster)
    this._dataService.getData("Accounts/ACC_INVOICE_SEARCH_PERDAY", jsonmaster)
      .subscribe((data: any) => {
        this.loaderService.display(false)
       // console.log(data)
        if(data.Table.length=="0"){
          this._toasterService.toast("Alert", "Alert", "No record found");
        }else if(data.Table.length=="1"){
          this.Searchdata_list = data.Table
          this.ListOnclick(data.Table[0].INV_NO)
        }else{
        this.Searchdata_list = data.Table
        }
      })
  }

  backToSearch() {
    this.Searchdata_list = [];
    this.term = '';
    this.PageActual = 1;
  }

  getCheckboxValues(event, data) {
    var index = this.printarray.findIndex(x => x.invoiceno == data);
    if (event) {
      let obj = {
        invoiceno: data
      }
      this.printarray.push(obj);
      //console.log(  this.printarray)

    }
    else {
      this.printarray.splice(index, 1);
    //  console.log(  this.printarray)

    }
  }
  checkAll(ev) {
    this.printarray = []
    this.Searchdata_list.forEach(x => x.Checked = ev.target.checked)
    if (ev.target.checked == true) {
      for (var i = 0; i < this.Searchdata_list.length; i++) {
        let obj = {
          invoiceno: this.Searchdata_list[i].INV_NO
        }
        this.printarray.push(obj);
     //   console.log(  this.printarray)
      }
    } else {
      this.printarray = []
    }
  }
  PrintInvoice(){
    if(this.printarray.length=="0"){
      this._toasterService.toast("warning", "warning", "Select at least One Invoice No to Print.");
      return false
    }
    var output = this.printarray.map(function (item) {
      return item.invoiceno;
    });
    var datatry = output.join(",")
    var printnolist = datatry
   // console.log(printnolist)
    let URL = "http://180.179.207.163/Linkserp-ac/UI/Accounts/frm_Acc_Tran_Invoice_BulkPrint.aspx?" +
                  "huhpnk=" + this._loginService.getLogin()[0].GUID
                  + "&citycode=" + this._loginService.getLogin()[0].CITYCODE1
                  + "&Userid=" + this._loginService.getLogin()[0].CMPID
                  + "&cmp_code=" + this._loginService.getLogin()[0].CMPCODE
                  + "&entryno=" +printnolist                    
                  + "&CurLogInIP=" + environment.edocumentIp
                  window.open(URL, "_blank");
  }
  back() {
    //this.result.emit(true);
    this._router.navigate(['/accounts/transaction/invoice/invoicesearch']);
}
setOrder(value: string) {
  if (this.order === value) {
    this.reverse = !this.reverse;
  }
  this.order = value;
}
reset(){
  this.invoiceno="";
  this.client_startdate="";
  this.client_enddate=""
  this.datewise_startdate=""
  this.datewise_enddate=""
  this.client=""
  this.jobno=""
  this.amount=""
  this.printall_date = ""
 }
  /* ---- kit pager + export (from MPERPNG-20, additive). Rows are the loaded list after the
     Links quick filter (term) and the column sort, as the old filter/orderBy/paginate pipes
     gave them; select-all still covers every loaded row. ---- */
  readonly pageSize = 25;
  get filteredRows(): any[] {
    const rows = this.Searchdata_list || [];
    return this.term ? (this.filterPipe.transform(rows, this.term) || []) : rows;
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
    const all = this.exampleRadios1 == '6';
    const head = all ? ['Inv No', 'Inv Date', 'Client', 'Bill type', 'Total amt']
                     : ['Inv No', 'Inv Date', 'Client', 'Bill type', 'Invoiced on', 'Authorised on', 'Authorised by'];
    const rows = this.sortedRows.map(r => all ? [r.INV_NO, r.INV_DATE, r.EXP_NAME, r.INV_BILLTYPE, r.TOTALAMT]
                     : [r.INV_NO, r.INV_DATE, r.EXP_NAME, r.INV_BILLTYPE, r.INVOICED_ON, r.AUTHORISEDON, r.AUTHORISEDBY]);
    const q = (v: any) => '"' + ((v === null || v === undefined) ? '' : String(v)).replace(/"/g, '""') + '"';
    const csv = [head, ...rows].map(line => line.map(q).join(',')).join('\r\n');
    const d = new Date();
    const stamp = d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'invoices-' + stamp + '.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}
