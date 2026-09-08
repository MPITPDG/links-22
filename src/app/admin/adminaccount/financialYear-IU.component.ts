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
    selector: 'app-Financialyearcreation',
    templateUrl: 'financialYear-IU.component.html'

})


export class financialYearIU implements OnInit { 


    Citylist:any=[];CompanyList:any=[];city: string="";company:string="";
    CITYCODE:string=""; cmpcode:any;citycode:any;citycode1:any;
    StartDate: any = ""; EndDate: any = "";
    ID:string="";pk_yearId :string="";
    Header: string="Financial Year"
    text: string="Submit"


        
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
        constructor( private _dataService: DataService, 
            private _toasterService:ToastCommonService, 
            private loaderService: LoaderService, 
            private _router: Router,
            private http: HttpClient, 
            private _activatedRoute: ActivatedRoute,
            private _loginService:LoginService,  
            private _configuration: Configuration) { }
       
ngOnInit()
{ 
     
 this._loginService.verifyRights('436', '')
            .subscribe((data: any) => {
                this._loginService.checkVerify('Add', data);
            });
    this._activatedRoute.params.subscribe(params => {
        this.ID = params["YearId"];                 
        
    })

    if (this.ID  =' ')
        {
            this._loginService.verifyRights(18, '')
            .subscribe((data: any) => { this._loginService.checkVerify('Add', data); });
            this.Header= 'FINANCIAL YEAR - ADD';
        }
   const jsonID = {  userid:this._loginService.getLogin()[0].CMPID }
    this._dataService.getData("Admin/FillCity",jsonID)
    .subscribe((data: any) => {
     this.Citylist=data.Table;
    });

   /* if(this.ID !=' ')
    {
        const jsoncompanyEdit= {citycode:"",cmpcode:""}
        this._dataService.getData("Admin/FillCompanyAllEDIT",jsoncompanyEdit)
        .subscribe((data: any) => {
       this.CompanyList=data.Table;
      
     });
        this.editpopulate()
        this.text='Update';
       
    }*/
   
    }


   editpopulate()
            {
      //  this.loaderService.display(true);
      
     
   
        const jsonedit= { yearid  : this.ID}
        this._dataService.getData("Admin/Fill_Admin_FinancialYearDetails", jsonedit)
         .subscribe((data: any) => {
            this.pk_yearId=    data.Table[0].PK_YEARID;
            this.city  =    data.Table[0].citycode ; 
            //this.company=    data.Table[0].cmp_code    ; 
            this.StartDate = (data.Table[0].StartDate != "") ? this._dataService.stringdttoArry(data.Table[0].StartDate) : "";
            this.EndDate = (data.Table[0].EndDate != "") ? this._dataService.stringdttoArry(data.Table[0].EndDate) : "";
            this.citycode1= data.Table[0].CITYCODE1;
            this.company= data.Table[0].cmp_code ; 
            }); 
          
    
}
    selectionChange(citycode) {
        ///console.log(citycode);
        const jsoncompany= {citycode,cmpcode:""}
        this._dataService.getData("Admin/FillCompanyAll",jsoncompany)
        .subscribe((data: any) => {
          this.CompanyList=data.Table;
        });
    }    
   



    AddMain()
    { 
        if(this.city==""){
            this._toasterService.toast('warning', 'warning', 'Please select City  !');            
            return false;
         }   
         if(this.company==""){
            this._toasterService.toast('warning', 'warning', 'Please select Company  !');            
            return false;
         }
        if (this.StartDate == "" || this.StartDate == undefined || this.StartDate == null) { 
            
                this._toasterService.toast('warning', 'warning', 'Start Date should not be blank !');            
                return false;
            
        }
        if (this.EndDate == "" || this.EndDate == undefined || this.EndDate == null) { 
            
            this._toasterService.toast('warning', 'warning', 'End Date should not be blank !');            
            return false;
        
    }
       
            if (this._dataService.date2Comparison(this.StartDate.formatted, this.EndDate.formatted) == false) {
                this._toasterService.toast('error', 'Error', "EndDate should be greater than StartDate");
                return false;
            }
        
        this.loaderService.display(true);
        const jsonmaster = { 
            Citycode:this.city,
            CmpCode:this.company,
            StartDate:this.StartDate.formatted , 
            EndDate:this.EndDate.formatted  
        } 

        this._dataService.Common("Admin/Acc_AddFinanceYear", jsonmaster)
      
        .subscribe((data: any) => {
      if (data.Table[0].status == "0") {
        { this._toasterService.toast('success', 'success', 'Financial Year saved successfully !');   }
           this.loaderService.display(false);
           this.RestMain();
           
       }
       else
       { this._toasterService.toast('warning', 'warning', 'Financial Year already exists !');   }
       this.loaderService.display(false);
       this.RestMain();
       
   
     
    });  

} 
RestMain()
{
    this.city="";
    this.company="";
    this.StartDate="";
    this.EndDate="";
}


}