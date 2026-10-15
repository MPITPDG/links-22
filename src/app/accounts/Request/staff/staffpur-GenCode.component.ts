import { Component, OnInit, OnChanges, ViewChild, OnDestroy, Input, ChangeDetectionStrategy } from '@angular/core';
import { DataService } from '../../../shared/service/dataService';
import { AuthService } from '../../../shared/service/authService';
import { LoginService } from '../../../shared/service/loginService';
import { ToastCommonService } from '../../../shared/service/toastService';
import { LoaderService } from '../../../shared/service/loader.service';
import { ActivatedRoute,Router } from '@angular/router';

@Component({
    templateUrl: 'staffpur-GenCode.component.html',
    styleUrls: ['../../purchase/purchase-page.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
  export class ReqSRPGenerateComponent implements OnInit {
    datatable:any=[];  
    Status:string="";
    strheader:string="";
    PAGETYPE:string="";
    // ---------- page state (additive: loading / error, pager, export) ----------
    readonly pageSize = 10;
    page: number = 1;
    loading: boolean = false;
    loadError: boolean = false;
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
            this.strheader="Generate purchase invoice for staff purchase requests"
          }
          else   if(this.Status=="RPI")
          {
          this.strheader="Generate purchase invoice for purchase requests"
        }
          else   if(this.Status=="JVREQ")
          {
          this.strheader="Generate journal vouchers"
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
          this.loading = true;
          this.loadError = false;
          this._dataService.getData("Accounts/ACC_REQUEST_FILL_TO_GENERATE_PAGELOAD", jsonmaster)
            .subscribe((data: any) => {
              this.datatable=data.Table;
              this.loading = false;
              this.loaderService.display(false)
            }, () => {
              this.loading = false;
              this.loadError = true;
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

    
    /** rows shown by the pager: the verified requests waiting to be generated */
    get Filtered(): Array<any> {
      return Array.isArray(this.datatable) ? this.datatable : [];
    }

    exportCsv() {
      const jv = this.Status == 'JVREQ';
      const head = ['Status', 'Req code', 'Requested by', 'Requested on']
        .concat(jv ? ['Debit', 'Credit'] : ['Amount'], ['Authorised by', 'Authorised on']);
      this.downloadCsv('generate-' + (this.Status || 'requests').toLowerCase(), head,
        this.Filtered.map(r => [r.AUTHORISESTATUS, r.REQCODE, r.REQUESTEDBY, r.REQUESTEDON]
          .concat(jv ? [r.DEBIT, r.CREDIT] : [r.AMOUNT], [r.AUTHORISEDBY, r.AUTHORISATIONDATE])));
    }

    // ---------- pagination (10 / page) ----------
    get pageCount(): number {
        return Math.max(1, Math.ceil(this.Filtered.length / this.pageSize));
    }

    get pageRows(): Array<any> {
        // the list reloads after each generate; never point past its last page
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
    