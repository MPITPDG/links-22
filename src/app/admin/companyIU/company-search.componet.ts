import { Component, OnInit ,ViewChild} from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import{DataService} from '../../shared/service/dataService';
import{AuthService} from '../../shared/service/authService';
import { LoginService } from '../../shared/service/loginService';
import { ToastCommonService } from '../../shared/service/toastService';
import { LoaderService } from '../../shared/service/loader.service'; 
 
 

 
@Component({
    selector: 'app-Companysearch',
    templateUrl: 'company-search.componet.html'

})


export class companySearch implements OnInit   {
    
    config: any; 
    Reqlist:any=[];
    CMPNAME1: any;
    private baseUrl: string  = "";
    constructor(
        private _activatedRoute: ActivatedRoute,
        private _router: Router,
        private _dataService: DataService,
        private _auth: AuthService,
        private _toasterService: ToastCommonService,
        private _loginService: LoginService,
        private loaderService: LoaderService,   
        
        //private http1: Http   

    ) {     }

    
    ngOnInit() {
     // this._loginService.verifyRights(400, '')
      //.subscribe((data: any) => { this._loginService.checkVerify('View', data); });
      this.loaderService.display(true);
             this._loginService.verifyRights('1', '')
            .subscribe((data: any) => {
                this._loginService.checkVerify('Add', data);
            });
       this._dataService.getAll("Admin/Company_MST_Search")
          .subscribe((data: any) => {
          this.Reqlist = data.Table;      
         this.loaderService.display(false);             
        });
    }

   

    /*serchList() {
      
     /// this.baseUrl = 'Company/Company_MST_Search';
     this.loaderService.display(true);
     console.log(this.CMPNAME1);
      const jsoncompany = {cmpname:this.CMPNAME1}
      this._dataService.getData("Admin/Company_MST_Search",jsoncompany)
      ////this._dataService.Common(this.baseUrl,jsonmaster)
      .subscribe((data: any) => {
      //if (data.Table[0].STATUS === "100") {
        this.Reqlist = data.Table;      
        this.loaderService.display(false);             
  
});*/
      
     
     /* this.config = {
          itemsPerPage: 25,
          currentPage: 1,
          totalItems: this.Reqlist.count
        
        };  */
   /// }

   // pageChanged(event){
   ////   this.config.currentPage = event;
   // }


      ListOnclick(CODE)
      {
       //// this._router.navigate(['/admin/company/companyIU/'+CODE]);
        this._router.navigate(['/admin/company/Company/'+CODE]);
      }
}
 

  
    