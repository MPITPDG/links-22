import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { DataService } from '../shared/service/dataService';
import { AuthService } from '../shared/service/authService';
import { Router } from '@angular/router';
import { LoginService } from '../shared/service/loginService';
import { ToastCommonService } from '../shared/service/toastService';
@Component({
    templateUrl: 'login.component.html',
    // Inline nav/main/footer styles replaced by MP's split sign-in sheet.
    styleUrls: ['login.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class LoginComponent implements OnInit {
    public username: string = '';
    public password: string = '';
    companyName: string = "";
    disabledbutton: boolean = false;

    /** Inline banner above the form. The toasts still fire; this keeps the reason next to the fields. */
    errorText: string = '';
    showPassword: boolean = false;
    readonly year = new Date().getFullYear();
    constructor(
        private _router: Router,
        private _dataService: DataService,
        private _auth: AuthService,
        private _toasterService: ToastCommonService,
        private _loginService: LoginService) { }

    ngOnInit(): void {
        // if (this._loginService.getBasePath() == "FRT") {
        //     this.companyName = 'Manilal Patel Freight Service Pvt Ltd';
        // } else {
        //     this.companyName = 'Manilal Patel Group';
        // }
        this.companyName = 'LINKS GROUP';
    }
    btnLogin() {
        this.errorText = '';
        if (this.username == '' && this.password == '') {
            this.errorText = 'Username and password are required.';
            this._toasterService.toast('error', 'Alert', 'Username and Password Required.');
        } else if (this.username == '') { this.errorText = 'Username is required.'; this._toasterService.toast('error', 'Alert', 'Username Required.'); }
        else if (this.password == '') { this.errorText = 'Password is required.'; this._toasterService.toast('error', 'Alert', 'Password Required.'); }
        else {
            this.disabledbutton = true;
            this._auth
                .login<any[]>(this.username, this.password)
                .subscribe((data: any) => {
                    this.disabledbutton = false
                    if (data.Table[0].STATUS == "100") {
                        let loginData = data.Table;
                            loginData[0]["CMPCODE"] = '30';
                            loginData[0]["CMPNAME"] = 'LINKS GROUP';
                            loginData[0]["CMPTYPE"] = null;
                        // if (this._loginService.getBasePath() == "FRT") {
                        //     loginData[0]["CMPCODE"] = '02';
                        //     loginData[0]["CMPNAME"] = 'MANILAL PATEL FREIGHT SERVICES PVT. LTD.';
                        //     loginData[0]["CMPTYPE"] = 'FRT';
                        // }
                        // else {
                        //     loginData[0]["CMPCODE"] = '01';
                        //     loginData[0]["CMPNAME"] = 'MANILAL PATEL GROUP';
                        //     loginData[0]["CMPTYPE"] = null;
                        // }
                        loginData[0]["FINANCIAL_YEAR"] = null;
                        this._loginService.setLogin(loginData);
                        this._toasterService.toast('success', 'Login Successfully', '');
                      // this._router.navigate(['/branch']);
                        if (loginData[0].IS_PASS_EXPIRES=="1"){
                            this._router.navigate(['/Profile/ChangePassword']);
                        }else{ this._router.navigate(['/branch']);}
                    } else {
                        this.errorText = data.Table[0].STATUSMSG || 'Invalid username or password.';
                        this._toasterService.toast('error', 'Login Failed', data.Table[0].STATUSMSG);
                    }
                }, () => {
                    // Without this the button stayed on "Verifying..." forever when
                    // the API was unreachable or returned an HTTP error.
                    this.disabledbutton = false;
                    this.errorText = 'Could not reach the server. Please try again.';
                    this._toasterService.toast('error', 'Login Failed', 'Could not reach the server.');
                });
        }
    }
    // btnLogin() {
    //     if (this.username == '' && this.password == '') {
    //         this._toasterService.toast('error', 'Alert', 'Username and Password Required.');
    //     } else if (this.username == '') { this._toasterService.toast('error', 'Alert', 'Username Required.'); }
    //     else if (this.password == '') { this._toasterService.toast('error', 'Alert', 'Password Required.'); }
    //     else {
    //         this.disabledbutton = true;
    //         this._auth
    //             .login<any[]>(this.username, this.password)
    //             .subscribe((data: any) => {
    //                 this.disabledbutton = false
    //                 if (data.Table[0].STATUS == "100") {
    //                     let loginData = data.Table;
    //                     if (this._loginService.getBasePath() == "FRT") {
    //                         loginData[0]["CMPCODE"] = '02';
    //                         loginData[0]["CMPNAME"] = 'MANILAL PATEL FREIGHT SERVICES PVT. LTD.';
    //                         loginData[0]["CMPTYPE"] = 'FRT';
    //                     }
    //                     else {
    //                         loginData[0]["CMPCODE"] = '01';
    //                         loginData[0]["CMPNAME"] = 'MANILAL PATEL GROUP';
    //                         loginData[0]["CMPTYPE"] = null;
    //                     }
    //                     this._loginService.setLogin(loginData);
    //                     this._toasterService.toast('success', 'Login Successfully', '');
    //                     // if (loginData[0].IS_PASS_EXPIRES=="1"){
    //                     //     this._router.navigate(['/ChangePassword']);
    //                     // }else{ this._router.navigate(['/branch']);}
    //                     this._router.navigate(['/branch']);
    //                 } else {
    //                     this._toasterService.toast('error', 'Login Failed', data.Table[0].STATUSMSG);
    //                 }
    //             });
    //     }
    // }
}
