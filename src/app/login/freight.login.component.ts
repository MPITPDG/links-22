//  import { Component, OnInit } from '@angular/core';
// import { DataService } from '../shared/service/dataService';
// import { AuthService } from '../shared/service/authService';
// import {Router} from '@angular/router';
// import { LoginService } from '../shared/service/loginService';
// import { ToastCommonService } from '../shared/service/toastService';
// @Component({
//     templateUrl: 'freight.login.component.html',
//     styles: [`
//     nav {
//         background-color: #26a6d4;
//         height: 60px;
//       }
//       main {
//         height: 100px;
//         margin: calc(30vh - 50px - 20px) calc(50vw - 150px);
//         text-align: center;
//         width: 300px;
//       }
//       footer {
//         background-color: #26a6d4;
//         bottom: 0;
//         height: 20px;
//         position: absolute;
//         width: 100%;
//         font-weight: bold;
//         font-size: 8pt;
//         color: #ffffff;
//         font-family: Verdana, Arial;
//       }
//     `]
// })
// export class FreightLoginComponent implements OnInit {
//     public username: string = '';
//     public password: string = '';
//     disabledbutton: boolean = false;
//     constructor(
//         private _router: Router,
//         private _dataService: DataService,
//         private _auth: AuthService,
//         private _toasterService: ToastCommonService,
//         private _loginService: LoginService) { }
//     ngOnInit(): void {}
//     btnLogin() {
//         if (this.username == '' && this.password == '') {
//             this._toasterService.toast('error', 'Alert', 'Username and Password Required.');
//         } else if (this.username == '') { this._toasterService.toast('error', 'Alert', 'Username Required.'); }
//         else if (this.password == '') { this._toasterService.toast('error', 'Alert', 'Password Required.'); }
//         else {
//             this.disabledbutton = true;
//             this._auth
//                 .login<any[]>(this.username, this.password)
//                 .subscribe((data: any) => {
//                     this.disabledbutton = false;
//                     if (data.Table[0].STATUS == "100") {
//                         let loginData = data.Table;
//                         loginData[0]["CMPCODE"] = '02';
//                         loginData[0]["CMPNAME"] = 'MANILAL PATEL FREIGHT SERVICES PVT. LTD.';
//                         loginData[0]["CMPTYPE"] = 'FRT';
//                         this._loginService.setLogin(loginData);
//                         this._toasterService.toast('success', 'Login Successfully', '');
//                         this._router.navigate(['/branch']);
//                     } else {
//                         this._toasterService.toast('error', 'Login Failed', data.Table[0].STATUSMSG);
//                     }
//                 });
//         }
//     }
// }
