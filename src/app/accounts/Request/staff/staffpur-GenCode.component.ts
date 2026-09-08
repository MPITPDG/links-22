import { Component, OnInit ,OnChanges,ViewChild, OnDestroy ,Input} from '@angular/core';
import { DataService } from '../../../shared/service/dataService';
import { AuthService } from '../../../shared/service/authService';
import { LoginService } from '../../../shared/service/loginService';
import { ToastCommonService } from '../../../shared/service/toastService';
import { LoaderService } from '../../../shared/service/loader.service';
import { ActivatedRoute,Router } from '@angular/router';

@Component({
    templateUrl: 'staffpur-GenCode.component.html',
    })
  export class ReqSRPGenerateComponent implements OnInit {
    datatable:any=[];  
    Status:string="";
    strheader:string="";
    PAGETYPE:string="";
    constructor(
        private _router: Router,
        private _dataService: DataService,
        private _auth: AuthService,
        private _toasterService: ToastCommonService,
        private _loginService: LoginService,
        private loaderService: LoaderService ,
        private _route: ActivatedRoute,
       
      ) 
      {}
      ngOnInit(): void {
        this.loaderService.display(true)

        this._route.params.subscribe(params => {
            this.Status= params["Status"];
            if(this.Status=="SRPI")
            {
            this.strheader="GENERATE PURCHASE INVOICE FOR STAFF PURCHASE REQUEST "
          }
          else   if(this.Status=="RPI")
          {
          this.strheader="GENERATE PURCHASE INVOICE FOR PURCHASE REQUEST  "
        }
          else   if(this.Status=="JVREQ")
          {
          this.strheader="GENERATE JOURNAL VOUCHER "
        }
             });
        this.getdataforgenerate()
        this.loaderService.display(false)
      }
      getdataforgenerate()
      {
            const jsonmaster = {
            CMPID: this._loginService.getLogin()[0].CMPID,
            CMPCODE: this._loginService.getLogin()[0].CMPCODE,
            CITYCODE: this._loginService.getLogin()[0].CITYCODE,
            CITYCODE1: this._loginService.getLogin()[0].CITYCODE1,
            STATUS: this.Status,
            AUTHORISATIONSTATUS: "V"
          }
          this._dataService.getData("Accounts/ACC_REQUEST_FILL_TO_GENERATE_PAGELOAD", jsonmaster)
            .subscribe((data: any) => {
              this.datatable=data.Table;
              this.loaderService.display(false)
            })
      }
      ViewData(No,status)
      {
            let theTop = (screen.height / 2) - (483 / 2);
            let theLeft = (screen.width / 2) - (780 / 2);
            let toolbar = 'resizable=no,scrollbars=no,width=800,height=450,status=no,left=' + theLeft + ',top=' + theTop;
            if(status=="JVREQ") {
            window.open('./#/popup/Account-JV-View/' +  No + '/', "Journal Voucher View", toolbar);
        } 
        else  if(status=="SRPI") {
            window.open('./#/popup/Account-SRPI-View/' +  No + '/' +  'VIEW' + '/' +  'V' + '/', "Staff Purchase Request View", toolbar);
        } 
        else  if(status=="RPI") {
          window.open('./#/popup/Account-Purchase-View/' + No + '/' + 'RPI' +'/', "Purchase Request View", toolbar);
      } 
      } 
      GenerateCodeJVCPSRPI(REQJVCODE, STATUS, AUTHORISATIONSTATUS, ISGEN_RIGHTS)
      {
        if(STATUS=='JVREQ')
        {
          var msgs = ""
          if (ISGEN_RIGHTS != '1') {
            msgs = msgs + 'You have only rights to generate JV for the period ' + ISGEN_RIGHTS + '.! \n'
           }
           if (msgs.length != 0) {
            msgs = '' + msgs
            alert(msgs);
            return false;
        }

        else
        {
              var answer = confirm("Are you sure you want to generate JV ?")
            }
         } 
         else if(STATUS=='RCP')
         {
          var answer = confirm("Are you sure you want to generate CP ?")
        }
        else if (STATUS == 'RPI') {
          var answer = confirm("Are you sure you want to generate Purchase ?")
      }
       else if (STATUS == 'SRPI') {
          var answer = confirm("Are you sure you want to generate Staff Purchase ?")
      }
  if (answer == false)
   { return false; }
   const adddata = {
    CMPID:this._loginService.getLogin()[0].CMPID,
    CMPCODE :this._loginService.getLogin()[0].CMPCODE,
    CITYCODE1:this._loginService.getLogin()[0].CITYCODE1,
    CITYCODE:this._loginService.getLogin()[0].CITYCODE,
    MAKERIP:this._loginService.getLogin()[0].MAKERIP,
    REQCODE:REQJVCODE,
    STATUS:STATUS,
    AUTHORISATIONSTATUS:"V",
    FormId:"194",
   }

  this._dataService.getData("Accounts/ACC_GENERATE_FINAL_CODE_CPJVPI", adddata)
    .subscribe((data: any) => {
      if (data.Table2[0].GETSTATUS.split("#")[0] == "100"){
        this.getdataforgenerate();
        this.PAGETYPE=data.Table2[0].GETSTATUS.split("#")[1];
        this._toasterService.toast('success', 'success', data.Table2[0].GETSTATUS.split("#")[2]);
        this.Print(data.Table2[0].ENTRYNO,this.PAGETYPE);
      }
    })
      }
      Print(no,pgtype) {
        let theTop = (screen.height / 2) - (483 / 2);
        let theLeft = (screen.width / 2) - (780 / 2);
        let toolbar = 'resizable=no,scrollbars=no,width=800,height=450,status=no,left=' + theLeft + ',top=' + theTop;
       
        if (pgtype == 'GENJV') {
           window.open('./#/popup/Account-JV-Print/' +  no + '/' +  "JV" + '/', "Journal Voucher Print", toolbar);
          }
        else if (pgtype == 'GENCP') {
          window.open('./#/popup/Account-CashBook-BankReceipt-print/' + pgtype + '/' + no + '/' , "CashBook BankReceipt Print", toolbar);
        }
         else if (pgtype == 'GENPI') {
          // window.open('./#/popup/Account-Purchase-print/' + no + '/' , "Purchase Print", toolbar);
          window.open('./#/popup/Account-Purchase-print/' + no + '/' + 'GENPI' + '/', "Request Purchase Print", toolbar);
        }
         else if (pgtype == 'SRPI') {
          window.open('./#/popup/Account-Purchase-print/' + no + '/' + 'PI' + '/', "Staff Purchase Print", toolbar);
        }    
        }

        Validate_Generate(ISGEN_RIGHTS) {
          var msgs = ""
                      
          if (ISGEN_RIGHTS != '1') {
              msgs = msgs + 'You have only rights to generate JV for the period ' + ISGEN_RIGHTS + '.! \n'
             }
          if (msgs.length != 0) {
              msgs = '' + msgs
              alert(msgs);
           
        }
      }

    }
    