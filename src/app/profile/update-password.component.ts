import { Component, OnInit,OnDestroy } from '@angular/core';
import { DataService } from '../shared/service/dataService';
import { AuthService } from '../shared/service/authService';
import { Router, ActivatedRoute } from '@angular/router';
import { LoginService } from '../shared/service/loginService';
import { ToastCommonService } from '../shared/service/toastService';
import { LoaderService } from '../shared/service/loader.service'; 
 
@Component({
    selector: 'app-updatepassword',
    templateUrl: 'update-password.component.html'

})

export class updatePassword implements OnInit {
    crpwd: string="";
    chpwd:string="";
    nwpwd:string="";
    chkchg:string="";
    constructor(
        private _activatedRoute: ActivatedRoute,
        private _router: Router,
        private _dataService: DataService,
        private _auth: AuthService,
        private _toasterService: ToastCommonService,
        private _loginService: LoginService,
        private _loaderService: LoaderService,
         
         
    ) {
    }

    ngOnInit(): void {
    
    }
    onSubmit(){
        if (this.crpwd=="")
        {
            this._toasterService.toast('warning', 'warning', "Current Password cannot blank");
            return false;
        }
        if (this.chpwd=="")
        {
            this._toasterService.toast('warning', 'warning', "New Password cannot blank");
            return false;
        }
        if (this.nwpwd=="")
        {
            this._toasterService.toast('warning', 'warning', "Repeat Password cannot blank");
            return false;
        }
        if (this.chpwd!=this.nwpwd)
        {
            this._toasterService.toast('warning', 'warning', "Password cannot Match");
             return false;
        }
        const jsonchngpwd = {
            oldpwd:this.crpwd ,
            newpwd:this.chpwd,
            userencode: this._loginService.getLogin()[0].CMP_USERENCCODE,          
        };
        this._loaderService.display(true);
        this._dataService.getData('Login/changePassword', jsonchngpwd)
            .subscribe((data: any) => {               
                if (data.Table[0].STATUS === "100") {                   
                    this._toasterService.toast('success', 'success', data.Table[0].STATUS_MSG);                  
                    this._loaderService.display(false);
                    this._router.navigate(['/branch']);
                }
                else {
                this._toasterService.toast('warning', 'warning', data.Table[0].STATUS_MSG);
                this._loaderService.display(false);
                }
                
            });
    }
    onKeydown(searchValue : string) {        
        console.log(searchValue);     
        let ucase = new RegExp("[A-Z]+");
        let lcase = new RegExp("[a-z]+");
        let num = new RegExp("[0-9]+");  

    }
}

