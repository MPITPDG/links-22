import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Static } from '../../app.common';
import { LoginService } from '../service/loginService';
import { Router, ActivatedRoute } from '@angular/router';
@Component({
    selector: 'app-menu-sidebar',
    templateUrl: 'menu.component.html',
    providers: [LoginService],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class MenuComponent implements OnInit {
    public menuList: any = [];
    public menuModuleName: string = '';
    constructor(private _loginService: LoginService, private _activatedRoute: ActivatedRoute, private _router: Router) { }

    ngOnInit(): void {
        if (this._loginService.getLogin() !== null) {
            let baseUrlName = null, menuLength = [];
            menuLength = Static.menuList.menu.filter((filter: any) => filter.moduleid == this._loginService.getLogin()[0].MODULEID);//[0].baseUrl;
            const routePath = this._activatedRoute.snapshot.routeConfig.path;
            baseUrlName = (menuLength.length > 1) ?
                (Static.menuList.menu.find((filter: any) => filter.baseUrl == routePath) || {}).baseUrl
                : menuLength[0].baseUrl;
            if (baseUrlName == routePath) {
                this.bindMenu();
            } else if (routePath == 'error') {
                this.bindMenu();
            } else if (baseUrlName === undefined) {
                // Route outside the module menus (e.g. 'dashboard'): nothing to bind, stay on the page.
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
