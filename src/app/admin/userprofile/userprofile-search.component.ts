import { Component, OnInit,OnDestroy } from '@angular/core';
 
import { Router, ActivatedRoute } from '@angular/router';
 
 
import{DataService} from '../../shared/service/dataService';
import{AuthService} from '../../shared/service/authService';
import { LoginService } from '../../shared/service/loginService';
import { ToastCommonService } from '../../shared/service/toastService';
import { LoaderService } from '../../shared/service/loader.service'; 
 

 
@Component({
    selector: 'app-userprofilesearch',
    templateUrl: 'userprofile-search.component.html'

})


export class userprofilesearch implements OnInit  {
    config: any; 
    Reqlist:any=[];
      
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

    ngOnInit()
    {
        this.loaderService.display(true);
        this._dataService.getAll("Admin/Fill_UserPopulate")
        .subscribe((data: any) => {
             this.Reqlist=data.Table;
             this.loaderService.display(false);
        });
        this.config = {
            itemsPerPage: 25,
            currentPage: 1,
            totalItems: this.Reqlist.count
          };  
    }
 
    pageChanged(event){
        this.config.currentPage = event;
      }

      ListOnclick(CODE)
      {
        this._router.navigate(['/admin/admin/userprofile/'+CODE]);
      }
}
 

  
    