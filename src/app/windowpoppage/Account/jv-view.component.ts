import { Component, OnInit,EventEmitter,Output,Input ,OnChanges,ViewChild} from '@angular/core';
import { DataService } from '../../shared/service/dataService';
import { LoaderService } from '../../shared/service/loader.service';
import { ActivatedRoute } from '@angular/router';
import { LoginService } from '../../shared/service/loginService';
import { ToastCommonService } from '../../shared/service/toastService';


@Component({
    selector: 'app-JV-view',
    templateUrl: './jv-view.component.html',
    styles: []
  })
  export class JVViewComponent implements OnInit  {
    AccountNameList:any=[]; 
    EntryNo:string=""; 
    VoucherNo:string=""; 
    VoucherDate:string=""; 
    Narration:string=""; 
    TotDebit:string=""; 
    TotCredit:string=""; 
    constructor(
         public _dataService: DataService,
         private _toasterService:ToastCommonService, 	
         private _route: ActivatedRoute,public _loginService: LoginService,
         private loaderService: LoaderService) {}
  
    ngOnInit() {
       this._route.params.subscribe(params => {
       this.EntryNo=params["entryno"];
        });
        this.PageLoad();
            } 
            
            PageLoad()
            {
            const jsonparam= {  CMPCODE:this._loginService.getLogin()[0].CMPCODE,
                CITYCODE:this._loginService.getLogin()[0].CITYCODE,
                ENTRYNO:this.EntryNo,
                VGUID:this._loginService.getLogin()[0].VGUID,
                STATUS:"JVREQ" }
            this._dataService.getData("Accounts/ACC_JV_View",jsonparam)
            .subscribe((data: any) => {
                this.VoucherNo=data.Table[0].JVCODE;
                this.VoucherDate=data.Table[0].JV_DATE;
                this.Narration=data.Table[0].NARRATION;
                this.AccountNameList=data.Table1;
                this.TotDebit=data.Table2[0].TOTDEBIT;
                this.TotCredit=data.Table2[0].TOTCREDIT;
            });
            }
            
        }         