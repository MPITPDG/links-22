import { Component, OnInit } from '@angular/core';
import { IMyDpOptions } from 'mydatepicker';
import { DataService } from '../../../shared/service/dataService';
import { AuthService } from '../../../shared/service/authService';
import { ToasterService } from 'angular2-toaster';
import { LoginService } from '../../../shared/service/loginService';
import { ToastCommonService } from '../../../shared/service/toastService';
import { LoaderService } from '../../../shared/service/loader.service';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { ExportexcelService } from 'src/app/shared/service/exportexcel.service';
@Component({
    selector: 'app-PrintCheque-Chequereport-search',
    templateUrl: './PrintCheque-Chequereport-search.component.html',
    styles: []
  })

  export class ChequeReportSearchComponent implements OnInit {
    exampleRadios1: string = 'No';
    exampleRadios2: string = 'B';
    chequeno: string;
    FromNo:string;
    ToNo:string;
    startdate;
    fromvalue;
    tovalue;
    chequetype;
    enddate;Searchdata_list: any = [];
    searchHeaderText: string = '';
    displayType: string = 'SEARCH';
    MSG: string = '';
    dataForExcel = [];
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
      private _loginService: LoginService,
      private exportser: ExportexcelService,
    ) { }
    ngOnInit() {
     
    }

    searchlist() {
      if (this.exampleRadios1 == "No") {
        if (this.FromNo == "" || this.FromNo == undefined  ) {
          this._toasterService.toast('warning', 'warning', "Please enter From Cheque No to Search !");
          return false;
        }
        else if (this.ToNo == ""  || this.ToNo == undefined ) {
          this._toasterService.toast('warning', 'warning', "Please enter To Cheque No to Search !");
          return false;
        }
      } 
      else if (this.exampleRadios1 == "Date") {
        if (this.startdate ==""  || this.startdate ==undefined)
        {
          this._toasterService.toast('warning', 'warning', "Please select start Date !");
          return false;
        }
        if ( this.enddate=="" || this.enddate==undefined)
        {
          this._toasterService.toast('warning', 'warning', "Please select to Date !");
          return false;
        }
        
  }
  if ( this.exampleRadios1 == "No")
  {
      this.fromvalue=this.FromNo;
      this.tovalue=this.ToNo;
    }   
    if ( this.exampleRadios1 == "Date")
    {
        this.fromvalue=this.startdate.formatted;
        this.tovalue=this.enddate.formatted;
      } 
      this.chequetype=this.exampleRadios2; 
      if(this.chequetype=="P")
      {
      this.searchHeaderText="CHEQUE - REPORT" + " - " + this.startdate.formatted + " - " + this.enddate.formatted + " [PRINTED]"
      } 
      if(this.chequetype=="B")
      {
      this.searchHeaderText="CHEQUE - REPORT" + " - " + this.startdate.formatted + " - " + this.enddate.formatted + " [ALL]"
      } 
      if(this.chequetype=="CN")
      {
      this.searchHeaderText="CHEQUE - REPORT" + " - " + this.startdate.formatted + " - " + this.enddate.formatted + " [CANCELLED BUT NOT PRINTED]"
      } 
      if(this.chequetype=="CR")
      {
      this.searchHeaderText="CHEQUE - REPORT" + " - " + this.startdate.formatted + " - " + this.enddate.formatted + " [CANCELLED AND REPRINTED]"
      } 
      if(this.chequetype=="C")
      {
      this.searchHeaderText="CHEQUE - REPORT" + " - " + this.startdate.formatted + " - " + this.enddate.formatted + "  [CANCELLED]"
      } 
      this.loaderService.display(true)
      var jsonmaster = {
        SearchType:this.exampleRadios1,
        FromVal:this.fromvalue,
        ToVal:this.tovalue,
        Type:this.exampleRadios2,
        CMPCODE: this._loginService.getLogin()[0].CMPCODE,
        
      }
     // console.log(jsonmaster)
      this._dataService.getData("Accounts/Acc_CMPBP_Cheque_Report", jsonmaster)
        .subscribe((data: any) => {
        //  console.log(data)
        this.displayType = 'LIST';
          this.Searchdata_list = data.Table1
          this.loaderService.display(false)
          
      
        })
    }

    resetlist()
    {
      this.startdate="";
      this.enddate="";
      this.FromNo="";
      this.ToNo="";
      this.exampleRadios2="B";
      this.exampleRadios1="No";
    }
    ViewReqBPPrint(ReqBPNo)
    {
      if(ReqBPNo.length >=15)
      {
      let theTop = (screen.height / 2) - (483 / 2);
      let theLeft = (screen.width / 2) - (780 / 2);
      let toolbar = 'resizable=no,scrollbars=no,width=800,height=450,status=no,left=' + theLeft + ',top=' + theTop;
      window.open('./#/popup/Account-Request-Bank-Payment-print/' + ReqBPNo + '/' , " Computerised BP View", toolbar);
    } 
    } 
    ViewBPPrint(BPNo)
    {
      if(BPNo.length >=15)
      {
      let theTop = (screen.height / 2) - (483 / 2);
      let theLeft = (screen.width / 2) - (780 / 2);
      let toolbar = 'resizable=no,scrollbars=no,width=800,height=450,status=no,left=' + theLeft + ',top=' + theTop;
      window.open('./#/popup/Account-CashBook-BankReceipt-print/' + 'BP' + '/' + BPNo.slice(1) + '/' , "", toolbar); 
    } 
   } 
   ExportToExcel()
   {
    
       this.Searchdata_list.forEach((row: any) => {
           this.dataForExcel.push(Object.values(row))
           });
           let reportData = {
             data: this.dataForExcel,
             headers: ['CHEQUE NO','CHEQUE DATE','PAYEE NAME','CHEQUE AMOUNT','TYPE','REQ BP NO','REQ BP DATE',
             'BP NO','BP DATE','REQUESTED BY','AUTHORISED BY','AUTHORISED DATE','PRINTED BY','PRINTED ON',
             'REASON','PRINTED CHEQUE','REPRINTED BY','REPRINTED ON','STATUS'
                       ],
             pagetype: "CHEQUEREPORT",
             title:'CHEQUE REPORT FROM ' + this.fromvalue + '  TO '+ this.tovalue   ,
             subtitle:'',
              }
            this.exportser.exportExceltry(reportData, "Chequereport-"+ this.fromvalue + '('+ this.tovalue + ')' );  
       }
  }