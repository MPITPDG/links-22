import { Component, OnInit, OnChanges, ViewChild, OnDestroy, Input, ChangeDetectionStrategy } from '@angular/core';
import { DataService } from '../../../shared/service/dataService';
import { AuthService } from '../../../shared/service/authService';
import { Router ,ActivatedRoute} from '@angular/router';
import { LoginService } from '../../../shared/service/loginService';
import { ToastCommonService } from '../../../shared/service/toastService';
import { LoaderService } from '../../../shared/service/loader.service';
///import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { ModalDirective } from 'ngx-bootstrap/modal';

@Component({
  templateUrl: 'staffpurchase-Auth.component.html',
    styleUrls: ['../../purchase/purchase-page.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})

export class StaffPurchaseAuth implements OnInit {
  @ViewChild('Staff', {static: false}) public staffmodel: ModalDirective;
  @Input () callgetdataforauth: any;
      public searchString: string;
      dataTable: Array<any> = [];
      @Input() VeriSRPNO: any = '';
    strheader: string;
    srpidata: any = [];
    Listdata: any =[];
    newArray: any = [];
    order: string = 'REQCODE';
    reverse: boolean = false;
    // userFilter: any = { INV_CRTNO: '' };
    sortedCollection: any[];
    PageActual: number = 1;
   /// modalRef: BsModalRef;
    checkbox: boolean;
    PURCODE:string="";
    authstatus:string="";
    authstat:string="";
    FLAG:string="EDIT";
    hidebtnrow:string="U";
    Status:string;
         datatabl_1=[]
         STRTXT:any=[];  
    // ---------- page state (additive: pager, export) ----------
    readonly pageSize = 10;
    page: number = 1;
    constructor(
      private _router: Router,
      private _dataService: DataService,
      private _auth: AuthService,
      private _toasterService: ToastCommonService,
      private _loginService: LoginService,
    ///  private modalService: BsModalService,
      private loaderService: LoaderService ,
      private _route: ActivatedRoute,///,
     // private orderPipe: OrderPipe, private filterPipe: FilterPipe
    ) 
    {
      //this.getdataforauth()
    }
    ngOnChanges() {
      // this.VeriSRPNO = (this.VeriSRPNO != undefined || this.VeriSRPNO != '') ? this.VeriSRPNO : '';
      // console.log(this.VeriSRPNO );
    }
 
    ngOnInit(): void {
      this._route.params.subscribe(params => {
        this.Status= params["Status"];
      });
      // console.log(this._loginService.getLogin()[0])
      if(this.Status=='SRPI'){
      this.strheader='Authorise Staff Purchase Request List'
      }
      else  if(this.Status=='RPI'){
        this.strheader='Authorise Purchase Request List'
        }
      this.loaderService.display(true)
      this.getdataforauth()
    }
   
    getdataforauth(){
      this.FLAG="EDIT";
      this.authstatus="U";
      this.hidebtnrow="U";
      this.authstat="U"
        const jsonmaster = {
        CMPID: this._loginService.getLogin()[0].CMPID,
        CMPCODE: this._loginService.getLogin()[0].CMPCODE,
        CITYCODE: this._loginService.getLogin()[0].CITYCODE,
        STATUS: this.Status,
        AUTHORISATIONSTATUS: this.authstatus
      }
      this._dataService.getData("Accounts/ACC_CPJVPI_REQUEST_AUTHORISATION_PAGELOAD", jsonmaster)
        .subscribe((data: any) => {
          this.srpidata = data.Table;
          this.dataTable=data.Table;
          this.loaderService.display(false)
        }, () => {
          this.loaderService.display(false)
        })
    }
    abortdata(){
      this.srpidata.forEach(obj => {
        obj.Checked = false
      })
      this.checkbox=false;
      this.newArray=[]
    }
    setOrder(value: string) {
      if (this.order === value) {
        this.reverse = !this.reverse;
      }
      this.order = value;
    }
    checkAll(ev) {
      this.newArray = []
      this.srpidata.forEach(x => x.Checked = ev.target.checked)
      if (ev.target.checked == true) {
        for (var i = 0; i < this.srpidata.length; i++) {
          let obj = {
            inoiceno: this.srpidata[i].REQCODE
          }
          this.newArray.push(obj);
        }
      } else {
        this.newArray = []
      }
    }
    getCheckboxValues(event, data) {
      // was x.REQCODE: the entries are { inoiceno }, so index was -1 and splice(-1,1) removed the wrong request
      var index = this.newArray.findIndex(x => x.inoiceno == data);
      if (event) {
        let obj = {
          inoiceno: data
        } 
        //this.STRTXT = this.STRTXT + ","  +  data  
        this.newArray.push(obj);
      }
      else if (index >= 0) {
        this.newArray.splice(index, 1);
      }
    }

    srpinvoiceviewdata(pur_code,flag,authstatus,sts) {
      let theTop = (screen.height / 2) - (483 / 2);
      let theLeft = (screen.width / 2) - (780 / 2);
      let toolbar = 'resizable=no,scrollbars=no,width=800,height=450,status=no,left=' + theLeft + ',top=' + theTop;
        this.PURCODE=pur_code;
        if(sts=='SRPI'){
          this.staffmodel.show();
         // window.open('./#/popup/Account-SRPI-View/' + pur_code + '/' + sts +'/', "Staff Purchase View", toolbar);
        }
        
        if(sts=='RPI'){
        
         window.open('./#/popup/Account-Purchase-View/' + pur_code + '/' + sts +'/' , "Purchase View", toolbar);
      }
    }

  rejectdata() {
   
    if (this.newArray == "" || this.newArray == undefined) {
      this._toasterService.toast('info', 'info', 'Select At Least One Staff Purchase Request No!');
      return false;
    }
    var output = this.newArray.map(function (item) {
      return item.inoiceno;
    });
    var datatry = output.join(",")
    var output1 = datatry
    var answer = confirm("Are you sure you want to reject the Staff Purchase Request no. " + output1 + " ?") //, "Modified title")
    if (answer == false)
     { return false; }
     else
     {
    const adddata = {
      CMPCODE :this._loginService.getLogin()[0].CMPCODE,
      CITYCODE1:this._loginService.getLogin()[0].CITYCODE1,
      CITYCODE:this._loginService.getLogin()[0].CITYCODE,
      STATUS:this.Status,
      JVREQNO:output1,
      AUTHORISATIONDT:"",
      CMPID:this._loginService.getLogin()[0].CMPID,
      AUTHORISATIONSTATUS:"U"
    }
      this._dataService.getData("Accounts/Acc_CPJVPI_REQUEST_Authorisation_REJECT", adddata)
      .subscribe((data: any) => {
        if (data.Table2[0].STATUSMSG !="") {
          this.srpidata=data.Table;
          this.newArray=[];
          this._toasterService.toast('success', 'success', data.Table2[0].STATUSMSG);
      }
      })

  }
}
Passdatatomanagement() {
  this.authstatus="M";
  if (this.newArray == "" || this.newArray == undefined) {
    this._toasterService.toast('info', 'info', 'Select At Least One Staff Purchase Request No!');
    return false;
  }
  var output = this.newArray.map(function (item) {
    return item.inoiceno;
  });
  var datatry = output.join(",")
  var output1 = datatry
  var answer = confirm("Are you sure you want to refer this Staff request Purchase no. " + output1 + " to Management ?")
  if (answer == false)
   { return false; }
   else
   {
  const adddata = {
    CMPCODE :this._loginService.getLogin()[0].CMPCODE,
    CITYCODE1:this._loginService.getLogin()[0].CITYCODE1,
    CITYCODE:this._loginService.getLogin()[0].CITYCODE,
    STATUS:this.Status,
    JVREQNO:output1,
    AUTHORISATIONDT:"",
    CMPID:this._loginService.getLogin()[0].CMPID,
    AUTHORISATIONSTATUS:"U"
  }

  this._dataService.getData("Accounts/Acc_CPJVPI_REQUEST_Management_UPDATE", adddata)
    .subscribe((data: any) => {
      if (data.Table2[0].STATUSMSG !="") {
        this.srpidata=data.Table;
        this.newArray=[];
        this._toasterService.toast('success', 'success', data.Table2[0].STATUSMSG);
      }
    })
}
}
    VerifiedDataList(authstatusedit) {
      // this.srpidata= [];
      this.authstat=authstatusedit;
      if(authstatusedit=="M" )
      {
        this.FLAG="EDIT";
        this.authstatus="M";
      }
      else
      {
        this.FLAG="VIEW";
        this.authstatus="U";
      }
      this.hidebtnrow=authstatusedit;
      const adddata = {
        
        CMPID: this._loginService.getLogin()[0].CMPID,
        CMPCODE: this._loginService.getLogin()[0].CMPCODE,
        CITYCODE: this._loginService.getLogin()[0].CITYCODE,
        STATUS: this.Status,
        AUTHORISATIONSTATUS:authstatusedit
      }
    
      this._dataService.getData("Accounts/ACC_CPJVPI_REQUEST_AUTHORISATION", adddata)
        .subscribe((data: any) => {
          this.srpidata=data.Table;
        
        })
      }
      
  abortStaff(event) {
    this.staffmodel.hide();
    if(event=="V" || event=="M" || event=="R")
    {
      this.VerifiedDataList(event);
    }
    else
    {
    this.getdataforauth();
  }
}
Verify()
      {
        this.authstatus="U";
        if (this.newArray == "" || this.newArray == undefined) {
          this._toasterService.toast('info', 'info', 'Select At Least One Purchase Request No!');
          return false;
        }
        var output = this.newArray.map(function (item) {
          return item.inoiceno;
        });
        var datatry = output.join(",")
        var output1 = datatry
        var answer = confirm("Are you sure you want to verify this Purchase request  no. " + output1 )
        if (answer == false)
         { return false; }
         else
         {
        const adddata = {
          CMPCODE :this._loginService.getLogin()[0].CMPCODE,
          CITYCODE1:this._loginService.getLogin()[0].CITYCODE1,
          CITYCODE:this._loginService.getLogin()[0].CITYCODE,
          STATUS:this.Status,
          JVREQNO:output1,
          AUTHORISATIONDT:"",
          CMPID:this._loginService.getLogin()[0].CMPID,
          AUTHORISATIONSTATUS:"U"
        }
         this._dataService.getData("Accounts/Acc_CPJVPI_REQUEST_AUTHORISATION_UPDATEMULTI", adddata)
          .subscribe((data: any) => {
            if(data.Table2[0].STATUS.split("#")[0]  == "100") { 
              this._toasterService.toast('info', 'Complete', data.Table2[0].STATUS.split("#")[1]);
              this.getdataforauth();
              this.newArray=[];
              output1="";
              }  
         
          else if(data.Table2[0].STATUS.split("#")[0]  == "105") { 
              this._toasterService.toast('warning', 'warning', data.Table2[0].STATUS.split("#")[1]);
           }  
           this.loaderService.display(false);
      });   
      }
}

    /** rows shown by the pager: the current authorisation list */
    get Filtered(): Array<any> {
      return Array.isArray(this.srpidata) ? this.srpidata : [];
    }

    exportCsv() {
      this.downloadCsv('purchase-request-authorisation',
        ['Req code', 'Requested on', 'Requested by', 'Amount', 'Authorised by', 'Authorised on'],
        this.Filtered.map(r => [r.REQCODE, r.REQUESTEDON, r.REQUESTEDBY, r.AMOUNT, r.AUTHORISEDBY, r.AUTHORISATIONDATE]));
    }

    // ---------- pagination (10 / page) ----------
    get pageCount(): number {
        return Math.max(1, Math.ceil(this.Filtered.length / this.pageSize));
    }

    get pageRows(): Array<any> {
        // the list is replaced by several handlers; never point past its last page
        if (this.page > this.pageCount) { this.page = this.pageCount; }
        const start = (this.page - 1) * this.pageSize;
        return this.Filtered.slice(start, start + this.pageSize);
    }

    get rangeStart(): number {
        return this.Filtered.length ? (this.page - 1) * this.pageSize + 1 : 0;
    }

    get rangeEnd(): number {
        return Math.min(this.page * this.pageSize, this.Filtered.length);
    }

    /** page numbers with 0 standing in for an ellipsis */
    get pageList(): number[] {
        const n = this.pageCount, p = this.page;
        if (n <= 7) { return Array.from({ length: n }, (_, i) => i + 1); }
        const out: number[] = [1];
        const lo = Math.max(2, p - 1), hi = Math.min(n - 1, p + 1);
        if (lo > 2) { out.push(0); }
        for (let i = lo; i <= hi; i++) { out.push(i); }
        if (hi < n - 1) { out.push(0); }
        out.push(n);
        return out;
    }

    goPage(p: number) {
        if (p >= 1 && p <= this.pageCount) { this.page = p; }
    }

    /** client-side CSV of every filtered row: UTF-8 BOM, quoted */
    private downloadCsv(name: string, head: string[], rows: any[][]) {
        const q = (v: any) => {
            const s = (v === null || v === undefined) ? '' : String(v);
            return '"' + s.replace(/"/g, '""') + '"';
        };
        const csv = [head, ...rows].map(line => line.map(q).join(',')).join('\r\n');
        const d = new Date();
        const stamp = d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = name + '-' + stamp + '.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 0);
    }
}