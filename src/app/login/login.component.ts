import { Component, OnInit } from '@angular/core';
import { DataService } from '../shared/service/dataService';
import { AuthService } from '../shared/service/authService';
import { Router } from '@angular/router';
import { LoginService } from '../shared/service/loginService';
import { ToastCommonService } from '../shared/service/toastService';
@Component({
    templateUrl: 'login.component.html',
    styles: [`
    nav {
        background-color: #26a6d4;
        height: 60px;
      }
      main {
        height: 100px;
        margin: calc(30vh - 50px - 20px) calc(50vw - 150px);
        text-align: center;
        width: 300px;
      }
      footer {
        background-color: #26a6d4;
        bottom: 0;
        height: 20px;
        position: absolute;
        width: 100%;
        font-weight: bold;
        font-size: 8pt;
        color: #ffffff;
        font-family: Verdana, Arial;
      }
    `]
})
export class LoginComponent implements OnInit {
    public username: string = '';
    public password: string = '';
    companyName: string = "";
    disabledbutton: boolean = false;
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
        if (this.username == '' && this.password == '') {
            this._toasterService.toast('error', 'Alert', 'Username and Password Required.');
        } else if (this.username == '') { this._toasterService.toast('error', 'Alert', 'Username Required.'); }
        else if (this.password == '') { this._toasterService.toast('error', 'Alert', 'Password Required.'); }
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
                        this._toasterService.toast('error', 'Login Failed', data.Table[0].STATUSMSG);
                    }
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
