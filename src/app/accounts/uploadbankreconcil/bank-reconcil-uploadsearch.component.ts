import { Component, OnInit,ViewChild,EventEmitter,Output,ElementRef} from '@angular/core';
import { HttpClient} from  '@angular/common/http';;
import { DataService } from '../../shared/service/dataService';
import { FormGroup, FormControl, Validators} from '@angular/forms';
import { LoginService } from '../../shared/service/loginService';
import {Configuration}  from '../../app.constants'
import { LoaderService } from '../../shared/service/loader.service';
import { IMyDpOptions } from 'mydatepicker';
import { ExportexcelService } from '../../shared/service/exportexcel.service';
@Component({
    selector: 'app-bankreconcil-uploadsearch',
    templateUrl: './bank-reconcil-uploadsearch.component.html',
    styles: [`
    // .form-control {
    //    padding:0px !important;
    //    margin:0px !important;
    //    //height:20px !important;
    // }
    a:hover,a:focus{
        text-decoration: none;
        outline: none;
    }
    .tab .nav-tabs {
        border-bottom:0 none;
    }
    .tab .nav-tabs li{
        margin-right: 10px;
    }
    .tab .nav-tabs li a{
        position: relative;
        padding: 4px;
        color: #fff;
        font-size: 11px;
        z-index: 1;
        font-family:verdana;
        font-weight:bold
    }
    .tab .nav-tabs li a:hover{
        background:transparent;
        border:1px solid transparent;
        color: #444;
    }
     .tab .nav-tabs li a:before{
        content: "";
        width:100%;
        height:100%;
        position:absolute;
        bottom: 5px;
        left:-1px;
        font-size:11px;

        background-color: #26a6d4;
        border: 1px solid #d3d3d3;
        border-bottom: 0px none;
        border-radius: 10px 10px 0 0;
        transform-origin: left center 0;
        transform: perspective(3px) rotateX(5deg);
        z-index:-1;
    }
    .tab .nav-tabs li a.active:before{
        background: #fff;
    }
    .tab .nav-tabs li a.active,
    .tab .nav-tabs li a.active:focus,
    .tab .nav-tabs li a.active:hover{
        border:1px solid transparent;
        background:transparent;
        color: #212529;
        z-index: 2;
    }
    // .tab-content .tab-pane {
    //     padding-bottom: 0rem !important;
    // }
    #autoresizing {
        display: block;
        overflow: hidden;
        resize: none;
    }


    `]
  })
  export class UploadBankReconcilSearch implements OnInit {

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
    FromDate;
    ToDate;
    BankList:any = [];
    ourbank:string;
    reconcildataList = [];
    unreconcildataList = [];
    Header:string="Upload Statement Search"
    reconcildataForExcel = [];
    unreconcildataForExcel = [];
    AdvanceTable = [];
    reconcilexceldata_list= [];
    unreconcilexceldata_list= [];
    Compname:string;
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
        private exportser: ExportexcelService,
      ) {
    }
        ngOnInit() {

          this.FillAccount();
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
          search(){
            if(this.ourbank== undefined || this.ourbank== ""){
                alert('Please select our bank');
                return false;
              }
              if(this.FromDate== undefined || this.FromDate== ""){
                alert('Please select from date');
                return false;
              }
              if(this.ToDate== undefined || this.ToDate== ""){
                alert('Please select to date');
                return false;
              }
            const jsonData = {
                OURBANK:this.ourbank,
                FROMDATE:this.FromDate,
                TODATE:this.ToDate
             }
             this._dataService.getData("Accounts/ACC_BANKRECONCILLATION_UPLOAD_GETDATA", jsonData)
             .subscribe((data: any) => {
               if(data.Table1.length==0){
                   alert('No Data found');
                return false;
               }
               else{
                   this.displayType="LIST";
                   this.reconcildataList=data.Table1;
                   this.unreconcildataList=data.Table2;
                   this.reconcilrecord=this.reconcildataList.length;
                   this.unreconcilrecord=this.unreconcildataList.length;
                  //  this.reconcilexceldata_list=data.Table1;
                  //  this.unreconcilexceldata_list=data.Table2;
               }
            });
        }
        reset(){
            this.ourbank=undefined;
            this.FromDate="";
            this.ToDate="";
        }
        Exporttoxl(){
          this._loaderService.display(true);
          const jsonaccount = { OURBANK:this.ourbank,FROMDATE:this.FromDate,TODATE:this.ToDate };
          this._dataService.getDownload("Accounts/acc_bankreconcillation_exporttoxl", jsonaccount, { responseType: 'arraybuffer' })
              .subscribe((data: any) => {
                  this._dataService.common_downloadFileByUrl(data, "bankreconcillationlist" +  this.FromDate + "-" + this.ToDate + ".xls");
                  this._loaderService.display(false);

              });
            }
            // this.reconcilexceldata_list.forEach((row: any) => {
            //     this.reconcildataForExcel.push(Object.values(row))
            //   });
            //   this.unreconcilexceldata_list.forEach((row: any) => {
            //     this.unreconcildataForExcel.push(Object.values(row))
            //   });
            // let reportData = {
            //     data: this.reconcildataForExcel,
            //     advdata:this.unreconcildataForExcel,
            //     headers: ["Bank Ref No","Deposit","Withdrawal","Clearance Dt","	Bank Ref No","Entry No","Entry Date","Entry Type","Amount","Deduction","Clearance Dt"],
            //     advheaders: ["Bank Ref No","Deposit","Withdrawal","Clearance Dt","	Bank Ref No","Entry No","Entry Date","Entry Type","Amount","Deduction","Clearance Dt"],
            //     pagetype: "Reconcilation",
            //     title:this.Compname,
            //     subtitle:"Bank Reconcillation Statement From " + this.FromDate + " To "  + this.ToDate,

            //            }
            //   this.exportser.exportExceltry(reportData, "Bankreconcil_" + this.FromDate + " To "  + this.ToDate);
            //   this.reconcildataForExcel=[];
            //   this.unreconcildataForExcel=[];
            // }
        }
