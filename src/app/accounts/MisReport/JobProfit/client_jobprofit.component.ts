import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { LoginService } from '../../../shared/service/loginService';
import { ToastCommonService } from '../../../shared/service/toastService';
import { IMyDpOptions } from 'mydatepicker';
import { LoaderService } from '../../../shared/service/loader.service';
import { HttpClient } from '@angular/common/http';
import { DataService } from 'src/app/shared/service/dataService';
import { JobprofitserviceService } from 'src/app/shared/service/jobprofitservice.service';

@Component({
    selector: 'app-clientjobprofit',
    templateUrl: './client_jobprofit.component.html',
    styles: []
})
export class ClientJobprofitComponent implements OnInit {

       public myDatePickerOptions: IMyDpOptions = {
      dateFormat: 'dd/mm/yyyy',
      inline: false,
      height: '18px',
      width: '130px',
      componentDisabled: false,
      selectionTxtFontSize: '12px',
      editableDateField: false,
      sunHighlight: true,
      satHighlight: true,
      firstDayOfWeek: 'su',
      openSelectorTopOfInput: false,
      openSelectorOnInputClick: true,
      selectorHeight: '180px',
      selectorWidth: '200px',

    };
  
    public myDatePickerOptionsInv: IMyDpOptions = {
      dateFormat: 'dd/mm/yyyy',
      inline: false,
      height: '20px',
      width: '130px',
      componentDisabled: false,
      selectionTxtFontSize: '12px',
      editableDateField: false,
      sunHighlight: true,
      satHighlight: true,
      firstDayOfWeek: 'su',
      openSelectorTopOfInput: false,
      openSelectorOnInputClick: true,
      selectorHeight: '180px',
      selectorWidth: '200px' , 
      disableUntil: {year: 0, month: 0, day: 0},
      disableSince: {year: 0, month: 0, day: 0}
  };
    
    PageName: string = "Client Job Profit "

    ClientList: any = []
    Client: string;
    FinalClient: string = ""
    AllClientList: any = []
    allclient:string="A";
    dtlable: string = "Doc Recd Dt"
    branch: any;
    paydate: any;
    FromDate;
    ToDate;
    report_table1: any = [];
    report_table2: any = [];
    dataFortable1: any = [];
    dataFortable2: any = [];
    searchtype: string = "JOBWISE"
    searchclient: string = "CLIENT"
    mode_subtype: string = "";
    modetype: string = "SEA_exp";
    modetypeFinal: string = "";
    tojobno: string = "";
    fromjobno: string = "";
    to_datewise: any = "";
    from_datewise: any = "";
    single_jobno: string = "";
    detaildata_of: any;
    cityname: string = "";
    mode:string="";
    fromval:string="";
    toval:string="";
    constructor(
      
        private _dataService: DataService,
        private _toasterService: ToastCommonService,
        private loaderService: LoaderService,
        private _router: Router,
        private http: HttpClient, private exportser: JobprofitserviceService,
        private _activatedRoute: ActivatedRoute,
        private _loginService: LoginService,
     
    ) {this.initializeLetters();}
    private initializeLetters() {
        for (let i = 65; i <= 90; i++) {
            this.AllClientList.push(String.fromCharCode(i));
        }
    }
    ngOnInit() {
        this.FillAccount();
        this.ToDate = new Date();
        this.ToDate =  this._dataService.datechnge(this.ToDate)
        this.FromDate='01/04/2006'
       // this.AllClientList=['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P']
    }
   FromDateChanged(ev){
        this.FromDate=ev.formatted
      
    }
    ToDateChanged(ev){
      this.ToDate=ev.formatted
      
  }
    FillAccount() {
        const jsonItem = {
            cmpcode: this._loginService.getLogin()[0].CMPCODE,
            citycode: this._loginService.getLogin()[0].CITYCODE,
            citycode1: this._loginService.getLogin()[0].CITYCODE1,
        }
        this._dataService.getData("Accounts/Acc_Fill_Export", jsonItem)
            .subscribe((data: any) => {
                this.ClientList = data.Table
               // console.log(this.ClientList);
            })
    }
    updateDtlable() {
        if (this.modetype === 'SEA_exp' || this.modetype === 'AIR_exp') {
          this.dtlable = 'Doc Recd Dt';
        } else {
          this.dtlable = 'Invoice Date';
        }
      
        
      }

    calculate(){
        if(this.searchclient=="CLIENT"){
            if(this.Client=="" || this.Client==undefined){
              alert('Please select Client');
              return false;      
            }
        }
        if(this.searchtype=="DATEWISE"){
            if(this.FromDate=="" || this.FromDate==undefined){
                alert('Please enter from date');
                return false;        
            }
          else  if(this.ToDate=="" || this.ToDate==undefined){
                alert('Please enter to date');
                return false;        
            }
        }
        if(this.searchtype=="JOBWISE"){
            if(this.fromjobno=="" || this.fromjobno==undefined){
                alert('Please enter From Job no.');
                return false;        
            }
          else  if(this.tojobno=="" || this.tojobno==undefined){
                alert('Please enter To Job no');
                return false;        
            }
        }
        if (this.searchclient == "CLIENT") {
            this.FinalClient=this.Client;
        }
        if(this.searchclient=="ALLCLIENT"){
            this.FinalClient=this.allclient;
        }
        if (this.searchtype == "DATEWISE") {
            if(this.modetype === 'SEA_exp'){
                this.mode="SEAEXPORT"
            }
            else if(this.modetype === 'AIR_exp'){
                this.mode="AIREXPORT"
            }
            else if(this.modetype === 'SEA_imp'){
                this.mode="SEAIMPORT"
            }
            else if(this.modetype === 'AIR_imp'){
                this.mode="AIRIMPORT"
            }
            else{this.mode == "ALL"}
            this.searchtype="DATEWISE"
            this.fromval=this.FromDate;
            this.toval=this.ToDate;
          }
          else {
            this.mode=""
            this.searchtype="";
            this.fromval=""
            this.toval=""
          }
          if(this.searchtype=="JOBWISE"){
            this.fromval=this.fromjobno;
            this.toval=this.tojobno;
          }
        const jsonview = {
            Client:this.FinalClient,
            SearchType:this.searchtype,
            Frmdt:this.FromDate,
            Todt:this.ToDate,
            Mode:this.mode,
            JobNoFrom:this.fromjobno,
            JobNoTo:this.tojobno,
            FromVal:this.fromval,
            ToVal:this.toval,
            CMP_CODE:this._loginService.getLogin()[0].CMPCODE,
            CITYCODE1:this._loginService.getLogin()[0].CITYCODE1,
            CMPID   :this._loginService.getLogin()[0].CMPID ,
            rpttype:"CLIENT"
         
            }
            console.log(jsonview)
            this._dataService.getData("Accounts/MIS_REPORT_CLIENTJOBPROFIT", jsonview)
           .subscribe((data: any) => {
            let pklogid=  data.Table1[0].PKID;   
            this._router.navigate(['/accounts/report/ReportDownload/'+pklogid]);
             });
            this.loaderService.display(false);
    }
   

    Reset() {
        this.single_jobno = ""
        this.tojobno = ""
        this.fromjobno = ""
        this.FromDate = ""
        this.ToDate = ""
        this.modetype = ""
        this.mode_subtype = ""
        //this.accountcode = ""
        this.branch = ""
        this.paydate = ""
        this.searchtype = "CLIENT"
    }
}
