import { Component, OnInit } from '@angular/core';
import { Static } from '../../app.common';
import { LoginService } from '../service/loginService';
import { Router, ActivatedRoute } from '@angular/router';
@Component({
    selector: 'app-menu-sidebar',
    templateUrl: 'menu.component.html',
    providers: [LoginService]
})
export class MenuComponent implements OnInit {
    public menuList: any = [];
    public menuModuleName: string = '';
    constructor(private _loginService: LoginService, private _activatedRoute: ActivatedRoute, private _router: Router) { }

    ngOnInit(): void {
        if (this._loginService.getLogin() !== null) {
            let baseUrlName = null, menuLength = [];
            menuLength = Static.menuList.menu.filter((filter: any) => filter.moduleid == this._loginService.getLogin()[0].MODULEID);//[0].baseUrl;
            baseUrlName = (menuLength.length > 1) ?
                Static.menuList.menu.filter((filter: any) => filter.baseUrl == this._activatedRoute.snapshot.routeConfig.path)[0].baseUrl
                : menuLength[0].baseUrl;
            if (baseUrlName == this._activatedRoute.snapshot.routeConfig.path) {
                this.bindMenu();
            } else if (this._activatedRoute.snapshot.routeConfig.path == 'error') {
                this.bindMenu();
            }
            else {
                this._router.navigate(['./module']);
            }
            baseUrlName = null;
        }
    }

    bindMenu() {
        if (this._loginService.getLogin()[0].MODULEID == '1') {
            if (this._loginService.getLogin()[0].CITYCODE === 'LIL' || this._loginService.getLogin()[0].CITYCODE === 'PAR') {
                this.menuModuleName = Static.menuList.menu.filter((filter: any) => filter.moduleid == this._loginService.getLogin()[0].MODULEID && filter.type === 'FRANCE')[0].modulename;
                this.menuList = Static.menuList.menu.filter((filter: any) => filter.moduleid == this._loginService.getLogin()[0].MODULEID && filter.type === 'FRANCE')[0].data;
            } else {
                this.menuModuleName = Static.menuList.menu.filter((filter: any) => filter.moduleid == this._loginService.getLogin()[0].MODULEID && filter.type == null)[0].modulename;
                this.menuList = Static.menuList.menu.filter((filter: any) => filter.moduleid == this._loginService.getLogin()[0].MODULEID && filter.type == null)[0].data;
            }
        } else {
            this.menuModuleName = Static.menuList.menu.filter((filter: any) => filter.moduleid == this._loginService.getLogin()[0].MODULEID && filter.type == null)[0].modulename;
            this.menuList = Static.menuList.menu.filter((filter: any) => filter.moduleid == this._loginService.getLogin()[0].MODULEID && filter.type == null)[0].data;
        }
    }
}
