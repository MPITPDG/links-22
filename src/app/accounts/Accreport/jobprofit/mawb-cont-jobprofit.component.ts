import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { LoginService } from '../../../shared/service/loginService';
import { ToastCommonService } from '../../../shared/service/toastService';
import { LoaderService } from '../../../shared/service/loader.service';
import { HttpClient } from '@angular/common/http';
import { DataService } from 'src/app/shared/service/dataService';
import { log } from 'console';
import { AccordionComponent } from 'ngx-bootstrap/accordion';

@Component({
  selector: 'app-mawb-cont-jobprofit',
  templateUrl: './mawb-cont-jobprofit.component.html',
  styles: [`
  table{
    margin-bottom:0rem !important
  }
  #icon_show{
    font-size:18px;
    font-weight:bold
  }
  `]
})
export class MawbContJobprofitComponent implements OnInit {
  PageName: string = "MAWB-job profit report"
  inputname: string = "MAWB No."
  detailsdata_serch: boolean = false;
  reverse_CONT: boolean = false;
  reverse_VOCHR: boolean = false;
  reverse_JOB: boolean = false;
  PageType: any;
  searchno: any = ""
  cont_table1: any = [];
  job_table2: any = [];
  vouchr_table1: any = [];
  jobdetail_table4: any = [];
  childdetail_table4: any = [];
  vouchr_table3: any = [];
  

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
    this._activatedRoute.params.subscribe(params => {
      this.PageType = params["Type"]
    })
    if (this.PageType == "MAWB") {
      this.PageName = "MAWB-job profit report"
      this.inputname = "MAWB No."
    } else if (this.PageType == "CNTR") {
      this.PageName = "Container-job profit report"
      this.inputname = "Container No."
    }
  }
  
  Search() {
    this.loaderService.display(true)
    const jsonmaster = {
      SearchType: this.PageType,
      searchno: this.searchno,
      strVessel: ""
    }
    this._dataService.getData("Accounts/ACC_RPT_MAWBPROFITS_JOBWISE", jsonmaster)
      .subscribe((data: any) => {
        //console.log(data);
        this.loaderService.display(false)

        if (data.Table[0].STATUS == "100") {
          this.detailsdata_serch = true
          this.cont_table1 = data.Table1
          this.job_table2 = data.Table2;

          if (this.job_table2.length>0){
            this.job_table2.forEach(job => {
              job["childdetail"]=data.Table4.filter(x => x.JOBNO_JS === job.JOBNO);
              job["isvisible"]=true;
            });
            console.log(this.job_table2);
          }
          this.jobdetail_table4 = data.Table4
          this.vouchr_table3 = data.Table3
          //console.log(this.jobdetail_table4);
        } else {
          this._toasterService.toast('success', 'success', data.Table[0].STATUS)
        }

      })
  }

  // findDetails(jobno) {

  //   this.Searchdata=this.job_table2;
  //   let updateItem = this.Searchdata.find(item => item.JOBNO === jobno);// && item.MAWB_CONTINAER_JS == port);
  //   let index1 = this.Searchdata.indexOf(updateItem);

  //   if (this.Searchdata[index1]["CHECK"] == true) {
  //     this.Searchdata[index1]["CHECK"] = null;
  //   }
  //   else {
  //     for (let obj = 0; obj < this.Searchdata.length; obj++) {
  //       this.Searchdata[obj]["CHECK"] = null;
  //     }

  //     let index = this.Searchdata.indexOf(updateItem);
  //     this.Searchdata[index]["CHECK"] = true;

  //   }

  //   this.childdetail_table4 = this.jobdetail_table4.filter((joblist: any) => joblist.JOBNO_JS === jobno);// && joblist.EXPT_VESSEL);
  //   if (this.childdetail_table4.length == 0) {
  //     alert("Ex-Job Not yet Opened !");
  //     this.Searchdata[index1]["CHECK"] = null;
  //     return false;
  //   }
  // }

  findDetails(jobno) {
    this.childdetail_table4 = this.jobdetail_table4.filter(x => x.JOBNO_JS === jobno);
  }
  
  voucherprint(vouchername, voucherno) {
    var printname = vouchername.split("-")[1]
    printname = printname.trim()
    let theTop = (screen.height / 2) - (483 / 2);
    let theLeft = (screen.width / 2) - (780 / 2);
    let toolbar = 'resizable=no,scrollbars=no,width=800,height=450,status=no,left=' + theLeft + ',top=' + theTop;
    if (printname == "Invoice") {
     // window.open('./#/popup/Account-Invoice-print/' + voucherno + '/', "Invoice Print", toolbar);
     let URL = "http://180.179.207.163/Linkserp-ac/UI/Accounts/frm_Acc_Tran_Invoice_Print.aspx?" +
     "huhpnk=" + this._loginService.getLogin()[0].GUID
     + "&citycode=" + this._loginService.getLogin()[0].CITYCODE1
     + "&Userid=" + this._loginService.getLogin()[0].CMPID
     + "&cmp_code=" + this._loginService.getLogin()[0].CMPCODE
     + "&InvoiceNo=" + voucherno
     + "&DisplayMode=" + "0"
     +"&cmp_username=" + this._loginService.getLogin()[0].CMP_USERNAME
         window.open(URL,  "Invoice Print", toolbar);
         return false;
    } else if (printname == "Credit Note") {
       window.open('./#/popup/Account-CreditNote-print/' + voucherno + '/', "CreditNote Print", toolbar);
    } else if (printname == "Purchase") {
        window.open('./#/popup/Account-Purchase-print/' + voucherno + '/' +   "PI" + '/' , "Purchase Print", toolbar);
    }
    else if(printname=="Journal"){
      window.open('./#/popup/Account-JV-Print/' +  voucherno + '/' +  "JV" + '/', "Journal Voucher Print", toolbar);
    }
    else if(printname=="Bank Payment"){
      window.open('./#/popup/Account-CashBook-BankReceipt-print/' + "BP" + '/' + voucherno + '/' , "CashBook BankPayment Print", toolbar);
    }
    else if(printname=="Bank Receipt"){
      window.open('./#/popup/Account-CashBook-BankReceipt-print/' + "BR" + '/' + voucherno + '/' , "CashBook BankReceipt Print", toolbar);
    }
    else if(printname=="Bank Receipt"){
      window.open('./#/popup/Account-CashBook-BankReceipt-print/' + "BR" + '/' + voucherno + '/' , "CashBook BankReceipt Print", toolbar);
    }
    else if(printname=="Cash Payment"){
      window.open('./#/popup/Account-CashBook-BankReceipt-print/' + "CP" + '/' + voucherno + '/' , "CashBook CashPayment  Print", toolbar);
    }
    else if(printname=="Cash Recipt"){
      window.open('./#/popup/Account-CashBook-BankReceipt-print/' + "CR" + '/' + voucherno + '/' , "CashBook CashReceipt  Print", toolbar);
    }
    else if(printname=="Cash Expenses"){
      window.open('./#/popup/Account-CashBook-BankReceipt-print/' + "CE" + '/' + voucherno + '/' , "CashBook CashExpenses  Print", toolbar);
    }
  }


  jobprofitreport(jobno) {
    if (jobno == '' || jobno == undefined || jobno.length < 15) {
      alert("Enter 15 digit Job No !")
      return false
    }
    let theTop = (screen.height / 2) - (483 / 2);
    let theLeft = (screen.width / 2) - (780 / 2);
    let toolbar = 'resizable=no,scrollbars=no,width=800,height=450,status=no,left=' + theLeft + ',top=' + theTop;
    window.open('./#/popup/Account-Job-Profit-Report/' + jobno + '/', "Job Profit Report", toolbar);
    this.Reset()

  }
  setOrder_CONT() {
    this.reverse_CONT = !this.reverse_CONT;
  }

  setOrder_Voucher() {
    this.reverse_VOCHR = !this.reverse_VOCHR;
  }
  setOrder_JOB(jbno) {
     this.reverse_JOB = !this.reverse_JOB;
    // this.findDetails(jbno);
    this.job_table2.forEach(item => {
      if(item.JOBNO===jbno){
        item["isvisible"]=!item["isvisible"];
      }
    });
  }
  Reset() {
    this.searchno = ""
  }
}
