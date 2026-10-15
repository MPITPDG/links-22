import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { DataService } from '../../shared/service/dataService';
import { AuthService } from '../../shared/service/authService';
import { Router } from '@angular/router';
import { LoginService } from '../../shared/service/loginService';
import { ToastCommonService } from '../../shared/service/toastService';
import { LoaderService } from '../../shared/service/loader.service';
import {Configuration}  from '../../app.constants'
import { EInvGrid } from './einvoice-grid';

@Component({
    selector: 'app-ecreditnote-generatejson',
    templateUrl: './ecreditnote-generatejson.component.html',
    styleUrls: ['./einvoice-page.css'], // Links: import-page.css is global (src/styles/kit)
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
  export class EcreditNoteGenerateJson implements OnInit {
    checkbox: boolean = false;   // header box, bound in the template
    EcreditnoteListtbl: any = []
    newArray: any = [];
    rptdownloadurl:string;
    subheader:string="";
    NoofRows:string=""
    /** display-only filter / pager / CSV / on-page notice (see einvoice-grid.ts) */
    grid = new EInvGrid(() => this.EcreditnoteListtbl, ['INV_NO', 'CLIENT', 'EXP_GSTNO', 'SUPTYPE']);
    exportCsv() { this.grid.exportCsv('ecreditnote-pending', [['Doc no','INV_NO'],['Doc date','INV_DATE'],['Client','CLIENT'],['Client GST no.','EXP_GSTNO'],['Supply type','SUPTYPE'],['Total amount','TOTALAMT'],['Taxable amt','TAXABLEAMT'],['Non taxable amt','NONTAXABLEAMT'],['IGST','IGST'],['CGST','CGST'],['SGST','SGST']] as Array<[string, string]>); }
    constructor(
        private _router: Router,
        private _dataService: DataService,
        private _auth: AuthService,
        private _toasterService: ToastCommonService,
        private _loginService: LoginService,
        private _loaderService: LoaderService,
     //   private _http: Http,
        private _config:Configuration ,
       // private _httpclient:HttpClient,
      ) { }
      ngOnInit() {
        this.rptdownloadurl=this._config.Server;
        this.subheader="List Of Pending Credit Note From : " + this._dataService.datechnge1(this._loginService.getLogin()[0].FINANCIAL_YEAR.STARTDATE)
        + " To :  " +  this._dataService.datechnge1(new Date)
          this.GetECreditNoteList();
      }
      GetECreditNoteList() {
        const jsonmaster = {
          FINSTARTDT: this._dataService.datechnge(this._loginService.getLogin()[0].FINANCIAL_YEAR.STARTDATE),
          CMPCODE: this._loginService.getLogin()[0].CMPCODE,
          CITYCODE: this._loginService.getLogin()[0].CITYCODE
        }
        this._loaderService.display(true);
        this.grid.loading = true;
        this.grid.loadError = '';
        this._dataService.getData("Accounts/ACC_ECreditNote_List", jsonmaster)
          .subscribe((data: any) => {
            console.log(data)
            this.EcreditnoteListtbl = data.Table
            this.NoofRows=data.Table.length;
            this.grid.loading = false;
            this._loaderService.display(false);
          }, (err: any) => {
            this.grid.loading = false;
            this.grid.loadError = EInvGrid.errText(err);
            this._loaderService.display(false);
          })
      }
      getCheckboxValues(event, data) {
        var index = this.newArray.findIndex(x => x.InvNo == data);
        if (event) {
          let obj = {
            InvNo: data
          }
          this.newArray.push(obj);
        }
        else {
          this.newArray.splice(index, 1);
        }
      }
      /*  Header "select all" box: ticks or unticks every row and rebuilds the selection in one
          go, so a document can never be listed twice. The template always called this.      */
      checkAll(event: any) {
        const on = !!(event && event.target && event.target.checked);
        this.newArray = [];
        for (let i = 0; i < this.EcreditnoteListtbl.length; i++) {
          this.EcreditnoteListtbl[i].Checked = on;
          if (on) { this.newArray.push({ InvNo: this.EcreditnoteListtbl[i].INV_NO }); }
        }
      }
      GenerateECreditNote(){
        if(this.newArray.length==0){
          alert('Please select at least One CreditNote No. ');
          return false;
        }
        var output = this.newArray.map(function (item) {
          return item.InvNo;
        });
        var datatry = output.join(",")
        var output1 = datatry
        if(this.newArray.length >0){
          if (confirm('Are you sure you want to Generate Json for selected Credit Note No. \n ' + output1 + '?')) {
            this._loaderService.display(true);
            const adddata = {
              CRTNO: output1,
              CMPCODE: this._loginService.getLogin()[0].CMPCODE,
              CITYCODE: this._loginService.getLogin()[0].CITYCODE,
              CMPID: this._loginService.getLogin()[0].CMPID,
              MAKERIP: this._loginService.getLogin()[0].MAKERIP,
              FINSTARTDT: this._loginService.getLogin()[0].FINANCIAL_YEAR.STARTDATE,
             }
            //console.log(adddata)
            this._loaderService.display(true);
            this._dataService.getData("Accounts/ACC_ECREDITNOTEGETDATA_FORJSON", adddata)
              .subscribe((data: any) => {
                if(data.Table7[0].STATUS=="100")
                {
                  this.grid.say('ok', 'JSON generated · ' + (data.Table7[0].FILENAMET || ''), data.Table7[0].STATUSMSG + '\nCredit notes: ' + output1);
                  alert(data.Table7[0].STATUSMSG);
                  this.downloadFile(data.Table7[0].FILENAMET );
                  this.GetECreditNoteList();
                  this.newArray=[];
                  this._loaderService.display(false);
                  return false;

                }
                else{
                  this.grid.say('err', 'No JSON generated', (data.Table7[0].STATUSMSG || 'No Json file to Generate !!') + '\nCredit notes: ' + output1);
                  alert('No Json file to Generate !!');
                  this._loaderService.display(false);
                  return false;
                }

              }, (err: any) => {
                this.grid.say('err', 'Generate JSON failed', EInvGrid.errText(err));
                this._loaderService.display(false);
              })


          }
        }



        }

        downloadFile(fileName: string) {
          this._dataService.postAndGetResponse(fileName,'creditnote').subscribe(fileData => {
            const blob: any = new Blob([fileData], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            let link = document.createElement("a");
              if (link.download !== undefined) {
              let url = URL.createObjectURL(blob);
              link.setAttribute("href", url);
              link.setAttribute("download", fileName);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }
          }
          );
        }
        CreditNoteView(creditno) {
          if(creditno ==''||creditno==undefined || creditno.length < 15){
            alert("Enter 15 digit CreditNote No !")
            return false
          }
          let theTop = (screen.height / 2) - (483 / 2);
          let theLeft = (screen.width / 2) - (780 / 2);
          let toolbar = 'resizable=no,scrollbars=no,width=800,height=450,status=no,left=' + theLeft + ',top=' + theTop;
          window.open('./#/popup/Account-CreditNote-View/' + creditno + '/' , "CreditNote View", toolbar);
      }

      }

