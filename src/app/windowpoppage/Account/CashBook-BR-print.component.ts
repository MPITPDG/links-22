import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { DataService } from '../../shared/service/dataService';
import { LoginService } from '../../shared/service/loginService';
import { ToastCommonService } from '../../shared/service/toastService';
import { LoaderService } from '../../shared/service/loader.service';
import { HttpClient } from '@angular/common/http';
import { param } from 'jquery';
@Component({
  selector: 'app-cash-book-br-print',
  templateUrl: './CashBook-BR-print.component.html',
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
export class CashBookBRPrintComponent implements OnInit {
  PageType: any;
  EntryNo: any;
  table3:any=[]
  table2:any=[]
  table1: any=[];
  table: any=[];
  total_words: string;
  labeltext: string;
  CMP_IMAGE:string;
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
        this.PageType=params["Type"]
        this.EntryNo=params["BrNo"]    
        this.getData()  
    });
  }
   
getData() {
  let API_Pass=""
  let _jsonData
  if(this.PageType=="CC"){
    _jsonData = {
      CMPCODE: this._loginService.getLogin()[0].CMPCODE,
      CITYCODE: this._loginService.getLogin()[0].CITYCODE,
      ENTRYNO:this.EntryNo,
      FROMDATE:"",
      TODATE:"",
      CLIENT:"",
      CHEQUENO:"",
      OURBANK:"",
      JOBNO:"",
      AMOUNT:"",
      STATUS:this.PageType,
      MODE:"PRINT",
      DISPLAYTYPE:"ENTRYNO",
      YEARID:this._loginService.getLogin()[0].FINANCIAL_YEAR.YEARID ,  
      Cmpid:this._loginService.getLogin()[0].CMPID          
  }
  API_Pass="Accounts/ACC_ReqBP_SEARCH"
  }
  else{
    _jsonData = {
       CMPCODE: this._loginService.getLogin()[0].CMPCODE,
       CITYCODE: this._loginService.getLogin()[0].CITYCODE,
       ENTRYNO:this.EntryNo,
       FROMDATE:"",
       TODATE:  "",
       CLIENT:"",
       CHEQUENO:"",
       OURBANK:"",
       JOBNO:"",
       AMOUNT:"",
       STATUS:this.PageType,
       MODE:"PRINT",
       DISPLAYTYPE:"ENTRYNO",
       YEARID:this._loginService.getLogin()[0].FINANCIAL_YEAR.YEARID ,               
   };
   API_Pass="Accounts/ACC_CASHBOOK_SEARCH"
}
        this._dataService.getData(API_Pass, _jsonData)
          .subscribe((data: any) => {
        if(this.PageType=="CC"){
          this.table3=data.Table3   
          this.table2=data.Table2
          this.table1=data.Table1
          this.table=data.Table
          this.CMP_IMAGE= "assets/img/" + this.table3[0].CMP_IMAGE
          this.total_words = this._dataService.ConvertNumberToWordsNew(parseFloat(data.Table2[0].NETTOT).toFixed(2));   
          this.labeltext = "Bank Payment"
        
        }
          
        else
        {this.table3=data.Table3   
          this.table2=data.Table2
          this.table1=data.Table1
          this.table=data.Table
          this.CMP_IMAGE= "assets/img/" + this.table3[0].CMP_IMAGE
            this.total_words = this._dataService.ConvertNumberToWordsNew(parseFloat(data.Table2[0].NETTOT).toFixed(2));   
            if (this.table[0].STATUS == "BP") {
            this.labeltext = "Bank Payment"
            }else if (this.table[0].STATUS == "BR") {
              this.labeltext =  "Bank Receipt"
            } else if (this.table[0].STATUS == "CP") {
              this.labeltext = "CASH Payment"
              }else if(this.table[0].STATUS == "CR") {
                this.labeltext =  "CASH Receipt"
            }
             else if(this.table[0].STATUS == "CE") {
              this.labeltext =  "CASH Expense"
          }
        
           }
          
           
          
             
      });
}

PrintElem() {
  var data = document.getElementById('demo').innerHTML;
  var mywindow = window.open('', 'Accounts - CASH BOOK-Bank Receipt Print', 'height=400,width=600');
  mywindow.document.write('<html><head><title>Accounts - CASH BOOK-Bank Receipt Print</title>');
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
