import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DataService } from 'src/app/shared/service/dataService';
import { LoaderService } from 'src/app/shared/service/loader.service';
import { LoginService } from 'src/app/shared/service/loginService';
import { ToastCommonService } from 'src/app/shared/service/toastService';

@Component({
  selector: 'app-reqbp-view',
  templateUrl: './reqbp-view.component.html',
  styles: []
})
export class ReqbpViewComponent implements OnInit {
  entryno: any;
  table: any;
  table1: any; table2: any;
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
        this.entryno=params["EntryNo"]    
        this.viewdata()  
    });
  }
  viewdata(){
    const jsoncmp = {
      EntryNo: this.entryno
    }
    //console.log(jsoncmp)
    //this._loaderService.display(true);
    this._dataService.getData("Accounts/Acc_CMPBP_BPView", jsoncmp)
      .subscribe((data: any) => {
       //console.log(data)
       this.table=data.Table[0]
       this.table1=data.Table1
       this.table2=data.Table2
    //   this.rejectlist=data.Table
      // this._loaderService.display(false);

    })  
  }

  billprint(entryno){
      if(entryno ==''||entryno==undefined || entryno.length < 15){
        alert("Enter 15 digit EntryNo No !")
        return false
      }
       
      let theTop = (screen.height / 2) - (483 / 2);
      let theLeft = (screen.width / 2) - (780 / 2);
      let toolbar = 'resizable=no,scrollbars=no,width=800,height=450,status=no,left=' + theLeft + ',top=' + theTop;
      if (entryno.substring(11,12)=="9"){
        window.open('./#/popup/Account-Purchase-print/' + entryno + '/' + 'PI' + '/' , "Purchase Print", toolbar);    
      }
      else if (entryno.substring(8,9)=="1"){
       // window.open('./#/popup/Account-Invoice-print/' + entryno + '/' , "BPRequest View", toolbar);        
       let URL = "http://180.179.207.163/Linkserp-ac/UI/Accounts/frm_Acc_Tran_Invoice_Print.aspx?" +
       "huhpnk=" + this._loginService.getLogin()[0].GUID
       + "&citycode=" + this._loginService.getLogin()[0].CITYCODE1
       + "&Userid=" + this._loginService.getLogin()[0].CMPID
       + "&cmp_code=" + this._loginService.getLogin()[0].CMPCODE
       + "&InvoiceNo=" + entryno
       + "&DisplayMode=" + "0"
       +"&cmp_username=" + this._loginService.getLogin()[0].CMP_USERNAME
           window.open(URL,  "Invoice Print", toolbar);
           return false;
      }
     
  
  }

  billlist(billno){
    // in erp 2 condtion = 1 ng print 
      let theTop = (screen.height / 2) - (483 / 2);
      let theLeft = (screen.width / 2) - (780 / 2);    
      let toolbar = 'resizable=no,scrollbars=no,width=800,height=450,status=no,left=' + theLeft + ',top=' + theTop;     
      window.open('./#/popup/Account-Request-BP-Bill-List/' + billno + '/' , "BPRequest View", toolbar);
      

  }
  Jobprofit(jobno){
    let theTop = (screen.height / 2) - (483 / 2);
    let theLeft = (screen.width / 2) - (780 / 2);
    let toolbar = 'resizable=no,scrollbars=no,width=800,height=450,status=no,left=' + theLeft + ',top=' + theTop;
    window.open('./#/popup/Account-Job-Profit-Report/' + jobno + '/', "Job Profit Report", toolbar);

  }
  AdvRecvClient(jobno){
    let theTop = (screen.height / 2) - (483 / 2);
    let theLeft = (screen.width / 2) - (780 / 2);
    let toolbar = 'resizable=no,scrollbars=no,width=800,height=450,status=no,left=' + theLeft + ',top=' + theTop;
    window.open('../#/popup/Account-AdvRecfrmClient/' + jobno + '/', "ADVANCE FROM CLIENTS", toolbar);

  }

 
}
