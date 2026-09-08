import { Component, OnInit ,OnChanges,ViewChild, OnDestroy ,Input} from '@angular/core';
import { DataService } from '../../../shared/service/dataService';
import { AuthService } from '../../../shared/service/authService';
import { LoginService } from '../../../shared/service/loginService';
import { ToastCommonService } from '../../../shared/service/toastService';
import { LoaderService } from '../../../shared/service/loader.service';
import { BsModalService, BsModalRef } from 'ngx-bootstrap';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { ActivatedRoute, Router } from '@angular/router';
@Component({
    templateUrl: 'jv-auth.component.html',
    
  })
  export class journalvoucherAuth implements OnInit {
    authstatus:string="";
    authstat:string="";
    Unauthlist:any=[];  
    dataTable:any=[]; 
    STATUS:string="";
    FLAG:string="EDIT";
    hidebtnrow:string="U";
    newArray: any = [];
    order: string = 'REQCODE';
    reverse: boolean = false;
    rowcount:string; 
    constructor(
        private _router: Router,
        private _dataService: DataService,
        private _auth: AuthService,
        private _toasterService: ToastCommonService,
        private _loginService: LoginService,
        private modalService: BsModalService,
        private loaderService: LoaderService, ///,
        private _activatedRoute: ActivatedRoute
       // private orderPipe: OrderPipe, private filterPipe: FilterPipe
      ) 
      {
       
      }
    ngOnInit(): void {
        this._activatedRoute.params.subscribe(params => {
        this.STATUS = params["Status"];
          })
        this.loaderService.display(true)
        this.getdataforauth()
      }
    getdataforauth(){
         this.FLAG="EDIT";
         this.authstatus="U";
         this.hidebtnrow="U";
        // this.authstat="U"
        
        const jsonmaster = {
          CMPID: this._loginService.getLogin()[0].CMPID,
          CMPCODE: this._loginService.getLogin()[0].CMPCODE,
          CITYCODE: this._loginService.getLogin()[0].CITYCODE,
          STATUS: this.STATUS,
          AUTHORISATIONSTATUS: this.authstatus
        }
        this._dataService.getData("Accounts/ACC_CPJVPI_REQUEST_AUTHORISATION_PAGELOAD", jsonmaster)
          .subscribe((data: any) => {
            this.Unauthlist = data.Table;
            this.dataTable=data.Table;
            this.loaderService.display(false)
          })
      }
    rejectdata() {
   
        if (this.newArray == "" || this.newArray == undefined) {
          this._toasterService.toast('info', 'info', 'Select At Least One JV Request No!');
          return false;
        }
        var output = this.newArray.map(function (item) {
          return item.inoiceno;
        });
        var datatry = output.join(",")
        var output1 = datatry
        var answer = confirm("Are you sure you want to reject the JV Request no. " + output1 + " ?") //, "Modified title")
        if (answer == false)
         { return false; }
         else
         {
        const adddata = {
          CMPCODE :this._loginService.getLogin()[0].CMPCODE,
          CITYCODE1:this._loginService.getLogin()[0].CITYCODE1,
          CITYCODE:this._loginService.getLogin()[0].CITYCODE,
          STATUS:this.STATUS,
          JVREQNO:output1,
          AUTHORISATIONDT:"",
          CMPID:this._loginService.getLogin()[0].CMPID,
          AUTHORISATIONSTATUS:"U"
        }
      
        this._dataService.getData("Accounts/Acc_CPJVPI_REQUEST_Authorisation_REJECT", adddata)
          .subscribe((data: any) => {
            if (data.Table2[0].STATUSMSG !="") {
              this.Unauthlist=data.Table;
              this.newArray=[];
              this._toasterService.toast('success', 'success', data.Table2[0].STATUSMSG);
              
            }
          })
    
      }
    }
    Passdatatomanagement() {
      this.authstatus="M";
      if (this.newArray == "" || this.newArray == undefined) {
        this._toasterService.toast('info', 'info', 'Select At Least One JV Request No!');
        return false;
      }
      var output = this.newArray.map(function (item) {
        return item.inoiceno;
      });
      var datatry = output.join(",")
      var output1 = datatry
      var answer = confirm("Are you sure you want to refer this JV request  no. " + output1 + " to Management ?")
      if (answer == false)
       { return false; }
       else
       {
      const adddata = {
        CMPCODE :this._loginService.getLogin()[0].CMPCODE,
        CITYCODE1:this._loginService.getLogin()[0].CITYCODE1,
        CITYCODE:this._loginService.getLogin()[0].CITYCODE,
        STATUS:this.STATUS,
        JVREQNO:output1,
        AUTHORISATIONDT:"",
        CMPID:this._loginService.getLogin()[0].CMPID,
        AUTHORISATIONSTATUS:"U"
      }
    
      this._dataService.getData("Accounts/Acc_CPJVPI_REQUEST_Management_UPDATE", adddata)
        .subscribe((data: any) => {
          if (data.Table2[0].STATUSMSG !="") {
            this.Unauthlist=data.Table;
            
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
        STATUS: this.STATUS,
        AUTHORISATIONSTATUS:authstatusedit
      }
     
      this._dataService.getData("Accounts/ACC_CPJVPI_REQUEST_AUTHORISATION", adddata)
        .subscribe((data: any) => {
          this.Unauthlist=data.Table;
         ///this.rowcount=data.Table.rows.length;
        })
    }
    ViewJVData(JVNo)
      {
        
            let theTop = (screen.height / 2) - (483 / 2);
            let theLeft = (screen.width / 2) - (780 / 2);
            let toolbar = 'resizable=no,scrollbars=no,width=800,height=450,status=no,left=' + theLeft + ',top=' + theTop;
            window.open('./#/popup/Account-JV-View/' +  JVNo + '/', "Journal Voucher View", toolbar);
    } 
    Verify()
      {
        this.authstatus="U";
        if (this.newArray == "" || this.newArray == undefined) {
          this._toasterService.toast('info', 'info', 'Select At Least One JV Request No!');
          return false;
        }
        var output = this.newArray.map(function (item) {
          return item.inoiceno;
        });
        var datatry = output.join(",")
        var output1 = datatry
        var answer = confirm("Are you sure you want to verify this JV request  no. " + output1 )
        if (answer == false)
         { return false; }
         else
         {
        const adddata = {
          CMPCODE :this._loginService.getLogin()[0].CMPCODE,
          CITYCODE1:this._loginService.getLogin()[0].CITYCODE1,
          CITYCODE:this._loginService.getLogin()[0].CITYCODE,
          STATUS:this.STATUS,
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
checkAll(ev) {
  this.newArray = []
  this.Unauthlist.forEach(x => x.Checked = ev.target.checked)
  if (ev.target.checked == true) {
    for (var i = 0; i < this.Unauthlist.length; i++) {
      let obj = {
        inoiceno: this.Unauthlist[i].REQCODE
      }
      this.newArray.push(obj);
    }
  } else {
    this.newArray = []
  }
}
getCheckboxValues(event, data) {
  var index = this.newArray.findIndex(x => x.REQCODE == data);
  if (event) {
    let obj = {
      inoiceno: data
    } 
    
    this.newArray.push(obj);
  }
  else {
    this.newArray.splice(index, 1);
  }
}
}
