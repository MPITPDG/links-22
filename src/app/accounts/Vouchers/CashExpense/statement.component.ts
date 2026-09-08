import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IMyDpOptions } from 'mydatepicker';
import { DataService } from 'src/app/shared/service/dataService';
import { LoaderService } from 'src/app/shared/service/loader.service';
import { LoginService } from 'src/app/shared/service/loginService';
import { ToastCommonService } from 'src/app/shared/service/toastService';

@Component({
  selector: 'app-statement',
  templateUrl: './statement.component.html',
  styles: []
})
export class StatementComponent implements OnInit {
Header:string="Cash expenses"
Employee: any;
Display="1"
  user_startdate: any;
  user_enddate: any;
  Employyetable: any;
  constructor(
    private _dataService: DataService, 
     _activatedRoute: ActivatedRoute, 
     private _toasterService: ToastCommonService,
    private _loginService: LoginService,
     private loaderService: LoaderService) { }

  public myDatePickerOptions: IMyDpOptions = {
    dateFormat: 'dd-mmm-yyyy',
    inline: false,
    height: '18px',
    width: '180px',
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
    disableUntil: { year: 0, month: 0, day: 0 },
    disableSince: { year: 0, month: 0, day: 0 }
  };

  ngOnInit() {
    this.verifyPermission('29','View')
  
   const jsonmaster={
       CMPCODE: this._loginService.getLogin()[0].CMPCODE,
       CITYCODE: this._loginService.getLogin()[0].CITYCODE
   }
    this._dataService.getData("Accounts/FillCE_Employees",jsonmaster).subscribe((data:any)=>{
      // console.log(data)
       this.Employyetable=data.Table
    })
  }
  verifyPermission(formId, userMode) {
    this.loaderService.display(true);
    this._loginService.verifyRights(formId, '')
        .subscribe((data: any) => {          
           this._loginService.checkVerify(userMode, data);
           this.loaderService.display(false);

        });
}
  search(){
    if(this.user_startdate=="" ||this.user_startdate==undefined){
       alert("Please select start date.")
       return false
    }
    if(this.user_enddate=="" ||this.user_enddate==undefined){
      alert("Please select End date.")
      return false
   }
   if(this.Employee=="" ||this.Employee==undefined){
    alert("Please select Employee Name.")
    return false
 }

if(this.user_startdate!="" || this.user_enddate!=""){
 if (!this._dataService.DateFromAndToComparision(this.user_startdate.formatted,this.user_enddate.formatted)) {
    alert("To Date should be greater than From Date");
    return false;
}
}
    const jsonmaster={
      Fin_StartDate:this._loginService.getLogin()[0].FINANCIAL_YEAR.STARTDATE , 
      Fin_EndDate:this._loginService.getLogin()[0].FINANCIAL_YEAR.ENDDATE , 
       usr_StartDate:this.user_startdate.formatted, 
        usr_EndDate:this.user_enddate.formatted, 
        CMPCODE: this._loginService.getLogin()[0].CMPCODE,
        CITYCODE: this._loginService.getLogin()[0].CITYCODE1,
         ACCTCODE :this.Employee
  }
  console.log(jsonmaster);
   this._dataService.getData("Accounts/CE_STAEMENT",jsonmaster).subscribe((data)=>{
      console.log(data)
   })
  }
  ResetAll(){

  }
}
