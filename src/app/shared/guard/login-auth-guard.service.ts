import { Injectable } from '@angular/core';
import { CanActivate, Router, RouterStateSnapshot, ActivatedRouteSnapshot } from '@angular/router';
import { LoginService } from '../service/loginService';
import { Observable } from 'rxjs/Observable';
import { ToastCommonService } from '../service/toastService';
@Injectable()
export class LoginAuthGuard implements CanActivate {
    constructor(private _loginService: LoginService,
        private _myRoute: Router,
        private _toasterService: ToastCommonService) { }
    canActivate(
        next: ActivatedRouteSnapshot,
        state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
        let checkLogin = this._loginService.getLogin();
        if (checkLogin) {
            return true;
        }
        this._myRoute.navigate(['']);
        return false;
    }
}