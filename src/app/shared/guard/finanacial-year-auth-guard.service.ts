import { Injectable } from '@angular/core';
import { CanActivate, Router, RouterStateSnapshot, ActivatedRouteSnapshot } from '@angular/router';
import { LoginService } from '../service/loginService';
import { Observable } from 'rxjs/Observable';
import { ToastCommonService } from '../service/toastService';
@Injectable()
export class FinancialYearAuthGuard implements CanActivate {
    constructor(private _loginService: LoginService,
        private _myRoute: Router,
        private _toasterService: ToastCommonService) { }
    // canActivate(
    //     next: ActivatedRouteSnapshot,
    //     state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
    //     let checkFinancialYear = this._loginService.getLogin()[0]["FINANCIAL_YEAR"];
    //     if (checkFinancialYear) {
    //         return true;
    //     }
    //     this._toasterService.toast('warning', 'Alert', 'Choose Financial Year First.');
    //     this._myRoute.navigate(['accounts']);
    //     return false;
    // }
    canActivate(
        next: ActivatedRouteSnapshot,
        state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
         
        let checkFinancialYear = this._loginService.getLogin()[0]["FINANCIAL_YEAR"];
        console.log("triggered canactivate===>");
    
         if (checkFinancialYear) {
             return true;
         }
      
        this._toasterService.toast('warning', 'Alert', 'Choose Financial Year First.');
        this._myRoute.navigate(['accounts']);
        return false;
    }
    public canDeactivate(): boolean{
        console.log("triggered canDeactivate ===>");
        if (this._loginService.getLogin() == null){
            return true;
        }else{
            this._loginService.setFinancialYearModify(null);
            return true;
        }       
    }
}