import { Component, OnInit,ViewChild,EventEmitter,Output,ElementRef} from '@angular/core';
import { HttpClient} from  '@angular/common/http';;
import { DataService } from '../../shared/service/dataService';
import { FormGroup, FormControl, Validators} from '@angular/forms';
import { LoginService } from '../../shared/service/loginService';
import {Configuration}  from '../../app.constants'
import { LoaderService } from '../../shared/service/loader.service';
import { Router, ActivatedRoute } from '@angular/router';
import { IMyDpOptions } from 'mydatepicker';
@Component({
    selector: 'app-bankreconcil-uploadstatement',
    templateUrl: './bank-reconcil-uploadstatement.component.html',
    styles: []
  })
  export class UploadBankReconcil implements OnInit {

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
     selectorHeight: '180px',
     selectorWidth: '200px'

   };
    @ViewChild('inputFile',{static:false}) myInputVariable: ElementRef;
    //form: FormGroup;
    displayType: string = 'SEARCH';
    Header:string="UPLOAD BANK RECONCILLATION STATEMENT";
    filesToUpload: Array<File>;
    selectedFileNames: string[] = [];
    FileName:string;
    selectedFile: File=null;
    fileToUpload: File | null = null;
    selfilename:string="";
    uploadurl:string="";
    url:string="";
    selectedfile:File=null;
    FromDate;
    ToDate;
    BankList:any = [];
    ourbank:string;
    reconcildataList = [];
    unreconcildataList = [];
    reconcilrecord:any;
    unreconcilrecord:any;
   myForm = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.minLength(3)]),
    file: new FormControl('', [Validators.required]),
    fileSource: new FormControl('', [Validators.required])
  });
  @Output() public onUploadFinished = new EventEmitter();
  snackbar: any;
    constructor(
        private _dataService: DataService,
        private http: HttpClient,
        private _loginService: LoginService,
        private _config:Configuration,
        private _loaderService: LoaderService,
        private _router: Router,
      ) {
    }
        ngOnInit() {
          this.uploadurl=this._config.ServerWithApiUrl;
          this.url=this.uploadurl + "Accounts/UploadBnkReconcilFile";
          this.FillAccount();
          console.log(this._dataService.datechnge(this._loginService.getLogin()[0].FINANCIAL_YEAR.STARTDATE))
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
        FillAccount(){
          const jsonBank= {
          cmpcode: this._loginService.getLogin()[0].CMPCODE,
          citycode: this._loginService.getLogin()[0].CITYCODE,
          citycode1: this._loginService.getLogin()[0].CITYCODE1
          }
          this._dataService.getData("Accounts/Acc_CashBook_FillOurbank", jsonBank)
          .subscribe((data: any) => {
          this.BankList = data.Table
          this._loaderService.display(false)
          })
          }
          FromDateChanged(ev){
            this.FromDate=ev.formatted
            }
          ToDateChanged(ev){
            this.ToDate=ev.formatted
            }
        upload(){
          if(this.ourbank== "" || this.ourbank ==""){
            alert('Please Select our bank');
            return false;
          }
          // if(this.FromDate== "" || this.FromDate ==""){
          //   alert('Please select From Date');
          //   return false;
          // }
          if(this.ToDate== "" || this.ToDate ==""){
            alert('Please select As On Date');
            return false;
          }
          if(this.selectedFile== undefined){
            alert('Please select file to upload');
            return false;
          }
        
          const filedata=new FormData();
          filedata.append("file",this.selectedFile,this.selectedFile.name)
          filedata.append("cmpid",this._loginService.getLogin()[0].CMPID)
          filedata.append("vguid",this._loginService.getLogin()[0].GUID)
          filedata.append("makerip",this._loginService.getLogin()[0].MAKERIP)
          filedata.append("cmpcode",this._loginService.getLogin()[0].CMPCODE)
          filedata.append("citycode",this._loginService.getLogin()[0].CITYCODE)
          filedata.append("citycode1",this._loginService.getLogin()[0].CITYCODE1)
          filedata.append("ourbank",this.ourbank)
          filedata.append("fromdt",this._dataService.datechnge(this._loginService.getLogin()[0].FINANCIAL_YEAR.STARTDATE))
          filedata.append("todt",this.ToDate)
         // filedata.append("todt",this.ToDate)
         // this.http.post(this.url,filedata)
         this._loaderService.display(true);
         this.http.post(this.url,filedata)
         //this.http.post("http://localhost:58899/api/Accounts/UploadBnkReconcilFile",filedata)
          .subscribe((data: any) => {
            if(data.Table1[0].STATUS=="104"){
              this._loaderService.display(false);
              alert(data.Table1[0].MSG);
            }
            else if(data.Table2[0].STATUS=="100"){
              this.displayType="LIST";
              this.reconcildataList=data.Table
              if(data.Table[0].STATUS =="105")
                {
                
                  this.reconcilrecord=0; 
                
                }
                else{
                 
                  this.reconcilrecord=this.reconcildataList.length;
                }
              this.unreconcildataList=data.Table1
              this.reconcilrecord=this.reconcildataList.length;
              this.unreconcilrecord=this.unreconcildataList.length;
              this._loaderService.display(false);
              alert(data.Table2[0].MSG);
            }
            else {
              alert(data.Table2[0].MSG);
            }
            this.selectedFile=null
            this._loaderService.display(false);
            });
            this.myInputVariable.nativeElement.value=""
            //this._loaderService.display(false);
        }
        back(){
          this.reconcildataList=[];
          this.unreconcildataList=[];
          this._router.navigate(['/accounts/uploadbankreconcil/uploadStatementsearch']);
        }

}