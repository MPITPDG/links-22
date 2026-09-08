import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IMyDpOptions } from 'mydatepicker';
import { AuthService } from 'src/app/shared/service/authService';
import { DataService } from 'src/app/shared/service/dataService';
import { LoaderService } from 'src/app/shared/service/loader.service';
import { LoginService } from 'src/app/shared/service/loginService';
import { ToastCommonService } from 'src/app/shared/service/toastService';
import { OrderPipe } from 'ngx-order-pipe';
import { FilterPipe } from 'ngx-filter-pipe';
import { DatePipe } from '@angular/common';
import { ExportexcelService } from 'src/app/shared/service/exportexcel.service';

@Component({
  selector: 'app-req-bp-auth-list',
  templateUrl: './req-bp-auth-list.component.html',
  styles: [],
  providers: [DatePipe]
})
export class ReqBPAuthListComponent implements OnInit {
  checkbox: boolean;
  public searchString: string;
  showModal_ListReject:Boolean=false
  rejectlist:any=[]
  details:any=[]
  DataList: any=[];
  order: string = 'ENTRYDT1';
  reverse: boolean = true;
  PageActual: number = 1;
  newarray: any=[];
  entry_nos: string='';
  chk_authflg: string='';
  auth_date: string='';
  todayDate = new Date();
  constructor(
    private _router: Router,
    private _dataService: DataService,
    private _auth: AuthService, private _activatedRoute: ActivatedRoute,
    private _toasterService: ToastCommonService,
    private _loginService: LoginService,private datePipe: DatePipe, private exportser :ExportexcelService,
    private _loaderService: LoaderService, private orderPipe: OrderPipe, private filterPipe: FilterPipe
  ) { }

  ngOnInit() {
   
    this.verifyPermission('98','View')
    this._loaderService.display(true);
    this.getdata()
  }
  verifyPermission(formId, userMode) {
    this._loaderService.display(true);
    this._loginService.verifyRights(formId, '')
        .subscribe((data: any) => {          
           this._loginService.checkVerify(userMode, data);
           this._loaderService.display(false);

        });
}
  getdata(){
    const jsoncmp = {
      cmpid: this._loginService.getLogin()[0].CMPID,
      CMPCODE: this._loginService.getLogin()[0].CMPCODE,
      citycode: this._loginService.getLogin()[0].CITYCODE,
      status: "",
    }
    //console.log(jsoncmp)
    this._dataService.getData("Accounts/ACC_CMPBP_Fill_Vouchers_Authorisation", jsoncmp)
      .subscribe((data: any) => {
       // console.log(data)
        this.DataList = data.Table;
        this._loaderService.display(false);
      })

  }
  setOrder(value: string) {
    if (this.order === value) {
      this.reverse = !this.reverse;
    }
    this.order = value;
  }

  rejectdata(){
    //console.log(this.newarray);
    var output = this.newarray.map(function (item) {
      return item.EntryNo;
    });
    this.entry_nos = output.join(",")
    if(  this.entry_nos =="" ){
      alert("Please  Select at Least One Entry No.")
      return false
    }
    const jsoncmp = {
      cmpid: this._loginService.getLogin()[0].CMPID,
      CMPCODE: this._loginService.getLogin()[0].CMPCODE,
      citycode: this._loginService.getLogin()[0].CITYCODE,
      status: "BP",
      EntryNo:this.entry_nos,
      CHKAuthorityFlag:"2",
      AuthorisationDt:this.datePipe.transform(this.todayDate, 'dd-MMM-yyyy')
    }
   // console.log(jsoncmp)
    this._loaderService.display(true);

    this._dataService.getData("Accounts/Acc_CMPBP_REJECT_BPREQUEST", jsoncmp)
      .subscribe((data: any) => {
     //   console.log(data)
        this._loaderService.display(false);
        if(data.Table[0].STATUS=="100"){
          this._toasterService.toast("success", "success", data.Table[0].STATUSTEXT)
          this.getdata()
        }else{
          this._toasterService.toast("error", "error", data.Table[0].STATUSTEXT)
        }
      })

  }
  assignauthdata(){
   // console.log(this.newarray);
    var output = this.newarray.map(function (item) {
      return item.EntryNo;
    });
    this.entry_nos = output.join(",")
    if(  this.entry_nos =="" ){
      alert("Please  Select at Least One Entry No.")
      return false
    }
    if (confirm('Are you sure you want to Authorise selected BP Request No. \n[' + this.entry_nos + ']?')) {
    const jsoncmp = {
      cmpid: this._loginService.getLogin()[0].CMPID,
      CMPCODE: this._loginService.getLogin()[0].CMPCODE,
      citycode: this._loginService.getLogin()[0].CITYCODE,
      status: "BP",
      EntryNo:this.entry_nos,
      CHKAuthorityFlag:"1",
      AuthorisationDt:this.datePipe.transform(this.todayDate, 'dd-MMM-yyyy')
    }
//console.log(jsoncmp)
    this._loaderService.display(true);
    this._dataService.getData("Accounts/Acc_CMPBP_Assign_Authorisation_ChqPrint", jsoncmp)
      .subscribe((data: any) => {
     //   console.log(data)
        this._loaderService.display(false);
        if(data.Table[0].STATUS=="100"){
          this._toasterService.toast("success", "success", data.Table[0].STATUSTEXT)
          this.getdata()
        }else{
          this._toasterService.toast("error", "error", data.Table[0].STATUSTEXT)
        }
      })
    }
    else
    { return false;}
    
  }
  viewrjectlist(){
    this.showModal_ListReject=true
    const jsoncmp = {
      cmpid: this._loginService.getLogin()[0].CMPID,
      CMPCODE: this._loginService.getLogin()[0].CMPCODE,
      citycode: this._loginService.getLogin()[0].CITYCODE,
      status: "BP",    
    }
  //  console.log(jsoncmp)
    this._loaderService.display(true);
    this._dataService.getData("Accounts/Acc_CMPBP_REJECT_BPView", jsoncmp)
      .subscribe((data: any) => {
     //  console.log(data)
       this.rejectlist=data.Table
       this._loaderService.display(false);

    })  
  }
  close(){
    this.showModal_ListReject=false
  }
  getCheckboxValues(event, entryno,chkflag,authdate) {
    var index = this.newarray.findIndex(x => x.ENTRYNO == entryno);
    if (event) {
      let obj = {
        EntryNo: entryno,    
      }
      this.newarray.push(obj);
    }
    else {
      this.newarray.splice(index, 1);
    }
  }
  checkAll(ev) {
    this.newarray = []
    this.DataList.forEach(x => x.Checked = ev.target.checked)
    if (ev.target.checked == true) {
      for (var i = 0; i < this.DataList.length; i++) {
        if(this.DataList[i].CHKPRINTAUTHORITY != "1"){
        let obj = {
        EntryNo: this.DataList[i].ENTRYNO,
        }
        this.newarray.push(obj);
        }
      }
    } else {
      this.newarray = []
    }
  //  console.log(this.newarray);
    
  }
  // exp_exl(){
  //   for (let i = 0; i < this.DataList.length; i++) {
        
  //     this.details.push({'Entry No' : this.DataList[i].ENTRYNO, 'Created By': this.DataList[i].CREATEDBY,
  //     "Enttry Date": this.DataList[i].ENTRYDT, "PayBy Date": this.DataList[i].CHEQUEDT, "Payee Name": this.DataList[i].PAYEENAME,"Amount":this.DataList[i].AMOUNT,
  //       "Authorised By": this.DataList[i].USERNAME, "Authorisation Date": this.DataList[i].AUTHORISATIONDATE,"Job No.":this.DataList[i].JOB, "Bill No.":this.DataList[i].BILLNO,
  //       "Type" :this.DataList[i].TYPE});
      
  //   }
  //   this.exportser.exportExcel(this.details, 'ChequePrint');
  // }
  exp_exl(){

    this.DataList.forEach((row: any) => {
      this.details.push(Object.values(row))
    })

    let reportData = {
      title: 'Request Bank Payment authorization list',
      data: this.details,
      headers: Object.keys(this.DataList[0])
    }

    this.exportser.exportExceltry(reportData,"Request-BankPayment");



    // for (let i = 0; i < this.DataList.length; i++) {
        
    //   this.details.push({'Entry No' : this.DataList[i].ENTRYNO, 'Created By': this.DataList[i].CREATEDBY,
    //   "Enttry Date": this.DataList[i].ENTRYDT, "PayBy Date": this.DataList[i].CHEQUEDT, "Payee Name": this.DataList[i].PAYEENAME,"Amount":this.DataList[i].AMOUNT,
    //     "Authorised By": this.DataList[i].USERNAME, "Authorisation Date": this.DataList[i].AUTHORISATIONDATE,"Job No.":this.DataList[i].JOB, "Bill No.":this.DataList[i].BILLNO,
    //     "Type" :this.DataList[i].TYPE});
      
    // }
    // this.exportser.exportExcel(this.details, 'ChequePrint');
  }

   reqviewdata(entryno) {
    if(entryno ==''||entryno==undefined || entryno.length < 15){
      alert("Enter 15 digit EntryNo No !")
      return false
    }
    let theTop = (screen.height / 2) - (483 / 2);
    let theLeft = (screen.width / 2) - (780 / 2);
    let toolbar = 'resizable=no,scrollbars=no,width=800,height=450,status=no,left=' + theLeft + ',top=' + theTop;
    window.open('./#/popup/Account-Request-Bank-Payment-print/' + entryno + '/' , "BPRequest View", toolbar);
}

}