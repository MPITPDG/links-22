import { Component, OnInit } from '@angular/core';
import { IMyDpOptions } from 'mydatepicker';
import { DataService } from '../../../shared/service/dataService';
import { LoginService } from '../../../shared/service/loginService';
import { ToastCommonService } from '../../../shared/service/toastService';
import { LoaderService } from '../../../shared/service/loader.service';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from  '../../../../environments/environment'; 
@Component({
    selector: 'app-ChequeErrorPrint-ChequeError-search',
    templateUrl: './ChequeError-NotGenerateBPNo.component.html',
    styles: []
  })
  export class ChequeErrorPrintComponent implements OnInit {
    ChequeNo:string;
    public myDatePickerOptions: IMyDpOptions = {
      dateFormat: 'dd-mmm-yyyy',
      inline: false,
      height: '20px',
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
  
    constructor(private _dataService: DataService,
      private _toasterService: ToastCommonService,
      private loaderService: LoaderService,
      private http: HttpClient,
      private _activatedRoute: ActivatedRoute,private _router:Router,
      private _loginService: LoginService,
    ) { }
    ngOnInit() {
      this.verifyPermission('92','view')
    }


    
 verifyPermission(formId, userMode) {
  this.loaderService.display(true);
  this._loginService.verifyRights(formId, '')
      .subscribe((data: any) => {          
         this._loginService.checkVerify(userMode, data);
         this.loaderService.display(false);

      });
}

    PrintData()
    {

  
        if(this.ChequeNo=="" || this.ChequeNo ==undefined){
          this._toasterService.toast('warning', 'warning','Please enter the Cheque No.');  
          return false;
        }
        this.loaderService.display(true);
        const _jsonData = {  
            ChequeNo:this.ChequeNo,
            cmpid:this._loginService.getLogin()[0].CMPID,
            MakerIP:this._loginService.getLogin()[0].MAKERIP 
        };
        this._dataService.getData("Accounts/Acc__ChequePrintError_Report", _jsonData)
        .subscribe((data: any) => {
            if (data.Table[0].STATUS == "-2") {
               this._toasterService.toast('error', 'error',`Cheque Cannot Be Cancel. Please Contact System Administrator`);  
                this.loaderService.display(false);
            }
            else if(data.Table[0].STATUS == "-3") {
                this._toasterService.toast('error', 'error',`Record Already Exists. -- Please Check`);  
                 this.loaderService.display(false);
             }
             else if(data.Table[0].STATUS == "0") {
             this._toasterService.toast('error', 'error',`Cheque No Doesnot Exist. Please Contact System Administrator`);  
              this.loaderService.display(false);
             }

            else {
               // window.open(URL, "_blank");
               let theTop = (screen.height / 2) - (483 / 2);
               let theLeft = (screen.width / 2) - (780 / 2);
               let toolbar = 'resizable=no,scrollbars=no,width=800,height=450,status=no,left=' + theLeft + ',top=' + theTop;
               let URL = "http://www.180.179.207.163/erp/UI/Accounts/UI/Accounts/frm_Acc_CompCheq_RePrintCheque_AssignReqNo_NotGenerate_BPNo_Print.aspx?" +
               "entryno=" + data.Table[0].STATUS
               + "&cmpid=" + this._loginService.getLogin()[0].CMPID
               + "&MakerIP=" + this._loginService.getLogin()[0].MAKERIP
               
                    window.open(URL, "", toolbar);
                    this.loaderService.display(false);
            }
        });
    }
}