import { Component, OnInit } from '@angular/core';
import { DataService } from '../shared/service/dataService';
import { AuthService } from '../shared/service/authService';
import { Router } from '@angular/router';
import { LoginService } from '../shared/service/loginService';
import { ToastCommonService } from '../shared/service/toastService';

@Component({
    selector: 'app-branch',
    templateUrl: 'branch.component.html',
    styles: [
        `
        :host >>> .popover {
          background-color: #009688;
            border-radius: 10px;
            padding:5px;
        }
  `
    ]
})
export class BranchComponent implements OnInit {
    countries: any = [];
    cities: any;
    countrieslist: any;
    private baseUrl: string = 'Branch/GetBranch';
    html: string;

    constructor(
        private _router: Router,
        private _dataService: DataService,
        private _auth: AuthService,
        private _toasterService: ToastCommonService,
        private _loginService: LoginService) {
    }

    ngOnInit(): void {
        let type = (this._loginService.getLogin()[0].CMPTYPE) ? this._loginService.getLogin()[0].CMPTYPE : "";
        const jsonBranch = { cmpid: this._loginService.getLogin()[0].CMPID, comptype: type };
        this._dataService.Common(this.baseUrl, jsonBranch)
            .subscribe((data: any) => {
                if (data.Table.length == 1) {
                    this.countries = data.Table;
                    this.setCity(data.Table[0].CITYCODE);
                } else {
                    this.countries = data.Table;
                }
            },
                (error) => {
                    this._toasterService.toast('error', 'Error', error.status + '<br/>' + error.statusText);
                },
                () => {
                });
    }

    setCity(citycode) {
        this.cities = this.countries.filter((countrylist: any) => countrylist.CITYCODE === citycode);
        this._loginService.setCityModify(this.cities);
        //this._router.navigate(['/module']);
        if (this._loginService.getLogin()[0].CMPTYPE == null) {
            this._router.navigate(['/company']);
        } else {
            this._router.navigate(['/module']);
        }
    }
}
