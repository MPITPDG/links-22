import { Component, OnInit ,ViewChild} from '@angular/core';
import{DataService} from '../../shared/service/dataService';
import { ToastCommonService } from '../../shared/service/toastService';
import { IMyDpOptions } from 'mydatepicker';
import { LoaderService } from '../../shared/service/loader.service'; 
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { LoginService } from '../../shared/service/loginService';
import { Configuration } from '../../app.constants';
 import{AuthService} from '../../shared/service/authService';



 
@Component({
    selector: 'app-FinancialYearsearch',
    templateUrl: 'financialYear-search.component.html'

})

export class financialYearsearch implements OnInit   {
    
    config: any; 
    branchlist:any=[];
    StartDate: any = ""; EndDate: any = "";
   /// Header: string="Financial Year Search"
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
    constructor(
        private _activatedRoute: ActivatedRoute,
        private _router: Router,
        private _dataService: DataService,
        private _auth: AuthService,
        private _toasterService: ToastCommonService,
        private _loginService: LoginService,
        private loaderService: LoaderService,   
        
        //private http1: Http   

    )  {     }

    
    ngOnInit()
     {
    }
     
    searchlist() {

        this._loginService.verifyRights(176, '')
        .subscribe((data: any) => { 
            this._loginService.checkVerify('View', data); 
            
        });
        if (this.StartDate == "" || this.StartDate == undefined || this.StartDate == null) { 
            
            this._toasterService.toast('warning', 'warning', 'Start Date should not be blank !');            
            return false;
        
    }
    if (this.EndDate == "" || this.EndDate == undefined || this.EndDate == null) { 
        
        this._toasterService.toast('warning', 'warning', 'End Date should not be blank !');            
        return false;
    }
        this.loaderService.display(true);
       
         const jsonfyear= {StartDate:this.StartDate.formatted,EndDate:this.EndDate.formatted}
         //this._dataService.getData("Common/ADMIN_FINANCIALYEAR_Search",jsonfyear)
         this._dataService.getData("Admin/ADMIN_FINANCIALYEAR_Search",jsonfyear)
        
         .subscribe((data: any) => {
         //if (data.Table[0].STATUS === "100") {
           this.branchlist = data.Table;      
           this.loaderService.display(false);             
     
   });
             
       }
       
       ListOnclick (YearId)
      {
       
        this._router.navigate(['/admin/financialyear/Financialyear/'+YearId]);
      }
}