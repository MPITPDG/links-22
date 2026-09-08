import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { DataService } from '../../shared/service/dataService';
import { LoginService } from '../../shared/service/loginService';
import { ToastCommonService } from '../../shared/service/toastService';
import { IMyDpOptions } from 'mydatepicker';
import { LoaderService } from '../../shared/service/loader.service';
import { HttpClient } from '@angular/common/http';
@Component({
    selector: 'app-purchase-View',
    templateUrl: './purchase-view.component.html',
    styles: []
  })

  export class PurchaseViewComponent implements OnInit {
    Allitemlist: any = [];
    supplierlist: any = [];
    codelistActt: any = [];
    PassedBylist: any = [];
    billaddress: string = "";
    InvNo: string = "";
    InvDate: any = "";
    BillReceive: any = "";
    DueDate: any = "";
    suppliername: string;
    pursuppliername: string;
    passedby: string = "";
    passedbyperson: string = "";
    IsPassed: boolean = false;
    PurchaseNo: string = "";
    PurchaseDate: any = "";
    Narration: string = "";
    PassedAmount: string = "";
    InvoiceAmount: string = "";
    VoucherNo: string = "";
    AccountName: string;
    AccountNameList: any = [];
    Item: string;
    ItemList: any = [];
    Amount: string = "";
    Deduction: string = "";
    JobNo: string = "";
    actpassedamount: string = "";
    ActNarration: string = "";
    NetAmount: string = "";
    Netdeduction: string = "";
    text: string = "Submit"; txtchild: string = "Add";
    ID: string = "0";
    ENTRYNO: string = "0";
    CLIENT: string = "";
    ISNOTEDITABLE: string = "0";
    ACCTNAME: string = "";
    ACCBANKDTLSID: string = "0";
    STATUS: string = "";
    Accountlist: any = [];
    billaddressList: any = []
    billaddressfilter:any=[]
    Itemslist: any = []
    NetAmt: string = "0"; Type: string = "";
    formid: string="";
    fromright_dt: any=null;
 

  constructor(
    private _dataService: DataService,
    private _toasterService: ToastCommonService,
    private loaderService: LoaderService,
    private _router: Router,
    private http: HttpClient,
    private _activatedRoute: ActivatedRoute,
    private _loginService: LoginService,
  
  ) { }
  ngOnInit() {
   
   this.PurchaseDate = new Date();
   this.PurchaseDate =  this._dataService.datechnge(this.PurchaseDate)
   this._activatedRoute.params.subscribe(params => {
      this.PurchaseNo = params["PurchaseNo"];
      this.STATUS = params["Status"];
       })
    this.editpopulate()
}
editpopulate() {
    // this.loaderService.display(true);
     //console.log("******")
     const jsonview = {
       EntryNo: this.PurchaseNo,
       cmp_code: this._loginService.getLogin()[0].CMPCODE,
       citycode: this._loginService.getLogin()[0].CITYCODE,
       VGUID: this._loginService.getLogin()[0].GUID,
       STATUS: this.STATUS,
       CMPID:this._loginService.getLogin()[0].CMPID,
     }
    
     this._dataService.getData("Accounts/ACC_PURCHASE_VIEW", jsonview)
       .subscribe((data: any) => {
         //console.log(data)
         this.DueDate =  (data.Table[0].PUR_DUEDT != "") ? this._dataService.stringdttoArry(data.Table[0].PUR_DUEDT) : "";
         this.BillReceive = (data.Table[0].PUR_SUPBILLDATE != "") ? data.Table[0].PUR_SUPBILLDATE : "";///(data.Table[0].PUR_SUPBILLDATE != "") ? this._dataService.stringdttoArry(data.Table[0].PUR_SUPBILLDATE) : "";
         this.InvDate =(data.Table[0].PUR_SUPINVDATE != "") ? data.Table[0].PUR_SUPINVDATE : "";// (data.Table[0].PUR_SUPINVDATE != "") ? this._dataService.stringdttoArry(data.Table[0].PUR_SUPINVDATE) : "";
         this.InvNo = data.Table[0].PUR_INVNO;
         this.PurchaseNo = data.Table[0].PUR_CODE;
     //    this.PurchaseDate = (data.Table[0].PUR_DATE != "") ? this._dataService.stringdttoArry(data.Table[0].PUR_DATE) : "";
         this.PurchaseDate = (data.Table[0].PUR_DATE != "") ? data.Table[0].PUR_DATE : "";
         this.suppliername = data.Table[0].PUR_SUPPLIER;
         this.Narration = data.Table[0].REMARKS;
         this.passedby = data.Table[0].PASSEDBY;
         this.VoucherNo = data.Table[0].VOUCHERNO;
         this.PassedAmount = data.Table[0].PASSEDAMOUNT;
         this.InvoiceAmount = data.Table[0].SUPINVAMT;
         this.IsPassed = (data.Table[0].PASS == 'Y') ? true : false;
         this.Accountlist = data.Table1;
         this.NetAmount = data.Table2[0].TOTAMOUNT;
         this.Netdeduction = data.Table2[0].TOTDEDUCTION;
         this.NetAmt = data.Table2[0].NETTOTAL;
         this.pursuppliername=data.Table[0].PUR_SUPPLIERNAME;
         this.passedbyperson=data.Table[0].PASSEDBYPERSON;
         if(data.Table[0].FK_SUP_ADDR_ID!=""){
           var suppcode = data.Table[0].FK_SUP_ADDR_ID.split("|")[1];
          // console.log(suppcode)
           this.GetSupplierName(suppcode)
         }
         this.loaderService.display(false);
          
       })
    }
   GetSupplierName(Suppcode){
    this.billaddressfilter= this.billaddressList.filter((x: any) => x.SUPPCODE === Suppcode);
      if( this.billaddressfilter.length =="1"){
        this.billaddress= this.billaddressfilter[0].DATAVALUEFIELD
      }
  }
}