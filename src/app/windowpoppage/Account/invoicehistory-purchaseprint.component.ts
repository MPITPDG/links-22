import { Component, OnInit } from '@angular/core';
import { DataService } from '../../shared/service/dataService';
import { LoaderService } from '../../shared/service/loader.service';
import { ActivatedRoute } from '@angular/router';
import { LoginService } from '../../shared/service/loginService';
@Component({
  selector: 'app-invoicehistory-purchaseprint',
  templateUrl: './invoicehistory-purchaseprint.component.html',

})
export class InvoicehistoryPurchaseprintComponent implements OnInit {
  EntryNo: any;
  table0: any = [];
  accounttable: any = [];
  compnytable: any = [];

  constructor(public _dataService: DataService,
    private _route: ActivatedRoute,
    public _loginService: LoginService,
    private _loaderService: LoaderService) { }

  ngOnInit() {
    this._route.params.subscribe(params => {
      this.EntryNo = params["entryno"]
      this.getpurchaseprintdata();
    });
  }

  getpurchaseprintdata() {
    this._loaderService.display(true)
    const jsonmaster = {
      entryno: this.EntryNo,
    }
    this._dataService.getData("Accounts/ACCFRA_TRAN_PURCHASE_PRINT", jsonmaster)
      .subscribe((data: any) => {
          //console.log(data)
        this.table0 = data.Table[0]
        this.accounttable = data.Table1
        this.compnytable = data.Table2[0]
        this._loaderService.display(false)

      })
  }
  PrintElem() {
    var data = document.getElementById('purchaseprint').innerHTML;
    var mywindow = window.open('', 'Accounts - Purchase Print', 'height=400,width=600');
    mywindow.document.write('<html><head><title>Accounts - Purchase Print</title>');
    mywindow.document.write('<link rel="stylesheet" href="assets/css/invoice.css" type="text/css" />');
    mywindow.document.write('</head><body >');
    mywindow.document.write(data);
    mywindow.document.write('</body></html>');
    mywindow.document.close(); // necessary for IE >= 10
  
    mywindow.onload = function () { // necessary if the div contain images
  
      mywindow.focus(); // necessary for IE >= 10
      mywindow.print();
      mywindow.close();
    };
    return true;
  }
}
