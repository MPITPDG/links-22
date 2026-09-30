import { Component, OnInit, HostListener, ChangeDetectionStrategy } from '@angular/core';
import { IMyDpOptions } from 'mydatepicker';
import { DataService } from '../../../shared/service/dataService';
import { AuthService } from '../../../shared/service/authService';
import { ToasterService } from 'angular2-toaster';
import { LoginService } from '../../../shared/service/loginService';
import { ToastCommonService } from '../../../shared/service/toastService';
import { LoaderService } from '../../../shared/service/loader.service';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { OrderPipe } from 'ngx-order-pipe';
import { FilterPipe } from 'ngx-filter-pipe';
@Component({
  selector: 'app-proforma-invoice-search',
  templateUrl: './proforma-invoice-search.component.html',
  styleUrls: ['./proforma-invoice-search.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class ProformaInvoiceSearchComponent implements OnInit {
  /*  Tax Invoice drawer. Opened from the converted invoice number on a converted row;
      the same app-invoice-view-page the Invoice Search screen shows.                  */
  DrawerInvNo: string = '';

  ViewInvoice(invno: string) {
    const no = (invno || '').trim();
    if (no.length < 15) { return; }
    this.DrawerInvNo = no;
  }

  CloseDrawer() {
    this.DrawerInvNo = '';
  }

  @HostListener('document:keydown.escape')
  onEsc() {
    if (this.DrawerInvNo) { this.CloseDrawer(); }
  }

  order: string = 'CLIENTNAME';
  term: string = '';                 // quick filter over the loaded rows
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
      this.verifyPermission('422','Add')

    const jsonmaster = {
      cmpid: this._loginService.getLogin()[0].CMPID,
      cmp_code: this._loginService.getLogin()[0].CMPCODE,
      citycode: this._loginService.getLogin()[0].CITYCODE,
      citycode1: this._loginService.getLogin()[0].CITYCODE1
    }
    this._dataService.getData("Accounts/ACC_PROFORMA_Search_Pageloag", jsonmaster)
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
    this._dataService.getData("Accounts/ACC_PROFORMA_Search_List", jsonmaster)
      .subscribe((data: any) => {
        this.loaderService.display(false)
        if (data.Table.length == 0) {
          this._toasterService.toast("Alert", "Alert", "No record found");
          this.Searchdata_list = [];
        } else {
          /*  Show the grid even for a single hit.

              The invoice search opens the only match straight away, which is fine there because
              everything you can do to an invoice is on the entry screen. Here, "Convert to Tax
              Invoice" exists only in this grid - so auto-opening made a lone proforma
              impossible to convert.                                                          */
          this.Searchdata_list = data.Table;
        }
      })
  }
  ProformaPrint(Profno) {
    if (Profno == '' || Profno == undefined || Profno.length < 15) {
      alert("Enter 15 digit Proforma Invoice No !")
      return false
    }
    let theTop = (screen.height / 2) - (483 / 2);
    let theLeft = (screen.width / 2) - (780 / 2);
    let toolbar = 'resizable=no,scrollbars=no,width=800,height=450,status=no,left=' + theLeft + ',top=' + theTop;
    window.open('./#/popup/Account-Proforma-Print/' + Profno + '/', "Proforma Invoice Print", toolbar);
  }

  /*  Convert to Tax Invoice.

      Opens a full page rather than a dialog. Conversion is not undoable - it takes a number
      off the statutory invoice series and locks the proforma - so it gets a page you can
      read, in the same style as Export > View Consignment.                                */
  backToSearch() {
    this.Searchdata_list = [];
    this.term = '';
  }

  ConvertToInvoice(Profno) {
    let row = this.Searchdata_list.find(item => item.INV_NO === Profno);
    if (row && row.CONVERTED_INV_NO && String(row.CONVERTED_INV_NO).trim() != "") {
      this._toasterService.toast("warning", "warning",
        "Already converted to Invoice No. [" + row.CONVERTED_INV_NO + "]");
      return false;
    }
    this._router.navigate(['/accounts/transaction/proformainvoice/convert/' + Profno]);
  }

  ListOnclick(PROFNO) {
    let theTop = (screen.height / 2) - (483 / 2);
    let theLeft = (screen.width / 2) - (780 / 2);
    let toolbar = 'resizable=no,scrollbars=no,width=800,height=450,status=no,left=' + theLeft + ',top=' + theTop;

    // Once a proforma has been converted to a tax invoice it is a historic record: print only,
    // never editable. Editing it after conversion would let the proforma and the invoice it
    // produced disagree, with no way to tell which the client actually approved.
    let row = this.Searchdata_list.find(item => item.INV_NO === PROFNO);
    let converted = (row && row.CONVERTED_INV_NO) ? String(row.CONVERTED_INV_NO).trim() : "";
    if (converted != "") {
      this._toasterService.toast("warning", "warning",
        "Already converted to Invoice No. [" + converted + "] - opening for print. It can no longer be edited.");
      window.open('./#/popup/Account-Proforma-Print/' + PROFNO + '/', "Proforma Invoice Print", toolbar);
      return false;
    }

    if (confirm('Click Ok to Print or Click Cancel to Edit ?')) {
      window.open('./#/popup/Account-Proforma-Print/' + PROFNO + '/', "Proforma Invoice Print", toolbar);
      return false;
    }
    else {
      this._router.navigate(['/accounts/transaction/proformainvoice/general/' + PROFNO]);
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
    this._dataService.getData("Accounts/ACC_PROFORMA_SEARCH_PERDAY", jsonmaster)
      .subscribe((data: any) => {
        this.loaderService.display(false)
       // console.log(data)
        if (data.Table.length == 0) {
          this._toasterService.toast("Alert", "Alert", "No record found");
          this.Searchdata_list = [];
        } else {
          /*  Show the grid even for a single hit.

              The invoice search opens the only match straight away, which is fine there because
              everything you can do to an invoice is on the entry screen. Here, "Convert to Tax
              Invoice" exists only in this grid - so auto-opening made a lone proforma
              impossible to convert.                                                          */
          this.Searchdata_list = data.Table;
        }
      })
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
  back() {
    //this.result.emit(true);
    this._router.navigate(['/accounts/transaction/proformainvoice/proformasearch']);
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
}
