import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { DataService } from '../../shared/service/dataService';
import { LoginService } from '../../shared/service/loginService';
import { ToastCommonService } from '../../shared/service/toastService';
import { IMyDpOptions } from 'mydatepicker';
import { LoaderService } from '../../shared/service/loader.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
@Component({
  selector: 'app-purchase-print',
  templateUrl: './purchase-print.component.html',
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
    `]
})
export class PurchasePrintComponent implements OnInit {
  SuppNo:string=""
  table0:any=[]
  table1:any=[]
  table2:any=[]
  table3:any=[]
  table4:any=[]
  totalamount: any =0
  totaldeduction: any =0
  grandtotal: any =0
  total_words:string=""
  Status:string="";
  printheader:string="";
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
      this.SuppNo = params["SuppNo"]
      this.Status=params["Status"]
      if(this.Status=='PI' || this.Status=='GENPI'){
      this.printheader='PURCHASE VOUCHER';
      }
      else if(this.Status=='RPI'){
        this.printheader='PURCHASE VOUCHER REQUEST';
        }
      else if(this.Status=='SRPI'){
          this.printheader='STAFF PURCHASE VOUCHER REQUEST';
          }
      this.getDataforPrint()
    });
  }
  getDataforPrint() {
    console.log("#")
    
    const _jsonData = {
      PUR_CODE: this.SuppNo,
      FROMDATE: "",
      TODATE:  "",
      PUR_SUPPLIER: "0",
      DISPLAYTYPE: "3",
      PUR_INVNO:"",
      citycode: this._loginService.getLogin()[0].CITYCODE,
      cmp_code: this._loginService.getLogin()[0].CMPCODE,
      YEAR_ID: this._loginService.getLogin()[0].FINANCIAL_YEAR.YEARID,
       
    };
 
  ///  console.log(_jsonData)
    this._loaderService.display(true);
    let url = "";
    if (this.Status == 'PI' || this.Status=='GENPI') {
      url = "Accounts/ACC_PURCHASE_PRINT_PI"
    }
    else if (this.Status == 'RPI'){
      url = "Accounts/ACC_PURCHASE_PRINT_RPI"
    } 
    else if (this.Status == 'SRPI'){
      url = "Accounts/ACC_PURCHASE_PRINT_SRPI"
    } 
    this._dataService.getData(url, _jsonData)
///   this._dataService.getData("Accounts/ACC_PURCHASE_PRINT_PI", _jsonData)
      .subscribe((data: any) => {
      console.log(data);
   
           this.table0= data.Table
           this.table1= data.Table1
           this.table2= data.Table2
           this.table3= data.Table3
           if(this.Status == 'PI' || this.Status=='GENPI'){
            this.table4= data.Table4
           }
           
           if(data.Table2[0].TOTALNETTOTAL!="" ||data.Table2[0].TOTALNETTOTAL!= undefined){
          //this.total_words = this._dataService.convertNumberToWords(data.Table2[0].TOTALNETTOTAL)
          this.total_words = this._dataService.toWords(data.Table2[0].TOTALNETTOTAL)
          this.CMP_IMAGE="assets/img/" + this.table3[0].CMP_IMAGE
           }
           this._loaderService.display(false);
            
    })
   
  }
  openEdocument() {
    let URL = environment.edocumentIp + "edocument-Links/View.html#/AutoRedirect?eformid=255&huhpnk=" + this._loginService.getLogin()[0].CMP_USERENCCODE + "&JOBNO=" + this.SuppNo + "&cmpcode=" +  this._loginService.getLogin()[0].CMPCODE + "&citycode=" + this._loginService.getLogin()[0].CITYCODE + "&CurLogInIP=" + environment.edocumentIp
    let theTop = (screen.height / 2) - (510 / 2);
    let theLeft = (screen.width / 2) - (760 / 2);
    let toolbar = 'resizable=yes,scrollbars=no,width=740,height=400,status=no,left=' + theLeft + ',top=' + theTop
    let NewWin = window.open(URL, "EDOC_VIEW", toolbar);
    NewWin.focus();
  }
  printjobReport(jobno) {

    let theTop = (screen.height / 2) - (483 / 2);
    let theLeft = (screen.width / 2) - (780 / 2);
    let toolbar = 'resizable=no,scrollbars=no,width=800,height=450,status=no,left=' + theLeft + ',top=' + theTop;
    window.open('./#/popup/Account-Job-Profit-Report/'  + jobno + '/', "Job Profit Report", toolbar);


  }
  PrintElem() {
    var data = document.getElementById('demo').innerHTML;
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