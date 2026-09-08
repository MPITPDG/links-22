import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { LoginService } from '../shared/service/loginService';
@Component({
    selector: 'app-dashboard',
    templateUrl: './full-layout.component.html'
})
export class FullLayoutComponent implements OnInit {

    public disabled = false;
    public status: { isopen: boolean } = { isopen: false };
    public cmpname: string = '';
    public username: string = '';
    public displayName: string = '';
    public cityName: string = '';
    public imageSrc: string = '';
    public userimgepath : string ='';
    public toggled(open: boolean): void {
         
    }

    public toggleDropdown($event: MouseEvent): void {
        $event.preventDefault();
        $event.stopPropagation();
        this.status.isopen = !this.status.isopen;
    }

    constructor(
        private _router: Router,
        private _loginService: LoginService) {
    }

    ngOnInit() {
        if (this._loginService.getLogin() === null) {
            this._router.navigate(['']);
            return false;
        }
        // if (this._loginService.getLogin()[0].CMPTYPE == 'FRT') {
        //     this.imageSrc = 'assets/img/freight_services.png';
        // } else {
        //     this.imageSrc = 'assets/img/title.png';
        // }

        // let curUrl = this._router.url;
        // if (curUrl.match('export') != null && this._loginService.getLogin()[0].MODULEID != 3 && this._loginService.getLogin()[0].TMPTYPE != null) {
        //     this._router.navigate(['/module']);
        // } else if (curUrl.match('accounts') != null && this._loginService.getLogin()[0].MODULEID != 1 && this._loginService.getLogin()[0].TMPTYPE != null) {
        //     this._router.navigate(['/module']);
        // } else if (curUrl.match('accounts-fra') != null && this._loginService.getLogin()[0].MODULEID !== 1 && this._loginService.getLogin()[0].TMPTYPE == null) {
        //     this._router.navigate(['/module']);
        // }
        this.cmpname = this._loginService.getLogin()[0].CMPNAME;
        this.username = this._loginService.getLogin()[0].CMP_USERNAME;
        this.displayName = this._loginService.getLogin()[0].GREETING + ' ' + this._loginService.getLogin()[0].FULLNAME;
        this.cityName = this._loginService.getLogin()[0].CITYNAME;
        if (this._loginService.getLogin()[0].IMAGE != '') { this.userimgepath = this._loginService.getLogin()[0].IMAGE; }
    }

    goto(goType) {
        if (goType == 'CITY') { this._router.navigate(['/branch']); }
        else if (goType == 'HOME') { this._router.navigate(['/module']); }
    }

    logout() {
        this._loginService.removeLogin();
    }
}
