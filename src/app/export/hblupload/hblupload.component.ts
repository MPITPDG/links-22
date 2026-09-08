import { Component, OnInit,ViewChild,EventEmitter,Output,ElementRef} from '@angular/core';
import { HttpClient} from  '@angular/common/http';;
import { DataService } from '../../shared/service/dataService';
import { FormGroup, FormControl, Validators} from '@angular/forms';
import { LoginService } from '../../shared/service/loginService';
import {Configuration}  from '../../app.constants'
import { LoaderService } from '../../shared/service/loader.service';
import { IMyDpOptions } from 'mydatepicker';
@Component({
    selector: 'app-export-uploadhbl',
    templateUrl: './hblupload.component.html',
    styles: []
  })
  export class HBLUploadComponent implements OnInit {
     public myDatePickerOptions: IMyDpOptions = {
            dateFormat: 'dd/mm/yyyy',
            inline: false,
            height: '16px',
            width: '120px',
            componentDisabled: false,
            selectionTxtFontSize: '12px',
            editableDateField: false,
            sunHighlight: true,
            satHighlight: true,
            firstDayOfWeek: 'su',
            openSelectorTopOfInput: false,
            openSelectorOnInputClick: true,
            selectorHeight: '198px',
            selectorWidth: '200px'
        };
    @ViewChild('inputFile',{static:false}) myInputVariable: ElementRef;
    fromdate;todate;
    Header:string="HBL UPLOAD";
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
  
  data_table: any = [];
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
          const filedata=new FormData();
          filedata.append("file",this.selectedFile,this.selectedFile.name)
          filedata.append("cmpid",this._loginService.getLogin()[0].CMPID)
          filedata.append("vguid",this._loginService.getLogin()[0].GUID)
          filedata.append("makerip",this._loginService.getLogin()[0].MAKERIP)
          this.http.post(this.url,filedata)
         // this.http.post("http://localhost:45896/api/Accounts/UploadIRNFile",filedata)
          .subscribe((data: any) => {
            
            if(data.Table[0].STATUS=="100"){
              this.data_table=data.Table1;
              this._loaderService.display(false);
              alert(data.Table[0].STATUSTXT);
            }
            else {
              alert(data.Table[0].STATUSTXT);
            }
            this.selectedFile=null
            this._loaderService.display(false);
            });
            this.myInputVariable.nativeElement.value=""
        }
        Reset(){
          this.data_table=[];
              }
         
        searchdata(){
            const jsondata = {
            FROMDATE:this.fromdate.formatted,
            TODATE:this.todate.formatted,    
            CMPCODE: this._loginService.getLogin()[0].CMPCODE,
            CITYCODE: this._loginService.getLogin()[0].CITYCODE,
              }
         this._dataService.getData("Export/EXP_HBL_UPLOAD_GET_DATA", jsondata)
             .subscribe((data: any) => {
                 //console.log(data);
                 if(data.Table[0].STATUS == "100"){
                    this.data_table=data.Table1;
                   }
                })
        }
         downloadHBL(){
            this._loaderService.display(true);
            const jsondata = { 
                FROMDATE:this.fromdate.formatted,
                TODATE:this.todate.formatted,    
                CMPCODE: this._loginService.getLogin()[0].CMPCODE,
                CITYCODE: this._loginService.getLogin()[0].CITYCODE,
               };
               this._dataService.getDownload("Export/EXP_HBL_UPLOAD", jsondata, { responseType: 'arraybuffer' })
                   .subscribe((data: any) => {
                       this._dataService.common_downloadFileByUrl(data, "Hblupload"  + ".xls");
                       this._loaderService.display(false);
       
                   });
        }
}