import { Component, OnInit} from '@angular/core';
import { DataService } from '../../shared/service/dataService';
import { AuthService } from '../../shared/service/authService';
import { Router ,ActivatedRoute} from '@angular/router';
import { LoginService } from '../../shared/service/loginService';
import { ToastCommonService } from '../../shared/service/toastService';
import { LoaderService } from '../../shared/service/loader.service';
import {Configuration}  from '../../app.constants'

@Component({
    selector: 'app-einvoice-generatejson',
    templateUrl: './einvoice-generatejson.component.html',
    styles: []
  })
  export class GenerateJson implements OnInit {
    EInvoiceListtbl: any = []
    ECreditNoteListtbl:any=[];
    newArray: any = [];
    rptdownloadurl:string;
    subheader:string="";
    jsontype:string="";
    NoofRows:string="";
    constructor(
        private _router: Router,
        private _dataService: DataService,
        private _auth: AuthService, 
        private _toasterService: ToastCommonService,
        private _loginService: LoginService,
        private _loaderService: LoaderService,
        private _activatedRoute: ActivatedRoute,
     //   private _http: Http, 
        private _config:Configuration ,
       // private _httpclient:HttpClient,
      ) { }
      ngOnInit() {
        this._activatedRoute.params.subscribe(params => {
         // this.jsontype = params["jsontype"]     
          this.rptdownloadurl=this._config.Server;
        
          this.subheader="List Of Pending Invoice From : " + this._dataService.datechnge1(this._loginService.getLogin()[0].FINANCIAL_YEAR.STARTDATE) 
          + " To :  " +  this._dataService.datechnge1(new Date)
            this.GetEInvoiceList();
        
        })
       
      }
      GetEInvoiceList() {
        const jsonmaster = {
          FINSTARTDT: this._dataService.datechnge(this._loginService.getLogin()[0].FINANCIAL_YEAR.STARTDATE),
          CMPCODE: this._loginService.getLogin()[0].CMPCODE,
          CITYCODE: this._loginService.getLogin()[0].CITYCODE
        }
        this._loaderService.display(true);
        this._dataService.getData("Accounts/ACC_EInvoice_List", jsonmaster)
          .subscribe((data: any) => {
            console.log(data)
            this.EInvoiceListtbl = data.Table;
            this.NoofRows=data.Table.length;
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
      GenerateEInvoice(){
        if(this.newArray.length==0){
          alert('Please select at least One Invoice No. ');
          return false;
        }
        var output = this.newArray.map(function (item) {
          return item.InvNo;
        });
        var datatry = output.join(",")
        var output1 = datatry
        if(this.newArray.length >0){
          if (confirm('Are you sure you want to Generate Json for selected Invoice No. \n ' + output1 + '?')) {
            this._loaderService.display(true);
            const adddata = {
              INVNO: output1,
              CMPCODE: this._loginService.getLogin()[0].CMPCODE,
              CITYCODE: this._loginService.getLogin()[0].CITYCODE,
              CMPID: this._loginService.getLogin()[0].CMPID,
              MAKERIP: this._loginService.getLogin()[0].MAKERIP,
              FINSTARTDT: this._loginService.getLogin()[0].FINANCIAL_YEAR.STARTDATE,
             }
            //console.log(adddata)
            this._loaderService.display(true);
            this._dataService.getData("Accounts/ACC_EINVOICEGETDATA_FORJSON", adddata)
              .subscribe((data: any) => {
                if(data.Table7[0].STATUS=="100")
                {
                  alert(data.Table7[0].STATUSMSG);
                  this.downloadFile(data.Table7[0].FILENAMET );
                  this.GetEInvoiceList();
                  this.newArray=[];
                  this._loaderService.display(false);
                  return false;
                  
                }
                else{
                  alert('No Json file to Generate !!');
                  this._loaderService.display(false);
                  return false;
                }
               
              })
            
          
          }
        }
       
        }
      
        // downloadFile(fname): Observable<any>{
        //   return this._http.get(this.rptdownloadurl + '/EInvoice/EInvoiceJson/fname', {responseType: ResponseContentType.Blob});
        // }
        download(url, downloadName) {
          let a = document.createElement("a");
          a.download = downloadName;
          a.href = url;
          document.body.appendChild(a);
          a.click();
          setTimeout(function(){
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        }, 100);
         // a.parentNode.removeChild(a);
          document.body.removeChild(a);
          return false;
        
        }
        downloadFile(fileName: string) {
          this._dataService.postAndGetResponse(fileName,'invoice').subscribe(fileData => {
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
        InvoiceView(Invoiceno) {
          if(Invoiceno.length == 14){
            Invoiceno="0"+Invoiceno;
          }
          if(Invoiceno ==''||Invoiceno==undefined || Invoiceno.length < 15){
            alert("Enter 15 digit Invoice No !")
            return false
          }
          let theTop = (screen.height / 2) - (483 / 2);
          let theLeft = (screen.width / 2) - (780 / 2);
          let toolbar = 'resizable=no,scrollbars=no,width=800,height=450,status=no,left=' + theLeft + ',top=' + theTop;
          window.open('./#/popup/Account-Invoice-View/' + Invoiceno + '/' , "Invoice View", toolbar);
      }
        // public downloadfile(downloadUrl: string): void {
        //   window.open(downloadUrl, '_blank');
        // }
        // downloadfile(fname){
        //   // const blob = new Blob([data], { type: 'application/octet-stream' });
        //   var newBlob = new Blob([x], { type: "application/json" });
        //   const data = window.URL.createObjectURL(newBlob);
        //   // this.rptdownloadurl = this.sanitizer.bypassSecurityTrustResourceUrl(window.URL.createObjectURL(blob));
        //   var link = document.createElement('a');
        //   link.href = data;
        //   link.download = fname;
        // }
        //  downloadFile(fname){
        //    return this._http.get(fname,{ obser});
        //  }
        // public downloadfile(url):void{
        //   this._dataService.downloadFileJson(url)
        //   .subscribe(Response=>{
        //      // let Filename=Response.gethea 
        //   })
        // } 
      }
 
