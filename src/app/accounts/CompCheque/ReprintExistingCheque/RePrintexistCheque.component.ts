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
    selector: 'app-RePrint-ExistingCheque-search',
    templateUrl: './RePrintexistCheque.component.html',
    styles: []
  })
  export class RePrintexistChequeComponent implements OnInit {
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
      this.verifyPermission('92','View')
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

        this.loaderService.display(true);
      
               // window.open(URL, "_blank");
               let theTop = (screen.height / 2) - (483 / 2);
               let theLeft = (screen.width / 2) - (780 / 2);
               let toolbar = 'resizable=no,scrollbars=no,width=800,height=450,status=no,left=' + theLeft + ',top=' + theTop;
             /// let URL = "http://localhost:1086/manilal_v4_20200303_0859/UI/Accounts/frm_Acc_CompCheq_PrintCheque_RePrint_Existing.aspx?" +
             let URL = "http://www.180.179.207.163/erp/UI/Accounts/frm_Acc_CompCheq_PrintCheque_RePrint_Existing.aspx?" +
               "ChequeNo=" + this.ChequeNo
               window.open(URL, "", toolbar);
               this.loaderService.display(false);
           
    }
}