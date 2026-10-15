import { Component, OnInit, ViewChild, EventEmitter, Output, ElementRef, ChangeDetectionStrategy } from '@angular/core';
// import { HttpClient,HttpHeaders } from '@angular/common/http';
import { HttpClient} from  '@angular/common/http';;
import { DataService } from '../../shared/service/dataService';
import { FormGroup, FormControl, Validators} from '@angular/forms';
import { LoginService } from '../../shared/service/loginService';
import {Configuration}  from '../../app.constants'
import { LoaderService } from '../../shared/service/loader.service';
import { EInvGrid } from './einvoice-grid';
@Component({
    selector: 'app-einvoice-uploadirn',
    templateUrl: './einvoice-uploadirn.component.html',
    styleUrls: ['./einvoice-page.css'], // Links: import-page.css is global (src/styles/kit)
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
  export class UploadIRN implements OnInit {
    @ViewChild('inputFile',{static:false}) myInputVariable: ElementRef;
    //form: FormGroup;
    Header:string="E-INVOICE UPLOAD JSON RESPONSE";
    rdbtype:string="INV";
    // radio (change) handler named in the template; rdbtype already carries the choice via ngModel
    lblchange(event: any) { }
    filesToUpload: Array<File>;
    selectedFileNames: string[] = [];
    FileName:string;
    selectedFile: File=null;
    fileToUpload: File | null = null;
    progress: number;
    selfilename:string="";
    uploadurl:string="";
    url:string="";
  message: string;
  selectedfile:File=null;
   myForm = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.minLength(3)]),
    file: new FormControl('', [Validators.required]),
    fileSource: new FormControl('', [Validators.required])
  });
  @Output() public onUploadFinished = new EventEmitter();
  snackbar: any;
  data_table: any = [];
  /** display-only filter / pager / CSV / on-page notice (see einvoice-grid.ts) */
  grid = new EInvGrid(() => this.data_table, ['INVNO', 'CLIENTNAME', 'IRNNO', 'ACKNO', 'SUPTYPE']);
  exportCsv() { this.grid.exportCsv('einvoice-irn-response', [['Inv no','INVNO'],['Inv date','INVDATE'],['Supply type','SUPTYPE'],['Client','CLIENTNAME'],['IRN no','IRNNO'],['Ack no','ACKNO'],['Ack dt','ACKDATE'],['JSON created by','JSON CREATED BY'],['Response updated by','RESPONSE UPDATED BY']] as Array<[string, string]>); }
    constructor(
        private _dataService: DataService,
        private http: HttpClient,
        private _loginService: LoginService,
        private _config:Configuration,
        private _loaderService: LoaderService,

      ) {
    }
        ngOnInit() {
          this.uploadurl=this._config.ServerWithApiUrl;
          this.url=this.uploadurl + "Accounts/UploadIRNFile";
        }
        onFileChange(event) {
          this.selectedFile= event.target.files[0];
          this.selfilename= this.selectedFile.name;
          if (event.target.files.length > 0) {
            const file = event.target.files[0];
            this.myForm.patchValue({
              fileSource: file
            });
          }
        }
         
        onupload(){
          if(this.selectedFile== undefined){
            alert('Please select file to upload');
            return false;
          }
          this._loaderService.display(true);
          this.grid.loading = true;
          const upname = this.selectedFile.name;
          const filedata=new FormData();
          filedata.append("file",this.selectedFile,this.selectedFile.name)
          filedata.append("transtype",this.rdbtype)
          filedata.append("cmpid",this._loginService.getLogin()[0].CMPID)
          filedata.append("vguid",this._loginService.getLogin()[0].GUID)
          filedata.append("makerip",this._loginService.getLogin()[0].MAKERIP)
          this.http.post(this.url,filedata)
         // this.http.post("http://localhost:45896/api/Accounts/UploadIRNFile",filedata)
          .subscribe((data: any) => {
            this.grid.loading = false;
            if(data.Table[0].STATUS=="100"){
              this.data_table=data.Table1;
              this._loaderService.display(false);
              this.grid.say('ok', 'IRN response uploaded · ' + upname, data.Table[0].STATUSTXT);
              alert(data.Table[0].STATUSTXT);
            }
            else {
              this.grid.say('err', 'IRN response not uploaded · ' + upname, data.Table[0].STATUSTXT);
              alert(data.Table[0].STATUSTXT);
            }
            this.selectedFile=null
            this._loaderService.display(false);
            }, (err: any) => {
              this.grid.loading = false;
              this.grid.say('err', 'Upload failed · ' + upname, EInvGrid.errText(err));
              this.selectedFile=null
              this._loaderService.display(false);
            });
            this.myInputVariable.nativeElement.value=""
        }
        Reset(){
          this.data_table=[];
          this.grid.notice = null;
              }
}
