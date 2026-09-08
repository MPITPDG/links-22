import { Component, OnInit } from '@angular/core';
import { IMyDpOptions } from 'mydatepicker';
import { DataService } from '../../../shared/service/dataService';
import { AuthService } from '../../../shared/service/authService';
import { ToasterService } from 'angular2-toaster';
import { LoginService } from '../../../shared/service/loginService';
import { ToastCommonService } from '../../../shared/service/toastService';
import { LoaderService } from '../../../shared/service/loader.service';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
    selector: 'app-RePrintCheque-Cancel-ChequeNo',
    templateUrl: './ReprintCheque-Cancel-ChequeNo.component.html',
    styles: []
  })
  export class ReprintChequeCancelChequeNoComponent implements OnInit {
    BPNo:string;
    Remark:string;
    EntryNo:string;
    ChequeNo:string;
    HdnCancel:string;
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
    GetReqNo()
    {
      if ((this.BPNo == '' || this.BPNo == undefined ))
			{
				alert("Please Enter Bank Payment No");
				return false;
      }
      if ((this.BPNo.length < 15) || (this.BPNo.substring(11, 12) != "2"))
			{
				alert("Please Enter valid Bank Payment No");
				return false;
			}
      this.loaderService.display(true)
      var jsonmaster = {
        ENTRYNO: this.BPNo
         }
     // console.log(jsonmaster)
      this._dataService.getData("Accounts/Acc_BP_CMP_ReqNo_Get", jsonmaster)
        .subscribe((data: any) => {
          this.EntryNo=data.Table[0].ENTRYNO;
          this.ChequeNo=data.Table[0].CHEQUENO;
          this.loaderService.display(false)
          
      
        })
    }
 
    
    UpdateChequeNo()
      {

        if (this.BPNo == '' || this.BPNo == undefined)
         {
          alert("Please Enter Bank Payment No");
            return false;
        }
      if ((this.BPNo.length < 15) || (this.BPNo.substring(11, 12) != "2"))
      {
       alert("Please Enter valid Bank Payment No");
        return false;
   }
      if(this.Remark == '' || this.Remark == undefined) 
      {
          alert("Please Enter Valid reason for Cancel");
            return false;
      }
      if (confirm("Are you sure you want to cancel cheque no. " + this.ChequeNo + ". ?")) 
      {
          this.HdnCancel = "1";
          this.loaderService.display(true)
          var jsonmaster = {
           
            USERID:this._loginService.getLogin()[0].CMPID,
            CMPCODE:this._loginService.getLogin()[0].CMPCODE,
            citycode:this._loginService.getLogin()[0].CITYCODE,
            ENTRYNO: this.BPNo,
            Remark: this.Remark,
            MakerIP: this._loginService.getLogin()[0].MAKERIP,
          }
         // console.log(jsonmaster)
          this._dataService.getData("Accounts/Acc_BP_CMP_ChequeNo_Cancel", jsonmaster)
            .subscribe((data: any) => {
              if (data.Table[0].STATUS == "100") {
                this._toasterService.toast("success", "success", data.Table[0].STATUSTEXT)
               
              } else {
                this._toasterService.toast("error", "error", data.Table[0].STATUSTEXT)
              }
              this.BPNo=""
              this.Remark=""
              this.loaderService.display(false)
              
          
            })
      }
      else 
      {
        this.HdnCancel = "0";
        return false;
      }
      
      }
   
}