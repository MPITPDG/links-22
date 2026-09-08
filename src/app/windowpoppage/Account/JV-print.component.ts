import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { DataService } from '../../shared/service/dataService';
import { LoginService } from '../../shared/service/loginService';
import { ToastCommonService } from '../../shared/service/toastService';
import { LoaderService } from '../../shared/service/loader.service';
import { HttpClient } from '@angular/common/http';
@Component({
    selector: 'app-JV-print',
    templateUrl: './JV-print.component.html',
    styles: [`
    .dgHeader {
      border-right: black 1px solid;
      table-layout: auto;
      border-top: black 1px solid;
      font-weight: bold;
      font-size: 8pt;
      border-left: black 1px solid;
      color: black;
      border-bottom: black 1px solid;
      font-family: Verdana;
      border-collapse: separate;
  }
  .dgItem {
      border-right: black 1px solid;
      border-top: black 1px solid;
      font-size: 8pt;
      border-left: black 1px solid;
      color: black;
      border-bottom: black 1px solid;
      font-family: Verdana;
  }
  .Rpt_CodeDate {
    font-weight: bold;
    font-size: 9pt;
    color: black;
    font-family: Verdana,Arial;
  }
  .LabelNormal {
    font-size: 8pt;
    font-family: Verdana, Arial;
    color: #003388;
    cursor: default;
    border-width: 0px;
  }
  .Rpt_Label_content{
    font-size: 9pt;
    font-family: Verdana, Arial;
    color: black;
  }
      `]})
  export class JVPrintComponent implements OnInit {
    Type: any;
    EntryNo: any;
    table3:any=[];
    table2:any=[];
    tbllist:any=[];
    table1: any=[];
    table: any=[];
    total_words: string;
    labeltext: string;
    totalcredit:any = 0;
    totaldebit:any = 0;header:string="";
    amtinwords:string="";
    CMP_IMAGE: string = ""
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
          this.Type=params["Type"]
          this.EntryNo=params["entryno"]    
          this.getData()  
          if(this.Type=='JV') {
          this.header="Journal Voucher"
          }
          else   if(this.Type=='JVREQ') {
            this.header="Journal Voucher Request"
            }
      });
    }
    getData() {

        const _jsonData = {
            JVCode:this.EntryNo,
            Type:this.Type,
            };
          this._dataService.getData("Accounts/ACC_JV_PRINT", _jsonData)
            .subscribe((data: any) => {
         //   console.log(data)
                this.table3=data.Table   
                this.table1=data.Table1
                this.tbllist=data.Table1
                this.CMP_IMAGE= "assets/img/" + this.table3[0].cmp_image;
                //this.amtinwords=this._dataService.convertNumberToWords(data.Table[0]. )
                      });
    }
    getTotalDebit= function (){
      this.totaldebit =0;
        // for (var i = 0; i < this.table1.length; i++) {
        //   this.totaldebit  =  this.totaldebit  + parseFloat(this.table1[i].JV_DEBIT);
        // }
        for(let p of this.table1 ){
          this.totaldebit +=parseFloat(p.JV_DEBIT);
      }
        return this.totaldebit.toFixed(2);
    }
    getTotalCredit= function (){
        var total = 0;
             for(let p of this.table1 ){
            total+=parseFloat(p.JV_CREDIT);
        }
        return total.toFixed(2);
       
    }

    PrintElem() {
      var data = document.getElementById('demo').innerHTML;
      var mywindow = window.open('', 'Accounts - Journal Voucher Print', 'height=400,width=600');
      mywindow.document.write('<html><head><title>Accounts - Journal Voucher Print</title>');
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