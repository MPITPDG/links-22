import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { LoginService } from '../shared/service/loginService';
@Component({
    selector: 'app-header-footer',
    templateUrl: './header-footer-layout.component.html'
})
export class HeaderFooterLayoutComponent implements OnInit {

    public disabled = false;
    public status: { isopen: boolean } = { isopen: false };
    public cmpname: string = '';
    public username: string = '';
    public displayName: string = '';
    public cityName: string = '';
    public imageSrc: string = '';
    public userimgepath: string = "person-icon.png";
    public toggled(open: boolean): void {
        //console.log('Dropdown is now: ', open);
    }

    public toggleDropdown($event: MouseEvent): void {
        $event.preventDefault();
        $event.stopPropagation();
        this.status.isopen = !this.status.isopen;
    }

    constructor(
        private _router: Router,
        private _loginService: LoginService) { }

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
